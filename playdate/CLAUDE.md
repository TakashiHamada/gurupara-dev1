# PlayDate Game Development Project

## Project Type
This is a PlayDate game development project using the PlayDate SDK and Lua.

## Essential Documentation

### Official Documentation (READ FIRST)
Before starting any development work, you MUST thoroughly read and understand these official documents:

- `References/Inside Playdate.html` - Official PlayDate SDK documentation with comprehensive API reference
- `References/Designing for Playdate.html` - Official design guidelines and best practices for PlayDate

These documents contain the complete API specifications and are the authoritative source for PlayDate development.

### Implementation Guidelines
- `References/PlayDate_Implementation_Guide.md` - Analyzed best practices from sample programs. This document summarizes patterns and techniques from real examples. Study this carefully.
- `References/Debug_Notes.md` - Debug history and lessons learned from this project. Contains solutions to common bugs and issues encountered during development. Read this to avoid repeating past mistakes.

### Sample Code
The `Examples/` directory contains reference implementations. Analyze these samples to understand:
- Proper API usage patterns
- Common implementation techniques
- PlayDate-specific optimizations

## Development Requirements

### Technical Specifications
- **Language**: Lua (PlayDate SDK)
- **Screen Resolution**: 400x240 pixels (1-bit monochrome)
- **Frame Rate**: 30 FPS target
- **Input Methods**: 
  - D-pad (up, down, left, right)
  - A and B buttons
  - Crank (unique analog input)
  - Menu button

### Workflow
1. **ALWAYS** start by reading the official documentation in References/
2. Review relevant examples in Examples/
3. Apply best practices from PlayDate_Implementation_Tips.txt
4. Write code following PlayDate SDK conventions
5. Test thoroughly on PlayDate Simulator

### Auto-Run After Implementation
**IMPORTANT**: After completing any code implementation, ALWAYS build and run the game in Playdate Simulator:
```bash
pdc Source gurupara.pdx && open gurupara.pdx
```
This ensures immediate visual feedback for every change.

### Key Constraints
- Memory-efficient code (limited device resources)
- Optimize for 1-bit display (black and white only)
- Design for crank input integration
- Keep file sizes minimal
- Consider battery life in design decisions

## Coding Standards
- Use clear, descriptive variable names
- Minimize global variables
- Comment complex logic, especially crank interactions
- Follow Lua best practices
- Structure code for readability and maintainability

## Source Folder Structure

```
Source/
├── main.lua              - Main loop, scene dispatching, system menu
├── game/                 - Game logic modules (refactored from main.lua)
│   ├── state.lua         - Game state management (GameState)
│   ├── tutorial.lua      - Tutorial state and overlay (Tutorial)
│   ├── renderer.lua      - Drawing functions (Renderer)
│   └── input.lua         - Crank/button input processing (Input)
├── ui/                   - UI screens (AI-generated from Figma)
│   ├── title.lua         - Title screen
│   └── selection.lua     - Selection screen
├── config/               - Configuration (human-editable, parameters ONLY)
│   ├── settings.lua      - Hub file (Settings global + imports)
│   ├── sound.lua         - Sound parameters (BGM)
│   ├── crank.lua         - Crank input parameters (sensitivity, thresholds)
│   ├── animation.lua     - Animation timing (grab, place, check, etc.)
│   ├── selection.lua     - Selection screen parameters (cursor)
│   ├── maingame.lua      - Main game parameters (image, thumbnail, slide, hints)
│   └── tutorial.lua      - Tutorial parameters (overlay, timing)
├── core/                 - Core logic (AI-managed)
│   ├── puzzle.lua        - Puzzle logic
│   ├── sound.lua         - Sound effects
│   ├── debug.lua         - Debug display
│   ├── transition.lua    - Scene transition effects
│   └── stages.lua        - Stage auto-detection
├── fonts/                - Roobert system fonts (from SDK)
└── images/               - Game images
```

### Folder Responsibilities

| Folder | Owner | Description |
|--------|-------|-------------|
| `game/` | AI | Game state, input, rendering modules |
| `ui/` | AI | Generated from Figma designs using MCP server |
| `config/` | Human | **Parameters ONLY** — numeric values, thresholds, sizes, etc. No logic or functions. |
| `core/` | AI | Game logic, utilities, and auto-detection modules |

### config/settings.lua
Human-editable parameters consolidated in one file:
- **Crank controls**: Sensitivity options, thresholds, noise filtering
- **Animation**: Duration of various effects
- **Thumbnail**: Size, position, border, wave animation, corner radius
- **Hints**: Idle time before showing hints

#### Crank Sensitivity Settings
Configurable via system menu ("Crank" option):
```lua
Settings.SENSITIVITY_OPTIONS = {
    { name = "Slow", degrees = 150 },      -- 1 rotation = ~2.4 frames
    { name = "Normal", degrees = 120 },    -- 1 rotation = 3 frames (default)
    { name = "Fast", degrees = 90 },       -- 1 rotation = 4 frames
    { name = "Fastest", degrees = 60 },    -- 1 rotation = 6 frames
}
Settings.DEFAULT_SENSITIVITY = "Normal"
```

#### Thumbnail Animation Parameters
The thumbnail (grabbed frame) has a distinctive wavy border animation:
- `THUMBNAIL_BORDER` — Black border thickness (px)
- `THUMBNAIL_BORDER_OFFSET` — Border position offset, positive = outward (px)
- `THUMBNAIL_BORDER_OUTLINE` — White outline outside black border (px)
- `THUMBNAIL_CORNER_RADIUS` — Rounded corner radius for bottom-right (px)
- `THUMBNAIL_WAVE_AMPLITUDE` — Wave amplitude (px)
- `THUMBNAIL_WAVE_FREQUENCY` — Number of waves along the edge
- `THUMBNAIL_WAVE_SPEED` — Wave animation speed
- `THUMBNAIL_BORDER_SCALE_START` — Initial border thickness multiplier (grab animation)

#### Tutorial Parameters
Tutorial stage (index 0) has specific timing parameters:
- `TUTORIAL_STAGE_INDEX` — Tutorial stage index (default: 0)
- `TUTORIAL_FRAME_COUNT` — Number of frames in tutorial (default: 4)
- `TUTORIAL_IDLE_THRESHOLD` — Frames before showing overlay (default: 45 = 1.5 sec)
- `TUTORIAL_STEP_DELAY` — Delay between step transitions (default: 30 = 1 sec)
- `TUTORIAL_GRAB_HOLD_THRESHOLD` — D-pad hold time for Step 2→3 transition (default: 20 frames)
- `TUTORIAL_OVERLAY_WIDTH/HEIGHT` — Overlay dimensions
- `TUTORIAL_OVERLAY_BORDER` — Overlay border thickness
- `TUTORIAL_OVERLAY_SHADOW_OFFSET` — Shadow offset for overlay

**IMPORTANT RULE**: All adjustable parameters (intervals, sizes, speeds, durations, thresholds, etc.) MUST be defined in `config/` files (as `Settings.*` values), not as local constants in other files. This ensures:
- Easy adjustment without code changes
- All tunable values in one place
- Clear separation between logic and configuration

When modifying game behavior, check the `config/` folder first before editing other files.

**IMPORTANT RULE**: The `config/` folder is for **parameter files ONLY** (numeric values, thresholds, flags). Files containing logic (functions, loops, conditionals) belong in `core/` or `game/`. Never place modules with functions in `config/`.

### Import Order in main.lua
```lua
-- config (load first for Settings global)
import "config/settings"

-- core
import "core/stages"
import "core/sound"
import "core/puzzle"
import "core/debug"

-- ui
import "ui/title"
import "ui/selection"
```

### Adding New Animations

To add a new animation puzzle:

1. **Image Folder Structure**
   ```
   Source/images/MainGameAnimation/{index}_{name}/{name}-table-1.png
   Source/images/MainGameAnimation/{index}_{name}/{name}-table-2.png
   ...
   Source/images/MainGameAnimation/{index}_{name}/{name}-table-9.png
   ```
   - `{index}` is the stage index (0-27)
   - `{name}` is the animation identifier (e.g., `Fish`, `Whale`)
   - Folder naming format: `{index}_{name}` (e.g., `0_Fish`, `1_Whale`)
   - Frame numbers start from 1
   - Images are loaded as PlayDate imagetable

2. **Selection Animation Sprite (REQUIRED)**
   After adding MainGameAnimation images, you **MUST** generate the selection screen thumbnail sprite:
   ```bash
   cd Tools
   python3 create_selection_sprite.py {index}_{name}
   # Or run without arguments and select "0" to process all
   python3 create_selection_sprite.py
   ```
   This creates `Source/images/SelectionAnimation/{index}_{name}-table-60-60.png` which displays as an animated thumbnail on the Selection screen when the stage is cleared.

3. **Automatic Stage Detection (config/stages.lua)**
   - No manual configuration needed
   - `Stages.scanImages()` automatically scans the `images/` folder at startup
   - Folder prefix number determines stage index (e.g., `0_` → stage 0, `1_` → stage 1)
   - Stages without corresponding folders are marked as unavailable

4. **Stage Layout (4 rows × 7 columns = 28 stages)**
   ```
   Index:  0  1  2  3  4  5  6
           7  8  9 10 11 12 13
          14 15 16 17 18 19 20
          21 22 23 24 25 26 27
   ```
   - Index 0: Tutorial stage (top-left)
   - Index 27: Boss stage (bottom-right)

5. **Hi-Scores**
   - Automatically saved per animation name
   - Stored via `playdate.datastore`

**Checklist for adding a new animation:**
- [ ] Create folder `Source/images/MainGameAnimation/{index}_{name}/`
- [ ] Add 9 frame images `{name}-table-1.png` to `{name}-table-9.png` (120x120px each)
- [ ] Run `python3 Tools/create_selection_sprite.py` to generate selection thumbnail
- [ ] Build and test with `pdc Source gurupara.pdx && open gurupara.pdx`

### BGM (Background Music)

#### File Structure
```
Source/sounds/bgm_{name}.mp3
```
- File names must have `bgm_` prefix
- Supported formats: MP3, ADPCM WAV (MP3 recommended for BGM)
- Uses `playdate.sound.fileplayer` for streaming playback

#### BGM Configuration (sound.lua)
```lua
local BGM_FILES = {
    title = "sounds/bgm_natsuyasuminotanken",
    selection = "sounds/bgm_natsuyasuminotanken",
    game = "sounds/bgm_fjordnosundakaze"
}
```

#### Scene-to-BGM Mapping
| Scene | BGM File |
|-------|----------|
| Title | bgm_natsuyasuminotanken.mp3 |
| Selection | bgm_natsuyasuminotanken.mp3 |
| Main Game | bgm_fjordnosundakaze.mp3 |

#### BGM Toggle
- System menu includes "BGM" checkbox for ON/OFF
- Setting is persisted to datastore

#### Adding New BGM
1. Place MP3 file in `Source/sounds/` with `bgm_` prefix
2. Add entry to `BGM_FILES` table in `sound.lua`
3. Call `Sound.playBGM("key")` at appropriate scene transitions

### Save Data

Uses `playdate.datastore` for persistence:

```lua
{
    hiScores = {
        ["0"] = 12345,         -- Tutorial clear time (string key!)
        ["1"] = 23456,         -- Stage 1 clear time
        -- ... per-stage hi-scores (string keys for JSON compatibility)
    },
    bgmEnabled = true,         -- BGM ON/OFF setting (default: true)
    lastSelectedStage = 0,     -- Last selected stage index
    sensitivity = "Normal"     -- Crank sensitivity setting
}
```

#### Playdate Datastore JSON Gotcha

**CRITICAL**: `playdate.datastore.write()` uses JSON internally. Lua numeric key 0 is **silently dropped** during serialization because `#t == 0` for `{[0]=val}`.

**Rule**: Always convert numeric keys to strings before saving, and convert back to numbers when loading:

```lua
-- SAVE: numeric → string keys
local hiScoresForSave = {}
for k, v in pairs(GameState.hiScores) do
    hiScoresForSave[tostring(k)] = v
end

-- LOAD: string → numeric keys
for k, v in pairs(loadedScores) do
    local numKey = tonumber(k)
    if numKey ~= nil then
        GameState.hiScores[numKey] = v
    end
end
```

In-game code uses numeric keys (`hiScores[0]`, `hiScores[1]`) for convenience. The conversion happens only at the save/load boundary.

#### Save Functions
- `saveSettings()` - Helper function in game/state.lua to save all settings
- Handles numeric-to-string key conversion automatically
- Called automatically when:
  - Hi-score is updated
  - BGM toggle is changed
  - Crank sensitivity is changed
  - Stage is selected

#### Migration
- Old format `{ hiScore = ... }` is automatically migrated to new format
- Old hi-score is assigned to stage 0 (tutorial)

### System Menu

**IMPORTANT**: Playdate OS allows a maximum of **3 custom menu items**.

Current menu items:
| Item | Type | Description |
|------|------|-------------|
| debug | Checkbox | Toggle debug info display |
| BGM | Checkbox | Toggle background music |
| Crank | Options | Sensitivity (Slow/Normal/Fast/Fastest) |

To add a new menu item, an existing one must be removed.

### Debug Mode Features

When `Debug.enabled` is `true`:
- Debug info displayed on screen (crank position, frame index, etc.)
- Selection screen shows **all stage thumbnails** (not just cleared ones)
- B button long-press (1 second) triggers instant clear in MainGame

## Documentation Standards

### Language Rules
- **README.md**: Japanese (for human readers)
- **CLAUDE.md**: English (for AI assistants)
- **Debug_Notes.md**: English (for AI assistants)

### Formatting
- Keep documentation concise and well-structured
- Use consistent formatting throughout

### Continuous Documentation Updates
**IMPORTANT**: When discovering bugs, unexpected behavior, or useful techniques during development:
1. **Debug_Notes.md**: Record the problem, root cause, solution, and lessons learned
2. **CLAUDE.md**: Update any incorrect information (e.g., API behavior, conversion tables)
3. **README.md**: Update if the discovery affects game mechanics or user-facing features

This ensures knowledge is preserved for future development sessions.

---

## Figma MCP Server Integration

### Project Figma File
- **File**: gurupara-dev2
- **URL**: https://www.figma.com/design/RPdIdZzgpBhSu4izRJN0IG/gurupara-dev2
- **fileKey**: `RPdIdZzgpBhSu4izRJN0IG`

### Page Structure
The Figma file contains a single page with scene frames:

| Frame Name | Node ID | Description |
|------------|---------|-------------|
| Scene/Title | `13:8` | Title screen |
| Scene/Selection | `19:61` | Selection screen |
| Scene/Main/State_OK | `13:23` | Main game - clear result |
| Scene/Main/State_NG | `19:83` | Main game - wrong result |
| Component/Frame_z0 | `17:31` | Reusable selection cursor |

**Scenes Page Node ID**: `13:7`

To fetch a specific scene, use the frame's node ID (e.g., `13:8` for Title screen).

### Figma Naming Convention

#### Structure
```
Scenes (root page)
├── Scene/{SceneName}                    # Full screen scenes
├── Scene/{SceneName}/State_{StateName}  # Scene states/overlays
└── Component/{ComponentName}_z{N}       # Reusable components
```

#### Naming Rules

| Type | Format | Example |
|------|--------|---------|
| Scene | `Scene/{Name}` | `Scene/Title`, `Scene/Selection` |
| Scene State | `Scene/{Scene}/State_{State}` | `Scene/Main/State_OK` |
| Component | `Component/{Name}_z{N}` | `Component/Frame_z0` |

#### Draw Order (z-index)
- Scenes are rendered as background
- Components are rendered on top of scenes
- `_z{N}` suffix indicates draw order among components (lower N = rendered first/behind)

#### Lua File Mapping

| Figma Scene | Lua File |
|-------------|----------|
| Scene/Title | `ui/title.lua` |
| Scene/Selection | `ui/selection.lua` |
| Scene/Main/* | `main.lua` |

### Overview
This project integrates with Figma MCP server to fetch design data directly from Figma and convert it to PlayDate code.

### Design Source of Truth
**IMPORTANT**: Figma is the single source of truth for UI design.
- Always render exactly what is defined in Figma - no more, no less
- Do not add UI elements (text, shapes, etc.) that are not in the Figma design
- If something needs to be added to the UI, it should be added to Figma first

### Verify Connection
```
mcp__figma__whoami
```
Use this to verify connection status and authenticated user information.

### Fetching Design Data

#### 1. Get Metadata (Structure Information)
```
mcp__figma__get_metadata
- fileKey: Extract from Figma URL (e.g., RPdIdZzgpBhSu4izRJN0IG)
- nodeId: Extract from URL (e.g., 1:3, shown as 1-3 in URL)
```
**Output format**: XML
```xml
<frame id="1:3" name="bg" x="0" y="0" width="400" height="240">
  <rounded-rectangle id="1:5" name="Rectangle 2" x="0" y="0" width="91" height="91" />
  <text id="2:15" name="HOGE" x="148" y="103" width="103" height="44" />
</frame>
```

#### 2. Get Design Context (Color & Style Information)
```
mcp__figma__get_design_context
```
**Output format**: React+Tailwind code (includes color information)
```javascript
<div className="absolute bg-black left-0 size-[91px] top-0" />
<div className="absolute bg-[#717171] h-[67px] left-[91px] top-[91px] w-[233px]" />
<p className="text-white text-[36px]">HOGE</p>
```

### Coordinate Validation (IMPORTANT)

**CRITICAL**: When fetching metadata from Figma, check for floating-point coordinate errors.

**Problem**: Figma objects can accumulate floating-point rounding errors through editing operations (move, resize, copy-paste). These "dirty" coordinates cause Figma MCP to report incorrect positions.

**Warning Signs** - Alert the user if you see coordinates like:
```xml
<!-- BAD: Floating-point errors -->
<vector x="367" y="34.00000030597937" width="6.999999805529569" height="181.00000030597937" />

<!-- GOOD: Clean integer values -->
<rounded-rectangle x="360" y="33" width="7" height="182" />
```

**When dirty coordinates are detected:**
1. Warn the user: "This element has floating-point coordinate errors that may cause position mismatches"
2. Suggest fixes:
   - Delete the problematic object and recreate it
   - Manually enter integer values in Figma's right panel (X, Y, W, H fields)
   - Enable "Snap to pixel grid" (View → Snap to pixel grid) for future edits

### Converting Figma Design to PlayDate

#### Color Conversion (1-bit Monochrome)

**IMPORTANT**: `setDitherPattern(alpha, ...)` alpha value is **inversely** related to darkness:
- **Lower alpha = darker** (more black pixels)
- **Higher alpha = lighter** (fewer black pixels)

**CRITICAL**: `setDitherPattern()` depends on the current drawing color set by `setColor()`:
- If current color is **BLACK**: Pattern fills with black pixels at `alpha` opacity
- If current color is **WHITE**: Pattern fills with white pixels at `1 - alpha` opacity

**Always set color before dither pattern:**
```lua
-- CORRECT: Set color explicitly before dither pattern
gfx.setColor(gfx.kColorBlack)
gfx.setDitherPattern(0.5, gfx.image.kDitherTypeBayer8x8)
gfx.fillRect(x, y, w, h)  -- Draws 50% gray (half black pixels)

-- WRONG: Color may be inherited from previous operations
gfx.setDitherPattern(0.5, gfx.image.kDitherTypeBayer8x8)
gfx.fillRect(x, y, w, h)  -- May draw white or black depending on previous state!
```
This is a common source of bugs when drawing shadows or semi-transparent overlays.

| Figma Color | Appearance | PlayDate Equivalent |
|-------------|------------|---------------------|
| #000000 | Black | `gfx.kColorBlack` |
| #404040 | Dark gray (75% black) | `gfx.setDitherPattern(0.25, gfx.image.kDitherTypeBayer8x8)` |
| #808080 | Medium gray (50% black) | `gfx.setDitherPattern(0.50, gfx.image.kDitherTypeBayer8x8)` |
| #BFBFBF | Light gray (25% black) | `gfx.setDitherPattern(0.75, gfx.image.kDitherTypeBayer8x8)` |
| #FFFFFF | White | `gfx.kColorWhite` |

**Recommended Figma Palette for PlayDate:**
Use these exact colors in Figma to match PlayDate's dithering appearance:
- Black: #000000
- Dark gray: #404040
- Medium gray: #808080
- Light gray: #BFBFBF
- White: #FFFFFF

#### Text Conversion
- White text: Use `gfx.setImageDrawMode(gfx.kDrawModeFillWhite)`
- Black text: Use `gfx.setColor(gfx.kColorBlack)` (default)

**Centering Text:**
To center text within a rectangle (e.g., a tile or button), use `gfx.getTextSize()` to calculate the text dimensions:
```lua
local text = "?"
local textWidth, textHeight = gfx.getTextSize(text)
local textX = rectX + (rectWidth - textWidth) / 2
local textY = rectY + (rectHeight - textHeight) / 2
gfx.drawText(text, textX, textY)
```
This ensures the text is centered both horizontally and vertically within the target area.

#### Shape Drawing

**Drawing Circles:**
- `gfx.fillCircleAtPoint()` and `gfx.fillCircleInRect()` may not be available in some environments
- **Workaround**: Use `gfx.fillRoundRect(x, y, width, height, radius)` with `radius = width/2` to create a circle
```lua
-- Instead of: gfx.fillCircleAtPoint(242, 218, 16)
-- Use: gfx.fillRoundRect(226, 202, 32, 32, 16)  -- x-16, y-16, diameter, diameter, radius
```

#### System Fonts (Roobert)

**Project Font**: Roobert (Playdate SDK system font)
- Copied from SDK: `~/Developer/PlaydateSDK/Resources/Fonts/Roobert/`
- Legible, well-hinted font designed for Playdate

**Font Files Location**: `Source/fonts/Roobert/`
- `Roobert-11-Medium.fnt` - 11px (button icons: Ⓐ Ⓑ ✛)
- `Roobert-20-Medium.fnt` - 20px (main text, recommended for dialog)
- `Roobert-24-Medium.fnt` - 24px (headings)

**Button Icon Glyphs** (available in Roobert-11-Medium):
| Glyph | Description | Usage |
|-------|-------------|-------|
| `Ⓐ` | A button | Confirm, Check |
| `Ⓑ` | B button | Cancel, Pause |
| `✛` | D-pad | Grab frame |
| `🟨` | Menu button | System menu |
| `🎣` | Crank | Crank indicator |
| `⬆️` `➡️` `⬇️` `⬅️` | D-pad directions | Directional hints |

**Loading Fonts in Lua**:
```lua
local fontLarge = gfx.font.new("fonts/Roobert/Roobert-24-Medium")
local fontSmall = gfx.font.new("fonts/Roobert/Roobert-20-Medium")
local fontIcon = gfx.font.new("fonts/Roobert/Roobert-11-Medium")

-- Drawing button icons with mixed fonts
gfx.setFont(fontSmall)
gfx.drawText("Press ", x, y)
local pressWidth = gfx.getTextSize("Press ")
gfx.setFont(fontIcon)
gfx.drawText("Ⓐ", x + pressWidth, y + 4)  -- Slight Y offset for alignment
```

#### Coordinates and Size
- Figma coordinates and sizes can be used directly in PlayDate (when using 400x240 resolution)

### Important Notes
- Image files (PNG, etc.) cannot be downloaded directly; manual export from Figma is required
- Grayscale colors are approximated using dithering patterns
- Complex gradients and effects need simplification

---

**IMPORTANT**: Always consult the official documentation before implementing any PlayDate SDK feature. The HTML files in References/ are your primary source of truth.