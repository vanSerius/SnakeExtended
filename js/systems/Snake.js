// Snake.js - grid-based snake state
window.Snake = class {
  constructor(startCol, startRow, length = 4) {
    this.cells = [];
    for (let i = 0; i < length; i++) {
      this.cells.push({ col: startCol - i, row: startRow });
    }
    this.prev = this.cells.map(c => ({ ...c }));
    this.dir = { x: 1, y: 0 };
    this.pendingDirs = [];
    this.growPending = 0;
  }

  head() { return this.cells[0]; }

  queueDir(dir) {
    // prevent direct reversal relative to last queued
    const last = this.pendingDirs.length ? this.pendingDirs[this.pendingDirs.length - 1] : this.dir;
    if (dir.x === -last.x && dir.y === -last.y) return;
    if (dir.x === last.x && dir.y === last.y) return;
    if (this.pendingDirs.length < 2) this.pendingDirs.push(dir);
  }

  advance(wrapCols = null, wrapRows = null) {
    this.prev = this.cells.map(c => ({ ...c }));
    if (this.pendingDirs.length > 0) {
      this.dir = this.pendingDirs.shift();
    }
    const head = this.head();
    let nx = head.col + this.dir.x;
    let ny = head.row + this.dir.y;
    let wrapped = false;
    if (wrapCols !== null) {
      if (nx < 0) { nx = wrapCols - 1; wrapped = true; }
      else if (nx >= wrapCols) { nx = 0; wrapped = true; }
    }
    if (wrapRows !== null) {
      if (ny < 0) { ny = wrapRows - 1; wrapped = true; }
      else if (ny >= wrapRows) { ny = 0; wrapped = true; }
    }
    this.cells.unshift({ col: nx, row: ny });
    if (this.growPending > 0) {
      this.growPending -= 1;
    } else {
      this.cells.pop();
    }
    return { newHead: this.cells[0], wrapped };
  }

  grow(n = 1) { this.growPending += n; }

  isOutOfBounds(cols, rows) {
    const h = this.head();
    return h.col < 0 || h.col >= cols || h.row < 0 || h.row >= rows;
  }

  hitsSelf(ignoreGhost = false) {
    if (ignoreGhost) return false;
    const h = this.head();
    for (let i = 1; i < this.cells.length; i++) {
      if (this.cells[i].col === h.col && this.cells[i].row === h.row) return true;
    }
    return false;
  }

  occupies(col, row) {
    return this.cells.some(c => c.col === col && c.row === row);
  }
};
