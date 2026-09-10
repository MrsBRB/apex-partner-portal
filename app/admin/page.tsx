import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/auth";
import { toCamelRecord } from "@/lib/records";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClient, type PartnerRow } from "./admin-client";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const [{ data: partners }, { data: referrals }, { data: notifications }, { data: documents }] = await Promise.all([
    supabase.from("partners").select("*").order("id", { ascending: false }),
    supabase.from("referrals").select("*").order("id", { ascending: false }),
    supabase.from("notifications").select("*").order("id", { ascending: false }).limit(50),
    supabase.from("documents").select("*").order("id", { ascending: false }),
  ]);

  // Keep only the most recent document per partner email, and mint a short-lived
  // signed URL for each so admins can open it directly from the dashboard.
  const latestDocByEmail = new Map<string, { file_name: string; object_key: string }>();
  for (const doc of documents || []) {
    if (!latestDocByEmail.has(doc.partner_email)) {
      latestDocByEmail.set(doc.partner_email, doc);
    }
  }
  const signedUrlByEmail = new Map<string, string>();
  await Promise.all(
    Array.from(latestDocByEmail.entries()).map(async ([email, doc]) => {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(doc.object_key, 3600);
      if (data?.signedUrl) signedUrlByEmail.set(email, data.signedUrl);
    }),
  );

  const partnersWithDocs: PartnerRow[] = (partners || []).map((row) => {
    const doc = latestDocByEmail.get(row.email);
    return toCamelRecord<PartnerRow>({
      ...row,
      document_name: doc?.file_name || null,
      document_url: doc ? signedUrlByEmail.get(row.email) || null : null,
    });
  });

  return (
    <SiteShell compact>
      <AdminClient
        initialPartners={partnersWithDocs}
        initialReferrals={(referrals || []).map((row) => toCamelRecord(row))}
        initialNotifications={(notifications || []).map((row) => toCamelRecord(row))}
      />
    </SiteShell>
  );
}
