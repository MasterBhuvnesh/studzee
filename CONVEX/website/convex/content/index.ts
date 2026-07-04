import { authors } from './authors';
import { systemDesignBlogs } from './systemDesign';
import { devopsBlogs } from './devops';

export type SeedAuthor = {
  slug: string;
  name: string;
  avatar: string;
  role: string;
  bio: string;
  socials: { twitter?: string; github?: string; website?: string };
};

export type SeedQuiz = {
  question: string;
  options: string[];
  answerIndex: number;
};

export type SeedBlog = {
  path: 'system-design' | 'devops';
  slug: string;
  title: string;
  authorSlug: string;
  tags: string[];
  shortDescription: string;
  facts: string[];
  description: string;
  bannerImg: string;
  summary: string;
  quiz: SeedQuiz[];
  linkedSlugs: string[];
  order: number;
};

export const seedAuthors: SeedAuthor[] = authors;
export const seedBlogs: SeedBlog[] = [...systemDesignBlogs, ...devopsBlogs];
