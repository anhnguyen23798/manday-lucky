import type { CSSProperties } from "react";

export function Sticker({
  emoji,
  tilt = 0,
  size = 56,
  label,
  className = "",
  style,
}: {
  emoji: string;
  tilt?: number;
  size?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={
        {
          "--tilt": `${tilt}deg`,
          width: size,
          height: size,
          fontSize: size * 0.55,
          rotate: `${tilt}deg`,
          ...style,
        } as CSSProperties
      }
      className={`inline-grid shrink-0 select-none place-items-center rounded-full border-[3px] border-ink bg-white leading-none shadow-brutal-sm ${className}`}
    >
      {emoji}
    </span>
  );
}
