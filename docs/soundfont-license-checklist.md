# SoundFont・外部音源の確認チェックリスト

Composer本体にはSoundFontやMuseSounds相当の外部音源を同梱しません。音源を追加する場合は、次をassetごとに記録してください。

- [ ] 音源名、version、提供者、取得元URL
- [ ] SF2 / SF3または外部libraryの形式
- [ ] SHA-256 checksum
- [ ] license本文と商用利用条件
- [ ] 再配布、同梱、キャッシュ、バックアップの可否
- [ ] offline利用とproject portability
- [ ] bank / program、preset、sample regionの対応範囲
- [ ] 配布物に含めるNOTICEとattribution
- [ ] asset未導入時のoscillator fallback

Composerにはasset manifestのvalidation、license review状態、offline portability、missing asset diagnosticsの境界があります。外部decoderによる実zone materialization、vendorの高品質音源、licenseに基づく配布判断は別の外部依存ゲートです。確認できない音源を正式artifactへ含めないでください。
