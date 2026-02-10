-- stages.lua
-- ステージ設定（28ステージ: 4行×7列）
-- imagesフォルダを自動スキャンし、フォルダ名のプレフィックス番号からステージをリンク
-- フォルダ名形式: {番号}_{アニメーション名} (例: 0_Fish, 1_Whale)

Stages = {}

-- 画像フォルダのベースパス
local MAIN_GAME_PATH = "images/MainGameAnimation/"
local SELECTION_PATH = "images/SelectionAnimation/"

-- ステージインデックス（0-27）とアニメーション名のマッピング
-- nil = データなし（選択不可）
Stages.animations = {}

-- ステージインデックス（0-27）とフォルダ名のマッピング
Stages.folders = {}

-- imagesフォルダをスキャンしてステージを自動登録
function Stages.scanImages()
    -- 初期化
    for i = 0, 27 do
        Stages.animations[i] = nil
        Stages.folders[i] = nil
    end

    -- MainGameAnimationフォルダ内のファイル/フォルダ一覧を取得
    local files = playdate.file.listFiles(MAIN_GAME_PATH)
    if not files then
        print("Warning: Could not list " .. MAIN_GAME_PATH)
        return
    end

    print("Scanning animations in " .. MAIN_GAME_PATH)
    local foundCount = 0
    
    for _, name in ipairs(files) do
        -- フォルダ名からプレフィックス番号とアニメーション名を抽出
        -- 形式: {番号}_{名前}/ (末尾のスラッシュはフォルダを示す)
        local folderName = name:gsub("/$", "")  -- 末尾のスラッシュを除去
        local index, animName = folderName:match("^(%d+)_(.+)$")

        if index and animName then
            local stageIndex = tonumber(index)
            if stageIndex >= 0 and stageIndex <= 27 then
                Stages.animations[stageIndex] = animName
                Stages.folders[stageIndex] = folderName
                print(string.format("  [%d] %s", stageIndex, animName))
                foundCount = foundCount + 1
            end
        end
    end
    
    print(string.format("Total animations found: %d", foundCount))
end

-- メインゲーム用の画像テーブルパスを取得（imagetable.new用）
-- 例: index=0 -> "images/MainGameAnimation/0_Fish/Fish"
function Stages.getImagePath(index)
    local folder = Stages.folders[index]
    local animName = Stages.animations[index]
    if folder and animName then
        return MAIN_GAME_PATH .. folder .. "/" .. animName
    end
    return nil
end

-- セレクション画面用の画像テーブルパスを取得（imagetable.new用）
-- 例: index=0 -> "images/SelectionAnimation/0_Fish"
function Stages.getSelectionImagePath(index)
    local folder = Stages.folders[index]
    if folder then
        return SELECTION_PATH .. folder
    end
    return nil
end

-- ステージのアニメーション名を取得（nilならデータなし）
function Stages.getAnimation(index)
    return Stages.animations[index]
end

-- ステージが利用可能かどうか
function Stages.isAvailable(index)
    return Stages.animations[index] ~= nil
end

-- 利用可能なステージ数を取得
function Stages.getAvailableCount()
    local count = 0
    for i = 0, 27 do
        if Stages.animations[i] ~= nil then
            count = count + 1
        end
    end
    return count
end
