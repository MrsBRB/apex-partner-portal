"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationCenter, type AdminNotification } from "./notification-center";
export type PartnerRow = {
  id: number;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  markets: string;
  experience: string;
  documentName: string | null;
  documentUrl: string | null;
  status: string;
  agreementStatus: string;
  agreementEmailStatus: string;
  agreementEmailSentAt: string | null;
  agreementEmailError: string | null;
  agreementSentAt: string | null;
  agreementViewedAt: string | null;
  agreementSignedAt: string | null;
  agreementDeclinedAt: string | null;
  signerName: string | null;
  createdAt: string;
};
type R = {
  id: number;
  companyName: string;
  partnerEmail: string;
  fleetSize: number;
  location: string;
  leadPath: string;
  status: string;
  category: string;
  compensation: number;
  qualificationScore: number;
  qualificationDecision: string;
  qualificationReasons: string;
  routingStatus: string;
};
// Fixed dollar amounts for the Apex-direct compensation categories, mirrored
// from the Compensation rules table in app/resources/partner-workflow/page.tsx.
// Partner-routed (25% of qualifying compensation) and Custom/enterprise are
// intentionally excluded — those amounts are case-by-case and stay manual.
const CATEGORY_AMOUNTS: Record<string, number> = {
  apex_direct_500: 500,
  apex_direct_1500: 1500,
  apex_direct_3000: 3000,
  apex_direct_5000: 5000,
};
export function AdminClient({
  initialPartners,
  initialReferrals,
  initialNotifications,
}: {
  initialPartners: PartnerRow[];
  initialReferrals: R[];
  initialNotifications: AdminNotification[];
}) {
  const [partners, setPartners] = useState(initialPartners);
  const [refs, setRefs] = useState(initialReferrals);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  function toggleExpanded(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function save(
    kind: string,
    id: number,
    values: Record<string, unknown>,
  ) {
    const res = await fetch("/api/admin/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, ...values }),
    });
    const body = await res.json();
    if (body.record) {
      // Merge rather than replace: the PATCH response only carries partners-table
      // columns, and would otherwise wipe the document link/name attached client-side.
      if (kind === "partner")
        setPartners((current) =>
          current.map((p) => (p.id === id ? { ...p, ...body.record } : p)),
        );
      else
        setRefs((current) =>
          current.map((r) => (r.id === id ? body.record : r)),
        );
    }
    if (body.warning || body.error)
      setNotice(body.warning || body.error);
    else if (kind === "partner" && values.status === "approved")
      setNotice("Application approved. Agreement and access instructions sent.");
    else if (values.action === "resend_agreement_email")
      setNotice("Agreement email sent again.");
  }
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#bc5a15]">
        Apex administration
      </p>
      <h1 className="mt-2 text-3xl font-bold">Partner program workflow</h1>
      <p className="mt-3 text-slate-600">
        Review applications, advance agreements, qualify referrals, assign
        compensation categories, and record payouts.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/resources/partner-workflow">Open or print admin-only workflow</Link>
      </Button>
      <NotificationCenter initial={initialNotifications} />
      {notice && (
        <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <span>{notice}</span>
          <button
            className="font-bold"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      )}
      <section className="mt-8 rounded-3xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Partner applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-4 pl-6">Applicant</th>
                <th className="p-4">Applied</th>
                <th className="p-4">Application</th>
                <th className="p-4 pr-6">Agreement and signature audit</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <Fragment key={p.id}>
                <tr className="border-t align-top">
                  <td className="p-4 pl-6">
                    <b>{p.contactName}</b>
                    <div className="text-xs text-slate-500">
                      {p.companyName} · {p.email}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs font-bold text-[#bc5a15] underline underline-offset-2"
                      onClick={() => toggleExpanded(p.id)}
                    >
                      {expanded.has(p.id) ? "Hide full application" : "View full application"}
                    </button>
                  </td>
                  <td className="p-4">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <NativeSelect
                      value={p.status}
                      onChange={(e) =>
                        save("partner", p.id, { status: e.target.value })
                      }
                    >
                      <option value="application_received">
                        Application received
                      </option>
                      <option value="under_review">Under review</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </NativeSelect>
                  </td>
                  <td className="p-4 pr-6">
                    <Badge variant="outline">
                      {agreementLabel(p.agreementStatus)}
                    </Badge>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      {p.agreementSentAt && (
                        <div>Issued {stamp(p.agreementSentAt)}</div>
                      )}
                      {p.agreementViewedAt && (
                        <div>Viewed {stamp(p.agreementViewedAt)}</div>
                      )}
                      {p.agreementSignedAt && (
                        <div className="font-semibold text-emerald-700">
                          Signed by {p.signerName} ·{" "}
                          {stamp(p.agreementSignedAt)}
                        </div>
                      )}
                      {p.agreementDeclinedAt && (
                        <div className="font-semibold text-red-600">
                          Declined {stamp(p.agreementDeclinedAt)}
                        </div>
                      )}
                      {p.agreementEmailStatus === "sent" && (
                        <div className="font-semibold text-emerald-700">
                          Instructions emailed
                          {p.agreementEmailSentAt
                            ? ` ${stamp(p.agreementEmailSentAt)}`
                            : ""}
                        </div>
                      )}
                      {p.agreementEmailStatus === "failed" && (
                        <div className="font-semibold text-red-600">
                          Email delivery failed
                          {p.agreementEmailError
                            ? ` — ${p.agreementEmailError}`
                            : ""}
                        </div>
                      )}
                    </div>
                    {p.status === "approved" &&
                      p.agreementStatus !== "signed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() =>
                            save("partner", p.id, {
                              action: "resend_agreement_email",
                            })
                          }
                        >
                          Resend instructions
                        </Button>
                      )}
                  </td>
                </tr>
                {expanded.has(p.id) && (
                  <tr className="border-t bg-slate-50">
                    <td colSpan={4} className="p-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <DetailField label="Phone" value={p.phone || "—"} />
                        <DetailField
                          label="Website or LinkedIn"
                          value={
                            p.website ? (
                              <a
                                href={/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#bc5a15] underline underline-offset-2"
                              >
                                {p.website}
                              </a>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <DetailField label="Primary markets / regions" value={p.markets || "—"} />
                        <DetailField
                          label="Supporting document"
                          value={
                            p.documentUrl ? (
                              <a
                                href={p.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#bc5a15] underline underline-offset-2"
                              >
                                {p.documentName || "View document"}
                              </a>
                            ) : (
                              "None uploaded"
                            )
                          }
                        />
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-[.1em] text-slate-500">
                          Fleet experience and professional network
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {p.experience || "—"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 rounded-3xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Qualified lead pipeline</h2>
          <p className="mt-1 text-sm text-slate-500">
            The objective qualification result feeds the later SVT-versus-Apex
            routing process; it does not make that routing decision.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-4 pl-6">Opportunity</th>
                <th className="p-4">Objective fit</th>
                <th className="p-4">Auto-analysis</th>
                <th className="p-4">Status</th>
                <th className="p-4">Category</th>
                <th className="p-4">Compensation</th>
                <th className="p-4 pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <ReferralRow key={r.id} row={r} save={save} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
function ReferralRow({
  row,
  save,
}: {
  row: R;
  save: (k: string, id: number, v: Record<string, unknown>) => Promise<void>;
}) {
  const [status, setStatus] = useState(row.status),
    [category, setCategory] = useState(row.category),
    [comp, setComp] = useState(String(row.compensation)),
    [routingStatus, setRoutingStatus] = useState(row.routingStatus || "not_started");
  let reasons: string[] = [];
  try {
    reasons = JSON.parse(row.qualificationReasons || "[]");
  } catch {}
  return (
    <tr className="border-t align-top">
      <td className="p-4 pl-6">
        <b>{row.companyName}</b>
        <div className="text-xs text-slate-500">
          Referred by {row.partnerEmail}
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline">{row.fleetSize || "?"} vehicles</Badge>
        <div className="mt-1 text-xs text-slate-500">
          {row.location} ·{" "}
          {row.leadPath === "amazon_dsp" ? "DSP" : "Commercial"}
        </div>
      </td>
      <td className="p-4">
        <Badge>
          {label(row.qualificationDecision || "manual_review")} ·{" "}
          {row.qualificationScore || 0}/100
        </Badge>
        <div className="mt-2 max-w-60 text-xs leading-5 text-slate-500">
          {reasons.join(" · ") || "Legacy lead — needs review"}
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-700">
          Routing:{" "}
          <select
            className="ml-1 rounded border px-1 py-0.5 text-xs font-semibold text-slate-700"
            value={routingStatus}
            onChange={(e) => setRoutingStatus(e.target.value)}
          >
            <option value="not_started">Not Started</option>
            <option value="apex_direct">Apex-direct</option>
            <option value="partner_routed">Partner-routed</option>
            <option value="custom_enterprise">Custom / enterprise</option>
          </select>
        </div>
      </td>
      <td className="p-4">
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="qualified">Qualified</option>
          <option value="routing_review">Routing review</option>
          <option value="pursuing">Pursuing</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="commission_pending">Commission pending</option>
          <option value="approved_for_payout">Approved for payout</option>
          <option value="payment_scheduled">Payment scheduled</option>
          <option value="not_moving_forward">Not moving forward</option>
          <option value="inactive">Inactive</option>
          <option value="paid">Paid</option>
        </NativeSelect>
      </td>
      <td className="p-4">
        <NativeSelect
          value={category}
          onChange={(e) => {
            const next = e.target.value;
            setCategory(next);
            const fixedAmount = CATEGORY_AMOUNTS[next];
            if (fixedAmount !== undefined) setComp(String(fixedAmount));
          }}
        >
          <option value="tbd">TBD</option>
          <option value="apex_direct_500">
            Apex direct — small project ($500)
          </option>
          <option value="apex_direct_1500">
            Apex direct — ongoing consulting ($1,500)
          </option>
          <option value="apex_direct_3000">
            Apex direct — larger / multi-site ($3,000)
          </option>
          <option value="apex_direct_5000">
            Apex direct — major enterprise ($5,000)
          </option>
          <option value="partner_routed_25_percent">
            Partner-routed — 25% of qualifying compensation
          </option>
          <option value="custom_enterprise">Custom / enterprise</option>
        </NativeSelect>
      </td>
      <td className="p-4">
        <Input
          type="number"
          min="0"
          step=".01"
          value={comp}
          onChange={(e) => setComp(e.target.value)}
        />
      </td>
      <td className="p-4 pr-6">
        <Button
          size="sm"
          onClick={() =>
            save("referral", row.id, {
              status,
              category,
              compensation: Number(comp) || 0,
              routingStatus,
            })
          }
        >
          Save
        </Button>
      </td>
    </tr>
  );
}
function label(v: string) {
  return v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function agreementLabel(v: string) {
  const labels: Record<string, string> = {
    not_sent: "Not Sent",
    sent: "Agreement Sent",
    viewed: "Agreement Viewed",
    signed: "Agreement Signed",
    declined: "Agreement Declined",
  };
  return labels[v] || label(v);
}
function stamp(v: string) {
  return new Date(v).toLocaleString();
}
function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
