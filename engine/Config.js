// Config.js - All configurable parameters (transpiled from config/*.lua)

export const Config = {
    // Screen
    SCREEN_WIDTH: 400,
    SCREEN_HEIGHT: 240,

    // Crank
    SENSITIVITY_OPTIONS: [
        { name: "Slow", degrees: 150 },
        { name: "Normal", degrees: 120 },
        { name: "Fast", degrees: 90 },
        { name: "Fastest", degrees: 60 },
    ],
    DEFAULT_SENSITIVITY: "Normal",
    DEGREES_PER_FRAME_QUICK: 20,
    CRANK_IDLE_THRESHOLD: 0.1,
    CRANK_THRESHOLD: 1,
    CRANK_HISTORY_SIZE: 20,

    // Animation durations (in frames at 30fps)
    GRAB_ANIM_DURATION: 10,
    PLACE_ANIM_DURATION: 10,
    CHECK_FRAME_INTERVAL: 3,
    WAIT_RESULT_DURATION: 15,
    THUMBNAIL_ANIM_INTERVAL: 6,

    // Slide animations
    SLIDE_OUT_DURATION: 15,
    SLIDE_IN_DURATION: 10,

    // Main game display
    IMAGE_SIZE: 120,
    MAIN_DISPLAY_SCALE: 2.0,
    THUMBNAIL_DISPLAY_SCALE: 1.0,
    IMAGE_OFFSET_X: 80,
    IMAGE_OFFSET_Y: 20,
    THUMBNAIL_BORDER: 8,
    THUMBNAIL_BORDER_OUTLINE: 4,
    THUMBNAIL_CORNER_RADIUS: 20,
    THUMBNAIL_WAVE_AMPLITUDE: 3,
    THUMBNAIL_WAVE_FREQUENCY: 12,
    THUMBNAIL_WAVE_SPEED: 0.1,

    // Tutorial
    TUTORIAL_STAGE_INDEX: 0,
    TUTORIAL_FRAME_COUNT: 4,
    TUTORIAL_IDLE_THRESHOLD: 45,
    TUTORIAL_STEP_DELAY: 30,
    TUTORIAL_GRAB_HOLD_THRESHOLD: 20,
    TUTORIAL_OVERLAY_WIDTH: 320,
    TUTORIAL_OVERLAY_HEIGHT: 100,
    TUTORIAL_OVERLAY_BORDER: 6,
    TUTORIAL_OVERLAY_SHADOW_OFFSET: 8,

    // Selection
    SELECTION_FRAME_SIZE: 60,
    SELECTION_FRAME_CORNER_LENGTH: 12,
    SELECTION_FRAME_CORNER_WIDTH: 4,
    SELECTION_TILE_SIZE: 50,
    SELECTION_TILE_SPACING: 5,
    SELECTION_GRID_COLS: 7,
    SELECTION_GRID_ROWS: 4,
    SELECTION_CRANK_DEGREES: 30,

    // Hints
    HINT_IDLE_FRAMES: 90,

    // Transition
    TRANSITION_PAGE_COUNT: 6,
    TRANSITION_SPEED: 0.08,

    // Stages info
    STAGES: [
        { index: 0, name: "Fish", folder: "0_Fish", frameCount: 4 },
        { index: 1, name: "Apple", folder: "1_Apple", frameCount: 9 },
        { index: 2, name: "Bounce", folder: "2_Bounce", frameCount: 9 },
    ],
    TOTAL_STAGES: 28,
};
