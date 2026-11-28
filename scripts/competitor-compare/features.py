"""Tool-neutral feature extraction from partwise MusicXML for round-trip comparison."""
from collections import Counter
from fractions import Fraction
from lxml import etree


def _t(el, path, default=None):
    x = el.find(path)
    return x.text.strip() if x is not None and x.text else default


def load(path_or_bytes):
    parser = etree.XMLParser(recover=True, resolve_entities=False, no_network=True, huge_tree=True)
    if isinstance(path_or_bytes, (bytes, bytearray)):
        root = etree.fromstring(bytes(path_or_bytes), parser)
    else:
        root = etree.parse(path_or_bytes, parser).getroot()
    # strip namespaces
    for el in root.iter():
        if isinstance(el.tag, str) and '}' in el.tag:
            el.tag = el.tag.split('}', 1)[1]
    return root


def features(root):
    """Return Counter per category of hashable feature tuples."""
    cats = {k: Counter() for k in [
        'note', 'rest', 'tie', 'slur', 'articulation', 'ornament', 'fermata', 'grace',
        'lyric', 'harmony', 'dynamics', 'words', 'tempo', 'key', 'time', 'clef',
        'repeat', 'ending', 'beam', 'tuplet', 'staff', 'technical', 'part']}
    if root is None or root.tag != 'score-partwise':
        return cats
    parts = root.findall('part')
    cats['part'][len(parts)] += 1
    for pi, part in enumerate(parts):
        divisions = 1
        for mi, meas in enumerate(part.findall('measure')):
            pos = Fraction(0)
            last_onset = Fraction(0)
            def q(d):
                return Fraction(int(float(d))) / divisions if d else Fraction(0)
            for el in meas:
                tag = el.tag
                if tag == 'attributes':
                    d = _t(el, 'divisions')
                    if d:
                        try:
                            divisions = max(1, int(float(d)))
                        except ValueError:
                            pass
                    for k in el.findall('key'):
                        cats['key'][(pi, mi, _t(k, 'fifths'), _t(k, 'mode', 'major'))] += 1
                    for t in el.findall('time'):
                        cats['time'][(pi, mi, _t(t, 'beats'), _t(t, 'beat-type'))] += 1
                    for c in el.findall('clef'):
                        cats['clef'][(pi, mi, c.get('number', '1'), _t(c, 'sign'), _t(c, 'line'), _t(c, 'clef-octave-change', '0'))] += 1
                    st = _t(el, 'staves')
                    if st:
                        cats['staff'][(pi, st)] += 1
                elif tag == 'backup':
                    pos -= q(_t(el, 'duration'))
                elif tag == 'forward':
                    pos += q(_t(el, 'duration'))
                elif tag == 'note':
                    is_chord = el.find('chord') is not None
                    is_grace = el.find('grace') is not None
                    onset = last_onset if is_chord else pos
                    dur = Fraction(0) if is_grace else q(_t(el, 'duration'))
                    if el.find('rest') is not None:
                        key = (pi, mi, onset, dur)
                        cats['rest'][key] += 1
                        pkey = (pi, mi, onset, 'rest')
                    else:
                        p = el.find('pitch')
                        if p is not None:
                            pitch = (_t(p, 'step'), float(_t(p, 'alter', '0') or 0), _t(p, 'octave'))
                        else:
                            u = el.find('unpitched')
                            pitch = ('unpitched', _t(u, 'display-step') if u is not None else None, _t(u, 'display-octave') if u is not None else None)
                        key = (pi, mi, onset, pitch, dur, is_grace)
                        cats['note'][key] += 1
                        pkey = (pi, mi, onset, pitch)
                    if is_grace:
                        cats['grace'][pkey] += 1
                    for tie in el.findall('tie'):
                        cats['tie'][pkey + (tie.get('type'),)] += 1
                    nots = el.find('notations')
                    if nots is not None:
                        for s in nots.findall('slur'):
                            if s.get('type') in ('start', 'stop'):
                                cats['slur'][pkey + (s.get('type'),)] += 1
                        for a in nots.findall('articulations/*'):
                            cats['articulation'][pkey + (a.tag,)] += 1
                        for o in nots.findall('ornaments/*'):
                            if o.tag != 'accidental-mark':
                                cats['ornament'][pkey + (o.tag,)] += 1
                        for t in nots.findall('technical/*'):
                            cats['technical'][pkey + (t.tag,)] += 1
                        for f in nots.findall('fermata'):
                            cats['fermata'][pkey] += 1
                        for d in nots.findall('dynamics/*'):
                            cats['dynamics'][(pi, mi, d.tag)] += 1
                        for tp in nots.findall('tuplet'):
                            if tp.get('type') == 'start':
                                cats['tuplet'][pkey] += 1
                    for b in el.findall('beam'):
                        if b.get('number', '1') == '1' and (b.text or '').strip() == 'begin':
                            cats['beam'][pkey] += 1
                    for ly in el.findall('lyric'):
                        txt = ''.join(x.text or '' for x in ly.findall('text'))
                        if txt:
                            cats['lyric'][pkey + (txt,)] += 1
                    if not is_chord:
                        last_onset = pos
                        pos += dur
                elif tag == 'harmony':
                    cats['harmony'][(pi, mi, _t(el, 'root/root-step'), _t(el, 'root/root-alter', '0'), _t(el, 'kind'))] += 1
                elif tag == 'direction':
                    for d in el.findall('direction-type/dynamics/*'):
                        cats['dynamics'][(pi, mi, d.tag)] += 1
                    for w in el.findall('direction-type/words'):
                        if w.text and w.text.strip():
                            cats['words'][(pi, mi, w.text.strip())] += 1
                    snd = el.find('sound')
                    if snd is not None and snd.get('tempo'):
                        cats['tempo'][(pi, mi, round(float(snd.get('tempo'))))] += 1
                    for m in el.findall('direction-type/metronome'):
                        cats['tempo'][(pi, mi, 'metronome', _t(m, 'beat-unit'), _t(m, 'per-minute'))] += 1
                elif tag == 'barline':
                    r = el.find('repeat')
                    if r is not None:
                        cats['repeat'][(pi, mi, r.get('direction'))] += 1
                    e = el.find('ending')
                    if e is not None and e.get('type') == 'start':
                        cats['ending'][(pi, mi, e.get('number'))] += 1
                elif tag == 'sound' and el.get('tempo'):
                    cats['tempo'][(pi, mi, round(float(el.get('tempo'))))] += 1
    return cats


def compare(orig, rt):
    out = {}
    for k, o in orig.items():
        r = rt.get(k, Counter())
        total = sum(o.values())
        kept = sum((o & r).values())
        extra = sum((r - o).values())
        out[k] = (total, kept, extra)
    return out
