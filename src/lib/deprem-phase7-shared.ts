import type { ArticleData } from "./articles-data";

export const PHASE7_UPDATED_AT = "26 Ağustos 2026";

export const BEP_REGULATION = "https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=13594&mevzuatTertip=5&mevzuatTur=KurumVeKurulusYonetmeligi";
export const TS825_2025_RG = "https://www.resmigazete.gov.tr/eskiler/2025/02/20250220-2.htm";
export const BEP_METHOD_2025_RG = "https://www.resmigazete.gov.tr/eskiler/2025/04/20250425-2.htm";
export const TS825_2025_NEWS = "https://meslekihizmetler.csb.gov.tr/haberler/isi-yalitim-standardi-tebligi-guncellendi-290597";
export const BEPTR_2025_START_NEWS = "https://meslekihizmetler.csb.gov.tr/haberler/binalarda-enerji-verimliliginde-yeni-donem-basladi-295270";
export const BEP_2026_NEWS = "https://meslekihizmetler.csb.gov.tr/haberler/binalarda-yeni-donem-305209";

export const ACOUSTIC_REGULATION = "https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=23616&mevzuatTertip=5&mevzuatTur=KurumVeKurulusYonetmeligi";
export const ACOUSTIC_BASE_RG = "https://www.resmigazete.gov.tr/eskiler/2017/05/20170531-7.htm";

export const EUROCODES_HOME = "https://eurocodes.jrc.ec.europa.eu/";
export const EN1990_JRC = "https://eurocodes.jrc.ec.europa.eu/EN-Eurocodes/eurocode-basis-structural-design";
export const EN1991_JRC = "https://eurocodes.jrc.ec.europa.eu/EN-Eurocodes/eurocode-1-actions-structures";
export const EN1992_JRC = "https://eurocodes.jrc.ec.europa.eu/EN-Eurocodes/eurocode-2-design-concrete-structures";
export const EU_EUROCODES = "https://single-market-economy.ec.europa.eu/single-market/european-standards/eurocodes_en";

export function phase7Lines(...parts: string[]) { return parts.join("\n"); }

export interface DepremPhase7Override {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  readTime: string;
  sections: ArticleData["sections"];
  relatedSlugs?: string[];
  references: NonNullable<ArticleData["references"]>;
  keywords: string[];
  tags: string[];
}

export function bepPhase7References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    { label: `Mevzuat Bilgi Sistemi — Binalarda Enerji Performansı Yönetmeliği, ${scope}`, href: BEP_REGULATION, note: "Yürürlükteki konsolide yönetmelik metni; proje tarihindeki geçiş ve değişiklik hükümleri ayrıca kontrol edilmelidir." },
    { label: "Resmî Gazete — 20 Şubat 2025 / 32819, TS 825 Binalarda Isı Yalıtım Kuralları Standardı ile ilgili Tebliğ", href: TS825_2025_RG, note: "TS 825'in 3 Aralık 2024 tarihli revizyonunun 1 Nisan 2025 itibarıyla zorunlu uygulamasına ilişkin resmî tebliğdir." },
    { label: "Resmî Gazete — 25 Nisan 2025 / 32881, Binalarda Enerji Performansı Ulusal Hesaplama Yöntemi değişikliği", href: BEP_METHOD_2025_RG, note: "BEP-TR hesaplama yönteminin ve referans bina yaklaşımının güncellenmesine ilişkin resmî tebliğdir." },
    { label: "ÇŞİDB — Isı Yalıtım Standardı Tebliği Güncellendi", href: TS825_2025_NEWS, note: "Bakanlık açıklaması, iklim bölgesi sayısının 4'ten 6'ya çıkarıldığını ve yeni TS 825'in 1 Nisan 2025 uygulamasını açıklar." },
    { label: "ÇŞİDB — Binalarda Enerji Verimliliğinde Yeni Dönem Başladı", href: BEPTR_2025_START_NEWS, note: "30 Haziran 2025 sonrası ruhsat alacak binalarda güncellenen BEP-TR metodolojisinin uygulanmasını açıklar." },
    { label: "ÇŞİDB — Binalarda Yeni Dönem, 16 Mayıs 2026", href: BEP_2026_NEWS, note: "1 Ocak 2027 sonrası 10.000 m² ve üzeri yeni binalardaki Yaşam Döngüsü Analizi Belgesi ile Düşük Karbonlu Bina Belgesi düzenlemesini açıklar." },
  ];
}

export function acousticPhase7References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    { label: `Mevzuat Bilgi Sistemi — Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik, ${scope}`, href: ACOUSTIC_REGULATION, note: "Konsolide metin; Madde 16 ses yalıtımı tasarımında TS EN 12354 serisiyle bina içi yayılımın modellenmesine açıkça atıf yapar." },
    { label: "Resmî Gazete — 31 Mayıs 2017 / 30082, Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik", href: ACOUSTIC_BASE_RG, note: "Yönetmeliğin temel yayımlanmış metnidir; sonraki değişikliklerle birlikte okunmalıdır." },
  ];
}

export function eurocodePhase7References(scope: string, family: "EN1990" | "EN1991" | "EN1992"): NonNullable<ArticleData["references"]> {
  const familyRef = family === "EN1990"
    ? { label: `European Commission JRC — EN 1990, ${scope}`, href: EN1990_JRC, note: "Yapısal güvenlik, kullanılabilirlik ve dayanıklılık için temel tasarım ilkelerini açıklar." }
    : family === "EN1991"
      ? { label: `European Commission JRC — EN 1991, ${scope}`, href: EN1991_JRC, note: "Yapılar üzerindeki etkiler ailesinin kapsamını ve alt bölümlerini açıklar." }
      : { label: `European Commission JRC — EN 1992, ${scope}`, href: EN1992_JRC, note: "Beton yapıların dayanım, kullanılabilirlik, dayanıklılık ve yangın tasarım çerçevesini açıklar." };
  return [
    familyRef,
    { label: "European Commission JRC — Eurocodes", href: EUROCODES_HOME, note: "Eurocode ailesinin resmî Avrupa Komisyonu/JRC bilgi merkezidir." },
    { label: "European Commission — Eurocodes and European standards", href: EU_EUROCODES, note: "Eurocode standardizasyon çerçevesi ve ulusal uygulama yaklaşımı için resmî Komisyon kaynağıdır." },
  ];
}
