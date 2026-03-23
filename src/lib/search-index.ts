import { BINA_ASAMALARI_ROOT_URL } from "./bina-asamalari";
import { getAllBinaGuidePaths, getBinaGuideBySlugPath } from "./bina-asamalari-content";
import { getCalculationPages, CALCULATIONS_HUB_HREF } from "./calculation-pages";
import { getArticles } from "./articles-data";
import { SITE_SECTIONS } from "./site-sections";
import type { SearchIndexItem } from "./search-types";
import { normalizeSearchValue, stripMarkdownForSearch } from "./search-utils";
import { getLiveTools, TOOLS_HUB_HREF } from "./tools-data";

function resolveHref(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function toSearchText(parts: Array<string | number | undefined | readonly string[]>): string {
  return normalizeSearchValue(
    parts
      .flatMap((part) => (Array.isArray(part) ? [...part] : [part]))
      .filter((part): part is string | number => part !== undefined && part !== null && `${part}`.trim().length > 0)
      .join(" "),
  );
}

function createItem(item: Omit<SearchIndexItem, "searchText"> & { searchParts: Array<string | undefined | readonly string[]> }): SearchIndexItem {
  return {
    id: item.id,
    href: item.href,
    title: item.title,
    category: item.category,
    description: item.description,
    type: item.type,
    priority: item.priority,
    searchText: toSearchText(item.searchParts),
  };
}

function getArticleSearchContent(content: { title: string; subsections: { title: string }[]; content: string }[]): string[] {
  return content.flatMap((section) => [
    section.title,
    ...section.subsections.map((subsection) => subsection.title),
    stripMarkdownForSearch(section.content),
  ]);
}

function getArticleItems(): SearchIndexItem[] {
  return Object.values(getArticles()).map((article, index) =>
    createItem({
      id: `article:${article.slug}`,
      href: resolveHref(article.slug),
      title: article.title,
      category: article.category,
      description: article.description,
      type: "article",
      priority: 90 - index,
      searchParts: [
        article.title,
        article.slug,
        article.category,
        article.description,
        article.sectionId,
        article.badgeLabel,
        article.keywords ?? [],
        getArticleSearchContent(article.sections),
      ],
    }),
  );
}

function getBinaGuideItems(): SearchIndexItem[] {
  return getAllBinaGuidePaths()
    .map((slugPath) => getBinaGuideBySlugPath(slugPath))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide))
    .map((guide) =>
      createItem({
        id: `topic:${guide.slugPath}`,
        href: `${BINA_ASAMALARI_ROOT_URL}/${guide.slugPath}`,
        title: guide.title,
        category: guide.category,
        description: guide.description,
        type: "topic",
        priority: guide.childPaths.length > 0 ? 104 : 96,
        searchParts: [
          guide.title,
          guide.slugPath,
          guide.category,
          guide.description,
          guide.badgeLabel,
          guide.keywords,
          guide.standards,
          guide.sources.flatMap((source) => [source.shortCode, source.title, source.note].filter((value): value is string => Boolean(value))),
          getArticleSearchContent(guide.sections),
        ],
      }),
    );
}

function getToolItems(): SearchIndexItem[] {
  return getLiveTools().map((tool) =>
    createItem({
      id: `tool:${tool.id}`,
      href: tool.href,
      title: tool.name,
      category: tool.discipline,
      description: tool.description,
      type: "tool",
      priority: tool.featured ? 112 : 102,
      searchParts: [tool.name, tool.id, tool.discipline, tool.description, tool.href],
    }),
  );
}

function getCalculationItems(): SearchIndexItem[] {
  return getCalculationPages().map((page) =>
    createItem({
      id: `calculation:${page.id}`,
      href: page.href,
      title: page.title,
      category: "Hesaplama",
      description: page.description,
      type: "calculation",
      priority: 108,
      searchParts: [page.title, page.navLabel, page.description, page.badge, page.href, page.keywords],
    }),
  );
}

function getSectionItems(): SearchIndexItem[] {
  const sectionItems = SITE_SECTIONS.map((section) =>
    createItem({
      id: `section:${section.id}`,
      href: section.href,
      title: section.title,
      category: "Kategori",
      description: section.description,
      type: "section",
      priority: 84,
      searchParts: [section.title, section.description, section.id, section.href, section.tags, section.categories],
    }),
  );

  return [
    ...sectionItems,
    createItem({
      id: "section:hesaplamalar",
      href: CALCULATIONS_HUB_HREF,
      title: "Hesaplamalar",
      category: "Kategori",
      description: "Tahmini insaat alani, insaat maliyeti ve resmi birim maliyet araclari.",
      type: "section",
      priority: 94,
      searchParts: [
        "Hesaplamalar",
        "tahmini insaat alani",
        "insaat maliyeti",
        "resmi birim maliyet",
        CALCULATIONS_HUB_HREF,
      ],
    }),
    createItem({
      id: "section:site-map",
      href: "/konu-haritasi",
      title: "Konu Haritasi",
      category: "Kesif",
      description: "Sitedeki kategori ve icerik agacini tek ekranda inceleyin.",
      type: "section",
      priority: 92,
      searchParts: ["Konu Haritasi", "site haritasi", "kesif", "kategori agaci", "/konu-haritasi"],
    }),
    createItem({
      id: "section:tools-hub",
      href: TOOLS_HUB_HREF,
      title: "Araclar",
      category: "Kategori",
      description: "Muhendislik araclari ve hizli hesap yardimcilari.",
      type: "section",
      priority: 93,
      searchParts: ["Araclar", "hesap araci", "muhendislik araci", TOOLS_HUB_HREF],
    }),
  ];
}

export function getSearchIndex(): SearchIndexItem[] {
  const items = [
    ...getArticleItems(),
    ...getBinaGuideItems(),
    ...getToolItems(),
    ...getCalculationItems(),
    ...getSectionItems(),
  ];

  const dedupedItems = new Map<string, SearchIndexItem>();

  for (const item of items) {
    const existing = dedupedItems.get(item.href);

    if (!existing || item.priority > existing.priority) {
      dedupedItems.set(item.href, item);
    }
  }

  return [...dedupedItems.values()].sort(
    (left, right) =>
      right.priority - left.priority || left.title.localeCompare(right.title, "tr-TR"),
  );
}
