# Release QA evidence

対象アプリは Acorde Composer `0.1.12`、engine依存は `acorde` `1.1.3`です。コード上の回帰検証はNode 178件、Rust unit test 20件が成功していますが、これらはmacOS／Windows実機のpackaged-app QAを代替しません。

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

schema migrationはv1の主要フィールドとdigestを検証してからv2へ移行し、`migration.sourceSchemaVersion: 1`を追加します。未知の必須値、型違い、digest不一致、future versionは拒否します。実装・fixture・CLI検証は`electron/release-qa.cjs`、`qa/release-qa-schema-migration-fixtures.json`、`qa/release-qa-v2-fixture.json`で管理します。

notation coverageの個別fixtureは、`npm run check:notation`で単独検証でき、通常の`npm run check`にも含まれます。matrix schema、fixture存在、`score-partwise`、要素固有markerを検査します。release QAの20シナリオfixtureは`npm run check:release-fixtures`でも検証し、入力整合性とrelease readiness（実機結果）を分離します。

性能測定の再現条件は`qa/performance-benchmark.json`で固定し、1小節の複数voice smoke、100小節、1,000小節、10,000小節のlong-score fixtureを登録しています。長大fixtureは`node scripts/generate-performance-fixture.cjs <measures>`で再生成できます。`npm run check:performance-fixtures`または通常の`npm run check`でfixture、measure数、engine version、metrics、反復範囲を検証し、`node scripts/benchmark-engine.cjs <fixture> 3`でparse/load/renderの実測を再実行できます。実機別の性能閾値、長時間再生・memory基準はまだ未確定です。

全profileの実測結果は`npm run bench:performance`で`qa/performance-benchmark-results.json`へ保存し、`npm run check:performance-results`でschemaを検証できます。baselineとcandidateの各profileのp95を`npm run compare:performance -- <baseline> <candidate> 20`で比較し、20%超の退行をCLI終了コード1として検出します。

候補版のローカル検証は`npm run check:candidate`で実行できます。Nodeテスト、静的・fixture検証、Playground、Rust test、clippy、`git diff --check`を固定順で実行します。これは署名、Windows実機、clean machine、外部providerの品質確認を代替しません。

cold startは`npm run bench:cold-start`で100小節fixtureをengine新規起動ごとに測定し、`qa/performance-cold-start-results.json`へ保存します。`npm run check:cold-start-results`で結果schemaを検証します。OS・CPU・build profileに依存するため、固定thresholdは未設定です。

playbackは`npm run bench:playback`で1,000小節fixtureのparseと`playback_events`生成を測定し、イベント数とbenchmark harness自身のRSS増分を`qa/performance-playback-results.json`へ保存します。`npm run check:playback-results`でschemaを検証します。RSSはengine processの実RSSではなく、JSON IPCを保持するharness側の参考値です。

render pipelineは`npm run bench:render`でlayout、SVG生成、SVG metadata生成、同一scoreのrepeat renderを測定し、`qa/performance-render-results.json`へ保存します。repeat renderは差分再描画の前段となる再描画コストの基準であり、UIの実差分更新とは分離しています。

## Current local blocker

2026-09-06時点のmacOS arm64 packaged appは、最新`npm run pack` artifactに`Contents/Resources/engine/acorde-composer-engine`を同梱し、acorde 1.1.3の実engineで複数voice fixtureをOpen → title edit → dirty表示 → MusicXML save → saved file reloadまで確認済みです。保存XMLの`voice` 1/2と`backup`、再Open後のタイトル、voice 1/2 selector切替を確認しました。Score settingsのApply経路も、native dialogのsubmit競合を避ける直接handlerと`type="button"`へ修正し、回帰テスト済みです。外部OMR/AIは実行可能なprovider binary・license・ユーザー同意が必要で、設定readiness境界までをローカル検証済みです。Windows実機、クリーンマシン、署名済みinstaller、実provider品質は未検証として記録します。
