// Input.js - swipe + keyboard input, emits direction events
window.InputSystem = class {
  constructor(scene) {
    this.scene = scene;
    this.threshold = 24;
    this.startX = 0;
    this.startY = 0;
    this.tracking = false;
    this.fired = false;
    this.listeners = [];

    scene.input.on('pointerdown', this._onDown, this);
    scene.input.on('pointermove', this._onMove, this);
    scene.input.on('pointerup', this._onUp, this);

    this.keys = scene.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
      esc: 'ESC', space: 'SPACE',
    });

    this.keys.up.on('down', () => this._emit('up'));
    this.keys.down.on('down', () => this._emit('down'));
    this.keys.left.on('down', () => this._emit('left'));
    this.keys.right.on('down', () => this._emit('right'));
    this.keys.w.on('down', () => this._emit('up'));
    this.keys.s.on('down', () => this._emit('down'));
    this.keys.a.on('down', () => this._emit('left'));
    this.keys.d.on('down', () => this._emit('right'));
    this.keys.esc.on('down', () => this._emit('pause'));
    this.keys.space.on('down', () => this._emit('pause'));
  }

  onDirection(cb) { this.listeners.push(cb); }

  _emit(dir) {
    this.listeners.forEach(cb => cb(dir));
  }

  _onDown(p) {
    this.startX = p.x;
    this.startY = p.y;
    this.tracking = true;
    this.fired = false;
  }

  _onMove(p) {
    if (!this.tracking || this.fired) return;
    this._check(p);
  }

  _onUp(p) {
    if (!this.tracking) return;
    if (!this.fired) this._check(p);
    this.tracking = false;
  }

  _check(p) {
    const dx = p.x - this.startX;
    const dy = p.y - this.startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (Math.max(adx, ady) < this.threshold) return;
    this.fired = true;
    if (adx > ady) {
      this._emit(dx > 0 ? 'right' : 'left');
    } else {
      this._emit(dy > 0 ? 'down' : 'up');
    }
    // reset anchor so a continued drag can trigger again
    this.startX = p.x;
    this.startY = p.y;
    this.fired = false;
  }

  destroy() {
    this.scene.input.off('pointerdown', this._onDown, this);
    this.scene.input.off('pointermove', this._onMove, this);
    this.scene.input.off('pointerup', this._onUp, this);
    this.listeners = [];
  }
};
