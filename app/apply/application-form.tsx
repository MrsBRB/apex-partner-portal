"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Step = "email" | "code" | "form" | "done";

export function ApplicationForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setError("");
    setSendingCode(true);
    const res = await fetch("/api/applications/verify-email/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSendingCode(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStep("code");
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30000);
    } else {
      setError(body.error || "We couldn't send a verification code. Please try again.");
    }
  }

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    requestCode();
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);
    const res = await fetch("/api/applications/verify-email/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setVerifying(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setVerifiedToken(body.token);
      setStep("form");
    } else {
      setError(body.error || "Incorrect code.");
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/applications", { method: "POST", body: formData });
    setSubmitting(false);
    if (res.ok) {
      setStep("done");
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.error || "We couldn't submit your application. Please try again.");
  }

  if (step === "done") {
    return (
      <section className="grid min-h-[32rem] place-items-center rounded-xl border bg-white p-10 text-center shadow-sm">
        <div>
          <CheckCircle2 className="mx-auto size-14 text-[#e87b2f]" />
          <h2 className="mt-5 text-2xl font-bold">Application received</h2>
          <p className="mt-3 max-w-md leading-7 text-slate-600">
            Thank you. Apex will review your information and contact you with the next step.
          </p>
        </div>
      </section>
    );
  }

  if (step === "email" || step === "code") {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm md:p-9">
        <h2 className="text-xl font-bold">Verify your email</h2>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll send a 6-digit code to confirm we can reach you before you fill out the rest of the
          application.
        </p>
        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="verify-email">Email</Label>
              <Input
                id="verify-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button disabled={sendingCode} size="lg" className="w-full bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
              {sendingCode ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send verification code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={confirmCode} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              We sent a code to <b>{email}</b>.
            </p>
            <div>
              <Label htmlFor="verify-code">6-digit code</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-2"
              />
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button disabled={verifying} size="lg" className="w-full bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify and continue"
              )}
            </Button>
            <div className="flex justify-between text-xs text-slate-500">
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Use a different email
              </button>
              <button
                type="button"
                disabled={resendCooldown}
                className="underline disabled:cursor-not-allowed disabled:text-slate-300"
                onClick={requestCode}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-sm md:p-9">
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="size-4" /> Email verified — {email}
      </div>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="emailVerifiedToken" value={verifiedToken} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Your name" name="contactName" required />
        <Field label="Company name" name="companyName" required />
        <Field label="Phone" name="phone" type="tel" required />
        <Field label="Website or LinkedIn" name="website" />
        <Field label="Primary markets / regions" name="markets" required />
      </div>
      <div className="mt-6">
        <Label htmlFor="experience">Tell us about your fleet experience and professional network</Label>
        <Textarea
          id="experience"
          name="experience"
          required
          rows={6}
          className="mt-2"
          placeholder="Industries, fleet types, decision-maker relationships, and the kinds of opportunities you expect to encounter…"
        />
      </div>
      <div className="mt-6">
        <Label htmlFor="document">
          Supporting document <span className="font-normal text-slate-500">(optional)</span>
        </Label>
        <Input
          id="document"
          name="document"
          type="file"
          className="mt-2 h-auto py-2"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        />
        <p className="mt-2 text-xs text-slate-500">Resume, capabilities overview, or other relevant reference.</p>
      </div>
      <label className="mt-6 flex gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" name="attest" required className="mt-1 size-4 accent-[#e87b2f]" />
        I confirm this information is accurate and understand that applying does not guarantee acceptance or
        compensation.
      </label>
      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      <Button disabled={submitting} size="lg" className="mt-7 w-full bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
        {submitting ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit application"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} className="mt-2" />
    </div>
  );
}
