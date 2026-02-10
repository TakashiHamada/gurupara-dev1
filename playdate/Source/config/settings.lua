-- settings.lua
-- ゲームの調整可能なパラメータ（ハブファイル）
-- このファイルは Settings グローバルを宣言し、各カテゴリファイルを読み込みます
-- 個別パラメータの編集は各ファイルで行ってください

Settings = {}

import "config/sound"
import "config/crank"
import "config/animation"
import "config/selection"
import "config/maingame"
import "config/tutorial"
