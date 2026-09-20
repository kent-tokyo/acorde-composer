# AI提案をレビューして適用する安全設計

Acorde ComposerのAI／OMR結果は、Scoreへ直接書き込みません。外部入力は未信頼データとして扱い、検証済みの`ScoreCommand` proposalに変換してからレビューします。

## 処理境界

1. provider設定のlicense、network policy、入力サイズ、redactionを確認する。
2. providerの応答をbounded JSONとして受け取る。
3. proposalのschema、操作数、index、payloadを検証する。
4. diffを表示し、accept / reject / correctを選べる状態にする。
5. accept時だけatomic command batchとしてScoreへ適用する。
6. timeout、異常終了、未承認providerではScoreを変更せずdiagnosticsを残す。

deterministic demo providerと外部JSON provider adapterの安全境界はローカルテスト済みです。実provider binary、認証、license、品質評価は外部依存のため未完了です。

## 利用者が確認すること

- 提案対象の範囲が意図した選択範囲か
- 変更内容がdiffで説明されているか
- 未対応要素や低信頼結果が自動適用されていないか
- Reject後に元のScoreが変化していないか

AI providerを有効にする場合は、入力データの送信先、保存方針、license、ネットワーク同意を別途確認してください。
