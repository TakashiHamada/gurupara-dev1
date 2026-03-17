// AssetLoader.js - Load image assets for all stages

import { Config } from './Config.js';

export class AssetLoader {
    constructor() {
        this.mainImages = {};    // { stageIndex: [Image, ...] }
        this.titleImages = [];   // Title animation frames (16 frames)
        this.answerAnimImages = {
            good: [],   // Good1-5.png
            bad: [],    // Bad1-5.png (NG normal)
            near: [],   // Near1-5.png (NG close)
            sobad: [],  // SoBad1-5.png (NG far)
        };
        this.loaded = false;
    }

    async loadAll() {
        const promises = [];
        console.log('[AssetLoader] Starting loadAll...');

        // Title animation frames
        for (let i = 1; i <= Config.TITLE_ANIM_FRAME_COUNT; i++) {
            const img = new Image();
            const path = `Source/images/TitleAnimation/Title/Title-table-${i}.png`;
            promises.push(this._loadImage(img, path));
            this.titleImages.push(img);
        }

        // Answer animation images (character reactions)
        const answerFolders = { good: 'Good', bad: 'Bad', near: 'Near', sobad: 'SoBad' };
        for (const [key, folder] of Object.entries(answerFolders)) {
            for (let i = 1; i <= Config.ANSWER_ANIM_FRAME_COUNT; i++) {
                const img = new Image();
                const path = `Source/images/AnswerAnimation/${folder}/${folder}${i}.png`;
                promises.push(this._loadImage(img, path));
                this.answerAnimImages[key].push(img);
            }
        }

        for (const stage of Config.STAGES) {
            // Main game frames
            this.mainImages[stage.index] = [];
            for (let i = 1; i <= stage.frameCount; i++) {
                const img = new Image();
                const path = `Source/images/MainGameAnimation/${stage.folder}/${stage.name}-table-${i}.png`;
                promises.push(this._loadImage(img, path));
                this.mainImages[stage.index].push(img);
            }

        }

        await Promise.all(promises);
        this.loaded = true;
        console.log(`[AssetLoader] loadAll complete. titleImages:${this.titleImages.length}, answerAnim: good=${this.answerAnimImages.good.length} bad=${this.answerAnimImages.bad.length} near=${this.answerAnimImages.near.length} sobad=${this.answerAnimImages.sobad.length}`);
        // Verify answer anim images loaded
        for (const [key, imgs] of Object.entries(this.answerAnimImages)) {
            const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
            console.log(`[AssetLoader]   ${key}: ${loaded}/${imgs.length} loaded`);
        }
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

}
