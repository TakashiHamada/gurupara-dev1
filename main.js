// main.js - Game loop and scene management

import { Config } from './engine/Config.js';
import { GameState, Scene, easeOutQuad } from './engine/GameState.js';
import { InputHandler } from './engine/InputHandler.js';
import { Renderer } from './engine/Renderer.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { Transition } from './engine/Transition.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = new GameState();
        this.input = new InputHandler();
        this.renderer = new Renderer(this.canvas);
        this.assets = new AssetLoader();
        this.transition = new Transition();

        // Tutorial state
        this.tutorial = {
            isTutorialStage: false,
            step: 0,
            idleTimer: 0,
            overlayVisible: false,
            hasGrabbed: false,
            hasPlaced: false,
            correctOrder: false,
            grabHoldTimer: 0,
        };

        // Title animation
        this.titleAnimTime = 0;

        // Selection screen thumbnail animation
        this.state.selectionAnimFrame = 0;
        this.selectionAnimTimer = 0;

        // Crank visual
        this.crankElement = document.getElementById('crank-handle');

        // Thank-you screen
        this.showThankYou = false;

        this.running = false;
        this.lastFrameTime = 0;
        this.targetFrameInterval = 1000 / 30; // 30fps like Playdate
    }

    async init() {
        await this.assets.loadAll();
        this.running = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.running) return;

        requestAnimationFrame((t) => this.loop(t));

        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed < this.targetFrameInterval) return;
        this.lastFrameTime = timestamp - (elapsed % this.targetFrameInterval);

        this.input.update();
        this.input.computeCrankDelta();
        this.update();
        this.draw();
        this.input.endFrame();
    }

    update() {
        this.state.frameCounter++;
        this.transition.update();

        // Update crank visual
        if (this.crankElement) {
            this.crankElement.style.transform = `rotate(${this.input.crankAngle}deg)`;
        }

        if (this.transition.active) return;

        switch (this.state.currentScene) {
            case Scene.TITLE:
                this.updateTitle();
                break;
            case Scene.SELECTION:
                this.updateSelection();
                break;
            case Scene.GAME:
                if (this.showThankYou) {
                    this.updateThankYou();
                } else {
                    this.updateGame();
                }
                break;
        }
    }

    draw() {
        switch (this.state.currentScene) {
            case Scene.TITLE:
                this.renderer.drawTitleScreen(this.titleAnimTime);
                break;
            case Scene.SELECTION:
                this.renderer.drawSelectionScreen(this.state, this.assets);
                break;
            case Scene.GAME:
                if (this.showThankYou) {
                    this.renderer.drawThankYouScreen();
                } else {
                    this.renderer.drawGameScene(this.state, this.assets);
                    if (this.tutorial.isTutorialStage && !this.state.isChecking && !this.state.showResult) {
                        this.renderer.drawTutorialOverlay(this.tutorial);
                    }
                }
                break;
        }

        this.renderer.drawTransition(this.transition);
    }

    // --- Title ---
    updateTitle() {
        this.titleAnimTime += 0.1;

        if (this.input.isCheckJustPressed()) {
            // A button (Enter) pressed
            const tutorialCleared = this.state.isStageCleared(Config.TUTORIAL_STAGE_INDEX);

            this.transition.start(
                () => {
                    if (tutorialCleared) {
                        this.state.currentScene = Scene.SELECTION;
                        this.state.selectedIndex = this.state.lastSelectedStage;
                    } else {
                        // Go directly to tutorial
                        this.state.currentScene = Scene.GAME;
                        this.startStage(Config.TUTORIAL_STAGE_INDEX);
                    }
                },
                null
            );
        }
    }

    // --- Selection ---
    updateSelection() {
        // Thumbnail animation
        this.selectionAnimTimer++;
        if (this.selectionAnimTimer >= Config.THUMBNAIL_ANIM_INTERVAL) {
            this.selectionAnimTimer = 0;
            this.state.selectionAnimFrame++;
        }

        if (this.state.isPaused) {
            // Pause overlay
            if (this.input.isPauseJustPressed()) {
                this.state.isPaused = false;
            }
            return;
        }

        // Pause toggle
        if (this.input.isPauseJustPressed()) {
            this.state.isPaused = true;
            return;
        }

        // Cursor movement
        const cols = Config.SELECTION_GRID_COLS;
        const rows = Config.SELECTION_GRID_ROWS;
        const total = cols * rows;
        let idx = this.state.selectedIndex;
        let moved = false;

        // D-pad (Left/Right arrows serve as D-pad in Selection screen)
        if (this.input.isLeftJustPressed()) {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const newCol = (col - 1 + cols) % cols;
            idx = row * cols + newCol;
            moved = true;
        }
        if (this.input.isRightJustPressed()) {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const newCol = (col + 1) % cols;
            idx = row * cols + newCol;
            moved = true;
        }
        if (this.input.isUpJustPressed()) {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const newRow = (row - 1 + rows) % rows;
            idx = newRow * cols + col;
            moved = true;
        }
        if (this.input.isDownJustPressed()) {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const newRow = (row + 1) % rows;
            idx = newRow * cols + col;
            moved = true;
        }

        if (moved) {
            this.state.selectedIndex = idx;
        }

        // Start game
        if (this.input.isCheckJustPressed()) {
            const stageInfo = Config.STAGES.find(s => s.index === this.state.selectedIndex);

            if (!stageInfo) {
                // No stage data - if index >= 3, show thank you
                if (this.state.selectedIndex >= 3 || this.state.selectedIndex === 27) {
                    this.transition.start(
                        () => {
                            this.state.currentScene = Scene.GAME;
                            this.showThankYou = true;
                        },
                        null
                    );
                }
                return;
            }

            this.transition.start(
                () => {
                    this.state.currentScene = Scene.GAME;
                    this.startStage(this.state.selectedIndex);
                },
                null
            );
        }
    }

    startStage(stageIndex) {
        this.state.startGame(stageIndex);
        this.showThankYou = false;

        // Tutorial init
        this.tutorial.isTutorialStage = (stageIndex === Config.TUTORIAL_STAGE_INDEX);
        if (this.tutorial.isTutorialStage) {
            this.tutorial.step = 1;
            this.tutorial.idleTimer = 0;
            this.tutorial.overlayVisible = false;
            this.tutorial.hasGrabbed = false;
            this.tutorial.hasPlaced = false;
            this.tutorial.correctOrder = false;
            this.tutorial.grabHoldTimer = 0;
        } else {
            this.tutorial.step = 0;
            this.tutorial.overlayVisible = false;
        }
    }

    // --- Thank You ---
    updateThankYou() {
        if (this.input.isCheckJustPressed()) {
            this.transition.start(
                () => {
                    this.state.currentScene = Scene.SELECTION;
                    this.showThankYou = false;
                },
                null
            );
        }
    }

    // --- Main Game ---
    updateGame() {
        const state = this.state;

        if (state.isPaused) {
            this.updatePause();
            return;
        }

        // Wave phase
        state.wavePhase += Config.THUMBNAIL_WAVE_SPEED;

        // Get crank delta
        const crankDelta = this.input.getCrankDelta();
        state.lastCrankDelta = crankDelta;

        // Update crank smoothing
        this._updateCrankSmoothing(crankDelta);

        // Idle hint
        this._updateIdleHint(crankDelta);

        // Tutorial overlay
        if (this.tutorial.isTutorialStage) {
            this._updateTutorialOverlay(crankDelta);
        }

        // Result screen input
        if (state.showResult) {
            this._processResultInput(crankDelta);
            return;
        }

        // Clear animation
        if (state.isPlayingClearAnim) {
            this._updateClearAnimation();
            return;
        }

        // Wait result
        if (state.isWaitingResult) {
            this._updateWaitResult();
            return;
        }

        // Check animation
        if (state.isChecking) {
            this._updateCheckAnimation();
            return;
        }

        // Slide animation
        if (state.isSliding) {
            this._updateSlideAnimation();
            return;
        }

        // Place animation
        if (state.isPlacing) {
            this._updatePlaceAnimation();
            return;
        }

        // Grab animation
        if (state.isGrabbing) {
            this._updateGrabAnimation();

            // Tutorial grab hold
            if (this.tutorial.isTutorialStage && this.tutorial.step === 2) {
                this.tutorial.grabHoldTimer++;
                if (this.tutorial.grabHoldTimer >= Config.TUTORIAL_GRAB_HOLD_THRESHOLD) {
                    this.tutorial.step = 3;
                    this.tutorial.idleTimer = 0;
                    this.tutorial.overlayVisible = true;
                }
            }
        }

        // Process grab/place
        const grabPressed = this.input.isGrabPressed();

        if (grabPressed && !state.isGrabbing && !this._isBlocked()) {
            // Tutorial Step 1: block grab until crank rotated
            const tutorialBlock = this.tutorial.isTutorialStage && this.tutorial.step === 1;
            if (!tutorialBlock) {
                this._doGrab();
            }
        }

        if (!grabPressed && state.isGrabbing && state.grabAnimProgress >= 1) {
            this._doPlace();
        }

        // Frame movement from crank (allowed even while grabbing, to change insert position)
        if (!this._isCrankBlocked()) {
            this._processFrameMovement(crankDelta);
        }

        // Check answer (Enter / A button)
        if (this.input.isCheckJustPressed() && !this._isBlocked()) {
            this._startCheck();
        }

        // Pause (Esc / B button)
        if (this.input.isPauseJustPressed() && !this._isBlocked()) {
            state.togglePause();
        }
    }

    _isBlocked() {
        const s = this.state;
        return s.isGrabbing || s.isPlacing || s.isChecking || s.isWaitingResult || s.showResult || s.isSliding || s.isPaused;
    }

    _isCrankBlocked() {
        const s = this.state;
        return s.isPlacing || s.isChecking || s.isWaitingResult || s.showResult || s.isSliding || s.isPaused;
    }

    _updateCrankSmoothing(crankDelta) {
        const s = this.state;
        s.crankHistorySum = s.crankHistorySum - s.crankDeltaHistory[s.crankHistoryIndex] + crankDelta;
        s.crankDeltaHistory[s.crankHistoryIndex] = crankDelta;
        s.crankHistoryIndex = (s.crankHistoryIndex + 1) % Config.CRANK_HISTORY_SIZE;
        s.smoothedDelta = s.crankHistorySum / Config.CRANK_HISTORY_SIZE;

        const wasIdle = s.isCrankIdle;
        s.isCrankIdle = Math.abs(s.smoothedDelta) <= Config.CRANK_IDLE_THRESHOLD;

        if (!wasIdle && s.isCrankIdle) {
            s.accumulatedAngle = 0;
            s.isQuickStarting = false;
        }
        if (wasIdle && !s.isCrankIdle) {
            s.isQuickStarting = true;
        }
    }

    _processFrameMovement(crankDelta) {
        const s = this.state;
        const count = s.puzzle.getCurrentCount();
        if (count === 0) return;

        s.accumulatedAngle += crankDelta;

        let threshold = s.isQuickStarting ? Config.DEGREES_PER_FRAME_QUICK : s.degreesPerFrame;
        let moved = false;

        // Forward
        while (s.accumulatedAngle >= threshold) {
            s.accumulatedAngle -= threshold;
            const prevImg = s.puzzle.getFrameAt(s.currentFrameIndex);

            s.currentFrameIndex = (s.currentFrameIndex + 1) % count;
            moved = true;

            // Start slide animation
            this._startSlide(1, prevImg);

            if (s.isQuickStarting) {
                s.accumulatedAngle = 0;
                s.isQuickStarting = false;
                break;
            }
            threshold = s.degreesPerFrame;
        }

        // Backward
        while (s.accumulatedAngle <= -threshold) {
            s.accumulatedAngle += threshold;
            const prevImg = s.puzzle.getFrameAt(s.currentFrameIndex);

            s.currentFrameIndex = (s.currentFrameIndex - 1 + count) % count;
            moved = true;

            this._startSlide(-1, prevImg);

            if (s.isQuickStarting) {
                s.accumulatedAngle = 0;
                s.isQuickStarting = false;
                break;
            }
            threshold = s.degreesPerFrame;
        }

        if (moved && this.tutorial.isTutorialStage && this.tutorial.step === 1) {
            this.tutorial.step = 2;
            this.tutorial.idleTimer = 0;
            this.tutorial.overlayVisible = false;
        }
    }

    _startSlide(direction, prevImage) {
        const s = this.state;
        s.isSliding = true;
        s.slideDirection = direction;
        s.slideProgress = 0;
        s.slideDuration = direction > 0 ? Config.SLIDE_OUT_DURATION : Config.SLIDE_IN_DURATION;
        s.slidePrevImage = prevImage;
    }

    _updateSlideAnimation() {
        const s = this.state;
        s.slideProgress += 1 / s.slideDuration;
        if (s.slideProgress >= 1) {
            s.slideProgress = 1;
            s.isSliding = false;
        }
    }

    _doGrab() {
        const s = this.state;
        s.isGrabbing = true;
        s.grabbedFrame = s.puzzle.grabFrame(s.currentFrameIndex);
        s.grabAnimProgress = 0;

        const newCount = s.puzzle.getCurrentCount();
        if (s.currentFrameIndex >= newCount) {
            s.currentFrameIndex = 0;
        }

        if (this.tutorial.isTutorialStage && this.tutorial.step === 2) {
            this.tutorial.grabHoldTimer = 0;
            this.tutorial.hasGrabbed = true;
        }
    }

    _updateGrabAnimation() {
        const s = this.state;
        if (s.grabAnimProgress < 1) {
            s.grabAnimProgress += 1 / Config.GRAB_ANIM_DURATION;
            if (s.grabAnimProgress > 1) s.grabAnimProgress = 1;
        }
    }

    _doPlace() {
        const s = this.state;
        s.isGrabbing = false;
        s.isPlacing = true;
        s.placeAnimProgress = 0;
        s.placingFrame = s.grabbedFrame;
        s.placeTargetIndex = s.currentFrameIndex;
        s.grabbedFrame = -1;
    }

    _updatePlaceAnimation() {
        const s = this.state;
        s.placeAnimProgress += 1 / Config.PLACE_ANIM_DURATION;
        if (s.placeAnimProgress >= 1) {
            s.placeAnimProgress = 1;
            s.puzzle.placeFrame(s.placeTargetIndex, s.placingFrame);
            s.isPlacing = false;

            // Tutorial step 3 check
            if (this.tutorial.isTutorialStage && this.tutorial.step === 3) {
                this.tutorial.hasPlaced = true;
                if (s.puzzle.isCorrectOrder()) {
                    this.tutorial.step = 4;
                    this.tutorial.idleTimer = 0;
                    this.tutorial.overlayVisible = true;
                    this.tutorial.correctOrder = true;
                } else {
                    this.tutorial.step = 2;
                    this.tutorial.idleTimer = 0;
                    this.tutorial.overlayVisible = false;
                    this.tutorial.grabHoldTimer = 0;
                }
            }

            s.placingFrame = -1;
        }
    }

    _startCheck() {
        const s = this.state;

        // Tutorial: allow check even during step 1 overlay
        if (this._isBlocked()) {
            if (!(this.tutorial.isTutorialStage && this.tutorial.step === 1 && this.tutorial.overlayVisible)) {
                return;
            }
        }

        s.isChecking = true;
        s.checkAnimFrame = 0;
        s.checkAnimTimer = 0;
        s.resultCorrect = s.puzzle.isCorrectOrder();
        s.idleTimer = 0;
        s.showHint = false;

        if (this.tutorial.isTutorialStage) {
            this.tutorial.overlayVisible = false;
            if (this.tutorial.step === 4) {
                this.tutorial.step = 5;
            }
        }
    }

    _updateCheckAnimation() {
        const s = this.state;
        s.checkAnimTimer++;
        if (s.checkAnimTimer >= Config.CHECK_FRAME_INTERVAL) {
            s.checkAnimTimer = 0;
            s.checkAnimFrame++;

            if (s.checkAnimFrame >= s.frameCount * 2) {
                s.isChecking = false;
                s.isWaitingResult = true;
                s.waitResultTimer = 0;
            }
        }
    }

    _updateWaitResult() {
        const s = this.state;
        s.waitResultTimer++;
        if (s.waitResultTimer >= Config.WAIT_RESULT_DURATION) {
            s.isWaitingResult = false;
            s.showResult = true;
            s.resultAnimTime = 0;

            if (s.resultCorrect) {
                s.clearTime = performance.now() - s.startTime - s.totalPausedTime;
                s.isNewHiScore = s.setHiScore(s.stageIndex, s.clearTime);
            } else {
                s.isNewHiScore = false;
            }
        }
    }

    _processResultInput(crankDelta) {
        const s = this.state;

        if (s.isPlayingClearAnim) {
            this._updateClearAnimation();
            return;
        }

        if (s.resultCorrect) {
            s.resultAnimTime = (s.resultAnimTime || 0) + 0.1;

            if (this.input.isCheckJustPressed()) {
                // Go to selection
                s.showResult = false;
                this.transition.start(
                    () => {
                        s.currentScene = Scene.SELECTION;
                        s.selectedIndex = s.lastSelectedStage;
                    },
                    null
                );
            } else if (this.input.isPauseJustPressed()) {
                // Replay clear animation
                s.isPlayingClearAnim = true;
                s.clearAnimFrame = 0;
                s.clearAnimTimer = 0;
                s.clearAnimLoopCount = 0;
            }
        } else {
            // NG: any input dismisses
            if (this.input.isAnyJustPressed() || Math.abs(crankDelta) > Config.CRANK_THRESHOLD) {
                s.showResult = false;
            }
        }
    }

    _updateClearAnimation() {
        const s = this.state;
        s.clearAnimTimer++;
        if (s.clearAnimTimer >= Config.CHECK_FRAME_INTERVAL) {
            s.clearAnimTimer = 0;
            s.clearAnimFrame++;

            if (s.clearAnimFrame >= s.frameCount) {
                s.clearAnimFrame = 0;
                s.clearAnimLoopCount++;

                if (s.clearAnimLoopCount >= 2) {
                    s.isPlayingClearAnim = false;
                }
            }
        }
    }

    _updateIdleHint(crankDelta) {
        const s = this.state;
        if (Math.abs(crankDelta) > Config.CRANK_THRESHOLD) {
            s.idleTimer = 0;
            s.showHint = false;
        } else if (this._isBlocked()) {
            s.idleTimer = 0;
            s.showHint = false;
        } else {
            s.idleTimer++;
            if (s.idleTimer >= Config.HINT_IDLE_FRAMES) {
                s.showHint = true;
            }
        }
    }

    _updateTutorialOverlay(crankDelta) {
        const t = this.tutorial;
        if (t.step < 1 || t.step > 4) return;

        if (t.overlayVisible) {
            const crankMoved = Math.abs(crankDelta) > Config.CRANK_THRESHOLD;
            const anyKey = this.input.isAnyJustPressed();

            let shouldClose = false;
            if (t.step === 1) {
                shouldClose = crankMoved;
            } else {
                shouldClose = anyKey || crankMoved;
            }

            if (shouldClose) {
                t.overlayVisible = false;
                t.idleTimer = 0;
            }
        } else {
            if (this._isBlocked()) {
                t.idleTimer = 0;
            } else if (Math.abs(crankDelta) > Config.CRANK_THRESHOLD) {
                t.idleTimer = 0;
            } else {
                t.idleTimer++;
                if (t.idleTimer >= Config.TUTORIAL_IDLE_THRESHOLD) {
                    t.overlayVisible = true;
                }
            }
        }
    }

    updatePause() {
        const s = this.state;

        if (this.input.isPauseJustPressed()) {
            s.togglePause();
            return;
        }

        if (this.input.isCheckJustPressed() && s.isStageCleared(Config.TUTORIAL_STAGE_INDEX)) {
            s.isPaused = false;
            this.transition.start(
                () => {
                    s.currentScene = Scene.SELECTION;
                    s.selectedIndex = s.lastSelectedStage;
                },
                null
            );
        }
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
