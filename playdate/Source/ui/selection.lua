-- selection.lua - セレクション画面シーン

local gfx = playdate.graphics

Selection = {}

-- カスタムフォント
local fontSmall = nil  -- 20px
local fontLarge = nil  -- 24px
local fontIcon = nil   -- 11px (ボタンアイコン用)

-- ポーズ状態
local isPaused = false
local clearedStages = 0
local totalStages = 0  -- TOTAL_STAGESで初期化（init後に設定）

-- クリア済みステージのサムネイル画像（アニメーション対応）
-- { [index] = { images = {image1, image2, ...}, frameCount = N }, ... }
local thumbnails = {}

-- サムネイルアニメーション用
local thumbnailAnimFrame = 1       -- 現在のフレーム番号
local thumbnailAnimTimer = 0       -- フレーム切り替え用タイマー

-- カーソル位置（0-indexed: col 0-6, row 0-3）
local cursorCol = 0
local cursorRow = 0

-- クランク操作用
local lastCrankPosition = 0
local accumulatedAngle = 0
local DEGREES_PER_MOVE = 30  -- カーソル1つ移動に必要な角度

-- グリッド設定（4行7列 = 28タイル）
local GRID_COLS = 7
local GRID_ROWS = 4
local TOTAL_STAGES = GRID_COLS * GRID_ROWS  -- 総ステージ数
local TILE_SIZE = 50
local TILE_SPACING = 5  -- タイル間の隙間（実際の間隔は55px）
local GRID_START_X = 7  -- Figmaデザイン（Scene/Selection）に合わせた値
local GRID_START_Y = 12

-- サムネイル設定（SelectionAnimation用スプライトシート）
local SELECTION_CELL_SIZE = 60   -- スプライトシートの各セルサイズ (px)
local SELECTION_TRIM = 5         -- 上下左右のトリミング量 (px)

-- 特殊タイル設定
local TUTORIAL_INDEX = 0  -- 左上（チュートリアル）
local BOSS_INDEX = TOTAL_STAGES - 1  -- 右下（ボス）

-- タイルの文字を取得（?, A, B, C, ... X, Y, Z, ?）
local function getTileChar(index)
    if index == 0 or index == 27 then
        return "?"
    else
        -- index 1-26 → A-Z
        return string.char(64 + index)  -- 65=A, 66=B, ...
    end
end

-- 未クリアタイル用の事前生成画像（ディザパターン問題回避）
local unclearedTileImages = {}  -- { [index] = image, ... }

-- 未クリアタイル画像を生成
local function createUnclearedTileImage(index)
    local img = gfx.image.new(TILE_SIZE, TILE_SIZE)
    gfx.pushContext(img)
        -- グレー背景
        gfx.setColor(gfx.kColorBlack)
        gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE)

        -- 文字を描画
        local text = getTileChar(index)
        local fontSmallLocal = gfx.font.new("fonts/Roobert/Roobert-20-Medium")
        if fontSmallLocal then
            gfx.setFont(fontSmallLocal)
            gfx.setImageDrawMode(gfx.kDrawModeFillWhite)
            local textWidth, textHeight = gfx.getTextSize(text)
            local textX = (TILE_SIZE - textWidth) / 2
            local textY = (TILE_SIZE - textHeight) / 2
            gfx.drawText(text, textX, textY)
        end
    gfx.popContext()
    return img
end

-- 初期化
function Selection.init()
    -- システムフォント Roobert を読み込む
    fontSmall = gfx.font.new("fonts/Roobert/Roobert-20-Medium")
    if fontSmall == nil then
        print("Warning: Failed to load fontSmall (Roobert-20)")
    end
    fontLarge = gfx.font.new("fonts/Roobert/Roobert-24-Medium")
    if fontLarge == nil then
        print("Warning: Failed to load fontLarge (Roobert-24)")
    end
    fontIcon = gfx.font.new("fonts/Roobert/Roobert-11-Medium")
    if fontIcon == nil then
        print("Warning: Failed to load fontIcon (Roobert-11)")
    end

    -- カーソル位置をリセット
    cursorCol = 0
    cursorRow = 0

    -- クランク状態をリセット
    lastCrankPosition = playdate.getCrankPosition()
    accumulatedAngle = 0

    -- ポーズ状態をリセット
    isPaused = false
    totalStages = TOTAL_STAGES

    -- 未クリアタイル画像を生成（ディザパターン問題回避のため事前生成）
    unclearedTileImages = {}
    for i = 0, TOTAL_STAGES - 1 do
        unclearedTileImages[i] = createUnclearedTileImage(i)
    end
end

-- タイル1つを描画
local function drawTile(col, row)
    local x = GRID_START_X + col * (TILE_SIZE + TILE_SPACING)
    local y = GRID_START_Y + row * (TILE_SIZE + TILE_SPACING)
    local index = row * GRID_COLS + col

    -- クリア済みならアニメーションサムネイルを表示
    local thumb = thumbnails[index]
    if thumb then
        -- 現在のフレームを表示（フレーム数でループ）
        local frameIndex = ((thumbnailAnimFrame - 1) % thumb.frameCount) + 1
        thumb.images[frameIndex]:draw(x, y)
        return
    end

    -- 未クリア: 事前生成した画像を表示（ディザパターンをメニュー表示時に保持するため）
    local tileImage = unclearedTileImages[index]
    if tileImage then
        tileImage:draw(x, y)
    end
end

-- 選択フレーム（カーソル）を描画（コーナーブラケットスタイル）
local function drawFrame(col, row)
    local tileX = GRID_START_X + col * (TILE_SIZE + TILE_SPACING)
    local tileY = GRID_START_Y + row * (TILE_SIZE + TILE_SPACING)

    -- Settingsから値を取得
    local frameSize = Settings.SELECTION_FRAME_SIZE
    local cornerLength = Settings.SELECTION_FRAME_CORNER_LENGTH
    local cornerWidth = Settings.SELECTION_FRAME_CORNER_WIDTH

    -- フレームはタイルより少し大きく、タイルを中央に配置
    local frameX = tileX - (frameSize - TILE_SIZE) / 2
    local frameY = tileY - (frameSize - TILE_SIZE) / 2

    gfx.setColor(gfx.kColorBlack)

    -- 左上角
    gfx.fillRect(frameX, frameY, cornerLength, cornerWidth)  -- 水平
    gfx.fillRect(frameX, frameY, cornerWidth, cornerLength)  -- 垂直

    -- 右上角
    gfx.fillRect(frameX + frameSize - cornerLength, frameY, cornerLength, cornerWidth)  -- 水平
    gfx.fillRect(frameX + frameSize - cornerWidth, frameY, cornerWidth, cornerLength)   -- 垂直

    -- 左下角
    gfx.fillRect(frameX, frameY + frameSize - cornerWidth, cornerLength, cornerWidth)  -- 水平
    gfx.fillRect(frameX, frameY + frameSize - cornerLength, cornerWidth, cornerLength) -- 垂直

    -- 右下角
    gfx.fillRect(frameX + frameSize - cornerLength, frameY + frameSize - cornerWidth, cornerLength, cornerWidth)  -- 水平
    gfx.fillRect(frameX + frameSize - cornerWidth, frameY + frameSize - cornerLength, cornerWidth, cornerLength)  -- 垂直
end

-- ポーズ画面を描画
local function drawPauseOverlay()
    -- Scene/Selection/State_Pause: Figmaデザイン (node-id: 48:5)

    -- 影: グレー (下部: 47, 208, 313x7 / 右部: 360, 33, 7x182)
    gfx.setColor(gfx.kColorBlack)  -- setDitherPatternの前に色を設定
    gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)
    gfx.fillRect(47, 208, 313, 7)   -- 下部影
    gfx.fillRect(360, 33, 7, 182)   -- 右部影

    -- 枠線: 黒6px (39, 25) から開始
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(39, 25, 321, 6)    -- 上辺
    gfx.fillRect(39, 202, 321, 6)   -- 下辺
    gfx.fillRect(39, 31, 6, 171)    -- 左辺
    gfx.fillRect(354, 31, 6, 171)   -- 右辺

    -- 背景: 白 (45, 31, 309x171)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(45, 31, 309, 171)

    -- progress: "X/28" 40px (113, 68)
    gfx.setColor(gfx.kColorBlack)
    if fontLarge then
        gfx.setFont(fontLarge)
    end
    local progressText = string.format("%d/%d", clearedStages, totalStages)
    gfx.drawText(progressText, 113, 68)

    -- progress_percent: "XX.X%" 16px (168, 120)
    if fontSmall then
        gfx.setFont(fontSmall)
    end
    local percent = 0
    if totalStages > 0 then
        percent = (clearedStages / totalStages) * 100
    end
    local percentText = string.format("%.1f%%", percent)
    gfx.drawText(percentText, 168, 120)

    -- CloseInfo: "Ⓑ to Close this"
    gfx.setColor(gfx.kColorBlack)
    local closeY = 164
    if fontIcon then
        gfx.setFont(fontIcon)
        -- fontIcon (11px) needs +4 Y offset to align baseline with fontSmall (20px)
        gfx.drawText("Ⓑ", 59, closeY + 4)
        local iconWidth = gfx.getTextSize("Ⓑ")
        gfx.setFont(fontSmall)
        gfx.drawText(" to Close this", 59 + iconWidth, closeY)
    else
        gfx.drawText("B to Close this", 59, closeY)
    end
end

-- セレクション画面の描画
function Selection.draw()
    -- 画面を白でクリア
    gfx.clear(gfx.kColorWhite)

    -- タイルグリッドを描画
    for row = 0, GRID_ROWS - 1 do
        for col = 0, GRID_COLS - 1 do
            drawTile(col, row)
        end
    end

    -- 選択フレームを描画
    drawFrame(cursorCol, cursorRow)

    -- ポーズ画面を描画（ポーズ中のみ）
    if isPaused then
        drawPauseOverlay()
    end
end

-- 現在のカーソル位置をリニアインデックス(0-17)で取得
local function getCursorIndex()
    return cursorRow * GRID_COLS + cursorCol
end

-- リニアインデックスからカーソル位置を設定
local function setCursorFromIndex(index)
    local totalTiles = GRID_COLS * GRID_ROWS
    -- ループ処理
    index = index % totalTiles
    if index < 0 then
        index = index + totalTiles
    end
    cursorRow = math.floor(index / GRID_COLS)
    cursorCol = index % GRID_COLS
end

-- カーソル移動の更新
function Selection.update()
    -- サムネイルアニメーションの更新
    thumbnailAnimTimer = thumbnailAnimTimer + 1
    if thumbnailAnimTimer >= Settings.THUMBNAIL_ANIM_INTERVAL then
        thumbnailAnimTimer = 0
        thumbnailAnimFrame = thumbnailAnimFrame + 1
    end

    -- Bボタンでポーズをトグル
    if playdate.buttonJustPressed(playdate.kButtonB) then
        isPaused = not isPaused
        Sound.playSelected()
        return
    end

    -- ポーズ中は操作を無効化
    if isPaused then
        return
    end

    local moved = false

    -- 十字キーでカーソル移動
    if playdate.buttonJustPressed(playdate.kButtonLeft) then
        cursorCol = cursorCol - 1
        if cursorCol < 0 then
            cursorCol = GRID_COLS - 1
        end
        moved = true
    end

    if playdate.buttonJustPressed(playdate.kButtonRight) then
        cursorCol = cursorCol + 1
        if cursorCol >= GRID_COLS then
            cursorCol = 0
        end
        moved = true
    end

    if playdate.buttonJustPressed(playdate.kButtonUp) then
        cursorRow = cursorRow - 1
        if cursorRow < 0 then
            cursorRow = GRID_ROWS - 1
        end
        moved = true
    end

    if playdate.buttonJustPressed(playdate.kButtonDown) then
        cursorRow = cursorRow + 1
        if cursorRow >= GRID_ROWS then
            cursorRow = 0
        end
        moved = true
    end

    -- クランクでカーソル移動
    local crankPosition = playdate.getCrankPosition()
    local crankDelta = crankPosition - lastCrankPosition
    -- -180〜180の範囲に正規化
    if crankDelta > 180 then
        crankDelta = crankDelta - 360
    elseif crankDelta < -180 then
        crankDelta = crankDelta + 360
    end
    lastCrankPosition = crankPosition

    accumulatedAngle = accumulatedAngle + crankDelta

    -- 累積角度がしきい値を超えたらカーソル移動
    while accumulatedAngle >= DEGREES_PER_MOVE do
        accumulatedAngle = accumulatedAngle - DEGREES_PER_MOVE
        setCursorFromIndex(getCursorIndex() + 1)
        moved = true
    end
    while accumulatedAngle <= -DEGREES_PER_MOVE do
        accumulatedAngle = accumulatedAngle + DEGREES_PER_MOVE
        setCursorFromIndex(getCursorIndex() - 1)
        moved = true
    end

    -- カーソルが動いたらSEを再生
    if moved then
        Sound.playCursor()
    end
end

-- Aボタンが押されたらtrueを返す（ゲームへ遷移、ポーズ中は無効）
function Selection.checkStartGame()
    if isPaused then
        return false
    end
    return playdate.buttonJustPressed(playdate.kButtonA)
end

-- 現在選択されているタイルのインデックスを取得（0-27）
function Selection.getSelectedIndex()
    return cursorRow * GRID_COLS + cursorCol
end

-- 選択されたアニメーション名を取得（nilならデータなし）
function Selection.getSelectedAnimation()
    local index = Selection.getSelectedIndex()
    return Stages.getAnimation(index)
end

-- 選択中のステージが利用可能かどうか
function Selection.isStageAvailable()
    local index = Selection.getSelectedIndex()
    return Stages.isAvailable(index)
end

-- チュートリアルステージかどうか
function Selection.isTutorialStage()
    return Selection.getSelectedIndex() == TUTORIAL_INDEX
end

-- ボスステージかどうか
function Selection.isBossStage()
    return Selection.getSelectedIndex() == BOSS_INDEX
end

-- カーソル位置をインデックスで設定（0-27）
function Selection.setSelectedIndex(index)
    local totalTiles = GRID_COLS * GRID_ROWS
    -- 範囲チェック
    if index < 0 then
        index = 0
    elseif index >= totalTiles then
        index = totalTiles - 1
    end
    cursorRow = math.floor(index / GRID_COLS)
    cursorCol = index % GRID_COLS
end

-- 進捗情報を設定（クリア済みステージ数）
function Selection.setProgressInfo(cleared, total)
    clearedStages = cleared or 0
    totalStages = total or TOTAL_STAGES
end

-- 総ステージ数を取得
function Selection.getTotalStages()
    return TOTAL_STAGES
end

-- ポーズ状態を取得
function Selection.isPaused()
    return isPaused
end

-- クランク状態をリセット（画面遷移時に呼び出す）
function Selection.resetCrankState()
    lastCrankPosition = playdate.getCrankPosition()
    accumulatedAngle = 0
end

-- クリア済みステージのサムネイルを読み込む（SelectionAnimation用スプライトシート）
-- hiScores: { animationName = clearTime, ... }
-- デバッグモード時は全ステージのサムネイルを読み込む
--
-- NOTE: SelectionAnimation用スプライトシート形式
-- - 180x180px（3x3グリッド、各セル60x60px）
-- - ファイル名: {index}_{name}-table-60-60.png
-- - 上下左右5pxトリミングして50x50pxで表示
function Selection.loadThumbnails(hiScores)
    thumbnails = {}  -- 既存のサムネイルをクリア
    thumbnailAnimFrame = 1
    thumbnailAnimTimer = 0

    -- 各ステージをチェック
    for index = 0, TOTAL_STAGES - 1 do
        local animName = Stages.getAnimation(index)
        -- デバッグモード時は全ステージ、通常時はクリア済みのみ（ステージインデックスで判定）
        local shouldLoad = Debug.enabled or (hiScores and hiScores[index])
        if animName and shouldLoad then
            -- SelectionAnimation用のスプライトシートを読み込む
            local imagePath = Stages.getSelectionImagePath(index)
            if imagePath then
                local imageTable = gfx.imagetable.new(imagePath)
                if imageTable then
                    local frameCount = imageTable:getLength()
                    local images = {}

                    -- 全フレームをトリミングして保存（60x60px → 50x50px）
                    for i = 1, frameCount do
                        local frame = imageTable:getImage(i)
                        if frame then
                            -- タイルサイズの画像を作成
                            local tileImage = gfx.image.new(TILE_SIZE, TILE_SIZE)
                            gfx.pushContext(tileImage)
                                -- 60x60pxの画像を-5px,-5pxの位置に描画（上下左右5pxトリミング）
                                frame:draw(-SELECTION_TRIM, -SELECTION_TRIM)
                            gfx.popContext()

                            images[i] = tileImage
                        end
                    end

                    if #images > 0 then
                        thumbnails[index] = {
                            images = images,
                            frameCount = #images
                        }
                    end
                end
            end
        end
    end
end

-- 特定ステージがクリア済みか（サムネイルがあるか）
function Selection.isStageCleared(index)
    return thumbnails[index] ~= nil
end
