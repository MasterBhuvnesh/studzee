import { Inter, Syne } from 'next/font/google';

export const heading = Inter({
  subsets: ['latin'],
  variable: '--font-heading',
});

// Display font for generated blog banners.
export const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const base = Inter({
  subsets: ['latin'],
  variable: '--font-base',
});

export const subheading = Inter({
  subsets: ['latin'],
  variable: '--font-subheading',
});
