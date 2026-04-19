// Food.js - picks spawn cells for apple / boss / power-up
window.FoodSystem = (() => {
  function randomFreeCell(rng, cols, rows, occupied) {
    // Collect free cells; for typical board sizes this is cheap.
    const free = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!occupied(c, r)) free.push({ col: c, row: r });
      }
    }
    if (free.length === 0) return null;
    const idx = Math.floor(rng() * free.length);
    return free[idx];
  }

  function pick(rng, cols, rows, occupied) {
    return randomFreeCell(rng, cols, rows, occupied);
  }

  return { pick };
})();
