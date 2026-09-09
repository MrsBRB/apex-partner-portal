import { SiteShell } from "@/components/site-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <SiteShell compact>
      <main className="mx-auto max-w-lg px-5 py-20">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#bc5a15]">
            Secure partner access
          </p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to your portal</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Enter the email used on your approved application. We’ll email a
            secure sign-in link—no ChatGPT account or password is required.
          </p>
          <LoginForm />
        </div>
      </main>
    </SiteShell>
  );
}
