// PowerUps.js - Ghost, Slow-mo, Magnet
window.PowerUpTypes = {
  GHOST:  { id: 'ghost',  duration: () => window.CONFIG.GHOST_MS,  color: 0x22d3ee, label: 'Ghost' },
  SLOWMO: { id: 'slowmo', duration: () => window.CONFIG.SLOWMO_MS, color: 0xa78bfa, label: 'Slow-Mo' },
  MAGNET: { id: 'magnet', duration: () => 0,                        color: 0xf472b6, label: 'Magnet' },
};

window.PowerUpManager = class {
  constructor() {
    this.active = {
      ghost: 0,
      slowmo: 0,
      magnetCharges: 0,
    };
  }

  apply(type) {
    if (type.id === 'ghost') this.active.ghost = type.duration();
    else if (type.id === 'slowmo') this.active.slowmo = type.duration();
    else if (type.id === 'magnet') this.active.magnetCharges = window.CONFIG.MAGNET_FOODS;
  }

  update(deltaMs) {
    if (this.active.ghost > 0)  this.active.ghost  = Math.max(0, this.active.ghost - deltaMs);
    if (this.active.slowmo > 0) this.active.slowmo = Math.max(0, this.active.slowmo - deltaMs);
  }

  isGhost()  { return this.active.ghost > 0; }
  isSlowmo() { return this.active.slowmo > 0; }
  hasMagnet() { return this.active.magnetCharges > 0; }
  consumeMagnet() {
    if (this.active.magnetCharges > 0) this.active.magnetCharges -= 1;
  }

  tickMultiplier() {
    return this.isSlowmo() ? window.CONFIG.SLOWMO_FACTOR : 1;
  }

  pickRandom(rng) {
    const roll = rng();
    if (roll < 0.34) return window.PowerUpTypes.GHOST;
    if (roll < 0.67) return window.PowerUpTypes.SLOWMO;
    return window.PowerUpTypes.MAGNET;
  }
};
