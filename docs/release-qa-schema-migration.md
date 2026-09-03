# Release QA schema migration

この文書は、release QA report schema v1からv2へ移行するための設計を固定する。

## v1からv2への契約

- `product`、`version`、`commit`、`qa`、artifact evidence、`reportDigest`の意味と既存値を保持する。
- v2は既存フィールドを削除・改名せず、追加フィールドだけを導入する。
- migrationは入力reportのv1 digestを検証してから行い、v2 schema versionを設定してdigestを再計算する。
- v2には`migration.sourceSchemaVersion: 1`を追加し、変換元を追跡できるようにする。
- 不明な必須値、型違い、digest不一致、future versionはmigrationせず拒否する。
- CLIはmigration結果をJSONで出力し、`migrated`と診断内容を明示する。

## 採用ゲート

1. v1 fixtureのreport digestが一致する。
2. v1→v2→serialize→parseで主要フィールドが保持される。
3. v2の追加フィールドがv1 validatorを壊さない。
4. v2未対応環境では、v2入力を黙ってv1として扱わない。

v1からv2へのmigrationは実装済みで、fixtureでは `migrate-v1-only` として扱う。v2からさらに先のversionは未定義のため拒否する。
