---
paths:
  - "app/**/*.{tsx,ts,css}"
  - "components/**/*.{tsx,ts,css}"
  - "lib/**/*.ts"
---

# Rule: Animation và hiệu năng

App phải **vui và nhiều hiệu ứng**, nhưng chạy mượt trên laptop văn phòng cấu hình yếu nối máy chiếu.

## PHẢI

- Chỉ animate `transform` và `opacity` (cùng `filter` cho glow ngắn). KHÔNG animate `width`, `height`, `top`, `left`, `margin`, `box-shadow` liên tục.
- Vòng quay xoay bằng `transform: rotate()` trên **một** phần tử (SVG `<g>` hoặc `<div>`), không vẽ lại canvas mỗi frame khi không cần.
- Animation lặp vô hạn (đèn chớp, sticker bay, marquee) dùng **CSS keyframes**, không dùng JS `setInterval`.
- Animation có logic (quay, đếm, chuỗi celebration) dùng `motion` (`motion/react`) hoặc `requestAnimationFrame`.
- Tôn trọng `prefers-reduced-motion: reduce`:
  - Vòng quay vẫn quay nhưng ngắn (≤ 1.2s), bỏ rung màn hình và bỏ sticker bay.
  - Confetti giảm còn ≤ 30 hạt, không flash nhấp nháy.
  - Dùng `useReducedMotion()` từ `motion/react` hoặc media query CSS.
- Giới hạn: confetti ≤ 250 hạt mỗi lần bắn, sticker nền ≤ 12 cái, tổng cộng ≤ 3 hiệu ứng nặng chạy song song.
- Dọn dẹp: mọi `requestAnimationFrame`, timeout, `AudioContext` node, listener phải được hủy trong cleanup của `useEffect`.
- Thêm `will-change: transform` chỉ khi đang quay, gỡ ra khi dừng.

## Timing chuẩn (dùng biến trong `globals.css`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | nút nảy, sticker pop-in |
| `--ease-spin` | `cubic-bezier(0.12, 0.8, 0.1, 1)` | vòng quay giảm tốc |
| `--dur-fast` | 150ms | hover, press |
| `--dur-base` | 300ms | modal, toast |
| `--dur-spin` | 5000–7000ms | vòng quay (random trong khoảng) |

## CẤM

- ❌ Flash toàn màn hình quá 3 lần/giây (rủi ro động kinh).
- ❌ Autoplay âm thanh khi chưa có tương tác người dùng (trình duyệt chặn, và gây giật mình).
- ❌ Layout shift khi modal/toast xuất hiện.
- ❌ Thư viện animation thứ hai ngoài `motion` (không GSAP, anime.js, react-spring) trừ khi có lý do rõ ràng.
