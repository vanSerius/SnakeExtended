// HUD.js - parallel overlay scene
window.HUDScene = class extends Phaser.Scene {
  constructor() { super({ key: 'HUD' }); }

  init(data) { this.mode = data.mode; }

  create() {
    const CFG = window.CONFIG;
    const CX = CFG.DESIGN_WIDTH / 2;

    this.modeLabel = this.add.text(24, 28, this.mode.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#94a3b8',
      letterSpacing: 4,
    });

    this.scoreText = this.add.text(CX, 56, '0', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: '#4ade80',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.scoreText.setShadow(0, 0, '#22d3ee', 16, true, true);

    // combo display
    this.comboGroup = this.add.container(CX, 100);
    this.comboText = this.add.text(0, 0, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.comboBar = this.add.rectangle(0, 18, 120, 4, 0xfbbf24, 0.9);
    this.comboBarBg = this.add.rectangle(0, 18, 120, 4, 0x1a2440, 0.7);
    this.comboGroup.add([this.comboBarBg, this.comboBar, this.comboText]);
    this.comboGroup.setAlpha(0);

    // power-up indicators (bottom) — 4 icons
    this.puIcons = {};
    const iconY = CFG.DESIGN_HEIGHT - 48;
    const gap = 70;
    this.puIcons.ghost  = this._makePuIcon(CX - gap * 1.5, iconY, 'pu-ghost',   '#22d3ee', 'Ghost');
    this.puIcons.slowmo = this._makePuIcon(CX - gap * 0.5, iconY, 'pu-slowmo',  '#a78bfa', 'Slow-Mo');
    this.puIcons.shield = this._makePuIcon(CX + gap * 0.5, iconY, 'pu-shield',  '#fbbf24', 'Shield');
    this.puIcons.shrink = this._makePuIcon(CX + gap * 1.5, iconY, 'pu-shrink',  '#fb923c', 'Shrink');

    // pause button (top-right)
    this.pauseBtn = this.add.text(CFG.DESIGN_WIDTH - 24, 28, 'II', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerdown', () => {
      window.AudioFX.clickSfx();
      this.events.emit('toggle-pause');
    });

    // pause overlay
    this.pauseOverlay = this.add.container(CX, CFG.DESIGN_HEIGHT / 2).setVisible(false);
    const bg = this.add.rectangle(0, 0, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.6);
    const label = this.add.text(0, -80, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // volume sliders (compact, inside overlay)
    const trackW = 220;
    const trackH = 5;
    const knobR  = 9;
    const sliderItems = [];

    const makeOverlaySlider = (localY, icon, settingKey, applyFn) => {
      const lbl = this.add.text(-trackW / 2 - 12, localY, icon, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#64748b',
      }).setOrigin(1, 0.5);

      const trackBg = this.add.rectangle(0, localY, trackW, trackH, 0x1a2440, 1);

      let value = window.Storage.getSetting(settingKey);
      if (typeof value !== 'number') value = 1.0;

      const fill = this.add.rectangle(-trackW / 2, localY, trackW, trackH, 0x4ade80, 1).setOrigin(0, 0.5);
      fill.scaleX = value;
      const knob = this.add.circle(-trackW / 2 + value * trackW, localY, knobR, 0x4ade80, 1);

      const pct = this.add.text(trackW / 2 + 12, localY, `${Math.round(value * 100)}%`, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#94a3b8',
      }).setOrigin(0, 0.5);

      // zone for hit detection (inside the container — world x = CX + 0 = CX)
      const zone = this.add.zone(0, localY, trackW + knobR * 2, 34).setInteractive({ useHandCursor: true });

      const setValue = (ptrX) => {
        // ptrX is world x; track left edge is CX - trackW/2
        value = Phaser.Math.Clamp((ptrX - (CX - trackW / 2)) / trackW, 0, 1);
        fill.scaleX = value;
        knob.x = -trackW / 2 + value * trackW;
        pct.setText(`${Math.round(value * 100)}%`);
        window.Storage.setSetting(settingKey, value);
        applyFn(value);
      };

      zone.on('pointerdown', (ptr, _lx, _ly, event) => {
        event.stopPropagation();
        this._activePauseSlider = setValue;
        setValue(ptr.x);
      });

      sliderItems.push(lbl, trackBg, fill, knob, pct, zone);
      return { fill, knob, pct };
    };

    makeOverlaySlider(-10, 'FX Vol',    'fxVolume',    v => window.AudioFX.setFxVolume(v));
    makeOverlaySlider( 35, 'Music Vol', 'musicVolume', v => window.AudioFX.setMusicVolume(v));

    // scene-level drag tracking for the pause sliders
    this._activePauseSlider = null;
    this.input.on('pointermove', (ptr) => { if (this._activePauseSlider && ptr.isDown) this._activePauseSlider(ptr.x); });
    this.input.on('pointerup',   ()    => { this._activePauseSlider = null; });

    const hint = this.add.text(0, 82, 'tap anywhere to resume', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#64748b',
    }).setOrigin(0.5);

    this.pauseOverlay.add([bg, label, ...sliderItems, hint]);
    bg.setInteractive();
    bg.on('pointerdown', () => this.events.emit('toggle-pause'));
    this.pauseOverlay.setDepth(1000);

    // wire game events
    this.events.on('score', s => this._setScore(s));
    this.events.on('combo', (m, p) => this._setCombo(m, p));
    this.events.on('tick-ms', t => this._onTick(t));
    this.events.on('powerups', pu => this._onPowerUps(pu));
    this.events.on('paused-state', p => this._setPaused(p));
    this.events.on('score-flash-red', () => {
      this.scoreText.setTint(0xef4444);
      this.time.delayedCall(500, () => this.scoreText.clearTint());
    });

    // tick combo updates visually each frame using the game scene's combo
    this.gameScene = this.scene.get('Game');
  }

  update() {
    if (!this.gameScene || !this.gameScene.combo) return;
    const p = this.gameScene.combo.progress();
    const m = this.gameScene.combo.multiplier;
    if (m > 1) {
      this.comboGroup.setAlpha(1);
      this.comboText.setText(`x${m} COMBO`);
      this.comboBar.scaleX = p;
    } else {
      this.comboGroup.setAlpha(0);
    }

    // powerup timers
    if (this.gameScene.powerUps) {
      const pu  = this.gameScene.powerUps.active;
      const gs  = this.gameScene;
      const CFG = window.CONFIG;
      this._setPuIcon('ghost',  pu.ghost  / CFG.GHOST_MS,  pu.ghost  > 0);
      this._setPuIcon('slowmo', pu.slowmo / CFG.SLOWMO_MS, pu.slowmo > 0);
      this._setPuIcon('shield', pu.shield ? 1 : 0,         pu.shield);
      this._setPuIcon('shrink', gs.shrinkFlashMs > 0 ? gs.shrinkFlashMs / 1200 : 0,
                                gs.shrinkFlashMs > 0);
    }
  }

  _makePuIcon(x, y, tex, color, name) {
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
    const c = this.add.container(x, y);

    // Dark background
    const bg = this.add.rectangle(0, 0, 60, 60, 0x0d1324, 0.85);
    bg.setStrokeStyle(1.5, colorNum, 0.55);

    // Battery fill: anchored at bottom, scaleY drains top-down as time runs out
    const batteryFill = this.add.rectangle(0, 28, 54, 52, colorNum, 0.32);
    batteryFill.setOrigin(0.5, 1); // anchor at bottom so top disappears first

    const icon = this.add.image(0, -5, tex).setScale(0.55);
    const label = this.add.text(0, 22, name, {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#94a3b8',
    }).setOrigin(0.5);
    const badge = this.add.text(22, -22, '', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '14px', color: '#fbbf24', fontStyle: 'bold',
    }).setOrigin(0.5);

    c.add([bg, batteryFill, icon, label, badge]);
    return { container: c, icon, label, badge, bg, batteryFill, colorNum, color };
  }

  _setPuIcon(id, progress, active, count = null) {
    const ic = this.puIcons[id];
    if (!ic) return;
    if (active) {
      ic.container.setAlpha(1);
      ic.batteryFill.scaleY = Math.max(0, progress);
      ic.batteryFill.setAlpha(0.38);
      ic.icon.setAlpha(1);
      ic.icon.clearTint();
      ic.icon.setScale(0.55 + Math.sin(this.time.now * 0.008) * 0.03);
      ic.label.setAlpha(1);
      if (count !== null) ic.badge.setText(count > 0 ? `${count}` : '');
      else ic.badge.setText('');
    } else {
      ic.container.setAlpha(1);
      ic.batteryFill.scaleY = 0;
      ic.batteryFill.setAlpha(0);
      ic.icon.setAlpha(0.28);
      ic.icon.setTint(0x555555);
      ic.icon.setScale(0.55);
      ic.label.setAlpha(0.35);
      ic.badge.setText('');
    }
  }

  _setScore(s) {
    this.scoreText.setText(`${s}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.2, to: 1 },
      duration: 200, ease: 'Cubic.easeOut',
    });
  }

  _setCombo(mult, _p) {
    if (mult > 1) {
      this.tweens.add({
        targets: this.comboGroup,
        scale: { from: 1.3, to: 1 },
        duration: 220, ease: 'Back.easeOut',
      });
    }
  }

  _onTick(_t) {}
  _onPowerUps(_pu) {}

  _setPaused(p) {
    this.pauseOverlay.setVisible(p);
  }
};
