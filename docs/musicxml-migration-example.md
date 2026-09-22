# MusicXML移行の確認手順

Acorde Composerへ既存のMusicXMLを移すときは、元ファイルを上書きせず、diagnosticsと再読込結果を確認します。

## 手順

1. 元ソフトからMusicXMLをコピーとして書き出す。
2. Composerで開き、未対応要素やloss diagnosticsを確認する。
3. voice selectorで対象voiceを選び、タイトルや音符・休符を編集する。
4. 別名で保存する。
5. 保存ファイルを再読込し、voice番号、`backup` / `forward`、rest padding、歌詞、コードを確認する。
6. 必要に応じて、再生イベントのaddressとSVG表示を確認する。

## 複数voiceの確認

`qa/fixtures/multivoice-ui.musicxml`はvoice 1/2と`backup`を含むComposer用fixtureです。parse → edit → save → reloadのUI契約は`electron/ui-contract.test.cjs`で固定しています。macOS arm64 packaged smokeでは同じ流れを確認済みですが、Windows実機・署名済みartifact・clean machineの検証は別ゲートです。

cross-staff fixtureは構造round-tripを検証しますが、現行Acordeモデルは宣言済みの複数staffをeditable staffとしてmaterializeできません。packaged編集E2Eは上流 #81 の解決後に再実行します。

## 確認できないもの

全ての記譜要素が完全に編集できること、外部音源で同じ音色が再現されること、印刷結果が他製品と一致することは、このfixtureだけでは証明できません。未対応要素はdiagnosticsに残し、移行後のMusicXMLを別名で保存してください。
