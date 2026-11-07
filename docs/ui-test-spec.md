# Vio Manday Lucky: Mô tả chức năng & kịch bản test UI

> **Dành cho AI tester điều khiển trình duyệt.** Đọc hết mục 0–2 trước khi test. Mỗi kịch bản có ID (ví dụ `SPIN-03`), hãy báo cáo kết quả theo ID (xem mục 9).
> Chữ trong dấu `"..."` là **chữ hiển thị chính xác** trên UI (dùng để tìm phần tử). Font tiêu đề (Bungee) hiển thị IN HOA, nhưng tên phần tử (accessible name) giữ nguyên hoa/thường như trong file này.

---

## 0. Môi trường

| Mục | Giá trị |
|---|---|
| URL gốc | `http://localhost:3000` (chạy bằng `pnpm dev`) |
| Trang | `/` Màn chờ · `/spin` Sân khấu quay · `/admin` Quản trị |
| Kích thước chính | **1920×1080** (máy chiếu), phụ: 1366×768, 1024×768, mobile **375×812** |
| Trình duyệt | Chrome/Edge bản mới |
| Lưu trữ | IndexedDB của trình duyệt (DB `keyval-store`, store `keyval`, key `manday-lucky`). **Không có server/database.** |

**Bắt đầu sạch:** dùng cửa sổ ẩn danh/profile mới, hoặc vào `/admin` → tab "Dữ liệu & Nhật ký" → "Xóa toàn bộ dữ liệu" (giữ nút 2 giây) rồi **reload**.

## 1. Tổng quan sản phẩm

Web app vòng quay trúng thưởng cho sự kiện **Vio Manday 11/11** (ngày của anh em ở công ty). Chạy trên laptop nối máy chiếu: MC mở `/spin` trên màn chiếu, admin có thể mở `/admin` ở cửa sổ khác. Hai tab tự đồng bộ dữ liệu.

Luồng chính: **Admin chuẩn bị danh sách anh em + phần quà → MC chọn từng phần quà → quay → Trao giải hoặc báo Vắng mặt → người trúng hiện ở Bảng vàng.**

Phong cách UI: "Sticker Pop × Neo-brutalism": viền đen dày, bóng đổ cứng lệch, màu nổ (xanh, vàng, cam, mint, hồng), phần tử hơi nghiêng, emoji như sticker, nhiều hiệu ứng (confetti, rung màn hình, đèn chớp). Toàn bộ chữ tiếng Việt có dấu.

## 2. Hành vi CÓ CHỦ ĐÍCH (không báo là lỗi)

1. Lần đầu mở app (dữ liệu trống) sẽ **tự nạp 50 người** từ `public/vio-man.csv`. Sau đó dù xóa hết người, app **không** tự nạp lại. Chỉ "Xóa toàn bộ dữ liệu" rồi reload thì mới nạp lại.
2. **Modal kết quả quay không đóng bằng Esc hay click nền.** MC bắt buộc chọn "Trao giải" hoặc "Vắng mặt".
3. Nút trong modal kết quả **bị khóa ~1,5 giây đầu** để khoảnh khắc ăn mừng đủ dài.
4. Khi đã có người trúng: **không thể "Thay thế toàn bộ"** danh sách khi import, không xóa được người đã trúng, không xóa được quà đã trao, không giảm số lượng quà dưới số đã trao.
5. Trùng **tên** được phép, trùng **account** thì không (không phân biệt hoa thường). Chỉ những tên bị trùng mới hiển thị kèm account: `Nguyễn Văn Nam (NamNV1)`.
6. Danh sách > 40 người: lát vòng quay **không có chữ**, tên người đang lướt qua kim hiện ở dòng chữ chạy bên dưới vòng quay khi quay.
7. Phím Space/Enter **không quay** khi đang focus ở nút/tab khác (trừ nút QUAY và thẻ quà **đang được chọn**), khi đang có hộp thoại mở, hoặc khi đang quay. Trên thẻ quà **chưa chọn**, Space/Enter chỉ chọn quà đó.
8. Âm thanh chỉ phát sau lần tương tác đầu tiên (chính sách autoplay của trình duyệt).
9. Kết quả người trúng được **chọn ngẫu nhiên bằng crypto trước**, animation chỉ để trình diễn. Không thể dự đoán người trúng.
10. Dữ liệu chỉ nằm trong trình duyệt đang dùng: profile khác hoặc máy khác sẽ không thấy.
11. Con trỏ chuột custom không hiện trong ảnh chụp của trình duyệt headless. Chỉ kiểm tra được bằng `getComputedStyle(el).cursor`.

---

## 3. Thành phần chung (mọi trang)

**Header:**
- Logo sticker 🥸 + tên sự kiện (mặc định "Vio Manday 11.11").
- Menu "Màn chờ" · "Sân khấu" · "Admin" (trang hiện tại có nền đen).
- Nút âm thanh 🔊/🔇 (phím `M`) và nút toàn màn hình ⛶ (phím `F`).
- Riêng trang `/spin` có thêm "⟲ Hoàn tác" và "💥 Reset".

**Chân trang (`/` và `/spin`):** dải chữ chạy sọc vàng-đen với câu đùa, cùng dòng "Happy Vio Manday 11/11: cảm ơn anh em đã luôn là chỗ dựa…".

**Con trỏ chuột:**

| Vị trí | `cursor` mong đợi |
|---|---|
| Vùng thường | SVG mũi tên **trắng**, viền đen (chuỗi chứa `ffffff`, không chứa `ffc929`) |
| Nút, link, tab, nhãn chọn file, checkbox, radio | SVG mũi tên **vàng** + ria mép (chuỗi chứa `ffc929`) |
| Ô nhập chữ | `text` |
| Nút bị khóa | `not-allowed` |

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| COM-01 | Bấm các mục menu | Chuyển trang đúng, mục đang ở có nền đen |
| COM-02 | Bấm 🔊 | Đổi thành 🔇; reload vẫn giữ trạng thái; phím `M` cũng bật/tắt |
| COM-03 | Bấm logo 5 lần | Sticker 🥸 đổi thành 😎 |
| COM-04 | Kiểm tra `cursor` theo bảng trên | Đúng như bảng |
| COM-05 | Tên tab trình duyệt | `/`: "Vio Manday Lucky: Vòng quay Anh Em 11/11"; `/spin`: "Sân khấu: Vio Manday Lucky"; `/admin`: "Admin: Vio Manday Lucky" |

---

## 4. Trang Admin `/admin`

Tiêu đề "Hậu trường". Có 4 tab: "Anh em" (badge số người), "Phần quà" (badge số loại quà), "Cài đặt", "Dữ liệu & Nhật ký".

### 4.1 Tab "Anh em"

Bố cục desktop: cột trái gồm 3 thẻ ("Danh sách mặc định", "Import file mới", "Thêm bằng tay"), cột phải là thẻ "Danh sách". **Thẻ Danh sách cao bằng cột trái, bảng cuộn bên trong** (không có khoảng trắng lớn dưới bảng).

**Danh sách mặc định:** nút "↻ Nạp danh sách mặc định" mở hộp xem trước với nguồn `vio-man.csv`, mặc định chọn sẵn "Thay thế toàn bộ".

**Import file mới:**
- Ô kéo thả "Kéo thả hoặc bấm để chọn file" nhận `.xlsx`, `.xls`, `.csv`. Nút "⬇ Tải file mẫu" tải `manday-danh-sach-mau.xlsx` chỉ có dòng tiêu đề.
- File cần 2 cột "Họ và tên" + "Account". Tên cột không phân biệt hoa thường và dấu: `ho va ten`, `Họ tên`, `ACCOUNT`, `Tài khoản` đều được. Các cột khác (STT…) bị bỏ qua. App tìm dòng tiêu đề trong 10 dòng đầu.
- Mặc định chọn sẵn "Thêm vào danh sách hiện có".

**Hộp "Xem trước":**
- Badge "N hợp lệ" và "N bỏ qua".
- 2 lựa chọn: "Thêm vào danh sách hiện có" / "Thay thế toàn bộ (N người hiện tại)".
- Bảng gồm Dòng / Họ và tên / Account / Trạng thái. Các trạng thái có thể gặp:
  - "✅ Hợp lệ"
  - "❌ Thiếu tên"
  - "❌ Thiếu account"
  - "⚠️ Account đã có"
  - "⚠️ Trùng trong file"
- Nút "Hủy" và "Import N người" (khóa khi N = 0). Thành công thì hiện "Đã thêm N anh em!" và nút "Ngon lành".

**Thêm bằng tay:** ô "Họ và tên", ô "Account" và nút "+ Thêm anh em". Các lỗi có thể gặp: "Thiếu họ và tên", "Thiếu account", "Account đã tồn tại".

**Danh sách:**
- Badge "N người" và ô tìm kiếm (gõ không dấu được, tìm theo tên hoặc account).
- Bảng gồm # / Họ và tên (hiển thị) / Account / Trạng thái / thao tác.
- Trạng thái là một trong: "Trong vòng", "Vắng", "🏆 Đã trúng".
- "Sửa" cho sửa ngay trong dòng (nút "Lưu" / "Hủy"). "Xóa" bị khóa với người đã trúng.

**Dữ liệu test bổ sung**: tạo file `test-dup.csv` (UTF-8):
```csv
STT,Họ và tên,Account
1,Nguyễn Văn Nam,NamNV100
2,Nguyễn Văn Nam,NamNV200
3,Trùng Account,namnv100
4,Thiếu Account,
5,,KhongTen1
6,Trần Minh Đức,CuongNV2
```
(`CuongNV2` đã có trong danh sách mặc định.)

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| ADM-EMP-01 | Profile sạch, mở `/admin` | Tab "Anh em" có badge **50**, danh sách "50 người", nhật ký có dòng "Nạp danh sách mặc định vio-man.csv: 50 anh em" |
| ADM-EMP-02 | Import `test-dup.csv` (chế độ Thêm vào) | Preview: **2 hợp lệ** (2 dòng Nguyễn Văn Nam), **4 bỏ qua**: dòng 4 "⚠️ Trùng trong file", dòng 5 "❌ Thiếu account", dòng 6 "❌ Thiếu tên", dòng 7 "⚠️ Account đã có" |
| ADM-EMP-03 | Bấm "Import 2 người" → "Ngon lành" | 52 người; bảng hiện "Nguyễn Văn Nam (NamNV100)" và "Nguyễn Văn Nam (NamNV200)" |
| ADM-EMP-04 | Thêm tay "Test A" / account "namnv100" | Lỗi "Account đã tồn tại" (không phân biệt hoa thường) |
| ADM-EMP-05 | Thêm tay "  Test   B  " / "TestB" | Thêm được; tên được gọn khoảng trắng thành "Test B" |
| ADM-EMP-06 | Tìm "nguyen viet" (không dấu) | Lọc ra "Nguyễn Việt Cường" |
| ADM-EMP-07 | Sửa một người, đổi account trùng người khác → "Lưu" | Báo "Account đã tồn tại", không lưu |
| ADM-EMP-08 | Xóa 1 người → reload | Còn 1 người ít hơn; **không** tự nạp lại mặc định |
| ADM-EMP-09 | "↻ Nạp danh sách mặc định" → chọn "Thêm vào" | Phần lớn "⚠️ Account đã có"; đổi sang "Thay thế toàn bộ" thì "50 hợp lệ" |
| ADM-EMP-10 | Import file không có cột đúng (ví dụ chỉ có cột "Tên") | Báo lỗi 'Không tìm thấy 2 cột "Họ và tên" và "Account" trong file' |
| ADM-EMP-11 | Khi đã có người trúng: mở hộp import | "Thay thế toàn bộ" bị khóa, có dòng giải thích cần Reset kết quả trước |
| ADM-EMP-12 | Đo bố cục ở 1366×768 | Thẻ "Danh sách" cao bằng cột trái; bảng cuộn bên trong |

### 4.2 Tab "Phần quà"

**Form thêm quà:** ô "Tên quà", ô "Số lượng" (≥ 1), "Ảnh (tùy chọn)" với "Chọn ảnh" / "Đổi ảnh" / "Bỏ ảnh", và nút "+ Thêm quà". Ảnh được nén tối đa 800px.

**Kho quà:**
- Badge "N loại" và "N phần".
- Mỗi thẻ quà gồm: ảnh (bấm vào để đổi), tên, "xN", "Đã trao a/b", cùng các nút "Sửa", "↑", "↓", "Bỏ ảnh" (nếu có ảnh) và "Xóa".
- Thứ tự quà trong kho chính là thứ tự hiện trên Sân khấu.

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| ADM-PRZ-01 | Thêm "Tai nghe Bluetooth" x1 kèm ảnh | Thẻ quà có ảnh, "x1", "Đã trao 0/1" |
| ADM-PRZ-02 | Thêm "Bình nước giữ nhiệt" x5, "Phiếu miễn rửa bát" x3 (không ảnh) | Badge "3 loại", "9 phần"; thẻ không ảnh hiện 🎁 |
| ADM-PRZ-03 | Thêm quà tên trống hoặc số lượng 0 | Lỗi "Thiếu tên quà" / "Số lượng phải ≥ 1" |
| ADM-PRZ-04 | Bấm ↑ / ↓ | Đổi thứ tự; nút ↑ khóa ở thẻ đầu, ↓ khóa ở thẻ cuối |
| ADM-PRZ-05 | Quà đã trao 2: Sửa số lượng thành 1 | Lỗi "Số lượng phải ≥ 2 (đã trao 2)" |
| ADM-PRZ-06 | Quà đã trao | Nút "Xóa" bị khóa |

### 4.3 Tab "Cài đặt"

- "Tên sự kiện (hiện trên header và màn chờ)": tối đa 40 ký tự, lưu khi rời ô; để trống thì quay về "Vio Manday 11.11".
- "Giờ bắt đầu (đếm ngược ở màn chờ)" (chọn ngày giờ) và nút "Bỏ đếm ngược".
- Checkbox "Hiệu ứng âm thanh khi quay (tick, trống, kèn)".
- "Nhạc nền màn chờ (tùy chọn, mp3)": tối đa 15MB, có trình phát nghe thử, nút "Đổi nhạc" / "Bỏ nhạc".

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| ADM-SET-01 | Đổi tên sự kiện thành "Tiệc Anh Em Vio", click ra ngoài | Header + màn chờ đổi theo (cả tab khác đang mở) |
| ADM-SET-02 | Xóa trống tên sự kiện, click ra ngoài | Về "Vio Manday 11.11" |
| ADM-SET-03 | Đặt giờ bắt đầu = 2 phút sau | Màn chờ hiện đồng hồ đếm ngược (xem LOB-03) |
| ADM-SET-04 | Upload file nhạc > 15MB | Lỗi "File nhạc tối đa 15MB" |

### 4.4 Tab "Dữ liệu & Nhật ký"

- **Sao lưu:**
  - "⬇ Xuất JSON" tải file `manday-backup-YYYYMMDD-HHMM.json` (gồm cả ảnh và nhạc) và hiện "Đã xuất file sao lưu ✅".
  - "⬆ Nhập JSON" mở hộp "Ghi đè dữ liệu?" có badge số anh em, loại quà, lượt trúng, rồi phải giữ nút "GIỮ 2 GIÂY ĐỂ GHI ĐÈ".
- **Vùng nguy hiểm:**
  - "Reset kết quả quay" (khóa khi chưa ai trúng) xóa kết quả, giữ người và quà.
  - "Xóa toàn bộ dữ liệu" xóa sạch.
  - Cả hai đều phải giữ nút "GIỮ 2 GIÂY ĐỂ RESET".
- **Nhật ký:**
  - Bộ lọc: "Tất cả", "🏆 Trúng", "🙈 Vắng", "↩ Khôi phục", "⟲ Hoàn tác", "💥 Reset", "📄 Import".
  - Mỗi dòng có giờ:phút:giây, dòng mới nhất ở trên. Danh sách cuộn bên trong thẻ.

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| ADM-DAT-01 | Xuất JSON → Xóa toàn bộ dữ liệu → Nhập lại file JSON đó (giữ 2s) | Dữ liệu (người, quà, ảnh, người trúng, vắng mặt) khôi phục đúng như trước |
| ADM-DAT-02 | Nhập file JSON bất kỳ không phải bản sao lưu | Lỗi "File không phải bản sao lưu của Manday Lucky" |
| ADM-DAT-03 | Nhập file không phải JSON (ví dụ .csv đổi đuôi .json) | Lỗi "File không phải JSON hợp lệ" |
| ADM-DAT-04 | Giữ nút reset < 2 giây rồi thả | Thanh tiến trình chạy rồi lùi về 0, **không** reset |
| ADM-DAT-05 | "Xóa toàn bộ dữ liệu" (giữ đủ 2s) → reload | Về trạng thái ban đầu, tự nạp lại **50 người** mặc định, không có quà |
| ADM-DAT-06 | Sau vài lượt quay, chọn bộ lọc "🏆 Trúng" | Chỉ hiện các dòng trúng giải |

---

## 5. Trang Sân khấu `/spin`

Bố cục desktop (≥1280px) gồm 3 cột:
- **Trái**: "Chọn quà" (danh sách thẻ quà).
- **Giữa**: vòng quay và nút QUAY.
- **Phải**: bảng "🏆 Bảng vàng" / "🙈 Vắng mặt".

Mobile xếp dọc theo thứ tự vòng quay → quà (cuộn ngang) → Bảng vàng.

### 5.1 Chọn quà & trạng thái nút QUAY
- Thẻ quà gồm ảnh, tên và "còn r/q". Thẻ đang chọn có nền vàng và hơi nghiêng. Quà hết có dấu "HẾT" và không bấm được.
- Phía trên vòng quay hiện "Đang quay: <tên quà>" và badge "N anh em trong vòng" (số người chưa trúng và không vắng).
- Nhãn nút QUAY theo trạng thái:

| Trạng thái | Nhãn |
|---|---|
| Chưa chọn quà | "CHỌN QUÀ TRƯỚC ĐÃ 👈" (khóa) |
| Quà đã hết | "QUÀ NÀY HẾT RỒI" (khóa) |
| Không còn ai trong vòng | "HẾT NGƯỜI RỒI 😴" (khóa) |
| Đang quay | "ĐANG QUAY…" (khóa) |
| Sẵn sàng | Ngẫu nhiên: "QUAY LUÔN ANH EM ƠI!" / "XOAY ĐI CHỜ CHI!" / "THỬ NHÂN PHẨM NÀO!" |
| Chế độ quay nhiều | "QUAY N NGƯỜI!" |

### 5.2 Quay đơn
Bấm QUAY hoặc Space diễn ra theo thứ tự:
1. Vòng giật ngược lấy đà.
2. Quay 5–7 giây, đèn viền chớp nhanh, kim ria mép nảy theo từng lát, có tiếng tick, dòng chữ dưới vòng chạy tên.
3. Trống dồn ở giây cuối.
4. Dừng: lát trúng sáng lên, các lát khác mờ đi.
5. **Modal kết quả toàn màn hình**: tiêu đề vui (ngẫu nhiên), **tên người trúng chữ rất to**, "@account", thẻ quà, câu chúc, confetti, rung màn hình.
6. Hai nút: "TRAO GIẢI! 🎁" và "VẮNG MẶT, QUAY LẠI".

### 5.3 Quay hàng loạt
Hiện khi quà còn > 1 phần và có > 1 người trong vòng: nút "Quay 1" / "Quay nhiều", kèm nút −/+ để chọn N (từ 2 đến min(số quà còn lại, số người)).

Khi bấm quay:
1. Vòng xoay nhanh ~1,3 giây.
2. Modal "ĐANG QUAY…" hiện tiêu đề "🎁 <tên quà> × N" và N thẻ chạy tên như máy đánh bạc, dừng lần lượt từng thẻ, cuối cùng có kèn và confetti.
3. Mỗi thẻ có nút "🙈 Vắng mặt" (bấm lại thành "↩ Có mặt").
4. Nút dưới cùng là "TRAO TẤT CẢ! (k)", hoặc "XÁC NHẬN VẮNG" nếu tất cả đều vắng.

### 5.4 Bảng vàng / Vắng mặt
- **Tab "🏆 Bảng vàng":**
  - Người trúng được nhóm theo quà (nhóm vừa có người trúng nằm trên cùng), mỗi nhóm có badge "a/q".
  - Người vừa trúng có ✨ và nền mint.
  - Rê chuột vào một dòng thì hiện icon **✕** mờ ở cuối dòng (tên phần tử: "Báo vắng <tên> (trả lại quà)"). Bình thường icon ẩn hẳn.
- **Tab "🙈 Vắng mặt":** danh sách người vắng, mỗi người có nút "Có mặt rồi" để đưa trở lại vòng.

### 5.5 Hoàn tác / Reset / Phím tắt
- **"⟲ Hoàn tác" hoặc Ctrl+Z**:
  - Mở hộp "Hoàn tác thật không anh?" ghi "Hành động gần nhất: …" kèm danh sách thay đổi, ví dụ `Hủy trao "Bình nước giữ nhiệt": A, B`, `Bỏ đánh dấu vắng: C`, `Trao lại "…": D`.
  - **Focus mặc định ở nút "Thôi, giữ nguyên"**; nút xác nhận là "⟲ HOÀN TÁC".
  - Hoàn tác được tối đa 20 bước.
- **"💥 Reset"** (khóa khi chưa ai trúng): hộp "Chắc chưa anh?" với nút giữ 2 giây.
- **Phím tắt:** Space/Enter = quay, Ctrl+Z = hoàn tác (có xác nhận), F = toàn màn hình, M = âm thanh.
- **Easter egg:** gõ chữ `manday` trên bàn phím thì mưa ria mép 🥸.

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| SPIN-01 | Profile sạch + đã thêm quà (ADM-PRZ-01/02), mở `/spin` | "50 anh em trong vòng"; nút QUAY "CHỌN QUÀ TRƯỚC ĐÃ 👈" (khóa); Bảng vàng "Chưa ai trúng. Vị trí số 1 đang chờ anh đấy!" |
| SPIN-02 | Bấm thẻ "Tai nghe Bluetooth" rồi nhấn **Space ngay** | Vòng bắt đầu quay (không cần click nút QUAY) |
| SPIN-03 | Chờ dừng | Lát được làm sáng nằm **đúng dưới kim** ở đỉnh vòng; tên trong modal khớp tên lát đó (nếu ≤ 40 người) hoặc dòng chữ dưới vòng |
| SPIN-04 | Ngay khi modal hiện, bấm nút | Nút bị khóa ~1,5 giây; sau đó bấm được |
| SPIN-05 | Nhấn Esc / click nền modal kết quả | Modal **không** đóng (đúng thiết kế) |
| SPIN-06 | Bấm "TRAO GIẢI! 🎁" | Người đó vào Bảng vàng (✨); "49 anh em trong vòng"; thẻ quà "còn 0/1" + dấu "HẾT"; nút QUAY "QUÀ NÀY HẾT RỒI" |
| SPIN-07 | Chọn "Phiếu miễn rửa bát", quay, bấm "VẮNG MẶT, QUAY LẠI" | Quà vẫn "còn 3/3"; "48 anh em trong vòng"; tab "Vắng mặt" có người đó |
| SPIN-08 | Tab "Vắng mặt" → "Có mặt rồi" | Người đó quay lại vòng (49) |
| SPIN-09 | Chọn "Bình nước giữ nhiệt" (x5) → "Quay nhiều" | Nút đổi thành "QUAY 5 NGƯỜI!"; nút −/+ hoạt động trong khoảng 2–5 |
| SPIN-10 | Quay 5 người | 5 thẻ, **5 tên khác nhau**, dừng lần lượt; nút "TRAO TẤT CẢ! (5)" khóa tới khi thẻ cuối dừng |
| SPIN-11 | Bấm "🙈 Vắng mặt" ở 1 thẻ → "TRAO TẤT CẢ! (4)" | Bảng vàng thêm 4 người; quà "còn 1/5"; 1 người vào tab Vắng mặt |
| SPIN-12 | Bấm "⟲ Hoàn tác" | Hộp xác nhận liệt kê đúng 4 người bị "Hủy trao" và 1 người "Bỏ đánh dấu vắng"; focus ở "Thôi, giữ nguyên" |
| SPIN-13 | Trong hộp hoàn tác nhấn Space | Hộp đóng, **không** hoàn tác, **không** quay |
| SPIN-14 | Ctrl+Z → "⟲ HOÀN TÁC" | Cả lô 5 người được hoàn tác một lần; quà "còn 5/5" |
| SPIN-15 | Trao 1 người, rê chuột vào dòng của họ trong Bảng vàng | Icon ✕ hiện mờ; rê vào icon thì nền hồng, hiện rõ; không rê thì ẩn |
| SPIN-16 | Bấm ✕ → hộp "Báo vắng người này?" (có tên + quà) → "🙈 BÁO VẮNG" | Người đó rời Bảng vàng, vào tab Vắng mặt; quà được **trả lại** (+1); người đó **không** quay lại vòng |
| SPIN-17 | Hoàn tác thao tác ở SPIN-16 | Hộp ghi "Trao lại …" + "Bỏ đánh dấu vắng …"; xác nhận thì về như trước SPIN-16 |
| SPIN-18 | "💥 Reset" → giữ < 2s | Không reset |
| SPIN-19 | "💥 Reset" → giữ đủ 2s | Bảng vàng và Vắng mặt trống; tất cả quay lại vòng; quà về đủ |
| SPIN-20 | Ngay sau SPIN-19, Hoàn tác | Kết quả trước reset được khôi phục |
| SPIN-21 | Trao hết mọi quà | Dòng "Hết quà rồi! Nhưng tình anh em thì còn mãi 🍻" |
| SPIN-22 | Spam Space liên tục khi đang quay | Không quay chồng, không lỗi |
| SPIN-23 | Gõ `manday` | Mưa sticker 🥸 |
| SPIN-24 | Reload trang giữa các bước | Dữ liệu (Bảng vàng, Vắng mặt, số quà còn) giữ nguyên |

---

## 6. Trang Màn chờ `/`

Các thành phần trên trang:
- Badge nghiêng "11.11 · NGÀY CỦA ANH EM".
- Tiêu đề rất lớn là tên sự kiện ("Vio Manday 11.11").
- Câu phụ "365 ngày gánh team, hôm nay đến lượt được cưng".
- Phần đếm ngược hoặc dòng "Sẵn sàng khi anh em sẵn sàng".
- Badge "🧔 N anh em" và "🎁 N phần quà" (tổng số lượng quà).
- Nút lớn "VÀO QUAY THÔI!" dẫn tới `/spin`.
- Tối đa 12 sticker tên anh em bay quanh viền màn hình, né dải giữa có tiêu đề; ẩn trên mobile.
- Nếu admin đã upload nhạc: header có nút "🎵 Bật nhạc" / "Tắt nhạc".

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| LOB-01 | Mở `/` (chưa đặt giờ) | Đủ các thành phần trên; "Sẵn sàng khi anh em sẵn sàng"; không còn chữ "19/11" hay "20/11" |
| LOB-02 | 1920×1080 | Tiêu đề 1 dòng, không bị sticker đè; không có thanh cuộn ngang |
| LOB-03 | Đặt giờ bắt đầu (ADM-SET-03), mở `/` | "GIỜ G SẮP ĐIỂM!" + các ô giờ/phút/giây đếm lùi mỗi giây |
| LOB-04 | Chờ đến giờ G (để trang mở) | Đổi thành "GIỜ G ĐÃ ĐIỂM!!!", pháo hoa confetti, nút "VÀO QUAY THÔI!" nhún nhảy |
| LOB-05 | Mở `/` khi giờ G đã qua từ trước | Hiện "GIỜ G ĐÃ ĐIỂM!!!" nhưng **không** bắn pháo hoa lại |
| LOB-06 | Có nhạc nền → bấm "🎵 Bật nhạc" | Nhạc phát lặp; bấm lại thì dừng |

---

## 7. Đồng bộ nhiều tab & lưu trữ

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| SYNC-01 | Mở `/admin` và `/spin` ở 2 tab. Ở admin thêm quà mới | Tab `/spin` hiện quà mới **không cần reload** |
| SYNC-02 | Ở `/spin` trao giải 1 người | Tab admin: người đó có trạng thái "🏆 Đã trúng" |
| SYNC-03 | Profile sạch, mở cùng lúc `/` và `/spin` | Vẫn đúng **50** người (không bị nhân đôi) |

## 8. Responsive, chuyển động giảm, khả năng tiếp cận

| ID | Bước | Kết quả mong đợi |
|---|---|---|
| UX-01 | 375×812 ở cả 3 trang | Không có thanh cuộn ngang; các phần xếp dọc; nút bấm ≥ 40–48px |
| UX-02 | 1366×768 `/spin` | 3 cột vừa màn hình, vòng quay không bị cắt |
| UX-03 | Bật giả lập `prefers-reduced-motion: reduce` rồi quay | Quay ngắn (~1,2s), không rung màn hình, confetti ít, sticker bay ẩn; chức năng vẫn đủ |
| UX-04 | Chỉ dùng bàn phím (Tab) | Có viền focus xanh dày, rõ ràng; tới được mọi nút |
| UX-05 | Dùng Tab tới một thẻ quà **chưa chọn** rồi nhấn Enter | Thẻ đó được chọn (nền vàng), focus chuyển sang nút QUAY, **chưa** quay. Nhấn Enter lần nữa thì quay đúng quà vừa chọn |
| UX-06 | Tab tới nút "Quay nhiều" rồi nhấn Space | Chỉ bật/tắt chế độ, **không** quay |
| UX-07 | Mọi chữ tiếng Việt | Đúng dấu, đúng font (không có ký tự rơi về font hệ thống) |
| UX-08 | Console trình duyệt suốt quá trình test | Không có lỗi (error) |

## 9. Mẫu báo cáo

```
## Tổng kết
- Môi trường: <trình duyệt, kích thước>
- PASS: x / FAIL: y / BLOCKED: z

## Lỗi (FAIL)
| ID | Mức độ (Cao/TB/Thấp) | Bước tái hiện | Mong đợi | Thực tế | Ảnh chụp |

## Góp ý UI (không phải lỗi)
- …
```

Mức độ gợi ý:
- **Cao**: sai kết quả quay, mất dữ liệu, không trao được giải.
- **Trung bình**: sai số liệu hoặc hiển thị, phím tắt sai.
- **Thấp**: lệch giao diện, chữ.
