# Competitor comparison

These scripts compare the Composer engine (`acorde`) with music21, Verovio, MuseScore 3 and OpenSheetMusicDisplay. Results and their limits are in [docs/competitor-comparison.md](../../docs/competitor-comparison.md).

They are manual tools, not part of `npm test`. Nothing is downloaded at run time. Supply the corpus and the competitor tools yourself.

## Setup

```sh
cargo build --release --manifest-path engine/Cargo.toml   # or set ACORDE_ENGINE=/path/to/engine
pip install lxml music21 verovio
# MuseScore 3 CLI on PATH as mscore3 (Debian/Ubuntu: apt install musescore3)
npm install --no-save opensheetmusicdisplay@1.9.0          # only for osmd.cjs; or set OSMD_JS
```

Corpus used so far: the MIT-licensed unofficial MusicXML test suite (`input/regression/musicxml` in the LilyPond repository), plus `qa/fixtures/notation/*.musicxml` renamed to `.xml`.

## Run

```sh
python3 -I scripts/competitor-compare/roundtrip.py <corpus_dir> <out_dir>   # parse → save → reparse, per tool
python3 -I scripts/competitor-compare/summarize.py <out_dir>/results.json
python3 -I scripts/competitor-compare/speed.py qa/fixtures/performance/*.musicxml
node scripts/competitor-compare/osmd.cjs qa/fixtures/performance/100-measures.musicxml
```

`features.py` extracts tool-neutral features from each file: notes (onset, pitch, duration), rests, ties, slurs, articulations, ornaments, lyrics, harmony, dynamics, words, tempo, key, time, clef, repeats, endings, beams, tuplets and technical marks. Parts and measures are matched by order. A feature counts as kept only when the reparsed file has the same feature at the same place. Verovio has no MusicXML writer, so it appears only in `speed.py`.
