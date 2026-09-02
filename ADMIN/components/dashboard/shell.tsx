import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function Shell({
  breadcrumb,
  active,
  children,
}: {
  breadcrumb: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-2 border-comp-border px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav>
              <Sidebar active={active} className="flex h-full" />
            </MobileNav>
            <nav className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="hidden text-muted-foreground sm:inline">Studzee Admin</span>
              <span className="hidden text-muted-foreground sm:inline">›</span>
              <span className="truncate font-medium">{breadcrumb}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search..."
                className="h-9 w-72 rounded-lg border-transparent bg-muted/60 pr-12 pl-9 shadow-none"
              />
              <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘ K
              </kbd>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
