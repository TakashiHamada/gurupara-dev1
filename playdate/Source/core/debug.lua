-- debug.lua
-- デバッグ関連の処理

local gfx = playdate.graphics

Debug = {}

-- デバッグモードのON/OFF
Debug.enabled = false

-- デバッグメニューのモード定数
Debug.MODE_NONE = "none"          -- 本番モード（デバッグ表示なし）
Debug.MODE_COMPLETE = "complete"  -- 全ステージクリア状態 + デバッグ表示
Debug.MODE_INIT = "init"          -- セーブデータ削除 + デバッグ表示

-- デバッグメニューのオプションリスト
Debug.OPTIONS = { Debug.MODE_NONE, Debug.MODE_COMPLETE, Debug.MODE_INIT }
Debug.DEFAULT_OPTION = Debug.MODE_NONE

-- 現在のモードと保留中のモード
Debug.currentMode = Debug.DEFAULT_OPTION
Debug.needsReset = false  -- リセットが必要かどうか

-- デバッグ情報を格納するテーブル
local debugData = {}

-- 明滅用フレームカウンター
local blinkCounter = 0
local BLINK_INTERVAL = 1  -- 明滅

-- デバッグ情報をセット
function Debug.set(key, value)
    debugData[key] = value
end

-- デバッグ情報をクリア
function Debug.clear()
    debugData = {}
end

-- デバッグ情報を描画
function Debug.draw()
    if not Debug.enabled then
        return
    end
    
    local debugLines = {}
    
    -- クランク角度
    if debugData.crankPosition then
        table.insert(debugLines, string.format("crank: %.1f", debugData.crankPosition))
    end
    
    -- フレームインデックス（X/Y形式）
    if debugData.frameIndex and debugData.frameCount then
        table.insert(debugLines, string.format("frame: %d/%d", debugData.frameIndex, debugData.frameCount))
    elseif debugData.frameIndex then
        table.insert(debugLines, string.format("frame: %d", debugData.frameIndex))
    end
    
    -- クランク停止検知状態
    if debugData.crankIdle then
        table.insert(debugLines, string.format("idle: %s", debugData.crankIdle))
    end

    -- クリア済みステージ数
    if debugData.clearedStages and debugData.totalStages then
        table.insert(debugLines, string.format("clear: %d/%d", debugData.clearedStages, debugData.totalStages))
    elseif debugData.clearedStages then
        table.insert(debugLines, string.format("clear: %d", debugData.clearedStages))
    end

    if #debugLines == 0 then
        return
    end

    -- 明滅カウンターを更新
    blinkCounter = blinkCounter + 1

    -- 2フレーム周期で表示/非表示を切り替え（偶数カウンターで表示）
    local showText = (math.floor(blinkCounter / BLINK_INTERVAL) % 2) == 0
    if not showText then
        return
    end

    -- テキストを描画（背景なし）
    local lineHeight = 16
    gfx.setColor(gfx.kColorBlack)
    for i, line in ipairs(debugLines) do
        gfx.drawText(line, 2, (i - 1) * lineHeight + 2)
    end
end

-- リセットが必要かチェック（チェック後にフラグをクリア）
function Debug.checkAndClearReset()
    if Debug.needsReset then
        Debug.needsReset = false
        return true
    end
    return false
end

-- システムメニューにデバッグ項目を追加
-- onSelectCallback: オプション選択時に呼ばれるコールバック(value)
function Debug.setupMenu(onSelectCallback)
    local menu = playdate.getSystemMenu()
    menu:addOptionsMenuItem("debug", Debug.OPTIONS, Debug.DEFAULT_OPTION, function(value)
        -- デバッグ表示の有効/無効を設定
        -- none以外（complete, init）ではデバッグ表示ON
        Debug.enabled = (value ~= Debug.MODE_NONE)

        -- モードが変わった場合、リセットフラグを立てる
        if value ~= Debug.currentMode then
            Debug.needsReset = true
            Debug.currentMode = value
        end

        if onSelectCallback then
            onSelectCallback(value)
        end
    end)
end
