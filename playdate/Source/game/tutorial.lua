-- game/tutorial.lua
-- チュートリアル状態管理モジュール

local gfx = playdate.graphics

-- Tutorial テーブル
Tutorial = {}

-- チュートリアル状態
Tutorial.isTutorialStage = false
Tutorial.step = 0              -- 0=none, 1=crank, 2=grab, 3=arrange, 4=check, 5=done
Tutorial.idleTimer = 0
Tutorial.overlayVisible = false
Tutorial.hasGrabbed = false
Tutorial.hasPlaced = false
Tutorial.correctOrder = false
Tutorial.grabHoldTimer = 0     -- 十字キー押し続け時間（Step 2→3遷移用）

-- フォント参照（main.luaから設定される）
Tutorial.fontSmall = nil
Tutorial.fontIcon = nil

-- 初期化（ゲーム開始時に呼ばれる）
function Tutorial.init(stageIndex)
    Tutorial.isTutorialStage = (stageIndex == Settings.TUTORIAL_STAGE_INDEX)
    if Tutorial.isTutorialStage then
        Tutorial.step = 1  -- Step 1（クランク）から開始
        Tutorial.idleTimer = 0
        Tutorial.overlayVisible = false
        Tutorial.hasGrabbed = false
        Tutorial.hasPlaced = false
        Tutorial.correctOrder = false
        Tutorial.grabHoldTimer = 0
    else
        Tutorial.step = 0
        Tutorial.overlayVisible = false
    end
end

-- リセット（タイトルに戻る時）
function Tutorial.reset()
    Tutorial.isTutorialStage = false
    Tutorial.step = 0
    Tutorial.idleTimer = 0
    Tutorial.overlayVisible = false
    Tutorial.hasGrabbed = false
    Tutorial.hasPlaced = false
    Tutorial.correctOrder = false
    Tutorial.grabHoldTimer = 0
end

-- フォント設定
function Tutorial.setFonts(fontSmall, fontIcon)
    Tutorial.fontSmall = fontSmall
    Tutorial.fontIcon = fontIcon
end

-- 状態取得
function Tutorial.isTutorial()
    return Tutorial.isTutorialStage
end

function Tutorial.getStep()
    return Tutorial.step
end

function Tutorial.setStep(step)
    Tutorial.step = step
end

function Tutorial.isOverlayVisible()
    return Tutorial.overlayVisible
end

function Tutorial.setOverlayVisible(visible)
    Tutorial.overlayVisible = visible
end

function Tutorial.getGrabHoldTimer()
    return Tutorial.grabHoldTimer
end

function Tutorial.setGrabHoldTimer(timer)
    Tutorial.grabHoldTimer = timer
end

function Tutorial.incrementGrabHoldTimer()
    Tutorial.grabHoldTimer = Tutorial.grabHoldTimer + 1
end

function Tutorial.resetGrabHoldTimer()
    Tutorial.grabHoldTimer = 0
end

function Tutorial.setHasGrabbed(value)
    Tutorial.hasGrabbed = value
end

function Tutorial.setHasPlaced(value)
    Tutorial.hasPlaced = value
end

function Tutorial.setCorrectOrder(value)
    Tutorial.correctOrder = value
end

function Tutorial.resetIdleTimer()
    Tutorial.idleTimer = 0
end

-- オーバーレイのタイマー管理
-- crankDelta: クランクの回転量
-- isBlocked: 他のアクション中かどうか
function Tutorial.updateOverlay(crankDelta, isBlocked)
    if not Tutorial.isTutorialStage or Tutorial.step < 1 or Tutorial.step > 4 then
        return
    end

    if Tutorial.overlayVisible then
        -- オーバーレイ表示中: 操作で閉じる
        local anyButtonPressed = playdate.buttonJustPressed(playdate.kButtonA) or
                                 playdate.buttonJustPressed(playdate.kButtonB) or
                                 playdate.buttonJustPressed(playdate.kButtonUp) or
                                 playdate.buttonJustPressed(playdate.kButtonDown) or
                                 playdate.buttonJustPressed(playdate.kButtonLeft) or
                                 playdate.buttonJustPressed(playdate.kButtonRight)
        local crankMoved = math.abs(crankDelta) > Settings.CRANK_THRESHOLD

        -- Step 1: クランク操作のみでオーバーレイを閉じる（ボタンでは閉じない）
        -- Step 2-4: 任意のボタンまたはクランク操作で閉じる
        local shouldClose = false
        if Tutorial.step == 1 then
            shouldClose = crankMoved
        else
            shouldClose = (anyButtonPressed or crankMoved)
        end

        if shouldClose then
            Tutorial.overlayVisible = false
            Tutorial.idleTimer = 0
        end
    else
        -- オーバーレイ非表示中: アイドルタイマーをカウント
        if isBlocked then
            -- アクション中はタイマーをリセット
            Tutorial.idleTimer = 0
        elseif math.abs(crankDelta) > Settings.CRANK_THRESHOLD then
            -- クランクが動いたらタイマーリセット
            Tutorial.idleTimer = 0
        else
            Tutorial.idleTimer = Tutorial.idleTimer + 1
            if Tutorial.idleTimer >= Settings.TUTORIAL_IDLE_THRESHOLD then
                Tutorial.overlayVisible = true
            end
        end
    end
end

-- オーバーレイを描画
function Tutorial.drawOverlay()
    if not Tutorial.overlayVisible or Tutorial.step == 0 or Tutorial.step == 5 then
        return
    end

    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT

    local overlayW = Settings.TUTORIAL_OVERLAY_WIDTH
    local overlayH = Settings.TUTORIAL_OVERLAY_HEIGHT
    local border = Settings.TUTORIAL_OVERLAY_BORDER
    local shadowOffset = Settings.TUTORIAL_OVERLAY_SHADOW_OFFSET

    -- オーバーレイを画面中央に配置
    local overlayX = (SCREEN_WIDTH - overlayW) / 2
    local overlayY = (SCREEN_HEIGHT - overlayH) / 2

    -- 影を描画（50%ディザ）
    gfx.setColor(gfx.kColorBlack)
    gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
    gfx.fillRect(overlayX + shadowOffset, overlayY + shadowOffset, overlayW, overlayH)

    -- 枠線を描画（黒）
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(overlayX, overlayY, overlayW, border)                          -- 上辺
    gfx.fillRect(overlayX, overlayY + overlayH - border, overlayW, border)      -- 下辺
    gfx.fillRect(overlayX, overlayY + border, border, overlayH - border * 2)    -- 左辺
    gfx.fillRect(overlayX + overlayW - border, overlayY + border, border, overlayH - border * 2)  -- 右辺

    -- 背景を描画（白）
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(overlayX + border, overlayY + border, overlayW - border * 2, overlayH - border * 2)

    -- フォント設定
    if Tutorial.fontSmall then
        gfx.setFont(Tutorial.fontSmall)
    end
    gfx.setColor(gfx.kColorBlack)

    -- ステップ番号
    local stepText = string.format("Step %d/4", Tutorial.step)
    gfx.drawText(stepText, overlayX + border + 12, overlayY + border + 8)

    -- ステップごとの説明
    local instructionY = overlayY + border + 32
    local instructionX = overlayX + border + 12

    if Tutorial.step == 1 then
        -- Step 1: クランク操作
        gfx.drawText("Rotate the crank", instructionX, instructionY)
        gfx.drawText("to browse frames", instructionX, instructionY + 20)
    elseif Tutorial.step == 2 then
        -- Step 2: 掴んで移動
        -- "Hold" + D-padアイコン(✛) + "to grab"
        gfx.drawText("Hold ", instructionX, instructionY)
        local holdWidth = gfx.getTextSize("Hold ")
        -- D-padアイコンはfontIconフォントで描画
        if Tutorial.fontIcon then
            gfx.setFont(Tutorial.fontIcon)
            gfx.drawText("✛", instructionX + holdWidth, instructionY + 4)  -- 少し下にオフセット
            local iconWidth = gfx.getTextSize("✛")
            gfx.setFont(Tutorial.fontSmall)
            gfx.drawText(" to grab", instructionX + holdWidth + iconWidth, instructionY)
        else
            gfx.drawText("D-Pad to grab", instructionX + holdWidth, instructionY)
        end
        gfx.drawText("a frame", instructionX, instructionY + 20)
    elseif Tutorial.step == 3 then
        -- Step 3: 並び替え
        gfx.drawText("Arrange frames in", instructionX, instructionY)
        gfx.drawText("the correct order!", instructionX, instructionY + 20)
    elseif Tutorial.step == 4 then
        -- Step 4: チェック
        -- "Press" + Ⓐアイコン + "to check!"
        gfx.drawText("Press ", instructionX, instructionY + 9)
        local pressWidth = gfx.getTextSize("Press ")
        if Tutorial.fontIcon then
            gfx.setFont(Tutorial.fontIcon)
            gfx.drawText("Ⓐ", instructionX + pressWidth, instructionY + 13)
            local iconWidth = gfx.getTextSize("Ⓐ")
            gfx.setFont(Tutorial.fontSmall)
            gfx.drawText(" to check!", instructionX + pressWidth + iconWidth, instructionY + 9)
        else
            gfx.drawText("A to check!", instructionX + pressWidth, instructionY + 9)
        end
    end
end

-- クランク インジケーターを表示すべきか
function Tutorial.shouldShowCrankIndicator()
    if not Tutorial.isTutorialStage or not Tutorial.overlayVisible then
        return false
    end
    return Tutorial.step == 1 or Tutorial.step == 3
end

-- Step 1 完了（フレームが変化した時）
function Tutorial.onFrameChanged()
    if Tutorial.isTutorialStage and Tutorial.step == 1 then
        Tutorial.step = 2  -- Step 2（掴む）へ進む
        Tutorial.idleTimer = 0
        Tutorial.overlayVisible = false
    end
end

-- Step 2で掴み始めた時
function Tutorial.onGrabStart()
    if Tutorial.isTutorialStage and Tutorial.step == 2 then
        Tutorial.grabHoldTimer = 0  -- タイマーリセット
        Tutorial.hasGrabbed = true
    end
end

-- Step 4 完了（チェックボタンを押した時）
function Tutorial.onCheckPressed()
    if Tutorial.isTutorialStage and Tutorial.step == 4 then
        Tutorial.step = 5  -- チュートリアル完了
    end
end

-- チェック中はオーバーレイを非表示
function Tutorial.hideOverlay()
    Tutorial.overlayVisible = false
end
