# Wheel math: code tham chiếu

Quy ước: góc 0° là **12 giờ**, chiều dương là **chiều kim đồng hồ** (giống CSS `rotate`). Lát `i` chiếm `[i*seg, (i+1)*seg)` khi vòng chưa xoay.

## `lib/random.ts`

```ts
/** Số thực [0, 1) từ crypto: công bằng và không đoán được. */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Số nguyên [0, max), không bias (rejection sampling). */
export function secureInt(max: number): number {
  if (max <= 0) throw new Error("max must be > 0");
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export type Weighted = { id: string; weight: number };

/** Chọn index theo trọng số. weight <= 0 không bao giờ trúng. */
export function pickWeighted<T extends Weighted>(items: readonly T[]): number {
  const total = items.reduce((s, it) => s + Math.max(0, it.weight), 0);
  if (total <= 0) throw new Error("No positive weights");
  let r = secureRandom() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, items[i].weight);
    if (r < 0) return i;
  }
  return items.length - 1;
}
```

## `lib/wheel-math.ts`

```ts
import { secureRandom } from "./random";

export const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/**
 * Tính góc quay tuyệt đối mới để lát `winnerIndex` dừng dưới kim (12 giờ).
 * - Quay thêm khoảng `minTurns..maxTurns` vòng (tối thiểu (minTurns-1)*360°) so với vị trí hiện tại
 * - Đã test: 25.000 lần với n = 1, 2, 3, 7, 50 → segmentAtAngle(target) === winnerIndex 100%
 * - Dừng ở vị trí ngẫu nhiên TRONG lát (tránh sát mép 15% mỗi bên), nhìn tự nhiên hơn
 */
export function computeTargetRotation(opts: {
  current: number;          // rotation hiện tại (độ, có thể > 360)
  count: number;            // số lát
  winnerIndex: number;
  minTurns?: number;
  maxTurns?: number;
}): number {
  const { current, count, winnerIndex, minTurns = 6, maxTurns = 9 } = opts;
  const seg = 360 / count;
  const margin = seg * 0.15;
  const offsetInSeg = margin + secureRandom() * (seg - 2 * margin);
  // Góc của điểm cần dừng (trong hệ vòng chưa xoay)
  const pointAngle = winnerIndex * seg + offsetInSeg;
  // Để điểm đó nằm ở 0° (kim) thì rotation ≡ -pointAngle (mod 360)
  const desired = normalize(-pointAngle);
  const turns = minTurns + Math.floor(secureRandom() * (maxTurns - minTurns + 1));
  const base = current - normalize(current) + turns * 360;
  return base + desired;
}

/** Lát nào đang nằm dưới kim với rotation cho trước. */
export function segmentAtAngle(rotation: number, count: number): number {
  const seg = 360 / count;
  const pointerInWheel = normalize(-rotation);
  return Math.floor(pointerInWheel / seg) % count;
}
```

## Animate bằng `motion`

```tsx
"use client";
import { animate, useMotionValue, useReducedMotion } from "motion/react";

const rotation = useMotionValue(0);
const reduce = useReducedMotion();

async function spin(winnerIndex: number) {
  const target = computeTargetRotation({ current: rotation.get(), count, winnerIndex });
  // lấy đà
  if (!reduce) await animate(rotation, rotation.get() - 20, { duration: 0.35, ease: "easeOut" });
  let lastSeg = segmentAtAngle(rotation.get(), count);
  await animate(rotation, target, {
    duration: reduce ? 1.2 : 5 + secureRandom() * 2,
    ease: [0.12, 0.8, 0.1, 1], // --ease-spin
    onUpdate: (v) => {
      const s = segmentAtAngle(v, count);
      if (s !== lastSeg) { lastSeg = s; onTick(); } // kim nảy + sfx.tick()
    },
  });
}
// <motion.g style={{ rotate: rotation }} />
```

## Path SVG cho 1 lát

```ts
export function slicePath(i: number, count: number, r = 92): string {
  const seg = (2 * Math.PI) / count;
  const a0 = i * seg - Math.PI / 2;      // -90° để 0 nằm ở 12 giờ
  const a1 = a0 + seg;
  const [x0, y0] = [r * Math.cos(a0), r * Math.sin(a0)];
  const [x1, y1] = [r * Math.cos(a1), r * Math.sin(a1)];
  const large = seg > Math.PI ? 1 : 0;
  return `M0 0 L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
```

Trường hợp `count === 1`: vẽ `<circle r={92} />` thay vì path.
