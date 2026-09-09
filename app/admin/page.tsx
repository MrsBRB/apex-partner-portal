import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/auth";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const [{ data: partners }, { data: referrals }, { data: notifications }] = await Promise.all([
    supabase.from("partners").select("*").order("id", { ascending: false }),
    supabase.from("referrals").select("*").order("id", { ascending: false }),
    supabase.from("notifications").select("*").order("id", { ascending: false }).limit(50),
  ]);
  return (
    <SiteShell compact>
      <AdminClient
        initialPartners={(partners || []).map((row) => toCamelRecord(row))}
        initialReferrals={(referrals || []).map((row) => toCamelRecord(row))}
        initialNotifications={(notifications || []).map((row) => toCamelRecord(row))}
      />
    </SiteShell>
  );
}
