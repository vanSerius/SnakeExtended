// Audio.js - Web Audio synthesis + MP3 background track
window.AudioFX = (() => {
  let ctx = null;
  let masterGain = null;
  let musicIntervalId = null;
  let musicMode = null; // 'normal' | 'boss' | null
  let bgAudio = null;   // HTML Audio element for MP3 background

  // D major note frequencies — bright, adventure-like (Zelda-ish)
  const F = {
    A2:110, C3:130.81, D3:146.83, E3:164.81, G3:196, A3:220,
    D4:293.66, E4:329.63, Fs4:369.99, G4:392, A4:440, B4:493.88,
    Cs5:554.37, D5:587.33, E5:659.25,
    _:0,
  };

  // [freq, beats] — 1.0 = one beat; multiplied by (60/bpm) for duration in seconds
  // Normal: calm overworld adventure, flowing quarter/half notes, 100 BPM
  const MELODY_NORMAL = [
    // Phrase A — question, ascending then settling
    [F.D5,  1.0], [F.B4,  1.0], [F.G4,  2.0],
    [F.A4,  1.0], [F.B4,  1.0], [F.D5,  2.0],
    // Phrase B — answer, broader sweep downward
    [F.E5,  1.0], [F.D5,  1.0], [F.B4,  1.0], [F.A4,  1.0],
    [F.G4,  2.0], [F.A4,  1.0], [F.G4,  1.0],
    [F.Fs4, 2.0],
  ];
  const BASS_NORMAL = [
    [F.D3,  4.0],
    [F.G3,  4.0],
    [F.A3,  4.0],
    [F.D3,  6.0],
  ];

  // Boss: tense adventure battle, punchy eighth-note runs, 126 BPM
  const MELODY_BOSS = [
    // Quick ascending arpeggio to signal danger
    [F.D4,  0.5], [F.Fs4, 0.5], [F.A4,  1.0], [F.D5,  1.0],
    [F.Cs5, 1.0], [F.B4,  1.0], [F.A4,  1.0], [F.G4,  1.0],
    // Drive forward
    [F.A4,  0.5], [F.B4,  0.5], [F.D5,  1.0], [F.E5,  1.0],
    [F.D5,  0.5], [F.Cs5, 0.5], [F.B4,  1.0],
    [F.A4,  2.0], [F._,   1.0],
  ];
  const BASS_BOSS = [
    [F.D3,  2.0], [F.A2,  2.0],
    [F.C3,  2.0], [F.D3,  2.0],
    [F.E3,  2.0], [F.A2,  3.0], [F._,  1.0],
  ];

  function _fxVol()    { return window.Storage.getSetting('fxVolume')    ?? 1.0; }
  function _musicVol() { return window.Storage.getSetting('musicVolume') ?? 1.0; }

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = _fxVol() * 0.35;
      masterGain.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
  }

  function setFxVolume(v) {
    window.Storage.setSetting('fxVolume', v);
    if (masterGain) masterGain.gain.value = v * 0.35;
  }

  function setMusicVolume(v) {
    window.Storage.setSetting('musicVolume', v);
    if (bgAudio) bgAudio.volume = v * (musicMode === 'boss' ? 0.14 : 0.22);
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

  // 16-bit SNES-style note: triangle lead + sine sub-octave for warmth
  function _scheduleNote(freq, startT, dur, isBass) {
    if (isBass) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, startT);
      g.gain.linearRampToValueAtTime(0.032, startT + 0.025);
      g.gain.setValueAtTime(0.032, startT + dur * 0.72);
      g.gain.linearRampToValueAtTime(0, startT + dur);
      osc.connect(g).connect(masterGain);
      osc.start(startT);
      osc.stop(startT + dur + 0.05);
      return;
    }
    // lead: triangle (body) + sine sub-octave (warmth)
    [[freq, 'triangle', 0.048], [freq / 2, 'sine', 0.018]].forEach(([f, type, gv]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, startT);
      g.gain.linearRampToValueAtTime(gv, startT + 0.015);
      g.gain.setValueAtTime(gv, startT + dur * 0.68);
      g.gain.linearRampToValueAtTime(0, startT + dur * 0.94);
      osc.connect(g).connect(masterGain);
      osc.start(startT);
      osc.stop(startT + dur);
    });
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
      const horizon = ctx.currentTime + 0.18;
      while (mNext < horizon) {
        const [freq, beats] = melody[mIdx % melody.length];
        const dur = beats * beat;
        if (freq > 0) _scheduleNote(freq, mNext, dur, false);
        mNext += dur;
        mIdx++;
      }
      while (bNext < horizon) {
        const [freq, beats] = bassLine[bIdx % bassLine.length];
        const dur = beats * beat;
        if (freq > 0) _scheduleNote(freq, bNext, dur, true);
        bNext += dur;
        bIdx++;
      }
    }

    schedule();
    musicIntervalId = setInterval(schedule, 25);
  }

  function _ensureBgAudio() {
    if (bgAudio) return;
    bgAudio = new Audio('js/Neon%20Scale%20Run.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.22;
  }

  function sirenSfx() {
    if (!enabled()) return;
    const now = ctx.currentTime;
    // two rising sweeps — 300→620 Hz, sine, soft gain
    [0, 0.52].forEach(offset => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300,  now + offset);
      osc.frequency.linearRampToValueAtTime(620, now + offset + 0.44);
      g.gain.setValueAtTime(0,    now + offset);
      g.gain.linearRampToValueAtTime(0.13, now + offset + 0.04);
      g.gain.setValueAtTime(0.13, now + offset + 0.36);
      g.gain.linearRampToValueAtTime(0,    now + offset + 0.5);
      osc.connect(g).connect(masterGain);
      osc.start(now + offset);
      osc.stop(now  + offset + 0.55);
    });
  }

  function restartMusic() {
    if (musicIntervalId !== null) { clearInterval(musicIntervalId); musicIntervalId = null; }
    musicMode = 'normal';
    if (!window.Storage.getSetting('music')) return;
    _ensureBgAudio();
    bgAudio.volume = _musicVol() * 0.22;
    bgAudio.currentTime = 0;
    bgAudio.play().catch(() => {});
  }

  function startMusic() {
    if (musicIntervalId !== null) { clearInterval(musicIntervalId); musicIntervalId = null; }
    musicMode = 'normal';
    if (!window.Storage.getSetting('music')) return;
    _ensureBgAudio();
    bgAudio.volume = _musicVol() * 0.22;
    if (bgAudio.paused) bgAudio.play().catch(() => {});
  }

  function startBossMusic() {
    if (musicMode === 'boss') return;
    if (bgAudio) bgAudio.volume = _musicVol() * 0.14;
    if (musicIntervalId !== null) { clearInterval(musicIntervalId); musicIntervalId = null; }
    musicMode = 'boss';
    sirenSfx();
  }

  function stopMusic() {
    if (musicIntervalId !== null) {
      clearInterval(musicIntervalId);
      musicIntervalId = null;
    }
    if (bgAudio) bgAudio.pause();
    musicMode = null;
  }

  return {
    init, eatSfx, powerUpSfx, bossSfx, deathSfx, clickSfx, turnSfx, sirenSfx,
    startMusic, restartMusic, startBossMusic, stopMusic,
    setFxVolume, setMusicVolume,
    getFxVolume: _fxVol, getMusicVolume: _musicVol,
  };
})();
