"use client";

import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { celebrate } from "@/components/effects/celebrate";
import { Countdown, useNow } from "@/components/effects/Countdown";
import { FloatingStickers } from "@/components/effects/FloatingStickers";
import { Marquee } from "@/components/effects/Marquee";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/Badge";
import { Sticker } from "@/components/ui/Sticker";
import { copy } from "@/lib/copy";
import { useBlobUrl, useDisplayNames } from "@/lib/hooks";
import { sfx } from "@/lib/sfx";
import { useApp, useReady } from "@/lib/store";

export function Lobby() {
  const ready = useReady((s) => s.ready);
  const settings = useApp((s) => s.settings);
  const employees = useApp((s) => s.employees);
  const prizes = useApp((s) => s.prizes);
  const names = useDisplayNames();
  const reduce = useReducedMotion();
  const musicUrl = useBlobUrl(settings.bgMusicKey);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const now = useNow();

  const totalGifts = prizes.reduce((n, p) => n + p.quantity, 0);
  const floatingNames = useMemo(() => {
    // lấy rải đều trong danh sách cho đa dạng
    const step = Math.max(1, Math.floor(employees.length / 12));
    return employees.filter((_, i) => i % step === 0).slice(0, 12).map((e) => names.get(e.id) ?? e.fullName);
  }, [employees, names]);

  const start = settings.eventStartAt;
  const started = start !== null && now !== null && now >= start;

  // Bắn pháo hoa đúng lúc chuyển từ "chưa tới" → "đã tới" (không bắn nếu mở trang khi đã qua giờ G)
  const prevStarted = useRef<boolean | null>(null);
  useEffect(() => {
    if (now === null) return;
    if (prevStarted.current === false && started) {
      sfx.fanfare();
      void celebrate({ reduce: !!reduce });
    }
    prevStarted.current = started;
  }, [now, started, reduce]);

  useEffect(() => {
    if (!musicUrl) return;
    const a = audioRef.current;
    return () => a?.pause();
  }, [musicUrl]);

  const toggleMusic = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  if (!ready)
    return (
      <>
        <AppHeader />
        <Loading />
      </>
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        right={
          musicUrl ? (
            <button
              type="button"
              onClick={() => void toggleMusic()}
              aria-pressed={playing}
              className="flex min-h-12 items-center gap-2 rounded-chunky border-[3px] border-ink bg-blush px-3 font-rounded font-extrabold shadow-brutal-sm"
            >
              <span aria-hidden className={playing ? "animate-wiggle" : ""}>
                🎵
              </span>
              {playing ? "Tắt nhạc" : "Bật nhạc"}
            </button>
          ) : null
        }
      />
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" onEnded={() => setPlaying(false)} />}

      <main className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 text-center">
        <FloatingStickers names={floatingNames} />

        <div data-sticker-avoid className="relative flex flex-col items-center gap-4">
          <div className="flex items-end gap-3">
            <Sticker emoji="🥸" size={92} tilt={-12} className="animate-wiggle-slow" />
            <Sticker emoji="💪" size={64} tilt={14} className="animate-float" />
          </div>
          <p className="rotate-[-3deg] rounded-chunky border-4 border-ink bg-beer px-4 py-1 font-display text-lg shadow-brutal-sm md:text-2xl">
            {copy.lobby.badge}
          </p>
          <h1
            className="animate-drop-in font-display leading-[0.95] [text-shadow:5px_5px_0_var(--color-beer)]"
            style={{ fontSize: "clamp(44px, 9vw, 150px)" }}
          >
            {settings.eventTitle || copy.brand}
          </h1>
          <p className="max-w-3xl font-rounded text-xl font-extrabold md:text-3xl">{copy.heroSub}</p>
        </div>

        <div data-sticker-avoid className="relative flex flex-col items-center gap-4">
          {start ? (
            <>
              <p className="font-display text-2xl md:text-4xl">{started ? copy.lobby.started : copy.lobby.countdownTitle}</p>
              <Countdown target={start} now={now} />
            </>
          ) : (
            <p className="rounded-chunky border-4 border-dashed border-ink bg-white/80 px-5 py-3 font-rounded text-xl font-extrabold">
              {copy.lobby.noTime}
            </p>
          )}
        </div>

        <div data-sticker-avoid className="relative flex flex-wrap justify-center gap-3">
          <Badge tone="sky" className="px-4! py-1! text-xl!">
            🧔 {employees.length} anh em
          </Badge>
          <Badge tone="blush" className="px-4! py-1! text-xl!">
            🎁 {totalGifts} phần quà
          </Badge>
        </div>

        <Link
          data-sticker-avoid
          href="/spin"
          onClick={() => sfx.unlock()}
          className={`relative inline-flex min-h-20 items-center justify-center gap-3 rounded-chunky border-4 border-ink bg-tie px-10 font-display text-2xl uppercase tracking-wide text-white shadow-brutal transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed md:text-4xl ${
            started || !start ? "animate-breathe" : ""
          }`}
        >
          <span aria-hidden>🎡</span>
          {copy.lobby.enter}
        </Link>
      </main>

      <Marquee />
      <p className="bg-ink px-4 py-1.5 text-center text-sm text-cream">{copy.footer}</p>
    </div>
  );
}
