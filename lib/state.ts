/**
 * Logic nghiệp vụ thuần (không phụ thuộc React/zustand) để dễ unit test.
 * Mọi hàm nhận Data và trả về Data mới (immutable).
 */
import {
  accountKey,
  buildDisplayNames,
  cleanAccount,
  cleanName,
  validateEmployee,
  type EmployeeInput,
  type ValidationError,
} from "./employees";
import { uid } from "./random";
import type { Data, Employee, LogType, Prize, Snapshot, Win } from "./types";

const MAX_UNDO = 20;
const MAX_LOG = 500;

export type Result<T = Data> = { ok: true; data: T } | { ok: false; error: string };

const ok = (data: Data): Result => ({ ok: true, data });
const fail = (error: string): Result => ({ ok: false, error });

// ---------- selectors ----------

export function wonIdSet(d: Pick<Data, "wins">): Set<string> {
  return new Set(d.wins.map((w) => w.employeeId));
}

export function getEligible(d: Pick<Data, "employees" | "wins" | "absentIds">): Employee[] {
  const won = wonIdSet(d);
  const absent = new Set(d.absentIds);
  return d.employees.filter((e) => !won.has(e.id) && !absent.has(e.id));
}

export function awardedCount(d: Pick<Data, "wins">, prizeId: string): number {
  return d.wins.reduce((n, w) => (w.prizeId === prizeId ? n + 1 : n), 0);
}

export function getRemaining(d: Pick<Data, "wins" | "prizes">, prizeId: string): number {
  const p = d.prizes.find((x) => x.id === prizeId);
  if (!p) return 0;
  return Math.max(0, p.quantity - awardedCount(d, prizeId));
}

export function sortedPrizes(prizes: readonly Prize[]): Prize[] {
  return prizes.slice().sort((a, b) => a.order - b.order);
}

// ---------- helpers ----------

function withLog(d: Data, type: LogType, text: string, at = Date.now()): Data {
  const log = [{ id: uid(), at, type, text }, ...d.log].slice(0, MAX_LOG);
  return { ...d, log };
}

function pushSnapshot(d: Data, label: string): Data {
  const snap: Snapshot = { wins: d.wins, absentIds: d.absentIds, label };
  return { ...d, undoStack: [snap, ...d.undoStack].slice(0, MAX_UNDO) };
}

function names(d: Data, ids: readonly string[]): string {
  const map = buildDisplayNames(d.employees);
  return ids.map((id) => map.get(id) ?? "?").join(", ");
}

// ---------- employees ----------

export function addEmployee(d: Data, input: EmployeeInput): Result {
  const err = validateEmployee(input, d.employees);
  if (err) return fail(err);
  const e: Employee = {
    id: uid(),
    fullName: cleanName(input.fullName),
    account: cleanAccount(input.account),
    createdAt: Date.now(),
  };
  return ok(withLog({ ...d, employees: [...d.employees, e] }, "employee", `Thêm ${e.fullName} (${e.account})`));
}

export function updateEmployee(d: Data, id: string, input: EmployeeInput): Result {
  const err = validateEmployee(input, d.employees, id);
  if (err) return fail(err);
  const employees = d.employees.map((e) =>
    e.id === id ? { ...e, fullName: cleanName(input.fullName), account: cleanAccount(input.account) } : e,
  );
  return ok({ ...d, employees });
}

export function removeEmployee(d: Data, id: string): Result {
  if (wonIdSet(d).has(id)) return fail("Người này đã trúng giải, không xóa được");
  const e = d.employees.find((x) => x.id === id);
  if (!e) return fail("Không tìm thấy");
  return ok(
    withLog(
      {
        ...d,
        employees: d.employees.filter((x) => x.id !== id),
        absentIds: d.absentIds.filter((x) => x !== id),
      },
      "employee",
      `Xóa ${e.fullName} (${e.account})`,
    ),
  );
}

export type ImportRowStatus = "ok" | ValidationError | "duplicate-in-file";

export type ImportPreviewRow = EmployeeInput & { row: number; status: ImportRowStatus };

/** Đánh trạng thái từng dòng import (so với dữ liệu hiện có, hoặc rỗng khi replace) */
export function previewImport(
  rows: readonly (EmployeeInput & { row: number })[],
  existing: readonly Employee[],
): ImportPreviewRow[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    const err = validateEmployee(r, existing);
    if (err) return { ...r, status: err };
    const k = accountKey(r.account);
    if (seen.has(k)) return { ...r, status: "duplicate-in-file" };
    seen.add(k);
    return { ...r, status: "ok" };
  });
}

export function importEmployees(
  d: Data,
  rows: readonly (EmployeeInput & { row: number })[],
  mode: "append" | "replace",
): Result<{ data: Data; added: number; skipped: number }> {
  if (mode === "replace" && d.wins.length > 0)
    return { ok: false, error: "Đã có người trúng giải, hãy Reset kết quả trước khi thay thế toàn bộ" };
  const base = mode === "replace" ? [] : d.employees;
  const preview = previewImport(rows, base);
  const now = Date.now();
  const added: Employee[] = preview
    .filter((r) => r.status === "ok")
    .map((r, i) => ({
      id: uid(),
      fullName: cleanName(r.fullName),
      account: cleanAccount(r.account),
      createdAt: now + i,
    }));
  const next: Data = {
    ...d,
    employees: [...base, ...added],
    absentIds: mode === "replace" ? [] : d.absentIds,
    undoStack: mode === "replace" ? [] : d.undoStack,
  };
  const skipped = preview.length - added.length;
  return {
    ok: true,
    data: {
      data: withLog(
        next,
        "import",
        `${mode === "replace" ? "Thay thế" : "Import"} ${added.length} anh em, bỏ qua ${skipped} dòng`,
      ),
      added: added.length,
      skipped,
    },
  };
}

/**
 * Tự nạp danh sách mặc định lần đầu: chỉ chạy khi chưa từng nạp VÀ danh sách đang trống.
 * Luôn đánh dấu defaultsLoaded để không nạp lại khi admin cố ý xóa hết.
 */
export function seedDefaults(d: Data, rows: readonly (EmployeeInput & { row: number })[], source: string): Data {
  if (d.defaultsLoaded) return d;
  if (d.employees.length > 0) return { ...d, defaultsLoaded: true };
  const r = importEmployees(d, rows, "append");
  if (!r.ok) return { ...d, defaultsLoaded: true };
  const next = r.data.data;
  return withLog({ ...next, log: next.log.slice(1), defaultsLoaded: true }, "import", `Nạp danh sách mặc định ${source}: ${r.data.added} anh em`);
}

// ---------- prizes ----------

export function addPrize(d: Data, input: { name: string; quantity: number; imageKey: string | null }): Result {
  const name = cleanName(input.name);
  if (!name) return fail("Thiếu tên quà");
  if (!Number.isInteger(input.quantity)) return fail("Số lượng phải là số nguyên");
  if (input.quantity < 1) return fail("Số lượng phải ≥ 1");
  const order = d.prizes.reduce((m, p) => Math.max(m, p.order), -1) + 1;
  const p: Prize = { id: uid(), name, quantity: input.quantity, imageKey: input.imageKey, order };
  return ok(withLog({ ...d, prizes: [...d.prizes, p] }, "prize", `Thêm quà "${name}" x${p.quantity}`));
}

export function updatePrize(
  d: Data,
  id: string,
  patch: Partial<Pick<Prize, "name" | "quantity" | "imageKey">>,
): Result {
  const p = d.prizes.find((x) => x.id === id);
  if (!p) return fail("Không tìm thấy quà");
  const next = { ...p, ...patch };
  next.name = cleanName(next.name);
  if (!next.name) return fail("Thiếu tên quà");
  const awarded = awardedCount(d, id);
  if (!Number.isInteger(next.quantity)) return fail("Số lượng phải là số nguyên");
  if (next.quantity < Math.max(1, awarded))
    return fail(`Số lượng phải ≥ ${Math.max(1, awarded)} (đã trao ${awarded})`);
  return ok({ ...d, prizes: d.prizes.map((x) => (x.id === id ? next : x)) });
}

export function removePrize(d: Data, id: string): Result {
  if (awardedCount(d, id) > 0) return fail("Quà này đã được trao, không xóa được");
  const p = d.prizes.find((x) => x.id === id);
  if (!p) return fail("Không tìm thấy quà");
  return ok(withLog({ ...d, prizes: d.prizes.filter((x) => x.id !== id) }, "prize", `Xóa quà "${p.name}"`));
}

export function movePrize(d: Data, id: string, dir: -1 | 1): Data {
  const list = sortedPrizes(d.prizes);
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return d;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...d, prizes: list.map((p, k) => ({ ...p, order: k })) };
}

// ---------- draw ----------

/**
 * Chốt kết quả 1 lượt quay (đơn hoặc hàng loạt) = 1 snapshot undo.
 * awardIds: trao giải; absentIds: vắng mặt (lượt quà được giữ lại).
 */
export function resolveDraw(
  d: Data,
  prizeId: string,
  awardIds: readonly string[],
  absentIds: readonly string[],
): Result {
  const prize = d.prizes.find((p) => p.id === prizeId);
  if (!prize) return fail("Không tìm thấy quà");
  if (awardIds.length === 0 && absentIds.length === 0) return ok(d);
  const eligible = new Set(getEligible(d).map((e) => e.id));
  for (const id of [...awardIds, ...absentIds])
    if (!eligible.has(id)) return fail("Có người không còn trong vòng quay");
  if (awardIds.length > getRemaining(d, prizeId)) return fail("Số người trúng vượt quá số quà còn lại");

  let next = pushSnapshot(d, `Quay "${prize.name}"`);
  const now = Date.now();
  const wins: Win[] = awardIds.map((employeeId, i) => ({ id: uid(), employeeId, prizeId, at: now + i }));
  next = { ...next, wins: [...next.wins, ...wins], absentIds: [...next.absentIds, ...absentIds] };
  if (awardIds.length) next = withLog(next, "win", `Trao "${prize.name}": ${names(d, awardIds)}`, now);
  if (absentIds.length) next = withLog(next, "skip", `Vắng mặt: ${names(d, absentIds)}`, now);
  return ok(next);
}

/**
 * Đã trao rồi mới phát hiện vắng mặt: bỏ lượt trúng, đưa người đó vào danh sách vắng,
 * phần quà được trả lại để quay tiếp. Undo được.
 */
export function markWinnerAbsent(d: Data, winId: string): Result {
  const win = d.wins.find((w) => w.id === winId);
  if (!win) return fail("Không tìm thấy lượt trúng này");
  const prize = d.prizes.find((p) => p.id === win.prizeId);
  let next = pushSnapshot(d, "Báo vắng sau khi trao");
  next = {
    ...next,
    wins: next.wins.filter((w) => w.id !== winId),
    absentIds: next.absentIds.includes(win.employeeId) ? next.absentIds : [...next.absentIds, win.employeeId],
  };
  return ok(
    withLog(next, "skip", `Vắng mặt sau khi trao: ${names(d, [win.employeeId])}, trả lại 1 "${prize?.name ?? "?"}"`),
  );
}

export type UndoPreview = { label: string; lines: string[] };

/** Mô tả những gì sẽ thay đổi nếu hoàn tác snapshot gần nhất (để hiện trong hộp xác nhận) */
export function describeUndo(d: Data, maxNames = 6): UndoPreview | null {
  const snap = d.undoStack[0];
  if (!snap) return null;
  const display = buildDisplayNames(d.employees);
  const prizeName = new Map(d.prizes.map((p) => [p.id, p.name]));
  const list = (ids: string[]) => {
    const n = ids.map((id) => display.get(id) ?? "?");
    return n.length > maxNames ? `${n.slice(0, maxNames).join(", ")} và ${n.length - maxNames} người khác` : n.join(", ");
  };
  const byPrize = (wins: Win[], prefix: string) => {
    const groups = new Map<string, string[]>();
    for (const w of wins) groups.set(w.prizeId, [...(groups.get(w.prizeId) ?? []), w.employeeId]);
    return [...groups].map(([pid, ids]) => `${prefix} "${prizeName.get(pid) ?? "?"}": ${list(ids)}`);
  };

  const snapWinIds = new Set(snap.wins.map((w) => w.id));
  const curWinIds = new Set(d.wins.map((w) => w.id));
  const winsRemoved = d.wins.filter((w) => !snapWinIds.has(w.id));
  const winsRestored = snap.wins.filter((w) => !curWinIds.has(w.id));
  const snapAbsent = new Set(snap.absentIds);
  const curAbsent = new Set(d.absentIds);
  const absentRemoved = d.absentIds.filter((id) => !snapAbsent.has(id));
  const absentRestored = snap.absentIds.filter((id) => !curAbsent.has(id));

  const lines = [
    ...byPrize(winsRemoved, "Hủy trao"),
    ...byPrize(winsRestored, "Trao lại"),
    ...(absentRemoved.length ? [`Bỏ đánh dấu vắng: ${list(absentRemoved)}`] : []),
    ...(absentRestored.length ? [`Đánh dấu vắng lại: ${list(absentRestored)}`] : []),
  ];
  return { label: snap.label, lines };
}

export function restoreAbsent(d: Data, employeeId: string): Result {
  if (!d.absentIds.includes(employeeId)) return fail("Người này không có trong danh sách vắng");
  let next = pushSnapshot(d, "Khôi phục vắng mặt");
  next = { ...next, absentIds: next.absentIds.filter((x) => x !== employeeId) };
  return ok(withLog(next, "restore", `Có mặt trở lại: ${names(d, [employeeId])}`));
}

export function undo(d: Data): Result {
  const [snap, ...rest] = d.undoStack;
  if (!snap) return fail("Không còn gì để hoàn tác");
  const next: Data = { ...d, wins: snap.wins, absentIds: snap.absentIds, undoStack: rest };
  return ok(withLog(next, "undo", `Hoàn tác: ${snap.label}`));
}

export function resetResults(d: Data): Data {
  const next = pushSnapshot(d, "Reset kết quả");
  return withLog({ ...next, wins: [], absentIds: [] }, "reset", "Reset toàn bộ kết quả quay");
}
