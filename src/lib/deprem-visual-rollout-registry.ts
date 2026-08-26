import {
  DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT,
  DEPREM_TECHNICAL_VISUAL_ROLLOUT,
  DEPREM_TECHNICAL_VISUAL_STYLE,
  DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT,
  type DepremTechnicalVisualRolloutItem,
} from "./deprem-visual-rollout";

const PACKAGE_7_ROLLOUT: readonly DepremTechnicalVisualRolloutItem[] = [
  {
    slug: "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Kapakta tek bina üzerinde eşdeğer yatay yük dağılımı gösterilir",
      "Detay DTS, BYS ve düzensizlik girdilerini yöntem uygunluğuna bağlar",
      "Doğrulanmamış sayısal uygulama sınırları görsele yazılmaz",
    ],
  },
  {
    slug: "tbdy-yeterli-mod-modal-kutle-katilimi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Kapakta tek taşıyıcı sistem üzerinde farklı mod şekilleri üst üste gösterilir",
      "Detay X ve Y doğrultularındaki birikimli modal katılımı ayrı izler",
      "Doğrulanmamış minimum modal katılım yüzdesi kullanılmaz",
    ],
  },
  {
    slug: "tbdy-modal-taban-kesme-olceklendirme",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Kapak modal taban kesmesini referans düzey ve ölçeklenmiş sonuçla ilişkilendirir",
      "Detay ölçek katsayısının ilgili tepki sonuçlarına tutarlı uygulanmasını gösterir",
      "Doğrulanmamış sayısal alt sınır veya ölçek katsayısı kullanılmaz",
    ],
  },
  {
    slug: "tbdy-yuzde-100-yuzde-30-birlesimi",
    series: "tbdy",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Kapakta tek eleman üzerinde birbirine dik yüzde 100 ve yüzde 30 deprem etkileri gösterilir",
      "Detay her iki işaret ve doğrultunun birleşik etkisini tek merkezde toplar",
      "Aynı eleman gereksiz yere ikinci kez çizilmez",
    ],
  },
] as const;

export const DEPREM_TECHNICAL_VISUAL_REGISTRY: readonly DepremTechnicalVisualRolloutItem[] = [
  ...DEPREM_TECHNICAL_VISUAL_ROLLOUT,
  ...PACKAGE_7_ROLLOUT,
] as const;

export const DEPREM_TECHNICAL_VISUAL_REGISTRY_SLUGS = new Set(
  DEPREM_TECHNICAL_VISUAL_REGISTRY.filter((item) => item.status === "complete").map((item) => item.slug),
);

export {
  DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT,
  DEPREM_TECHNICAL_VISUAL_STYLE,
  DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT,
};
