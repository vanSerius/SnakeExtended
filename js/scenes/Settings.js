// Settings.js - toggle settings + volume sliders
window.SettingsScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Settings' }); }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.add.image(CFG.DESIGN_WIDTH / 2, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');

    this.add.text(CX, 120, 'SETTINGS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px', color: '#e2e8f0', fontStyle: 'bold',
    }).setOrigin(0.5);

    // toggles + volume sliders
    this._makeToggle(CX, 220, 'Sound FX',      'sfx');
    this._makeSlider(CX, 285, 'FX Volume',      'fxVolume',    v => window.AudioFX.setFxVolume(v));

    this._makeToggle(CX, 365, 'Ambient Music',  'music');
    this._makeSlider(CX, 430, 'Music Volume',   'musicVolume', v => window.AudioFX.setMusicVolume(v));

    this._makeToggle(CX, 510, 'Haptics',        'haptics');

    // back button
    this._makeButton(CX, 740, 'BACK', '#94a3b8', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _makeToggle(x, y, label, key) {
    const w = 380, h = 56;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.7)
      .setStrokeStyle(1, 0x1a2440, 1);
    const lbl = this.add.text(-w/2 + 20, 0, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#e2e8f0',
    }).setOrigin(0, 0.5);

    const switchBg = this.add.rectangle(w/2 - 44, 0, 56, 28, 0x1a2440, 1);
    const knob     = this.add.circle(w/2 - 58, 0, 10, 0x4ade80, 1);

    const render = () => {
      const on = window.Storage.getSetting(key);
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

  _makeSlider(cx, y, label, settingKey, applyFn) {
    const trackW = 260;
    const trackH = 6;
    const knobR  = 11;

    this.add.text(cx - trackW / 2 - 14, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#64748b',
    }).setOrigin(1, 0.5);

    // track background
    this.add.rectangle(cx, y, trackW, trackH, 0x1a2440, 1);

    let value = window.Storage.getSetting(settingKey);
    if (typeof value !== 'number') value = 1.0;

    // fill (left-anchored)
    const fill = this.add.rectangle(cx - trackW / 2, y, trackW, trackH, 0x4ade80, 1).setOrigin(0, 0.5);
    fill.scaleX = value;

    const knob = this.add.circle(cx - trackW / 2 + value * trackW, y, knobR, 0x4ade80, 1);

    const pctText = this.add.text(cx + trackW / 2 + 14, y, `${Math.round(value * 100)}%`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#94a3b8',
    }).setOrigin(0, 0.5);

    const setValue = (px) => {
      value = Phaser.Math.Clamp((px - (cx - trackW / 2)) / trackW, 0, 1);
      fill.scaleX = value;
      knob.x = cx - trackW / 2 + value * trackW;
      pctText.setText(`${Math.round(value * 100)}%`);
      window.Storage.setSetting(settingKey, value);
      applyFn(value);
    };

    // wide interactive zone over track + knob
    const zone = this.add.zone(cx, y, trackW + knobR * 2, 40).setInteractive({ useHandCursor: true });

    let dragging = false;
    zone.on('pointerdown', (ptr) => { dragging = true; setValue(ptr.x); });
    this.input.on('pointermove', (ptr) => { if (dragging) setValue(ptr.x); });
    this.input.on('pointerup',   ()    => { dragging = false; });
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
