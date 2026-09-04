# Changelog

## 0.1.9 — 2026-09-05

`acorde` v1.1.0への依存更新と、SoundFont preset-zone接続境界の先行実装を含むリリースです。

### Changed

- `acorde-core`、`acorde-io`、`acorde-layout`、`acorde-render-svg`、`acorde-soundfont`をv1.1.0へ更新
- PlaygroundのWASM生成物とGitHub Pages workflowをacorde v1.1.0へ更新
- resolved preset-zone metadataを受け取るComposer側SoundFont adapterとIPC境界を追加
- key／velocity範囲、sample、loop、root key、envelopeの決定的選択とmissing sample診断を追加
- 公開ドキュメントとQA evidenceをComposer v0.1.9／acorde v1.1.0へ同期

### Verification

- Composer Node: 158 passed
- Composer Rust: 18 passed
- `npm run check`: passed
- `cargo check --locked`: passed
- `git diff --check`: passed

## 0.1.8 — 2026-09-03

再生・IPC・plugin hostの安定性と、編集時の不要な処理を改善した保守リリースです。依存する音楽処理基盤は `acorde` v1.0.9のままです。

### Changed

- 未保存変更のOpen／Recent／New／Template確認を共通UIモーダルへ統一
- 再生ハイライトを時系列カーソルとアドレスMapで処理し、毎フレームの配列生成・全ノートDOM走査を削減
- 同一再生ノートへの冗長なCSS更新を抑止
- mixer設定の未変更時に同期localStorage書込みを省略
- 空／不完全scoreの再生開始と非同期再生開始の競合をガード
- engine stdoutの親プロセス終了時panicを防止
- plugin hostのstdin失敗、serialize不能payload、再起動中の旧childイベントを安全に処理

### Verification

- Composer Node: 152 passed
- Composer Rust: 18 passed
- `npm run check`: passed
- `cargo clippy --all-targets -- -D warnings`: passed
- `git diff --check`: passed

## 0.1.7 — 2026-09-03

acorde v1.0.9同期、エディタUIの操作整理、SoundFont状態表示、Quick startガイドを含むリリースです。

### Added

- Score / Notation / Parts / Layout / Playbackの操作グループ
- 保存状態、SoundFont状態、初回操作ガイドの表示改善
- UI契約テストの拡充

### Verification

- Composer Node: 126 passed
- Composer Rust: `cargo check` passed
- `npm run check`: passed

## 0.1.6 — 2026-09-03

acorde v1.0.8同期、SoundFont decode IPC、OMR review queue、複数voice keyboard navigationを含むリリースです。

### Added

- acorde v1.0.8のSF2 PCM / SF3 Vorbis decode boundary
- OMR review queueのstateless IPC
- 複数voiceの`[` / `]` keyboard navigation

### Verification

- Composer Node: 90 passed
- Composer Rust: 17 passed
- `npm run check`: passed without warnings

### Post-release maintenance

- 隣接acorde v1.0.9の5 crateへ依存pin、SoundFont provider contract、engine表示、READMEを同期（Composer versionは0.1.6のまま）
- acorde Issue解決後のclean checkoutでComposer engineのcompile/test成功を再確認

## 0.1.5 — 2026-09-03

acorde v1.0.7のSoundFont実装をComposer engineへ接続し、OMR入力preflightを強化したリリースです。

### Added

- acorde v1.0.7のSF2 PCM decode / sample render fixture
- SF3 Vorbis featureを有効化したSoundFont依存構成
- OMR画像 / PDFのマジックバイト検証
- Composer engine JSON boundaryでSF2 PCM / SF3 Vorbisの実decode結果を検証する回帰fixture

### Verification

- Composer Node: 90 passed
- Composer Rust: 17 passed
- `npm run check`: passed without warnings

### Post-release maintenance

- 隣接acorde v1.0.8へ5 crateの依存pinとengine表示を同期（Composer versionは0.1.5のまま）
- v1.0.8でSF2 PCM / SF3 Vorbis decode boundary fixtureとRust 17件成功を再確認
- acorde Issue #14 CLOSEDを確認し、cleanなv1.0.8隣接checkoutでComposer engineのcompile/test成功を再確認
- acorde Issue #15へ、preset-zoneからsample regionを解決する公開SoundFont APIを要求し、Composer UIの未接続診断を明示

## 0.1.4 — 2026-09-02

acorde v1.0.5へ更新し、OMR / AI provider / 外部音源境界と再現可能なrelease metadataを強化したリリースです。

### Added

- OMR proposal assessment、review queue、bbox navigation、provider failure recovery
- AI providerのlicense / network / privacy / rate limit / timeout / stale proposal検証
- 外部sample library registryとrelease metadata integrity検証
- acorde v1.0.5のSampleDecoder / SampleRenderer境界fixture
- decoded PCM sample cacheと外部OMR / AI JSON provider adapter
- sample voiceのsustain保持とpedal release lifecycle
- 最大polyphony制限とFIFO voice stealing
- sample root noteからPlaybackEvent pitchへの安全なpitch ratio変換
- decoder → renderer間のPCM sample contract（format、loop、root note、digest、サイズ上限）
- Windows署名readinessで証明書参照とパスワード参照を個別必須化
- signing credential設定とartifact検証を分離したrelease readiness判定
- QA結果の未知platform・scenario・status・重複を検出する入力整合性gate
- 共通provider runtimeのJSON stdin 512 KiB上限
- provider executableの絶対パス、NUL文字、引数列上限の検証
- 外部OMR providerのidentity / license gateをspawn前に適用し、未承認providerを起動しない回帰テスト
- OMR画像 / PDF選択時の拡張子・通常ファイル・64 MiB上限preflightと、provider未接続時のScore非変更UI導線
- OMR画像 / PDFのPNG/JPEG/PDFマジックバイトを確認する偽装防止preflight
- macOS / Windows配布QA matrix（20ケース）と未実施・失敗gate
- version / commit / release metadata digestへ結び付けた改変検出可能なQA report

### Changed

- `acorde` core / io / layout / render-svg / soundfontをv1.0.5へ更新
- Composerのリリースバージョンをv0.1.4へ更新

### Verification

- Composer Rust: 13 passed / 1 ignored（MusicXML voice identityのacorde側残件）
- Composer Node: 90 passed

### Post-release maintenance

- 隣接acorde v1.0.7へ依存pinとengine表示を同期（Composer versionは0.1.4のまま）
- Rust未使用importを整理し、`npm run check`をwarningなしで通過
- acorde v1.0.7でComposerの複数voice PlaybackEvent address fixtureを有効化し、Rust 15件成功を確認
- acorde v1.0.7のSF2 PCM decode / sample renderをComposer engine fixtureで確認（SF3 Vorbisはfeature経由）
- SoundFont decode結果をengine JSON IPC / preloadのbounded sample APIへ接続し、SF2 / SF3 formatを明示化
- OMR review queueの一覧取得・status filter・単一item遷移をstatelessなmain / preload IPCへ接続
- 複数voice UIで`[` / `]`によるvoice切替とselector・入力対象の同期を追加
- acorde v1.0.7でIssue #13のSF2 PCM decoder / synthesizer基盤が解決され、Composer側の実API fixture接続へ移行
- 外部OMR provider gateをspawn前に強化し、identity不備・license未承認時の起動を防止

## 0.1.3 — 2026-09-02

acorde v1.0.3へ更新し、optional pluginを安全に扱うためのruntime・GUI・lifecycle境界を追加した候補リリースです。

### Added

- 外部plugin host processのbounded JSON IPC、timeout、停止、クラッシュ時の限定restartとdisable
- plugin manifestのAPI version / capability検証と、core・filesystem・network・AudioContextから分離したGUI descriptor
- plugin installation registryのinstall / enable / disable / update / uninstall状態遷移

### Changed

- `acorde` core / io / layout / render-svg / soundfontをv1.0.3へ更新
- Composerのリリースバージョンをv0.1.3へ更新

### Verification

- Composer Rust: 10 passed / 1 ignored（acorde Issue #2の複数voice fixture）
- Composer Node: 49 passed
- `acorde` v1.0.3 workspace tests: 全テスト成功

## 0.1.2 — 2026-09-02

Mixerと外部入力の運用性を高め、保存状態と再生中の変更反映を安定化したリリースです。音楽処理基盤は`acorde` v1.0.1を継続利用します。

### Added

- Mixerのmaster / part channel bus、channel reset、part solo、再生中のvolume / pan / mute / solo反映
- 保存済みMixer stateの正規化、score変更時の不要channel清掃、score読込前のchannel保持
- Web MIDI入力の選択位置挿入、接続状態表示、disconnect切替

### Verification

- `npm test` 21件成功、JavaScript構文検証、差分検証
- `npm run check`成功、Electron package contractと`acorde` v1.0.1 path依存を確認

### Post-release maintenance

- PDF / 印刷プレビューの実寸page geometryとprintable area diagnostics、およびgeometry回帰テストを追加（公開tag後の作業ツリー。バージョン番号は`0.1.2`のまま）
- 複数MIDI deviceの選択、接続中の切替、device IDの保存・優先復元を追加
- PDF render metadataの重複防止と、print diagnostics接続契約テストを追加

## 0.1.1 — 2026-09-02

`v0.1.0`の基盤を、再生・IPC・配布検証の回帰テストとパッケージ契約で補強した保守リリースです。

### Added

- 選択小節の一回再生、`Space`再生／停止ショートカット、Keyboard helpの同期
- PlaybackEventの小節境界・sidecar JSON IPC・SVG render metadata回帰テスト
- MusicXML / ABC parse reportとMIDI export reportのIPC回帰テスト
- Electronパッケージ契約テストとnpm依存lock
- Mixerのmaster / part channel bus、channel reset、part solo、再生中のvolume / pan / mute / solo反映
- 保存済みMixer stateの正規化、score変更時の不要channel清掃、正規化回帰テスト
- Web MIDI入力の選択位置挿入とdisconnect切替

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
