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
    this._makePuGhost('pu-ghost',   size, CFG.COLORS.ghost);
    this._makePuSlowmo('pu-slowmo', size, CFG.COLORS.slowmo);
    this._makePuShield('pu-shield', size, CFG.COLORS.shield);
    this._makePuShrink('pu-shrink', size, CFG.COLORS.shrink);

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

  // --- Dedicated power-up icons (not orbs) ---

  _puCanvas(size) {
    const s = size * 2;
    const canvas = document.createElement('canvas');
    canvas.width = s; canvas.height = s;
    return { canvas, ctx: canvas.getContext('2d'), s, cx: s / 2, cy: s / 2 };
  }

  _puGlow(ctx, cx, cy, s, r, g, b) {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, s * 0.48);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  }

  _makePuGhost(key, size, color) {
    const { canvas, ctx, s, cx, cy } = this._puCanvas(size);
    const [r, g, b] = [color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff];
    this._puGlow(ctx, cx, cy, s, r, g, b);

    const br = s * 0.3;
    const by = cy - s * 0.04;

    // Ghost silhouette
    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.beginPath();
    ctx.arc(cx, by - br * 0.05, br, Math.PI, 0, false);
    const botY = by + br * 0.95;
    ctx.lineTo(cx + br, botY);
    // 3 wavy bumps along the bottom (right to left)
    const scW = (br * 2) / 3;
    ctx.quadraticCurveTo(cx + br - scW * 0.5, botY + br * 0.38, cx + br - scW, botY);
    ctx.quadraticCurveTo(cx + br - scW * 1.5, botY + br * 0.38, cx, botY);
    ctx.quadraticCurveTo(cx - scW * 0.5,      botY + br * 0.38, cx - br + scW, botY);
    ctx.quadraticCurveTo(cx - br + scW * 0.5, botY + br * 0.38, cx - br, botY);
    ctx.closePath();
    ctx.fill();

    // Eyes
    const ey = by - br * 0.18;
    ctx.fillStyle = 'rgba(5,15,35,0.92)';
    ctx.beginPath();
    ctx.ellipse(cx - br * 0.28, ey, br * 0.14, br * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + br * 0.28, ey, br * 0.14, br * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx - br * 0.22, ey - br * 0.07, br * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + br * 0.34, ey - br * 0.07, br * 0.06, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas(key, canvas);
  }

  _makePuSlowmo(key, size, color) {
    const { canvas, ctx, s, cx, cy } = this._puCanvas(size);
    const [r, g, b] = [color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff];
    this._puGlow(ctx, cx, cy, s, r, g, b);

    const hw = s * 0.30;   // half-width
    const hh = s * 0.35;   // half-height
    const neck = s * 0.055;
    const barH = s * 0.055;

    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;

    // Top cap
    ctx.fillRect(cx - hw - s * 0.04, cy - hh, (hw + s * 0.04) * 2, barH);
    // Bottom cap
    ctx.fillRect(cx - hw - s * 0.04, cy + hh - barH, (hw + s * 0.04) * 2, barH);

    // Top glass (triangle)
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy - hh + barH);
    ctx.lineTo(cx + hw, cy - hh + barH);
    ctx.lineTo(cx + neck, cy - neck);
    ctx.lineTo(cx - neck, cy - neck);
    ctx.closePath();
    ctx.fill();

    // Bottom glass (inverted triangle)
    ctx.beginPath();
    ctx.moveTo(cx - neck, cy + neck);
    ctx.lineTo(cx + neck, cy + neck);
    ctx.lineTo(cx + hw, cy + hh - barH);
    ctx.lineTo(cx - hw, cy + hh - barH);
    ctx.closePath();
    ctx.fill();

    // Sand in top (light fill, ~60% full)
    ctx.fillStyle = `rgba(221,214,254,0.72)`;
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.82, cy - hh + barH + s * 0.02);
    ctx.lineTo(cx + hw * 0.82, cy - hh + barH + s * 0.02);
    ctx.lineTo(cx + neck * 0.6, cy - neck * 1.4);
    ctx.lineTo(cx - neck * 0.6, cy - neck * 1.4);
    ctx.closePath();
    ctx.fill();

    // Sand pile at bottom
    ctx.beginPath();
    ctx.ellipse(cx, cy + hh - barH - s * 0.04, hw * 0.5, s * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas(key, canvas);
  }

  _makePuShield(key, size, color) {
    const { canvas, ctx, s, cx, cy } = this._puCanvas(size);
    const [r, g, b] = [color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff];
    this._puGlow(ctx, cx, cy - s * 0.04, s, r, g, b);

    const sw = s * 0.32;
    const topY  = cy - s * 0.36;
    const midY  = cy + s * 0.06;
    const botY  = cy + s * 0.38;

    // Shield body
    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.beginPath();
    ctx.moveTo(cx - sw, topY);
    ctx.lineTo(cx + sw, topY);
    ctx.quadraticCurveTo(cx + sw, midY, cx, botY);
    ctx.quadraticCurveTo(cx - sw, midY, cx - sw, topY);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    const iw = sw * 0.68;
    ctx.fillStyle = `rgba(254,243,199,0.42)`;
    ctx.beginPath();
    ctx.moveTo(cx - iw, topY + s * 0.04);
    ctx.lineTo(cx + iw, topY + s * 0.04);
    ctx.quadraticCurveTo(cx + iw, midY - s * 0.02, cx, botY - s * 0.09);
    ctx.quadraticCurveTo(cx - iw, midY - s * 0.02, cx - iw, topY + s * 0.04);
    ctx.closePath();
    ctx.fill();

    // Cross emblem
    const cs = s * 0.055;
    const crossCY = cy - s * 0.04;
    ctx.fillStyle = `rgba(${r},${g},${b},0.88)`;
    ctx.fillRect(cx - cs, crossCY - s * 0.19, cs * 2, s * 0.38);
    ctx.fillRect(cx - s * 0.14, crossCY - cs, s * 0.28, cs * 2);

    this.textures.addCanvas(key, canvas);
  }

  _makePuShrink(key, size, color) {
    const { canvas, ctx, s, cx, cy } = this._puCanvas(size);
    const [r, g, b] = [color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff];
    this._puGlow(ctx, cx, cy, s, r, g, b);

    ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.fillStyle   = `rgba(${r},${g},${b},0.95)`;
    ctx.lineWidth   = s * 0.075;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const outer    = s * 0.35;
    const inner    = s * 0.13;
    const headSize = s * 0.13;

    // 4 diagonal inward arrows
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
      const fx = cx + dx * outer;
      const fy = cy + dy * outer;
      const tx = cx + dx * inner;
      const ty = cy + dy * inner;

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      const ang = Math.atan2(ty - fy, tx - fx);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - headSize * Math.cos(ang - 0.52), ty - headSize * Math.sin(ang - 0.52));
      ctx.lineTo(tx - headSize * Math.cos(ang + 0.52), ty - headSize * Math.sin(ang + 0.52));
      ctx.closePath();
      ctx.fill();
    });

    // Central dot
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.07, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas(key, canvas);
  }
};
