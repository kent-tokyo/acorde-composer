# Acorde Composer

MusicXML、MIDI、ABCに対応する、ローカル処理中心の楽譜編集アプリです。音楽処理には[`acorde`](https://github.com/kent-tokyo/acorde)だけを使い、ElectronはUI、ファイル操作、外部プロバイダーとの境界を担当します。

[English](README.md) · [中文](README_zh.md) · [デスクトップ版](https://github.com/kent-tokyo/acorde-composer/releases) · [ブラウザ版Playground](https://kent-tokyo.github.io/acorde-composer/playground/)

## 試す・インストールする

最新の公開版は **v0.2.4**（`acorde` v1.2.17）です。再生ツールバー、新規作成／エクスポート画面、小節操作、voice交換、音符入力ツールバー、Navigator、ショートカットをMuseScoreの操作に近づけました。Apple Silicon向けmacOS DMGは実験版です。アプリ全体をad-hoc署名して厳密に検証していますが、Developer ID署名も公証もないため、Gatekeeperに止められる場合があります。[GitHub Releases](https://github.com/kent-tokyo/acorde-composer/releases)以外から取得しないでください。止められた場合は、FinderでアプリをControlクリックして**開く**を選びます。

[ブラウザ版Playground](https://kent-tokyo.github.io/acorde-composer/playground/)では編曲を短く試せます。同梱の旋律を選ぶかMusicXML・ABCを読み込み、ベースと和音、または別の旋律声部を加えて、原曲と編曲を聴き比べられます。結果はMusicXMLで書き出せます。より広い楽譜編集にはデスクトップ版を使います。

## 主な機能

- MusicXML、MIDI、ABCの編集・交換、SVG描画、PDF／印刷入口
- 音符・休符・テキスト・基本記譜・小節・voiceの編集、undo／redo、コピー保存、エクスポート、再読込
- MuseScoreに近いHome／Score／Publish、Palettes、Instruments、Properties、part、Navigator、Timeline、Piano、Mixer、workspace、ショートカット
- `acorde`の再生データを使ったoscillatorまたは検証済みSF2／SF3 PCM再生
- AI／OMR提案を確認してから適用するreview workflow

## 現在の制約

native VST、実運用OMR／AIプロバイダー、MuseSounds相当の同梱音源、信頼済みDeveloper ID／Authenticodeインストーラー、Windows packaged QA、clean-machine QAは未完了です。大規模SoundFontにはfile／stream転送経路が必要です。SoundFont、MuseSounds asset、VST binary、プロバイダー認証情報、OMR binaryは同梱しません。

正確な対応範囲は[feature matrix](docs/feature-matrix.md)、外部assetの条件は[NOTICE.md](NOTICE.md)を参照してください。

## 安全なMusicXML移行

1. 元ソフトからコピーとして書き出す。
2. 開いてdiagnosticsを確認してから編集する。
3. 別名で保存し、保存ファイルを再読込する。
4. voice、rest、`backup`／`forward`、歌詞、コード、重要な記譜要素を確認する。

元ファイルは上書きしないでください。詳細は[選定・移行ガイド](docs/choosing-and-migrating.md)にあります。

## 開発と検証

```sh
npm install
npm test
npm run check
npm run test:workspace
npm run test:playground
```

`npm run pack`はローカルpackageとartifact manifestを生成します。`npm run check:candidate:strict`はテストとAcorde provenanceを確認しますが、署名済みpackageや実機QAの代わりではありません。20件の手動release scenarioは別ゲートであり、`not-run`は合格ではありません。

[ドキュメント一覧](docs/README.md)、[QAガイド](qa/README.md)、[CHANGELOG](CHANGELOG.md)から詳細を確認できます。
