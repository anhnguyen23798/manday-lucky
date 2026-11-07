"use client";

import { motion, type MotionValue } from "motion/react";
import { memo, type Ref } from "react";
import { sliceMidAngleSvg, slicePath } from "@/lib/wheel-math";

export type WheelEntry = { id: string; label: string };

/** Chu kỳ màu lát + màu chữ đạt tương phản (xem skill manday-design-system) */
const PALETTE = [
  { fill: "fill-tie", text: "fill-white" },
  { fill: "fill-beer", text: "fill-ink" },
  { fill: "fill-bbq", text: "fill-ink" },
  { fill: "fill-mint", text: "fill-ink" },
  { fill: "fill-blush", text: "fill-ink" },
  { fill: "fill-sky", text: "fill-ink" },
  { fill: "fill-coffee", text: "fill-white" },
] as const;

function colorIndex(i: number, n: number): number {
  const c = i % PALETTE.length;
  // lát cuối kề lát đầu: tránh trùng màu
  if (n > 1 && i === n - 1 && c === 0) return 3;
  return c;
}

const LABEL_LIMIT = 40;
const R = 92;
const BULBS = 24;

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s;
}

export const LuckyWheel = memo(function LuckyWheel({
  entries,
  rotation,
  spinning,
  highlightIndex,
  pointerRef,
}: {
  entries: WheelEntry[];
  rotation: MotionValue<number>;
  spinning: boolean;
  /** lát được làm nổi bật khi reveal (các lát khác tối đi) */
  highlightIndex: number | null;
  pointerRef?: Ref<HTMLDivElement>;
}) {
  const n = entries.length;
  const showLabels = n > 0 && n <= LABEL_LIMIT;
  const arc = n > 0 ? (2 * Math.PI * 58) / n : 0;
  const fontSize = Math.max(4.2, Math.min(9, arc * 0.62));
  const maxChars = Math.max(4, Math.floor(62 / (fontSize * 0.56)));

  return (
    <div className="relative aspect-square w-full">
      {/* Kim chỉ ria mép, đứng yên ở 12 giờ */}
      <div
        ref={pointerRef}
        aria-hidden
        className="absolute left-1/2 top-0 z-20 w-[9%] min-w-11 -translate-x-1/2 -translate-y-[38%] origin-[50%_20%]"
      >
        <svg viewBox="0 0 60 70" className="block w-full drop-shadow-[3px_3px_0_var(--color-ink)]">
          <path d="M30 68 L14 26 H46 Z" className="fill-bbq stroke-ink" strokeWidth="4" strokeLinejoin="round" />
          <path
            d="M30 18c-6-8-18-11-26-4 4 0 7 3 10 6 6 6 13 3 16-2 3 5 10 8 16 2 3-3 6-6 10-6-8-7-20-4-26 4z"
            className="fill-ink"
          />
        </svg>
      </div>

      <svg viewBox="-100 -100 200 200" className="size-full overflow-visible" role="img" aria-label={`Vòng quay có ${n} anh em`}>
        {/* bóng đổ cứng */}
        <circle cx="5" cy="5" r="99" className="fill-ink" />
        {/* viền đèn */}
        <circle r="99" className="fill-beer stroke-ink" strokeWidth="2.5" />
        {Array.from({ length: BULBS }, (_, i) => {
          const a = (i / BULBS) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={95.3 * Math.cos(a)}
              cy={95.3 * Math.sin(a)}
              r="2.3"
              className={`stroke-ink ${i % 2 ? "fill-white" : "fill-blush"} animate-blink-bulb`}
              strokeWidth="0.8"
              style={{
                animationDelay: `${(i % 2) * (spinning ? 0.12 : 0.4)}s`,
                ["--bulb-speed" as string]: spinning ? "0.24s" : "0.8s",
              }}
            />
          );
        })}

        <motion.g style={{ rotate: rotation, willChange: spinning ? "transform" : "auto" }}>
          {n === 0 && <circle r={R} className="fill-white stroke-ink" strokeWidth="1.5" />}
          {n === 1 && <circle r={R} className={`${PALETTE[0].fill} stroke-ink`} strokeWidth="1.2" />}
          {n > 1 &&
            entries.map((e, i) => (
              <path
                key={e.id}
                d={slicePath(i, n, R)}
                className={`${PALETTE[colorIndex(i, n)].fill} stroke-ink transition-opacity duration-300`}
                strokeWidth={n > 80 ? 0.4 : 1.2}
                opacity={highlightIndex !== null && highlightIndex !== i ? 0.3 : 1}
              />
            ))}
          {showLabels &&
            entries.map((e, i) => {
              const mid = n === 1 ? -90 : sliceMidAngleSvg(i, n);
              return (
                <text
                  key={e.id}
                  transform={`rotate(${mid}) translate(${R - 7} 0)`}
                  textAnchor="end"
                  dominantBaseline="central"
                  className={`${PALETTE[colorIndex(i, n)].text} font-rounded transition-opacity duration-300`}
                  style={{ fontSize, fontWeight: 800 }}
                  opacity={highlightIndex !== null && highlightIndex !== i ? 0.35 : 1}
                >
                  {truncate(e.label, maxChars)}
                </text>
              );
            })}
        </motion.g>

        {/* tâm vòng */}
        <circle r="17" className="fill-ink stroke-beer" strokeWidth="3" />
        <text textAnchor="middle" dominantBaseline="central" style={{ fontSize: 18 }} y="1">
          🥸
        </text>
      </svg>
    </div>
  );
});
