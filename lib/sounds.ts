/**
 * Sound effects system — generated entirely with Web Audio API.
 * No external files, no downloads. Works everywhere.
 *
 * Uses a singleton AudioContext and always calls resume() before playing
 * to satisfy browser autoplay policies.
 */

let _ac: AudioContext | null = null;

async function ctx(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  if (!_ac) _ac = new Ctor();
  if (_ac.state === "suspended") await _ac.resume();
  return _ac;
}

function note(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  startVol: number,
  startAt: number,
  duration: number
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(startVol, ac.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + duration);
  osc.start(ac.currentTime + startAt);
  osc.stop(ac.currentTime + startAt + duration);
}

/** Login success — ascending fanfare */
export async function playFanfare() {
  const ac = await ctx();
  if (!ac) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    note(ac, "square", freq, 0.14, i * 0.11, 0.22);
  });
}

/** Upload proof success — bright ding */
export async function playDing() {
  const ac = await ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1047, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1568, ac.currentTime + 0.05);
  gain.gain.setValueAtTime(0.28, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.65);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.65);
}

/** Miss goal — sad descending trombone */
export async function playOof() {
  const ac = await ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(440, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.55);
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.6);
}

/** Penalty added — three descending coin pings */
export async function playCoinDrop() {
  const ac = await ctx();
  if (!ac) return;
  [0, 0.09, 0.18].forEach((t, i) => {
    note(ac, "sine", 1200 - i * 130, 0.2, t, 0.16);
  });
}

/** Nomination received — notification pop */
export async function playNotificationPop() {
  const ac = await ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(580, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(920, ac.currentTime + 0.07);
  gain.gain.setValueAtTime(0.22, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.2);
}

/** Challenge triggered — dramatic three-note horn */
export async function playDramaticHorn() {
  const ac = await ctx();
  if (!ac) return;
  ([220, 277, 330, 220] as const).forEach((freq, i) => {
    note(ac, "sawtooth", freq, 0.16, i * 0.16, 0.22);
  });
}

/** React with emoji — satisfying pop click */
export async function playClickPop() {
  const ac = await ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(820, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(380, ac.currentTime + 0.07);
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.12);
}

/** Accept nomination — level up ascending chime */
export async function playLevelUp() {
  const ac = await ctx();
  if (!ac) return;
  [523, 659, 784, 1047, 1319].forEach((freq, i) => {
    note(ac, "triangle", freq, 0.16, i * 0.09, 0.28);
  });
}
