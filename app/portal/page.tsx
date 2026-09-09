import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/auth";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalClient } from "./portal-client";

export default async function PortalPage() {
  const user = await requireUser("/portal");
  const email = user.email!.toLowerCase();
  const supabase = createAdminClient();
  const [{ data: partner }, { data: referrals }] = await Promise.all([
    supabase.from("partners").select("*").eq("email", email).order("id", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("referrals").select("*").eq("partner_email", email).order("id", { ascending: false }),
  ]);
  return (
    <SiteShell compact>
      <PortalClient
        user={{ email }}
        partner={partner ? toCamelRecord(partner) : null}
        initialReferrals={(referrals || []).map((row) => toCamelRecord(row))}
        signOut="/auth/signout"
      />
    </SiteShell>
  );
}
