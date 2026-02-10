-- game/renderer.lua
-- 描画関連の関数をまとめたモジュール

local gfx = playdate.graphics

-- Renderer テーブル
Renderer = {}

-- フォント参照（main.luaから設定される）
Renderer.fontLarge = nil
Renderer.fontSmall = nil
Renderer.fontIcon = nil

-- フォント設定
function Renderer.setFonts(fontLarge, fontSmall, fontIcon)
    Renderer.fontLarge = fontLarge
    Renderer.fontSmall = fontSmall
    Renderer.fontIcon = fontIcon
end

-- 波打つ枠線を描画（右辺と下辺が連続した一つの波として流れる、角丸付き）
function Renderer.drawWavyBorders(rightX, rightY, rightWidth, rightHeight, bottomX, bottomY, bottomWidth, bottomHeight, scale, opacity, borderScale, color, positionOffset)
    borderScale = borderScale or 1.0
    color = color or gfx.kColorBlack
    positionOffset = positionOffset or 0
    local amplitude = Settings.THUMBNAIL_WAVE_AMPLITUDE * scale
    local frequency = Settings.THUMBNAIL_WAVE_FREQUENCY
    local cornerRadius = Settings.THUMBNAIL_CORNER_RADIUS * scale
    local step = 2

    -- 線の太さにスケールを適用
    local originalRightWidth = rightWidth
    local originalBottomHeight = bottomHeight
    rightWidth = rightWidth * borderScale
    bottomHeight = bottomHeight * borderScale

    -- 線の中心を基準にスケール
    rightX = rightX - (rightWidth - originalRightWidth) / 2 + positionOffset
    bottomY = bottomY - (bottomHeight - originalBottomHeight) / 2 + positionOffset

    -- 角丸の円弧の長さ
    local arcLength = cornerRadius * math.pi / 2

    -- 全周の長さ（右辺 + 角丸 + 下辺）
    local rightEdgeLength = rightHeight - cornerRadius
    local bottomEdgeLength = bottomWidth - cornerRadius
    local totalLength = rightEdgeLength + arcLength + bottomEdgeLength

    -- 色を設定
    gfx.setColor(color)
    if color == gfx.kColorBlack and opacity < 1.0 then
        local ditherAlpha = 0.8 * (1.0 - opacity)
        gfx.setDitherPattern(ditherAlpha, gfx.image.kDitherTypeBayer8x8)
    end

    local wavePhase = GameState.wavePhase

    -- 右辺を描画
    for i = 0, rightEdgeLength - step, step do
        local pos = i / totalLength
        local waveOffset = math.sin(pos * frequency * math.pi * 2 - wavePhase) * amplitude
        local rectHeight = math.min(step, rightEdgeLength - i)
        gfx.fillRect(rightX + waveOffset, rightY + i, rightWidth, rectHeight)
    end

    -- 角丸を描画
    local borderWidth = rightWidth
    local arcCenterX = rightX - cornerRadius + borderWidth / 2
    local arcCenterY = rightY + rightHeight - cornerRadius - borderWidth / 2
    local arcSteps = math.max(8, math.floor(arcLength / step))

    for i = 0, arcSteps do
        local arcProgress = i / arcSteps
        local angle = arcProgress * math.pi / 2
        local pos = (rightEdgeLength + arcProgress * arcLength) / totalLength
        local waveOffset = math.sin(pos * frequency * math.pi * 2 + wavePhase) * amplitude
        local radius = cornerRadius + waveOffset
        local x = arcCenterX + math.sin(angle) * radius
        local y = arcCenterY + math.cos(angle) * radius
        local circleRadius = borderWidth / 2
        local diameter = borderWidth
        gfx.fillRoundRect(x - circleRadius, y - circleRadius, diameter, diameter, circleRadius)
    end

    -- 下辺を描画
    for i = 0, bottomEdgeLength - step, step do
        local pos = (rightEdgeLength + arcLength + i) / totalLength
        local waveOffset = math.sin(pos * frequency * math.pi * 2 - wavePhase) * amplitude
        local rectWidth = math.min(step, bottomEdgeLength - i)
        gfx.fillRect(bottomX + bottomWidth - cornerRadius - i - rectWidth, bottomY + waveOffset, rectWidth, bottomHeight)
    end
end

-- 再生状態アイコンを描画（戻るときのみ表示、画面中央）
function Renderer.drawPlaybackIcon(crankDelta)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT

    if crankDelta < -Settings.CRANK_THRESHOLD then
        -- 巻き戻し（◀◀）
        local iconSize = Settings.REWIND_ICON_SIZE
        local padTop = Settings.REWIND_ICON_PADDING_TOP
        local padBottom = Settings.REWIND_ICON_PADDING_BOTTOM
        local padLeft = Settings.REWIND_ICON_PADDING_LEFT
        local padRight = Settings.REWIND_ICON_PADDING_RIGHT
        local cornerRadius = 12

        local bgWidth = iconSize + padLeft + padRight
        local bgHeight = iconSize + padTop + padBottom
        local bgX = (SCREEN_WIDTH - bgWidth) / 2
        local bgY = (SCREEN_HEIGHT - bgHeight) / 2
        gfx.setColor(gfx.kColorBlack)
        gfx.fillRoundRect(bgX, bgY, bgWidth, bgHeight, cornerRadius)

        local iconX = bgX + padLeft
        local iconY = bgY + padTop
        local triWidth = iconSize / 2
        local triHeight = iconSize

        gfx.setColor(gfx.kColorWhite)
        gfx.fillPolygon(
            iconX + triWidth * 2, iconY,
            iconX + triWidth * 2, iconY + triHeight,
            iconX + triWidth, iconY + triHeight / 2
        )
        gfx.fillPolygon(
            iconX + triWidth, iconY,
            iconX + triWidth, iconY + triHeight,
            iconX, iconY + triHeight / 2
        )
    end
end

-- スライドアウトアニメーション描画（進む方向）
function Renderer.drawSlideOutAnimations(animImages, mainOffsetX, mainOffsetY)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT
    local imageX = GameState.imageX

    for i = #GameState.slideOutAnimations, 1, -1 do
        local anim = GameState.slideOutAnimations[i]
        local t = GameState.easeOutSine(anim.progress)
        local slideX = -SCREEN_WIDTH * t
        local slideRight = slideX + SCREEN_WIDTH

        local positionRatio = 1 - slideRight / SCREEN_WIDTH
        local edgeWidth = Settings.SLIDE_EDGE_MIN + (Settings.SLIDE_EDGE_MAX - Settings.SLIDE_EDGE_MIN) * positionRatio
        local shadowWidth = Settings.SLIDE_SHADOW_MIN + (Settings.SLIDE_SHADOW_MAX - Settings.SLIDE_SHADOW_MIN) * positionRatio
        local shadowAlpha = Settings.SLIDE_OUT_SHADOW_ALPHA + (1.0 - Settings.SLIDE_OUT_SHADOW_ALPHA) * positionRatio

        local scaleY = Settings.SLIDE_SCALE_Y_MIN + (Settings.SLIDE_SCALE_Y_MAX - Settings.SLIDE_SCALE_Y_MIN) * positionRatio
        local currentHeight = SCREEN_HEIGHT * scaleY
        local centerY = SCREEN_HEIGHT / 2
        local slideY = centerY - currentHeight / 2

        -- 影を描画
        if slideRight < SCREEN_WIDTH and shadowWidth > 0 then
            gfx.setColor(gfx.kColorBlack)
            gfx.setDitherPattern(shadowAlpha, gfx.image.kDitherTypeBayer8x8)
            gfx.fillRect(slideRight, slideY, shadowWidth, currentHeight)
        end

        local clipLeft = math.max(0, slideX)
        local clipWidth = slideRight - clipLeft
        if clipWidth > 0 then
            gfx.setClipRect(clipLeft, 0, clipWidth, SCREEN_HEIGHT)

            gfx.setColor(gfx.kColorWhite)
            gfx.fillRect(slideX, slideY, SCREEN_WIDTH, currentHeight)

            gfx.setColor(gfx.kColorBlack)
            local edgeCurve = Settings.SLIDE_EDGE_CURVE or 0
            local segments = 24
            local segmentHeight = currentHeight / segments
            local edgeCenterY = slideY + currentHeight / 2

            for j = 0, segments - 1 do
                local segY = slideY + j * segmentHeight
                local segCenterY = segY + segmentHeight / 2
                local normalizedDist = math.abs(segCenterY - edgeCenterY) / (currentHeight / 2)
                local curveOffset = edgeCurve * normalizedDist * normalizedDist
                local segEdgeWidth = edgeWidth + curveOffset
                gfx.fillRect(slideX + SCREEN_WIDTH - segEdgeWidth, segY, segEdgeWidth, segmentHeight + 1)
            end

            local slideImage = animImages:getImage(anim.imageNum)
            if slideImage then
                local mainScale = Settings.MAIN_DISPLAY_SCALE
                local imgScaledH = Settings.MAIN_DISPLAY_SIZE * scaleY
                local imgY = slideY + (currentHeight - imgScaledH) / 2
                slideImage:drawScaled(slideX + imageX, imgY, mainScale, mainScale * scaleY)
            end

            gfx.clearClipRect()
        end
    end
end

-- スライドインアニメーション描画（戻る方向）
function Renderer.drawSlideInAnimations(animImages, mainOffsetX, mainOffsetY)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT
    local imageX = GameState.imageX

    for _, anim in ipairs(GameState.slideInAnimations) do
        local t = GameState.easeOutQuad(anim.progress)
        local slideX = -SCREEN_WIDTH + SCREEN_WIDTH * t + mainOffsetX
        local slideRight = slideX + SCREEN_WIDTH

        local positionRatio = 1 - (slideRight - mainOffsetX) / SCREEN_WIDTH
        local edgeWidth = Settings.SLIDE_EDGE_MIN + (Settings.SLIDE_EDGE_MAX - Settings.SLIDE_EDGE_MIN) * positionRatio
        local shadowAlpha = Settings.SLIDE_IN_SHADOW_ALPHA_END + (Settings.SLIDE_IN_SHADOW_ALPHA_START - Settings.SLIDE_IN_SHADOW_ALPHA_END) * positionRatio

        local scaleY = Settings.SLIDE_SCALE_Y_MIN + (Settings.SLIDE_SCALE_Y_MAX - Settings.SLIDE_SCALE_Y_MIN) * positionRatio
        local currentHeight = SCREEN_HEIGHT * scaleY
        local centerY = SCREEN_HEIGHT / 2 + mainOffsetY
        local slideY = centerY - currentHeight / 2

        -- 影を描画
        if slideRight < SCREEN_WIDTH + mainOffsetX then
            local shadowWidth = SCREEN_WIDTH + mainOffsetX - slideRight
            gfx.setColor(gfx.kColorBlack)
            gfx.setDitherPattern(shadowAlpha, gfx.image.kDitherTypeBayer8x8)
            gfx.fillRect(slideRight, slideY, shadowWidth, currentHeight)
        end

        local clipLeft = math.max(0, slideX)
        local clipWidth = slideRight - clipLeft
        if clipWidth > 0 then
            gfx.setClipRect(clipLeft, 0, clipWidth, SCREEN_HEIGHT)

            gfx.setColor(gfx.kColorWhite)
            gfx.fillRect(slideX, slideY, SCREEN_WIDTH, currentHeight)

            gfx.setColor(gfx.kColorBlack)
            local edgeCurve = Settings.SLIDE_EDGE_CURVE or 0
            local segments = 24
            local segmentHeight = currentHeight / segments
            local edgeCenterY = slideY + currentHeight / 2

            for j = 0, segments - 1 do
                local segY = slideY + j * segmentHeight
                local segCenterY = segY + segmentHeight / 2
                local normalizedDist = math.abs(segCenterY - edgeCenterY) / (currentHeight / 2)
                local curveOffset = edgeCurve * normalizedDist * normalizedDist
                local segEdgeWidth = edgeWidth + curveOffset
                gfx.fillRect(slideX + SCREEN_WIDTH - segEdgeWidth, segY, segEdgeWidth, segmentHeight + 1)
            end

            local slideImage = animImages:getImage(anim.imageNum)
            if slideImage then
                local mainScale = Settings.MAIN_DISPLAY_SCALE
                local imgScaledH = Settings.MAIN_DISPLAY_SIZE * scaleY
                local imgY = slideY + (currentHeight - imgScaledH) / 2
                slideImage:drawScaled(slideX + imageX, imgY, mainScale, mainScale * scaleY)
            end

            gfx.clearClipRect()
        end
    end
end

-- 掴んだフレームをサムネイル描画
function Renderer.drawGrabbedThumbnail(animImages, grabbedFrameImage, grabAnimProgress)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT
    local THUMBNAIL_SCALE = GameState.THUMBNAIL_SCALE

    local thumbnailImage = animImages:getImage(grabbedFrameImage)
    if not thumbnailImage then return end

    local t = GameState.easeOutQuad(grabAnimProgress)
    local currentX = 0 + Settings.THUMBNAIL_X * t
    local currentY = 0 + Settings.THUMBNAIL_Y * t
    local currentScale = 1.0 + (THUMBNAIL_SCALE - 1.0) * t
    local currentWidth = SCREEN_WIDTH * currentScale
    local currentHeight = SCREEN_HEIGHT * currentScale

    -- 白い台紙
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(currentX, currentY, currentWidth, currentHeight)

    -- 台紙の上にコマを描画
    local imageScale = Settings.MAIN_DISPLAY_SCALE + (Settings.THUMBNAIL_DISPLAY_SCALE - Settings.MAIN_DISPLAY_SCALE) * t
    local displaySize = Settings.IMAGE_SIZE * imageScale
    local imgX = currentX + (currentWidth - displaySize) / 2
    local imgY = currentY + (currentHeight - displaySize) / 2
    thumbnailImage:drawScaled(imgX, imgY, imageScale)

    -- 枠線を描画
    local border = Settings.THUMBNAIL_BORDER
    local outline = Settings.THUMBNAIL_BORDER_OUTLINE
    local borderOffset = Settings.THUMBNAIL_BORDER_OFFSET or 0
    local startScale = Settings.THUMBNAIL_BORDER_SCALE_START
    local borderScale = startScale - (startScale - 1.0) * t

    local rightEdgeX = currentX + currentWidth - border + borderOffset * currentScale
    local bottomEdgeY = currentY + currentHeight - border + borderOffset * currentScale

    -- 白い縁取り
    Renderer.drawWavyBorders(
        rightEdgeX, currentY, border, currentHeight + borderOffset * currentScale,
        currentX, bottomEdgeY, currentWidth + borderOffset * currentScale, border,
        currentScale, 1.0, borderScale, gfx.kColorWhite, outline * borderScale
    )
    -- 黒い線
    Renderer.drawWavyBorders(
        rightEdgeX, currentY, border, currentHeight + borderOffset * currentScale,
        currentX, bottomEdgeY, currentWidth + borderOffset * currentScale, border,
        currentScale, t, borderScale
    )
end

-- 置くアニメーション描画
function Renderer.drawPlacingThumbnail(animImages, placingFrameImage, placeAnimProgress)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH
    local SCREEN_HEIGHT = GameState.SCREEN_HEIGHT
    local THUMBNAIL_SCALE = GameState.THUMBNAIL_SCALE

    local placingImage = animImages:getImage(placingFrameImage)
    if not placingImage then return end

    local t = GameState.easeOutQuad(placeAnimProgress)
    local currentX = Settings.THUMBNAIL_X + (0 - Settings.THUMBNAIL_X) * t
    local currentY = Settings.THUMBNAIL_Y + (0 - Settings.THUMBNAIL_Y) * t
    local currentScale = THUMBNAIL_SCALE + (1.0 - THUMBNAIL_SCALE) * t
    local currentWidth = SCREEN_WIDTH * currentScale
    local currentHeight = SCREEN_HEIGHT * currentScale

    -- 白い台紙
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(currentX, currentY, currentWidth, currentHeight)

    -- 台紙の上にコマを描画
    local imageScale = Settings.THUMBNAIL_DISPLAY_SCALE + (Settings.MAIN_DISPLAY_SCALE - Settings.THUMBNAIL_DISPLAY_SCALE) * t
    local displaySize = Settings.IMAGE_SIZE * imageScale
    local imgX = currentX + (currentWidth - displaySize) / 2
    local imgY = currentY + (currentHeight - displaySize) / 2
    placingImage:drawScaled(imgX, imgY, imageScale)

    -- 枠線を描画
    local border = Settings.THUMBNAIL_BORDER
    local outline = Settings.THUMBNAIL_BORDER_OUTLINE
    local borderOffset = Settings.THUMBNAIL_BORDER_OFFSET or 0
    local startScale = Settings.THUMBNAIL_BORDER_SCALE_START
    local borderScale = 1.0 + (startScale - 1.0) * t

    local rightEdgeX = currentX + currentWidth - border + borderOffset * currentScale
    local bottomEdgeY = currentY + currentHeight - border + borderOffset * currentScale

    -- 白い縁取り
    Renderer.drawWavyBorders(
        rightEdgeX, currentY, border, currentHeight + borderOffset * currentScale,
        currentX, bottomEdgeY, currentWidth + borderOffset * currentScale, border,
        currentScale, 1.0, borderScale, gfx.kColorWhite, outline * borderScale
    )
    -- 黒い線
    Renderer.drawWavyBorders(
        rightEdgeX, currentY, border, currentHeight + borderOffset * currentScale,
        currentX, bottomEdgeY, currentWidth + borderOffset * currentScale, border,
        currentScale, 1.0 - t, borderScale
    )
end

-- 結果画面描画（クリア）
function Renderer.drawResultOK(clearTime, isNewHiScore)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH

    -- 影
    gfx.setColor(gfx.kColorBlack)
    gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
    gfx.fillRect(47, 219, 313, 8)
    gfx.fillRect(360, 18, 7, 209)

    -- 枠線
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(39, 12, 321, 6)
    gfx.fillRect(39, 214, 321, 6)
    gfx.fillRect(39, 18, 6, 196)
    gfx.fillRect(354, 18, 6, 196)

    -- 背景
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(45, 18, 309, 196)

    -- "CLEAR!"
    gfx.setColor(gfx.kColorBlack)
    if Renderer.fontLarge then
        gfx.setFont(Renderer.fontLarge)
    end
    gfx.drawText("CLEAR!", 91, 27)

    -- "Time:MM:SS"
    local safeTime = clearTime or 0
    local totalSeconds = math.floor(safeTime / 1000)
    local minutes = math.floor(totalSeconds / 60)
    local seconds = totalSeconds % 60
    local timeText = string.format("Time:%d:%02d", minutes, seconds)
    if Renderer.fontSmall then
        gfx.setFont(Renderer.fontSmall)
    end
    gfx.drawText(timeText, 119, 83)

    -- HiScore
    if isNewHiScore then
        gfx.setColor(gfx.kColorBlack)
        gfx.fillRect(113, 105, 174, 18)
        gfx.setImageDrawMode(gfx.kDrawModeFillWhite)
        gfx.drawText("Best Time!", 124, 107)
        gfx.setImageDrawMode(gfx.kDrawModeCopy)
    end

    -- SelectionInfo
    local selectionY = 131
    if Renderer.fontSmall then
        gfx.setFont(Renderer.fontSmall)
    end
    gfx.setColor(gfx.kColorBlack)
    if Renderer.fontIcon then
        gfx.setFont(Renderer.fontIcon)
        gfx.drawText("Ⓐ", 59, selectionY + 13)
        local iconWidth = gfx.getTextSize("Ⓐ")
        gfx.setFont(Renderer.fontSmall)
        gfx.drawText(" to Stage Select", 59 + iconWidth, selectionY + 9)
    else
        gfx.drawText("A to Stage Select", 59, selectionY + 9)
    end

    -- ResumeInfo
    local replayY = 169
    gfx.drawText("Press ", 68, replayY + 9)
    local pressWidth = gfx.getTextSize("Press ")
    if Renderer.fontIcon then
        gfx.setFont(Renderer.fontIcon)
        gfx.drawText("Ⓑ", 68 + pressWidth, replayY + 13)
        local iconWidth = gfx.getTextSize("Ⓑ")
        gfx.setFont(Renderer.fontSmall)
        gfx.drawText(" to Replay", 68 + pressWidth + iconWidth, replayY + 9)
    else
        gfx.drawText("B to Replay", 68 + pressWidth, replayY + 9)
    end
end

-- 結果画面描画（NG）
function Renderer.drawResultNG()
    -- 影
    gfx.setColor(gfx.kColorBlack)
    gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
    gfx.fillRect(56, 71, 300, 100)

    -- 背景
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(44, 58, 300, 100)

    -- テキスト
    gfx.setImageDrawMode(gfx.kDrawModeFillWhite)
    if Renderer.fontSmall then
        gfx.setFont(Renderer.fontSmall)
    end
    gfx.drawText("Something seems", 74, 84)
    gfx.drawText("to be wrong...", 74, 116)
    gfx.setImageDrawMode(gfx.kDrawModeCopy)
end

-- ポーズ画面描画
function Renderer.drawPauseScreen(currentHiScore, startTime, totalPausedTime, pauseStartTime, tutorialCleared)
    local SCREEN_WIDTH = GameState.SCREEN_WIDTH

    -- 影
    gfx.setColor(gfx.kColorBlack)
    gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
    gfx.fillRect(47, 208, 313, 7)
    gfx.fillRect(360, 33, 7, 182)

    -- 枠線
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(39, 25, 321, 6)
    gfx.fillRect(39, 202, 321, 6)
    gfx.fillRect(39, 31, 6, 171)
    gfx.fillRect(354, 31, 6, 171)

    -- 背景
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(45, 51, 309, 138)

    -- フォント設定
    if Renderer.fontSmall then
        gfx.setFont(Renderer.fontSmall)
    end

    -- 現在の経過時間
    local currentElapsed = playdate.getCurrentTimeMilliseconds() - startTime - totalPausedTime - (playdate.getCurrentTimeMilliseconds() - pauseStartTime)
    local totalSeconds = math.floor(currentElapsed / 1000)
    local minutes = math.floor(totalSeconds / 60)
    local seconds = totalSeconds % 60
    local timeText = string.format("Time:%d:%02d", minutes, seconds)

    gfx.setColor(gfx.kColorBlack)
    local timeWidth = Renderer.fontSmall:getTextWidth(timeText)
    gfx.drawText(timeText, (SCREEN_WIDTH - timeWidth) / 2, 46)

    -- BestTime（未クリアの場合は非表示）
    if currentHiScore then
        local bestSeconds = math.floor(currentHiScore / 1000)
        local bestMin = math.floor(bestSeconds / 60)
        local bestSec = bestSeconds % 60
        local bestText = string.format("Best:%d:%02d", bestMin, bestSec)
        local bestWidth = Renderer.fontSmall:getTextWidth(bestText)
        gfx.drawText(bestText, (SCREEN_WIDTH - bestWidth) / 2, 77)
    end

    -- ResumeInfo
    gfx.setColor(gfx.kColorBlack)
    gfx.drawText("Press ", 68, 129)
    local pressWidth = gfx.getTextSize("Press ")
    if Renderer.fontIcon then
        gfx.setFont(Renderer.fontIcon)
        gfx.drawText("Ⓑ", 68 + pressWidth, 133)
        local iconWidth = gfx.getTextSize("Ⓑ")
        gfx.setFont(Renderer.fontSmall)
        gfx.drawText(" to Resume", 68 + pressWidth + iconWidth, 129)
    else
        gfx.drawText("B to Resume", 68 + pressWidth, 129)
    end

    -- SelectionInfo（チュートリアルクリア済みの場合のみ）
    if tutorialCleared then
        gfx.setColor(gfx.kColorBlack)
        local selectY = 166
        if Renderer.fontIcon then
            gfx.setFont(Renderer.fontIcon)
            gfx.drawText("Ⓐ", 59, selectY + 4)
            local iconWidth = gfx.getTextSize("Ⓐ")
            gfx.setFont(Renderer.fontSmall)
            gfx.drawText(" to Stage Select", 59 + iconWidth, selectY)
        else
            gfx.drawText("A to Stage Select", 59, selectY)
        end
    end
end

-- 現在のシーンを描画（トランジション中・メニュー背景用）
function Renderer.drawCurrentScene(forMenu)
    local currentScene = GameState.currentScene

    if currentScene == GameState.SCENE_TITLE then
        Title.draw()
    elseif currentScene == GameState.SCENE_SELECTION then
        Selection.draw()
        Debug.draw()
    elseif currentScene == GameState.SCENE_GAME then
        gfx.clear()
        local shouldDraw = forMenu or not GameState.hideFrameDuringTransition
        if shouldDraw and GameState.animImages and GameState.frameCount > 0 then
            local imageIndex = Puzzle.getFrameAt(GameState.currentFrameIndex)
            if imageIndex then
                local img = GameState.animImages:getImage(imageIndex)
                if img then
                    img:drawScaled(GameState.imageX, GameState.imageY, Settings.MAIN_DISPLAY_SCALE, Settings.MAIN_DISPLAY_SCALE)
                end
            end
        end
    end
end
