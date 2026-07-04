'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { FOOTER_NAV, MAIN_NAV, PATHS_NAV } from '@/constants/app-nav';
import { NavUser } from '@/components/app/nav-user';

type NavItem = { name: string; href: string; icon: LucideIcon };

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const Icon = item.icon;
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(item.href)}
            tooltip={item.name}
          >
            <Link href={item.href}>
              <Icon className="size-4.5" />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 py-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/icon.png"
              alt="Studzee"
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-md object-contain"
            />
            <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Studzee
            </span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>{renderItems(MAIN_NAV)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarMenu>{renderItems(PATHS_NAV)}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>{renderItems(FOOTER_NAV)}</SidebarMenu>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
