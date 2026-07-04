import type { SeedAuthor } from './index';

export const authors: SeedAuthor[] = [
  {
    slug: 'aarav-mehta',
    name: 'Aarav Mehta',
    avatar: 'https://i.pravatar.cc/200?u=aarav-mehta',
    role: 'Principal Engineer, Distributed Systems',
    bio: 'Aarav has spent a decade building systems that stay up at 3am so nobody gets paged. Writes about scale, trade-offs, and why the boring solution usually wins.',
    socials: { twitter: 'aarav_builds', github: 'aaravmehta', website: 'https://aarav.dev' },
  },
  {
    slug: 'lena-fischer',
    name: 'Lena Fischer',
    avatar: 'https://i.pravatar.cc/200?u=lena-fischer',
    role: 'Staff SRE & Platform Lead',
    bio: 'Lena turns fragile deploys into boring ones. Container nerd, pipeline gardener, and a firm believer that observability beats guessing.',
    socials: { github: 'lenafischer', website: 'https://lena.sh' },
  },
];
