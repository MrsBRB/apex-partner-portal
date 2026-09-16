"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Does it cost anything to become a partner?",
    a: "No. Applying is free, there's no obligation, and it takes about ten minutes.",
  },
  {
    q: "How much can I earn per referral?",
    a: "Eligible compensation runs $500 to $5,000 or more per qualified referral, depending on the opportunity. The details are in the referral partner agreement you sign once you're approved.",
  },
  {
    q: "What do I need to do after I make an introduction?",
    a: "Nothing beyond submitting it in the portal. Apex handles the outreach, the pricing conversation, and the service delivery from there.",
  },
  {
    q: "What counts as a good referral?",
    a: "Companies that run a meaningful commercial fleet and need an ongoing maintenance relationship rather than a single repair, reachable in California, Nevada, or Arizona.",
  },
  {
    q: "What if my referral doesn't turn into anything?",
    a: "No fee is owed if it doesn't become an active opportunity, that's normal, and there's no downside to referring someone who turns out not to be a fit.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger className="text-base font-bold text-[#1a1a2e] hover:no-underline [&>svg]:text-[#e87b2f]">{item.q}</AccordionTrigger>
          <AccordionContent className="text-[15px] leading-7 text-slate-600">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
