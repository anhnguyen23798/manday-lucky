---
paths:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
  - "lib/copy.ts"
---

# Rule: Câu chữ tiếng Việt và giọng hài hước

Kho câu mẫu nằm trong skill `manday-copywriter`.

## PHẢI

- 100% text hiển thị là **tiếng Việt có dấu**, chuẩn chính tả. Thuật ngữ quen thuộc giữ nguyên (Manday, spin, OK).
- Chuỗi hiển thị ở **sân khấu và màn chờ** (câu đùa, nút, thông báo) đặt trong `lib/copy.ts`, không viết cứng trong JSX, để dễ chỉnh và random câu. Nhãn chức năng của trang `/admin` (tên cột, label form) được viết trực tiếp trong component.
- Câu nào có biến thể thì dùng **mảng nhiều câu** rồi random (mỗi lần quay một câu khác cho đỡ nhàm).
- Xưng hô: gọi người chơi là **"anh em"** hoặc **"anh"**. Giọng như chị em đồng nghiệp trêu yêu.
- Câu ngắn, dễ đọc trên màn chiếu: nút ≤ 5 từ, tiêu đề ≤ 8 từ.
- Viết hoa toàn bộ (UPPERCASE) chỉ cho nút chính và tiêu đề display.

## Ranh giới hài hước

| ✅ Được trêu | ❌ Cấm |
|---|---|
| Nghiện game, bóng đá, cà phê, ngủ nướng | Ngoại hình: béo, hói, lùn, xấu |
| "Nóc nhà" quản lương (trêu nhẹ, ấm áp) | Hạ thấp phụ nữ, "đàn bà thì...", chiến tranh giới tính |
| Sửa gì cũng hỏng, lạc đường không hỏi | Thu nhập thấp, nghèo, thất nghiệp |
| "Đàn ông không khóc, chỉ là bụi vào mắt" | Xu hướng tính dục, LGBT+ |
| Deadline, họp, KPI | Chính trị, tôn giáo, vùng miền |
| Tất thủng, quần áo vứt bừa | Rượu bia quá đà, nhậu say, 18+ |
| | Gọi tên người cụ thể để chê |

Kiểm tra cuối: nếu câu đùa được đọc to trước cả phòng có sếp và đồng nghiệp nữ mà có người thấy bị tổn thương, **bỏ câu đó**.
