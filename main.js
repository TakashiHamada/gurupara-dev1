// main.js - Game loop and scene management

import { Config } from './engine/Config.js';
import { GameState, Scene, easeOutQuad } from './engine/GameState.js';
import { InputHandler } from './engine/InputHandler.js';
import { Renderer } from './engine/Renderer.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { Transition } from './engine/Transition.js';
import { Sound } from './engine/Sound.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = new GameState();
        this.input = new InputHandler();
        this.renderer = new Renderer(this.canvas);
        this.assets = new AssetLoader();
        this.transition = new Transition();
        this.sound = new Sound();

        // Tutorial state (10-step progressive system from production)
        this.tutorial = {
            isTutorialStage: false,
            step: 0,
            idleTimer: 0,
            overlayVisible: false,
            overlayType: null, // "stop" / "interactive" / null
            crankUnlocked: false,
            dpadUnlocked: false,
            checkUnlocked: false,
            framesRotatedCount: 0,
            step8DisplayTimer: 0,
            step9DisplayTimer: 0,
            step10DisplayTimer: 0,
            overlayPending: false,
            overlayDelayTimer: 0,
            crankIndicatorDelayTimer: 0,
            promptAnimTime: 0,
            // First game hint
            showingFirstGameHint: false,
            // Good animation for stop overlays
            goodAnimFrame: 0,
            goodAnimTimer: 0,
            goodAnimPhase: "hidden", // "hidden" / "forward" / "visible" / "reverse"
        };

        // Title state (production-style animated title)
        this.titleState = {
            animFrame: 0,
            animTimer: 0,
            bgScrollX: 0,
            bgScrollY: 0,
            bgIntroFrame: 0,
            selectedMenuIndex: 0,
            crankAccumulated: 0,
            arrowAnimTime: 0,
            animTime: 0,
        };

        // Selection screen thumbnail animation
        this.state.selectionAnimFrame = 0;
        this.selectionAnimTimer = 0;

        // Crank visual
        this.crankElement = null;

        // Thank-you screen
        this.showThankYou = false;

        // Secret combo state
        this.secretState = {
            progress: 0,
            lastInputFrame: 0,
            frameCounter: 0,
        };

        this.running = false;
        this.lastFrameTime = 0;
        this.targetFrameInterval = 1000 / 30;
    }

    async init() {
        console.log('[Game] init() starting...');
        await Promise.all([
            this.assets.loadAll(),
            this.sound.loadAll(),
        ]);
        console.log(`[Game] Assets loaded. titleImages:${this.assets.titleImages.length}, sound:${this.sound.loaded}`);
        console.log(`[Game] AnswerAnim images: good=${this.assets.answerAnimImages.good.length} bad=${this.assets.answerAnimImages.bad.length} near=${this.assets.answerAnimImages.near.length} sobad=${this.assets.answerAnimImages.sobad.length}`);
        this.sound.playBGM('title');
        this.running = true;
        this.lastFrameTime = performance.now();
        console.log('[Game] init() complete, starting game loop');
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
        this.sound.update();
        this.update();
        this.draw();
        this.input.endFrame();
    }

    update() {
        this.state.frameCounter++;
        this.transition.update();
        // Update answer animations
        this._updateAnswerAnimations();

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
                this.renderer.drawTitleScreen(this.titleState, this.assets.titleImages);
                break;
            case Scene.SELECTION:
                this.renderer.drawSelectionScreen(this.state, this.assets);
                break;
            case Scene.GAME:
                if (this.showThankYou) {
                    this.renderer.drawThankYouScreen();
                } else {
                    this.renderer.drawGameScene(this.state, this.assets, this.tutorial);
                }
                break;
        }

        this.renderer.drawTransition(this.transition);
    }

    // --- Title ---
    updateTitle() {
        const ts = this.titleState;
        ts.animTime += 0.1;
        ts.arrowAnimTime += 0.1;

        // Title animation frame update
        ts.animTimer++;
        if (ts.animTimer >= Config.TITLE_ANIM_FRAME_INTERVAL) {
            ts.animTimer = 0;
            ts.animFrame = (ts.animFrame + 1) % Config.TITLE_ANIM_FRAME_COUNT;
        }

        // Dot intro animation
        if (ts.bgIntroFrame < Config.TITLE_BG_DOT_INTRO_FRAMES) {
            ts.bgIntroFrame++;
        }

        // Background scroll (after intro completes)
        if (ts.bgIntroFrame >= Config.TITLE_BG_DOT_INTRO_FRAMES) {
            const speed = Config.TITLE_BG_SCROLL_SPEED;
            const spacing = Config.TITLE_BG_DOT_SPACING;
            ts.bgScrollX += speed;
            ts.bgScrollY -= speed;
            if (ts.bgScrollX >= spacing) ts.bgScrollX -= spacing;
            if (ts.bgScrollY <= -spacing) ts.bgScrollY += spacing;
        }

        // Menu fixed to START GAME (demo version)
        ts.selectedMenuIndex = 0;

        // Select menu item
        if (this.input.isCheckJustPressed()) {
            if (ts.selectedMenuIndex === 0) {
                // START GAME
                this.sound.playSelected();
                const tutorialCleared = this.state.isStageCleared(Config.TUTORIAL_STAGE_INDEX);
                console.log(`[Title] START GAME pressed. tutorialCleared=${tutorialCleared}`);

                this.transition.start(
                    () => {
                        if (tutorialCleared) {
                            console.log('[Scene] Title → Selection');
                            this.state.currentScene = Scene.SELECTION;
                            this.state.selectedIndex = Math.min(this.state.lastSelectedStage, Config.STAGES.length - 1);
                            this.sound.playBGM('selection');
                        } else {
                            console.log('[Scene] Title → Game (tutorial)');
                            this.state.currentScene = Scene.GAME;
                            this.startStage(Config.TUTORIAL_STAGE_INDEX);
                            this.sound.playBGM('game');
                        }
                    },
                    null
                );
            }
            // SETTINGS and CREDITS not implemented in demo
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
            if (this.input.isPauseJustPressed()) {
                this.state.isPaused = false;
                this.sound.playEnable();
            }
            return;
        }

        if (this.input.isPauseJustPressed()) {
            this.state.isPaused = true;
            this.sound.playEnable();
            return;
        }

        // Cursor movement
        const stageCount = Config.STAGES.length;
        let idx = Math.min(this.state.selectedIndex, stageCount - 1);
        let moved = false;
        if (this.input.isLeftJustPressed()) {
            idx = (idx - 1 + stageCount) % stageCount;
            moved = true;
        }
        if (this.input.isRightJustPressed()) {
            idx = (idx + 1) % stageCount;
            moved = true;
        }

        if (moved) {
            this.state.selectedIndex = idx;
            this.sound.playSelectionCursor();
        }

        // Start game
        if (this.input.isCheckJustPressed()) {
            const stageInfo = Config.STAGES.find(s => s.index === this.state.selectedIndex);

            if (!stageInfo) {
                // No stage data - show thank you for unavailable stages
                this.sound.playEnable();
                this.transition.start(
                    () => {
                        this.state.currentScene = Scene.GAME;
                        this.showThankYou = true;
                    },
                    null
                );
                return;
            }

            this.sound.playSelected();
            this.transition.start(
                () => {
                    this.state.currentScene = Scene.GAME;
                    this.startStage(this.state.selectedIndex);
                    this.sound.playBGM('game');
                },
                null
            );
        }
    }

    startStage(stageIndex) {
        console.log(`[Game] startStage(${stageIndex})`);
        this.state.startGame(stageIndex);
        this.showThankYou = false;

        // Tutorial init (10-step system)
        const t = this.tutorial;
        t.showingFirstGameHint = false;
        t.isTutorialStage = (stageIndex === Config.TUTORIAL_STAGE_INDEX);

        if (t.isTutorialStage) {
            console.log('[Tutorial] Starting tutorial stage');
            this._tutorialEnterStep(1);
        } else {
            t.step = 0;
            t.overlayVisible = false;
            t.overlayType = null;
            t.crankUnlocked = false;
            t.dpadUnlocked = false;
            t.checkUnlocked = false;
            t.framesRotatedCount = 0;
            t.step8DisplayTimer = 0;
            t.step9DisplayTimer = 0;
            t.step10DisplayTimer = 0;
            t.overlayPending = false;
            t.overlayDelayTimer = 0;
            t.crankIndicatorDelayTimer = 0;
            t.promptAnimTime = 0;

            // First game hint (first time playing non-tutorial after clearing tutorial)
            if (!this.state.shownFirstGameHint && this.state.isStageCleared(Config.TUTORIAL_STAGE_INDEX)) {
                t.showingFirstGameHint = true;
                t.overlayType = "stop";
                t.overlayPending = true;
                t.overlayDelayTimer = 0;
                t.promptAnimTime = 0;
            }
        }

        // Reset secret combo
        this.secretState = { progress: 0, lastInputFrame: 0, frameCounter: 0 };
    }

    _tutorialEnterStep(step) {
        const t = this.tutorial;
        console.log(`[Tutorial] enterStep(${step}) type=${Config.TUTORIAL_STEP_TYPE[step] || 'none'}`);
        t.step = step;
        t.idleTimer = 0;

        // Update unlock flags
        if (step >= Config.TUTORIAL_CRANK_UNLOCK_STEP) t.crankUnlocked = true;
        if (step >= Config.TUTORIAL_DPAD_UNLOCK_STEP) t.dpadUnlocked = true;
        if (step >= Config.TUTORIAL_CHECK_UNLOCK_STEP) t.checkUnlocked = true;

        // Set overlay type from config
        t.overlayType = Config.TUTORIAL_STEP_TYPE[step] || null;

        if (t.overlayType === "stop") {
            // Check if previous step was also stop (consecutive stop)
            const prevType = Config.TUTORIAL_STEP_TYPE[step - 1];
            if (prevType === "stop") {
                t.overlayVisible = true;
                t.promptAnimTime = 0;
            } else {
                // Group start: delay before showing
                t.overlayPending = true;
                t.overlayDelayTimer = 0;
                t.promptAnimTime = 0;
            }
        } else if (step === 9) {
            t.overlayVisible = true;
        } else {
            t.overlayVisible = false;
        }

        // Tutorial good animation: reverse on group end (step 4, 8)
        if (step === 4 || step === 8) {
            if (t.goodAnimFrame > 0) {
                t.goodAnimPhase = "reverse";
                t.goodAnimTimer = 0;
                console.log(`[Tutorial] Good anim → reverse (group end, step ${step})`);
            } else {
                t.goodAnimPhase = "hidden";
            }
        }

        // Reset step-specific state
        if (step === 4) {
            t.framesRotatedCount = 0;
            t.crankIndicatorDelayTimer = 0;
        } else if (step === 8) {
            t.step8DisplayTimer = 0;
        } else if (step === 9) {
            t.step9DisplayTimer = 0;
        } else if (step === 10) {
            t.step10DisplayTimer = 0;
        }
    }

    _isTutorialStopOverlayActive() {
        const t = this.tutorial;
        if (t.overlayPending) return true;
        if (t.showingFirstGameHint && t.overlayVisible) return true;
        return t.overlayVisible && t.overlayType === "stop";
    }

    _isTutorialCrankBlocked() {
        const t = this.tutorial;
        return t.isTutorialStage && !t.crankUnlocked;
    }

    _isTutorialDpadBlocked() {
        const t = this.tutorial;
        return t.isTutorialStage && !t.dpadUnlocked;
    }

    _isTutorialCheckBlocked() {
        const t = this.tutorial;
        return t.isTutorialStage && !t.checkUnlocked;
    }

    // --- Thank You ---
    updateThankYou() {
        if (this.input.isCheckJustPressed()) {
            this.sound.playBackToMenu();
            this.transition.start(
                () => {
                    this.state.currentScene = Scene.SELECTION;
                    this.showThankYou = false;
                    this.sound.playBGM('selection');
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

        // Tutorial overlay update
        this._updateTutorialOverlay(crankDelta);

        // Celebration update
        if (state.isCelebrating) {
            this._updateCelebration();
            // Allow skipping celebration with Enter or Esc
            if (this.input.isCheckJustPressed() || this.input.isPauseJustPressed()) {
                state.isCelebrating = false;
                state.celebrationParticles = [];
                state.showResult = true;
                state.resultAnimTime = 0;
                state.goodAnimFrame = 0;
                state.goodAnimTimer = 0;
                state.goodAnimPhase = "forward";
            }
            return;
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
        }

        // Place animation
        if (state.isPlacing) {
            this._updatePlaceAnimation();
            return;
        }

        // Grab animation
        if (state.isGrabbing) {
            this._updateGrabAnimation();
        }

        // Process grab/place
        const grabPressed = this.input.isGrabPressed();

        if (grabPressed && !state.isGrabbing && !this._isBlocked() && !this._isTutorialDpadBlocked()) {
            this._doGrab();
            this.sound.playGrab();
        }

        if (!grabPressed && state.isGrabbing && state.grabAnimProgress >= 1) {
            this._doPlace();
            this.sound.playRelease();
        }

        // Flip cooldown timer
        if (state.flipCooldown > 0) state.flipCooldown--;

        // Frame movement: instant flip on key press, crank for analog input
        if (!this._isCrankBlocked() && !this._isTutorialCrankBlocked()) {
            if (this.input.isRightJustPressed() && state.flipCooldown <= 0) {
                this._flipFrame(1);
            } else if (this.input.isLeftJustPressed() && state.flipCooldown <= 0) {
                this._flipFrame(-1);
            } else if (!state.isSliding) {
                this._processFrameMovement(crankDelta);
            }
        }

        // Check answer (Enter / A button)
        if (this.input.isCheckJustPressed() && !this._isBlocked() && !this._isTutorialCheckBlocked()) {
            // Don't check if tutorial stop overlay is active or hint was just dismissed this frame
            if (!this._isTutorialStopOverlayActive() && !this.tutorial.hintJustDismissed) {
                this._startCheck();
            }
        }
        this.tutorial.hintJustDismissed = false;

        // Pause (Esc / B button)
        if (this.input.isPauseJustPressed() && !this._isBlocked() && !this._isTutorialStopOverlayActive()) {
            // Tutorial not cleared: no pause allowed
            const tutorialNotCleared = this.tutorial.isTutorialStage && !state.isStageCleared(Config.TUTORIAL_STAGE_INDEX);
            if (!tutorialNotCleared) {
                state.togglePause();
                this.sound.playEnable();
                this.sound.pauseBGM();
            }
        }
    }

    _isBlocked() {
        const s = this.state;
        const tutorialBlocked = this._isTutorialStopOverlayActive();
        return s.isGrabbing || s.isPlacing || s.isChecking || s.isWaitingResult ||
               s.showResult || s.isSliding || s.isPaused || s.isPlayingClearAnim ||
               s.isCelebrating || tutorialBlocked;
    }

    _isCrankBlocked() {
        const s = this.state;
        if (this._isTutorialStopOverlayActive()) return true;
        if (this._isTutorialCrankBlocked()) return true;
        return s.isPlacing || s.isChecking || s.isWaitingResult || s.showResult ||
               s.isPaused || s.isPlayingClearAnim || s.isCelebrating;
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

    _flipFrame(direction) {
        const s = this.state;
        const count = s.puzzle.getCurrentCount();
        if (count === 0) return;

        // Cancel current slide if still running
        if (s.isSliding) {
            s.isSliding = false;
            s.slideProgress = 1;
        }

        const prevImg = s.puzzle.getFrameAt(s.currentFrameIndex);
        s.currentFrameIndex = (s.currentFrameIndex + direction + count) % count;
        s.accumulatedAngle = 0;
        s.flipCooldown = Config.FLIP_COOLDOWN_FRAMES;

        this._startSlide(direction, prevImg);
        if (direction > 0) {
            this.sound.playFlip();
        } else {
            this.sound.playFlipBack();
        }

        // Tutorial: track frame changes for Step 4
        if (this.tutorial.isTutorialStage && this.tutorial.step === 4) {
            this.tutorial.framesRotatedCount++;
            if (this.tutorial.framesRotatedCount >= Config.TUTORIAL_CRANK_FRAMES_REQUIRED) {
                this._tutorialEnterStep(5);
            }
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

            this._startSlide(1, prevImg);
            this.sound.playFlip();

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
            this.sound.playFlipBack();

            if (s.isQuickStarting) {
                s.accumulatedAngle = 0;
                s.isQuickStarting = false;
                break;
            }
            threshold = s.degreesPerFrame;
        }

        // Tutorial: track frame changes for Step 4
        if (moved && this.tutorial.isTutorialStage && this.tutorial.step === 4) {
            this.tutorial.framesRotatedCount++;
            if (this.tutorial.framesRotatedCount >= Config.TUTORIAL_CRANK_FRAMES_REQUIRED) {
                this._tutorialEnterStep(5);
            }
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

        // Tutorial: Step 8 D-pad pressed → Step 9
        if (this.tutorial.isTutorialStage && this.tutorial.step === 8) {
            this._tutorialEnterStep(9);
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

            // Tutorial Step 9: check if correct after placing
            if (this.tutorial.isTutorialStage && this.tutorial.step === 9) {
                if (s.puzzle.isCorrectOrder()) {
                    this._tutorialEnterStep(10);
                } else {
                    this._tutorialEnterStep(8);
                }
            }

            s.placingFrame = -1;
        }
    }

    _startCheck() {
        const s = this.state;

        s.isChecking = true;
        s.checkAnimFrame = 0;
        s.checkAnimTimer = 0;
        s.resultCorrect = s.puzzle.isCorrectOrder();
        if (!s.resultCorrect) {
            s.ngLevel = s.puzzle.evaluateWrongness();
        }
        s.idleTimer = 0;
        s.showHint = false;

        // Sound: mute BGM, play checking SE
        this.sound.muteBGM();
        this.sound.playChecking();
        console.log(`[Game] Check started. correct=${s.resultCorrect}, ngLevel=${s.ngLevel}`);

        // Tutorial: hide overlay and advance
        if (this.tutorial.isTutorialStage) {
            this.tutorial.overlayVisible = false;
            if (this.tutorial.step === 10) {
                this.tutorial.step = 11; // Tutorial complete
            }
        }
    }

    _updateCheckAnimation() {
        const s = this.state;
        s.checkAnimTimer++;
        if (s.checkAnimTimer >= Config.CHECK_FRAME_INTERVAL) {
            s.checkAnimTimer = 0;
            s.checkAnimFrame++;
            s.showCheckBlackFrame = true;

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

            if (s.resultCorrect) {
                // Calculate clear time
                s.clearTime = performance.now() - s.startTime - s.totalPausedTime;
                // Hi score
                s.isNewHiScore = s.setHiScore(s.stageIndex, s.clearTime);
                // Start celebration + good animation
                this._startCelebration();
                s.goodAnimFrame = 0;
                s.goodAnimTimer = 0;
                s.goodAnimPhase = "forward";
                console.log('[Game] Result: CORRECT → celebration + good anim');
                this.sound.playOK();
            } else {
                s.isNewHiScore = false;
                s.showResult = true;
                s.resultAnimTime = 0;
                // Start NG animation
                s.ngAnimFrame = 0;
                s.ngAnimTimer = 0;
                s.ngAnimPhase = "forward";
                console.log(`[Game] Result: WRONG (ngLevel=${s.ngLevel}) → ng anim`);
                this.sound.playNG(s.ngLevel);
            }
        }
    }

    _startCelebration() {
        const s = this.state;
        s.isCelebrating = true;
        s.celebrationTimer = 0;
        s.celebrationTitleShown = true;
        s.celebrationParticles = [];
        this.sound.playPop();

        // Generate particles
        const minSize = Config.CELEBRATION_PARTICLE_MIN_SIZE;
        const maxSize = Config.CELEBRATION_PARTICLE_MAX_SIZE;
        const vxBase = Config.CELEBRATION_VX_BASE;
        const vxRange = Config.CELEBRATION_VX_RANGE;
        const vyBase = Config.CELEBRATION_VY_BASE;
        const vyRange = Config.CELEBRATION_VY_RANGE;

        // Left cracker
        for (let i = 0; i < Config.CELEBRATION_PARTICLE_COUNT; i++) {
            s.celebrationParticles.push({
                x: Config.CELEBRATION_LEFT_X,
                y: Config.CELEBRATION_CRACKER_Y,
                vx: vxBase + Math.random() * vxRange,
                vy: vyBase - Math.random() * vyRange,
                w: minSize + Math.floor(Math.random() * (maxSize - minSize + 1)),
                h: minSize + Math.floor(Math.random() * (maxSize - minSize + 1)),
            });
        }

        // Right cracker
        for (let i = 0; i < Config.CELEBRATION_PARTICLE_COUNT; i++) {
            s.celebrationParticles.push({
                x: Config.CELEBRATION_RIGHT_X,
                y: Config.CELEBRATION_CRACKER_Y,
                vx: -(vxBase + Math.random() * vxRange),
                vy: vyBase - Math.random() * vyRange,
                w: minSize + Math.floor(Math.random() * (maxSize - minSize + 1)),
                h: minSize + Math.floor(Math.random() * (maxSize - minSize + 1)),
            });
        }
    }

    _updateCelebration() {
        const s = this.state;
        s.celebrationTimer++;

        // Play answer voiceover at delay point
        if (s.celebrationTimer === Config.CELEBRATION_VOICE_DELAY) {
            this.sound.playAnswer(s.stageIndex);
        }

        // Update particle physics
        for (const p of s.celebrationParticles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += Config.CELEBRATION_GRAVITY;
        }

        // End celebration → show result
        const totalDuration = Config.CELEBRATION_VOICE_DELAY + Config.CELEBRATION_TITLE_PHASE;
        if (s.celebrationTimer >= totalDuration) {
            s.isCelebrating = false;
            s.celebrationParticles = [];
            s.showResult = true;
            s.resultAnimTime = 0;
            // Restart good animation for result screen
            s.goodAnimFrame = 0;
            s.goodAnimTimer = 0;
            s.goodAnimPhase = "forward";
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
            s.promptAnimTime = (s.promptAnimTime || 0) + 0.1;

            if (this.input.isCheckJustPressed()) {
                s.showResult = false;
                this.sound.playBackToMenu();
                this.transition.start(
                    () => {
                        s.currentScene = Scene.SELECTION;
                        s.selectedIndex = Math.min(s.lastSelectedStage, Config.STAGES.length - 1);
                        this.sound.playBGM('selection');
                    },
                    null
                );
            } else if (this.input.isPauseJustPressed()) {
                // Replay clear animation
                s.showResult = false;
                s.isPlayingClearAnim = true;
                s.clearAnimFrame = 0;
                s.clearAnimTimer = 0;
                s.clearAnimLoopCount = 0;
                s.celebrationTitleShown = true;
                this.sound.playAnswer(s.stageIndex);
            }
        } else {
            // NG: any input triggers reverse animation (which dismisses on completion)
            if (s.ngAnimPhase === "hold") {
                if (this.input.isAnyJustPressed() || Math.abs(crankDelta) > Config.CRANK_THRESHOLD) {
                    s.ngAnimPhase = "reverse";
                    s.ngAnimTimer = 0;
                    console.log('[Game] NG result dismissed → ng anim reverse');
                }
            } else if (s.ngAnimPhase === "done") {
                // Fallback: dismiss immediately if animation already done
                if (this.input.isAnyJustPressed() || Math.abs(crankDelta) > Config.CRANK_THRESHOLD) {
                    s.showResult = false;
                }
            }
        }
    }

    _updateClearAnimation() {
        const s = this.state;
        s.clearAnimTimer++;
        if (s.clearAnimTimer >= Config.CLEAR_ANIM_FRAME_INTERVAL) {
            s.clearAnimTimer = 0;
            s.clearAnimFrame++;
            s.showCheckBlackFrame = true;

            if (s.clearAnimFrame >= s.frameCount) {
                s.clearAnimFrame = 0;
                s.clearAnimLoopCount++;

                if (s.clearAnimLoopCount >= Config.CLEAR_ANIM_LOOPS) {
                    s.isPlayingClearAnim = false;
                    s.celebrationTitleShown = false;
                    s.showResult = true;
                    s.goodAnimFrame = 0;
                    s.goodAnimTimer = 0;
                    s.goodAnimPhase = "forward";
                    this.sound.playOK(true);
                }
            }
        }

        // Allow early exit
        if (s.clearAnimTimer > 0 || s.clearAnimFrame > 0 || s.clearAnimLoopCount > 0) {
            if (this.input.isCheckJustPressed() || this.input.isPauseJustPressed()) {
                s.isPlayingClearAnim = false;
                s.celebrationTitleShown = false;
            }
        }
    }

    _updateIdleHint(crankDelta) {
        const s = this.state;
        if (Math.abs(crankDelta) > Config.CRANK_THRESHOLD || this.input.isLeftJustPressed() || this.input.isRightJustPressed()) {
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

        // Prompt floating animation
        if (t.overlayVisible) {
            t.promptAnimTime += 0.1;
        }

        // Stop overlay pending (delay before showing)
        if (t.overlayPending) {
            t.overlayDelayTimer++;
            if (t.overlayDelayTimer >= Config.TUTORIAL_OVERLAY_DELAY) {
                t.overlayPending = false;
                t.overlayVisible = true;
                console.log(`[Tutorial] Overlay shown (step=${t.step}, type=${t.overlayType})`);
                this.sound.playNG(null); // Modal appear sound (umyounyo.wav)
                // Good animation: start forward on group start (step 1, 5) or first game hint
                const isGroupStart = (t.step === 1 || t.step === 5);
                if (isGroupStart || t.showingFirstGameHint) {
                    t.goodAnimFrame = 0;
                    t.goodAnimTimer = 0;
                    t.goodAnimPhase = "forward";
                    console.log(`[Tutorial] Good anim → forward (step=${t.step})`);
                }
            }
            return;
        }

        // Tutorial good animation update
        this._updateTutorialGoodAnim();

        // First game hint
        if (t.showingFirstGameHint) {
            if (t.overlayVisible && this.input.isCheckJustPressed()) {
                console.log('[Tutorial] First game hint dismissed');
                t.overlayVisible = false;
                t.showingFirstGameHint = false;
                t.hintJustDismissed = true;
                // Good animation: reverse (exit)
                t.goodAnimTimer = 0;
                t.goodAnimPhase = "reverse";
                console.log('[Tutorial] Good anim → reverse (hint dismissed)');
                this.sound.playSelected();
                this.state.shownFirstGameHint = true;
                this.state.saveSettings();
            }
            return;
        }

        if (!t.isTutorialStage || t.step < 1 || t.step > Config.TUTORIAL_TOTAL_STEPS) return;

        const stepType = Config.TUTORIAL_STEP_TYPE[t.step];

        if (stepType === "stop") {
            // Stop: only Enter (A) dismisses
            if (t.overlayVisible && this.input.isCheckJustPressed()) {
                this._tutorialEnterStep(t.step + 1);
            }
            return;
        }

        // Interactive steps
        if (t.step === 4) {
            // Step 4: crank indicator delay timer
            if (t.crankIndicatorDelayTimer < Config.TUTORIAL_CRANK_INDICATOR_DELAY) {
                t.crankIndicatorDelayTimer++;
            }
            return;
        }

        if (t.step === 8) {
            // Step 8: idle shows overlay, auto-hide after duration
            if (t.overlayVisible) {
                t.step8DisplayTimer++;
                if (t.step8DisplayTimer >= Config.TUTORIAL_INTERACTIVE_DISPLAY_DURATION) {
                    t.overlayVisible = false;
                    t.idleTimer = 0;
                }
            } else {
                if (this._isBlocked()) {
                    t.idleTimer = 0;
                } else if (Math.abs(crankDelta) > Config.CRANK_THRESHOLD || this.input.isLeftJustPressed() || this.input.isRightJustPressed()) {
                    t.idleTimer = 0;
                } else {
                    t.idleTimer++;
                    if (t.idleTimer >= Config.TUTORIAL_IDLE_THRESHOLD) {
                        t.overlayVisible = true;
                        t.step8DisplayTimer = 0;
                    }
                }
            }
            return;
        }

        if (t.step === 9) {
            // Step 9: hide when not grabbing or after duration
            if (!this.state.isGrabbing) {
                t.overlayVisible = false;
            } else {
                t.step9DisplayTimer++;
                if (t.step9DisplayTimer >= Config.TUTORIAL_INTERACTIVE_DISPLAY_DURATION) {
                    t.overlayVisible = false;
                }
            }
            return;
        }

        if (t.step === 10) {
            // Step 10: show only when correct order, auto-hide
            if (!this.state.puzzle.isCorrectOrder()) {
                t.overlayVisible = false;
                t.idleTimer = 0;
            } else if (t.overlayVisible) {
                t.step10DisplayTimer++;
                if (t.step10DisplayTimer >= Config.TUTORIAL_INTERACTIVE_DISPLAY_DURATION) {
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
                    if (t.idleTimer >= Config.TUTORIAL_CORRECT_IDLE_THRESHOLD) {
                        t.overlayVisible = true;
                        t.step10DisplayTimer = 0;
                    }
                }
            }
            return;
        }
    }

    updatePause() {
        const s = this.state;

        // Secret combo tracking
        this._updateSecretCombo();

        if (this.input.isPauseJustPressed()) {
            // Check if secret combo ready
            if (this.secretState.progress >= 8) {
                s.isPaused = false;
                s.totalPausedTime += performance.now() - s.pauseStartTime;
                this._triggerSecretClear();
            } else {
                s.togglePause();
                this.sound.unpauseBGM();
            }
            return;
        }

        if (this.input.isCheckJustPressed() && s.isStageCleared(Config.TUTORIAL_STAGE_INDEX)) {
            s.isPaused = false;
            this.sound.playBackToMenu();
            this.transition.start(
                () => {
                    s.currentScene = Scene.SELECTION;
                    s.selectedIndex = Math.min(s.lastSelectedStage, Config.STAGES.length - 1);
                    this.sound.playBGM('selection');
                },
                null
            );
        }
    }

    _updateSecretCombo() {
        if (!this.state.isPaused) return;

        const SECRET_SEQUENCE = ["up", "up", "down", "down", "left", "right", "left", "right"];
        const ss = this.secretState;
        ss.frameCounter++;

        // Timeout
        if (ss.progress > 0 && (ss.frameCounter - ss.lastInputFrame) > Config.SECRET_COMBO_TIMEOUT) {
            ss.progress = 0;
        }

        let dir = null;
        if (this.input.isUpJustPressed()) dir = "up";
        else if (this.input.isDownJustPressed()) dir = "down";
        else if (this.input.isLeftJustPressed()) dir = "left";
        else if (this.input.isRightJustPressed()) dir = "right";

        if (!dir) return;

        if (dir === SECRET_SEQUENCE[ss.progress]) {
            ss.progress++;
            ss.lastInputFrame = ss.frameCounter;
        } else {
            if (dir === SECRET_SEQUENCE[0]) {
                ss.progress = 1;
                ss.lastInputFrame = ss.frameCounter;
            } else {
                ss.progress = 0;
            }
        }
    }

    _triggerSecretClear() {
        const s = this.state;
        this.secretState.progress = 0;
        console.log('[Game] Secret clear triggered!');

        s.clearTime = performance.now() - s.startTime - s.totalPausedTime;
        s.resultCorrect = true;
        s.idleTimer = 0;
        s.showHint = false;

        s.isNewHiScore = s.setHiScore(s.stageIndex, s.clearTime);
        this._startCelebration();
    }

    // --- Answer Animation Phase Updates ---
    _updateAnswerAnimations() {
        const s = this.state;
        const frameCount = Config.ANSWER_ANIM_FRAME_COUNT;
        const interval = Config.ANSWER_ANIM_FRAME_INTERVAL;

        // Good animation (game result)
        if (s.goodAnimPhase !== "done") {
            s.goodAnimTimer++;
            if (s.goodAnimPhase === "forward") {
                if (s.goodAnimTimer >= interval) {
                    s.goodAnimTimer = 0;
                    if (s.goodAnimFrame < frameCount - 1) {
                        s.goodAnimFrame++;
                    } else {
                        s.goodAnimPhase = "hold";
                        console.log('[AnswerAnim] Good → hold');
                    }
                }
            } else if (s.goodAnimPhase === "hold") {
                if (s.goodAnimTimer >= Config.ANSWER_ANIM_HOLD_DURATION) {
                    s.goodAnimTimer = 0;
                    s.goodAnimPhase = "reverse";
                    console.log('[AnswerAnim] Good → reverse');
                }
            } else if (s.goodAnimPhase === "reverse") {
                if (s.goodAnimTimer >= interval) {
                    s.goodAnimTimer = 0;
                    if (s.goodAnimFrame > 0) {
                        s.goodAnimFrame--;
                    } else {
                        s.goodAnimPhase = "done";
                        console.log('[AnswerAnim] Good → done');
                    }
                }
            }
        }

        // NG animation (game result)
        if (s.ngAnimPhase !== "done") {
            s.ngAnimTimer++;
            if (s.ngAnimPhase === "forward") {
                if (s.ngAnimTimer >= interval) {
                    s.ngAnimTimer = 0;
                    if (s.ngAnimFrame < frameCount - 1) {
                        s.ngAnimFrame++;
                    } else {
                        s.ngAnimPhase = "hold";
                        console.log('[AnswerAnim] NG → hold');
                    }
                }
            } else if (s.ngAnimPhase === "reverse") {
                if (s.ngAnimTimer >= interval) {
                    s.ngAnimTimer = 0;
                    if (s.ngAnimFrame > 0) {
                        s.ngAnimFrame--;
                    } else {
                        s.ngAnimPhase = "done";
                        s.showResult = false;
                        console.log('[AnswerAnim] NG → done, result dismissed');
                    }
                }
            }
        }
    }

    // Tutorial good animation (separate from game good animation)
    _updateTutorialGoodAnim() {
        const t = this.tutorial;
        if (t.goodAnimPhase === "hidden") return;

        const frameCount = Config.ANSWER_ANIM_FRAME_COUNT;
        const interval = Config.ANSWER_ANIM_FRAME_INTERVAL;

        t.goodAnimTimer++;
        if (t.goodAnimPhase === "forward") {
            if (t.goodAnimTimer >= interval) {
                t.goodAnimTimer = 0;
                if (t.goodAnimFrame < frameCount - 1) {
                    t.goodAnimFrame++;
                } else {
                    t.goodAnimPhase = "visible";
                    console.log('[Tutorial] Good anim → visible');
                }
            }
        } else if (t.goodAnimPhase === "reverse") {
            if (t.goodAnimTimer >= interval) {
                t.goodAnimTimer = 0;
                if (t.goodAnimFrame > 0) {
                    t.goodAnimFrame--;
                } else {
                    t.goodAnimPhase = "hidden";
                    console.log('[Tutorial] Good anim → hidden');
                }
            }
        }
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
