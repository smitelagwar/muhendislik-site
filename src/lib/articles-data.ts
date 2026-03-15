import fs from 'fs';
import path from 'path';
import type { SiteSectionId } from "./site-sections";

export interface ArticleData {
    slug: string;
    title: string;
    description: string;
    sectionId: SiteSectionId;
    category: string;
    categoryColor: string;
    badgeLabel: string;
    author: string;
    authorTitle: string;
    date: string;
    readTime: string;
    image: string;
    sections: { id: string; title: string; content: string; subsections: { id: string; title: string }[] }[];
    quote: { text: string };
    relatedSlugs: string[];
}

const dataFilePath = path.join(process.cwd(), 'src/lib/data.json');

export function getArticles(): Record<string, ArticleData> {
    try {
        const fileContent = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Error reading articles data:", error);
        return {};
    }
}

export function getArticleBySlug(slug: string): ArticleData | undefined {
    const articles = getArticles();
    return articles[slug];
}

export function getAllSlugs(): string[] {
    const articles = getArticles();
    return Object.keys(articles);
}
