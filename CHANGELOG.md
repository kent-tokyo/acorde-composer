# Changelog

This file records user-visible releases and the current development delta. Detailed commit-by-commit history is available in Git.

## 0.1.15 — 2026-09-23

### Changed

- Updated the five Acorde crates to v1.2.2 and regenerated candidate evidence with the exact `v1.2.2` tag.
- Unified native menu, context menu, renderer dispatch, and shortcuts through one command registry; menu placement now follows the MuseScore-oriented File → Edit → View → Add → Format → Tools → Plugins → Help geography.
- Added persisted workspace visibility, Navigator, Select All, Find / Go to, context commands, adaptive page/continuous layout, and English/Japanese/Chinese menu contracts.
- Raised the bounded engine request limit from 25 MiB to 64 MiB so the 9.5 MiB UprightPianoKW SF2 fixture can traverse the current JSON byte-array protocol. A streaming/file-path protocol for larger assets is tracked upstream.

### Fixed

- Preserved document save state during SVG, ABC, and MIDI export.
- Prevented first-note entry, compact-layout, mixer visibility, shortcut, and accessible-SVG regressions.

### Verification

- 2026-09-23: 261 Node tests and 25 Rust tests passed; `npm run check` and whitespace validation passed.
- The macOS arm64 package loaded the local CC0 UprightPianoKW SF2, resolved preset `0:0`, and started the bundled engine/audio path. It remains unsigned; release QA and Windows QA are separate.

## 0.1.14 — 2026-09-21

- Updated the five Acorde crates to v1.2.0.
- Added channel-aware SoundFont PCM handling, typed-spanner boundaries, and the first MuseScore-oriented menu/workspace baseline.
- Verified 210 Node tests, 24 Rust tests, strict candidate evidence, and artifact/QA evidence consistency. The 20 manual release-QA scenarios were not marked as passed.

## 0.1.13 — 2026-09-20

- Added text-style editing, SoundFont zone propagation, stricter multi-voice round trips, candidate-gate JSON, and performance evidence schemas.

## 0.1.0–0.1.12 — 2026-09-02 to 2026-09-06

- Established the Electron/Rust editor, MusicXML/MIDI/ABC interchange, SVG/PDF entry points, mixer and playback controls, provider safety boundaries, release-QA schemas, benchmark fixtures, notation fixtures, and package contracts.
- Historical version-specific test counts, dependency pins, and post-release maintenance notes remain available through Git tags and commit history.

## Known release boundaries

No release in this series claims native VST hosting, production OMR/AI quality, MuseSounds-class bundled assets, signed installers, Windows packaged QA, or clean-machine QA. See [feature matrix](docs/feature-matrix.md) and [QA guide](qa/README.md).
