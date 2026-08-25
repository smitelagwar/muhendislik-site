import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR } from "../src/lib/content-author";
import { DEPREM_PILOT_ARTICLES, DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const EXPECTED_SLUGS = [
  "tbdy-etkin-kesit-rijitlikleri",
  "tbdy-betonarme-bag-kirisli-perde",
  "radye-temel-zemin-yayi-yatak-katsayisi",
  "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma",
  "imar-taks-kaks-emsal-hesabi",
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
] as const;

const errors: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) errors.push(message);
}

function publicFileExists(src: string) {
  return src.startsWith("/") && fs.existsSync(path.join(ROOT, "public", src.slice(1)));
}

assert(DEPREM_PILOT_ARTICLES.length === EXPECTED_SLUGS.length, `Pilot sayısı ${EXPECTED_SLUGS.length} olmalı.`);
assert(DEPREM_PILOT_SLUGS.size === EXPECTED_SLUGS.length, "Pilot slug kümesinde tekrar veya eksik kayıt var.");
for (const slug of EXPECTED_SLUGS) assert(DEPREM_PILOT_SLUGS.has(slug), `Pilot source-of-truth slug eksik: ${slug}`);

const seenCovers = new Set<string>();

for (const configured of DEPREM_PILOT_ARTICLES) {
  const article = getArticleBySlug(configured.slug);
  assert(Boolean(article), `Runtime makalesi bulunamadı: ${configured.slug}`);
  if (!article) continue;

  assert(!TS500_SLUGS.has(article.slug), `Pilot yanlışlıkla TS500 kapsamına girdi: ${article.slug}`);
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${article.slug}`);
  assert(article.title === configured.title, `Pilot override başlığı runtime'a taşınmadı: ${article.slug}`);
  assert(article.image === configured.image, `Pilot cover override'u runtime'a taşınmadı: ${article.slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${article.slug}`);
  assert(article.authorTitle === "", `Deprem canonical authorTitle boş olmalı: ${article.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `Pilot güncelleme tarihi beklenenden farklı: ${article.slug}`);
  assert((article.references?.length ?? 0) >= 2, `En az iki doğrulanabilir referans bekleniyor: ${article.slug}`);
  assert(article.references?.every((ref) => !ref.href || /^https:\/\//.test(ref.href)), `Geçersiz referans URL'si: ${article.slug}`);
  assert(article.image.startsWith("/images/deprem-pilots/"), `Pilot cover dizini yanlış: ${article.slug}`);
  assert(!/generic|placeholder|default|\/covers\/yonetmelik\.svg/i.test(article.image), `Generic cover kullanılıyor: ${article.slug}`);
  assert(!seenCovers.has(article.image), `Cover başka pilotta tekrar kullanılıyor: ${article.image}`);
  seenCovers.add(article.image);
  assert(publicFileExists(article.image), `Cover dosyası bulunamadı: ${article.image}`);

  const bodyImages = article.sections.flatMap((section) =>
    parseBlocks(section.content).filter((block) => block.type === "image"),
  );
  const bodyImageSources = [...new Set(bodyImages.map((block) => block.type === "image" ? block.src : "").filter(Boolean))];
  assert(bodyImageSources.length >= 1, `Teknik body figure bulunamadı: ${article.slug}`);
  assert(bodyImageSources.every((src) => src !== article.image), `Cover ile body figure aynı dosya olmamalı: ${article.slug}`);
  assert(bodyImageSources.every((src) => src.startsWith("/images/deprem-pilots/")), `Body figure dizini yanlış: ${article.slug}`);
  assert(bodyImageSources.every(publicFileExists), `Body figure dosyası bulunamadı: ${article.slug}`);

  const figureBlocks = bodyImages.filter((block) => block.type === "image" && block.figureNumber && block.sourceNote && block.lightbox);
  assert(figureBlocks.length >= 1, `Figure metadata eksik: ${article.slug}`);

  const text = article.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!/[�ÃÄÅÂ]/.test(text), `Encoding şüphesi: ${article.slug}`);
  assert(!text.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u pilotta kaldı: ${article.slug}`);
}

const requiredContent: Record<(typeof EXPECTED_SLUGS)[number], string[]> = {
  "tbdy-etkin-kesit-rijitlikleri": ["4.5.8.3", "Bağ kirişi — eğilme / kesme", "0.15", "0.70"],
  "tbdy-betonarme-bag-kirisli-perde": ["7.6.8.2", "l_n > 2 h", "A_sd = V_d / (2 f_yd sin γ)"],
  "radye-temel-zemin-yayi-yatak-katsayisi": ["K_i = k_s A_i", "tributary", "compression-only"],
  "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma": ["Madde 33", "110 cm", "120 cm", "80 cm"],
  "imar-taks-kaks-emsal-hesabi": ["A_taban = A_parsel × TAKS", "A_emsal = A_parsel × KAKS", "1 Temmuz 2026"],
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu": ["U = 1 / R_T", "1 Nisan 2025", "6 iklim bölgesine", "p_v(x) <= p_sat(θ_x)"],
};

for (const slug of EXPECTED_SLUGS) {
  const article = getArticleBySlug(slug);
  if (!article) continue;
  const text = article.sections.map((section) => section.content).join("\n");
  for (const token of requiredContent[slug]) {
    assert(text.includes(token), `Zorunlu pilot içerik işareti eksik (${token}): ${slug}`);
  }
}

if (errors.length > 0) {
  console.error("Deprem FAZ 2 pilot kontrolü başarısız:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  pilots: EXPECTED_SLUGS.length,
  uniqueCovers: seenCovers.size,
  visualContract: "unique cover + technical body figure",
  sourceOfTruth: "src/lib/deprem-pilot-articles.ts",
  ts500Touched: false,
}, null, 2));
