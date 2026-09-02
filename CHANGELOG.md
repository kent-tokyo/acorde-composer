# Changelog

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
- macOS / Windows配布QA matrix（20ケース）と未実施・失敗gate
- version / commit / release metadata digestへ結び付けた改変検出可能なQA report

### Changed

- `acorde` core / io / layout / render-svg / soundfontをv1.0.5へ更新
- Composerのリリースバージョンをv0.1.4へ更新

### Verification

- Composer Rust: 13 passed / 1 ignored（MusicXML voice identityのacorde側残件）
- Composer Node: 85 passed

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
