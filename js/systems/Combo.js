// Combo.js - time-windowed multiplier
window.Combo = class {
  constructor() {
    this.multiplier = 1;
    this.timer = 0; // ms remaining
  }

  registerEat() {
    this.multiplier = Math.min(window.CONFIG.COMBO_MAX, this.multiplier + 1);
    this.timer = window.CONFIG.COMBO_WINDOW_MS;
    return this.multiplier;
  }

  update(deltaMs) {
    if (this.timer <= 0) return false;
    this.timer -= deltaMs;
    if (this.timer <= 0) {
      this.multiplier = 1;
      this.timer = 0;
      return true; // expired
    }
    return false;
  }

  progress() {
    if (this.timer <= 0) return 0;
    return this.timer / window.CONFIG.COMBO_WINDOW_MS;
  }

  reset() {
    this.multiplier = 1;
    this.timer = 0;
  }
};
