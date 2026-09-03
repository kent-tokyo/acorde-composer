# SEO・競合流入コンテンツ設計

この文書は、Acorde Composerの検索流入と導入検討を支える公開コンテンツの設計を固定する。目的は検索順位のためのキーワード反復ではなく、譜面編集の具体的な課題を解決し、実装と証跡を確認したうえでダウンロードへ案内することとする。

## 検索意図と入口

| 検索意図 | 主な語句の例 | 入口 | 読者が得るもの | CTA |
| --- | --- | --- | --- | --- |
| 譜面編集 | MusicXML editor、楽譜編集、score editor | README | 対応形式、編集範囲、導入条件 | Release |
| 形式移行 | MusicXML edit、ABC notation editor、MIDI export | 選定・移行ガイド | 移行手順、loss確認、再読込手順 | Migration checklist |
| 複数voice | multiple voice MusicXML、voice notation | 移行ガイド＋QA | voice保持の確認方法と制約 | QA evidence |
| AI編曲 | AI music notation、AI score editor | README | proposal確認、Reject、provider境界 | 安全な試用導線 |
| 音源・再生 | SoundFont editor、SF2／SF3 playback | README＋FAQ | fallback、外部asset、license境界 | 音源要件を確認 |
| 代替製品の検討 | notation software alternative、lightweight score editor | 選定・移行ガイド | 製品名ではなく比較軸での選定 | 要件チェック |

## ページごとの作成ルール

- titleと冒頭文で「Acorde Composer」「楽譜編集」「MusicXML」など、ページ固有の主題を明示する。
- 1ページ1検索意図とし、READMEは製品概要、移行ガイドは比較・移行、QA文書は証跡に集中させる。
- 対応形式、`acorde`依存、外部provider、SoundFont、署名、Windows QAの状態を実装と同じ表現で記載する。
- 主要主張には、操作手順、fixture、テスト、release artifactなど、読者が追跡できる証拠へのリンクを付ける。
- 競合製品を名指しして未検証の性能・精度・価格・互換性を比較しない。「どの要件を確認すべきか」という比較軸で案内する。
- 未実装のMuseSounds相当音源、実OMR provider、完全な複数voice編集、署名済みinstallerを、利用可能な機能として表現しない。

## 競合からの移行導線

1. 読者の課題を「MusicXMLを確認したい」「軽く編集したい」「AI提案を確認してから適用したい」のように具体化する。
2. Acorde Composerが向く条件と向かない条件を同じページで示す。
3. 元ソフトからMusicXMLをコピーとして書き出す手順を示す。
4. Open → diagnostics確認 → 編集 → 別名保存 → 再読込の順で安全な試用を案内する。
5. 実機QA、音源license、印刷品質、完全なvoice保持が必要な読者には、未完了ゲートを明示して判断を委ねる。

この導線では、既存製品を否定するのではなく、データ保持・レビュー可能性・ローカル処理・`acorde`中心の設計というComposerの選択理由を提示する。

## 証拠と更新周期

- READMEの対応機能と公開バージョンは、releaseごとにCHANGELOGとpackage metadataを照合する。
- QAの実機結果は、コードテスト結果と混ぜず、`qa/release-qa-results.json`のevidenceを正とする。
- 競合比較の点数や「代替できる」という表現は、対象バージョン・対象OS・測定条件がない限り公開しない。
- 外部providerや音源assetの接続条件が変わった場合は、README、選定・移行ガイド、NOTICEを同時に点検する。

## 次に作ると効果が高いページ

1. MusicXML移行の実例（single voice／multiple voice／loss diagnostics）
2. ABC notationとMusicXMLの使い分けガイド
3. AI提案をレビューして適用する安全設計の解説
4. SoundFont／外部音源のlicense確認チェックリスト

各ページは、実装またはfixtureで確認できる範囲から作成し、未検証の検索需要や競合優位性を推測で補わない。
