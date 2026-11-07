"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ParsedSheet } from "@/lib/import-parse";
import { previewImport, type ImportRowStatus } from "@/lib/state";
import { useApp } from "@/lib/store";

const STATUS: Record<ImportRowStatus, { text: string; tone: "mint" | "blush" | "beer" }> = {
  ok: { text: "✅ Hợp lệ", tone: "mint" },
  "missing-name": { text: "❌ Thiếu tên", tone: "blush" },
  "missing-account": { text: "❌ Thiếu account", tone: "blush" },
  "duplicate-account": { text: "⚠️ Account đã có", tone: "beer" },
  "duplicate-in-file": { text: "⚠️ Trùng trong file", tone: "beer" },
};

export function ImportDialog({
  parsed,
  source,
  initialMode = "append",
  onClose,
}: {
  parsed: ParsedSheet;
  source: string;
  initialMode?: "append" | "replace";
  onClose: () => void;
}) {
  const employees = useApp((s) => s.employees);
  const hasWins = useApp((s) => s.wins.length > 0);
  const importEmployees = useApp((s) => s.importEmployees);
  const [mode, setMode] = useState<"append" | "replace">(hasWins ? "append" : initialMode);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ added: number; skipped: number } | null>(null);

  const preview = useMemo(
    () => previewImport(parsed.rows, mode === "replace" ? [] : employees),
    [parsed.rows, employees, mode],
  );
  const okCount = preview.filter((r) => r.status === "ok").length;

  const run = () => {
    const r = importEmployees(parsed.rows, mode);
    if (!r.ok) return setError(r.error);
    setDone({ added: r.added, skipped: r.skipped });
  };

  return (
    <Modal open onClose={onClose} label="Xem trước dữ liệu import" className="w-[min(94vw,820px)]!">
      <div className="flex max-h-[88dvh] flex-col gap-4 rounded-chunky border-4 border-ink bg-cream p-5 shadow-brutal-lg">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="animate-pop-in text-6xl" aria-hidden>
              🎉
            </span>
            <h2 className="font-display text-2xl">Đã thêm {done.added} anh em!</h2>
            {done.skipped > 0 && <p>Bỏ qua {done.skipped} dòng bị lỗi hoặc trùng.</p>}
            <Button variant="tie" onClick={onClose}>
              Ngon lành
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl">Xem trước</h2>
              <span className="max-w-full truncate font-mono text-sm text-ink/70">{source}</span>
              <Badge tone="mint">{okCount} hợp lệ</Badge>
              {preview.length - okCount > 0 && <Badge tone="blush">{preview.length - okCount} bỏ qua</Badge>}
            </div>

            <fieldset className="flex flex-wrap gap-3">
              <legend className="sr-only">Cách import</legend>
              {(
                [
                  ["append", "Thêm vào danh sách hiện có"],
                  ["replace", `Thay thế toàn bộ (${employees.length} người hiện tại)`],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`flex min-h-11 cursor-action items-center gap-2 rounded-chunky border-[3px] border-ink px-3 font-semibold ${
                    mode === v ? "bg-beer" : "bg-white"
                  } ${v === "replace" && hasWins ? "opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={v}
                    checked={mode === v}
                    disabled={v === "replace" && hasWins}
                    onChange={() => setMode(v)}
                    className="size-4 accent-ink"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {hasWins && (
              <p className="text-sm text-ink/75">Đã có người trúng giải nên không thay thế toàn bộ được (Reset kết quả trước).</p>
            )}

            <div className="scroll-slim min-h-0 flex-1 overflow-auto rounded-chunky border-[3px] border-ink bg-white">
              <table className="w-full min-w-[520px] text-left">
                <thead className="sticky top-0 bg-ink text-cream">
                  <tr>
                    <th className="px-3 py-2 font-rounded">Dòng</th>
                    <th className="px-3 py-2 font-rounded">Họ và tên</th>
                    <th className="px-3 py-2 font-rounded">Account</th>
                    <th className="px-3 py-2 font-rounded">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.row} className={r.status === "ok" ? "" : "bg-blush/15"}>
                      <td className="border-t-2 border-ink/15 px-3 py-1.5 text-ink/60">{r.row}</td>
                      <td className="border-t-2 border-ink/15 px-3 py-1.5">{r.fullName || "—"}</td>
                      <td className="border-t-2 border-ink/15 px-3 py-1.5 font-mono text-sm">{r.account || "—"}</td>
                      <td className="border-t-2 border-ink/15 px-3 py-1.5">
                        <Badge tone={STATUS[r.status].tone} className="text-sm!">
                          {STATUS[r.status].text}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p className="font-semibold">⚠️ {error}</p>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button variant="tie" disabled={okCount === 0} onClick={run}>
                Import {okCount} người
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
