"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Sticker } from "@/components/ui/Sticker";
import { copy } from "@/lib/copy";
import { useBlobUrl } from "@/lib/hooks";
import type { Prize } from "@/lib/types";

export type PrizeView = Prize & { remaining: number };

export function PrizeRail({
  prizes,
  selectedId,
  onSelect,
  disabled,
}: {
  prizes: PrizeView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  if (prizes.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-chunky border-4 border-dashed border-ink bg-white/70 p-5 text-center">
        <Sticker emoji="🎁" size={52} tilt={-8} />
        <p className="font-rounded text-lg font-extrabold">{copy.empty.noPrizes}</p>
        <Link href="/admin" className="font-semibold underline decoration-[3px] underline-offset-4">
          Vào admin →
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg md:text-xl">
        <span>Chọn quà</span>
        <Sticker emoji="👇" size={34} tilt={10} className="animate-wiggle" />
      </h2>
      <ul
        aria-label="Danh sách phần quà"
        className="scroll-slim -mx-1 flex gap-3 overflow-x-auto px-1 pb-3 pt-1 xl:max-h-[calc(100dvh-230px)] xl:flex-col xl:overflow-y-auto xl:overflow-x-visible xl:pr-3"
      >
        {prizes.map((p) => (
          <li key={p.id} className="shrink-0 xl:shrink">
            <PrizeCard prize={p} selected={p.id === selectedId} onSelect={onSelect} disabled={disabled} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrizeCard({
  prize,
  selected,
  onSelect,
  disabled,
}: {
  prize: PrizeView;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const url = useBlobUrl(prize.imageKey);
  const soldOut = prize.remaining === 0;
  return (
    <button
      type="button"
      data-spin-key
      aria-pressed={selected}
      disabled={disabled || soldOut}
      onClick={() => onSelect(prize.id)}
      className={[
        "relative flex w-60 items-center gap-3 rounded-chunky border-4 border-ink p-2.5 text-left transition-[transform,box-shadow] duration-150 xl:w-full",
        selected ? "-rotate-1 bg-beer shadow-brutal" : "bg-white shadow-brutal-sm enabled:hover:-translate-y-0.5 enabled:hover:shadow-brutal",
        soldOut ? "cursor-not-allowed" : "",
        disabled && !soldOut ? "cursor-wait" : "",
      ].join(" ")}
    >
      <span className={`grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] border-[3px] border-ink bg-cream ${soldOut ? "grayscale" : ""}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-3xl" aria-hidden>
            🎁
          </span>
        )}
      </span>
      <span className={`min-w-0 flex-1 ${soldOut ? "opacity-50" : ""}`}>
        <span className="line-clamp-2 font-rounded text-lg font-extrabold leading-tight">{prize.name}</span>
        <Badge tone={soldOut ? "ink" : selected ? "white" : "mint"} className="mt-1 text-sm!">
          còn {prize.remaining}/{prize.quantity}
        </Badge>
      </span>
      {soldOut && (
        <span
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2 animate-stamp rounded-md border-4 border-bbq px-2 font-display text-xl text-bbq"
        >
          HẾT
        </span>
      )}
    </button>
  );
}
