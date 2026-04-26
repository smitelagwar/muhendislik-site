import fs from "node:fs";
import path from "node:path";
import { BOTTOM_NAV_ITEMS, MOBILE_NAV_ITEMS, PRIMARY_NAV_ITEMS } from "../src/lib/navigation-config";
import { SITE_SECTIONS, getSiteSectionById } from "../src/lib/site-sections";
import { TOOLS, getLiveTools } from "../src/lib/tools-data";
import { getCalculationPages } from "../src/lib/calculation-pages";
import { DEPREM_SERIES } from "../src/lib/deprem-series";
import { getArticles } from "../src/lib/articles-data";
import { generateStaticParams as getKategoriStaticParams } from "../src/app/kategori/[slug]/page";

type Problem = {
  scope: string;
  message: string;
};

const mojibakePattern = /[\u00C3\u00C4\u00C5\u00C2\uFFFD]/;
const PUBLIC_SHELL_FILES = [
  "src/components/navbar.tsx",
  "src/components/footer.tsx",
  "src/components/live-search.tsx",
  "src/components/command-palette.tsx",
  "src/components/mobile-menu.tsx",
  "src/components/bottom-nav.tsx",
  "src/components/home-client.tsx",
  "src/components/article-client.tsx",
  "src/lib/route-metadata.ts",
  "src/lib/search-index.ts",
  "src/lib/site-config.ts",
  "src/lib/navigation-config.ts",
  "src/lib/site-sections.ts",
  "src/lib/deprem-series.ts",
  "src/lib/tools-data.ts",
  "src/lib/calculation-pages.ts",
  "src/app/page.tsx",
  "src/app/konu-haritasi/page.tsx",
  "src/app/iletisim/page.tsx",
  "src/app/hakkimizda/page.tsx",
  "src/app/gizlilik/page.tsx",
  "src/app/kullanim-kosullari/page.tsx",
  "src/app/kategori/araclar/page.tsx",
  "src/app/hesaplamalar/page.tsx",
  "src/app/hesaplamalar/layout.tsx",
  "src/app/kategori/bina-asamalari/page.tsx",
  "src/app/kategori/deprem-yonetmelik/page.tsx",
  "src/app/kaydedilenler/page.tsx",
];
const METADATA_ROUTE_FILES = [
  "src/app/page.tsx",
  "src/app/konu-haritasi/page.tsx",
  "src/app/iletisim/page.tsx",
  "src/app/hakkimizda/page.tsx",
  "src/app/gizlilik/page.tsx",
  "src/app/kullanim-kosullari/page.tsx",
  "src/app/kaydedilenler/page.tsx",
  "src/app/kategori/araclar/page.tsx",
  "src/app/hesaplamalar/page.tsx",
  "src/app/kategori/bina-asamalari/page.tsx",
  "src/app/kategori/deprem-yonetmelik/page.tsx",
];
const kategoriStaticSlugs = new Set<string>(getKategoriStaticParams().map((item) => item.slug));
const RESERVED_CONTENT_SLUGS = new Set(["admin"]);

function addProblem(problems: Problem[], scope: string, message: string) {
  problems.push({ scope, message });
}

function assertUnique(values: string[], label: string, problems: Problem[]) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      addProblem(problems, label, `duplicate value: ${value}`);
      continue;
    }
    seen.add(value);
  }
}

function scanText(label: string, content: string, problems: Problem[]) {
  if (mojibakePattern.test(content)) {
    addProblem(problems, label, "mojibake or broken encoding pattern found");
  }
}

function routeFileFromHref(href: string) {
  const pathname = href.split(/[?#]/)[0];

  if (pathname === "/") {
    return "src/app/page.tsx";
  }

  const segments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  return path.join("src", "app", ...segments, "page.tsx");
}

function readFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function fileExists(relativePath: string) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function checkRouteExists(href: string, label: string, problems: Problem[]) {
  const routePath = path.join(process.cwd(), routeFileFromHref(href));
  if (fs.existsSync(routePath)) {
    return;
  }

  if (href.startsWith("/kategori/")) {
    const slug = href.replace("/kategori/", "");
    if (kategoriStaticSlugs.has(slug) && fs.existsSync(path.join(process.cwd(), "src/app/kategori/[slug]/page.tsx"))) {
      return;
    }
  }

  addProblem(problems, label, `missing route: ${href} -> ${path.relative(process.cwd(), routePath)}`);
}

function checkPublicShellFiles(problems: Problem[]) {
  for (const file of PUBLIC_SHELL_FILES) {
    scanText(file, readFile(file), problems);
  }
}

function checkMetadataCoverage(problems: Problem[]) {
  for (const file of METADATA_ROUTE_FILES) {
    const content = readFile(file);
    const hasMetadata =
      content.includes("buildSeoMetadata(") ||
      content.includes("buildHomeMetadata(") ||
      content.includes("generateMetadata(") ||
      content.includes("export const metadata");

    if (!hasMetadata) {
      addProblem(problems, file, "missing metadata export or helper usage");
    }
  }
}

function checkRedirectRoutes(problems: Problem[]) {
  const loginPage = readFile("src/app/giris/page.tsx");
  const registerPage = readFile("src/app/kayit/page.tsx");

  if (!loginPage.includes('redirect("/iletisim")')) {
    addProblem(problems, "auth-routes", "/giris should redirect to /iletisim");
  }

  if (!registerPage.includes('redirect("/iletisim")')) {
    addProblem(problems, "auth-routes", "/kayit should redirect to /iletisim");
  }
}

function checkRemovedAdminSurface(problems: Problem[]) {
  const removedSurfaceFiles = [
    "src/app/admin/layout.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/editor/page.tsx",
    "src/app/api/articles/route.ts",
    "src/lib/admin-editor.ts",
  ];

  for (const file of removedSurfaceFiles) {
    if (fileExists(file)) {
      addProblem(problems, "admin-surface", `admin surface should be removed: ${file}`);
    }
  }

  const traceChecks = [
    { file: "next.config.ts", terms: ["/admin", "NEXT_PUBLIC_ADMIN_PASSWORD"] },
  ];

  for (const check of traceChecks) {
    const content = readFile(check.file);
    for (const term of check.terms) {
      if (content.includes(term)) {
        addProblem(problems, "admin-surface", `stale admin reference found in ${check.file}: ${term}`);
      }
    }
  }
}

function checkNavigationProblems(problems: Problem[]) {
  const navGroups = [
    ["primary-nav", PRIMARY_NAV_ITEMS],
    ["mobile-nav", MOBILE_NAV_ITEMS],
    ["bottom-nav", BOTTOM_NAV_ITEMS],
  ] as const;

  for (const [label, items] of navGroups) {
    assertUnique(items.map((item) => item.id), `${label}:id`, problems);
    assertUnique(items.map((item) => item.href), `${label}:href`, problems);

    for (const item of items) {
      if (!item.label.trim()) {
        addProblem(problems, label, `empty label for nav item: ${item.id}`);
      }

      if (["/giris", "/kayit", "/admin", "/admin/editor"].includes(item.href)) {
        addProblem(problems, label, `public navigation should not expose hidden route: ${item.href}`);
      }

      checkRouteExists(item.href, label, problems);
      scanText(`${label}:${item.id}`, `${item.id} ${item.label} ${item.href}`, problems);
    }
  }
}

function checkSectionProblems(problems: Problem[]) {
  assertUnique(SITE_SECTIONS.map((section) => section.id), "site-sections:id", problems);
  assertUnique(SITE_SECTIONS.map((section) => section.href), "site-sections:href", problems);

  for (const section of SITE_SECTIONS) {
    checkRouteExists(section.href, "site-sections", problems);
    scanText(
      `section:${section.id}`,
      `${section.title} ${section.description} ${section.categories.join(" ")} ${section.tags.join(" ")}`,
      problems,
    );

    if (new Set(section.categories).size !== section.categories.length) {
      addProblem(problems, section.id, "duplicate category name found");
    }

    if (new Set(section.tags).size !== section.tags.length) {
      addProblem(problems, section.id, "duplicate tag found");
    }
  }
}

function checkToolsProblems(problems: Problem[]) {
  const liveTools = getLiveTools();
  assertUnique(TOOLS.map((tool) => tool.id), "tools:id", problems);
  assertUnique(TOOLS.map((tool) => tool.href), "tools:href", problems);
  assertUnique(liveTools.map((tool) => tool.id), "live-tools:id", problems);

  for (const tool of TOOLS) {
    checkRouteExists(tool.href, "tools", problems);
    scanText(`tool:${tool.id}`, `${tool.name} ${tool.description} ${tool.discipline}`, problems);
  }
}

function checkCalculationProblems(problems: Problem[]) {
  const pages = getCalculationPages();
  assertUnique(pages.map((page) => page.id), "calculation-pages:id", problems);
  assertUnique(pages.map((page) => page.href), "calculation-pages:href", problems);

  for (const page of pages) {
    checkRouteExists(page.href, "calculation-pages", problems);
    scanText(`calculation:${page.id}`, `${page.title} ${page.navLabel} ${page.description} ${page.badge} ${page.keywords.join(" ")}`, problems);
  }
}

function checkDepremSeriesProblems(problems: Problem[]) {
  assertUnique(DEPREM_SERIES.map((series) => series.id), "deprem-series:id", problems);

  for (const series of DEPREM_SERIES) {
    scanText(`deprem-series:${series.id}`, `${series.label} ${series.description} ${series.categoryLabels.join(" ")} ${series.keywords.join(" ")}`, problems);
    checkRouteExists(series.relatedToolHref, `deprem-series:${series.id}`, problems);
  }
}

function checkArticleRelationships(problems: Problem[]) {
  const articles = getArticles();
  const slugs = Object.keys(articles);
  assertUnique(slugs, "articles:slug", problems);

  for (const article of Object.values(articles)) {
    if (RESERVED_CONTENT_SLUGS.has(article.slug)) {
      addProblem(problems, article.slug, `reserved slug should not be used by article content: ${article.slug}`);
    }

    if (!getSiteSectionById(article.sectionId)) {
      addProblem(problems, article.slug, `invalid sectionId: ${article.sectionId}`);
    }

    const missingRelated = (article.relatedSlugs ?? []).filter((slug) => !articles[slug]);
    if (missingRelated.length > 0) {
      addProblem(problems, article.slug, `broken relatedSlug: ${missingRelated.join(", ")}`);
    }
  }
}

const problems: Problem[] = [];

checkPublicShellFiles(problems);
checkMetadataCoverage(problems);
checkRedirectRoutes(problems);
checkRemovedAdminSurface(problems);
checkNavigationProblems(problems);
checkSectionProblems(problems);
checkToolsProblems(problems);
checkCalculationProblems(problems);
checkDepremSeriesProblems(problems);
checkArticleRelationships(problems);

if (problems.length > 0) {
  console.error("Site quality check failed.");
  for (const problem of problems) {
    console.error(`- [${problem.scope}] ${problem.message}`);
  }
  process.exit(1);
}

console.log("Site quality check passed.");
