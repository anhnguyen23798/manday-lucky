"use client";

import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { celebrate, mustacheRain } from "@/components/effects/celebrate";
import { Marquee } from "@/components/effects/Marquee";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { Modal } from "@/components/ui/Modal";
import { Sticker } from "@/components/ui/Sticker";
import { LuckyWheel, type WheelEntry } from "@/components/wheel/LuckyWheel";
import { copy, pick } from "@/lib/copy";
import { toggleFullscreen, useDisplayNames, useEligible, useHotkeys } from "@/lib/hooks";
import { pickMany, secureInt, secureRandom } from "@/lib/random";
import { sfx } from "@/lib/sfx";
import { describeUndo, getRemaining, sortedPrizes, type UndoPreview } from "@/lib/state";
import { useApp, useReady } from "@/lib/store";
import { computeTargetRotation, segmentAtAngle } from "@/lib/wheel-math";
import { PrizeRail, type PrizeView } from "./PrizeRail";
import { ResultModal } from "./ResultModal";
import { SlotReveal } from "./SlotReveal";
import { WinnersPanel } from "./WinnersPanel";

type Phase = "idle" | "charging" | "spinning" | "revealing" | "result";

const SPIN_EASE = [0.12, 0.8, 0.1, 1] as const; // --ease-spin

export function Stage() {
  const ready = useReady((s) => s.ready);
  const prizes = useApp((s) => s.prizes);
  const wins = useApp((s) => s.wins);
  const employees = useApp((s) => s.employees);
  const accounts = useMemo(() => new Map(employees.map((e) => [e.id, e.account])), [employees]);
  const canUndo = useApp((s) => s.undoStack.length > 0);
  const soundOn = useApp((s) => s.settings.soundOn);
  const { resolveDraw, undo, resetResults, updateSettings } = useApp.getState();
  const eligible = useEligible();
  const names = useDisplayNames();
  const reduce = useReducedMotion();

  const prizeViews: PrizeView[] = useMemo(
    () => sortedPrizes(prizes).map((p) => ({ ...p, remaining: getRemaining({ prizes, wins }, p.id) })),
    [prizes, wins],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = prizeViews.find((p) => p.id === selectedId) ?? null;
  const [phase, setPhase] = useState<Phase>("idle");
  const [frozen, setFrozen] = useState<WheelEntry[] | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [result, setResult] = useState<{ prizeId: string; employeeId: string } | null>(null);
  const [batchResult, setBatchResult] = useState<{ prizeId: string; winners: WheelEntry[]; pool: string[] } | null>(null);
  const [multi, setMulti] = useState(false);
  const [batchN, setBatchN] = useState<number | null>(null);
  const [latest, setLatest] = useState<Set<string>>(() => new Set());
  const [announce, setAnnounce] = useState("");
  const [shake, setShake] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [undoPreview, setUndoPreview] = useState<UndoPreview | null>(null);
  const [idleLabel, setIdleLabel] = useState<string>(copy.spinButton.idle[0]);
  const [spinLine, setSpinLine] = useState("");

  const rotation = useMotionValue(0);
  const pointerRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLSpanElement>(null);
  const spinBtnRef = useRef<HTMLButtonElement>(null);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      controls.current?.stop();
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const liveEntries: WheelEntry[] = useMemo(
    () => eligible.map((e) => ({ id: e.id, label: names.get(e.id) ?? e.fullName })),
    [eligible, names],
  );
  const entries = frozen ?? liveEntries;
  const busy = phase !== "idle";

  const remaining = selected?.remaining ?? 0;
  const maxBatch = Math.min(remaining, liveEntries.length);
  const canMulti = maxBatch > 1;
  const effectiveN = multi && canMulti ? Math.min(Math.max(2, batchN ?? maxBatch), maxBatch) : 1;
  const canSpin = !busy && !!selected && remaining > 0 && liveEntries.length > 0;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const wait = (ms: number) => new Promise<void>((r) => later(r, ms));

  const flapPointer = useCallback(() => {
    pointerRef.current?.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(-20deg)" }, { transform: "rotate(0deg)" }],
      { duration: 130, easing: "ease-out" },
    );
  }, []);

  const spin = async () => {
    if (!canSpin || !selected) return;
    sfx.unlock();
    const prize = selected;
    const list = liveEntries;
    setFrozen(list);
    setSpinLine(pick(copy.spinningLines));
    setLatest(new Set());

    // ----- quay hàng loạt -----
    if (effectiveN > 1) {
      const winners = pickMany(list, effectiveN); // kết quả chốt TRƯỚC animation
      setPhase("spinning");
      sfx.whoosh();
      controls.current = animate(rotation, rotation.get() + (reduce ? 180 : 1440), {
        duration: reduce ? 0.4 : 1.3,
        ease: "easeIn",
      });
      await controls.current;
      setBatchResult({ prizeId: prize.id, winners, pool: list.map((e) => e.label) });
      setPhase("result");
      return;
    }

    // ----- quay đơn -----
    const idx = secureInt(list.length); // kết quả chốt TRƯỚC animation
    const n = list.length;
    setPhase("charging");
    sfx.whoosh();
    if (!reduce) {
      controls.current = animate(rotation, rotation.get() - 22, { duration: 0.35, ease: "easeOut" });
      await controls.current;
    }
    setPhase("spinning");
    const target = computeTargetRotation({ current: rotation.get(), count: n, winnerIndex: idx });
    const duration = reduce ? 1.2 : 5 + secureRandom() * 2;
    if (!reduce) later(() => sfx.drumroll(10, 0.11), (duration - 1.3) * 1000);
    let lastSeg = segmentAtAngle(rotation.get(), n);
    let lastFlap = 0;
    controls.current = animate(rotation, target, {
      duration,
      ease: SPIN_EASE as unknown as [number, number, number, number],
      onUpdate: (v) => {
        const s = segmentAtAngle(v, n);
        if (s !== lastSeg) {
          lastSeg = s;
          if (tickerRef.current) tickerRef.current.textContent = list[s]?.label ?? "";
          sfx.tick();
          const now = performance.now();
          if (now - lastFlap > 60) {
            lastFlap = now;
            flapPointer();
          }
        }
      },
    });
    await controls.current;
    if (tickerRef.current) tickerRef.current.textContent = list[idx].label;

    setPhase("revealing");
    setHighlight(idx);
    sfx.drum();
    flapPointer();
    await wait(reduce ? 300 : 900);

    setResult({ prizeId: prize.id, employeeId: list[idx].id });
    setPhase("result");
    setAnnounce(`${list[idx].label} trúng ${prize.name}`);
    sfx.fanfare();
    if (!reduce) setShake(true);
    void celebrate({ reduce: !!reduce });
  };

  const finish = () => {
    setResult(null);
    setBatchResult(null);
    setFrozen(null);
    setHighlight(null);
    setPhase("idle");
    setIdleLabel(pick(copy.spinButton.idle));
    if (tickerRef.current) tickerRef.current.textContent = "";
    requestAnimationFrame(() => spinBtnRef.current?.focus());
  };

  const resolve = (prizeId: string, awardIds: string[], absentIds: string[]) => {
    const r = resolveDraw(prizeId, awardIds, absentIds);
    if (!r.ok) setAnnounce(r.error);
    else if (awardIds.length > 0) {
      setLatest(new Set(awardIds));
      sfx.pop();
    } else sfx.sadTrombone();
    finish();
  };

  /** Mở hộp xác nhận (chụp mô tả tại thời điểm mở để không đổi giữa chừng) */
  const askUndo = () => {
    if (busy || !canUndo) return;
    setUndoPreview(describeUndo(useApp.getState()));
  };

  const doUndo = () => {
    setUndoPreview(null);
    const r = undo();
    if (!r.ok) return setAnnounce(r.error);
    setLatest(new Set());
    sfx.whoosh();
    requestAnimationFrame(() => spinBtnRef.current?.focus());
  };

  useHotkeys(
    {
      " ": (e) => {
        if (!shouldSpinFromKey(e, spinBtnRef.current)) return false; // để nút đang focus tự xử lý
        void spin();
      },
      Enter: (e) => {
        if (!shouldSpinFromKey(e, spinBtnRef.current)) return false;
        void spin();
      },
      "ctrl+z": askUndo,
      f: toggleFullscreen,
      m: () => updateSettings({ soundOn: !soundOn }),
    },
    phase === "idle" && !confirmReset && undoPreview === null,
  );

  // Easter egg: gõ "manday" → mưa ria mép
  useEffect(() => {
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf === "manday") {
        void mustacheRain();
        sfx.fanfare();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready)
    return (
      <>
        <AppHeader />
        <Loading />
      </>
    );

  const allDone = prizeViews.length > 0 && prizeViews.every((p) => p.remaining === 0);
  const resultPrize = result ? prizes.find((p) => p.id === result.prizeId) : null;
  const batchPrize = batchResult ? prizes.find((p) => p.id === batchResult.prizeId) : null;

  const buttonLabel = !selected
    ? copy.spinButton.noPrize
    : remaining === 0
      ? copy.spinButton.soldOut
      : liveEntries.length === 0
        ? copy.spinButton.empty
        : busy
          ? copy.spinButton.spinning[0]
          : effectiveN > 1
            ? `QUAY ${effectiveN} NGƯỜI!`
            : idleLabel;

  return (
    <div
      className={`flex min-h-dvh flex-col ${shake ? "animate-shake" : ""}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShake(false);
      }}
    >
      <AppHeader
        right={
          <>
            <Button size="sm" variant="ghost" disabled={busy || !canUndo} onClick={askUndo} title="Hoàn tác (Ctrl+Z)">
              ⟲ <span className="hidden sm:inline">Hoàn tác</span>
            </Button>
            <Button size="sm" variant="ghost" disabled={busy || wins.length === 0} onClick={() => setConfirmReset(true)}>
              💥 <span className="hidden sm:inline">Reset</span>
            </Button>
          </>
        }
      />

      <main className="grid flex-1 gap-5 p-4 xl:grid-cols-[290px_minmax(0,1fr)_360px] xl:gap-6 xl:p-6">
        <aside className="order-2 min-w-0 xl:order-none">
          <PrizeRail
            prizes={prizeViews}
            selectedId={selectedId}
            disabled={busy}
            onSelect={(id) => {
              sfx.unlock();
              sfx.click();
              setSelectedId(id);
              setBatchN(null);
              // chuyển focus sang nút QUAY để MC bấm Space/Enter quay luôn
              requestAnimationFrame(() => spinBtnRef.current?.focus());
            }}
          />
        </aside>

        <section className="order-1 flex min-w-0 flex-col items-center gap-4 xl:order-none" aria-label="Vòng quay">
          <div className="flex min-h-14 flex-wrap items-center justify-center gap-3 text-center">
            {selected ? (
              <p className="-rotate-1 rounded-chunky border-4 border-ink bg-white px-4 py-1.5 font-display text-xl shadow-brutal-sm md:text-2xl">
                Đang quay: <span className="text-tie">{selected.name}</span>
              </p>
            ) : (
              <p className="font-display text-xl md:text-3xl">{copy.heroTitle}</p>
            )}
            <span className="rounded-pill border-[3px] border-ink bg-beer px-3 py-1 font-rounded text-lg font-extrabold">
              {liveEntries.length} anh em trong vòng
            </span>
          </div>

          <div className={`relative mt-4 w-[min(100%,60vh)] min-w-[260px] ${phase === "idle" && !reduce ? "animate-wiggle-slow" : ""}`}>
            <LuckyWheel
              entries={entries}
              rotation={rotation}
              spinning={phase === "spinning" || phase === "charging"}
              highlightIndex={highlight}
              pointerRef={pointerRef}
            />
            {entries.length === 0 && (
              <div className="absolute inset-0 grid place-items-center p-10 text-center">
                <div className="flex flex-col items-center gap-2 rounded-chunky border-4 border-ink bg-white p-4 shadow-brutal">
                  <span className="text-4xl" aria-hidden>
                    😴
                  </span>
                  <p className="font-rounded text-lg font-extrabold">
                    {employees.length === 0 ? copy.empty.noEmployees : "Anh em trúng hết rồi!"}
                  </p>
                  {employees.length === 0 && (
                    <Link href="/admin" className="font-semibold underline decoration-[3px] underline-offset-4">
                      Vào admin →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-12 w-full max-w-2xl items-center justify-center" aria-hidden>
            {busy ? (
              <p className="flex items-center gap-3 rounded-chunky border-[3px] border-ink bg-ink px-4 py-2 font-display text-xl text-cream md:text-2xl">
                <span className="text-beer">▶</span>
                <span ref={tickerRef} className="min-w-[8ch] truncate" />
              </p>
            ) : allDone ? (
              <p className="font-rounded text-xl font-extrabold">{copy.empty.allDone}</p>
            ) : (
              <p className="hidden font-rounded text-lg font-extrabold text-ink/75 md:block">
                Bấm <kbd className="rounded-md border-2 border-ink bg-white px-1.5">Space</kbd> để quay
              </p>
            )}
          </div>
          {busy && <p className="-mt-2 font-semibold text-ink/75">{spinLine}</p>}

          {canMulti && !busy && (
            <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Chế độ quay">
              <SegButton active={!multi} onClick={() => setMulti(false)}>
                Quay 1
              </SegButton>
              <SegButton active={multi} onClick={() => setMulti(true)}>
                Quay nhiều
              </SegButton>
              {multi && (
                <span className="flex items-center gap-1 rounded-chunky border-[3px] border-ink bg-white p-1">
                  <button
                    type="button"
                    aria-label="Giảm số người"
                    className="size-9 rounded-lg font-display text-xl hover:bg-cream disabled:opacity-30"
                    disabled={effectiveN <= 2}
                    onClick={() => setBatchN(effectiveN - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center font-display text-xl" aria-live="polite">
                    {effectiveN}
                  </span>
                  <button
                    type="button"
                    aria-label="Tăng số người"
                    className="size-9 rounded-lg font-display text-xl hover:bg-cream disabled:opacity-30"
                    disabled={effectiveN >= maxBatch}
                    onClick={() => setBatchN(effectiveN + 1)}
                  >
                    +
                  </button>
                </span>
              )}
            </div>
          )}

          <Button
            ref={spinBtnRef}
            variant="tie"
            size="xl"
            disabled={!canSpin}
            onClick={() => void spin()}
            aria-label={`Quay ${selected ? `giải ${selected.name}` : ""}`}
            className={`relative min-w-[min(100%,420px)] ${canSpin ? "animate-breathe" : ""}`}
          >
            <span aria-hidden className="inline-block group-enabled:group-hover:animate-wiggle">
              🎡
            </span>
            {buttonLabel}
          </Button>
        </section>

        <aside className="order-3 flex min-w-0 flex-col xl:order-none xl:max-h-[calc(100dvh-170px)]">
          <WinnersPanel busy={busy} latestWinIds={latest} />
        </aside>
      </main>

      <Marquee />
      <p className="bg-ink px-4 py-1.5 text-center text-sm text-cream">{copy.footer}</p>

      <div aria-live="assertive" className="sr-only">
        {announce}
      </div>

      {result && resultPrize && (
        <ResultModal
          prize={resultPrize}
          name={names.get(result.employeeId) ?? "?"}
          account={accounts.get(result.employeeId) ?? ""}
          onAward={() => resolve(result.prizeId, [result.employeeId], [])}
          onAbsent={() => resolve(result.prizeId, [], [result.employeeId])}
        />
      )}

      {batchResult && batchPrize && (
        <SlotReveal
          prize={batchPrize}
          winners={batchResult.winners}
          pool={batchResult.pool}
          onResolve={(awardIds, absentIds) => resolve(batchResult.prizeId, awardIds, absentIds)}
        />
      )}

      <ConfirmDialog
        open={undoPreview !== null}
        title={copy.undo.title}
        emoji="⟲"
        confirmLabel={copy.undo.confirm}
        onConfirm={doUndo}
        onCancel={() => setUndoPreview(null)}
      >
        {undoPreview && (
          <>
            <p className="font-semibold">
              Hành động gần nhất: <span className="rounded bg-beer px-1.5">{undoPreview.label}</span>
            </p>
            {undoPreview.lines.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {undoPreview.lines.map((l) => (
                  <li key={l} className="rounded-[10px] border-[3px] border-ink bg-white px-3 py-1.5">
                    {l}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink/75">Không có thay đổi nào về kết quả.</p>
            )}
          </>
        )}
      </ConfirmDialog>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} label={copy.reset.title}>
        <div className="flex flex-col gap-4 rounded-chunky border-4 border-ink bg-cream p-6 shadow-brutal-lg">
          <div className="flex items-center gap-3">
            <Sticker emoji="💥" size={56} tilt={-10} />
            <h2 className="font-display text-2xl">{copy.reset.title}</h2>
          </div>
          <p>{copy.reset.body}</p>
          <HoldToConfirm
            onConfirm={() => {
              resetResults();
              setLatest(new Set());
              setConfirmReset(false);
              sfx.sadTrombone();
            }}
          />
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Thôi, để sau
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** Space/Enter chỉ quay khi không đứng trên một control khác (để Enter trên thẻ quà vẫn chọn quà) */
function shouldSpinFromKey(e: KeyboardEvent, spinBtn: HTMLButtonElement | null) {
  const t = e.target as HTMLElement | null;
  if (!t || t === document.body || t === spinBtn) return true;
  // thẻ quà: thẻ ĐANG chọn → quay luôn; thẻ chưa chọn → để phím kích hoạt click (chọn quà)
  const card = t.closest("[data-spin-key]");
  if (card) return card.getAttribute("aria-pressed") === "true";
  return !t.closest("button, a, [role='tab'], summary, label");
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-chunky border-[3px] border-ink px-4 font-rounded text-lg font-extrabold transition-transform ${
        active ? "-rotate-1 bg-beer shadow-brutal-sm" : "bg-white hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}
