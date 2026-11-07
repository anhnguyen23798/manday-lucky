"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Sticker } from "@/components/ui/Sticker";
import { DEFAULT_EMPLOYEES_LABEL, fetchDefaultEmployees } from "@/lib/defaults";
import { matchesSearch, validationMessage, type ValidationError } from "@/lib/employees";
import type { ParsedSheet } from "@/lib/import-parse";
import { useDisplayNames } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { ImportDialog } from "./ImportDialog";

const errText = (e: string) => validationMessage[e as ValidationError] ?? e;

export function EmployeesTab() {
  const employees = useApp((s) => s.employees);
  const wins = useApp((s) => s.wins);
  const absentIds = useApp((s) => s.absentIds);
  const addEmployee = useApp((s) => s.addEmployee);
  const names = useDisplayNames();

  const [fullName, setFullName] = useState("");
  const [account, setAccount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [parsed, setParsed] = useState<{ sheet: ParsedSheet; source: string; isDefault: boolean } | null>(null);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const wonIds = useMemo(() => new Set(wins.map((w) => w.employeeId)), [wins]);
  const absent = useMemo(() => new Set(absentIds), [absentIds]);
  const filtered = useMemo(() => employees.filter((e) => matchesSearch(e, q)), [employees, q]);

  const onAdd = (ev: FormEvent) => {
    ev.preventDefault();
    const r = addEmployee({ fullName, account });
    if (!r.ok) return setFormError(errText(r.error));
    setFullName("");
    setAccount("");
    setFormError(null);
    nameRef.current?.focus();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setFileError(null);
    try {
      const { parseEmployeeFile } = await import("@/lib/excel");
      const res = await parseEmployeeFile(file);
      if (res.error) setFileError(res.error);
      else setParsed({ sheet: res, source: file.name, isDefault: false });
    } catch {
      setFileError("Không đọc được file. Hãy dùng .xlsx, .xls hoặc .csv");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onLoadDefault = async () => {
    setLoadingDefault(true);
    setFileError(null);
    const res = await fetchDefaultEmployees();
    setLoadingDefault(false);
    if (res.error) setFileError(res.error);
    else setParsed({ sheet: res, source: DEFAULT_EMPLOYEES_LABEL, isDefault: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="flex flex-col gap-6">
        <Card tape="mint" className="p-5" tilt={0.6}>
          <h2 className="mb-1 font-display text-xl">Danh sách mặc định</h2>
          <p className="mb-3 text-sm text-ink/75">
            File <code className="rounded bg-cream px-1 font-mono">public/{DEFAULT_EMPLOYEES_LABEL}</code> được tự nạp ở lần
            đầu mở app. Bấm để nạp lại (thêm vào hoặc thay thế danh sách hiện tại).
          </p>
          <Button variant="mint" className="w-full" disabled={loadingDefault} onClick={() => void onLoadDefault()}>
            {loadingDefault ? "Đang tải…" : "↻ Nạp danh sách mặc định"}
          </Button>
        </Card>

        <Card tape="beer" className="p-5">
          <h2 className="mb-3 font-display text-xl">Import file mới</h2>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFile(e.dataTransfer.files[0]);
            }}
            className="flex cursor-action flex-col items-center gap-2 rounded-chunky border-[3px] border-dashed border-ink bg-cream p-5 text-center transition-colors hover:bg-beer/30"
          >
            <Sticker emoji="📄" size={52} tilt={-6} />
            <span className="font-rounded text-lg font-extrabold">{busy ? "Đang đọc file…" : "Kéo thả hoặc bấm để chọn file"}</span>
            <span className="text-sm text-ink/70">2 cột: &quot;Họ và tên&quot; và &quot;Account&quot; (.xlsx, .xls, .csv)</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          {fileError && <p className="mt-2 font-semibold">⚠️ {fileError}</p>}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={async () => (await import("@/lib/excel")).downloadTemplate()}
          >
            ⬇ Tải file mẫu
          </Button>
        </Card>

        <Card className="p-5" tilt={-0.6}>
          <h2 className="mb-3 font-display text-xl">Thêm bằng tay</h2>
          <form onSubmit={onAdd} className="flex flex-col gap-3">
            <Field
              ref={nameRef}
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn An"
              autoComplete="off"
            />
            <Field
              label="Account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="AnNV1"
              autoComplete="off"
              error={formError}
            />
            <Button type="submit" variant="tie">
              + Thêm anh em
            </Button>
          </form>
        </Card>
      </div>

      <Card className="flex min-w-0 flex-col p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl">Danh sách</h2>
          <Badge>{employees.length} người</Badge>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên hoặc account"
            aria-label="Tìm nhân viên"
            className="min-h-11 min-w-0 flex-1 rounded-chunky border-[3px] border-ink bg-white px-3 sm:ml-auto sm:max-w-xs"
          />
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Sticker emoji="🦗" size={64} tilt={8} />
            <p className="font-rounded text-xl font-extrabold">Chưa có anh em nào. Import file hoặc thêm tay nhé!</p>
          </div>
        ) : (
          // lg: lấp đầy chiều cao card (bằng cột trái) và cuộn bên trong; h-0 để bảng dài không kéo giãn hàng grid
          <div className="scroll-slim max-h-[65vh] overflow-auto rounded-chunky border-[3px] border-ink lg:h-0 lg:max-h-none lg:min-h-[360px] lg:grow lg:basis-0">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-ink text-cream">
                <tr>
                  <th className="px-3 py-2 font-rounded">#</th>
                  <th className="px-3 py-2 font-rounded">Họ và tên (hiển thị)</th>
                  <th className="px-3 py-2 font-rounded">Account</th>
                  <th className="px-3 py-2 font-rounded">Trạng thái</th>
                  <th className="px-3 py-2" aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <EmployeeRow
                    key={e.id}
                    index={i + 1}
                    employee={e}
                    display={names.get(e.id) ?? e.fullName}
                    status={wonIds.has(e.id) ? "won" : absent.has(e.id) ? "absent" : "active"}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {parsed && (
        <ImportDialog
          parsed={parsed.sheet}
          source={parsed.source}
          initialMode={parsed.isDefault ? "replace" : "append"}
          onClose={() => setParsed(null)}
        />
      )}
    </div>
  );
}

function EmployeeRow({
  employee,
  display,
  index,
  status,
}: {
  employee: Employee;
  display: string;
  index: number;
  status: "won" | "absent" | "active";
}) {
  const updateEmployee = useApp((s) => s.updateEmployee);
  const removeEmployee = useApp((s) => s.removeEmployee);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(employee.fullName);
  const [acc, setAcc] = useState(employee.account);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const r = updateEmployee(employee.id, { fullName: name, account: acc });
    if (!r.ok) return setError(errText(r.error));
    setEditing(false);
    setError(null);
  };

  const cell = "border-t-2 border-ink/15 px-3 py-2 align-middle";

  return (
    <tr className="odd:bg-cream/50">
      <td className={`${cell} w-12 text-ink/60`}>{index}</td>
      {editing ? (
        <>
          <td className={cell}>
            <input
              aria-label="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-2 border-ink px-2 py-1"
            />
            {error && <span className="text-sm font-semibold">⚠️ {error}</span>}
          </td>
          <td className={cell}>
            <input
              aria-label="Account"
              value={acc}
              onChange={(e) => setAcc(e.target.value)}
              className="w-full rounded-lg border-2 border-ink px-2 py-1"
            />
          </td>
        </>
      ) : (
        <>
          <td className={`${cell} font-semibold`}>{display}</td>
          <td className={`${cell} font-mono text-sm`}>{employee.account}</td>
        </>
      )}
      <td className={cell}>
        {status === "won" ? (
          <Badge tone="mint">🏆 Đã trúng</Badge>
        ) : status === "absent" ? (
          <Badge tone="blush">Vắng</Badge>
        ) : (
          <Badge tone="white">Trong vòng</Badge>
        )}
      </td>
      <td className={`${cell} whitespace-nowrap text-right`}>
        {editing ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="mint" onClick={save}>
              Lưu
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(employee.fullName);
                setAcc(employee.account);
                setError(null);
              }}
            >
              Hủy
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Sửa ${display}`}>
              Sửa
            </Button>
            <Button
              size="sm"
              variant="bbq"
              disabled={status === "won"}
              title={status === "won" ? "Đã trúng giải, không xóa được" : undefined}
              onClick={() => removeEmployee(employee.id)}
              aria-label={`Xóa ${display}`}
            >
              Xóa
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
