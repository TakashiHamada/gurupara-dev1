-- game/state.lua
-- ゲーム状態を一元管理するモジュール

local gfx = playdate.graphics

-- GameState テーブル
GameState = {}

-- 画面サイズ定数
GameState.SCREEN_WIDTH = 400
GameState.SCREEN_HEIGHT = 240

-- シーン定数
GameState.SCENE_TITLE = "title"
GameState.SCENE_SELECTION = "selection"
GameState.SCENE_GAME = "game"

-- 現在のシーン
GameState.currentScene = GameState.SCENE_TITLE

-- アニメーション画像（ゲーム開始時に読み込む）
GameState.animImages = nil
GameState.frameCount = 0
GameState.currentAnimationName = nil
GameState.currentStageIndex = nil

-- 画像の表示位置（中央に配置）
GameState.imageX = (GameState.SCREEN_WIDTH - 240) / 2
GameState.imageY = (GameState.SCREEN_HEIGHT - 240) / 2

-- タイマー用
GameState.startTime = 0
GameState.clearTime = 0

-- フレーム変化追跡用
GameState.currentFrameIndex = 1
GameState.lastDisplayedFrame = 1
GameState.isFirstFrame = true
GameState.lastCrankPosition = 0
GameState.accumulatedAngle = 0
GameState.showGrayFrame = false

-- スライドアニメーション用
GameState.slideOutAnimations = {}
GameState.slideInAnimations = {}

-- クランク状態
GameState.isCrankIdle = true
GameState.isQuickStarting = false

-- 掴んだフレームの情報
GameState.grabbedFrameImage = nil
GameState.grabbedFromIndex = nil
GameState.isGrabbing = false
GameState.grabAnimProgress = 0

-- 置くアニメーション用
GameState.isPlacing = false
GameState.placeAnimProgress = 0
GameState.placeTargetIndex = nil
GameState.placingFrameImage = nil
GameState.justPlacedIndex = nil

-- 結果表示用
GameState.showResult = false
GameState.resultCorrect = false
GameState.isNewHiScore = false
GameState.resultAnimTime = 0

-- クリアアニメーション再生用
GameState.isPlayingClearAnim = false
GameState.clearAnimFrame = 1
GameState.clearAnimTimer = 0
GameState.clearAnimLoopCount = 0
GameState.CLEAR_ANIM_LOOPS = 2
GameState.CLEAR_ANIM_FRAME_INTERVAL = 4

-- トランジション中のコマ非表示フラグ
GameState.hideFrameDuringTransition = false

-- ハイスコア
GameState.hiScores = {}
GameState.currentHiScore = nil
GameState.lastSelectedStage = 0

-- チェック演出用
GameState.isChecking = false
GameState.checkAnimFrame = 0
GameState.checkAnimTimer = 0
GameState.checkStartIndex = 1
GameState.isWaitingResult = false
GameState.waitResultTimer = 0
GameState.showCheckBlackFrame = false

-- 操作ヒント表示用
GameState.idleTimer = 0
GameState.showHint = false

-- Bボタン長押し判定用
GameState.bButtonPressStart = 0
GameState.bButtonHoldTriggered = false
GameState.DEBUG_HOLD_DURATION = 1000

-- ポーズ画面用
GameState.isPaused = false
GameState.pauseStartTime = 0
GameState.totalPausedTime = 0

-- 感度設定
GameState.currentSensitivity = nil

-- BGM設定
GameState.bgmEnabled = true

-- 波アニメーション用フェーズ
GameState.wavePhase = 0

-- クランク履歴（循環バッファ）
GameState.crankDeltaHistory = {}
GameState.crankHistoryIndex = 1
GameState.crankHistorySum = 0
GameState.smoothedCrankDelta = 0

-- サムネイルのスケール
GameState.THUMBNAIL_SCALE = 0.5

-- 初期化関数
function GameState.init()
    GameState.lastCrankPosition = playdate.getCrankPosition()

    -- サムネイルスケールの計算
    if Settings and Settings.THUMBNAIL_WIDTH then
        GameState.THUMBNAIL_SCALE = Settings.THUMBNAIL_WIDTH / GameState.SCREEN_WIDTH
    end

    -- セーブデータ読み込み
    local savedData = playdate.datastore.read() or {}
    -- JSON round-trip で数値キー（特にキー0）が消失する問題を修正
    -- 保存時に文字列キーに変換しているため、読み込み時に数値キーに戻す
    local loadedScores = savedData.hiScores or {}
    GameState.hiScores = {}
    for k, v in pairs(loadedScores) do
        local numKey = tonumber(k)
        if numKey ~= nil then
            GameState.hiScores[numKey] = v
        else
            GameState.hiScores[k] = v
        end
    end
    GameState.lastSelectedStage = savedData.lastSelectedStage or 0
    GameState.currentSensitivity = savedData.sensitivity or Settings.DEFAULT_SENSITIVITY

    -- 旧フォーマットからのマイグレーション
    if savedData.hiScore and not GameState.hiScores[0] then
        GameState.hiScores[0] = savedData.hiScore
        local existingBgmEnabled = savedData.bgmEnabled
        if existingBgmEnabled == nil then
            existingBgmEnabled = true
        end
        GameState.saveSettings()
    end

    -- BGM設定読み込み
    GameState.bgmEnabled = savedData.bgmEnabled
    if GameState.bgmEnabled == nil then
        GameState.bgmEnabled = (Settings.BGM_ENABLED ~= nil) and Settings.BGM_ENABLED or true
    end

    -- 感度適用
    Settings.DEGREES_PER_FRAME = GameState.getDegreesForSensitivity(GameState.currentSensitivity)

    -- クランク履歴初期化
    for i = 1, Settings.CRANK_HISTORY_SIZE do
        GameState.crankDeltaHistory[i] = 0
    end
end

-- 感度名から角度を取得するヘルパー関数
function GameState.getDegreesForSensitivity(sensitivityName, triedDefault)
    for _, option in ipairs(Settings.SENSITIVITY_OPTIONS) do
        if option.name == sensitivityName then
            return option.degrees
        end
    end
    -- 見つからない場合は、設定上のデフォルト感度にフォールバックする
    if not triedDefault and Settings.DEFAULT_SENSITIVITY ~= nil and sensitivityName ~= Settings.DEFAULT_SENSITIVITY then
        return GameState.getDegreesForSensitivity(Settings.DEFAULT_SENSITIVITY, true)
    end
    -- デフォルト感度も見つからない場合の最終的なフォールバック値
    return 120
end

-- 設定を保存するヘルパー関数
function GameState.saveSettings()
    -- 数値キーを文字列キーに変換（JSONでキー0が消失する問題を回避）
    local hiScoresForSave = {}
    for k, v in pairs(GameState.hiScores) do
        hiScoresForSave[tostring(k)] = v
    end
    playdate.datastore.write({
        hiScores = hiScoresForSave,
        bgmEnabled = Sound.isBGMEnabled(),
        lastSelectedStage = GameState.lastSelectedStage,
        sensitivity = GameState.currentSensitivity
    })
end

-- タイトル画面にリセット
function GameState.resetToTitle()
    GameState.currentScene = GameState.SCENE_TITLE
    Title.reset()
    Sound.playBGM("title")

    -- ゲーム状態をリセット
    GameState.animImages = nil
    GameState.frameCount = 0
    GameState.currentAnimationName = nil
    GameState.showResult = false
    GameState.isPaused = false
    GameState.isGrabbing = false
    GameState.isPlacing = false
    GameState.isChecking = false
    GameState.isWaitingResult = false
    GameState.isPlayingClearAnim = false

    -- チュートリアル状態をリセット
    if Tutorial then
        Tutorial.reset()
    end

    Transition.reset()
end

-- ゲームを開始（タイトルからゲームへ遷移）
function GameState.startGame(stageIndex)
    -- ゲームBGMを再生
    Sound.playBGM("game")

    -- アニメーション画像を読み込む
    local animationName = Stages.getAnimation(stageIndex)
    local imagePath = Stages.getImagePath(stageIndex)
    GameState.currentAnimationName = animationName
    GameState.currentStageIndex = stageIndex
    GameState.animImages = gfx.imagetable.new(imagePath)
    GameState.frameCount = #GameState.animImages

    -- パズルを初期化してシャッフル
    Puzzle.init(GameState.frameCount)
    Puzzle.shuffle()

    -- 現在のステージのハイスコアを取得
    GameState.currentHiScore = GameState.hiScores[stageIndex]

    -- タイマーリセット
    GameState.startTime = playdate.getCurrentTimeMilliseconds()
    GameState.clearTime = 0

    -- フレーム表示状態リセット
    GameState.isFirstFrame = true
    GameState.currentFrameIndex = 1
    GameState.lastDisplayedFrame = 1
    GameState.accumulatedAngle = 0
    GameState.lastCrankPosition = playdate.getCrankPosition()
    GameState.showGrayFrame = false

    -- スライドアウト状態リセット
    GameState.slideOutAnimations = {}

    -- スライドイン状態リセット
    GameState.slideInAnimations = {}

    -- 掴み状態リセット
    GameState.grabbedFrameImage = nil
    GameState.grabbedFromIndex = nil
    GameState.isGrabbing = false
    GameState.grabAnimProgress = 0

    -- 置き状態リセット
    GameState.isPlacing = false
    GameState.placeAnimProgress = 0
    GameState.placeTargetIndex = nil
    GameState.placingFrameImage = nil
    GameState.justPlacedIndex = nil

    -- 結果表示リセット
    GameState.showResult = false
    GameState.resultCorrect = false

    -- チェック演出リセット
    GameState.isChecking = false
    GameState.checkAnimFrame = 0
    GameState.checkAnimTimer = 0
    GameState.checkStartIndex = 1
    GameState.isWaitingResult = false
    GameState.waitResultTimer = 0
    GameState.showCheckBlackFrame = false

    -- 操作ヒントリセット
    GameState.idleTimer = 0
    GameState.showHint = false

    -- ポーズ状態リセット
    GameState.isPaused = false
    GameState.pauseStartTime = 0
    GameState.totalPausedTime = 0

    -- クランク履歴リセット
    for i = 1, Settings.CRANK_HISTORY_SIZE do
        GameState.crankDeltaHistory[i] = 0
    end
    GameState.crankHistoryIndex = 1
    GameState.crankHistorySum = 0
    GameState.smoothedCrankDelta = 0

    -- クランク状態リセット
    GameState.isCrankIdle = true
    GameState.isQuickStarting = false

    -- チュートリアル状態の初期化
    if Tutorial then
        Tutorial.init(stageIndex)
    end
end

-- 操作がブロックされているか判定
function GameState.isBlocked()
    local tutorialBlocked = Tutorial and Tutorial.isOverlayVisible() or false
    return GameState.isGrabbing or GameState.isPlacing or GameState.isChecking or
           GameState.isWaitingResult or GameState.showResult or GameState.isPaused or
           GameState.isPlayingClearAnim or tutorialBlocked
end

-- クランク操作がブロックされているか判定
function GameState.isCrankBlocked()
    -- Step 3（並び替え）の時は、オーバーレイ表示中でもクランク操作を許可
    if Tutorial and Tutorial.isTutorial() and Tutorial.getStep() == 3 and Tutorial.isOverlayVisible() then
        return false
    end
    local tutorialBlocked = Tutorial and Tutorial.isOverlayVisible() or false
    return GameState.isPlacing or GameState.isChecking or GameState.isWaitingResult or
           GameState.showResult or GameState.isPaused or GameState.isPlayingClearAnim or tutorialBlocked
end

-- イージング関数（outQuad: 減速しながら終わる）
function GameState.easeOutQuad(t)
    return 1 - (1 - t) * (1 - t)
end

-- イージング関数（outSine: サイン曲線で減速）
function GameState.easeOutSine(t)
    return math.sin(t * math.pi / 2)
end
