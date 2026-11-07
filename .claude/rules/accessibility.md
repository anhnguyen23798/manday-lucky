---
paths:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
---

# Rule: Accessibility và thao tác sự kiện

## PHẢI

- Tương phản chữ ≥ 4.5:1 (chữ thường) và ≥ 3:1 (chữ ≥ 24px). Chữ trên nền vàng/mint/cream luôn dùng `--color-ink`.
- Nút QUAY:
  - Là `<button>` thật, có `aria-label`, bấm được bằng **Space** và **Enter** từ bất kỳ đâu trên trang (global hotkey, bỏ qua khi đang focus input).
  - Bị `disabled` khi đang quay hoặc khi danh sách rỗng, và vẫn hiển thị trạng thái rõ ràng (không chỉ đổi màu).
- Kết quả trúng giải được thông báo qua `aria-live="assertive"` (một vùng ẩn).
- Modal: dùng `<dialog>` native (focus trap), `Esc` để đóng, trả focus về nút QUAY sau khi đóng.
  - **Ngoại lệ có chủ đích**: modal kết quả quay (`ResultModal`, `SlotReveal`) KHÔNG đóng bằng Esc hay click nền. MC bắt buộc chọn "Trao giải" hoặc "Vắng mặt", để không thể lặng lẽ hủy một kết quả rồi quay lại.
- Focus ring rõ ràng: `outline: 4px solid var(--color-tie)` + `outline-offset: 4px`.
- Có nút bật/tắt âm thanh (mặc định BẬT, nhớ lựa chọn trong localStorage) và nút fullscreen (`F` hotkey).
- Màu không phải là cách duy nhất phân biệt lát vòng quay: mỗi lát có tên/emoji riêng.
- Touch target ≥ 48×48px trên mobile.

## Phím tắt chuẩn

| Phím | Hành động |
|---|---|
| `Space` / `Enter` | Quay (cả khi focus ở thẻ quà **đang chọn**; trên thẻ chưa chọn thì chỉ chọn quà; không chiếm phím khi focus ở control khác) |
| `Ctrl+Z` | Mở hộp xác nhận hoàn tác lượt vừa rồi |
| `Esc` | Đóng modal (trừ modal kết quả quay) |
| `F` | Bật/tắt fullscreen |
| `M` | Bật/tắt âm thanh |
