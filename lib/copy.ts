/** Toàn bộ câu chữ hiển thị. Xem .claude/skills/manday-copywriter */

export const copy = {
  brand: "VIO MANDAY LUCKY",
  heroTitle: "VÒNG QUAY NHÂN PHẨM CÁNH MÀY RÂU",
  heroSub: "365 ngày gánh team, hôm nay đến lượt được cưng",

  spinButton: {
    idle: ["QUAY LUÔN ANH EM ƠI!", "XOAY ĐI CHỜ CHI!", "THỬ NHÂN PHẨM NÀO!"],
    spinning: ["ĐANG QUAY…", "NÍN THỞ ĐI ANH…", "CẦU NGUYỆN ĐI…"],
    empty: "HẾT NGƯỜI RỒI 😴",
    noPrize: "CHỌN QUÀ TRƯỚC ĐÃ 👈",
    soldOut: "QUÀ NÀY HẾT RỒI",
  },

  spinningLines: [
    "Đang hỏi ý kiến nóc nhà…",
    "Vòng quay đang cạo râu, chờ xíu…",
    "Đang tính KPI may mắn…",
    "Ai đang thầm cầu nguyện thì giơ tay ✋",
    "Hồi hộp như lúc chờ lương về",
  ],

  winTitles: ["CHÚC MỪNG ANH!!!", "TRÚNG RỒI ANH EM ƠI!", "NHÂN PHẨM: 100/100 💯", "NÓC NHÀ ĐÃ DUYỆT ✅"],
  winLines: [
    "Đàn ông không khóc, chỉ là bụi bay vào mắt thôi 🥲",
    "Hôm nay anh là nhân vật chính, đừng ngại!",
    "Phần thưởng cho những lần âm thầm sửa máy in.",
    "Xứng đáng hơn cả KPI quý 4.",
    "Về khoe nóc nhà liền đi anh!",
  ],
  batchTitles: ["MƯA QUÀ RỒI!!!", "CẢ ĐỘI CÙNG TRÚNG!", "COMBO NHÂN PHẨM 🔥"],

  award: "TRAO GIẢI!",
  awardAll: "TRAO TẤT CẢ!",
  absent: "VẮNG MẶT, QUAY LẠI",
  absentShort: "Vắng mặt",

  empty: {
    noEmployees: "Vòng quay đang cô đơn… Thêm anh em vào đi admin ơi!",
    noPrizes: "Chưa có phần quà nào. Vào admin thêm quà đi nào!",
    allDone: "Hết quà rồi! Nhưng tình anh em thì còn mãi 🍻",
    noWinners: "Chưa ai trúng. Vị trí số 1 đang chờ anh đấy!",
    noAbsent: "Anh em có mặt đầy đủ. Quá uy tín! 👏",
  },

  marquee: [
    "Đàn ông không khóc, chỉ là bụi bay vào mắt",
    "Sửa được máy in là đàn ông đích thực",
    "Lương về là… chuyển khoản cho nóc nhà",
    "Anh em nhớ uống đủ nước, ngủ đủ giấc 💙",
    "11/11: bốn số 1 đứng thẳng hàng, như anh em mình",
    "Không cần cơ bắp, chỉ cần biết tự giặt tất",
    "Trận bóng tối nay quan trọng, nhưng vòng quay này quan trọng hơn",
    "Thế giới cần những người đàn ông tử tế, và anh là một trong số đó",
  ],

  footer: "Happy Vio Manday 11/11: cảm ơn anh em đã luôn là chỗ dựa. Nhớ chăm sóc bản thân nữa nha 💙",

  reset: {
    title: "Chắc chưa anh?",
    body: "Lịch sử trúng giải sẽ bay màu đó. (Lỡ tay thì vẫn Hoàn tác được ngay sau đó.)",
    hold: "GIỮ 2 GIÂY ĐỂ RESET",
    holding: "ĐANG GIỮ…",
  },

  undo: {
    title: "Hoàn tác thật không anh?",
    confirm: "⟲ HOÀN TÁC",
  },

  winnerAbsent: {
    title: "Báo vắng người này?",
    body: "Lượt trúng sẽ bị hủy, người này chuyển sang tab Vắng mặt và phần quà được trả lại để quay tiếp.",
    confirm: "🙈 BÁO VẮNG",
  },

  lobby: {
    badge: "11.11 · NGÀY CỦA ANH EM",
    countdownTitle: "GIỜ G SẮP ĐIỂM!",
    started: "GIỜ G ĐÃ ĐIỂM!!!",
    noTime: "Sẵn sàng khi anh em sẵn sàng",
    enter: "VÀO QUAY THÔI!",
  },
} as const;

/** Random câu, tránh lặp lại câu vừa dùng */
const last = new Map<readonly string[], number>();
export function pick(arr: readonly string[]): string {
  if (arr.length <= 1) return arr[0] ?? "";
  let i = Math.floor(Math.random() * arr.length);
  if (i === last.get(arr)) i = (i + 1) % arr.length;
  last.set(arr, i);
  return arr[i];
}
