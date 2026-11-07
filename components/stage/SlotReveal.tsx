"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { celebrate } from "@/components/effects/celebrate";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { copy, pick } from "@/lib/copy";
import { sfx } from "@/lib/sfx";
import type { Prize } from "@/lib/types";

const FIRST_STOP = 1100;
const GAP = 420;
const FLIP_MS = 70;

/**
 * Quay hàng loạt: N thẻ chạy tên như slot machine rồi dừng lần lượt.
 * Người trúng đã được chọn sẵn (crypto) trước khi mở; animation chỉ để trình diễn.
 */
export function SlotReveal({
  prize,
  winners,
  pool,
  onResolve,
}: {
  prize: Prize;
  winners: { id: string; label: string }[];
  /** tên dùng để "chạy" trên thẻ */
  pool: string[];
  onResolve: (awardIds: string[], absentIds: string[]) => void;
}) {
  const reduce = useReducedMotion();
  const [stopped, setStopped] = useState(0);
  const [absent, setAbsent] = useState<Set<string>>(() => new Set());
  const [title] = useState(() => pick(copy.batchTitles));
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const n = winners.length;
  const allDone = stopped >= n;

  useEffect(() => {
    const t0 = performance.now();
    const firstStop = reduce ? 200 : FIRST_STOP;
    const gap = reduce ? 60 : GAP;
    let lastFlip = 0;
    let count = 0;
    let raf = 0;
    const step = (now: number) => {
      const elapsed = now - t0;
      const shouldStop = Math.min(n, Math.max(0, Math.floor((elapsed - firstStop) / gap) + 1));
      while (count < shouldStop) {
        count++;
        sfx.pop();
        setStopped(count);
      }
      if (now - lastFlip > FLIP_MS && pool.length > 0) {
        lastFlip = now;
        for (let i = count; i < n; i++) {
          const el = textRefs.current[i];
          if (el) el.textContent = pool[Math.floor(Math.random() * pool.length)];
        }
        if (count < n) sfx.tick();
      }
      if (count < n) raf = requestAnimationFrame(step);
      else {
        sfx.fanfare();
        void celebrate({ reduce: !!reduce });
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // chạy đúng 1 lần khi mở
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameSize = n <= 3 ? "text-4xl md:text-5xl" : n <= 8 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl";
  const awardIds = winners.filter((w) => !absent.has(w.id)).map((w) => w.id);
  const absentIds = winners.filter((w) => absent.has(w.id)).map((w) => w.id);

  return (
    <Modal open onClose={() => {}} dismissible={false} fullscreen label={`Quay hàng loạt ${prize.name}`}>
      <div className="relative flex size-full flex-col items-center overflow-hidden">
        <div aria-hidden className="sunburst pointer-events-none absolute left-1/2 top-1/2 size-[180vmax] -translate-x-1/2 -translate-y-1/2 animate-sunburst opacity-40" />
        <div className="scroll-slim relative flex w-full max-w-7xl flex-1 flex-col items-center gap-5 overflow-y-auto p-4 [justify-content:safe_center] md:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="-rotate-2 rounded-chunky border-4 border-ink bg-white px-4 py-1 font-display text-2xl shadow-brutal-sm md:text-4xl">
              {allDone ? title : "ĐANG QUAY…"}
            </p>
            <p className="rounded-chunky border-[3px] border-ink bg-beer px-3 py-1 font-rounded text-xl font-extrabold md:text-2xl">
              🎁 {prize.name} × {n}
            </p>
          </div>

          <ul className="grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
            {winners.map((w, i) => {
              const isStopped = i < stopped;
              const isAbsent = absent.has(w.id);
              return (
                <li
                  key={w.id}
                  style={{ rotate: `${((i % 3) - 1) * 1.2}deg` }}
                  className={`flex flex-col items-center gap-3 rounded-chunky border-4 border-ink p-4 text-center shadow-brutal transition-colors ${
                    !isStopped ? "bg-white" : isAbsent ? "bg-blush/40" : "bg-mint"
                  }`}
                >
                  <span className="font-mono text-sm font-semibold opacity-60">#{i + 1}</span>
                  {isStopped ? (
                    <span
                      className={`min-h-[2.4em] animate-pop-in break-words font-display leading-tight ${nameSize} ${
                        isAbsent ? "line-through decoration-4" : ""
                      }`}
                    >
                      {w.label}
                    </span>
                  ) : (
                    // span này chỉ được ghi qua ref (rAF), React không render children
                    <span
                      ref={(el) => {
                        textRefs.current[i] = el;
                      }}
                      aria-hidden
                      className={`min-h-[2.4em] break-words font-display leading-tight opacity-60 blur-[1px] ${nameSize}`}
                    />
                  )}
                  {allDone && (
                    <button
                      type="button"
                      aria-pressed={isAbsent}
                      onClick={() =>
                        setAbsent((s) => {
                          const next = new Set(s);
                          if (next.has(w.id)) next.delete(w.id);
                          else next.add(w.id);
                          return next;
                        })
                      }
                      className={`min-h-10 rounded-pill border-[3px] border-ink px-3 text-sm font-semibold ${
                        isAbsent ? "bg-ink text-cream" : "bg-white hover:bg-cream"
                      }`}
                    >
                      {isAbsent ? "↩ Có mặt" : `🙈 ${copy.absentShort}`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex w-full flex-wrap items-center justify-center gap-3 border-t-4 border-ink bg-cream p-4">
          {absentIds.length > 0 && (
            <span className="font-semibold">
              {absentIds.length} người vắng sẽ được loại, lượt quà giữ lại để quay tiếp.
            </span>
          )}
          <Button variant="beer" size="xl" disabled={!allDone} onClick={() => onResolve(awardIds, absentIds)} autoFocus>
            {awardIds.length > 0 ? `${copy.awardAll} (${awardIds.length})` : "XÁC NHẬN VẮNG"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
