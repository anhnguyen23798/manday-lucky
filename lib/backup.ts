/** Export / Import toàn bộ dữ liệu (kể cả ảnh, nhạc) ra file JSON */
import { blobToDataUrl, dataUrlToBlob } from "./image";
import { delBlob, getBlob, putBlob } from "./storage";
import { DATA_VERSION, type Data } from "./types";

type Backup = {
  app: "manday-lucky";
  version: number;
  exportedAt: number;
  data: Data;
  blobs: Record<string, string>;
};

function blobKeys(d: Data): string[] {
  const keys = d.prizes.map((p) => p.imageKey).filter((k): k is string => !!k);
  if (d.settings.bgMusicKey) keys.push(d.settings.bgMusicKey);
  return keys;
}

export async function exportBackup(d: Data): Promise<Blob> {
  const blobs: Record<string, string> = {};
  for (const k of blobKeys(d)) {
    const b = await getBlob(k);
    if (b) blobs[k] = await blobToDataUrl(b);
  }
  const backup: Backup = { app: "manday-lucky", version: DATA_VERSION, exportedAt: Date.now(), data: d, blobs };
  return new Blob([JSON.stringify(backup)], { type: "application/json" });
}

const isArr = Array.isArray;

export async function parseBackup(file: File): Promise<Data> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("File không phải JSON hợp lệ");
  }
  const b = raw as Partial<Backup>;
  if (b?.app !== "manday-lucky") throw new Error("File không phải bản sao lưu của Manday Lucky");
  if (b.version !== DATA_VERSION) throw new Error(`Phiên bản dữ liệu ${b.version} không được hỗ trợ`);
  const d = b.data as Data | undefined;
  if (!d || !isArr(d.employees) || !isArr(d.prizes) || !isArr(d.wins) || !isArr(d.absentIds) || !d.settings)
    throw new Error("Dữ liệu trong file bị thiếu hoặc hỏng");
  for (const [k, url] of Object.entries(b.blobs ?? {})) {
    if (typeof url === "string" && url.startsWith("data:")) await putBlob(k, await dataUrlToBlob(url));
  }
  return {
    ...d,
    log: isArr(d.log) ? d.log : [],
    undoStack: isArr(d.undoStack) ? d.undoStack : [],
    // dữ liệu nhập từ file sao lưu là chủ ý của admin → không tự nạp mặc định đè lên
    defaultsLoaded: true,
  };
}

export async function deleteAllBlobs(d: Data) {
  await Promise.all(blobKeys(d).map((k) => delBlob(k)));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
