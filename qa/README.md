# Release QA evidence

The published app is Acorde Composer 0.1.15 with `acorde` 1.2.2. Development `main` resolves Acorde 1.2.11, but it has no matching candidate artifact or QA report. Do not treat old artifacts or benchmark records as evidence for either version.

## Release-QA rule

`release-qa-matrix.json` defines 20 scenarios: 10 macOS arm64 and 10 Windows x64. Add results to `release-qa-results.json` using the same `platform`, `arch`, and `scenario` key plus evidence.

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
```

The report is written to `dist/release-qa-report.json`. It binds the artifact digest, current commit, QA matrix, and optional candidate gate. Validate it independently with `npm run release:qa:validate -- --input dist/release-qa-report.json`.

## What local checks do not prove

`npm run check:candidate` covers tests, static checks, fixtures, Playground, Rust tests, Clippy, and whitespace. It does not prove signing, notarization, Windows behavior, clean-machine installation, external-provider quality, or manual QA. The latest complete local baseline (2026-09-27, before the v1.2.11 dependency bump) is 270 Node tests and 25 Rust tests. The checked-in 20-scenario result set is still not a packaged-release pass.

Performance fixtures and schemas are validated by `npm run check`; rerun benchmarks only when recording the machine, engine version, input, iteration count, and output JSON. A local timing is not a cross-platform performance guarantee.
