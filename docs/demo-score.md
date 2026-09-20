# Demo score and reproducible walkthrough

公開前の確認に使う代表scoreは`qa/fixtures/multivoice-ui.musicxml`です。voice 1/2、`backup`、複数voiceの編集境界を含み、ComposerのOpen → edit → save → reload導線を確認できます。

## Walkthrough

1. `npm start`でComposerを起動する。
2. `qa/fixtures/multivoice-ui.musicxml`を開く。
3. titleを編集し、voice selectorでvoice 1とvoice 2を切り替える。
4. 別名でMusicXMLを保存する。
5. 保存したファイルを再読込し、voice番号と`backup`が保持されていることを確認する。

このscoreはdemo用fixtureであり、全記譜要素、外部音源、Windows実機、署名済みartifactの品質を代表するものではありません。公開用スクリーンショットや動画を作る場合も、実際のartifactの状態とこの制約表示を一致させてください。
