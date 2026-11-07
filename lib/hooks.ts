"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildDisplayNames } from "./employees";
import { getEligible } from "./state";
import { getBlob } from "./storage";
import { useApp } from "./store";

/** Object URL cho Blob trong IndexedDB, tự revoke khi đổi key/unmount */
export function useBlobUrl(key: string | null | undefined): string | null {
  const [entry, setEntry] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!key) return;
    let url: string | null = null;
    let alive = true;
    void getBlob(key).then((b) => {
      if (!alive || !b) return;
      url = URL.createObjectURL(b);
      setEntry({ key, url });
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [key]);
  return key && entry?.key === key ? entry.url : null;
}

/** Map id → tên hiển thị (chỉ gắn account khi trùng tên) */
export function useDisplayNames() {
  const employees = useApp((s) => s.employees);
  return useMemo(() => buildDisplayNames(employees), [employees]);
}

export function useEligible() {
  const employees = useApp((s) => s.employees);
  const wins = useApp((s) => s.wins);
  const absentIds = useApp((s) => s.absentIds);
  return useMemo(() => getEligible({ employees, wins, absentIds }), [employees, wins, absentIds]);
}

/** Handler trả về `false` = "không xử lý" → giữ hành vi mặc định của trình duyệt (vd Enter kích hoạt nút đang focus) */
type HotkeyMap = Record<string, (e: KeyboardEvent) => void | boolean>;

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
};

/**
 * Phím tắt toàn cục. Key dạng: " ", "Enter", "Escape", "f", "m", "ctrl+z".
 * Bỏ qua khi đang gõ trong input. Handler luôn là bản mới nhất (ref).
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      // đang có hộp thoại mở → để hộp thoại tự xử lý phím (không quay/hoàn tác chồng lên)
      if (document.querySelector("dialog[open]")) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const combo = `${e.ctrlKey || e.metaKey ? "ctrl+" : ""}${k}`;
      const fn = ref.current[combo];
      if (fn && fn(e) !== false) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** true sau khi mount ở client (tránh hydration mismatch cho giá trị chỉ có ở client) */
const noopSubscribe = () => () => {};
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
