import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 6;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    if (!email || !code) {
      return Response.json({ error: "Enter the code we emailed you." }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: verification } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!verification) {
      return Response.json({ error: "Request a new code first." }, { status: 400 });
    }
    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "That code has expired. Request a new one." }, { status: 400 });
    }
    if (verification.attempts >= MAX_ATTEMPTS) {
      return Response.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
    }
    if (verification.code !== code) {
      const attempts = verification.attempts + 1;
      await supabase.from("email_verifications").update({ attempts }).eq("id", verification.id);
      const remaining = MAX_ATTEMPTS - attempts;
      return Response.json(
        { error: remaining > 0 ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code." },
        { status: 400 },
      );
    }
    const token = crypto.randomUUID();
    await supabase.from("email_verifications").update({ verified_at: new Date().toISOString(), verified_token: token }).eq("id", verification.id);
    return Response.json({ ok: true, token });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to verify code" }, { status: 500 });
  }
}
