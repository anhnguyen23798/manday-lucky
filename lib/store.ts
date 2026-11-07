"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as S from "./state";
import { idbStorage, STORE_KEY } from "./storage";
import {
  DATA_VERSION,
  DEFAULT_EVENT_TITLE,
  emptyData,
  LEGACY_EVENT_TITLES,
  type Data,
  type Settings,
} from "./types";
import type { EmployeeInput } from "./employees";

type Outcome = { ok: true } | { ok: false; error: string };

type Actions = {
  addEmployee: (input: EmployeeInput) => Outcome;
  updateEmployee: (id: string, input: EmployeeInput) => Outcome;
  removeEmployee: (id: string) => Outcome;
  importEmployees: (
    rows: (EmployeeInput & { row: number })[],
    mode: "append" | "replace",
  ) => { ok: true; added: number; skipped: number } | { ok: false; error: string };
  seedDefaults: (rows: (EmployeeInput & { row: number })[], source: string) => void;
  addPrize: (input: { name: string; quantity: number; imageKey: string | null }) => Outcome;
  updatePrize: (id: string, patch: Parameters<typeof S.updatePrize>[2]) => Outcome;
  removePrize: (id: string) => Outcome;
  movePrize: (id: string, dir: -1 | 1) => void;
  resolveDraw: (prizeId: string, awardIds: string[], absentIds: string[]) => Outcome;
  restoreAbsent: (employeeId: string) => Outcome;
  markWinnerAbsent: (winId: string) => Outcome;
  undo: () => Outcome;
  resetResults: () => void;
  wipeAll: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceData: (data: Data) => void;
};

export type AppStore = Data & Actions;

/**
 * Cờ "đã đọc xong IndexedDB lần đầu". Tách ra store riêng KHÔNG persist,
 * vì setState trên store persist sẽ ghi + broadcast → 2 tab rehydrate qua lại vô hạn.
 */
export const useReady = create<{ ready: boolean }>(() => ({ ready: false }));

export const useApp = create<AppStore>()(
  persist(
    (set, get) => {
      const data = (): Data => {
        const { employees, prizes, wins, absentIds, log, settings, undoStack, defaultsLoaded } = get();
        return { employees, prizes, wins, absentIds, log, settings, undoStack, defaultsLoaded };
      };
      const apply = (r: S.Result): Outcome => {
        if (!r.ok) return r;
        set(r.data);
        return { ok: true };
      };
      return {
        ...emptyData(),
        addEmployee: (input) => apply(S.addEmployee(data(), input)),
        updateEmployee: (id, input) => apply(S.updateEmployee(data(), id, input)),
        removeEmployee: (id) => apply(S.removeEmployee(data(), id)),
        importEmployees: (rows, mode) => {
          const r = S.importEmployees(data(), rows, mode);
          if (!r.ok) return r;
          set(r.data.data);
          return { ok: true, added: r.data.added, skipped: r.data.skipped };
        },
        seedDefaults: (rows, source) => {
          const before = data();
          const next = S.seedDefaults(before, rows, source);
          if (next !== before) set(next);
        },
        addPrize: (input) => apply(S.addPrize(data(), input)),
        updatePrize: (id, patch) => apply(S.updatePrize(data(), id, patch)),
        removePrize: (id) => apply(S.removePrize(data(), id)),
        movePrize: (id, dir) => set(S.movePrize(data(), id, dir)),
        resolveDraw: (prizeId, awardIds, absentIds) => apply(S.resolveDraw(data(), prizeId, awardIds, absentIds)),
        restoreAbsent: (id) => apply(S.restoreAbsent(data(), id)),
        markWinnerAbsent: (winId) => apply(S.markWinnerAbsent(data(), winId)),
        undo: () => apply(S.undo(data())),
        resetResults: () => set(S.resetResults(data())),
        wipeAll: () => set({ ...emptyData() }),
        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
        replaceData: (d) => set({ ...emptyData(), ...d }),
      };
    },
    {
      name: STORE_KEY,
      version: DATA_VERSION,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      partialize: (s): Data => ({
        employees: s.employees,
        prizes: s.prizes,
        wins: s.wins,
        absentIds: s.absentIds,
        log: s.log,
        settings: s.settings,
        undoStack: s.undoStack,
        defaultsLoaded: s.defaultsLoaded,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Data>;
        const settings = { ...current.settings, ...(p.settings ?? {}) };
        // tiêu đề vẫn là mặc định cũ (chưa sửa tay) → đổi sang mặc định mới
        if (LEGACY_EVENT_TITLES.includes(settings.eventTitle)) settings.eventTitle = DEFAULT_EVENT_TITLE;
        return { ...current, ...p, settings };
      },
      // useReady được bật trong StoreProvider sau khi nạp xong danh sách mặc định
    },
  ),
);
