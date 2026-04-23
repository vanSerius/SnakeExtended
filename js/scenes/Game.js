// Game.js - main simulation
window.GameScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  init(data) {
    this.mode = data.mode || 'journey';
  }

  create() {
    const CFG = window.CONFIG;
    this.CFG = CFG;

    this.add.image(CFG.DESIGN_WIDTH / 2, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');

    this.rng = Math.random;
    this.dailyKey = null;

    // board frame
    this._drawBoard();

    // state
    this.snake = new window.Snake(
      Math.floor(CFG.GRID_COLS / 2) - 2,
      Math.floor(CFG.GRID_ROWS / 2),
      4
    );
    this.obstacles = new window.Obstacles();
    this.combo = new window.Combo();
    this.powerUps = new window.PowerUpManager();

    this.food = null;       // {col, row, type: 'apple'|'boss', bossKind, sprite}
    this.powerUpItems = []; // [{col, row, powerType, sprite, timeLeft}]
    this.applesEaten = 0;
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.shrinkFlashMs = 0;
    this.powerUpSpawnChance = CFG.POWERUP_CHANCE;
    this.boss = null;
    this.arenaTint = null;
    this.arenaBorder = null;
    this.bossRushActive  = false;
    this.bossRushPending = false;
    this.bossRushQueue   = [];
    window.BossSelector.reset();

    this.tickMs = CFG.TICK_START_MS;
    this.tickAccum = 0;
    this.tickElapsed = 0;

    // visuals containers
    this.boardContainer = this.add.container(CFG.BOARD_X, CFG.BOARD_Y);
    this.snakeLayer = this.add.container(CFG.BOARD_X, CFG.BOARD_Y);
    this.foodLayer  = this.add.container(CFG.BOARD_X, CFG.BOARD_Y);
    this.obstacleLayer = this.add.container(CFG.BOARD_X, CFG.BOARD_Y);
    this.snakeLayer.setDepth(20);
    this.foodLayer.setDepth(15);
    this.obstacleLayer.setDepth(10);

    // particle emitter on tail
    this.trailEmitter = this.add.particles(0, 0, 'particle-trail', {
      x: 0, y: 0,
      lifespan: 400,
      speed: { min: 10, max: 40 },
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      blendMode: 'ADD',
      frequency: -1, // manual
      quantity: 3,
    });
    this.trailEmitter.setDepth(18);

    // snake visuals
    this.snakeSprites = [];
    this._rebuildSnakeSprites();

    // HUD
    this.scene.launch('HUD', { mode: this.mode });
    this.hud = this.scene.get('HUD');

    // input
    this.inputSys = new window.InputSystem(this);
    this.inputSys.onDirection(d => this._handleDir(d));

    // spawn first food
    this._spawnFood();

    // obstacle timer — journey spawns obstacles periodically for mounting difficulty
    this.obstacleTimer = this.time.addEvent({
      delay: CFG.OBSTACLE_INTERVAL_MS,
      loop: true,
      callback: () => this._spawnObstacle(),
    });

    // boss movement counter
    this.bossMoveCounter = 0;

    this.cameras.main.setBackgroundColor(CFG.COLORS.bgDeep);

    // resume from pause via HUD events
    this.hud.events.on('toggle-pause', () => this._togglePause());

    window.FX.floatText(this, CFG.DESIGN_WIDTH / 2, CFG.BOARD_Y - 40, 'JOURNEY', '#4ade80', 22);

    // restart music from beginning for every new run
    window.AudioFX.restartMusic();
    this.input.once('pointerdown', () => window.AudioFX.restartMusic());
    this.input.keyboard.once('keydown', () => window.AudioFX.restartMusic());

    this.events.once('shutdown', () => {
      this.inputSys.destroy();
      window.AudioFX.stopMusic();
      if (this.boss) { this.boss.destroy(this); this.boss = null; }
      if (this.arenaTint) { this.arenaTint.destroy(); this.arenaTint = null; }
      if (this.arenaBorder) { this.arenaBorder.destroy(); this.arenaBorder = null; }
      this.powerUpItems.forEach(item => {
        this.tweens.killTweensOf(item.sprite);
        item.sprite.destroy();
      });
      this.powerUpItems = [];
    });
  }

  _drawBoard() {
    const CFG = this.CFG;
    const g = this.add.graphics();
    // soft board background
    g.fillStyle(CFG.COLORS.boardBg, 0.55);
    g.fillRoundedRect(CFG.BOARD_X - 8, CFG.BOARD_Y - 8, CFG.BOARD_W + 16, CFG.BOARD_H + 16, 14);
    g.lineStyle(2, CFG.COLORS.snakeGlow, 0.25);
    g.strokeRoundedRect(CFG.BOARD_X - 8, CFG.BOARD_Y - 8, CFG.BOARD_W + 16, CFG.BOARD_H + 16, 14);

    // subtle grid
    g.lineStyle(1, CFG.COLORS.boardGrid, 0.35);
    for (let c = 1; c < CFG.GRID_COLS; c++) {
      const x = CFG.BOARD_X + c * CFG.CELL_PX;
      g.beginPath(); g.moveTo(x, CFG.BOARD_Y); g.lineTo(x, CFG.BOARD_Y + CFG.BOARD_H); g.strokePath();
    }
    for (let r = 1; r < CFG.GRID_ROWS; r++) {
      const y = CFG.BOARD_Y + r * CFG.CELL_PX;
      g.beginPath(); g.moveTo(CFG.BOARD_X, y); g.lineTo(CFG.BOARD_X + CFG.BOARD_W, y); g.strokePath();
    }
    g.setDepth(5);
  }

  _handleDir(d) {
    if (this.gameOver) return;
    if (d === 'pause') { this._togglePause(); return; }
    if (this.paused) return;
    const map = {
      up:    { x: 0,  y: -1 },
      down:  { x: 0,  y: 1 },
      left:  { x: -1, y: 0 },
      right: { x: 1,  y: 0 },
    };
    if (!map[d]) return;
    this.snake.queueDir(map[d]);
    window.AudioFX.turnSfx();
    window.FX.vibrate(10);
  }

  _togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    this.hud.events.emit('paused-state', this.paused);
    if (this.paused) window.AudioFX.stopMusic();
    else this.boss ? window.AudioFX.startBossMusic() : window.AudioFX.startMusic();
  }

  _rebuildSnakeSprites() {
    this.snakeSprites.forEach(s => { s.body.destroy(); s.glow.destroy(); });
    this.snakeSprites = [];
    this.snake.cells.forEach((c, i) => this._addSegmentSprite(c, i === 0));
    this._placeSnakeSprites(0);
  }

  _addSegmentSprite(cell, isHead) {
    const CFG = this.CFG;
    const tex = isHead ? 'snake-head' : 'snake-body';
    const glow = this.add.image(0, 0, tex).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setScale(1.35);
    const body = this.add.image(0, 0, tex);
    this.snakeLayer.add([glow, body]);
    this.snakeSprites.push({ body, glow, isHead });
  }

  _placeSnakeSprites(progress) {
    const CFG = this.CFG;
    const p = Phaser.Math.SmoothStep(progress, 0, 1);
    const ghost = this.powerUps.isGhost();
    const shield = this.powerUps.hasShield();
    for (let i = 0; i < this.snake.cells.length; i++) {
      const cur = this.snake.cells[i];
      const prev = this.snake.prev[i] || cur;
      const x = Phaser.Math.Linear(prev.col, cur.col, p) * CFG.CELL_PX + CFG.CELL_PX / 2;
      const y = Phaser.Math.Linear(prev.row, cur.row, p) * CFG.CELL_PX + CFG.CELL_PX / 2;
      const s = this.snakeSprites[i];
      if (!s) continue;
      s.body.setPosition(x, y);
      s.glow.setPosition(x, y);
      s.body.setAlpha(ghost ? 0.12 : 1);
      s.glow.setAlpha(ghost ? 0.06 : 0.5);
      if (shield) {
        s.body.setTint(0xfbbf24);
        s.glow.setTint(0xfde68a);
      } else {
        s.body.clearTint();
        s.glow.clearTint();
      }
      if (s.isHead) {
        // orient head by current direction
        const dir = this.snake.dir;
        s.body.setRotation(Math.atan2(dir.y, dir.x));
        s.glow.setRotation(s.body.rotation);
      }
    }
  }

  _cellToWorld(c) {
    return {
      x: c.col * this.CFG.CELL_PX + this.CFG.CELL_PX / 2,
      y: c.row * this.CFG.CELL_PX + this.CFG.CELL_PX / 2,
    };
  }

  _isOccupied(col, row) {
    if (this.snake.occupies(col, row)) return true;
    if (this.obstacles.has(col, row)) return true;
    if (this.food && this.food.col === col && this.food.row === row) return true;
    if (this.powerUpItems && this.powerUpItems.some(p => p.col === col && p.row === row)) return true;
    if (this.boss) {
      if (this.boss.mines.some(m => m.col === col && m.row === row)) return true;
      if (this.boss.freezeOrbs.some(o => o.col === col && o.row === row)) return true;
      if (this.boss.clone && this.boss.clone.col === col && this.boss.clone.row === row) return true;
      if (this.boss.subBlobs.some(b => b.col === col && b.row === row)) return true;
    }
    return false;
  }

  _spawnFood() {
    const CFG = this.CFG;

    // Boss Rush: no more bosses in queue → victory
    if (this.bossRushActive && this.bossRushQueue.length === 0) {
      this._youWon();
      return;
    }

    let type = 'apple';
    let bossKind = null;
    if (this.bossRushActive) {
      type = 'boss';
      bossKind = this.bossRushQueue.shift();
    } else if ((this.applesEaten + 1) % CFG.BOSS_FOOD_EVERY === 0) {
      type = 'boss';
      bossKind = window.BossSelector.pick(this.rng);
    }

    const cell = window.FoodSystem.pick(this.rng, CFG.GRID_COLS, CFG.GRID_ROWS,
      (c, r) => this._isOccupied(c, r));
    if (!cell) return;

    const def = bossKind ? window.BOSS_TYPES[bossKind] : null;
    const texKey = type === 'boss' ? def.textureKey : 'apple-orb';
    const w = this._cellToWorld(cell);
    const sprite = this.add.image(w.x, w.y, texKey);
    sprite.setScale(0.65);
    this.foodLayer.add(sprite);

    if (type === 'boss') {
      // boss onSpawn handles all animation (alpha fade-in + scale pulse)
      sprite.setAlpha(0);
    } else {
      this.tweens.add({
        targets: sprite, scale: { from: 0.6, to: 0.78 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 200 });
    }

    this.food = { col: cell.col, row: cell.row, type, bossKind, sprite };

    if (type === 'boss') {
      this.boss = new window.BossController(this, bossKind);
      this.boss.onSpawn(this, cell);
      this._bossAlertFlash();
      window.AudioFX.startBossMusic();
    }

    // spawn a separate power-up item alongside (with chance), max 2 on field
    if (this.powerUpItems.length < 2) {
      if (this.rng() < this.powerUpSpawnChance) {
        this._spawnPowerUpItem();
        this.powerUpSpawnChance = CFG.POWERUP_CHANCE;
      } else {
        this.powerUpSpawnChance = Math.min(0.98, this.powerUpSpawnChance + 0.02);
      }
    }
  }

  _spawnPowerUpItem() {
    const CFG = this.CFG;
    const powerType = this.powerUps.pickRandom(this.rng);
    const texKey = powerType.id === 'ghost'  ? 'pu-ghost'
                 : powerType.id === 'slowmo' ? 'pu-slowmo'
                 : powerType.id === 'shield' ? 'pu-shield'
                 : 'pu-shrink';

    const cell = window.FoodSystem.pick(this.rng, CFG.GRID_COLS, CFG.GRID_ROWS,
      (c, r) => this._isOccupied(c, r));
    if (!cell) return;

    const w = this._cellToWorld(cell);
    const sprite = this.add.image(w.x, w.y, texKey);
    sprite.setScale(0.65);
    this.foodLayer.add(sprite);

    sprite.setAlpha(0);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 200 });
    this.tweens.add({
      targets: sprite, scale: { from: 0.6, to: 0.72 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.powerUpItems.push({
      col: cell.col, row: cell.row,
      powerType, sprite,
      timeLeft: CFG.POWERUP_EXPIRE_MS,
    });
  }

  _removePowerUpItem(index) {
    const item = this.powerUpItems[index];
    this.tweens.killTweensOf(item.sprite);
    this.tweens.add({
      targets: item.sprite, alpha: 0, scale: 0.1, duration: 280,
      onComplete: () => item.sprite.destroy(),
    });
    this.powerUpItems.splice(index, 1);
  }

  _collectPowerUpItem(index) {
    const item = this.powerUpItems[index];
    const CFG = this.CFG;
    const w = this._cellToWorld(item);
    const worldX = w.x + CFG.BOARD_X;
    const worldY = w.y + CFG.BOARD_Y;

    window.AudioFX.powerUpSfx();
    window.FX.vibrate(35);
    window.FX.shockwave(this, worldX, worldY, item.powerType.color);
    window.FX.flash(this, item.powerType.color, 260, 0.18);
    window.FX.floatText(this, worldX, worldY - 10, item.powerType.label.toUpperCase(),
      Phaser.Display.Color.IntegerToColor(item.powerType.color).rgba, 22);
    window.FX.shake(this, 140, 0.008);

    if (item.powerType.id === 'shrink') {
      this._applyShrink();
    } else {
      this.powerUps.apply(item.powerType);
    }

    this.tweens.killTweensOf(item.sprite);
    item.sprite.destroy();
    this.powerUpItems.splice(index, 1);
  }

  _applyShrink() {
    const CFG = this.CFG;
    const toRemove = Math.min(CFG.SHRINK_AMOUNT, Math.max(0, this.snake.cells.length - 3));
    for (let i = 0; i < toRemove; i++) {
      this.snake.cells.pop();
      if (this.snake.prev.length > this.snake.cells.length) this.snake.prev.pop();
      this.snake.growPending = Math.max(0, this.snake.growPending - 1);
      if (this.snakeSprites.length > this.snake.cells.length) {
        const s = this.snakeSprites.pop();
        this.tweens.killTweensOf(s.body);
        this.tweens.killTweensOf(s.glow);
        this.tweens.add({
          targets: [s.body, s.glow], alpha: 0, scale: 0,
          duration: 220, ease: 'Power2',
          onComplete: () => { s.body.destroy(); s.glow.destroy(); },
        });
      }
    }
    this.shrinkFlashMs = 1200;
  }

  _shieldAbsorb() {
    this.powerUps.consumeShield();
    const head = this.snake.head();
    const w = this._cellToWorld(head);
    const wx = w.x + this.CFG.BOARD_X;
    const wy = w.y + this.CFG.BOARD_Y;
    window.FX.flash(this, this.CFG.COLORS.shield, 350, 0.45);
    window.FX.shockwave(this, wx, wy, this.CFG.COLORS.shield);
    window.FX.floatText(this, wx, wy - 10, 'SHIELD!', '#fbbf24', 28);
    window.AudioFX.powerUpSfx();
    window.FX.vibrate([30, 30]);
  }

  _updatePowerUpItems(delta) {
    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const item = this.powerUpItems[i];
      item.timeLeft -= delta;
      // blink when under 3 seconds remaining
      if (item.timeLeft < 3000) {
        item.sprite.setAlpha(0.4 + 0.6 * (Math.sin(this.time.now * 0.012) * 0.5 + 0.5));
      }
      if (item.timeLeft <= 0) {
        this._removePowerUpItem(i);
      }
    }
  }

  _clearFood() {
    if (!this.food) return;
    this.tweens.killTweensOf(this.food.sprite);
    this.food.sprite.destroy();
    this.food = null;
  }

  _spawnObstacle() {
    if (this.gameOver || this.paused) return;
    const cell = this.obstacles.pickSafeCell(this.rng, this.CFG.GRID_COLS, this.CFG.GRID_ROWS, this.snake, 5);
    if (!cell) return;
    this.obstacles.add(cell);
    const w = this._cellToWorld(cell);
    const img = this.add.image(w.x, w.y, 'obstacle').setAlpha(0).setScale(0.2);
    this.obstacleLayer.add(img);
    this.tweens.add({
      targets: img, alpha: 1, scale: 1, duration: 300, ease: 'Back.easeOut',
    });
    window.FX.shockwave(this, w.x + this.CFG.BOARD_X, w.y + this.CFG.BOARD_Y, this.CFG.COLORS.danger);
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    const effectiveTick = this.tickMs * this.powerUps.tickMultiplier();
    this.tickAccum += delta;
    this.tickElapsed += delta;
    this.powerUps.update(delta);
    this._updatePowerUpItems(delta);
    if (this.shrinkFlashMs > 0) this.shrinkFlashMs = Math.max(0, this.shrinkFlashMs - delta);
    const comboExpired = this.combo.update(delta);
    if (comboExpired) this.hud.events.emit('combo', 1, 0);

    if (this.tickAccum >= effectiveTick) {
      this.tickAccum -= effectiveTick;
      this.tickElapsed = 0;
      this._tick();
    }

    const progress = Math.min(1, this.tickElapsed / effectiveTick);
    this._placeSnakeSprites(progress);

    // particle trail at tail
    if (this.snake.cells.length > 2 && Math.random() < 0.7) {
      const tail = this.snake.cells[this.snake.cells.length - 1];
      const w = this._cellToWorld(tail);
      this.trailEmitter.emitParticleAt(
        w.x + this.CFG.BOARD_X,
        w.y + this.CFG.BOARD_Y,
        1
      );
    }

  }

  _tick() {
    const CFG = this.CFG;

    // no wrapping in journey mode
    const wrapC = null;
    const wrapR = null;

    const { wrapped } = this.snake.advance(wrapC, wrapR);

    if (wrapped) {
      const head = this.snake.head();
      const w = this._cellToWorld(head);
      window.FX.shockwave(this, w.x + CFG.BOARD_X, w.y + CFG.BOARD_Y, CFG.COLORS.snakeGlow);
    }

    const shieldUp = this.powerUps.hasShield();
    let shieldUsed = false;

    // wall collision (non-wrap modes)
    if (wrapC === null && this.snake.isOutOfBounds(CFG.GRID_COLS, CFG.GRID_ROWS)) {
      if (shieldUp) {
        // Wrap head to opposite side and consume shield
        const hd = this.snake.cells[0];
        hd.col = ((hd.col % CFG.GRID_COLS) + CFG.GRID_COLS) % CFG.GRID_COLS;
        hd.row = ((hd.row % CFG.GRID_ROWS) + CFG.GRID_ROWS) % CFG.GRID_ROWS;
        shieldUsed = true;
      } else {
        this._die();
        return;
      }
    }

    // self collision (ghost or shield passes through)
    if (this.snake.hitsSelf(this.powerUps.isGhost())) {
      if (shieldUp && !shieldUsed) {
        shieldUsed = true;
      } else {
        this._die();
        return;
      }
    }

    // obstacle collision (ghost or shield passes through)
    const h = this.snake.head();
    if (this.obstacles.has(h.col, h.row) && !this.powerUps.isGhost()) {
      if (shieldUp && !shieldUsed) {
        shieldUsed = true;
      } else {
        this._die();
        return;
      }
    }

    if (shieldUsed) this._shieldAbsorb();

    // sprite count sync
    while (this.snakeSprites.length < this.snake.cells.length) {
      this._addSegmentSprite(this.snake.cells[this.snakeSprites.length], false);
    }

    // mirror clone collision (before food eat)
    if (this.boss && this.boss.kind === 'mirror' && this.boss.clone) {
      const clone = this.boss.clone;
      if (h.col === clone.col && h.row === clone.row) {
        const cw = this._cellToWorld(clone);
        const cwx = cw.x + CFG.BOARD_X, cwy = cw.y + CFG.BOARD_Y;
        window.FX.shockwave(this, cwx, cwy, 0x7c3aed);
        window.FX.flash(this, 0x7c3aed, 200, 0.2);
        window.FX.floatText(this, cwx, cwy - 20, 'DECOY!', '#a78bfa', 22);
        this.boss.rebornClone(this, this.food);
      }
    }

    // food eat — blob mega-boss uses enlarged hitbox (Manhattan ≤ 1) to match visual size
    if (this.food) {
      const blobMega = this.food.type === 'boss' && this.food.bossKind === 'blob';
      const hitFood = blobMega
        ? Math.abs(h.col - this.food.col) + Math.abs(h.row - this.food.row) <= 1
        : h.col === this.food.col && h.row === this.food.row;
      if (hitFood) this._eat();
    }

    // freeze-orb collision — freezes the BOSS, not the snake
    if (this.boss && this.boss.freezeOrbs.length > 0) {
      for (let i = this.boss.freezeOrbs.length - 1; i >= 0; i--) {
        const orb = this.boss.freezeOrbs[i];
        if (h.col === orb.col && h.row === orb.row) {
          this.boss.frozenUntilMs = this.time.now + 2000;
          const ow = this._cellToWorld(orb);
          window.FX.shockwave(this, ow.x + CFG.BOARD_X, ow.y + CFG.BOARD_Y, 0x38bdf8);
          window.FX.flash(this, 0x38bdf8, 300, 0.3);
          window.FX.floatText(this, ow.x + CFG.BOARD_X, ow.y + CFG.BOARD_Y - 20, 'BOSS FROZEN!', '#38bdf8', 24);
          window.FX.shake(this, 180, 0.008);
          this.tweens.killTweensOf(orb.sprite);
          orb.sprite.destroy();
          this.boss.freezeOrbs.splice(i, 1);
          this.boss.scheduleOrbRespawn(orb.col, orb.row, this.time.now);
          break;
        }
      }
    }

    // mine collision
    if (this.boss && this.boss.mines.length > 0) {
      for (let i = this.boss.mines.length - 1; i >= 0; i--) {
        const mine = this.boss.mines[i];
        if (h.col === mine.col && h.row === mine.row) {
          const mw = this._cellToWorld(mine);
          const mwx = mw.x + CFG.BOARD_X, mwy = mw.y + CFG.BOARD_Y;
          mine.sprite.destroy();
          this.boss.mines.splice(i, 1);
          if (this.powerUps.hasShield()) {
            this._shieldAbsorb();
            window.FX.floatText(this, mwx, mwy - 20, 'BLOCKED!', '#fbbf24', 22);
          } else {
            const lost = Math.max(10, Math.floor(this.score * 0.1));
            this.score = Math.max(0, this.score - lost);
            window.FX.shockwave(this, mwx, mwy, 0x991b1b);
            window.FX.flash(this, 0xff0000, 280, 0.45);
            window.FX.shake(this, 260, 0.018);
            window.FX.floatText(this, mwx, mwy - 20, `-${lost}  SCORE!`, '#ef4444', 28);
            window.AudioFX.deathSfx();
            this.hud.events.emit('score', this.score);
            this.hud.events.emit('score-flash-red');
          }
          break;
        }
      }
    }

    // power-up item collection
    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const item = this.powerUpItems[i];
      if (h.col === item.col && h.row === item.row) {
        this._collectPowerUpItem(i);
        break;
      }
    }

    // blob sub-blob collision
    if (this.boss && this.boss.kind === 'blob' && this.boss.subBlobs.length > 0) {
      for (let i = this.boss.subBlobs.length - 1; i >= 0; i--) {
        const blob = this.boss.subBlobs[i];
        if (h.col === blob.col && h.row === blob.row) {
          const bw = this._cellToWorld(blob);
          const bwx = bw.x + CFG.BOARD_X, bwy = bw.y + CFG.BOARD_Y;
          const result = this.boss.catchSubBlob(this, i);
          const gained = result.tier === 2 ? 30 : 20;
          this.score += gained;
          window.AudioFX.bossSfx();
          window.FX.shockwave(this, bwx, bwy, this.boss.def.arenaColor);
          window.FX.floatText(this, bwx, bwy - 10,
            result.tier > 1 ? `SPLIT! +${gained}` : `+${gained}`,
            this.boss.def.arenaHex, result.tier > 1 ? 24 : 20);
          if (result.allDefeated) this._defeatBlobBoss();
          this.hud.events.emit('score', this.score);
          break;
        }
      }
    }

    // boss onTick (blob runs even after mega-blob eaten, to move sub-blobs)
    if (this.boss && (this.boss.kind === 'blob' || (this.food && this.food.type === 'boss'))) {
      this.boss.onTick(this);
    }
    // boss movement (only while boss food exists on the board)
    if (this.food && this.food.type === 'boss' && this.boss) {
      this.bossMoveCounter++;
      const moveTicks = this.boss.moveEveryTick ? 1 : CFG.BOSS_MOVE_TICKS;
      if (this.bossMoveCounter >= moveTicks) {
        this.bossMoveCounter = 0;
        this._moveBoss();
      }
    }
  }

  _eat() {
    const f = this.food;
    const CFG = this.CFG;

    const worldX = f.sprite.x + CFG.BOARD_X;
    const worldY = f.sprite.y + CFG.BOARD_Y;

    if (f.type === 'apple') {
      this.applesEaten += 1;
      const mult = this.combo.registerEat();
      const gained = CFG.POINTS_APPLE * mult;
      this.score += gained;
      this.snake.grow(1);
      window.AudioFX.eatSfx(mult);
      window.FX.vibrate(25);
      window.FX.shockwave(this, worldX, worldY, CFG.COLORS.apple);
      window.FX.floatText(this, worldX, worldY - 10, `+${gained}${mult > 1 ? `  x${mult}` : ''}`,
        mult > 1 ? '#fbbf24' : '#ff9fb3', mult > 1 ? 26 : 20);
      const steps = Math.floor(this.applesEaten / CFG.TICK_STEP_EVERY);
      this.tickMs = Math.max(CFG.TICK_MIN_MS, CFG.TICK_START_MS - steps * CFG.TICK_STEP_MS);

    } else if (f.type === 'boss') {
      if (f.bossKind === 'blob') { this._eatBlobFood(); return; }

      const hitResult = this.boss.onHit(this);

      if (!hitResult.defeated) {
        window.AudioFX.bossSfx();
        window.FX.vibrate([20, 20, 40]);
        window.FX.shockwave(this, worldX, worldY, this.boss.def.arenaColor);
        window.FX.floatText(this, worldX, worldY - 10,
          `${hitResult.hitsLeft} MORE!`, this.boss.def.arenaHex, 22);
        if (f.bossKind === 'blitz') {
          window.FX.flash(this, 0xffffff, 140, 0.35);
        }
        this._teleportBoss();
        if (f.bossKind === 'mirror') {
          this.boss.rebornClone(this, this.food);
        }
        this.hud.events.emit('score', this.score);
        return; // keep food alive
      }

      // boss defeated
      const prevTickMs = this.tickMs;
      const bossColor = this.boss.def.arenaColor;
      const bossHex = this.boss.def.arenaHex;

      this.boss.onDefeat(this);
      this.boss.destroy(this);
      this.boss = null;
      this._revertArenaColor();
      window.AudioFX.startMusic();

      this.applesEaten += 1;
      const mult = this.combo.registerEat();
      const gained = CFG.POINTS_BOSS * mult + CFG.POINTS_BOSS_BONUS;
      this.score += gained;

      // trim snake by 20% on boss defeat
      const newLen = Math.max(3, Math.floor(this.snake.cells.length * 0.8));
      const diff = this.snake.cells.length - newLen;
      if (diff > 0) this._shrinkSnakeBy(diff);

      window.AudioFX.bossSfx();
      window.FX.vibrate([30, 30, 60]);
      window.FX.shockwave(this, worldX, worldY, bossColor);
      window.FX.flash(this, bossColor, 240, 0.2);
      window.FX.floatText(this, worldX, worldY - 10, `+${gained}  BOSS!`, bossHex, 28);

      this._spawnObstacle();

      const steps = Math.floor(this.applesEaten / CFG.TICK_STEP_EVERY);
      this.tickMs = Math.max(CFG.TICK_MIN_MS, CFG.TICK_START_MS - steps * CFG.TICK_STEP_MS);

      if (this.tickMs < prevTickMs) {
        const cx = CFG.BOARD_X + CFG.BOARD_W / 2;
        const cy = CFG.BOARD_Y + CFG.BOARD_H / 2;
        window.FX.floatText(this, cx, cy, 'FASTER', '#fbbf24', 52);
      }
    }

    this.hud.events.emit('score', this.score);
    this.hud.events.emit('combo', this.combo.multiplier, this.combo.progress());
    this.hud.events.emit('tick-ms', this.tickMs);

    this._clearFood();
    // After a boss kill, check if this completes the first rotation → Boss Rush
    if (f.type === 'boss' && !this.bossRushActive && !this.bossRushPending && window.BossSelector.allSeen()) {
      this.bossRushPending = true;
      this._triggerBossRush();
    } else {
      this._spawnFood();
    }
  }

  _eatBlobFood() {
    const f = this.food;
    const CFG = this.CFG;
    const worldX = f.sprite.x + CFG.BOARD_X;
    const worldY = f.sprite.y + CFG.BOARD_Y;
    const pos = { col: f.col, row: f.row };
    const bossColor = this.boss.def.arenaColor;
    const bossHex = this.boss.def.arenaHex;

    window.AudioFX.bossSfx();
    window.FX.shockwave(this, worldX, worldY, bossColor);
    window.FX.flash(this, bossColor, 200, 0.22);
    window.FX.vibrate([25, 25, 50]);

    this._clearFood();
    this.boss.spawnSplitBlobs(this, pos, 2);
    this.score += 25;
    window.FX.floatText(this, worldX, worldY - 10, 'SPLIT!', bossHex, 32);
    this.hud.events.emit('score', this.score);
  }

  _defeatBlobBoss() {
    const CFG = this.CFG;
    const bossColor = this.boss.def.arenaColor;
    const bossHex = this.boss.def.arenaHex;
    const cx = CFG.BOARD_X + CFG.BOARD_W / 2;
    const cy = CFG.BOARD_Y + CFG.BOARD_H / 2;
    const prevTickMs = this.tickMs;

    this.boss.onDefeat(this);
    this.boss.destroy(this);
    this.boss = null;
    this._revertArenaColor();
    window.AudioFX.startMusic();

    this.applesEaten += 1;
    const mult = this.combo.registerEat();
    const gained = CFG.POINTS_BOSS_BONUS * mult;
    this.score += gained;

    const newLen = Math.max(3, Math.floor(this.snake.cells.length * 0.8));
    const diff = this.snake.cells.length - newLen;
    if (diff > 0) this._shrinkSnakeBy(diff);

    window.AudioFX.bossSfx();
    window.FX.vibrate([30, 30, 60]);
    window.FX.shockwave(this, cx, cy, bossColor);
    window.FX.flash(this, bossColor, 260, 0.25);
    window.FX.floatText(this, cx, cy - 10, `+${gained}  BLOB CLEARED!`, bossHex, 30);

    this._spawnObstacle();

    const steps = Math.floor(this.applesEaten / CFG.TICK_STEP_EVERY);
    this.tickMs = Math.max(CFG.TICK_MIN_MS, CFG.TICK_START_MS - steps * CFG.TICK_STEP_MS);
    if (this.tickMs < prevTickMs) {
      window.FX.floatText(this, cx, cy + 40, 'FASTER', '#fbbf24', 52);
    }

    this.hud.events.emit('score', this.score);
    this.hud.events.emit('tick-ms', this.tickMs);

    if (!this.bossRushActive && !this.bossRushPending && window.BossSelector.allSeen()) {
      this.bossRushPending = true;
      this._triggerBossRush();
    } else {
      this._spawnFood();
    }
  }

  _teleportBoss() {
    const f = this.food;
    if (!f || f.type !== 'boss') return;
    const CFG = this.CFG;
    const bossColor = this.boss ? this.boss.def.arenaColor : CFG.COLORS.boss;

    // temporarily clear food from occupied check so we can find a new cell
    const savedCol = f.col, savedRow = f.row;
    f.col = -1; f.row = -1;

    let nc = CFG.GRID_COLS - 1 - savedCol;
    let nr = CFG.GRID_ROWS - 1 - savedRow;

    for (let attempt = 0; attempt < 20; attempt++) {
      const tc = Math.max(1, Math.min(CFG.GRID_COLS - 2, nc));
      const tr = Math.max(1, Math.min(CFG.GRID_ROWS - 2, nr));
      if (!this._isOccupied(tc, tr)) {
        f.col = tc; f.row = tr;
        const w = this._cellToWorld(f);
        this.tweens.killTweensOf(f.sprite);
        f.sprite.setPosition(w.x, w.y);
        f.sprite.setAlpha(0);
        this.tweens.add({ targets: f.sprite, alpha: 1, duration: 180 });
        this.tweens.add({
          targets: f.sprite, scale: { from: 0.6, to: 0.78 },
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        window.FX.shockwave(this, w.x + CFG.BOARD_X, w.y + CFG.BOARD_Y, bossColor);
        return;
      }
      nc = CFG.GRID_COLS - 1 - savedCol + Math.floor(this.rng() * 7) - 3;
      nr = CFG.GRID_ROWS - 1 - savedRow + Math.floor(this.rng() * 7) - 3;
    }

    // fallback: restore original if no spot found
    f.col = savedCol; f.row = savedRow;
  }

  _moveBoss() {
    const f = this.food;
    if (!f || f.type !== 'boss') return;
    const CFG = this.CFG;

    // record current cell for bomb mine drops (set before moving)
    if (this.boss) this.boss.lastBossCell = { col: f.col, row: f.row };

    // frozen boss: don't move
    if (this.boss && this.boss.isFrozen(this)) return;

    // ask boss variant for a custom step
    if (this.boss) {
      const step = this.boss.pickStep(this);
      if (step !== undefined) {
        if (step !== null) {
          const prevCol = f.col, prevRow = f.row;
          f.col = step.nc; f.row = step.nr;
          const w = this._cellToWorld(f);
          const isWrap = Math.abs(step.nc - prevCol) > 1 || Math.abs(step.nr - prevRow) > 1;
          if (isWrap) {
            this.tweens.killTweensOf(f.sprite);
            f.sprite.setPosition(w.x, w.y);
            f.sprite.setAlpha(0);
            this.tweens.add({ targets: f.sprite, alpha: 1, duration: 120 });
            this.tweens.add({
              targets: f.sprite, scale: { from: 0.6, to: 0.78 },
              duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
          } else {
            this.tweens.add({ targets: f.sprite, x: w.x, y: w.y, duration: 180, ease: 'Sine.easeInOut' });
          }
          this.boss.onMove(this, f);
        }
        // null = teleported by pickStep, no further action
        return;
      }
    }

    // random walk (blitz, bomb, phantom; ice when far from head)
    const dirs = [{ c: 1, r: 0 }, { c: -1, r: 0 }, { c: 0, r: 1 }, { c: 0, r: -1 }];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const d of dirs) {
      const nc = f.col + d.c;
      const nr = f.row + d.r;
      if (nc < 0 || nc >= CFG.GRID_COLS || nr < 0 || nr >= CFG.GRID_ROWS) continue;
      if (this.snake.occupies(nc, nr)) continue;
      if (this.obstacles.has(nc, nr)) continue;
      f.col = nc; f.row = nr;
      const w = this._cellToWorld(f);
      this.tweens.add({ targets: f.sprite, x: w.x, y: w.y, duration: 180, ease: 'Sine.easeInOut' });
      if (this.boss) this.boss.onMove(this, f);
      break;
    }
  }

  _shrinkSnakeBy(n) {
    const minLen = 3;
    const actualRemove = Math.min(n, this.snake.cells.length - minLen);
    if (actualRemove <= 0) return;
    this.snake.cells.splice(this.snake.cells.length - actualRemove, actualRemove);
    for (let i = 0; i < actualRemove; i++) {
      const s = this.snakeSprites.pop();
      if (s) { s.body.destroy(); s.glow.destroy(); }
    }
  }

  _bossAlertFlash() {
    const CFG = this.CFG;
    [0, 230, 460].forEach(delay => {
      this.time.delayedCall(delay, () => {
        const g = this.add.graphics().setDepth(8);
        g.lineStyle(5, 0xff2020, 1.0);
        g.strokeRoundedRect(CFG.BOARD_X - 7, CFG.BOARD_Y - 7, CFG.BOARD_W + 14, CFG.BOARD_H + 14, 15);
        g.lineStyle(16, 0xff2020, 0.4);
        g.strokeRoundedRect(CFG.BOARD_X - 15, CFG.BOARD_Y - 15, CFG.BOARD_W + 30, CFG.BOARD_H + 30, 20);
        g.lineStyle(30, 0xff2020, 0.12);
        g.strokeRoundedRect(CFG.BOARD_X - 24, CFG.BOARD_Y - 24, CFG.BOARD_W + 48, CFG.BOARD_H + 48, 26);
        this.tweens.add({
          targets: g, alpha: 0, duration: 190,
          onComplete: () => g.destroy(),
        });
      });
    });
  }

  _playArenaColorWave(hex) {
    const CFG = this.CFG;

    // clear any existing tint + border
    [this.arenaTint, this.arenaBorder].forEach(obj => {
      if (obj) { this.tweens.killTweensOf(obj); obj.destroy(); }
    });
    this.arenaTint = null;
    this.arenaBorder = null;

    const colorInt = parseInt(hex.replace('#', ''), 16);

    // floor tint — sweeps in from left
    const rect = this.add.rectangle(
      CFG.BOARD_X + CFG.BOARD_W / 2,
      CFG.BOARD_Y + CFG.BOARD_H / 2,
      CFG.BOARD_W, CFG.BOARD_H,
      colorInt, 0
    ).setDepth(6);
    rect.scaleX = 0;
    this.arenaTint = rect;
    this.tweens.add({ targets: rect, scaleX: 1, alpha: 0.20, duration: 400, ease: 'Sine.easeOut' });

    // neon border glow — inner sharp ring + outer soft halo
    const g = this.add.graphics().setDepth(7).setAlpha(0);
    g.lineStyle(3, colorInt, 1.0);
    g.strokeRoundedRect(CFG.BOARD_X - 9, CFG.BOARD_Y - 9, CFG.BOARD_W + 18, CFG.BOARD_H + 18, 15);
    g.lineStyle(10, colorInt, 0.35);
    g.strokeRoundedRect(CFG.BOARD_X - 16, CFG.BOARD_Y - 16, CFG.BOARD_W + 32, CFG.BOARD_H + 32, 20);
    g.lineStyle(22, colorInt, 0.12);
    g.strokeRoundedRect(CFG.BOARD_X - 24, CFG.BOARD_Y - 24, CFG.BOARD_W + 48, CFG.BOARD_H + 48, 26);
    this.arenaBorder = g;
    this.tweens.add({ targets: g, alpha: 1, duration: 400, ease: 'Sine.easeOut' });
  }

  _revertArenaColor() {
    const ms = this.CFG.BOSS_ARENA_REVERT_MS;
    [['arenaTint', this.arenaTint], ['arenaBorder', this.arenaBorder]].forEach(([key, obj]) => {
      if (!obj) return;
      this[key] = null;
      this.tweens.add({ targets: obj, alpha: 0, duration: ms, onComplete: () => obj.destroy() });
    });
  }

  _triggerBossRush() {
    const CFG = this.CFG;
    const cx  = CFG.DESIGN_WIDTH  / 2;
    const cy  = CFG.DESIGN_HEIGHT / 2;

    // Build a fresh shuffled queue of all 6 boss types
    const keys = Object.keys(window.BOSS_TYPES);
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    this.bossRushQueue = keys;

    this.paused = true;
    window.AudioFX.stopMusic();

    // Dark overlay
    const overlay = this.add.rectangle(cx, cy, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0).setDepth(200);
    this.tweens.add({ targets: overlay, alpha: 0.82, duration: 350 });

    // "BOSS RUSH!" heading
    const heading = this.add.text(cx, cy - 80, 'BOSS\nRUSH!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '86px', fontStyle: 'bold',
      color: '#fbbf24', align: 'center',
    }).setOrigin(0.5).setDepth(201).setAlpha(0).setScale(0.3);
    heading.setShadow(0, 0, '#fbbf24', 40, true, true);

    this.tweens.add({
      targets: heading, alpha: 1, scale: 1.05,
      duration: 520, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: heading, scale: { from: 1.05, to: 0.97 },
        duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }),
    });

    const sub = this.add.text(cx, cy + 52, 'Defeat all 6 bosses!', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#94a3b8',
    }).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 380, delay: 480 });

    // Audio & haptics
    window.AudioFX.sirenSfx();
    this.time.delayedCall(520, () => window.AudioFX.sirenSfx());
    window.FX.vibrate([40, 40, 80, 40, 80]);
    [0, 300, 620].forEach(d => this.time.delayedCall(d, () => window.AudioFX.bossSfx()));

    // Dismiss after 3.2s → start rush
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: [overlay, heading, sub], alpha: 0, duration: 380,
        onComplete: () => { overlay.destroy(); heading.destroy(); sub.destroy(); },
      });
      this.time.delayedCall(340, () => {
        this.paused = false;
        this.bossRushActive = true;
        window.AudioFX.startMusic();
        this._spawnFood();
      });
    });
  }

  _youWon() {
    if (this.gameOver) return;
    this.gameOver = true;

    const CFG = this.CFG;
    const cx  = CFG.DESIGN_WIDTH  / 2;
    const cy  = CFG.DESIGN_HEIGHT / 2;

    window.AudioFX.stopMusic();
    window.FX.vibrate([30, 40, 60, 40, 80, 100]);

    let newBest = false;
    if (this.mode === 'daily') {
      newBest = window.Storage.setDaily(this.dailyKey, this.score);
    } else {
      newBest = window.Storage.setBest(this.mode, this.score);
    }

    const overlay = this.add.rectangle(cx, cy, CFG.DESIGN_WIDTH, CFG.DESIGN_HEIGHT, 0x000000, 0).setDepth(200);
    this.tweens.add({ targets: overlay, alpha: 0.88, duration: 450 });

    const heading = this.add.text(cx, cy - 80, 'YOU\nWON!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '86px', fontStyle: 'bold',
      color: '#4ade80', align: 'center',
    }).setOrigin(0.5).setDepth(201).setAlpha(0).setScale(0.3);
    heading.setShadow(0, 0, '#22d3ee', 40, true, true);

    this.tweens.add({
      targets: heading, alpha: 1, scale: 1.0,
      duration: 700, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: heading, scale: { from: 1.0, to: 1.07 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }),
    });

    const scoreLabel = this.add.text(cx, cy + 52, `Final Score: ${this.score}`, {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '28px', color: '#fbbf24',
    }).setOrigin(0.5).setDepth(201).setAlpha(0);
    this.tweens.add({ targets: scoreLabel, alpha: 1, duration: 500, delay: 650 });

    window.AudioFX.bossSfx();
    window.FX.flash(this, 0x4ade80, 600, 0.35);
    this.time.delayedCall(500, () => window.AudioFX.bossSfx());

    this.time.delayedCall(3600, () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', {
        mode: this.mode, score: this.score,
        applesEaten: this.applesEaten, newBest,
        dailyKey: this.dailyKey || null,
        victory: true,
      });
    });
  }

  _die() {
    if (this.gameOver) return;
    this.gameOver = true;

    if (this.boss) { this.boss.onDefeat(this); this.boss.destroy(this); this.boss = null; }
    if (this.arenaTint) { this.tweens.killTweensOf(this.arenaTint); this.arenaTint.destroy(); this.arenaTint = null; }
    if (this.arenaBorder) { this.tweens.killTweensOf(this.arenaBorder); this.arenaBorder.destroy(); this.arenaBorder = null; }

    const head = this.snake.head();
    const wpos = this._cellToWorld(head);
    const wx = wpos.x + this.CFG.BOARD_X;
    const wy = wpos.y + this.CFG.BOARD_Y;

    window.AudioFX.deathSfx();
    window.AudioFX.stopMusic();
    window.FX.vibrate([60, 40, 120]);
    window.FX.shake(this, 260, 0.018);
    window.FX.flash(this, this.CFG.COLORS.danger, 280, 0.35);
    window.FX.shockwave(this, wx, wy, this.CFG.COLORS.danger);

    // snake death particles
    this.snake.cells.forEach((c, i) => {
      const w = this._cellToWorld(c);
      this.trailEmitter.emitParticleAt(w.x + this.CFG.BOARD_X, w.y + this.CFG.BOARD_Y, 4);
    });

    const newBest = window.Storage.setBest(this.mode, this.score);

    this.time.delayedCall(700, () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', {
        mode: this.mode,
        score: this.score,
        applesEaten: this.applesEaten,
        newBest,
        dailyKey: this.dailyKey || null,
      });
    });
  }
};
