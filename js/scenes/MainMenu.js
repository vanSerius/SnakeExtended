// MainMenu.js – Neon Vibes: reference-faithful rebuild
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CX = 270, W = 540, H = 960;

    this.add.image(CX, H / 2, 'bg-gradient');
    this._drawStars(W, H);
    this._drawBgRings(CX, 450);
    this._buildTitle(CX);
    this._buildBestScore(CX);
    this._buildPlayButton(CX, 440);
    this._buildSecondaryButtons(CX, 562);
    this._buildDecorativeSnake();
    this._buildFooter(CX, H);
    this._startMusic();
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

    // Collect layers per letter for coordinated bounce
    const byLetter = letters.map(() => []);

    // Outer halos first (renders below)
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

    // Main letters (white core + coloured shadow = neon tube look)
    letters.forEach((d, i) => {
      const t = this.add.text(d.x, titleY, d.ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: '90px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setShadow(0, 0, d.css, 28, true, true);
      byLetter[i].push(t);
    });

    // Staggered bounce per letter
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

    // "26"
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

    // Dark fill
    const fill = this.add.graphics();
    fill.fillStyle(0x060d1c, 1);
    fill.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    // Rainbow border (line-segment approach)
    const border = this.add.graphics();
    this._drawRainbowBorder(border, 0, 0, w, h, r, 3);

    // Soft white interior glow (ADD)
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

  // Draw a rounded-rect border using individual coloured line segments
  _drawRainbowBorder(g, cx, cy, w, h, r, lw) {
    const hw = w / 2, hh = h / 2;
    const pts = [];

    const arc = (acx, acy, startA, endA, steps) => {
      for (let i = 0; i <= steps; i++) {
        const a = startA + (i / steps) * (endA - startA);
        pts.push([acx + Math.cos(a) * r, acy + Math.sin(a) * r]);
      }
    };

    // Top edge L→R
    for (let i = 0; i <= 14; i++) pts.push([cx - hw + r + (i / 14) * (w - 2 * r), cy - hh]);
    // Top-right arc
    arc(cx + hw - r, cy - hh + r, -Math.PI / 2, 0, 8);
    // Right edge T→B
    for (let i = 1; i <= 8; i++) pts.push([cx + hw, cy - hh + r + (i / 8) * (h - 2 * r)]);
    // Bottom-right arc
    arc(cx + hw - r, cy + hh - r, 0, Math.PI / 2, 8);
    // Bottom edge R→L
    for (let i = 1; i <= 14; i++) pts.push([cx + hw - r - (i / 14) * (w - 2 * r), cy + hh]);
    // Bottom-left arc
    arc(cx - hw + r, cy + hh - r, Math.PI / 2, Math.PI, 8);
    // Left edge B→T
    for (let i = 1; i <= 8; i++) pts.push([cx - hw, cy + hh - r - (i / 8) * (h - 2 * r)]);
    // Top-left arc
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
      [0xf472b6, 0],    // pink
      [0xef4444, 0.14], // red
      [0xfbbf24, 0.28], // gold
      [0xa855f7, 0.44], // purple
      [0x3b82f6, 0.60], // blue
      [0x22d3ee, 0.74], // cyan
      [0x4ade80, 0.88], // green
      [0xf472b6, 1],    // back to pink
    ];
    let prev = stops[0], next = stops[1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][1] && t <= stops[i + 1][1]) { prev = stops[i]; next = stops[i + 1]; break; }
    }
    const lt = (next[1] === prev[1]) ? 0 : (t - prev[1]) / (next[1] - prev[1]);
    const lerp = (a, b) => Math.round(a + (b - a) * lt);
    const r = lerp((prev[0] >> 16) & 0xff, (next[0] >> 16) & 0xff);
    const gg = lerp((prev[0] >> 8) & 0xff,  (next[0] >> 8) & 0xff);
    const b = lerp(prev[0] & 0xff,           next[0] & 0xff);
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

  // ── Decorative snake at bottom ────────────────────────────────────────────────

  _buildDecorativeSnake() {
    const N = 11;
    const x0 = 108, dx = 24;
    const baseY = 714;
    const colors = [
      0x86efac, 0x4ade80, 0xa3e635, 0xfde047, 0xfbbf24,
      0xf97316, 0xef4444, 0xc026d3, 0xa855f7, 0x3b82f6, 0x22d3ee,
    ];

    // Compute positions along a gentle sine-wave curve
    const pts = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      return {
        x: x0 + i * dx,
        y: baseY + Math.sin(t * Math.PI * 1.5) * 10,
        r: Math.max(13 - i, 5),
        col: colors[i],
      };
    });

    // Body segments (drawn first so head renders on top)
    for (let i = N - 1; i >= 1; i--) {
      const s = pts[i];
      const dot = this.add.circle(s.x, s.y, s.r, s.col, 1);
      this.tweens.add({
        targets: dot, y: { from: s.y, to: s.y - 5 },
        duration: 820, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: i * 80,
      });
    }

    // Head in a container so eyes + tongue travel with it
    const h = pts[0];
    const head = this.add.container(h.x, h.y);

    // Soft glow halo
    head.add(this.add.circle(0, 0, h.r + 5, h.col, 0.22));
    // Head circle
    head.add(this.add.circle(0, 0, h.r, h.col, 1));
    // Eyes (snake faces right → eyes top-right quadrant)
    head.add(this.add.circle(5,  -5, 2.8, 0x052e14, 1));
    head.add(this.add.circle(11, -5, 2.8, 0x052e14, 1));
    // Eye shine
    head.add(this.add.circle(5.9,  -5.9, 1, 0xffffff, 0.85));
    head.add(this.add.circle(11.9, -5.9, 1, 0xffffff, 0.85));
    // Forked tongue
    const tg = this.add.graphics();
    tg.lineStyle(1.8, 0xff5e7c, 1);
    tg.lineBetween(h.r, 1, h.r + 7, 1);
    tg.lineBetween(h.r + 7, 1, h.r + 11, -3);
    tg.lineBetween(h.r + 7, 1, h.r + 11,  5);
    head.add(tg);

    this.tweens.add({
      targets: head, y: { from: h.y, to: h.y - 5 },
      duration: 820, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
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
