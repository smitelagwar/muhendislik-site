import type { ArticleData } from "../articles-data";
import {
  BINA_ASAMALARI_ROOT_URL,
  getAllIndexedBinaNodes,
  getBinaAncestors,
  getBinaChildren,
  getIndexedBinaNodeById,
  getIndexedBinaNodeBySlugPath,
  getSiblingBinaNodes,
  type IndexedBinaNode,
} from "../bina-asamalari";
import type {
  BinaGuideData,
  BinaGuideEquipment,
  BinaGuideExample,
  BinaGuideMistake,
  BinaGuidePageSpec,
  BinaGuideRuleRow,
  BinaGuideSection,
  BinaGuideSource,
  BinaGuideTool,
} from "./types";

const AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın" as const;
const AUTHOR_TITLE = "Yazar" as const;
const DISPLAY_DATE = "15 Mart 2026" as const;
export const PUBLISHED_AT_ISO = "2026-03-15" as const;

const GUIDE_ALIASES: Record<string, string> = {
  "ahsap-cati-iskeleti": "ahsap-cati",
  "celik-cati-iskeleti": "celik-cati",
  "kalip-ve-iskele": "kalip-isleri",
  "kolon-kiris-donatisi": "donati-isleri",
  "temel-donatisi": "temel-donati",
};

const BRANCH_META = {
  "proje-hazirlik": {
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
    hero: "/bina-asamalari/hero/proje-hazirlik.svg",
    diagram: "/bina-asamalari/diagrams/proje-hazirlik.svg",
  },
  "kazi-temel": {
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    hero: "/bina-asamalari/hero/kazi-temel.svg",
    diagram: "/bina-asamalari/diagrams/kazi-temel.svg",
  },
  "kaba-insaat": {
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    hero: "/bina-asamalari/hero/kaba-insaat.svg",
    diagram: "/bina-asamalari/diagrams/kaba-insaat.svg",
  },
  "ince-isler": {
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    hero: "/bina-asamalari/hero/ince-isler.svg",
    diagram: "/bina-asamalari/diagrams/ince-isler.svg",
  },
  "tesisat-isleri": {
    color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    hero: "/bina-asamalari/hero/tesisat-isleri.svg",
    diagram: "/bina-asamalari/diagrams/tesisat-isleri.svg",
  },
  "peyzaj-teslim": {
    color: "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300",
    hero: "/bina-asamalari/hero/peyzaj-teslim.svg",
    diagram: "/bina-asamalari/diagrams/peyzaj-teslim.svg",
  },
} as const;

function unique(items: readonly string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function table(headers: readonly string[], rows: readonly string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function ordered(items: readonly string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function renderRuleTable(rows: readonly BinaGuideRuleRow[]): string {
  return table(
    ["Parametre", "Sınır / Gereksinim", "Referans", "Teknik Not"],
    rows.map((row) => [row.parameter, row.limitOrRequirement, row.reference, row.note]),
  );
}

function renderToolsTable(rows: readonly BinaGuideTool[]): string {
  return table(
    ["Kategori", "Araç / Yazılım", "Kullanım Amacı"],
    rows.map((row) => [row.category, row.name, row.purpose]),
  );
}

function renderEquipmentTable(rows: readonly BinaGuideEquipment[]): string {
  return table(
    ["Grup", "Ekipman / Malzeme", "Kullanım Amacı", "Aşama"],
    rows.map((row) => [row.group, row.name, row.purpose, row.phase ?? "Genel"]),
  );
}

function renderExample(example: BinaGuideExample): string {
  const inputTable = table(
    ["Girdi", "Değer", "Not"],
    example.inputs.map((row) => [row.label, row.value, row.note ?? "—"]),
  );
  const stepList = example.steps
    .map((step, index) =>
      [
        `${index + 1}. **${step.title}**`,
        step.formula ? `Formül / yaklaşım: \`${step.formula}\`` : "",
        step.result ? `Sonuç: ${step.result}` : "",
        step.note ? `Açıklama: ${step.note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return [
    `### ${example.title}`,
    "Bu örnek, tipik bir bina uygulamasında kararın hangi değişkenlerle olgunlaştırıldığını göstermek için hazırlanmıştır.",
    inputTable,
    "Kabuller:",
    bullets(example.assumptions),
    "Çözüm adımları:",
    stepList,
    "Kontrol çıktıları:",
    bullets(example.checks),
    `> [!TIP]\n> ${example.engineeringComment}`,
  ].join("\n\n");
}

function renderMistakes(mistakes: readonly BinaGuideMistake[]): string {
  return mistakes
    .map((mistake, index) =>
      [
        `${index + 1}. **Yanlış:** ${mistake.wrong}`,
        `   **Doğru:** ${mistake.correct}`,
        mistake.reference ? `   **Referans:** ${mistake.reference}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

function renderSources(sources: readonly BinaGuideSource[]): string {
  return bullets(
    sources.map((source) => {
      const reference = source.clause ? `${source.shortCode}, ${source.clause}` : source.shortCode;
      const title = source.url ? `[${source.title}](${source.url})` : source.title;
      return `${reference} — ${title}${source.note ? `: ${source.note}` : ""}`;
    }),
  );
}

function renderChildMatrix(children: readonly IndexedBinaNode[]): string {
  return table(
    ["Alt Başlık", "İçerik Tipi", "Okuma Nedeni"],
    children.map((child) => [
      `[${child.plainLabel}](${child.url})`,
      child.childSlugPaths.length > 0 ? "Koordinasyon paketi" : "Teknik uygulama konusu",
      child.summary,
    ]),
  );
}

function renderRelatedMatrix(nodes: readonly IndexedBinaNode[]): string {
  return table(
    ["Bağlantılı Konu", "İlişki", "Neden Birlikte Okunmalı"],
    nodes.map((node, index) => [
      `[${node.plainLabel}](${node.url})`,
      index === 0 ? "Üst paket" : "Komşu başlık",
      node.summary,
    ]),
  );
}

function estimateReadTime(sections: readonly BinaGuideSection[]): string {
  const words = sections
    .map((section) => section.content.replace(/[^\p{L}\p{N}\s]/gu, " "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(8, Math.round(words / 185))} dk okuma`;
}

function getNode(slugPath: string): IndexedBinaNode {
  const node = getIndexedBinaNodeBySlugPath(slugPath);

  if (!node) {
    throw new Error(`Bina içeriği için düğüm bulunamadı: ${slugPath}`);
  }

  return node;
}

function getBranchMeta(branchId: string) {
  return BRANCH_META[branchId as keyof typeof BRANCH_META] ?? BRANCH_META["kaba-insaat"];
}

function getBranchNode(node: IndexedBinaNode): IndexedBinaNode {
  const branchNode = getIndexedBinaNodeById(node.branchId);
  return branchNode ?? node;
}

function resolveRelatedPaths(spec: BinaGuidePageSpec, node: IndexedBinaNode): string[] {
  if (spec.relatedPaths?.length) {
    return unique(spec.relatedPaths);
  }

  return unique(
    [
      node.parentSlugPath,
      ...getSiblingBinaNodes(node.slugPath).slice(0, 2).map((item) => item.slugPath),
      ...getBinaChildren(node.slugPath).slice(0, 3).map((item) => item.slugPath),
    ].filter((item): item is string => Boolean(item) && item !== node.slugPath),
  );
}

function buildBranchSections(spec: BinaGuidePageSpec, node: IndexedBinaNode): BinaGuideSection[] {
  const branchNode = getBranchNode(node);
  const children = getBinaChildren(node.slugPath);
  const meta = getBranchMeta(node.branchId);

  return [
    {
      id: "giris-kapsam",
      title: "1. Giriş ve Kapsam",
      subsections: [],
      content: [
        `${node.plainLabel}, ${node.summary.toLocaleLowerCase("tr-TR")} için ilk referans katmanıdır.`,
        ...spec.intro,
        `![${node.plainLabel} hero görseli](${meta.hero})`,
        `*Bu görsel, ${node.plainLabel.toLocaleLowerCase("tr-TR")} altında kararların sahaya hangi sırayla indiğini temsil eder.*`,
        `> [!TIP]\n> ${spec.tip}`,
      ].join("\n\n"),
    },
    {
      id: "kavramsal-cerceve",
      title: "2. Temel Tanımlar ve Kavramsal Çerçeve",
      subsections: [],
      content: [
        `${branchNode.plainLabel} ailesi içinde ${node.plainLabel.toLocaleLowerCase("tr-TR")}, üst ölçekte disiplinler arası kararın teknik teslim paketine dönüşmesini sağlar.`,
        ...spec.theory,
      ].join("\n\n"),
    },
    {
      id: "yonetmelik-standart",
      title: "3. İlgili Yönetmelik / Standart / Mevzuat",
      subsections: [],
      content: [
        "Bu başlık altında kullanılan hükümler, proje notu yerine geçmez; ancak tasarım ve uygulama kararının hangi resmi çerçeveye dayandığını açık eder.",
        renderRuleTable(spec.ruleTable),
        "Kaynak haritası:",
        renderSources(spec.sources),
      ].join("\n\n"),
    },
    {
      id: "tasarim-koordinasyon",
      title: "4. Tasarım ve Koordinasyon Esasları",
      subsections: [],
      content: [
        "Ana dal seviyesinde kritik kazanım, her alt paketin aynı aks, kot, rezervasyon ve teslim mantığına bağlanmasıdır.",
        ordered(spec.designOrApplicationSteps),
      ].join("\n\n"),
    },
    {
      id: "gecis-matrisi",
      title: "5. Alt Başlıklar ve Editoryal Geçiş Matrisi",
      subsections: [],
      content: [
        "Bu ana dal altındaki başlıklar birbirinden bağımsız okunmaz; biri eksik bırakıldığında sonraki ekip revizyon veya imalat tekrarı üretir.",
        renderChildMatrix(children),
      ].join("\n\n"),
    },
    {
      id: "sayisal-kriterler",
      title: "6. Sayısal Kriterler ve Referans Tablolar",
      subsections: [],
      content: [
        "Aşağıdaki kritik eşikler, tasarımın sahaya taşınırken hangi değişkenlerle kontrol altına alınacağını özetler.",
        bullets(spec.criticalChecks),
        table(
          ["Örnek Parametre", "Kullanılan Değer", "Teknik Yorum"],
          spec.numericalExample.inputs.map((input) => [input.label, input.value, input.note ?? "Saha kararına bağlanan parametre"]),
        ),
      ].join("\n\n"),
    },
    {
      id: "sayisal-ornek",
      title: "7. Çözülmüş Sayısal Örnek",
      subsections: [],
      content: renderExample(spec.numericalExample),
    },
    {
      id: "yazilim-araclar",
      title: "8. Kullanılan Yazılım / Araçlar",
      subsections: [],
      content: [
        "Bu araçlar, tasarım kararını sayısal olarak teyit etmek ve saha teslimini izlemek için birlikte kullanılır.",
        renderToolsTable(spec.tools),
      ].join("\n\n"),
    },
    {
      id: "ekipman-malzeme",
      title: "9. Kullanılan Aletler / Malzemeler / Ekipmanlar",
      subsections: [],
      content: [
        "Saha tarafında iyi karar, yalnızca çizim kalitesiyle değil; doğru ekipman ve kayıt disipliniyle görünür hale gelir.",
        renderEquipmentTable(spec.equipmentAndMaterials),
      ].join("\n\n"),
    },
    {
      id: "sik-hatalar",
      title: "10. Sık Yapılan Hatalar ve Dikkat Edilecekler",
      subsections: [],
      content: [
        `> [!WARNING]\n> ${node.plainLabel} tarafındaki en pahalı hatalar, genellikle imalat ilerledikten sonra fark edilen koordinasyon eksikleridir.`,
        renderMistakes(spec.mistakes),
      ].join("\n\n"),
    },
    {
      id: "saha-tasarim",
      title: "11. Saha ile Tasarım Arasındaki Farklar",
      subsections: [],
      content: spec.designVsField.join("\n\n"),
    },
    {
      id: "sonuc-kaynakca",
      title: "12. Sonuç, Alt Konular ve Kaynakça",
      subsections: [],
      content: [
        ...spec.conclusion,
        "İlgili alt başlıklar:",
        bullets(children.map((child) => `[${child.plainLabel}](${child.url})`)),
        "Kaynakça:",
        renderSources(spec.sources),
      ].join("\n\n"),
    },
  ];
}

function buildTopicSections(spec: BinaGuidePageSpec, node: IndexedBinaNode): BinaGuideSection[] {
  const branchNode = getBranchNode(node);
  const relatedNodes = [
    node.parentSlugPath ? getIndexedBinaNodeBySlugPath(node.parentSlugPath) : undefined,
    ...getSiblingBinaNodes(node.slugPath).slice(0, 2),
  ].filter((item): item is IndexedBinaNode => Boolean(item));
  const meta = getBranchMeta(node.branchId);

  return [
    {
      id: "giris-kapsam",
      title: "1. Giriş ve Kapsam",
      subsections: [],
      content: [
        `${node.plainLabel}, ${branchNode.plainLabel.toLocaleLowerCase("tr-TR")} içinde ${node.summary.toLocaleLowerCase("tr-TR")} başlığıyla okunur.`,
        ...spec.intro,
        `![${node.plainLabel} diyagramı](${meta.diagram})`,
        `*Bu diyagram, ${node.plainLabel.toLocaleLowerCase("tr-TR")} kararının hangi kontrol halkalarıyla sahaya taşındığını özetler.*`,
        `> [!TIP]\n> ${spec.tip}`,
      ].join("\n\n"),
    },
    {
      id: "kavramsal-cerceve",
      title: "2. Temel Tanımlar ve Kavramsal Çerçeve",
      subsections: [],
      content: spec.theory.join("\n\n"),
    },
    {
      id: "yonetmelik-standart",
      title: "3. Yönetmelik ve Standart Gereksinimleri",
      subsections: [],
      content: [
        "Aşağıdaki tablo, teknik kararın hangi sınır veya gereksinimlerle okunması gerektiğini özetler.",
        renderRuleTable(spec.ruleTable),
      ].join("\n\n"),
    },
    {
      id: "uygulama-esaslari",
      title: "4. Tasarım Esasları veya Uygulama Esasları",
      subsections: [],
      content: [
        "Bu başlıkta amaç, sahadaki karar sırasını belirsiz bırakmadan ilerlemektir. Her adım bir sonraki kontrolü hazırlamalıdır.",
        ordered(spec.designOrApplicationSteps),
      ].join("\n\n"),
    },
    {
      id: "bagli-kalemler",
      title: "5. Sayısal Kriterler ve Teknik Eşikler",
      subsections: [],
      content: [
        "Tipik projelerde kullanılan parametreler değişse de, aşağıdaki eşikler karar verme sırasında tekrar tekrar kontrol edilir.",
        bullets(spec.criticalChecks),
        table(
          ["Örnek Parametre", "Kullanılan Değer", "Yorum"],
          spec.numericalExample.inputs.map((input) => [input.label, input.value, input.note ?? "Uygulama sınırı"]),
        ),
        relatedNodes.length > 0 ? renderRelatedMatrix(relatedNodes) : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      id: "sayisal-ornek",
      title: "6. Çözülmüş Sayısal Örnek",
      subsections: [],
      content: renderExample(spec.numericalExample),
    },
    {
      id: "yazilim-araclar",
      title: "7. Kullanılan Yazılım / Araçlar",
      subsections: [],
      content: [
        "Yalnızca proje yazılımı kullanmak yeterli değildir; kontrol amaçlı ikinci bir araç veya manuel şablon zinciri kurulmalıdır.",
        renderToolsTable(spec.tools),
      ].join("\n\n"),
    },
    {
      id: "ekipman-malzeme",
      title: "8. Kullanılan Aletler / Malzemeler / Ekipmanlar",
      subsections: [],
      content: [
        "Saha çıktısının güvenilirliği, ekipmanın doğru aşamada ve doğru toleransla kullanılmasına bağlıdır.",
        renderEquipmentTable(spec.equipmentAndMaterials),
      ].join("\n\n"),
    },
    {
      id: "sik-hatalar",
      title: "9. Sık Yapılan Hatalar ve Dikkat Edilecekler",
      subsections: [],
      content: [
        `> [!WARNING]\n> ${node.plainLabel} için en sık hata, kontrol kriterini tasarım notundan ayırıp saha pratiğine yazılı şekilde çevirmemektir.`,
        renderMistakes(spec.mistakes),
      ].join("\n\n"),
    },
    {
      id: "saha-tasarim",
      title: "10. Saha ile Tasarım Arasındaki Farklar",
      subsections: [],
      content: spec.designVsField.join("\n\n"),
    },
    {
      id: "sonuc-kaynakca",
      title: "11. Sonuç, Bağlantılı Konular ve Kaynakça",
      subsections: [],
      content: [
        ...spec.conclusion,
        relatedNodes.length > 0 ? "Bağlantılı konular:" : "",
        relatedNodes.length > 0 ? bullets(relatedNodes.map((item) => `[${item.plainLabel}](${item.url})`)) : "",
        "Kaynakça:",
        renderSources(spec.sources),
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
}

export function buildGuideFromSpec(spec: BinaGuidePageSpec): BinaGuideData {
  const node = getNode(spec.slugPath);
  const branchNode = getBranchNode(node);
  const meta = getBranchMeta(node.branchId);
  const sections = spec.kind === "branch" ? buildBranchSections(spec, node) : buildTopicSections(spec, node);
  const standards = unique(spec.sources.map((source) => source.shortCode));

  return {
    slugPath: node.slugPath,
    title: node.plainLabel,
    description: spec.intro[0] ?? node.summary,
    category: branchNode.plainLabel,
    categoryColor: meta.color,
    badgeLabel: spec.kind === "branch" ? "Ana Dal Rehberi" : "Alt Dal Rehberi",
    author: AUTHOR,
    authorTitle: AUTHOR_TITLE,
    date: DISPLAY_DATE,
    readTime: estimateReadTime(sections),
    image: meta.hero,
    quote: { text: spec.quote },
    sections,
    relatedPaths: resolveRelatedPaths(spec, node),
    parentPath: node.parentSlugPath,
    childPaths: node.childSlugPaths,
    standards,
    keywords: unique(spec.keywords),
    sources: spec.sources,
  };
}

export function buildGuideMap(specs: readonly BinaGuidePageSpec[]) {
  return new Map(specs.map((spec) => [spec.slugPath, buildGuideFromSpec(spec)] as const));
}

export function getAllIndexedDepthOneAndTwoPaths(): string[] {
  return getAllIndexedBinaNodes()
    .filter((node) => node.depth === 1 || node.depth === 2)
    .map((node) => node.slugPath);
}

export function getBinaGuideBreadcrumbs(slugPath: string): { title: string; href: string }[] {
  const ancestors = getBinaAncestors(slugPath).filter((item) => item.slugPath);
  const current = getIndexedBinaNodeBySlugPath(slugPath);

  return [
    { title: "Ana Sayfa", href: "/" },
    { title: "Bina Aşamaları", href: BINA_ASAMALARI_ROOT_URL },
    ...ancestors.map((item) => ({ title: item.plainLabel, href: item.url })),
    ...(current ? [{ title: current.plainLabel, href: current.url }] : []),
  ];
}

export function resolveGuideByPathOrAlias(
  guideMap: Map<string, BinaGuideData>,
  slugPath: string,
): BinaGuideData | undefined {
  const directMatch = guideMap.get(slugPath);

  if (directMatch) {
    return directMatch;
  }

  const aliasedPath = GUIDE_ALIASES[slugPath];

  if (aliasedPath) {
    const guideFromAlias = guideMap.get(aliasedPath);

    if (guideFromAlias) {
      return guideFromAlias;
    }

    const aliasedNode = getIndexedBinaNodeById(aliasedPath);

    if (aliasedNode) {
      return guideMap.get(aliasedNode.slugPath);
    }
  }

  const legacyNode = getIndexedBinaNodeById(slugPath);

  if (legacyNode) {
    return guideMap.get(legacyNode.slugPath);
  }

  return undefined;
}

export function toBinaGuideArticle(guide: BinaGuideData): ArticleData {
  return {
    slug: `kategori/bina-asamalari/${guide.slugPath}`,
    title: guide.title,
    description: guide.description,
    sectionId: "bina-asamalari",
    category: guide.category,
    categoryColor: guide.categoryColor,
    badgeLabel: guide.badgeLabel,
    author: guide.author,
    authorTitle: guide.authorTitle,
    date: guide.date,
    readTime: guide.readTime,
    image: guide.image,
    sections: guide.sections,
    quote: guide.quote,
    relatedSlugs: guide.relatedPaths.map((path) => `kategori/bina-asamalari/${path}`),
    keywords: guide.keywords,
  };
}
