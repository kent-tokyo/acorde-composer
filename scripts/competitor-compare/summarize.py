"""Summarize roundtrip.py output. Usage: python3 -I summarize.py <out_dir>/results.json"""
import json, sys
from collections import defaultdict

results = json.load(open(sys.argv[1]))
tools = list(results[0]['tools'])
print(f'files: {len(results)}')
for t in tools:
    ok = [r for r in results if r['tools'][t]['ok']]
    print(f"{t}: opened {len(ok)}, failed {len(results) - len(ok)}, total {sum(r['tools'][t]['sec'] for r in ok):.2f} s")
common = [r for r in results if all(r['tools'][t]['ok'] for t in tools)]
print(f'compared (all tools opened): {len(common)}')
for t in tools:
    perfect = sum(1 for r in common if all(kept == total for total, kept, _ in r['tools'][t]['cmp'].values()))
    print(f'{t}: files with every feature kept {perfect}')
cats = defaultdict(lambda: defaultdict(lambda: [0, 0, 0]))
for r in common:
    for t in tools:
        for c, (total, kept, extra) in r['tools'][t]['cmp'].items():
            a = cats[c][t]; a[0] += total; a[1] += kept; a[2] += extra
print('\n| feature | count | ' + ' | '.join(tools) + ' |')
print('| --- | --- | ' + ' | '.join('---' for _ in tools) + ' |')
for c, row in cats.items():
    total = row[tools[0]][0]
    if total:
        print(f'| {c} | {total} | ' + ' | '.join(f'{row[t][1] / total * 100:.1f}%' for t in tools) + ' |')
for r in results:
    for t in tools:
        if not r['tools'][t]['ok']:
            print(f"FAIL {t} {r['file']}: {r['tools'][t]['error'][:120]}")
