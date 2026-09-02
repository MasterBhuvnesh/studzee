"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="border-2 border-comp-border"
      aria-label="Toggle dark mode"
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", dark ? "dark" : "light");
      }}
    >
      <HugeiconsIcon icon={Moon02Icon} size={18} className="dark:hidden" />
      <HugeiconsIcon icon={Sun03Icon} size={18} className="hidden dark:block" />
    </Button>
  );
}
