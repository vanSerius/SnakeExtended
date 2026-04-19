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

    // power-up indicators (bottom)
    this.puIcons = {};
    const iconY = CFG.DESIGN_HEIGHT - 48;
    const gap = 90;
    this.puIcons.ghost  = this._makePuIcon(CX - gap, iconY, 'pu-ghost',  '#22d3ee', 'Ghost');
    this.puIcons.slowmo = this._makePuIcon(CX,       iconY, 'pu-slowmo', '#a78bfa', 'Slow-Mo');
    this.puIcons.magnet = this._makePuIcon(CX + gap, iconY, 'pu-magnet', '#f472b6', 'Magnet');

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
    const label = this.add.text(0, -20, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const hint = this.add.text(0, 30, 'tap to resume', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    this.pauseOverlay.add([bg, label, hint]);
    bg.setInteractive();
    bg.on('pointerdown', () => this.events.emit('toggle-pause'));
    this.pauseOverlay.setDepth(1000);

    // wire game events
    this.events.on('score', s => this._setScore(s));
    this.events.on('combo', (m, p) => this._setCombo(m, p));
    this.events.on('tick-ms', t => this._onTick(t));
    this.events.on('powerups', pu => this._onPowerUps(pu));
    this.events.on('paused-state', p => this._setPaused(p));

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
      const pu = this.gameScene.powerUps.active;
      const CFG = window.CONFIG;
      this._setPuIcon('ghost',  pu.ghost  / CFG.GHOST_MS, pu.ghost > 0);
      this._setPuIcon('slowmo', pu.slowmo / CFG.SLOWMO_MS, pu.slowmo > 0);
      this._setPuIcon('magnet', pu.magnetCharges / CFG.MAGNET_FOODS, pu.magnetCharges > 0, pu.magnetCharges);
    }
  }

  _makePuIcon(x, y, tex, color, name) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 60, 60, 0x0d1324, 0.5);
    bg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.4);
    const icon = this.add.image(0, -4, tex).setScale(0.55);
    const label = this.add.text(0, 20, name, {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#94a3b8',
    }).setOrigin(0.5);
    const badge = this.add.text(22, -22, '', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '14px', color: '#fbbf24', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([bg, icon, label, badge]);
    c.setAlpha(0.3);
    return { container: c, icon, label, badge, bg, color };
  }

  _setPuIcon(id, progress, active, count = null) {
    const ic = this.puIcons[id];
    if (!ic) return;
    if (active) {
      ic.container.setAlpha(1);
      ic.icon.setScale(0.55 + Math.sin(this.time.now * 0.008) * 0.03);
      if (count !== null) ic.badge.setText(count > 0 ? `${count}` : '');
      else ic.badge.setText('');
    } else {
      ic.container.setAlpha(0.3);
      ic.icon.setScale(0.55);
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
