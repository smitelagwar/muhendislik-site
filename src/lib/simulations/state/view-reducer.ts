import type {
  CameraPresetId,
  ColumnPresetId,
  DetailModel,
  DetailPart,
  LayerVisibilityMask,
  SimulationLayerId,
} from "../core/types";

export type QuickLayerFilterId = "all" | "only-stirrup" | "only-longitudinal";
export type WorkspaceLayoutMode = "split" | "3d" | "2d";

export interface SimulationSectionState {
  enabled: boolean;
  elevationZMm: number;
}

export interface SimulationLearningStepDefinition {
  index: number;
  id: string;
  title: string;
  badge: string;
  summary: string;
  whatToNotice: string;
  layers: LayerVisibilityMask;
  selectedPartId: string | null;
  cameraPreset: CameraPresetId;
  sectionEnabled?: boolean;
  sectionElevationZMm?: number;
  explodePercent?: number;
  layerProgressT: number;
}

export interface SimulationLearningState {
  mode: "free" | "guided";
  stepIndex: number;
  isPlaying: boolean;
  layerProgressT: number;
}

export interface SimulationViewState {
  presetId: ColumnPresetId;
  layers: LayerVisibilityMask;
  quickFilter: QuickLayerFilterId;
  selectedPartId: string | null;
  cameraPreset: CameraPresetId;
  viewTab: WorkspaceLayoutMode;
  section: SimulationSectionState;
  explodePercent: number;
  learning: SimulationLearningState;
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibilityMask = {
  concrete: true,
  longitudinal: true,
  stirrup: true,
  dowel: true,
  crosstie: true,
  dimensions: true,
};

export const DEFAULT_SECTION_ELEVATION_Z_MM = 1575;
export const DEFAULT_BEAM_SECTION_POSITION_X_MM = 1950;
export const DEFAULT_JOINT_SECTION_ELEVATION_Z_MM = 1500;
export const DEFAULT_FOOTING_SECTION_ELEVATION_Z_MM = 310;
export const DEFAULT_WALL_SECTION_ELEVATION_Z_MM = 1500;
export const DEFAULT_MAT_SECTION_ELEVATION_Z_MM = 340;

export function getColumnLearningSteps(
  presetId: ColumnPresetId,
): ReadonlyArray<SimulationLearningStepDefinition> {
  if (presetId === "r1-radye-temel") {
    return [
      {
        index: 0,
        id: "mat-step-1-concrete-and-lean",
        title: "1. Sınırlı Boyutlu Radye Temel Plağı (2200×2200×600 mm) ve Grobeton",
        badge: "Adım 1 / 5",
        summary:
          "Bu sahne tüm bina radyesini değil, bir kolon çevresindeki 2200×2200×600 mm sınırlı radye temel parçasını, temsilî grobeton tabakasını ve merkez kolon boynunu gösterir.",
        whatToNotice:
          "Radye plaklarında hem açıklık hem kolon altı eğilme etkileri nedeniyle tekil temelden farklı olarak hem altta hem üstte iki yönlü donatı ızgarası bulunur.",
        layers: {
          concrete: true,
          longitudinal: false,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "concrete-footing-body",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.2,
      },
      {
        index: 1,
        id: "mat-step-2-bottom-two-way-mesh",
        title: "2. Radye Alt İki Yönlü Donatı Izgarası (Z = 58 mm X ve Z = 74 mm Y)",
        badge: "Adım 2 / 5",
        summary:
          "c = 50 mm alt pas payı üzerinde 11Ø16 X doğrultusu (Z = 58 mm) ve 11Ø16 Y doğrultusu (Z = 74 mm) olmak üzere toplam 22 çubuktan oluşan alt iki yönlü ızgara yer alır.",
        whatToNotice:
          "Mavi renkli alt ızgaranın üst ızgara kapalıyken tek başına net biçimde incelenebildiğini görün.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "mat-bottom-x-6",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.4,
      },
      {
        index: 2,
        id: "mat-step-3-top-two-way-mesh",
        title: "3. Radye Üst İki Yönlü Donatı Izgarası (Z = 526 mm Y ve Z = 542 mm X)",
        badge: "Adım 3 / 5",
        summary:
          "Radye üst yüzünden c = 50 mm aşağıda 11Ø16 X (Z = 542 mm) ve 11Ø16 Y (Z = 526 mm) çubuklarından oluşan pembe renkli üst iki yönlü donatı ağı uzanır.",
        whatToNotice:
          "Katman panelinden Alt Izgara (Z=58/74 mm) ile Üst Izgarayı (Z=526/542 mm) ayrı ayrı açıp kapatarak iki ağ arasındaki 452 mm net kot farkını karşılaştırın.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "mat-top-x-6",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.65,
      },
      {
        index: 3,
        id: "mat-step-4-chairs-and-stirrups",
        title: "4. Üst Izgarayı Taşıyan 9Ø14 Sehpa Donatıları ve Filiz Etriyeleri",
        badge: "Adım 4 / 5",
        summary:
          "Alt ızgara üzerine (Z = 89 mm) basan 9 adet sarı Ø14 sehpa (chair) donatısı, üst ızgara Y çubuklarını Z = 511 mm kotunda alttan destekleyerek beton dökümü sırasında çökmesini önler.",
        whatToNotice:
          "Sehpaların alt yatay ayakları, düşey dikmeleri ve üst taşıyıcı tablasıyla alt ve üst ızgara arasında rijit mesafe tutucu oluşturduğunu inceleyin.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: true,
          dowel: false,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "mat-chair-5-x0-y0",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.85,
      },
      {
        index: 4,
        id: "mat-step-5-column-dowels-and-full-mat",
        title: "5. Merkez Kolon Filizi Grubu (8Ø20) ve Tam Radye Kafesi",
        badge: "Adım 5 / 5",
        summary:
          "Merkezdeki 450×450 mm kolon için 8Ø20 L-bükümlü kolon filizi alt ızgara üzerine (Z = 92 mm) oturur, üst ızgara içinden geçerek Z = 1350 mm kotuna yükselir.",
        whatToNotice:
          "2B paneldeki düşey kesit ve plan şemalarından alt ızgara, üst ızgara, sehpa ve kolon filizlerini ayrı ayrı seçerek inceleyin.",
        layers: {
          concrete: true,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "mat-dowel-bar-1-sw",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 1,
      },
    ];
  }
  if (presetId === "p1-perde") {
    return [
      {
        index: 0,
        id: "wall-step-1-concrete-and-regions",
        title: "1. Boşluksuz Perde Duvar Gövdesi ve Uç/Gövde Bölge Ayrımı",
        badge: "Adım 1 / 5",
        summary:
          "Bu P1 eğitim örneğinde 2400×300 mm kesitli perde; sol uç bölgesi (450 mm), orta gövde (1500 mm) ve sağ uç bölgesi (450 mm) olarak üç bölgeye ayrılır.",
        whatToNotice:
          "Bütün perdelerin bu ölçüyle yapılacağı izlenimi çıkarılmamalıdır; gerçek perde uzunluk, kalınlık ve uç bölgesi sınırları proje hesabına göre belirlenir.",
        layers: {
          concrete: true,
          longitudinal: false,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "concrete-column-body",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.2,
      },
      {
        index: 1,
        id: "wall-step-2-two-face-web-meshes",
        title: "2. Ön Yüz (Y=-102/-114 mm) ve Arka Yüz (Y=+102/+114 mm) İki Yüz Gövde Ağları",
        badge: "Adım 2 / 5",
        summary:
          "Perde gövdesinde tek sıra donatı bulunmaz: ön yüzde ve arka yüzde iki ayrı düşey + yatay Ø12 donatı ağı yer alır; yatay çubuklar uç bölgeleri U-kancayla dıştan sarar.",
        whatToNotice:
          "Üst veya izometrik bakışta ön yüz (mavi/gri) ile arka yüz donatı sıralarının perde kalınlığı boyunca iki ayrı düzlem oluşturduğunu inceleyin.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "wall-web-vert-1-front-x-500",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.4,
      },
      {
        index: 2,
        id: "wall-step-3-boundary-longitudinal-bars",
        title: "3. Sol ve Sağ Perde Uç Bölgesi Boyuna Donatıları (6Ø20 + 6Ø20)",
        badge: "Adım 3 / 5",
        summary:
          "Perdenin iki ucundaki 450×300 mm uç bölgelerinde ön ve arka yüzlerde 3'er adet olmak üzere toplam 6Ø20 + 6Ø20 boyuna taşıyıcı donatı yükselir.",
        whatToNotice:
          "Turuncu renkli Ø20 uç bölgesi çubuklarının tersinir deprem devrilme momentlerinden doğan çekme ve basınç kuvvetlerini taşıdığını görün.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "wall-boundary-bar-1-left-front-x1145",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.65,
      },
      {
        index: 3,
        id: "wall-step-4-boundary-confinement-stirrups",
        title: "4. Perde Uç Bölgesi Kapalı Sargı Etriyeleri (2×14 Adet Ø10)",
        badge: "Adım 4 / 5",
        summary:
          "Sol (turkuaz) ve sağ (yeşil) perde uç bölgelerindeki 6Ø20 boyuna çubuklar, Z = 100..2750 mm boyunca 14'er adet kapalı Ø10 uç etriyesiyle kuşatılır.",
        whatToNotice:
          "Kapalı uç etriyelerinin yalnız uç bölgeleri sardığını, orta gövdede ise yatay gövde çubuklarının sürekliliği sağladığını karşılaştırın.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "wall-boundary-stirrup-8-left-z1500",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.85,
      },
      {
        index: 4,
        id: "wall-step-5-crossties-and-full-wall",
        title: "5. Ön–Arka Yüz Bağlayıcı Çirozları ve Tam Perde Kafesi",
        badge: "Adım 5 / 5",
        summary:
          "Ön ve arka yüz donatı ağlarını kalınlık (Y) doğrultusunda birbirine bağlayan 20 adet pembe Ø10 çirozla iki yüzlü perde duvar kafesi tamamlanır.",
        whatToNotice:
          "2B paneldeki yatay enkesit şemasında ön yüz, arka yüz, sol/sağ uç bölgeleri ve bağlayıcı çirozları ayrı ayrı seçerek inceleyin.",
        layers: {
          concrete: true,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "wall-crosstie-10-x-250-z1500",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 1,
      },
    ];
  }
  if (presetId === "t1-tekil-temel") {
    return [
      {
        index: 0,
        id: "footing-step-1-concrete-and-lean",
        title: "1. Temsilî Grobeton, Paspayı Takozları ve Tekil Temel Plağı",
        badge: "Adım 1 / 5",
        summary:
          "1800×1800×500 mm tekil temel plağı, Z = -100..0 mm arasındaki temsilî grobeton tabakası üzerine oturur; 4 adet c = 50 mm paspayı takozu net alt örtüyü sağlar.",
        whatToNotice:
          "Grobeton ve zemin yalnız uygulama bağlam gösterimidir; yapısal eğilme donatısı c = 50 mm paspayı takozlarının üzerinde başlar.",
        layers: {
          concrete: true,
          longitudinal: false,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "concrete-footing-body",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.2,
      },
      {
        index: 1,
        id: "footing-step-2-bottom-mesh-x",
        title: "2. Alt X Doğrultusu Temel Izgara Katmanı (Z = 58 mm)",
        badge: "Adım 2 / 5",
        summary:
          "Paspayı takozlarının (c = 50 mm) hemen üzerine X doğrultusunda 9 adet Ø16/200 mm alt ızgara çubuğu (Z_x = 58 mm eksen kotunda) yerleştirilir.",
        whatToNotice:
          "Mavi renkli X çubuklarının her iki uçta temel yan paspayı içinde 90° yukarı kancalandığını inceleyin.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "footing-mesh-x-5",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.4,
      },
      {
        index: 2,
        id: "footing-step-3-bottom-mesh-y-elevation-diff",
        title: "3. Alt Y Doğrultusu Izgara Katmanı (Z = 74 mm) ve 16 mm Kot Farkı",
        badge: "Adım 3 / 5",
        summary:
          "Y doğrultusundaki 9 adet Ø16/200 mm çubuk, X çubuklarının içinden geçmez; bir çubuk çapı yukarıda Z_y = 74 mm eksen kotunda (ΔZ = 16 mm farkla) X katmanının üstüne oturur.",
        whatToNotice:
          "Ön bakışta mavi (Alt X, Z=58 mm) ile pembe (Alt Y, Z=74 mm) ızgara katmanları arasındaki gerçek düşey kot farkını görün.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "footing-mesh-y-5",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.65,
      },
      {
        index: 3,
        id: "footing-step-4-column-dowels-and-curved-feet",
        title: "4. Kolon Filizleri (8Ø20) ve 90° Yay Bükümlü Filiz Ayakları",
        badge: "Adım 4 / 5",
        summary:
          "400×400 mm kolonun 8Ø20 filizi alt ızgaranın üstüne (Z = 92 mm) oturur; r = 40 mm gerçek 90° büküm yayı ve 320 mm yatay ayaklarla temel içine kenetlenir.",
        whatToNotice:
          "Filiz bükümü düz çizgiyle sahte köşe yapılmaz; mandrel yay bükümüyle dönerek yatay ayaklarını ızgara üzerine yayar.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "footing-dowel-bar-1-sw",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.85,
      },
      {
        index: 4,
        id: "footing-step-5-stirrups-and-full-footing",
        title: "5. Temel İçi Kılavuz Etriyeleri, Kolon Boynu ve Tam Temel",
        badge: "Adım 5 / 5",
        summary:
          "Temel içindeki 3 adet yeşil kılavuz etriye ve kolon boyun bölgesindeki 6 adet turkuaz sarılma etriyesiyle (toplam 9×Ø10) tekil temel–kolon filizi sistemi tamamlanır.",
        whatToNotice:
          "2B paneldeki plan ve düşey kesit şemalarından alt ızgara, filiz ayağı ve etriyeleri seçerek 3B sahneyle aynı koordinatları doğrulayın.",
        layers: {
          concrete: true,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "footing-stirrup-2-z310",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 1,
      },
    ];
  }
  if (presetId === "d1-dis-birlesim") {
    return [
      {
        index: 0,
        id: "joint-step-1-concrete-members",
        title: "1. Dış Kolon (400×400) ve Saplanan Çerçeve Kirişi (300×500)",
        badge: "Adım 1 / 5",
        summary:
          "400×400 mm dış kolona yalnız +X yönünden 300×500 mm çerçeve kirişi saplanır; Z = 1250–1750 mm aralığı birleşim çekirdeğidir.",
        whatToNotice:
          "Kiriş genişliğinin (300 mm) kolon genişliğinden (400 mm) dar seçilmesi, kiriş boyuna donatılarının kolon boyuna donatılarının içinden çakışmadan geçmesini sağlar.",
        layers: {
          concrete: true,
          longitudinal: false,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "concrete-column-body",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.2,
      },
      {
        index: 1,
        id: "joint-step-2-column-longitudinal",
        title: "2. Düğüm Çekirdeğinden Sürekli Geçen Kolon Boyuna Donatıları",
        badge: "Adım 2 / 5",
        summary:
          "Dış kolondaki 8Ø20 düşey boyuna çubuklar (Z = 0–3600 mm) birleşim çekirdeği içinden kesintisiz yükselir ve üst kat filiz bölgesini oluşturur.",
        whatToNotice:
          "Kolon boyuna donatılarının Y = ±145 mm dış düzlemlerinde dizildiğini ve orta bölgede kiriş donatılarının girişine temiz koridor bıraktığını inceleyin.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "joint-col-bar-1-sw",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.4,
      },
      {
        index: 2,
        id: "joint-step-3-beam-90deg-anchorage",
        title: "3. Kiriş Boyuna Donatılarının 90° Çekirdek İçi Ankraj Kancaları",
        badge: "Adım 3 / 5",
        summary:
          "Kiriş üst (3Ø16) ve alt (3Ø16) boyuna donatıları düğüm çekirdeğine girer, kolon dış yüzüne yakın bölgede r = 32 mm bükümle 90° çekirdek içine bükülerek kenetlenir.",
        whatToNotice:
          "Üst kancalar (X = -125 mm) aşağıya, alt kancalar (X = -95 mm) yukarıya dönerek düğüm çekirdeği içinde kalır; dışarı taşmaz ve birbirine çarpmaz.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "joint-beam-top-bar-1",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.65,
      },
      {
        index: 3,
        id: "joint-step-4-joint-core-column-stirrups",
        title: "4. Düğüm Çekirdeği Sürekli Kolon Etriyeleri (5×Ø10/100 mm)",
        badge: "Adım 4 / 5",
        summary:
          "Z = 1250–1750 mm birleşim çekirdeği boyunca kolon etriyeleri kesilmez; Z = 1300..1700 mm kotlarındaki 5 adet yeşil Ø10/100 etriye çekirdeği ve ankraj kancalarını sarar.",
        whatToNotice:
          "Yeşil renkli düğüm çekirdeği etriyelerinin kiriş 90° ankraj kollarını dıştan kuşatarak kanca açılmasını ve diyagonal çekme kırılmasını önlediğini görün.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "joint-col-stirrup-15-birlesim-cekirdegi-z1500",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.85,
      },
      {
        index: 4,
        id: "joint-step-5-beam-stirrups-and-full-joint",
        title: "5. Kiriş Mesnet Sarılma Etriyeleri ve Tam Dış Birleşim",
        badge: "Adım 5 / 5",
        summary:
          "Kolon iç yüzünden (X = 200 mm) itibaren başlayan 12 adet Ø10 kiriş sarılma etriyesiyle birlikte kolon–kiriş dış birleşim kafesi tamamlanır.",
        whatToNotice:
          "Katman panelinden 'Kolon & Düğüm Etriyeleri' ile 'Kiriş Boyuna & 90° Ankraj' katmanlarını ayrı ayrı açıp kapatarak birleşim detayını 3 farklı açıdan inceleyin.",
        layers: {
          concrete: true,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "joint-beam-stirrup-1-x250",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 1,
      },
    ];
  }
  if (presetId === "k1-referans") {
    return [
      {
        index: 0,
        id: "beam-step-1-concrete-supports",
        title: "1. Kiriş Gövdesi, Net Pas Payı ve Uç Mesnet Temsili",
        badge: "Adım 1 / 5",
        summary:
          "300×500 mm kesitli ve 4000 mm net açıklıklı çerçeve kirişi, sol ve sağ uçlardaki temsilî mesnet bölgelerine oturur; net pas payı c = 30 mm'dir.",
        whatToNotice:
          "Kiriş açıklığı X = 0..4000 mm arasındadır; uçlardaki geniş hacimler donatı ankrajlarının kenetlendiği mesnet bağlamını temsil eder.",
        layers: {
          concrete: true,
          longitudinal: false,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "concrete-beam-body",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.2,
      },
      {
        index: 1,
        id: "beam-step-2-bottom-and-top-bars",
        title: "2. Yükleme Kabulüne Göre Alt Açıklık ve Üst Montaj Donatıları",
        badge: "Adım 2 / 5",
        summary:
          "Bu örneğin düşey yükleme kabulü altında orta açıklıkta alt lifler çekme etkisindedir ve 3Ø16 alt donatı ile karşılanır; üst köşelerde 2Ø14 montaj donatısı sürekli uzanır.",
        whatToNotice:
          "Çekme her zaman altta değildir: açıklık ortasında alt lifler çekmeye çalışırken mesnet komşuluğunda ve konsollarda üst lifler çekmeye çalışır.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: false,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "beam-bottom-bar-1",
        cameraPreset: "front",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.4,
      },
      {
        index: 2,
        id: "beam-step-3-support-extra-and-anchorage",
        title: "3. Mesnet Üst İlaveleri ve 90° Uç Ankraj Kancaları",
        badge: "Adım 3 / 5",
        summary:
          "Çerçeve sürekliliği nedeniyle sol ve sağ mesnet üst bölgelerinde oluşan negatif eğilme çekmesi için Ø16 üst mesnet ilaveleri eklenir ve mesnet içine 90° bükülerek kenetlenir.",
        whatToNotice:
          "Turuncu renkli sol/sağ mesnet üst ilave çubuklarının yalnız mesnet ve sarılma bölgesi boyunca uzandığını, orta açıklıkta kesildiğini inceleyin.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: false,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "beam-support-extra-left",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.65,
      },
      {
        index: 3,
        id: "beam-step-4-support-confinement-stirrups",
        title: "4. Sol/Sağ Mesnet Sarılma Bölgeleri (Ø10/100 mm)",
        badge: "Adım 4 / 5",
        summary:
          "Mesnet yüzünden itibaren 2h = 1000 mm uzunluğundaki sol (0–1000 mm) ve sağ (3000–4000 mm) sarılma bölgelerinde etriyeler Ø10/100 mm olarak sıklaştırılır.",
        whatToNotice:
          "Turkuaz (sol) ve yeşil (sağ) mesnet sarılma bölgelerindeki 10'ar adet sık etriyenin yüksek kesme ve deprem tersinir plastik mafsal talebini sardığını görün.",
        layers: {
          concrete: false,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: false,
          dimensions: true,
        },
        selectedPartId: "beam-stirrup-1-sol-mesnet-sarilma-x50",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 0.85,
      },
      {
        index: 4,
        id: "beam-step-5-midspan-and-full-cage",
        title: "5. Orta Açıklık Bölgesi (Ø10/150 mm) ve Tam Kiriş Kafesi",
        badge: "Adım 5 / 5",
        summary:
          "X = 1000–3000 mm orta açıklık bölgesinde 13 adet Ø10/150 mm etriye yer alır; toplam 33 etriye, alt/üst donatılar ve mesnet ankrajlarıyla tam kafes tamamlanır.",
        whatToNotice:
          "Düşey kesit (X) kaydırıcısıyla sol mesnet (X=250 mm, üstte 3 çubuk) ile orta açıklık (X=1950 mm, üstte 2 çubuk) enkesit farkını karşılaştırın.",
        layers: {
          concrete: true,
          longitudinal: true,
          stirrup: true,
          dowel: true,
          crosstie: true,
          dimensions: true,
        },
        selectedPartId: "beam-stirrup-16-aciklik-bolgesi-x1850",
        cameraPreset: "isometric",
        sectionEnabled: false,
        explodePercent: 0,
        layerProgressT: 1,
      },
    ];
  }
  const isCrosstie = presetId === "c1-cirozlu-ogretim";
  return [
    {
      index: 0,
      id: "step-1-concrete-envelope",
      title: "1. Beton Zarfı ve Net Pas Payı",
      badge: "Adım 1 / 5",
      summary:
        isCrosstie
          ? "400×400 mm kolon beton gövdesi (3200 mm boy) ve net 30 mm pas payı donatıyı dış etkilerden korur."
          : "300×300 mm C1 kolon beton gövdesi (3200 mm boy) ve net 30 mm pas payı donatıyı dış etkilerden korur.",
      whatToNotice:
        "Yarı saydam gri prizma beton hacmini temsil eder; donatı kafesi dış yüzeye değmez, içeride net örtü mesafesiyle yerleşir.",
      layers: {
        concrete: true,
        longitudinal: false,
        stirrup: false,
        dowel: false,
        crosstie: false,
        dimensions: true,
      },
      selectedPartId: "concrete-column-body",
      cameraPreset: "isometric",
      sectionEnabled: false,
      explodePercent: 0,
      layerProgressT: 0.2,
    },
    {
      index: 1,
      id: "step-2-longitudinal-bars",
      title: "2. Boyuna Taşıyıcı Çubuklar",
      badge: "Adım 2 / 5",
      summary:
        isCrosstie
          ? "Köşe ve kenar ortalarındaki 8Ø20 boyuna çubuklar eksenel yük ve eğilme momenti etkilerini taşır."
          : "Dört köşedeki 4Ø20 boyuna çubuklar (Z = 0–3200 mm) kolonun ana düşey taşıyıcı iskeletini kurar.",
      whatToNotice:
        "Beton gizlendiğinde köşelerdeki Ø20 çubukların etriye iç büküm yaylarına teğet yerleştiği net biçimde görülür.",
      layers: {
        concrete: false,
        longitudinal: true,
        stirrup: false,
        dowel: false,
        crosstie: false,
        dimensions: true,
      },
      selectedPartId: "longitudinal-bar-1-sw",
      cameraPreset: "front",
      sectionEnabled: false,
      explodePercent: 0,
      layerProgressT: 0.4,
    },
    {
      index: 2,
      id: "step-3-confinement-stirrups",
      title: "3. Alt/Üst Sarılma Sıklaştırması ve 135° Kancalar",
      badge: "Adım 3 / 5",
      summary:
        "Alt (0–600 mm) ve üst (2100–2700 mm) sarılma bölgelerinde etriyeler Ø10/100 mm olarak sıklaşır; 135° kancalar çekirdek içine döner.",
      whatToNotice:
        "Turkuaz renkli alt/üst sıklaştırma bölgelerinde etriye aralığı 100 mm iken, sarı orta bölgede 150 mm'dir.",
      layers: {
        concrete: false,
        longitudinal: true,
        stirrup: true,
        dowel: false,
        crosstie: false,
        dimensions: true,
      },
      selectedPartId: "stirrup-1-alt-sarilma-z50",
      cameraPreset: "isometric",
      sectionEnabled: false,
      explodePercent: 0,
      layerProgressT: 0.65,
    },
    {
      index: 3,
      id: "step-4-middle-and-crossties",
      title: isCrosstie
        ? "4. Orta Bölge ve Çirozların Ara Çubukları Tutması"
        : "4. Orta Bölge (Ø10/150) ve Enkesit Çekirdek Düzeni",
      badge: "Adım 4 / 5",
      summary: isCrosstie
        ? "Kenar ortalarındaki boyuna donatılar X ve Y doğrultusundaki Ø10 çirozlarla yanal burkulmaya karşı tutulur."
        : "600–2100 mm arasındaki orta bölgede 10 adet Ø10/150 mm etriye çekirdek sargısını sürdürür.",
      whatToNotice: isCrosstie
        ? "Pembe renkli çirozların her etriye kotunda karşılıklı kenar ortası çubuklarını birbirine bağladığını inceleyin."
        : "Z = 50 mm etriye kotu ile Z = 100 mm boşluk kotu arasındaki yatay kesit farkını 2B panelden karşılaştırın.",
      layers: {
        concrete: false,
        longitudinal: true,
        stirrup: true,
        dowel: false,
        crosstie: true,
        dimensions: true,
      },
      selectedPartId: isCrosstie
        ? "crosstie-1-x-z50"
        : "stirrup-10-orta-bolge-z1125",
      cameraPreset: "right",
      sectionEnabled: false,
      explodePercent: 0,
      layerProgressT: 0.85,
    },
    {
      index: 4,
      id: "step-5-dowels-and-full-cage",
      title: "5. Üst Düğüm Bölgesi ve 1080 mm Kat Filizleri",
      badge: "Adım 5 / 5",
      summary:
        "2700–3200 mm düğüm bölgesinin üzerinde, bir üst kat kolonuyla bindirme yapılabilmesi için 1080 mm boyunda filizler (Z = 3200–4280 mm) yükselir.",
      whatToNotice:
        "Tüm katmanlar (t = 1.00) bir arada görünür. İsterseniz patlatma kaydırıcısıyla katmanları açıklama amacıyla ayırabilirsiniz.",
      layers: {
        concrete: true,
        longitudinal: true,
        stirrup: true,
        dowel: true,
        crosstie: true,
        dimensions: true,
      },
      selectedPartId: "dowel-bar-1-sw",
      cameraPreset: "isometric",
      sectionEnabled: false,
      explodePercent: 0,
      layerProgressT: 1,
    },
  ];
}

export function deriveLayerVisibilityFromProgressT(
  progressT: number,
  includeDimensions = true,
): LayerVisibilityMask {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progressT) ? progressT : 1));
  return {
    concrete: clamped >= 0.05,
    longitudinal: clamped >= 0.35,
    stirrup: clamped >= 0.6,
    crosstie: clamped >= 0.8,
    dowel: clamped >= 0.95,
    dimensions: includeDimensions,
  };
}

export function createInitialSimulationViewState(
  presetId: ColumnPresetId = "c1-referans",
): SimulationViewState {
  return {
    presetId,
    layers: { ...DEFAULT_LAYER_VISIBILITY },
    quickFilter: "all",
    selectedPartId: null,
    cameraPreset: "isometric",
    viewTab: "split",
    section: {
      enabled: false,
      elevationZMm:
        presetId === "k1-referans"
          ? DEFAULT_BEAM_SECTION_POSITION_X_MM
          : presetId === "d1-dis-birlesim"
            ? DEFAULT_JOINT_SECTION_ELEVATION_Z_MM
            : presetId === "t1-tekil-temel"
              ? DEFAULT_FOOTING_SECTION_ELEVATION_Z_MM
              : presetId === "p1-perde"
                ? DEFAULT_WALL_SECTION_ELEVATION_Z_MM
                : presetId === "r1-radye-temel"
                  ? DEFAULT_MAT_SECTION_ELEVATION_Z_MM
                  : DEFAULT_SECTION_ELEVATION_Z_MM,
    },
    explodePercent: 0,
    learning: {
      mode: "free",
      stepIndex: 0,
      isPlaying: false,
      layerProgressT: 1,
    },
  };
}

export function isPartVisibleInLayers(
  part: DetailPart,
  layers: LayerVisibilityMask,
): boolean {
  return Boolean(layers[part.layerId]);
}

export type SimulationViewAction =
  | { type: "SET_PRESET"; presetId: ColumnPresetId }
  | { type: "TOGGLE_LAYER"; layerId: SimulationLayerId; model: DetailModel }
  | { type: "SET_LAYER"; layerId: SimulationLayerId; visible: boolean; model: DetailModel }
  | { type: "APPLY_QUICK_FILTER"; filter: QuickLayerFilterId; model: DetailModel }
  | { type: "SELECT_PART"; partId: string | null; model: DetailModel }
  | { type: "SET_CAMERA_PRESET"; cameraPreset: CameraPresetId }
  | { type: "SET_VIEW_TAB"; viewTab: WorkspaceLayoutMode }
  | { type: "SET_SECTION_ENABLED"; enabled: boolean }
  | { type: "SET_SECTION_ELEVATION"; elevationZMm: number; model: DetailModel }
  | { type: "SET_EXPLODE_PERCENT"; explodePercent: number }
  | { type: "SET_LEARNING_STEP"; stepIndex: number; model: DetailModel }
  | { type: "NEXT_LEARNING_STEP"; model: DetailModel }
  | { type: "PREV_LEARNING_STEP"; model: DetailModel }
  | { type: "SET_LEARNING_PLAYING"; isPlaying: boolean }
  | { type: "RETURN_TO_FREE_MODE" }
  | { type: "SET_LAYER_PROGRESS_T"; progressT: number; model: DetailModel }
  | { type: "HYDRATE_FROM_URL"; nextState: SimulationViewState }
  | { type: "RESET_VIEW" };

function sanitizeSelectedPart(
  selectedPartId: string | null,
  layers: LayerVisibilityMask,
  model: DetailModel,
): string | null {
  if (!selectedPartId) return null;
  const part = model.parts.find((item) => item.id === selectedPartId);
  if (!part) return null;
  return isPartVisibleInLayers(part, layers) ? selectedPartId : null;
}

function applyGuidedLearningStep(
  state: SimulationViewState,
  targetStepIndex: number,
  model: DetailModel,
  keepPlaying = false,
): SimulationViewState {
  const steps = getColumnLearningSteps(state.presetId);
  const clampedIdx = Math.max(0, Math.min(steps.length - 1, targetStepIndex));
  const step = steps[clampedIdx];
  const nextLayers: LayerVisibilityMask = { ...step.layers };

  return {
    ...state,
    layers: nextLayers,
    quickFilter: "all",
    selectedPartId: sanitizeSelectedPart(step.selectedPartId, nextLayers, model),
    cameraPreset: step.cameraPreset,
    section: {
      enabled: Boolean(step.sectionEnabled),
      elevationZMm:
        typeof step.sectionElevationZMm === "number"
          ? step.sectionElevationZMm
          : state.section.elevationZMm,
    },
    explodePercent: typeof step.explodePercent === "number" ? step.explodePercent : 0,
    learning: {
      mode: "guided",
      stepIndex: clampedIdx,
      isPlaying: keepPlaying,
      layerProgressT: step.layerProgressT,
    },
  };
}

export function simulationViewReducer(
  state: SimulationViewState,
  action: SimulationViewAction,
): SimulationViewState {
  switch (action.type) {
    case "SET_PRESET": {
      if (state.presetId === action.presetId) return state;
      return {
        ...state,
        presetId: action.presetId,
        selectedPartId: null,
        learning: {
          ...state.learning,
          mode: "free",
          isPlaying: false,
        },
      };
    }

    case "TOGGLE_LAYER": {
      const nextLayers: LayerVisibilityMask = {
        ...state.layers,
        [action.layerId]: !state.layers[action.layerId],
      };
      return {
        ...state,
        layers: nextLayers,
        quickFilter: "all",
        selectedPartId: sanitizeSelectedPart(
          state.selectedPartId,
          nextLayers,
          action.model,
        ),
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };
    }

    case "SET_LAYER": {
      const nextLayers: LayerVisibilityMask = {
        ...state.layers,
        [action.layerId]: action.visible,
      };
      return {
        ...state,
        layers: nextLayers,
        quickFilter: "all",
        selectedPartId: sanitizeSelectedPart(
          state.selectedPartId,
          nextLayers,
          action.model,
        ),
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };
    }

    case "APPLY_QUICK_FILTER": {
      let nextLayers: LayerVisibilityMask;
      if (action.filter === "only-stirrup") {
        nextLayers = {
          concrete: false,
          longitudinal: false,
          dowel: false,
          stirrup: true,
          crosstie: true,
          dimensions: state.layers.dimensions,
        };
      } else if (action.filter === "only-longitudinal") {
        nextLayers = {
          concrete: false,
          longitudinal: true,
          dowel: true,
          stirrup: false,
          crosstie: false,
          dimensions: state.layers.dimensions,
        };
      } else {
        nextLayers = { ...DEFAULT_LAYER_VISIBILITY };
      }

      return {
        ...state,
        layers: nextLayers,
        quickFilter: action.filter,
        selectedPartId: sanitizeSelectedPart(
          state.selectedPartId,
          nextLayers,
          action.model,
        ),
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };
    }

    case "SELECT_PART": {
      const nextSelected = sanitizeSelectedPart(
        action.partId,
        state.layers,
        action.model,
      );
      return {
        ...state,
        selectedPartId: nextSelected,
      };
    }

    case "SET_CAMERA_PRESET":
      return {
        ...state,
        cameraPreset: action.cameraPreset,
      };

    case "SET_VIEW_TAB":
      return {
        ...state,
        viewTab: action.viewTab,
      };

    case "SET_SECTION_ENABLED":
      // Plan Aşama 04 kuralı: Kesit açılırken patlatma sıfırlanır.
      return {
        ...state,
        section: {
          ...state.section,
          enabled: action.enabled,
        },
        explodePercent: action.enabled ? 0 : state.explodePercent,
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };

    case "SET_SECTION_ELEVATION": {
      const isBeam =
        action.model.slug === "kiris-detayi" || action.model.primaryAxis === "x";
      const minCoord = isBeam
        ? action.model.boundsMm.min.x
        : action.model.boundsMm.min.z;
      const maxCoord = isBeam
        ? action.model.boundsMm.max.x
        : action.model.boundsMm.max.z;
      const clamped = Math.max(
        minCoord,
        Math.min(maxCoord, Math.round(action.elevationZMm)),
      );
      return {
        ...state,
        section: {
          ...state.section,
          elevationZMm: clamped,
        },
      };
    }

    case "SET_EXPLODE_PERCENT": {
      const clampedExplode = Math.max(
        0,
        Math.min(100, Math.round(Number.isFinite(action.explodePercent) ? action.explodePercent : 0)),
      );
      // Patlatma açıldığında kesit kapalı tutulur ve çelişen öğrenme otomatik oynatması durdurulur.
      return {
        ...state,
        explodePercent: clampedExplode,
        section:
          clampedExplode > 0
            ? { ...state.section, enabled: false }
            : state.section,
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };
    }

    case "SET_LEARNING_STEP":
      return applyGuidedLearningStep(
        state,
        action.stepIndex,
        action.model,
        false,
      );

    case "NEXT_LEARNING_STEP":
      return applyGuidedLearningStep(
        state,
        state.learning.stepIndex + 1,
        action.model,
        state.learning.isPlaying,
      );

    case "PREV_LEARNING_STEP":
      return applyGuidedLearningStep(
        state,
        state.learning.stepIndex - 1,
        action.model,
        false,
      );

    case "SET_LEARNING_PLAYING": {
      if (action.isPlaying) {
        // Öğrenme oynatılırken çelişen serbest patlatma/kesit animasyonu durur ve mevcut adım uygulanır
        return {
          ...state,
          explodePercent: 0,
          section: {
            ...state.section,
            enabled: false,
          },
          learning: {
            ...state.learning,
            mode: "guided",
            isPlaying: true,
          },
        };
      }
      return {
        ...state,
        learning: {
          ...state.learning,
          isPlaying: false,
        },
      };
    }

    case "RETURN_TO_FREE_MODE":
      return {
        ...state,
        learning: {
          ...state.learning,
          mode: "free",
          isPlaying: false,
        },
      };

    case "SET_LAYER_PROGRESS_T": {
      const clampedT = Math.max(
        0,
        Math.min(1, Number.isFinite(action.progressT) ? Number(action.progressT.toFixed(2)) : 1),
      );
      const nextLayers = deriveLayerVisibilityFromProgressT(
        clampedT,
        state.layers.dimensions,
      );
      return {
        ...state,
        layers: nextLayers,
        quickFilter: "all",
        selectedPartId: sanitizeSelectedPart(
          state.selectedPartId,
          nextLayers,
          action.model,
        ),
        learning: {
          ...state.learning,
          mode: "free",
          isPlaying: false,
          layerProgressT: clampedT,
        },
      };
    }

    case "HYDRATE_FROM_URL":
      return {
        ...action.nextState,
        layers: { ...action.nextState.layers },
        section: { ...action.nextState.section },
        learning: { ...action.nextState.learning },
      };

    case "RESET_VIEW":
      return {
        ...createInitialSimulationViewState(state.presetId),
        viewTab: state.viewTab,
      };

    default:
      return state;
  }
}
