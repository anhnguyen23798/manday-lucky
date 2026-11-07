"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { sfx } from "@/lib/sfx";
import { Sticker } from "@/components/ui/Sticker";
import { copy } from "@/lib/copy";
import { useDisplayNames } from "@/lib/hooks";
import { sortedPrizes } from "@/lib/state";
import { useApp } from "@/lib/store";

export function WinnersPanel({ busy, latestWinIds }: { busy: boolean; latestWinIds: Set<string> }) {
  const [tab, setTab] = useState<"winners" | "absent">("winners");
  const wins = useApp((s) => s.wins);
  const prizes = useApp((s) => s.prizes);
  const absentIds = useApp((s) => s.absentIds);
  const restoreAbsent = useApp((s) => s.restoreAbsent);
  const markWinnerAbsent = useApp((s) => s.markWinnerAbsent);
  const names = useDisplayNames();
  const [pendingWin, setPendingWin] = useState<{ id: string; name: string; prize: string } | null>(null);

  const groups = useMemo(() => {
    return sortedPrizes(prizes)
      .map((p) => ({
        prize: p,
        wins: wins.filter((w) => w.prizeId === p.id).sort((a, b) => b.at - a.at),
      }))
      .filter((g) => g.wins.length > 0)
      .sort((a, b) => (b.wins[0]?.at ?? 0) - (a.wins[0]?.at ?? 0));
  }, [prizes, wins]);

  return (
    <section className="relative flex min-h-0 flex-col rounded-chunky border-4 border-ink bg-white shadow-brutal">
      <span aria-hidden className="pointer-events-none absolute -top-4 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-[-4deg] bg-mint/70" />
      <div role="tablist" aria-label="Kết quả" className="flex border-b-4 border-ink">
        {(
          [
            ["winners", "🏆 Bảng vàng", wins.length],
            ["absent", "🙈 Vắng mặt", absentIds.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap px-2 py-3 font-display text-sm first:rounded-tl-[10px] last:rounded-tr-[10px] 2xl:text-base ${
              tab === id ? "bg-beer" : "bg-white hover:bg-cream"
            }`}
          >
            {label}
            <Badge tone={tab === id ? "white" : "beer"} className="text-sm!">
              {count}
            </Badge>
          </button>
        ))}
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "winners" ? (
          groups.length === 0 ? (
            <Empty emoji="🏆" text={copy.empty.noWinners} />
          ) : (
            <ol className="flex flex-col gap-4">
              {groups.map((g) => (
                <li key={g.prize.id}>
                  <h3 className="mb-2 flex items-center gap-2 font-rounded text-lg font-extrabold leading-tight">
                    <span className="min-w-0 flex-1">{g.prize.name}</span>
                    <Badge tone="mint" className="text-sm!">
                      {g.wins.length}/{g.prize.quantity}
                    </Badge>
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {g.wins.map((w) => {
                      const fresh = latestWinIds.has(w.employeeId);
                      const name = names.get(w.employeeId) ?? "?";
                      return (
                        <li
                          key={w.id}
                          className={`group flex items-center gap-2 rounded-[10px] border-[3px] border-ink py-1.5 pl-3 pr-1.5 text-lg font-semibold ${
                            fresh ? "animate-pop-in bg-mint" : "bg-cream"
                          }`}
                        >
                          <span aria-hidden>{fresh ? "✨" : "🥸"}</span>
                          <span className="min-w-0 flex-1 break-words">{name}</span>
                          {/* Ít khi dùng → mờ, chỉ hiện rõ khi rê chuột vào dòng / focus bàn phím; màn cảm ứng hiện vừa phải */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setPendingWin({ id: w.id, name, prize: g.prize.name })}
                            aria-label={`Báo vắng ${name} (trả lại quà)`}
                            title="Báo vắng, trả lại quà"
                            className="grid size-8 shrink-0 place-items-center rounded-full text-ink opacity-0 transition-[opacity,transform,background-color] duration-150 group-hover:opacity-60 enabled:hover:scale-110 enabled:hover:bg-blush enabled:hover:opacity-100 focus-visible:opacity-100 disabled:hidden pointer-coarse:size-10 pointer-coarse:opacity-40"
                          >
                            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M6 6l12 12" />
                              <path d="M18 6 6 18" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )
        ) : absentIds.length === 0 ? (
          <Empty emoji="👏" text={copy.empty.noAbsent} />
        ) : (
          <ul className="flex flex-col gap-2">
            {absentIds.map((id) => (
              <li key={id} className="flex items-center gap-2 rounded-[10px] border-[3px] border-ink bg-blush/20 px-3 py-1.5">
                <span className="min-w-0 flex-1 break-words text-lg font-semibold">{names.get(id) ?? "?"}</span>
                <Button size="sm" variant="mint" disabled={busy} onClick={() => restoreAbsent(id)}>
                  Có mặt rồi
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingWin !== null}
        title={copy.winnerAbsent.title}
        emoji="🙈"
        confirmLabel={copy.winnerAbsent.confirm}
        confirmVariant="blush"
        onCancel={() => setPendingWin(null)}
        onConfirm={() => {
          if (pendingWin) markWinnerAbsent(pendingWin.id);
          setPendingWin(null);
          sfx.sadTrombone();
        }}
      >
        {pendingWin && (
          <>
            <p className="rounded-[10px] border-[3px] border-ink bg-white px-3 py-2 text-lg font-semibold">
              {pendingWin.name}
              <span className="block text-base font-normal text-ink/75">🎁 {pendingWin.prize}</span>
            </p>
            <p>{copy.winnerAbsent.body}</p>
            <p className="text-sm text-ink/70">Lỡ tay vẫn Hoàn tác được.</p>
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}

function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Sticker emoji={emoji} size={56} tilt={-6} />
      <p className="font-rounded text-lg font-extrabold">{text}</p>
    </div>
  );
}
