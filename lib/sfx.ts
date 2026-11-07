/**
 * Âm thanh tổng hợp bằng Web Audio, không cần file. Chỉ dùng ở client.
 * Gọi sfx.unlock() trong handler click/keydown đầu tiên để mở khóa autoplay.
 */
let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => {
  muted = m;
};

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = "square", gain = 0.08, slideTo?: number, delay = 0) {
  if (muted) return;
  const c = ac();
  // "suspended" vẫn lên lịch được: âm sẽ phát ngay khi resume() xong (lần click đầu tiên)
  if (!c || c.state === "closed") return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

let lastTick = 0;

export const sfx = {
  unlock: () => {
    const c = ac();
    if (c && c.state !== "running") void c.resume();
  },
  /** tick qua từng lát, throttle 30ms */
  tick: () => {
    const now = performance.now();
    if (now - lastTick < 30) return;
    lastTick = now;
    beep(1800, 0.03, "square", 0.04);
  },
  whoosh: () => beep(180, 0.35, "sawtooth", 0.05, 1200),
  drum: () => beep(90, 0.12, "triangle", 0.3, 45),
  drumroll: (count = 8, gap = 0.09) => {
    for (let i = 0; i < count; i++) beep(110 + (i % 2) * 15, 0.08, "triangle", 0.18 + i * 0.01, 50, i * gap);
  },
  pop: () => beep(500, 0.09, "sine", 0.12, 1300),
  click: () => beep(900, 0.04, "square", 0.04),
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, i === 3 ? 0.7 : 0.16, "square", 0.07, undefined, i * 0.14));
    [1047, 1319].forEach((f, i) => beep(f, 0.5, "triangle", 0.05, undefined, 0.42 + i * 0.02));
  },
  sadTrombone: () => {
    [392, 370, 349, 330].forEach((f, i) =>
      beep(f, i === 3 ? 0.9 : 0.36, "sawtooth", 0.05, i === 3 ? 260 : undefined, i * 0.38),
    );
  },
};
