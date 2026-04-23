// GameOver.js - end screen
window.GameOverScene = class extends Phaser.Scene {
  constructor() { super({ key: 'GameOver' }); }

  init(data) {
    this.mode        = data.mode || 'journey';
    this.finalScore  = data.score;
    this.applesEaten = data.applesEaten;
    this.newBest     = data.newBest;
    this.victory     = data.victory || false;
  }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH / 2;

    this.add.image(CX, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');
    this.add.rectangle(CX, CFG.DESIGN_HEIGHT / 2, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.4);

    const headingText  = this.victory ? 'YOU WON!'  : 'GAME OVER';
    const headingColor = this.victory ? '#4ade80'   : '#f87171';

    const heading = this.add.text(CX, 180, headingText, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '58px', color: headingColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    heading.setShadow(0, 0, headingColor, 22, true, true);

    if (this.victory) {
      this.tweens.add({
        targets: heading, scale: { from: 1, to: 1.06 },
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.add.text(CX, 244, this.victory ? 'BOSS RUSH  COMPLETE' : 'JOURNEY', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px',
      color: this.victory ? '#fbbf24' : '#64748b', letterSpacing: 6,
    }).setOrigin(0.5);

    // score count-up
    const scoreText = this.add.text(CX, 360, '0', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '88px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 26, true, true);

    const counter = { v: 0 };
    this.tweens.add({
      targets: counter,
      v: this.finalScore,
      duration: Math.min(1400, 500 + this.finalScore * 1.5),
      ease: 'Cubic.easeOut',
      onUpdate: () => scoreText.setText(`${Math.floor(counter.v)}`),
      onComplete: () => scoreText.setText(`${this.finalScore}`),
    });

    this.add.text(CX, 434, `${this.applesEaten} eats`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#475569',
    }).setOrigin(0.5);

    // best score
    const best = window.Storage.getBest('journey');
    this.add.text(CX, 472, `Best: ${best}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#64748b',
    }).setOrigin(0.5);

    if (this.newBest) {
      const nb = this.add.text(CX, 516, 'NEW BEST!', {
        fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '26px',
        color: '#fbbf24', fontStyle: 'bold',
      }).setOrigin(0.5);
      nb.setShadow(0, 0, '#fbbf24', 14, true, true);
      this.tweens.add({
        targets: nb, scale: { from: 1, to: 1.1 },
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // buttons
    this._makeButton(CX, 660, 'RETRY', '#4ade80', () => {
      window.AudioFX.clickSfx();
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });
    this._makeButton(CX, 754, 'MENU', '#64748b', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 320, h = 64;
    const container = this.add.container(x, y);
    const colorInt = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.88).setStrokeStyle(2, colorInt, 0.9);
    const glow = this.add.rectangle(0, 0, w, h, colorInt, 0.08);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '26px',
      color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([glow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.04, duration: 120 });
      glow.setAlpha(0.22);
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 120 });
      glow.setAlpha(0.08);
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true });
      onClick();
    });
  }
};
