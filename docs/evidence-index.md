# Evidence index

主要な製品主張を、実装・fixture・テスト・artifactへ追跡するための一覧です。

| 主張 | 実装 | 検証 | artifact / fixture | 判定 |
| --- | --- | --- | --- | --- |
| Acordeだけを音楽処理依存にする | `engine/Cargo.toml`、`package.json` | `electron/package-contract.test.cjs` | `engine/Cargo.lock` | local |
| 複数voiceを保持して保存・再読込する | `src/app.js`、engine IPC | `electron/ui-contract.test.cjs` | `qa/fixtures/multivoice-ui.musicxml` | macOS smoke済み |
| 外部入力を直接Scoreへ適用しない | `electron/ai-provider-boundary.cjs`、`electron/omr-boundary.cjs` | provider / OMR boundary tests | deterministic fixtures | local |
| SoundFont sampleをboundedに再生する | `electron/soundfont-playback.cjs`、`src/audio-backend.js` | `electron/soundfont-playback.test.cjs`、`electron/audio-backend.test.cjs` | PCM fixture | local |
| artifactの改変を検出する | `scripts/create-release-artifact-manifest.cjs` | `electron/release-artifact-manifest.test.cjs` | `dist/release-artifact-manifest.json` | local |
| QAの未検証を合格扱いしない | `scripts/run-release-qa.cjs`、`electron/release-qa.cjs` | `electron/release-qa-cli.test.cjs` | `qa/release-qa-results.json` | local |
| macOS arm64 packaged appにengineを同梱する | `package.json`、`scripts/build-engine.cjs` | `electron/package-contract.test.cjs`、`npm run pack` | `dist/mac-arm64` | local |
| 正式候補として公開できる | candidate gate / release QA | strict gate | Acorde clean exact tag、署名、実機QA | external pending |

## 更新規則

- 実装だけでは判定を上げず、対応する検証と証跡を追加する。
- `local`はこのcheckoutで再実行できることを意味する。
- `external pending`は、Acorde公開版、外部provider、証明書、Windows実機、clean machine、公開判断のいずれかを必要とする。
- このindexはROADMAPの内部計画を公開済み機能として扱うためのものではない。
