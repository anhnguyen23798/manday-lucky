"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { Modal } from "@/components/ui/Modal";
import { deleteAllBlobs, downloadBlob, exportBackup, parseBackup } from "@/lib/backup";
import { copy } from "@/lib/copy";
import { useApp } from "@/lib/store";
import type { Data, LogType } from "@/lib/types";

const LOG_FILTERS: { id: LogType | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "win", label: "🏆 Trúng" },
  { id: "skip", label: "🙈 Vắng" },
  { id: "restore", label: "↩ Khôi phục" },
  { id: "undo", label: "⟲ Hoàn tác" },
  { id: "reset", label: "💥 Reset" },
  { id: "import", label: "📄 Import" },
];

const LOG_ICON: Record<LogType, string> = {
  import: "📄",
  employee: "🧔",
  prize: "🎁",
  win: "🏆",
  skip: "🙈",
  restore: "↩️",
  undo: "⟲",
  reset: "💥",
  data: "🗂️",
};

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit" });

function snapshot(): Data {
  const s = useApp.getState();
  return {
    employees: s.employees,
    prizes: s.prizes,
    wins: s.wins,
    absentIds: s.absentIds,
    log: s.log,
    settings: s.settings,
    undoStack: s.undoStack,
    defaultsLoaded: s.defaultsLoaded,
  };
}

export function DataTab() {
  const log = useApp((s) => s.log);
  const winsCount = useApp((s) => s.wins.length);
  const resetResults = useApp((s) => s.resetResults);
  const wipeAll = useApp((s) => s.wipeAll);
  const replaceData = useApp((s) => s.replaceData);

  const [filter, setFilter] = useState<LogType | "all">("all");
  const [confirm, setConfirm] = useState<null | "reset" | "wipe">(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Data | null>(null);

  const shown = useMemo(() => (filter === "all" ? log : log.filter((l) => l.type === filter)), [log, filter]);

  const onExport = async () => {
    const blob = await exportBackup(snapshot());
    const d = new Date();
    downloadBlob(blob, `manday-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${d.getHours()}${d.getMinutes()}.json`);
    setMsg("Đã xuất file sao lưu ✅");
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(await parseBackup(file));
      setMsg(null);
    } catch (e) {
      setMsg(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="flex flex-col gap-6">
        <Card tape="mint" className="flex flex-col gap-3 p-5">
          <h2 className="font-display text-xl">Sao lưu</h2>
          <p className="text-sm text-ink/75">
            Dữ liệu chỉ nằm trong trình duyệt này. Nên xuất file sao lưu trước sự kiện, hoặc để chuyển sang máy khác.
          </p>
          <Button variant="mint" onClick={onExport}>
            ⬇ Xuất JSON
          </Button>
          <label className="inline-flex min-h-12 cursor-action items-center justify-center rounded-chunky border-[3px] border-ink bg-white px-5 font-display uppercase tracking-wide shadow-brutal-sm hover:-translate-y-0.5">
            ⬆ Nhập JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                void onImportFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {msg && <p className="font-semibold">{msg}</p>}
        </Card>

        <Card className="flex flex-col gap-3 border-bbq! p-5" tilt={-0.5}>
          <h2 className="font-display text-xl">Vùng nguy hiểm</h2>
          <Button variant="beer" disabled={winsCount === 0} onClick={() => setConfirm("reset")}>
            Reset kết quả quay
          </Button>
          <p className="text-sm text-ink/75">Xóa người trúng và danh sách vắng mặt, giữ nguyên anh em và quà.</p>
          <Button variant="bbq" onClick={() => setConfirm("wipe")}>
            Xóa toàn bộ dữ liệu
          </Button>
        </Card>
      </div>

      <Card className="flex min-w-0 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 font-display text-xl">Nhật ký</h2>
          {LOG_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-10 rounded-pill border-[3px] border-ink px-3 text-sm font-semibold ${
                filter === f.id ? "bg-ink text-cream" : "bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="py-10 text-center font-rounded text-lg font-extrabold">Chưa có gì để ghi. Yên bình quá 😌</p>
        ) : (
          <ol className="scroll-slim flex max-h-[65vh] flex-col gap-2 overflow-auto pr-1 lg:h-0 lg:max-h-none lg:min-h-[360px] lg:grow lg:basis-0">
            {shown.map((l) => (
              <li key={l.id} className="flex items-start gap-3 rounded-chunky border-2 border-ink/20 bg-cream/60 px-3 py-2">
                <span aria-hidden className="text-lg">
                  {LOG_ICON[l.type]}
                </span>
                <span className="flex-1 break-words">{l.text}</span>
                <time className="shrink-0 font-mono text-xs text-ink/60" dateTime={new Date(l.at).toISOString()}>
                  {fmtTime(l.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} label={copy.reset.title}>
        <div className="flex flex-col gap-4 rounded-chunky border-4 border-ink bg-cream p-6 shadow-brutal-lg">
          <h2 className="font-display text-2xl">{copy.reset.title}</h2>
          <p>
            {confirm === "wipe"
              ? "Toàn bộ anh em, quà, ảnh, kết quả và nhật ký sẽ bị xóa vĩnh viễn. Không hoàn tác được đâu!"
              : copy.reset.body}
          </p>
          <HoldToConfirm
            onConfirm={async () => {
              if (confirm === "wipe") {
                await deleteAllBlobs(snapshot());
                wipeAll();
              } else resetResults();
              setConfirm(null);
            }}
          />
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Thôi, để sau
          </Button>
        </div>
      </Modal>

      <Modal open={pendingImport !== null} onClose={() => setPendingImport(null)} label="Xác nhận nhập dữ liệu">
        {pendingImport && (
          <div className="flex flex-col gap-4 rounded-chunky border-4 border-ink bg-cream p-6 shadow-brutal-lg">
            <h2 className="font-display text-2xl">Ghi đè dữ liệu?</h2>
            <div className="flex flex-wrap gap-2">
              <Badge>{pendingImport.employees.length} anh em</Badge>
              <Badge tone="mint">{pendingImport.prizes.length} loại quà</Badge>
              <Badge tone="blush">{pendingImport.wins.length} lượt trúng</Badge>
            </div>
            <p>Dữ liệu hiện tại sẽ bị thay bằng nội dung trong file.</p>
            <HoldToConfirm
              label="GIỮ 2 GIÂY ĐỂ GHI ĐÈ"
              onConfirm={() => {
                replaceData(pendingImport);
                setPendingImport(null);
                setMsg("Đã nhập dữ liệu ✅");
              }}
            />
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Hủy
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
