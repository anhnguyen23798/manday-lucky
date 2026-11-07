import { secureRandom } from "./random";

/**
 * Quy ước: 0° = 12 giờ (vị trí kim), chiều dương = chiều kim đồng hồ (giống CSS rotate).
 * Lát i chiếm [i*seg, (i+1)*seg) khi vòng chưa xoay.
 */

export const normalize = (deg: number) => ((deg % 360) + 360) % 360;

export function computeTargetRotation(opts: {
  current: number;
  count: number;
  winnerIndex: number;
  minTurns?: number;
  maxTurns?: number;
}): number {
  const { current, count, winnerIndex, minTurns = 6, maxTurns = 9 } = opts;
  const seg = 360 / count;
  const margin = seg * 0.15;
  const offsetInSeg = margin + secureRandom() * (seg - 2 * margin);
  const pointAngle = winnerIndex * seg + offsetInSeg;
  const desired = normalize(-pointAngle);
  const turns = minTurns + Math.floor(secureRandom() * (maxTurns - minTurns + 1));
  const base = current - normalize(current) + turns * 360;
  return base + desired;
}

/** Lát đang nằm dưới kim (12 giờ) với rotation cho trước */
export function segmentAtAngle(rotation: number, count: number): number {
  if (count <= 0) return -1;
  const seg = 360 / count;
  return Math.floor(normalize(-rotation) / seg) % count;
}

/** Path SVG của lát i, tâm (0,0), bắt đầu từ 12 giờ theo chiều kim đồng hồ */
export function slicePath(i: number, count: number, r = 92): string {
  const seg = (2 * Math.PI) / count;
  const a0 = i * seg - Math.PI / 2;
  const a1 = a0 + seg;
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  const large = seg > Math.PI ? 1 : 0;
  return `M0 0 L${x0.toFixed(3)} ${y0.toFixed(3)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`;
}

/** Góc (độ, hệ SVG: 0° = 3 giờ) của tia giữa lát i, dùng để xoay text */
export function sliceMidAngleSvg(i: number, count: number): number {
  return (i + 0.5) * (360 / count) - 90;
}
