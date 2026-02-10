-- maingame.lua
-- メインゲーム画面のパラメータ
-- 画像サイズ/位置、サムネイル表示、コマ送り演出、巻き戻しアイコン、操作ヒント

--------------------------------------------------------------------------------
-- 画像サイズとスケール
--------------------------------------------------------------------------------

-- 元画像のサイズ（ファイルの実サイズ）
Settings.IMAGE_SIZE = 120

-- メイン表示時のスケール（2倍に拡大して240x240pxで表示）
Settings.MAIN_DISPLAY_SCALE = 2.0

-- メイン表示サイズ（計算値: IMAGE_SIZE * MAIN_DISPLAY_SCALE = 240px）
Settings.MAIN_DISPLAY_SIZE = 240

-- サムネイル表示時のスケール（等倍で120x120pxで表示）
Settings.THUMBNAIL_DISPLAY_SCALE = 1.0

--------------------------------------------------------------------------------
-- コマ表示位置
--------------------------------------------------------------------------------

-- コマ画像の水平オフセット（正の値で右にずれる）
Settings.IMAGE_OFFSET_X = 80

-- コマ画像の垂直オフセット（正の値で下にずれる）
Settings.IMAGE_OFFSET_Y = 20

--------------------------------------------------------------------------------
-- サムネイル（掴んだフレーム）
--------------------------------------------------------------------------------

-- サムネイルの位置
Settings.THUMBNAIL_X = -20
Settings.THUMBNAIL_Y = -4

-- サムネイルの枠線の太さ（黒）
Settings.THUMBNAIL_BORDER = 8

-- 枠線の位置オフセット（正の値で外側に移動）
Settings.THUMBNAIL_BORDER_OFFSET = 10    -- 外側へのオフセット（px）

-- サムネイルの白い縁取り（黒線の外側）
Settings.THUMBNAIL_BORDER_OUTLINE = 4    -- 白い縁取りの幅（px）

-- 枠線の角丸（右下コーナー）
Settings.THUMBNAIL_CORNER_RADIUS = 20    -- 角丸の半径（px）

-- 枠線の波アニメーション（風になびく紙の表現）
Settings.THUMBNAIL_WAVE_AMPLITUDE = 3    -- 波の振幅（px）
Settings.THUMBNAIL_WAVE_FREQUENCY = 12   -- 波の数（辺全体で何波あるか）
Settings.THUMBNAIL_WAVE_SPEED = 4        -- 波の速さ（大きいほど速い）

-- 掴む/置くアニメーション時の線の太さ変化
Settings.THUMBNAIL_BORDER_SCALE_START = 4.0  -- 開始時の太さ倍率（掴む時の最初）

--------------------------------------------------------------------------------
-- コマ送りアニメーション
--------------------------------------------------------------------------------

-- スライドアウトアニメーションの長さ（進む方向、フレーム数）
Settings.SLIDE_OUT_DURATION = 15

-- スライドインアニメーションの長さ（戻る方向、フレーム数）
Settings.SLIDE_IN_DURATION = 10

-- 紙のエッジ（右端の黒い線）の太さ
-- 右端（遠く）では細く、左端（近く）では太く表示される
Settings.SLIDE_EDGE_MIN = 0   -- 右端での太さ（px）
Settings.SLIDE_EDGE_MAX = 4   -- 左端での太さ（px）

-- 紙のエッジのカーブ（上下端で内側に曲がる深さ）
-- 中央では通常の太さ、上下端ではこの値だけ太くなる（紙が丸まっている表現）
Settings.SLIDE_EDGE_CURVE = 8  -- カーブの深さ（px）

-- 紙の影の幅（エッジの右側に表示）
-- 右端（遠く）では細く、左端（近く）では太く表示される
Settings.SLIDE_SHADOW_MIN = 0    -- 右端での幅（px）
Settings.SLIDE_SHADOW_MAX = 128   -- 左端での幅（px）

-- 紙の影の透明度（進む方向）
-- 右端で濃く、左端で透明（0=黒、1=透明）
Settings.SLIDE_OUT_SHADOW_ALPHA = 0.4  -- 右端での濃さ
-- 左端では常に1.0（完全透明）

-- 紙の影の透明度（戻る方向）
-- 左端で透明、右端で濃く（0=黒、1=透明）
Settings.SLIDE_IN_SHADOW_ALPHA_START = 1.0   -- 左端での濃さ（開始、透明）
Settings.SLIDE_IN_SHADOW_ALPHA_END = 0.4     -- 右端での濃さ（終了、濃い）

-- 紙の縦方向スケール（めくり効果）
-- 右端（開始/終了）では1倍、左端では指定倍率
Settings.SLIDE_SCALE_Y_MIN = 1.0   -- 右端でのスケール
Settings.SLIDE_SCALE_Y_MAX = 2.0   -- 左端でのスケール

--------------------------------------------------------------------------------
-- 巻き戻しアイコン（コマ戻し中に表示、画面中央に配置）
--------------------------------------------------------------------------------

-- アイコンのサイズ
Settings.REWIND_ICON_SIZE = 40  -- アイコンの高さ（幅は高さと同じ）

-- 背景のパディング（アイコン周囲の余白）
Settings.REWIND_ICON_PADDING_TOP = 12     -- 上の余白
Settings.REWIND_ICON_PADDING_BOTTOM = 12  -- 下の余白
Settings.REWIND_ICON_PADDING_LEFT = 24    -- 左の余白
Settings.REWIND_ICON_PADDING_RIGHT = 30   -- 右の余白

--------------------------------------------------------------------------------
-- 操作ヒント
--------------------------------------------------------------------------------

-- 操作ヒント表示までの待機時間（フレーム数、30フレーム = 1秒）
Settings.IDLE_THRESHOLD = 60

-- 操作ヒント表示位置
Settings.HINT_LINE1_X = 6       -- 1行目（✛ grab）X座標
Settings.HINT_LINE1_Y = 184     -- 1行目（✛ grab）Y座標
Settings.HINT_LINE2_X = 6       -- 2行目（Ⓐ check）X座標
Settings.HINT_LINE2_Y = 210     -- 2行目（Ⓐ check）Y座標
Settings.HINT_ICON_GAP = 4      -- アイコンとテキストの間隔（px）
