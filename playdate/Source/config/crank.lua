-- crank.lua
-- クランク操作のパラメータ
-- 感度設定、回転閾値、ノイズ除去など

-- 感度設定（システムメニューの「Crank」から選択可能）
-- name: メニューに表示される名前
-- degrees: 1コマ変化するのに必要な角度（小さいほど速くめくれる）
-- クランクは1回転で360度なので、例えば90度なら1回転で4コマ進む
Settings.SENSITIVITY_OPTIONS = {
    { name = "Slow", degrees = 150 },
    { name = "Normal", degrees = 120 },
    { name = "Fast", degrees = 90 },
    { name = "Fastest", degrees = 60 },
}

-- デフォルトの感度（メニュー表示名、上記のnameと一致させる）
Settings.DEFAULT_SENSITIVITY = "Normal"

-- 1コマ変化するのに必要な角度（通常時）
-- ※この値は感度設定で上書きされるため、直接編集しても効果なし
Settings.DEGREES_PER_FRAME = 120

-- 停止状態から動き始めた時の閾値（クイックスタート）
Settings.DEGREES_PER_FRAME_QUICK = 20

-- クランク停止判定の閾値（この値以下なら「止まっている」と判定）
Settings.CRANK_IDLE_THRESHOLD = 0.1

-- クランク回転判定の閾値（この角度以上で回転と判定）
Settings.CRANK_THRESHOLD = 1

-- クランク履歴のサイズ（ノイズ除去用、フレーム数）
Settings.CRANK_HISTORY_SIZE = 20
