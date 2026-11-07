"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toggleFullscreen } from "@/lib/hooks";
import { sfx } from "@/lib/sfx";
import { useApp } from "@/lib/store";
import { IconButton } from "./ui/Button";
import { Sticker } from "./ui/Sticker";

const NAV = [
  { href: "/", label: "Màn chờ" },
  { href: "/spin", label: "Sân khấu" },
  { href: "/admin", label: "Admin" },
] as const;

export function AppHeader({ right }: { right?: ReactNode }) {
  const pathname = usePathname();
  const title = useApp((s) => s.settings.eventTitle);
  const soundOn = useApp((s) => s.settings.soundOn);
  const updateSettings = useApp((s) => s.updateSettings);
  const [logoClicks, setLogoClicks] = useState(0);
  const cool = logoClicks >= 5;

  return (
    <header className="relative z-20 flex flex-wrap items-center gap-3 border-b-4 border-ink bg-cream/90 px-4 py-2 md:px-6">
      <button
        type="button"
        aria-label="Logo Vio Manday"
        onClick={() => {
          setLogoClicks((n) => n + 1);
          sfx.unlock();
          sfx.pop();
        }}
        className="flex items-center gap-2"
      >
        <Sticker emoji={cool ? "😎" : "🥸"} tilt={-8} size={48} className="animate-wiggle-slow" />
        <span className="hidden -rotate-2 font-display text-xl leading-none sm:inline md:text-2xl">
          {title || "VIO MANDAY"}
        </span>
      </button>

      <nav aria-label="Điều hướng" className="flex gap-1 md:ml-4">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-chunky border-[3px] px-3 py-1.5 font-rounded text-base font-extrabold transition-transform hover:-translate-y-0.5 ${
                active ? "border-ink bg-ink text-cream" : "border-transparent hover:border-ink"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {right}
        <IconButton
          label={soundOn ? "Tắt âm thanh (M)" : "Bật âm thanh (M)"}
          aria-pressed={soundOn}
          onClick={() => {
            sfx.unlock();
            updateSettings({ soundOn: !soundOn });
          }}
        >
          {soundOn ? "🔊" : "🔇"}
        </IconButton>
        <IconButton label="Toàn màn hình (F)" onClick={toggleFullscreen}>
          ⛶
        </IconButton>
      </div>
    </header>
  );
}
