---
paths:
  - "app/**/*.{tsx,ts,css}"
  - "components/**/*.{tsx,ts,css}"
---

# Rule: UI Design (BẮT BUỘC)

Chi tiết token và công thức component nằm trong skill `manday-design-system`. File này chỉ liệt kê luật.

## Concept: "Sticker Pop × Neo-brutalism"

Trông như một tấm bảng dán đầy sticker của hội anh em: viền đen dày, bóng đổ lệch cứng, màu nổ, chữ to và hơi lệch.

### PHẢI

- Dùng token màu, font, shadow, radius từ `app/globals.css` (`@theme`). Không hardcode hex trong component.
- Mọi card, nút, khung chính đều có **viền `--color-ink` 3–4px** và **bóng đổ cứng lệch** (`shadow-brutal`), không blur.
- Có ít nhất **1 yếu tố nghiêng** (`rotate-[-2deg]` → `rotate-[3deg]`) trên mỗi màn hình (sticker, badge, tiêu đề phụ) để tạo cảm giác "dán tay".
- Nền dùng `--color-cream` kèm texture (chấm bi, grain hoặc sọc) ở opacity thấp. Nền phẳng trơn bị cấm.
- Tiêu đề lớn dùng font display (`font-display` = Bungee). Body dùng `font-sans` (Be Vietnam Pro).
- Phân cấp rõ: mỗi màn hình có **đúng 1** call-to-action nổi bật nhất (nút QUAY).
- Emoji là "sticker": bọc trong component `<Sticker>` (viền trắng dày, bóng, nghiêng), không chèn emoji trần lẫn trong text tiêu đề lớn.

- Con trỏ chuột: dùng con trỏ custom trong `globals.css` (`--cursor-default` mũi tên trắng, `--cursor-action` mũi tên vàng + ria mép). Phần tử bấm được mà không phải `button`/`a` thì thêm class `cursor-action`, KHÔNG dùng `cursor-pointer` của Tailwind.
- Hành động khó đảo ngược hoặc dễ bấm nhầm trên sân khấu (hoàn tác, báo vắng sau khi trao) phải qua `ConfirmDialog` (focus mặc định ở nút Hủy). Reset dùng `HoldToConfirm`.

### CẤM

- ❌ Gradient tím-xanh / indigo-purple kiểu "AI generic", glassmorphism mờ nhạt, shadow blur mềm kiểu SaaS.
- ❌ Bảng màu xám-xanh corporate, chỉ dùng xanh baby-blue cho "con trai".
- ❌ Font không có subset `vietnamese` (Lilita One, Fredoka, Rubik, Darumadrop One, Shrikhand...).
- ❌ Font Inter / Arial / Geist làm font chính (Geist mặc định của template phải được thay).
- ❌ Bo góc tròn đều mọi thứ 24px+: brutalism dùng radius nhỏ (`--radius-chunky` 14px) hoặc 0.
- ❌ Icon line mảnh 1px. Icon phải dày (stroke ≥ 2.5) hoặc dùng emoji sticker.
- ❌ Chữ trắng trên vàng/mint (tương phản kém).

## Bố cục màn hình trình chiếu (`app/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo sticker nghiêng]   VIO MANDAY 11.11 [🔊] [⛶] [⚙ admin] │  ← header mỏng
├───────────────────────────────┬──────────────────────────────┤
│                               │  🏆 BẢNG VÀNG ANH EM          │
│        ( VÒNG QUAY )          │  - lịch sử người trúng        │
│      chiếm ~60% chiều cao     │  - giải còn lại (badge số)   │
│                               │                              │
│     [ QUAY LUÔN ANH EM ƠI! ]  │                              │
├───────────────────────────────┴──────────────────────────────┤
│ ≋ marquee chạy chữ: câu đùa về đàn ông ≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋ │
└──────────────────────────────────────────────────────────────┘
```

- Desktop ≥ 1280px: 2 cột như trên. Mobile < 768px: xếp dọc, vòng quay lên đầu, sidebar thành tab/drawer.
- Vòng quay luôn là phần tử lớn nhất: `min(70vh, 90vw)`.
- Kết quả trúng giải hiện **modal fullscreen** đè lên tất cả (xem skill `fun-effects`).

## Kích thước chữ tối thiểu cho máy chiếu (viewport ≥ 1280px)

| Phần tử | Tối thiểu |
|---|---|
| Body / label | 20px |
| Tên trên lát vòng quay | 22px (tự co nếu tên dài, cắt `…` khi > 14 ký tự) |
| Nút QUAY | 32px, cao ≥ 80px |
| Tên người trúng trong modal | 96px (`clamp(48px, 9vw, 160px)`) |
