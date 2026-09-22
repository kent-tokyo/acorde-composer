# Acorde Composer feature matrix

この表は、実装済みの範囲と未検証の範囲を同じ条件で確認するための内部・公開文書共通の基準です。`release-ready`は、ローカル実装だけでなく、必要なartifact・実機・外部条件まで満たした場合にだけ使います。

| 領域 | 現在の状態 | ローカル証拠 | 未完了の境界 |
| --- | --- | --- | --- |
| Score編集 | core | `electron/command-schema.test.cjs`、`electron/ui-contract.test.cjs` | 全記譜要素の完全coverage |
| 複数voice | fixture・macOS packaged smokeで検証済み | `qa/fixtures/multivoice-ui.musicxml`、`docs/musicxml-migration-example.md` | cross-staffの複数staff materialization、Windows・署名artifact・clean machine |
| MusicXML / MIDI / ABC | 入出力とloss diagnosticsを実装 | `electron/notation-coverage.test.cjs`、`electron/import-diagnostics.test.cjs` | 要素ごとの完全round-trip |
| Playback | oscillatorと検証済みsample PCMを再生 | `electron/audio-backend.test.cjs`、`electron/soundfont-playback.test.cjs` | 長時間・聴感・production asset QA |
| SoundFont | 64 MiB以下のinline asset、sample・resolved-zone boundary | `electron/soundfont-asset.test.cjs`、`electron/soundfont-playback.test.cjs` | 大きなassetのfile-path/stream IPC（Acorde #82）と配布license |
| AI / OMR | proposal・license・timeout・redaction boundary | `electron/ai-provider-boundary.test.cjs`、`electron/omr-boundary.test.cjs` | 実provider binary、認証、契約、品質評価 |
| Plugin | bounded runtime・registry・crash recovery boundary | `electron/plugin-runtime.cjs`、`electron/plugin-registry.test.cjs` | native VST/VSTi ABI、実plugin、vendor SDK |
| Packaging | macOS arm64 artifactとmanifestを生成 | `npm run pack`、`dist/release-artifact-manifest.json` | Windows artifact、署名、notarization |
| Release QA | 20シナリオmatrixとschema検証 | `qa/release-qa-matrix.json`、`dist/release-qa-report.json` | 実機evidence、clean machine、全scenario passed |

## 表の使い方

公開文書では「現在の状態」と「未完了の境界」を併記します。`qa/release-qa-results.json`の`not-run`をpassedへ変更する場合は、対象platform、artifact、操作手順、日時を含むevidenceを追加してください。
