/*
 * Tiny synthesized UI sounds. Nothing plays until the visitor turns
 * sound on (which is also the user gesture browsers need for audio).
 */
let ctx = null;
let master = null;
let hum = null;
let on = false;

const KEY = 'cc-sound';

export function soundPreference() {
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

function startHum() {
  if (hum || !ctx) return;
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  filter.type = 'lowpass';
  filter.frequency.value = 180;
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 0.012;
  gain.gain.value = 0.025;
  lfo.connect(lfoGain).connect(gain.gain);
  osc.connect(filter).connect(gain).connect(master);
  osc.start();
  lfo.start();
  hum = { osc, lfo };
}

export function setSound(next) {
  on = next;
  try { localStorage.setItem(KEY, next ? 'on' : 'off'); } catch { /* storage blocked */ }
  if (!next && !ctx) return;
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (next) startHum();
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setTargetAtTime(next ? 0.6 : 0, c.currentTime, 0.08);
}

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function blip(kind) {
  if (!on || !ctx) return;
  const t = ctx.currentTime;
  if (kind === 'hover') tone(1320, t, 0.05, 'square', 0.03);
  else if (kind === 'open') { tone(660, t, 0.09, 'triangle'); tone(990, t + 0.07, 0.14, 'triangle'); }
  else if (kind === 'close') { tone(880, t, 0.08, 'triangle'); tone(520, t + 0.06, 0.12, 'triangle'); }
  else if (kind === 'done') [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'triangle', 0.1));
}
