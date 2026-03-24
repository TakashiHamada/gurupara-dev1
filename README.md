# Flip-Flap Crank Demo (Web)

A web-based demo of **"GuruPara!" (Flip-Flap Crank)** — a page-flipping puzzle game originally developed for the [Playdate](https://play.date/) handheld console. This demo showcases 3 stages (Tutorial + 2 stages) playable directly in the browser.

## Game Overview

Flip-Flap Crank is a puzzle game where players flip through shuffled animation frames and rearrange them into the correct order. The goal is to restore each animation sequence by grabbing, moving, and placing frames in the right positions.

## Demo

- **Title Screen** → Start Game
- **Stage 0** — Tutorial with a 10-step progressive guide
- **Stage 1 & Stage 2** — 9 frames each, puzzle-style gameplay
- **Thank You Screen** — Displayed after clearing all stages

## Controls

| Action         | Keyboard          | Gamepad              |
| -------------- | ----------------- | -------------------- |
| Flip pages     | `←` / `→`         | D-pad Left / Right   |
| Grab / Release | `Space` (hold)    | A Button             |
| Check / Select | `Enter`           | B Button             |
| Pause / Back   | `Backspace` / `Esc` | X Button           |

## Tech Stack

- **Vanilla JavaScript** (ES6+ modules) — no frameworks or bundlers
- **HTML5 Canvas** (2D context, 400×240 resolution)
- **Web Audio API** for sound effects and BGM
- **CSS3** for the Playdate device frame UI

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (for `npx`)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Run Locally

```bash
npx live-server --port=8000 --no-browser
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Project Structure

```
├── index.html             # Entry point (Playdate frame + canvas)
├── main.js                # Game loop, scene management, game logic
├── styles.css             # Playdate device frame and layout
├── engine/
│   ├── Config.js          # All tunable parameters
│   ├── Renderer.js        # Canvas drawing (title, game, selection, UI)
│   ├── GameState.js       # Game state and settings persistence
│   ├── InputHandler.js    # Keyboard + gamepad input handling
│   ├── PuzzleEngine.js    # Frame shuffling and order validation
│   ├── AssetLoader.js     # Image asset loading
│   ├── Sound.js           # Web Audio API (SE + BGM)
│   └── Transition.js      # Page-turn screen transitions
└── Source/
    ├── images/            # Animation frame images
    │   ├── TitleAnimation/
    │   ├── MainGameAnimation/
    │   ├── SelectionAnimation/
    │   └── AnswerAnimation/
    └── sounds/            # Sound effects and BGM
```

## License

All rights reserved.

## Copyright

© 2026 GIFT TEN INDUSTRY.K.K. All rights reserved.
