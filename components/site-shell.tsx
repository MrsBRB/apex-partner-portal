/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BOOKING_URL = "https://bookings.cloud.microsoft/book/ApexFleetConsulting2@apexfleetconsulting.com/?ismsaljsauthenabled";

export function SiteShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-[#e87b2f] bg-[#eef0f3]">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="https://static.wixstatic.com/media/73c349_a08994377d83419dad45199b685920da~mv2.png" alt="Apex Fleet Consulting" className="h-12 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-2">
          {!compact && <Link href="/#how-it-works" className="hidden px-3 text-sm font-semibold text-slate-600 md:block">How it works</Link>}
          <Button variant="ghost" asChild><Link href="/portal">Partner sign in</Link></Button>
          <Button asChild className="bg-[#e87b2f] font-bold hover:bg-[#bc5a15]"><Link href="/apply">Apply now <ArrowUpRight /></Link></Button>
        </nav>
      </div>
    </header>
    {children}
    <footer className="border-t border-white/10 bg-[#0d1f35] text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-bold text-white">Apex Fleet Consulting</div>
            <p className="mt-2 max-w-sm text-sm leading-6">Questions about the referral partner program? Reach out anytime.</p>
            <a href="mailto:info@apexfleetconsulting.com" className="mt-3 inline-block text-sm font-semibold text-[#f39a5b] hover:text-[#f3a469]">info@apexfleetconsulting.com</a>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <Link href="/apply" className="hover:text-white">Apply as a partner</Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">Book a quick call</a>
            <Link href="/resources/agreement" className="hover:text-white">Referral partner agreement</Link>
            <Link href="/resources/qualification-guide" className="hover:text-white">Qualification guide</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-400">&copy; {new Date().getFullYear()} Apex Fleet Consulting LLC.</div>
      </div>
    </footer>
  </div>;
}
