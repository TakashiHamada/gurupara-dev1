# 9-Slice Animation Player

9分割されたアニメーション画像を再生するシンプルなWebアプリケーションです。

## 概要

このアプリは、1枚の画像に9コマのアニメーションフレームがグリッド状に配置された「9-slice画像」を読み込み、スムーズなアニメーションとして再生します。スマートフォンでの使用に最適化されており、直感的な操作でアニメーションを楽しめます。

## デモURL

```
https://TakashiHamada.github.io/gurupara-dev1/slice/
```

## 機能

### 基本機能
- **アニメーション選択**: 25種類のアニメーションから選択可能
- **自動再生**: アニメーションを選択すると自動的に再生開始
- **速度調整**: 3段階の再生速度（速い/普通/遅い）
- **レスポンシブ対応**: スマートフォン画面に最適化

### UI機能
- **リロードボタン**: 右上の円形ボタンでページをリロード
- **スクロール無効化**: 一画面に収まるレイアウトでスクロール不要
- **ズーム無効化**: ダブルタップ/ピンチズームを無効化
- **フレーム表示**: 画像左上に現在のフレーム数を表示

### 再生速度
- **速い**: 0.2秒/コマ（200ms間隔）
- **普通**: 0.5秒/コマ（500ms間隔）- デフォルト
- **遅い**: 0.8秒/コマ（800ms間隔）

## ファイル構造

```
slice/
├── index.html          # メインHTMLファイル（CSS/JavaScript含む）
├── README.md           # このファイル
└── images/             # アニメーション画像フォルダ
    ├── apple.jpg
    ├── baseball.jpg
    ├── blowing_kiss.jpg
    └── ... (全25個)
```

## 使い方

1. ドロップダウンメニューからアニメーションを選択
2. アニメーションが自動的に再生開始
3. 速度ボタン（速い/普通/遅い）で再生速度を変更
4. 右上のリロードボタンでリセット

## 技術仕様

### フレーム切り出しアルゴリズム
- 9フレームの画像を3×3のグリッドとして解析
- 境界線を避けるため、各フレームの端から5ピクセル内側を切り出し
- キャンバス中央に配置し、画面サイズに合わせて自動スケーリング

### レスポンシブ対応
- キャンバスサイズは画面幅に応じて動的調整（最大600×600px）
- ウィンドウリサイズに対応
- モバイルデバイス向けに最適化されたタッチ操作

### ブラウザ互換性
- モダンブラウザ（Chrome, Safari, Firefox, Edge）対応
- HTML5 Canvas API使用
- CSS3のflexbox/media query使用

## 技術スタック

- **HTML5**: 構造
- **CSS3**: スタイリング、レスポンシブデザイン
- **JavaScript（Vanilla）**: アニメーション制御、フレーム描画

## アニメーション一覧

全25種類のアニメーション：
- Apple
- Baseball
- Blowing Kiss
- Bubble Gum
- Crying
- Elephant Spraying Water
- Finger Snap
- Flexing Muscle
- Flower Blooming
- Handshake
- Hourglass
- Jumping Fish
- Jumping Frog
- Lifting Package
- Lightning
- Monkey To Human Evolution
- Person Bowing
- Person Shrugging
- Ramen
- Shooting Arrow
- Soccer Goal
- Spinning Girl
- Sticking Tongue Out
- Tadpole To Frog
- Thinking Person

## 開発履歴

- 初期バージョン: 基本的なアニメーション再生機能
- UI改善: シンプルなインターフェースに変更
- モバイル最適化: レスポンシブ対応、スクロール/ズーム無効化
- 画像整理: imagesフォルダへの整理

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
