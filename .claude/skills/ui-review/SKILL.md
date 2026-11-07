---
name: ui-review
description: Checklist tự review UI của app Manday trước khi báo hoàn thành: design system, độ vui, hiệu năng animation, accessibility, tiếng Việt, màn chiếu. Dùng sau khi tạo hoặc sửa bất kỳ màn hình hay component nào, hoặc khi người dùng yêu cầu review UI.
---

# UI Review: Manday

Chạy theo thứ tự. Mỗi mục **FAIL** phải sửa trước khi báo xong. Báo cáo dạng bảng `Mục | PASS/FAIL | Ghi chú`.

## 1. Tự động

```bash
pnpm lint
pnpm build
```

Grep tìm vi phạm phổ biến trong `app/` và `components/`:

| Tìm | Vi phạm |
|---|---|
| `#[0-9a-fA-F]{3,6}` trong `.tsx` | hardcode màu (trừ file confetti COLORS) |
| `shadow-(sm\|md\|lg\|xl\|2xl)\b` | shadow blur mềm |
| `from-purple\|to-indigo\|from-violet` | gradient AI generic |
| `Math.random` trong `components/wheel` hoặc `lib/random.ts` | RNG không an toàn khi chọn người trúng |
| `localStorage` ngoài `useEffect` / `lib/storage.ts` | nguy cơ lỗi SSR/hydration |
| `Geist\|Inter\|Arial` trong `layout.tsx` | font sai |

## 2. Visual (chạy `pnpm dev`, mở trình duyệt)

- [ ] Có viền ink + bóng đổ cứng trên card/nút chính
- [ ] Có ≥ 1 phần tử nghiêng và texture nền
- [ ] Màu đúng tỉ lệ ~60/25/15, không quá rối
- [ ] Đúng 1 CTA nổi bật nhất trên màn hình
- [ ] Chữ tiếng Việt hiển thị đúng font (không có ký tự có dấu bị rơi về font hệ thống)
- [ ] 1920×1080: tên trên vòng quay đọc được từ xa (≥ 22px), tên người trúng ≥ 96px
- [ ] 375×812: không tràn ngang, vòng quay vừa màn, nút ≥ 48px

## 3. Độ vui

- [ ] Idle có chuyển động nhẹ
- [ ] Hover/press nút có cảm giác vật lý
- [ ] Quay: lấy đà → tick → drumroll → reveal → celebration đủ chuỗi
- [ ] Câu chữ random, không lặp lại liên tiếp
- [ ] Mọi câu đùa qua được bài test "đọc to trước cả phòng"

## 4. Hiệu năng

- [ ] DevTools Performance: quay vòng không có long task > 50ms, không layout thrash
- [ ] Chỉ animate transform/opacity
- [ ] Confetti ≤ 250 hạt mỗi lần, dọn sạch sau khi xong
- [ ] Không có leak: quay 20 lần liên tiếp, memory không tăng đều

## 5. Accessibility và thao tác

- [ ] `Space`/`Enter` quay, `Esc` đóng modal, `F` fullscreen, `M` mute
- [ ] Spam `Space` khi đang quay không gây lỗi
- [ ] Focus ring hiện rõ khi Tab
- [ ] DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: vẫn dùng được, không rung, không flash
- [ ] Tương phản đúng bảng trong skill `manday-design-system`

## 6. Logic vòng quay

- [ ] Lát dưới kim khi dừng === người hiển thị trong modal (thử ≥ 10 lần, với 2, 7 và 30 người)
- [ ] Bật "loại người đã trúng" thì người đó biến khỏi vòng sau khi đóng modal
- [ ] Reload trang thì lịch sử và cấu hình vẫn còn
