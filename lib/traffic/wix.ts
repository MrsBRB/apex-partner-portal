// Reads site-wide analytics for apexfleetconsulting.com (the main Wix marketing site)
// via Wix's Analytics Data API. Read-only, server-side only.
// Docs: https://dev.wix.com/docs/api-reference/business-management/analytics/data/get-analytics-data
//
// Required env vars (set in the Vercel project's Environment Variables, never in code):
//   WIX_API_KEY - an API key generated in the Wix account (Settings > API Keys),
//                 scoped to "Site Analytics - read permissions" and restricted to
//                 the Apex Fleet Consulting site only.
//   WIX_SITE_ID - the Wix site id for apexfleetconsulting.com.
//
// Note: Wix only retains 62 days of analytics history, and this endpoint returns
// site-wide totals (sessions, unique visitors, forms submitted, contact clicks) -
// it does not break traffic down by page, city, or referrer the way the Wix
// dashboard export does.

const WIX_API_BASE = "https://www.wixapis.com/analytics/v2/site-analytics/data";
const MEASUREMENT_TYPES = ["TOTAL_SESSIONS", "TOTAL_UNIQUE_VISITORS", "TOTAL_FORMS_SUBMITTED", "CLICKS_TO_CONTACT"] as const;
const WIX_MAX_DAYS = 61; // Wix errors past 61 days back from today.

export type WixDailyPoint = { date: string; sessions: number; visitors: number };

export type WixTrafficSummary = {
  configured: boolean;
  error?: string;
  totals?: { sessions: number; visitors: number; formsSubmitted: number; clicksToContact: number };
  daily?: WixDailyPoint[];
};

export async function getWixTraffic(days: number): Promise<WixTrafficSummary> {
  const apiKey = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!apiKey || !siteId) return { configured: false };

  const cappedDays = Math.min(days, WIX_MAX_DAYS);
  const until = new Date();
  const since = new Date(until.getTime() - cappedDays * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    "dateRange.startDate": since.toISOString().slice(0, 10),
    "dateRange.endDate": until.toISOString().slice(0, 10),
  });
  MEASUREMENT_TYPES.forEach((type) => params.append("measurementTypes", type));

  try {
    const res = await fetch(`${WIX_API_BASE}?${params.toString()}`, {
      headers: { Authorization: apiKey, "wix-site-id": siteId, "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Wix Analytics request failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }
    const body = (await res.json()) as {
      data?: { type: string; total: number; values: { date: string; value: number }[] }[];
    };
    const byType = new Map((body.data ?? []).map((item) => [item.type, item]));
    const sessions = byType.get("TOTAL_SESSIONS");
    const visitors = byType.get("TOTAL_UNIQUE_VISITORS");
    const dates = Array.from(
      new Set([...(sessions?.values ?? []), ...(visitors?.values ?? [])].map((v) => v.date)),
    ).sort();
    const sessionByDate = new Map((sessions?.values ?? []).map((v) => [v.date, v.value]));
    const visitorByDate = new Map((visitors?.values ?? []).map((v) => [v.date, v.value]));

    return {
      configured: true,
      totals: {
        sessions: sessions?.total ?? 0,
        visitors: visitors?.total ?? 0,
        formsSubmitted: byType.get("TOTAL_FORMS_SUBMITTED")?.total ?? 0,
        clicksToContact: byType.get("CLICKS_TO_CONTACT")?.total ?? 0,
      },
      daily: dates.map((date) => ({
        date,
        sessions: sessionByDate.get(date) ?? 0,
        visitors: visitorByDate.get(date) ?? 0,
      })),
    };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "Wix Analytics request failed" };
  }
}
