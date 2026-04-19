// Obstacles.js - spawns data-block obstacles on a timer
window.Obstacles = class {
  constructor() {
    this.cells = []; // {col, row}
  }

  add(cell) { this.cells.push(cell); }

  has(col, row) {
    return this.cells.some(c => c.col === col && c.row === row);
  }

  clear() { this.cells = []; }

  // Find a cell that isn't occupied and is at least minDist away from snake head
  pickSafeCell(rng, cols, rows, snake, minDist = 5) {
    const free = [];
    const head = snake.head();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (snake.occupies(c, r)) continue;
        if (this.has(c, r)) continue;
        const d = Math.abs(c - head.col) + Math.abs(r - head.row);
        if (d < minDist) continue;
        free.push({ col: c, row: r });
      }
    }
    if (free.length === 0) return null;
    return free[Math.floor(rng() * free.length)];
  }
};
