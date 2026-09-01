# Changelog

## 0.1.1 — 2026-09-02

`v0.1.0`の基盤を、再生・IPC・配布検証の回帰テストとパッケージ契約で補強した保守リリースです。

### Added

- 選択小節の一回再生、`Space`再生／停止ショートカット、Keyboard helpの同期
- PlaybackEventの小節境界・sidecar JSON IPC・SVG render metadata回帰テスト
- MusicXML / ABC parse reportとMIDI export reportのIPC回帰テスト
- Electronパッケージ契約テストとnpm依存lock

## 0.1.0 — 2026-09-02

初回リリース基盤。Acorde Composerは、既存の`acorde` v1.0.1を唯一の音楽処理基盤として利用します。

### Added

- `acorde`のScoreを使った音符・休符入力、選択、範囲選択、編集、undo / redo
- `Score → LayoutResult → SVG`による譜面表示、SVG / PDF / 印刷プレビュー
- MusicXML / MXL / MIDI / ABCの入出力とreport diagnostics
- PlaybackEventによるWeb Audio再生、seek、loop、選択範囲再生、Mixer基礎機能
- part / staff編集、メタデータ、歌詞、コード記号、主要な記譜command
- autosave / recovery、アクセシビリティ設定、Keyboard help、Electronパッケージ生成

### Known limitations

- 複数voiceのMusicXML完全保持は、acorde Issue #2の解決待ちです。
- SoundFont実provider、MuseSounds、VST / VSTi、OMR、AI外部providerは未実装です。
- 配布用コード署名とアプリ固有アイコンは未設定です。
