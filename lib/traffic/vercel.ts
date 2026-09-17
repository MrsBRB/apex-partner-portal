// Reads Vercel Web Analytics for the partner portal itself (apex-partner-portal.vercel.app),
// via Vercel's public Web Analytics REST API. Read-only, server-side only.
// Docs: https://vercel.com/docs/analytics/web-analytics-api
//
// Required env vars (set in the Vercel project's Environment Variables, never in code):
//   VERCEL_API_TOKEN  - a personal access token created in Vercel account settings
//   VERCEL_PROJECT_ID - the project id or name, e.g. "apex-partner-portal"
// Optional:
//   VERCEL_TEAM_ID    - only needed if the project lives under a Vercel team, not a
//                        personal account. Omit if you don't have one.

const VERCEL_API_BASE = "https://api.vercel.com/v1/query/web-analytics";

export type DailyPoint = { date: string; pageviews: number; visitors: number };
export type NamedCount = { label: string; pageviews: number; visitors: number };

export type VercelTrafficSummary = {
  configured: boolean;
  error?: string;
  totals?: { pageviews: number; visitors: number };
  daily?: DailyPoint[];
  topPages?: NamedCount[];
  topReferrers?: NamedCount[];
};

function dateRange(days: number) {
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

async function vercelGet(path: string, params: Record<string, string>) {
  const token = process.env.VERCEL_API_TOKEN!;
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const search = new URLSearchParams({ projectId, ...params });
  if (process.env.VERCEL_TEAM_ID) search.set("teamId", process.env.VERCEL_TEAM_ID);
  const res = await fetch(`${VERCEL_API_BASE}/${path}?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Analytics move slowly; a short cache keeps repeated dashboard loads cheap.
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Vercel Web Analytics request failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

export async function getVercelTraffic(days: number): Promise<VercelTrafficSummary> {
  if (!process.env.VERCEL_API_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return { configured: false };
  }
  const range = dateRange(days);
  try {
    const [totalsRes, dailyRes, pagesRes, referrersRes] = await Promise.all([
      vercelGet("visits/count", range),
      vercelGet("visits/aggregate", { ...range, by: "day" }),
      vercelGet("visits/aggregate", { ...range, by: "requestPath", limit: "8" }),
      vercelGet("visits/aggregate", { ...range, by: "referrerHostname", limit: "6" }),
    ]);
    return {
      configured: true,
      totals: {
        pageviews: totalsRes?.data?.pageviews ?? 0,
        visitors: totalsRes?.data?.visitors ?? 0,
      },
      daily: (dailyRes?.data ?? []).map((row: { timestamp: string; pageviews: number; visitors: number }) => ({
        date: row.timestamp.slice(0, 10),
        pageviews: row.pageviews,
        visitors: row.visitors,
      })),
      topPages: (pagesRes?.data ?? []).map((row: { requestPath?: string; pageviews: number; visitors: number }) => ({
        label: row.requestPath || "(unknown)",
        pageviews: row.pageviews,
        visitors: row.visitors,
      })),
      topReferrers: (referrersRes?.data ?? []).map((row: { referrerHostname?: string; pageviews: number; visitors: number }) => ({
        label: row.referrerHostname || "Direct / none",
        pageviews: row.pageviews,
        visitors: row.visitors,
      })),
    };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "Vercel Web Analytics request failed" };
  }
}
