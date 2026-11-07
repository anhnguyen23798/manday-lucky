# Công thức component chuẩn

Tất cả đặt trong `components/ui/`. Dùng `clsx` nếu cần ghép class (có thể tự viết hàm `cn` nhỏ, không cần cài).

## Button (brutal press)

```tsx
"use client";
import type { ButtonHTMLAttributes } from "react";

type Variant = "tie" | "beer" | "mint" | "blush" | "ghost";
const variants: Record<Variant, string> = {
  tie: "bg-tie text-white",
  beer: "bg-beer text-ink",
  mint: "bg-mint text-ink",
  blush: "bg-blush text-ink",
  ghost: "bg-white text-ink",
};

export function Button({
  variant = "tie",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "xl" }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-chunky border-4 border-ink font-display uppercase tracking-wide",
        "shadow-brutal transition-[transform,box-shadow] duration-150 ease-(--ease-snappy)",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg",
        "active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-brutal-pressed disabled:translate-x-1 disabled:translate-y-1",
        size === "xl" ? "min-h-20 px-10 text-3xl" : "min-h-12 px-5 text-lg",
        variants[variant],
        className,
      ].join(" ")}
    />
  );
}
```

> `box-shadow` chỉ transition 150ms khi tương tác, không lặp liên tục, nên không vi phạm rule hiệu năng.

## Sticker (emoji bóc dán)

```tsx
export function Sticker({ emoji, tilt = 0, size = 56, label }: { emoji: string; tilt?: number; size?: number; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ ["--tilt" as string]: `${tilt}deg`, width: size, height: size, fontSize: size * 0.55 }}
      className="inline-grid place-items-center rounded-full border-[3px] border-ink bg-white shadow-brutal-sm rotate-(--tilt) select-none"
    >
      {emoji}
    </span>
  );
}
```

## Card có băng dính

```tsx
<section className="relative rounded-chunky border-4 border-ink bg-white p-6 shadow-brutal">
  <span aria-hidden className="absolute -top-3 right-8 h-6 w-24 rotate-[5deg] bg-blush/60" />
  {children}
</section>
```

## Badge số lượng giải

```tsx
<span className="inline-flex min-w-9 items-center justify-center rounded-pill border-[3px] border-ink bg-beer px-2 font-rounded text-lg font-extrabold">
  x{remaining}
</span>
```

## Marquee băng cảnh báo

```tsx
<div className="overflow-hidden border-y-4 border-ink bg-beer
  [background-image:repeating-linear-gradient(-45deg,transparent_0_18px,rgb(20_17_15/0.08)_18px_36px)]">
  <div className="flex w-max animate-marquee gap-12 py-2 font-display text-xl text-ink">
    {/* render danh sách câu 2 lần để lặp liền mạch */}
    {[...jokes, ...jokes].map((j, i) => <span key={i}>🥸 {j}</span>)}
  </div>
</div>
```

## Modal kết quả (khung)

- Overlay: `bg-ink/80` + sunburst xoay chậm (conic-gradient beer/cream) phía sau thẻ.
- Thẻ: `animate-pop-in`, `shadow-brutal-lg`, nền `mint` (trúng) hoặc `sky` (giải vui).
- Tên người trúng: `font-display text-[clamp(48px,9vw,160px)] leading-none`.
- Nút: "NHẬN QUÀ ĐI ANH!" (`beer`) + "Quay tiếp" (`ghost`).
