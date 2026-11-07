import { describe, expect, it } from "vitest";
import { pickMany, secureInt, uid } from "../random";
import { computeTargetRotation, segmentAtAngle } from "../wheel-math";

describe("secureInt", () => {
  it("phân phối đều (lệch < 2%)", () => {
    const n = 5;
    const N = 100_000;
    const counts = new Array(n).fill(0);
    for (let i = 0; i < N; i++) counts[secureInt(n)]++;
    for (const c of counts) expect(Math.abs(c / N - 1 / n)).toBeLessThan(0.02);
  });
  it("từ chối max không hợp lệ", () => {
    expect(() => secureInt(0)).toThrow();
  });
});

describe("pickMany", () => {
  it("không trùng phần tử, đúng số lượng, không vượt quá danh sách", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    for (let t = 0; t < 1000; t++) {
      const k = 1 + secureInt(30);
      const r = pickMany(items, k);
      expect(r).toHaveLength(k);
      expect(new Set(r).size).toBe(k);
    }
    expect(pickMany([1, 2], 5)).toHaveLength(2);
    expect(pickMany([], 3)).toEqual([]);
  });
  it("mỗi phần tử có xác suất được chọn như nhau", () => {
    const items = [0, 1, 2, 3];
    const counts = [0, 0, 0, 0];
    const N = 40_000;
    for (let i = 0; i < N; i++) for (const x of pickMany(items, 2)) counts[x]++;
    for (const c of counts) expect(Math.abs(c / N - 0.5)).toBeLessThan(0.02);
  });
});

describe("wheel math", () => {
  it("kim luôn dừng đúng lát người thắng và quay đủ nhiều vòng", () => {
    for (const n of [1, 2, 3, 7, 50, 200]) {
      let cur = 0;
      for (let k = 0; k < 2000; k++) {
        const w = secureInt(n);
        const t = computeTargetRotation({ current: cur, count: n, winnerIndex: w });
        expect(segmentAtAngle(t, n)).toBe(w);
        expect(t - cur).toBeGreaterThanOrEqual(5 * 360);
        cur = t;
      }
    }
  });
});

describe("uid", () => {
  it("không trùng", () => {
    const s = new Set(Array.from({ length: 10_000 }, uid));
    expect(s.size).toBe(10_000);
  });
});
