-- gurupara - Playdate Game
-- クランクでアニメーションを制御する

-- CoreLibs
import "CoreLibs/ui"

-- config
import "config/settings"

-- core
import "core/stages"
import "core/sound"
import "core/puzzle"
import "core/debug"
import "core/transition"

-- game (リファクタリングされたモジュール)
import "game/state"
import "game/tutorial"
import "game/renderer"
import "game/input"

-- ui
import "ui/title"
import "ui/selection"

local gfx = playdate.graphics

-- システムフォント Roobert（3サイズ）
local fontLarge = gfx.font.new("fonts/Roobert/Roobert-24-Medium")  -- 24px (見出し用)
local fontSmall = gfx.font.new("fonts/Roobert/Roobert-20-Medium")  -- 20px (本文用)
local fontIcon = gfx.font.new("fonts/Roobert/Roobert-11-Medium")   -- 11px (ボタンアイコン用、✛Ⓐ等含む)

-- フォントをモジュールに設定
Renderer.setFonts(fontLarge, fontSmall, fontIcon)
Tutorial.setFonts(fontSmall, fontIcon)

-- ステージ情報をスキャン（imagesフォルダから自動検出）
Stages.scanImages()

-- タイトル画面を初期化
Title.init()

-- セレクション画面を初期化
Selection.init()

-- GameState を初期化
GameState.init()

-- BGM設定を適用
Sound.setBGMEnabled(GameState.bgmEnabled)

-- 最後に選んだステージにカーソルを設定
Selection.setSelectedIndex(GameState.lastSelectedStage)

-- クランク インジケーターの存在確認
if playdate.ui and playdate.ui.crankIndicator then
    print("✓ Crank indicator available")
else
    print("✗ Crank indicator NOT available")
end

-- 乱数シードを設定
math.randomseed(playdate.getSecondsSinceEpoch())

-- タイトルBGMを再生
Sound.playBGM("title")

function playdate.update()
    -- debugモードが変更されていたらタイトル画面にリセット
    if Debug.checkAndClearReset() then
        GameState.resetToTitle()
        return
    end

    -- 波アニメーションのフェーズを更新
    GameState.wavePhase = GameState.wavePhase + Settings.THUMBNAIL_WAVE_SPEED * 0.1

    -- トランジション処理
    if Transition.isActive() then
        Renderer.drawCurrentScene()
        Transition.update()
        Transition.draw()
        return
    end

    -- タイトル画面の処理
    if GameState.currentScene == GameState.SCENE_TITLE then
        updateTitleScene()
        return
    end

    -- セレクション画面の処理
    if GameState.currentScene == GameState.SCENE_SELECTION then
        updateSelectionScene()
        return
    end

    -- ゲーム画面の処理
    updateGameScene()
end

-- タイトル画面更新
function updateTitleScene()
    Title.update()
    Title.draw()
    if Title.checkInput() then
        -- クリア済みステージ数をカウント
        local clearedCount = 0
        for _, _ in pairs(GameState.hiScores) do
            clearedCount = clearedCount + 1
        end

        if clearedCount == 0 and Stages.isAvailable(0) then
            -- 何もクリアしていない場合、直接ステージ0（チュートリアル）に入る
            GameState.lastSelectedStage = 0
            Sound.playSelected()
            Transition.start(
                function()
                    GameState.startGame(0)
                    GameState.currentScene = GameState.SCENE_GAME
                end,
                nil
            )
        else
            -- クリア済みステージがある、またはステージ0が利用不可の場合、セレクション画面へ
            GameState.currentScene = GameState.SCENE_SELECTION
            Selection.resetCrankState()
            Selection.loadThumbnails(GameState.hiScores)
            Sound.playBGM("selection")
        end
    end
end

-- セレクション画面更新
function updateSelectionScene()
    -- クリア済みステージ数を計算
    local clearedCount = 0
    for _, _ in pairs(GameState.hiScores) do
        clearedCount = clearedCount + 1
    end
    Selection.setProgressInfo(clearedCount, Selection.getTotalStages())

    -- デバッグ情報を設定
    Debug.set("clearedStages", clearedCount)
    Debug.set("totalStages", Selection.getTotalStages())

    Selection.update()
    Selection.draw()
    Debug.draw()

    if Selection.checkStartGame() and Selection.isStageAvailable() then
        -- 選んだステージを記憶
        GameState.lastSelectedStage = Selection.getSelectedIndex()
        GameState.saveSettings()
        Sound.playSelected()
        Transition.start(
            function()
                GameState.startGame(GameState.lastSelectedStage)
                GameState.currentScene = GameState.SCENE_GAME
            end,
            nil
        )
    end
end

-- ゲーム画面更新
function updateGameScene()
    -- クランク入力を処理
    local crankDelta, crankPosition = Input.processCrank()

    -- フレーム移動を処理
    local frameMovedForward, frameMovedBackward, previousImageNum, backwardPreviousImageNum = Input.processFrameMovement(crankDelta)

    -- 操作ヒントのタイマー管理
    Input.updateIdleHint(crankDelta)

    -- チュートリアルオーバーレイのタイマー管理
    if Tutorial then
        local isBlocked = GameState.isGrabbing or GameState.isPlacing or GameState.isChecking or
                          GameState.isWaitingResult or GameState.showResult or GameState.isPaused
        Tutorial.updateOverlay(crankDelta, isBlocked)
    end

    local frameIndex = GameState.currentFrameIndex

    -- フレームが変わったら紙めくり音を再生＆アニメーション開始
    if frameIndex ~= GameState.lastDisplayedFrame then
        if not GameState.isFirstFrame then
            if frameMovedForward and previousImageNum then
                Sound.playFlip()
                table.insert(GameState.slideOutAnimations, {
                    progress = 0,
                    imageNum = previousImageNum
                })
            elseif frameMovedBackward and backwardPreviousImageNum then
                Sound.playFlipBack()
                table.insert(GameState.slideInAnimations, {
                    progress = 0,
                    imageNum = Puzzle.getFrameAt(GameState.currentFrameIndex),
                    backgroundImageNum = backwardPreviousImageNum
                })
            end
        end
        GameState.lastDisplayedFrame = frameIndex

        -- チュートリアル Step 1 完了
        if Tutorial then
            Tutorial.onFrameChanged()
        end
    end
    GameState.isFirstFrame = false

    -- スライドアニメーション進行
    Input.updateSlideAnimations()

    -- 十字キーの状態
    local dpadPressed = Input.isDpadPressed()

    -- Bボタン処理
    local wasPaused = GameState.isPaused
    local debugInstantClear = Input.processBButton()

    -- ポーズ開始フレームは残りの入力処理をスキップして描画のみ
    if GameState.isPaused and not wasPaused then
        drawGameScene(crankDelta, frameIndex)
        return
    end

    -- Aボタンでチェック開始
    Input.processAButtonCheck(frameIndex)

    -- デバッグモード: Bボタンを離した時の処理
    if Input.processBButtonRelease() then
        drawGameScene(crankDelta, frameIndex)
        return
    end

    -- 十字キー処理（掴む）
    Input.processGrab(dpadPressed, frameIndex)

    -- 掴むアニメーション進行
    Input.updateGrabAnimation()

    -- チュートリアル Step 2→3 遷移チェック
    Input.updateTutorialGrabHold()

    -- 置く処理
    Input.processPlace(dpadPressed, frameIndex)

    -- 置くアニメーション進行
    Input.updatePlaceAnimation()

    -- チェック演出の処理
    Input.updateCheckAnimation()

    -- 結果待ちの処理
    Input.updateWaitResult()

    -- ポーズ画面の入力処理
    if Input.processPauseInput() then
        return
    end

    -- 結果表示中の入力処理
    if Input.processResultInput(crankDelta, debugInstantClear) then
        return
    end

    -- クリアアニメーション再生の処理
    Input.updateClearAnimation()

    -- 描画処理
    drawGameScene(crankDelta, frameIndex)
end

-- ゲーム画面描画
function drawGameScene(crankDelta, frameIndex)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT

    -- 画面をクリア
    gfx.clear()

    -- コマ変化時のグレーフレーム表示
    local isGrayFrame = GameState.showGrayFrame
    if GameState.showGrayFrame then
        gfx.clear(gfx.kColorWhite)
        gfx.setColor(gfx.kColorBlack)
        gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
        gfx.fillRect(0, 0, 400, 240)
        GameState.showGrayFrame = false
    end

    -- チェック演出中のフレーム変化時に半透明黒画面を表示
    local isCheckBlackFrame = GameState.showCheckBlackFrame
    if GameState.showCheckBlackFrame then
        gfx.setColor(gfx.kColorBlack)
        gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
        gfx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
        GameState.showCheckBlackFrame = false
    end

    -- メイン画面に表示するフレームを決定
    local displayIndex = frameIndex
    if GameState.isChecking then
        displayIndex = ((GameState.checkStartIndex - 1 + GameState.checkAnimFrame) % Puzzle.frameCount) + 1
    elseif GameState.justPlacedIndex then
        if math.abs(crankDelta) > 1 then
            GameState.justPlacedIndex = nil
        else
            displayIndex = GameState.justPlacedIndex
        end
    end

    -- 掴んでいる間のメイン表示オフセット計算
    local mainOffsetX = 0
    local mainOffsetY = 0
    if GameState.isGrabbing then
        mainOffsetX = Settings.IMAGE_OFFSET_X * GameState.easeOutQuad(GameState.grabAnimProgress)
        mainOffsetY = Settings.IMAGE_OFFSET_Y * GameState.easeOutQuad(GameState.grabAnimProgress)
    elseif GameState.isPlacing then
        mainOffsetX = Settings.IMAGE_OFFSET_X * (1 - GameState.easeOutQuad(GameState.placeAnimProgress))
        mainOffsetY = Settings.IMAGE_OFFSET_Y * (1 - GameState.easeOutQuad(GameState.placeAnimProgress))
    end

    -- メインフレームを描画
    if not isGrayFrame and not isCheckBlackFrame and not GameState.isPaused and (not (GameState.showResult and GameState.resultCorrect) or GameState.isPlayingClearAnim) then
        if GameState.isPlayingClearAnim then
            local image = GameState.animImages:getImage(GameState.clearAnimFrame)
            if image then
                image:drawScaled(GameState.imageX + mainOffsetX, GameState.imageY + mainOffsetY, Settings.MAIN_DISPLAY_SCALE, Settings.MAIN_DISPLAY_SCALE)
            end
        else
            local currentCount = Puzzle.getCurrentCount()
            local drawIndex = displayIndex
            if currentCount > 0 and drawIndex >= 1 and drawIndex <= currentCount then
                local imageNum
                if #GameState.slideInAnimations > 0 then
                    local latestAnim = GameState.slideInAnimations[#GameState.slideInAnimations]
                    if latestAnim.backgroundImageNum then
                        imageNum = latestAnim.backgroundImageNum
                    else
                        imageNum = Puzzle.getFrameAt(drawIndex)
                    end
                else
                    imageNum = Puzzle.getFrameAt(drawIndex)
                end
                local image = GameState.animImages:getImage(imageNum)
                if image then
                    image:drawScaled(GameState.imageX + mainOffsetX, GameState.imageY + mainOffsetY, Settings.MAIN_DISPLAY_SCALE, Settings.MAIN_DISPLAY_SCALE)
                end
            end

            -- スライドアウトアニメーション
            Renderer.drawSlideOutAnimations(GameState.animImages, mainOffsetX, mainOffsetY)

            -- スライドインアニメーション
            Renderer.drawSlideInAnimations(GameState.animImages, mainOffsetX, mainOffsetY)
        end
    end

    -- 掴んだフレームをサムネイル表示
    if GameState.isGrabbing and GameState.grabbedFrameImage then
        Renderer.drawGrabbedThumbnail(GameState.animImages, GameState.grabbedFrameImage, GameState.grabAnimProgress)
    end

    -- 置くアニメーション
    if GameState.isPlacing and GameState.placingFrameImage then
        Renderer.drawPlacingThumbnail(GameState.animImages, GameState.placingFrameImage, GameState.placeAnimProgress)
    end

    -- 結果表示
    if GameState.showResult and not GameState.isPlayingClearAnim then
        if GameState.resultCorrect then
            Renderer.drawResultOK(GameState.clearTime, GameState.isNewHiScore)
        else
            Renderer.drawResultNG()
        end
    end

    -- ポーズ画面表示
    if GameState.isPaused then
        local tutorialCleared = GameState.hiScores[Settings.TUTORIAL_STAGE_INDEX] ~= nil
        Renderer.drawPauseScreen(GameState.currentHiScore, GameState.startTime, GameState.totalPausedTime, GameState.pauseStartTime, tutorialCleared)
    end

    -- チュートリアルオーバーレイを描画
    if Tutorial then
        Tutorial.drawOverlay()
    end

    -- デバッグ情報をセット
    Debug.set("crankPosition", playdate.getCrankPosition())
    Debug.set("frameIndex", GameState.currentFrameIndex)
    Debug.set("frameCount", Puzzle.frameCount)
    Debug.set("crankIdle", GameState.isCrankIdle and "IDLE" or "MOVING")
    local clearedCount = 0
    for _, _ in pairs(GameState.hiScores) do
        clearedCount = clearedCount + 1
    end
    Debug.set("clearedStages", clearedCount)
    Debug.set("totalStages", Selection.getTotalStages())
    if Tutorial and Tutorial.isTutorial() then
        Debug.set("tutorialStep", Tutorial.getStep())
        Debug.set("tutorialIdle", Tutorial.idleTimer)
        Debug.set("tutorialOverlay", Tutorial.isOverlayVisible() and "VISIBLE" or "HIDDEN")
    end
    Debug.draw()

    -- 再生状態アイコンを描画
    Renderer.drawPlaybackIcon(GameState.smoothedCrankDelta)

    -- 操作ヒントを描画（チュートリアル中は非表示）
    if GameState.showHint and not GameState.isPaused and not (Tutorial and Tutorial.isTutorial()) then
        -- 1行目: ✛ grab
        gfx.setFont(fontIcon)
        gfx.drawText("✛", Settings.HINT_LINE1_X, Settings.HINT_LINE1_Y + 4)
        local iconW = gfx.getTextSize("✛")
        gfx.setFont(fontSmall)
        gfx.drawText("grab", Settings.HINT_LINE1_X + iconW + Settings.HINT_ICON_GAP, Settings.HINT_LINE1_Y)
        -- 2行目: Ⓐ check
        gfx.setFont(fontIcon)
        gfx.drawText("Ⓐ", Settings.HINT_LINE2_X, Settings.HINT_LINE2_Y + 4)
        iconW = gfx.getTextSize("Ⓐ")
        gfx.setFont(fontSmall)
        gfx.drawText("check", Settings.HINT_LINE2_X + iconW + Settings.HINT_ICON_GAP, Settings.HINT_LINE2_Y)
        -- クランクインジケーターを表示
        if playdate.ui and playdate.ui.crankIndicator then
            playdate.ui.crankIndicator:draw()
        end
    end

    -- チュートリアルStep 1とStep 3の時、クランク インジケーターを描画
    if Tutorial and Tutorial.shouldShowCrankIndicator() then
        if playdate.ui and playdate.ui.crankIndicator then
            playdate.ui.crankIndicator:draw()
        end
    end
end

-- システムメニューを設定
Debug.setupMenu(function(value)
    if value == Debug.MODE_COMPLETE then
        for i = 0, 27 do
            if Stages.isAvailable(i) then
                GameState.hiScores[i] = 99999999
            end
        end
        GameState.saveSettings()
        if GameState.currentScene == GameState.SCENE_SELECTION then
            Selection.loadThumbnails(GameState.hiScores)
        end
    elseif value == Debug.MODE_INIT then
        GameState.hiScores = {}
        GameState.lastSelectedStage = 0
        GameState.currentSensitivity = Settings.DEFAULT_SENSITIVITY
        Settings.DEGREES_PER_FRAME = GameState.getDegreesForSensitivity(GameState.currentSensitivity)
        Sound.setBGMEnabled(Settings.BGM_ENABLED)
        playdate.datastore.delete()
        if GameState.currentScene == GameState.SCENE_SELECTION then
            Selection.loadThumbnails(GameState.hiScores)
            Selection.setSelectedIndex(0)
        end
    end
end)

-- BGM ON/OFFメニュー項目
local menu = playdate.getSystemMenu()
menu:addCheckmarkMenuItem("BGM", Sound.isBGMEnabled(), function(value)
    Sound.setBGMEnabled(value)
    GameState.saveSettings()
end)

-- 感度設定メニュー項目
local sensitivityNames = {}
for _, option in ipairs(Settings.SENSITIVITY_OPTIONS) do
    table.insert(sensitivityNames, option.name)
end
menu:addOptionsMenuItem("Crank", sensitivityNames, GameState.currentSensitivity, function(value)
    GameState.currentSensitivity = value
    Settings.DEGREES_PER_FRAME = GameState.getDegreesForSensitivity(value)
    GameState.saveSettings()
end)

-- システムメニューが開く前にメニュー背景画像を設定
function playdate.gameWillPause()
    local menuImage = gfx.image.new(400, 240)
    gfx.pushContext(menuImage)
        Renderer.drawCurrentScene(true)
    gfx.popContext()
    playdate.setMenuImage(menuImage)
end

-- システムメニューを閉じた後の処理
function playdate.gameWillResume()
    if GameState.currentScene == GameState.SCENE_SELECTION then
        Selection.resetCrankState()
    elseif GameState.currentScene == GameState.SCENE_GAME then
        GameState.lastCrankPosition = playdate.getCrankPosition()
        GameState.accumulatedAngle = 0
    end
end
