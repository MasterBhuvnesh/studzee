import { Server, Cloud, type LucideIcon } from 'lucide-react';

export const PATHS = {
  'system-design': {
    slug: 'system-design',
    label: 'System Design',
    blurb:
      'Design systems that scale — from first estimates to caches, queues, and databases.',
    accent: 'var(--brand-purple)',
    icon: Server as LucideIcon,
  },
  devops: {
    slug: 'devops',
    label: 'DevOps',
    blurb:
      'Ship safely and often — culture, CI/CD, containers, and Kubernetes.',
    accent: 'var(--brand-orange)',
    icon: Cloud as LucideIcon,
  },
} as const;

export type PathSlug = keyof typeof PATHS;
export const PATH_SLUGS = ['system-design', 'devops'] as const;

export function isPathSlug(v: string): v is PathSlug {
  return v === 'system-design' || v === 'devops';
}
