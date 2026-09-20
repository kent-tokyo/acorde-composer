# ABC notationとMusicXMLの使い分け

## MusicXMLを使う場面

- 複数voice、rest、`backup` / `forward`を保持したい
- 歌詞、コード、記譜要素を構造化して編集したい
- 保存後に再読込し、元の構造を確認したい

ComposerではMusicXMLを主な編集・round-trip形式として扱います。複数voiceの確認には`qa/fixtures/multivoice-ui.musicxml`を使えます。

## ABCを使う場面

- 軽量なテキスト表現を共有したい
- 小さな旋律や簡易譜をレビューしたい
- テキスト差分を扱いたい

ABC exportでは、MusicXMLが持つ全ての記譜情報を表現できない場合があります。Composerはglissando、cross-staff、styled textなどのloss条件をdiagnosticsとして表示します。ABCを最終保存形式にする前に、MusicXMLへ戻して再読込し、必要な要素が残っているか確認してください。

## 判断の目安

「構造を保持する」が目的ならMusicXML、「短い旋律を共有する」が目的ならABCを選びます。どちらも、対象fixtureと実際の保存・再読込結果を基準に判断してください。
