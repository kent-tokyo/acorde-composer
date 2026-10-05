# MusicXML移行の確認手順

Acorde Composerへ既存のMusicXMLを移すときは、元ファイルを上書きせず、diagnosticsと再読込結果を確認します。

## 手順

1. 元ソフトからMusicXMLをコピーとして書き出す。
2. Composerで開き、未対応要素やloss diagnosticsを確認する。
3. Note InputのVoices groupで対象voiceを選び、タイトルや音符・休符を編集する。
4. 別名で保存する。
5. 保存ファイルを再読込し、voice番号、`backup` / `forward`、rest padding、歌詞、コードを確認する。
6. 必要に応じて、再生イベントのaddressとSVG表示を確認する。

## 複数voiceの確認

`qa/fixtures/multivoice-ui.musicxml`はvoice 1/2と`backup`を含みます。parse → edit → save → reloadのdevelopment UI契約はUI contract testsと`npm run test:workspace`で確認します。

Acorde v1.2.4以降は宣言済みstaffとcross-staffをmaterializeします。構造round-trip fixtureはありますが、v0.2.3の20件のpackaged manual QAは`not-run`のため、Windows、信頼済み署名artifact、clean machineを含む配布品質は未検証です。

## 確認できないもの

全ての記譜要素が完全に編集できること、外部音源で同じ音色が再現されること、印刷結果が他製品と一致することは、このfixtureだけでは証明できません。未対応要素はdiagnosticsに残し、移行後のMusicXMLを別名で保存してください。
