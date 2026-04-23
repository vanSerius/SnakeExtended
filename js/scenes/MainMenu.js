// MainMenu.js - Snake Vibes 26 title screen
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH  / 2;
    const CY  = CFG.DESIGN_HEIGHT / 2;

    this.add.image(CX, CY, 'bg-gradient');

    // subtle neon dot field
    this._spawnDots();

    // faint decorative rings around the title area
    const gDeco = this.add.graphics().setAlpha(0.12);
    gDeco.lineStyle(1, 0x4ade80, 1);
    gDeco.strokeEllipse(CX, 200, 440, 320);
    gDeco.lineStyle(1, 0x22d3ee, 1);
    gDeco.strokeEllipse(CX, 200, 370, 250);

    // ── Title ──────────────────────────────────────────────────────────

    const snake = this.add.text(CX, 148, 'SNAKE', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '88px', fontStyle: 'bold', color: '#4ade80',
    }).setOrigin(0.5);
    snake.setShadow(0, 0, '#4ade80', 34, true, true);

    const vibes = this.add.text(CX, 224, 'V I B E S', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '28px', fontStyle: 'bold', color: '#22d3ee',
      letterSpacing: 12,
    }).setOrigin(0.5);
    vibes.setShadow(0, 0, '#22d3ee', 18, true, true);

    this.add.text(CX, 262, '2 6', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '18px', color: '#334155', letterSpacing: 8,
    }).setOrigin(0.5);

    // title pulse
    this.tweens.add({
      targets: snake, scale: { from: 1, to: 1.03 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: vibes, alpha: { from: 0.7, to: 1 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: 300,
    });

    // ── Best score ─────────────────────────────────────────────────────

    const best = window.Storage.getBest('journey');
    if (best > 0) {
      this.add.text(CX, 298, `BEST  ${best}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#334155',
        letterSpacing: 4,
      }).setOrigin(0.5);
    }

    // ── Neon separator ─────────────────────────────────────────────────

    const sep = this.add.graphics();
    sep.fillStyle(0x4ade80, 0.7);
    sep.fillRect(CX - 48, 324, 96, 2);
    sep.fillStyle(0x22d3ee, 0.4);
    sep.fillRect(CX - 80, 324, 22, 2);
    sep.fillRect(CX + 58, 324, 22, 2);

    // ── Buttons ────────────────────────────────────────────────────────

    this._makePrimaryButton(CX, 444, 'J O U R N E Y', () => {
      window.AudioFX.clickSfx();
      window.FX.vibrate(15);
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });

    this._makeButton(CX, 574, 'HIGH SCORES', '#22d3ee', () => {
      window.AudioFX.clickSfx();
      this.scene.start('HighScores');
    });

    this._makeButton(CX, 658, 'SETTINGS', '#475569', () => {
      window.AudioFX.clickSfx();
      this.scene.start('Settings');
    });

    // ── Hint ───────────────────────────────────────────────────────────

    this.add.text(CX, CFG.DESIGN_HEIGHT - 38,
      'Swipe to turn  ·  Arrow keys on desktop',
      { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#1e293b' }
    ).setOrigin(0.5);

    // ── Music ──────────────────────────────────────────────────────────

    const tryMusic = () => { window.AudioFX.init(); window.AudioFX.startMusic(); };
    tryMusic();
    this.input.once('pointerdown', tryMusic);
    this.input.keyboard.once('keydown', tryMusic);
  }

  _spawnDots() {
    const cols = [0x4ade80, 0x22d3ee, 0xa78bfa, 0xfbbf24];
    const W = window.CONFIG.DESIGN_WIDTH;
    const H = window.CONFIG.DESIGN_HEIGHT;
    for (let i = 0; i < 28; i++) {
      const x   = Math.random() * W;
      const y   = Math.random() * H;
      const r   = 1 + Math.random() * 2.2;
      const col = cols[Math.floor(Math.random() * cols.length)];
      const dot = this.add.circle(x, y, r, col, 0.5);
      this.tweens.add({
        targets: dot, alpha: { from: 0.06, to: 0.6 },
        duration: 1100 + Math.random() * 2400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }
  }

  _makePrimaryButton(x, y, label, onClick) {
    const w = 344, h = 80;
    const container = this.add.container(x, y);

    const halo    = this.add.rectangle(0, 0, w + 28, h + 28, 0x4ade80, 0);
    const bg      = this.add.rectangle(0, 0, w, h, 0x071a0e, 0.97).setStrokeStyle(2, 0x4ade80, 1);
    const shimmer = this.add.rectangle(0, 0, w - 4, h - 4, 0x4ade80, 0.06);
    const text    = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '26px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5);
    text.setShadow(0, 0, '#4ade80', 16, true, true);

    container.add([halo, bg, shimmer, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: halo, alpha: { from: 0.03, to: 0.18 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    container.on('pointerover',  () => { this.tweens.add({ targets: container, scale: 1.04, duration: 120 }); shimmer.setAlpha(0.18); });
    container.on('pointerout',   () => { this.tweens.add({ targets: container, scale: 1,    duration: 120 }); shimmer.setAlpha(0.06); });
    container.on('pointerdown',  () => { this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true }); onClick(); });
    return container;
  }

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 300, h = 60;
    const container = this.add.container(x, y);
    const colorInt  = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.88).setStrokeStyle(1.5, colorInt, 0.75);
    const glow = this.add.rectangle(0, 0, w, h, colorInt, 0.06);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '20px', color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([glow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover',  () => { this.tweens.add({ targets: container, scale: 1.04, duration: 120 }); glow.setAlpha(0.22); });
    container.on('pointerout',   () => { this.tweens.add({ targets: container, scale: 1,    duration: 120 }); glow.setAlpha(0.06); });
    container.on('pointerdown',  () => { this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true }); onClick(); });
    return container;
  }
};
