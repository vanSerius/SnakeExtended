// HighScores.js - global leaderboard via Supabase
window.HighScoresScene = class extends Phaser.Scene {
  constructor() { super({ key: 'HighScores' }); }

  create() {
    const CFG = window.CONFIG;
    const CX  = CFG.DESIGN_WIDTH / 2;

    this.add.image(CX, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');
    this.add.rectangle(CX, CFG.DESIGN_HEIGHT / 2, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0.35);

    const gDeco = this.add.graphics().setAlpha(0.08);
    gDeco.lineStyle(1, 0x22d3ee, 1);
    gDeco.strokeEllipse(CX, 110, 420, 160);

    this.add.text(CX, 72, 'HIGH SCORES', {
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontSize: '38px', color: '#22d3ee', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#22d3ee', 18, true, true);

    this.add.text(CX, 114, 'GLOBAL TOP 10', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#334155', letterSpacing: 6,
    }).setOrigin(0.5);

    const sep = this.add.graphics();
    sep.fillStyle(0x22d3ee, 0.5);
    sep.fillRect(CX - 48, 136, 96, 2);
    sep.fillStyle(0x4ade80, 0.25);
    sep.fillRect(CX - 80, 136, 22, 2);
    sep.fillRect(CX + 58, 136, 22, 2);

    const localBest = window.Storage.getBest('journey');
    const myName = window.Storage.getPlayerName();
    this.add.text(CX, 156, `${myName}  ·  best: ${localBest > 0 ? localBest : '—'}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#475569',
    }).setOrigin(0.5);

    this._rowContainer = this.add.container(0, 0);

    const loadingText = this.add.text(CX, 490, 'Loading…', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#334155',
    }).setOrigin(0.5);

    window.Leaderboard.getTop(10).then(rows => {
      loadingText.destroy();
      if (!rows || rows.length === 0) {
        this.add.text(CX, 490, 'No scores yet.\nBe the first!', {
          fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#334155', align: 'center',
        }).setOrigin(0.5);
        return;
      }
      this._renderRows(rows, CX, myName);
    });

    this._makeButton(CX, 888, 'BACK', '#475569', () => {
      window.AudioFX.clickSfx();
      this.scene.start('MainMenu');
    });
  }

  _renderRows(rows, CX, myName) {
    const startY = 180;
    const rowH   = 68;
    const rankColors = ['#fbbf24', '#94a3b8', '#b45309'];

    rows.forEach((row, i) => {
      const cy     = startY + i * rowH + rowH / 2;
      const isTop3 = i < 3;
      const isMe   = row.player_name === myName;
      const rankColor = rankColors[i] || '#334155';

      const bg = this.add.rectangle(CX, cy, 464, rowH - 6,
        isMe ? 0x071a0e : 0x0d1324, isMe ? 0.85 : 0.5
      ).setStrokeStyle(1.2, isMe ? 0x4ade80 : (isTop3 ? 0x22d3ee : 0x1a2440),
        isMe ? 0.7 : (isTop3 ? 0.35 : 0.4));
      this._rowContainer.add(bg);

      // rank
      const rankLabel = i === 0 ? '👑' : `#${i + 1}`;
      this._rowContainer.add(this.add.text(CX - 215, cy, rankLabel, {
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontSize: isTop3 ? '19px' : '14px', color: rankColor,
      }).setOrigin(0, 0.5));

      // name + trophy
      const displayName = row.player_name + (row.victory ? '  🏆' : '');
      const nameColor = isMe ? '#4ade80' : (isTop3 ? '#e2e8f0' : '#94a3b8');
      this._rowContainer.add(this.add.text(CX - 162, cy, displayName, {
        fontFamily: isTop3 ? '"Arial Black", Arial, sans-serif' : 'Arial, sans-serif',
        fontSize: isTop3 ? '17px' : '14px', color: nameColor,
      }).setOrigin(0, 0.5));

      // score
      const scoreColor = isTop3 ? '#4ade80' : '#64748b';
      const scoreText = this.add.text(CX + 218, cy, `${row.score}`, {
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontSize: isTop3 ? '22px' : '17px', color: scoreColor,
      }).setOrigin(1, 0.5);
      if (isTop3) scoreText.setShadow(0, 0, rankColor, 8, true, true);
      this._rowContainer.add(scoreText);
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
