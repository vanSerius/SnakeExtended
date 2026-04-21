// Boss.js - Boss variant definitions, controller, and selector

window.BOSS_TYPES = {
  blitz: {
    key: 'blitz',
    hp: 3,
    arenaColor: 0xfbbf24,
    arenaHex: '#fbbf24',
    textureKey: 'boss-blitz',
    label: 'BLITZ',
  },
  ice: {
    key: 'ice',
    hp: 2,
    arenaColor: 0x38bdf8,
    arenaHex: '#38bdf8',
    textureKey: 'boss-ice',
    label: 'ICE',
  },
  mirror: {
    key: 'mirror',
    hp: 2,
    arenaColor: 0x7c3aed,
    arenaHex: '#7c3aed',
    textureKey: 'boss-mirror',
    label: 'MIRROR',
  },
  bomb: {
    key: 'bomb',
    hp: 2,
    arenaColor: 0x991b1b,
    arenaHex: '#991b1b',
    textureKey: 'boss-bomb',
    label: 'BOMB',
  },
  phantom: {
    key: 'phantom',
    hp: 2,
    arenaColor: 0x374151,
    arenaHex: '#94a3b8',
    textureKey: 'boss-phantom',
    label: 'PHANTOM',
  },
  blob: {
    key: 'blob',
    hp: 1,
    arenaColor: 0xd4a853,
    arenaHex: '#d4a853',
    textureKey: 'boss-blob',
    label: 'BLOB',
  },
};

// ── BossController ────────────────────────────────────────────────────

window.BossController = class {
  constructor(scene, kind) {
    this.kind = kind;
    this.def = window.BOSS_TYPES[kind];
    this.hp = this.def.hp;
    this.hitCount = 0;

    // variant state
    this.mines = [];
    this.freezeOrbs = [];
    this.clone = null;
    this.history = [];
    this.invisPhase = 'visible';
    this.dropCounter = 0;
    this.lastBossCell = null;
    this.frozenUntilMs = 0;
    this.moveEveryTick = (kind === 'ice');
    this.orbRespawnQueue = [];
    this.subBlobs = [];
  }

  isFrozen(scene) {
    return this.frozenUntilMs > scene.time.now;
  }

  onSpawn(scene, cell) {
    scene._playArenaColorWave(this.def.arenaHex);

    const CFG = scene.CFG;
    window.FX.floatText(
      scene,
      CFG.BOARD_X + CFG.BOARD_W / 2,
      CFG.BOARD_Y + CFG.BOARD_H / 2 - 40,
      this.def.label + ' BOSS!',
      this.def.arenaHex, 34
    );

    switch (this.kind) {
      case 'ice':    this._spawnFreezeOrbs(scene); break;
      case 'mirror': this._spawnClone(scene, cell); break;
      case 'blob':   this._blobOnSpawn(scene); break;
    }
  }

  onTick(scene) {
    switch (this.kind) {
      case 'ice':     this._iceTick(scene); break;
      case 'phantom': this._phantomTick(scene); break;
      case 'mirror':  this._mirrorTick(scene); break;
    }
  }

  onMove(scene, cell) {
    if (this.kind === 'mirror') {
      this.history.push({ col: cell.col, row: cell.row, time: scene.time.now });
      if (this.history.length > 60) this.history.shift();
    }
    if (this.kind === 'bomb') this._bombOnMove(scene, cell);
  }

  pickStep(scene) {
    if (this.kind === 'ice') return this._icePickStep(scene);
    return undefined; // undefined = use random walk
  }

  onHit(scene) {
    this.hitCount++;
    const defeated = this.hitCount >= this.hp;
    const hitsLeft = this.hp - this.hitCount;
    return { defeated, hitsLeft };
  }

  onDefeat(scene) {
    switch (this.kind) {
      case 'ice':    this._clearFreezeOrbs(scene); break;
      case 'bomb':   this._clearMines(scene); break;
      case 'mirror': this._clearClone(scene); break;
      case 'blob':   this._clearSubBlobs(scene); break;
    }
  }

  destroy(scene) {
    this.mines.forEach(m => {
      if (m.sprite) { scene.tweens.killTweensOf(m.sprite); m.sprite.destroy(); }
    });
    this.freezeOrbs.forEach(o => {
      if (o.sprite) { scene.tweens.killTweensOf(o.sprite); o.sprite.destroy(); }
    });
    if (this.clone && this.clone.sprite) {
      scene.tweens.killTweensOf(this.clone.sprite);
      this.clone.sprite.destroy();
    }
    this.mines = [];
    this.freezeOrbs = [];
    this.orbRespawnQueue = [];
    this.subBlobs.forEach(b => { if (b.sprite) { scene.tweens.killTweensOf(b.sprite); b.sprite.destroy(); } });
    this.subBlobs = [];
    this.clone = null;
  }

  // ── Ice ──────────────────────────────────────────────────────────────

  _spawnFreezeOrbs(scene) {
    const CFG = scene.CFG;
    const corners = [
      { col: 0, row: 0 },
      { col: CFG.GRID_COLS - 1, row: 0 },
      { col: 0, row: CFG.GRID_ROWS - 1 },
      { col: CFG.GRID_COLS - 1, row: CFG.GRID_ROWS - 1 },
    ];
    corners.forEach(c => {
      const w = scene._cellToWorld(c);
      const sprite = scene.add.image(w.x, w.y, 'freeze-orb').setScale(0.7).setAlpha(0);
      scene.foodLayer.add(sprite);
      scene.tweens.add({ targets: sprite, alpha: 0.9, duration: 300 });
      this.freezeOrbs.push({ col: c.col, row: c.row, sprite });
    });
  }

  scheduleOrbRespawn(col, row, nowMs) {
    this.orbRespawnQueue.push({ col, row, readyAt: nowMs + 5000 });
  }

  _spawnSingleFreezeOrb(scene, col, row) {
    if (this.freezeOrbs.some(o => o.col === col && o.row === row)) return;
    const w = scene._cellToWorld({ col, row });
    const sprite = scene.add.image(w.x, w.y, 'freeze-orb').setScale(0.3).setAlpha(0);
    scene.foodLayer.add(sprite);
    scene.tweens.add({ targets: sprite, alpha: 0.9, scale: 0.7, duration: 400 });
    this.freezeOrbs.push({ col, row, sprite });
  }

  _iceTick(scene) {
    const f = scene.food;
    if (!f || !f.sprite) return;

    // process orb respawn queue
    const now = scene.time.now;
    for (let i = this.orbRespawnQueue.length - 1; i >= 0; i--) {
      if (now >= this.orbRespawnQueue[i].readyAt) {
        const { col, row } = this.orbRespawnQueue.splice(i, 1)[0];
        this._spawnSingleFreezeOrb(scene, col, row);
      }
    }

    if (this.isFrozen(scene)) {
      // blue pulse to show boss is catchable
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(now * 0.008));
      f.sprite.setAlpha(pulse);
      f.sprite.setTint(0x38bdf8);
    } else {
      f.sprite.clearTint();
      f.sprite.setAlpha(1);
    }
  }

  _icePickStep(scene) {
    // frozen: stay still so the snake can catch it
    if (this.isFrozen(scene)) return null;

    const CFG = scene.CFG;
    const head = scene.snake.head();
    const f = scene.food;
    if (!f) return undefined;

    const dirs = [{ c: 1, r: 0 }, { c: -1, r: 0 }, { c: 0, r: 1 }, { c: 0, r: -1 }];
    const candidates = [];
    for (const d of dirs) {
      const nc = f.col + d.c;
      const nr = f.row + d.r;
      if (nc < 0 || nc >= CFG.GRID_COLS || nr < 0 || nr >= CFG.GRID_ROWS) continue;
      if (scene.snake.occupies(nc, nr)) continue;
      if (scene.obstacles.has(nc, nr)) continue;
      const minOrbDist = this.freezeOrbs.reduce((min, o) =>
        Math.min(min, Math.abs(nc - o.col) + Math.abs(nr - o.row)), Infinity);
      candidates.push({ nc, nr, minOrbDist, distFromHead: Math.abs(nc - head.col) + Math.abs(nr - head.row) });
    }

    if (candidates.length === 0) { scene._teleportBoss(); return null; }

    // hard rule: stay ≥4 cells from any orb; fall back only if truly cornered
    const safe = candidates.filter(c => c.minOrbDist >= 4);
    const pool = safe.length > 0 ? safe : candidates;

    // when snake is close, flee deterministically; otherwise random roam
    const dist = Math.abs(f.col - head.col) + Math.abs(f.row - head.row);
    if (dist <= 6) {
      pool.sort((a, b) => b.distFromHead - a.distFromHead);
      return pool[0];
    }
    return pool[Math.floor(scene.rng() * pool.length)];
  }

  _clearFreezeOrbs(scene) {
    this.orbRespawnQueue = [];
    this.freezeOrbs.forEach(o => {
      scene.tweens.killTweensOf(o.sprite);
      scene.tweens.add({
        targets: o.sprite, alpha: 0, scale: 0.1, duration: 300,
        onComplete: () => o.sprite.destroy(),
      });
    });
    this.freezeOrbs = [];
  }

  // ── Mirror ───────────────────────────────────────────────────────────

  _spawnClone(scene, cell) {
    const w = scene._cellToWorld(cell);
    const sprite = scene.add.image(w.x, w.y, 'boss-mirror').setScale(0.65).setAlpha(0);
    scene.foodLayer.add(sprite);
    scene.tweens.add({ targets: sprite, alpha: 0.8, duration: 200 });
    this.clone = { col: cell.col, row: cell.row, sprite };
    this.history = [];
  }

  _mirrorTick(scene) {
    if (!this.clone) return;
    const LAG = scene.CFG.MIRROR_LAG_MS;
    const now = scene.time.now;
    for (let i = 0; i < this.history.length; i++) {
      if (this.history[i].time <= now - LAG) {
        const target = this.history[i];
        const w = scene._cellToWorld(target);
        scene.tweens.add({
          targets: this.clone.sprite,
          x: w.x, y: w.y,
          duration: 140, ease: 'Sine.easeInOut',
        });
        this.clone.col = target.col;
        this.clone.row = target.row;
        this.history.splice(0, i + 1);
        break;
      }
    }
  }

  rebornClone(scene, bossCell) {
    if (this.clone && this.clone.sprite) {
      const old = this.clone.sprite;
      scene.tweens.killTweensOf(old);
      scene.tweens.add({
        targets: old, alpha: 0, scale: 0.1, duration: 200,
        onComplete: () => old.destroy(),
      });
      this.clone = null;
    }
    this.history = [];
    this._spawnClone(scene, bossCell);
  }

  _clearClone(scene) {
    if (!this.clone) return;
    const sprite = this.clone.sprite;
    scene.tweens.killTweensOf(sprite);
    scene.tweens.add({
      targets: sprite, alpha: 0, scale: 0.1, duration: 280,
      onComplete: () => sprite.destroy(),
    });
    this.clone = null;
  }

  // ── Bomb ─────────────────────────────────────────────────────────────

  _bombOnMove(scene, cell) {
    this.dropCounter++;
    if (this.dropCounter < scene.CFG.BOMB_MOVE_INTERVAL) return;
    this.dropCounter = 0;
    if (Math.random() >= scene.CFG.BOMB_DROP_CHANCE) return;

    if (this.mines.some(m => m.col === cell.col && m.row === cell.row)) return;
    if (scene.snake.occupies(cell.col, cell.row)) return;
    if (scene.food && scene.food.col === cell.col && scene.food.row === cell.row) return;

    const w = scene._cellToWorld(cell);
    const sprite = scene.add.image(w.x, w.y, 'mine').setScale(0.65).setAlpha(0);
    sprite.setDepth(13);
    scene.foodLayer.add(sprite);
    scene.tweens.add({ targets: sprite, alpha: 1, duration: 200 });
    this.mines.push({ col: cell.col, row: cell.row, sprite });
  }

  _clearMines(scene) {
    this.mines.forEach(m => {
      scene.tweens.killTweensOf(m.sprite);
      scene.tweens.add({
        targets: m.sprite, alpha: 0, scale: 0.1, duration: 300,
        onComplete: () => m.sprite.destroy(),
      });
    });
    this.mines = [];
  }

  // ── Phantom ──────────────────────────────────────────────────────────

  _phantomTick(scene) {
    const now = scene.time.now;
    const CYCLE = 1500;
    const phase = Math.floor(now / CYCLE) % 2;
    const f = scene.food;

    if (phase === 0 && this.invisPhase !== 'visible') {
      this.invisPhase = 'visible';
      if (f && f.sprite) {
        scene.tweens.add({ targets: f.sprite, alpha: 1, duration: 220 });
      }
    } else if (phase === 1 && this.invisPhase !== 'hidden') {
      this.invisPhase = 'hidden';
      if (f && f.sprite) {
        scene.tweens.add({ targets: f.sprite, alpha: 0.05, duration: 220 });
      }
    }

    // arena tint flicker
    if (scene.arenaTint) {
      const flicker = 0.18 + 0.1 * (Math.sin(now * 0.004) * 0.5 + 0.5);
      scene.arenaTint.setAlpha(flicker);
    }

    // grey particle trail when invisible
    if (this.invisPhase === 'hidden' && f && Math.random() < 0.28) {
      const w = scene._cellToWorld(f);
      scene.trailEmitter.emitParticleAt(
        w.x + scene.CFG.BOARD_X,
        w.y + scene.CFG.BOARD_Y, 1
      );
    }
  }

  // ── Blob ─────────────────────────────────────────────────────────────

  _blobScale(tier) {
    return tier === 2 ? 1.0 : 0.55;
  }

  _blobOnSpawn(scene) {
    const f = scene.food;
    if (!f || !f.sprite) return;
    scene.tweens.killTweensOf(f.sprite);
    f.sprite.setScale(1.8);
    scene.tweens.add({
      targets: f.sprite,
      scale: { from: 1.6, to: 2.0 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  spawnSplitBlobs(scene, pos, tier) {
    const scale = this._blobScale(tier);
    const dirs = [
      { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
      { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
      { dc: -1, dr: -1 }, { dc: 1, dr: 1 },
      { dc: 0, dr: 0 },
    ];
    let spawned = 0;
    for (const d of dirs) {
      if (spawned >= 2) break;
      const col = Math.max(0, Math.min(scene.CFG.GRID_COLS - 1, pos.col + d.dc));
      const row = Math.max(0, Math.min(scene.CFG.GRID_ROWS - 1, pos.row + d.dr));
      if (scene.snake.occupies(col, row)) continue;
      if (scene.obstacles.has(col, row)) continue;
      if (this.subBlobs.some(b => b.col === col && b.row === row)) continue;
      const w = scene._cellToWorld({ col, row });
      const sprite = scene.add.image(w.x, w.y, 'boss-blob').setScale(0.2).setAlpha(0);
      scene.foodLayer.add(sprite);
      scene.tweens.add({
        targets: sprite, alpha: 1, scale,
        duration: 280,
        onComplete: () => {
          scene.tweens.killTweensOf(sprite);
          scene.tweens.add({
            targets: sprite,
            scale: { from: scale * 0.88, to: scale * 1.12 },
            duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        },
      });
      this.subBlobs.push({ col, row, tier, sprite });
      spawned++;
    }
  }

  catchSubBlob(scene, index) {
    const blob = this.subBlobs[index];
    const tier = blob.tier;
    scene.tweens.killTweensOf(blob.sprite);
    scene.tweens.add({
      targets: blob.sprite, alpha: 0, scale: blob.sprite.scale * 1.6,
      duration: 220, onComplete: () => blob.sprite.destroy(),
    });
    this.subBlobs.splice(index, 1);
    if (tier > 1) this.spawnSplitBlobs(scene, { col: blob.col, row: blob.row }, tier - 1);
    return { tier, allDefeated: this.subBlobs.length === 0 };
  }

  _clearSubBlobs(scene) {
    this.subBlobs.forEach(b => {
      scene.tweens.killTweensOf(b.sprite);
      scene.tweens.add({
        targets: b.sprite, alpha: 0, scale: b.sprite.scale * 1.5, duration: 250,
        onComplete: () => b.sprite.destroy(),
      });
    });
    this.subBlobs = [];
  }
};

// ── BossSelector ──────────────────────────────────────────────────────

window.BossSelector = {
  last: null,
  _keys: Object.keys(window.BOSS_TYPES),

  pick(rng) {
    const available = this._keys.filter(k => k !== this.last);
    const key = available[Math.floor(rng() * available.length)];
    this.last = key;
    return key;
  },

  reset() {
    this.last = null;
  },
};
