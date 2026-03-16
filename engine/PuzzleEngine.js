// PuzzleEngine.js - Puzzle logic (transpiled from core/puzzle.lua)

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

    // Fisher-Yates shuffle, repeat until not correct AND not "close"
    shuffle() {
        do {
            for (let i = this.frameOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.frameOrder[i], this.frameOrder[j]] = [this.frameOrder[j], this.frameOrder[i]];
            }
        } while (this.isCorrectOrder() || this.evaluateWrongness() === "close");
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

    // Evaluate how wrong the current arrangement is
    // Returns: "close" (1 move away), "normal", or "far"
    evaluateWrongness() {
        const frameOrder = this.frameOrder;
        const frameCount = this.frameCount;
        const n = frameOrder.length;

        // Check if solvable in 1 move (remove one frame and insert elsewhere)
        for (let removeIdx = 0; removeIdx < n; removeIdx++) {
            const removed = frameOrder[removeIdx];
            // Build temp array without the removed element
            const temp = [];
            for (let i = 0; i < n; i++) {
                if (i !== removeIdx) temp.push(frameOrder[i]);
            }
            // Try all insertion positions
            for (let insertIdx = 0; insertIdx < n; insertIdx++) {
                let isCorrect = true;
                for (let pos = 0; pos < n; pos++) {
                    let current, next;
                    if (pos < insertIdx) {
                        current = temp[pos];
                    } else if (pos === insertIdx) {
                        current = removed;
                    } else {
                        current = temp[pos - 1];
                    }
                    const nextPos = (pos + 1) % n;
                    if (nextPos < insertIdx) {
                        next = temp[nextPos];
                    } else if (nextPos === insertIdx) {
                        next = removed;
                    } else {
                        next = temp[nextPos - 1];
                    }
                    const expectedNext = (current + 1) % frameCount;
                    if (next !== expectedNext) {
                        isCorrect = false;
                        break;
                    }
                }
                if (isCorrect) {
                    return "close";
                }
            }
        }

        // Count correct consecutive pairs
        let correctPairs = 0;
        for (let i = 0; i < n; i++) {
            const current = frameOrder[i];
            const next = frameOrder[(i + 1) % n];
            const expectedNext = (current + 1) % frameCount;
            if (next === expectedNext) {
                correctPairs++;
            }
        }

        if (correctPairs <= 2) { // NG_FAR_THRESHOLD
            return "far";
        }

        return "normal";
    }
}
