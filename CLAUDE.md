@AGENTS.md

# Manday Lucky 🎡 — Vòng quay may mắn Manday (11/11)

Web app vòng quay trúng thưởng cho sự kiện **Manday** ở công ty, tổ chức ngày **11/11** (Quốc tế Nam giới chính thức là 19/11, công ty chọn 11/11).
Ưu tiên số 1 là **UI**: hài hước, trẻ trung, hiện đại và có nhiều hiệu ứng vui.

> Trước khi viết hoặc sửa bất kỳ UI nào, ĐỌC các file sau theo thứ tự:
> 1. `docs/manday-context.md`: ngữ cảnh Manday 11/11, khán giả, giọng hài hước được phép và bị cấm
> 2. `.claude/rules/*.md`: luật bắt buộc (design, animation, copy, a11y, Next.js)
> 3. Skill tương ứng trong `.claude/skills/` (xem bảng dưới)

## Tech stack (đã cài)

- **Next.js 16.4** (App Router, `cacheComponents: true`, Turbopack): KHÔNG dùng kiến thức Next cũ, đọc `node_modules/next/dist/docs/` trước khi code
- **React 19.3**, **TypeScript 5** strict
- **Tailwind CSS v4**, nạp qua loader `@tailwindcss/turbopack` trong `next.config.ts` (không có `postcss.config`). Token khai báo bằng `@theme` trong `app/globals.css`, KHÔNG có `tailwind.config.js`
- Package manager: **pnpm**

## Thư viện đã cài

| Mục đích | Package | Ghi chú |
|---|---|---|
| Animation | `motion` 14 | import từ `motion/react` |
| Confetti | `canvas-confetti` | import động trong `components/effects/celebrate.ts` |
| State + lưu trữ | `zustand` 5 + `idb-keyval` | persist vào IndexedDB, Blob ảnh/nhạc lưu riêng |
| Excel | `xlsx` (SheetJS 0.20.3, cài từ `cdn.sheetjs.com`, không phải npm) | chỉ import động trong `/admin` |
| Âm thanh | Web Audio tự viết (`lib/sfx.ts`) | không cần file mp3 |
| Test | `vitest` | test logic thuần trong `lib/__tests__/` |

Không thêm UI kit nặng (MUI, Antd, Chakra). Tự build component theo design system.

## Lệnh

```bash
pnpm dev      # chạy dev server
pnpm test     # unit test (vitest)
pnpm lint     # eslint
pnpm build    # build production (chạy trước khi báo "xong")
```

## Routes

| Route | Vai trò |
|---|---|
| `/` | Màn chờ: đếm ngược tới giờ G, tên anh em bay, marquee, nút vào quay |
| `/spin` | Sân khấu: chọn quà → quay (đơn hoặc hàng loạt) → Trao giải / Vắng mặt, Bảng vàng, Undo, Reset |
| `/admin` | Nhân viên (import Excel 2 cột "Họ và tên", "Account"), Phần quà, Cài đặt, Dữ liệu & Nhật ký |

Mở `/admin` và `/spin` ở 2 cửa sổ: dữ liệu tự đồng bộ qua `BroadcastChannel`.

## Cấu trúc thư mục

```
app/                     # page.tsx mỏng (Server Component) → render client component
components/
  ui/                    # Button, Card, Modal(<dialog>), Sticker, Badge, Field, HoldToConfirm
  wheel/LuckyWheel.tsx   # SVG vòng quay + đèn + kim ria mép
  stage/                 # Stage (state machine), PrizeRail, ResultModal, SlotReveal, WinnersPanel
  admin/                 # AdminApp + các tab, ImportDialog
  lobby/Lobby.tsx
  effects/               # celebrate (confetti), Marquee, FloatingStickers, Countdown
lib/
  types.ts               # Data model
  state.ts               # LOGIC NGHIỆP VỤ THUẦN (trao giải, vắng mặt, undo, reset, import), có test
  store.ts               # zustand store bọc state.ts + persist IndexedDB
  storage.ts             # idb-keyval + BroadcastChannel
  random.ts, wheel-math.ts, employees.ts, excel.ts, image.ts, backup.ts, sfx.ts, copy.ts, hooks.ts
```

**Danh sách nhân viên mặc định**: `public/vio-man.csv` (cột `STT, Họ và tên, Account`, UTF-8).
- Tự nạp ở lần đầu mở app, khi chưa từng nạp và danh sách đang trống (`StoreProvider` → `seedDefaults`). Cờ `defaultsLoaded` được lưu lại, nên xóa từng người không làm danh sách tự quay lại, còn "Xóa toàn bộ dữ liệu" thì có nạp lại.
- Admin → "Nạp danh sách mặc định" mở bảng xem trước (mặc định ở chế độ Thay thế). Import file mới mặc định ở chế độ Thêm vào.
- CSV mặc định được đọc bằng `lib/csv.ts` (không dùng SheetJS) để sân khấu và màn chờ không phải tải SheetJS.

**Quy tắc nghiệp vụ quan trọng**
- Khóa duy nhất của nhân viên là **Account** (không phân biệt hoa thường). Trùng tên thì được phép, và tên hiển thị kèm `(account)` chỉ cho những tên bị trùng (`buildDisplayNames`).
- Mọi thay đổi kết quả (trao, vắng, báo vắng sau khi trao, khôi phục, reset) đều đi qua `lib/state.ts` và đẩy snapshot undo. Không sửa `wins`/`absentIds` trực tiếp.
- Hoàn tác luôn qua hộp xác nhận, liệt kê thay đổi bằng `describeUndo`. Bảng vàng có icon ✕ "Báo vắng" cho từng người đã trúng (`markWinnerAbsent`), bình thường ẩn và chỉ hiện khi rê chuột vào dòng hoặc khi focus bằng bàn phím, dùng để trả lại quà và chuyển người đó sang tab Vắng mặt.
- Không `setState` lên store persist cho dữ liệu tạm thời: mỗi lần set sẽ ghi IndexedDB và broadcast sang tab khác (xem `useReady`).

## Skills: dùng skill nào khi nào

| Skill | Khi nào dùng |
|---|---|
| `manday-design-system` | Tạo/sửa BẤT KỲ component, màu, font, layout nào |
| `lucky-wheel` | Code vòng quay: chọn giải, góc quay, easing, kim chỉ, tiếng tick |
| `fun-effects` | Confetti, rung màn hình, sticker bay, hover/press, celebration |
| `manday-copywriter` | Viết câu chữ: nút, thông báo trúng/trượt, loading, tên giải |
| `ui-review` | Tự review UI vừa làm trước khi báo hoàn thành |

## Nguyên tắc vàng (tóm tắt, chi tiết ở rules)

1. **Concept "Sticker Pop × Neo-brutalism"**: viền đen dày, bóng đổ lệch cứng, màu nổ, sticker emoji nghiêng. KHÔNG làm kiểu corporate xám xanh nhạt nhẽo, KHÔNG gradient tím-xanh AI generic.
2. **Màn hình chính chạy trên máy chiếu/TV 1920×1080** trong phòng sự kiện, nên chữ phải to và đọc được từ xa 5m. Vẫn phải responsive tới 375px.
3. **Hài nhưng tử tế**: trêu nhẹ "anh em", không body-shaming, không hạ thấp phụ nữ, không chính trị/tôn giáo.
4. **Hiệu ứng nhiều nhưng mượt**: chỉ animate `transform`/`opacity`, giữ 60fps, tôn trọng `prefers-reduced-motion`.
5. **Vòng quay phải công bằng**: chọn kết quả bằng `crypto.getRandomValues` TRƯỚC, rồi tính góc để quay tới đó. Animation không quyết định kết quả.
6. Toàn bộ text hiển thị là **tiếng Việt có dấu**. Font bắt buộc có subset `vietnamese`.

## Definition of Done cho mỗi task UI

- [ ] `pnpm test`, `pnpm build` và `pnpm lint` pass
- [ ] Đã chạy checklist trong skill `ui-review`
- [ ] Đã test ở 1920×1080 và 375×812
- [ ] Đã test với `prefers-reduced-motion: reduce`
- [ ] Không có chữ tiếng Việt bị lỗi dấu hoặc fallback font
