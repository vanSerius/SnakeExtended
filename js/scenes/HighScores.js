// HighScores.js - journey best score display
window.HighScoresScene = class extends Phaser.Scene {
  constructor() { super({ key: 'HighScores' }); }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH / 2;
    const CY  = CFG.DESIGN_HEIGHT / 2;

    this.add.image(CX, CY, 'bg-gradient');
    this.add.rectangle(CX, CY, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.35);

    // faint rings
    const g = this.add.graphics().setAlpha(0.1);
    g.lineStyle(1, 0x22d3ee, 1);
    g.strokeEllipse(CX, CY - 60, 380, 300);

    this.add.text(CX, 140, 'HIGH SCORES', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '40px', color: '#22d3ee', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 20, true, true);

    // separator
    const sep = this.add.graphics();
    sep.fillStyle(0x22d3ee, 0.6);
    sep.fillRect(CX - 48, 186, 96, 2);
    sep.fillStyle(0x4ade80, 0.3);
    sep.fillRect(CX - 80, 186, 22, 2);
    sep.fillRect(CX + 58, 186, 22, 2);

    // best journey score
    const best = window.Storage.getBest('journey');

    this.add.text(CX, 260, 'JOURNEY', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#475569', letterSpacing: 6,
    }).setOrigin(0.5);

    const scoreText = this.add.text(CX, 350, best > 0 ? `${best}` : '—', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '96px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 28, true, true);

    if (best > 0) {
      this.tweens.add({
        targets: scoreText, scale: { from: 1, to: 1.04 },
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.add.text(CX, 432, best > 0 ? 'personal best' : 'no runs yet', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#334155',
    }).setOrigin(0.5);

    // Boss Rush trophy if ever won (could add a win-count later)
    this.add.text(CX, 490, 'Complete the Boss Rush to win!', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#1e293b',
    }).setOrigin(0.5);

    // BACK button
    this._makeButton(CX, 760, 'BACK', '#475569', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 260, h = 58;
    const container = this.add.container(x, y);
    const colorInt  = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.88).setStrokeStyle(1.5, colorInt, 0.75);
    const glow = this.add.rectangle(0, 0, w, h, colorInt, 0.06);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '22px', color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([glow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover',  () => { this.tweens.add({ targets: container, scale: 1.04, duration: 120 }); glow.setAlpha(0.22); });
    container.on('pointerout',   () => { this.tweens.add({ targets: container, scale: 1,    duration: 120 }); glow.setAlpha(0.06); });
    container.on('pointerdown',  () => { this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true }); onClick(); });
  }
};
