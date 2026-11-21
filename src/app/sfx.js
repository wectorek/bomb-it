// Efekty dźwiękowe syntezowane w przeglądarce (bez plików audio).

const KEY = "bomb-it-sfx";
let ctx = null;
let enabled = null;

export function isSfxEnabled() {
  if (typeof window === "undefined") {
    return true;
  }
  if (enabled == null) {
    enabled = window.localStorage.getItem(KEY) !== "off";
  }
  return enabled;
}

export function setSfxEnabled(value) {
  enabled = Boolean(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, enabled ? "on" : "off");
  }
}

function context() {
  if (ctx) {
    return ctx;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  ctx = new Ctx();
  return ctx;
}

function tone(c, { at = 0, freq, end = freq, dur = 0.12, type = "sine", gain = 0.15 }) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(c, { at = 0, dur = 0.5, gain = 0.4, from = 3000, to = 200 }) {
  const t = c.currentTime + at;
  const length = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(amp).connect(c.destination);
  src.start(t);
}

const SOUNDS = {
  click: (c) => tone(c, { freq: 600, end: 850, dur: 0.08, type: "triangle" }),
  back: (c) => tone(c, { freq: 700, end: 420, dur: 0.1, type: "triangle" }),
  start: (c) => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(c, { at: i * 0.07, freq: f, dur: 0.2, type: "triangle", gain: 0.13 }),
    );
  },
  select: (c) => tone(c, { freq: 880, dur: 0.06, type: "square", gain: 0.06 }),
  bomb: (c) => {
    tone(c, { freq: 300, end: 110, dur: 0.15, type: "triangle", gain: 0.2 });
    tone(c, { at: 0.1, freq: 120, end: 90, dur: 0.08, gain: 0.15 });
  },
  throw: (c) => tone(c, { freq: 250, end: 900, dur: 0.25, type: "sawtooth", gain: 0.07 }),
  boom: (c) => {
    noise(c, { dur: 0.6, gain: 0.5 });
    tone(c, { freq: 130, end: 40, dur: 0.5, gain: 0.35 });
  },
  bonus: (c) => {
    tone(c, { freq: 660, dur: 0.1, type: "square", gain: 0.07 });
    tone(c, { at: 0.08, freq: 990, dur: 0.16, type: "square", gain: 0.07 });
  },
  bad: (c) => {
    tone(c, { freq: 400, end: 200, dur: 0.18, type: "sawtooth", gain: 0.08 });
    tone(c, { at: 0.12, freq: 260, end: 130, dur: 0.22, type: "sawtooth", gain: 0.08 });
  },
  hurt: (c) => {
    tone(c, { freq: 220, end: 70, dur: 0.3, type: "square", gain: 0.12 });
    noise(c, { dur: 0.2, gain: 0.2, from: 1500, to: 200 });
  },
  hit: (c) => tone(c, { freq: 300, end: 160, dur: 0.12, type: "square", gain: 0.05 }),
  win: (c) => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(c, { at: i * 0.12, freq: f, dur: 0.3, type: "triangle", gain: 0.14 }),
    );
  },
  lose: (c) => {
    [392, 330, 262, 196].forEach((f, i) =>
      tone(c, { at: i * 0.2, freq: f, dur: 0.35, type: "sawtooth", gain: 0.09 }),
    );
  },
  finale: (c) => {
    noise(c, { dur: 1.6, gain: 0.45, from: 600, to: 80 });
    tone(c, { freq: 220, end: 50, dur: 1.4, type: "sawtooth", gain: 0.2 });
    for (let i = 0; i < 6; i += 1) {
      tone(c, { at: 0.2 + i * 0.18, freq: 140 + (i % 2) * 60, end: 60, dur: 0.16, type: "square", gain: 0.12 });
    }
    tone(c, { at: 1.3, freq: 90, end: 30, dur: 0.6, type: "sawtooth", gain: 0.25 });
  },
  splat: (c) => {
    noise(c, { dur: 0.15, gain: 0.3, from: 900, to: 150 });
    tone(c, { freq: 160, end: 60, dur: 0.15, gain: 0.2 });
  },
  join: (c) => {
    tone(c, { freq: 500, dur: 0.1, type: "triangle", gain: 0.12 });
    tone(c, { at: 0.1, freq: 750, dur: 0.14, type: "triangle", gain: 0.12 });
  },
  tick: (c) => tone(c, { freq: 620, end: 480, dur: 0.09, type: "triangle", gain: 0.14 }),
  go: (c) => {
    tone(c, { freq: 880, dur: 0.14, type: "square", gain: 0.16 });
    tone(c, { at: 0.08, freq: 1320, dur: 0.22, type: "triangle", gain: 0.12 });
  },
  zone: (c) => tone(c, { freq: 220, end: 180, dur: 0.2, type: "sawtooth", gain: 0.1 }),
};

export function playSfx(name) {
  if (typeof window === "undefined" || !isSfxEnabled()) {
    return;
  }
  const c = context();
  const sound = SOUNDS[name];
  if (!c || !sound) {
    return;
  }
  const run = () => sound(c);
  if (c.state === "suspended") {
    c.resume().then(run, () => {});
  } else {
    run();
  }
}

// Bojowa muzyka finału: pętla perkusji i basu, syntezowana na bieżąco.
let battle = null;

export function startBattleMusic() {
  if (battle || typeof window === "undefined" || !isSfxEnabled()) {
    return;
  }
  const c = context();
  if (!c) {
    return;
  }
  const stepSec = 60 / 156 / 4;
  const bass = [41.2, 0, 41.2, 0, 49, 0, 41.2, 0, 55, 0, 41.2, 0, 46.2, 0, 49, 0];
  let step = 0;
  let nextTime = c.currentTime + 0.1;

  function schedule(at, index) {
    const beat = index % 16;
    const dt = Math.max(0, at - c.currentTime);
    if (beat % 4 === 0 || beat === 10) {
      tone(c, { at: dt, freq: 150, end: 45, dur: 0.18, gain: 0.32 });
    }
    if (beat === 4 || beat === 12) {
      noise(c, { at: dt, dur: 0.14, gain: 0.22, from: 6000, to: 1200 });
    }
    if (beat % 2 === 1) {
      noise(c, { at: dt, dur: 0.04, gain: 0.06, from: 9000, to: 5000 });
    }
    const f = bass[beat];
    if (f) {
      tone(c, { at: dt, freq: f * 2, dur: stepSec * 1.6, type: "sawtooth", gain: 0.1 });
    }
    if (beat === 0 && Math.floor(index / 16) % 2 === 1) {
      tone(c, { at: dt, freq: 660, end: 880, dur: stepSec * 6, type: "square", gain: 0.05 });
      tone(c, { at: dt, freq: 622, end: 831, dur: stepSec * 6, type: "square", gain: 0.05 });
    }
  }

  function pump() {
    while (nextTime < c.currentTime + 0.25) {
      schedule(nextTime, step);
      step += 1;
      nextTime += stepSec;
    }
  }

  const start = () => {
    nextTime = c.currentTime + 0.1;
    pump();
    battle = { timer: setInterval(pump, 60) };
  };
  battle = { timer: null };
  if (c.state === "suspended") {
    c.resume().then(start, () => {
      battle = null;
    });
  } else {
    start();
  }
}

export function stopBattleMusic() {
  if (battle?.timer) {
    clearInterval(battle.timer);
  }
  battle = null;
}
