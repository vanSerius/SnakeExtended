// Audio.js - Web Audio synthesis, no assets
window.AudioFX = (() => {
  let ctx = null;
  let masterGain = null;
  let musicIntervalId = null;
  let musicMode = null; // 'normal' | 'boss' | null

  // note frequencies
  const F = {
    A2:110, C3:130.81, E3:164.81, G3:196,
    A3:220, C4:261.63, D4:293.66, E4:329.63, G4:392,
    A4:440, B4:493.88, C5:523.25, D5:587.33, E5:659.25,
    _:0,
  };

  // [freq, beats] — beats are beat-fractions (0.5 = half-beat, 1.0 = full beat)
  // multiplied by (60 / bpm) to get seconds
  const MELODY_NORMAL = [
    [F.C5, 0.5], [F.B4, 0.5], [F.A4, 0.5], [F.G4, 0.5],
    [F.A4, 0.5], [F.G4, 0.5], [F.E4, 1.0],
    [F.G4, 0.5], [F.A4, 0.5], [F.C5, 0.5], [F.A4, 0.5],
    [F.G4, 1.0], [F.E4, 0.5], [F.D4, 0.5],
    [F.E4, 1.0], [F._, 0.5],
  ];
  const BASS_NORMAL = [
    [F.A2, 2.0], [F.C3, 2.0], [F.E3, 2.0], [F.A2, 2.0],
  ];

  const MELODY_BOSS = [
    [F.A4, 0.25], [F.C5, 0.25], [F.D5, 0.5],
    [F.C5, 0.25], [F.A4, 0.25], [F.C5, 0.5],
    [F.A4, 0.25], [F.G4, 0.25], [F.A4, 0.5],
    [F.E4, 0.25], [F.G4, 0.25], [F.A4, 0.5],
    [F.C5, 0.5],  [F.D5, 0.25], [F.C5, 0.25],
    [F.A4, 0.5],  [F._, 0.5],
  ];
  const BASS_BOSS = [
    [F.A2, 1.0], [F.C3, 0.5], [F.E3, 0.5],
    [F.A2, 1.0], [F.G3, 1.0],
  ];

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

  function _scheduleNote(freq, startT, dur, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, startT);
    g.gain.linearRampToValueAtTime(gain, startT + 0.008);
    g.gain.setValueAtTime(gain, startT + dur * 0.65);
    g.gain.linearRampToValueAtTime(0.0001, startT + dur * 0.9);
    osc.connect(g).connect(masterGain);
    osc.start(startT);
    osc.stop(startT + dur);
  }

  function _playChiptune(melody, bassLine, bpm) {
    if (!ctx) return;
    if (!window.Storage.getSetting('music')) return;
    stopMusic();

    const beat = 60 / bpm;
    let mNext = ctx.currentTime + 0.05;
    let bNext = ctx.currentTime + 0.05;
    let mIdx = 0;
    let bIdx = 0;

    function schedule() {
      const horizon = ctx.currentTime + 0.15;
      while (mNext < horizon) {
        const [freq, beats] = melody[mIdx % melody.length];
        const dur = beats * beat;
        if (freq > 0) _scheduleNote(freq, mNext, dur, 'square', 0.042);
        mNext += dur;
        mIdx++;
      }
      while (bNext < horizon) {
        const [freq, beats] = bassLine[bIdx % bassLine.length];
        const dur = beats * beat;
        if (freq > 0) _scheduleNote(freq, bNext, dur, 'triangle', 0.024);
        bNext += dur;
        bIdx++;
      }
    }

    schedule();
    musicIntervalId = setInterval(schedule, 25);
  }

  function startMusic() {
    if (musicMode === 'normal') return;
    _playChiptune(MELODY_NORMAL, BASS_NORMAL, 118);
    musicMode = 'normal';
  }

  function startBossMusic() {
    if (musicMode === 'boss') return;
    _playChiptune(MELODY_BOSS, BASS_BOSS, 158);
    musicMode = 'boss';
  }

  function stopMusic() {
    if (musicIntervalId !== null) {
      clearInterval(musicIntervalId);
      musicIntervalId = null;
    }
    musicMode = null;
  }

  return {
    init, eatSfx, powerUpSfx, bossSfx, deathSfx, clickSfx, turnSfx,
    startMusic, startBossMusic, stopMusic,
  };
})();
