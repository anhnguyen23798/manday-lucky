"use client";

import { useEffect, type ReactNode } from "react";
import { DEFAULT_EMPLOYEES_LABEL, fetchDefaultEmployees } from "@/lib/defaults";
import { setMuted } from "@/lib/sfx";
import { onRemoteChange } from "@/lib/storage";
import { useApp, useReady } from "@/lib/store";

/** Lần đầu (chưa từng nạp + danh sách trống): nạp public/vio-man.csv */
async function seedIfNeeded() {
  const s = useApp.getState();
  if (s.defaultsLoaded) return;
  if (s.employees.length > 0) {
    s.seedDefaults([], DEFAULT_EMPLOYEES_LABEL); // chỉ đánh dấu, không ghi đè dữ liệu đang có
    return;
  }
  const parsed = await fetchDefaultEmployees();
  if (parsed.error) {
    console.warn(parsed.error);
    return; // không đánh dấu → lần sau thử lại
  }
  useApp.getState().seedDefaults(parsed.rows, DEFAULT_EMPLOYEES_LABEL);
}

/** Nạp dữ liệu từ IndexedDB + danh sách mặc định, rồi nghe thay đổi từ tab khác. */
export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await useApp.persist.rehydrate();
        await seedIfNeeded();
      } finally {
        if (alive) useReady.setState({ ready: true });
      }
    })();
    const off = onRemoteChange(() => void useApp.persist.rehydrate());
    return () => {
      alive = false;
      off();
    };
  }, []);

  const soundOn = useApp((s) => s.settings.soundOn);
  useEffect(() => setMuted(!soundOn), [soundOn]);

  return children;
}
