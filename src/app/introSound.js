// Dźwięk intro syntezowany w przeglądarce (bez plików audio).
// Czasy zgadzają się z animacją w Intro.module.css.

function tone(ctx, { at, freq, end = freq, dur = 0.15, type = "sine", gain = 0.2 }) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), at + dur);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function noise(ctx, { at, dur, gain = 0.5, from = 3000, to = 200 }) {
  const length = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + dur);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, at);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start(at);
}

export function createIntroAudio() {
  const Ctx = typeof window === "undefined" ? null : window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  const ctx = new Ctx();

  function playSequence() {
    const t = ctx.currentTime;
    // Pszczoły wlatują: cztery brzęczące świsty.
    [0, 0.1, 0.2, 0.3].forEach((d, i) =>
      tone(ctx, { at: t + d, freq: 180 + i * 40, end: 420 + i * 60, dur: 0.8, type: "sawtooth", gain: 0.05 }),
    );
    // Bomba spada i uderza.
    tone(ctx, { at: t + 0.9, freq: 700, end: 120, dur: 0.4, type: "triangle", gain: 0.2 });
    tone(ctx, { at: t + 1.3, freq: 90, end: 50, dur: 0.15, gain: 0.3 });
    // Lont: dwa piski.
    tone(ctx, { at: t + 1.4, freq: 880, dur: 0.12, type: "square", gain: 0.08 });
    tone(ctx, { at: t + 1.58, freq: 1175, dur: 0.12, type: "square", gain: 0.08 });
    // Wybuch.
    noise(ctx, { at: t + 1.75, dur: 0.9, gain: 0.6 });
    tone(ctx, { at: t + 1.75, freq: 140, end: 35, dur: 0.7, gain: 0.45 });
    // Tytuł: litery jak klawisze.
    for (let i = 0; i < 6; i += 1) {
      tone(ctx, { at: t + 2.1 + i * 0.07, freq: 520 + i * 70, dur: 0.12, type: "triangle", gain: 0.1 });
    }
    // Przycisk Graj: krótki akord.
    [523, 659, 784].forEach((f) =>
      tone(ctx, { at: t + 3.1, freq: f, dur: 0.5, type: "triangle", gain: 0.1 }),
    );
  }

  let started = false;
  function start() {
    if (started) {
      return;
    }
    started = true;
    ctx.resume?.().then(playSequence, playSequence);
  }

  return {
    start,
    isRunning: () => ctx.state === "running",
    click() {
      ctx.resume?.();
      const t = ctx.currentTime;
      tone(ctx, { at: t, freq: 600, end: 900, dur: 0.1, type: "triangle", gain: 0.15 });
    },
    close() {
      setTimeout(() => ctx.close?.().catch(() => {}), 800);
    },
  };
}
