---
name: fun-effects
description: Thư viện hiệu ứng vui nhộn cho app Manday: confetti emoji/ria mép, rung màn hình, sunburst, sticker bay, đèn chớp, micro-interaction hover/press, âm thanh Web Audio (tick, trống, fanfare, "fail" trombone). Dùng khi thêm celebration, phản hồi tương tác, hiệu ứng nền, hoặc âm thanh.
---

# Fun Effects

Mục tiêu: mỗi tương tác đều có **phản hồi bất ngờ nhỏ**, và khoảnh khắc trúng giải là **"bùng nổ, đáng quay video"**. Tuân thủ `.claude/rules/animation-performance.md`.

## Bản đồ hiệu ứng theo khoảnh khắc

| Khoảnh khắc | Hình | Âm | Ghi chú |
|---|---|---|---|
| Trang load | Sticker nền pop-in so le (delay 60ms/cái), tiêu đề rơi xuống nảy | — | chưa có tương tác nên không phát âm |
| Hover nút | Nhấc lên 2px, bóng dài ra, emoji trong nút lắc `animate-wiggle` | — | |
| Nhấn nút QUAY | Nút lún xuống (press), vòng giật ngược lấy đà | "vèo" (sweep tần số lên) | |
| Đang quay | Đèn viền chớp nhanh, kim nảy mỗi lát, nền tối dần 15% (spotlight vào vòng) | tick mỗi lát | |
| Sắp dừng (1s cuối) | Trống "tùng tùng tùng" dồn dập | drumroll | tạo hồi hộp |
| Trúng giải | Rung màn hình 0.5s → flash trắng 1 lần → modal pop-in → confetti 3 đợt (giữa, trái, phải) → sunburst xoay sau thẻ | fanfare | |
| Giải "vui" (phiếu rửa bát, v.v.) | Confetti ít hơn, sticker 😂 rơi, thẻ lắc lư | "wah wah" trombone | xem `manday-copywriter` |
| Đóng modal | Thẻ bay ra, tên người trúng "bay" vào Bảng Vàng | pop | |
| Hết người/hết giải | Vòng quay "ngủ" (nghiêng, zzz sticker) | — | |
| Easter egg | Gõ "manday" trên bàn phím → mưa ria mép 🥸 | | vui thôi |
| Click logo 5 lần | Logo đeo kính đen 🕶️ | | |

## Confetti (`components/effects/Confetti.ts`)

```ts
"use client";
import confetti from "canvas-confetti";

const COLORS = ["#2b59ff", "#ffc929", "#ff6a1f", "#27e3a4", "#ff5fa8", "#14110f"];

export async function celebrate({ reduce = false } = {}) {
  const scalar = 2.2;
  const emojis = ["🥸", "💪", "👔", "🍺", "🏆"].map((text) => confetti.shapeFromText({ text, scalar }));
  const base = { colors: COLORS, disableForReducedMotion: false, zIndex: 60 };

  if (reduce) return confetti({ ...base, particleCount: 30, spread: 60, origin: { y: 0.6 } });

  confetti({ ...base, particleCount: 120, spread: 100, startVelocity: 55, origin: { y: 0.6 } });
  setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 250);
  setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 400);
  setTimeout(() => confetti({ ...base, shapes: emojis, scalar, particleCount: 40, spread: 160, gravity: 0.7, origin: { y: 0.3 } }), 600);
}
```

Mỗi lần bắn ≤ 250 hạt (rule hiệu năng).

## Rung màn hình

Thêm class `animate-shake` vào wrapper của stage (không phải `<body>`), bỏ class ở `onAnimationEnd`. Bỏ qua khi reduced-motion.

## Sunburst sau modal

```tsx
<div aria-hidden className="pointer-events-none absolute inset-[-50%] animate-[spin_20s_linear_infinite]
  [background:repeating-conic-gradient(var(--color-beer)_0_10deg,var(--color-cream)_10deg_20deg)] opacity-60" />
```

## Sticker nền bay (`FloatingStickers`)

- 8–12 sticker emoji từ moodboard (`docs/manday-context.md` §5), vị trí ngẫu nhiên **tính 1 lần trong `useEffect`** (tránh hydration mismatch), `animate-float` với `animation-delay` và `--tilt` khác nhau.
- `pointer-events-none`, `aria-hidden`, z-index dưới nội dung, opacity 0.9.
- Ẩn trên mobile < 640px nếu che nội dung.

## Âm thanh (`lib/sfx.ts`): Web Audio tổng hợp, không cần file

```ts
let ctx: AudioContext | null = null;
let muted = false;
export const setMuted = (m: boolean) => { muted = m; };
const ac = () => (ctx ??= new AudioContext());

function beep(freq: number, dur: number, type: OscillatorType = "square", gain = 0.08, slideTo?: number) {
  if (muted) return;
  const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
}

export const sfx = {
  /** gọi trong handler click đầu tiên để mở khóa autoplay */
  unlock: () => ac().resume(),
  tick: () => beep(1800, 0.03, "square", 0.05),
  whoosh: () => beep(200, 0.35, "sawtooth", 0.06, 1200),
  drum: () => beep(90, 0.12, "triangle", 0.25, 50),
  pop: () => beep(600, 0.08, "sine", 0.1, 1200),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, i === 3 ? 0.6 : 0.15, "square", 0.08), i * 140)),
  sadTrombone: () => [392, 370, 349, 330].forEach((f, i) => setTimeout(() => beep(f, i === 3 ? 0.8 : 0.35, "sawtooth", 0.06, i === 3 ? 300 : undefined), i * 380)),
};
```

Nếu sau này muốn âm thanh thật (mp3), đặt ở `public/sfx/` và giữ nguyên API `sfx.*`.

## Checklist "đủ vui chưa?"

- [ ] Có ít nhất 1 phần tử chuyển động nhẹ khi idle (không màn hình nào "chết")
- [ ] Mọi nút có trạng thái hover + press có cảm giác vật lý
- [ ] Khoảnh khắc trúng giải kéo dài ≥ 2s hiệu ứng trước khi có thể đóng
- [ ] Có ít nhất 1 easter egg
- [ ] Reduced-motion vẫn dùng được và vẫn vui (bằng chữ và màu)
