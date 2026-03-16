// InputHandler.js - Keyboard & Gamepad input (transpiled from game/input.lua)

import { Config } from './Config.js';

export class InputHandler {
    constructor() {
        // Key states
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.prevKeys = {};

        // Buffers for async events
        this._pendingDown = {};
        this._pendingUp = {};

        // Virtual crank angle (driven by Left/Right arrows or gamepad D-pad)
        this.crankAngle = 0;
        this.crankSpeed = 8; // degrees per frame when key held

        // Gamepad
        this.gamepad = null;
        this.prevGamepadButtons = {};

        this._setupListeners();
    }

    _setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this._pendingDown[e.code] = true;
            }
            this.keys[e.code] = true;
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this._pendingUp[e.code] = true;
            e.preventDefault();
        });

        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.gamepad = null;
        });
    }

    update() {
        // Transfer pending events to just-pressed/released
        this.keysJustPressed = { ...this._pendingDown };
        this.keysJustReleased = { ...this._pendingUp };
        this._pendingDown = {};
        this._pendingUp = {};

        // Gamepad polling
        this._pollGamepad();
    }

    endFrame() {
        this.prevKeys = { ...this.keys };
    }

    _pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        this.gamepad = null;
        for (const gp of gamepads) {
            if (gp) { this.gamepad = gp; break; }
        }
        if (!this.gamepad) return;

        const buttons = this.gamepad.buttons;
        const gpMap = {
            'GamepadA': 0,      // South (A)
            'GamepadB': 1,      // East (B)
            'GamepadX': 2,      // West (X)
            'GamepadY': 3,      // North (Y)
            'GamepadLeft': 14,
            'GamepadRight': 15,
            'GamepadUp': 12,
            'GamepadDown': 13,
        };

        for (const [name, idx] of Object.entries(gpMap)) {
            if (idx < buttons.length) {
                const pressed = buttons[idx].pressed;
                const wasPressed = this.prevGamepadButtons[name] || false;
                if (pressed && !wasPressed) this.keysJustPressed[name] = true;
                if (!pressed && wasPressed) this.keysJustReleased[name] = true;
                this.keys[name] = pressed;
                this.prevGamepadButtons[name] = pressed;
            }
        }
    }

    // Compute crank delta once per frame (called in update)
    computeCrankDelta() {
        let delta = 0;
        if (this.keys['ArrowLeft'] || this.keys['GamepadLeft']) delta -= this.crankSpeed;
        if (this.keys['ArrowRight'] || this.keys['GamepadRight']) delta += this.crankSpeed;
        this.crankAngle += delta;
        this._frameCrankDelta = delta;
    }

    // Get cached crank delta (safe to call multiple times per frame)
    getCrankDelta() {
        return this._frameCrankDelta || 0;
    }

    // "Grab" button (Space or Gamepad A/South)
    isGrabPressed() {
        return this.keys['Space'] || this.keys['GamepadA'];
    }

    isGrabJustPressed() {
        return this.keysJustPressed['Space'] || this.keysJustPressed['GamepadA'];
    }

    isGrabJustReleased() {
        return this.keysJustReleased['Space'] || this.keysJustReleased['GamepadA'];
    }

    // "Check" button (Enter or Gamepad B/East)
    isCheckJustPressed() {
        return this.keysJustPressed['Enter'] || this.keysJustPressed['GamepadB'];
    }

    // "Pause/Back" button (Backspace, Escape, or Gamepad X/West)
    isPauseJustPressed() {
        return this.keysJustPressed['Backspace'] || this.keysJustPressed['Escape'] || this.keysJustPressed['GamepadX'];
    }

    // D-pad for selection screen
    isLeftJustPressed() {
        return this.keysJustPressed['ArrowLeft'] || this.keysJustPressed['GamepadLeft'];
    }
    isRightJustPressed() {
        return this.keysJustPressed['ArrowRight'] || this.keysJustPressed['GamepadRight'];
    }
    isUpJustPressed() {
        return this.keysJustPressed['ArrowUp'] || this.keysJustPressed['GamepadUp'];
    }
    isDownJustPressed() {
        return this.keysJustPressed['ArrowDown'] || this.keysJustPressed['GamepadDown'];
    }

    // Any input (for dismissing NG result)
    isAnyJustPressed() {
        return Object.keys(this.keysJustPressed).length > 0;
    }
}
