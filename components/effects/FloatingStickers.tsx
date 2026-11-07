import type { CSSProperties } from "react";

/** Hash xác định (không dùng Math.random khi render → không lệch hydration, không vi phạm purity) */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const EMOJIS = ["🥸", "💪", "👔", "☕", "🔧", "⚽", "🎮", "🍖", "🕶️", "🧦", "🏍️", "🎣"];

/** Vị trí ở viền màn hình để không che nội dung giữa */
function position(i: number): CSSProperties {
  const side = i % 4;
  const t = 8 + rand(i + 1) * 80;
  const edge = 2 + rand(i + 7) * 10;
  // sticker hai bên né dải giữa (28–60%) nơi có tiêu đề lớn
  const r = rand(i + 1);
  const sideTop = r < 0.5 ? 6 + r * 2 * 20 : 62 + (r - 0.5) * 2 * 24;
  if (side === 0) return { left: `${edge}%`, top: `${sideTop}%` };
  if (side === 1) return { right: `${edge}%`, top: `${sideTop}%` };
  if (side === 2) return { top: `${4 + rand(i + 3) * 10}%`, left: `${t}%` };
  return { bottom: `${4 + rand(i + 5) * 10}%`, left: `${t}%` };
}

/** Tối đa 12 sticker (rule hiệu năng). Ẩn trên màn nhỏ và khi reduced-motion. */
export function FloatingStickers({ names }: { names: string[] }) {
  const items = Array.from({ length: 12 }, (_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    name: names.length ? names[i % names.length] : null,
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden motion-reduce:hidden md:block">
      {items.map((it, i) => {
        const tilt = Math.round((rand(i + 11) - 0.5) * 16);
        return (
          <div
            key={i}
            className="absolute animate-float"
            style={
              {
                ...position(i),
                "--tilt": `${tilt}deg`,
                animationDelay: `${-rand(i + 13) * 6}s`,
                animationDuration: `${5 + rand(i + 17) * 4}s`,
              } as CSSProperties
            }
          >
            <div className="flex animate-pop-in items-center gap-2 rounded-pill border-[3px] border-ink bg-white py-1 pl-1 pr-3 shadow-brutal-sm" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="grid size-9 place-items-center rounded-full bg-cream text-xl">{it.emoji}</span>
              {it.name && <span className="max-w-40 truncate font-rounded text-base font-extrabold">{it.name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
