"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useBlobUrl } from "@/lib/hooks";
import { uid } from "@/lib/random";
import { delBlob, putBlob } from "@/lib/storage";
import { useApp } from "@/lib/store";
import { DEFAULT_EVENT_TITLE } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsTab() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const [title, setTitle] = useState(settings.eventTitle);
  const musicUrl = useBlobUrl(settings.bgMusicKey);
  const [musicError, setMusicError] = useState<string | null>(null);

  const onMusic = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return setMusicError("File nhạc tối đa 15MB");
    setMusicError(null);
    const old = settings.bgMusicKey;
    const key = `music:${uid()}`;
    await putBlob(key, file);
    updateSettings({ bgMusicKey: key });
    if (old) void delBlob(old);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card tape="sky" className="flex flex-col gap-4 p-5">
        <h2 className="font-display text-xl">Sự kiện</h2>
        <Field
          label="Tên sự kiện (hiện trên header và màn chờ)"
          value={title}
          maxLength={40}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const next = title.trim() || DEFAULT_EVENT_TITLE;
            setTitle(next); // ô nhập hiển thị đúng giá trị đã lưu (kể cả khi bị để trống → mặc định)
            updateSettings({ eventTitle: next });
          }}
        />
        <Field
          label="Giờ bắt đầu (đếm ngược ở màn chờ)"
          type="datetime-local"
          value={toLocalInput(settings.eventStartAt)}
          onChange={(e) => {
            const v = e.target.value;
            updateSettings({ eventStartAt: v ? new Date(v).getTime() : null });
          }}
        />
        {settings.eventStartAt && (
          <Button size="sm" variant="ghost" className="self-start" onClick={() => updateSettings({ eventStartAt: null })}>
            Bỏ đếm ngược
          </Button>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5" tilt={0.6}>
        <h2 className="font-display text-xl">Âm thanh</h2>
        <label className="flex min-h-12 cursor-action items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={settings.soundOn}
            onChange={(e) => updateSettings({ soundOn: e.target.checked })}
            className="size-6 accent-ink"
          />
          Hiệu ứng âm thanh khi quay (tick, trống, kèn)
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-rounded text-base font-extrabold">Nhạc nền màn chờ (tùy chọn, mp3)</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-action rounded-chunky border-[3px] border-ink bg-white px-3 py-2 font-semibold shadow-brutal-sm hover:-translate-y-0.5">
              {settings.bgMusicKey ? "Đổi nhạc" : "Chọn file nhạc"}
              <input type="file" accept="audio/*" className="sr-only" onChange={(e) => void onMusic(e.target.files?.[0])} />
            </label>
            {settings.bgMusicKey && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const k = settings.bgMusicKey;
                  updateSettings({ bgMusicKey: null });
                  if (k) void delBlob(k);
                }}
              >
                Bỏ nhạc
              </Button>
            )}
          </div>
          {musicError && <p className="font-semibold">⚠️ {musicError}</p>}
          {musicUrl && <audio controls src={musicUrl} className="w-full" />}
          <p className="text-sm text-ink/70">Trình duyệt chỉ cho phát nhạc sau khi có người bấm vào trang.</p>
        </div>
      </Card>
    </div>
  );
}
