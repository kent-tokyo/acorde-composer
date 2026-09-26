# Acorde Composer

面向 Windows／macOS 的 AI 辅助乐谱编辑器。产品名称为 **Acorde Composer**。乐谱模型和确定性的音乐处理由现有的 [`acorde`](https://github.com/kent-tokyo/acorde) 负责。

安装前可打开[浏览器 Playground](https://kent-tokyo.github.io/acorde-composer/playground/)体验。GitHub 中的 `src/playground/` 仅用于浏览源代码。

## 下载应用

面向用户的桌面应用下载页面是 [Acorde Composer Releases](https://github.com/kent-tokyo/acorde-composer/releases)。免费的正式入口是[浏览器 Playground](https://kent-tokyo.github.io/acorde-composer/playground/)。若版本附带 macOS `*-unsigned.zip`，它属于实验性未签名构建，可能需要手动处理 Gatekeeper 提示。当前 v0.1.15 尚未附带桌面应用资产。维护者请遵循 [macOS 发布指南](docs/macos-distribution.md)。

## 快速开始

### 推荐：使用免费的 Playground

1. 打开[浏览器 Playground](https://kent-tokyo.github.io/acorde-composer/playground/)。
2. 选择 **New score** 新建乐谱，或打开 MusicXML 文件。
3. 选择小节，然后使用音符、休止符、文本、voice 和播放控件编辑。
4. 完成后导出为 MusicXML、MIDI、ABC 或 SVG。

它在浏览器中运行，无需安装。首次体验或进行快速编辑时，建议从这里开始。

### macOS 实验版：unsigned ZIP

1. 打开 [Releases](https://github.com/kent-tokyo/acorde-composer/releases)，在可用时下载以 `-unsigned.zip` 结尾的资产。
2. 双击 ZIP 解压；如有需要，将 **Acorde Composer.app** 移到“应用程序”。
3. 如果 macOS 在首次启动时拦截应用，请在 Finder 中按住 Control 点按应用，选择“打开”，再确认“打开”。只应对从官方 Releases 页面下载的 ZIP 执行此操作。

该构建免费，但未经签名和 notarization，面向理解 Gatekeeper 警告的用户。如果不希望手动绕过提示，请使用 Playground。

## 主要功能

- 导入、编辑和导出 MusicXML、MIDI、ABC
- 基于实际 Score 的 SVG 显示、PDF／打印预览、撤销／重做
- 多声部选择、键盘操作以及 voice-aware playback address
- 音符与休止符、歌词、和弦、力度、装饰音和演奏记号编辑
- part／staff 编辑、分谱导出、Mixer 和 Web MIDI 输入
- AI／OMR 建议在审核后再应用的安全 proposal workflow
- SoundFont 状态显示、PCM 样本播放和 oscillator fallback
- 面向 macOS／Windows 的 Electron UI 与 bounded JSON IPC

## 音乐库依赖原则

音乐处理只使用 `acorde`。Score 模型、MusicXML／MIDI／ABC 输入输出、编辑 command、布局、SVG 渲染和 PlaybackEvent 都通过 `acorde` API 完成。不使用 Tone.js、VexFlow、music21 等其他音乐库。

当前使用 `acorde` v1.2.2 的 5 个 crate，并通过 path dependency 和 version pin 固定。如果缺少音乐功能，不在 Composer 中复制实现，而是先在 `acorde` 中实现并测试。

## 当前版本

已发布版本为 **Acorde Composer v0.1.15**（`acorde v1.2.2`）。

AI／OMR 输出不会直接写入 Score，而是作为经过验证的 `ScoreCommand` proposal 供用户审核。基础编辑、播放和文件输入输出可在本地运行。外部 provider 位于明确的 license、timeout、大小限制和崩溃恢复边界内。

## 从现有乐谱软件迁移

请先从原软件导出一份 MusicXML 副本，在 Acorde Composer 中打开并检查 diagnostics。编辑后使用新文件名保存，再重新打开保存的文件，确认 voice、rest、backup／forward、歌词、和弦以及主要记谱信息。

[选型与迁移指南](docs/choosing-and-migrating.md)介绍比较维度、迁移步骤、FAQ和当前限制。[feature matrix](docs/feature-matrix.md)、[evidence index](docs/evidence-index.md)、[SEO与竞品流量内容设计](docs/seo-content-plan.md)记录实现证据、搜索意图及公开内容规则。

## 重要限制

Acorde Composer不保证可以替代DAW、成熟的商业制谱软件、MuseSounds本身或通用OMR服务。native VST、生产 OMR／AI、MuseSounds 类音源、已签名 installer、Windows／clean-machine QA 都属于独立验证门槛。cross-staff 的 packaged 编辑和大 SoundFont 传输仍依赖上游支持。

## 开发

```sh
npm install
npm run check
npm test
npm start
```

`npm run pack`会生成 Electron 分发目录，并生成包含 checksum／SBOM／NOTICE／provenance 的 artifact manifest。可使用以下命令生成 release QA report：

```sh
npm run release:qa -- \
  --manifest dist/release-artifact-manifest.json \
  --matrix qa/release-qa-matrix.json \
  --results qa/release-qa-results.json
```

截至 2026-09-23，Node 261 项和 Rust unit test 25 项通过。`npm run check:candidate` 是本地候选 gate，不替代已签名分发或真机 QA。20 项 release QA 是独立门槛，`not-run`不会计为通过。详情请参阅 [QA evidence](qa/README.md)、[feature matrix](docs/feature-matrix.md) 和 [CHANGELOG](CHANGELOG.md)。

性能 profile 还保存 parse→serialize 测量以及 harness RSS／CPU 证据。可通过 feature matrix 和 evidence index 追踪已实现范围与外部依赖的剩余任务。

## 许可证与外部资源

本仓库不内置 OMR provider、AI service、MuseSounds asset、SoundFont asset 或 VST binary。用户添加的 provider 和 asset 必须遵守各自的许可证、认证信息、再分发条款和平台要求。另请参阅 [NOTICE.md](NOTICE.md)。
