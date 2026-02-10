-- tutorial.lua
-- チュートリアル（ステージ0）のパラメータ
-- ステップ制御、オーバーレイ表示、タイミングなど

-- チュートリアルステージのインデックス
Settings.TUTORIAL_STAGE_INDEX = 0

-- チュートリアルのフレーム数（通常ステージは9フレーム）
Settings.TUTORIAL_FRAME_COUNT = 4

-- チュートリアルオーバーレイ表示までの待機時間（フレーム数、30フレーム = 1秒）
Settings.TUTORIAL_IDLE_THRESHOLD = 45  -- 1.5秒

-- オーバーレイを閉じた後、次のオーバーレイ表示までの遅延（フレーム数）
Settings.TUTORIAL_STEP_DELAY = 30  -- 1秒

-- Step 2→3: 十字キー押し続け時間の閾値（フレーム数）
Settings.TUTORIAL_GRAB_HOLD_THRESHOLD = 20

-- オーバーレイのサイズと位置
Settings.TUTORIAL_OVERLAY_WIDTH = 320
Settings.TUTORIAL_OVERLAY_HEIGHT = 100
Settings.TUTORIAL_OVERLAY_BORDER = 6
Settings.TUTORIAL_OVERLAY_SHADOW_OFFSET = 8
