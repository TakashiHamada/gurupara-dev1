-- transition.lua
-- ページめくり風トランジション

local gfx = playdate.graphics

Transition = {}

-- トランジション状態
local isActive = false
local progress = 0  -- 0.0 〜 1.0
local direction = 1  -- 1: out（閉じる）, -1: in（開く）
local speed = 0.08  -- 進行速度
local onMidpoint = nil  -- 折り返し時のコールバック
local onComplete = nil  -- 完了時のコールバック
local midpointCalled = false

-- ページめくりパラメータ
local PAGE_COUNT = 6  -- めくるページ数
local SCREEN_WIDTH = 400
local SCREEN_HEIGHT = 240

-- 個別ページの描画
local function drawPage(pageIndex, progress, dir)
    -- ページの色（交互に黒と白）
    local isBlackPage = (pageIndex % 2 == 1)
    
    if dir == 1 then
        -- 閉じる：左から右にページが覆う
        local pageWidth = SCREEN_WIDTH * progress
        
        -- イージング（ease-out）
        local easedProgress = 1 - (1 - progress) * (1 - progress)
        pageWidth = SCREEN_WIDTH * easedProgress
        
        if isBlackPage then
            gfx.setColor(gfx.kColorBlack)
        else
            gfx.setColor(gfx.kColorWhite)
        end
        gfx.fillRect(0, 0, pageWidth, SCREEN_HEIGHT)
        
        -- ページの端に折り目の影
        if pageWidth > 5 and pageWidth < SCREEN_WIDTH - 5 then
            gfx.setColor(gfx.kColorBlack)
            gfx.setDitherPattern(0.5, gfx.image.kDitherTypeBayer4x4)
            gfx.fillRect(pageWidth - 3, 0, 6, SCREEN_HEIGHT)
        end
    else
        -- 開く：右から左にページがめくれる
        local easedProgress = progress * progress  -- ease-in
        local pageLeft = SCREEN_WIDTH * (1 - easedProgress)
        
        if isBlackPage then
            gfx.setColor(gfx.kColorBlack)
        else
            gfx.setColor(gfx.kColorWhite)
        end
        gfx.fillRect(pageLeft, 0, SCREEN_WIDTH - pageLeft, SCREEN_HEIGHT)
        
        -- ページの端に折り目の影
        if pageLeft > 5 and pageLeft < SCREEN_WIDTH - 5 then
            gfx.setColor(gfx.kColorBlack)
            gfx.setDitherPattern(0.5, gfx.image.kDitherTypeBayer4x4)
            gfx.fillRect(pageLeft - 3, 0, 6, SCREEN_HEIGHT)
        end
    end
end

-- トランジション開始
function Transition.start(midpointCallback, completeCallback)
    isActive = true
    progress = 0
    direction = 1
    onMidpoint = midpointCallback
    onComplete = completeCallback
    midpointCalled = false
    Sound.playFlip()
end

-- トランジションがアクティブか
function Transition.isActive()
    return isActive
end

-- トランジションをリセット（強制終了）
function Transition.reset()
    isActive = false
    progress = 0
    direction = 1
    onMidpoint = nil
    onComplete = nil
    midpointCalled = false
end

-- 更新処理
function Transition.update()
    if not isActive then return end
    
    progress = progress + speed * direction
    
    -- 折り返し（out完了 → in開始）
    if direction == 1 and progress >= 1.0 then
        progress = 1.0
        direction = -1
        if onMidpoint and not midpointCalled then
            midpointCalled = true
            onMidpoint()
        end
        Sound.playFlip()
    end
    
    -- 完了
    if direction == -1 and progress <= 0 then
        progress = 0
        isActive = false
        if onComplete then
            onComplete()
        end
    end
end

-- 描画処理（ページめくり風）
function Transition.draw()
    if not isActive then return end
    
    -- 複数ページが順番にめくれる演出
    for i = 1, PAGE_COUNT do
        -- 各ページの進行度（ずらして開始）
        local pageDelay = (i - 1) * 0.12
        local pageProgress
        
        if direction == 1 then
            -- 閉じる時：ページが左から右に覆う
            pageProgress = (progress - pageDelay) / (1.0 - pageDelay * (PAGE_COUNT - 1) / PAGE_COUNT)
        else
            -- 開く時：ページが右から左にめくれる（逆順）
            local reverseI = PAGE_COUNT - i + 1
            pageDelay = (reverseI - 1) * 0.12
            pageProgress = (progress - pageDelay) / (1.0 - pageDelay * (PAGE_COUNT - 1) / PAGE_COUNT)
        end
        
        pageProgress = math.max(0, math.min(1, pageProgress))
        
        if pageProgress > 0 then
            drawPage(i, pageProgress, direction)
        end
    end
end
