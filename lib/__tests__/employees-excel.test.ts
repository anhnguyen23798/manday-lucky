import { describe, expect, it } from "vitest";
import { buildDisplayNames, matchesSearch, validateEmployee } from "../employees";
import { parseMatrix } from "../import-parse";
import type { Employee } from "../types";

const emp = (id: string, fullName: string, account: string): Employee => ({ id, fullName, account, createdAt: 0 });

describe("buildDisplayNames", () => {
  it("chỉ gắn account cho tên bị trùng (không phân biệt hoa thường, khoảng trắng)", () => {
    const list = [
      emp("1", "Nguyễn Văn Nam", "NamNV1"),
      emp("2", "nguyễn  văn nam", "NamNV2"),
      emp("3", "Trần Đức", "DucT"),
    ];
    const m = buildDisplayNames(list);
    expect(m.get("1")).toBe("Nguyễn Văn Nam (NamNV1)");
    expect(m.get("2")).toBe("nguyễn  văn nam (NamNV2)");
    expect(m.get("3")).toBe("Trần Đức");
  });
  it("coi NFC và NFD là cùng một tên", () => {
    const nfd = "Nguyễn Văn Nam".normalize("NFD");
    const m = buildDisplayNames([emp("1", "Nguyễn Văn Nam", "a"), emp("2", nfd, "b")]);
    expect(m.get("1")).toContain("(a)");
  });
});

describe("validateEmployee", () => {
  const existing = [emp("1", "An", "AnNV")];
  it("bắt thiếu dữ liệu và account trùng (không phân biệt hoa thường)", () => {
    expect(validateEmployee({ fullName: "", account: "x" }, existing)).toBe("missing-name");
    expect(validateEmployee({ fullName: "B", account: " " }, existing)).toBe("missing-account");
    expect(validateEmployee({ fullName: "B", account: "annv" }, existing)).toBe("duplicate-account");
    expect(validateEmployee({ fullName: "An", account: "AnNV2" }, existing)).toBeNull();
    expect(validateEmployee({ fullName: "An", account: "AnNV" }, existing, "1")).toBeNull();
  });
});

describe("matchesSearch", () => {
  it("tìm không dấu", () => {
    expect(matchesSearch(emp("1", "Trần Đức Anh", "AnhTD"), "duc anh")).toBe(true);
    expect(matchesSearch(emp("1", "Trần Đức Anh", "AnhTD"), "anhtd")).toBe(true);
    expect(matchesSearch(emp("1", "Trần Đức Anh", "AnhTD"), "minh")).toBe(false);
  });
});

describe("parseMatrix", () => {
  it("nhận header có dấu / không dấu / hoa thường, bỏ dòng trống, giữ số dòng", () => {
    const r = parseMatrix([
      ["Danh sách anh em"],
      ["STT", "HO VA TEN", "ACCOUNT"],
      [1, "Nguyễn Văn An", "AnNV1"],
      ["", "", ""],
      [2, "Trần Đức", ""],
    ]);
    expect(r.error).toBeNull();
    expect(r.rows).toEqual([
      { fullName: "Nguyễn Văn An", account: "AnNV1", row: 3 },
      { fullName: "Trần Đức", account: "", row: 5 },
    ]);
  });
  it("báo lỗi khi thiếu cột", () => {
    expect(parseMatrix([["Tên"], ["A"]]).error).not.toBeNull();
    expect(parseMatrix([["Họ và tên", "Account"]]).error).not.toBeNull();
  });
});
