"use client";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AdminNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: number;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationCenter({ initial }: { initial: AdminNotification[] }) {
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.readAt).length;

  async function mark(id?: number) {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    if (res.ok) {
      setItems(items.map((n) => (id && n.id !== id ? n : { ...n, readAt: new Date().toISOString() })));
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="relative rounded-lg bg-[#fff0e5] p-2 text-[#e87b2f]">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
          <h2 className="text-sm font-bold">
            Notifications
            {unread > 0 && <span className="ml-1.5 font-normal text-slate-400">({unread} unread)</span>}
          </h2>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => mark()}>
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.readAt && mark(n.id)}
              className={`flex w-full items-start gap-2.5 border-b px-4 py-2 text-left last:border-0 hover:bg-slate-50 ${
                n.readAt ? "" : "bg-orange-50/60"
              }`}
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-[#e87b2f]"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`truncate text-sm ${n.readAt ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                    {n.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="truncate text-xs text-slate-500">{n.message}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
