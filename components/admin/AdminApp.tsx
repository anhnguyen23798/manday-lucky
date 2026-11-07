"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/Badge";
import { Sticker } from "@/components/ui/Sticker";
import { useApp, useReady } from "@/lib/store";
import { DataTab } from "./DataTab";
import { EmployeesTab } from "./EmployeesTab";
import { PrizesTab } from "./PrizesTab";
import { SettingsTab } from "./SettingsTab";

const TABS = [
  { id: "employees", label: "Anh em", emoji: "🧔" },
  { id: "prizes", label: "Phần quà", emoji: "🎁" },
  { id: "settings", label: "Cài đặt", emoji: "⚙️" },
  { id: "data", label: "Dữ liệu & Nhật ký", emoji: "🗂️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminApp() {
  const ready = useReady((s) => s.ready);
  const [tab, setTab] = useState<TabId>("employees");
  const employees = useApp((s) => s.employees.length);
  const prizes = useApp((s) => s.prizes.length);

  return (
    <>
      <AppHeader />
      {!ready ? (
        <Loading />
      ) : (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="font-display text-3xl md:text-4xl">Hậu trường</h1>
            <Sticker emoji="🛠️" tilt={12} size={44} />
            <p className="w-full text-base text-ink/75 md:ml-2 md:w-auto">
              Setup anh em và phần quà trước giờ G. Mọi thay đổi tự lưu và đồng bộ sang tab Sân khấu.
            </p>
          </div>

          <div role="tablist" aria-label="Mục quản lý" className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = t.id === "employees" ? employees : t.id === "prizes" ? prizes : null;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`flex min-h-12 items-center gap-2 rounded-chunky border-[3px] border-ink px-4 font-rounded text-lg font-extrabold transition-transform ${
                    active ? "-rotate-1 bg-beer shadow-brutal-sm" : "bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <span aria-hidden>{t.emoji}</span>
                  {t.label}
                  {count !== null && <Badge tone={active ? "white" : "beer"}>{count}</Badge>}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "employees" && <EmployeesTab />}
            {tab === "prizes" && <PrizesTab />}
            {tab === "settings" && <SettingsTab />}
            {tab === "data" && <DataTab />}
          </div>
        </main>
      )}
    </>
  );
}
