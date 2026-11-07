/**
 * RNG an toàn dựa trên crypto.getRandomValues.
 * Dùng cho MỌI lựa chọn người trúng. (crypto.getRandomValues chạy được cả trên http LAN,
 * khác với crypto.randomUUID chỉ có ở secure context.)
 */

/** Số thực [0, 1) */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Số nguyên [0, max), không bias (rejection sampling) */
export function secureInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error("max must be a positive integer");
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/** Chọn k phần tử khác nhau (partial Fisher–Yates). Thứ tự kết quả cũng ngẫu nhiên. */
export function pickMany<T>(items: readonly T[], k: number): T[] {
  const n = items.length;
  const count = Math.max(0, Math.min(k, n));
  const arr = items.slice();
  for (let i = 0; i < count; i++) {
    const j = i + secureInt(n - i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/** Chọn 1 index ngẫu nhiên đều */
export function pickIndex(length: number): number {
  return secureInt(length);
}

/** id ngắn, không phụ thuộc secure context */
export function uid(): string {
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}
