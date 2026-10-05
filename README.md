# Acorde Composer

A local-first desktop score editor for MusicXML, MIDI, and ABC. [`acorde`](https://github.com/kent-tokyo/acorde) is the only music-processing library; Electron handles the desktop UI, files, and external-provider boundaries.

[Japanese](README_ja.md) · [Chinese](README_zh.md) · [Browser Playground](https://kent-tokyo.github.io/acorde-composer/playground/) · [Desktop downloads](https://github.com/kent-tokyo/acorde-composer/releases)

## Try or install

The free [Playground](https://kent-tokyo.github.io/acorde-composer/playground/) is the recommended starting point. Create or open a MusicXML score, select a measure, edit notes, rests, text, and voices, then export the result.

The latest desktop release is **v0.2.3**, built with `acorde` v1.2.17. Its icon-based note-input toolbar, voice controls, history placement, Navigator behavior, and shortcuts are closer to the MuseScore workflow. The Apple-silicon macOS DMG is experimental: its complete app bundle is ad-hoc-signed and strictly verified, but it is not Developer ID-signed or notarized. Download it only from [GitHub Releases](https://github.com/kent-tokyo/acorde-composer/releases); if Gatekeeper blocks it, Control-click the app in Finder and choose **Open**.

## Capabilities

- Edit and exchange MusicXML, MIDI, and ABC; render SVG and use PDF/print entry points.
- Enter notes and rests, edit common notation and text, select voices, undo/redo, save, and reopen.
- Use a MuseScore-oriented Home/Score/Publish shell with Palettes, Instruments, Properties, parts, Navigator, Timeline, Piano, Mixer, workspaces, and familiar shortcuts.
- Play oscillator or validated SF2/SF3 PCM through `acorde` playback data.
- Review AI and OMR proposals before validated commands can change the score.

## Current limits

Native VST hosting, production OMR/AI providers, MuseSounds-class bundled assets, trusted Developer ID/Authenticode installers, Windows packaged QA, and clean-machine QA are not complete. Large SoundFonts still need a file/stream transport path. No SoundFont, MuseSounds asset, VST binary, provider credential, or OMR binary is bundled.

See the [feature matrix](docs/feature-matrix.md) for exact boundaries and [NOTICE.md](NOTICE.md) for external-asset obligations.

## Safe MusicXML migration

1. Export a copy from the source application.
2. Open it and review diagnostics before editing.
3. Save under a new name and reopen it.
4. Check voices, rests, `backup`/`forward`, lyrics, chords, and important notation.

Keep the original unchanged. See [Choosing and migrating](docs/choosing-and-migrating.md) for the full checklist.

## Development and verification

```sh
npm install
npm test
npm run check
npm run test:workspace
npm run test:playground
```

`npm run pack` builds the local package and artifact manifest. `npm run check:candidate:strict` checks tests plus Acorde provenance, but it does not replace signed-package or real-machine QA. The 20 manual release scenarios remain separate; `not-run` is never a pass.

Start with the [documentation index](docs/README.md), [QA guide](qa/README.md), and [CHANGELOG](CHANGELOG.md).
