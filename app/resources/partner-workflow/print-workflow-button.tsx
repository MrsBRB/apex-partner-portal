"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintWorkflowButton() {
  return (
    <Button
      type="button"
      className="bg-[#e87b2f] font-bold hover:bg-[#bc5a15] print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Print or save as PDF
    </Button>
  );
}
