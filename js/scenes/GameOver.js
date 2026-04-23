// GameOver.js - end screen with leaderboard name prompt
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

    const headingColor = this.victory ? '#4ade80' : '#f87171';
    const heading = this.add.text(CX, 180, this.victory ? 'YOU WON!' : 'GAME OVER', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '58px', color: headingColor, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, headingColor, 22, true, true);

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
    const scoreText = this.add.text(CX, 355, '0', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '88px', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 26, true, true);

    const counter = { v: 0 };
    const countDuration = Math.min(1400, 500 + this.finalScore * 1.5);
    this.tweens.add({
      targets: counter, v: this.finalScore, duration: countDuration, ease: 'Cubic.easeOut',
      onUpdate: () => scoreText.setText(`${Math.floor(counter.v)}`),
      onComplete: () => scoreText.setText(`${this.finalScore}`),
    });

    this.add.text(CX, 430, `${this.applesEaten} eats`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#475569',
    }).setOrigin(0.5);

    const best = window.Storage.getBest('journey');
    this.add.text(CX, 468, `Best: ${best}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#64748b',
    }).setOrigin(0.5);

    if (this.newBest) {
      const nb = this.add.text(CX, 512, 'NEW BEST!', {
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontSize: '26px', color: '#fbbf24', fontStyle: 'bold',
      }).setOrigin(0.5).setShadow(0, 0, '#fbbf24', 14, true, true);
      this.tweens.add({
        targets: nb, scale: { from: 1, to: 1.1 },
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // status line (leaderboard feedback shown here)
    this._statusText = this.add.text(CX, 562, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#334155',
    }).setOrigin(0.5);

    // buttons — hidden until after name prompt
    this._retryBtn = this._makeButton(CX, 670, 'RETRY', '#4ade80', () => {
      window.AudioFX.clickSfx();
      window.AudioFX.restartMusic();
      this.scene.start('Game', { mode: 'journey' });
    });
    this._menuBtn = this._makeButton(CX, 764, 'MENU', '#64748b', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
    this._retryBtn.setAlpha(0);
    this._menuBtn.setAlpha(0);

    // cleanup DOM input if scene shuts down mid-prompt
    this.events.once('shutdown', () => this._removeDomInput());

    // after count-up finishes, check leaderboard
    this.time.delayedCall(countDuration + 200, () => this._checkLeaderboard());
  }

  // ── Leaderboard check ───────────────────────────────────────────────────────

  async _checkLeaderboard() {
    if (this.finalScore <= 0) { this._showButtons(); return; }

    this._statusText.setText('checking leaderboard…').setColor('#334155');

    const rows = await window.Leaderboard.getTop(10);

    // qualifies if leaderboard unavailable, fewer than 10 entries, or score beats last place
    const qualifies = !rows || rows.length < 10 || this.finalScore > rows[rows.length - 1].score;

    if (!qualifies) {
      window.Leaderboard.submit(this.finalScore, this.applesEaten, this.victory);
      this._statusText.setText('').setColor('#334155');
      this._showButtons();
      return;
    }

    this._statusText.setText('🏆  YOU MADE THE TOP 10!').setColor('#fbbf24');
    this.time.delayedCall(700, () => this._showNamePrompt());
  }

  // ── Inline name prompt ──────────────────────────────────────────────────────

  _showNamePrompt() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH / 2;
    const promptY = 630;

    this._promptObjs = [];
    const add = obj => { this._promptObjs.push(obj); return obj; };

    add(this.add.text(CX, promptY - 30, 'YOUR NAME FOR THE LEADERBOARD', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#475569', letterSpacing: 4,
    }).setOrigin(0.5));

    // input visual bg
    add(this.add.rectangle(CX, promptY + 16, 300, 52, 0x0d1324, 0.92)
      .setStrokeStyle(1.5, 0x22d3ee, 1));

    // SAVE button
    add(this._makePromptBtn(CX - 82, promptY + 88, 'SAVE', '#4ade80', () => {
      const val = (this._domInput ? this._domInput.value : '').trim().slice(0, 16) || 'Anon';
      window.Storage.setPlayerName(val);
      this._submitAndContinue();
    }));

    // SKIP button
    add(this._makePromptBtn(CX + 82, promptY + 88, 'SKIP', '#475569', () => {
      this._submitAndContinue();
    }));

    this._domInput = this._spawnDomInput(CX, promptY + 16, 290, 44,
      window.Storage.getPlayerName(), 20);

    this._domInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = (this._domInput.value || '').trim().slice(0, 16) || 'Anon';
        window.Storage.setPlayerName(val);
        this._submitAndContinue();
      }
    });
  }

  _submitAndContinue() {
    (this._promptObjs || []).forEach(o => { try { o.destroy(); } catch {} });
    this._promptObjs = null;
    this._removeDomInput();

    window.Leaderboard.submit(this.finalScore, this.applesEaten, this.victory).then(ok => {
      if (!this.scene.isActive('GameOver')) return;
      this._statusText.setText(ok ? '✓ score saved to leaderboard' : '').setColor('#4ade80');
    });

    this._showButtons();
  }

  _showButtons() {
    this.tweens.add({ targets: [this._retryBtn, this._menuBtn], alpha: 1, duration: 300 });
  }

  // ── DOM input helper ────────────────────────────────────────────────────────

  _spawnDomInput(designCX, designCY, designW, designH, value, fsize) {
    const canvas = this.sys.game.canvas;
    const r  = canvas.getBoundingClientRect();
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

  // ── Prompt button ───────────────────────────────────────────────────────────

  _makePromptBtn(x, y, label, colorHex, onClick) {
    const w = 144, h = 52;
    const cont = this.add.container(x, y);
    const ci   = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.95).setStrokeStyle(2, ci, 0.9);
    const tx   = this.add.text(0, 0, label, {
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

  // ── Nav button ──────────────────────────────────────────────────────────────

  _makeButton(x, y, label, colorHex, onClick) {
    const w = 320, h = 64;
    const container = this.add.container(x, y);
    const colorInt  = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg   = this.add.rectangle(0, 0, w, h, 0x0d1324, 0.88).setStrokeStyle(2, colorInt, 0.9);
    const glow = this.add.rectangle(0, 0, w, h, colorInt, 0.08);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '26px', color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([glow, bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover',  () => { this.tweens.add({ targets: container, scale: 1.04, duration: 120 }); glow.setAlpha(0.22); });
    container.on('pointerout',   () => { this.tweens.add({ targets: container, scale: 1,    duration: 120 }); glow.setAlpha(0.08); });
    container.on('pointerdown',  () => { this.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true }); onClick(); });
    return container;
  }
};
