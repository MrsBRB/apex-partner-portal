"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationCenter, type AdminNotification } from "./notification-center";
import { AdminTrafficPanel } from "@/components/admin/traffic-panel";
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
  routingRationale: string;
  vehicleTypes: string;
  maintenanceScope: string;
  opportunity: string;
  svtObjective: string;
  svtUnits: number | null;
  svtAttendees: number | null;
  svtEnterpriseTermMonths: number | null;
  svtEnterpriseGrossProfit: number | null;
  svtAmazonRegistrationConfirmed: boolean;
  svtExpectedBeforeCutoff: boolean | null;
  qualifyingCompensationReceived: number | null;
  feeMinOverride: number | null;
  feeMaxOverride: number | null;
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

// Partner-routed referral fee: 25% of qualifying compensation Apex or Brooke
// actually receives, subject to any written opportunity-specific minimum or
// maximum (Agreement Clause 4). Rounded to the cent.
function computePartnerRoutedFee(qualifying: number, min: number | null, max: number | null): number {
  let fee = qualifying * 0.25;
  if (min !== null) fee = Math.max(fee, min);
  if (max !== null) fee = Math.min(fee, max);
  return Math.round(fee * 100) / 100;
}

// ---- SVT Exhibit A gate check ------------------------------------------
// Mirrors "The Deal Routing Workflow" and the "Exhibit A Rebuild Spec"
// artifacts, so a partner-portal referral is evaluated against the same
// five gates as every other lead-routing avenue (website assessment,
// Outlook/HubSpot). This is Brooke's own SVT compensation, separate from
// what the referring partner earns — never shown to the partner.
const SVT_FOOTPRINT_KEYWORDS = [
  "anaheim", "corona", "hesperia", "escondido", "san diego", "north las vegas",
  "las vegas", "phoenix", "sacramento", "san francisco", "oakland", "san jose",
  "fresno", "northern california",
];
function svtFootprintMatch(location: string): string | null {
  const hit = SVT_FOOTPRINT_KEYWORDS.find((k) => location.toLowerCase().includes(k));
  return hit ? hit.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
const SVT_OBJECTIVE_LABELS: Record<string, string> = {
  none: "Not an Exhibit A objective",
  dsp_first: "DSP conversion — first at this station",
  dsp_additional: "DSP conversion — additional at this station",
  amazon_registration: "Amazon vendor network registration",
  amazon_meeting: "Amazon DC fleet maintenance meeting",
  enterprise_pma: "Signed PMA with a named enterprise account",
  other_named: "Other named opportunity (unpriced)",
};
// Pay the higher band on the 25-unit overlap (Exhibit A Rebuild Spec, Decision 2).
function svtTierAmount(units: number, table: [number, number][]): number {
  for (const [floor, amount] of table) if (units >= floor) return amount;
  return 0;
}
const SVT_TIER_DSP_FIRST: [number, number][] = [[75, 5000], [50, 4000], [25, 3000], [1, 1000]];
const SVT_TIER_DSP_ADDITIONAL: [number, number][] = [[50, 2000], [25, 1500], [10, 1000]];
const SVT_TIER_ENTERPRISE: [number, number][] = [[50, 2000], [25, 1500], [10, 1000]];
const SVT_TERM_CUTOFF = new Date("2027-01-31T00:00:00Z");
function svtDaysToCutoff(): number {
  return Math.ceil((SVT_TERM_CUTOFF.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
type SvtGateResult = {
  footprintMatch: string | null;
  gross: number;
  eligible: number;
  expected: number; // eligible x 75% verification probability (Decision 4 default)
  failedGate: string | null;
};
function evaluateSvtGates(input: {
  location: string;
  objective: string;
  units: number;
  attendees: number;
  amazonRegistrationConfirmed: boolean;
  enterpriseTermMonths: number | null;
  enterpriseGrossProfit: number | null;
  expectedBeforeCutoff: boolean | null;
}): SvtGateResult {
  const footprintMatch = svtFootprintMatch(input.location);
  const none: SvtGateResult = { footprintMatch, gross: 0, eligible: 0, expected: 0, failedGate: null };
  if (input.objective === "none") return none;
  if (!footprintMatch) return { ...none, failedGate: "Gate 1 — outside the SVT service footprint" };
  let gross = 0;
  if (input.objective === "dsp_first") gross = svtTierAmount(input.units, SVT_TIER_DSP_FIRST);
  else if (input.objective === "dsp_additional") gross = svtTierAmount(input.units, SVT_TIER_DSP_ADDITIONAL);
  else if (input.objective === "amazon_registration") gross = input.amazonRegistrationConfirmed ? 5000 : 0;
  else if (input.objective === "amazon_meeting") gross = 500 * Math.max(0, input.attendees);
  else if (input.objective === "enterprise_pma") gross = svtTierAmount(input.units, SVT_TIER_ENTERPRISE);
  else if (input.objective === "other_named") gross = 0;
  if (input.objective === "enterprise_pma") {
    const termOk = (input.enterpriseTermMonths ?? 0) >= 12;
    const gpOk = (input.enterpriseGrossProfit ?? 0) >= 100000;
    if (!termOk || !gpOk)
      return { footprintMatch, gross, eligible: 0, expected: 0, failedGate: `Gate 3 — enterprise conditions not met (${!termOk ? "term under 12 months" : ""}${!termOk && !gpOk ? "; " : ""}${!gpOk ? "gross profit under $100K/yr" : ""})` };
  }
  if (input.objective === "amazon_registration" && !input.amazonRegistrationConfirmed)
    return { footprintMatch, gross, eligible: 0, expected: 0, failedGate: "Gate 2 — Amazon written confirmation not yet received" };
  if (gross === 0)
    return { footprintMatch, gross, eligible: 0, expected: 0, failedGate: input.objective === "other_named" ? "Unpriced — Exhibit A leaves this objective's incentive TBD" : "Gate 4 — this tier does not pay" };
  if (input.expectedBeforeCutoff === false)
    return { footprintMatch, gross, eligible: 0, expected: 0, failedGate: "Gate 5 — not expected to close before the Jan 31 2027 term cutoff" };
  return { footprintMatch, gross, eligible: gross, expected: Math.round(gross * 0.75), failedGate: null };
}
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
  const applicationsNeedingAttention = partners.filter(
    (p) => p.status === "application_received" || p.status === "under_review",
  ).length;
  const referralsNeedingRouting = refs.filter(
    (r) => (r.routingStatus || "not_started") === "not_started",
  ).length;
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
      <Tabs defaultValue={referralsNeedingRouting > 0 ? "referrals" : "applications"} className="mt-8">
        <TabsList>
          <TabsTrigger value="applications">
            Applications
            {applicationsNeedingAttention > 0 && (
              <Badge className="ml-1.5 bg-[#fff0e5] text-[#bc5a15]">
                {applicationsNeedingAttention}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Referrals
            {referralsNeedingRouting > 0 && (
              <Badge className="ml-1.5 bg-[#fff0e5] text-[#bc5a15]">
                {referralsNeedingRouting}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>
        <TabsContent value="applications">
      <section className="rounded-3xl border bg-white shadow-sm">
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
        </TabsContent>
        <TabsContent value="referrals">
      <section className="rounded-3xl border bg-white shadow-sm">
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
        </TabsContent>
        <TabsContent value="traffic">
          <AdminTrafficPanel />
        </TabsContent>
      </Tabs>
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
    [routingStatus, setRoutingStatus] = useState(row.routingStatus || "not_started"),
    [routingRationale, setRoutingRationale] = useState(row.routingRationale || ""),
    [svtObjective, setSvtObjective] = useState(row.svtObjective || "none"),
    [svtUnits, setSvtUnits] = useState(String(row.svtUnits ?? row.fleetSize ?? "")),
    [svtAttendees, setSvtAttendees] = useState(String(row.svtAttendees ?? "")),
    [svtTermMonths, setSvtTermMonths] = useState(String(row.svtEnterpriseTermMonths ?? "")),
    [svtGrossProfit, setSvtGrossProfit] = useState(String(row.svtEnterpriseGrossProfit ?? "")),
    [svtAmazonConfirmed, setSvtAmazonConfirmed] = useState(row.svtAmazonRegistrationConfirmed || false),
    [svtBeforeCutoff, setSvtBeforeCutoff] = useState<boolean | null>(row.svtExpectedBeforeCutoff ?? null),
    [qualifyingComp, setQualifyingComp] = useState(String(row.qualifyingCompensationReceived ?? "")),
    [feeMin, setFeeMin] = useState(String(row.feeMinOverride ?? "")),
    [feeMax, setFeeMax] = useState(String(row.feeMaxOverride ?? ""));
  let reasons: string[] = [];
  try {
    reasons = JSON.parse(row.qualificationReasons || "[]");
  } catch {}
  const needsRoutingReview = routingStatus === "not_started";
  const svtGate = evaluateSvtGates({
    location: row.location || "",
    objective: svtObjective,
    units: Number(svtUnits) || 0,
    attendees: Number(svtAttendees) || 0,
    amazonRegistrationConfirmed: svtAmazonConfirmed,
    enterpriseTermMonths: svtTermMonths === "" ? null : Number(svtTermMonths),
    enterpriseGrossProfit: svtGrossProfit === "" ? null : Number(svtGrossProfit),
    expectedBeforeCutoff: svtBeforeCutoff,
  });
  function applySvtRationale() {
    setRoutingRationale(
      svtObjective === "none"
        ? routingRationale
        : svtGate.failedGate
          ? `${SVT_OBJECTIVE_LABELS[svtObjective]} — ${svtGate.failedGate}.`
          : `${SVT_OBJECTIVE_LABELS[svtObjective]} — passes all five gates. Gross $${svtGate.gross.toLocaleString()}, expected $${svtGate.expected.toLocaleString()} at 75% verification.`,
    );
  }
  function applySvtCompensation() {
    setComp(String(Math.round(svtGate.expected * 0.25)));
  }
  const partnerRoutedFee =
    qualifyingComp === ""
      ? null
      : computePartnerRoutedFee(
          Number(qualifyingComp) || 0,
          feeMin === "" ? null : Number(feeMin),
          feeMax === "" ? null : Number(feeMax),
        );
  function applyPartnerRoutedFee() {
    if (partnerRoutedFee !== null) setComp(String(partnerRoutedFee));
  }
  return (
    <tr className="border-t align-top">
      <td className="p-4 pl-6">
        <b>{row.companyName}</b>
        <div className="text-xs text-slate-500">
          Referred by {row.partnerEmail}
        </div>
        {needsRoutingReview && (
          <Badge className="mt-2 bg-[#fff0e5] text-[#bc5a15]">
            Needs routing review
          </Badge>
        )}
      </td>
      <td className="p-4">
        <Badge variant="outline">{row.fleetSize || "?"} vehicles</Badge>
        <div className="mt-1 text-xs text-slate-500">
          {row.location} ·{" "}
          {row.leadPath === "amazon_dsp" ? "DSP" : "Commercial"}
        </div>
        <dl className="mt-2 max-w-64 space-y-1 text-xs leading-5 text-slate-500">
          {row.vehicleTypes && (
            <div>
              <dt className="inline font-semibold text-slate-600">Class: </dt>
              <dd className="inline">{row.vehicleTypes}</dd>
            </div>
          )}
          {row.maintenanceScope && (
            <div>
              <dt className="inline font-semibold text-slate-600">Scope: </dt>
              <dd className="inline">{row.maintenanceScope}</dd>
            </div>
          )}
          {row.opportunity && (
            <div>
              <dt className="inline font-semibold text-slate-600">Need: </dt>
              <dd className="inline">{row.opportunity}</dd>
            </div>
          )}
        </dl>
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
        <textarea
          className="mt-2 w-full max-w-60 rounded border px-2 py-1 text-xs text-slate-700"
          placeholder="Routing rationale (e.g. geography, threshold, footprint)"
          rows={2}
          value={routingRationale}
          onChange={(e) => setRoutingRationale(e.target.value)}
        />
        <details className="mt-2 max-w-60 rounded border border-slate-200 bg-slate-50 text-xs">
          <summary className="cursor-pointer select-none px-2 py-1 font-semibold text-slate-600">
            SVT / Exhibit A gates —{" "}
            {svtObjective === "none" ? (
              <span className="font-normal text-slate-400">not an SVT objective</span>
            ) : svtGate.failedGate ? (
              <span className="font-normal text-[#bc5a15]">Apex ({svtGate.failedGate.split(" — ")[0]})</span>
            ) : (
              <span className="font-normal text-emerald-700">SVT-eligible</span>
            )}
          </summary>
          <div className="space-y-2 border-t border-slate-200 p-2">
            <div className="text-slate-500">
              Gate 1 — footprint:{" "}
              {svtGate.footprintMatch ? (
                <span className="text-emerald-700">match ({svtGate.footprintMatch}), verify</span>
              ) : (
                <span className="text-slate-400">no match in location text</span>
              )}
            </div>
            <label className="block">
              <span className="text-slate-500">Named Exhibit A objective</span>
              <select
                className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                value={svtObjective}
                onChange={(e) => setSvtObjective(e.target.value)}
              >
                {Object.entries(SVT_OBJECTIVE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            {svtObjective !== "none" && svtObjective !== "amazon_registration" && svtObjective !== "amazon_meeting" && (
              <label className="block">
                <span className="text-slate-500">Units (default: fleet size)</span>
                <input
                  className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                  type="number" min="0"
                  value={svtUnits}
                  onChange={(e) => setSvtUnits(e.target.value)}
                />
              </label>
            )}
            {svtObjective === "amazon_meeting" && (
              <label className="block">
                <span className="text-slate-500">Attendees (of the 4 named contacts)</span>
                <input
                  className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                  type="number" min="0" max="4"
                  value={svtAttendees}
                  onChange={(e) => setSvtAttendees(e.target.value)}
                />
              </label>
            )}
            {svtObjective === "amazon_registration" && (
              <label className="flex items-center gap-1.5 text-slate-500">
                <input
                  type="checkbox"
                  checked={svtAmazonConfirmed}
                  onChange={(e) => setSvtAmazonConfirmed(e.target.checked)}
                />
                Written confirmation from Amazon received
              </label>
            )}
            {svtObjective === "enterprise_pma" && (
              <>
                <label className="block">
                  <span className="text-slate-500">Gate 3 — term (months, need ≥ 12)</span>
                  <input
                    className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                    type="number" min="0"
                    value={svtTermMonths}
                    onChange={(e) => setSvtTermMonths(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-slate-500">Gate 3 — annual gross profit (need ≥ $100,000)</span>
                  <input
                    className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                    type="number" min="0"
                    value={svtGrossProfit}
                    onChange={(e) => setSvtGrossProfit(e.target.value)}
                  />
                </label>
              </>
            )}
            {svtObjective !== "none" && (
              <div className="text-slate-500">
                Gate 5 — {svtDaysToCutoff()} days until the Jan 31 2027 term cutoff.
                <div className="mt-1 flex gap-3">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`cutoff-${row.id}`}
                      checked={svtBeforeCutoff === true}
                      onChange={() => setSvtBeforeCutoff(true)}
                    />
                    Expected before
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`cutoff-${row.id}`}
                      checked={svtBeforeCutoff === false}
                      onChange={() => setSvtBeforeCutoff(false)}
                    />
                    Not before
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`cutoff-${row.id}`}
                      checked={svtBeforeCutoff === null}
                      onChange={() => setSvtBeforeCutoff(null)}
                    />
                    Unknown
                  </label>
                </div>
              </div>
            )}
            {svtObjective !== "none" && (
              <div className="rounded bg-white p-1.5 text-slate-600">
                Gross ${svtGate.gross.toLocaleString()} · Eligible ${svtGate.eligible.toLocaleString()} · Expected ${svtGate.expected.toLocaleString()}{" "}
                <span className="text-slate-400">(75% verification probability, per Exhibit A decision 4)</span>
                {svtGate.failedGate && <div className="mt-1 text-[#bc5a15]">{svtGate.failedGate}.</div>}
              </div>
            )}
            {svtObjective !== "none" && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-100"
                  onClick={applySvtRationale}
                >
                  Use as rationale
                </button>
                {category === "partner_routed_25_percent" && !svtGate.failedGate && (
                  <button
                    type="button"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-100"
                    onClick={applySvtCompensation}
                  >
                    Use 25% of expected as compensation
                  </button>
                )}
              </div>
            )}
          </div>
        </details>
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
        {category === "partner_routed_25_percent" && (
          <div className="mt-2 max-w-52 space-y-1.5 rounded border border-slate-200 bg-slate-50 p-2 text-xs">
            <p className="text-slate-500">
              Per the agreement: 25% of qualifying compensation Apex or Brooke
              actually receives, subject to any written min/max.
            </p>
            <label className="block">
              <span className="text-slate-500">Qualifying compensation received</span>
              <input
                className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                type="number" min="0" step=".01"
                value={qualifyingComp}
                onChange={(e) => setQualifyingComp(e.target.value)}
              />
            </label>
            <div className="flex gap-1.5">
              <label className="block flex-1">
                <span className="text-slate-500">Written min</span>
                <input
                  className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                  type="number" min="0" step=".01"
                  value={feeMin}
                  onChange={(e) => setFeeMin(e.target.value)}
                />
              </label>
              <label className="block flex-1">
                <span className="text-slate-500">Written max</span>
                <input
                  className="mt-1 w-full rounded border px-1 py-0.5 text-xs text-slate-700"
                  type="number" min="0" step=".01"
                  value={feeMax}
                  onChange={(e) => setFeeMax(e.target.value)}
                />
              </label>
            </div>
            {partnerRoutedFee !== null && (
              <div className="rounded bg-white p-1.5 text-slate-600">
                25% fee: ${partnerRoutedFee.toLocaleString()}
                <button
                  type="button"
                  className="ml-2 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                  onClick={applyPartnerRoutedFee}
                >
                  Use as compensation
                </button>
              </div>
            )}
          </div>
        )}
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
              routingRationale,
              svtObjective,
              svtUnits: svtUnits === "" ? null : Number(svtUnits),
              svtAttendees: svtAttendees === "" ? null : Number(svtAttendees),
              svtEnterpriseTermMonths: svtTermMonths === "" ? null : Number(svtTermMonths),
              svtEnterpriseGrossProfit: svtGrossProfit === "" ? null : Number(svtGrossProfit),
              svtAmazonRegistrationConfirmed: svtAmazonConfirmed,
              svtExpectedBeforeCutoff: svtBeforeCutoff,
              qualifyingCompensationReceived: qualifyingComp === "" ? null : Number(qualifyingComp),
              feeMinOverride: feeMin === "" ? null : Number(feeMin),
              feeMaxOverride: feeMax === "" ? null : Number(feeMax),
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
