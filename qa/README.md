# Release QA evidence

`release-qa-matrix.json`はmacOS arm64とWindows x64の各10シナリオ、合計20シナリオを定義します。結果は`release-qa-results.json`へ同じ`platform`・`arch`・`scenario`キーで記録します。

各結果には次の`evidence`配列を必須とします。

```json
{"kind":"manual","source":"clean-mac-arm64-2026-09-03","detail":"installer launch and first window verified"}
```

`status`は`passed`、`failed`、`not-run`のいずれかです。reportでは`failed`と`notRun`を分離します。`not-run`は未検証として扱われ、公開可能判定を通過しません。`passed`は実測証跡がある場合だけ使用します。

pack後に次を実行すると、artifact manifestと20件の結果を束ねたreportを生成します。

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

出力先は`dist/release-qa-report.json`です。artifact digestと現在HEADのcommitが一致し、全20件がevidence付き`passed`になるまで、CLIは非ゼロ終了します。
