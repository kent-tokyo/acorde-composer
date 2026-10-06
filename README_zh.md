# Acorde Composer

一款以本地处理为主、支持 MusicXML、MIDI 和 ABC 的乐谱编辑器。音乐处理只使用 [`acorde`](https://github.com/kent-tokyo/acorde)；Electron 负责桌面 UI、文件操作和外部 provider 边界。

[English](README.md) · [日本語](README_ja.md) · [浏览器 Playground](https://kent-tokyo.github.io/acorde-composer/playground/) · [桌面版下载](https://github.com/kent-tokyo/acorde-composer/releases)

## 体验或安装

建议先使用免费的[浏览器 Playground](https://kent-tokyo.github.io/acorde-composer/playground/)。可以新建或打开 MusicXML 乐谱，选择小节，编辑音符、休止符、文本和 voice，然后导出结果。

最新公开版是 **v0.2.4**（`acorde` v1.2.17）。播放工具栏、新建／导出窗口、小节操作、voice 交换、音符输入工具栏、Navigator 和快捷键更接近 MuseScore。Apple Silicon macOS DMG 是实验性版本：完整应用 bundle 已进行 ad-hoc 签名并通过严格验证，但没有 Developer ID 签名或公证，因此仍可能被 Gatekeeper 拦截。请只从 [GitHub Releases](https://github.com/kent-tokyo/acorde-composer/releases)下载；如被拦截，请在 Finder 中按住 Control 点按应用并选择“打开”。

## 主要功能

- 编辑和交换 MusicXML、MIDI、ABC，生成 SVG，并提供 PDF／打印入口
- 编辑音符、休止符、文本、常用记谱、小节和 voice；撤销／重做；保存副本；导出并重新打开
- 接近 MuseScore 的 Home／Score／Publish、Palettes、Instruments、Properties、part、Navigator、Timeline、Piano、Mixer、workspace 和快捷键
- 使用`acorde`播放数据进行 oscillator 或已验证的 SF2／SF3 PCM 播放
- AI／OMR 建议经审核后才能作为已验证命令修改乐谱

## 当前限制

native VST、生产级 OMR／AI provider、MuseSounds 类内置音源、受信任的 Developer ID／Authenticode installer、Windows packaged QA 和 clean-machine QA 尚未完成。大型 SoundFont 仍需要 file／stream 传输路径。本仓库不内置 SoundFont、MuseSounds asset、VST binary、provider 凭据或 OMR binary。

准确范围请查看 [feature matrix](docs/feature-matrix.md)，外部资源义务请查看 [NOTICE.md](NOTICE.md)。

## 安全迁移MusicXML

1. 从原软件导出副本。
2. 打开文件并先检查 diagnostics。
3. 使用新文件名保存，再重新打开。
4. 检查 voice、rest、`backup`／`forward`、歌词、和弦和重要记谱元素。

不要覆盖原文件。完整流程请参阅[选型与迁移指南](docs/choosing-and-migrating.md)。

## 开发与验证

```sh
npm install
npm test
npm run check
npm run test:workspace
npm run test:playground
```

`npm run pack`生成本地 package 和 artifact manifest。`npm run check:candidate:strict`检查测试和 Acorde provenance，但不能替代已签名 package 或真机 QA。20 项手动 release scenario 属于独立门槛；`not-run`不等于通过。

更多信息请从[文档索引](docs/README.md)、[QA指南](qa/README.md)和[CHANGELOG](CHANGELOG.md)开始。
