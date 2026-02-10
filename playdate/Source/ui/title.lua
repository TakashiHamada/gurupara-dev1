-- title.lua - タイトル画面シーン

local gfx = playdate.graphics

Title = {}

-- タイトル画像（あれば使用）
local titleImage = nil

-- カスタムフォント（2サイズ）
local fontLarge = nil  -- 40px
local fontSmall = nil  -- 16px

-- PressInfoアニメーション用
local animTime = 0
local pressInfoBaseY = 161  -- PressInfoの基本Y座標

-- 初期化
function Title.init()
    -- タイトル画像を読み込む（存在すれば）
    titleImage = gfx.image.new("images/title")

    -- システムフォント Roobert を読み込む（2サイズ）
    fontLarge = gfx.font.new("fonts/Roobert/Roobert-24-Medium")
    if fontLarge == nil then
        print("Warning: Failed to load fontLarge (Roobert-24)")
    end

    fontSmall = gfx.font.new("fonts/Roobert/Roobert-20-Medium")
    if fontSmall == nil then
        print("Warning: Failed to load fontSmall (Roobert-20)")
    end

    -- アニメーション時間をリセット
    animTime = 0
end

-- アニメーション更新
function Title.update()
    -- ふわふわアニメーション用の時間を進める
    animTime = animTime + 0.1
end

-- タイトル画面の描画
function Title.draw()
    gfx.clear(gfx.kColorWhite)

    if titleImage then
        -- 画像がある場合は中央に描画
        titleImage:draw(0, 0)
    else
        -- Figmaデザインを再現（node-id: 13:7）

        -- 上部黒帯 (0, 0, 400, 150)
        gfx.setColor(gfx.kColorBlack)
        gfx.fillRect(0, 0, 400, 150)

        -- 下部グレー帯 #404040 (0, 201, 400, 39) ※Figma座標(-4, 201, 404, 39)を画面内に調整
        gfx.setDitherPattern(0.25, gfx.image.kDitherTypeBayer8x8)
        gfx.fillRect(0, 201, 400, 39)

        -- "GURUPARA" 白文字、40px (40, 47)
        gfx.setImageDrawMode(gfx.kDrawModeFillWhite)
        if fontLarge then
            gfx.setFont(fontLarge)
        end
        gfx.drawText("GURUPARA", 40, 47)

        -- "Flipbook Puzzle" 白文字、16px (61, 94)
        if fontSmall then
            gfx.setFont(fontSmall)
        end
        gfx.drawText("Flipbook Puzzle", 61, 94)

        -- 描画モードをリセット
        gfx.setImageDrawMode(gfx.kDrawModeCopy)
        gfx.setColor(gfx.kColorBlack)

        -- PressInfo: ふわふわアニメーション（sin関数で±4ピクセル上下）
        local floatOffset = math.floor(math.sin(animTime) * 4)
        local pressInfoY = pressInfoBaseY + floatOffset
        local textY = pressInfoY + 9  -- テキストの位置

        -- "PRESS Ⓐ TO START" （Ⓐはフォント内蔵のボタンアイコン）
        if fontSmall then
            gfx.setFont(fontSmall)
        end
        local pressText = "PRESS Ⓐ TO START"
        local textWidth = gfx.getTextSize(pressText)
        local textX = (400 - textWidth) / 2  -- 画面中央に配置
        gfx.drawText(pressText, textX, textY)

        -- "GIFT TEN INDUSTRY.K.K" 白文字、16px (32, 215)
        gfx.setImageDrawMode(gfx.kDrawModeFillWhite)
        gfx.drawText("GIFT TEN INDUSTRY.K.K", 32, 215)

        -- 描画モードをリセット
        gfx.setImageDrawMode(gfx.kDrawModeCopy)
    end
end

-- Aボタンが押されたらtrueを返す
function Title.checkInput()
    return playdate.buttonJustPressed(playdate.kButtonA)
end

-- タイトル画面をリセット
function Title.reset()
    animTime = 0
end
