import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_ARTICLES, DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { DEPREM_ROLLOUT_SLUGS, getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const BATCH_1_SLUGS = [
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki",
  "mevcut-bina-bilgi-duzeyleri",
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme",
  "mevcut-bina-karot-beton-dayanimi",
] as const;

const BATCH_2_SLUGS = [
  "mevcut-bina-donati-tespiti-korozyon",
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi",
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi",
  "mevcut-bina-dogrusal-degerlendirme-sinirlari",
] as const;

const BATCH_3_SLUGS = [
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu",
  "guclendirme-betonarme-perde-eklenmesi",
  "guclendirme-temel-sistemi-yuk-aktarimi",
] as const;

const BATCH_4_SLUGS = [
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir",
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi",
] as const;

const BATCH_5_SLUGS = [
  "zemin-temel-etudu-rapor-kategorileri",
  "zemin-raporu-verilerinin-yapi-modeline-aktarimi",
  "temel-tasima-gucu-oturma-kontrolu",
  "temel-kayma-devrilme-guvenligi",
] as const;

const BATCH_6_SLUGS = ["bodrum-perdesi-statik-dinamik-zemin-basinci"] as const;

const BATCH_7_SLUGS = [
  "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi",
  "tbdy-bolum-16-zemin-yapi-etkilesimi",
  "zemin-sivlasma-riski-degerlendirmesi",
] as const;

const BATCH_8_SLUGS = [
  "su-yalitimi-ts-4749-uygulama-detaylari",
  "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi",
] as const;

const BATCH_9_SLUGS = [
  "yapi-denetimi-statik-proje-kontrolu",
  "yapi-denetimi-betonarme-uygulama-cizimleri",
  "yapi-denetimi-dokum-oncesi-kalip-donati",
] as const;

const BATCH_10_SLUGS = [
  "yapi-denetimi-beton-tanimlama-en206-ts13515",
  "yapi-denetimi-ebis-beton-numunesi-kabul",
  "yapi-denetimi-dusuk-beton-dayanimi-karot",
] as const;

const BATCH_11_SLUGS = [
  "yapi-denetimi-ts708-donati-celigi-kabul",
  "yapi-denetimi-en13670-yerlestirme-kur-tolerans",
] as const;

const PHASE2_C1_CARRY_FORWARD = [
  { slug: "radye-temel-zemin-yayi-yatak-katsayisi", seriesId: "su-zemin" },
] as const;

const PHASE4_SLUGS = [
  ...BATCH_1_SLUGS,
  ...BATCH_2_SLUGS,
  ...BATCH_3_SLUGS,
  ...BATCH_4_SLUGS,
  ...BATCH_5_SLUGS,
  ...BATCH_6_SLUGS,
  ...BATCH_7_SLUGS,
  ...BATCH_8_SLUGS,
  ...BATCH_9_SLUGS,
  ...BATCH_10_SLUGS,
  ...BATCH_11_SLUGS,
] as const;

type Phase4Slug = (typeof PHASE4_SLUGS)[number];

const SU_ZEMIN_SLUGS = new Set<string>([
  ...BATCH_5_SLUGS,
  ...BATCH_6_SLUGS,
  ...BATCH_7_SLUGS,
  ...BATCH_8_SLUGS,
]);
const YAPI_DENETIM_SLUGS = new Set<string>([
  ...BATCH_9_SLUGS,
  ...BATCH_10_SLUGS,
  ...BATCH_11_SLUGS,
]);
const BATCH_9_SOURCE_SLUGS = new Set<string>(BATCH_9_SLUGS);
const NON_TBDY_SOURCE_SLUGS = new Set<string>([
  ...BATCH_8_SLUGS,
  ...BATCH_9_SLUGS,
  ...BATCH_10_SLUGS,
  ...BATCH_11_SLUGS,
]);

const requiredTokens: Record<Phase4Slug, string[]> = {
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki": ["6306", "Ek-2", "15.1.6", "15.1.7", "riskli yapı tespiti", "performans", "Mühendislik kontrol listesi"],
  "mevcut-bina-bilgi-duzeyleri": ["15.2.2", "BKS=3", "0.75", "1.00", "Tablo 15.1", "15.2.12", "Mühendislik kontrol listesi"],
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme": ["15.2.1.2", "inceleme çukuru", "kısa kolon", "derz", "15.1.6", "kat + aks + eleman", "Mühendislik kontrol listesi"],
  "mevcut-bina-karot-beton-dayanimi": ["15.2.4.3", "15.2.5.3", "100 mm", "400 m²", "0.85 × ortalama", "%75", "TS EN 12504-1", "Mühendislik kontrol listesi"],
  "mevcut-bina-donati-tespiti-korozyon": ["15.2.4.2", "15.2.5.2", "%5", "%20", "%30", "%15", "donatı gerçekleşme katsayısı", "korozyon", "1.00", "Mühendislik kontrol listesi"],
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi": ["mevcut malzeme dayanımı", "15.2.3", "15.2.12", "0.75", "1.00", "malzeme katsayıları", "mevcut çelik dayanımı", "Mühendislik kontrol listesi"],
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi": ["15.5.2.2", "Ve", "gevrek", "Sınırlı Hasar", "Kontrollü Hasar", "Göçme Öncesi Hasar", "15.3.3", "en fazla hasar gören kesit", "Mühendislik kontrol listesi"],
  "mevcut-bina-dogrusal-degerlendirme-sinirlari": ["15.5.3.1", "BYS < 5", "B3 düzensizliği", "EKO", "3'ten büyük", "5'ten büyük", "Σ(Vi × EKOi) / ΣVi", "15.6", "Mühendislik kontrol listesi"],
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu": ["15.10.1", "15.10.2", "100 mm", "0.9", "eğilme kapasitesi", "EK 15B", "0.004", "0.50", "2.5", "Mühendislik kontrol listesi"],
  "guclendirme-betonarme-perde-eklenmesi": ["15.10.5.1", "16 mm", "10 katı", "400 mm", "7.6.5", "16.7", "16.8", "sürtünme kesmesi", "Mühendislik kontrol listesi"],
  "guclendirme-temel-sistemi-yuk-aktarimi": ["15.9.3.2", "15.10.5", "Et ≤ Rt", "16.7.3.1", "%30", "16.8.1.1", "taşıma gücü", "yatayda kayma", "Mühendislik kontrol listesi"],
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir": ["15.1.6", "15.2.1.2", "15.2.12", "0.75", "1.00", "15.4.1", "I = 1.0", "15.5", "15.6", "Tablo 3.4", "Mühendislik kontrol listesi"],
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi": ["7663", "7269", "gözlemsel", "performansını ve riskini", "Hasarsız", "Az Hasarlı", "Orta Hasarlı", "Ağır Hasarlı", "Yıkık", "Acil Yıktırılacak", "Kesin hasar tespiti", "itiraz hasar tespiti", "15.1.6", "Mühendislik kontrol listesi"],
  "zemin-temel-etudu-rapor-kategorileri": ["Kategori 1", "Kategori 2", "Kategori 3", "16.4.3", "en az 2 adet sismik ölçü", "VS30 > 360 m/s", "16.2.2.1", "16.2.2.2", "300 m²", "1.5 katı", "%10", "Mühendislik kontrol listesi"],
  "zemin-raporu-verilerinin-yapi-modeline-aktarimi": ["16.2.2.1", "16.2.2.2", "Veri Raporu", "Geoteknik Rapor", "ZA–ZF", "SDS = SS × FS", "SD1 = S1 × F1", "ZF", "16.5", "16.7.3.1", "4.10.3", "Mühendislik kontrol listesi"],
  "temel-tasima-gucu-oturma-kontrolu": ["16.7.1.1", "Et ≤ Rt", "16.8.1.1", "16.8.3.1", "qo ≤ qt", "1.4", "1.1", "oturma", "yerdeğiştirme", "Mühendislik kontrol listesi"],
  "temel-kayma-devrilme-guvenligi": ["16.7.3.2", "16.7.3.3", "%30", "16.8.4.1", "Vth ≤ Rth + 0.3 Rpt", "1.1", "1.4", "temel taban basıncı", "Mühendislik kontrol listesi"],
  "bodrum-perdesi-statik-dinamik-zemin-basinci": ["16.11", "Tablo 16.6", "0.2", "0.3", "16.11.2", "Δp = 0.4 SDS γ Hb", "düzgün yayılı", "statik su basıncı", "16.11.3", "16.12", "Mühendislik kontrol listesi"],
  "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi": ["300 m²", "en az 3 sondaj", "1–7 m", "en az 2 sondaj", "1.5", "Δσ = 0.10 σ'vo", "3.00 m", "5.00 m", "16A.2.6", "Mühendislik kontrol listesi"],
  "tbdy-bolum-16-zemin-yapi-etkilesimi": ["16C.1.1", "16C.1.2", "güvenli tarafta", "16C.1.3", "kinematik etkileşim", "eylemsizlik etkileşimi", "16.5.1.4", "serbest zemin", "Mühendislik kontrol listesi"],
  "zemin-sivlasma-riski-degerlendirmesi": ["16.6.1", "DTS=1", "20 m", "PI < %12", "16.6.3", "N1,60 < 30", "DTS=4", "EK 16B", "Rτ / τdeprem ≥ 1.10", "16.5.2.6", "Mühendislik kontrol listesi"],
  "su-yalitimi-ts-4749-uygulama-detaylari": ["TS 4749", "Madde 6", "k ≥ 10^-4 m/s", "k < 10^-4 m/s", "51,50 m", "10.000 m²", "3 m", "Madde 13", "TS 13671", "TS 13766", "Mühendislik kontrol listesi"],
  "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi": ["TS EN 12056-3", "TS EN 16941-1", "7 m³", "2.000 m²", "1.000 m²", "YR,a = A × ha × e × η", "%6", "sızdırma", "Mühendislik kontrol listesi"],
  "yapi-denetimi-statik-proje-kontrolu": ["4708", "Madde 5", "Madde 6", "Ek-3", "Form-1", "zemin etüdü", "mimari proje", "hesap", "uygulama paftaları", "Mühendislik kontrol listesi"],
  "yapi-denetimi-betonarme-uygulama-cizimleri": ["ruhsat eki", "aks", "kot", "çap", "adet", "aralık", "bindirme", "sarılma", "revizyon", "Mühendislik kontrol listesi"],
  "yapi-denetimi-dokum-oncesi-kalip-donati": ["kalıp ve donatı imalatını teslim alma", "betona nezaret", "aks", "kot", "pas payı", "bindirme", "ankraj", "gömülü", "vibratör", "Mühendislik kontrol listesi"],
  "yapi-denetimi-beton-tanimlama-en206-ts13515": ["TS EN 206+A2", "TS 13515", "basınç dayanım sınıfı", "çevresel etki sınıfı", "kıvam sınıfı", "Dmax", "klorür içeriği sınıfı", "Mühendislik kontrol listesi"],
  "yapi-denetimi-ebis-beton-numunesi-kabul": ["EBİS", "beton etiketi", "karekodlu beton irsaliyesi", "2022/07 Genelgesi", "8 adet numune", "2 adedi 7. günde", "6 adedi 28. günde", "C55/67", "Mühendislik kontrol listesi"],
  "yapi-denetimi-dusuk-beton-dayanimi-karot": ["2021/7 Genelgesi", "TS EN 13791", "TS EN 12504-1", "döküm bölgesini", "EBİS + irsaliye + numune + laboratuvar", "Mühendislik kontrol listesi"],
  "yapi-denetimi-ts708-donati-celigi-kabul": ["TS 708", "lot", "çap", "kütle tayini", "TS EN ISO 6892-1", "TS EN ISO 15630-1", "Mühendislik kontrol listesi"],
  "yapi-denetimi-en13670-yerlestirme-kur-tolerans": ["TS EN 13670", "uygulama şartnamesi", "yerleştirme", "sıkıştırma", "kür", "aks", "kot", "tolerans", "uygunsuzluk", "Mühendislik kontrol listesi"],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

assert(DEPREM_PHASE4_ARTICLES.length === 31, `FAZ 4 override sayısı 31 olmalı; bulunan ${DEPREM_PHASE4_ARTICLES.length}.`);
assert(DEPREM_PHASE4_SLUGS.size === 31, "FAZ 4 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
assert(new Set([...DEPREM_PHASE4_SLUGS, ...PHASE2_C1_CARRY_FORWARD.map((item) => item.slug)]).size === 32, "FAZ 4 tamamlanan kapsam 32 benzersiz makale olmalı.");
for (const slug of PHASE4_SLUGS) assert(DEPREM_PHASE4_SLUGS.has(slug), `FAZ 4 slug eksik: ${slug}`);
for (const item of PHASE2_C1_CARRY_FORWARD) {
  assert(DEPREM_PILOT_SLUGS.has(item.slug), `FAZ 2 C1 carry-forward pilot bulunamadı: ${item.slug}`);
  assert(!DEPREM_PHASE4_SLUGS.has(item.slug), `C1 pilot gereksiz yere FAZ 4 source-of-truth'a kopyalanmış: ${item.slug}`);
  assert(!DEPREM_ROLLOUT_SLUGS.has(item.slug), `C1 pilotun özgün görsel sistemi rollout tarafından eziliyor: ${item.slug}`);
}

const allArticles = getArticleList();
const targetCounts = {
  "mevcut-guclendirme": allArticles.filter((article) => article.seriesId === "mevcut-guclendirme").length,
  "su-zemin": allArticles.filter((article) => article.seriesId === "su-zemin").length,
  "yapi-denetimi": allArticles.filter((article) => article.seriesId === "yapi-denetimi").length,
};
assert(targetCounts["mevcut-guclendirme"] === 13, `Mevcut bina/güçlendirme hedefi 13 olmalı; bulunan ${targetCounts["mevcut-guclendirme"]}.`);
assert(targetCounts["su-zemin"] === 11, `Zemin/temel/su hedefi 11 olmalı; bulunan ${targetCounts["su-zemin"]}.`);
assert(targetCounts["yapi-denetimi"] === 8, `Yapı denetimi/malzeme hedefi 8 olmalı; bulunan ${targetCounts["yapi-denetimi"]}.`);

for (const slug of PHASE4_SLUGS) {
  const configured = DEPREM_PHASE4_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 4 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 4 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 4 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug), `FAZ 4 FAZ 3 source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `FAZ 4 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 2, `FAZ 4 doğrulanabilir referans sayısı yetersiz: ${slug}`);

  if (!NON_TBDY_SOURCE_SLUGS.has(slug)) {
    assert(configured.references.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `AFAD TBDY PDF referansı eksik: ${slug}`);
    assert(configured.references.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY resmî sayfa referansı eksik: ${slug}`);
  }

  if (slug === "mevcut-bina-riskli-yapi-ve-bolum-15-farki") {
    assert(configured.references.some((ref) => ref.href?.includes("kdb.gov.tr")), "Riskli yapı makalesinde Kentsel Dönüşüm Başkanlığı resmî kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("yonetmel-k---7.5.16849")), "Riskli yapı makalesinde 6306 Uygulama Yönetmeliği resmî PDF kaynağı eksik.");
  }
  if (slug === "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi") {
    assert(configured.references.some((ref) => ref.href?.includes("Hasar_Tespit_Genelgesi_ve_Ekleri.pdf")), "Hasar tespit makalesinde AFAD 7663 Genelge PDF kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("afet-hasarlari-tespiti-dairesi-mevzuati")), "Hasar tespit makalesinde ÇŞİDB güncel afet hasar mevzuatı sayfası eksik.");
  }
  if (slug === "zemin-temel-etudu-rapor-kategorileri" || slug === "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi") {
    assert(configured.references.some((ref) => ref.href?.includes("zemin-ve-temel-etudu-uygulama-esaslari")), `Zemin etüdü makalesinde ÇŞİDB Tebliğ kaynağı eksik: ${slug}`);
    assert(configured.references.some((ref) => ref.href?.includes("20210217-4.htm")), `Zemin etüdü makalesinde 2021 Resmî Gazete değişikliği eksik: ${slug}`);
  }
  if (slug === "su-yalitimi-ts-4749-uygulama-detaylari") {
    assert(configured.references.some((ref) => ref.href?.includes("mevzuat-ve-tebligler")), "Su yalıtımı makalesinde Bakanlık mevzuat erişim sayfası eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("su-yalitim-isler")), "Su yalıtımı makalesinde Bakanlık Genel Teknik Şartnamesi eksik.");
  }
  if (slug === "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi") {
    assert(configured.references.some((ref) => ref.href?.includes("planli-alanlar-imar-yonetmeligi-guncellendi")), "Yağmur suyu makalesinde 2025 Planlı Alanlar resmî kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("yagmur-gri-su-klavuz")), "Yağmur suyu makalesinde Bakanlık 2025 uygulama kılavuzu eksik.");
  }
  if (YAPI_DENETIM_SLUGS.has(slug)) {
    assert(configured.references.some((ref) => ref.href?.includes("yapi-denetimi-daire-baskanligi-mevzuati")), `Yapı denetimi makalesinde Bakanlık mevzuat merkezi eksik: ${slug}`);
  }
  if (BATCH_9_SOURCE_SLUGS.has(slug)) {
    assert(configured.references.some((ref) => ref.href?.includes("yapi-denetim-uygulama-yonetmeligi")), `Yapı denetimi Batch 9 makalesinde Uygulama Yönetmeliği kaynağı eksik: ${slug}`);
  }
  if (slug === "yapi-denetimi-statik-proje-kontrolu" || slug === "yapi-denetimi-betonarme-uygulama-cizimleri") {
    assert(configured.references.some((ref) => ref.href?.includes("20181101-7.htm")), `Proje/uygulama çizimi makalesinde Planlı Alanlar resmî kaynağı eksik: ${slug}`);
  }
  if (slug === "yapi-denetimi-dokum-oncesi-kalip-donati") {
    assert(configured.references.some((ref) => ref.href?.includes("yapi-denetim-uygulama-yonetmeliginde-degisiklik")), "Döküm öncesi makalesinde güncel Bakanlık değişiklik duyurusu eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("c18---betonarme-isler")), "Döküm öncesi makalesinde Betonarme İşleri Genel Teknik Şartnamesi eksik.");
  }
  if (slug === "yapi-denetimi-beton-tanimlama-en206-ts13515") {
    assert(configured.references.some((ref) => ref.href?.includes("HAZIR%20BETON.pdf")), "Beton tanımlama makalesinde Bakanlık Hazır Beton teknik kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("laboratuvar-uygulamalarina-iliskin-yeni-duzenlemeleri")), "Beton tanımlama makalesinde Bakanlık laboratuvar Genelgesi kaynağı eksik.");
  }
  if (slug === "yapi-denetimi-ebis-beton-numunesi-kabul") {
    assert(configured.references.some((ref) => ref.href?.includes("4708-sayili-yapi-denet-m")), "EBİS makalesinde taze beton numune Tebliği resmî kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("2022-07-nolu-genelge")), "EBİS makalesinde 2022/07 Genelge kaynağı eksik.");
  }
  if (slug === "yapi-denetimi-dusuk-beton-dayanimi-karot") {
    assert(configured.references.some((ref) => ref.href?.includes("karot-sayilarina-iliskin-yeni-duzenlemeler")), "Karot makalesinde 2021/7 Bakanlık kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("karot-degerlendirmesi")), "Karot makalesinde Bakanlık karot değerlendirme kaynağı eksik.");
  }
  if (slug === "yapi-denetimi-ts708-donati-celigi-kabul") {
    assert(configured.references.some((ref) => ref.href?.includes("laboratuvar-hizmetleri")), "TS 708 makalesinde Bakanlık laboratuvar hizmetleri kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("c18---betonarme-isler")), "TS 708 makalesinde Betonarme İşleri Genel Teknik Şartnamesi eksik.");
  }
  if (slug === "yapi-denetimi-en13670-yerlestirme-kur-tolerans") {
    assert(configured.references.some((ref) => ref.href?.includes("c18---betonarme-isler")), "TS EN 13670 makalesinde Betonarme İşleri Genel Teknik Şartnamesi eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), "TS EN 13670 makalesinde AFAD resmî erişim kaynağı eksik.");
  }

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!configuredText.includes("Kapsam ve karar\n"), `C3 jenerik bölüm başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Proje kontrol sırası\n"), `C3 jenerik kontrol başlığı kaldı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 4 gövdesinde kaldı: ${slug}`);
  for (const token of requiredTokens[slug]) assert(configuredText.includes(token), `FAZ 4 teknik işareti eksik (${token}): ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 4 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;

  const expectedSeries = YAPI_DENETIM_SLUGS.has(slug)
    ? "yapi-denetimi"
    : SU_ZEMIN_SLUGS.has(slug)
      ? "su-zemin"
      : "mevcut-guclendirme";
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === expectedSeries, `FAZ 4 seriesId ${expectedSeries} olmalı: ${slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${slug}`);
  assert(article.authorTitle === "", `Canonical authorTitle boş olmalı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı FAZ 4 gövdesiyle uyuşmuyor: ${slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm FAZ 4 gövdesinden gelmiyor: ${slug}`);

  const cover = getDepremRolloutVisualPath(slug, "cover");
  const diagram = getDepremRolloutVisualPath(slug, "diagram");
  assert(article.image === cover, `Mevcut rollout cover korunmadı: ${slug}`);
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  assert(Boolean(figure), `Mevcut rollout body figure korunmadı: ${slug}`);
  if (figure?.type === "image") {
    assert(Boolean(figure.alt.trim()), `Body figure alt eksik: ${slug}`);
    assert(Boolean(figure.caption.trim()), `Body figure caption eksik: ${slug}`);
    assert(Boolean(figure.sourceNote.trim()), `Body figure source note eksik: ${slug}`);
    assert(figure.lightbox, `Body figure lightbox kontratı bozuldu: ${slug}`);
  }
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 4 C3 gövdelerinde gereksiz FormulaBlock bulundu: ${slug}`);
}

for (const item of PHASE2_C1_CARRY_FORWARD) {
  const article = getArticleBySlug(item.slug);
  assert(Boolean(article), `C1 carry-forward runtime makalesi bulunamadı: ${item.slug}`);
  if (!article) continue;
  assert(article.seriesId === item.seriesId, `C1 carry-forward seriesId yanlış: ${item.slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `C1 carry-forward canonical yazar uygulanmadı: ${item.slug}`);
  assert(article.authorTitle === "", `C1 carry-forward authorTitle boş olmalı: ${item.slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `C1 carry-forward HG monogram uygulanmadı: ${item.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `C1 carry-forward updatedAt farklı: ${item.slug}`);
  assert(article.sections.length >= 4, `C1 pilot teknik gövdesi yetersiz: ${item.slug}`);
  assert((article.references?.length ?? 0) >= 2, `C1 pilot referansları yetersiz: ${item.slug}`);
  const text = article.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  for (const token of ["K_i = k_s A_i", "tributary", "compression-only"]) assert(text.includes(token), `C1 radye teknik işareti eksik (${token}): ${item.slug}`);
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const pilotFigure = blocks.find((block) => block.type === "image" && block.src === "/images/deprem-pilots/radye-temel-zemin-yayi-yatak-katsayisi-diagram.svg");
  assert(Boolean(pilotFigure), `C1 radye pilot body figure korunmadı: ${item.slug}`);
  assert(blocks.some((block) => block.type === "formula"), `C1 radye yararlı formül bloğu korunmadı: ${item.slug}`);
}

if (errors.length > 0) {
  console.error("Deprem FAZ 4 Batch 1-11 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 4",
  completedBatches: 11,
  phase4Overrides: DEPREM_PHASE4_ARTICLES.length,
  phase2C1CarryForward: PHASE2_C1_CARRY_FORWARD.map((item) => item.slug),
  completedArticles: 32,
  targetArticles: 32,
  remaining: 0,
  batch11Slugs: BATCH_11_SLUGS,
  batch11Classification: Object.fromEntries(BATCH_11_SLUGS.map((slug) => [slug, "C3"])),
  sourceOfTruth: "src/lib/deprem-phase4-articles.ts + preserved FAZ 2 C1 radye pilot",
  officialSourceProfile: "AFAD TBDY 2018 + ÇŞİDB geoteknik/su kaynakları + ÇŞİDB Yapı Denetimi mevzuatı + beton/EBİS/karot + TS 708/TS EN 13670 resmî teknik kaynakları",
  visualContract: "existing unique rollout cover + body figure preserved; radye pilot visuals preserved",
  seriesCoverage: { "mevcut-guclendirme": 13, "su-zemin": 11, "yapi-denetimi": 8 },
  targetCoverage: { "mevcut-guclendirme": 13, "su-zemin": 11, "yapi-denetimi": 8, total: 32 },
  ts500Touched: false,
}, null, 2));
