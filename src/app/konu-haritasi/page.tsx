import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Network, Wrench } from "lucide-react";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticleList } from "@/lib/articles-data";
import { buildSeoMetadata } from "@/lib/seo";
import { resolveSiteUrl } from "@/lib/site-config";
import { SITE_SECTIONS, matchesSiteSection } from "@/lib/site-sections";
import { getLiveTools } from "@/lib/tools-data";
import { getCalculationPages } from "@/lib/calculation-pages";

const STATIC_PAGES = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
  { label: "Gizlilik", href: "/gizlilik" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Araçlar Dizini", href: "/kategori/araclar" },
];

export const metadata: Metadata = buildSeoMetadata({
  title: "Konu Haritası",
  description: "Kategori ağacını, teknik içerikleri, hesap araçlarını, gelişmiş modülleri ve sabit sayfaları tek ekranda keşfedin.",
  pathname: "/konu-haritasi",
  keywords: ["konu haritası", "mühendislik içerikleri", "hesap araçları", "kategori ağacı", "mühendislik hesaplamaları"],
});

export default function TopicMapPage() {
  const articles = getArticleList();
  const tools = getLiveTools();
  const calculationPages = getCalculationPages();

  const treeData = SITE_SECTIONS.map((section) => ({
    section,
    articles: section.id === "araclar" ? [] : articles.filter((article) => matchesSiteSection(article, section.id)),
    tools: section.id === "araclar" ? tools : [],
  }));

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Konu Haritası",
    description: "Kategori ağacını, teknik içerikleri, hesap araçlarını, gelişmiş modülleri ve sabit sayfaları tek ekranda keşfedin.",
    url: resolveSiteUrl("/konu-haritasi"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        ...SITE_SECTIONS.map((section, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: section.title,
          url: resolveSiteUrl(section.href),
        })),
        ...calculationPages.map((page, index) => ({
          "@type": "ListItem",
          position: SITE_SECTIONS.length + index + 1,
          name: page.title,
          url: resolveSiteUrl(page.href),
        })),
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <SitePageShell width="wide">
        <SitePageHeader
          eyebrow="Keşif merkezi"
          title="Konu haritası"
          description="Sitedeki tüm kategori dallarını, makaleleri ve hesap araçlarını tek ekranda görün. Teknik içerikler kendi dallarında, araçlar ise çalışma alanlarında düzenlenir."
          icon={<Network className="h-6 w-6" />}
          meta={
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{articles.length} makale</Badge>
              <Badge variant="outline">{tools.length + calculationPages.length} araç</Badge>
            </div>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {treeData.map(({ section, articles: sectionArticles, tools: sectionTools }) => (
            <section key={section.id} className="site-panel rounded-xl p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {section.id === "araclar" ? "Araç kategorisi" : "Kategori"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{section.description}</p>
                </div>
                <Button asChild variant="outline">
                  <Link href={section.href}>Kategoriye git</Link>
                </Button>
              </div>

              {section.id === "araclar" ? (
                <div className="grid gap-3">
                  {sectionTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="site-link-card flex items-center justify-between rounded-md border border-border bg-background/70 px-4 py-4 hover:bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300">
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
                      className="site-link-card flex items-center justify-between rounded-md border border-border bg-background/70 px-4 py-4 hover:bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
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

          {/* Gelişmiş Hesaplama Modülleri Kartı */}
          <section className="site-panel rounded-xl border-blue-500/25 bg-gradient-to-br from-blue-500/5 via-card to-amber-500/8 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Gelişmiş Modüller
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Mühendislik Hesaplamaları</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  TS 500, TBDY 2018 ve Çevre Şehircilik birim fiyat standartlarına dayalı makro boyutlandırma ve maliyet modülleri.
                </p>
              </div>
              <Button asChild variant="outline" className="border-blue-500/30 text-blue-700 dark:text-blue-300">
                <Link href="/hesaplamalar">Tümünü aç</Link>
              </Button>
            </div>

            <div className="grid gap-3">
              {calculationPages.map((page) => (
                <Link
                  key={page.id}
                  href={page.href}
                  className="site-link-card flex items-center justify-between rounded-md border border-border bg-background/70 px-4 py-4 hover:bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-950 dark:text-white">{page.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{page.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="site-panel mt-10 rounded-xl p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sabit sayfalar</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {STATIC_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="site-link-card rounded-md border border-border bg-background/70 px-4 py-4 text-sm font-bold text-foreground hover:bg-card hover:text-blue-700 dark:hover:text-blue-300"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </section>
      </SitePageShell>
    </>
  );
}
