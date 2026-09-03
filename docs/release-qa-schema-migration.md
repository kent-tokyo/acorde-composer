# Release QA schema migration

この文書は、現在のrelease QA report schema v1から将来のv2へ移行するための設計を固定する。v2の実装・採用はまだ行わない。

## v1からv2への契約

- `product`、`version`、`commit`、`qa`、artifact evidence、`reportDigest`の意味と既存値を保持する。
- v2は既存フィールドを削除・改名せず、追加フィールドだけを導入する。
- migrationは入力reportのv1 digestを検証してから行い、v2 schema versionを設定してdigestを再計算する。
- 不明な必須値、型違い、digest不一致、future versionはmigrationせず拒否する。
- CLIはmigration結果をJSONで出力し、`migrated`と診断内容を明示する。

## 採用ゲート

1. v1 fixtureのreport digestが一致する。
2. v1→v2→serialize→parseで主要フィールドが保持される。
3. v2の追加フィールドがv1 validatorを壊さない。
4. v2未対応環境では、v2入力を黙ってv1として扱わない。

現在のv2 fixtureは、実装前のため `reject-until-migration-defined` として扱う。
