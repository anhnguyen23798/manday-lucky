import type { ReactNode } from "react";

type Tone = "beer" | "mint" | "blush" | "sky" | "ink" | "white";
const tones: Record<Tone, string> = {
  beer: "bg-beer text-ink",
  mint: "bg-mint text-ink",
  blush: "bg-blush text-ink",
  sky: "bg-sky text-ink",
  ink: "bg-ink text-cream",
  white: "bg-white text-ink",
};

export function Badge({ children, tone = "beer", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center gap-1 rounded-pill border-[3px] border-ink px-2.5 py-0.5 font-rounded text-base font-extrabold leading-tight ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
