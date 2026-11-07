import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type Tape = "beer" | "blush" | "mint" | "sky" | null;
const tapeColor: Record<Exclude<Tape, null>, string> = {
  beer: "bg-beer/70",
  blush: "bg-blush/60",
  mint: "bg-mint/60",
  sky: "bg-sky/70",
};

export function Card({
  children,
  tape = null,
  tilt = 0,
  className = "",
  style,
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode; tape?: Tape; tilt?: number }) {
  return (
    <section
      {...rest}
      style={{ ...style, ...(tilt ? ({ rotate: `${tilt}deg` } as CSSProperties) : null) }}
      className={`relative rounded-chunky border-4 border-ink bg-white shadow-brutal ${className}`}
    >
      {tape && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-3 right-8 h-6 w-24 rotate-[5deg] ${tapeColor[tape]}`}
        />
      )}
      {children}
    </section>
  );
}
