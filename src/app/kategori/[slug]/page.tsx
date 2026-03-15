import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    Building2,
    ChevronRight,
    Clock,
    FileText,
    HardHat,
    Layers,
    Leaf,
    type LucideIcon,
    Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ArticleData, getArticles } from "@/lib/articles-data";
import { getSiteSectionById, matchesSiteSection, SITE_SECTIONS, type SiteSectionId } from "@/lib/site-sections";

const SECTION_ICONS: Record<SiteSectionId, LucideIcon> = {
    araclar: FileText,
    "yapi-tasarimi": Building2,
    "deprem-yonetmelik": Shield,
    geoteknik: Layers,
    santiye: HardHat,
    malzeme: Building2,
    surdurulebilirlik: Leaf,
};

const SECTION_STYLES: Record<SiteSectionId, { color: string; bgColor: string }> = {
    araclar: { color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-50 dark:bg-indigo-950/40" },
    "yapi-tasarimi": { color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/40" },
    "deprem-yonetmelik": { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/40" },
    geoteknik: { color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/40" },
    santiye: { color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/40" },
    malzeme: { color: "text-zinc-600 dark:text-zinc-300", bgColor: "bg-zinc-50 dark:bg-zinc-900" },
    surdurulebilirlik: { color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/40" },
};

export function generateStaticParams() {
    return SITE_SECTIONS.filter((section) => section.id !== "araclar").map((section) => ({ slug: section.id }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const sectionId = slug as SiteSectionId;
    const section = getSiteSectionById(sectionId);

    if (!section || section.id === "araclar") {
        notFound();
    }

    const articlesMap = getArticles();
    const allArticles = Object.values(articlesMap);
    const articles = allArticles.filter((article) => matchesSiteSection(article, section.id));
    const Icon = SECTION_ICONS[section.id];
    const styles = SECTION_STYLES[section.id];

    return (
        <div className="min-h-screen py-8 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <nav className="mb-8 flex overflow-x-auto whitespace-nowrap pb-2 text-xs font-bold text-zinc-500 no-scrollbar">
                    <Link href="/" className="transition-colors hover:text-blue-600">Ana Sayfa</Link>
                    <ChevronRight className="mx-2 h-3 w-3 flex-shrink-0" />
                    <Link href="/konu-haritasi" className="transition-colors hover:text-blue-600">Kategoriler</Link>
                    <ChevronRight className="mx-2 h-3 w-3 flex-shrink-0" />
                    <span className="text-zinc-900 dark:text-zinc-300">{section.title}</span>
                </nav>

                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center">
                    <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl ${styles.bgColor}`}>
                        <Icon className={`h-10 w-10 ${styles.color}`} />
                    </div>
                    <div>
                        <h1 className="mb-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                            {section.title}
                        </h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 md:text-base">
                            {section.description} • {articles.length} içerik
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                        <ArticleCard key={article.slug} article={article} />
                    ))}

                    {articles.length === 0 && (
                        <div className="py-12 text-center md:col-span-2 lg:col-span-3">
                            <div className="rounded-3xl border-2 border-dashed border-zinc-200 p-10 dark:border-zinc-800">
                                <p className="font-medium text-zinc-500">Bu kategoride henüz içerik bulunmuyor.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ArticleCard({ article }: { article: ArticleData }) {
    return (
        <Link href={`/${article.slug}`} className="group block h-full">
            <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 z-10">
                        <Badge
                            variant="secondary"
                            className={`${article.categoryColor} border-none bg-white/90 font-bold shadow-md backdrop-blur-md dark:bg-zinc-900/90`}
                        >
                            {article.category}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                    <h2 className="mb-3 line-clamp-2 text-xl font-black leading-snug text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {article.title}
                    </h2>
                    <p className="mb-6 line-clamp-2 flex-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {article.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/50">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{article.author}</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">
                            <Clock className="h-3 w-3" /> {article.readTime}
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
