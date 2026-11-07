"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Sticker } from "@/components/ui/Sticker";
import { useBlobUrl } from "@/lib/hooks";
import { compressImage } from "@/lib/image";
import { uid } from "@/lib/random";
import { awardedCount, sortedPrizes } from "@/lib/state";
import { delBlob, putBlob } from "@/lib/storage";
import { useApp } from "@/lib/store";
import type { Prize } from "@/lib/types";

async function saveImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const key = `img:${uid()}`;
  await putBlob(key, blob);
  return key;
}

const FUN_PRIZES = ["🧦 Đôi tất không thủng", "🍽️ Phiếu miễn rửa bát", "☕ Ly cà phê đen đá", "🩺 Phiếu nhắc khám sức khỏe"];

export function PrizesTab() {
  const prizes = useApp((s) => s.prizes);
  const addPrize = useApp((s) => s.addPrize);
  const sorted = useMemo(() => sortedPrizes(prizes), [prizes]);
  const total = prizes.reduce((n, p) => n + p.quantity, 0);

  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = useBlobUrl(imageKey);

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      if (imageKey) await delBlob(imageKey);
      setImageKey(await saveImage(file));
    } catch {
      setError("Không đọc được ảnh");
    } finally {
      setBusy(false);
    }
  };

  const onAdd = (ev: FormEvent) => {
    ev.preventDefault();
    const r = addPrize({ name, quantity: Number(qty), imageKey });
    if (!r.ok) return setError(r.error);
    setName("");
    setQty("1");
    setImageKey(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card tape="blush" className="h-fit p-5">
        <h2 className="mb-3 font-display text-xl">Thêm phần quà</h2>
        {/* noValidate: dùng thông báo tiếng Việt của app thay cho tooltip mặc định (tiếng Anh) của trình duyệt */}
        <form onSubmit={onAdd} noValidate className="flex flex-col gap-3">
          <Field
            label="Tên quà"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={FUN_PRIZES[prizes.length % FUN_PRIZES.length]}
            autoComplete="off"
          />
          <Field
            label="Số lượng"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setError(null);
            }}
          />
          <div className="flex flex-col gap-1">
            <span className="font-rounded text-base font-extrabold">Ảnh (tùy chọn)</span>
            <div className="flex items-center gap-3">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-chunky border-[3px] border-ink bg-cream">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ
                  <img src={previewUrl} alt="Ảnh quà" className="size-full object-cover" />
                ) : (
                  <span className="text-3xl" aria-hidden>
                    🎁
                  </span>
                )}
              </div>
              <label className="cursor-action rounded-chunky border-[3px] border-ink bg-white px-3 py-2 font-semibold shadow-brutal-sm hover:-translate-y-0.5">
                {busy ? "Đang nén ảnh…" : imageKey ? "Đổi ảnh" : "Chọn ảnh"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onImage(e.target.files?.[0])}
                />
              </label>
              {imageKey && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void delBlob(imageKey);
                    setImageKey(null);
                  }}
                >
                  Bỏ ảnh
                </Button>
              )}
            </div>
          </div>
          {error && <p className="font-semibold">⚠️ {error}</p>}
          <Button type="submit" variant="tie" disabled={busy}>
            + Thêm quà
          </Button>
        </form>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl">Kho quà</h2>
          <Badge>{prizes.length} loại</Badge>
          <Badge tone="mint">{total} phần</Badge>
          <p className="w-full text-sm text-ink/70">
            Thứ tự ở đây là thứ tự hiện trên Sân khấu. Mẹo: xếp quà nhỏ lên trước, quà to để cuối cho hồi hộp.
          </p>
        </div>
        {sorted.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Sticker emoji="🎁" size={64} tilt={-8} />
            <p className="font-rounded text-xl font-extrabold">Kho quà trống trơn. Thêm quà đi nào!</p>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {sorted.map((p, i) => (
              <PrizeItem key={p.id} prize={p} first={i === 0} last={i === sorted.length - 1} index={i} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PrizeItem({ prize, first, last, index }: { prize: Prize; first: boolean; last: boolean; index: number }) {
  const wins = useApp((s) => s.wins);
  const updatePrize = useApp((s) => s.updatePrize);
  const removePrize = useApp((s) => s.removePrize);
  const movePrize = useApp((s) => s.movePrize);
  const url = useBlobUrl(prize.imageKey);
  const awarded = awardedCount({ wins }, prize.id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(prize.name);
  const [qty, setQty] = useState(String(prize.quantity));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    const r = updatePrize(prize.id, { name, quantity: Number(qty) });
    if (!r.ok) return setError(r.error);
    setEditing(false);
    setError(null);
  };

  const changeImage = async (file: File | undefined) => {
    if (!file) return;
    const old = prize.imageKey;
    const key = await saveImage(file);
    updatePrize(prize.id, { imageKey: key });
    if (old) void delBlob(old);
  };

  const remove = () => {
    const r = removePrize(prize.id);
    if (!r.ok) return setError(r.error);
    if (prize.imageKey) void delBlob(prize.imageKey);
  };

  return (
    <li
      className="relative flex flex-col gap-3 rounded-chunky border-4 border-ink bg-white p-4 shadow-brutal"
      style={{ rotate: `${index % 2 ? 0.6 : -0.6}deg` }}
    >
      <div className="flex gap-3">
        <label className="group relative grid size-24 shrink-0 cursor-action place-items-center overflow-hidden rounded-chunky border-[3px] border-ink bg-cream">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-4xl" aria-hidden>
              🎁
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-xs font-semibold text-cream opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            Đổi ảnh
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`Đổi ảnh ${prize.name}`}
            onChange={(e) => void changeImage(e.target.files?.[0])}
          />
        </label>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                aria-label="Tên quà"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border-2 border-ink px-2 py-1"
              />
              <input
                aria-label="Số lượng"
                type="number"
                min={Math.max(1, awarded)}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-24 rounded-lg border-2 border-ink px-2 py-1"
              />
            </div>
          ) : (
            <>
              <h3 className="font-rounded text-xl font-extrabold leading-tight break-words">{prize.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="beer">x{prize.quantity}</Badge>
                <Badge tone={awarded >= prize.quantity ? "ink" : "mint"}>
                  Đã trao {awarded}/{prize.quantity}
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm font-semibold">⚠️ {error}</p>}
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" variant="mint" onClick={save}>
              Lưu
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(prize.name);
                setQty(String(prize.quantity));
                setError(null);
              }}
            >
              Hủy
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Sửa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={first}
              onClick={() => movePrize(prize.id, -1)}
              aria-label={`Đưa lên: ${prize.name}`}
              title="Đưa lên"
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={last}
              onClick={() => movePrize(prize.id, 1)}
              aria-label={`Đưa xuống: ${prize.name}`}
              title="Đưa xuống"
            >
              ↓
            </Button>
            {prize.imageKey && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const k = prize.imageKey;
                  updatePrize(prize.id, { imageKey: null });
                  if (k) void delBlob(k);
                }}
              >
                Bỏ ảnh
              </Button>
            )}
            <Button
              size="sm"
              variant="bbq"
              className="ml-auto"
              disabled={awarded > 0}
              onClick={() => setConfirmDelete(true)}
              aria-label={`Xóa quà ${prize.name}`}
            >
              Xóa
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Xóa phần quà này?"
        emoji="🗑️"
        confirmLabel="Xóa quà"
        confirmVariant="bbq"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove();
        }}
      >
        <p className="rounded-[10px] border-[3px] border-ink bg-white px-3 py-2 text-lg font-semibold">
          🎁 {prize.name} <span className="font-normal text-ink/70">x{prize.quantity}</span>
        </p>
        <p>Quà và ảnh của quà sẽ bị xóa, không hoàn tác được.</p>
      </ConfirmDialog>
    </li>
  );
}
