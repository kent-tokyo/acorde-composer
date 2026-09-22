# Acorde Composer

A local-first desktop score editor for MusicXML, MIDI, and ABC. Acorde Composer uses [`acorde`](https://github.com/kent-tokyo/acorde) as its only music-processing library; Electron owns the desktop UI, files, and provider boundaries.

Japanese: [README_ja.md](README_ja.md) · Chinese: [README_zh.md](README_zh.md) · [Browser playground](src/playground/)

## What works

- Open, edit, and export MusicXML, MIDI, and ABC; render SVG and use PDF/print entry points.
- Enter notes and rests; edit text and common notation; select voices; undo/redo; save and reopen.
- Use palettes, Properties, Navigator, Mixer, playback controls, and a MuseScore-oriented menu layout.
- Review AI and OMR proposals before they become validated score commands.
- Load a local SF2/SF3, resolve a preset, and use decoded PCM playback when the asset fits the current bounded IPC path; otherwise playback falls back safely.

The published release is **v0.1.15**, built and evidenced with `acorde` v1.2.2. See [CHANGELOG.md](CHANGELOG.md).

## Safe MusicXML migration

1. Export a copy from the source application.
2. Open it and inspect diagnostics.
3. Select the intended voice and edit.
4. Save under a new name, reopen it, and check voices, rests, `backup`/`forward`, lyrics, and chords.

Keep the original unchanged. The fuller checklist and product-fit guidance are in [Choosing and migrating](docs/choosing-and-migrating.md).

## Boundaries

This is not yet a replacement claim for a mature notation suite, a DAW, MuseSounds, or a general OMR service. Native VST hosting, production OMR/AI providers, MuseSounds-class assets, signed installers, Windows packaged QA, and clean-machine QA are separate gates. Cross-staff packaged editing currently depends on upstream staff materialization; the missing large-SoundFont transport is tracked upstream as well.

No SoundFont, MuseSounds asset, VST binary, AI credential, or OMR provider is bundled. Check each external asset's licence and redistribution terms before distribution; see [NOTICE.md](NOTICE.md) and the [SoundFont checklist](docs/soundfont-license-checklist.md).

## Development and verification

```sh
npm install
npm test
npm run check
npm run pack
```

The current checkout passed 261 Node tests and 25 Rust tests on 2026-09-23. `npm run check:candidate` runs the local candidate gate; it is not a signed-release or packaged-QA result. The 20 release-QA scenarios remain separate: `not-run` is never a pass.

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

For evidence and status, see the [feature matrix](docs/feature-matrix.md), [evidence index](docs/evidence-index.md), and [QA guide](qa/README.md).
