# Release QA evidence

対象アプリは Acorde Composer `0.1.14`、engine依存は `acorde` `1.2.0`です。コード上の回帰検証件数は本依存更新後の再検証結果に従いますが、ローカル回帰テストはmacOS／Windows実機のpackaged-app QAを代替しません。

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

性能測定の再現条件は`qa/performance-benchmark.json`で固定し、1小節の複数voice smoke、100小節、1,000小節、10,000小節のlong-score fixtureを登録しています。長大fixtureは`node scripts/generate-performance-fixture.cjs <measures>`で再生成できます。登録profileは外れ値の影響を抑えるため20反復で、`npm run check:performance-fixtures`または通常の`npm run check`はfixture、measure数、engine version、metrics、反復範囲を検証します。任意の再測定は`node scripts/benchmark-engine.cjs <fixture> <iterations>`で実行できます。実機別の性能閾値、長時間再生・memory基準はまだ未確定です。

全profileの実測結果は`npm run bench:performance`で`qa/performance-benchmark-results.json`へ保存し、`npm run check:performance-results`でschemaを検証できます。baselineとcandidateの各profileのp95を`npm run compare:performance -- <baseline> <candidate> 20`で比較し、20%超の退行をCLI終了コード1として検出します。

候補版のローカル検証は`npm run check:candidate`で実行できます。Nodeテスト、静的・fixture検証、Playground、Rust test、clippy、`git diff --check`を固定順で実行します。`npm run check:candidate:json`は同じ6段階を実行し、schema version 1、各段階の`passed`、失敗段階、終了コードを検証したうえでJSONを1行出力します。出力にはAcorde path checkoutの宣言version、`Cargo.lock`解決version、実checkout version、exact tag、dirty状態、provenance readinessも含まれるため、release QA reportやCI artifactからローカルゲートと依存状態を機械的に参照できます。これは署名、Windows実機、clean machine、外部providerの品質確認を代替しません。
`npm run check:candidate:strict`は依存provenanceも必須にする厳格ゲートです。Acorde checkoutが宣言versionのclean exact tagでない場合は非ゼロ終了になります。JSONの`valid`は6段階のローカル検証結果、`releaseReady`は依存provenanceを含む正式候補可否、`exitCode`と`dependency.diagnostics`は失敗理由を表します。

候補版結果をrelease QAへ束ねる場合は`npm run release:qa -- --manifest dist/release-artifact-manifest.json --candidate-gate dist/candidate-gate.json`を使います。`candidateGate`はschema検証後にreportへ保存され、report digestの対象になります。正式なrelease QA合格には`strictDependency=true`と`releaseReady=true`が必須です。CLI summaryの`candidateReady`でも同じ判定を機械的に参照できます。

cold startは`npm run bench:cold-start`で100小節fixtureをengine新規起動ごとに測定し、`qa/performance-cold-start-results.json`へ保存します。`npm run check:cold-start-results`で結果schemaを検証します。OS・CPU・build profileに依存するため、固定thresholdは未設定です。

playbackは`npm run bench:playback`で1,000小節fixtureのparseと`playback_events`生成を測定し、イベント数とbenchmark harness自身のRSS増分を`qa/performance-playback-results.json`へ保存します。`npm run check:playback-results`でschemaを検証します。RSSはengine processの実RSSではなく、JSON IPCを保持するharness側の参考値です。

render pipelineは`npm run bench:render`でlayout、SVG生成、SVG metadata生成、同一scoreのrepeat renderを測定し、`qa/performance-render-results.json`へ保存します。repeat renderは差分再描画の前段となる再描画コストの基準であり、UIの実差分更新とは分離しています。

2026-09-09の現行engine実測では、1,000小節fixtureのplayback event数は1,000、cold startはp50 4.495 ms、playbackはp95 13.935 ms、layoutはp95 12.561 ms、SVGはp95 25.034 msでした。parse/load/render profileにはharness側のRSSとCPU使用量も保存します。これらはこのmacOS arm64環境の再現用baselineであり、engine自身のRSS保証、別OSの性能保証、Mixer更新や長時間再生の合格判定ではありません。

## Current local blocker

2026-09-09に`npm run pack`を再実行し、macOS arm64 packaged appの`Contents/Resources/engine/acorde-composer-engine`同梱、artifact manifest、SBOM、NOTICE、provenance生成を確認しました。artifact manifestは`release-qa-report.json`へ再結合し、report schemaは検証済みです。20シナリオは未実機結果を`notRun`として保持し、合格扱いにしていません。前回の実機確認ではacorde 1.1.4の実engineで複数voice fixtureをOpen → title edit → dirty表示 → MusicXML save → saved file reloadまで確認済みです。保存XMLの`voice` 1/2と`backup`、再Open後のタイトル、voice 1/2 selector切替を確認しました。Score settingsのApply経路も、native dialogのsubmit競合を避ける直接handlerと`type="button"`へ修正し、回帰テスト済みです。外部OMR/AIは実行可能なprovider binary・license・ユーザー同意が必要で、設定readiness境界までをローカル検証済みです。Windows実機、クリーンマシン、署名済みinstaller、実provider品質は未検証として記録します。
