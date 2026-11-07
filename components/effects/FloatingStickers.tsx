"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Hash xác định (không dùng Math.random → vị trí ổn định giữa các lần render) */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const EMOJIS = ["🥸", "💪", "👔", "☕", "🔧", "⚽", "🎮", "🍖", "🕶️", "🧦", "🏍️", "🎣"];

const MAX = 12; // rule hiệu năng: ≤ 12 sticker
const BOX_W = 236; // bề ngang tối đa 1 sticker (emoji + tên max-w-40 + viền), có dư cho góc nghiêng
const BOX_H = 56;
const FLOAT = 18; // biên độ bay lên/xuống của animate-float (16px) + nghiêng
const GAP = 14; // khoảng cách tối thiểu tới nội dung / sticker khác

type Rect = { l: number; t: number; r: number; b: number };
type Slot = { x: number; y: number };

const hit = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

/**
 * Chọn tối đa MAX ô trống không va chạm với các phần tử [data-sticker-avoid] trong container
 * (tiêu đề, đồng hồ, nút…) và không va chạm nhau. Thứ tự thử xác định → bố cục ổn định.
 */
function computeSlots(container: HTMLElement): Slot[] {
  const c = container.getBoundingClientRect();
  const avoid: Rect[] = [...container.parentElement!.querySelectorAll<HTMLElement>("[data-sticker-avoid]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left - c.left - GAP, t: r.top - c.top - GAP - FLOAT, r: r.right - c.left + GAP, b: r.bottom - c.top + GAP + FLOAT };
  });
  const candidates: (Slot & { k: number })[] = [];
  const stepX = BOX_W / 2;
  const stepY = BOX_H;
  // chừa biên độ bay ở mép trên/dưới để sticker không bị header/khung cắt khi bay lên xuống
  for (let y = FLOAT + 10; y + BOX_H + FLOAT + 10 <= c.height; y += stepY)
    for (let x = 12; x + BOX_W + 12 <= c.width; x += stepX) candidates.push({ x, y, k: rand(x * 7.3 + y * 1.7) });
  candidates.sort((a, b) => a.k - b.k);

  const placed: Slot[] = [];
  const box = (s: Slot): Rect => ({ l: s.x, t: s.y - FLOAT, r: s.x + BOX_W, b: s.y + BOX_H + FLOAT });
  for (const s of candidates) {
    if (placed.length >= MAX) break;
    const r = box(s);
    if (avoid.some((a) => hit(r, a))) continue;
    if (placed.some((p) => hit(r, { ...box(p), l: box(p).l - GAP, r: box(p).r + GAP }))) continue;
    placed.push({ x: s.x, y: s.y });
  }
  return placed;
}

/** Sticker tên anh em bay quanh nội dung màn chờ, tự né các phần tử có `data-sticker-avoid`. Ẩn trên mobile và khi reduced-motion. */
export function FloatingStickers({ names }: { names: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (getComputedStyle(el).display === "none") return setSlots([]);
        setSlots(computeSlots(el));
      });
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.parentElement?.querySelectorAll("[data-sticker-avoid]").forEach((n) => ro.observe(n));
    void document.fonts?.ready.then(update);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden motion-reduce:hidden md:block">
      {slots.map((s, i) => {
        const tilt = Math.round((rand(i + 11) - 0.5) * 12);
        const name = names.length ? names[i % names.length] : null;
        return (
          <div
            key={`${s.x}-${s.y}`}
            className="absolute animate-float"
            style={
              {
                left: s.x,
                top: s.y,
                "--tilt": `${tilt}deg`,
                animationDelay: `${-rand(i + 13) * 6}s`,
                animationDuration: `${5 + rand(i + 17) * 4}s`,
              } as CSSProperties
            }
          >
            <div
              className="flex max-w-[236px] animate-pop-in items-center gap-2 rounded-pill border-[3px] border-ink bg-white py-1 pl-1 pr-3 shadow-brutal-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-xl">{EMOJIS[i % EMOJIS.length]}</span>
              {name && <span className="max-w-40 truncate font-rounded text-base font-extrabold">{name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
