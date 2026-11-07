export type Employee = {
  id: string;
  fullName: string;
  account: string;
  createdAt: number;
};

export type Prize = {
  id: string;
  name: string;
  quantity: number;
  /** key của Blob ảnh trong IndexedDB (`img:<id>`) */
  imageKey: string | null;
  order: number;
};

export type Win = {
  id: string;
  employeeId: string;
  prizeId: string;
  at: number;
};

export type LogType =
  | "import"
  | "employee"
  | "prize"
  | "win"
  | "skip"
  | "restore"
  | "undo"
  | "reset"
  | "data";

export type LogEntry = {
  id: string;
  at: number;
  type: LogType;
  text: string;
};

export type Settings = {
  eventTitle: string;
  /** epoch ms, null = chưa đặt giờ */
  eventStartAt: number | null;
  soundOn: boolean;
  /** key của Blob nhạc nền trong IndexedDB */
  bgMusicKey: string | null;
};

export type Snapshot = {
  wins: Win[];
  absentIds: string[];
  label: string;
};

/** Phần dữ liệu được lưu (persist) */
export type Data = {
  employees: Employee[];
  prizes: Prize[];
  wins: Win[];
  absentIds: string[];
  log: LogEntry[];
  settings: Settings;
  undoStack: Snapshot[];
  /** đã tự nạp danh sách mặc định (public/vio-man.csv) lần đầu chưa */
  defaultsLoaded: boolean;
};

export const DATA_VERSION = 1;

/** Công ty tổ chức Manday ngày 11/11 (Quốc tế Nam giới chính thức là 19/11) */
export const DEFAULT_EVENT_TITLE = "Vio Manday 11.11";
/** Tiêu đề mặc định của các bản trước, dùng để tự chuyển đổi dữ liệu cũ */
export const LEGACY_EVENT_TITLES = ["Manday 19.11", "Manday 11.11"];

export const defaultSettings: Settings = {
  eventTitle: DEFAULT_EVENT_TITLE,
  eventStartAt: null,
  soundOn: true,
  bgMusicKey: null,
};

export const emptyData = (): Data => ({
  employees: [],
  prizes: [],
  wins: [],
  absentIds: [],
  log: [],
  settings: { ...defaultSettings },
  undoStack: [],
  defaultsLoaded: false,
});
