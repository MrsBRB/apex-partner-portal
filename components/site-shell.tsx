/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  </div>;
}
