# Acorde Composer 選定・移行ガイド

## どのような人に向くか

Acorde Composerは、既存の記譜ソフトをすぐに置き換えることよりも、次のようなワークフローを軽く始めたい人に向きます。

- MusicXML、MIDI、ABCを読み込み、内容を確認して編集したい
- 複数voiceの譜面を確認しながら、音符・休符・歌詞・コードを変更したい
- AIやOMRの提案を、適用前にレビューしたい
- `acorde`を音楽処理の基盤として使い、ElectronのデスクトップUIで作業したい
- macOSまたはWindowsで、保存・再生・PDF／印刷まで一つのワークフローにまとめたい

## 既存の記譜ソフトとの比較軸

製品名やベンチマークの優劣ではなく、選定時に確認すべき軸を比較します。

| 比較軸 | Acorde Composerの方針 | 確認ポイント |
| --- | --- | --- |
| 譜面データ | `acorde`のScoreを中心にMusicXML／MIDI／ABCを処理 | 保存前後のdiagnosticsとround-tripを確認 |
| AI支援 | proposalを確認してからcommandとして適用 | 自動適用ではなくRejectできるか |
| 複数voice | voice番号とPlaybackEvent addressを意識した編集 | 対象voiceを選択して保存・再読込できるか |
| 再生 | `acorde`のPlaybackEventとWeb Audioを利用 | SoundFontがない場合はoscillator fallbackになる |
| 外部拡張 | OMR／AI／pluginをbounded runtimeの外側に隔離 | license、timeout、サイズ上限、クラッシュ復旧 |
| 配布 | artifact manifest、checksum、SBOM、NOTICE、QA reportを生成 | 署名と実機QAは別途実施が必要 |

Acorde Composerは、DAW、完成された商用記譜ソフト、MuseSoundsそのもの、汎用OMRサービスの代替を主張しません。導入前に、必要な音源・OMR精度・印刷品質・署名済み配布物が要件を満たすか確認してください。

## MusicXMLからの移行手順

1. 元のソフトからMusicXMLをコピーとして書き出します。
2. Acorde Composerで開き、diagnosticsに表示されるlossや未対応要素を確認します。
3. voice selectorで対象voiceを選び、必要な編集を行います。
4. 別名でMusicXMLを保存します。
5. 保存したファイルを再読込し、voice、rest、backup／forward、歌詞、コード、主要記譜情報を確認します。
6. 印刷や音源が必要な場合は、対象OSと外部assetのlicense・配布条件を確認します。

元ファイルを上書きせず、移行前後のファイルを残す運用を推奨します。Composer側にはresolved SoundFont zoneを受け取るadapterがありますが、acorde側の公開metadata境界（Issue #17）が必要です。完全な複数voice編集、実SoundFont zone materialization、MuseSounds接続、実OMR provider、コード署名済み配布は完了条件から分離されています。

## FAQ

### Acorde Composerはどの音楽ライブラリを使いますか？

音楽処理は隣接する`acorde`のみを使用します。Tone.js、VexFlow、music21などの別音楽ライブラリは導入しません。

### AIは勝手に譜面を書き換えますか？

いいえ。AI／OMRの結果はprovider境界とreview queueを経由し、確認後に`ScoreCommand`として適用します。

### SoundFontやMuseSoundsは同梱されますか？

同梱しません。SoundFont asset、MuseSounds相当の外部音源、license、配布条件は利用者または配布者が別途確認する必要があります。音源がない場合はoscillator fallbackを使用します。

### 既存の記譜ソフトを完全に置き換えられますか？

現時点では置き換えを保証しません。MusicXMLの保持、複数voice、印刷、外部音源、OMR、署名済み配布の要件を実データと対象OSで確認してから判断してください。

## 関連リンク

- [README](../README.md)
- [変更履歴](../CHANGELOG.md)
- [Release QA evidence](../qa/README.md)
- [Release QA schema migration](release-qa-schema-migration.md)
