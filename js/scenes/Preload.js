// Preload.js - generates all textures procedurally, no asset downloads
window.PreloadScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Preload' }); }

  create() {
    const CFG = window.CONFIG;
    const size = CFG.CELL_PX;

    this._makeRoundRect('snake-body', size, size, Math.floor(size * 0.3), CFG.COLORS.snake);
    this._makeRoundRect('snake-head', size, size, Math.floor(size * 0.35), CFG.COLORS.head);
    this._makeRoundRect('obstacle',   size, size, Math.floor(size * 0.2), CFG.COLORS.obstacle, CFG.COLORS.obstacleHi);

    this._makeGlowOrb('apple-orb',   size, CFG.COLORS.apple,     CFG.COLORS.appleGlow);
    this._makeGlowOrb('boss-orb',    size, CFG.COLORS.boss,      CFG.COLORS.bossGlow);
    this._makeGlowOrb('pu-ghost',    size, CFG.COLORS.ghost,     0xa5f3fc);
    this._makeGlowOrb('pu-slowmo',   size, CFG.COLORS.slowmo,    0xddd6fe);
    this._makeGlowOrb('pu-magnet',   size, CFG.COLORS.magnet,    0xfbcfe8);

    this._makeParticle('particle-trail', 24, CFG.COLORS.snake, CFG.COLORS.snakeGlow);
    this._makeParticle('particle-spark', 20, 0xfde68a, 0xfef9c3);

    this._makeBackground('bg-gradient', CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT);

    this.scene.start('MainMenu');
  }

  _makeRoundRect(key, w, h, radius, fillColor, borderColor = null) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this._hex(fillColor);
    this._roundPath(ctx, 1, 1, w - 2, h - 2, radius);
    ctx.fill();
    if (borderColor !== null) {
      ctx.strokeStyle = this._hex(borderColor);
      ctx.lineWidth = 2;
      this._roundPath(ctx, 1, 1, w - 2, h - 2, radius);
      ctx.stroke();
    }
    this.textures.addCanvas(key, canvas);
  }

  _roundPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _makeGlowOrb(key, size, core, glow) {
    const s = size * 2;
    const canvas = document.createElement('canvas');
    canvas.width = s; canvas.height = s;
    const ctx = canvas.getContext('2d');
    const cx = s / 2, cy = s / 2;
    const outer = s / 2;
    const grad = ctx.createRadialGradient(cx, cy, outer * 0.1, cx, cy, outer);
    grad.addColorStop(0, this._rgba(core, 1));
    grad.addColorStop(0.45, this._rgba(glow, 0.6));
    grad.addColorStop(1, this._rgba(glow, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // bright core
    ctx.fillStyle = this._rgba(0xffffff, 0.9);
    ctx.beginPath();
    ctx.arc(cx - outer * 0.15, cy - outer * 0.2, outer * 0.15, 0, Math.PI * 2);
    ctx.fill();
    this.textures.addCanvas(key, canvas);
  }

  _makeParticle(key, size, core, glow) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, this._rgba(core, 1));
    grad.addColorStop(0.5, this._rgba(glow, 0.5));
    grad.addColorStop(1, this._rgba(glow, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    this.textures.addCanvas(key, canvas);
  }

  _makeBackground(key, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    // base
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#0a0e1a');
    base.addColorStop(1, '#111a2e');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // radial glows
    const g1 = ctx.createRadialGradient(w * 0.2, h * 0.25, 20, w * 0.2, h * 0.25, w * 0.6);
    g1.addColorStop(0, 'rgba(74, 222, 128, 0.18)');
    g1.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    const g2 = ctx.createRadialGradient(w * 0.85, h * 0.8, 20, w * 0.85, h * 0.8, w * 0.7);
    g2.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
    g2.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    const g3 = ctx.createRadialGradient(w * 0.5, h * 0.55, 10, w * 0.5, h * 0.55, w * 0.5);
    g3.addColorStop(0, 'rgba(34, 211, 238, 0.10)');
    g3.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, w, h);

    this.textures.addCanvas(key, canvas);
  }

  _hex(n) {
    return '#' + n.toString(16).padStart(6, '0');
  }
  _rgba(n, a) {
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r},${g},${b},${a})`;
  }
};
