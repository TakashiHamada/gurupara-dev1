# 🕹️ Project: GuruPara! Web Demo (Porting Plan)

## 1. Context & Objective

This project is a web-based demo for the Playdate game "GuruPara!". The goal is to transpile the existing Playdate (Lua) logic into a JavaScript-based web application that mimics the physical Playdate console experience.

### Project Resources

* **/playdate/**: Contains the complete original Playdate SDK (Lua) project. Claude Code should reference this folder for logic and specifications.
* **/Source/images/**: Contains the animation frame images required for the game.

## 2. Web Demo Technical Stack

* **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3.
* **Rendering**: HTML5 Canvas API (2D).
* **Audio**: **NOT REQUIRED** (Silent for this demo).
* **Target Stages**: Tutorial (Stage 0), Stage 1, and Stage 2 only.

## 3. Emulation & UI Requirements

### Virtual Console Layout

* Render a Playdate hardware image in the center of the web page.
* Place the `400x240` Canvas inside the screen area of the hardware image.
* **Animated Crank**: The crank handle on the hardware image must rotate 360 degrees based on the internal `crankAngle` variable.

### Input Mapping (Mandatory)

The following mapping must be implemented to support both Keyboard and Gamepads:

| Action | Playdate Input | Keyboard | Gamepad (Standard) | Visual Feedback |
| --- | --- | --- | --- | --- |
| **Flip / Menu** | Crank | Left / Right Arrows | D-pad Left / Right | **Handle Rotates** |
| **Grab Frame** | D-pad (Hold) | **Space** | **South Button (A)** | None |
| **Check Answer** | A Button | **Enter** | **East Button (B)** | None |
| **Pause / Back** | B Button | **Backspace / Esc** | **West Button (X)** | None |

## 4. Implementation Rules for Claude Code

1. **Analyze**: Read `/playdate/Source/core/puzzle.lua` and other modules to extract the shuffling (Fisher-Yates) and Cyclic Order validation logic.
2. **Transpile to JS**: Convert the logic into a clean, modular JavaScript structure (e.g., `PuzzleEngine.js`, `InputHandler.js`, `Renderer.js`).
3. **Graphic Reproduction**:
* Implement a `setDitherPattern(alpha)` equivalent in Canvas to match Playdate's look.
* Reproduce the "wavy border" animation for the grabbed thumbnail as defined in the original `README.md`.


4. **Demo Flow**:
* Start from the Title screen.
* Proceed through Stage 0 (Tutorial), Stage 1, and Stage 2.
* **Intercept Stage 3**: Instead of loading Stage 3, display a "Thank You" screen with a link to the Playdate Catalog/itch.io page.



## 5. Local Development Server

ローカルサーバーの起動には `live-server` を使用する（ホットリロード対応・キャッシュ問題回避のため）。

```bash
npx live-server --port=8000 --no-browser
```

## 6. File Structure (Target)

```
/
├── playdate/         # Original Lua Project (Read-only)
├── Source/images/    # Original Images (Source for Assets)
├── index.html        # Main entry with Virtual Playdate CSS
├── main.js           # Game loop and scene management
├── engine/           # Transpiled logic
├── assets/           # Prepared Web Assets
└── styles.css        # Layout for the virtual console and crank

```
