import {
  BINA_ASAMALARI_ROOT_URL,
  getBinaAncestors,
  getBinaChildren,
  getIndexedBinaNodeById,
  getSiblingBinaNodes,
  type IndexedBinaNode,
} from "../bina-asamalari";
import type { BinaGuideData, BinaGuideSection, BinaGuideSource } from "./types";
import { BRANCH_SOURCE_LEDGER } from "./source-ledger";

const AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın" as const;
const AUTHOR_TITLE = "Yazar" as const;
const DISPLAY_DATE = "15 Mart 2026" as const;

const FALLBACK_BRANCH_META = {
  "proje-hazirlik": {
    category: "Proje & İzinler",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
    image: "/bina-asamalari/hero/proje-hazirlik.svg",
  },
  "kazi-temel": {
    category: "Kazı & Temel",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    image: "/bina-asamalari/hero/kazi-temel.svg",
  },
  "kaba-insaat": {
    category: "Kaba İnşaat",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    image: "/bina-asamalari/hero/kaba-insaat.svg",
  },
  "ince-isler": {
    category: "İnce İşler",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    image: "/bina-asamalari/hero/ince-isler.svg",
  },
  "tesisat-isleri": {
    category: "Tesisat İşleri",
    color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    image: "/bina-asamalari/hero/tesisat-isleri.svg",
  },
  "peyzaj-teslim": {
    category: "Peyzaj & Teslim",
    color: "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300",
    image: "/bina-asamalari/hero/peyzaj-teslim.svg",
  },
} as const;

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function table(headers: readonly string[], rows: readonly string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function unique(items: readonly string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function estimateReadTime(sections: readonly BinaGuideSection[]): string {
  const words = sections
    .map((section) => section.content.replace(/[^\p{L}\p{N}\s]/gu, " "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(7, Math.round(words / 185))} dk okuma`;
}

function getBranchMeta(branchId: string) {
  return FALLBACK_BRANCH_META[branchId as keyof typeof FALLBACK_BRANCH_META] ?? FALLBACK_BRANCH_META["kaba-insaat"];
}

function resolveSources(branchId: string): BinaGuideSource[] {
  return [...(BRANCH_SOURCE_LEDGER[branchId as keyof typeof BRANCH_SOURCE_LEDGER] ?? [])];
}

function resolveRelatedPaths(node: IndexedBinaNode): string[] {
  return unique(
    [
      node.parentSlugPath,
      ...getSiblingBinaNodes(node.slugPath).slice(0, 2).map((item) => item.slugPath),
      ...getBinaChildren(node.slugPath).slice(0, 3).map((item) => item.slugPath),
    ].filter((path): path is string => Boolean(path) && path !== node.slugPath),
  );
}

function createSections(node: IndexedBinaNode): BinaGuideSection[] {
  const branchMeta = getBranchMeta(node.branchId);
  const parent = node.parentSlugPath ? getBinaAncestors(node.slugPath).at(-1) : undefined;
  const children = getBinaChildren(node.slugPath);

  return [
    {
      id: "tanim-kapsam",
      title: "1. Giriş ve Kapsam",
      subsections: [],
      content: [
        `${node.plainLabel}, ${branchMeta.category.toLocaleLowerCase("tr-TR")} içinde ${node.summary.toLocaleLowerCase("tr-TR")} başlığıyla okunur.`,
        `Bu sayfa, ${node.plainLabel.toLocaleLowerCase("tr-TR")} için ilk teknik çerçeveyi, saha kontrol mantığını ve ilgili üst-alt konu geçişlerini özetleyen rehber metindir.`,
        `![${node.plainLabel} görseli](${branchMeta.image})`,
        `> [!TIP]\n> Bu içerik, ilk dalga dışında kalan başlıklar için kısa ama işlevsel bir mühendislik özeti sunar; detaylı bağlam için üst pakete de gidin.`,
      ].join("\n\n"),
    },
    {
      id: "neden-onemli",
      title: "2. Ne Zaman Kullanılır ve Neden Önemlidir",
      subsections: [],
      content: [
        `${node.plainLabel}, özellikle ${parent?.plainLabel ?? branchMeta.category} ile birlikte düşünüldüğünde anlam kazanır.`,
        bullets([
          "Bir sonraki ekip için ölçülü ve kaydedilebilir teslim bırakır.",
          "Yanlış yönetildiğinde sonraki fazlarda pahalı düzeltme üretir.",
          "Saha ile proje arasında ortak referans kurar.",
        ]),
      ].join("\n\n"),
    },
    {
      id: "girdiler",
      title: "3. Tasarım Girdileri ve Ön Kontroller",
      subsections: [],
      content: bullets([
        "Güncel pafta ve detay seti",
        "Ölçü, kot veya mahal bazlı saha doğrulaması",
        "Bir önceki fazdan gelen tolerans ve teslim bilgisi",
        "Kapatma öncesi gerekli test veya gözlem kayıtları",
      ]),
    },
    {
      id: "uygulama-akisi",
      title: "4. Uygulama Adımları ve Saha Akışı",
      subsections: [],
      content: [
        "1. Üst paketten gelen şartları doğrula.",
        "2. Mahal veya eleman bazlı ölçü ve ön kontrol yap.",
        "3. Malzeme, ekipman ve detayları hazırla.",
        "4. Uygulamayı kayıtlı ve kontrollü ilerlet.",
        "5. Sonraki ekip için temiz teslim bırak.",
      ].join("\n"),
    },
    {
      id: "sayisal-kriterler",
      title: "5. Sayısal Kriterler ve Tipik Teknik Değerler",
      subsections: [],
      content: table(
        ["Kontrol Kalemi", "Tipik Yaklaşım", "Teknik Not"],
        [
          ["Ölçü / tolerans", "Mahal ve detaya göre sıkı kontrol", "Sonraki ekip yükünü azaltmak için ölçü kaydı tutulur."],
          ["Test / gözlem", "Kapatma öncesi zorunlu", "Görünmez kalan imalatlar için kayıt üretir."],
          ["Teslim", "Foto + ölçü + not", "Saha hafızası oluşturur."],
        ],
      ),
    },
    {
      id: "kalite-kontrol",
      title: "6. Kalite Kontrol, Testler ve Kabul Kriterleri",
      subsections: [],
      content: bullets([
        "Ön kabul: ölçü, kot ve detay doğrulaması",
        "Uygulama sırasında ara kontrol ve foto-kayıt",
        "Kapatma öncesi test veya gözlem",
        "Teslim öncesi temiz ve izlenebilir dokümantasyon",
      ]),
    },
    {
      id: "riskler",
      title: "7. Sık Yapılan Hatalar ve Saha Riskleri",
      subsections: [],
      content: bullets([
        "Üst paketten gelen toleransları kontrol etmeden uygulamaya başlamak",
        "Test veya ölçü kaydı tutmadan kapatma yapmak",
        "Detay kararını son anda saha doğaçlamasına bırakmak",
        "Bir sonraki ekibin ihtiyaçlarını düşünmeden teslim vermek",
        "As-built veya teknik ofis kaydını geciktirmek",
      ]),
    },
    {
      id: "standartlar",
      title: "8. İlgili Standartlar ve Bağlantılı Konular",
      subsections: [],
      content: [
        bullets(resolveSources(node.branchId).map((source) => `${source.shortCode} — ${source.title}`)),
        children.length > 0
          ? bullets(children.map((child) => `[${child.plainLabel}](${child.url})`))
          : bullets(resolveRelatedPaths(node).map((path) => `[${path.replace(`${BINA_ASAMALARI_ROOT_URL}/`, "")}](${`${BINA_ASAMALARI_ROOT_URL}/${path}`})`)),
      ].join("\n\n"),
    },
  ];
}

export function buildFallbackGuide(node: IndexedBinaNode): BinaGuideData {
  const branchMeta = getBranchMeta(node.branchId);
  const branchNode = getIndexedBinaNodeById(node.branchId);
  const sections = createSections(node);
  const sources = resolveSources(node.branchId);

  return {
    slugPath: node.slugPath,
    title: node.plainLabel,
    description: `${node.summary} Bu sayfa, ${node.plainLabel.toLocaleLowerCase("tr-TR")} için kısa mühendislik özeti ve yönlendirme sunar.`,
    category: branchNode?.plainLabel ?? branchMeta.category,
    categoryColor: branchMeta.color,
    badgeLabel: node.childSlugPaths.length > 0 ? "Kategori Rehberi" : "Teknik Özet",
    author: AUTHOR,
    authorTitle: AUTHOR_TITLE,
    date: DISPLAY_DATE,
    readTime: estimateReadTime(sections),
    image: branchMeta.image,
    quote: {
      text: `${node.plainLabel}, doğru malzeme kadar doğru sıra ve kayıt disiplini gerektiren bir uygulama paketidir.`,
    },
    sections,
    relatedPaths: resolveRelatedPaths(node),
    parentPath: node.parentSlugPath,
    childPaths: node.childSlugPaths,
    standards: unique(sources.map((source) => source.shortCode)),
    keywords: unique([node.plainLabel, branchMeta.category, "bina aşamaları rehberi", "şantiye kontrolü"]),
    sources,
  };
}
