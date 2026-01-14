# パラパラ漫画パズルゲーム

ロケットのパラパラアニメーションを正しい順序に並べ替えるパズルゲーム。
PC（キーボード）とスマホ（タッチ操作）の両方に対応。

## プロジェクト概要

- **タイプ**: 単一ページWebゲーム
- **技術**: HTML5, CSS3, JavaScript（Vanilla JS）
- **対応デバイス**: PC、スマートフォン、タブレット
- **推奨向き**: 縦向き（横向き時は警告表示）

## ファイル構成

```
/
├── index.html          # メインゲームファイル（単一ファイル）
├── images/             # 画像フォルダ
│   ├── rocket_0.png   # アニメーションフレーム0
│   ├── rocket_1.png   # アニメーションフレーム1
│   ├── rocket_2.png   # アニメーションフレーム2
│   ├── rocket_3.png   # アニメーションフレーム3
│   ├── rocket_4.png   # アニメーションフレーム4
│   ├── rocket_5.png   # アニメーションフレーム5
│   ├── rocket_6.png   # アニメーションフレーム6
│   ├── rocket_7.png   # アニメーションフレーム7
│   └── rocket_8.png   # アニメーションフレーム8
└── README.md          # このファイル
```

## ゲーム仕様

### ゲームの目的

- シャッフルされた9枚のアニメーションフレームを正しい順序（ループ）に並べ替える
- 正解判定は「ループとして成立しているか」で判定（どのフレームから始まってもOK）
- 例: `[0,1,2,3,4,5,6,7,8]` も `[3,4,5,6,7,8,0,1,2]` も正解

### ゲームフロー

1. **開始**: ゲーム読み込み時に自動的にフレームがシャッフルされる
2. **操作**: カードを掴んで移動し、正しい順序に並べ替える
3. **答え合わせ**: Enterキーまたは✓ボタンで確認
4. **結果表示**:
   - 正解: クリアメッセージ + ピンポーン音
   - 不正解: ブザー音のみ
5. **リセット**: 「もう一度プレイ」ボタンでページリロード

## 操作方法

### キーボード操作（PC）

| キー | 動作 |
|------|------|
| `←` `→` | コマを前後に移動 |
| `スペース`（長押し） | カードを掴む/離す |
| 掴んだ状態で `←` `→` | カードの位置を変更 |
| `Enter` | 答え合わせ |

### タッチ/マウス操作（スマホ・PC共通）

| ボタン | 位置 | 動作 |
|--------|------|------|
| `←` | 左下 | 前のコマへ |
| `→` | 右下 | 次のコマへ |
| `掴む` | 中央下（黄色） | カードを掴む/離す（トグル式） |
| `✓` | 左上（緑色） | 答え合わせ |
| `❓` | 右上 | ヘルプ表示 |

## 実装の詳細

### HTML構造

```html
<body>
    <!-- 横向き警告（横向き時のみ表示） -->
    <div id="landscape-warning">...</div>

    <div id="game-container">
        <!-- ヘルプアイコン -->
        <div id="help-icon">❓</div>

        <!-- ヘルプオーバーレイ -->
        <div id="help-overlay"></div>

        <!-- 操作説明パネル（モーダル） -->
        <div id="info-panel">...</div>

        <!-- ロケット表示エリア -->
        <div id="rocket-container">
            <img id="bottom-card" src="" alt="Bottom Card">
            <img id="rocket-img" src="" alt="Rocket">
        </div>

        <!-- クリアメッセージ -->
        <div id="clear-message">
            <div>🎉 クリア！ 🎉</div>
            <div class="reset-hint" id="reset-button">もう一度プレイ</div>
        </div>

        <!-- 操作ボタン -->
        <div id="btn-prev" class="control-button">←</div>
        <div id="btn-next" class="control-button">→</div>
        <div id="btn-grab" class="control-button">掴む</div>
        <div id="btn-check" class="control-button">✓</div>
    </div>
</body>
```

### CSS設計

#### レイアウト

- **背景**: グラデーション（`#667eea` → `#764ba2`）
- **中央配置**: flexboxで画面中央にゲームコンテナを配置
- **ロケットコンテナ**: 400×400pxの半透明白背景、角丸、ブラー効果

#### ボタンスタイル

**操作ボタン共通**:
```css
.control-button {
    position: fixed;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s ease;
}
```

**個別スタイル**:
- `#btn-prev`, `#btn-next`: 黒背景（`rgba(0,0,0,0.9)`）、白文字
- `#btn-grab`: 黄色背景（`rgba(255,215,0,0.9)`）、90×90px
  - 掴んでいる時: 赤色背景（`rgba(255,100,100,0.9)`）、テキスト「離す」
- `#btn-check`: 緑色背景（`rgba(100,255,100,0.9)`）

#### アニメーション

**カード掴み動作**:
```css
#rocket-img.grabbed {
    transform: translateY(-250px);
    filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
}
```

**クリアメッセージ**:
```css
@keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.05); }
}
```

#### レスポンシブ対応

**スマホ用（max-width: 768px）**:
```css
@media (max-width: 768px) {
    #clear-message {
        font-size: 2.5em;
        padding: 30px 40px;
        width: 95%;
    }
}
```

**横向き警告（landscape & max-height: 500px）**:
```css
@media (orientation: landscape) and (max-height: 500px) {
    #landscape-warning {
        display: flex !important;
    }
}
```

### JavaScript実装

#### グローバル変数

```javascript
// 正解の順番
const correctOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// ゲーム状態
let frameOrder = [];           // シャッフルされた順番
let currentIndex = 0;          // 現在表示しているインデックス
let isAnimating = false;       // アニメーション中かどうか
let isGrabbing = false;        // カードを掴んでいるかどうか
let grabbedCard = null;        // 掴んでいるカードの値
let isCleared = false;         // クリア済みかどうか
let isOnCooldown = false;      // スペースキーのクールタイム管理

// グローバルAudioContext（重要：1つだけ作成して再利用）
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
```

#### コアアルゴリズム

##### 1. シャッフル処理

```javascript
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function initGame() {
    // 循環していない順番になるまでシャッフル
    do {
        frameOrder = shuffleArray(correctOrder);
    } while (isLoopingCorrectly(frameOrder));

    currentIndex = 0;
    updateDisplay();
}
```

##### 2. ループ検証アルゴリズム（最重要）

```javascript
function isLoopingCorrectly(arr) {
    if (arr.length !== correctOrder.length) return false;

    // 各要素が次の要素に正しく続いているかチェック
    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const next = arr[(i + 1) % arr.length];
        const expectedNext = (current + 1) % correctOrder.length;

        if (next !== expectedNext) {
            return false;
        }
    }
    return true;
}
```

**ロジック説明**:
- 各フレーム番号が次のフレームに正しく続いているかチェック
- 最後のフレームは最初のフレームに戻る（モジュロ演算）
- 例: `[3,4,5,6,7,8,0,1,2]` の場合
  - 3→4: OK（4 = (3+1)%9）
  - 8→0: OK（0 = (8+1)%9）
  - 2→3: OK（3 = (2+1)%9）

##### 3. カード操作

**掴む処理**:
```javascript
function grabCard() {
    if (isAnimating || isGrabbing || isOnCooldown) return;

    isGrabbing = true;
    isOnCooldown = true;
    grabbedCard = frameOrder[currentIndex];

    // 配列から掴んだカードを削除
    frameOrder.splice(currentIndex, 1);

    // インデックスを調整
    if (currentIndex >= frameOrder.length) {
        currentIndex = frameOrder.length - 1;
    }

    updateDisplay();
    playGrabSound();

    // クールタイム解除（100ms）
    setTimeout(() => { isOnCooldown = false; }, 100);
}
```

**離す処理**:
```javascript
function releaseCard() {
    if (isAnimating || !isGrabbing) return;

    // 現在の位置に掴んでいたカードを挿入
    frameOrder.splice(currentIndex, 0, grabbedCard);
    isGrabbing = false;
    grabbedCard = null;

    updateDisplay();
    playReleaseSound();
}
```

**表示更新**:
```javascript
function updateDisplay() {
    if (isGrabbing) {
        // 掴んでいる時：上に掴んだカード、下に次のカード
        rocketImg.src = `images/rocket_${grabbedCard}.png`;
        rocketImg.classList.add('grabbed');

        // 下のカードを表示（循環）
        if (frameOrder.length > 0) {
            const bottomIndex = currentIndex % frameOrder.length;
            const bottomFrameNumber = frameOrder[bottomIndex];
            bottomCard.src = `images/rocket_${bottomFrameNumber}.png`;
            bottomCard.classList.add('visible');
        }
    } else {
        // 通常時：1つだけ表示
        const frameNumber = frameOrder[currentIndex];
        rocketImg.src = `images/rocket_${frameNumber}.png`;
        rocketImg.classList.remove('grabbed');
        bottomCard.classList.remove('visible');
    }
}
```

##### 4. 答え合わせアニメーション

```javascript
function checkAnswer() {
    if (isAnimating) return;

    isAnimating = true;
    const startIndex = currentIndex;
    let frameCount = 0;

    // 高速ページめくり音を再生
    playFastPageFlipSound();

    // アニメーション再生（選択中のコマから2周）
    const interval = setInterval(() => {
        updateDisplay();
        frameCount++;
        currentIndex = (startIndex + frameCount) % frameOrder.length;

        // 2周終了
        if (frameCount >= frameOrder.length * 2) {
            clearInterval(interval);
            currentIndex = startIndex; // 開始位置に戻る
            updateDisplay();

            // 0.5秒待ってから判定
            setTimeout(() => {
                isAnimating = false;

                // 循環判定
                if (isLoopingCorrectly(frameOrder)) {
                    playCorrectSound();
                    clearMessage.style.display = 'block';
                    isCleared = true;

                    // ボタンを非表示にする
                    btnPrev.style.display = 'none';
                    btnNext.style.display = 'none';
                    btnGrab.style.display = 'none';
                    btnCheck.style.display = 'none';
                    helpIcon.style.display = 'none';
                } else {
                    playIncorrectSound();
                }
            }, 500);
        }
    }, 100); // 0.1秒ごと（9コマ×2周=1.8秒）
}
```

#### 効果音実装（重要）

##### グローバルAudioContextの使用

**❌ 間違った実装（音が鳴らなくなる）**:
```javascript
function playSound() {
    // 毎回新しいAudioContextを作成（NG）
    const audioContext = new AudioContext();
    // ...
}
```

**✅ 正しい実装**:
```javascript
// グローバルに1つだけ作成
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound() {
    // グローバルのaudioContextを再利用（OK）
    const oscillator = audioContext.createOscillator();
    // ...
}
```

**理由**: ブラウザにはAudioContextの数に制限があり（Chrome: 6個、Safari: 4個）、毎回新規作成すると制限に達して音が鳴らなくなる。

##### 効果音の種類

**1. 紙めくり音（コマ移動時）**:
```javascript
function playPageFlipSound() {
    const bufferSize = audioContext.sampleRate * 0.05; // 50ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // ホワイトノイズを生成
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    // ハイパスフィルターで高音を強調
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    source.start(now);
    source.stop(now + 0.05);
}
```

**2. 掴む音（800Hz、0.08秒）**:
```javascript
function playGrabSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 高めの音
    oscillator.type = 'sine';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscillator.start(now);
    oscillator.stop(now + 0.08);
}
```

**3. 離す音（400Hz、0.1秒）**:
```javascript
function playReleaseSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 400; // 低めの音
    oscillator.type = 'sine';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
}
```

**4. 高速ページめくり音（答え合わせ時、1.8秒）**:
```javascript
function playFastPageFlipSound() {
    const duration = 1.8; // 1.8秒
    const burstDuration = 0.03; // 各バーストの長さ
    const burstInterval = 0.1; // バースト間隔
    const numBursts = Math.floor(duration / burstInterval);

    for (let i = 0; i < numBursts; i++) {
        const startTime = audioContext.currentTime + (i * burstInterval);

        // ノイズバッファを作成
        const bufferSize = audioContext.sampleRate * burstDuration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // ホワイトノイズを生成
        for (let j = 0; j < bufferSize; j++) {
            data[j] = Math.random() * 2 - 1;
        }

        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        filter.type = 'highpass';
        filter.frequency.value = 2500;

        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 徐々に音量を下げる
        const volume = 0.12 * (1 - (i / numBursts) * 0.3);
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + burstDuration);

        source.start(startTime);
        source.stop(startTime + burstDuration);
    }
}
```

**5. 正解音（ピンポーン: E5→C6）**:
```javascript
function playCorrectSound() {
    const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(659.25, now, 0.15);        // E5
    playTone(1046.50, now + 0.15, 0.3); // C6
}
```

**6. 不正解音（ブザー: 100Hz sawtooth）**:
```javascript
function playIncorrectSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 100; // 低い音
    oscillator.type = 'sawtooth';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
}
```

#### イベントハンドラ

##### キーボード操作

```javascript
// キーダウン
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight') {
        event.preventDefault();
        if (isGrabbing) {
            moveGrabbedRight();
        } else {
            nextFrame();
        }
    } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        if (isGrabbing) {
            moveGrabbedLeft();
        } else {
            prevFrame();
        }
    } else if (event.code === 'Space') {
        event.preventDefault();
        // キーリピートを無視（重要）
        if (event.repeat) return;
        if (!isGrabbing) {
            grabCard();
        }
    } else if (event.code === 'Enter') {
        event.preventDefault();
        if (isCleared) {
            location.reload();
        } else if (!isGrabbing) {
            checkAnswer();
        }
    }
});

// キーアップ（スペースキーのみ）
document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        if (isGrabbing) {
            releaseCard();
        }
    }
});
```

##### ボタン操作

```javascript
// 前のコマ
btnPrev.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isGrabbing) {
        moveGrabbedLeft();
    } else {
        prevFrame();
    }
});

// 次のコマ
btnNext.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isGrabbing) {
        moveGrabbedRight();
    } else {
        nextFrame();
    }
});

// 掴むボタン（トグル式）
btnGrab.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!isGrabbing) {
        grabCard();
        btnGrab.textContent = '離す';
        btnGrab.classList.add('grabbing');
    } else {
        releaseCard();
        btnGrab.textContent = '掴む';
        btnGrab.classList.remove('grabbing');
    }
});

// 確認ボタン
btnCheck.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCleared) {
        location.reload();
    } else if (!isGrabbing) {
        checkAnswer();
    }
});

// リセットボタン
resetButton.addEventListener('click', (event) => {
    event.stopPropagation();
    location.reload();
});
```

##### ヘルプモーダル

```javascript
function showHelp() {
    infoPanel.classList.add('show');
    helpOverlay.classList.add('show');
}

function hideHelp() {
    infoPanel.classList.remove('show');
    helpOverlay.classList.remove('show');
}

helpIcon.addEventListener('click', showHelp);
closeHelp.addEventListener('click', hideHelp);
helpOverlay.addEventListener('click', hideHelp);
```

## 重要な実装ポイント

### 1. AudioContext問題（最重要）

**問題**: 毎回新しいAudioContextを作成すると、ブラウザの制限（Chrome: 6個、Safari: 4個）に達して音が鳴らなくなる。

**解決策**: グローバルに1つだけAudioContextを作成して全効果音で再利用する。

```javascript
// ❌ NG: 各関数で新規作成
function playSound() {
    const audioContext = new AudioContext();
}

// ✅ OK: グローバルで1つだけ作成
const audioContext = new AudioContext();
function playSound() {
    // グローバルのaudioContextを使用
}
```

### 2. スペースキーのリピート防止

```javascript
if (event.repeat) return; // キーリピートを無視
```

スペースキーを長押ししたときの連続発火を防ぐ。

### 3. カード掴み時の配列操作

```javascript
// 掴む時
frameOrder.splice(currentIndex, 1);  // 配列から削除

// 離す時
frameOrder.splice(currentIndex, 0, grabbedCard);  // 配列に挿入
```

### 4. モジュロ演算による循環

```javascript
// 次へ
currentIndex = (currentIndex + 1) % frameOrder.length;

// 前へ
currentIndex = (currentIndex - 1 + frameOrder.length) % frameOrder.length;
```

### 5. クリア時のUI制御

```javascript
// ボタンを全て非表示
btnPrev.style.display = 'none';
btnNext.style.display = 'none';
btnGrab.style.display = 'none';
btnCheck.style.display = 'none';
helpIcon.style.display = 'none';
```

## デバッグ用コンソールログ

ゲーム開始時とイベント発生時にコンソールに情報を出力：

```javascript
console.log('🚀 パラパラ漫画パズルが開始されました！');
console.log('シャッフルされた順番:', frameOrder);
console.log('カードを掴みました:', grabbedCard);
console.log('カードを離しました。現在の順番:', frameOrder);
console.log('クリア！正しく循環しています！');
console.log('不正解。循環していません。現在:', frameOrder);
```

## パフォーマンス最適化

1. **単一ファイル構成**: index.html 1つで完結（外部CSSやJSなし）
2. **CSS遷移**: `transition`で滑らかなアニメーション
3. **AudioContext再利用**: メモリリークを防止
4. **イベント委譲**: `event.stopPropagation()`で不要なバブリングを防止

## ブラウザ互換性

- **Chrome**: ✅ 完全対応
- **Firefox**: ✅ 完全対応
- **Safari（iOS）**: ✅ 完全対応
  - `webkitAudioContext`でフォールバック対応
  - PWAメタタグで全画面対応
- **Edge**: ✅ 完全対応

## モバイル対応

### メタタグ

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### 横向き警告

```css
@media (orientation: landscape) and (max-height: 500px) {
    #landscape-warning {
        display: flex !important;
    }
}
```

横向き時に「縦向きでプレイしてください」と表示。

## 今後の拡張可能性

- **難易度設定**: フレーム数を増やす（12枚、18枚など）
- **タイマー機能**: クリア時間の記録
- **スコアシステム**: 移動回数の最小化
- **複数テーマ**: 異なるアニメーション画像セット
- **ランキング機能**: ローカルストレージでベストタイム保存

## ライセンス

このプロジェクトは教育目的で作成されました。

## 作成日

2026年1月14日
