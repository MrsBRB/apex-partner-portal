"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  FileSignature,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { AgreementCard } from "./agreement-card";

type Referral = {
  id: number;
  companyName: string;
  contactName: string;
  leadPath: string;
  fleetSize: number;
  location: string;
  status: string;
  category: string;
  compensation: number;
  qualificationScore: number;
  qualificationDecision: string;
  inactivityDate: string | null;
};
type Partner = {
  contactName: string;
  companyName: string;
  status: string;
  agreementStatus: string;
  agreementVersion: string;
  agreementViewedAt: string | null;
  agreementSignedAt: string | null;
  signerName: string | null;
};
export function PortalClient({
  user,
  partner,
  initialReferrals,
  signOut,
}: {
  user: { email: string };
  partner: Partner | null;
  initialReferrals: Referral[];
  signOut: string;
}) {
  const [rows, setRows] = useState(initialReferrals);
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("commercial_fleet");
  const [error, setError] = useState("");
  const earned = rows.reduce((a, r) => a + r.compensation, 0);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/referrals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const body = await res.json();
    if (res.ok) {
      setRows([body.referral, ...rows]);
      setOpen(false);
    } else setError(body.error || "Unable to submit referral");
  }
  if (!partner)
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-3xl border bg-white p-9 text-center">
          <h1 className="text-3xl font-bold">
            No application is connected to this email.
          </h1>
          <p className="mt-4 text-slate-600">
            You’re signed in as {user.email}. Apply using this same email.
          </p>
          <Button asChild className="mt-7 bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
            <a href="/apply">
              Start application <ArrowUpRight />
            </a>
          </Button>
        </div>
      </main>
    );
  const approved =
    partner.status === "approved" && partner.agreementStatus === "signed";
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#bc5a15]">
            Partner workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {partner.contactName.split(" ")[0]}
          </h1>
          <p className="mt-2 text-slate-500">
            {partner.companyName} ·{" "}
            <a className="underline" href={signOut}>
              Sign out
            </a>
          </p>
        </div>
        {approved && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
                <Plus />
                Qualify a lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Lead qualification card</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-500">
                Submit objective facts. The portal will produce a preliminary
                qualification result; Apex-versus-SVT routing occurs later.
              </p>
              <form onSubmit={submit} className="space-y-5">
                <Card title="1 · Company and contact">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company" name="companyName" />
                    <Field label="Fleet location(s)" name="location" />
                    <Field label="Contact name" name="contactName" />
                    <Field
                      label="Contact email"
                      name="contactEmail"
                      type="email"
                    />
                    <Field label="Decision-maker title" name="decisionMaker" />
                    <SelectField
                      label="Your access"
                      name="decisionAccess"
                      options={[
                        ["direct", "Direct relationship"],
                        [
                          "introduction_available",
                          "Warm introduction available",
                        ],
                        ["indirect", "Indirect contact only"],
                        ["none", "No access yet"],
                      ]}
                    />
                  </div>
                </Card>
                <Card title="2 · Fleet facts">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="leadPath">Fleet type</Label>
                      <NativeSelect
                        id="leadPath"
                        name="leadPath"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        className="mt-2 w-full"
                      >
                        <option value="commercial_fleet">
                          Commercial fleet
                        </option>
                        <option value="amazon_dsp">Amazon DSP</option>
                      </NativeSelect>
                    </div>
                    <Field
                      label="Exact vehicle count"
                      name="fleetSize"
                      type="number"
                    />
                    <SelectField
                      label="Count source"
                      name="fleetCountSource"
                      options={[
                        ["confirmed", "Confirmed by decision-maker/system"],
                        ["estimated", "Estimated by contact"],
                        ["unverified", "Unverified estimate"],
                      ]}
                    />
                    <Field label="Vehicle types" name="vehicleTypes" />
                    <SelectField
                      label="Service location"
                      name="serviceLocationType"
                      options={[
                        ["customer_yard", "Customer yard"],
                        ["provider_shop", "Provider shop"],
                        ["mixed", "Either / mixed"],
                        ["unknown", "Not confirmed"],
                      ]}
                    />
                    <Field
                      label="Operating hours / service window"
                      name="operatingHours"
                    />
                  </div>
                  {path === "amazon_dsp" && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                      <SelectField
                        label="Does the DSP pay for maintenance directly?"
                        name="dspSelfPay"
                        options={[
                          ["", "Choose one"],
                          ["yes", "Yes — self-pay confirmed"],
                          ["no", "No — Amazon vendor program"],
                          ["unknown", "Not confirmed"],
                        ]}
                      />
                    </div>
                  )}
                </Card>
                <Card title="3 · Need and timing">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Need type"
                      name="needType"
                      options={[
                        ["ongoing", "Ongoing maintenance relationship"],
                        ["one_time", "One-time repair/project"],
                        ["unknown", "Not confirmed"],
                      ]}
                    />
                    <SelectField
                      label="Current vendor status"
                      name="currentVendorStatus"
                      options={[
                        ["open", "No contract / open"],
                        ["ending_soon", "Ends within 6 months"],
                        ["ending_later", "Ends in 6–12 months"],
                        ["locked", "Long-term contract"],
                        ["unknown", "Not confirmed"],
                      ]}
                    />
                    <Field
                      label="Current contract end"
                      name="contractEndDate"
                      type="date"
                      optional
                    />
                    <Field
                      label="Desired start date"
                      name="desiredStartDate"
                      type="date"
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="maintenanceScope">
                      Maintenance scope requested
                    </Label>
                    <Textarea
                      id="maintenanceScope"
                      name="maintenanceScope"
                      required
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="opportunity">
                      Business need / reason they are evaluating
                    </Label>
                    <Textarea
                      id="opportunity"
                      name="opportunity"
                      required
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </Card>
                <div>
                  <Label htmlFor="notes">
                    Additional context{" "}
                    <span className="font-normal text-slate-500">
                      (optional)
                    </span>
                  </Label>
                  <Textarea id="notes" name="notes" className="mt-2" rows={3} />
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <label className="flex gap-3">
                    <input
                      required
                      type="checkbox"
                      className="mt-1 accent-[#e87b2f]"
                    />
                    The company/contact is genuinely new to Apex to the best of
                    my knowledge.
                  </label>
                  <label className="mt-2 flex gap-3">
                    <input
                      required
                      type="checkbox"
                      className="mt-1 accent-[#e87b2f]"
                    />
                    This introduction is being made before Apex’s first contact;
                    I have not promised price, timing, or service terms.
                  </label>
                </div>
                {error && (
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                )}
                <Button className="w-full bg-[#e87b2f] font-bold hover:bg-[#bc5a15]">
                  <Send />
                  Analyze and submit lead
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>
      <AgreementCard
        partner={partner}
        onSigned={() => window.location.reload()}
      />
      {!approved && partner.status !== "approved" && (
        <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-bold text-blue-950">Partner setup in progress</h2>
          <p className="mt-2 text-sm text-blue-900">
            Application: <b>{label(partner.status)}</b> · Agreement:{" "}
            <b>{label(partner.agreementStatus)}</b>. Lead submission unlocks
            after approval and signature.
          </p>
        </section>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric
          icon={<Users />}
          label="Total referrals"
          value={String(rows.length).padStart(2, "0")}
        />
        <Metric
          icon={<CircleDollarSign />}
          label="Paid compensation"
          value={money(earned)}
        />
        <Metric
          icon={<FileSignature />}
          label="Partner agreement"
          value={label(partner.agreementStatus)}
        />
      </div>
      <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Your referrals</h2>
          <p className="mt-1 text-sm text-slate-500">
            Qualification is analyzed first. Internal routing happens later.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 font-bold">No referrals yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 pl-6">Company</th>
                  <th className="p-4">Fleet</th>
                  <th className="p-4">Qualification</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Inactive after</th>
                  <th className="p-4 pr-6 text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-4 pl-6">
                      <b>{r.companyName}</b>
                      <div className="text-xs text-slate-500">
                        {r.contactName} · {r.location}
                      </div>
                    </td>
                    <td className="p-4">
                      {r.fleetSize || "TBD"} ·{" "}
                      {r.leadPath === "amazon_dsp" ? "DSP" : "Commercial"}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {label(r.qualificationDecision || "manual_review")} ·{" "}
                        {r.qualificationScore || 0}/100
                      </Badge>
                    </td>
                    <td className="p-4">{label(r.category)}</td>
                    <td className="p-4">
                      <Badge className="bg-[#fff0e5] text-[#bc5a15]">
                        {label(r.status)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {r.inactivityDate
                        ? new Date(r.inactivityDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4 pr-6 text-right font-bold">
                      {money(r.compensation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-4">
      <h3 className="mb-4 font-bold text-[#0d1f35]">{title}</h3>
      {children}
    </section>
  );
}
function Metric({
  icon,
  label: lab,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-[#e87b2f]">{icon}</span>
        {lab}
      </div>
      <div className="mt-4 text-2xl font-bold">{value}</div>
    </div>
  );
}
function Field({
  label: lab,
  name,
  type = "text",
  optional = false,
}: {
  label: string;
  name: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>
        {lab}
        {optional && (
          <span className="font-normal text-slate-500"> (optional)</span>
        )}
      </Label>
      <Input
        className="mt-2"
        id={name}
        name={name}
        type={type}
        required={!optional}
      />
    </div>
  );
}
function SelectField({
  label: lab,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[][];
}) {
  return (
    <div>
      <Label htmlFor={name}>{lab}</Label>
      <NativeSelect className="mt-2 w-full" id={name} name={name} required>
        {options.map((o) => (
          <option key={o[0]} value={o[0]}>
            {o[1]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
function label(v: string) {
  return v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function money(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
