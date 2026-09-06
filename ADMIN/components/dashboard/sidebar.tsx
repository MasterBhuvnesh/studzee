"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Home01Icon,
  File01Icon,
  Award01Icon,
  Notification01Icon,
  Mail01Icon,
  UserGroupIcon,
  SparklesIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { UserButton, useUser } from "@clerk/nextjs";

type NavItem = { label: string; icon: IconSvgElement; href?: string };

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Content",
    items: [
      { label: "Overview", icon: Home01Icon, href: "/" },
      { label: "Documents", icon: File01Icon, href: "/documents" },
      { label: "Quests", icon: Award01Icon, href: "/quests" },
    ],
  },
  {
    title: "Outreach",
    items: [
      { label: "Notifications", icon: Notification01Icon, href: "/notifications" },
      { label: "Email", icon: Mail01Icon, href: "/email" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Users", icon: UserGroupIcon, href: "/users" },
      { label: "AI Drafts", icon: SparklesIcon, href: "/ai-drafts" },
      { label: "Settings", icon: Settings02Icon, href: "/settings" },
    ],
  },
];

export function Sidebar({
  active = "Overview",
  className = "hidden lg:flex",
}: {
  active?: string;
  className?: string;
}) {
  return (
    <aside className={`${className} w-64 shrink-0 flex-col border-r bg-sidebar`}>
      <div className="p-4">
        <div className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 shadow-xs">
          <span className="flex-1 text-left">
            <span className="block text-[11px] text-muted-foreground">Platform</span>
            <span className="block text-sm font-medium">Studzee</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {sections.map((section, i) => (
          <div key={section.title} className={i > 0 ? "mt-4 border-t pt-4" : ""}>
            <p className="px-2 pb-2 text-xs text-foreground">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "#"}
                    className={
                      item.label === active
                        ? "flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-sm font-medium shadow-xs"
                        : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  >
                    <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative p-4 pt-0">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-t from-sidebar to-transparent" />
        <SidebarProfile />
      </div>
    </aside>
  );
}

/** The signed-in admin's card at the foot of the nav. */
function SidebarProfile() {
  const { user } = useUser();
  return (
    <div className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 shadow-xs">
      <UserButton afterSignOutUrl="/sign-in" />
      <span className="flex-1 text-left">
        <span className="block truncate text-sm font-semibold">
          {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Admin"}
        </span>
        <span className="block text-[11px] text-muted-foreground">Administrator</span>
      </span>
    </div>
  );
}
