import { getIndexedBinaNodeBySlugPath } from "../bina-asamalari";
import type { BinaGuideData, BinaGuideSection } from "./types";

const TARGET_WORD_LIMITS: Record<number, number> = {
  1: 2200,
  2: 2000,
  3: 1900,
};

function countWords(text: string): number {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function countSectionWords(sections: readonly BinaGuideSection[]): number {
  return countWords(sections.map((section) => section.content).join("\n"));
}

function estimateReadTime(sections: readonly BinaGuideSection[]): string {
  return `${Math.max(8, Math.round(countSectionWords(sections) / 185))} dk okuma`;
}

function table(headers: readonly string[], rows: readonly string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function ordered(items: readonly string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function uniquePaths(paths: readonly (string | undefined)[]): string[] {
  return [...new Set(paths.filter((path): path is string => Boolean(path)))];
}

function toGuideLink(slugPath: string): string {
  const node = getIndexedBinaNodeBySlugPath(slugPath);
  return node ? `[${node.plainLabel}](${node.url})` : slugPath;
}

function getTargetWordLimit(slugPath: string): number {
  return TARGET_WORD_LIMITS[slugPath.split("/").length] ?? 1900;
}

function buildOperationsSection(guide: BinaGuideData, sectionNumber: number): BinaGuideSection {
  const connectedPaths = uniquePaths([guide.parentPath, ...guide.relatedPaths]).slice(0, 4);
  const standards = guide.standards.slice(0, 4).join(", ");

  return {
    id: "operasyonel-kontrol-zinciri",
    title: `${sectionNumber}. Operasyonel Kontrol Zinciri ve Günlük Saha Yönetimi`,
    subsections: [],
    content: [
      `${guide.title}, çoğu projede teknik olarak doğru tarif edildiği halde saha operasyonu gevşek kurulduğu için kalite kaybı üreten bir kalemdir. Bu nedenle mühendis için asıl iş, imalatı yalnız başlatmak değil; başlangıç onayı, günlük takip, kapatma öncesi kontrol ve teslim onayı arasında kopmayan bir zincir kurmaktır.`,
      `${guide.category} paketi içinde bu konu genellikle başka ekiplerle temas halindedir. O nedenle aks, kot, detay, rezervasyon, gizlenecek noktalar ve test sırası işe başlamadan önce netleşmezse sorun teknik eksikten çok geç yakalanan koordinasyon zafiyeti olarak ortaya çıkar. Sahadaki tekrar işlerin büyük bölümü de tam bu aşamada doğar.`,
      `Pratikte kullanılacak mevzuat ve standart zinciri genellikle ${standards || "ilgili resmi kaynaklar, proje notları ve sistem dokümanları"} etrafında toplanır. Ancak bu başlıklar sahada ancak kontrol formu, numune mahal, test tutanağı ve fotoğraf kaydı ile birlikte işe yarar. Yani resmi referans ile saha kaydı aynı paket içinde okunmalıdır.`,
      table(
        ["Kontrol Halkası", "Ne Doğrulanır", "Kim Takip Eder", "Ne Zaman"],
        [
          ["Başlangıç", "Aks, kot, detay, rezervasyon ve numune kararı", "Saha Mühendisi + Formen", "İşe girmeden önce"],
          ["Günlük İlerleme", "Ekip ritmi, malzeme uygunluğu ve tolerans sapması", "Saha Mühendisi", "Her vardiya veya imalat günü"],
          ["Kapatma Öncesi", "Gizlenecek detay, test ve fotoğraf kaydı", "Teknik Ofis + Saha Ekibi", "Bir sonraki kalem gelmeden önce"],
          ["Nihai Teslim", "Fonksiyon, görsel kalite ve evrak bütünlüğü", "Şantiye Şefi + Kontrolör", "Kısmi veya nihai kabulde"],
        ],
      ),
      connectedPaths.length > 0
        ? `Bu sahada birlikte okunması yararlı bağlantılı konular:\n${bullets(connectedPaths.map((path) => toGuideLink(path)))}`
        : "",
      "Saha ipucu: Üzeri kapanacak veya sonradan erişimi zorlaşacak her detay aynı gün içinde ölçü, fotoğraf ve gerekiyorsa test kaydıyla kapatılmalıdır. Aksi halde sorun fark edildiğinde doğru sebebi ispat etmek zorlaşır.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function buildFieldTipsSection(guide: BinaGuideData, sectionNumber: number): BinaGuideSection {
  return {
    id: "saha-ipuclari-ve-risk-yonetimi",
    title: `${sectionNumber}. Sahadan İpuçları, Yeniden İş Riski ve Teslim Mantığı`,
    subsections: [],
    content: [
      `${guide.title.toLocaleLowerCase("tr-TR")} kaleminde hızlı görünen çözüm ile sağlıklı çözüm her zaman aynı değildir. Ekipleri erken sahaya sokmak bazen takvimi hızlandırıyor gibi görünür; fakat önceki kalemin kabulünü tamamlamadan yapılan başlangıçlar, aynı mahale iki veya üç kere geri dönülmesine yol açar. Bu da hem maliyeti hem de kaliteyi bozar.`,
      "Bir inşaat mühendisinin sahada sürekli aklında tutması gereken konu, toleransların toplanarak büyüdüğüdür. Küçük görünen bir eksen kayması, kot sapması, nem problemi veya sabitleme zafiyeti bir üst kalemde daha belirgin hale gelir. Dolayısıyla kontrol yalnız son görünen yüzeyde değil, bir sonraki imalata veri üretecek noktada yapılmalıdır.",
      "Özellikle teslime yaklaşan projelerde ekiplerin dikkat dağılımı artar. Bu safhada yapılacak en doğru iş, açık mahal yerine kapanacak mahal mantığına geçmek, eksik listesini blok bazlı yönetmek ve aynı kusurun başka katlarda tekrarlanmasını engellemektir. Teslime yaklaşmak kalite eşiğini düşürmek için değil, kontrol disiplinini daha da keskinleştirmek için bir sinyaldir.",
      "Sahadan hızlı ama etkili ipuçları:",
      bullets([
        "Numune kararını verdikten sonra ekipler arası yorum farkına izin verme; aynı detay tüm blokta aynı şekilde tekrar etsin.",
        "Gizli kalan işleri bir sonraki ekip gelmeden önce kapat; bir üst kalem gelince önceki hatayı düzeltmek çok pahalı hale gelir.",
        "Malzeme kabulünü sadece irsaliye ile değil, uygulama noktasında doğru ürün ve doğru aksesuar eşleşmesiyle yap.",
        "Bir mahalde tekrar iş başladıysa bunu lokal hata gibi değil, süreç hatası gibi incele.",
        "Teslim turunda görsel kontrolün yanına işlev, açılma-kapanma, sızdırmazlık veya test mantığını da ekle.",
        "Bakım gerektirecek noktalar için sonradan kırma istemeyen erişim senaryosu bırak.",
      ]),
      table(
        ["Risk Türü", "Erken Sinyal", "Sahadaki Sonucu", "Önleme Yolu"],
        [
          ["Erken Başlangıç", "Bir önceki kalem eksikken ekip giriyor", "Tekrar iş ve ton/kot farkı", "Hazır olmayan mahali takvimde ayrı tutmak"],
          ["Eksik Kayıt", "Fotoğraf ve test tutanağı yok", "Kusurun kaynağı belirsiz kalır", "Aynı gün dijital saha kaydı almak"],
          ["Yorum Farkı", "Usta ekipler farklı detay çözümleri uyguluyor", "Bloklar arası kalite dağılır", "Numune mahal ve sabit detay seti"],
          ["Teslim Stresi", "Açık imalat listesi kapanmıyor", "Geçici çözümler kalıcı hale gelir", "Blok bazlı eksik listesi ve sorumlu ataması"],
        ],
      ),
      "Teslim öncesi son tavsiye: Bu kalem tamamlandığında yalnız bitmiş görünmesi yetmez; bir sonraki kullanıcı, denetim ekibi veya bakım personeli için okunur ve izlenebilir halde olması gerekir.",
    ].join("\n\n"),
  };
}

function buildCloseoutSection(guide: BinaGuideData, sectionNumber: number): BinaGuideSection {
  const sourceList = guide.sources.slice(0, 4).map((source) => source.shortCode);

  return {
    id: "kapanis-kontrol-listesi",
    title: `${sectionNumber}. Son Kontrol, Evrak Paketi ve İşletme Devri`,
    subsections: [],
    content: [
      `${guide.title} için son kabul, yalnız 'imalat bitti' notu düşmekle tamamlanmaz. Kalemin hangi standart, hangi saha kaydı ve hangi son kontrol listesiyle kapatıldığı açık değilse teslim formel görünür ama gerçekte eksik kalır. Bu nedenle saha mühendisi, fiziki imalat ile evrak zincirini aynı anda tamamlamalıdır.`,
      "Özellikle teknik disiplinler arasında bağlantılı kalan kalemlerde as-built kaydı, son fotoğraf, test sonucu, revizyon notu ve eksik listesi aynı klasörde toplanmalıdır. Bu paket olmadan sonradan çıkacak arıza veya kullanıcı geri bildirimi doğru kaynağa bağlanamaz.",
      "Son kontrol akışını şu düzende yönetmek pratikte işe yarar:",
      ordered([
        "Fiziki imalatın bitiş durumunu mahal veya aks bazında teyit et.",
        "Gizli kalmış detayların fotoğraf, ölçü veya test kayıtlarını dosyaya bağla.",
        "Bağlantılı disiplinlerle çapraz kontrol turu yap ve açık noktayı tek listede topla.",
        "Son kullanıcı veya işletme tarafını etkileyecek noktaları etiket, plan veya not ile görünür hale getir.",
        "Kalan eksikleri sorumlu, tarih ve mahal bilgisiyle kapat.",
        "Nihai teslimde standart ve kaynak zincirini evrak setine not düş.",
      ]),
      table(
        ["Teslim Kalemi", "Neden Gerekir", "Kimin İşine Yarar"],
        [
          ["As-Built ve Revizyon Notu", "Sahadaki son durumun resmi kaydı", "Teknik Ofis ve Bakım Ekibi"],
          ["Fotoğraf ve Test Tutanağı", "Gizli kalan detayların ispatlanması", "Yapı Denetim ve Kontrol Ekipleri"],
          ["Eksik Listesi Kapanış Formu", "Açılan kusurların takibi ve kapatılması", "Şantiye Şefi ve İşveren Temsilcisi"],
          ["Kaynak Referans Notu", `${sourceList.join(", ") || "Resmi ve teknik referanslar"} ile bağ kurmak`, "Sonraki teknik ve yasal kararlar"],
        ],
      ),
    ].join("\n\n"),
  };
}

function appendSections(guide: BinaGuideData, sectionsToAppend: readonly BinaGuideSection[]): BinaGuideData {
  const sections = [...guide.sections, ...sectionsToAppend];

  return {
    ...guide,
    sections,
    readTime: estimateReadTime(sections),
  };
}

export function deepenGuideIfNeeded(guide: BinaGuideData): BinaGuideData {
  const currentWords = countSectionWords(guide.sections);
  const targetWords = getTargetWordLimit(guide.slugPath);

  if (currentWords >= targetWords) {
    return guide;
  }

  const sectionsToAppend: BinaGuideSection[] = [];
  let projectedWords = currentWords;
  let nextSectionNumber = guide.sections.length + 1;

  const firstExtension = buildOperationsSection(guide, nextSectionNumber);
  sectionsToAppend.push(firstExtension);
  projectedWords += countWords(firstExtension.content);
  nextSectionNumber += 1;

  const secondExtension = buildFieldTipsSection(guide, nextSectionNumber);
  sectionsToAppend.push(secondExtension);
  projectedWords += countWords(secondExtension.content);
  nextSectionNumber += 1;

  if (projectedWords < targetWords) {
    sectionsToAppend.push(buildCloseoutSection(guide, nextSectionNumber));
  }

  return appendSections(guide, sectionsToAppend);
}

export function deepenGuideMap(guideMap: Map<string, BinaGuideData>): Map<string, BinaGuideData> {
  return new Map([...guideMap.entries()].map(([slugPath, guide]) => [slugPath, deepenGuideIfNeeded(guide)] as const));
}
