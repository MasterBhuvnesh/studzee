import {
  LayoutDashboard,
  Bot,
  Brain,
  Server,
  Cloud,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';

type NavItem = { name: string; href: string; icon: LucideIcon };

export const MAIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Chat', href: '/chat', icon: Bot },
  { name: 'AI Quiz', href: '/quiz', icon: Brain },
];

export const PATHS_NAV: NavItem[] = [
  { name: 'System Design', href: '/path/system-design', icon: Server },
  { name: 'DevOps', href: '/path/devops', icon: Cloud },
];

export const FOOTER_NAV: NavItem[] = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings/billing', icon: Settings },
];
