-- game/input.lua
-- クランク・ボタン入力処理モジュール

-- Input テーブル
Input = {}

-- クランク入力を処理し、回転量を返す
function Input.processCrank()
    local crankPosition = playdate.getCrankPosition()

    -- クランクの回転量を計算（-180〜180の範囲に正規化）
    local crankDelta = crankPosition - GameState.lastCrankPosition
    if crankDelta > 180 then
        crankDelta = crankDelta - 360
    elseif crankDelta < -180 then
        crankDelta = crankDelta + 360
    end
    GameState.lastCrankPosition = crankPosition

    -- クランク回転値を循環バッファに追加（O(1)）
    GameState.crankHistorySum = GameState.crankHistorySum - GameState.crankDeltaHistory[GameState.crankHistoryIndex] + crankDelta
    GameState.crankDeltaHistory[GameState.crankHistoryIndex] = crankDelta
    GameState.crankHistoryIndex = GameState.crankHistoryIndex % Settings.CRANK_HISTORY_SIZE + 1
    -- 平均値を計算（O(1)）
    GameState.smoothedCrankDelta = GameState.crankHistorySum / Settings.CRANK_HISTORY_SIZE

    -- クランクが「止まっている」かどうかを判定
    local wasIdle = GameState.isCrankIdle
    GameState.isCrankIdle = math.abs(GameState.smoothedCrankDelta) <= Settings.CRANK_IDLE_THRESHOLD

    -- IDLE状態になった瞬間に累積角度をリセット
    if not wasIdle and GameState.isCrankIdle then
        GameState.accumulatedAngle = 0
        GameState.isQuickStarting = false
    end

    -- IDLE状態から動き始めた瞬間にクイックスタートを開始
    if wasIdle and not GameState.isCrankIdle then
        GameState.isQuickStarting = true
    end

    return crankDelta, crankPosition
end

-- クランクによるフレーム移動を処理
-- 戻り値: frameMovedForward, frameMovedBackward, previousImageNum, backwardPreviousImageNum
function Input.processFrameMovement(crankDelta)
    local frameMovedForward = false
    local frameMovedBackward = false
    local previousImageNum = nil
    local backwardPreviousImageNum = nil

    local currentFrameCount = Puzzle.getCurrentCount()

    if not GameState.isCrankBlocked() then
        -- 累積角度に加算
        GameState.accumulatedAngle = GameState.accumulatedAngle + crankDelta

        -- クイックスタート中は小さい閾値を使用
        local threshold = Settings.DEGREES_PER_FRAME
        if GameState.isQuickStarting then
            threshold = Settings.DEGREES_PER_FRAME_QUICK
        end

        -- 累積角度がthresholdを超えたらフレームを変化
        while GameState.accumulatedAngle >= threshold do
            GameState.accumulatedAngle = GameState.accumulatedAngle - threshold
            if not frameMovedForward then
                previousImageNum = Puzzle.getFrameAt(GameState.currentFrameIndex)
            end
            GameState.currentFrameIndex = GameState.currentFrameIndex + 1
            if GameState.currentFrameIndex > currentFrameCount then
                GameState.currentFrameIndex = 1
            end
            frameMovedForward = true
            if GameState.isQuickStarting then
                GameState.accumulatedAngle = 0
                GameState.isQuickStarting = false
                break
            end
            threshold = Settings.DEGREES_PER_FRAME
        end

        while GameState.accumulatedAngle <= -threshold do
            GameState.accumulatedAngle = GameState.accumulatedAngle + threshold
            if not frameMovedBackward then
                backwardPreviousImageNum = Puzzle.getFrameAt(GameState.currentFrameIndex)
            end
            GameState.currentFrameIndex = GameState.currentFrameIndex - 1
            if GameState.currentFrameIndex < 1 then
                GameState.currentFrameIndex = currentFrameCount
            end
            frameMovedBackward = true
            if GameState.isQuickStarting then
                GameState.accumulatedAngle = 0
                GameState.isQuickStarting = false
                break
            end
            threshold = Settings.DEGREES_PER_FRAME
        end
    end

    return frameMovedForward, frameMovedBackward, previousImageNum, backwardPreviousImageNum
end

-- 操作ヒントのタイマー管理
function Input.updateIdleHint(crankDelta)
    if math.abs(crankDelta) > Settings.CRANK_THRESHOLD then
        GameState.idleTimer = 0
        GameState.showHint = false
    elseif GameState.isGrabbing or GameState.isPlacing or GameState.isChecking or GameState.isWaitingResult or GameState.showResult or GameState.isPaused then
        GameState.idleTimer = 0
        GameState.showHint = false
    else
        GameState.idleTimer = GameState.idleTimer + 1
        if GameState.idleTimer >= Settings.IDLE_THRESHOLD then
            GameState.showHint = true
        end
    end
end

-- 十字キーが押されているか
function Input.isDpadPressed()
    return playdate.buttonIsPressed(playdate.kButtonUp) or
           playdate.buttonIsPressed(playdate.kButtonDown) or
           playdate.buttonIsPressed(playdate.kButtonLeft) or
           playdate.buttonIsPressed(playdate.kButtonRight)
end

-- 掴み処理
function Input.processGrab(dpadPressed, frameIndex)
    -- チュートリアル Step 1: クランクを回す前は十字キー無効
    local tutorialStep1Block = Tutorial and Tutorial.isTutorial() and Tutorial.getStep() == 1

    if dpadPressed and not GameState.isBlocked() and not tutorialStep1Block then
        GameState.isGrabbing = true
        GameState.grabbedFromIndex = frameIndex
        GameState.grabbedFrameImage = Puzzle.grabFrame(frameIndex)
        GameState.grabAnimProgress = 0
        Sound.playGrab()

        -- チュートリアル: Step 2で掴み始めたらタイマー開始
        if Tutorial then
            Tutorial.onGrabStart()
        end

        -- 掴んだ後、インデックスが配列サイズを超えた場合は1に戻す
        local newCount = Puzzle.getCurrentCount()
        if GameState.currentFrameIndex > newCount then
            GameState.currentFrameIndex = 1
        end
        return true
    end
    return false
end

-- 掴むアニメーション進行
function Input.updateGrabAnimation()
    if GameState.isGrabbing and GameState.grabAnimProgress < 1 then
        GameState.grabAnimProgress = GameState.grabAnimProgress + (1 / Settings.GRAB_ANIM_DURATION)
        if GameState.grabAnimProgress > 1 then
            GameState.grabAnimProgress = 1
        end
    end
end

-- チュートリアル Step 2→3 遷移チェック
function Input.updateTutorialGrabHold()
    if Tutorial and Tutorial.isTutorial() and Tutorial.getStep() == 2 and GameState.isGrabbing then
        Tutorial.incrementGrabHoldTimer()
        if Tutorial.getGrabHoldTimer() >= Settings.TUTORIAL_GRAB_HOLD_THRESHOLD then
            Tutorial.setStep(3)
            Tutorial.resetIdleTimer()
            Tutorial.setOverlayVisible(true)
        end
    end
end

-- 置く処理
function Input.processPlace(dpadPressed, frameIndex)
    if not dpadPressed and GameState.isGrabbing then
        GameState.isGrabbing = false
        GameState.isPlacing = true
        GameState.placeAnimProgress = 0
        GameState.placingFrameImage = GameState.grabbedFrameImage
        GameState.placeTargetIndex = frameIndex
        GameState.grabbedFrameImage = nil
        GameState.grabbedFromIndex = nil
        Sound.stopGrab()
        Sound.playRelease()
        return true
    end
    return false
end

-- 置くアニメーション進行
function Input.updatePlaceAnimation()
    if GameState.isPlacing then
        GameState.placeAnimProgress = GameState.placeAnimProgress + (1 / Settings.PLACE_ANIM_DURATION)
        if GameState.placeAnimProgress >= 1 then
            GameState.placeAnimProgress = 1
            Puzzle.placeFrame(GameState.placeTargetIndex, GameState.placingFrameImage)
            GameState.isPlacing = false
            GameState.placingFrameImage = nil
            GameState.justPlacedIndex = GameState.placeTargetIndex

            -- チュートリアル Step 3: 置いた後に正解順かチェック
            if Tutorial and Tutorial.isTutorial() and Tutorial.getStep() == 3 then
                Tutorial.setHasPlaced(true)
                local isCorrect = Puzzle.isCorrectOrder()
                if isCorrect then
                    Tutorial.setStep(4)
                    Tutorial.resetIdleTimer()
                    Tutorial.setOverlayVisible(true)
                    Tutorial.setCorrectOrder(true)
                else
                    Tutorial.setStep(2)
                    Tutorial.resetIdleTimer()
                    Tutorial.setOverlayVisible(false)
                    Tutorial.resetGrabHoldTimer()
                end
            end
            GameState.placeTargetIndex = nil
            return true
        end
    end
    return false
end

-- Bボタン処理（ポーズ・デバッグ即クリア）
-- 戻り値: debugInstantClear
function Input.processBButton()
    local currentTime = playdate.getCurrentTimeMilliseconds()
    local debugInstantClear = false

    if Debug.enabled then
        -- デバッグモード: Bボタン長押しで即クリア
        if playdate.buttonJustPressed(playdate.kButtonB) and not GameState.isBlocked() then
            GameState.bButtonPressStart = currentTime
            GameState.bButtonHoldTriggered = false
        end

        local debugHoldComplete = GameState.bButtonPressStart > 0 and
                                  not GameState.bButtonHoldTriggered and
                                  (currentTime - GameState.bButtonPressStart) >= GameState.DEBUG_HOLD_DURATION

        if debugHoldComplete then
            GameState.bButtonHoldTriggered = true
            GameState.clearTime = playdate.getCurrentTimeMilliseconds() - GameState.startTime - GameState.totalPausedTime
            GameState.resultCorrect = true
            GameState.showResult = true
            GameState.resultAnimTime = 0
            GameState.isNewHiScore = false
            Sound.playOK()
            Sound.playClear()
            GameState.idleTimer = 0
            GameState.showHint = false
            debugInstantClear = true
        end
    else
        -- 通常モード: Bボタンを押した瞬間にポーズ
        if playdate.buttonJustPressed(playdate.kButtonB) and not GameState.isBlocked() then
            GameState.isPaused = true
            GameState.pauseStartTime = playdate.getCurrentTimeMilliseconds()
            GameState.idleTimer = 0
            GameState.showHint = false
        end
    end

    return debugInstantClear
end

-- デバッグモード: Bボタンを離した時の処理
function Input.processBButtonRelease()
    if Debug.enabled and playdate.buttonJustReleased(playdate.kButtonB) and GameState.bButtonPressStart > 0 then
        if not GameState.bButtonHoldTriggered and not GameState.isBlocked() then
            GameState.isPaused = true
            GameState.pauseStartTime = playdate.getCurrentTimeMilliseconds()
            GameState.idleTimer = 0
            GameState.showHint = false
        end
        GameState.bButtonPressStart = 0
        GameState.bButtonHoldTriggered = false
        return GameState.isPaused
    end
    return false
end

-- Aボタンでチェック開始
function Input.processAButtonCheck(frameIndex)
    -- チュートリアル Step 1: オーバーレイ表示中でもAボタンを許可
    local canCheck = not GameState.isBlocked()
    if Tutorial and Tutorial.isTutorial() and Tutorial.getStep() == 1 and Tutorial.isOverlayVisible() then
        canCheck = true
    end

    -- スライドアニメーション中はチェック不可
    if #GameState.slideOutAnimations > 0 or #GameState.slideInAnimations > 0 then
        canCheck = false
    end

    if playdate.buttonJustPressed(playdate.kButtonA) and canCheck then
        GameState.isChecking = true
        GameState.checkAnimFrame = 0
        GameState.checkAnimTimer = 0
        GameState.checkStartIndex = frameIndex
        GameState.resultCorrect = Puzzle.isCorrectOrder()
        GameState.idleTimer = 0
        GameState.showHint = false

        -- チュートリアル: 答え合わせ中はオーバーレイを非表示
        if Tutorial then
            Tutorial.hideOverlay()
            Tutorial.onCheckPressed()
        end

        return true
    end
    return false
end

-- チェック演出の処理
function Input.updateCheckAnimation()
    if GameState.isChecking then
        GameState.checkAnimTimer = GameState.checkAnimTimer + 1
        if GameState.checkAnimTimer >= Settings.CHECK_FRAME_INTERVAL then
            GameState.checkAnimTimer = 0
            GameState.checkAnimFrame = GameState.checkAnimFrame + 1
            GameState.showCheckBlackFrame = true
            if GameState.checkAnimFrame % 2 == 0 then
                Sound.playFlip()
            end

            if GameState.checkAnimFrame >= Puzzle.frameCount * 2 then
                GameState.isChecking = false
                GameState.isWaitingResult = true
                GameState.waitResultTimer = 0
            end
        end
    end
end

-- 結果待ちの処理
function Input.updateWaitResult()
    if GameState.isWaitingResult then
        GameState.waitResultTimer = GameState.waitResultTimer + 1
        if GameState.waitResultTimer >= Settings.WAIT_RESULT_DURATION then
            GameState.isWaitingResult = false
            GameState.showResult = true
            GameState.resultAnimTime = 0
            if GameState.resultCorrect then
                GameState.clearTime = playdate.getCurrentTimeMilliseconds() - GameState.startTime - GameState.totalPausedTime
                -- ハイスコア判定
                if GameState.currentHiScore == nil or GameState.clearTime < GameState.currentHiScore then
                    GameState.currentHiScore = GameState.clearTime
                    GameState.hiScores[GameState.currentStageIndex] = GameState.clearTime
                    GameState.isNewHiScore = true
                    GameState.saveSettings()
                else
                    GameState.isNewHiScore = false
                end
                Sound.playOK()
                Sound.playClear()
            else
                GameState.isNewHiScore = false
                Sound.playNG()
            end
        end
    end
end

-- ポーズ画面の入力処理
-- 戻り値: shouldReturn (trueの場合、メインループを抜ける)
function Input.processPauseInput()
    local tutorialCleared = GameState.hiScores[Settings.TUTORIAL_STAGE_INDEX] ~= nil

    if GameState.isPaused then
        if playdate.buttonJustPressed(playdate.kButtonB) then
            GameState.isPaused = false
            GameState.totalPausedTime = GameState.totalPausedTime + (playdate.getCurrentTimeMilliseconds() - GameState.pauseStartTime)
            return false
        elseif playdate.buttonJustPressed(playdate.kButtonA) and tutorialCleared then
            GameState.isPaused = false
            GameState.hideFrameDuringTransition = true
            Sound.playSelected()
            Transition.start(
                function()
                    GameState.currentScene = GameState.SCENE_SELECTION
                    Selection.setSelectedIndex(GameState.lastSelectedStage)
                    Selection.resetCrankState()
                    Selection.loadThumbnails(GameState.hiScores)
                    Sound.playBGM("selection")
                    GameState.hideFrameDuringTransition = false
                end,
                nil
            )
            return true
        end
    end
    return false
end

-- 結果表示中の入力処理
-- 戻り値: shouldReturn (trueの場合、メインループを抜ける)
function Input.processResultInput(crankDelta, debugInstantClear)
    if GameState.showResult and not debugInstantClear and not GameState.isPlayingClearAnim then
        if GameState.resultCorrect then
            GameState.resultAnimTime = GameState.resultAnimTime + 0.1
        end

        if GameState.resultCorrect then
            if playdate.buttonJustPressed(playdate.kButtonA) then
                GameState.showResult = false
                GameState.hideFrameDuringTransition = true
                Sound.playSelected()
                Transition.start(
                    function()
                        GameState.currentScene = GameState.SCENE_SELECTION
                        Selection.setSelectedIndex(GameState.lastSelectedStage)
                        Selection.resetCrankState()
                        Selection.loadThumbnails(GameState.hiScores)
                        Sound.playBGM("selection")
                        GameState.hideFrameDuringTransition = false
                    end,
                    nil
                )
                return true
            elseif playdate.buttonJustPressed(playdate.kButtonB) then
                GameState.isPlayingClearAnim = true
                GameState.clearAnimFrame = 1
                GameState.clearAnimTimer = 0
                GameState.clearAnimLoopCount = 0
                Sound.playSelected()
            end
        else
            if playdate.buttonJustPressed(playdate.kButtonA) or
               playdate.buttonJustPressed(playdate.kButtonB) or
               math.abs(crankDelta) > Settings.CRANK_THRESHOLD then
                GameState.showResult = false
            end
        end
    end
    return false
end

-- クリアアニメーション再生の処理
function Input.updateClearAnimation()
    if GameState.isPlayingClearAnim then
        local animStarted = GameState.clearAnimTimer > 0 or GameState.clearAnimFrame > 1 or GameState.clearAnimLoopCount > 0
        if animStarted and (playdate.buttonJustPressed(playdate.kButtonA) or playdate.buttonJustPressed(playdate.kButtonB)) then
            GameState.isPlayingClearAnim = false
        else
            GameState.clearAnimTimer = GameState.clearAnimTimer + 1
            if GameState.clearAnimTimer >= GameState.CLEAR_ANIM_FRAME_INTERVAL then
                GameState.clearAnimTimer = 0
                GameState.clearAnimFrame = GameState.clearAnimFrame + 1
                Sound.playFlip()
                GameState.showCheckBlackFrame = true

                if GameState.clearAnimFrame > GameState.frameCount then
                    GameState.clearAnimFrame = 1
                    GameState.clearAnimLoopCount = GameState.clearAnimLoopCount + 1

                    if GameState.clearAnimLoopCount >= GameState.CLEAR_ANIM_LOOPS then
                        GameState.isPlayingClearAnim = false
                    end
                end
            end
        end
    end
end

-- スライドアニメーション進行
function Input.updateSlideAnimations()
    if not GameState.isChecking then
        -- スライドアウトアニメーション
        for i = #GameState.slideOutAnimations, 1, -1 do
            local anim = GameState.slideOutAnimations[i]
            anim.progress = anim.progress + (1 / Settings.SLIDE_OUT_DURATION)
            if anim.progress >= 1 then
                table.remove(GameState.slideOutAnimations, i)
            end
        end

        -- スライドインアニメーション
        for i = #GameState.slideInAnimations, 1, -1 do
            local anim = GameState.slideInAnimations[i]
            anim.progress = anim.progress + (1 / Settings.SLIDE_IN_DURATION)
            if anim.progress >= 1 then
                table.remove(GameState.slideInAnimations, i)
            end
        end
    end
end
