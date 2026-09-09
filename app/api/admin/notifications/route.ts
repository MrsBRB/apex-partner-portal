import { adminEmails, getUser } from "@/lib/auth";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.email || !adminEmails().includes(user.email.toLowerCase())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: number; all?: boolean };
  const supabase = createAdminClient(); const now = new Date().toISOString();
  if (body.all) { await supabase.from("notifications").update({ read_at: now }).is("read_at", null); return Response.json({ ok: true, readAt: now }); }
  if (!body.id) return Response.json({ error: "Notification id required" }, { status: 400 });
  const { data: record } = await supabase.from("notifications").update({ read_at: now }).eq("id", body.id).select().single();
  return Response.json({ record: toCamelRecord(record) });
}
