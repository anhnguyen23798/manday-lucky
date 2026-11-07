/** Nhận diện cột "Họ và tên" + "Account" trong bảng 2 chiều. Không phụ thuộc SheetJS. */
import { stripDiacritics, type EmployeeInput } from "./employees";

const headerKey = (h: unknown) =>
  stripDiacritics(String(h ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const NAME_KEYS = new Set(["hovaten", "hoten", "ten", "fullname", "name"]);
const ACCOUNT_KEYS = new Set(["account", "acc", "taikhoan", "username", "user"]);

export type ParsedSheet = {
  rows: (EmployeeInput & { row: number })[];
  /** lỗi cấp file (không tìm thấy cột, file rỗng...) */
  error: string | null;
};

/** Parse mảng 2 chiều (header được tìm trong 10 dòng đầu; các cột khác như STT được bỏ qua) */
export function parseMatrix(matrix: unknown[][]): ParsedSheet {
  for (let h = 0; h < Math.min(10, matrix.length); h++) {
    const keys = (matrix[h] ?? []).map(headerKey);
    const nameCol = keys.findIndex((k) => NAME_KEYS.has(k));
    const accCol = keys.findIndex((k) => ACCOUNT_KEYS.has(k));
    if (nameCol >= 0 && accCol >= 0) {
      const rows: ParsedSheet["rows"] = [];
      for (let r = h + 1; r < matrix.length; r++) {
        const line = matrix[r] ?? [];
        const fullName = String(line[nameCol] ?? "").trim();
        const account = String(line[accCol] ?? "").trim();
        if (!fullName && !account) continue; // dòng trống
        rows.push({ fullName, account, row: r + 1 });
      }
      if (rows.length === 0) return { rows, error: "File không có dòng dữ liệu nào" };
      return { rows, error: null };
    }
  }
  return { rows: [], error: 'Không tìm thấy 2 cột "Họ và tên" và "Account" trong file' };
}
