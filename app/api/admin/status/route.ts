import { adminEmails, getUser } from "@/lib/auth";
import { sendAgreementEmail, sendDeclineEmail, sendReferralPaidEmail } from "@/lib/email";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.email || !adminEmails().includes(user.email.toLowerCase())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { kind?: string; id?: number; status?: string; action?: string; category?: string; compensation?: number; routingStatus?: string };
  const supabase = createAdminClient();
  if (body.kind === "partner") {
    const { data: partner } = await supabase.from("partners").select("*").eq("id", Number(body.id)).maybeSingle();
    if (!partner) return Response.json({ error: "Partner not found" }, { status: 404 });
    if (body.status === "approved" && partner.status !== "approved") {
      const now = new Date().toISOString();
      const { data: users } = await supabase.auth.admin.listUsers();
      if (!users.users.some((candidate) => candidate.email?.toLowerCase() === partner.email.toLowerCase())) {
        const { error: userError } = await supabase.auth.admin.createUser({ email: partner.email, email_confirm: true });
        if (userError) return Response.json({ error: `Partner login could not be created: ${userError.message}` }, { status: 502 });
      }
      await supabase.from("partners").update({ status: "approved", agreement_status: "sent", agreement_sent_at: partner.agreement_sent_at || now, agreement_email_status: "sending", agreement_email_error: null }).eq("id", partner.id);
      const delivery = await sendAgreementEmail({ email: partner.email, contactName: partner.contact_name, companyName: partner.company_name });
      const values = delivery.ok ? { agreement_email_status: "sent", agreement_email_sent_at: now, agreement_email_message_id: delivery.messageId, agreement_email_error: null } : { agreement_email_status: "failed", agreement_email_error: delivery.error };
      const { data: record } = await supabase.from("partners").update(values).eq("id", partner.id).select().single();
      await supabase.from("notifications").insert({ type: delivery.ok ? "agreement_sent" : "agreement_email_failed", title: delivery.ok ? "Agreement sent" : "Agreement email needs attention", message: delivery.ok ? `The agreement and access instructions were emailed to ${partner.email}.` : `The agreement is available in ${partner.contact_name}'s portal, but the email was not delivered: ${delivery.error}`, entity_type: "partner", entity_id: partner.id });
      return Response.json({ record: toCamelRecord(record), warning: delivery.ok ? null : delivery.error });
    }
    if (body.action === "resend_agreement_email") {
      if (partner.status !== "approved" || partner.agreement_status === "not_sent") return Response.json({ error: "Approve the application before sending the agreement." }, { status: 400 });
      const delivery = await sendAgreementEmail({ email: partner.email, contactName: partner.contact_name, companyName: partner.company_name });
      const now = new Date().toISOString();
      const values = delivery.ok ? { agreement_email_status: "sent", agreement_email_sent_at: now, agreement_email_message_id: delivery.messageId, agreement_email_error: null } : { agreement_email_status: "failed", agreement_email_error: delivery.error };
      const { data: record } = await supabase.from("partners").update(values).eq("id", partner.id).select().single();
      return Response.json(delivery.ok ? { record: toCamelRecord(record) } : { record: toCamelRecord(record), error: delivery.error }, { status: delivery.ok ? 200 : 502 });
    }
    if (body.status === "declined" && partner.status !== "declined") {
      const { data: record } = await supabase.from("partners").update({ status: "declined" }).eq("id", partner.id).select().single();
      const delivery = await sendDeclineEmail({ email: partner.email, contactName: partner.contact_name });
      await supabase.from("notifications").insert({ type: "application_declined", title: "Application declined", message: `${partner.contact_name}'s application for ${partner.company_name} was declined${delivery.ok ? "" : " (decline email failed to send)"}.`, entity_type: "partner", entity_id: partner.id });
      return Response.json({ record: toCamelRecord(record), warning: delivery.ok ? null : delivery.error });
    }
    const { data: record } = await supabase.from("partners").update(body.status ? { status: body.status } : {}).eq("id", partner.id).select().single();
    return Response.json({ record: toCamelRecord(record) });
  }
  const { data: existingReferral } = await supabase.from("referrals").select("status").eq("id", Number(body.id)).maybeSingle();
  const values: Record<string, unknown> = { status: body.status, category: body.category, compensation: Number(body.compensation) || 0 };
  if (body.routingStatus) values.routing_status = body.routingStatus;
  if (body.status === "paid") values.paid_at = new Date().toISOString();
  const { data: record } = await supabase.from("referrals").update(values).eq("id", Number(body.id)).select().single();
  if (body.status === "paid" && existingReferral?.status !== "paid" && record) {
    const { data: recipient } = await supabase.from("partners").select("contact_name").eq("email", record.partner_email).order("id", { ascending: false }).limit(1).maybeSingle();
    await sendReferralPaidEmail({ email: record.partner_email, contactName: recipient?.contact_name || "there" }, { companyName: record.company_name, compensation: record.compensation });
  }
  return Response.json({ record: toCamelRecord(record) });
}
