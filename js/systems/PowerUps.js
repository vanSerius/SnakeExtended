// PowerUps.js - Ghost, Slow-Mo, Shield, Shrink
window.PowerUpTypes = {
  GHOST:  { id: 'ghost',  color: 0x22d3ee, label: 'Ghost' },
  SLOWMO: { id: 'slowmo', color: 0xa78bfa, label: 'Slow-Mo' },
  SHIELD: { id: 'shield', color: 0xfbbf24, label: 'Shield' },
  SHRINK: { id: 'shrink', color: 0xfb923c, label: 'Shrink' },
};

window.PowerUpManager = class {
  constructor() {
    this.active = {
      ghost: 0,
      slowmo: 0,
      shield: false,
    };
  }

  apply(type) {
    if (type.id === 'ghost')  this.active.ghost  = window.CONFIG.GHOST_MS;
    if (type.id === 'slowmo') this.active.slowmo = window.CONFIG.SLOWMO_MS;
    if (type.id === 'shield') this.active.shield = true;
    // shrink is instant — handled directly in Game.js
  }

  update(deltaMs) {
    if (this.active.ghost > 0)  this.active.ghost  = Math.max(0, this.active.ghost  - deltaMs);
    if (this.active.slowmo > 0) this.active.slowmo = Math.max(0, this.active.slowmo - deltaMs);
  }

  isGhost()  { return this.active.ghost > 0; }
  isSlowmo() { return this.active.slowmo > 0; }
  hasShield() { return this.active.shield; }
  consumeShield() { this.active.shield = false; }

  tickMultiplier() {
    return this.isSlowmo() ? window.CONFIG.SLOWMO_FACTOR : 1;
  }

  pickRandom(rng) {
    const roll = rng();
    if (roll < 0.28) return window.PowerUpTypes.GHOST;
    if (roll < 0.56) return window.PowerUpTypes.SLOWMO;
    if (roll < 0.78) return window.PowerUpTypes.SHIELD;
    return window.PowerUpTypes.SHRINK;
  }
};
