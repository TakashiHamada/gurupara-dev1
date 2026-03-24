# Flip-Flap Crank デモ (Web版)

[Playdate](https://play.date/) 向けパズルゲーム **「グルパラ！」(Flip-Flap Crank)** のWebデモ版です。シャッフルされたアニメーションのコマを正しい順番に並べ替えるパズルゲームで、ブラウザ上で3ステージ（チュートリアル＋2ステージ）をプレイできます。

## ゲーム概要

バラバラに並んだアニメーションのコマをめくって移動し、正しい順番に並べ替えることが目的です。ページをめくる操作とコマを掴んで入れ替える操作を組み合わせて、アニメーションを完成させましょう。

## デモの流れ

1. **タイトル画面** → ゲームスタート
2. **ステージ0（チュートリアル）** — 10段階の操作ガイド付き
3. **ステージ1・ステージ2** — 各9コマのパズルステージ
4. **サンキュー画面** — 全ステージクリア後に表示

## 操作方法

| 操作           | キーボード            | ゲームパッド         |
| -------------- | -------------------- | -------------------- |
| ページめくり    | `←` / `→`           | 十字キー 左 / 右     |
| つかむ / はなす | `Space`（長押し）     | Aボタン              |
| チェック / 決定 | `Enter`              | Bボタン              |
| ポーズ / 戻る   | `Backspace` / `Esc` | Xボタン              |

## 技術スタック

- **Vanilla JavaScript**（ES6+ モジュール） — フレームワーク・バンドラー不使用
- **HTML5 Canvas**（2Dコンテキスト、400×240 解像度）
- **Web Audio API** — 効果音・BGM再生
- **CSS3** — Playdate本体フレームのUI再現

## ローカル環境での起動

### 前提条件

- [Node.js](https://nodejs.org/)（`npx` 実行用）
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### 起動方法

以下のいずれかの方法でローカルサーバーを起動してください。
ES6モジュールを使用しているため、`index.html` を直接ブラウザで開くとCORSエラーが発生します。

**方法1: live-server（ホットリロード対応）**

```bash
npx live-server --port=8000
```

**方法2: Python（macOS標準）**

```bash
python3 -m http.server 8000
```

いずれの場合も、ブラウザで [http://localhost:8000](http://localhost:8000) を開いてプレイできます。

## プロジェクト構成

```
├── index.html             # エントリーポイント（Playdateフレーム + Canvas）
├── main.js                # ゲームループ、シーン管理、ゲームロジック
├── styles.css             # Playdate本体フレームとレイアウト
├── engine/
│   ├── Config.js          # 全チューニングパラメータ
│   ├── Renderer.js        # Canvas描画（タイトル、ゲーム、選択、UI）
│   ├── GameState.js       # ゲーム状態管理・設定の永続化
│   ├── InputHandler.js    # キーボード・ゲームパッド入力処理
│   ├── PuzzleEngine.js    # コマのシャッフルと順序判定
│   ├── AssetLoader.js     # 画像アセットの読み込み
│   ├── Sound.js           # Web Audio API（効果音・BGM）
│   └── Transition.js      # ページめくり画面遷移
└── Source/
    ├── images/            # アニメーションフレーム画像
    │   ├── TitleAnimation/
    │   ├── MainGameAnimation/
    │   ├── SelectionAnimation/
    │   └── AnswerAnimation/
    └── sounds/            # 効果音・BGMファイル
```

## ライセンス

All rights reserved.

## 著作権

© 2026 GIFT TEN INDUSTRY.K.K. All rights reserved.
