import fs from "fs";
import path from "path";
import type { SiteSectionId } from "./site-sections";
import type { DepremSeriesId, RegulationStatus } from "./deprem-content-types";
import { DEPREM_TOPIC_ARTICLES } from "./deprem-topic-articles";
import { normalizeExistingDepremArticle } from "./deprem-existing-overrides";
import { applyDepremPilotOverride, getDepremPilotContentSignature } from "./deprem-pilot-articles";
import { applyDepremPhase3Override, DEPREM_PHASE3_SLUGS, getDepremPhase3ContentSignature } from "./deprem-phase3-articles";
import { applyDepremPhase4Override, DEPREM_PHASE4_SLUGS, getDepremPhase4ContentSignature } from "./deprem-phase4-articles";
import { applyDepremPhase5Override, DEPREM_PHASE5_SLUGS, getDepremPhase5ContentSignature } from "./deprem-phase5-articles";
import { applyDepremPhase6Override, DEPREM_PHASE6_SLUGS, getDepremPhase6ContentSignature } from "./deprem-phase6-articles";
import { applyDepremRolloutEnhancement, getDepremRolloutSignature } from "./deprem-rollout";
import { TS500_ARTICLES, TS500_SLUGS } from "./ts500-content";
import { normalizeDepremContentAuthor } from "./content-author";

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
    seriesId?: DepremSeriesId;
    regulationStatus?: RegulationStatus;
    readTime: string;
    image: string;
    sections: { id: string; title: string; content: string; subsections: { id: string; title: string }[] }[];
    quote?: { text: string };
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
        const parsedArticles = JSON.parse(fileContent) as Record<string, ArticleData>;
        const normalizedArticles = Object.fromEntries(
            Object.entries(parsedArticles)
                // ts500-content modülünde yönetilen makaleleri data.json'dan hariç tut
                .filter(([slug]) => !TS500_SLUGS.has(slug))
                .map(([slug, article]) => [slug, normalizeExistingDepremArticle(article)]),
        ) as Record<string, ArticleData>;

        // TS 500 zengin içerik makaleleri
        for (const article of TS500_ARTICLES) {
            if (normalizedArticles[article.slug]) {
                throw new Error(`TS 500 içeriği mevcut bir slug ile çakışıyor: ${article.slug}`);
            }
            normalizedArticles[article.slug] = article;
        }

        // Deprem konu makaleleri (TBDY, mevcut bina vb.)
        for (const article of DEPREM_TOPIC_ARTICLES) {
            if (normalizedArticles[article.slug]) {
                throw new Error(`Yeni deprem içeriği mevcut bir slug ile çakışıyor: ${article.slug}`);
            }
            normalizedArticles[article.slug] = article;
        }

        // FAZ 2 pilotları ve teknik gövde override'ları önce uygulanır.
        // Rollout enhancement, makalenin sahibi olan en son teknik fazdan sonra çalışır.
        // Böylece eski fazların donmuş source-of-truth sırası korunurken yeni fazlar
        // yalnız kendi slug kümelerinde son teknik gövdeyi görselleştirir.
        for (const [slug, article] of Object.entries(normalizedArticles)) {
            const pilotArticle = applyDepremPilotOverride(article);
            const phase3Article = applyDepremPhase3Override(pilotArticle);
            const phase4Article = applyDepremPhase4Override(phase3Article);
            const phase5Article = applyDepremPhase5Override(phase4Article);
            const phase6Article = applyDepremPhase6Override(phase5Article);

            const rolloutArticle = DEPREM_PHASE6_SLUGS.has(slug)
                ? applyDepremRolloutEnhancement(phase6Article)
                : DEPREM_PHASE5_SLUGS.has(slug)
                  ? applyDepremRolloutEnhancement(phase5Article)
                  : DEPREM_PHASE4_SLUGS.has(slug)
                    ? applyDepremRolloutEnhancement(phase4Article)
                    : applyDepremRolloutEnhancement(phase3Article);

            normalizedArticles[slug] = DEPREM_PHASE6_SLUGS.has(slug)
                ? { ...rolloutArticle, updatedAt: phase6Article.updatedAt }
                : DEPREM_PHASE5_SLUGS.has(slug)
                  ? { ...rolloutArticle, updatedAt: phase5Article.updatedAt }
                  : DEPREM_PHASE4_SLUGS.has(slug)
                    ? { ...rolloutArticle, updatedAt: phase4Article.updatedAt }
                    : rolloutArticle;
        }

        return Object.fromEntries(
            Object.entries(normalizedArticles).map(([slug, article]) => [slug, normalizeDepremContentAuthor(article)]),
        ) as Record<string, ArticleData>;
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
    const supplementalSignature = [
        DEPREM_TOPIC_ARTICLES
            .map((article) => `${article.slug}:${article.updatedAt ?? article.date}:${article.title}`)
            .join("|"),
        getDepremPilotContentSignature(),
        getDepremPhase3ContentSignature(),
        getDepremPhase4ContentSignature(),
        getDepremPhase5ContentSignature(),
        getDepremPhase6ContentSignature(),
        getDepremRolloutSignature(),
    ].filter(Boolean).join("|");
    return `${getArticleCache().signature}:${supplementalSignature}`;
}