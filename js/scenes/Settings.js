// Settings.js - toggle settings + volume sliders + player name modal
window.SettingsScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Settings' }); }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.add.image(CX, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');

    this.add.text(CX, 120, 'SETTINGS', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '44px', color: '#e2e8f0', fontStyle: 'bold',
    }).setOrigin(0.5);

    this._makeToggle(CX, 220, 'Sound FX',     'sfx');
    this._makeSlider(CX, 285, 'FX Volume',     'fxVolume',    v => window.AudioFX.setFxVolume(v));
    this._makeToggle(CX, 365, 'Ambient Music', 'music');
    this._makeSlider(CX, 430, 'Music Volume',  'musicVolume', v => window.AudioFX.setMusicVolume(v));
    this._makeToggle(CX, 510, 'Haptics',       'haptics');
    this._makeNameField(CX, 630);

    this._makeButton(CX, 790, 'BACK', '#94a3b8', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });

    this.events.once('shutdown', () => this._removeDomInput());
  }

  // ── Name field ──────────────────────────────────────────────────────────────

  _makeNameField(cx, y) {
    this.add.text(cx, y - 24, 'PLAYER NAME', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#475569', letterSpacing: 5,
    }).setOrigin(0.5);

    this._nameDisplay = this.add.text(cx, y + 20, window.Storage.getPlayerName(), {
      fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '22px', color: '#22d3ee',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 10, true, true);

    const bg = this.add.rectangle(cx, y + 20, 320, 54, 0x0d1324, 0.88)
      .setStrokeStyle(1.5, 0x22d3ee, 0.5);
    this.add.text(cx + 145, y + 20, '✎', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#334155',
    }).setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setStrokeStyle(1.5, 0x22d3ee, 1.0));
    bg.on('pointerout',  () => bg.setStrokeStyle(1.5, 0x22d3ee, 0.5));
    bg.on('pointerdown', () => this._showNameModal());
  }

  _showNameModal() {
    if (this._modalObjs) return;
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH  / 2;
    const CY  = CFG.DESIGN_HEIGHT / 2;
    const D   = 500;
    this._modalObjs = [];

    const add = obj => { this._modalObjs.push(obj); return obj; };

    // dim blocker — swallows all pointer events below
    add(this.add.rectangle(CX, CY, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.80)
      .setDepth(D).setInteractive());

    // panel
    add(this.add.rectangle(CX, CY - 10, 390, 240, 0x080e1c, 0.98)
      .setStrokeStyle(2, 0x22d3ee, 0.8).setDepth(D + 1));

    add(this.add.text(CX, CY - 90, 'ENTER YOUR NAME', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#22d3ee', letterSpacing: 5,
    }).setOrigin(0.5).setDepth(D + 2));

    // input visual background
    add(this.add.rectangle(CX, CY - 30, 320, 52, 0x0d1324, 1)
      .setStrokeStyle(1.5, 0x22d3ee, 1).setDepth(D + 2));

    // SAVE button
    add(this._makeModalBtn(CX - 82, CY + 60, 'SAVE', '#4ade80', D + 2, () => {
      this._commitName();
    }));

    // BACK button
    add(this._makeModalBtn(CX + 82, CY + 60, 'BACK', '#64748b', D + 2, () => {
      this._closeNameModal();
    }));

    // DOM input (transparent bg, floats over the visual rect)
    this._domInput = this._spawnDomInput(CX, CY - 30, 310, 44,
      window.Storage.getPlayerName(), 20);

    this._domInput.addEventListener('keydown', e => {
      if (e.key === 'Enter')  this._commitName();
      if (e.key === 'Escape') this._closeNameModal();
    });
  }

  _commitName() {
    const val = (this._domInput ? this._domInput.value : '').trim().slice(0, 16) || 'Anon';
    window.Storage.setPlayerName(val);
    if (this._nameDisplay) this._nameDisplay.setText(val);
    this._closeNameModal();
  }

  _closeNameModal() {
    (this._modalObjs || []).forEach(o => { try { o.destroy(); } catch {} });
    this._modalObjs = null;
    this._removeDomInput();
  }

  // ── Shared DOM input helper ─────────────────────────────────────────────────

  _spawnDomInput(designCX, designCY, designW, designH, value, fsize) {
    const canvas = this.sys.game.canvas;
    const r = canvas.getBoundingClientRect();
    const sx = r.width  / window.CONFIG.DESIGN_WIDTH;
    const sy = r.height / window.CONFIG.DESIGN_HEIGHT;

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 16;
    inp.value = value || '';
    inp.style.cssText = [
      'position:fixed',
      `left:${r.left + (designCX - designW / 2) * sx}px`,
      `top:${r.top  + (designCY - designH / 2) * sy}px`,
      `width:${designW * sx}px`,
      `height:${designH * sy}px`,
      `font-size:${fsize * sy}px`,
      'font-family:"Arial Black",Arial,sans-serif',
      'color:#22d3ee',
      'background:transparent',
      'border:none',
      'text-align:center',
      'outline:none',
      'z-index:9999',
      'caret-color:#4ade80',
    ].join(';');
    document.body.appendChild(inp);
    setTimeout(() => { inp.focus(); inp.select(); }, 40);
    return inp;
  }

  _removeDomInput() {
    if (this._domInput && document.body.contains(this._domInput)) {
      document.body.removeChild(this._domInput);
    }
    this._domInput = null;
  }

  // ── Modal button ────────────────────────────────────────────────────────────

  _makeModalBtn(x, y, label, colorHex, depth, onClick) {
    const w = 144, h = 52;
    const cont = this.add.container(x, y).setDepth(depth);
    const ci = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.95).setStrokeStyle(2, ci, 0.9);
    const tx = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '20px', color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([bg, tx]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerdown', () => {
      this.tweens.add({ targets: cont, scale: 0.95, duration: 70, yoyo: true });
      onClick();
    });
    return cont;
  }

  // ── Toggle ──────────────────────────────────────────────────────────────────

  _makeToggle(x, y, label, key) {
    const w = 380, h = 56;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.7)
      .setStrokeStyle(1, 0x1a2440, 1);
    const lbl = this.add.text(-w / 2 + 20, 0, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#e2e8f0',
    }).setOrigin(0, 0.5);
    const switchBg = this.add.rectangle(w / 2 - 44, 0, 56, 28, 0x1a2440, 1);
    const knob     = this.add.circle(w / 2 - 58, 0, 10, 0x4ade80, 1);

    const render = () => {
      const on = window.Storage.getSetting(key);
      switchBg.fillColor = on ? 0x166534 : 0x1a2440;
      knob.fillColor = on ? 0x4ade80 : 0x64748b;
      knob.x = on ? (w / 2 - 30) : (w / 2 - 58);
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

  // ── Volume slider ───────────────────────────────────────────────────────────

  _makeSlider(cx, y, label, settingKey, applyFn) {
    const trackW = 260, trackH = 6, knobR = 11;

    this.add.text(cx - trackW / 2 - 14, y, label, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#64748b',
    }).setOrigin(1, 0.5);

    this.add.rectangle(cx, y, trackW, trackH, 0x1a2440, 1);

    let value = window.Storage.getSetting(settingKey);
    if (typeof value !== 'number') value = 1.0;

    const fill = this.add.rectangle(cx - trackW / 2, y, trackW, trackH, 0x4ade80, 1).setOrigin(0, 0.5);
    fill.scaleX = value;
    const knob = this.add.circle(cx - trackW / 2 + value * trackW, y, knobR, 0x4ade80, 1);
    const pct  = this.add.text(cx + trackW / 2 + 14, y, `${Math.round(value * 100)}%`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#94a3b8',
    }).setOrigin(0, 0.5);

    const setValue = px => {
      value = Phaser.Math.Clamp((px - (cx - trackW / 2)) / trackW, 0, 1);
      fill.scaleX = value;
      knob.x = cx - trackW / 2 + value * trackW;
      pct.setText(`${Math.round(value * 100)}%`);
      window.Storage.setSetting(settingKey, value);
      applyFn(value);
    };

    const zone = this.add.zone(cx, y, trackW + knobR * 2, 40).setInteractive({ useHandCursor: true });
    let dragging = false;
    zone.on('pointerdown', ptr => { dragging = true; setValue(ptr.x); });
    this.input.on('pointermove', ptr => { if (dragging) setValue(ptr.x); });
    this.input.on('pointerup',   ()  => { dragging = false; });
  }

  // ── Back button ─────────────────────────────────────────────────────────────

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 260, h = 56;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.85)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.9);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '22px',
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
