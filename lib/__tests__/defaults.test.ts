import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv";
import { parseMatrix } from "../import-parse";
import * as S from "../state";
import { emptyData } from "../types";

describe("parseCsv", () => {
  it("BOM, CRLF, ngoặc kép, dấu phẩy trong ô, dòng trống", () => {
    const text = '﻿STT,Họ và tên,Account\r\n1,"Nguyễn Văn ""Tèo"", Jr",TeoNV\r\n\r\n2,Trần B,BT\n';
    expect(parseCsv(text)).toEqual([
      ["STT", "Họ và tên", "Account"],
      ["1", 'Nguyễn Văn "Tèo", Jr', "TeoNV"],
      ["2", "Trần B", "BT"],
    ]);
  });
  it("tự nhận dấu chấm phẩy", () => {
    expect(parseCsv("Họ và tên;Account\nA;a1")).toEqual([
      ["Họ và tên", "Account"],
      ["A", "a1"],
    ]);
  });
  it("dòng cuối không có xuống dòng", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("public/vio-man.csv", () => {
  const text = readFileSync(join(__dirname, "../../public/vio-man.csv"), "utf8");
  const parsed = parseMatrix(parseCsv(text));

  it("đọc được cột Họ và tên + Account (bỏ qua STT)", () => {
    expect(parsed.error).toBeNull();
    expect(parsed.rows.length).toBe(50);
    expect(parsed.rows.every((r) => r.fullName && r.account)).toBe(true);
  });

  it("toàn bộ dòng hợp lệ khi nạp vào danh sách trống", () => {
    const preview = S.previewImport(parsed.rows, []);
    const bad = preview.filter((r) => r.status !== "ok");
    expect(bad).toEqual([]);
  });

  it("seedDefaults nạp 50 người vào danh sách trống và đánh dấu đã nạp", () => {
    const d = S.seedDefaults(emptyData(), parsed.rows, "vio-man.csv");
    expect(d.employees).toHaveLength(50);
    expect(d.defaultsLoaded).toBe(true);
    expect(d.log[0].text).toContain("mặc định");
    expect(d.log).toHaveLength(1);
  });
});

describe("seedDefaults", () => {
  const rows = [{ fullName: "A", account: "a", row: 2 }];

  it("không nạp lại khi đã nạp (kể cả khi admin xóa hết người)", () => {
    const d = { ...emptyData(), defaultsLoaded: true };
    expect(S.seedDefaults(d, rows, "x")).toBe(d);
  });

  it("không ghi đè khi đã có dữ liệu, chỉ đánh dấu", () => {
    let d = emptyData();
    const r = S.addEmployee(d, { fullName: "B", account: "b" });
    if (!r.ok) throw new Error(r.error);
    d = r.data;
    const next = S.seedDefaults(d, rows, "x");
    expect(next.employees.map((e) => e.account)).toEqual(["b"]);
    expect(next.defaultsLoaded).toBe(true);
  });
});
