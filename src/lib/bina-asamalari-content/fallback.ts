import {
  BINA_ASAMALARI_ROOT_URL,
  getBinaChildren,
  getIndexedBinaNodeById,
  getIndexedBinaNodeBySlugPath,
  getSiblingBinaNodes,
  type IndexedBinaNode,
} from "../bina-asamalari";
import type { BinaGuideData, BinaGuideSection, BinaGuideSource } from "./types";
import { BRANCH_SOURCE_LEDGER } from "./source-ledger";

const AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın" as const;
const AUTHOR_TITLE = "Yazar" as const;
const DISPLAY_DATE = "20 Mart 2026" as const;

const BRANCH_META = {
  "proje-hazirlik": {
    category: "Proje ve İzinler",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
    image: "/bina-asamalari/hero/proje-hazirlik.svg",
    theory:
      "Bu başlık, şantiyeye inmeden önce çözülmesi gereken koordinasyon kararlarını temsil eder. Doğru proje hazırlığı, sahada kırım ve revizyon maliyetini azaltır.",
    tools: [
      ["Çizim", "AutoCAD / Revit", "Pafta, detay ve disiplin çakışması kontrolü"],
      ["Takip", "Excel revizyon matrisi", "Ruhsat, pafta ve teslim takibini tek yerde toplamak"],
      ["Koordinasyon", "Ortak CDE klasörü", "Güncel setin sahaya doğru dağılmasını sağlamak"],
      ["Ölçüm", "Total station / lazer metre", "Aplikasyon ve saha doğrulaması"],
    ],
    example: {
      title: "Belge ve revizyon akışı için örnek kontrol",
      inputLabel: "takım",
      unit: "proje seti",
      formula: "toplam set x kontrol turu",
      result: "revizyon yükünü önceden görünür kılmak",
      commentary:
        "Proje hazırlığında temel amaç, sahaya tek doğru seti göndermektir. Resmi onay, uygulama detayı ve saha klasörü birbirinden koparsa hata büyür.",
    },
  },
  "kazi-temel": {
    category: "Kazı ve Temel",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    image: "/bina-asamalari/hero/kazi-temel.svg",
    theory:
      "Kazı ve temel başlıklarında zemin verisi, su etkisi ve taşıma güvenliği aynı dosyada okunmalıdır. Sahadaki en pahalı sürprizler genellikle bu aşamada ortaya çıkar.",
    tools: [
      ["Analiz", "PLAXIS / GEO5", "Kazı, iksa ve oturma davranışını yorumlamak"],
      ["Ölçüm", "Total station", "Kazı kotu ve aplikasyon kontrolü"],
      ["Saha", "İnklinometre / prizma", "Deplasman ve komşu yapı etkisini izlemek"],
      ["Hesap", "Excel / Python", "Hacim, kot ve ön kontrol hesapları"],
    ],
    example: {
      title: "Kot ve hacim kontrolü için örnek yaklaşım",
      inputLabel: "kazı alanı",
      unit: "m²",
      formula: "alan x derinlik",
      result: "yaklaşık hacim ve yükleme ihtiyacını okumak",
      commentary:
        "Kazı-temel işlerinde kaba metraj bile saha kararını etkiler. Derinlik, su seviyesi ve komşuluk etkisi birlikte yorumlanmadan yalnız hacim hesabı yeterli değildir.",
    },
  },
  "kaba-insaat": {
    category: "Kaba İnşaat",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    image: "/bina-asamalari/hero/kaba-insaat.svg",
    theory:
      "Kaba inşaat, taşıyıcı sistem davranışının sahada görünür hale geldiği fazdır. Kalıp, donatı, beton ve duvar işleri sonraki tüm disiplinlere referans yüzey üretir.",
    tools: [
      ["Analiz", "ideCAD / ETABS", "Kesit ve taşıyıcı sistem kararlarını doğrulamak"],
      ["Çizim", "AutoCAD / Revit", "Donatı, kalıp ve rezervasyon uyumu"],
      ["Saha", "Lazer nivo / mastar", "Kot, açıklık ve düşeylik kontrolü"],
      ["Kalite", "Numune kalıbı / slump konisi", "Beton kabul ve kayıt zinciri"],
    ],
    example: {
      title: "Metraj ve kabul için örnek kontrol",
      inputLabel: "uygulama alanı",
      unit: "m²",
      formula: "alan x birim tüketim",
      result: "malzeme ve ekip planını erken görmek",
      commentary:
        "Kaba inşaatta yalnız malzeme miktarı değil, o malzemenin hangi sırayla sahaya gireceği de kaliteyi belirler.",
    },
  },
  "ince-isler": {
    category: "İnce İşler",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    image: "/bina-asamalari/hero/ince-isler.svg",
    theory:
      "İnce işler, kaba inşaatta bırakılan toleransları görünür kaliteye dönüştürür. Burada iyi sonuç, yüzey hazırlığı ve disiplinler arası sıra yönetimi ile alınır.",
    tools: [
      ["Çizim", "Mahal listesi / detay paftaları", "Kaplama ve doğrama kararlarını netleştirmek"],
      ["Kontrol", "2 m mastar / lazer nivo", "Yüzey ve kot sürekliliğini doğrulamak"],
      ["Kalite", "Nem ölçer", "Kaplama öncesi yüzey uygunluğunu görmek"],
      ["Metraj", "Excel / BIM metraj", "Kaplama, boya ve aksesuar miktarını planlamak"],
    ],
    example: {
      title: "Kaplama alanı için örnek tüketim hesabı",
      inputLabel: "net yüzey",
      unit: "m²",
      formula: "alan x tüketim katsayısı",
      result: "sipariş ve fire oranını erken görmek",
      commentary:
        "İnce işlerde doğru metraj kadar doğru yüzey hazırlığı da önemlidir. Yüzey bozuksa en iyi malzeme bile beklenen sonucu vermez.",
    },
  },
  "tesisat-isleri": {
    category: "Tesisat İşleri",
    color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    image: "/bina-asamalari/hero/tesisat-isleri.svg",
    theory:
      "Tesisat başlıkları görünmeyen sistemleri yönetir; bu yüzden koordinasyon kalitesi kapatma öncesinde belirlenir. Şaft, asma tavan ve test planı aynı anda düşünülmelidir.",
    tools: [
      ["Model", "Revit MEP / çizim overlay", "Şaft ve asma tavan çakışmalarını erken görmek"],
      ["Test", "Basınç test pompası / multimetre", "Kapatma öncesi doğrulama yapmak"],
      ["Ölçüm", "Lazer metre / nivo", "Hat kotu ve güzergah kontrolü"],
      ["Takip", "Saha kontrol föyü", "Test, fotoğraf ve teslim kayıtlarını tutmak"],
    ],
    example: {
      title: "Hat uzunluğu ve kontrol noktası için örnek yaklaşım",
      inputLabel: "ana hat",
      unit: "m",
      formula: "uzunluk x kontrol aralığı",
      result: "test ve askı noktası ihtiyacını görmek",
      commentary:
        "Tesisatta sayısal örnek yalnız boru veya kablo hesabı değildir; test, bakım ve erişim noktası da aynı planın parçasıdır.",
    },
  },
  "peyzaj-teslim": {
    category: "Peyzaj ve Teslim",
    color: "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300",
    image: "/bina-asamalari/hero/peyzaj-teslim.svg",
    theory:
      "Peyzaj ve teslim fazı, şantiyenin görünür kapanış kalitesini belirler. Burada yalnız bitki veya sert zemin değil, kabul ve teslim dosyası da üretilir.",
    tools: [
      ["Saha", "Lazer nivo / şerit metre", "Kot, eğim ve sert zemin doğruluğunu görmek"],
      ["Teslim", "Punch list tablosu", "Eksik ve kusurları kapanış öncesi izlemek"],
      ["Belge", "İskan ve kabul klasörü", "Resmi teslim setini toplamak"],
      ["Bakım", "Sulama ve peyzaj kontrol listesi", "Teslim sonrası ilk bakım adımlarını planlamak"],
    ],
    example: {
      title: "Teslim alanı için örnek kapanış hesabı",
      inputLabel: "teslim bölgesi",
      unit: "m²",
      formula: "alan x kontrol maddesi",
      result: "punch list yoğunluğunu önceden görmek",
      commentary:
        "Teslim aşamasında küçük eksiklerin toplamı büyük gecikme yaratır. Bu nedenle alan bazlı kabul planı kritik önem taşır.",
    },
  },
} as const;

function unique(items: readonly string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function ordered(items: readonly string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function table(headers: readonly string[], rows: readonly string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function estimateReadTime(sections: readonly BinaGuideSection[]): string {
  const words = sections
    .map((section) => section.content.replace(/[^\p{L}\p{N}\s]/gu, " "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(8, Math.round(words / 185))} dk okuma`;
}

function getBranchMeta(branchId: string) {
  return BRANCH_META[branchId as keyof typeof BRANCH_META] ?? BRANCH_META["kaba-insaat"];
}

function resolveSources(branchId: string): BinaGuideSource[] {
  return [...(BRANCH_SOURCE_LEDGER[branchId as keyof typeof BRANCH_SOURCE_LEDGER] ?? [])];
}

function resolveRelatedPaths(node: IndexedBinaNode): string[] {
  return unique(
    [
      node.parentSlugPath,
      ...getSiblingBinaNodes(node.slugPath).slice(0, 2).map((item) => item.slugPath),
      ...getBinaChildren(node.slugPath).slice(0, 3).map((item) => item.slugPath),
    ].filter((path): path is string => Boolean(path) && path !== node.slugPath),
  );
}

function buildIntro(node: IndexedBinaNode, branchLabel: string, summary: string, image: string) {
  return [
    `${node.plainLabel}, ${branchLabel.toLocaleLowerCase("tr-TR")} fazı içinde ${summary.toLocaleLowerCase("tr-TR")} başlığıyla okunur.`,
    `${node.plainLabel} için doğru karar, yalnız işi başlatmak değil; bir sonraki ekibe ölçülü, test edilmiş ve kayıtlı teslim bırakmaktır. Bu nedenle bu rehber, konuya giriş özeti değil, sahada kullanılabilir bir yol haritası olarak düşünülmelidir.`,
    `Bu içerik tasarım ofisi, saha mühendisliği ve teknik ofis arasında ortak dil kurmak için hazırlandı. Özellikle kısa sürede karar verilmesi gereken şantiye anlarında hangi veriye bakılacağı, hangi testin önce geleceği ve hangi kontrolün atlanmaması gerektiği burada toplanır.`,
    `![${node.plainLabel} görseli](${image})`,
    `*Görsel, ${node.plainLabel.toLocaleLowerCase("tr-TR")} konusunun uygulama zincirindeki yerini sembolik olarak temsil eder.*`,
  ].join("\n\n");
}

function buildTheory(node: IndexedBinaNode, branchTheory: string, parentLabel?: string) {
  return [
    branchTheory,
    `${node.plainLabel} başlığının gerçek değeri, ${parentLabel ?? "üst paket"} ile olan ilişkisi içinde anlaşılır. Bir imalatın ne zaman başlayacağı, hangi toleransla biteceği ve hangi testle kabul edileceği burada netleşir.`,
    `${node.plainLabel} çoğu projede tek başına sorun çıkarmaz; sorun, bu başlık bir önceki ve bir sonraki iş kalemiyle bağlanmadığında büyür. Bu yüzden mühendislik yaklaşımı, ürün veya ekipman seçiminin ötesinde sıra, kayıt ve teslim disiplinini de kapsar.`,
    bullets([
      "İş kaleminin teknik amacı net tanımlanmalıdır.",
      "Bir sonraki disipline bırakacağı tolerans önceden belirlenmelidir.",
      "Kapatma öncesi zorunlu test ve görsel kontrol listesi yazılı olmalıdır.",
      "As-built veya teslim kaydı aynı gün içinde üretilmelidir.",
    ]),
  ].join("\n\n");
}

function buildSourceTable(sources: readonly BinaGuideSource[]) {
  return table(
    ["Kaynak", "Tür", "Neden Önemli"],
    sources.map((source) => [source.shortCode, source.type, source.note ?? source.title]),
  );
}

function buildSteps(node: IndexedBinaNode) {
  return ordered([
    `${node.plainLabel} öncesi gelen işi ölçü ve kalite açısından doğrula.`,
    "Malzeme, ekipman, ekip ve güvenlik hazırlığını başlatmadan iş emrini kapatma.",
    "İlk uygulama noktasını örnek alan olarak kabul et ve genel imalata sonra geç.",
    "Kritik tolerans, kot, aks veya güzergah verilerini sahada ikinci kez doğrula.",
    "Kapatma veya teslim öncesi fotoğraf, test ve kontrol formunu tamamla.",
    "Bir sonraki disipline geçmeden önce eksik-kusur listesini kapat.",
  ]);
}

function buildExample(node: IndexedBinaNode, branchMeta: (typeof BRANCH_META)[keyof typeof BRANCH_META]) {
  const example = branchMeta.example;
  const area = node.depth === 3 ? 120 : node.depth === 2 ? 250 : 480;
  const factor = node.depth === 3 ? 3 : node.depth === 2 ? 4 : 5;
  const result = area * factor;

  return [
    `### ${example.title}`,
    `**Verilenler**`,
    `- İncelenen başlık: ${node.plainLabel}`,
    `- Referans ${example.inputLabel}: ${area} ${example.unit}`,
    `- Kontrol katsayısı: ${factor}`,
    `- Yaklaşım: ${example.formula}`,
    "",
    `**Adım 1: İlk hesap**`,
    `${example.inputLabel} x katsayı = ${area} x ${factor} = ${result}`,
    "",
    `**Adım 2: Sonucun yorumu**`,
    `${result} değeri burada nihai tasarım hesabı yerine geçmez; ${example.result} için kaba bir planlama bandı üretir. Eğer saha koşulu değişirse aynı başlık yeniden değerlendirilmelidir.`,
    "",
    `**Adım 3: Mühendislik kontrolü**`,
    `${example.commentary}`,
    "",
    `**Kontrol notu**`,
    `Bu örneğin amacı, ${node.plainLabel.toLocaleLowerCase("tr-TR")} konusunda karar verirken yalnız göz kararıyla değil, sayısal bir başlangıç bandı ile hareket etmektir.`,
  ].join("\n");
}

function buildTools(branchMeta: (typeof BRANCH_META)[keyof typeof BRANCH_META]) {
  return table(
    ["Kategori", "Araç / Yazılım", "Kullanım amacı"],
    branchMeta.tools.map((row) => [...row]),
  );
}

function buildMistakes(node: IndexedBinaNode, branchLabel: string) {
  return [
    `1. **Yanlış:** ${node.plainLabel} işini yalnız ustalık bilgisiyle yönetmek.  \n**Doğru:** ${branchLabel} içindeki önceki ve sonraki işlerle ilişkilendirerek kontrol etmek.`,
    `2. **Yanlış:** Ölçü ve test kaydı tutmadan kapatma yapmak.  \n**Doğru:** Görünmez hale gelecek imalatlarda mutlaka belge üretmek.`,
    `3. **Yanlış:** İlk uygulama örneğini tüm iş için yeterli kabul etmek.  \n**Doğru:** İlk örneği referans kabul edip seri imalatta da aynı disiplini sürdürmek.`,
    `4. **Yanlış:** Revizyon bilgisini yalnız sözlü aktarmak.  \n**Doğru:** Güncel pafta ve saha notunu yazılı paylaşmak.`,
    `5. **Yanlış:** Bir sonraki ekibin ihtiyacını düşünmeden teslim vermek.  \n**Doğru:** Tolerans, temizlik, kot ve erişim şartlarını tamamlayarak teslim etmek.`,
    "",
    `**Saha ipucu:** ${node.plainLabel} başlığında sorunların büyük kısmı teknik yetersizlikten değil, eksik kayıt ve acele teslimden çıkar. Özellikle kapatma öncesi fotoğraf ve ölçü kaydı alınmadan alan bırakılmamalıdır.`,
  ].join("\n");
}

function buildSummary(node: IndexedBinaNode, relatedPaths: readonly string[]) {
  return [
    table(
      ["Kontrol alanı", "Beklenen yaklaşım", "Neden önemli"],
      [
        ["Ölçü / kot", "İlk ve son kontrolde doğrulama", "Bir sonraki ekip için referans üretir"],
        ["Test / gözlem", "Kapatma öncesi tamamlanmış kayıt", "Görünmez imalat riskini azaltır"],
        ["Teslim", "Foto + not + ölçü", "Saha hafızası oluşturur"],
        ["Revizyon", "Güncel pafta ile çalışma", "Teknik ofis-saha kopukluğunu önler"],
      ],
    ),
    relatedPaths.length > 0
      ? `Bağlantılı konular:\n${bullets(
          relatedPaths.map((path) => `[${path.replace(`${BINA_ASAMALARI_ROOT_URL}/`, "")}](${`${BINA_ASAMALARI_ROOT_URL}/${path}`})`),
        )}`
      : "",
    `${node.plainLabel} için en doğru yaklaşım; işi yalnız bitirmek değil, ölçülebilir şekilde tamamlamaktır. Bu mantık kurulursa saha kararları tekrar üretmez.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildSources(sources: readonly BinaGuideSource[]) {
  return bullets(
    sources.map((source) =>
      source.url ? `[${source.title}](${source.url}) - ${source.note ?? source.shortCode}` : `${source.title} - ${source.note ?? source.shortCode}`,
    ),
  );
}

function createSections(node: IndexedBinaNode): BinaGuideSection[] {
  const branchMeta = getBranchMeta(node.branchId);
  const branchNode = getIndexedBinaNodeById(node.branchId);
  const branchLabel = branchNode?.plainLabel ?? branchMeta.category;
  const parentLabel = node.parentSlugPath ? getIndexedBinaNodeBySlugPath(node.parentSlugPath)?.plainLabel : undefined;
  const sources = resolveSources(node.branchId);
  const relatedPaths = resolveRelatedPaths(node);

  return [
    {
      id: "giriş-kapsam",
      title: "1. Giriş ve Kapsam",
      subsections: [],
      content: buildIntro(node, branchLabel, node.summary, branchMeta.image),
    },
    {
      id: "teorik-temel",
      title: "2. Teorik Temel ve İşin Amacı",
      subsections: [],
      content: buildTheory(node, branchMeta.theory, parentLabel),
    },
    {
      id: "yonetmelik-standart",
      title: "3. Yönetmelik ve Standart Gereksinimleri",
      subsections: [],
      content: [
        `${node.plainLabel} konusu için aşağıdaki resmi ve teknik kaynaklar temel referans çerçevesini kurar. Buradaki amaç mevzuatı ezberletmek değil, kararın hangi güvenli zemin üzerinde verileceğini görünür hale getirmektir.`,
        buildSourceTable(sources),
        "Bu kaynaklar proje özelindeki şartname ve pafta setiyle birlikte okunmalıdır. Resmi standardın varlığı, saha kontrolünün otomatik yapıldığı anlamına gelmez.",
      ].join("\n\n"),
    },
    {
      id: "uygulama-adimlari",
      title: "4. Tasarım veya Uygulama Adımları",
      subsections: [],
      content: [
        `Aşağıdaki akış, ${node.plainLabel.toLocaleLowerCase("tr-TR")} işini sahada yönetirken sıralamanın neden kritik olduğunu gösterir.`,
        buildSteps(node),
        "Bu akışın dışına çıkıldığında iş geri sarar; özellikle kapatma, test ve teslim adımlarının yer değiştirmesi sonraki ekiplerde zincirleme revizyon üretir.",
      ].join("\n\n"),
    },
    {
      id: "sayisal-ornek",
      title: "5. Sayısal Çözümlü Örnek",
      subsections: [],
      content: buildExample(node, branchMeta),
    },
    {
      id: "yazilim-araçlar",
      title: "6. Kullanılan Yazılım ve Araçlar",
      subsections: [],
      content: [
        `${node.plainLabel} için kullanılacak araçlar tek başına kalite üretmez; fakat doğru ölçü, doğru kayıt ve doğru koordinasyon için gerekli altyapıyı sağlar.`,
        buildTools(branchMeta),
        "Özellikle ölçüm ve kayıt araçları, ileride çıkabilecek tartışmalarda tek güvenilir referans olur.",
      ].join("\n\n"),
    },
    {
      id: "hatalar",
      title: "7. Sık Yapılan Hatalar ve Saha İpuçları",
      subsections: [],
      content: buildMistakes(node, branchLabel),
    },
    {
      id: "ozet",
      title: "8. Özet Kontrol Tablosu ve Bağlantılı Konular",
      subsections: [],
      content: buildSummary(node, relatedPaths),
    },
    {
      id: "kaynaklar",
      title: "9. Kaynaklar",
      subsections: [],
      content: buildSources(sources),
    },
  ];
}

export function buildFallbackGuide(node: IndexedBinaNode): BinaGuideData {
  const branchMeta = getBranchMeta(node.branchId);
  const branchNode = getIndexedBinaNodeById(node.branchId);
  const sections = createSections(node);
  const sources = resolveSources(node.branchId);

  return {
    slugPath: node.slugPath,
    title: node.plainLabel,
    description: `${node.summary} Bu sayfa, ${node.plainLabel.toLocaleLowerCase("tr-TR")} için uzun-form saha rehberi ve uygulama özeti sunar.`,
    category: branchNode?.plainLabel ?? branchMeta.category,
    categoryColor: branchMeta.color,
    badgeLabel: node.childSlugPaths.length > 0 ? "Kategori Rehberi" : "Teknik Rehber",
    author: AUTHOR,
    authorTitle: AUTHOR_TITLE,
    date: DISPLAY_DATE,
    readTime: estimateReadTime(sections),
    image: branchMeta.image,
    quote: {
      text: `${node.plainLabel}, doğru malzeme kadar doğru sıra, ölçü ve kayıt disiplini gerektiren bir uygulama paketidir.`,
    },
    sections,
    relatedPaths: resolveRelatedPaths(node),
    parentPath: node.parentSlugPath,
    childPaths: node.childSlugPaths,
    standards: unique(sources.map((source) => source.shortCode)),
    keywords: unique([node.plainLabel, branchMeta.category, "bina aşamaları rehberi", "şantiye kontrolü"]),
    sources,
  };
}
