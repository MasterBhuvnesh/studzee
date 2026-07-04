import { base, heading, subheading, syne } from '@/constants/fonts';
import { cn } from '@/lib';
import '@/styles/globals.css';
import { generateMetadata } from '@/utils';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

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
      className={cn('font-sans dark', inter.variable)}
    >
      <body
        className={cn(
          'min-h-screen bg-background text-foreground antialiased font-heading overflow-x-hidden ',
          base.variable,
          heading.variable,
          subheading.variable,
          syne.variable
        )}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
