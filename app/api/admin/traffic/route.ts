import { adminEmails, getUser } from "@/lib/auth";
import { getVercelTraffic } from "@/lib/traffic/vercel";
import { getWixTraffic } from "@/lib/traffic/wix";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user?.email || !adminEmails().includes(user.email.toLowerCase()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 60);

  const [portal, site] = await Promise.all([getVercelTraffic(days), getWixTraffic(days)]);
  return Response.json({ portal, site });
}
