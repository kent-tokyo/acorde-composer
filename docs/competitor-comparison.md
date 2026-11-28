# 競合ライブラリとの比較（2026-11-28）

ComposerのMusicXML処理（`acorde` 2.0.0）を、music21、Verovio、MuseScore 3、OpenSheetMusicDisplay（OSMD）と比べた結果です。再現手順は[scripts/competitor-compare](../scripts/competitor-compare/README.md)にあります。1台のLinux x86_64環境で1回測っただけの開発時の記録で、リリース時の主張ではありません。

## MusicXML往復の精度

対象は177ファイルです。MITライセンスの非公式MusicXMLテストスイート（LilyPondの`input/regression/musicxml`）165件と、`qa/fixtures/notation`の12件で、各ツールで読込→保存→再読込し、要素を元ファイルと照合しました。VerovioはMusicXMLを書き出せないため、この比較には入っていません。

| 指標 | acorde 2.0.0 | music21 10.5.2 | MuseScore 3 |
| --- | --- | --- | --- |
| 開けたファイル（177件中） | 175 | 176 | 174 |
| 全要素を保持できたファイル（3ツールすべてが開けた171件中） | 129 | 145 | 126 |
| 音符の保持率（2205個） | 95.7% | 98.0% | 93.0% |
| 休符の保持率（364個） | 81.9% | 96.7% | 97.0% |
| 歌詞の保持率（623個） | 98.2% | 98.4% | 81.5% |
| 装飾記号の保持率（68個） | 82.4% | 86.8% | 52.9% |
| 往復の合計時間（177件） | 0.29 s | 5.5 s | 29 s |

MuseScoreの時間だけは、CLIの起動時間を含みます。

## 速度（読込と描画）

単位は秒で、Composerの`qa/fixtures/performance`を使いました。測った内容がツールごとに違うため、行どうしの比較は目安です。

| ツール（測った内容） | 100小節 | 1000小節 | 10000小節 |
| --- | --- | --- | --- |
| acorde 2.0.0（読込＋SVG描画） | 0.017 | 0.29 | 80.1 |
| Verovio 6.4.1（読込＋全ページ描画） | 0.021 | 0.24 | 4.6 |
| music21 10.5.2（読込のみ） | 0.017 | 0.38 | 27.2 |
| MuseScore 3（CLIでSVG出力、起動込み） | 0.30 | 1.77 | 17.9 |
| OSMD 1.9.0（Chromiumで読込＋描画） | 0.27 | 2.29 | 未測定 |

10000小節で遅いのは`acorde` 2.0.0の退行です（1.2.0では描画0.16秒）。

## acorde側の課題

| issue | 内容 |
| --- | --- |
| [#505](https://github.com/kent-tokyo/acorde/issues/505) | 複数小節休符があると、MusicXMLの書き出しでその小節が消える。休符の保持率が低い主な原因 |
| [#506](https://github.com/kent-tokyo/acorde/issues/506) | SVG描画の時間が小節数の2乗で増える |
| [#508](https://github.com/kent-tokyo/acorde/issues/508) | 複数の譜表にまたがる和音を書き出すと、タイミングがずれる |
| [#509](https://github.com/kent-tokyo/acorde/issues/509) | 入れ子の連符や特殊な比率の連符で、音価が変わる |
| [#510](https://github.com/kent-tokyo/acorde/issues/510) | 正しいファイル2件を開けない |
| [#511](https://github.com/kent-tokyo/acorde/issues/511) | 教会旋法、ppppp、一部のアーティキュレーションなどが失われる |

## 未測定の範囲

abcjs、MuseScore 4、描画の見た目、再生、編集操作はまだ比べていません。
