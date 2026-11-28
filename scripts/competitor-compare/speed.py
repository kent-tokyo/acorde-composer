"""Parse + render-to-SVG timing for large scores. python3 -I speed.py <file>..."""
import json, os, subprocess, sys, time, tempfile, statistics

ENGINE = os.environ.get('ACORDE_ENGINE', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'target', 'release', 'acorde-composer-engine'))


def best(fn, n=3):
    ts = []
    for _ in range(n):
        t = time.perf_counter(); fn(); ts.append(time.perf_counter() - t)
    return min(ts)


for path in sys.argv[1:]:
    xml = open(path, encoding='utf-8').read()
    row = {'file': os.path.basename(path)}
    p = subprocess.Popen([ENGINE], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)
    def ac_parse():
        p.stdin.write(json.dumps({'op': 'parse_musicxml_report', 'xml': xml}) + '\n'); p.stdin.flush()
        return json.loads(p.stdout.readline())['result']['score']
    score = ac_parse()
    def ac_render():
        p.stdin.write(json.dumps({'op': 'render_svg', 'score': score, 'width': 1200}) + '\n'); p.stdin.flush()
        r = json.loads(p.stdout.readline())
        assert r['ok'], r
    row['acorde_parse'] = best(ac_parse)
    row['acorde_render'] = best(ac_render)
    p.stdin.close(); p.wait()

    import verovio
    tk = verovio.toolkit(); tk.setOptions({'pageWidth': 2100})
    def vr_parse():
        tk.loadData(xml)
    def vr_all():
        tk.loadData(xml)
        for i in range(1, tk.getPageCount() + 1):
            tk.renderToSVG(i)
    row['verovio_parse'] = best(vr_parse)
    row['verovio_parse_render'] = best(vr_all)

    import music21, warnings
    warnings.simplefilter('ignore')
    row['music21_parse'] = best(lambda: music21.converter.parse(path, format='musicxml', forceSource=True), 1)

    with tempfile.TemporaryDirectory() as d:
        def ms():
            subprocess.run(['mscore3', '-o', os.path.join(d, 'o.svg'), path], env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen'}, capture_output=True, timeout=600)
        row['musescore3_parse_render_svg_cli'] = best(ms, 1)
    print(json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in row.items()}), flush=True)
