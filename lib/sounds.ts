/**
 * Sound effects — Web Audio API only. No external files.
 * AudioContext is created lazily on first call and reused.
 */

let _ac: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  if (!_ac) _ac = new Ctor();
  return _ac;
}

export function isSoundEnabled(): boolean {
  return !!_ac && _ac.state !== "closed";
}

function n(
  ac: AudioContext, type: OscillatorType,
  hz: number, vol: number, at: number, dur: number
) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type; o.frequency.value = hz;
  g.gain.setValueAtTime(vol, ac.currentTime + at);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + at + dur);
  o.start(ac.currentTime + at);
  o.stop(ac.currentTime + at + dur);
}

async function play(fn: (ac: AudioContext) => void) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") await ac.resume();
  fn(ac);
}

// 1. Login success — C5 E5 G5
export function playLoginSuccess() {
  void play((ac) => {
    [[523, 0], [659, 0.18], [784, 0.36]].forEach(([hz, at]) =>
      n(ac, "triangle", hz, 0.18, at, 0.22));
  });
}

// 2. Upload proof — E5 G5 C6
export function playUploadProof() {
  void play((ac) => {
    [[659, 0], [784, 0.12], [1047, 0.24]].forEach(([hz, at]) =>
      n(ac, "sine", hz, 0.22, at, 0.18));
  });
}

// 3. Miss goal — G4 F4 Eb4 D4 (sad trombone)
export function playMissGoal() {
  void play((ac) => {
    [[392, 0], [349, 0.32], [311, 0.64], [294, 0.96]].forEach(([hz, at]) =>
      n(ac, "sawtooth", hz, 0.15, at, 0.38));
  });
}

// 4. Nomination received — G5 C6
export function playNominationReceived() {
  void play((ac) => {
    [[784, 0], [1047, 0.1]].forEach(([hz, at]) =>
      n(ac, "sine", hz, 0.2, at, 0.14));
  });
}

// 5. Challenge triggered — C4 C4 C4 G4 (short short short long)
export function playChallengeTriggered() {
  void play((ac) => {
    [[262, 0, 0.12], [262, 0.16, 0.12], [262, 0.32, 0.12], [392, 0.48, 0.36]].forEach(
      ([hz, at, dur]) => n(ac, "sawtooth", hz, 0.18, at, dur));
  });
}

// 6. Emoji react — single soft pop at 800hz
export function playEmojiReact() {
  void play((ac) => n(ac, "sine", 800, 0.15, 0, 0.08));
}

// 7. Accept nomination — C5 E5 G5 C6
export function playAcceptNomination() {
  void play((ac) => {
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]].forEach(([hz, at]) =>
      n(ac, "triangle", hz, 0.18, at, 0.16));
  });
}

// 9. Generic UI click — soft tick
export function playClick() {
  void play((ac) => n(ac, "sine", 600, 0.07, 0, 0.045));
}

// 8. Goal completed — C5 E5 G5 E5 G5 C6 (last note held)
export function playGoalCompleted() {
  void play((ac) => {
    [[523, 0], [659, 0.14], [784, 0.28], [659, 0.42], [784, 0.56], [1047, 0.70]].forEach(
      ([hz, at], i) => n(ac, "triangle", hz, 0.2, at, i === 5 ? 0.38 : 0.16));
  });
}
