# Acorde Composer

面向 Windows／macOS 的 AI 辅助乐谱编辑器。产品名称为 **Acorde Composer**。乐谱模型和确定性的音乐处理由现有的 [`acorde`](https://github.com/kent-tokyo/acorde) 负责。

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

当前使用 `acorde` v1.1.1 的 5 个 crate，并通过 path dependency 和 version pin 固定。如果缺少音乐功能，不在 Composer 中复制实现，而是先在 `acorde` 中实现并测试。

## 当前版本

**Acorde Composer v0.1.10**（`acorde v1.1.1`）

AI／OMR 输出不会直接写入 Score，而是作为经过验证的 `ScoreCommand` proposal 供用户审核。基础编辑、播放和文件输入输出可在本地运行。外部 provider 位于明确的 license、timeout、大小限制和崩溃恢复边界之外。

## 从现有乐谱软件迁移

请先从原软件导出一份 MusicXML 副本，在 Acorde Composer 中打开并检查 diagnostics。编辑后使用新文件名保存，再重新打开保存的文件，确认 voice、rest、backup／forward、歌词、和弦以及主要记谱信息。

[选型与迁移指南](docs/choosing-and-migrating.md)介绍比较维度、迁移步骤、FAQ和当前限制。[SEO与竞品流量内容设计](docs/seo-content-plan.md)记录搜索意图及公开内容规则。

## 重要限制

Acorde Composer不保证可以替代DAW、成熟的商业制谱软件、MuseSounds本身或通用OMR服务。完整的多声部编辑、实际 SoundFont zone materialization、MuseSounds 类高品质音源、实际 OMR provider 和已签名 installer 都属于独立验证门槛。SoundFont asset、外部音源和 provider 的许可证及再分发条件需要另行确认。

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

当前已验证 Node 169 项、Rust unit test 20 项。notation coverage 的 12 个元素现在各自关联独立 MusicXML fixture，并已在最新 macOS arm64 packaged artifact 上确认多声部 Open → edit → save → reload 流程。这些结果不能替代已签名分发包或 Windows 真机 QA。详情请参阅 [QA evidence](qa/README.md)、[CHANGELOG](CHANGELOG.md) 和 [GitHub Release v0.1.10](https://github.com/kent-tokyo/acorde-composer/releases/tag/v0.1.10)。

## 许可证与外部资源

本仓库不内置 OMR provider、AI service、MuseSounds asset、SoundFont asset 或 VST binary。用户添加的 provider 和 asset 必须遵守各自的许可证、认证信息、再分发条款和平台要求。另请参阅 [NOTICE.md](NOTICE.md)。
