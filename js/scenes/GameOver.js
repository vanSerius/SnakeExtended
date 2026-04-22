// GameOver.js - end screen
window.GameOverScene = class extends Phaser.Scene {
  constructor() { super({ key: 'GameOver' }); }

  init(data) {
    this.mode = data.mode;
    this.finalScore = data.score;
    this.applesEaten = data.applesEaten;
    this.newBest = data.newBest;
    this.dailyKey = data.dailyKey;
    this.victory = data.victory || false;
  }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.add.image(CFG.DESIGN_WIDTH / 2, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');
    this.add.rectangle(CX, CFG.DESIGN_HEIGHT / 2, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.35);

    const headingText  = this.victory ? 'YOU WON!' : 'GAME OVER';
    const headingColor = this.victory ? '#4ade80'  : '#f87171';
    const heading = this.add.text(CX, 180, headingText, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '56px',
      color: headingColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    heading.setShadow(0, 0, headingColor, 18, true, true);
    if (this.victory) {
      this.tweens.add({
        targets: heading, scale: { from: 1, to: 1.06 },
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.add.text(CX, 240, this.victory ? 'BOSS RUSH  COMPLETE' : this.mode.toUpperCase(), {
      fontFamily: 'Arial, sans-serif', fontSize: '18px',
      color: this.victory ? '#fbbf24' : '#94a3b8', letterSpacing: 6,
    }).setOrigin(0.5);

    // animated score count-up
    const scoreText = this.add.text(CX, 350, '0', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '84px',
      color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 24, true, true);

    const counter = { v: 0 };
    this.tweens.add({
      targets: counter,
      v: this.finalScore,
      duration: Math.min(1200, 600 + this.finalScore * 2),
      ease: 'Cubic.easeOut',
      onUpdate: () => scoreText.setText(`${Math.floor(counter.v)}`),
      onComplete: () => scoreText.setText(`${this.finalScore}`),
    });

    this.add.text(CX, 420, `${this.applesEaten} eats`, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#94a3b8',
    }).setOrigin(0.5);

    // best-score row
    let bestLine = '';
    if (this.mode === 'daily') {
      const best = window.Storage.getDaily(this.dailyKey);
      bestLine = `Today's best: ${best}`;
    } else {
      const best = window.Storage.getBest(this.mode);
      bestLine = `Best: ${best}`;
    }
    this.add.text(CX, 470, bestLine, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#94a3b8',
    }).setOrigin(0.5);

    if (this.newBest) {
      const nb = this.add.text(CX, 510, 'NEW BEST!', {
        fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '24px',
        color: '#fbbf24', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: nb, scale: { from: 1, to: 1.1 },
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // buttons
    this._makeButton(CX, 650, 'RETRY', '#4ade80', () => {
      window.AudioFX.clickSfx();
      this.scene.start('Game', { mode: this.mode });
    });
    this._makeButton(CX, 740, 'MENU', '#94a3b8', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 320, h = 64;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.85)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.9);
    const glow = this.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '26px',
      color: colorHex, fontStyle: 'bold',
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
  }
};
