# Changelog

This file records user-visible releases and the current development delta. Detailed commit-by-commit history is available in Git.

## Unreleased

No changes yet.

## 0.2.2 — 2026-09-27

- Updated all five Acorde crates to v1.2.13, including expanded MusicXML barline handling and MSCX/MEI round-trip coverage for multiple voices, parts, cross-staff notation, and spanners.
- Reorganized File, View, Format, and Tools around a MuseScore-oriented command layout; added grouped note-input controls, duration and accidental shortcuts, and visible voice 1–4 state.
- Reduced the primary left rail to Palettes, Instruments, and Properties; added docked or floating Navigator, Timeline, and Piano panels; and kept the Acorde panel closed by default.
- Expanded Home with recent-score actions and Publish with document/export context. Workspace persistence now migrates to schema v4.
- Fixed packaged engine builds to honor an isolated `CARGO_TARGET_DIR`, preventing release validation from reading a different Cargo target tree.
- Verified 286 Node tests, 25 Rust tests, `npm run check`, Clippy with warnings denied, desktop workspace E2E, and Playground E2E. Packaged manual QA remains separate.

## 0.2.1 — 2026-09-27

- Added Home, Score, and Publish modes; full-score and part tabs; page-thumbnail Navigator; Timeline; Piano; and Master Palette.
- Docked Mixer controls beside the score with an optional floating layout, and moved playback seeking into the top playback toolbar.
- Added Default, Minimal, Playback, Review, and user-saved workspaces; customizable note-input toolbar visibility; light, dark, and high-contrast themes; and F6 focus traversal.
- Expanded the MuseScore-oriented View menu and shortcuts with palette search, Master Palette, Timeline, Piano, and workspace presets. Workspace state now migrates to schema v3.

## 0.2.0 — 2026-09-27

- Updated the five Acorde crates to v1.2.12; release evidence is regenerated from the tagged 0.2.0 commit.
- Reworked the desktop workspace around MuseScore-compatible Palettes, Instruments, and selection-aware Properties panels; added familiar note-entry, duration, voice, cross-staff, and F8/F9/F10 shortcuts.
- Added a real Electron workspace E2E covering panel geography, note entry, direct empty-voice activation, and selection properties; fixed startup panel construction and score-symbol click interception found by that test.
- Added a browser Playground deployment gate and expanded its score-editing controls.
- Added explicit macOS unsigned experimental DMG/ZIP build paths and user-facing distribution guidance. These artifacts are not signed or notarized.

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
