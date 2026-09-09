import { getUser } from "@/lib/auth";
import { sendAdminNotification } from "@/lib/email";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await createAdminClient().from("referrals").select("*").eq("partner_email", user.email.toLowerCase()).order("id", { ascending: false });
  return Response.json({ referrals: (data || []).map((row) => toCamelRecord(row)) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = user.email.toLowerCase();
  const supabase = createAdminClient();
  const { data: partner } = await supabase.from("partners").select("status,agreement_status").eq("email", email).order("id", { ascending: false }).limit(1).maybeSingle();
  if (!partner || partner.status !== "approved" || partner.agreement_status !== "signed") {
    return Response.json({ error: "A signed partner agreement is required." }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, string>;
  const required = ["companyName", "contactName", "contactEmail", "opportunity", "location", "fleetSize", "fleetCountSource", "vehicleTypes", "serviceLocationType", "operatingHours", "maintenanceScope", "decisionMaker", "decisionAccess", "currentVendorStatus", "desiredStartDate"];
  if (required.some((key) => !body[key])) return Response.json({ error: "Complete every required qualification field before submitting." }, { status: 400 });
  const analysis = analyze(body);
  const inactive = new Date(); inactive.setFullYear(inactive.getFullYear() + 1);
  const { data: referral, error } = await supabase.from("referrals").insert({
    partner_email: email, company_name: body.companyName.trim(), contact_name: body.contactName.trim(), contact_email: body.contactEmail.trim(), opportunity: body.opportunity.trim(), lead_path: body.leadPath || "commercial_fleet", fleet_size: Number(body.fleetSize) || 0, fleet_count_source: body.fleetCountSource, vehicle_types: body.vehicleTypes.trim(), location: body.location.trim(), service_location_type: body.serviceLocationType, operating_hours: body.operatingHours.trim(), need_type: body.needType || "ongoing", maintenance_scope: body.maintenanceScope.trim(), decision_maker: body.decisionMaker, decision_access: body.decisionAccess, current_vendor_status: body.currentVendorStatus, contract_end_date: body.contractEndDate || null, desired_start_date: body.desiredStartDate || null, dsp_self_pay: body.leadPath === "amazon_dsp" ? body.dspSelfPay || "unknown" : "not_applicable", qualification_score: analysis.score, qualification_decision: analysis.decision, qualification_reasons: JSON.stringify(analysis.reasons), status: analysis.decision === "prequalified" ? "qualified" : analysis.decision === "not_qualified" ? "not_moving_forward" : "under_review", inactivity_date: inactive.toISOString(), notes: (body.notes || "").trim(),
  }).select().single();
  if (error) throw error;
  await supabase.from("notifications").insert({ type: "referral_submission", title: "New referral submitted", message: `${body.companyName.trim()} was submitted by ${email}. Result: ${analysis.decision.replaceAll("_", " ")} (${analysis.score}/100).`, entity_type: "referral", entity_id: referral.id });
  await sendAdminNotification("New Apex partner referral", `${body.companyName.trim()} was submitted by ${email}. Preliminary result: ${analysis.decision.replaceAll("_", " ")} (${analysis.score}/100).`);
  return Response.json({ referral: toCamelRecord(referral), analysis }, { status: 201 });
}

function analyze(body: Record<string, string>) {
  let score = 0; const reasons: string[] = []; const fleet = Number(body.fleetSize) || 0;
  if (fleet >= 25) { score += 30; reasons.push("Meaningful fleet size"); } else if (fleet >= 10) { score += 22; reasons.push("Moderate fleet size"); } else if (fleet >= 5) { score += 10; reasons.push("Small fleet — lower priority"); } else reasons.push("Very small fleet");
  if (body.fleetCountSource === "confirmed") { score += 5; reasons.push("Vehicle count confirmed"); } else reasons.push("Vehicle count needs verification");
  if (/\b(CA|California|NV|Nevada|AZ|Arizona)\b/i.test(body.location)) { score += 25; reasons.push("Within core coverage area"); } else reasons.push("Outside core coverage area");
  if (body.needType === "ongoing") { score += 20; reasons.push("Ongoing maintenance need"); } else reasons.push("One-time or unconfirmed need");
  if (body.decisionAccess === "direct") { score += 15; reasons.push("Direct decision-maker access"); } else if (body.decisionAccess === "introduction_available") { score += 8; reasons.push("Decision-maker introduction available"); } else reasons.push("Decision-maker access not established");
  if (body.currentVendorStatus === "open" || body.currentVendorStatus === "ending_soon") { score += 5; reasons.push("Near-term vendor opening"); }
  if (body.leadPath === "amazon_dsp" && body.dspSelfPay !== "yes") return { score, decision: "not_qualified", reasons: [...reasons, "DSP self-pay is not confirmed"] };
  return { score, decision: score >= 70 ? "prequalified" : score >= 45 ? "manual_review" : "not_qualified", reasons };
}
