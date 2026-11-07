import type { Employee } from "./types";

/** NFC + trim + gộp khoảng trắng (giữ nguyên hoa thường để hiển thị) */
export function cleanName(name: string): string {
  return String(name ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Khóa so sánh tên: không phân biệt hoa thường */
export function nameKey(name: string): string {
  return cleanName(name).toLocaleLowerCase("vi");
}

export function cleanAccount(account: string): string {
  return String(account ?? "").normalize("NFC").replace(/\s+/g, "").trim();
}

export function accountKey(account: string): string {
  return cleanAccount(account).toLowerCase();
}

/** Bỏ dấu tiếng Việt, dùng cho tìm kiếm và nhận diện header */
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Map id → tên hiển thị. Chỉ gắn "(account)" cho những tên bị trùng.
 * Tính trên toàn bộ danh sách để tên hiển thị ổn định suốt sự kiện.
 */
export function buildDisplayNames(employees: readonly Employee[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const e of employees) {
    const k = nameKey(e.fullName);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const map = new Map<string, string>();
  for (const e of employees) {
    const dup = (counts.get(nameKey(e.fullName)) ?? 0) > 1;
    map.set(e.id, dup ? `${e.fullName} (${e.account})` : e.fullName);
  }
  return map;
}

export type EmployeeInput = { fullName: string; account: string };

export type ValidationError = "missing-name" | "missing-account" | "duplicate-account";

export function validateEmployee(
  input: EmployeeInput,
  existing: readonly Employee[],
  ignoreId?: string,
): ValidationError | null {
  if (!cleanName(input.fullName)) return "missing-name";
  const acc = accountKey(input.account);
  if (!acc) return "missing-account";
  if (existing.some((e) => e.id !== ignoreId && accountKey(e.account) === acc)) return "duplicate-account";
  return null;
}

export const validationMessage: Record<ValidationError, string> = {
  "missing-name": "Thiếu họ và tên",
  "missing-account": "Thiếu account",
  "duplicate-account": "Account đã tồn tại",
};

export function matchesSearch(e: Employee, q: string): boolean {
  const query = stripDiacritics(q).toLowerCase().trim();
  if (!query) return true;
  return (
    stripDiacritics(e.fullName).toLowerCase().includes(query) ||
    e.account.toLowerCase().includes(query)
  );
}
