# Acorde Composer feature matrix

この表は、実装済みと未検証を分ける基準です。公開版v0.2.4はAcorde 1.2.17を利用します。`release-ready`は、同一commitのartifact・実機・外部条件まで満たした場合にだけ使います。

| 領域 | 現在の状態 | ローカル証拠 | 未完了の境界 |
| --- | --- | --- | --- |
| Score編集 | MuseScore型shell、menu、入力／再生toolbar、新規作成／Export、小節操作、voice 1〜4、3つの主要sidebar、utility panel、part tab、Mixer、workspaceを実装 | command／menu／UI contract tests、`npm run test:workspace` | breve／longa（Acorde #83）、全記譜要素の完全coverage、packaged manual UI QA |
| 複数voice／staff | fixtureとdevelopment UI E2Eでvoice保持とvoice交換を検証。Acordeは宣言済みstaffとcross-staffをmaterialize | `qa/fixtures/multivoice-ui.musicxml`、`qa/fixtures/notation/cross-staff.musicxml` | v0.2.4 packaged manual E2E、Windows、信頼済み署名artifact、clean machine |
| MusicXML／MIDI／ABC | 入出力とloss diagnosticsを実装。開発版はAcorde v1.2.17を利用 | `electron/notation-coverage.test.cjs`、`electron/import-diagnostics.test.cjs` | 汎用corpusと要素ごとの完全round-trip |
| Playback | oscillatorと検証済みsample PCMを再生 | `electron/audio-backend.test.cjs`、`electron/soundfont-playback.test.cjs` | 長時間・聴感・production asset QA |
| SoundFont | 64 MiB以下のinline asset、sample・resolved-zone boundary | `electron/soundfont-asset.test.cjs`、`electron/soundfont-playback.test.cjs` | 大きなassetのfile-path/stream IPC（Acorde #82）と配布license |
| AI / OMR | proposal・license・timeout・redaction boundary | `electron/ai-provider-boundary.test.cjs`、`electron/omr-boundary.test.cjs` | 実provider binary、認証、契約、品質評価 |
| Plugin | bounded runtime・registry・crash recovery boundary | `electron/plugin-runtime.cjs`、`electron/plugin-registry.test.cjs` | native VST/VSTi ABI、実plugin、vendor SDK |
| Packaging | v0.2.4のmacOS arm64 DMGはapp bundle全体をad-hoc署名し、DMG内のappをstrict検証。manifest生成scriptあり | `npm run pack`、`npm run dist:mac:unsigned-dmg` | Developer ID署名、notarization、Windows、clean-machine QA |
| Release QA | 20シナリオmatrixとschema検証 | `qa/release-qa-matrix.json` | 現在は20件`not-run`。同一artifactの実機evidenceが必要 |

## 表の使い方

公開文書では「現在の状態」と「未完了の境界」を併記します。`qa/release-qa-results.json`の`not-run`をpassedへ変更する場合は、対象platform、artifact、操作手順、日時を含むevidenceを追加してください。
