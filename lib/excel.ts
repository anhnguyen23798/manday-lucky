/**
 * Đọc/ghi Excel bằng SheetJS. File này chỉ được import động từ trang admin
 * (`await import("@/lib/excel")`) để không làm nặng bundle sân khấu.
 */
import * as XLSX from "xlsx";
import { parseMatrix, type ParsedSheet } from "./import-parse";

export { parseMatrix, type ParsedSheet };

export const TEMPLATE_HEADERS = ["Họ và tên", "Account"] as const;

export async function parseEmployeeFile(file: File): Promise<ParsedSheet> {
  // CSV: đọc text UTF-8 để giữ dấu tiếng Việt (không cần bảng codepage của SheetJS)
  const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
  const wb = isCsv
    ? XLSX.read((await file.text()).replace(/^﻿/, ""), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], error: "File không có sheet nào" };
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });
  return parseMatrix(matrix);
}

/** File mẫu chỉ có dòng tiêu đề, tránh vô tình import người mẫu vào danh sách thật */
export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS]]);
  ws["!cols"] = [{ wch: 28 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Anh em");
  XLSX.writeFile(wb, "manday-danh-sach-mau.xlsx");
}
