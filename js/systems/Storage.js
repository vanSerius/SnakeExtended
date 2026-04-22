// Storage.js - localStorage wrapper
window.Storage = (() => {
  const KEY = window.CONFIG.STORAGE_KEY;

  const defaults = () => ({
    bestClassic: 0,
    bestEndless: 0,
    dailyScores: {}, // { "20260419": 42 }
    settings: {
      sfx: true,
      music: true,
      haptics: true,
      dpad: false,
      scanlines: false,
      fxVolume: 1.0,
      musicVolume: 1.0,
    },
  });

  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        cache = defaults();
      } else {
        const parsed = JSON.parse(raw);
        cache = Object.assign(defaults(), parsed);
        cache.settings = Object.assign(defaults().settings, parsed.settings || {});
        cache.dailyScores = parsed.dailyScores || {};
      }
    } catch (e) {
      cache = defaults();
    }
    return cache;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  return {
    get: () => load(),
    save,
    setBest(mode, score) {
      const s = load();
      if (mode === 'classic' && score > s.bestClassic) { s.bestClassic = score; save(); return true; }
      if (mode === 'endless' && score > s.bestEndless) { s.bestEndless = score; save(); return true; }
      return false;
    },
    setDaily(dateKey, score) {
      const s = load();
      const prev = s.dailyScores[dateKey] || 0;
      if (score > prev) { s.dailyScores[dateKey] = score; save(); return true; }
      return false;
    },
    getBest(mode) {
      const s = load();
      if (mode === 'classic') return s.bestClassic;
      if (mode === 'endless') return s.bestEndless;
      return 0;
    },
    getDaily(dateKey) {
      const s = load();
      return s.dailyScores[dateKey] || 0;
    },
    toggleSetting(name) {
      const s = load();
      s.settings[name] = !s.settings[name];
      save();
      return s.settings[name];
    },
    getSetting(name) {
      return load().settings[name];
    },
    setSetting(name, value) {
      const s = load();
      s.settings[name] = value;
      save();
    },
  };
})();
