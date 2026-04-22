// MainMenu.js - title screen and mode selection
window.MainMenuScene = class extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.add.image(CFG.DESIGN_WIDTH/2, CFG.DESIGN_HEIGHT/2, 'bg-gradient');

    // title
    const title = this.add.text(CX, 170, 'SNAKE', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '88px',
      fontStyle: 'bold',
      color: '#4ade80',
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#22d3ee', 24, true, true);

    this.add.text(CX, 238, '2 0 2 6', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#94a3b8',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // Best scores summary
    const bestClassic = window.Storage.getBest('classic');
    const bestEndless = window.Storage.getBest('endless');
    const todayKey = window.Daily.todayKey();
    const bestDaily = window.Storage.getDaily(todayKey);

    this.add.text(CX, 290,
      `Best  —  Classic ${bestClassic}   Endless ${bestEndless}   Today ${bestDaily}`,
      { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#94a3b8' }
    ).setOrigin(0.5);

    // mode buttons
    this._makeButton(CX, 410, 'CLASSIC',      '#4ade80', () => this._start('classic'));
    this._makeButton(CX, 490, 'ENDLESS',      '#22d3ee', () => this._start('endless'));
    this._makeButton(CX, 570, 'DAILY',        '#fbbf24', () => this._start('daily'));

    // settings link
    this._makeButton(CX, 720, 'SETTINGS',     '#94a3b8', () => {
      window.AudioFX.clickSfx();
      this.scene.start('Settings');
    }, 0.7);

    // hint
    this.add.text(CX, CFG.DESIGN_HEIGHT - 40,
      'Swipe to turn · Arrow keys on desktop',
      { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#64748b' }
    ).setOrigin(0.5);

    // prime audio + start music on first input
    const _startAudio = () => { window.AudioFX.init(); window.AudioFX.startMusic(); };
    this.input.once('pointerdown', _startAudio);
    this.input.keyboard.once('keydown', _startAudio);

    // subtle title pulse
    this.tweens.add({
      targets: title, scale: { from: 1, to: 1.03 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _makeButton(x, y, label, colorHex, onClick, scale = 1) {
    const w = 320 * scale;
    const h = 64 * scale;
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.85)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.9);
    const glow = this.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Math.floor(26 * scale)}px`,
      color: colorHex,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([glow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.04, duration: 120 });
      glow.setAlpha(0.25);
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 120 });
      glow.setAlpha(0.1);
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true });
      onClick();
    });

    return container;
  }

  _start(mode) {
    window.AudioFX.clickSfx();
    window.FX.vibrate(15);
    this.scene.start('Game', { mode });
  }
};
