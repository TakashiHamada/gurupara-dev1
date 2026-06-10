// GameState.js - Game state management (transpiled from game/state.lua)

import { Config } from './Config.js';
import { PuzzleEngine } from './PuzzleEngine.js';

export const Scene = {
    TITLE: 'title',
    SELECTION: 'selection',
    GAME: 'game',
};

export class GameState {
    constructor() {
        this.puzzle = new PuzzleEngine();
        this.currentScene = Scene.TITLE;

        // Stage info
        this.stageIndex = 0;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.currentAnimationName = null;
        this.animImages = [];

        // Timing
        this.startTime = 0;
        this.clearTime = 0;
        this.totalPausedTime = 0;
        this.pauseStartTime = 0;

        // Interaction states
        this.isGrabbing = false;
        this.isPlacing = false;
        this.isChecking = false;
        this.isWaitingResult = false;
        this.showResult = false;
        this.resultCorrect = false;
        this.isPaused = false;
        this.grabbedFrame = -1;
        this.isNewHiScore = false;

        // Selection screen catalog button (updated by DOM mouse listeners in main.js)
        this.catalogHover = false;
        this.catalogPressed = false;

        // NG level
        this.ngLevel = "normal";

        // Answer animation (character reaction)
        this.ngAnimFrame = 0;
        this.ngAnimTimer = 0;
        this.ngAnimPhase = "done"; // "forward" / "hold" / "reverse" / "done"
        this.goodAnimFrame = 0;
        this.goodAnimTimer = 0;
        this.goodAnimPhase = "done"; // "forward" / "hold" / "reverse" / "done"

        // Animation progress
        this.grabAnimProgress = 0;
        this.placeAnimProgress = 0;
        this.checkAnimFrame = 0;
        this.checkAnimTimer = 0;
        this.waitResultTimer = 0;
        this.clearAnimFrame = 0;
        this.clearAnimLoopCount = 0;
        this.isPlayingClearAnim = false;
        this.showCheckBlackFrame = false;

        // Celebration (confetti)
        this.isCelebrating = false;
        this.celebrationTimer = 0;
        this.celebrationParticles = [];
        this.celebrationTitleShown = false;

        // Slide animation (production supports multiple simultaneous slides)
        this.slideOutAnimations = [];
        this.slideInAnimations = [];
        this.isSliding = false;
        this.slideDirection = 0;
        this.slideProgress = 0;
        this.slideDuration = 0;

        // Crank state
        this.crankAngle = 0;
        this.isCrankIdle = true;
        this.isQuickStarting = false;
        this.accumulatedAngle = 0;
        this.flipCooldown = 0;
        this.crankDeltaHistory = new Array(Config.CRANK_HISTORY_SIZE).fill(0);
        this.crankHistoryIndex = 0;
        this.crankHistorySum = 0;
        this.smoothedDelta = 0;
        this.lastCrankDelta = 0;

        // UI state
        this.idleTimer = 0;
        this.showHint = false;
        this.wavePhase = 0;
        this.resultAnimTime = 0;

        // Persistence
        this.hiScores = {};
        this.lastSelectedStage = 0;
        this.currentSensitivity = Config.DEFAULT_SENSITIVITY;
        this.currentHiScore = null;
        this.shownFirstGameHint = false;

        // Selection screen
        this.selectedIndex = 0;
        this.selectionCrankAccum = 0;
        this.selectionAnimFrame = 0;

        // Frame counter
        this.frameCounter = 0;

        // Prompt animation
        this.promptAnimTime = 0;

        this.loadSettings();
    }

    get degreesPerFrame() {
        const opt = Config.SENSITIVITY_OPTIONS.find(o => o.name === this.currentSensitivity);
        return opt ? opt.degrees : 120;
    }

    loadSettings() {
        try {
            const data = localStorage.getItem('gurupara_save');
            if (data) {
                const parsed = JSON.parse(data);
                this.hiScores = parsed.hiScores || {};
                this.lastSelectedStage = parsed.lastSelectedStage || 0;
                this.currentSensitivity = parsed.sensitivity || Config.DEFAULT_SENSITIVITY;
                this.shownFirstGameHint = parsed.shownFirstGameHint || false;
            }
        } catch (e) {
            // No save data
        }
    }

    saveSettings() {
        try {
            const data = {
                hiScores: this.hiScores,
                lastSelectedStage: this.lastSelectedStage,
                sensitivity: this.currentSensitivity,
                shownFirstGameHint: this.shownFirstGameHint,
            };
            localStorage.setItem('gurupara_save', JSON.stringify(data));
        } catch (e) {
            // Storage not available
        }
    }

    startGame(stageIndex) {
        const stageInfo = Config.STAGES.find(s => s.index === stageIndex);
        if (!stageInfo) return;

        this.stageIndex = stageIndex;
        this.frameCount = stageInfo.frameCount;
        this.currentFrameIndex = 0;
        this.currentAnimationName = stageInfo.name;

        this.puzzle.init(this.frameCount);
        this.puzzle.shuffle();

        // Current hi score
        this.currentHiScore = this.getHiScore(stageIndex);

        // Reset states
        this.isGrabbing = false;
        this.isPlacing = false;
        this.isChecking = false;
        this.isWaitingResult = false;
        this.showResult = false;
        this.resultCorrect = false;
        this.isPaused = false;
        this.grabbedFrame = -1;
        this.isNewHiScore = false;
        this.ngLevel = "normal";
        this.ngAnimFrame = 0;
        this.ngAnimTimer = 0;
        this.ngAnimPhase = "done";
        this.goodAnimFrame = 0;
        this.goodAnimTimer = 0;
        this.goodAnimPhase = "done";
        this.grabAnimProgress = 0;
        this.placeAnimProgress = 0;
        this.showCheckBlackFrame = false;

        // Clear animation
        this.isPlayingClearAnim = false;
        this.clearAnimFrame = 0;
        this.clearAnimLoopCount = 0;

        // Celebration
        this.isCelebrating = false;
        this.celebrationTimer = 0;
        this.celebrationParticles = [];
        this.celebrationTitleShown = false;

        // Slide
        this.isSliding = false;
        this.slideProgress = 0;
        this.slideOutAnimations = [];
        this.slideInAnimations = [];

        // Crank reset
        this.accumulatedAngle = 0;
        this.flipCooldown = 0;
        this.crankDeltaHistory = new Array(Config.CRANK_HISTORY_SIZE).fill(0);
        this.crankHistoryIndex = 0;
        this.crankHistorySum = 0;
        this.smoothedDelta = 0;
        this.isCrankIdle = true;
        this.isQuickStarting = false;

        // UI reset
        this.idleTimer = 0;
        this.showHint = false;
        this.wavePhase = 0;
        this.resultAnimTime = 0;
        this.promptAnimTime = 0;

        // Timer
        this.startTime = performance.now();
        this.totalPausedTime = 0;
        this.clearTime = 0;

        this.lastSelectedStage = stageIndex;
        this.saveSettings();
    }

    isStageCleared(index) {
        return this.hiScores[String(index)] !== undefined;
    }

    getHiScore(index) {
        return this.hiScores[String(index)] || null;
    }

    setHiScore(index, time) {
        const key = String(index);
        const existing = this.hiScores[key];
        if (existing === undefined || time < existing) {
            this.hiScores[key] = time;
            this.currentHiScore = time;
            this.saveSettings();
            return true; // New best
        }
        return false;
    }

    getElapsedTime() {
        if (this.clearTime > 0) return this.clearTime;
        const now = performance.now();
        const paused = this.isPaused ? (now - this.pauseStartTime) : 0;
        return now - this.startTime - this.totalPausedTime - paused;
    }

    formatTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    togglePause() {
        if (this.isPaused) {
            this.totalPausedTime += performance.now() - this.pauseStartTime;
            this.isPaused = false;
        } else {
            this.pauseStartTime = performance.now();
            this.isPaused = true;
        }
    }
}

// Easing functions
export function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

export function easeOutSine(t) {
    return Math.sin(t * Math.PI / 2);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
