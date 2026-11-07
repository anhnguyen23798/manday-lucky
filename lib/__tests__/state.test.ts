import { describe, expect, it } from "vitest";
import * as S from "../state";
import { emptyData, type Data } from "../types";

function must<T>(r: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

function setup(): Data {
  let d = emptyData();
  d = must(
    S.importEmployees(
      d,
      Array.from({ length: 6 }, (_, i) => ({ fullName: `Anh ${i}`, account: `acc${i}`, row: i + 2 })),
      "append",
    ),
  ).data;
  d = must(S.addPrize(d, { name: "Bình nước", quantity: 3, imageKey: null }));
  d = must(S.addPrize(d, { name: "Tai nghe", quantity: 1, imageKey: null }));
  return d;
}

describe("import", () => {
  it("bỏ qua account trùng trong file và với dữ liệu cũ", () => {
    const d = setup();
    const r = must(
      S.importEmployees(
        d,
        [
          { fullName: "Mới", account: "new1", row: 2 },
          { fullName: "Mới 2", account: "NEW1", row: 3 },
          { fullName: "Cũ", account: "acc0", row: 4 },
          { fullName: "", account: "x", row: 5 },
        ],
        "append",
      ),
    );
    expect(r.added).toBe(1);
    expect(r.skipped).toBe(3);
    expect(r.data.employees).toHaveLength(7);
  });
  it("chặn thay thế toàn bộ khi đã có người trúng", () => {
    let d = setup();
    d = must(S.resolveDraw(d, d.prizes[0].id, [d.employees[0].id], []));
    expect(S.importEmployees(d, [{ fullName: "X", account: "x", row: 2 }], "replace").ok).toBe(false);
  });
});

describe("draw flow", () => {
  it("trao giải: loại khỏi vòng, giảm số quà còn lại", () => {
    let d = setup();
    const prize = d.prizes[0];
    const [a] = d.employees;
    d = must(S.resolveDraw(d, prize.id, [a.id], []));
    expect(S.getEligible(d).map((e) => e.id)).not.toContain(a.id);
    expect(S.getRemaining(d, prize.id)).toBe(2);
  });

  it("vắng mặt: loại khỏi vòng nhưng KHÔNG tốn quà, khôi phục được", () => {
    let d = setup();
    const prize = d.prizes[0];
    const [a] = d.employees;
    d = must(S.resolveDraw(d, prize.id, [], [a.id]));
    expect(S.getEligible(d).map((e) => e.id)).not.toContain(a.id);
    expect(S.getRemaining(d, prize.id)).toBe(3);
    d = must(S.restoreAbsent(d, a.id));
    expect(S.getEligible(d).map((e) => e.id)).toContain(a.id);
  });

  it("quay hàng loạt = 1 snapshot; undo hoàn tác cả lô", () => {
    let d = setup();
    const prize = d.prizes[0];
    const [a, b, c] = d.employees;
    d = must(S.resolveDraw(d, prize.id, [a.id, b.id], [c.id]));
    expect(d.wins).toHaveLength(2);
    expect(d.absentIds).toEqual([c.id]);
    d = must(S.undo(d));
    expect(d.wins).toHaveLength(0);
    expect(d.absentIds).toHaveLength(0);
    expect(S.undo(d).ok).toBe(false);
  });

  it("không cho trao vượt số quà hoặc trao cho người không còn trong vòng", () => {
    let d = setup();
    const tai = d.prizes[1];
    const [a, b] = d.employees;
    expect(S.resolveDraw(d, tai.id, [a.id, b.id], []).ok).toBe(false);
    d = must(S.resolveDraw(d, tai.id, [a.id], []));
    expect(S.resolveDraw(d, d.prizes[0].id, [a.id], []).ok).toBe(false);
  });

  it("reset xóa kết quả, undo khôi phục lại", () => {
    let d = setup();
    d = must(S.resolveDraw(d, d.prizes[0].id, [d.employees[0].id], [d.employees[1].id]));
    d = S.resetResults(d);
    expect(d.wins).toHaveLength(0);
    expect(d.absentIds).toHaveLength(0);
    expect(d.employees).toHaveLength(6);
    d = must(S.undo(d));
    expect(d.wins).toHaveLength(1);
    expect(d.absentIds).toHaveLength(1);
  });
});

describe("báo vắng sau khi trao", () => {
  it("bỏ lượt trúng, chuyển sang vắng, trả lại quà; undo khôi phục", () => {
    let d = setup();
    const p = d.prizes[0];
    const [a, b] = d.employees;
    d = must(S.resolveDraw(d, p.id, [a.id, b.id], []));
    expect(S.getRemaining(d, p.id)).toBe(1);
    const winA = d.wins.find((w) => w.employeeId === a.id)!;
    d = must(S.markWinnerAbsent(d, winA.id));
    expect(d.wins.map((w) => w.employeeId)).toEqual([b.id]);
    expect(d.absentIds).toEqual([a.id]);
    expect(S.getRemaining(d, p.id)).toBe(2);
    expect(S.getEligible(d).map((e) => e.id)).not.toContain(a.id);
    expect(d.log[0].text).toContain("Vắng mặt sau khi trao");
    d = must(S.undo(d));
    expect(d.wins).toHaveLength(2);
    expect(d.absentIds).toHaveLength(0);
  });
  it("lỗi khi winId không tồn tại", () => {
    expect(S.markWinnerAbsent(setup(), "nope").ok).toBe(false);
  });
});

describe("describeUndo", () => {
  it("null khi không có gì để hoàn tác", () => {
    expect(S.describeUndo(setup())).toBeNull();
  });
  it("mô tả hủy trao + bỏ vắng của một lượt quay hàng loạt", () => {
    let d = setup();
    const p = d.prizes[0];
    const [a, b, c] = d.employees;
    d = must(S.resolveDraw(d, p.id, [a.id, b.id], [c.id]));
    const u = S.describeUndo(d)!;
    expect(u.label).toBe('Quay "Bình nước"');
    expect(u.lines).toEqual(['Hủy trao "Bình nước": Anh 0, Anh 1', "Bỏ đánh dấu vắng: Anh 2"]);
  });
  it("mô tả trao lại khi hoàn tác báo vắng / reset (rút gọn danh sách dài)", () => {
    let d = setup();
    const p = d.prizes[0];
    const ids = d.employees.slice(0, 3).map((e) => e.id);
    d = must(S.resolveDraw(d, p.id, ids, []));
    d = S.resetResults(d);
    const u = S.describeUndo(d, 2)!;
    expect(u.lines).toEqual(['Trao lại "Bình nước": Anh 0, Anh 1 và 1 người khác']);
  });
});

describe("guards", () => {
  it("không xóa người đã trúng, không xóa quà đã trao, số lượng ≥ đã trao", () => {
    let d = setup();
    const p = d.prizes[0];
    const a = d.employees[0];
    d = must(S.resolveDraw(d, p.id, [a.id], []));
    expect(S.removeEmployee(d, a.id).ok).toBe(false);
    expect(S.removePrize(d, p.id).ok).toBe(false);
    expect(S.updatePrize(d, p.id, { quantity: 0 }).ok).toBe(false);
    expect(S.updatePrize(d, p.id, { quantity: 1 }).ok).toBe(true);
  });
  it("movePrize đổi thứ tự", () => {
    let d = setup();
    const [first, second] = S.sortedPrizes(d.prizes);
    d = S.movePrize(d, second.id, -1);
    expect(S.sortedPrizes(d.prizes)[0].id).toBe(second.id);
    expect(S.sortedPrizes(d.prizes)[1].id).toBe(first.id);
  });
});
