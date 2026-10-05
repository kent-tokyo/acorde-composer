# Acorde Composer 選定・移行ガイド

## 向いている用途

- MusicXML、MIDI、ABCを開き、軽く編集して書き出す
- 複数voiceを選び、音符、休符、テキスト、歌詞、コードを修正する
- AI／OMR提案を自動適用せず、差分を確認してから反映する
- `acorde`中心のローカル処理とElectron UIを使う

DAW、成熟した商用記譜ソフト、MuseSounds、汎用OMRサービスの完全な代替ではありません。音源品質、印刷品質、provider精度、署名済み配布が必須なら、実データと対象OSで先に確認してください。

## 選定時の確認項目

| 項目 | 現在の方針 | 導入前の確認 |
| --- | --- | --- |
| 楽譜データ | `acorde`のScoreとMusicXML／MIDI／ABC | 保存・再読込後のdiagnosticsと構造 |
| 複数voice／staff | voice番号、staff、playback addressを保持 | 対象voiceとcross-staffを実譜面で確認 |
| AI／OMR | proposalをレビュー後にcommandとして適用 | Reject、送信先、license、privacy |
| 再生 | oscillatorまたは検証済みSoundFont PCM | asset、音色、長時間再生、配布license |
| 配布 | manifest、checksum、SBOM、NOTICE、QA report | 署名、対象OS、clean-machine QA |

公開版v0.2.3はAcorde v1.2.17を使います。native VST、実provider、MuseSounds相当音源、信頼済みDeveloper ID／Authenticode installer、Windows packaged QAは未完了です。

## MuseScoreから移る場合

主要な操作はFile／Edit／View／Add／Format／Toolsに分け、左側はPalettes／Instruments／Properties、下側はNavigator／Timeline／Pianoを配置しています。音符入力はInput／Duration／Rhythm／Voices／Notationの順です。完全な互換配置ではないため、最初にHomeからテスト用コピーを開き、保存先とvoiceを確認してください。

## MusicXML移行手順

1. 元ソフトからMusicXMLをコピーとして書き出す。
2. Composerで開き、lossや未対応要素のdiagnosticsを確認する。
3. 対象のvoice／staffを選び、必要な箇所だけ編集する。
4. 別名で保存し、保存ファイルを再読込する。
5. voice、rest、`backup`／`forward`、歌詞、コード、cross-staff、主要記譜を確認する。
6. 必要なら再生、SVG、PDF／印刷結果も確認する。

元ファイルは上書きしないでください。詳細なfixture手順は[MusicXML移行の確認手順](musicxml-migration-example.md)にあります。

## 関連文書

- [機能と未検証範囲](feature-matrix.md)
- [ABCとMusicXML](abc-and-musicxml.md)
- [AI提案の安全設計](ai-proposal-safety.md)
- [SoundFont・外部音源チェックリスト](soundfont-license-checklist.md)
- [Release QA](../qa/README.md)
