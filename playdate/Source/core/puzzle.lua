-- puzzle.lua
-- パズルロジック関連の処理

Puzzle = {}  -- グローバル変数として定義

-- フレームの順序を管理する配列
Puzzle.frameOrder = {}
Puzzle.frameCount = 0

-- 初期化
function Puzzle.init(count)
    Puzzle.frameCount = count
    Puzzle.frameOrder = {}
    for i = 1, count do
        Puzzle.frameOrder[i] = i
    end
end

-- 正解かどうかをチェックする関数（循環対応）
function Puzzle.isCorrectOrder()
    local frameOrder = Puzzle.frameOrder
    local frameCount = Puzzle.frameCount

    -- 配列の長さが元のフレーム数と一致しているかチェック
    if #frameOrder ~= frameCount then
        return false
    end

    -- どの位置から始まっても、連続した昇順になっていればOK
    -- 例: [1,2,3,4,5,6,7,8,9], [4,5,6,7,8,9,1,2,3], [9,1,2,3,4,5,6,7,8] すべて正解

    -- 最初のフレームから見て、次のフレームが正しく続いているかチェック
    for i = 1, frameCount do
        local currentFrame = frameOrder[i]
        local nextFrame = frameOrder[i % frameCount + 1]  -- 循環: 最後の次は最初

        -- 次のフレームは、現在のフレーム+1 であるべき（9の次は1）
        local expectedNext = (currentFrame % frameCount) + 1

        if nextFrame ~= expectedNext then
            return false
        end
    end

    return true
end

-- シャッフル関数（Fisher-Yates）
local function shuffleFrames()
    local frameOrder = Puzzle.frameOrder
    for i = #frameOrder, 2, -1 do
        local j = math.random(1, i)
        frameOrder[i], frameOrder[j] = frameOrder[j], frameOrder[i]
    end
end

-- 正解にならないようにシャッフル
function Puzzle.shuffle()
    repeat
        shuffleFrames()
    until not Puzzle.isCorrectOrder()
end

-- フレームを掴む（配列から削除）
function Puzzle.grabFrame(index)
    local frameImage = Puzzle.frameOrder[index]
    table.remove(Puzzle.frameOrder, index)
    return frameImage
end

-- フレームを置く（配列に挿入）
function Puzzle.placeFrame(index, frameImage)
    table.insert(Puzzle.frameOrder, index, frameImage)
end

-- 現在の配列の長さを取得
function Puzzle.getCurrentCount()
    return #Puzzle.frameOrder
end

-- 指定インデックスのフレーム画像番号を取得
function Puzzle.getFrameAt(index)
    return Puzzle.frameOrder[index]
end
