# Acorde Composer

A cross-platform AI-assisted score editor for Windows and macOS. **Acorde Composer** delegates the score model and deterministic music processing to the existing [`acorde`](https://github.com/kent-tokyo/acorde) engine.

See [CHANGELOG.md](CHANGELOG.md) for release history.

Try the browser demo in [`src/playground/`](src/playground/). It runs the bundled `acorde-wasm` engine locally for a small ABC edit, undo/redo, SVG preview, and MusicXML export.

## Why Acorde Composer

Acorde Composer is a lightweight desktop score editor for MusicXML, MIDI, and ABC notation. It is designed for musicians and developers who want to inspect and edit score data, review AI-assisted ideas before applying them, and keep playback, export, and part editing in one local workflow.

- **Data-centered editing** — MusicXML is edited through `acorde`'s Score model and can be saved again.
- **Reviewable AI assistance** — AI and OMR output becomes a `ScoreCommand` proposal instead of changing the score directly.
- **Voice-aware workflow** — voice selection, keyboard navigation, round-trip fixtures, and loss diagnostics make multi-voice behavior visible.
- **Local-first basics** — editing, playback, and file I/O work locally; external providers stay behind explicit boundaries.
- **Honest readiness** — SoundFont, OMR, AI providers, VST, signing, and clean-machine QA are reported as separate capabilities and gates.

For comparison criteria, migration steps, and limitations, see the [Choosing and migrating guide](docs/choosing-and-migrating.md). The [SEO and competitive acquisition content plan](docs/seo-content-plan.md) documents the public content strategy.

## Music processing policy

Composer uses `acorde` as its only music library. The Score model, MusicXML / MIDI / ABC I/O, editing commands, layout, SVG rendering, and PlaybackEvent processing all use `acorde` APIs. Composer does not use Tone.js, VexFlow, music21, or another music library.

The current engine pins the five adjacent `acorde` crates at v1.1.1 through path dependencies and versions. If a required music capability is missing, it must be implemented and tested in `acorde` first rather than duplicated in Composer.

## Current release: v0.1.10

The current release uses `acorde` v1.1.1 and includes:

- Electron UI with isolated preload and bounded JSON IPC
- MusicXML, MXL, MIDI, and ABC import/export through `acorde-io`
- SVG score rendering, PDF/print preview, page geometry diagnostics, and part export
- Note/rest editing, lyrics, chord symbols, dynamics, articulations, grace notes, tuplets, slurs, ties, hairpins, ottava, pedal, arpeggio, trill, fingering, string number, and technique text
- Multiple part/staff controls, voice selection, keyboard navigation, selection playback, undo/redo, and autosave recovery
- Mixer controls, oscillator fallback, decoded PCM sample playback, SoundFont status, and bounded sample contracts
- A resolved SoundFont preset-zone adapter boundary for key/velocity selection, sample metadata, and missing-sample diagnostics
- AI proposal review, OMR review queue, provider license gates, timeout recovery, and redacted support bundles
- Artifact manifest generation, release QA reports, schema migration, checksum, SBOM, NOTICE, and provenance checks

## Migration from existing notation software

1. Export a copy of the source score as MusicXML.
2. Open it in Acorde Composer and inspect diagnostics.
3. Select the target voice and make edits.
4. Save to a new file name.
5. Reopen the saved file and verify voices, rests, backup/forward events, lyrics, chords, and other important notation.
6. Check print output, external audio assets, licenses, and target-platform requirements before distribution.

Keep the original file unchanged during migration. The [migration guide](docs/choosing-and-migrating.md) explains comparison axes, the safe round-trip workflow, FAQ, and current limitations.

## Current limitations

Acorde Composer does not claim to replace a DAW, a mature commercial notation application, MuseSounds itself, or a general-purpose OMR service. Complete multi-voice editing, production SoundFont zone materialization, MuseSounds-equivalent assets, a real OMR provider, signed installers, and clean Windows/macOS packaged-app QA remain separate verification gates.

No OMR provider, AI service, MuseSounds asset, SoundFont asset, or VST binary is bundled. External assets and providers remain subject to their own licenses, credentials, redistribution terms, and platform requirements.

## Development

```sh
npm install
npm run check
npm test
npm start
```

Build a packaged directory and deterministic artifact manifest:

```sh
npm run pack
```

Generate a 20-scenario release QA report:

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

Validate a report independently:

```sh
npm run release:qa:validate -- \
  --input dist/release-qa-report.json
```

The current local verification is 169 Node tests and 20 Rust unit tests. The notation coverage matrix now assigns individual MusicXML fixtures to 12 elements, and the latest macOS arm64 packaged artifact passed the multiple-voice Open → edit → save → reload scenario. These results do not replace signed artifacts or Windows real-device QA. See [QA evidence](qa/README.md), [NOTICE.md](NOTICE.md), and [GitHub Release v0.1.10](https://github.com/kent-tokyo/acorde-composer/releases/tag/v0.1.10).

## License and external assets

Composer is distributed under the project license. The `acorde` engine notices are maintained by the [`acorde` project](https://github.com/kent-tokyo/acorde). See [NOTICE.md](NOTICE.md) before distributing builds that include external providers or assets.
