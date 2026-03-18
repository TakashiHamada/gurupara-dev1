# Flip-Flap Crank Demo (Web)

## 1. Context & Objective

Web demo for the Playdate game "GuruPara!" (marketed as "Flip-Flap Crank").
Transpiled from Playdate (Lua) to vanilla JavaScript. Demo version with 3 stages only.

### Project Resources

* **/playdate/**: Original Playdate SDK (Lua) project. Reference for logic and specifications.
* **/Source/images/**: Animation frame images used by the game.
* **/Source/sounds/**: Sound effect and BGM files.

## 2. Technical Stack

* **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3
* **Rendering**: HTML5 Canvas API (2D), 400x240 resolution
* **Audio**: Web Audio API (SE + BGM)
* **Target Stages**: Tutorial (Stage 0), Stage 1, Stage 2 only

## 3. Input Mapping

| Action         | Keyboard        | Gamepad            |
| -------------- | --------------- | ------------------ |
| **Flip pages** | Left / Right    | D-pad Left / Right |
| **Grab frame** | Space (hold)    | South Button (A)   |
| **Check**      | Enter           | East Button (B)    |
| **Pause/Back** | Backspace / Esc | West Button (X)    |

* Left/Right keys trigger **instant page flip** (not crank-based accumulation)
* Flip cooldown is configurable via `FLIP_COOLDOWN_FRAMES` in Config.js

## 4. Demo Flow

1. Title screen → START GAME only (no SETTINGS/CREDITS)
2. Stage 0 (Tutorial) with 10-step progressive system
3. Stage 1 and Stage 2 (9 frames each)
4. After Stage 2, "Thank You" screen with link
5. Selection screen shows only 3 stages with left/right loop navigation

## 5. Local Development Server

Use `live-server` for hot reload and cache-free development:

```bash
npx live-server --port=8000 --no-browser
```

## 6. File Structure

```
/
├── index.html        # Entry point (Playdate frame + canvas + controls help)
├── main.js           # Game loop, scene management, game logic
├── styles.css        # Playdate device frame and layout (CSS variables for tuning)
├── engine/
│   ├── Config.js     # All tunable parameters (sizes, timing, text)
│   ├── Renderer.js   # Canvas drawing (title, game, selection, UI)
│   ├── GameState.js  # Game state, settings persistence (localStorage)
│   ├── InputHandler.js # Keyboard + gamepad input
│   ├── PuzzleEngine.js # Frame shuffling (Fisher-Yates) and order validation
│   ├── AssetLoader.js  # Image loading (title, main frames, answer anims)
│   ├── Sound.js      # Web Audio API (SE + BGM)
│   └── Transition.js # Page-turn screen transitions
├── Source/
│   ├── images/       # All game graphics
│   └── sounds/       # All audio files
└── playdate/         # Original Lua project (read-only reference)
```

## 7. Key Design Decisions (Demo Version)

* **Title**: Menu fixed to START GAME, arrows point inward
* **Page flip**: Instant on key press (not crank accumulation), configurable cooldown
* **Backward flip**: Previous page slides in on top (not swapped underneath)
* **Tutorial text**: Uses keyboard terms ([Space], arrow keys, [Enter]) not Playdate terms
* **Tutorial hint dismissal**: Check (Enter) is consumed by tutorial overlay and won't trigger game check on same frame
* **Selection screen**: 3 tiles centered horizontally, main game frames for animation (not separate sprite sheets), scrolling dot background
* **Hints**: Left (grab/check) and right (flip keys) appear/disappear together on idle timer; left hint hidden until tutorial step 8
* **Check flash**: Semi-transparent black overlay (configurable alpha) instead of opaque
* **Clear replay**: Esc replays animation with answer SE; result screen re-shows with congratulations SE and good animation
* **Config.js**: All tunable parameters centralized — sizes, positions, timing, text, etc.

## 8. Playdate Device Frame (CSS)

The game canvas (400x240, 1x scale) is wrapped in a CSS-only Playdate device frame in `index.html` and `styles.css`.

### HTML Structure

```
.playdate-wrapper
  .playdate-device
    .screw-tr / .screw-bl / .screw-br   — corner screws (no top-left)
    .screen-bezel > canvas#game-canvas   — black bezel + game screen
    .speaker                             — speaker grille (dot grid)
    .menu-btn                            — menu button (right of screen)
    .lock-btn                            — lock switch (top edge, rectangle)
    .dpad > .dpad-h + .dpad-v            — D-pad cross
    .pd-btn.btn-b / .pd-btn.btn-a       — A/B buttons with white inner circle
    .crank-base                          — hinge (fixed to device)
    .crank-rotator > .crank-flipper      — rotation/flip wrapper
      .crank-handle                      — yellow grip
      .crank-arm                         — vertical metallic arm
```

### CSS Variables (`:root` in styles.css)

All visual parameters are exposed as CSS custom properties for easy tuning:

* **Margins**: `--margin-left`, `--margin-top`, `--margin-right`
* **Bezel**: `--bezel-width`
* **Screws**: `--screw-size`
* **Speaker**: `--speaker-width/height/top/right/radius/dot-size/dot-gap/dot-color/bg-color`
* **Menu button**: `--menu-btn-size/top/right`
* **Lock switch**: `--lock-width/height/right`
* **D-pad**: `--dpad-size/top/left/arm-width/arm-radius`
* **A/B buttons**: `--ab-btn-size`, `--btn-b-top/left`, `--btn-a-top/left`
* **Crank**: `--crank-pivot-y/pivot-offset/base-*/arm-*/handle-*/adjust-*/rotation`

### Crank Animation

* Left/Right key press toggles `scaleY` between `1` and `-1` on `.crank-flipper`
* Flip axis: `transform-origin: center bottom` (hinge center height)
* `.crank-rotator` handles positioning; `.crank-flipper` handles animation (separated to avoid transform conflicts)
* `--crank-rotation` controls X-axis 3D rotation via `perspective()` + `rotateX()`

### Decorative Button Click

* Clicking D-pad, A/B, or menu button flashes a "Please use your keyboard" reminder below the device
* Reference photo: `/Users/takashi/Desktop/Playdate_front-view.png`
