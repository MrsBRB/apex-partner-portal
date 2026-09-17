"use client";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Totals = Record<string, number>;
type DailyPoint = { date: string; [key: string]: string | number };
type NamedCount = { label: string; pageviews: number; visitors: number };

type Section = {
  configured: boolean;
  error?: string;
  totals?: Totals;
  daily?: DailyPoint[];
  topPages?: NamedCount[];
  topReferrers?: NamedCount[];
};

type TrafficResponse = { portal: Section; site: Section };

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
];

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-[#f4f5f7] p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#1a1a2e]">{value.toLocaleString()}</div>
    </div>
  );
}

function TrendChart({ daily, seriesKey, color }: { daily: DailyPoint[]; seriesKey: string; color: string }) {
  if (!daily.length) return null;
  return (
    <div className="mt-5 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(d: string) => d.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            labelFormatter={(d) => d}
            contentStyle={{ borderRadius: 8, borderColor: "#d8dde4", fontSize: 12 }}
          />
          <Line type="monotone" dataKey={seriesKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function NotConfigured({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      <p className="font-bold text-[#1a1a2e]">{title} isn&apos;t connected yet.</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function RequestFailed({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      Couldn&apos;t load this data: {message}
    </div>
  );
}

function NamedCountTable({ title, rows }: { title: string; rows: NamedCount[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <td className="py-1.5 pr-3 text-slate-700">{row.label}</td>
              <td className="py-1.5 pr-3 text-right text-slate-500">{row.visitors.toLocaleString()} visitors</td>
              <td className="py-1.5 text-right font-semibold text-[#1a1a2e]">{row.pageviews.toLocaleString()} views</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminTrafficPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrafficResponse | null>(null);
  // Tracks which range the current `data` (or `loadError`) actually answers, so we
  // can show a loading state the moment `days` changes without setting state
  // synchronously inside the effect body.
  const [answeredDays, setAnsweredDays] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const loading = answeredDays !== days;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/traffic?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setLoadError("");
        setAnsweredDays(days);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Couldn't load traffic data");
        setAnsweredDays(days);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <section className="rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
        <div>
          <h2 className="text-xl font-bold">Site traffic</h2>
          <p className="mt-1 text-sm text-slate-500">
            The partner portal and apexfleetconsulting.com, side by side.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-[#f4f5f7] p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                days === opt.value ? "bg-white text-[#bc5a15] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        {/* Partner portal — Vercel Web Analytics */}
        <div>
          <h3 className="font-bold text-[#1a1a2e]">Partner portal</h3>
          <p className="text-xs text-slate-500">apex-partner-portal.vercel.app · Vercel Web Analytics</p>
          {loading && <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />}
          {!loading && loadError && <div className="mt-4"><RequestFailed message={loadError} /></div>}
          {!loading && !loadError && data && !data.portal.configured && (
            <div className="mt-4">
              <NotConfigured
                title="Vercel Web Analytics"
                steps={[
                  "Create an access token in Vercel account settings.",
                  "Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID if the project is under a team) to this project's Environment Variables in Vercel.",
                  "Redeploy — the numbers will appear here automatically.",
                ]}
              />
            </div>
          )}
          {!loading && !loadError && data && data.portal.configured && data.portal.error && (
            <div className="mt-4"><RequestFailed message={data.portal.error} /></div>
          )}
          {!loading && !loadError && data && data.portal.configured && !data.portal.error && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatTile label="Page views" value={data.portal.totals?.pageviews ?? 0} />
                <StatTile label="Visitors" value={data.portal.totals?.visitors ?? 0} />
              </div>
              <TrendChart daily={data.portal.daily ?? []} seriesKey="pageviews" color="#e87b2f" />
              <NamedCountTable title="Top pages" rows={data.portal.topPages ?? []} />
              <NamedCountTable title="Top referrers" rows={data.portal.topReferrers ?? []} />
            </>
          )}
        </div>

        {/* Main site — Wix Analytics */}
        <div>
          <h3 className="font-bold text-[#1a1a2e]">apexfleetconsulting.com</h3>
          <p className="text-xs text-slate-500">Main site · Wix Analytics</p>
          {loading && <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />}
          {!loading && loadError && <div className="mt-4"><RequestFailed message={loadError} /></div>}
          {!loading && !loadError && data && !data.site.configured && (
            <div className="mt-4">
              <NotConfigured
                title="Wix Analytics"
                steps={[
                  "In the Wix dashboard, go to Settings > API Keys and generate a key scoped to “Site Analytics - read permissions”, restricted to the Apex Fleet Consulting site only.",
                  "Add WIX_API_KEY and WIX_SITE_ID to this project's Environment Variables in Vercel.",
                  "Redeploy — the numbers will appear here automatically.",
                ]}
              />
            </div>
          )}
          {!loading && !loadError && data && data.site.configured && data.site.error && (
            <div className="mt-4"><RequestFailed message={data.site.error} /></div>
          )}
          {!loading && !loadError && data && data.site.configured && !data.site.error && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatTile label="Sessions" value={data.site.totals?.sessions ?? 0} />
                <StatTile label="Unique visitors" value={data.site.totals?.visitors ?? 0} />
                <StatTile label="Forms submitted" value={data.site.totals?.formsSubmitted ?? 0} />
                <StatTile label="Clicks to contact" value={data.site.totals?.clicksToContact ?? 0} />
              </div>
              <TrendChart daily={data.site.daily ?? []} seriesKey="sessions" color="#0d1f35" />
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Wix only keeps 62 days of history and reports site-wide totals — it doesn&apos;t break traffic
                down by page or visitor city the way your daily CSV export does. Keep sending that over when you
                want the detailed view.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
