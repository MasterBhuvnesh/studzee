"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        className="border-2 border-comp-border lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex max-w-[85vw] shadow-lg">
            {children}
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            className="absolute top-3 left-[17rem] max-[20rem]:hidden bg-card shadow-md"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </Button>
        </div>
      )}
    </>
  );
}
