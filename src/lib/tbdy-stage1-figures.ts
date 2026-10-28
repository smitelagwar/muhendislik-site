import type { ArticleData } from "./articles-data";

/** Seçilmiş teknik rehberlere yeni, açıklayıcı ve ölçeksiz şemalar ekler. Mevcut gövdeyi değiştirmez. */
const FIGURES: Record<string, { src: string; alt: string; caption: string; note: string }> = {
  "tbdy-tasarim-spektrumu-cizimi": {
    src: "/tbdy-guide/spektrum-akisi.svg",
    alt: "DD düzeyi, Ss S1 harita değerleri, Fs F1, SDS SD1 ve köşe periyotları veri akışı",
    caption: "TBDY Bölüm 2'de yatay elastik spektruma giden veri zinciri; şematik, ölçeksiz gösterim.",
    note: "ZF zemin sınıfında standart katsayı akışının yerine sahaya özel inceleme gerekir.",
  },
  "tbdy-bks-dts-bys-belirleme": {
    src: "/tbdy-guide/siniflandirma-akisi.svg",
    alt: "Bina kullanım sınıfı, tasarım spektral ivmesi, deprem tasarım sınıfı ve bina yükseklik sınıfı karar akışı",
    caption: "BKS, DTS ve BYS kararlarının sırası. R ve D seçimi taşıyıcı sistem koşullarıyla birlikte yapılır.",
    note: "Yalnız tek bir parametrenin bilinmesi sınıflandırma için yeterli değildir.",
  },
  "tbdy-2018-duzensizlikler-rehberi": {
    src: "/tbdy-guide/a1-b2-duzensizlik.svg",
    alt: "A1 burulma düzensizliği plan şeması ve B2 yumuşak kat düzensizliği düşey görünüş karşılaştırması",
    caption: "A1 burulma ve B2 yumuşak kat düzensizliklerinin farklı fiziksel davranışları; ölçeksiz şema.",
    note: "Tanı ve sonuç koşulları ayrı ayrı Tablo 3.6 ve ilgili analiz hükümlerinden kontrol edilmelidir.",
  },
  "tbdy-2018-betonarme-analiz": {
    src: "/tbdy-guide/modelleme-akisi.svg",
    alt: "TBDY 2018 Bölüm 4 modelleme sırası: geometri, diyafram, etkin kesit rijitliği, kat kütleleri, ek dışmerkezlik",
    caption: "Analiz modelinde birbirini etkileyen kabullerin önerilen denetim sırası; şematik gösterim.",
    note: "Şema yönetmeliğe yeni bir zorunlu işlem sırası eklemez.",
  },
};

export function applyTBDYStage1Figures(article: ArticleData): ArticleData {
  const figure = FIGURES[article.slug];
  if (!figure || article.sections.length === 0) return article;
  const addition = [
    "### Hesap modelini görsel olarak kontrol et",
    "",
    "!" + "[" + figure.alt + "](" + figure.src + ")",
    "*" + figure.caption + "*",
    "{note: " + figure.note + " | source: TBDY 2018 yorumlayıcı şema | lightbox: true}",
  ].join("\n");
  return {
    ...article,
    updatedAt: "27 Ekim 2026",
    sections: article.sections.map((section, index) =>
      index === 0 && !section.content.includes(figure.src)
        ? { ...section, content: section.content + "\n\n" + addition }
        : section,
    ),
  };
}
