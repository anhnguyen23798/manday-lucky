---
name: manday-copywriter
description: Viết câu chữ tiếng Việt hài hước, trẻ trung cho app vòng quay Manday 11/11: nhãn nút, tiêu đề, thông báo trúng/trượt, loading, empty state, tên giải vui, câu chạy marquee. Dùng khi cần bất kỳ text hiển thị nào, hoặc khi cập nhật lib/copy.ts.
---

# Manday Copywriter

## Giọng văn

**Như chị em đồng nghiệp trêu yêu anh em trong group chat công ty**: lầy, nhanh, có chút "tấu hài", nhưng luôn ấm áp và kết lại bằng sự trân trọng.

- Ngắn, có nhịp, dễ đọc to (MC sẽ đọc lên!)
- Chơi chữ, meme Việt quen thuộc, thả emoji vừa phải (≤ 1 emoji/câu)
- Tuân thủ bảng "Ranh giới hài hước" trong `.claude/rules/copywriting-vi.md`

## Quy trình

1. Mở [references/copy-bank.md](references/copy-bank.md) và lấy câu phù hợp.
2. Nếu cần câu mới, viết **3 biến thể** rồi chọn, giữ đúng giọng và độ dài.
3. Đặt vào `lib/copy.ts` theo cấu trúc:

```ts
export const copy = {
  spinButton: { idle: "QUAY LUÔN ANH EM ƠI!", spinning: "ĐANG QUAY…", empty: "HẾT NGƯỜI RỒI 😴" },
  winTitles: ["CHÚC MỪNG ANH!", "TRÚNG RỒI!!!", "NÓC NHÀ ĐÃ DUYỆT ✅"],
  // ...
} as const;

export const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
// (Random câu chữ thì Math.random là đủ; chỉ RNG chọn người trúng mới bắt buộc dùng crypto)
```

4. Đọc to câu đó lên. Nếu ngượng hoặc có thể làm ai tổn thương thì viết lại.

## Công thức câu đùa hay dùng

| Công thức | Ví dụ |
|---|---|
| Kỳ vọng → hạ cánh | "Phần thưởng xứng đáng cho người đàn ông… biết tự giặt tất." |
| Meme quen thuộc biến tấu | "Đàn ông không khóc, chỉ là trúng giải nên bụi bay vào mắt." |
| Phóng đại công sở | "Giải này giá trị hơn cả KPI quý 4 của anh." |
| Tự giễu nhẹ | "Vòng quay cũng run tay khi gặp anh." |
| Ấm áp kết | "Vui là chính, quà là mười. Cảm ơn anh em đã luôn gánh team 💙" |
