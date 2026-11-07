"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy";

/**
 * Nút phải GIỮ đủ `duration` ms mới chạy onConfirm. Hỗ trợ chuột, cảm ứng và bàn phím (giữ Space/Enter).
 * Thả sớm → tiến trình chạy ngược về 0.
 */
export function HoldToConfirm({
  onConfirm,
  duration = 2000,
  label = copy.reset.hold,
  holdingLabel = copy.reset.holding,
}: {
  onConfirm: () => void;
  duration?: number;
  label?: string;
  holdingLabel?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const done = useRef(false);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const begin = () => {
    if (holding || done.current) return;
    setHolding(true);
    start.current = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start.current) / duration);
      setProgress(p);
      if (p >= 1) {
        done.current = true;
        setHolding(false);
        onConfirm();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const end = () => {
    if (done.current) return;
    cancelAnimationFrame(raf.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        begin();
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") end();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-14 w-full touch-none select-none overflow-hidden rounded-chunky border-4 border-ink bg-white font-display text-lg uppercase shadow-brutal transition-transform active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full origin-left bg-bbq"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative">{holding ? holdingLabel : label}</span>
    </button>
  );
}
