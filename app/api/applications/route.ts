import { sendAdminNotification } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const value = (key: string) => String(form.get(key) || "").trim();
    const email = value("email").toLowerCase();
    if (!email || !value("contactName") || !value("companyName")) {
      return Response.json({ error: "Required fields missing" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: existingApplication } = await supabase.from("partners").select("id").eq("email", email).neq("status", "declined").order("id", { ascending: false }).limit(1).maybeSingle();
    if (existingApplication) {
      return Response.json({ error: "An application is already on file for this email address." }, { status: 409 });
    }
    const { data: partner, error } = await supabase.from("partners").insert({
      email,
      contact_name: value("contactName"),
      company_name: value("companyName"),
      phone: value("phone"),
      website: value("website"),
      markets: value("markets"),
      experience: value("experience"),
    }).select().single();
    if (error) throw error;

    const file = form.get("document");
    if (file instanceof File && file.size) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = `applications/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("partner-documents").upload(objectKey, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      await supabase.from("documents").insert({ partner_email: email, file_name: file.name, object_key: objectKey });
    }
    await supabase.from("notifications").insert({
      type: "partner_application",
      title: "New partner application",
      message: `${partner.contact_name} from ${partner.company_name} submitted a partner application.`,
      entity_type: "partner",
      entity_id: partner.id,
    });
    await sendAdminNotification("New Apex partner application", `${partner.contact_name} from ${partner.company_name} submitted an application using ${email}.`);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to save application" }, { status: 500 });
  }
}
