---
name: manday-design-system
description: Design system "Sticker Pop × Neo-brutalism" cho app vòng quay Manday 11/11. Dùng khi tạo hoặc sửa bất kỳ component, màu sắc, font, layout, nút, card, modal, sticker nào trong app. Chứa design tokens (màu, font, shadow, radius, easing) và công thức component chuẩn.
---

# Manday Design System

## Concept trong 1 câu

> "Bảng dán sticker của hội anh em": viền mực đen dày, bóng đổ cứng lệch, màu nổ như bao bì snack, chữ to hơi nghiêng, emoji như sticker bóc dán.

Từ khóa cảm xúc: **lầy lội · tự tin · ấm áp · năng lượng · không nghiêm túc quá**.

## Bước làm việc

1. Nếu `app/globals.css` chưa có token, copy toàn bộ [references/tokens.css](references/tokens.css) vào (thay khối `:root` và `@theme` mặc định của template).
2. Cập nhật `app/layout.tsx` theo đoạn font trong `.claude/rules/nextjs-conventions.md`.
3. Build component theo công thức trong [references/components.md](references/components.md).
4. Chạy skill `ui-review` khi xong.

## Bảng màu (tên gọi vui để nhớ)

| Token | Hex | Tên | Chữ trên nền này | Vai trò |
|---|---|---|---|---|
| `ink` | `#14110F` | Mực Bút Bi | (trắng/cream) | viền, chữ, bóng đổ |
| `cream` | `#FFF4DE` | Kem Cạo Râu | ink (17.2:1) | nền trang |
| `tie` | `#2B59FF` | Xanh Cà Vạt | **trắng** (5.3:1) | primary, nút QUAY, focus |
| `beer` | `#FFC929` | Vàng Bia Hơi | ink (12.2:1) | highlight, giải lớn, đèn |
| `bbq` | `#FF6A1F` | Cam Sườn Nướng | ink (6.6:1) | accent, cảnh báo vui |
| `mint` | `#27E3A4` | Bạc Hà After-shave | ink (11.3:1) | thành công, trúng giải |
| `blush` | `#FF5FA8` | Hồng Ngại Ngùng | ink (6.7:1) | bất ngờ, "real men wear pink" |
| `coffee` | `#6B3E22` | Cà Phê Đen Đá | **trắng** (9.0:1) | lát vòng quay, chi tiết |
| `sky` | `#7CC8FF` | Xanh Áo Đồng Phục | ink (10.4:1) | nền phụ, card |

Tỉ lệ dùng màu trên một màn hình: **60% cream · 25% ink · 15% màu nổ** (tie là chủ đạo, các màu khác điểm xuyết).

Màu lát vòng quay xoay vòng theo thứ tự: `tie → beer → bbq → mint → blush → sky → coffee`. Hai lát kề nhau không trùng màu; nếu số lát chia hết cho 7 cộng 1 thì đổi màu lát cuối.

## Typography

| Vai trò | Font | Class | Dùng cho |
|---|---|---|---|
| Display | **Bungee** 400 | `font-display` | Tiêu đề lớn, nút QUAY, tên người trúng |
| Rounded | **Baloo 2** 700/800 | `font-rounded` | Tiêu đề phụ, tên trên lát vòng quay, badge |
| Body | **Be Vietnam Pro** 400/600/800 | `font-sans` | Text thường, form admin |

- Cả 3 font đều có subset `vietnamese` (đã kiểm tra trong `font-data.json` của Next 16.4.5).
- Bungee chữ hoa rất "to xác". Dùng `tracking-wide` và **không bao giờ** dùng cho đoạn văn > 1 dòng.
- Scale: `text-6xl` (display hero) · `text-4xl` (h2) · `text-2xl` (h3) · `text-xl` (body ở màn chiếu) · `text-base` (admin).

## Chữ ký hình ảnh (signature elements)

1. **Bóng đổ cứng**: `box-shadow: 6px 6px 0 var(--color-ink)`. Khi nhấn, phần tử dịch `translate(4px,4px)` và bóng thu còn `2px 2px`, tạo cảm giác "nút bấm thật".
2. **Viền mực**: `border: 4px solid var(--color-ink)` cho khung lớn, 3px cho phần tử nhỏ.
3. **Sticker**: emoji bọc trong vòng trắng có viền, nghiêng ngẫu nhiên −8° đến 8°, có bóng.
4. **Ria mép 🥸**: motif lặp lại: kim chỉ vòng quay hình ria mép, ria mép làm dấu gạch phân cách, confetti hình ria mép.
5. **Texture nền**: chấm bi halftone ink 6% opacity trên cream.
6. **Băng dính (tape)**: dải `beer`/`blush` 50% opacity nghiêng 4° dán ở góc card.
7. **Marquee**: dải chạy chữ đen-vàng sọc kiểu "băng cảnh báo công trường" ở chân trang.

## Ví dụ: Tailwind cho 1 card chuẩn

```tsx
<div className="relative rotate-[-1.5deg] rounded-chunky border-4 border-ink bg-white p-6 shadow-brutal">
  <span className="absolute -top-3 left-6 h-6 w-20 rotate-[-4deg] bg-beer/70" aria-hidden />
  <h3 className="font-rounded text-2xl font-extrabold text-ink">Bảng vàng anh em</h3>
</div>
```

## Anti-patterns (nếu thấy thì sửa ngay)

- Shadow blur mềm (`shadow-lg`, `shadow-xl` mặc định của Tailwind) → thay bằng `shadow-brutal`
- `bg-gradient-to-r from-purple-500 to-blue-500` → cấm
- Card bo 24px+ không viền → thêm viền ink, radius `chunky`
- Text xám nhạt `text-gray-400` trên cream → dùng `text-ink/70` tối thiểu
- Toàn màn hình đều thẳng tắp → thêm 1–2 phần tử nghiêng
