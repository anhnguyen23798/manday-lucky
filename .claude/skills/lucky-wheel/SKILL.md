---
name: lucky-wheel
description: Hướng dẫn xây component vòng quay may mắn (LuckyWheel) cho Manday: chọn kết quả công bằng bằng crypto RNG, giải có trọng số, tính góc quay, easing giảm tốc, kim chỉ ria mép nảy theo lát, tiếng tick, đèn LED viền, chế độ loại người đã trúng. Dùng khi code hoặc sửa bất cứ thứ gì liên quan tới vòng quay hay luồng quay thưởng.
---

# Lucky Wheel

## Nguyên tắc số 1: Kết quả quyết định trước, animation chạy sau

```
bấm QUAY → pickWinner() bằng crypto → tính targetRotation → animate tới đó → onSpinEnd(winner)
```

KHÔNG BAO GIỜ xác định người thắng bằng cách đọc góc dừng của animation (dễ lệch do làm tròn, frame drop, reduced-motion). Code mẫu: [references/wheel-math.md](references/wheel-math.md).

## Luồng quay (đã triển khai)

Vòng quay chứa **người** (anh em còn eligible = chưa trúng, không vắng mặt). MC chọn **một phần quà** ở `PrizeRail` rồi quay:

1. **Quay đơn**: `secureInt(n)` chọn người → animate tới lát đó → `ResultModal` có 2 nút:
   - **Trao giải**: `resolveDraw(prize, [id], [])`. Người đó rời vòng và vào Bảng vàng.
   - **Vắng mặt, quay lại**: `resolveDraw(prize, [], [id])`. Người đó vào tab Vắng mặt, lượt quà giữ nguyên.
2. **Quay hàng loạt** (quà còn > 1 phần): `pickMany(list, N)` → `SlotReveal` hiện N thẻ dừng lần lượt, mỗi thẻ đánh dấu vắng được → "Trao tất cả". Cả lô là **1 snapshot undo**.
3. Mọi kết quả đều undo được (`Ctrl+Z`). Reset cần giữ nút 2 giây và cũng undo được.

**Đóng băng danh sách khi quay**: `Stage` lưu `frozen` entries lúc bắt đầu quay, vì nếu tab admin sửa danh sách giữa chừng, index lát sẽ lệch.

## Cấu trúc component

```
components/wheel/LuckyWheel.tsx   # SVG: lát, nhãn (≤ 40 người), đèn viền, kim ria mép (ref để "flap")
components/stage/Stage.tsx         # state machine, hotkey, sfx, confetti
components/stage/ResultModal.tsx   # kết quả quay đơn
components/stage/SlotReveal.tsx    # kết quả quay hàng loạt
lib/random.ts                      # secureRandom, secureInt, pickMany
lib/wheel-math.ts                  # computeTargetRotation, segmentAtAngle, slicePath
lib/state.ts                       # resolveDraw, restoreAbsent, undo, resetResults
```

## State machine (Stage)

```ts
type Phase = "idle" | "charging" | "spinning" | "revealing" | "result";
```

| Phase | Chuyện gì xảy ra | Thời lượng |
|---|---|---|
| `idle` | Vòng lắc lư nhẹ (`animate-wiggle-slow`), nút QUAY thở | ∞ |
| `charging` | Vòng giật ngược 22° (lấy đà) + "vèo" | 350ms |
| `spinning` | Quay 6–9 vòng với `--ease-spin`, đèn chớp nhanh, tick + kim nảy theo lát, ticker tên dưới vòng, drumroll 1.3s cuối | 5–7s random |
| `revealing` | Lát thắng sáng, lát khác mờ (opacity .3), trống | 900ms |
| `result` | Modal fullscreen + confetti + rung màn hình; nút khóa 1.5s đầu | tới khi chọn Trao/Vắng |

Khóa mọi input (trừ mute/fullscreen) khi phase ≠ `idle`.

## Vẽ vòng quay (SVG)

- `viewBox="-100 -100 200 200"`, bán kính 92 cho lát, 100 cho viền.
- Mỗi lát là `<path>` cung tròn; màu theo chu kỳ trong design system, **viền lát ink 1.2 đơn vị**.
- Text: xoay theo tia giữa lát, đọc từ tâm ra ngoài, `font-rounded` đậm. Màu chữ theo bảng tương phản (trắng trên `tie`/`coffee`, ink trên còn lại).
- Số lát > 24: ẩn text, chỉ hiện màu + tooltip; > 60: cảnh báo admin nên dùng chế độ "Quay giải".
- Tâm vòng: hình tròn ink có sticker 🥸 hoặc logo công ty, viền beer.
- Viền ngoài: vòng `beer` dày + 16–24 bóng đèn (`WheelLights`) xen kẽ chớp `animate-blink-bulb` với `animation-delay` so le. Khi spinning thì tăng tốc chớp (đổi biến `--bulb-speed`).
- Toàn bộ vòng xoay bằng `style={{ transform: \`rotate(${rotation}deg)\` }}` trên `<g>`/`<div>` bọc ngoài.

## Kim chỉ (Pointer)

- Đặt ở **đỉnh** (12 giờ), hình ria mép 🥸 cách điệu hoặc tam giác `bbq` viền ink.
- Mỗi lần ranh giới lát đi qua kim, kim gập (`rotate(-18deg)`) rồi bật lại bằng spring, đồng thời phát tick. Tính ranh giới bằng cách theo dõi góc hiện tại trong `onUpdate` của motion hoặc rAF, xem `segmentAtAngle()`.
- Throttle tick ≥ 30ms để không "rè" khi quay nhanh.

## Kiểm thử bắt buộc

- Chạy 10.000 lần `pickWeighted` trong unit test hoặc script và kiểm tra phân phối lệch < 2% so với trọng số.
- Với mỗi kết quả, `segmentAtAngle(finalRotation) === winnerIndex` (test với n = 2, 3, 7, 50).
- Bấm `Space` liên tục khi đang quay không gây quay chồng.
- Reload trang giữa chừng không mất lịch sử (localStorage).
