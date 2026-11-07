import type { ButtonHTMLAttributes, Ref } from "react";

export type ButtonVariant = "tie" | "beer" | "mint" | "blush" | "bbq" | "ghost" | "ink";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<ButtonVariant, string> = {
  tie: "bg-tie text-white",
  beer: "bg-beer text-ink",
  mint: "bg-mint text-ink",
  blush: "bg-blush text-ink",
  bbq: "bg-bbq text-ink",
  ghost: "bg-white text-ink",
  ink: "bg-ink text-cream",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3 text-sm border-[3px] shadow-brutal-sm",
  md: "min-h-12 px-5 text-base border-[3px] shadow-brutal-sm",
  lg: "min-h-14 px-6 text-xl border-4 shadow-brutal",
  xl: "min-h-20 px-10 text-2xl md:text-3xl border-4 shadow-brutal",
};

export function Button({
  variant = "tie",
  size = "md",
  className = "",
  type = "button",
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: Size; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type={type}
      {...props}
      className={[
        "group inline-flex select-none items-center justify-center gap-2 rounded-chunky border-ink font-display uppercase tracking-wide",
        "transition-[transform,box-shadow] duration-150 ease-(--ease-snappy)",
        "enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:hover:shadow-brutal",
        "enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-brutal-pressed",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
        sizes[size],
        variants[variant],
        className,
      ].join(" ")}
    />
  );
}

/** Nút icon vuông (header, toolbar) */
export function IconButton({
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={[
        "inline-grid size-12 place-items-center rounded-chunky border-[3px] border-ink bg-white text-xl shadow-brutal-sm",
        "transition-transform duration-150 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:shadow-none",
        "disabled:opacity-40",
        className,
      ].join(" ")}
    />
  );
}
