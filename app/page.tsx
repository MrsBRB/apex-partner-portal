// Internal workspace sites can read the authenticated OpenAI user from the
// forwarded request headers:
//
// import { headers } from "next/headers";
//
// export default async function Home() {
//   const requestHeaders = await headers();
//   const email = requestHeaders.get("oai-authenticated-user-email");
//   const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
//   const fullName =
//     encodedFullName &&
//     requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
//       "percent-encoded-utf-8"
//       ? decodeURIComponent(encodedFullName)
//       : null;
//   const displayName = fullName ?? email;
//   // ...
// }

import Link from "next/link";
import { ArrowRight, BadgeDollarSign, FileCheck2, Handshake, LayoutDashboard, Send } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return <SiteShell>
    <main>
      <section className="relative overflow-hidden bg-[#0d1f35] text-white">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_30%,rgba(232,123,47,.24),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.12fr_.88fr] lg:px-8 lg:py-28">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[.18em] text-[#f39a5b]">Apex referral partner network</p>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.03] tracking-tight md:text-7xl">Turn fleet relationships into shared growth.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200">Connect qualified organizations with the right fleet solution. Apex manages the opportunity, keeps you informed, and pays eligible compensation when your referral produces results.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button size="lg" asChild className="bg-[#e87b2f] font-bold text-white hover:bg-[#bc5a15]"><Link href="/apply">Become a partner <ArrowRight /></Link></Button><Button size="lg" variant="outline" asChild className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/portal">Open partner portal</Link></Button></div>
          </div>
          <div className="self-end rounded-[2rem] border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur">
            <div className="mb-5 flex items-center justify-between"><span className="font-semibold">Your partner workspace</span><span className="rounded-full bg-[#e87b2f]/15 px-3 py-1 text-xs font-bold text-[#f39a5b]">TRANSPARENT</span></div>
            <div className="grid gap-3 sm:grid-cols-2"><PreviewStat label="Active referrals" value="06"/><PreviewStat label="Earned compensation" value="$4,250"/></div>
            <div className="mt-3 rounded-lg bg-white p-4 text-[#1a1a2e]"><div className="mb-4 flex items-center justify-between"><b>Recent activity</b><LayoutDashboard className="size-5 text-[#e87b2f]"/></div><div className="space-y-3 text-sm"><Activity company="Northline Services" status="Proposal"/><Activity company="Metro Utility Group" status="Qualified"/><Activity company="Rapid Route Logistics" status="Paid"/></div></div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#bc5a15]">A clear process</p><h2 className="mt-3 text-4xl font-bold tracking-tight">From introduction to compensation.</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3"><Step icon={<Handshake/>} n="01" title="Apply" text="Tell us about your experience, network, and the markets you know."/><Step icon={<Send/>} n="02" title="Refer" text="Approved partners submit opportunities and supporting context in one place."/><Step icon={<BadgeDollarSign/>} n="03" title="Track & earn" text="Follow progress, documents, and eligible compensation without chasing updates."/></div>
      </section>
      <section className="bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 lg:px-8"><div><FileCheck2 className="size-9 text-[#e87b2f]"/><h2 className="mt-4 text-3xl font-bold">Everything stays connected.</h2><p className="mt-4 max-w-xl leading-7 text-slate-600">Applications, reference documents, agreements, referral activity, and compensation records live in the same workflow.</p></div><div className="grid grid-cols-2 gap-3 text-sm font-semibold"><Pill text="Application status"/><Pill text="Agreement tracking"/><Pill text="Referral history"/><Pill text="Compensation detail"/></div></div></section>
    </main>
  </SiteShell>;
}
function PreviewStat({label,value}:{label:string,value:string}){return <div className="rounded-2xl bg-white/10 p-4"><div className="text-xs text-slate-300">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></div>}
function Activity({company,status}:{company:string,status:string}){return <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span>{company}</span><span className="rounded-full bg-[#fff0e5] px-2.5 py-1 text-xs font-bold text-[#bc5a15]">{status}</span></div>}
function Step({icon,n,title,text}:{icon:React.ReactNode,n:string,title:string;text:string}){return <article className="rounded-xl border bg-white p-7 shadow-sm"><div className="flex items-center justify-between text-[#e87b2f]"><span className="rounded-lg bg-[#fff0e5] p-3">{icon}</span><span className="text-sm font-black text-slate-300">{n}</span></div><h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>}
function Pill({text}:{text:string}){return <div className="rounded-lg bg-[#f4f5f7] p-5 text-[#1a1a2e]">{text}</div>}
