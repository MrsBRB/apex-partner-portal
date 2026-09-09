import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ||
    "brooke.benkert@gmail.com,brooke@apexfleetconsulting.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser(returnTo = "/portal", loginPath = "/login") {
  const user = await getUser();
  if (!user?.email) redirect(`${loginPath}?returnTo=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin", "/admin/login");
  if (!user.email || !adminEmails().includes(user.email.toLowerCase())) {
    redirect("/portal");
  }
  return user;
}
