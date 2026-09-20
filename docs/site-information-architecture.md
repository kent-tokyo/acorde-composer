# Public documentation information architecture

これはwebsite実装やhostingを完了扱いにする文書ではなく、公開時に実装・証跡と一致させるための内部仕様です。

| path | 主題 | title / H1 | evidence link |
| --- | --- | --- | --- |
| `/` | Composer概要 | Acorde Composer — MusicXML score editor | README、feature matrix |
| `/features/` | 対応機能と制約 | Features and known limitations | feature matrix、CHANGELOG |
| `/editor/` | 編集workflow | Create and edit a score | MusicXML移行手順 |
| `/musicxml-midi/` | 交換形式 | MusicXML, MIDI, and ABC | ABC / MusicXMLガイド、notation fixtures |
| `/playback/` | 再生と音源 | Playback and SoundFont boundaries | SoundFont checklist、QA evidence |
| `/mixer/` | Mixer | Mixer and channel state | mixer tests |
| `/developers/` | 境界とprovider | Engine, provider, and plugin boundaries | evidence index、NOTICE |
| `/releases/` | リリース | Releases and verification | CHANGELOG、artifact manifest、QA report |

## 共通metadata

- 各ページは固有のtitle、description、H1、更新日を持つ。
- canonicalは正規URLのみを指し、英日中の翻訳は相互リンクする。
- 未実装のMuseSounds相当音源、実OMR、外部AI、VST native backend、署名済みinstallerを対応済みと表現しない。
- 主張にはfeature matrixまたはevidence indexへのリンクを付ける。
- sitemap、robots、404、redirect、structured dataはwebsite実装時に別途検証する。

## 外部依存

この仕様だけではwebsite hosting、domain、Search Console、検索index、Rich Results Testの完了を証明しません。それらは公開前の外部依存タスクとして残します。
