// Settings.js - toggle settings
window.SettingsScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Settings' }); }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.add.image(CFG.DESIGN_WIDTH / 2, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');

    this.add.text(CX, 140, 'SETTINGS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px', color: '#e2e8f0', fontStyle: 'bold',
    }).setOrigin(0.5);

    const rows = [
      { key: 'sfx',     label: 'Sound FX' },
      { key: 'music',   label: 'Ambient Music' },
      { key: 'haptics', label: 'Haptics' },
    ];

    rows.forEach((row, i) => {
      this._makeToggle(CX, 260 + i * 90, row.label, row.key);
    });

    // back button
    this._makeButton(CX, 800, 'BACK', '#94a3b8', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _makeToggle(x, y, label, key) {
    const w = 380, h = 60;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.7)
      .setStrokeStyle(1, 0x1a2440, 1);
    const lbl = this.add.text(-w/2 + 20, 0, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#e2e8f0',
    }).setOrigin(0, 0.5);

    const updateStatus = () => {
      const on = window.Storage.getSetting(key);
      return on;
    };

    const switchBg = this.add.rectangle(w/2 - 44, 0, 56, 28, 0x1a2440, 1);
    const knob = this.add.circle(w/2 - 58, 0, 10, 0x4ade80, 1);

    const render = () => {
      const on = updateStatus();
      switchBg.fillColor = on ? 0x166534 : 0x1a2440;
      knob.fillColor = on ? 0x4ade80 : 0x64748b;
      knob.x = on ? (w/2 - 30) : (w/2 - 58);
    };
    render();

    container.add([bg, lbl, switchBg, knob]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      window.Storage.toggleSetting(key);
      window.AudioFX.clickSfx();
      render();
    });
  }

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 260, h = 56;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.85)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.9);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '22px',
      color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true });
      onClick();
    });
  }
};
