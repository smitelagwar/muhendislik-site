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
    title: `${sectionNumber}. Operasyonel Kontrol Zinciri ve Gunluk Saha Yonetimi`,
    subsections: [],
    content: [
      `${guide.title}, cogu projede teknik olarak doğru tarif edildigi halde saha operasyonu gevsek kuruldugu icin kalite kaybi ureten bir kalemdir. Bu nedenle muhendis icin asil is, imalati yalniz baslatmak degil; başlangıç onayi, gunluk takip, kapatma oncesi kontrol ve teslim onayi arasinda kopmayan bir zincir kurmaktir.`,
      `${guide.category} paketi icinde bu konu genellikle baska ekiplerle temas halindedir. O nedenle aks, kot, detay, rezervasyon, gizlenecek noktalar ve test sirasi ise baslamadan once netlesmezse sorun teknik eksikten çok gec yakalanan koordinasyon zafiyeti olarak ortaya cikar. Sahadaki tekrar islerin buyuk bolumu de tam bu asamada dogar.`,
      `Pratikte kullanilacak mevzuat ve standart zinciri genellikle ${standards || "ilgili resmi kaynaklar, proje notlari ve sistem dokumanlari"} etrafinda toplanir. Ancak bu basliklar sahada ancak kontrol formu, numune mahal, test tutanagi ve fotograf kaydi ile birlikte ise yarar. Yani resmi referans ile saha kaydi ayni paket icinde okunmalidir.`,
      table(
        ["Kontrol halkasi", "Ne dogrulanir", "Kim takip eder", "Ne zaman"],
        [
          ["Başlangıç", "Aks, kot, detay, rezervasyon ve numune karari", "Saha muhendisi + formen", "Ise girmeden once"],
          ["Gunluk ilerleme", "Ekip ritmi, malzeme uygunlugu ve tolerans sapmasi", "Saha muhendisi", "Her vardiya veya imalat gunu"],
          ["Kapatma oncesi", "Gizlenecek detay, test ve fotograf kaydi", "Teknik ofis + saha", "Bir sonraki kalem gelmeden once"],
          ["Teslim", "Fonksiyon, gorsel kalite ve evrak butunlugu", "Saha muhendisi + kontrolor", "Kismi veya nihai kabulde"],
        ],
      ),
      connectedPaths.length > 0
        ? `Bu sahada birlikte okunmasi yararli baglantili konular:\n${bullets(connectedPaths.map((path) => toGuideLink(path)))}`
        : "",
      "Saha ipucu: uzeri kapanacak veya sonradan erisimi zorlasacak her detay ayni gun icinde ölçü, fotograf ve gerekiyorsa test kaydiyla kapatilmalidir. Aksi halde sorun fark edildiginde doğru sebebi ispat etmek zorlugu baslar.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function buildFieldTipsSection(guide: BinaGuideData, sectionNumber: number): BinaGuideSection {
  return {
    id: "saha-ipuclari-ve-risk-yonetimi",
    title: `${sectionNumber}. Sahadan Ipuclari, Yeniden Is Riski ve Teslim Mantigi`,
    subsections: [],
    content: [
      `${guide.title.toLocaleLowerCase("tr-TR")} kaleminde hızlı gorunen cozum ile saglikli cozum her zaman ayni degildir. Ekipleri erken sahaya sokmak bazen takvimi hizlandiriyor gibi görünür; fakat onceki kalemin kabulunu tamamlamadan yapilan baslangiclar, ayni mahale iki veya uc kere geri donulmesine yol acar. Bu da hem maliyeti hem de kaliteyi bozar.`,
      "Bir insaat muhendisinin sahada surekli aklinda tutmasi gereken konu, toleranslarin toplanarak buyudugudur. Kucuk gorunen bir eksen kaymasi, kot sapmasi, nem problemi veya sabitleme zafiyeti bir ust kalemde daha belirgin hale gelir. Dolayisiyla kontrol yalniz son gorunen yuzeyde degil, bir sonraki imalata veri uretecek noktada yapilmalidir.",
      "Ozellikle teslime yaklasan projelerde ekiplerin dikkat dagilimi artar. Bu safhada yapilacak en doğru is, acik mahal yerine kapanacak mahal mantigina gecmek, eksik listesini blok bazli yonetmek ve ayni kusurun baska katlarda tekrarlanmasini engellemektir. Teslime yaklasmak kalite esigini dusurmek icin degil, kontrol disiplinini daha da keskinlestirmek icin bir sinyaldir.",
      "Sahadan hızlı ama etkili ipuclari:",
      bullets([
        "Numune kararini verdikten sonra ekipler arasi yorum farkina izin verme; ayni detay tüm blokta ayni sekilde tekrar etsin.",
        "Gizli kalan isleri bir sonraki ekip gelmeden once kapat; bir ust kalem gelince onceki hatayi duzeltmek pahali hale gelir.",
        "Malzeme kabulunu sadece irsaliye ile degil, uygulama noktasinda doğru urun ve doğru aksesuar eslesmesiyle yap.",
        "Bir mahalde tekrar is basladiysa bunu lokal hata gibi degil, süreç hatasi gibi incele.",
        "Teslim turunda gorsel kontrolun yanina islev, acilma-kapanma, sizdirmazlik veya test mantigini da ekle.",
        "Bakim gerektirecek noktalar icin sonradan kirma istemeyen erisim senaryosu birak.",
      ]),
      table(
        ["Risk", "Erken sinyal", "Sahadaki sonucu", "Onleme yolu"],
        [
          ["Erken başlangıç", "Bir onceki kalem eksikken ekip giriyor", "Tekrar is ve ton farki", "Hazir olmayan mahali takvimde ayri tutmak"],
          ["Eksik kayıt", "Fotograf ve test tutanagi yok", "Kusurun kaynagi belirsiz kalir", "Ayni gun saha kaydi almak"],
          ["Yorum farki", "Usta ekipler farkli detay cozumleri uyguluyor", "Bloklar arasi kalite dagilir", "Numune mahal ve sabit detay seti"],
          ["Teslim stresi", "Acik imalat listesi kapanmiyor", "Gecici cozumler kalici hale gelir", "Blok bazli eksik listesi ve sorumlu atamasi"],
        ],
      ),
      "Teslim oncesi son tavsiye: bu kalem tamamlandiginda yalniz bitmis gorunmesi yetmez; bir sonraki kullanici, denetim ekibi veya bakim personeli icin okunur ve izlenebilir halde olmasi gerekir.",
    ].join("\n\n"),
  };
}

function buildCloseoutSection(guide: BinaGuideData, sectionNumber: number): BinaGuideSection {
  const sourceList = guide.sources.slice(0, 4).map((source) => source.shortCode);

  return {
    id: "kapanis-kontrol-listesi",
    title: `${sectionNumber}. Son Kontrol, Evrak Paketi ve Isletme Devri`,
    subsections: [],
    content: [
      `${guide.title} icin son kabul, yalniz imalat bitti notu dusmekle tamamlanmaz. Kalemin hangi standart, hangi saha kaydi ve hangi son kontrol listesiyle kapatildigi acik degilse teslim formel görünür ama gercekte eksik kalir. Bu nedenle saha muhendisi, fiziki imalat ile evrak zincirini ayni anda tamamlamalidir.`,
      "Ozellikle teknik disiplinler arasinda baglantili kalan kalemlerde as-built kaydi, son fotograf, test sonucu, revizyon notu ve eksik listesi ayni klasorde toplanmalidir. Bu paket olmadan sonradan cikacak ariza veya kullanici geri bildirimi doğru kaynaga baglanamaz.",
      "Son kontrol akisini su duzende yonetmek pratikte ise yarar:",
      ordered([
        "Fiziki imalatin bitis durumunu mahal veya aks bazinda teyit et.",
        "Gizli kalmis detaylarin fotograf, ölçü veya test kayitlarini dosyaya bagla.",
        "Baglantili disiplinlerle capraz kontrol turu yap ve acik noktayi tek listede topla.",
        "Son kullanici veya isletme tarafini etkileyecek noktalari etiket, plan veya not ile görünür hale getir.",
        "Kalan eksikleri sorumlu, tarih ve mahal bilgisiyle kapat.",
        "Nihai teslimde standart ve kaynak zincirini evrak setine not dus.",
      ]),
      table(
        ["Teslim kalemi", "Neden gerekir", "Kimin isine yarar"],
        [
          ["As-built ve revizyon notu", "Sahadaki son durumun kaydi", "Teknik ofis ve bakim ekibi"],
          ["Fotograf ve test tutanagi", "Gizli kalan detaylarin ispatlanmasi", "Denetim ve kontrol ekipleri"],
          ["Eksik listesi kapanis formu", "Acilan kusurlarin takibi", "Şantiye sefi ve isveren temsilcisi"],
          ["Kaynak referans notu", `${sourceList.join(", ") || "Resmi ve teknik referanslar"} ile bag kurmak`, "Sonraki teknik kararlar"],
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
