"""Round-trip each MusicXML file through acorde (Composer engine), music21 and MuseScore 3.
Usage: python3 -I roundtrip.py <corpus_dir> <out_dir>
"""
import json, os, subprocess, sys, time, glob, signal, warnings
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from features import load, features, compare

ENGINE = os.environ.get('ACORDE_ENGINE', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'target', 'release', 'acorde-composer-engine'))
corpus, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
files = sorted(glob.glob(os.path.join(corpus, '*.xml')))


class Engine:
    def __init__(self):
        self.p = subprocess.Popen([ENGINE], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def call(self, req):
        self.p.stdin.write(json.dumps(req) + '\n'); self.p.stdin.flush()
        line = self.p.stdout.readline()
        if not line:
            self.__init__()
            raise RuntimeError('engine crashed')
        r = json.loads(line)
        if not r.get('ok'):
            raise RuntimeError(r.get('error', 'error'))
        return r['result']


def run_acorde(eng, path, dest):
    xml = open(path, encoding='utf-8', errors='replace').read()
    t = time.perf_counter()
    a = eng.call({'op': 'parse_musicxml_report', 'xml': xml})
    s = eng.call({'op': 'serialize_musicxml_report', 'score': a['score']})
    dt = time.perf_counter() - t
    open(dest, 'w').write(s['output'])
    return dt, len(a.get('diagnostics', [])) + len(s.get('diagnostics', []))


class Timeout(Exception):
    pass


def _alarm(*_):
    raise Timeout()


def run_music21(path, dest):
    import music21
    signal.signal(signal.SIGALRM, _alarm); signal.alarm(60)
    try:
        t = time.perf_counter()
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            sc = music21.converter.parse(path, format='musicxml', forceSource=True)
            sc.write('musicxml', fp=dest)
        return time.perf_counter() - t, None
    finally:
        signal.alarm(0)


def run_mscore(path, dest):
    t = time.perf_counter()
    r = subprocess.run(['mscore3', '-o', dest, path], env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen'},
                       capture_output=True, timeout=60)
    if not os.path.exists(dest):
        raise RuntimeError('mscore failed: ' + r.stderr.decode(errors='replace')[-200:])
    return time.perf_counter() - t, None


eng = Engine()
results = []
for f in files:
    name = os.path.basename(f)
    orig = features(load(f))
    row = {'file': name, 'tools': {}}
    for tool, fn in [('acorde', lambda p, d: run_acorde(eng, p, d)), ('music21', run_music21), ('musescore3', run_mscore)]:
        dest = os.path.join(out, f'{name}.{tool}.musicxml')
        try:
            dt, diag = fn(f, dest)
            rt = features(load(dest))
            row['tools'][tool] = {'ok': True, 'sec': dt, 'diagnostics': diag, 'cmp': compare(orig, rt)}
        except Exception as e:  # noqa
            row['tools'][tool] = {'ok': False, 'error': f'{type(e).__name__}: {str(e)[:200]}'}
    results.append(row)
    print(name, {k: v['ok'] for k, v in row['tools'].items()}, flush=True)

json.dump(results, open(os.path.join(out, 'results.json'), 'w'), default=str)
