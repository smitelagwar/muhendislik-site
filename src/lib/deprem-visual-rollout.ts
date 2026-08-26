export const DEPREM_TECHNICAL_VISUAL_STYLE = {
  navy: "#123B63",
  cyan: "#12A9C6",
  paper: "#F8FBFC",
  white: "#FFFFFF",
  neutral: "#DCE6EB",
} as const;

export type DepremTechnicalVisualStatus = "complete" | "pending";

export interface DepremTechnicalVisualRolloutItem {
  slug: string;
  series: string;
  status: DepremTechnicalVisualStatus;
  assets: readonly ["cover.svg", "diagram.svg"];
  designNotes: readonly string[];
}

/**
 * Source of truth for topics already migrated to the approved navy/cyan
 * technical-drawing visual system. A topic enters this list only when both
 * cover.svg and diagram.svg are genuinely different, technically reviewed
 * compositions.
 */
export const DEPREM_TECHNICAL_VISUAL_ROLLOUT: readonly DepremTechnicalVisualRolloutItem[] = [
  {
    slug: "bodrum-perdesi-statik-dinamik-zemin-basinci",
    series: "su-zemin",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Tek bodrum perdesi ve tek zemin kesiti", "Statik basınç ile dinamik ek etki aynı teknik sahnede ayrıştırılır", "Gereksiz dekorasyon ve yinelenen yapı kullanılmaz"],
  },
  {
    slug: "temel-kayma-devrilme-guvenligi",
    series: "su-zemin",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Tek temel-kolon kesiti üzerinde yük ve dirençler", "İkinci görsel taban basıncı, bileşke ve eksantrisiteyi açıklar", "Aynı temel bir görsel içinde ikinci kez çizilmez"],
  },
  {
    slug: "tbdy-goreli-kat-otelenmesi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek taşıyıcı çerçeve; ghost bina yok", "Detay görseli yapıyı tekrar etmez, deplasman profilini gösterir", "Göreli ötelenme Δi ile sade biçimde işaretlenir"],
  },
  {
    slug: "tbdy-dismerkezlik-kurali",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Tek döşeme planı", "Kütle ve rijitlik merkezi aynı planda ayrıştırılır", "İkinci görsel ±e yükleme konumlarını aynı plan üzerinde gösterir"],
  },
  {
    slug: "tbdy-p-delta-ikinci-mertebe",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Tek ötelenmiş çerçeve", "İkinci görsel tek eleman ve referans ekseniyle P·Δ etkisini açıklar", "İkinci bina veya ikinci çerçeve çizilmez"],
  },
  {
    slug: "tbdy-2018-sismik-izolasyon",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek izole bina kesiti", "İkinci görsel bina tekrarı yerine tek izolatör yakın detayıdır", "Lacivert-cyan çift renk sistemi korunur"],
  },
  {
    slug: "tbdy-tasarim-spektrumu-cizimi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek tasarım spektrumu", "Detayda aynı kavram periyot bölgelerine ayrılarak açıklanır", "Grafik dışında dekoratif mühendislik sembolü kullanılmaz"],
  },
  {
    slug: "tbdy-mod-birlesim-srss-cqc",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Bina kopyaları yerine modal tepki eğrileri kullanılır", "Detayda frekans yakınlığı ve modal korelasyon mantığı anlatılır", "SRSS/CQC yalnız kısa teknik etiket olarak kullanılır"],
  },
  {
    slug: "tbdy-rijit-yari-rijit-diyafram",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Karşılaştırma için iki model temsili teknik olarak gereklidir", "Detay görselinde yalnız tek düzensiz döşeme planı bulunur", "Büyük boşluk ve yerel deformasyon sade biçimde gösterilir"],
  },
  {
    slug: "tbdy-deprem-derzi-hesabi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["İki farklı komşu bina derz konusu gereği birlikte gösterilir", "Binalar aynı yapının kopyası değildir", "Detay görseli plan görünüşünde net derz bölgesini açıklar"],
  },
  {
    slug: "tbdy-bodrum-katli-binalar",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek ortak üst yapı-bodrum kesiti", "Çevre perdeleri ve geçiş döşemesi fiziksel yük yolu olarak gösterilir", "Detay görseli bina tekrarı yerine geçiş döşemesi planında kuvvet aktarımını açıklar"],
  },
  {
    slug: "tbdy-cati-agirligi-yuk-azaltma",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek yapı ve çatı kütle bileşenleri", "%30 yalnız kar yükü katkısı olarak etiketlenir", "Detay görseli bina tekrarı yerine G, nQ ve 0.30S bileşenlerini ayrıştırır"],
  },
  {
    slug: "tbdy-dusey-deprem-etkisi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek düşey titreşime duyarlı uzun açıklıklı eleman", "Yerel düşey mod ve Ed(Z) aynı eleman üzerinde okunur", "Detay tek serbest cisim ve moment/reaksiyon zarfıdır"],
  },
  {
    slug: "tbdy-r-d-dayanim-fazlaligi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Bina ikonları yerine Ra(T) mühendislik grafiği kullanılır", "D ile R/I aynı katsayı gibi gösterilmez", "Detay kuvvet-deplasman grafiğinde azaltma ve dayanım fazlalığı rollerini ayrıştırır"],
  },
  {
    slug: "kisa-kolon-etkisi-tbdy-2018",
    series: "tbdy-betonarme",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek çerçeve açıklığında kısmi dolgu ve kısalan kolon serbest boyu", "Kesme talebi kısa serbest bölgede oklarla yoğunlaştırılır", "Detay tek kısa kolon serbest cisim ve diyagonal çatlak şemasıdır"],
  },
  {
    slug: "tbdy-2018-guclu-kolon-kontrolu",
    series: "tbdy-betonarme",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek kiriş-kolon düğümü ve uç momentleri", "Sayısal katsayı vermeden kolon-kiriş kapasite hiyerarşisi anlatılır", "Detay tek çerçevede kiriş uç mafsalları ve kolon sürekliliğini gösterir"],
  },
  {
    slug: "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
    series: "tbdy-betonarme",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta tek perde elevasyonu; gövde ve uç bölgeleri ayrıştırılır", "Yatay yük altında eğilme ve kesme davranışı birlikte gösterilir", "Detay ikinci elevasyon yerine tek perde enkesiti ve donatı yerleşimidir"],
  },
  {
    slug: "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek",
    series: "tbdy-betonarme",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: ["Kapakta üç farklı sistem tipinin teknik karşılaştırması için farklı şemalar yan yanadır", "Şemalar aynı yapının kopyası değildir", "Detay tek birleşik sistem planında çekirdek ile çevre çerçevesinin yatay yük paylaşımını gösterir"],
  },
] as const;

export const DEPREM_TECHNICAL_VISUAL_SLUGS = new Set(
  DEPREM_TECHNICAL_VISUAL_ROLLOUT.filter((item) => item.status === "complete").map((item) => item.slug),
);

export const DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT = 164;
export const DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT = 328;
