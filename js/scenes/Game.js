// Game.js - main simulation
window.GameScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  init(data) {
    this.mode = data.mode || 'classic';
  }

  create() {
    const CFG = window.CONFIG;
    this.CFG = CFG;

    this.add.image(CFG.DESIGN_WIDTH / 2, CFG.DESIGN_HEIGHT / 2, 'bg-gradient');

    // RNG: deterministic for daily, Math.random for others
    if (this.mode === 'daily') {
      const d = window.Daily.create();
      this.rng = d.next;
      this.dailyKey = d.key;
    } else {
      this.rng = Math.random;
    }

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

    this.food = null;       // {col, row, type: 'apple'|'boss', sprite}
    this.powerUpItems = []; // [{col, row, powerType, sprite, timeLeft}]
    this.applesEaten = 0;
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.bossHitCount = 0;

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

    // obstacle timer
    if (this.mode === 'endless' || this.mode === 'daily') {
      const ival = this.mode === 'daily' ? CFG.DAILY_OBSTACLE_INTERVAL_MS : CFG.OBSTACLE_INTERVAL_MS;
      this.obstacleTimer = this.time.addEvent({
        delay: ival,
        loop: true,
        callback: () => this._spawnObstacle(),
      });
    }

    // boss movement counter
    this.bossMoveCounter = 0;

    this.cameras.main.setBackgroundColor(CFG.COLORS.bgDeep);

    // resume from pause via HUD events
    this.hud.events.on('toggle-pause', () => this._togglePause());

    // announce mode briefly
    window.FX.floatText(this,
      CFG.DESIGN_WIDTH / 2, CFG.BOARD_Y - 40,
      this.mode.toUpperCase(),
      '#e2e8f0', 22
    );

    // start ambient music if enabled
    window.AudioFX.startMusic();

    this.events.once('shutdown', () => {
      this.inputSys.destroy();
      window.AudioFX.stopMusic();
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
    else window.AudioFX.startMusic();
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
    return false;
  }

  _spawnFood() {
    const CFG = this.CFG;
    let type = 'apple';
    if ((this.applesEaten + 1) % CFG.BOSS_FOOD_EVERY === 0) {
      type = 'boss';
    }

    const cell = window.FoodSystem.pick(this.rng, CFG.GRID_COLS, CFG.GRID_ROWS,
      (c, r) => this._isOccupied(c, r));
    if (!cell) return;

    const texKey = type === 'boss' ? 'boss-orb' : 'apple-orb';
    const w = this._cellToWorld(cell);
    const sprite = this.add.image(w.x, w.y, texKey);
    sprite.setScale(0.65);
    this.foodLayer.add(sprite);

    this.tweens.add({
      targets: sprite, scale: { from: 0.6, to: 0.78 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    sprite.setAlpha(0);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 200 });

    this.food = { col: cell.col, row: cell.row, type, sprite };

    // spawn a separate power-up item alongside (with chance), max 2 on field
    if (this.powerUpItems.length < 2 && this.rng() < CFG.POWERUP_CHANCE) {
      this._spawnPowerUpItem();
    }
  }

  _spawnPowerUpItem() {
    const CFG = this.CFG;
    const powerType = this.powerUps.pickRandom(this.rng);
    const texKey = powerType.id === 'ghost' ? 'pu-ghost'
                 : powerType.id === 'slowmo' ? 'pu-slowmo'
                 : 'pu-magnet';

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

    this.powerUps.apply(item.powerType);
    window.AudioFX.powerUpSfx();
    window.FX.vibrate(35);
    window.FX.shockwave(this, worldX, worldY, item.powerType.color);
    window.FX.flash(this, item.powerType.color, 260, 0.18);
    window.FX.floatText(this, worldX, worldY - 10, item.powerType.label.toUpperCase(),
      Phaser.Display.Color.IntegerToColor(item.powerType.color).rgba, 22);
    window.FX.shake(this, 140, 0.008);

    this.tweens.killTweensOf(item.sprite);
    item.sprite.destroy();
    this.powerUpItems.splice(index, 1);
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

    // magnet attraction: pull apple toward head
    if (this.powerUps.hasMagnet() && this.food && this.food.type === 'apple') {
      const head = this.snake.head();
      const dx = this.food.col - head.col;
      const dy = this.food.row - head.row;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0 && dist <= this.CFG.MAGNET_RANGE + 3) {
        const hw = this._cellToWorld(head);
        this.food.sprite.x = Phaser.Math.Linear(this.food.sprite.x, hw.x, this.CFG.MAGNET_LERP);
        this.food.sprite.y = Phaser.Math.Linear(this.food.sprite.y, hw.y, this.CFG.MAGNET_LERP);
        if (dist > 1 && this.tickAccum < 20) {
          const step = { c: Math.sign(dx), r: Math.sign(dy) };
          if (Math.abs(dx) >= Math.abs(dy) && step.c !== 0) {
            this.food.col = head.col + step.c;
          } else if (step.r !== 0) {
            this.food.row = head.row + step.r;
          }
        }
      }
    }
  }

  _tick() {
    const CFG = this.CFG;

    // wrap in endless mode
    const wrapC = this.mode === 'endless' ? CFG.GRID_COLS : null;
    const wrapR = this.mode === 'endless' ? CFG.GRID_ROWS : null;

    const { wrapped } = this.snake.advance(wrapC, wrapR);

    if (wrapped) {
      const head = this.snake.head();
      const w = this._cellToWorld(head);
      window.FX.shockwave(this, w.x + CFG.BOARD_X, w.y + CFG.BOARD_Y, CFG.COLORS.snakeGlow);
    }

    // wall collision (non-wrap modes)
    if (wrapC === null && this.snake.isOutOfBounds(CFG.GRID_COLS, CFG.GRID_ROWS)) {
      this._die();
      return;
    }

    // self collision (ghost passes through self)
    if (this.snake.hitsSelf(this.powerUps.isGhost())) {
      this._die();
      return;
    }

    // obstacle collision (ghost passes through obstacles)
    const h = this.snake.head();
    if (this.obstacles.has(h.col, h.row) && !this.powerUps.isGhost()) {
      this._die();
      return;
    }

    // sprite count sync
    while (this.snakeSprites.length < this.snake.cells.length) {
      this._addSegmentSprite(this.snake.cells[this.snakeSprites.length], false);
    }

    // food eat
    if (this.food && h.col === this.food.col && h.row === this.food.row) {
      this._eat();
    }

    // power-up item collection
    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const item = this.powerUpItems[i];
      if (h.col === item.col && h.row === item.row) {
        this._collectPowerUpItem(i);
        break;
      }
    }

    // boss moves every few ticks
    if (this.food && this.food.type === 'boss') {
      this.bossMoveCounter += 1;
      if (this.bossMoveCounter >= this.CFG.BOSS_MOVE_TICKS) {
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
      this.bossHitCount = 0;
      const mult = this.combo.registerEat();
      const gained = CFG.POINTS_APPLE * mult;
      this.score += gained;
      this.snake.grow(1);
      window.AudioFX.eatSfx(mult);
      window.FX.vibrate(25);
      window.FX.shockwave(this, worldX, worldY, CFG.COLORS.apple);
      window.FX.floatText(this, worldX, worldY - 10, `+${gained}${mult > 1 ? `  x${mult}` : ''}`,
        mult > 1 ? '#fbbf24' : '#ff9fb3', mult > 1 ? 26 : 20);
      if (this.powerUps.hasMagnet()) this.powerUps.consumeMagnet();
      const steps = Math.floor(this.applesEaten / CFG.TICK_STEP_EVERY);
      this.tickMs = Math.max(CFG.TICK_MIN_MS, CFG.TICK_START_MS - steps * CFG.TICK_STEP_MS);
    } else if (f.type === 'boss') {
      this.bossHitCount += 1;

      if (this.bossHitCount < CFG.BOSS_HP) {
        // Not caught yet — flash and teleport to opposite side
        const hitsLeft = CFG.BOSS_HP - this.bossHitCount;
        window.AudioFX.bossSfx();
        window.FX.vibrate([20, 20, 40]);
        window.FX.shockwave(this, worldX, worldY, CFG.COLORS.boss);
        window.FX.floatText(this, worldX, worldY - 10,
          `${hitsLeft} MORE!`, '#fbbf24', 22);
        this._teleportBoss();
        // emit score update (no change) and return — keep food alive
        this.hud.events.emit('score', this.score);
        return;
      }

      // 3rd hit — boss finally caught
      this.bossHitCount = 0;
      this.applesEaten += 1;
      const mult = this.combo.registerEat();
      const gained = CFG.POINTS_BOSS * mult + CFG.POINTS_BOSS_BONUS;
      this.score += gained;
      this.snake.grow(2);
      window.AudioFX.bossSfx();
      window.FX.vibrate([30, 30, 60]);
      window.FX.shockwave(this, worldX, worldY, CFG.COLORS.boss);
      window.FX.flash(this, CFG.COLORS.boss, 240, 0.2);
      window.FX.floatText(this, worldX, worldY - 10, `+${gained}  BOSS!`, '#fbbf24', 28);
      // Speed up game minimally on each boss catch
      this.tickMs = Math.max(CFG.TICK_MIN_MS, this.tickMs - CFG.BOSS_CATCH_SPEED_BOOST);
      // Spawn a terrain obstacle as reward/punishment
      this._spawnObstacle();
      const steps = Math.floor(this.applesEaten / CFG.TICK_STEP_EVERY);
      this.tickMs = Math.max(CFG.TICK_MIN_MS, CFG.TICK_START_MS - steps * CFG.TICK_STEP_MS - CFG.BOSS_CATCH_SPEED_BOOST);
    }

    this.hud.events.emit('score', this.score);
    this.hud.events.emit('combo', this.combo.multiplier, this.combo.progress());
    this.hud.events.emit('tick-ms', this.tickMs);

    this._clearFood();
    this._spawnFood();
  }

  _teleportBoss() {
    const f = this.food;
    if (!f || f.type !== 'boss') return;
    const CFG = this.CFG;

    // Teleport to opposite corner area
    let nc = CFG.GRID_COLS - 1 - f.col;
    let nr = CFG.GRID_ROWS - 1 - f.row;

    // Try the opposite spot and a few nearby cells
    for (let attempt = 0; attempt < 15; attempt++) {
      const tc = Math.max(1, Math.min(CFG.GRID_COLS - 2, nc));
      const tr = Math.max(1, Math.min(CFG.GRID_ROWS - 2, nr));
      if (!this.snake.occupies(tc, tr) && !this.obstacles.has(tc, tr) &&
          !(this.food && this.food.col === tc && this.food.row === tr)) {
        f.col = tc;
        f.row = tr;
        const w = this._cellToWorld(f);
        this.tweens.killTweensOf(f.sprite);
        f.sprite.setPosition(w.x, w.y);
        f.sprite.setAlpha(0);
        this.tweens.add({ targets: f.sprite, alpha: 1, duration: 180 });
        this.tweens.add({
          targets: f.sprite, scale: { from: 0.6, to: 0.78 },
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        window.FX.shockwave(this, w.x + CFG.BOARD_X, w.y + CFG.BOARD_Y, CFG.COLORS.boss);
        return;
      }
      nc = CFG.GRID_COLS - 1 - f.col + Math.floor(this.rng() * 7) - 3;
      nr = CFG.GRID_ROWS - 1 - f.row + Math.floor(this.rng() * 7) - 3;
    }
  }

  _moveBoss() {
    const f = this.food;
    if (!f || f.type !== 'boss') return;
    const CFG = this.CFG;
    const dirs = [{c:1,r:0},{c:-1,r:0},{c:0,r:1},{c:0,r:-1}];
    // try random order
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
      this.tweens.add({
        targets: f.sprite,
        x: w.x, y: w.y,
        duration: 180, ease: 'Sine.easeInOut',
      });
      break;
    }
  }

  _die() {
    if (this.gameOver) return;
    this.gameOver = true;
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

    // save best
    let newBest = false;
    if (this.mode === 'daily') {
      newBest = window.Storage.setDaily(this.dailyKey, this.score);
    } else {
      newBest = window.Storage.setBest(this.mode, this.score);
    }

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
