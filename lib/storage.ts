/**
 * Lưu trữ IndexedDB (qua idb-keyval) + đồng bộ giữa các tab bằng BroadcastChannel.
 * Chỉ dùng ở client.
 */
import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

export const STORE_KEY = "manday-lucky";
const CHANNEL = "manday";

const tabId = Math.random().toString(36).slice(2);
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

type SyncMessage = { from: string; type: "state" };

/** StateStorage cho zustand persist: ghi xong mới báo cho tab khác */
export const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
    getChannel()?.postMessage({ from: tabId, type: "state" } satisfies SyncMessage);
  },
  removeItem: async (name) => {
    await del(name);
    getChannel()?.postMessage({ from: tabId, type: "state" } satisfies SyncMessage);
  },
};

/** Lắng nghe thay đổi từ tab khác. Trả về hàm hủy. */
export function onRemoteChange(cb: () => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (ev: MessageEvent<SyncMessage>) => {
    if (ev.data?.from !== tabId && ev.data?.type === "state") cb();
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}

// ---------- Blob (ảnh quà, nhạc nền) ----------

export const putBlob = (key: string, blob: Blob) => set(key, blob);
export const getBlob = (key: string) => get<Blob>(key);
export const delBlob = (key: string) => del(key);
