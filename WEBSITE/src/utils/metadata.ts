import { Metadata } from 'next';

interface MetadataProps {
  title?: string;
  description?: string;
  icons?: Metadata['icons'];
  noIndex?: boolean;
  keywords?: string[];
  author?: string;
  twitterHandle?: string;
  type?: 'website' | 'article' | 'profile';
  locale?: string;
  alternates?: Record<string, string>;
  publishedTime?: string;
  modifiedTime?: string;
}

export const generateMetadata = ({
  title = `Studzee`,
  description = `Studzee is a next-gen ed-tech platform that organises, delivers, and automates educational content across mobile, web, and desktop. Built for students and developers who refuse to settle.`,
  icons = [
    {
      rel: 'icon',
      url: '/icons/icon.png',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      url: '/icons/icon-dark.png',
      media: '(prefers-color-scheme: dark)',
    },
  ],
  noIndex = false,
  keywords = [
    'studzee',
    'edtech platform',
    'saas learning',
    'student app',
    'educational content',
    'AI learning',
    'study app',
    'cross-platform education',
    'quiz generation',
    'microservice edtech',
    'document learning',
    'AI content automation',
  ],
  author = process.env.NEXT_PUBLIC_AUTHOR_NAME,
  type = 'website',
}: MetadataProps = {}): Metadata => {
  const metadataBase = new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://studzee.in'
  );

  return {
    metadataBase,
    title: {
      template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      default: title,
    },
    description,
    keywords,
    authors: [{ name: author }],
    creator: author,
    publisher: process.env.NEXT_PUBLIC_APP_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons,
    openGraph: {
      type,
      title: `Studzee — The platform that takes studying seriously`,
      description: `Structured learning. Everywhere you are. Studzee delivers educational content across every platform — powered by a microservice backend built to scale.`,
      url: metadataBase,
      siteName: 'Studzee',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Studzee — Learn smarter. Study better.`,
      description: `Structured learning. Everywhere you are. Built for students who mean it.`,
      creator: '@vermaji_2904',
    },
  };
};
