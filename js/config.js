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
    TICK_STEP_MS: 6,
    TICK_STEP_EVERY: 3, // faster every N apples

    // gameplay
    COMBO_WINDOW_MS: 2500,
    COMBO_MAX: 4,
    POWERUP_CHANCE: 0.14,
    BOSS_FOOD_EVERY: 6,
    OBSTACLE_INTERVAL_MS: 30000,
    DAILY_OBSTACLE_INTERVAL_MS: 45000,

    // boss
    BOSS_HP: 3,
    BOSS_MOVE_TICKS: 3,
    BOSS_CATCH_SPEED_BOOST: 4,
    ICE_EVADE_RADIUS: 4,
    MIRROR_LAG_MS: 800,
    BOMB_MOVE_INTERVAL: 3,
    BOMB_DROP_CHANCE: 0.5,
    BOMB_SEGMENT_LOSS: 3,
    BOSS_ARENA_REVERT_MS: 800,

    // power-up durations / values
    GHOST_MS: 5000,
    SLOWMO_MS: 6000,
    SLOWMO_FACTOR: 1.2,
    SHRINK_AMOUNT: 4,
    POWERUP_EXPIRE_MS: 8000,

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
      bossIce:      0x38bdf8,
      bossMirror:   0x7c3aed,
      bossBomb:     0x991b1b,
      bossPhantom:  0x374151,
      mine:         0xef4444,
      freezeOrb:    0xbae6fd,
      ghost:        0x22d3ee,
      slowmo:       0xa78bfa,
      shield:       0xfbbf24,
      shrink:       0xfb923c,
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
      gold:      '#fbbf24',
      orange:    '#fb923c',
      apple:     '#ff5e7c',
      text:      '#e2e8f0',
      textDim:   '#94a3b8',
      danger:    '#f87171',
    },

    STORAGE_KEY: 'snake2026:v1',
  };
})();
