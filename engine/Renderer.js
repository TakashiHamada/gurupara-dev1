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

    // --- Title Screen (production style with animation + scrolling dot background) ---
    drawTitleScreen(titleState, titleImages) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        this.clear('#fff');

        // Scrolling dot pattern background (with intro animation)
        const spacing = Config.TITLE_BG_DOT_SPACING;
        const maxRadius = Config.TITLE_BG_DOT_RADIUS;
        const introProgress = Math.min(titleState.bgIntroFrame / Config.TITLE_BG_DOT_INTRO_FRAMES, 1);
        const radius = Math.round(maxRadius * introProgress);

        if (radius > 0) {
            ctx.fillStyle = '#000';
            ctx.globalAlpha = 0.25; // Approximate Bayer 0.75 dither
            const startX = Math.floor(titleState.bgScrollX / 2) * 2 - spacing;
            const startY = Math.floor(titleState.bgScrollY / 2) * 2 - spacing;
            for (let x = startX; x <= W + spacing; x += spacing) {
                for (let y = startY; y <= H + spacing; y += spacing) {
                    ctx.beginPath();
                    ctx.arc(x + spacing / 2, y + spacing / 2, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
        }

        // Title animation frame (400x240 with transparency)
        if (titleImages && titleImages.length > 0) {
            const img = titleImages[titleState.animFrame];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, 0, 0);
            }
        }

        // Menu item text (demo: START GAME only)
        const menuText = 'START GAME';
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px monospace';
        const menuWidth = ctx.measureText(menuText).width;
        const menuX = (W - menuWidth) / 2;
        const menuY = Config.TITLE_MENU_Y;
        const menuHeight = 20;
        ctx.fillText(menuText, menuX, menuY);

        // Arrows pointing inward toward START GAME
        const triSize = Config.TITLE_MENU_ARROW_SIZE;
        const triGap = Config.TITLE_MENU_ARROW_GAP;
        const triCenterY = menuY + menuHeight / 2;
        const scale = Math.abs(Math.cos(titleState.arrowAnimTime * Config.TITLE_MENU_ARROW_SPEED));
        const scaledHeight = triSize * scale;

        // Left arrow (pointing right → toward text)
        const lx = menuX - triGap - triSize;
        if (scaledHeight > 1) {
            ctx.beginPath();
            ctx.moveTo(lx, triCenterY - scaledHeight);
            ctx.lineTo(lx + triSize, triCenterY);
            ctx.lineTo(lx, triCenterY + scaledHeight);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(lx, triCenterY - 0.5, triSize, 1);
        }

        // Right arrow (pointing left ← toward text)
        const rx = menuX + menuWidth + triGap;
        if (scaledHeight > 1) {
            ctx.beginPath();
            ctx.moveTo(rx + triSize, triCenterY - scaledHeight);
            ctx.lineTo(rx, triCenterY);
            ctx.lineTo(rx + triSize, triCenterY + scaledHeight);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(rx, triCenterY - 0.5, triSize, 1);
        }

        // "PRESS [Enter] TO SELECT" floating text
        ctx.textBaseline = 'top';
        const floatOffset = Math.floor(Math.sin(titleState.animTime) * Config.TITLE_PRESS_INFO_AMPLITUDE);
        const pressY = Config.TITLE_PRESS_INFO_Y + floatOffset;
        ctx.font = '11px monospace';
        const pressText = 'PRESS [Enter] TO SELECT';
        const pressWidth = ctx.measureText(pressText).width;
        ctx.fillText(pressText, (W - pressWidth) / 2, pressY);

        ctx.restore();
    }

    // --- Selection Screen ---
    drawSelectionScreen(state, assets) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;
        this.clear('#fff');

        // Scrolling dot pattern background
        const dotSpacing = Config.TITLE_BG_DOT_SPACING;
        const dotRadius = Config.TITLE_BG_DOT_RADIUS;
        const speed = Config.TITLE_BG_SCROLL_SPEED;
        const scrollX = (state.frameCounter * speed) % dotSpacing;
        const scrollY = (-state.frameCounter * speed) % dotSpacing;

        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.25;
        for (let x = scrollX - dotSpacing; x <= W + dotSpacing; x += dotSpacing) {
            for (let y = scrollY - dotSpacing; y <= H + dotSpacing; y += dotSpacing) {
                ctx.beginPath();
                ctx.arc(x + dotSpacing / 2, y + dotSpacing / 2, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        const TILE = Config.SELECTION_TILE_SIZE;
        const SPACING = Config.SELECTION_TILE_SPACING;
        const BORDER = Config.SELECTION_TILE_BORDER;

        // Draw tiles (demo: centered horizontally)
        const stageCount = Config.STAGES.length;
        const totalW = stageCount * TILE + (stageCount - 1) * SPACING;
        const START_X = Math.floor((W - totalW) / 2);
        const START_Y = Math.floor((H - TILE) / 2);

        for (let i = 0; i < stageCount; i++) {
            const index = i;
            const x = START_X + i * (TILE + SPACING);
            const y = START_Y;

            const mainFrames = assets.getMainFrames(index);
            if (state.isStageCleared(index) && mainFrames.length > 0) {
                // Cleared: border + animated using main game frames
                ctx.fillStyle = '#000';
                ctx.fillRect(x - BORDER, y - BORDER, TILE + BORDER * 2, TILE + BORDER * 2);
                const frameIdx = (state.selectionAnimFrame || 0) % mainFrames.length;
                const img = mainFrames[frameIdx];
                if (img && img.complete) {
                    ctx.drawImage(img, x, y, TILE, TILE);
                }
            } else {
                // Uncleared: solid gray tile with "?" mark
                ctx.fillStyle = '#888';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.floor(TILE * 0.7)}px monospace`;
                const ch = '?';
                const tw = ctx.measureText(ch).width;
                ctx.fillText(ch, x + (TILE - tw) / 2, y + TILE * 0.72);
            }
        }

        // Draw cursor bracket (animated color cycle)
        const cursorCycle = Math.floor(state.frameCounter / 4) % 4;
        const cursorColors = ['#000', '#555', '#999', '#555'];
        this._drawCursorBracket(state.selectedIndex, START_X, START_Y, TILE, SPACING, stageCount, cursorColors[cursorCycle]);

        // Pause overlay
        if (state.isPaused) {
            this._drawSelectionPause(state);
        }
    }

    _drawCursorBracket(selectedIndex, startX, startY, tileSize, spacing, cols, color) {
        const ctx = this.ctx;
        const col = selectedIndex % cols;
        const row = Math.floor(selectedIndex / cols);
        const tileX = startX + col * (tileSize + spacing);
        const tileY = startY + row * (tileSize + spacing);

        const frameSize = Config.SELECTION_CURSOR_SIZE;
        const cornerLen = Config.SELECTION_CURSOR_CORNER_LENGTH;
        const cornerW = Config.SELECTION_CURSOR_CORNER_WIDTH;

        const fx = tileX - (frameSize - tileSize) / 2;
        const fy = tileY - (frameSize - tileSize) / 2;

        ctx.fillStyle = color || '#000';

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

        const boxX = Config.PAUSE_BOX_X;
        const boxY = Config.PAUSE_BOX_Y;
        const boxW = Config.PAUSE_BOX_W;
        const boxH = Config.PAUSE_BOX_H;
        const border = Config.PAUSE_BOX_BORDER;
        const shadow = Config.PAUSE_BOX_SHADOW;

        // Shadow
        this.fillRectDither(boxX + shadow + 1, boxY + boxH, boxW - shadow, shadow, 0.5);
        this.fillRectDither(boxX + boxW, boxY + shadow + 1, shadow, boxH - shadow, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(boxX, boxY, boxW, border);
        ctx.fillRect(boxX, boxY + boxH - border, boxW, border);
        ctx.fillRect(boxX, boxY + border, border, boxH - border * 2);
        ctx.fillRect(boxX + boxW - border, boxY + border, border, boxH - border * 2);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(boxX + border, boxY + border, boxW - border * 2, boxH - border * 2);

        // Progress
        const cleared = Object.keys(state.hiScores).length;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px monospace';
        const progText = `${cleared}/${Config.STAGES.length}`;
        const progW = ctx.measureText(progText).width;
        ctx.fillText(progText, (W - progW) / 2, 92);

        // Percent
        const pct = ((cleared / Config.STAGES.length) * 100).toFixed(1);
        ctx.font = '16px monospace';
        const pctText = `${pct}%`;
        const pctW = ctx.measureText(pctText).width;
        ctx.fillText(pctText, (W - pctW) / 2, 138);

        // Close hint
        ctx.font = '14px monospace';
        const hintText = '[Esc] to Close';
        const hintW = ctx.measureText(hintText).width;
        ctx.fillText(hintText, (W - hintW) / 2, 188);
    }

    // --- Main Game Scene ---
    drawGameScene(state, assets, tutorial) {
        const ctx = this.ctx;
        this.clear('#fff');

        const frames = assets.getMainFrames(state.stageIndex);
        if (!frames || frames.length === 0) return;

        const scale = Config.MAIN_DISPLAY_SCALE;
        const displaySize = Config.IMAGE_SIZE * scale;
        const imgX = (Config.SCREEN_WIDTH - displaySize) / 2;
        const imgY = (Config.SCREEN_HEIGHT - displaySize) / 2;

        // Slide animations
        if (state.isSliding) {
            this._drawSlideAnimation(state, frames, imgX, imgY, displaySize);
        } else if (state.isChecking) {
            // Check animation
            const frameIdx = state.checkAnimFrame % state.frameCount;
            const img = frames[frameIdx];
            if (img && img.complete) {
                ctx.drawImage(img, imgX, imgY, displaySize, displaySize);
            }
            if (state.checkAnimFrame % 2 === 1) {
                ctx.globalAlpha = Config.CHECK_FLASH_ALPHA;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT);
                ctx.globalAlpha = 1;
            }
        } else if (state.isPlayingClearAnim) {
            const frameIdx = state.clearAnimFrame % state.frameCount;
            const img = frames[frameIdx];
            if (img && img.complete) {
                ctx.drawImage(img, imgX, imgY, displaySize, displaySize);
            }
        } else if (state.isCelebrating) {
            // During celebration, show the current (correct) frame
            const imageIndex = state.puzzle.getFrameAt(state.currentFrameIndex);
            if (imageIndex !== undefined && frames[imageIndex] && frames[imageIndex].complete) {
                ctx.drawImage(frames[imageIndex], imgX, imgY, displaySize, displaySize);
            }
        } else {
            // Normal: draw current frame
            if (!state.showResult || state.resultCorrect) {
                const imageIndex = state.puzzle.getFrameAt(state.currentFrameIndex);
                if (imageIndex !== undefined && frames[imageIndex] && frames[imageIndex].complete) {
                    ctx.drawImage(frames[imageIndex], imgX, imgY, displaySize, displaySize);
                }
            }
        }

        // Grabbed thumbnail
        if (state.isGrabbing && state.grabbedFrame >= 0) {
            this._drawGrabbedThumbnail(state, frames, imgX, imgY, displaySize);
        }

        // Placing animation
        if (state.isPlacing && state.placingFrame >= 0) {
            this._drawPlacingThumbnail(state, frames, imgX, imgY, displaySize);
        }

        // Rewind icon (top-left, production style)
        if (state.lastCrankDelta < -Config.CRANK_THRESHOLD && !state.isGrabbing && !state.isPlacing &&
            !state.isChecking && !state.showResult && !state.isPaused && !state.isCelebrating) {
            this._drawRewindIcon();
        }

        // Hint (left: grab/check, right: flip keys)
        if (state.showHint && !state.isGrabbing && !state.isPlacing && !state.isPaused &&
            !state.showResult && !state.isCelebrating) {
            const tutorialGrabLocked = tutorial && tutorial.isTutorialStage && tutorial.step < Config.TUTORIAL_DPAD_UNLOCK_STEP;
            if (!tutorialGrabLocked) {
                this._drawHint(state);
            }
            this._drawCrankIndicator();
        }

        // Celebration overlay
        if (state.isCelebrating) {
            this._drawCelebration(state);
        }

        // Animation name during clear replay
        if (state.isPlayingClearAnim && state.celebrationTitleShown && state.currentAnimationName) {
            const name = state.currentAnimationName;
            ctx.font = 'bold 24px monospace';
            const textW = ctx.measureText(name).width;
            const padX = Config.CELEBRATION_TITLE_PAD_X;
            const padY = Config.CELEBRATION_TITLE_PAD_Y;
            const bgW = textW + padX * 2;
            const bgH = 30 + padY * 2;
            const bgX = (Config.SCREEN_WIDTH - bgW) / 2;
            const bgY = Config.SCREEN_HEIGHT - bgH + Config.PAUSE_LABEL_OFFSET_Y;
            ctx.fillStyle = '#000';
            ctx.fillRect(bgX, bgY, bgW, bgH);
            ctx.fillStyle = '#fff';
            ctx.fillText(name, bgX + padX, bgY + padY + 22);
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
                this._drawResultNG(state);
            }
        }

        // Answer animation (character reaction) - game result
        if (state.goodAnimPhase !== "done") {
            this._drawAnswerAnim(assets.answerAnimImages.good, state.goodAnimFrame,
                Config.GOOD_ANIM_X, Config.GOOD_ANIM_Y);
        }
        if (state.ngAnimPhase !== "done") {
            const ngKey = state.ngLevel === "close" ? "near" : state.ngLevel === "far" ? "sobad" : "bad";
            const ngImgs = assets.answerAnimImages[ngKey];
            const ngX = (Config.SCREEN_WIDTH - 120) / 2;
            const ngY = Config.SCREEN_HEIGHT - 120;
            this._drawAnswerAnim(ngImgs, state.ngAnimFrame, ngX, ngY);
        }

        // Tutorial overlay
        if (tutorial) {
            this._drawTutorialOverlay(tutorial, state);
            // Tutorial good animation (during stop overlays)
            if (tutorial.goodAnimPhase && tutorial.goodAnimPhase !== "hidden") {
                this._drawAnswerAnim(assets.answerAnimImages.good, tutorial.goodAnimFrame,
                    Config.GOOD_ANIM_X, Config.TUTORIAL_GOOD_ANIM_Y);
            }
        }
    }

    _drawSlideAnimation(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const t = state.slideDirection > 0 ? easeOutSine(state.slideProgress) : easeOutQuad(state.slideProgress);

        if (state.slideDirection > 0) {
            // Slide out (forward) - old page slides left
            const slideX = -W * t;
            const slideRight = slideX + W;

            // Position ratio (0 at right edge, 1 at left)
            const positionRatio = 1 - slideRight / W;
            const edgeWidth = Config.SLIDE_EDGE_MIN + (Config.SLIDE_EDGE_MAX - Config.SLIDE_EDGE_MIN) * positionRatio;
            const shadowWidth = Config.SLIDE_SHADOW_MIN + (Config.SLIDE_SHADOW_MAX - Config.SLIDE_SHADOW_MIN) * positionRatio;
            const shadowAlpha = Config.SLIDE_OUT_SHADOW_ALPHA + (1.0 - Config.SLIDE_OUT_SHADOW_ALPHA) * positionRatio;
            const scaleY = Config.SLIDE_SCALE_Y_MIN + (Config.SLIDE_SCALE_Y_MAX - Config.SLIDE_SCALE_Y_MIN) * positionRatio;
            const currentHeight = H * scaleY;
            const slideY = H / 2 - currentHeight / 2;

            // Draw new frame behind
            const newImgIdx = state.puzzle.getFrameAt(state.currentFrameIndex);
            if (newImgIdx !== undefined && frames[newImgIdx] && frames[newImgIdx].complete) {
                ctx.drawImage(frames[newImgIdx], imgX, imgY, displaySize, displaySize);
            }

            // Shadow
            if (slideRight < W && shadowWidth > 0) {
                this.fillRectDither(slideRight, slideY, shadowWidth, currentHeight, shadowAlpha);
            }

            // Old frame sliding with clip
            const clipLeft = Math.max(0, slideX);
            const clipWidth = slideRight - clipLeft;
            if (clipWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(clipLeft, 0, clipWidth, H);
                ctx.clip();

                ctx.fillStyle = '#fff';
                ctx.fillRect(slideX, slideY, W, currentHeight);

                // Edge with curve
                ctx.fillStyle = '#000';
                const segments = 24;
                const segmentHeight = currentHeight / segments;
                const edgeCenterY = slideY + currentHeight / 2;

                for (let j = 0; j < segments; j++) {
                    const segY = slideY + j * segmentHeight;
                    const segCenterY = segY + segmentHeight / 2;
                    const normalizedDist = Math.abs(segCenterY - edgeCenterY) / (currentHeight / 2);
                    const curveOffset = Config.SLIDE_EDGE_CURVE * normalizedDist * normalizedDist;
                    const segEdgeWidth = edgeWidth + curveOffset;
                    ctx.fillRect(slideX + W - segEdgeWidth, segY, segEdgeWidth, segmentHeight + 1);
                }

                // Image on sliding page
                if (state.slidePrevImage !== undefined && frames[state.slidePrevImage] && frames[state.slidePrevImage].complete) {
                    const imgScaledH = displaySize * scaleY;
                    const imgDrawY = slideY + (currentHeight - imgScaledH) / 2;
                    ctx.drawImage(frames[state.slidePrevImage], slideX + imgX, imgDrawY, displaySize, imgScaledH);
                }

                ctx.restore();
            }
        } else {
            // Slide in (backward)
            const slideX = -W + W * t;
            const slideRight = slideX + W;

            const positionRatio = 1 - slideRight / W;
            const edgeWidth = Config.SLIDE_EDGE_MIN + (Config.SLIDE_EDGE_MAX - Config.SLIDE_EDGE_MIN) * positionRatio;
            const shadowAlpha = Config.SLIDE_IN_SHADOW_ALPHA_END + (Config.SLIDE_IN_SHADOW_ALPHA_START - Config.SLIDE_IN_SHADOW_ALPHA_END) * positionRatio;
            const scaleY = Config.SLIDE_SCALE_Y_MIN + (Config.SLIDE_SCALE_Y_MAX - Config.SLIDE_SCALE_Y_MIN) * positionRatio;
            const currentHeight = H * scaleY;
            const slideY = H / 2 - currentHeight / 2;

            // Draw previous frame behind (the page that was showing before)
            if (state.slidePrevImage !== undefined && frames[state.slidePrevImage] && frames[state.slidePrevImage].complete) {
                ctx.drawImage(frames[state.slidePrevImage], imgX, imgY, displaySize, displaySize);
            }

            // Shadow
            if (slideRight < W) {
                const sw = W - slideRight;
                this.fillRectDither(slideRight, slideY, sw, currentHeight, shadowAlpha);
            }

            // New frame sliding in (the page we're going back to)
            const clipLeft = Math.max(0, slideX);
            const clipWidth = slideRight - clipLeft;
            if (clipWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(clipLeft, 0, clipWidth, H);
                ctx.clip();

                ctx.fillStyle = '#fff';
                ctx.fillRect(slideX, slideY, W, currentHeight);

                // Edge with curve
                ctx.fillStyle = '#000';
                const segments = 24;
                const segmentHeight = currentHeight / segments;
                const edgeCenterY = slideY + currentHeight / 2;

                for (let j = 0; j < segments; j++) {
                    const segY = slideY + j * segmentHeight;
                    const segCenterY = segY + segmentHeight / 2;
                    const normalizedDist = Math.abs(segCenterY - edgeCenterY) / (currentHeight / 2);
                    const curveOffset = Config.SLIDE_EDGE_CURVE * normalizedDist * normalizedDist;
                    const segEdgeWidth = edgeWidth + curveOffset;
                    ctx.fillRect(slideX + W - segEdgeWidth, segY, segEdgeWidth, segmentHeight + 1);
                }

                const curImgIdx = state.puzzle.getFrameAt(state.currentFrameIndex);
                if (curImgIdx !== undefined && frames[curImgIdx] && frames[curImgIdx].complete) {
                    const imgScaledH = displaySize * scaleY;
                    const imgDrawY = slideY + (currentHeight - imgScaledH) / 2;
                    ctx.drawImage(frames[curImgIdx], slideX + imgX, imgDrawY, displaySize, imgScaledH);
                }

                ctx.restore();
            }
        }
    }

    _drawGrabbedThumbnail(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const img = frames[state.grabbedFrame];
        if (!img || !img.complete) return;

        const THUMBNAIL_SCALE = Config.THUMBNAIL_SCALE;

        const t = easeOutQuad(state.grabAnimProgress);
        const currentX = Config.THUMBNAIL_X * t;
        const currentY = Config.THUMBNAIL_Y * t;
        const currentScale = 1.0 + (THUMBNAIL_SCALE - 1.0) * t;
        const cw = W * currentScale;
        const ch = H * currentScale;

        // White card
        ctx.fillStyle = '#fff';
        ctx.fillRect(currentX, currentY, cw, ch);

        // Image on card
        const imageScale = Config.MAIN_DISPLAY_SCALE + (Config.THUMBNAIL_DISPLAY_SCALE - Config.MAIN_DISPLAY_SCALE) * t;
        const ds = Config.IMAGE_SIZE * imageScale;
        const ix = currentX + (cw - ds) / 2;
        const iy = currentY + (ch - ds) / 2;
        ctx.drawImage(img, ix, iy, ds, ds);

        // Border
        const border = Config.THUMBNAIL_BORDER;
        const borderOffset = Config.THUMBNAIL_BORDER_OFFSET;
        const startScale = Config.THUMBNAIL_BORDER_SCALE_START;
        const borderScale = startScale - (startScale - 1.0) * t;

        const rightEdgeX = currentX + cw - border + borderOffset * currentScale;
        const bottomEdgeY = currentY + ch - border + borderOffset * currentScale;

        // White outline
        this._drawWavyBorder(
            rightEdgeX, currentY, border, ch + borderOffset * currentScale,
            currentX, bottomEdgeY, cw + borderOffset * currentScale, border,
            currentScale, 1.0, borderScale, '#fff', Config.THUMBNAIL_BORDER_OUTLINE * borderScale,
            state.wavePhase
        );
        // Black border
        this._drawWavyBorder(
            rightEdgeX, currentY, border, ch + borderOffset * currentScale,
            currentX, bottomEdgeY, cw + borderOffset * currentScale, border,
            currentScale, t, borderScale, '#000', 0,
            state.wavePhase
        );
    }

    _drawPlacingThumbnail(state, frames, imgX, imgY, displaySize) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const img = frames[state.placingFrame];
        if (!img || !img.complete) return;

        const THUMBNAIL_SCALE = Config.THUMBNAIL_SCALE;

        const t = easeOutQuad(state.placeAnimProgress);
        const currentX = Config.THUMBNAIL_X + (0 - Config.THUMBNAIL_X) * t;
        const currentY = Config.THUMBNAIL_Y + (0 - Config.THUMBNAIL_Y) * t;
        const currentScale = THUMBNAIL_SCALE + (1.0 - THUMBNAIL_SCALE) * t;
        const cw = W * currentScale;
        const ch = H * currentScale;

        ctx.fillStyle = '#fff';
        ctx.fillRect(currentX, currentY, cw, ch);

        const imageScale = Config.THUMBNAIL_DISPLAY_SCALE + (Config.MAIN_DISPLAY_SCALE - Config.THUMBNAIL_DISPLAY_SCALE) * t;
        const ds = Config.IMAGE_SIZE * imageScale;
        const ix = currentX + (cw - ds) / 2;
        const iy = currentY + (ch - ds) / 2;
        ctx.drawImage(img, ix, iy, ds, ds);

        const border = Config.THUMBNAIL_BORDER;
        const borderOffset = Config.THUMBNAIL_BORDER_OFFSET;
        const startScale = Config.THUMBNAIL_BORDER_SCALE_START;
        const borderScale = 1.0 + (startScale - 1.0) * t;

        const rightEdgeX = currentX + cw - border + borderOffset * currentScale;
        const bottomEdgeY = currentY + ch - border + borderOffset * currentScale;

        // White outline
        this._drawWavyBorder(
            rightEdgeX, currentY, border, ch + borderOffset * currentScale,
            currentX, bottomEdgeY, cw + borderOffset * currentScale, border,
            currentScale, 1.0, borderScale, '#fff', Config.THUMBNAIL_BORDER_OUTLINE * borderScale,
            state.wavePhase
        );
        // Black border (fading out)
        this._drawWavyBorder(
            rightEdgeX, currentY, border, ch + borderOffset * currentScale,
            currentX, bottomEdgeY, cw + borderOffset * currentScale, border,
            currentScale, 1.0 - t, borderScale, '#000', 0,
            state.wavePhase
        );
    }

    _drawWavyBorder(rightX, rightY, rightWidth, rightHeight,
                     bottomX, bottomY, bottomWidth, bottomHeight,
                     scale, opacity, borderScale, color, positionOffset, wavePhase) {
        const ctx = this.ctx;
        borderScale = borderScale || 1.0;
        positionOffset = positionOffset || 0;
        const amplitude = Config.THUMBNAIL_WAVE_AMPLITUDE * scale;
        const frequency = Config.THUMBNAIL_WAVE_FREQUENCY;
        const cornerRadius = Config.THUMBNAIL_CORNER_RADIUS * scale;
        const step = 2;

        // Apply border scale
        const origRightWidth = rightWidth;
        const origBottomHeight = bottomHeight;
        rightWidth = rightWidth * borderScale;
        bottomHeight = bottomHeight * borderScale;

        // Center-based scaling
        rightX = rightX - (rightWidth - origRightWidth) / 2 + positionOffset;
        bottomY = bottomY - (bottomHeight - origBottomHeight) / 2 + positionOffset;

        // Total lengths
        const rightEdgeLength = rightHeight - cornerRadius;
        const bottomEdgeLength = bottomWidth - cornerRadius;
        const totalLength = rightEdgeLength + cornerRadius * Math.PI / 2 + bottomEdgeLength;
        const arcLength = cornerRadius * Math.PI / 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;

        // Right edge
        for (let i = 0; i < rightEdgeLength; i += step) {
            const pos = i / totalLength;
            const waveOffset = Math.sin(pos * frequency * Math.PI * 2 - wavePhase) * amplitude;
            const rectH = Math.min(step, rightEdgeLength - i);
            ctx.fillRect(rightX + waveOffset, rightY + i, rightWidth, rectH);
        }

        // Corner arc
        const arcCenterX = rightX - cornerRadius + rightWidth / 2;
        const arcCenterY = rightY + rightHeight - cornerRadius - rightWidth / 2;
        const arcSteps = Math.max(8, Math.floor(arcLength / step));

        for (let i = 0; i <= arcSteps; i++) {
            const arcProgress = i / arcSteps;
            const angle = arcProgress * Math.PI / 2;
            const pos = (rightEdgeLength + arcProgress * arcLength) / totalLength;
            const waveOffset = Math.sin(pos * frequency * Math.PI * 2 + wavePhase) * amplitude;
            const radius = cornerRadius + waveOffset;
            const x = arcCenterX + Math.sin(angle) * radius;
            const y = arcCenterY + Math.cos(angle) * radius;
            const d = rightWidth;
            this._roundRect(x - d / 2, y - d / 2, d, d, d / 2);
            ctx.fill();
        }

        // Bottom edge
        for (let i = 0; i < bottomEdgeLength; i += step) {
            const pos = (rightEdgeLength + arcLength + i) / totalLength;
            const waveOffset = Math.sin(pos * frequency * Math.PI * 2 - wavePhase) * amplitude;
            const rectW = Math.min(step, bottomEdgeLength - i);
            ctx.fillRect(bottomX + bottomWidth - cornerRadius - i - rectW, bottomY + waveOffset, rectW, bottomHeight);
        }

        ctx.globalAlpha = 1;
    }

    _drawRewindIcon() {
        const ctx = this.ctx;
        const iconSize = Config.REWIND_ICON_SIZE;
        const padTop = Config.REWIND_ICON_PADDING_TOP;
        const padBottom = Config.REWIND_ICON_PADDING_BOTTOM;
        const padLeft = Config.REWIND_ICON_PADDING_LEFT;
        const padRight = Config.REWIND_ICON_PADDING_RIGHT;
        const cornerRadius = 12;

        const bgWidth = iconSize + padLeft + padRight;
        const bgHeight = iconSize + padTop + padBottom;
        const margin = Config.REWIND_ICON_MARGIN;
        const bgX = margin;
        const bgY = margin;

        ctx.fillStyle = '#000';
        this._roundRect(bgX, bgY, bgWidth, bgHeight, cornerRadius);
        ctx.fill();

        const iconX = bgX + padLeft;
        const iconY = bgY + padTop;
        const triWidth = iconSize / 2;
        const triHeight = iconSize;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(iconX + triWidth * 2, iconY);
        ctx.lineTo(iconX + triWidth * 2, iconY + triHeight);
        ctx.lineTo(iconX + triWidth, iconY + triHeight / 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(iconX + triWidth, iconY);
        ctx.lineTo(iconX + triWidth, iconY + triHeight);
        ctx.lineTo(iconX, iconY + triHeight / 2);
        ctx.closePath();
        ctx.fill();
    }

    _drawHint(state) {
        const ctx = this.ctx;
        const H = Config.SCREEN_HEIGHT;
        ctx.fillStyle = '#000';
        ctx.font = `${Config.HINT_FONT_SIZE}px monospace`;

        const lh = Config.HINT_LINE_HEIGHT;
        const x = Config.HINT_MARGIN_X;
        const y = H - Config.HINT_MARGIN_BOTTOM - lh;

        ctx.fillText('[Space] grab', x, y);
        ctx.fillText('[Enter] check', x, y + lh);
    }

    // --- Celebration (confetti + title) ---
    _drawCelebration(state) {
        const ctx = this.ctx;
        const particles = state.celebrationParticles;
        const outline = Config.CELEBRATION_PARTICLE_OUTLINE;

        // White outlines
        ctx.fillStyle = '#fff';
        for (const p of particles) {
            if (p.x > -10 && p.x < 410 && p.y > -10 && p.y < 250) {
                ctx.fillRect(p.x - outline, p.y - outline, p.w + outline * 2, p.h + outline * 2);
            }
        }

        // Black fills
        ctx.fillStyle = '#000';
        for (const p of particles) {
            if (p.x > -10 && p.x < 410 && p.y > -10 && p.y < 250) {
                ctx.fillRect(p.x, p.y, p.w, p.h);
            }
        }

        // Title
        if (state.celebrationTitleShown && state.currentAnimationName) {
            const name = state.currentAnimationName;
            ctx.font = 'bold 24px monospace';
            const textW = ctx.measureText(name).width;
            const padX = Config.CELEBRATION_TITLE_PAD_X;
            const padY = Config.CELEBRATION_TITLE_PAD_Y;
            const bgW = textW + padX * 2;
            const bgH = 30 + padY * 2;
            const bgX = (Config.SCREEN_WIDTH - bgW) / 2;
            const bgY = Config.SCREEN_HEIGHT - bgH + Config.PAUSE_LABEL_OFFSET_Y;

            ctx.fillStyle = '#000';
            ctx.fillRect(bgX, bgY, bgW, bgH);
            ctx.fillStyle = '#fff';
            ctx.fillText(name, bgX + padX, bgY + padY + 22);
        }
    }

    _drawResultOK(state) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const boxX = Config.PAUSE_BOX_X;
        const boxY = Config.PAUSE_BOX_Y;
        const boxW = Config.PAUSE_BOX_W;
        const boxH = Config.PAUSE_BOX_H;
        const border = Config.PAUSE_BOX_BORDER;
        const shadow = Config.PAUSE_BOX_SHADOW;

        // Shadow
        this.fillRectDither(boxX + shadow + 1, boxY + boxH, boxW - shadow, shadow, 0.5);
        this.fillRectDither(boxX + boxW, boxY + shadow + 1, shadow, boxH - shadow, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(boxX, boxY, boxW, border);
        ctx.fillRect(boxX, boxY + boxH - border, boxW, border);
        ctx.fillRect(boxX, boxY + border, border, boxH - border * 2);
        ctx.fillRect(boxX + boxW - border, boxY + border, border, boxH - border * 2);

        // White bg
        const innerX = boxX + border;
        const innerY = boxY + border;
        const innerW = boxW - border * 2;
        const innerH = boxH - border * 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(innerX, innerY, innerW, innerH);

        // Time display (large, centered, dithered style)
        const safeTime = state.clearTime || 0;
        const timeText = state.formatTime(safeTime);
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.5;
        ctx.font = `bold ${Config.PAUSE_TIME_FONT_SIZE}px monospace`;
        const timeW = ctx.measureText(timeText).width;
        const timeX = Math.floor((W - timeW) / 2);
        const timeY = innerY + Config.PAUSE_TIME_TOP_MARGIN;
        ctx.fillText(timeText, timeX, timeY);
        ctx.globalAlpha = 1;

        // Best Time / New Record
        ctx.font = '14px monospace';
        let bestTimeStr;
        if (state.isNewHiScore) {
            bestTimeStr = '- New Record! -';
        } else {
            const currentHiScore = state.currentHiScore;
            if (currentHiScore) {
                bestTimeStr = `- Best Time: ${state.formatTime(currentHiScore)} -`;
            } else {
                bestTimeStr = '- Best Time: --:-- -';
            }
        }
        const bestW = ctx.measureText(bestTimeStr).width;
        const bestX = (W - bestW) / 2;
        const bestY = timeY + Config.PAUSE_BEST_TOP_GAP + 16;
        ctx.fillText(bestTimeStr, bestX, bestY);

        // Prompt (floating animation)
        const promptAnimTime = state.promptAnimTime || 0;
        const floatOffset = Math.floor(Math.sin(promptAnimTime) * Config.TITLE_PRESS_INFO_AMPLITUDE);
        const promptBaseY = innerY + Config.PAUSE_PROMPT_Y;

        ctx.font = '14px monospace';

        const selectText = '[Enter] STAGE SELECT';
        const selectW = ctx.measureText(selectText).width;
        ctx.fillText(selectText, (W - selectW) / 2, promptBaseY + floatOffset);

        const replayText = '[Esc] REPLAY';
        const replayW = ctx.measureText(replayText).width;
        ctx.fillText(replayText, (W - replayW) / 2, promptBaseY + Config.PAUSE_PROMPT_LINE_SPACING + floatOffset);

        // "CLEAR!" label at bottom
        ctx.font = 'bold 24px monospace';
        const screenLabel = 'CLEAR!';
        const labelW = ctx.measureText(screenLabel).width;
        const labelPadX = Config.CELEBRATION_TITLE_PAD_X;
        const labelPadY = Config.CELEBRATION_TITLE_PAD_Y;
        const labelBgW = labelW + labelPadX * 2;
        const labelBgH = 30 + labelPadY * 2;
        const labelBgX = (W - labelBgW) / 2;
        const labelBgY = H - labelBgH + Config.PAUSE_LABEL_OFFSET_Y;

        ctx.fillStyle = '#000';
        ctx.fillRect(labelBgX, labelBgY, labelBgW, labelBgH);
        ctx.fillStyle = '#fff';
        ctx.fillText(screenLabel, labelBgX + labelPadX, labelBgY + labelPadY + 22);
    }

    _drawResultNG(state) {
        const ctx = this.ctx;
        const boxX = Config.NG_BOX_X;
        const boxY = Config.NG_BOX_Y;
        const shadowOff = Config.NG_BOX_SHADOW_OFFSET;
        const boxWidth = 300;
        const boxHeight = 100;

        // Shadow
        this.fillRectDither(boxX + shadowOff, boxY + shadowOff + 1, boxWidth, boxHeight, 0.5);

        // Black bg
        ctx.fillStyle = '#000';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // NG level messages (3 levels from production)
        const ngLevel = state.ngLevel || "normal";
        let line1, line2;
        if (ngLevel === "close") {
            line1 = "So close!";
            line2 = "Just one move away!";
        } else if (ngLevel === "far") {
            line1 = "Nope! Not even";
            line2 = "close at all!";
        } else {
            line1 = "Hmm, not quite...";
            line2 = "Keep trying!";
        }

        // Text centered in box
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        const w1 = ctx.measureText(line1).width;
        const w2 = ctx.measureText(line2).width;
        const lineSpacing = 4;
        const textH = 16 * 2 + lineSpacing;
        const startY = boxY + Math.floor((boxHeight - textH) / 2) + 14;
        ctx.fillText(line1, boxX + Math.floor((boxWidth - w1) / 2), startY);
        ctx.fillText(line2, boxX + Math.floor((boxWidth - w2) / 2), startY + 16 + lineSpacing);
    }

    _drawPauseScreen(state) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        const boxX = Config.PAUSE_BOX_X;
        const boxY = Config.PAUSE_BOX_Y;
        const boxW = Config.PAUSE_BOX_W;
        const boxH = Config.PAUSE_BOX_H;
        const border = Config.PAUSE_BOX_BORDER;
        const shadow = Config.PAUSE_BOX_SHADOW;

        // Shadow
        this.fillRectDither(boxX + shadow + 1, boxY + boxH, boxW - shadow, shadow, 0.5);
        this.fillRectDither(boxX + boxW, boxY + shadow + 1, shadow, boxH - shadow, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(boxX, boxY, boxW, border);
        ctx.fillRect(boxX, boxY + boxH - border, boxW, border);
        ctx.fillRect(boxX, boxY + border, border, boxH - border * 2);
        ctx.fillRect(boxX + boxW - border, boxY + border, border, boxH - border * 2);

        // White bg
        const innerX = boxX + border;
        const innerY = boxY + border;
        const innerW = boxW - border * 2;
        const innerH = boxH - border * 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(innerX, innerY, innerW, innerH);

        // Time (large, dithered)
        const timeText = state.formatTime(state.getElapsedTime());
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.5;
        ctx.font = `bold ${Config.PAUSE_TIME_FONT_SIZE}px monospace`;
        const timeW = ctx.measureText(timeText).width;
        const timeX = Math.floor((W - timeW) / 2);
        const timeY = innerY + Config.PAUSE_TIME_TOP_MARGIN;
        ctx.fillText(timeText, timeX, timeY);
        ctx.globalAlpha = 1;

        // Best time
        ctx.font = '14px monospace';
        let bestTimeStr;
        const currentHiScore = state.currentHiScore;
        if (currentHiScore) {
            bestTimeStr = `- Best Time: ${state.formatTime(currentHiScore)} -`;
        } else {
            bestTimeStr = '- Best Time: --:-- -';
        }
        const bestW = ctx.measureText(bestTimeStr).width;
        const bestX = (W - bestW) / 2;
        const bestY = timeY + Config.PAUSE_BEST_TOP_GAP + 16;
        ctx.fillText(bestTimeStr, bestX, bestY);

        // Prompt (floating animation)
        state.promptAnimTime = (state.promptAnimTime || 0) + 0.1;
        const floatOffset = Math.floor(Math.sin(state.promptAnimTime) * Config.TITLE_PRESS_INFO_AMPLITUDE);
        const promptBaseY = innerY + Config.PAUSE_PROMPT_Y;

        ctx.fillStyle = '#000';
        ctx.font = '14px monospace';

        const resumeText = '[Esc] RESUME';
        const resumeW = ctx.measureText(resumeText).width;
        ctx.fillText(resumeText, (W - resumeW) / 2, promptBaseY + floatOffset);

        if (state.isStageCleared(Config.TUTORIAL_STAGE_INDEX)) {
            const selectText = '[Enter] STAGE SELECT';
            const selectW = ctx.measureText(selectText).width;
            ctx.fillText(selectText, (W - selectW) / 2, promptBaseY + Config.PAUSE_PROMPT_LINE_SPACING + floatOffset);
        }

        // "PAUSED" label at bottom
        ctx.font = 'bold 24px monospace';
        const screenLabel = 'PAUSED';
        const labelW = ctx.measureText(screenLabel).width;
        const labelPadX = Config.CELEBRATION_TITLE_PAD_X;
        const labelPadY = Config.CELEBRATION_TITLE_PAD_Y;
        const labelBgW = labelW + labelPadX * 2;
        const labelBgH = 30 + labelPadY * 2;
        const labelBgX = (W - labelBgW) / 2;
        const labelBgY = H - labelBgH + Config.PAUSE_LABEL_OFFSET_Y;

        ctx.fillStyle = '#000';
        ctx.fillRect(labelBgX, labelBgY, labelBgW, labelBgH);
        ctx.fillStyle = '#fff';
        ctx.fillText(screenLabel, labelBgX + labelPadX, labelBgY + labelPadY + 22);
    }

    // --- Answer Animation (character reaction) ---
    _drawAnswerAnim(images, frameIndex, x, y) {
        if (!images || images.length === 0) return;
        const img = images[frameIndex];
        if (img && img.complete && img.naturalWidth > 0) {
            this.ctx.drawImage(img, x, y);
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

    // --- Tutorial Overlay (10-step system) ---
    _drawTutorialOverlay(tutorial, state) {
        // First game hint (stop style)
        if (tutorial.showingFirstGameHint && tutorial.overlayVisible) {
            this._drawFirstGameHintOverlay(tutorial);
            return;
        }

        // Step 4: no text overlay (crank indicator shown via showHint)
        if (tutorial.isTutorialStage && tutorial.step === 4) {
            return;
        }

        if (!tutorial.overlayVisible || tutorial.step === 0 || tutorial.step > Config.TUTORIAL_TOTAL_STEPS) return;

        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        let overlayW, overlayH;
        if (tutorial.overlayType === "stop") {
            overlayW = Config.TUTORIAL_STOP_OVERLAY_WIDTH;
            overlayH = Config.TUTORIAL_STOP_OVERLAY_HEIGHT;
        } else {
            overlayW = Config.TUTORIAL_OVERLAY_WIDTH;
            overlayH = Config.TUTORIAL_OVERLAY_HEIGHT;
        }
        const border = Config.TUTORIAL_OVERLAY_BORDER;
        const shadow = Config.TUTORIAL_OVERLAY_SHADOW_OFFSET;

        const ox = (W - overlayW) / 2;
        const oy = (H - overlayH) / 2;

        // Shadow
        this.fillRectDither(ox + shadow, oy + shadow, overlayW, overlayH, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(ox, oy, overlayW, border);
        ctx.fillRect(ox, oy + overlayH - border, overlayW, border);
        ctx.fillRect(ox, oy + border, border, overlayH - border * 2);
        ctx.fillRect(ox + overlayW - border, oy + border, border, overlayH - border * 2);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + border, oy + border, overlayW - border * 2, overlayH - border * 2);

        // Text
        ctx.fillStyle = '#000';
        const textData = Config.TUTORIAL_STEP_TEXT[tutorial.step];
        if (textData) {
            const innerW = overlayW - border * 2;
            const lineHeight = 36;
            const lineGap = 6;
            const lineCount = textData[1] ? 2 : 1;
            const totalTextH = lineCount * lineHeight + (lineCount - 1) * lineGap;
            const promptH = tutorial.overlayType === "stop" ? 30 : 0;
            const innerH = overlayH - border * 2;
            const baseY = oy + border + (innerH - totalTextH - promptH) / 2;

            ctx.font = '24px monospace';
            const w1 = ctx.measureText(textData[0]).width;
            ctx.fillText(textData[0], ox + border + (innerW - w1) / 2, baseY + 21);
            if (textData[1]) {
                const w2 = ctx.measureText(textData[1]).width;
                ctx.fillText(textData[1], ox + border + (innerW - w2) / 2, baseY + lineHeight + lineGap + 21);
            }
        }

        // Stop: page indicator
        const pageInfo = Config.TUTORIAL_STOP_PAGE[tutorial.step];
        if (tutorial.overlayType === "stop" && pageInfo) {
            ctx.font = '14px monospace';
            const pageText = `${pageInfo[0]}/${pageInfo[1]}`;
            const pageW = ctx.measureText(pageText).width;
            ctx.fillText(pageText, ox + overlayW - border - pageW - 8, oy + border + 16);
        }

        // Stop: "PRESS [Enter]" prompt (floating)
        if (tutorial.overlayType === "stop") {
            const floatOffset = Math.floor(Math.sin(tutorial.promptAnimTime) * Config.TITLE_PRESS_INFO_AMPLITUDE);
            const promptBaseY = oy + overlayH - border - 22;
            ctx.font = '14px monospace';
            const promptText = 'PRESS [Enter]';
            const promptWidth = ctx.measureText(promptText).width;
            const innerW = overlayW - border * 2;
            ctx.fillText(promptText, ox + border + (innerW - promptWidth) / 2, promptBaseY + floatOffset);
        }
    }

    _drawFirstGameHintOverlay(tutorial) {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;
        const overlayW = Config.TUTORIAL_STOP_OVERLAY_WIDTH;
        const overlayH = Config.TUTORIAL_STOP_OVERLAY_HEIGHT;
        const border = Config.TUTORIAL_OVERLAY_BORDER;
        const shadow = Config.TUTORIAL_OVERLAY_SHADOW_OFFSET;
        const ox = (W - overlayW) / 2;
        const oy = (H - overlayH) / 2;

        // Shadow
        this.fillRectDither(ox + shadow, oy + shadow, overlayW, overlayH, 0.5);

        // Border
        ctx.fillStyle = '#000';
        ctx.fillRect(ox, oy, overlayW, border);
        ctx.fillRect(ox, oy + overlayH - border, overlayW, border);
        ctx.fillRect(ox, oy + border, border, overlayH - border * 2);
        ctx.fillRect(ox + overlayW - border, oy + border, border, overlayH - border * 2);

        // White bg
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + border, oy + border, overlayW - border * 2, overlayH - border * 2);

        // Text
        ctx.fillStyle = '#000';
        ctx.font = '24px monospace';
        const textData = Config.FIRST_GAME_HINT_TEXT;
        const innerW = overlayW - border * 2;
        const innerH = overlayH - border * 2;
        const lineHeight = 36;
        const lineGap = 6;
        const totalTextH = lineHeight * 2 + lineGap;
        const promptH = 30;
        const baseY = oy + border + (innerH - totalTextH - promptH) / 2;

        const w1 = ctx.measureText(textData[0]).width;
        ctx.fillText(textData[0], ox + border + (innerW - w1) / 2, baseY + 21);
        if (textData[1]) {
            const w2 = ctx.measureText(textData[1]).width;
            ctx.fillText(textData[1], ox + border + (innerW - w2) / 2, baseY + lineHeight + lineGap + 21);
        }

        // "PRESS [Enter]" prompt
        const floatOffset = Math.floor(Math.sin(tutorial.promptAnimTime) * Config.TITLE_PRESS_INFO_AMPLITUDE);
        const promptBaseY = oy + overlayH - border - 22;
        ctx.font = '14px monospace';
        const promptText = 'PRESS [Enter]';
        const promptWidth = ctx.measureText(promptText).width;
        ctx.fillText(promptText, ox + border + (innerW - promptWidth) / 2, promptBaseY + floatOffset);
    }

    _drawCrankIndicator() {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        const H = Config.SCREEN_HEIGHT;

        // Key hint at bottom-right
        ctx.fillStyle = '#000';
        ctx.font = `${Config.HINT_FONT_SIZE}px monospace`;
        const line1 = '[Right key] next';
        const line2 = '[Left  key] back';
        const lh = Config.HINT_LINE_HEIGHT;
        const x = W - Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) - Config.HINT_MARGIN_X;
        const y = H - Config.HINT_MARGIN_BOTTOM - lh;
        ctx.fillText(line1, x, y);
        ctx.fillText(line2, x, y + lh);
    }

    // --- Transition ---
    drawTransition(transition) {
        if (transition && transition.active) {
            transition.draw(this.ctx);
        }
    }

    // --- Thank You Screen ---
    drawThankYouScreen() {
        const ctx = this.ctx;
        const W = Config.SCREEN_WIDTH;
        this.clear('#000');

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        const line1 = 'Thank You';
        const line2 = 'for Playing!';
        ctx.fillText(line1, (W - ctx.measureText(line1).width) / 2, 80);
        ctx.fillText(line2, (W - ctx.measureText(line2).width) / 2, 115);

        ctx.font = '14px monospace';
        const line3 = 'Full game available on';
        const line4 = 'Playdate Catalog';
        ctx.fillText(line3, (W - ctx.measureText(line3).width) / 2, 160);
        ctx.fillText(line4, (W - ctx.measureText(line4).width) / 2, 185);

        ctx.font = '12px monospace';
        const line5 = '[Enter] Back to Menu';
        ctx.fillText(line5, (W - ctx.measureText(line5).width) / 2, 220);
    }
}
