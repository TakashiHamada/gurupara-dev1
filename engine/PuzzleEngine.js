// PuzzleEngine.js - Puzzle logic (transpiled from puzzle.lua)

export class PuzzleEngine {
    constructor() {
        this.frameOrder = [];
        this.frameCount = 0;
    }

    init(count) {
        this.frameCount = count;
        this.frameOrder = [];
        for (let i = 0; i < count; i++) {
            this.frameOrder[i] = i; // 0-based indexing
        }
    }

    // Cyclic order validation
    // Valid: [0,1,2,3], [2,3,0,1], [8,0,1,2,3,4,5,6,7] etc.
    isCorrectOrder() {
        if (this.frameOrder.length !== this.frameCount) return false;

        for (let i = 0; i < this.frameCount; i++) {
            const current = this.frameOrder[i];
            const next = this.frameOrder[(i + 1) % this.frameCount];
            const expectedNext = (current + 1) % this.frameCount;
            if (next !== expectedNext) return false;
        }
        return true;
    }

    // Fisher-Yates shuffle, repeat until not correct
    shuffle() {
        do {
            for (let i = this.frameOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.frameOrder[i], this.frameOrder[j]] = [this.frameOrder[j], this.frameOrder[i]];
            }
        } while (this.isCorrectOrder());
    }

    grabFrame(index) {
        const frame = this.frameOrder[index];
        this.frameOrder.splice(index, 1);
        return frame;
    }

    placeFrame(index, frame) {
        this.frameOrder.splice(index, 0, frame);
    }

    getCurrentCount() {
        return this.frameOrder.length;
    }

    getFrameAt(index) {
        return this.frameOrder[index];
    }
}
