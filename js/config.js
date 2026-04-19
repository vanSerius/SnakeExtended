// Snake 2026 - global config
window.CONFIG = (() => {
  const GRID_COLS = 17;
  const GRID_ROWS = 24;

  // Logical design size (portrait). Phaser Scale.FIT will letterbox this to any screen.
  const DESIGN_WIDTH = 540;
  const DESIGN_HEIGHT = 960;

  // playfield takes most of the screen, HUD above and below
  const HUD_TOP = 120;
  const HUD_BOTTOM = 80;

  const PLAYFIELD_H = DESIGN_HEIGHT - HUD_TOP - HUD_BOTTOM;
  const CELL_PX = Math.min(
    Math.floor(DESIGN_WIDTH / GRID_COLS),
    Math.floor(PLAYFIELD_H / GRID_ROWS)
  );
  const BOARD_W = CELL_PX * GRID_COLS;
  const BOARD_H = CELL_PX * GRID_ROWS;
  const BOARD_X = Math.floor((DESIGN_WIDTH - BOARD_W) / 2);
  const BOARD_Y = HUD_TOP + Math.floor((PLAYFIELD_H - BOARD_H) / 2);

  return {
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    GRID_COLS,
    GRID_ROWS,
    CELL_PX,
    BOARD_X,
    BOARD_Y,
    BOARD_W,
    BOARD_H,
    HUD_TOP,
    HUD_BOTTOM,

    // tick timing
    TICK_START_MS: 140,
    TICK_MIN_MS: 60,
    TICK_STEP_MS: 4,
    TICK_STEP_EVERY: 5, // faster every N apples

    // gameplay
    COMBO_WINDOW_MS: 2500,
    COMBO_MAX: 4,
    POWERUP_CHANCE: 0.12,
    BOSS_FOOD_EVERY: 10,
    OBSTACLE_INTERVAL_MS: 30000,
    DAILY_OBSTACLE_INTERVAL_MS: 45000,

    // power-up durations
    GHOST_MS: 4000,
    SLOWMO_MS: 5000,
    SLOWMO_FACTOR: 1.8,
    MAGNET_FOODS: 3,
    MAGNET_RANGE: 4,

    // points
    POINTS_APPLE: 10,
    POINTS_BOSS: 50,
    POINTS_BOSS_BONUS: 500,

    // palette
    COLORS: {
      bgDeep:       0x0a0e1a,
      bgSoft:       0x111a2e,
      boardBg:      0x0d1324,
      boardGrid:    0x1a2440,
      snake:        0x4ade80,
      snakeGlow:    0x22d3ee,
      head:         0x86efac,
      apple:        0xff5e7c,
      appleGlow:    0xff9fb3,
      boss:         0xfbbf24,
      bossGlow:     0xfde68a,
      ghost:        0x22d3ee,
      slowmo:       0xa78bfa,
      magnet:       0xf472b6,
      obstacle:     0x475569,
      obstacleHi:   0x94a3b8,
      text:         0xe2e8f0,
      textDim:      0x94a3b8,
      accent:       0x4ade80,
      danger:       0xf87171,
    },

    CSS_COLORS: {
      accent:    '#4ade80',
      cyan:      '#22d3ee',
      violet:    '#a78bfa',
      pink:      '#f472b6',
      gold:      '#fbbf24',
      apple:     '#ff5e7c',
      text:      '#e2e8f0',
      textDim:   '#94a3b8',
      danger:    '#f87171',
    },

    STORAGE_KEY: 'snake2026:v1',
  };
})();
