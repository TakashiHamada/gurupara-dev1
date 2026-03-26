// Sound.js - Web Audio sound system (transpiled from core/sound.lua)

import { Config } from './Config.js';

export class Sound {
    constructor() {
        this.ctx = null;
        this.seBuffers = {};
        this.seNodes = {};

        // BGM (HTML5 Audio for streaming/looping)
        this.bgmAudio = null;
        this.currentBGMName = null;
        this.currentBGMPath = null;
        this._bgmPending = false;

        // BGM fade state
        this.bgmFade = {
            active: false,
            currentVolume: 0,
            targetVolume: 0,
            step: 0,
        };

        // BGM file mapping
        this.BGM_FILES = {
            title: 'Source/sounds/Bgm/BGM_Title.wav',
            selection: 'Source/sounds/Bgm/BGM_Title.wav',
            game: 'Source/sounds/Bgm/BGM_Main.wav',
        };

        // SE file paths
        this.SE_FILES = {
            flip: 'Source/sounds/paper_next.wav',
            flipBack: 'Source/sounds/paper_back.wav',
            grab: 'Source/sounds/paper_grap.wav',
            release: 'Source/sounds/paper_release.wav',
            cursor: 'Source/sounds/paper_grap.wav',
            selectionCursor: 'Source/sounds/cursor.wav',
            ok: 'Source/sounds/congratulations_small.wav',
            ngNormal: 'Source/sounds/umyounyo.wav',
            ngFar: 'Source/sounds/enable.wav',
            pop: 'Source/sounds/popper.wav',
            selected: 'Source/sounds/selected.wav',
            checking: 'Source/sounds/checking.wav',
            enable: 'Source/sounds/enable.wav',
            backToMenu: 'Source/sounds/back_to_menu.wav',
        };

        // Answer voiceover buffers
        this.answerBuffers = {};

        this.loaded = false;

        // Master volume (user-facing control)
        this.masterVolume = 1.0;
        this._muted = false;
        this._preMuteVolume = 1.0;
        this._bgmBaseVolume = 0;

        // User interaction unlock
        this._interacted = false;
        const onInteract = () => {
            this._interacted = true;
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            if (this._bgmPending && this.bgmAudio) {
                this.bgmAudio.play().catch(() => {});
                this._bgmPending = false;
            }
            document.removeEventListener('keydown', onInteract);
            document.removeEventListener('click', onInteract);
            document.removeEventListener('touchstart', onInteract);
        };
        document.addEventListener('keydown', onInteract);
        document.addEventListener('click', onInteract);
        document.addEventListener('touchstart', onInteract);
    }

    _ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended' && this._interacted) {
            this.ctx.resume();
        }
        return this.ctx;
    }

    async loadAll() {
        const ctx = this._ensureContext();
        const promises = [];

        // Load all SE buffers
        for (const [name, path] of Object.entries(this.SE_FILES)) {
            promises.push(
                fetch(path)
                    .then(r => r.arrayBuffer())
                    .then(buf => ctx.decodeAudioData(buf))
                    .then(decoded => { this.seBuffers[name] = decoded; })
                    .catch(e => console.warn(`Failed to load SE: ${path}`, e))
            );
        }

        // Preload answer voiceovers for demo stages
        for (const stage of Config.STAGES) {
            const path = `Source/sounds/Answer/${stage.index}.wav`;
            promises.push(
                fetch(path)
                    .then(r => r.arrayBuffer())
                    .then(buf => ctx.decodeAudioData(buf))
                    .then(decoded => { this.answerBuffers[stage.index] = decoded; })
                    .catch(e => console.warn(`Failed to load answer: ${path}`, e))
            );
        }

        await Promise.all(promises);
        this.loaded = true;
        const loadedCount = Object.keys(this.seBuffers).length;
        const answerCount = Object.keys(this.answerBuffers).length;
        console.log(`[Sound] loadAll complete. SE buffers:${loadedCount}/${Object.keys(this.SE_FILES).length}, answer:${answerCount}`);
    }

    _playSE(name) {
        const ctx = this._ensureContext();
        const buffer = this.seBuffers[name];
        if (!buffer) return null;

        // Stop previous instance
        if (this.seNodes[name]) {
            try { this.seNodes[name].stop(); } catch (e) { /* already stopped */ }
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = Config.SE_VOLUME * this.masterVolume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        this.seNodes[name] = source;
        return source;
    }

    playFlip() { this._playSE('flip'); }
    playFlipBack() { this._playSE('flipBack'); }
    playGrab() { this._playSE('grab'); }
    playRelease() { this._playSE('release'); }
    playCursor() { this._playSE('cursor'); }
    playSelectionCursor() { this._playSE('selectionCursor'); }
    playPop() { this._playSE('pop'); }
    playSelected() { this._playSE('selected'); }
    playChecking() { this._playSE('checking'); }
    playEnable() { this._playSE('enable'); }
    playBackToMenu() { this._playSE('backToMenu'); }

    playOK(skipBGM) {
        const source = this._playSE('ok');
        if (source && !skipBGM) {
            source.onended = () => this.startBGMFadeIn();
        }
    }

    playNG(level) {
        const name = level === 'far' ? 'ngFar' : 'ngNormal';
        const source = this._playSE(name);
        if (source && level) {
            source.onended = () => this.startBGMFadeIn();
        }
    }

    playAnswer(stageIndex) {
        const ctx = this._ensureContext();
        const buffer = this.answerBuffers[stageIndex];
        if (!buffer) return;

        if (this.seNodes['answer']) {
            try { this.seNodes['answer'].stop(); } catch (e) { /* already stopped */ }
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = Config.SE_VOLUME * this.masterVolume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        this.seNodes['answer'] = source;
    }

    // --- BGM ---

    playBGM(name) {
        const path = this.BGM_FILES[name];
        if (!path) return;
        console.log(`[Sound] playBGM('${name}')`);

        this.currentBGMName = name;

        // Same BGM already playing
        if (this.currentBGMPath === path && this.bgmAudio && !this.bgmAudio.paused) {
            return;
        }

        // Stop existing
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }

        this.currentBGMPath = path;
        this.bgmAudio = new Audio(path);
        this.bgmAudio.loop = true;
        this._bgmBaseVolume = Config.BGM_VOLUME;
        this.bgmAudio.volume = this._bgmBaseVolume * this.masterVolume;
        this.bgmAudio.play().catch(() => {
            this._bgmPending = true;
        });
    }

    muteBGM() {
        this.bgmFade.active = false;
        this._bgmBaseVolume = 0;
        if (this.bgmAudio) {
            this.bgmAudio.volume = 0;
        }
    }

    restoreBGMVolume() {
        this.bgmFade.active = false;
        this._bgmBaseVolume = Config.BGM_VOLUME;
        if (this.bgmAudio) {
            this.bgmAudio.volume = this._bgmBaseVolume * this.masterVolume;
        }
    }

    fadeBGMTo(targetVolume, frames) {
        if (!this.bgmAudio) return;
        const current = this.bgmAudio.volume;
        if (frames <= 0 || Math.abs(current - targetVolume) < 0.001) {
            this.bgmAudio.volume = targetVolume;
            this.bgmFade.active = false;
            return;
        }
        this.bgmFade.active = true;
        this.bgmFade.currentVolume = current;
        this.bgmFade.targetVolume = targetVolume;
        this.bgmFade.step = (targetVolume - current) / frames;
    }

    startBGMFadeIn() {
        this.fadeBGMTo(Config.BGM_VOLUME, Config.BGM_RESULT_FADE_IN_FRAMES);
    }

    pauseBGM() {
        this.fadeBGMTo(Config.BGM_PAUSE_VOLUME, Config.BGM_PAUSE_FADE_FRAMES);
    }

    unpauseBGM() {
        this.fadeBGMTo(Config.BGM_VOLUME, Config.BGM_PAUSE_FADE_FRAMES);
    }

    stopBGM() {
        this.bgmFade.active = false;
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
        this.currentBGMPath = null;
    }

    update() {
        if (this.bgmFade.active && this.bgmAudio) {
            this.bgmFade.currentVolume += this.bgmFade.step;
            let done = false;
            if (this.bgmFade.step > 0) {
                done = this.bgmFade.currentVolume >= this.bgmFade.targetVolume;
            } else {
                done = this.bgmFade.currentVolume <= this.bgmFade.targetVolume;
            }
            if (done) {
                this.bgmFade.currentVolume = this.bgmFade.targetVolume;
                this.bgmFade.active = false;
            }
            this._bgmBaseVolume = this.bgmFade.currentVolume;
            this.bgmAudio.volume = Math.max(0, Math.min(1, this._bgmBaseVolume * this.masterVolume));
        }
    }

    // --- Master Volume (user-facing) ---

    setMasterVolume(v) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        if (this._muted && this.masterVolume > 0) {
            this._muted = false;
        }
        if (this.bgmAudio) {
            this.bgmAudio.volume = Math.max(0, Math.min(1, this._bgmBaseVolume * this.masterVolume));
        }
    }

    toggleMute() {
        if (this._muted) {
            this.masterVolume = this._preMuteVolume;
            this._muted = false;
        } else {
            this._preMuteVolume = this.masterVolume || 1.0;
            this.masterVolume = 0;
            this._muted = true;
        }
        if (this.bgmAudio) {
            this.bgmAudio.volume = Math.max(0, Math.min(1, this._bgmBaseVolume * this.masterVolume));
        }
    }

    get isMuted() {
        return this._muted;
    }
}
