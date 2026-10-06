# Release QA evidence

The published app is Acorde Composer v0.2.4 with `acorde` v1.2.17. Evidence from older releases must not be reused for this version.

## Manual release QA

`release-qa-matrix.json` defines 20 scenarios: 10 macOS arm64 and 10 Windows x64. Record each result in `release-qa-results.json` with the same `platform`, `arch`, and `scenario`, plus evidence.

```json
{"status":"passed","evidence":[{"kind":"manual","source":"clean-mac-arm64","detail":"launch and first window verified"}]}
```

Only measured results with evidence may be `passed`. `failed` and `not-run` block formal release readiness.

```sh
npm run pack
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
npm run release:qa:validate -- --input dist/release-qa-report.json
```

The report binds the version, commit, artifact digest, matrix, results, and optional candidate gate. The checked-in result set still has 20 `not-run` scenarios.

## Local checks

On 2026-10-07, the v0.2.4 source candidate with `acorde` v1.2.17 passed 331 Node tests, 25 Rust tests, `npm run check`, Clippy with warnings denied, desktop workspace E2E, Playground E2E, and a production-dependency audit with zero known vulnerabilities. Artifact and release-evidence results are generated from the published commit. These checks are not Developer ID, Windows, or clean-machine evidence, and all 20 manual release scenarios remain `not-run`.

Performance results are valid only with the input, engine version, commit, machine, iteration count, and output JSON recorded. A local timing is not a cross-platform guarantee.
