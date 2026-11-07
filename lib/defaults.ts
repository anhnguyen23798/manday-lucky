/** Danh sách nhân viên mặc định: public/vio-man.csv */
import { parseCsv } from "./csv";
import { parseMatrix, type ParsedSheet } from "./import-parse";

export const DEFAULT_EMPLOYEES_URL = "/vio-man.csv";
export const DEFAULT_EMPLOYEES_LABEL = "vio-man.csv";

export async function fetchDefaultEmployees(): Promise<ParsedSheet> {
  try {
    const res = await fetch(DEFAULT_EMPLOYEES_URL, { cache: "no-cache" });
    if (!res.ok) return { rows: [], error: `Không tải được ${DEFAULT_EMPLOYEES_LABEL} (HTTP ${res.status})` };
    return parseMatrix(parseCsv(await res.text()));
  } catch {
    return { rows: [], error: `Không tải được ${DEFAULT_EMPLOYEES_LABEL}` };
  }
}
