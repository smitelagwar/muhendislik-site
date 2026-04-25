import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticles } from "@/lib/articles-data";
import { buildSeoMetadata } from "@/lib/seo";
import { resolveSiteUrl } from "@/lib/site-config";
import { SITE_SECTIONS, matchesSiteSection } from "@/lib/site-sections";
import { getLiveTools } from "@/lib/tools-data";

const STATIC_PAGES = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
  { label: "Gizlilik", href: "/gizlilik" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Araçlar Dizini", href: "/kategori/araclar" },
];

export const metadata: Metadata = buildSeoMetadata({
  title: "Konu Haritası",
  description: "Kategori ağacını, teknik içerikleri, hesap araçlarını ve sabit sayfaları tek ekranda keşfedin.",
  pathname: "/konu-haritasi",
  keywords: ["konu haritası", "mühendislik içerikleri", "hesap araçları", "kategori ağacı"],
});

export default function TopicMapPage() {
  const articles = Object.values(getArticles());
  const tools = getLiveTools();

  const treeData = SITE_SECTIONS.map((section) => ({
    section,
    articles: section.id === "araclar" ? [] : articles.filter((article) => matchesSiteSection(article, section.id)),
    tools: section.id === "araclar" ? tools : [],
  }));

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Konu Haritası",
    description: "Kategori ağacını, teknik içerikleri, hesap araçlarını ve sabit sayfaları tek ekranda keşfedin.",
    url: resolveSiteUrl("/konu-haritasi"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: SITE_SECTIONS.map((section, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: section.title,
        url: resolveSiteUrl(section.href),
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <Badge className="rounded-full bg-blue-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
            Keşif merkezi
          </Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">Konu haritası</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            Sitedeki tüm kategori dallarını, makaleleri ve hesap araçlarını tek ekranda görün. Araçlar ayrı bir kategori
            olarak kalır; teknik içerikler kendi dallarında listelenir.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {treeData.map(({ section, articles: sectionArticles, tools: sectionTools }) => (
            <section key={section.id} className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {section.id === "araclar" ? "Araç kategorisi" : "Kategori"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{section.description}</p>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={section.href}>Kategoriye git</Link>
                </Button>
              </div>

              {section.id === "araclar" ? (
                <div className="grid gap-3">
                  {sectionTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 transition-colors hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800 dark:hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-950 dark:text-white">{tool.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tool.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {sectionArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/${article.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 transition-colors hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800 dark:hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-950 dark:text-white">{article.title}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{article.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sabit sayfalar</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {STATIC_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-bold text-zinc-800 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-800 dark:hover:text-blue-300"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
