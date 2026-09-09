import { SiteShell } from "@/components/site-shell";
import { LoginForm } from "@/app/login/login-form";

export default function AdminLoginPage() {
  return (
    <SiteShell compact>
      <main className="mx-auto max-w-lg px-5 py-20">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#bc5a15]">
            Apex admin access
          </p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to the admin workflow</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Enter your authorized Apex admin email. We’ll email a secure
            sign-in link—this is a separate sign-in from the partner portal.
          </p>
          <LoginForm
            next="/admin"
            notFoundMessage="That email isn't authorized for Apex admin access. Confirm it's listed in ADMIN_EMAILS and exists as a Supabase Auth user."
          />
        </div>
      </main>
    </SiteShell>
  );
}
