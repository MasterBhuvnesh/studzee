import { base, heading, subheading } from '@/constants/fonts';
import { cn } from '@/lib';
import '@/styles/globals.css';
import { generateMetadata } from '@/utils';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = generateMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', inter.variable)}
    >
      <body
        className={cn(
          'min-h-screen bg-background text-foreground antialiased font-heading overflow-x-hidden !scrollbar-hide',
          base.variable,
          heading.variable,
          subheading.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
