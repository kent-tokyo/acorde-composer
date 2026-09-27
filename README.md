# Acorde Composer

A local-first desktop score editor for MusicXML, MIDI, and ABC. Acorde Composer uses [`acorde`](https://github.com/kent-tokyo/acorde) as its only music-processing library; Electron owns the desktop UI, files, and provider boundaries.

Japanese: [README_ja.md](README_ja.md) · Chinese: [README_zh.md](README_zh.md) · [Try the browser playground](https://kent-tokyo.github.io/acorde-composer/playground/)

## Download the app

The user-facing desktop download page is [Acorde Composer Releases](https://github.com/kent-tokyo/acorde-composer/releases). The [browser playground](https://kent-tokyo.github.io/acorde-composer/playground/) is the primary free experience. The macOS `Acorde Composer-0.2.1-arm64-unsigned.dmg` asset is experimental: it is not signed or notarized and may require Gatekeeper override steps. Maintainers can follow the [macOS distribution guide](docs/macos-distribution.md).

## Get started

### Recommended: use the free Playground

1. Open the [Playground](https://kent-tokyo.github.io/acorde-composer/playground/).
2. Choose **New score** or open a MusicXML file.
3. Select a measure, then use the note, rest, text, voice, and playback controls to edit it.
4. Export MusicXML, MIDI, ABC, or SVG when finished.

It runs in the browser, so there is nothing to install. Start here to try Acorde Composer or to make a quick edit.

### Experimental macOS app: unsigned DMG

1. Visit [Releases](https://github.com/kent-tokyo/acorde-composer/releases) and download the asset ending in `-unsigned.dmg` when one is available.
2. Open the DMG, then drag **Acorde Composer.app** to Applications.
3. If macOS blocks its first launch, Control-click the app in Finder, choose **Open**, then confirm **Open**. Do this only for a ZIP downloaded from the official Releases page.

This build is free but unsigned and not notarized. It is for users who understand the Gatekeeper warning; use the Playground if you prefer not to override it. An unsigned ZIP may be offered as a fallback for advanced users.

## What works

- Open, edit, and export MusicXML, MIDI, and ABC; render SVG and use PDF/print entry points.
- Enter notes and rests; edit text and common notation; select voices; undo/redo; save and reopen.
- Use a MuseScore-oriented Home／Score／Publish shell with Palettes, Instruments, Layout, Properties, part tabs, page Navigator, Timeline, Piano, docked Mixer, workspace presets, and familiar note-input shortcuts.
- Review AI and OMR proposals before they become validated score commands.
- Load a local SF2/SF3, resolve a preset, and use decoded PCM playback when the asset fits the current bounded IPC path; otherwise playback falls back safely.

The published release is **v0.2.1**, built with `acorde` v1.2.12. See [CHANGELOG.md](CHANGELOG.md).

## Safe MusicXML migration

1. Export a copy from the source application.
2. Open it and inspect diagnostics.
3. Select the intended voice and edit.
4. Save under a new name, reopen it, and check voices, rests, `backup`/`forward`, lyrics, and chords.

Keep the original unchanged. The fuller checklist and product-fit guidance are in [Choosing and migrating](docs/choosing-and-migrating.md).

## Boundaries

This is not yet a replacement claim for a mature notation suite, a DAW, MuseSounds, or a general OMR service. Native VST hosting, production OMR/AI providers, MuseSounds-class assets, signed installers, Windows packaged QA, and clean-machine QA are separate gates. Cross-staff packaged E2E remains to be accepted on a v1.2.12 artifact; large-SoundFont transport remains tracked upstream.

No SoundFont, MuseSounds asset, VST binary, AI credential, or OMR provider is bundled. Check each external asset's licence and redistribution terms before distribution; see [NOTICE.md](NOTICE.md) and the [SoundFont checklist](docs/soundfont-license-checklist.md).

## Development and verification

```sh
npm install
npm test
npm run check
npm run pack
```

The v0.2.1 release gate runs Node and Rust tests, static and fixture checks, Clippy, the desktop workspace E2E, and the browser Playground E2E. `npm run check:candidate` is not signed-release or packaged-QA evidence. The 20 manual release-QA scenarios remain separate: `not-run` is never a pass.

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

For evidence and status, see the [feature matrix](docs/feature-matrix.md), [evidence index](docs/evidence-index.md), and [QA guide](qa/README.md).
