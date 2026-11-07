"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Sticker } from "@/components/ui/Sticker";
import { copy, pick } from "@/lib/copy";
import { useBlobUrl } from "@/lib/hooks";
import type { Prize } from "@/lib/types";

/** Thời gian "khóa" nút sau khi hiện kết quả để khoảnh khắc ăn mừng đủ dài */
const ARM_DELAY = 1500;

export function ResultModal({
  prize,
  name,
  account,
  onAward,
  onAbsent,
}: {
  prize: Prize;
  name: string;
  account: string;
  onAward: () => void;
  onAbsent: () => void;
}) {
  const [title] = useState(() => pick(copy.winTitles));
  const [line] = useState(() => pick(copy.winLines));
  const [armed, setArmed] = useState(false);
  const url = useBlobUrl(prize.imageKey);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), ARM_DELAY);
    return () => clearTimeout(t);
  }, []);

  return (
    <Modal open onClose={() => {}} dismissible={false} fullscreen label={`${title} ${name}`}>
      <div className="relative size-full overflow-hidden">
        <div aria-hidden className="sunburst pointer-events-none absolute left-1/2 top-1/2 size-[180vmax] -translate-x-1/2 -translate-y-1/2 animate-sunburst opacity-50" />
        <Sticker emoji="💪" size={84} tilt={-14} className="absolute left-[6%] top-[12%] hidden animate-float md:inline-grid" />
        <Sticker emoji="👔" size={72} tilt={12} className="absolute bottom-[14%] left-[10%] hidden animate-float [animation-delay:-2s] md:inline-grid" />
        <Sticker emoji="🏆" size={90} tilt={10} className="absolute right-[7%] top-[16%] hidden animate-float [animation-delay:-1s] md:inline-grid" />
        <Sticker emoji="🍻" size={70} tilt={-10} className="absolute bottom-[12%] right-[10%] hidden animate-float [animation-delay:-3s] md:inline-grid" />

        {/* Lớp cuộn: căn giữa kiểu "safe" → màn quá thấp thì cuộn được, không bị cắt mất nút */}
        <div className="scroll-slim relative flex size-full flex-col items-center overflow-y-auto p-4 [justify-content:safe_center]">
        <div className="relative my-3 flex w-full max-w-5xl shrink-0 animate-pop-in flex-col items-center gap-4 rounded-chunky border-4 border-ink bg-mint px-5 py-8 text-center shadow-brutal-lg md:gap-6 md:px-10 md:py-10 short:gap-2 short:py-5 md:short:gap-3 md:short:py-5">
          <span aria-hidden className="absolute -top-3 left-10 h-7 w-28 -rotate-6 bg-beer/80" />
          <span aria-hidden className="absolute -top-3 right-10 h-7 w-28 rotate-6 bg-blush/70" />

          <p className="-rotate-2 rounded-chunky border-4 border-ink bg-white px-4 py-1 font-display text-2xl shadow-brutal-sm md:text-4xl short:text-xl md:short:text-2xl">
            {title}
          </p>

          {/* pt theo em: chừa chỗ cho dấu tiếng Việt chồng cao (Ẳ, Ữ, Ễ…) để không dính vào nhãn phía trên */}
          <h2
            className="max-w-full animate-drop-in break-words pt-[0.22em] font-display leading-[1.08] [animation-delay:150ms]"
            style={{ fontSize: "clamp(40px, min(8.5vw, 13vh), 150px)" }}
          >
            {name}
          </h2>
          <p className="font-mono text-lg font-semibold opacity-80 md:text-xl short:text-base">@{account}</p>

          <div className="flex items-center gap-3 rounded-chunky border-4 border-ink bg-white p-2 pr-5 shadow-brutal-sm">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] border-[3px] border-ink bg-cream md:size-24 short:size-12 md:short:size-14">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ
                <img src={url} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-4xl" aria-hidden>
                  🎁
                </span>
              )}
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold uppercase opacity-70">Phần quà</span>
              <span className="block font-rounded text-2xl font-extrabold leading-tight md:text-3xl short:text-xl md:short:text-2xl">
                {prize.name}
              </span>
            </span>
          </div>

          <p className="max-w-2xl text-lg font-semibold md:text-2xl short:text-base md:short:text-lg">{line}</p>

          <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:flex-row short:mt-1">
            <Button variant="beer" size="xl" disabled={!armed} onClick={onAward} autoFocus className="short:min-h-14 short:text-xl">
              {copy.award} 🎁
            </Button>
            <Button variant="ghost" size="lg" disabled={!armed} onClick={onAbsent}>
              {copy.absent}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </Modal>
  );
}
