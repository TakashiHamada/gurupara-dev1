// AssetLoader.js - Load image assets for all stages

import { Config } from './Config.js';

export class AssetLoader {
    constructor() {
        this.mainImages = {};    // { stageIndex: [Image, ...] }
        this.selectionImages = {}; // { stageIndex: [Image, ...] } (3x3 grid split)
        this.loaded = false;
    }

    async loadAll() {
        const promises = [];

        for (const stage of Config.STAGES) {
            // Main game frames
            this.mainImages[stage.index] = [];
            for (let i = 1; i <= stage.frameCount; i++) {
                const img = new Image();
                const path = `Source/images/MainGameAnimation/${stage.folder}/${stage.name}-table-${i}.png`;
                promises.push(this._loadImage(img, path));
                this.mainImages[stage.index].push(img);
            }

            // Selection thumbnail sprite (3x3 grid, 60x60 cells)
            const selImg = new Image();
            const selPath = `Source/images/SelectionAnimation/${stage.folder}-table-60-60.png`;
            promises.push(this._loadImage(selImg, selPath).then(() => {
                this.selectionImages[stage.index] = selImg;
            }));
        }

        await Promise.all(promises);
        this.loaded = true;
    }

    _loadImage(img, src) {
        return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
                console.warn(`Failed to load: ${src}`);
                resolve(); // Don't block on missing images
            };
            img.src = src;
        });
    }

    getMainFrames(stageIndex) {
        return this.mainImages[stageIndex] || [];
    }

    getSelectionSprite(stageIndex) {
        return this.selectionImages[stageIndex] || null;
    }

    // Draw a specific cell from the selection spritesheet (3x3 grid)
    drawSelectionFrame(ctx, stageIndex, frameIndex, x, y, size) {
        const sprite = this.selectionImages[stageIndex];
        if (!sprite || !sprite.complete) return;

        const cellSize = 60;
        const col = frameIndex % 3;
        const row = Math.floor(frameIndex / 3);

        ctx.drawImage(
            sprite,
            col * cellSize, row * cellSize, cellSize, cellSize,
            x, y, size, size
        );
    }
}
