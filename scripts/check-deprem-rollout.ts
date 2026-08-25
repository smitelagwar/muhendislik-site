import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug } from "../src/lib/articles-data";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import {
  DEPREM_ROLLOUT_ARTICLES,
  DEPREM_ROLLOUT_BATCHES,
  DEPREM_ROLLOUT_SLUGS,
  getDepremRolloutVisualPath,
  type DepremRolloutBatch,
} from "../src/lib/deprem-rollout";
import { renderDepremVisualSvg } from "../src/lib/deprem-visual";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_BATCHES: Readonly<Record<DepremRolloutBatch, readonly string[]>> = {
  1: [
    "tbdy-2018-betonarme-analiz", "kisa-kolon-etkisi-tbdy-2018", "tbdy-2018-dogrusal-olmayan-tasarim",
    "tbdy-2018-guclu-kolon-kontrolu", "tbdy-2018-duzensizlikler-rehberi", "tbdy-2018-sismik-izolasyon",
    "tbdy-deprem-yer-hareketi-duzeyleri", "tbdy-afad-ss-s1-okuma", "tbdy-yerel-zemin-sinifi-spektrum",
    "tbdy-tasarim-spektrumu-cizimi", "tbdy-r-d-dayanim-fazlaligi", "tbdy-bina-onem-katsayisi",
  ],
  2: [
    "tbdy-suneklik-duzeyi-sistem-farki", "tbdy-mod-birlesim-srss-cqc", "tbdy-goreli-kat-otelenmesi",
    "tbdy-dismerkezlik-kurali", "tbdy-bodrum-katli-binalar", "tbdy-cati-agirligi-yuk-azaltma",
    "tbdy-p-delta-ikinci-mertebe", "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi",
    "1999-marmara-depreminden-cikarilan-muhendislik-dersleri", "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
    "duzensiz-binalarda-dinamik-analiz-zorunlulugu", "deprem-yuku-ile-ruzgar-yuku-kombinasyonu",
  ],
  3: [
    "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir", "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu",
    "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi", "deprem-sigortasi-dask-ve-muhendislik-baglantisi",
    "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek", "byy-bina-kullanim-siniflari-tehlike-kategorileri",
    "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120", "sprinkler-sistemi-zorunluluk-sinirlari",
    "duman-tahliyesi-mekanik-ve-dogal-sistemler", "kacis-merdiveni-tasarim-kriterleri",
    "yangin-kapisi-dosleme-duvar-gecis-detaylari", "yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
  ],
  4: [
    "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9", "bodrum-otopark-mutfak-yangin-uygulamalari",
    "otopark-kullanim-turune-gore-minimum-alan-hesabi", "otopark-rampa-egimi-genislik-donus-yaricapi",
    "otopark-kapali-havalandirma-co-konsantrasyonu", "otopark-yapisal-yuk-kombinasyonlari-arac-deprem",
    "otopark-elektrikli-arac-sarj-mevzuati", "imar-kat-yuksekligi-bina-yuksekligi-farki",
    "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari", "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani",
    "imar-cekme-kat-asma-kat-kosullari", "imar-balkon-cikma-sacak-emsal-disi-sartlari",
  ],
  5: [
    "imar-ruhsat-sureci-basvurudan-iskan-kadar", "imar-parsel-tevhid-ifraz-prosedurleri",
    "imar-plan-notu-celiskisi-uygulama-onceligi", "bep-ts-825-yontemi-isi-kaybi-hesabi",
    "bep-enerji-kimlik-belgesi-a-g-siniflandirma", "bep-yenilenebilir-enerji-zorunlulugu-1000m2",
    "bep-yazilimi-hesaplama-akisi", "bep-isil-kopru-detaylari-ve-cozum-yontemleri",
    "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi", "tbdy-bolum-16-zemin-yapi-etkilesimi",
    "zemin-sivlasma-riski-degerlendirmesi", "su-yalitimi-ts-4749-uygulama-detaylari",
  ],
  6: [
    "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi", "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri",
    "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari", "engelsiz-wc-asansor-kapi-boyutlari",
    "engelsiz-yapi-ruhsatinda-uyum-kontrolu", "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari",
    "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler", "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile",
    "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri", "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz",
    "akustik-ts-en-iso-12354-ile-yalitim-hesabi", "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu",
  ],
  7: [
    "asansor-makine-daireli-ve-dairesiz-sistemler",
    "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu",
    "asansor-deprem-sirasinda-otomatik-park-ozelligi",
    "isg-santiye-guvenlik-plani-zorunlu-icerik",
    "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi",
    "isg-yuksekte-calisma-ve-iskele-guvenligi",
    "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol",
    "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi",
    "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri",
    "cevre-insaat-atigi-yonetimi-yonetmeligi",
    "cevre-gurultu-ve-toz-santiye-yukumlulukleri",
    "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu",
  ],
};

const BATCH_IDS = Object.keys(EXPECTED_BATCHES).map(Number) as DepremRolloutBatch[];
const errors: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) errors.push(message);
}

for (const batch of BATCH_IDS) {
  const expected = EXPECTED_BATCHES[batch];
  const actual = DEPREM_ROLLOUT_BATCHES[batch];
  const actualSlugs = new Set(actual.map((spec) => spec.slug));
  assert(actual.length === expected.length, `Batch ${batch} tam olarak ${expected.length} makale içermeli.`);
  assert(actualSlugs.size === expected.length, `Batch ${batch} slug listesinde tekrar/eksik kayıt var.`);
  for (const slug of expected) assert(actualSlugs.has(slug), `Batch ${batch} slug eksik: ${slug}`);
}

assert(Object.keys(DEPREM_ROLLOUT_BATCHES).length === BATCH_IDS.length, "Tanımlı rollout batch sayısı kontratla uyuşmuyor.");
assert(DEPREM_ROLLOUT_SLUGS.size === DEPREM_ROLLOUT_ARTICLES.length, "Rollout genel listesinde tekrar slug var.");

for (const batch of BATCH_IDS.filter((id) => id >= 3)) {
  const layouts = new Set(DEPREM_ROLLOUT_BATCHES[batch].map((spec) => spec.visualLayout));
  for (const expectedLayout of ["flow", "decision", "comparison", "classification"] as const) {
    assert(layouts.has(expectedLayout), `Batch ${batch} görsel grameri eksik: ${expectedLayout}`);
  }
}

const uniqueCovers = new Set<string>();
const uniqueDiagrams = new Set<string>();

for (const spec of DEPREM_ROLLOUT_ARTICLES) {
  const article = getArticleBySlug(spec.slug);
  assert(Boolean(article), `Runtime makalesi bulunamadı: ${spec.slug}`);
  if (!article) continue;

  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${article.slug}`);
  assert(!TS500_SLUGS.has(article.slug), `Rollout TS500'e temas ediyor: ${article.slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(article.slug), `Rollout pilotla çakışıyor: ${article.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `updatedAt uygulanmadı: ${article.slug}`);

  if (spec.referenceProfile === "preserve") {
    assert((article.references?.length ?? 0) >= 1, `Korunacak mevcut kaynakça bulunamadı: ${article.slug}`);
  } else {
    assert((article.references?.length ?? 0) >= 2, `En az iki resmi referans bekleniyor: ${article.slug}`);
    assert(article.references?.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `TBDY PDF referansı eksik: ${article.slug}`);
    assert(article.references?.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY sayfası eksik: ${article.slug}`);
    if (spec.referenceProfile === "tbdy-hazard") {
      assert(article.references?.some((ref) => ref.href?.includes("turkiye-deprem-tehlike-haritasi")), `AFAD tehlike haritası referansı eksik: ${article.slug}`);
    }
  }

  const cover = getDepremRolloutVisualPath(article.slug, "cover");
  const diagram = getDepremRolloutVisualPath(article.slug, "diagram");
  assert(article.image === cover, `Dinamik cover uygulanmadı: ${article.slug}`);
  assert(!uniqueCovers.has(cover), `Cover yolu tekrar ediyor: ${cover}`);
  assert(!uniqueDiagrams.has(diagram), `Diagram yolu tekrar ediyor: ${diagram}`);
  uniqueCovers.add(cover);
  uniqueDiagrams.add(diagram);

  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  assert(Boolean(figure), `Rollout teknik figure bulunamadı: ${article.slug}`);
  if (figure?.type === "image") {
    assert(Boolean(figure.alt), `Figure alt metni eksik: ${article.slug}`);
    assert(Boolean(figure.caption), `Figure caption eksik: ${article.slug}`);
    assert(figure.figureNumber === "R1", `Figure numarası R1 olmalı: ${article.slug}`);
    assert(Boolean(figure.note), `Figure notu eksik: ${article.slug}`);
    assert(Boolean(figure.sourceNote), `Figure kaynak notu eksik: ${article.slug}`);
    assert(figure.sourceNote.includes("türetilmiş teknik şema"), `Figure provenance açık değil: ${article.slug}`);
    assert(figure.lightbox, `Figure lightbox açık olmalı: ${article.slug}`);
  }

  for (const asset of ["cover", "diagram"] as const) {
    const svg = renderDepremVisualSvg(spec, asset);
    assert(svg.startsWith("<svg"), `SVG başlangıcı geçersiz: ${article.slug}/${asset}`);
    assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `SVG xmlns eksik: ${article.slug}/${asset}`);
    assert(!/<script|<foreignObject|javascript:/i.test(svg), `SVG güvenlik kontratı ihlali: ${article.slug}/${asset}`);
    assert(svg.includes("<title"), `SVG erişilebilir title eksik: ${article.slug}/${asset}`);
  }
}

if (errors.length > 0) {
  console.error("Deprem rollout kontrolü başarısız:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  batches: BATCH_IDS,
  articles: DEPREM_ROLLOUT_ARTICLES.length,
  batchSizes: Object.fromEntries(BATCH_IDS.map((batch) => [batch, DEPREM_ROLLOUT_BATCHES[batch].length])),
  layoutDiversity: Object.fromEntries(
    BATCH_IDS.filter((id) => id >= 3).map((batch) => [batch, [...new Set(DEPREM_ROLLOUT_BATCHES[batch].map((spec) => spec.visualLayout))]]),
  ),
  uniqueCovers: uniqueCovers.size,
  uniqueDiagrams: uniqueDiagrams.size,
  ts500Touched: false,
  pilotOverlap: false,
}, null, 2));
