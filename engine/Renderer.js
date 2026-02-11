// Renderer.js - Canvas rendering (transpiled from game/renderer.lua)

import { Config } from './Config.js';
import { easeOutQuad, easeOutSine } from './GameState.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = Config.SCREEN_WIDTH;
        canvas.height = Config.SCREEN_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    }

    clear(color = '#fff') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT);
    }

    // --- Dither pattern (Bayer 8x8 approximation via globalAlpha) ---
    fillRectDither(x, y, w, h, alpha) {
        // alpha 0 = full black, 1 = transparent
        this.ctx.fillStyle = '#000';
        this.ctx.globalAlpha = 1 - alpha;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.globalAlpha = 1;
    }

    // --- Title Screen ---
    drawTitleScreen(animTime) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;

        this.clear('#fff');

        // Top black band
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, 150);

        // Bottom dark gray band
        this.fillRectDither(0, 201, W, 39, 0.25);

        // "GURUPARA" white text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('GURUPARA', 40, 80);

        // "Flipbook Puzzle"
        ctx.font = '18px monospace';
        ctx.fillText('Flipbook Puzzle', 61, 115);

        // Floating "PRESS [Enter] TO START"
        const floatOffset = Math.floor(Math.sin(animTime) * 4);
        const pressInfoY = 161 + floatOffset + 9;
        ctx.fillStyle = '#000';
        ctx.font = '16px monospace';
        const text = 'PRESS [Enter] TO START';
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, (W - tw) / 2, pressInfoY + 14);

        // Copyright
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText('GIFT TEN INDUSTRY.K.K', 32, 230);
    }

    // --- Selection Screen ---
    drawSelectionScreen(state, assets) {
        const ctx = this.ctx;
        this.clear('#fff');

        const COLS = Config.SELECTION_GRID_COLS;
        const ROWS = Config.SELECTION_GRID_ROWS;
        const TILE = Config.SELECTION_TILE_SIZE;
        const SPACING = Config.SELECTION_TILE_SPACING;
        const START_X = 7;
        const START_Y = 12;

        // Draw tiles
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const index = row * COLS + col;
                const x = START_X + col * (TILE + SPACING);
                const y = START_Y + row * (TILE + SPACING);

                if (state.isStageCleared(index) && assets.getSelectionSprite(index)) {
                    // Cleared: draw animated thumbnail
                    const frameIdx = state.selectionAnimFrame || 0;
                    assets.drawSelectionFrame(ctx, index, frameIdx % 9, x, y, TILE);
                } else {
                    // Uncleared or unavailable
                    const stageInfo = Config.STAGES.find(s => s.index === index);
                    const available = !!stageInfo;

                    // Gray background
                    this.fillRectDither(x, y, TILE, TILE, 0.5);

                    // Letter
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 18px monospace';
                    let ch;
                    if (index === 0 || index === 27) ch = '?';
                    else if (index <= 26) ch = String.fromCharCode(64 + index);
                    else ch = '?';

                    const tw = ctx.measureText(ch).width;
                    ctx.fillText(ch, x + (TILE - tw) / 2, y + TILE / 2 + 6);
                }
            }
        }

        // Draw cursor bracket
        this._drawCursorBracket(state.selectedIndex, START_X, START_Y, TILE, SPACING, COLS);

        // Pause overlay
        if (state.isPaused) {
            this._drawSelectionPause(state);
        }
    }

    _drawCursorBracket(selectedIndex, startX, startY, tileSize, spacing, cols) {
        const ctx = this.ctx;
        const col = selectedIndex % cols;
        const row = Math.floor(selectedIndex / cols);
        const tileX = startX + col * (tileSize + spacing);
        const tileY = startY + row * (tileSize + spacing);

        const frameSize = Config.SELECTION_FRAME_SIZE;
        const cornerLen = Config.SELECTION_FRAME_CORNER_LENGTH;
        const cornerW = Config.SELECTION_FRAME_CORNER_WIDTH;

        const fx = tileX - (frameSize - tileSize) / 2;
        const fy = tileY - (frameSize - tileSize) / 2;

        ctx.fillStyle = '#000';

        // Top-left
        ctx.fillRect(fx, fy, cornerLen, cornerW);
        ctx.fillRect(fx, fy, cornerW, cornerLen);
        // Top-right
        ctx.fillRect(fx + frameSize - cornerLen, fy, cornerLen, cornerW);
        ctx.fillRect(fx + frameSize - cornerW, fy, cornerW, cornerLen);
        // Bottom-left
        ctx.fillRect(fx, fy + frameSize - cornerW, cornerLen, cornerW);
        ctx.fillRect(fx, fy + frameSize - cornerLen, cornerW, cornerLen);
        // Bottom-right
        ctx.fillRect(fx + frameSize - cornerLen, fy + frameSize - cornerW, cornerLen, cornerW);
        ctx.fillRect(fx + frameSize - cornerW, fy + frameSize - cornerLen, cornerW, cornerLen);
    }

    _drawSelectionPause(state) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;

        // Shadow
        this.fillRectDither(47, 208, 313, 7, 0.5);
        this.fillRectDither(360, 33, 7, 182, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(39, 25, 321, 6);
        ctx.fillRect(39, 202, 321, 6);
        ctx.fillRect(39, 31, 6, 171);
        ctx.fillRect(354, 31, 6, 171);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(45, 31, 309, 171);

        // Progress
        const cleared = Object.keys(state.hiScores).length;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${cleared}/${Config.TOTAL_STAGES}`, 113, 92);

        // Percent
        const pct = ((cleared / Config.TOTAL_STAGES) * 100).toFixed(1);
        ctx.font = '16px monospace';
        ctx.fillText(`${pct}%`, 168, 138);

        // Close hint
        ctx.font = '14px monospace';
        ctx.fillText('[Esc] to Close', 80, 188);
    }

    // --- Main Game Scene ---
    drawGameScene(state, assets) {
        const ctx = this.ctx;
        this.clear('#fff');

        const frames = assets.getMainFrames(state.stageIndex);
        if (!frames || frames.length === 0) return;

        const scale = Config.MAIN_DISPLAY_SCALE;
        const displaySize = Config.IMAGE_SIZE * scale;
        const imgX = (Config.SCREEN_WIDTH - displaySize) / 2;
        const imgY = (Config.SCREEN_HEIGHT - displaySize) / 2;

        // Slide animations (simplified)
        if (state.isSliding) {
            this._drawSlideAnimation(state, frames, imgX, imgY, displaySize);
        } else if (state.isChecking) {
            // Check animation
            const frameIdx = state.checkAnimFrame % state.frameCount;
            if (state.checkAnimFrame % 2 === 1) {
                // Black flash
                ctx.fillStyle = '#000';
                ctx.fillRect(imgX, imgY, displaySize, displaySize);
            } else {
                const img = frames[frameIdx];
                if (img && img.complete) {
                    ctx.drawImage(img, imgX, imgY, displaySize, displaySize);
                }
            }
        } else if (state.isPlayingClearAnim) {
            // Clear animation
            const frameIdx = state.clearAnimFrame % state.frameCount;
            const img = frames[frameIdx];
            if (img && img.complete) {
                ctx.drawImage(img, imgX, imgY, displaySize, displaySize);
            }
        } else {
            // Normal: draw current frame (from puzzle order)
            if (!state.showResult || state.resultCorrect) {
                const imageIndex = state.puzzle.getFrameAt(state.currentFrameIndex);
                if (imageIndex !== undefined && frames[imageIndex] && frames[imageIndex].complete) {
                    ctx.drawImage(frames[imageIndex], imgX, imgY, displaySize, displaySize);
                }
            }
        }

        // Grabbed thumbnail (always on top)
        if (state.isGrabbing && state.grabbedFrame >= 0) {
            this._drawGrabbedThumbnail(state, frames, imgX, imgY, displaySize);
        }

        // Placing animation (always on top)
        if (state.isPlacing && state.placingFrame >= 0) {
            this._drawPlacingThumbnail(state, frames, imgX, imgY, displaySize);
        }

        // Rewind icon
        if (state.lastCrankDelta < -Config.CRANK_THRESHOLD) {
            this._drawRewindIcon();
        }

        // Hint
        if (state.showHint && !state.isGrabbing && !state.isPlacing && !state.isPaused && !state.showResult) {
            this._drawHint(state);
        }

        // Pause overlay
        if (state.isPaused) {
            this._drawPauseScreen(state);
        }

        // Result overlay
        if (state.showResult) {
            if (state.resultCorrect) {
                this._drawResultOK(state);
            } else {
                this._drawResultNG();
            }
        }
    }

    _drawSlideAnimation(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const t = easeOutSine(state.slideProgress);

        if (state.slideDirection > 0) {
            // Slide out (forward) - old page slides left
            const slideX = -W * t;

            // Draw old frame sliding
            ctx.save();
            ctx.beginPath();
            ctx.rect(Math.max(0, slideX), 0, W, H);
            ctx.clip();
            ctx.fillStyle = '#fff';
            ctx.fillRect(slideX, 0, W, H);
            if (state.slidePrevImage !== undefined && frames[state.slidePrevImage] && frames[state.slidePrevImage].complete) {
                ctx.drawImage(frames[state.slidePrevImage], slideX + imgX, imgY, displaySize, displaySize);
            }
            // Edge shadow
            ctx.fillStyle = '#000';
            ctx.fillRect(slideX + W - 3, 0, 3, H);
            ctx.restore();

            // Draw new frame
            const newImgIdx = state.puzzle.getFrameAt(state.currentFrameIndex);
            if (newImgIdx !== undefined && frames[newImgIdx] && frames[newImgIdx].complete) {
                ctx.drawImage(frames[newImgIdx], imgX, imgY, displaySize, displaySize);
            }
        } else {
            // Slide in (backward) - page slides in from left
            const slideX = -W + W * t;

            // Draw current frame behind
            const curImgIdx = state.puzzle.getFrameAt(state.currentFrameIndex);
            if (curImgIdx !== undefined && frames[curImgIdx] && frames[curImgIdx].complete) {
                ctx.drawImage(frames[curImgIdx], imgX, imgY, displaySize, displaySize);
            }

            // Draw old frame sliding in
            ctx.save();
            ctx.beginPath();
            ctx.rect(Math.max(0, slideX), 0, W + slideX > W ? W : slideX + W, H);
            ctx.clip();
            ctx.fillStyle = '#fff';
            ctx.fillRect(slideX, 0, W, H);
            if (state.slidePrevImage !== undefined && frames[state.slidePrevImage] && frames[state.slidePrevImage].complete) {
                ctx.drawImage(frames[state.slidePrevImage], slideX + imgX, imgY, displaySize, displaySize);
            }
            ctx.fillStyle = '#000';
            ctx.fillRect(slideX + W - 3, 0, 3, H);
            ctx.restore();
        }
    }

    _drawGrabbedThumbnail(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const img = frames[state.grabbedFrame];
        if (!img || !img.complete) return;

        const t = easeOutQuad(state.grabAnimProgress);
        const thumbScale = 1.0 + (0.5 - 1.0) * t;
        const cw = W * thumbScale;
        const ch = H * thumbScale;
        // Animate from current position (0,0) to top-left corner (0,0)
        const thumbX = 0;
        const thumbY = 0;

        // White card
        ctx.fillStyle = '#fff';
        ctx.fillRect(thumbX, thumbY, cw, ch);

        // Image on card
        const imageScale = Config.MAIN_DISPLAY_SCALE + (Config.THUMBNAIL_DISPLAY_SCALE - Config.MAIN_DISPLAY_SCALE) * t;
        const ds = Config.IMAGE_SIZE * imageScale;
        const ix = thumbX + (cw - ds) / 2;
        const iy = thumbY + (ch - ds) / 2;
        ctx.drawImage(img, ix, iy, ds, ds);

        // Wavy border (right + bottom edges)
        this._drawWavyBorder(thumbX, thumbY, cw, ch, t, state.wavePhase);
    }

    _drawPlacingThumbnail(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const img = frames[state.placingFrame];
        if (!img || !img.complete) return;

        const t = easeOutQuad(state.placeAnimProgress);
        const thumbX = 0;
        const thumbY = 0;
        const thumbScale = 0.5 + (1.0 - 0.5) * t;
        const cw = W * thumbScale;
        const ch = H * thumbScale;

        ctx.fillStyle = '#fff';
        ctx.fillRect(thumbX, thumbY, cw, ch);

        const imageScale = Config.THUMBNAIL_DISPLAY_SCALE + (Config.MAIN_DISPLAY_SCALE - Config.THUMBNAIL_DISPLAY_SCALE) * t;
        const ds = Config.IMAGE_SIZE * imageScale;
        const ix = thumbX + (cw - ds) / 2;
        const iy = thumbY + (ch - ds) / 2;
        ctx.drawImage(img, ix, iy, ds, ds);

        this._drawWavyBorder(thumbX, thumbY, cw, ch, 1 - t, state.wavePhase);
    }

    _drawWavyBorder(x, y, w, h, opacity, wavePhase) {
        const ctx = this.ctx;
        const border = Config.THUMBNAIL_BORDER;
        const amplitude = Config.THUMBNAIL_WAVE_AMPLITUDE;
        const frequency = Config.THUMBNAIL_WAVE_FREQUENCY;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = border;
        ctx.globalAlpha = opacity;

        // Right edge + Bottom edge as one continuous path
        // Near the corner, dampen amplitude and blend wave direction
        const rightX = x + w;
        const totalLen = h + w;
        const cornerFade = 30; // pixels over which to fade near corner

        const _wavePath = () => {
            // Right edge (top to bottom)
            for (let i = 0; i <= h; i += 2) {
                const pos = i / totalLen;
                const distToCorner = h - i;
                const fade = distToCorner < cornerFade ? distToCorner / cornerFade : 1;
                const wave = Math.sin(pos * frequency * Math.PI * 2 - wavePhase) * amplitude * fade;
                if (i === 0) ctx.moveTo(rightX + wave, y + i);
                else ctx.lineTo(rightX + wave, y + i);
            }
            // Bottom edge (right to left, continuing from right edge)
            for (let i = 0; i <= w; i += 2) {
                const pos = (h + i) / totalLen;
                const fade = i < cornerFade ? i / cornerFade : 1;
                const wave = Math.sin(pos * frequency * Math.PI * 2 - wavePhase) * amplitude * fade;
                ctx.lineTo(x + w - i, y + h + wave);
            }
        };

        ctx.beginPath();
        _wavePath();
        ctx.stroke();

        // White outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = border + Config.THUMBNAIL_BORDER_OUTLINE * 2;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.beginPath();
        _wavePath();
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';

        ctx.globalAlpha = 1;
    }

    _drawRewindIcon() {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;
        const size = 30;
        const bgW = size + 20;
        const bgH = size + 16;
        const bgX = (W - bgW) / 2;
        const bgY = (H - bgH) / 2;

        ctx.fillStyle = '#000';
        this._roundRect(bgX, bgY, bgW, bgH, 12);
        ctx.fill();

        // Two triangles pointing left
        const iconX = bgX + 10;
        const iconY = bgY + 8;
        const triW = size / 2;
        const triH = size;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(iconX + triW * 2, iconY);
        ctx.lineTo(iconX + triW * 2, iconY + triH);
        ctx.lineTo(iconX + triW, iconY + triH / 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(iconX + triW, iconY);
        ctx.lineTo(iconX + triW, iconY + triH);
        ctx.lineTo(iconX, iconY + triH / 2);
        ctx.closePath();
        ctx.fill();
    }

    _drawHint(state) {
        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.44;
        ctx.font = '12px monospace';

        if (!state.isGrabbing && state.puzzle.getCurrentCount() === state.frameCount) {
            // Grab hint
            ctx.fillText('[Space] Grab  [Enter] Check', 70, 230);
        }

        ctx.globalAlpha = 1;
    }

    _drawResultOK(state) {
        const ctx = this.ctx;

        // Shadow
        this.fillRectDither(47, 219, 313, 8, 0.5);
        this.fillRectDither(360, 18, 7, 209, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(39, 12, 321, 6);
        ctx.fillRect(39, 214, 321, 6);
        ctx.fillRect(39, 18, 6, 196);
        ctx.fillRect(354, 18, 6, 196);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(45, 18, 309, 196);

        // "CLEAR!"
        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('CLEAR!', 91, 52);

        // Time
        ctx.font = '18px monospace';
        const timeText = `Time:${state.formatTime(state.clearTime)}`;
        ctx.fillText(timeText, 119, 105);

        // Best Time
        if (state.isNewHiScore) {
            ctx.fillStyle = '#000';
            ctx.fillRect(113, 115, 174, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.fillText('Best Time!', 130, 130);
        }

        // Navigation hints
        ctx.fillStyle = '#000';
        ctx.font = '14px monospace';
        ctx.fillText('[Enter] Stage Select', 80, 165);
        ctx.fillText('[Esc] Replay', 80, 190);
    }

    _drawResultNG() {
        const ctx = this.ctx;

        // Shadow
        this.fillRectDither(56, 71, 300, 100, 0.5);

        // Black bg
        ctx.fillStyle = '#000';
        ctx.fillRect(44, 58, 300, 100);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('Something seems', 74, 96);
        ctx.fillText('to be wrong...', 74, 124);
    }

    _drawPauseScreen(state) {
        const ctx = this.ctx;

        // Shadow
        this.fillRectDither(47, 208, 313, 7, 0.5);
        this.fillRectDither(360, 33, 7, 182, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(39, 25, 321, 6);
        ctx.fillRect(39, 202, 321, 6);
        ctx.fillRect(39, 31, 6, 171);
        ctx.fillRect(354, 31, 6, 171);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(45, 51, 309, 138);

        // Time
        ctx.fillStyle = '#000';
        ctx.font = '16px monospace';
        const timeText = `Time:${state.formatTime(state.getElapsedTime())}`;
        const tw = ctx.measureText(timeText).width;
        ctx.fillText(timeText, (Config.SCREEN_WIDTH - tw) / 2, 75);

        // Best time
        const best = state.getHiScore(state.stageIndex);
        if (best !== null) {
            const bestText = `Best:${state.formatTime(best)}`;
            const bw = ctx.measureText(bestText).width;
            ctx.fillText(bestText, (Config.SCREEN_WIDTH - bw) / 2, 105);
        }

        // Hints
        ctx.font = '14px monospace';
        ctx.fillText('[Esc] Resume', 80, 148);
        if (state.isStageCleared(Config.TUTORIAL_STAGE_INDEX)) {
            ctx.fillText('[Enter] Stage Select', 80, 172);
        }
    }

    _roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // --- Tutorial Overlay ---
    drawTutorialOverlay(tutorial) {
        if (!tutorial.overlayVisible || tutorial.step === 0 || tutorial.step >= 5) return;

        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;
        const ow = Config.TUTORIAL_OVERLAY_WIDTH;
        const oh = Config.TUTORIAL_OVERLAY_HEIGHT;
        const border = Config.TUTORIAL_OVERLAY_BORDER;
        const shadow = Config.TUTORIAL_OVERLAY_SHADOW_OFFSET;

        const ox = (W - ow) / 2;
        const oy = (H - oh) / 2;

        // Shadow
        this.fillRectDither(ox + shadow, oy + shadow, ow, oh, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(ox, oy, ow, border);
        ctx.fillRect(ox, oy + oh - border, ow, border);
        ctx.fillRect(ox, oy + border, border, oh - border * 2);
        ctx.fillRect(ox + ow - border, oy + border, border, oh - border * 2);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + border, oy + border, ow - border * 2, oh - border * 2);

        // Step text
        ctx.fillStyle = '#000';
        ctx.font = '16px monospace';
        ctx.fillText(`Step ${tutorial.step}/4`, ox + border + 12, oy + border + 20);

        const instrX = ox + border + 12;
        const instrY = oy + border + 48;
        ctx.font = '14px monospace';

        switch (tutorial.step) {
            case 1:
                ctx.fillText('Use Left/Right arrows', instrX, instrY);
                ctx.fillText('to browse frames', instrX, instrY + 20);
                break;
            case 2:
                ctx.fillText('Hold [Space] to grab', instrX, instrY);
                ctx.fillText('a frame', instrX, instrY + 20);
                break;
            case 3:
                ctx.fillText('Arrange frames in', instrX, instrY);
                ctx.fillText('the correct order!', instrX, instrY + 20);
                break;
            case 4:
                ctx.fillText('Press [Enter]', instrX, instrY);
                ctx.fillText('to check!', instrX, instrY + 20);
                break;
        }
    }

    // --- Transition ---
    drawTransition(transition) {
        if (transition && transition.active) {
            transition.draw(this.ctx);
        }
    }

    // --- Thank You Screen (Stage 3 intercept) ---
    drawThankYouScreen() {
        const ctx = this.ctx;
        this.clear('#000');

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Thank You', 110, 80);
        ctx.fillText('for Playing!', 95, 115);

        ctx.font = '14px monospace';
        ctx.fillText('Full game available on', 75, 160);
        ctx.fillText('Playdate Catalog', 100, 185);

        ctx.font = '12px monospace';
        ctx.fillText('[Enter] Back to Menu', 100, 220);
    }
}
