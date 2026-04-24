// MainMenu.js – Neon Terminal redesign
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH  / 2;  // 270
    const W   = CFG.DESIGN_WIDTH;        // 540
    const H   = CFG.DESIGN_HEIGHT;       // 960

    this.add.image(CX, H / 2, 'bg-gradient');
    this._drawGrid();
    this._drawWatermark();
    this._drawCornerBrackets();
    this._spawnScanLine();
    this._spawnParticles();
    this._buildTitle(CX, W);
    this._buildBestBadge();
    this._buildButtons(CX, H);
    this._buildFooter(CX, H);
    this._startMusic();
  }

  // ── Background grid ─────────────────────────────────────────────────────────

  _drawGrid() {
    const g = this.add.graphics().setAlpha(0.045);
    g.lineStyle(1, 0x4ade80, 1);
    const step = 44;
    for (let x = 0; x <= 560; x += step) g.lineBetween(x, 0, x, 960);
    for (let y = 0; y <= 980; y += step) g.lineBetween(0, y, 540, y);
  }

  // ── "26" ghost watermark ────────────────────────────────────────────────────

  _drawWatermark() {
    this.add.text(540 * 0.66, 960 * 0.44, '26', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '400px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.034);
  }

  // ── Corner bracket ornaments ─────────────────────────────────────────────────

  _drawCornerBrackets() {
    const g = this.add.graphics();
    const bracket = (x, y, sx, sy, col) => {
      const L = 32;
      g.lineStyle(2, col, 0.7);
      g.beginPath();
      g.moveTo(x, y + sy * L);
      g.lineTo(x, y);
      g.lineTo(x + sx * L, y);
      g.strokePath();
    };
    bracket(20, 20,  1,  1, 0x4ade80);
    bracket(520, 20, -1,  1, 0x22d3ee);
    bracket(20, 940,  1, -1, 0x22d3ee);
    bracket(520, 940, -1, -1, 0x4ade80);

    this.tweens.add({
      targets: g, alpha: { from: 1, to: 0.25 },
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ── Scanning line ────────────────────────────────────────────────────────────

  _spawnScanLine() {
    const line = this.add.rectangle(270, 0, 540, 2, 0x22d3ee, 0.22);
    const haze = this.add.rectangle(270, 0, 540, 48, 0x22d3ee, 0.04);
    this.tweens.add({ targets: [line, haze], y: { from: -24, to: 984 }, duration: 6000, repeat: -1, ease: 'Linear' });
  }

  // ── Rising particles ─────────────────────────────────────────────────────────

  _spawnParticles() {
    const cols = [0x4ade80, 0x22d3ee, 0xa78bfa, 0xfbbf24];
    for (let i = 0; i < 26; i++) {
      const x   = Math.random() * 540;
      const y0  = 980 + Math.random() * 300;
      const r   = 1 + Math.random() * 2.2;
      const col = cols[Math.floor(Math.random() * cols.length)];
      const dot = this.add.circle(x, y0, r, col, 0.6);
      this.tweens.add({
        targets: dot,
        y: { from: y0, to: -20 },
        alpha: { from: 0, to: 0.75, yoyo: true },
        duration: 5000 + Math.random() * 4000,
        delay: Math.random() * 5000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  // ── Title block ──────────────────────────────────────────────────────────────

  _buildTitle(CX) {
    const titleX = CX - 8;
    const titleY = 172;

    // Glow halo behind main text (additive, larger)
    const halo = this.add.text(titleX, titleY, 'SNAKE', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '100px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD).setScale(1.07);

    // Main text
    const snake = this.add.text(titleX, titleY, 'SNAKE', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '100px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#4ade80', 36, true, true);

    // Subtitle row  ─  decorative line + "V I B E S" + edition badge
    const subY = 262;

    const dg = this.add.graphics();
    dg.fillStyle(0x22d3ee, 0.7);
    dg.fillRect(CX - 128, subY, 18, 2);
    dg.fillStyle(0x4ade80, 0.35);
    dg.fillRect(CX - 142, subY, 10, 2);

    const vibes = this.add.text(CX - 100, subY - 10, 'V I B E S', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '22px', color: '#22d3ee', letterSpacing: 10,
    }).setOrigin(0, 0.5).setShadow(0, 0, '#22d3ee', 16, true, true);

    // "26" pill badge to the right of VIBES
    const bx = CX + 98, by = subY - 9;
    const badgeBg = this.add.rectangle(bx, by, 50, 26, 0x0a1628, 1).setStrokeStyle(1.2, 0x22d3ee, 0.65);
    const badgeTx = this.add.text(bx, by, '26', {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '15px', color: '#22d3ee', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tagline
    this.add.text(CX, 300, 'A R C A D E   E D I T I O N', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#1e3a5f', letterSpacing: 5,
    }).setOrigin(0.5);

    // Horizontal rule
    const hrg = this.add.graphics();
    hrg.fillStyle(0x22d3ee, 0.55);
    hrg.fillRect(CX - 130, 326, 260, 1);
    hrg.fillStyle(0x4ade80, 0.18);
    hrg.fillRect(CX - 160, 326, 26, 1);
    hrg.fillRect(CX + 134, 326, 26, 1);

    // Animations
    this.tweens.add({ targets: snake, scale: { from: 1, to: 1.025 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: halo,  alpha: { from: 0.12, to: 0.28 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: vibes, alpha: { from: 0.65, to: 1.0 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
    this.tweens.add({ targets: [badgeBg, badgeTx], alpha: { from: 0.55, to: 1 }, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700 });
  }

  // ── Best score badge (top-left) ───────────────────────────────────────────────

  _buildBestBadge() {
    const best = window.Storage.getBest('journey');
    if (best <= 0) return;

    const x = 22, y = 64;
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1324, 0.88);
    bg.fillRoundedRect(x, y - 18, 116, 36, 5);
    bg.lineStyle(1, 0x4ade80, 0.45);
    bg.strokeRoundedRect(x, y - 18, 116, 36, 5);

    this.add.text(x + 10, y - 9, 'BEST', {
      fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#334155', letterSpacing: 3,
    });
    this.add.text(x + 10, y + 3, `${best}`, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '14px', color: '#4ade80', fontStyle: 'bold',
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────────

  _buildButtons(CX, H) {
    this._makePrimaryButton(CX, 460, 'J O U R N E Y', () => {
      window.AudioFX.clickSfx();
      window.FX.vibrate(15);
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });

    // Side-by-side secondary buttons
    this._makeSecondaryButton(CX - 84, 580, 'HIGH\nSCORES', '#22d3ee', () => {
      window.AudioFX.clickSfx();
      this.scene.start('HighScores');
    });
    this._makeSecondaryButton(CX + 84, 580, 'SETTINGS', '#64748b', () => {
      window.AudioFX.clickSfx();
      this.scene.start('Settings');
    });
  }

  _makePrimaryButton(x, y, label, onClick) {
    const w = 390, h = 86;
    const container = this.add.container(x, y);

    // Outer breathing glow
    const outerGlow = this.add.rectangle(0, 0, w + 18, h + 18, 0x4ade80, 0);
    const midGlow   = this.add.rectangle(0, 0, w + 6,  h + 6,  0x4ade80, 0.05);
    const bg        = this.add.rectangle(0, 0, w, h, 0x061509, 0.97).setStrokeStyle(2, 0x4ade80, 1);
    const shimmer   = this.add.rectangle(0, 0, w - 4, h - 4, 0x4ade80, 0.04);

    // Animated interior scan line
    const scan = this.add.rectangle(0, 0, w - 4, 2, 0x4ade80, 0.55);
    this.tweens.add({ targets: scan, y: { from: -h / 2 + 2, to: h / 2 - 2 }, duration: 1700, repeat: -1, ease: 'Linear', delay: 400 });

    // Corner accent marks
    const cg = this.add.graphics();
    const cl = 15;
    cg.lineStyle(2, 0x22d3ee, 0.95);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const cx = sx * w / 2, cy = sy * h / 2;
      cg.beginPath();
      cg.moveTo(cx, cy - sy * cl);
      cg.lineTo(cx, cy);
      cg.lineTo(cx - sx * cl, cy);
      cg.strokePath();
    });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '28px', color: '#4ade80', fontStyle: 'bold', letterSpacing: 6,
    }).setOrigin(0.5).setShadow(0, 0, '#4ade80', 24, true, true);

    container.add([outerGlow, midGlow, bg, shimmer, scan, cg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: outerGlow, alpha: { from: 0.02, to: 0.15 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: midGlow, alpha: { from: 0.04, to: 0.18 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });

    container.on('pointerover', () => { this.tweens.add({ targets: container, scale: 1.03, duration: 130 }); shimmer.setAlpha(0.16); });
    container.on('pointerout',  () => { this.tweens.add({ targets: container, scale: 1,    duration: 130 }); shimmer.setAlpha(0.04); });
    container.on('pointerdown', () => { this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true }); onClick(); });
    return container;
  }

  _makeSecondaryButton(x, y, label, colorHex, onClick) {
    const w = 154, h = 100;
    const container = this.add.container(x, y);
    const ci = Phaser.Display.Color.HexStringToColor(colorHex).color;

    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.9).setStrokeStyle(1.5, ci, 0.65);
    const glow = this.add.rectangle(0, 0, w, h, ci, 0.05);

    // Corner marks
    const cg = this.add.graphics();
    const cl = 10;
    cg.lineStyle(1.5, ci, 0.9);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const bx = sx * w / 2, by = sy * h / 2;
      cg.beginPath();
      cg.moveTo(bx, by - sy * cl);
      cg.lineTo(bx, by);
      cg.lineTo(bx - sx * cl, by);
      cg.strokePath();
    });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, "Arial Black", Arial, sans-serif',
      fontSize: '14px', color: colorHex, fontStyle: 'bold',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    container.add([glow, bg, cg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => { this.tweens.add({ targets: container, scale: 1.06, duration: 120 }); glow.setAlpha(0.22); });
    container.on('pointerout',  () => { this.tweens.add({ targets: container, scale: 1,    duration: 120 }); glow.setAlpha(0.05); });
    container.on('pointerdown', () => { this.tweens.add({ targets: container, scale: 0.94, duration: 80, yoyo: true }); onClick(); });
    return container;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  _buildFooter(CX, H) {
    this.add.text(CX, H - 36, 'swipe  ·  arrow keys  ·  WASD', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#1a2f50', letterSpacing: 3,
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
