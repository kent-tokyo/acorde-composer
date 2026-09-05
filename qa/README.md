# Release QA evidence

対象アプリは Acorde Composer `0.1.10`、engine依存は `acorde` `1.1.1`です。コード上の回帰検証はNode 169件、Rust unit test 20件が成功していますが、これらはmacOS／Windows実機のpackaged-app QAを代替しません。

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

## Current local blocker

2026-09-05時点のmacOS arm64 packaged appは、最新`npm run pack` artifactに`Contents/Resources/engine/acorde-composer-engine`を同梱し、acorde 1.1.1の実engineで複数voice fixtureをOpen → title edit → dirty表示 → MusicXML save → saved file reloadまで確認済みです。保存XMLの`voice` 1/2と`backup`、再Open後のタイトル、voice 1/2 selector切替を確認しました。Score settingsのApply経路も、native dialogのsubmit競合を避ける直接handlerと`type="button"`へ修正し、回帰テスト済みです。外部OMR/AIは実行可能なprovider binary・license・ユーザー同意が必要で、設定readiness境界までをローカル検証済みです。Windows実機、クリーンマシン、署名済みinstaller、実provider品質は未検証として記録します。
