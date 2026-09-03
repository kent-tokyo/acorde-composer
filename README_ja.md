# Acorde Composer

Windows／macOS向けのAI支援楽譜編集アプリです。製品名は **Acorde Composer**。楽譜モデルと決定論的な音楽処理は、既存の [`acorde`](https://github.com/kent-tokyo/acorde) に委譲します。

## 特徴

- MusicXML、MIDI、ABCの読み込み・編集・書き出し
- 実ScoreのSVG表示、PDF／印刷プレビュー、undo／redo
- 複数voiceの選択、キーボード操作、voice-aware playback address
- 音符・休符、歌詞、コード記号、強弱、装飾音、アーティキュレーション編集
- part／staff編集、パート書き出し、Mixer、Web MIDI入力
- AI／OMR提案を確認してから適用する安全なproposal workflow
- SoundFontの状態表示、PCMサンプル再生、oscillator fallback
- macOS／Windows向けElectron UIとbounded JSON IPC

## 音楽ライブラリの方針

音楽処理は `acorde` を唯一の基盤とします。Scoreモデル、MusicXML／MIDI／ABC入出力、編集command、レイアウト、SVG描画、PlaybackEventは `acorde` のAPIを利用します。Tone.js、VexFlow、music21などの別音楽ライブラリは使用しません。

現在は `acorde` v1.0.9の5 crateをpath依存かつversion pinして利用しています。必要な音楽機能が不足している場合は、Composer側で重複実装せず、先に `acorde` 側へ実装してテストします。

## 現在のリリース

**Acorde Composer v0.1.8**（`acorde v1.0.9`）

AI／OMRの出力は直接Scoreへ適用せず、検証済みの `ScoreCommand` proposalとしてレビューできます。基本の編集・再生・入出力はローカルで動作します。外部providerはlicense、timeout、サイズ、クラッシュ復旧の境界外で接続します。

## 既存ソフトからの移行

MusicXMLをコピーとして書き出し、Acorde Composerで開いてdiagnosticsを確認します。編集後は別名で保存し、保存ファイルを再読込してvoice、rest、backup／forward、歌詞、コード、主要記譜情報を確認してください。

[選定・移行ガイド](docs/choosing-and-migrating.md)では、比較軸、移行手順、FAQ、未対応範囲を説明しています。[SEO・競合流入コンテンツ設計](docs/seo-content-plan.md)では、検索意図と公開表現のルールを整理しています。

## 重要な制約

Acorde ComposerはDAW、完成された商用記譜ソフト、MuseSoundsそのもの、汎用OMRサービスの代替を保証しません。完全な複数voice編集、実SoundFont zone materialization、MuseSounds相当音源、実OMR provider、署名済みinstallerは別の検証ゲートです。SoundFont asset、外部音源、providerのlicenseと配布条件は別途確認してください。

## 開発

```sh
npm install
npm run check
npm test
npm start
```

`npm run pack`はElectron配布物とchecksum／SBOM／NOTICE／provenanceを束ねたartifact manifestを生成します。release QAは次のコマンドで実行できます。

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

現在の検証結果はNode 152件、Rust unit test 18件です。これは署名済み配布物やmacOS／Windows実機QAの代替ではありません。詳細は[QA evidence](qa/README.md)、[CHANGELOG](CHANGELOG.md)、[GitHub Release v0.1.8](https://github.com/kent-tokyo/acorde-composer/releases/tag/v0.1.8)を参照してください。

## ライセンスと外部asset

Composerはリポジトリ内にOMR provider、AI service、MuseSounds asset、SoundFont asset、VST binaryを同梱しません。ユーザーが追加するproviderやassetは、それぞれのlicense、認証情報、再配布条件、対象OS要件に従います。[NOTICE.md](NOTICE.md)も確認してください。
