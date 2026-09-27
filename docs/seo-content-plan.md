# SEO・公開コンテンツ方針

検索語を繰り返すのではなく、譜面編集の疑問へ具体的に答え、実装と証跡を示してPlaygroundまたはダウンロードへ案内します。

## 検索意図と入口

| 検索意図 | 入口 | 読者が確認できること |
| --- | --- | --- |
| MusicXML編集 | README | 対応形式、編集範囲、Playground |
| 形式移行・複数voice | 選定・移行ガイド | 別名保存、再読込、loss確認 |
| AI／OMR | AI安全設計 | proposal reviewと外部provider境界 |
| SoundFont再生 | README、SoundFont checklist | 対応範囲、asset、license |
| 他製品からの移行 | 選定・移行ガイド | 向く用途、未検証範囲、UI配置 |

## 公開ルール

- 1ページ1目的とし、READMEは概要、移行ガイドは選定と移行、QAは証跡に集中させる。
- 対応形式、`acorde`依存、外部provider、SoundFont、署名、Windows QAを実装と同じ表現で記載する。
- 主要な主張からfixture、テスト、artifact、QAへリンクする。
- 条件のない性能・精度・価格・互換性の比較を載せない。
- 未実装の実OMR、MuseSounds相当音源、native VST、署名済みinstallerを利用可能と書かない。

## 移行導線

1. 向く用途と向かない用途を同じページに示す。
2. 元ソフトからMusicXMLをコピーとして書き出す。
3. Open → diagnostics → edit → Save As → reloadを案内する。
4. 無料の入口をPlayground、native buildをexperimental GitHub Releaseと明記する。
5. 実機QA、音源license、印刷品質などの未完了条件を隠さない。

## 更新時の確認

- releaseごとにREADME、CHANGELOG、package metadataを照合する。
- 実機結果は`qa/release-qa-results.json`を正とし、コードテストと混ぜない。
- 比較点数は対象version、OS、入力、測定条件が揃う場合だけ公開する。
- providerや音源条件が変わったらREADME、移行ガイド、NOTICEを同時に点検する。
