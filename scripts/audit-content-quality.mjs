import fs from "fs";
import path from "path";

function parseArgs(argv) {
  const parsed = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const normalized = arg.replace(/^--/, "");

    if (normalized.includes("=")) {
      const [key, value = "true"] = normalized.split("=");
      parsed.set(key, value);
      continue;
    }

    const nextArg = argv[index + 1];

    if (nextArg && !nextArg.startsWith("--")) {
      parsed.set(normalized, nextArg);
      index += 1;
      continue;
    }

    parsed.set(normalized, "true");
  }

  return parsed;
}

const args = parseArgs(process.argv.slice(2));
const scope = args.get("scope") ?? "all";
const dataFilePath = path.join(process.cwd(), "src/lib/data.json");

const MAIN_ARTICLE_PROFILES = {
  "zemin-iyilestirme-yontemleri": { minWords: 1050, minSections: 8 },
  "beton-dokumu-kontrol-listesi": { minWords: 800, minSections: 8 },
  "eps-xps-yalitim-farklari": { minWords: 840, minSections: 8 },
  "leed-breeam-karsilastirmasi": { minWords: 1100, minSections: 8 },
  "iksa-uzman-sistemi": { minWords: 1040, minSections: 8 },
  "kolon-on-boyutlandirma": { minWords: 1040, minSections: 8 },
  "tbdy-2018-betonarme-analiz": { minWords: 940, minSections: 8 },
  "santiye-duvar-orumu": { minWords: 850, minSections: 8 },
  "kalip-sokumu-rehberi": { minWords: 950, minSections: 9 },
};

const GUIDE_WORD_LIMITS = {
  1: 1100,
  2: 950,
  3: 900,
};

function readMainArticles() {
  return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
}

function countWords(text) {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function countListItems(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^- /.test(line) || /^\d+\.\s/.test(line)).length;
}

function normalizeText(text) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function hasSectionTitle(sections, ...tokens) {
  return sections.some((section) => {
    const title = normalizeText(section.title);
    return tokens.some((token) => title.includes(token));
  });
}

function auditMainArticles() {
  const articles = readMainArticles();
  const errors = [];

  for (const [slug, profile] of Object.entries(MAIN_ARTICLE_PROFILES)) {
    const article = articles[slug];

    if (!article) {
      errors.push(`main article missing: ${slug}`);
      continue;
    }

    const mergedContent = article.sections.map((section) => section.content).join("\n");
    const wordCount = countWords(mergedContent);
    const mistakeSection = article.sections.find((section) => normalizeText(section.title).includes("hata"));
    const sourceSection = article.sections.find((section) => normalizeText(section.title).includes("kaynak"));

    if (wordCount < profile.minWords) {
      errors.push(`${slug}: word count too low (${wordCount} < ${profile.minWords})`);
    }

    if (article.sections.length < profile.minSections) {
      errors.push(`${slug}: section count too low (${article.sections.length} < ${profile.minSections})`);
    }

    if (!article.keywords || article.keywords.length < 4) {
      errors.push(`${slug}: keywords missing or insufficient`);
    }

    if (!article.quote?.text) {
      errors.push(`${slug}: quote missing`);
    }

    if (!hasSectionTitle(article.sections, "giris")) {
      errors.push(`${slug}: giris section missing`);
    }

    if (!hasSectionTitle(article.sections, "teorik", "kavramsal")) {
      errors.push(`${slug}: teorik or kavramsal section missing`);
    }

    if (!hasSectionTitle(article.sections, "yonetmelik", "standart")) {
      errors.push(`${slug}: yonetmelik or standart section missing`);
    }

    if (!hasSectionTitle(article.sections, "sayisal")) {
      errors.push(`${slug}: sayisal example section missing`);
    }

    if (!hasSectionTitle(article.sections, "yazilim", "arac")) {
      errors.push(`${slug}: yazilim or arac section missing`);
    }

    if (!mistakeSection) {
      errors.push(`${slug}: mistakes section missing`);
    } else if (countListItems(mistakeSection.content) < 5) {
      errors.push(`${slug}: mistakes list shorter than 5 items`);
    }

    if (!sourceSection) {
      errors.push(`${slug}: sources section missing`);
    } else if (countListItems(sourceSection.content) < 4) {
      errors.push(`${slug}: sources list shorter than 4 items`);
    }

    if (!mergedContent.includes("|")) {
      errors.push(`${slug}: table missing`);
    }

    if (!/Formul|Formül|Ornek|Örnek|Cozum|Çözüm/i.test(mergedContent)) {
      errors.push(`${slug}: weak formula/example signal`);
    }
  }

  return errors;
}

async function auditGuides() {
  const errors = [];
  const contentModule = await import(new URL("../src/lib/bina-asamalari-content/index.ts", import.meta.url));
  const { getAllBinaGuidePaths, getBinaGuideBySlugPath } = contentModule;

  for (const slugPath of getAllBinaGuidePaths()) {
    const guide = getBinaGuideBySlugPath(slugPath);

    if (!guide) {
      errors.push(`guide missing: ${slugPath}`);
      continue;
    }

    const mergedContent = guide.sections.map((section) => section.content).join("\n");
    const wordCount = countWords(mergedContent);
    const depth = slugPath.split("/").length;
    const minWords = GUIDE_WORD_LIMITS[depth] ?? 1600;

    if (wordCount < minWords) {
      errors.push(`${slugPath}: word count too low (${wordCount} < ${minWords})`);
    }

    if (!guide.quote?.text) {
      errors.push(`${slugPath}: quote missing`);
    }

    if (!guide.sources || guide.sources.length < 4) {
      errors.push(`${slugPath}: sources insufficient`);
    }

    if (!mergedContent.includes("|")) {
      errors.push(`${slugPath}: table missing`);
    }

    if (!/Formul|Formül|Ornek|Örnek|Cozum|Çözüm/i.test(mergedContent)) {
      errors.push(`${slugPath}: weak formula/example signal`);
    }

    if (mergedContent.includes("ilk dalga dışı") || mergedContent.includes("kısa ama işlevsel")) {
      errors.push(`${slugPath}: fallback marker still present`);
    }
  }

  return errors;
}

const errors = [];

if (scope === "main" || scope === "all") {
  errors.push(...auditMainArticles());
}

if (scope === "guides" || scope === "all") {
  errors.push(...(await auditGuides()));
}

if (errors.length > 0) {
  console.error(`Content quality check failed. Scope: ${scope}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Content quality check passed. Scope: ${scope}`);
