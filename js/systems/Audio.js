// Audio.js - Web Audio synthesis, no assets
window.AudioFX = (() => {
  let ctx = null;
  let masterGain = null;
  let musicNodes = null;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
  }

  function enabled() {
    return ctx && window.Storage.getSetting('sfx');
  }

  function beep(freq, duration, type = 'sine', gain = 0.3) {
    if (!enabled()) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g).connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function sweep(fromHz, toHz, duration, type = 'sawtooth', gain = 0.25) {
    if (!enabled()) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g).connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function chord(freqs, duration, type = 'sine', gain = 0.15) {
    freqs.forEach(f => beep(f, duration, type, gain));
  }

  function eatSfx(multiplier = 1) {
    if (!enabled()) return;
    const base = 520 + (multiplier - 1) * 90;
    beep(base, 0.08, 'triangle', 0.25);
    setTimeout(() => beep(base * 1.25, 0.08, 'triangle', 0.2), 40);
    setTimeout(() => beep(base * 1.5,  0.12, 'triangle', 0.18), 80);
  }

  function powerUpSfx() {
    if (!enabled()) return;
    chord([523.25, 659.25, 783.99], 0.35, 'triangle', 0.12);
    setTimeout(() => chord([1046.5, 1318.5], 0.25, 'sine', 0.1), 100);
  }

  function bossSfx() {
    if (!enabled()) return;
    chord([392, 494, 587, 784], 0.5, 'sine', 0.12);
  }

  function deathSfx() {
    if (!enabled()) return;
    sweep(420, 70, 0.55, 'sawtooth', 0.28);
    // noise burst
    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.buffer = buffer;
    src.connect(g).connect(masterGain);
    src.start(now);
  }

  function clickSfx() {
    if (!enabled()) return;
    beep(660, 0.05, 'square', 0.15);
  }

  function turnSfx() {
    if (!enabled()) return;
    beep(340, 0.03, 'square', 0.05);
  }

  function startMusic() {
    if (!ctx) return;
    if (!window.Storage.getSetting('music')) return;
    if (musicNodes) return;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o1.type = 'sine'; o1.frequency.value = 110;
    o2.type = 'sine'; o2.frequency.value = 110.6;
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    g.gain.value = 0.05;
    o1.connect(filter); o2.connect(filter);
    filter.connect(g).connect(masterGain);
    o1.start(); o2.start();
    musicNodes = { o1, o2, g, filter };
  }

  function stopMusic() {
    if (!musicNodes) return;
    try {
      musicNodes.o1.stop();
      musicNodes.o2.stop();
    } catch (e) {}
    musicNodes = null;
  }

  return {
    init, eatSfx, powerUpSfx, bossSfx, deathSfx, clickSfx, turnSfx, startMusic, stopMusic,
  };
})();
