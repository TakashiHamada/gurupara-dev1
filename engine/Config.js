// Config.js - All configurable parameters (transpiled from config/*.lua)

export const Config = {
    // Screen
    SCREEN_WIDTH: 400,
    SCREEN_HEIGHT: 240,

    // Crank (matched to production config/crank.lua)
    SENSITIVITY_OPTIONS: [
        { name: "Slow", degrees: 150 },
        { name: "Normal", degrees: 120 },
        { name: "Fast", degrees: 90 },
        { name: "Fastest", degrees: 60 },
    ],
    DEFAULT_SENSITIVITY: "Normal",
    DEGREES_PER_FRAME_QUICK: 60,
    CRANK_IDLE_THRESHOLD: 2,
    CRANK_THRESHOLD: 5,
    CRANK_HISTORY_SIZE: 10,

    // Animation durations (in frames at 30fps)
    FLIP_COOLDOWN_FRAMES: 6,
    GRAB_ANIM_DURATION: 10,
    PLACE_ANIM_DURATION: 10,
    CHECK_FRAME_INTERVAL: 3,
    CHECK_FLASH_ALPHA: 0.5,
    WAIT_RESULT_DURATION: 15,
    THUMBNAIL_ANIM_INTERVAL: 6,

    // NG evaluation
    NG_FAR_THRESHOLD: 2,

    // Answer animation (character reaction)
    ANSWER_ANIM_FRAME_COUNT: 5,
    ANSWER_ANIM_FRAME_INTERVAL: 3,
    ANSWER_ANIM_HOLD_DURATION: 12,

    // Answer animation position
    GOOD_ANIM_X: 280,
    GOOD_ANIM_Y: 120,
    TUTORIAL_GOOD_ANIM_Y: 150,

    // NG message box
    NG_BOX_X: 44,
    NG_BOX_Y: 40,
    NG_BOX_SHADOW_OFFSET: 12,

    // Slide animations
    SLIDE_OUT_DURATION: 15,
    SLIDE_IN_DURATION: 10,
    SLIDE_EDGE_MIN: 0,
    SLIDE_EDGE_MAX: 4,
    SLIDE_EDGE_CURVE: 8,
    SLIDE_SHADOW_MIN: 0,
    SLIDE_SHADOW_MAX: 128,
    SLIDE_OUT_SHADOW_ALPHA: 0.4,
    SLIDE_IN_SHADOW_ALPHA_START: 1.0,
    SLIDE_IN_SHADOW_ALPHA_END: 0.4,
    SLIDE_SCALE_Y_MIN: 1.0,
    SLIDE_SCALE_Y_MAX: 2.0,

    // Main game display
    IMAGE_SIZE: 120,
    MAIN_DISPLAY_SCALE: 2.0,
    MAIN_DISPLAY_SIZE: 240,
    THUMBNAIL_DISPLAY_SCALE: 1.0,
    IMAGE_OFFSET_X: 80,
    IMAGE_OFFSET_Y: 20,

    // Thumbnail (grabbed frame)
    THUMBNAIL_SCALE: 0.5,
    THUMBNAIL_X: -20,
    THUMBNAIL_Y: -4,
    THUMBNAIL_BORDER: 8,
    THUMBNAIL_BORDER_OFFSET: 10,
    THUMBNAIL_BORDER_OUTLINE: 4,
    THUMBNAIL_CORNER_RADIUS: 20,
    THUMBNAIL_WAVE_AMPLITUDE: 3,
    THUMBNAIL_WAVE_FREQUENCY: 12,
    THUMBNAIL_WAVE_SPEED: 0.6,
    THUMBNAIL_BORDER_SCALE_START: 4.0,

    // Rewind icon (top-left, production style)
    REWIND_ICON_SIZE: 24,
    REWIND_ICON_PADDING_TOP: 8,
    REWIND_ICON_PADDING_BOTTOM: 8,
    REWIND_ICON_PADDING_LEFT: 16,
    REWIND_ICON_PADDING_RIGHT: 20,
    REWIND_ICON_MARGIN: 6,

    // Tutorial (10-step progressive system from production)
    TUTORIAL_STAGE_INDEX: 0,
    TUTORIAL_TOTAL_STEPS: 10,
    TUTORIAL_IDLE_THRESHOLD: 45,
    TUTORIAL_CORRECT_IDLE_THRESHOLD: 20,
    TUTORIAL_CRANK_FRAMES_REQUIRED: 3,
    TUTORIAL_INTERACTIVE_DISPLAY_DURATION: 90,
    TUTORIAL_OVERLAY_DELAY: 15,
    TUTORIAL_CRANK_INDICATOR_DELAY: 22,
    TUTORIAL_CRANK_UNLOCK_STEP: 4,
    TUTORIAL_DPAD_UNLOCK_STEP: 8,
    TUTORIAL_CHECK_UNLOCK_STEP: 10,
    TUTORIAL_OVERLAY_WIDTH: 320,
    TUTORIAL_OVERLAY_HEIGHT: 100,
    TUTORIAL_STOP_OVERLAY_WIDTH: 380,
    TUTORIAL_STOP_OVERLAY_HEIGHT: 200,
    TUTORIAL_OVERLAY_BORDER: 6,
    TUTORIAL_OVERLAY_SHADOW_OFFSET: 8,
    TUTORIAL_STEP_TYPE: {
        1: "stop",
        2: "stop",
        3: "stop",
        4: "interactive",
        5: "stop",
        6: "stop",
        7: "stop",
        8: "interactive",
        9: "interactive",
        10: "interactive",
    },
    TUTORIAL_STEP_TEXT: {
        1: ["Welcome to", "Flip-Flap Crank!"],
        2: ["Arrange the frames", "in the correct order!"],
        3: ["First, try pressing", "the arrow keys!"],
        4: null,  // Crank indicator only
        5: ["Hold [Space]", "to grab a frame"],
        6: ["Use arrow keys", "to move the frame"],
        7: ["Release [Space]", "to place it"],
        8: ["Grab with [Space]", null],
        9: ["Use arrow keys to swap", null],
        10: ["Press [Enter] to check!", null],
    },
    TUTORIAL_STOP_PAGE: {
        1: [1, 3],
        2: [2, 3],
        3: [3, 3],
        5: [1, 3],
        6: [2, 3],
        7: [3, 3],
    },
    FIRST_GAME_HINT_TEXT: ["This puzzle has 9 frames!", "Good luck!"],

    // Celebration (confetti)
    CELEBRATION_VOICE_DELAY: 30,
    CELEBRATION_TITLE_PHASE: 50,
    CELEBRATION_PARTICLE_COUNT: 40,
    CELEBRATION_GRAVITY: 0.25,
    CELEBRATION_LEFT_X: 20,
    CELEBRATION_RIGHT_X: 380,
    CELEBRATION_CRACKER_Y: 240,
    CELEBRATION_TITLE_PAD_X: 24,
    CELEBRATION_TITLE_PAD_Y: 4,
    CELEBRATION_PARTICLE_MIN_SIZE: 4,
    CELEBRATION_PARTICLE_MAX_SIZE: 8,
    CELEBRATION_PARTICLE_OUTLINE: 1,
    CELEBRATION_VX_BASE: -2,
    CELEBRATION_VX_RANGE: 10,
    CELEBRATION_VY_BASE: -4,
    CELEBRATION_VY_RANGE: 9,

    // Pause screen layout
    PAUSE_BOX_X: 24,
    PAUSE_BOX_Y: 4,
    PAUSE_BOX_W: 360,
    PAUSE_BOX_H: 226,
    PAUSE_BOX_BORDER: 6,
    PAUSE_BOX_SHADOW: 7,
    PAUSE_TIME_FONT_SIZE: 72,
    PAUSE_TIME_TOP_MARGIN: 80,
    PAUSE_BEST_TOP_GAP: 2,
    PAUSE_PROMPT_Y: 140,
    PAUSE_PROMPT_LINE_SPACING: 22,
    PAUSE_LABEL_OFFSET_Y: 6,

    // Title screen (matched to production config/animation.lua)
    TITLE_ANIM_FRAME_COUNT: 16,
    TITLE_ANIM_FRAME_INTERVAL: 5,
    TITLE_MENU_Y: 172,
    TITLE_PRESS_INFO_Y: 212,
    TITLE_PRESS_INFO_AMPLITUDE: 3,
    TITLE_MENU_ARROW_SIZE: 6,
    TITLE_MENU_ARROW_GAP: 8,
    TITLE_MENU_ARROW_SPEED: 0.8,
    TITLE_MENU_CRANK_DEGREES: 60,
    TITLE_BG_DOT_SPACING: 32,
    TITLE_BG_DOT_RADIUS: 8,
    TITLE_BG_SCROLL_SPEED: 0.3,
    TITLE_BG_DOT_INTRO_FRAMES: 6,

    // Sound (matched to production config/sound.lua)
    SE_VOLUME: 0.8,
    BGM_VOLUME: 0.5,
    BGM_PAUSE_VOLUME: 0.17,
    BGM_RESULT_FADE_IN_FRAMES: 30,
    BGM_PAUSE_FADE_FRAMES: 9,

    // Selection
    SELECTION_FRAME_SIZE: 120,
    SELECTION_FRAME_CORNER_LENGTH: 24,
    SELECTION_FRAME_CORNER_WIDTH: 8,
    SELECTION_TILE_SIZE: 100,
    SELECTION_TILE_SPACING: 5,
    SELECTION_GRID_COLS: 7,
    SELECTION_GRID_ROWS: 4,
    SELECTION_CRANK_DEGREES: 30,

    // Game hints (bottom-left: grab/check, bottom-right: flip keys)
    HINT_IDLE_FRAMES: 60,
    HINT_FONT_SIZE: 12,
    HINT_LINE_HEIGHT: 16,
    HINT_MARGIN_X: 8,
    HINT_MARGIN_BOTTOM: 8,

    // Transition
    TRANSITION_PAGE_COUNT: 6,
    TRANSITION_SPEED: 0.08,

    // Secret combo
    SECRET_COMBO_TIMEOUT: 60,

    // Clear animation
    CLEAR_ANIM_LOOPS: 2,
    CLEAR_ANIM_FRAME_INTERVAL: 4,

    // Stages info (updated: tutorial is 0_Egg, not 0_Fish)
    STAGES: [
        { index: 0, name: "Egg", folder: "0_Egg", frameCount: 4 },
        { index: 1, name: "Apple", folder: "1_Apple", frameCount: 9 },
        { index: 2, name: "Bounce", folder: "2_Bounce", frameCount: 9 },
    ],
    TOTAL_STAGES: 28,
    FINAL_STAGE_INDEX: 27,
};
