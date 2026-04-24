// MainMenu.js – Candy Arcade: colorful, rounded, playful
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH  / 2;
    const W   = CFG.DESIGN_WIDTH;
    const H   = CFG.DESIGN_HEIGHT;

    this.add.image(CX, H / 2, 'bg-gradient');
    this._drawGlowOrbs(CX, W, H);
    this._drawStars(W, H);
    this._buildTitle(CX, H);
    this._buildBestScore(CX);
    this._buildButtons(CX, H);
    this._buildDots(CX);
    this._buildFooter(CX, H);
    this._startMusic();
  }

  // ── Soft coloured blob orbs ──────────────────────────────────────────────────

  _drawGlowOrbs(CX, W, H) {
    const orbs = [
      { x: 60,  y: 220,  r: 180, col: 0x4ade80, a: 0.09 },
      { x: W - 70, y: 300, r: 200, col: 0x22d3ee, a: 0.07 },
      { x: 90,  y: H - 250, r: 160, col: 0xa855f7, a: 0.07 },
      { x: W - 60, y: H - 200, r: 180, col: 0xf472b6, a: 0.06 },
      { x: CX, y: H * 0.48, r: 260, col: 0x4ade80, a: 0.04 },
    ];
    orbs.forEach(o => {
      const g = this.add.circle(o.x, o.y, o.r, o.col, o.a);
      this.tweens.add({
        targets: g,
        alpha: { from: o.a * 0.5, to: o.a * 1.6 },
        scaleX: { from: 0.9, to: 1.1 },
        scaleY: { from: 0.9, to: 1.1 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    });
  }

  // ── Twinkling stars ───────────────────────────────────────────────────────────

  _drawStars(W, H) {
    const cols = [0xffffff, 0x4ade80, 0x22d3ee, 0xa78bfa, 0xf472b6, 0xfbbf24];
    for (let i = 0; i < 38; i++) {
      const x   = Math.random() * W;
      const y   = Math.random() * H;
      const r   = 0.8 + Math.random() * 1.8;
      const col = cols[Math.floor(Math.random() * cols.length)];
      const s   = this.add.circle(x, y, r, col, 1).setAlpha(0.1);
      this.tweens.add({
        targets: s, alpha: { from: 0.06, to: 0.7 },
        duration: 800 + Math.random() * 2200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Math.random() * 3000,
      });
    }
  }

  // ── Title ────────────────────────────────────────────────────────────────────

  _buildTitle(CX, H) {
    // Each letter has its own color and bounce phase
    const letters  = ['S', 'N', 'A', 'K', 'E'];
    const colors   = ['#4ade80', '#34d399', '#22d3ee', '#818cf8', '#f472b6'];
    const shadows  = ['#4ade80', '#34d399', '#22d3ee', '#818cf8', '#f472b6'];
    const fontSize = 92;
    const spacing  = 80;
    const startX   = CX - ((letters.length - 1) * spacing) / 2;
    const titleY   = 178;

    letters.forEach((ch, i) => {
      // Glow halo
      const halo = this.add.text(startX + i * spacing, titleY, ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: `${fontSize}px`, color: colors[i], fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD).setScale(1.1);

      // Main letter
      const lt = this.add.text(startX + i * spacing, titleY, ch, {
        fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
        fontSize: `${fontSize}px`, color: colors[i], fontStyle: 'bold',
      }).setOrigin(0.5).setShadow(0, 0, shadows[i], 28, true, true);

      // Staggered bounce
      const delay = i * 110;
      [lt, halo].forEach(t => this.tweens.add({
        targets: t, y: { from: titleY + 4, to: titleY - 10 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay,
      }));
    });

    // Subtitle
    const subY = 268;
    const vibes = this.add.text(CX, subY, 'V I B E S', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '23px', color: '#22d3ee', letterSpacing: 12,
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 14, true, true);

    this.add.text(CX, 302, '2 0 2 6', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '14px', color: '#334155', letterSpacing: 8,
    }).setOrigin(0.5);

    this.tweens.add({ targets: vibes, alpha: { from: 0.6, to: 1 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Playful wavy divider
    const dg = this.add.graphics().setAlpha(0.5);
    dg.lineStyle(2, 0x4ade80, 1);
    dg.beginPath();
    for (let x = CX - 100; x <= CX + 100; x += 4) {
      const yy = 338 + Math.sin((x - CX + 100) * 0.07) * 4;
      x === CX - 100 ? dg.moveTo(x, yy) : dg.lineTo(x, yy);
    }
    dg.strokePath();
  }

  // ── Best score chip ───────────────────────────────────────────────────────────

  _buildBestScore(CX) {
    const best = window.Storage.getBest('journey');
    if (best <= 0) return;

    const chip = this.add.container(CX, 374);
    const g = this.add.graphics();
    g.fillStyle(0x0d1324, 0.8);
    g.fillRoundedRect(-72, -16, 144, 32, 16);
    g.lineStyle(1.5, 0x4ade80, 0.5);
    g.strokeRoundedRect(-72, -16, 144, 32, 16);
    const t = this.add.text(0, 0, `★  BEST  ${best}`, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '13px', color: '#4ade80',
    }).setOrigin(0.5);
    chip.add([g, t]);
    this.tweens.add({ targets: chip, alpha: { from: 0.6, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────────

  _buildButtons(CX, H) {
    this._makePlayButton(CX, 484, () => {
      window.AudioFX.clickSfx();
      window.FX.vibrate(15);
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });

    this._makeRoundButton(CX - 82, 604, 'HIGH\nSCORES', '#22d3ee', 0x0e2a3a, () => {
      window.AudioFX.clickSfx();
      this.scene.start('HighScores');
    });
    this._makeRoundButton(CX + 82, 604, 'SETTINGS', '#94a3b8', 0x141e2e, () => {
      window.AudioFX.clickSfx();
      this.scene.start('Settings');
    });
  }

  _makePlayButton(x, y, onClick) {
    const w = 380, h = 88, r = 20;
    const container = this.add.container(x, y);

    // Shadow glow behind
    const shadow = this.add.graphics();
    shadow.fillStyle(0x4ade80, 0.18);
    shadow.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, r + 4);

    // Button fill
    const bg = this.add.graphics();
    bg.fillStyle(0x166534, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    // Lighter top stripe for depth
    bg.fillStyle(0x22c55e, 0.35);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h / 2 - 2, { tl: r - 2, tr: r - 2, bl: 0, br: 0 });

    const text = this.add.text(0, 0, 'P L A Y', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 10,
    }).setOrigin(0.5).setShadow(0, 2, '#000000', 6, false, true);

    container.add([shadow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: shadow, alpha: { from: 0.7, to: 1.4 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.04, duration: 120 });
      this.tweens.add({ targets: text, y: -3, duration: 100 });
    });
    container.on('pointerout',  () => {
      this.tweens.add({ targets: container, scale: 1, duration: 120 });
      this.tweens.add({ targets: text, y: 0, duration: 100 });
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true });
      onClick();
    });
    return container;
  }

  _makeRoundButton(x, y, label, colorHex, fillHex, onClick) {
    const w = 152, h = 96, r = 16;
    const container = this.add.container(x, y);
    const ci = Phaser.Display.Color.HexStringToColor(colorHex).color;

    const bg = this.add.graphics();
    bg.fillStyle(fillHex, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(1.5, ci, 0.7);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '14px', color: colorHex, fontStyle: 'bold',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.07, duration: 120 });
    });
    container.on('pointerout',  () => {
      this.tweens.add({ targets: container, scale: 1,    duration: 120 });
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.93, duration: 80, yoyo: true });
      onClick();
    });
    return container;
  }

  // ── Decorative snake dots ─────────────────────────────────────────────────────
  // A little snake shape below the buttons — purely cosmetic

  _buildDots(CX) {
    const cols = [0x86efac, 0x4ade80, 0x22c55e, 0x15803d, 0x166534];
    const pts  = [
      [CX - 70, 730], [CX - 42, 722], [CX - 14, 720], [CX + 14, 722], [CX + 42, 730],
      [CX + 68, 742], [CX + 84, 756],
    ];
    pts.forEach(([px, py], i) => {
      const r   = i === 0 ? 10 : 8 - i * 0.4;
      const dot = this.add.circle(px, py, Math.max(r, 5), cols[Math.min(i, cols.length - 1)], 1);
      if (i === 0) {
        // head eyes
        this.add.circle(px - 3, py - 3, 2, 0x000000, 1);
        this.add.circle(px + 3, py - 3, 2, 0x000000, 1);
      }
      this.tweens.add({
        targets: dot,
        scaleX: { from: 1, to: 1.12 }, scaleY: { from: 1, to: 1.12 },
        duration: 600 + i * 80,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 60,
      });
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  _buildFooter(CX, H) {
    this.add.text(CX, H - 36, 'swipe  ·  arrow keys  ·  WASD', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#1e3a50', letterSpacing: 3,
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
