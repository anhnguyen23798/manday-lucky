"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Thời gian hiện tại, cập nhật mỗi `intervalMs`. null trước khi mount (tránh lệch hydration). */
export function useNow(intervalMs = 250): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

export function Countdown({ target, now }: { target: number; now: number | null }) {
  const left = now === null ? null : split(target - now);
  const units = left
    ? [
        ...(left.d > 0 ? [{ v: String(left.d), l: "ngày" }] : []),
        { v: pad(left.h), l: "giờ" },
        { v: pad(left.m), l: "phút" },
        { v: pad(left.s), l: "giây" },
      ]
    : [
        { v: "--", l: "giờ" },
        { v: "--", l: "phút" },
        { v: "--", l: "giây" },
      ];

  return (
    <div className="flex items-start justify-center gap-2 md:gap-4" role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.l} className="flex items-start gap-2 md:gap-4">
          {i > 0 && <span className="pt-3 font-display text-4xl md:pt-5 md:text-6xl">:</span>}
          <div className="flex flex-col items-center gap-1">
            <span
              className="min-w-[2.2ch] rounded-chunky border-4 border-ink bg-white px-2 py-1 text-center font-display text-5xl tabular-nums shadow-brutal md:text-8xl"
              style={{ rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
            >
              {u.v}
            </span>
            <span className="font-rounded text-base font-extrabold uppercase md:text-xl">{u.l}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
