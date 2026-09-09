import { getUser } from "@/lib/auth";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = user.email.toLowerCase();
  const body = (await request.json()) as { action?: string; signerName?: string; consent?: boolean };
  const supabase = createAdminClient();
  const { data: partner } = await supabase.from("partners").select("*").eq("email", email).order("id", { ascending: false }).limit(1).maybeSingle();
  if (!partner || partner.status !== "approved") return Response.json({ error: "Agreement is not available" }, { status: 403 });
  const now = new Date().toISOString();
  let values: Record<string, unknown>;
  let notice: { type: string; title: string; message: string };
  if (body.action === "view") {
    values = { agreement_status: "viewed", agreement_viewed_at: partner.agreement_viewed_at || now };
    notice = { type: "agreement_viewed", title: "Agreement viewed", message: `${partner.contact_name} opened the Referral Partner Agreement.` };
  } else if (body.action === "decline") {
    values = { agreement_status: "declined", agreement_declined_at: now };
    notice = { type: "agreement_declined", title: "Agreement declined", message: `${partner.contact_name} declined the Referral Partner Agreement.` };
  } else if (body.action === "sign") {
    const name = body.signerName?.trim();
    if (!name || !body.consent) return Response.json({ error: "Name and consent are required" }, { status: 400 });
    values = { agreement_status: "signed", agreement_viewed_at: partner.agreement_viewed_at || now, agreement_signed_at: now, accepted_at: now, signer_name: name, signer_email: email, signature_consent: true };
    notice = { type: "agreement_signed", title: "Agreement signed", message: `${name} signed the Referral Partner Agreement for ${partner.company_name}.` };
  } else return Response.json({ error: "Invalid action" }, { status: 400 });
  const { data: record, error } = await supabase.from("partners").update(values).eq("id", partner.id).select().single();
  if (error) throw error;
  if (body.action !== "view" || !partner.agreement_viewed_at) await supabase.from("notifications").insert({ ...notice, entity_type: "partner", entity_id: partner.id });
  return Response.json({ record: toCamelRecord(record) });
}
