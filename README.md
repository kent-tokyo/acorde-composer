# Acorde Composer

Windows / macOS向けのAI支援楽譜編集アプリです。製品名は **Acorde Composer**、楽譜モデルと決定論的な編集エンジンは既存の [`acorde`](https://github.com/kent-tokyo/acorde) に委譲します。

変更履歴は [CHANGELOG.md](CHANGELOG.md) を参照してください。

## 音楽基盤の依存方針

Composerの音楽処理は `acorde` を唯一の基盤とします。Scoreモデル、MusicXML / MIDI / ABC入出力、編集command、レイアウト、SVG描画、PlaybackEventは、それぞれ `acorde-core`、`acorde-io`、`acorde-layout`、`acorde-render-svg` のAPIを利用します。Tone.js、VexFlow、music21などの別音楽ライブラリは導入しません。Electron側はUI、ファイルダイアログ、IPC、OS固有処理だけを担当します。

現在のComposer engineは、隣接する `acorde` v1.0.8 の5 crateをpath依存かつversion pinして利用します。実 SoundFont のpreset-zone mappingはacorde Issue #15待ちです。

必要な音楽機能が不足している場合は、Composer側に独自の音楽ロジックを複製せず、先に `acorde` 側へ実装してテストしたうえで利用します。

## 現在の縦切り（v0.1.6 + acorde v1.0.8）

- Electron + isolated preload によるクロスプラットフォームUI
- 楽譜キャンバス（実ScoreのSVG表示、選択、範囲選択、再生コントロール、undo/redo）
- 音符のfocus、左右/Home/End keyboard navigation、Shift範囲選択
- 選択中の音符・休符の `⌘/Ctrl+C/V` copy / paste
- score表示の75〜150% zoomとスクロール
- Slur toolによる2音間の`ToggleSlur` command適用
- Tie toolによる隣接音への`ToggleTie` command適用
- Articulation selectorによる基本articulationの`ToggleArticulation` command適用
- Dynamic selectorによる強弱記号（pppp〜ffff、sfz等）の`SetDynamic` command適用
- Grace selectorによるappoggiatura / acciaccaturaの`SetGrace` command適用
- Lyric / Chordボタンによる歌詞音節と基本コード記号の`SetLyric` / `SetChordSymbol` command適用
- `OscillatorAudioBackend`境界とMixerのmaster / part volume / pan / mute / solo / metronome state（localStorage保存、再生中の変更反映）
- `acorde`のmetronome PlaybackEventを任意でclick音へルーティング
- SoundFontの選択・保存・missing asset確認とoscillator fallback表示
- offline前提のSoundFont asset profile（provider / license / version / portability）
- decoderが返すPCMのWeb Audio実sample再生（cache、root note pitch変換、loop、velocity envelope、sustain、release、polyphony制限）とoscillator fallbackの共存
- decoder → renderer間のPCM format、loop、root note、digest、サイズ上限を検証するsample contract
- acorde v1.0.8のSF2 PCM / SF3 Vorbis decode結果をengine JSON IPCから受け取るbounded sample API
- OMR review queueのstatus filter、confidence / bbox表示、accept / reject操作（Scoreへ自動適用しない）
- OMR review itemのcorrection入力とbbox navigation target通知（proposal状態のみ）
- sample contractをElectron main/preload IPCへ接続し、decoder出力をrenderer前に検証
- `acorde`の`AddPart` / `DeletePart` commandによるpart追加・削除とpart数表示
- `AddStaff` / `DeleteStaff` / `SetPartName` commandによるstaff操作・part名編集
- active part selectorによる操作対象partの切り替え
- `Score::extract_part`によるactive partのMusicXML export
- `acorde-render-svg`を使ったSVG exportとprint preview
- A4 / Letter / Compact page preset、Portrait / Landscape向き、標準 / 狭い / 広い余白によるPDF・印刷プレビュー設定
- 印刷設定（用紙・向き・余白）のlocalStorage保存と再起動後の復元
- PDF書き出し前に用紙・向き・余白をdiagnosticsとして表示
- PDF / 印刷プレビューで実寸page geometryとprintable areaをdiagnosticsとして表示
- SVG書き出し時に実出力のwidth / height / viewBox geometryをdiagnosticsとして表示
- SVG geometryのwidth / height / viewBoxが正の数値か検証し、不正な出力をWarningとして表示
- 印刷プレビュー開始時にも同じページ設定をdiagnosticsとして表示
- `render_svg_metadata`によるvector glyph / accessible text diagnostics
- Newで空の1小節譜面を作成し、`acorde-io`経由でロード
- AI Studio: 編曲提案を `ScoreCommand` として適用するUI
- Import / OMR: OMRプロバイダーを接続するための確認UI
- OMR provider manifest、license gate、draft MusicXML、confidence、source bbox、review状態の安全な境界（Scoreへ直接適用しない）
- OMR providerのsuccess / failed / timeoutを正規化し、失敗時にScore proposalを生成しない復旧境界
- OMR review queueの一覧・status filter・accept/reject/correct遷移をmain / preload IPCから利用可能
- OMR画像 / PDF入力は拡張子・サイズに加えてPNG/JPEG/PDFシグネチャもpreflightで検証
- 外部OMR/AI executableを接続するJSON stdin/stdout runtime（shellなし、timeout、出力上限、異常終了復旧）
- `acorde-io` を使ったMusicXML / MXL / MIDIのOpen / Export IPC境界とdiagnostics表示
- `acorde-io` を使ったABCのOpen / Export IPC境界とdiagnostics表示
- メインプロセス管理の最大8件recent files履歴と番号指定再オープン
- MusicXML / MIDI / ABCのparse → serialize → parse round-trip smoke tests（音符・休符・音価・付点等を比較）
- score file / sidecar requestのサイズ上限と境界値テスト
- `acorde-render-svg` による実ScoreのSVG描画
- Rust `ScoreEngine` によるcommand適用、undo / redo、音価・音高・拍子・調号編集
- `acorde` のPlaybackEvent / playback positionを使ったWeb Audio再生と小節・拍表示
- AI提案を複数操作のbatch `ScoreCommand`として表示し、操作単位のdiff preview後にatomic適用またはReject
- 外部AI providerのlicense / network / サイズ検証、機密フィールドredaction、timeout復旧、validated command proposal境界
- 外部AI provider呼び出しのbounded rate limitとretry timing
- release metadataによるversion / commit / target / acorde engine version / build type / signature / checksumの検証
- IPC境界でのcommand schema検証（対応operation、非負index、空batch、64操作上限）
- notation commandのJSON IPCから`acorde::Command`適用までのRust回帰テスト
- Historyダイアログによる適用済みScoreCommandとUndo/Redo件数の確認
- Import/Export/Render diagnosticsのJSON保存
- Score settingsからlyricist / copyright metadataを編集
- Score settingsからwork number / movement title metadataを編集
- 選択中小節へのrehearsal markとmeasure-level tempoの設定・解除
- Hairpin toolによる選択音符間のcrescendo / diminuendo設定
- Repeat Start / Repeat Endによる選択小節の反復境界設定・解除
- Navigation / VoltaによるSegno・Coda・Fine等とending番号の設定・解除
- Expressionによるdolce等の小節表現記号とCueによるcue note切替
- Notehead（Normal / Diamond / X / Triangle）とFingering（0〜5）の設定
- Ottava toolによる8va / 8vb / 15ma / 15mb範囲の設定・解除
- String / Techniqueによる弦番号とBend・Slide等の奏法設定
- Pedal toolによる選択音符間のペダル範囲設定
- ArpeggioとTrill lineによる和音アルペジオ・トリル範囲設定
- Technique textによるpizz. / arco / con sord.等の設定・解除
- Multi-rest、Page break、System breakの選択小節への設定・解除
- Part groupによる複数partのBracket / Brace / Lineグルーピング
- Stemによる選択音符のstem方向（Auto / Up / Down）設定
- Web MIDI APIによるMIDIキーボードの四分音符入力（AddNote経由）
- Web MIDI入力の選択位置挿入、接続状態表示、同一ボタンからのdisconnect
- 複数MIDI deviceの選択、接続中の切替、選択device IDの保存・優先復元
- ABC notation（テキスト楽譜）のOpenとExport（`acorde-io`のABC parser / serializer経由）
- Shift選択した小節だけを先頭から一回再生するSelection playback
- 複数staff / voice、ABC非対応notation、未対応metadataを含むABC exportでは、失われる可能性をdiagnosticsで警告
- 保存済みMixer stateの値域正規化と、score変更時の不要part channel清掃

AIやOMRの出力をScoreへ直接反映しないことが設計上の重要な契約です。現在のAIデモ提案も `ScoreCommand` としてRust adapterへ渡し、acorde-coreの `ScoreEngine` で検証・適用します。

## 開発

```sh
npm install
npm run check
npm start
```

`npm run start` は依存関係をインストールした後に実行してください。開発時は隣接する `acorde` v1.0.8リポジトリをsidecarのpath dependencyとして参照します。配布用には `ACORDE_ENGINE_BIN` でビルド済みsidecarを指定します。`npm test` にはファイルサイズ境界と新規テンプレート契約のテストが含まれます。

`npm run pack` でmacOS arm64のElectronディレクトリ配布物を生成できます。開発環境ではコード署名とアプリ固有アイコンは未設定です。

公開対象リリース：[Acorde Composer v0.1.6](https://github.com/kent-tokyo/acorde-composer/releases/tag/v0.1.6)。現在の作業ツリーでは`npm test` 90件、Rust 17件、構文・差分検証を確認しています。

## 次の実装単位

1. PDFのfont / glyph diagnosticsとclipping検証を強化する（page geometryは接続済み）
2. 複数voiceのUI編集シナリオとSoundFontのpreset-zone実接続を進める
3. optional SoundFont実providerをlicense・配布条件とともに評価する（SF3 Vorbisはfeature経由、実音源assetは未同梱）
4. OMR/AI providerの実 executable、認証情報、利用許諾を選定してruntime adapterへ接続する
5. 署名証明書とclean macOS/Windows環境を用意してpackaging QAを実施する

アクセシビリティ設定（reduced motion / high contrast）は Score settings から変更でき、ローカルに保存されます。譜面上の音符はキーボードフォーカスとARIA labelを持ちます。

複数voiceを含む譜面では、編集toolbarのVoice selectorまたは`[` / `]`キーで入力・選択対象のvoiceを切り替えられます。

選択中の音符は編集toolbarからsharp / flat / naturalを適用できます。
音価の横のDotを有効にすると、付点音符・付点休符の入力と変更ができます。
Tuplet selectorから3:2（三連符）または5:4（五連符）を新規音符へ適用できます。選択音符には既存のSetTuplet commandで適用・解除できます。
Dynamic selectorから選択音符へ強弱記号を設定・解除できます。Grace selectorからappoggiatura / acciaccaturaを設定・解除できます。
選択音符にLyricまたはChordを設定すると、`acorde`の構造化notationとして保存・再出力されます。空入力で解除できます。
Score settingsで変更したタイトル・テンポ・パート名は、編集画面の譜面ヘッダーにも反映されます。
再生音源は検証用oscillator fallbackで、停止時とウィンドウ終了時にAudioContextを解放します。
Mixerではpartごとのvolume / pan / mute / soloを保存し、`acorde`のPlaybackEventのpart indexに従ってルーティングします。再生中のmaster / part channel変更も即時反映します。
Active partはMusicXMLとMIDIの両方へ個別に書き出せます。
Score settingsではactive partのMIDI channelとGeneral MIDI programも編集できます。
同じ画面から選択中staffの移調（半音単位）も設定できます。
選択中staffのclef（Treble / Bass / Alto / Tenor）も同じ設定画面から変更できます。
複数staffのpartでは、score metaのStaff selectorで設定対象staffを切り替えられます。
Score metaのPart Viewボタンでfull scoreとactive part表示を切り替えられます。
