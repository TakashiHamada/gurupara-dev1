// Transition.js - Page-flip scene transition (transpiled from core/transition.lua)

import { Config } from './Config.js';

export class Transition {
    constructor() {
        this.active = false;
        this.pages = [];
        this.phase = 'out'; // 'out' or 'in'
        this.onMidpoint = null;
        this.onComplete = null;
        this.midpointFired = false;
    }

    start(onMidpoint, onComplete) {
        this.active = true;
        this.phase = 'out';
        this.midpointFired = false;
        this.onMidpoint = onMidpoint;
        this.onComplete = onComplete;

        this.pages = [];
        for (let i = 0; i < Config.TRANSITION_PAGE_COUNT; i++) {
            this.pages.push({ progress: 0, offset: i * 2 });
        }
    }

    update() {
        if (!this.active) return;

        let allDone = true;

        for (let i = 0; i < this.pages.length; i++) {
            const stagger = i * 0.12;
            if (this.phase === 'out') {
                this.pages[i].progress = Math.min(1, this.pages[i].progress + Config.TRANSITION_SPEED);
                if (this.pages[i].progress < 1) allDone = false;
            } else {
                this.pages[i].progress = Math.max(0, this.pages[i].progress - Config.TRANSITION_SPEED);
                if (this.pages[i].progress > 0) allDone = false;
            }
        }

        if (allDone) {
            if (this.phase === 'out') {
                this.phase = 'in';
                if (!this.midpointFired) {
                    this.midpointFired = true;
                    if (this.onMidpoint) this.onMidpoint();
                }
                // Reset pages for 'in' phase
                for (let i = 0; i < this.pages.length; i++) {
                    this.pages[i].progress = 1;
                }
            } else {
                this.active = false;
                if (this.onComplete) this.onComplete();
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const w = Config.SCREEN_WIDTH;
        const h = Config.SCREEN_HEIGHT;

        for (let i = 0; i < this.pages.length; i++) {
            const p = this.pages[i].progress;
            if (p <= 0) continue;

            const eased = easePageFlip(p);
            const x = this.phase === 'out'
                ? -w + eased * w + i * 3
                : eased * w - w + i * 3;

            // Page fill
            ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
            ctx.fillRect(x, 0, w, h);

            // Fold shadow line
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x + w - 2, 0, 2, h);
        }
    }
}

function easePageFlip(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
