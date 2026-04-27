import type { LucideIcon } from "lucide-react";

export interface HomeArticle {
  title: string;
  slug: string;
  sectionId?: string;
  category: string;
  categoryColor: string;
  description: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
}

export interface HomeMetric {
  label: string;
  note: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
}

export interface HomeStandardCard {
  code: string;
  title: string;
  description: string;
  href: string;
  note: string;
}

export interface HomePhasePreview {
  id: string;
  title: string;
  summary: string;
  href: string;
  image: string;
  accentColor: string;
}

export interface HomeFeedGroup {
  id: string;
  label: string;
  description: string;
  href: string;
  ctaLabel: string;
  totalCount: number;
  articles: HomeArticle[];
}
