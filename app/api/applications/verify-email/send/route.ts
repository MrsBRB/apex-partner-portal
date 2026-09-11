import { sendApplicationVerificationEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const supabase = createAdminClient();

    const { data: existingApplication } = await supabase
      .from("partners")
      .select("id")
      .eq("email", email)
      .neq("status", "declined")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingApplication) {
      return Response.json({ error: "An application is already on file for this email address." }, { status: 409 });
    }

    const { data: recent } = await supabase
      .from("email_verifications")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 30_000) {
      return Response.json({ error: "A code was just sent. Please wait a moment before requesting another." }, { status: 429 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase.from("email_verifications").insert({ email, code, expires_at: expiresAt });
    if (error) throw error;

    const delivery = await sendApplicationVerificationEmail(email, code);
    if (!delivery.ok) {
      return Response.json({ error: "We couldn't send a verification email to that address. Double-check it and try again." }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to send verification code" }, { status: 500 });
  }
}
