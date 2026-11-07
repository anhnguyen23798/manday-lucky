---
paths:
  - "app/**/*"
  - "components/**/*"
  - "lib/**/*"
  - "next.config.ts"
---

# Rule: Quy ước Next.js 16 cho dự án này

> Next 16.4 có breaking changes. Khi không chắc, đọc `node_modules/next/dist/docs/01-app/` trước khi code.

## Cấu hình hiện tại cần biết

- `cacheComponents: true`: server component không được dùng giá trị động (`Math.random()`, `Date.now()`, `crypto`) ở cấp render. **Toàn bộ logic vòng quay, random, localStorage, audio đặt trong Client Component** (`'use client'`).
- Tailwind v4 qua `@tailwindcss/turbopack` loader. Cấu hình theme bằng `@theme` trong `app/globals.css`. **Không tạo `tailwind.config.js` hay `postcss.config.mjs`.**
- Root layout dùng type global `LayoutProps<"/">`; page dùng `PageProps<"/...">`.

## PHẢI

- `app/page.tsx` giữ là Server Component mỏng, render `<WheelStage />` (client) bên trong.
- Font qua `next/font/google`, luôn có `subsets: ["latin", "vietnamese"]`, gán vào CSS variable rồi map trong `@theme`:
  ```ts
  import { Be_Vietnam_Pro, Bungee, Baloo_2 } from "next/font/google";
  const sans = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "600", "800"], variable: "--font-be-vietnam" });
  const display = Bungee({ subsets: ["latin", "vietnamese"], weight: "400", variable: "--font-bungee" });
  const rounded = Baloo_2({ subsets: ["latin", "vietnamese"], weight: ["700", "800"], variable: "--font-baloo" });
  ```
  (Đã kiểm tra: 3 font này đều có subset `vietnamese` trong `font-data.json` của Next 16.4.5.)
- `<html lang="vi">` và `metadata` tiếng Việt (title "Manday Lucky: Vòng quay Anh Em 11/11").
- Component chỉ chạy được ở client (canvas-confetti, AudioContext) import động khi cần, hoặc khởi tạo trong `useEffect`.
- Đọc localStorage trong `useEffect` hoặc `useSyncExternalStore` để tránh hydration mismatch.

## CẤM

- ❌ `pages/` router.
- ❌ Gọi `localStorage`, `window`, `document` ở top-level module hoặc khi render.
- ❌ Backend/database cho v1: dữ liệu lưu localStorage, có nút export/import JSON.
