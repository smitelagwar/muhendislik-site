import fs from "fs";
import path from "path";
import type { SiteSectionId } from "./site-sections";

export interface ArticleData {
    slug: string;
    title: string;
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    sectionId: SiteSectionId;
    category: string;
    categoryColor: string;
    badgeLabel: string;
    author: string;
    authorTitle: string;
    date: string;
    updatedAt?: string;
    readTime: string;
    image: string;
    sections: { id: string; title: string; content: string; subsections: { id: string; title: string }[] }[];
    quote: { text: string };
    relatedSlugs: string[];
    keywords?: string[];
    tags?: string[];
    references?: Array<{
        label: string;
        href?: string;
        note?: string;
    }>;
}

interface ArticleCache {
    signature: string;
    articles: Record<string, ArticleData>;
    slugs: string[];
    list: ArticleData[];
}

const dataFilePath = path.join(process.cwd(), "src/lib/data.json");

let articleCache: ArticleCache | null = null;

function getDataFileSignature() {
    try {
        const stats = fs.statSync(dataFilePath);
        return `${stats.mtimeMs}:${stats.size}`;
    } catch (error) {
        throw new Error(
            `Makale veri dosyası bilgisi alınamadı: ${dataFilePath} (${error instanceof Error ? error.message : "bilinmeyen hata"})`,
        );
    }
}

function readArticlesFile() {
    try {
        return fs.readFileSync(dataFilePath, "utf8");
    } catch (error) {
        throw new Error(
            `Makale veri dosyası okunamadı: ${dataFilePath} (${error instanceof Error ? error.message : "bilinmeyen hata"})`,
        );
    }
}

function parseArticles(fileContent: string) {
    try {
        return JSON.parse(fileContent) as Record<string, ArticleData>;
    } catch (error) {
        throw new Error(
            `Makale veri dosyası ayrıştırılamadı: ${dataFilePath} (${error instanceof Error ? error.message : "bilinmeyen hata"})`,
        );
    }
}

function getArticleCache() {
    const signature = getDataFileSignature();

    if (articleCache?.signature === signature) {
        return articleCache;
    }

    const articles = parseArticles(readArticlesFile());
    articleCache = {
        signature,
        articles,
        slugs: Object.keys(articles),
        list: Object.values(articles),
    };

    return articleCache;
}

export function getArticles(): Record<string, ArticleData> {
    return getArticleCache().articles;
}

export function getArticleList(): ArticleData[] {
    return [...getArticleCache().list];
}

export function getArticleBySlug(slug: string): ArticleData | undefined {
    return getArticleCache().articles[slug];
}

export function getAllSlugs(): string[] {
    return [...getArticleCache().slugs];
}

export function getArticlesCacheSignature(): string {
    return getArticleCache().signature;
}
