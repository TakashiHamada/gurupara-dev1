-- sound.lua
-- サウンド関連の処理

local snd = playdate.sound

Sound = {}  -- グローバル変数として定義

-- 紙めくり音用シンセサイザー
local flipSynth = snd.synth.new(snd.kWaveNoise)
flipSynth:setAttack(0)
flipSynth:setDecay(0.05)
flipSynth:setSustain(0)
flipSynth:setRelease(0.02)
flipSynth:setVolume(0.15)
flipSynth:noteOff()

-- 掴む音用シンセサイザー（大→小：周波数下降）
local grabSynth = snd.synth.new(snd.kWaveSine)
grabSynth:setAttack(0)
grabSynth:setDecay(0.4)
grabSynth:setSustain(0)
grabSynth:setRelease(0.1)
grabSynth:setVolume(0.25)
-- 周波数を下降させるLFO
local grabLfo = snd.lfo.new(snd.kLFOSawtoothDown)
grabLfo:setRate(2)
grabLfo:setDepth(1.0)
grabLfo:setRetrigger(true)
grabSynth:setFrequencyMod(grabLfo)
grabSynth:noteOff()

-- 離す音用シンセサイザー（シュッ：短いノイズ）
local releaseSynth = snd.synth.new(snd.kWaveNoise)
releaseSynth:setAttack(0)
releaseSynth:setDecay(0.3)
releaseSynth:setSustain(0)
releaseSynth:setRelease(0.1)
releaseSynth:setVolume(0.2)
releaseSynth:noteOff()

-- OK音用シンセサイザー（明るい上昇音）
local okSynth = snd.synth.new(snd.kWaveSine)
okSynth:setAttack(0)
okSynth:setDecay(0.3)
okSynth:setSustain(0.5)
okSynth:setRelease(0.2)
okSynth:setVolume(0.3)
okSynth:noteOff()

-- NG音用シンセサイザー（低い下降音）
local ngSynth = snd.synth.new(snd.kWaveSawtooth)
ngSynth:setAttack(0)
ngSynth:setDecay(0.5)
ngSynth:setSustain(0)
ngSynth:setRelease(0.2)
ngSynth:setVolume(0.25)
ngSynth:noteOff()

-- カーソル移動音用シンセサイザー（軽いクリック音）
local cursorSynth = snd.synth.new(snd.kWaveSquare)
cursorSynth:setAttack(0)
cursorSynth:setDecay(0.03)
cursorSynth:setSustain(0)
cursorSynth:setRelease(0.02)
cursorSynth:setVolume(0.15)
cursorSynth:noteOff()

-- サウンド再生関数
function Sound.playFlip()
    flipSynth:playNote(400, 0.15, 0.05)
end

-- 戻るときのめくり音（より短い）
function Sound.playFlipBack()
    flipSynth:playNote(500, 0.12, 0.025)
end

function Sound.playGrab()
    grabSynth:playNote(800, 0.25, 0.5)
end

function Sound.stopGrab()
    grabSynth:noteOff()
end

function Sound.playRelease()
    releaseSynth:playNote(600, 0.2, 0.5)
end

function Sound.playOK()
    okSynth:playNote(523, 0.3, 0.3)
end

function Sound.playNG()
    ngSynth:playNote(150, 0.25, 0.5)
end

function Sound.playCursor()
    cursorSynth:playNote(800, 0.15, 0.05)
end

-- クリア音（MP3ファイル）
local clearPlayer = nil

function Sound.playClear()
    if clearPlayer then
        clearPlayer:stop()
    end
    clearPlayer = snd.sampleplayer.new("sounds/se_omedetou")
    if clearPlayer then
        clearPlayer:setVolume(0.8)
        clearPlayer:play()
    end
end

-- 選択音（MP3ファイル）
local selectedPlayer = nil

function Sound.playSelected()
    if selectedPlayer then
        selectedPlayer:stop()
    end
    selectedPlayer = snd.sampleplayer.new("sounds/se_selected")
    if selectedPlayer then
        selectedPlayer:setVolume(0.8)
        selectedPlayer:play()
    end
end

--------------------------------------------------------------------------------
-- BGM（fileplayer使用）
--------------------------------------------------------------------------------

-- BGMプレイヤー
local bgmPlayer = nil
local currentBGM = nil  -- 現在再生中のBGM名（UIの状態管理用）
local currentBGMPath = nil  -- 現在再生中のBGMのパス（重複再生防止用）
local bgmEnabled = Settings.BGM_ENABLED  -- BGMのON/OFF設定（Settings参照）

-- BGMファイルパス（WAV形式）
local BGM_FILES = {
    title = "sounds/bgm_natsuyasuminotanken",
    selection = "sounds/bgm_natsuyasuminotanken",
    game = "sounds/bgm_fjordnosundakaze"
}

-- BGMを再生（同じBGMなら何もしない）
function Sound.playBGM(name)
    local path = BGM_FILES[name]
    if not path then
        print("Warning: Unknown BGM name: " .. tostring(name))
        return
    end

    -- 状態管理用のcurrentBGMを更新
    currentBGM = name

    -- BGMが無効なら何もしない
    if not bgmEnabled then
        return
    end

    -- 同じBGMが再生中なら何もしない
    if currentBGMPath == path and bgmPlayer and bgmPlayer:isPlaying() then
        return
    end

    -- 既存のBGMを停止
    if bgmPlayer then
        bgmPlayer:stop()
    end

    -- 新しいBGMを読み込んで再生
    currentBGMPath = path
    bgmPlayer = snd.fileplayer.new(path)
    if bgmPlayer then
        bgmPlayer:setVolume(0.5)
        bgmPlayer:play(0)  -- 0 = ループ再生
    else
        print("Warning: Failed to load BGM: " .. path)
        currentBGMPath = nil
    end
end

-- BGMを停止
function Sound.stopBGM()
    if bgmPlayer then
        bgmPlayer:stop()
    end
    currentBGMPath = nil
end

-- 現在のBGM名を取得
function Sound.getCurrentBGM()
    return currentBGM
end

-- BGMのON/OFF設定
function Sound.setBGMEnabled(enabled)
    bgmEnabled = enabled
    if enabled then
        -- ONにした場合、現在のBGMを再生
        if currentBGM then
            local path = BGM_FILES[currentBGM]
            if path then
                if bgmPlayer then
                    bgmPlayer:stop()
                end
                currentBGMPath = path
                bgmPlayer = snd.fileplayer.new(path)
                if bgmPlayer then
                    bgmPlayer:setVolume(0.5)
                    bgmPlayer:play(0)
                else
                    currentBGMPath = nil
                end
            end
        end
    else
        -- OFFにした場合、停止
        if bgmPlayer then
            bgmPlayer:stop()
        end
        currentBGMPath = nil
    end
end

-- BGMが有効かどうか
function Sound.isBGMEnabled()
    return bgmEnabled
end
