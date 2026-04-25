// MainMenu.js – Neon Vibes: reference-faithful + live snake
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CX = 270, W = 540, H = 960;

    this.add.image(CX, H / 2, 'bg-gradient');
    this._drawStars(W, H);
    this._drawBgRings(CX, 450);

    // Snake initialised BEFORE the UI so it renders behind all buttons/text
    this._snakeT       = 0;
    this._snakeHistory = [];
    this._snakeSegs    = [];
    this._initSnake();

    this._buildTitle(CX);
    this._buildBestScore(CX);
    this._buildPlayButton(CX, 440);
    this._buildSecondaryButtons(CX, 562);
    this._buildFooter(CX, H);
    this._startMusic();
  }

  update(_time, delta) {
    this._tickSnake(delta);
  }

  // ── Live snake ────────────────────────────────────────────────────────────────

  _initSnake() {
    const N = 18;
    const SPACING = 8;   // history frames between consecutive segments
    const colors = [
      0x86efac, 0x4ade80, 0x34d399, 0xa3e635,
      0xfde047, 0xfbbf24, 0xf97316, 0xef4444,
      0xec4899, 0xc026d3, 0xa855f7, 0x7c3aed,
      0x6366f1, 0x3b82f6, 0x22d3ee, 0x06b6d4,
      0x0ea5e9, 0x38bdf8,
    ];

    // Pre-fill history so the snake starts with its full shape visible
    for (let f = 0; f <= N * SPACING + 30; f++) {
      const pt = -(f / 60);
      this._snakeHistory.push(this._pathAt(pt));
    }

    // Body segments first (lowest z-order among snake objects)
    for (let i = N - 1; i >= 1; i--) {
      const r   = Math.max(11 - i * 0.55, 3.5);
      const col = colors[Math.min(i, colors.length - 1)];
      this._snakeSegs[i] = this.add.circle(-300, -300, r, col, 0.9);
    }

    // Head container (highest z-order → renders on top of body)
    const headR   = 11;
    const headCol = colors[0];
    const head    = this.add.container(-300, -300);

    head.add(this.add.circle(0, 0, headR + 5, headCol, 0.18)); // outer glow
    head.add(this.add.circle(0, 0, headR, headCol, 1));
    head.add(this.add.circle(4,  -4, 2.4, 0x052e14, 1));       // left eye
    head.add(this.add.circle(9.5, -4, 2.4, 0x052e14, 1));      // right eye
    head.add(this.add.circle(4.8, -4.8, 0.85, 0xffffff, 0.85));// shine L
    head.add(this.add.circle(10.3, -4.8, 0.85, 0xffffff, 0.85));// shine R
    const tg = this.add.graphics();
    tg.lineStyle(1.6, 0xff5e7c, 1);
    tg.lineBetween(headR, 0, headR + 6, 0);
    tg.lineBetween(headR + 6, 0, headR + 10, -3);
    tg.lineBetween(headR + 6, 0, headR + 10,  3);
    head.add(tg);
    this._snakeSegs[0] = head;

    // Fade in smoothly
    const all = this._snakeSegs.filter(Boolean);
    all.forEach(s => s.setAlpha(0));
    this.tweens.add({ targets: all, alpha: 1, duration: 1200, ease: 'Linear' });

    this._SNAKE_N       = N;
    this._SNAKE_SPACING = SPACING;
  }

  // Lissajous path — different x/y periods so the figure never repeats quickly
  _pathAt(t) {
    return {
      x: 270 + 206 * Math.sin(t * 0.38),
      y: 490 + 358 * Math.sin(t * 0.23 + 1.1),
    };
  }

  _tickSnake(delta) {
    this._snakeT += delta * 0.001;
    const pos = this._pathAt(this._snakeT);

    // Push current head position to front of history
    this._snakeHistory.unshift(pos);
    if (this._snakeHistory.length > 600) this._snakeHistory.pop();

    const N       = this._SNAKE_N;
    const SPACING = this._SNAKE_SPACING;
    const head    = this._snakeSegs[0];

    // Head: position + rotate to face direction of travel
    head.setPosition(pos.x, pos.y);
    if (this._snakeHistory.length > 1) {
      const prev = this._snakeHistory[1];
      const dx = pos.x - prev.x, dy = pos.y - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.01) {
        head.setRotation(Math.atan2(dy, dx));
      }
    }

    // Body: each segment follows N frames behind
    for (let i = 1; i < N; i++) {
      const idx = Math.min(i * SPACING, this._snakeHistory.length - 1);
      const p   = this._snakeHistory[idx];
      this._snakeSegs[i].setPosition(p.x, p.y);
    }
  }

  // ── Background stars ──────────────────────────────────────────────────────────

  _drawStars(W, H) {
    for (let i = 0; i < 34; i++) {
      const s = this.add.circle(
        Math.random() * W, Math.random() * H,
        0.6 + Math.random() * 1.4, 0xffffff, 1
      ).setAlpha(0.08);
      this.tweens.add({
        targets: s, alpha: { from: 0.04, to: 0.55 },
        duration: 900 + Math.random() * 2400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Math.random() * 3000,
      });
    }
  }

  // ── Subtle concentric arcs behind buttons ─────────────────────────────────────

  _drawBgRings(cx, cy) {
    const g = this.add.graphics().setAlpha(0.07);
    [140, 200, 262, 328].forEach(r => {
      g.lineStyle(1, 0x22d3ee, 1);
      g.strokeCircle(cx, cy, r);
    });
  }

  // ── SNAKE title – per-letter neon tube effect ─────────────────────────────────

  _buildTitle(CX) {
    const titleY = 190;
    const letters = [
      { ch: 'S', col: 0x4ade80, css: '#4ade80', x: 82 },
      { ch: 'N', col: 0xfbbf24, css: '#fbbf24', x: 176 },
      { ch: 'A', col: 0xf97316, css: '#f97316', x: 270 },
      { ch: 'K', col: 0xa855f7, css: '#a855f7', x: 364 },
      { ch: 'E', col: 0x22d3ee, css: '#22d3ee', x: 458 },
    ];

    const byLetter = letters.map(() => []);

    // Outer halos (rendered below main text)
    letters.forEach((d, i) => {
      const t = this.add.text(d.x, titleY, d.ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: '90px', color: d.css, fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.13).setBlendMode(Phaser.BlendModes.ADD).setScale(1.36);
      byLetter[i].push(t);
    });

    // Inner halos
    letters.forEach((d, i) => {
      const t = this.add.text(d.x, titleY, d.ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: '90px', color: d.css, fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.34).setBlendMode(Phaser.BlendModes.ADD).setScale(1.1);
      byLetter[i].push(t);
    });

    // Main letters – white core + coloured shadow = neon tube look
    letters.forEach((d, i) => {
      const t = this.add.text(d.x, titleY, d.ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: '90px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setShadow(0, 0, d.css, 28, true, true);
      byLetter[i].push(t);
    });

    // Staggered bounce
    byLetter.forEach((layers, i) => {
      layers.forEach(t => {
        const base = t.y;
        this.tweens.add({
          targets: t, y: { from: base + 4, to: base - 10 },
          duration: 680, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut', delay: i * 125,
        });
      });
    });

    // "— VIBES —"
    const vibes = this.add.text(CX, 270, '—  VIBES  —', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '22px', color: '#f472b6', letterSpacing: 6,
    }).setOrigin(0.5).setShadow(0, 0, '#f472b6', 18, true, true);
    this.tweens.add({ targets: vibes, alpha: { from: 0.65, to: 1 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(CX, 304, '26', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '15px', color: '#475569', letterSpacing: 6,
    }).setOrigin(0.5);
  }

  // ── Best score badge ──────────────────────────────────────────────────────────

  _buildBestScore(CX) {
    const best = window.Storage.getBest('journey');
    if (best <= 0) return;

    const chip = this.add.container(CX, 346);
    const g = this.add.graphics();
    g.fillStyle(0x0d1324, 0.92);
    g.fillRoundedRect(-82, -18, 164, 36, 18);
    g.lineStyle(1.5, 0xfbbf24, 0.65);
    g.strokeRoundedRect(-82, -18, 164, 36, 18);
    const t = this.add.text(0, 0, `★  BEST  ${best}`, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '14px', color: '#fbbf24',
    }).setOrigin(0.5);
    chip.add([g, t]);
  }

  // ── PLAY button with rainbow border ──────────────────────────────────────────

  _buildPlayButton(CX, y) {
    const w = 362, h = 78, r = 18;
    const container = this.add.container(CX, y);

    const fill = this.add.graphics();
    fill.fillStyle(0x060d1c, 1);
    fill.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    const border = this.add.graphics();
    this._drawRainbowBorder(border, 0, 0, w, h, r, 3);

    const glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.1);
    glow.fillStyle(0xffffff, 1);
    glow.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, r - 2);

    const text = this.add.text(0, 1, 'PLAY', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '34px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 12,
    }).setOrigin(0.5).setShadow(0, 0, '#ffffff', 12, true, true);

    container.add([fill, border, glow, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: glow, alpha: { from: 0.06, to: 0.22 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.04, duration: 120 }));
    container.on('pointerout',  () => this.tweens.add({ targets: container, scale: 1,    duration: 120 }));
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true });
      window.AudioFX.clickSfx();
      window.FX.vibrate(15);
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });
  }

  _drawRainbowBorder(g, cx, cy, w, h, r, lw) {
    const hw = w / 2, hh = h / 2;
    const pts = [];
    const arc = (acx, acy, startA, endA, steps) => {
      for (let i = 0; i <= steps; i++) {
        const a = startA + (i / steps) * (endA - startA);
        pts.push([acx + Math.cos(a) * r, acy + Math.sin(a) * r]);
      }
    };
    for (let i = 0; i <= 14; i++) pts.push([cx - hw + r + (i / 14) * (w - 2 * r), cy - hh]);
    arc(cx + hw - r, cy - hh + r, -Math.PI / 2, 0, 8);
    for (let i = 1; i <= 8; i++) pts.push([cx + hw, cy - hh + r + (i / 8) * (h - 2 * r)]);
    arc(cx + hw - r, cy + hh - r, 0, Math.PI / 2, 8);
    for (let i = 1; i <= 14; i++) pts.push([cx + hw - r - (i / 14) * (w - 2 * r), cy + hh]);
    arc(cx - hw + r, cy + hh - r, Math.PI / 2, Math.PI, 8);
    for (let i = 1; i <= 8; i++) pts.push([cx - hw, cy + hh - r - (i / 8) * (h - 2 * r)]);
    arc(cx - hw + r, cy - hh + r, Math.PI, 3 * Math.PI / 2, 8);
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      g.lineStyle(lw, this._rainbowAt(i / n), 1);
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % n];
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  _rainbowAt(t) {
    const stops = [
      [0xf472b6, 0], [0xef4444, 0.14], [0xfbbf24, 0.28],
      [0xa855f7, 0.44], [0x3b82f6, 0.60], [0x22d3ee, 0.74],
      [0x4ade80, 0.88], [0xf472b6, 1],
    ];
    let prev = stops[0], next = stops[1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][1] && t <= stops[i + 1][1]) { prev = stops[i]; next = stops[i + 1]; break; }
    }
    const lt = (next[1] === prev[1]) ? 0 : (t - prev[1]) / (next[1] - prev[1]);
    const lerp = (a, b) => Math.round(a + (b - a) * lt);
    const r  = lerp((prev[0] >> 16) & 0xff, (next[0] >> 16) & 0xff);
    const gg = lerp((prev[0] >> 8)  & 0xff, (next[0] >> 8)  & 0xff);
    const b  = lerp( prev[0]        & 0xff,  next[0]        & 0xff);
    return (r << 16) | (gg << 8) | b;
  }

  // ── Secondary buttons ─────────────────────────────────────────────────────────

  _buildSecondaryButtons(CX, y) {
    this._makeSecBtn(CX - 84, y, 'HIGH\nSCORES', '#22d3ee', 0x06141e, () => {
      window.AudioFX.clickSfx();
      this.scene.start('HighScores');
    });
    this._makeSecBtn(CX + 84, y, 'SETTINGS', '#8b9cb8', 0x0d1220, () => {
      window.AudioFX.clickSfx();
      this.scene.start('Settings');
    });
  }

  _makeSecBtn(x, y, label, colorHex, fillHex, onClick) {
    const w = 152, h = 88, r = 14;
    const container = this.add.container(x, y);
    const ci = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg = this.add.graphics();
    bg.fillStyle(fillHex, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(1.5, ci, 0.72);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '13px', color: colorHex, fontStyle: 'bold',
      align: 'center', lineSpacing: 7,
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.06, duration: 120 }));
    container.on('pointerout',  () => this.tweens.add({ targets: container, scale: 1,    duration: 120 }));
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.93, duration: 80, yoyo: true });
      onClick();
    });
    return container;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  _buildFooter(CX, H) {
    this.add.text(CX, H - 36, 'SWIPE OR ARROW KEYS TO MOVE', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#1e3a50', letterSpacing: 2,
    }).setOrigin(0.5);
  }

  // ── Music ─────────────────────────────────────────────────────────────────────

  _startMusic() {
    const go = () => { window.AudioFX.init(); window.AudioFX.startMusic(); };
    go();
    this.input.once('pointerdown', go);
    this.input.keyboard.once('keydown', go);
  }
};
