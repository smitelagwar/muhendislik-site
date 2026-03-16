import { blocksToContent, contentToBlocks, generateId, type Block } from "./blocks-to-content";
import { SITE_SECTIONS, getSiteSectionByCategory, type SiteSectionId } from "./site-sections";

export const ADMIN_PASSWORD = "admin123";
export const ADMIN_AUTH_STORAGE_KEY = "portal_admin_auth";
export const EDITOR_DRAFT_STORAGE_KEY = "portal_admin_editor_draft";
export const WORKSPACE_PREFS_STORAGE_KEY = "portal_admin_workspace_preferences";
export const LAST_EDITED_ARTICLE_KEY = "portal_admin_last_article";

export interface StoredSection {
  id: string;
  title: string;
  content: string;
  subsections: { id: string; title: string }[];
}

export interface StoredArticle {
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
  quote: { text: string };
  sections: StoredSection[];
  relatedSlugs: string[];
}

export interface EditorSection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface EditorArticle extends Omit<StoredArticle, "sections"> {
  sections: EditorSection[];
}

export type TemplateId = "field-guide" | "checklist" | "comparison" | "regulation" | "tool-note";

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  sectionId: SiteSectionId;
  image?: string;
  build: () => Partial<EditorArticle>;
}

export interface WorkspacePreferences {
  accentId: string;
  density: "comfortable" | "compact";
  previewSurface: "paper" | "slate" | "blueprint";
  autoSlug: boolean;
  autoReadTime: boolean;
}

export interface AccentOption {
  id: string;
  label: string;
  solid: string;
  soft: string;
  border: string;
  text: string;
  glow: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: "cobalt",
    label: "Cobalt",
    solid: "#1d4ed8",
    soft: "rgba(29, 78, 216, 0.14)",
    border: "rgba(29, 78, 216, 0.25)",
    text: "#1d4ed8",
    glow: "rgba(29, 78, 216, 0.22)",
  },
  {
    id: "emerald",
    label: "Emerald",
    solid: "#059669",
    soft: "rgba(5, 150, 105, 0.14)",
    border: "rgba(5, 150, 105, 0.25)",
    text: "#047857",
    glow: "rgba(5, 150, 105, 0.22)",
  },
  {
    id: "amber",
    label: "Amber",
    solid: "#d97706",
    soft: "rgba(217, 119, 6, 0.14)",
    border: "rgba(217, 119, 6, 0.24)",
    text: "#b45309",
    glow: "rgba(217, 119, 6, 0.2)",
  },
  {
    id: "rose",
    label: "Rose",
    solid: "#e11d48",
    soft: "rgba(225, 29, 72, 0.14)",
    border: "rgba(225, 29, 72, 0.24)",
    text: "#be123c",
    glow: "rgba(225, 29, 72, 0.2)",
  },
];

export const PREVIEW_SURFACE_OPTIONS: Array<{
  id: WorkspacePreferences["previewSurface"];
  label: string;
  className: string;
}> = [
  {
    id: "paper",
    label: "Paper",
    className: "bg-white text-zinc-900",
  },
  {
    id: "slate",
    label: "Slate",
    className: "bg-zinc-950 text-zinc-100",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    className: "bg-[#07121f] text-slate-100",
  },
];

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  accentId: ACCENT_OPTIONS[0].id,
  density: "comfortable",
  previewSurface: "paper",
  autoSlug: true,
  autoReadTime: true,
};

export const SECTION_PRESETS: Array<{
  sectionId: SiteSectionId;
  category: string;
  categoryColor: string;
  badgeLabel: string;
  authorTitle: string;
}> = [
  {
    sectionId: "santiye",
    category: "Şantiye Notu",
    categoryColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    badgeLabel: "Teknik Rehber",
    authorTitle: "Şantiye Editörü",
  },
  {
    sectionId: "malzeme",
    category: "Malzeme Veritabanı",
    categoryColor: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    badgeLabel: "Karşılaştırma",
    authorTitle: "Malzeme Uzmanı",
  },
  {
    sectionId: "geoteknik",
    category: "Geoteknik Rehberi",
    categoryColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    badgeLabel: "Teknik Makale",
    authorTitle: "Geoteknik Editörü",
  },
  {
    sectionId: "deprem-yonetmelik",
    category: "Yönetmelik Güncellemesi",
    categoryColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    badgeLabel: "Mevzuat Notu",
    authorTitle: "Yönetmelik Editörü",
  },
  {
    sectionId: "araclar",
    category: "Hesap Aracı",
    categoryColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    badgeLabel: "Araç Rehberi",
    authorTitle: "Teknik Ürün Editörü",
  },
  {
    sectionId: "yapi-tasarimi",
    category: "Yapı Tasarımı",
    categoryColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    badgeLabel: "Analiz",
    authorTitle: "Tasarım Editörü",
  },
  {
    sectionId: "surdurulebilirlik",
    category: "Sürdürülebilirlik",
    categoryColor: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
    badgeLabel: "Sektör Özeti",
    authorTitle: "Sürdürülebilirlik Editörü",
  },
];

export const BLOCK_LIBRARY: Array<{
  type: Block["type"];
  label: string;
  description: string;
}> = [
  { type: "paragraph", label: "Paragraf", description: "Akıcı gövde metni" },
  { type: "heading", label: "Alt başlık", description: "Bölüm içinde yeni kırılım" },
  { type: "image", label: "Görsel", description: "URL, alt metin ve açıklama" },
  { type: "code", label: "Kod", description: "Dil bilgisi ile kod bloğu" },
  { type: "callout", label: "Bilgi kutusu", description: "Uyarı, not veya ipucu" },
  { type: "link-embed", label: "Link kartı", description: "Harici kaynak önerisi" },
  { type: "list", label: "Liste", description: "Sıralı veya sırasız maddeler" },
  { type: "quote", label: "Alıntı", description: "Vurgulu cümle veya görüş" },
  { type: "divider", label: "Ayraç", description: "İçerik ritmini böl" },
  { type: "table", label: "Tablo", description: "Kıyas ve özet veriler" },
];

function createParagraph(content = ""): Block {
  return { id: generateId(), type: "paragraph", content };
}

function createHeading(content = "", level = 3): Block {
  return { id: generateId(), type: "heading", content, level };
}

function createList(items: string[] = [""]): Block {
  return { id: generateId(), type: "list", items, ordered: false };
}

function createCallout(content = "", variant = "not"): Block {
  return { id: generateId(), type: "callout", content, variant };
}

function createSectionTemplate(id: string, title: string, blocks: Block[]): EditorSection {
  return {
    id,
    title,
    blocks,
  };
}

export const TEMPLATE_PRESETS: TemplateDefinition[] = [
  {
    id: "field-guide",
    label: "Saha rehberi",
    description: "Uygulama odaklı, hızlı tüketilen rehber akışı.",
    sectionId: "santiye",
    image: "/covers/santiye.svg",
    build: () => ({
      title: "Yeni saha rehberi",
      description: "Şantiyede karar vermeyi hızlandıran kısa özet ve kritik kontroller.",
      quote: { text: "En iyi editör, sahada tereddüt bırakmayan editördür." },
      sections: [
        createSectionTemplate("giris", "1. Giriş", [createParagraph("Konuya kısa giriş ve kapsam."), createCallout("Bu rehber sahadaki kritik karar noktalarını özetler.", "bilgi")]),
        createSectionTemplate("kritik-kriterler", "2. Kritik kriterler", [createList(["Kontrol kalemi 1", "Kontrol kalemi 2", "Kontrol kalemi 3"])]),
        createSectionTemplate("uygulama", "3. Uygulama akışı", [createHeading("Sahada dikkat edilecekler"), createParagraph("Adım adım uygulama akışı."), createCallout("Hız için kontrol listesi kullanın.", "ipucu")]),
        createSectionTemplate("sonuc", "4. Son karar", [createParagraph("Son değerlendirme ve karar notları.")]),
      ],
    }),
  },
  {
    id: "checklist",
    label: "Kontrol listesi",
    description: "Madde madde kontrol akışı ve sahada hızlı tarama.",
    sectionId: "santiye",
    image: "/covers/santiye.svg",
    build: () => ({
      title: "Yeni kontrol listesi",
      description: "Saha ekibinin uygulama öncesi kısa sürede tamamlayabileceği checklist yapısı.",
      quote: { text: "İyi checklist, hata oluşmadan önce riski görünür kılar." },
      sections: [
        createSectionTemplate("hazirlik", "1. Hazırlık", [createList(["Çizimler teyit edildi", "Malzeme sahada hazır", "Ekiplere görev dağıtıldı"])]),
        createSectionTemplate("uygulama-sirasi", "2. Uygulama sırası", [createList(["Kontrol 1", "Kontrol 2", "Kontrol 3"])]),
        createSectionTemplate("kritik-hatalar", "3. Kritik hatalar", [createCallout("Bu alanda geri dönüşü zor hataları listeleyin.", "uyari")]),
        createSectionTemplate("teslim", "4. Teslim", [createParagraph("Teslim ve kayıt notları.")]),
      ],
    }),
  },
  {
    id: "comparison",
    label: "Karşılaştırma",
    description: "İki yaklaşımı tablo ve özet maddeler ile kıyasla.",
    sectionId: "malzeme",
    image: "/covers/malzeme.svg",
    build: () => ({
      title: "Yeni karşılaştırma dosyası",
      description: "Alternatif çözümler için karar vermeyi kolaylaştıran karşılaştırmalı format.",
      quote: { text: "Karar hızını artıran şey veri bolluğu değil, iyi yapılandırılmış karşılaştırmadır." },
      sections: [
        createSectionTemplate("genel-bakis", "1. Genel bakış", [createParagraph("Karşılaştırmanın amacı ve sınırları."), createCallout("Okuyucunun en çok merak ettiği farkları ilk bölümde netleştirin.", "ipucu")]),
        createSectionTemplate("teknik-karsilastirma", "2. Teknik karşılaştırma", [
          {
            id: generateId(),
            type: "table",
            rows: [
              ["Kriter", "Seçenek A", "Seçenek B"],
              ["Maliyet", "", ""],
              ["Uygulama hızı", "", ""],
              ["Bakım", "", ""],
            ],
          },
        ]),
        createSectionTemplate("oneriler", "3. Öneri", [createList(["Seçenek A ne zaman seçilir", "Seçenek B ne zaman seçilir"])]),
      ],
    }),
  },
  {
    id: "regulation",
    label: "Yönetmelik notu",
    description: "Madde, etki ve uygulama yorumu ekseninde içerik şablonu.",
    sectionId: "deprem-yonetmelik",
    image: "/covers/yonetmelik.svg",
    build: () => ({
      title: "Yeni yönetmelik özeti",
      description: "Mevzuat değişikliğinin etkisini hızlı anlatan editoryal yapı.",
      quote: { text: "Yönetmelik metnini aktarmak yetmez; sahadaki etkisini yorumlamak gerekir." },
      sections: [
        createSectionTemplate("degisiklik", "1. Ne değişti", [createParagraph("Yeni düzenlemeyi kısa ve net özetleyin.")]),
        createSectionTemplate("kapsam", "2. Kimi etkiliyor", [createList(["Proje ofisleri", "Şantiye ekipleri", "Kontrol birimleri"])]),
        createSectionTemplate("uygulama-notu", "3. Uygulama notu", [createCallout("Madde yorumunu ve sık yapılan hataları burada toplayın.", "bilgi")]),
      ],
    }),
  },
  {
    id: "tool-note",
    label: "Araç duyurusu",
    description: "Hesap aracını anlatan kısa, yönlendirici editoryal akış.",
    sectionId: "araclar",
    image: "/covers/araclar.svg",
    build: () => ({
      title: "Yeni araç duyurusu",
      description: "Aracın neyi çözdüğünü ve hangi girdilerle çalıştığını açıklayan kısa yapı.",
      quote: { text: "İyi araç duyurusu, kullanıcıyı nasıl kullanacağını düşünmeden sonuca götürür." },
      sections: [
        createSectionTemplate("problem", "1. Çözdüğü problem", [createParagraph("Aracın hangi problemi çözdüğünü belirtin.")]),
        createSectionTemplate("girdiler", "2. Girdi yapısı", [createList(["Girdi 1", "Girdi 2", "Girdi 3"])]),
        createSectionTemplate("cikti", "3. Çıktılar", [createParagraph("Araç kullanıcıya hangi çıktıları üretir.")]),
      ],
    }),
  },
];

const SITE_SECTION_IDS = new Set<SiteSectionId>(SITE_SECTIONS.map((section) => section.id));

export function slugify(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createBlock(type: Block["type"]): Block {
  switch (type) {
    case "paragraph":
      return createParagraph();
    case "heading":
      return createHeading();
    case "image":
      return { id: generateId(), type, src: "", alt: "", caption: "" };
    case "code":
      return { id: generateId(), type, lang: "", content: "" };
    case "callout":
      return createCallout();
    case "link-embed":
      return { id: generateId(), type, url: "", title: "" };
    case "list":
      return createList();
    case "quote":
      return { id: generateId(), type, content: "" };
    case "divider":
      return { id: generateId(), type };
    case "table":
      return { id: generateId(), type, rows: [["Başlık", "Değer"], ["", ""]] };
  }
}

export function createEmptySection(index = 1): EditorSection {
  const id = index === 1 ? "giris" : `bolum-${index}`;
  return {
    id,
    title: `${index}. Bölüm`,
    blocks: [createParagraph("")],
  };
}

function formatToday() {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getSectionPreset(sectionId: SiteSectionId) {
  return SECTION_PRESETS.find((preset) => preset.sectionId === sectionId) ?? SECTION_PRESETS[0];
}

function resolveSectionId(input?: Partial<StoredArticle> | Partial<EditorArticle>): SiteSectionId {
  if (input?.sectionId && SITE_SECTION_IDS.has(input.sectionId)) {
    return input.sectionId;
  }

  if (input?.category) {
    return getSiteSectionByCategory(input.category)?.id ?? "santiye";
  }

  return "santiye";
}

export function createEmptyArticle(sectionId: SiteSectionId = "santiye"): EditorArticle {
  const preset = getSectionPreset(sectionId);

  return {
    slug: "",
    title: "",
    description: "",
    sectionId,
    category: preset.category,
    categoryColor: preset.categoryColor,
    badgeLabel: preset.badgeLabel,
    author: "Admin Editör",
    authorTitle: preset.authorTitle,
    date: formatToday(),
    readTime: "1 dk okuma",
    image: "/covers/santiye.svg",
    quote: { text: "" },
    sections: [createEmptySection(1)],
    relatedSlugs: [],
  };
}

function normalizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) {
    return [createParagraph("")];
  }

  const blocks = raw
    .map((item) => item as Partial<Block>)
    .filter((item): item is Partial<Block> & { type: Block["type"] } => Boolean(item?.type))
    .map((item) => ({ ...createBlock(item.type), ...item, id: item.id || generateId() } as Block));

  return blocks.length > 0 ? blocks : [createParagraph("")];
}

export function toEditorArticle(input?: Partial<StoredArticle> | Partial<EditorArticle>): EditorArticle {
  const sectionId = resolveSectionId(input);
  const preset = getSectionPreset(sectionId);
  const base = createEmptyArticle(sectionId);
  const sectionsSource = input?.sections ?? base.sections;

  const sections = sectionsSource.map((section, index) => {
    const blockSource = "blocks" in section ? section.blocks : contentToBlocks(section.content || "");

    return {
      id: section.id || slugify(section.title || `bolum-${index + 1}`) || `bolum-${index + 1}`,
      title: section.title || `${index + 1}. Bölüm`,
      blocks: normalizeBlocks(blockSource),
    };
  });

  return {
    ...base,
    slug: input?.slug?.trim() || base.slug,
    title: input?.title || base.title,
    description: input?.description || base.description,
    sectionId,
    category: input?.category || preset.category,
    categoryColor: input?.categoryColor || preset.categoryColor,
    badgeLabel: input?.badgeLabel || preset.badgeLabel,
    author: input?.author || base.author,
    authorTitle: input?.authorTitle || preset.authorTitle,
    date: input?.date || base.date,
    readTime: input?.readTime || base.readTime,
    image: input?.image || base.image,
    quote: { text: input?.quote?.text || "" },
    sections: sections.length > 0 ? sections : [createEmptySection(1)],
    relatedSlugs: Array.isArray(input?.relatedSlugs) ? Array.from(new Set(input.relatedSlugs.filter(Boolean))) : [],
  };
}

function extractSubsections(sectionId: string, blocks: Block[]) {
  return blocks
    .filter((block): block is Extract<Block, { type: "heading" }> => block.type === "heading")
    .map((block, index) => ({
      id: `${sectionId}-${slugify(block.content || `alt-baslik-${index + 1}`) || `alt-baslik-${index + 1}`}`,
      title: block.content || `Alt başlık ${index + 1}`,
    }));
}

export function toStoredArticle(article: EditorArticle): StoredArticle {
  return {
    slug: article.slug.trim(),
    title: article.title.trim(),
    description: article.description.trim(),
    sectionId: article.sectionId,
    category: article.category.trim(),
    categoryColor: article.categoryColor.trim(),
    badgeLabel: article.badgeLabel.trim(),
    author: article.author.trim(),
    authorTitle: article.authorTitle.trim(),
    date: article.date.trim(),
    readTime: article.readTime.trim(),
    image: article.image.trim(),
    quote: { text: article.quote.text.trim() },
    relatedSlugs: Array.from(new Set(article.relatedSlugs.filter(Boolean))),
    sections: article.sections.map((section, index) => {
      const sectionId = section.id.trim() || slugify(section.title || `bolum-${index + 1}`) || `bolum-${index + 1}`;

      return {
        id: sectionId,
        title: section.title.trim() || `${index + 1}. Bölüm`,
        content: blocksToContent(section.blocks),
        subsections: extractSubsections(sectionId, section.blocks),
      };
    }),
  };
}

export function getWordCount(article: Pick<EditorArticle, "sections">) {
  return article.sections.reduce((total, section) => {
    return (
      total +
      section.blocks.reduce((sectionTotal, block) => {
        if (block.type === "table") {
          return sectionTotal + (block.rows || []).flat().join(" ").split(/\s+/).filter(Boolean).length;
        }

        if (block.type === "list") {
          return sectionTotal + (block.items || []).join(" ").split(/\s+/).filter(Boolean).length;
        }

        if (block.type === "image") {
          return sectionTotal + `${block.alt || ""} ${block.caption || ""}`.split(/\s+/).filter(Boolean).length;
        }

        if (block.type === "link-embed") {
          return sectionTotal + `${block.title || ""} ${block.url || ""}`.split(/\s+/).filter(Boolean).length;
        }

        return sectionTotal + (block.content || "").split(/\s+/).filter(Boolean).length;
      }, 0)
    );
  }, 0);
}

export function calculateReadTime(article: Pick<EditorArticle, "sections">) {
  return `${Math.max(1, Math.ceil(getWordCount(article) / 200))} dk okuma`;
}

export function parseReadTime(readTime: string) {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function duplicateArticle(article: EditorArticle): EditorArticle {
  const cloned = toEditorArticle(article);

  return {
    ...cloned,
    slug: cloned.slug ? `${cloned.slug}-kopya` : "",
    title: cloned.title ? `${cloned.title} (Kopya)` : "",
  };
}

export function applyTemplate(templateId: TemplateId, seed?: Partial<EditorArticle>): EditorArticle {
  const template = TEMPLATE_PRESETS.find((item) => item.id === templateId);

  if (!template) {
    return toEditorArticle(seed);
  }

  const templatePayload = template.build();
  const merged = toEditorArticle({
    ...createEmptyArticle(template.sectionId),
    ...templatePayload,
    ...seed,
    sectionId: seed?.sectionId || template.sectionId,
    image: seed?.image || templatePayload.image || template.image || createEmptyArticle(template.sectionId).image,
    quote: seed?.quote?.text ? seed.quote : templatePayload.quote,
    sections: seed?.sections && seed.sections.length > 0 ? seed.sections : templatePayload.sections,
  });

  return {
    ...merged,
    readTime: calculateReadTime(merged),
  };
}
