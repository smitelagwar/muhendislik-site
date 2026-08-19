import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_FRAME_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1995_SOURCE: BinaGuideSource = {
  title: "TS EN 1995-1-1 Eurocode 5 - Ahşap Yapilarin Tasarımı",
  shortCode: "TS EN 1995-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Ahşap çatı elemanlari, bağlantı detaylari ve servis kosullari için temel teknik referanslardan biridir.",
};

const COLUMN_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Kolon donatı acilimi ve düğüm buyutme paftası", purpose: "Boyuna donatı, etriye ve bindirme mantigini sahada okunur hale getirmek." },
  { category: "Kontrol", name: "Etriye bolgesi ve bindirme checklisti", purpose: "Uc bölge, orta bölge ve paspayı kontrollerini standardize etmek." },
  { category: "Ölçüm", name: "Paspayı mastari, metre ve foto kayıt formu", purpose: "Kalıp kapanmadan önce kritik detaylari sayisal ve görsel kayda almak." },
  { category: "Koordinasyon", name: "Kiriş-kolon düğüm kontrol listesi", purpose: "Beton gecisi ve donatı sikismasi riskini önceden görmek." },
];

const COLUMN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Donatı", name: "Boyuna cubuklar, etriye ve çiroz setleri", purpose: "Kolonun deprem altindaki sargilama ve tasima davranisini kurmak.", phase: "Montaj" },
  { group: "Kontrol", name: "Spacer, paspayı takozu ve sabitleme ekipmani", purpose: "Ortu ve kesit geometri disiplinini korumak.", phase: "Kalıp öncesi" },
  { group: "Kayıt", name: "Dugum foto arşivi ve ölçü formu", purpose: "Kapali kalacak kolon detaylarini kalite ve denetim için belgelendirmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Kiriş düğüm ve filiz devam detaylari", purpose: "Kolonun üst ve alt elemanlarla iliskisini tasarimdaki mantikta tutmak.", phase: "Birleşim" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Çatı geometri plani, mahya-dere kesiti ve cihaz yerlesim paftası", purpose: "Taşıyıcı kurgu ile tahliye ve ekipman kararlarini tek duzende toplamak." },
  { category: "Ölçüm", name: "Lazer nivo, aci olcer ve hat ipi", purpose: "Egim, kot ve duzlem surekliligini sahada sayisal hale getirmek." },
  { category: "Kontrol", name: "Bağlantı ve tahliye checklisti", purpose: "Makas, asik, ankraj ve su yonu kararlarini aynı turda denetlemek." },
  { category: "Kayıt", name: "Numune düğüm ve çatı kabul formu", purpose: "Kaplama öncesi son karkas durumunu belgelemek." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Makas, mertek, asik ve ikincil taşıyıcı aileleri", purpose: "Çatı geometrisini ve üst yük aktarimini kurmak.", phase: "Karkas montaji" },
  { group: "Bağlantı", name: "Ankraj, civata, saplama ve bağlantı elemanlari", purpose: "Rüzgar ve servis yukleri altinda düğüm guvenligini saglamak.", phase: "Birleşim" },
  { group: "Tahliye", name: "Mahya, dere, su inis ve geçiş detaylari", purpose: "Kaplama öncesi suyun yonunu ve geçiş lojigini belirlemek.", phase: "Geometri kilidi" },
  { group: "Güvenlik", name: "Iskele, platform ve yasam hatti", purpose: "Egimli yuzeyde güvenli montaj ve kontrol saglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatFrameDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kolon-donati",
    kind: "topic",
    quote: "Kolon donatısı, kesite sigan demir düzeni değil; deprem aninda kolonun sargilama, tasima ve süneklik kapasitesini gercege donduren saha imalatidir.",
    tip: "Kolon donatisinda en kritik kayip, cubuk adedinden önce etriye bolgesi, bindirme yigilmasi ve beton gecisinin birlikte okunmamasidir.",
    intro: [
      "Kolon donatısı, betonarme yapının en kritik saha imalatlarindan biridir. Bunun nedeni kolonun sadece düşey yük tasimasi değil, deprem etkisi altinda kiriş ve perde sistemleriyle birlikte yapının genel davranisini belirlemesidir. Bu nedenle kolon sahada yalnızca boyuna demir dizisi olarak değil, etriye sargilamasi, bindirme düzeni, filiz sürekliliği ve düğüm bolgesi davranisiyla birlikte okunmalidir.",
      "Sahada kolon donatisini zorlastiran temel konu, çok sayida kritik detayin dar bir kesitte toplanmasidir. Boyuna cubuklar, etriye araliklari, kanca yonleri, çirozlar, kiriş dugumleri, ek boylari ve paspayı aynı anda yonetilir. Bu yoğunluk proje mantigiyla okunmazsa kesit kagit üzerinde doğru, sahada ise beton gecisinin zayif oldugu bir kitleye donusebilir.",
      "Bir inşaat mühendisi için kolon donatisini anlamak, sadece paftadaki `8phi16` ifadesini okumak degildir. Hangi bolgede neden sık etriye isteniyor, hangi ek bolgesi neden kritik, niye aynı kesitte çok sayida bindirme toplanmamali ve spacer neden dekoratif değil yapisal bir kalite araci sayiliyor; bu sorularin cevabini sahada görmek gerekir.",
      "Bu yazida kolon donatisini uzun-form teknik içerik standardinda ele aliyor; teorik davranistan saha ipuclarina, sayisal kesit okumasindan sık yapilan hatalara kadar inşaat muhendisinin sahada uygulayabilecegi bir kontrol mantigi kuruyoruz.",
    ],
    theory: [
      "Kolonlarda boyuna donatı eksenel kuvvet ve moment etkilerini tasirken, etriyeler beton cekirdegini sarar, boyuna cubuklarin burkulmasini geciktirir ve kesme davranisina katkida bulunur. Deprem etkisi altinda bu sargilama davranisi kritik hale gelir; cunku kolonun sünek kalmasi, yalnız boyuna alanin yeterli olmasina değil, enine donatı disiplininin de sahada eksiksiz kurulmasina baglidir.",
      "TBDY 2018 ve TS 500 mantiginda kolon dugumleri ve uc bolgeler, orta bolgeden farkli hassasiyet tasir. Uc bolgelerde sık etriye uygulanmasinin nedeni sadece yerel dayanımı artirmak değil, plastik sekil degistirme beklentisi altinda beton cekirdegini bir arada tutmaktir. Bu nedenle sahada en çok hata yapilan alan da genellikle burasidir; orta bölge mantigi uc bolgeye tasininca deprem davranisi sessizce zayiflar.",
      "Bindirme konusu da kolonlarda hayati onemdedir. Kesitte zaten sinirli olan boşluk, aynı seviyede çok sayida ek boyunun toplanmasiyla daha da zorlanir. Bu durumda vibrator erisimi ve beton gecisi bozulabilir. Dolayisiyla kolon donatisinda `kesite sigiyor mu` sorusu tek basina yeterli degildir; `beton sağlıklı sekilde gecebilir mi` sorusu aynı derecede önemlidir.",
      "Paspayı ve sabitleme elemanlari da kolon kalitesinin ayrilmaz parcasidir. Donatı kaliba temas ediyor, takozlar kaymis veya cubuklar kalıp kapanirken yer degistiriyorsa kesitin gercek davranisi projeden uzaklasir. Bu nedenle kolon donatısı, beton gelmeden önce tamamlanan değil; beton öncesi son turda tekrar tekrar okunan bir kalite kalemidir.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve tasarim alt sinirlari",
        limitOrRequirement: "Kolon beton sinifi ve boyuna donatı düzeni TBDY 2018 ve TS 500 ile uyumlu olmalidir",
        reference: "TBDY 2018, Bölüm 7 + TS 500",
        note: "Kolon deprem davranisinda alt sinirlarin altinda yorumlanamaz.",
      },
      {
        parameter: "Uc bölge sargilamasi",
        limitOrRequirement: "Uc bolgelerde etriye araligi, kanca detayi ve çiroz düzeni proje mantigina göre eksiksiz uygulanmalidir",
        reference: "TBDY 2018, Bölüm 7",
        note: "Suneiklik sahada en çok bu bolgede kaybedilir.",
      },
      {
        parameter: "Bindirme ve düğüm yoğunluğu",
        limitOrRequirement: "Ek bolgeleri aynı kesitte asiri yigilmaya neden olmamali, beton gecisi kontrol edilmelidir",
        reference: "TS 500",
        note: "Kesit icinde betona yer birakmayan düzen kalite sorunudur.",
      },
      {
        parameter: "Paspayı ve geometri",
        limitOrRequirement: "Ortu betonu butun yuzlerde spacer ve takoz sistemiyle korunmalidir",
        reference: "TS 500 + saha kalite plani",
        note: "Ortu, yalnız cizimde değil fiziksel sabitlemeyle gerceklesir.",
      },
    ],
    designOrApplicationSteps: [
      "Paftayi boyuna donatı adedi olarak değil, uc bölge, orta bölge, bindirme ve düğüm mantigi olarak oku.",
      "Kesme-bukme sonrasi boyuna cubuklarin ve etriyelerin kesitte nasil yerlesecegini numune kolonla prova et.",
      "Uc bölge sıklaştırma boylarini sahada renk veya etiketle belirginlestir; usta hafizasina birakma.",
      "Bindirme yerlerini aynı kotta yigilmaya zorlamadan, proje mantigina uygun dagit ve düğüm yogunlugunu kontrol et.",
      "Kalıp kapanmadan önce paspayı, etriye kapanisi, kanca yonu ve beton gecisini foto-kayitla denetle.",
      "Beton öncesi son turda kiriş düğümü ile kolon kesitini birlikte okuyup vibrasyon erisimini sorgula.",
    ],
    criticalChecks: [
      "Uc bölge ve orta bölge etriye araliklari sahada karismis mi?",
      "Kanca yonleri ve çirozlar sargilama mantigini gercekten tamamliyor mu?",
      "Bindirme düzeni aynı kesitte yigilmaya neden oluyor mu?",
      "Kiriş-kolon dugumunde beton gecisini zorlayacak sikisiklik var mi?",
      "Takoz ve spacer butun yuzlerde aktif olarak calisiyor mu?",
      "Beton öncesi kolon kesiti ve düğüm foto-kaydı alindi mi?",
    ],
    numericalExample: {
      title: "40 x 60 cm kolonda donatı yoğunluğu ve beton gecisi yorumu",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Tipik orta buyuklukte betonarme kolon" },
        { label: "Boyuna donatı", value: "8phi16", note: "Ornek saha verisi" },
        { label: "Uc bölge", value: "Sık etriye", note: "Deprem davranisi için kritik bölge" },
        { label: "Amac", value: "Suneiklik ve beton yerlesmesini birlikte korumak", note: "Saha kalite yorumu" },
      ],
      assumptions: [
        "Kesin aralik ve boylar paftadan teyit edilmektedir.",
        "Kiriş düğümü acik gorunmektedir ve beton öncesi kontrol imkani vardir.",
        "Paspayı elemanlari standart sekilde uygulanmistir.",
      ],
      steps: [
        {
          title: "Kesit icindeki donatı yogunlugunu oku",
          result: "8phi16 boyuna donatı ilk bakista makul gorunse de etriye, çiroz ve bindirme ile birlikte okunmadikca gercek saha yoğunluğu anlasilmaz.",
          note: "Asil soru demirin sigmasi değil, betonun sağlıklı gecip gecememesidir.",
        },
        {
          title: "Uc bolgeyi ayri denetle",
          result: "Uc bolgede sık etriye uygulamasi, orta bolgeden ayri foto ve ölçü ile kontrol edilmelidir.",
          note: "Deprem davranisinda en buyuk kayip genelde bu ayrimin sahada silinmesidir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Kolon donatisinda yeterli alan kadar, sargilama davranisini ve beton gecisini koruyan detay disiplini de esastir.",
          note: "Kolonun sahadaki kalitesi kesit hesap raporundan önce bu okumayla anlasilir.",
        },
      ],
      checks: [
        "Uc bölge ile orta bölge aynı aralik mantigiyla yurutulmemelidir.",
        "Bindirme ve paspayı aynı anda dogrulanmadan kabul verilmemelidir.",
        "Dugum bolgesi beton gecisi montaj tamamlandiktan sonra tekrar düşünülmelidir.",
        "Foto kaydı ve ölçü turu, beton gelmeden önce tamamlanmalidir.",
      ],
      engineeringComment: "Kolon donatisinda kalite, demirin coklugundan önce deprem davranisini saglayan detaylarin eksiksiz kurulmasinda yatar.",
    },
    tools: COLUMN_TOOLS,
    equipmentAndMaterials: COLUMN_EQUIPMENT,
    mistakes: [
      { wrong: "Uc bölge etriye mantigini orta bölge mantigiyla gevsetmek.", correct: "Deprem kritik bolgeleri paftadaki boy ve araliklarla aynen uygulamak." },
      { wrong: "Bindirmeleri sahada hangi cubuk denk gelirse orada toplamak.", correct: "Ek bolgelerini yigilmaya neden olmayacak sekilde dagitmak." },
      { wrong: "Pas payini kalıp kapaninca kendiliginden olusur varsaymak.", correct: "Takoz ve spacer ile aktif olarak sabitlemek." },
      { wrong: "Kiriş-kolon dugumunu beton ekibi çözer diye birakmak.", correct: "Montaj asamasinda beton gecisini ve vibrasyon erisimini birlikte degerlendirmek." },
      { wrong: "Kanca yonlerini usta aliskanligina birakmak.", correct: "Projede istenen kapanis mantigini sahada birebir takip etmek." },
      { wrong: "Beton öncesi kolon detayini kayitsiz kabul etmek.", correct: "Ölçü, foto ve checklist ile beton öncesi son turu zorunlu hale getirmek." },
    ],
    designVsField: [
      "Tasarimda kolon donatısı birkaç kesit ve not ile görünür; sahada ise sunekligin gercekte kurulup kurulmadigi etriye, bindirme ve paspayı detayinda ortaya çıkar.",
      "Kolon, deprem guvenliginin sahadaki en net sinavlarindan biridir; bu yuzden toleranssiz gorunen detaylar burada daha da önem kazanir.",
      "Iyi kolon donatısı, paftayi ezbere uygulayan değil, kesitin neden o sekilde istendigini anlayan saha kulturu ile uretilir.",
    ],
    conclusion: [
      "Kolon donatısı, betonarme sistemin sahadaki en kritik kalite halkalarindan biridir. Boyuna donatı, etriye, bindirme ve paspayı zinciri doğru kurulursa proje davranisi sahaya tasinir; zincir bozulursa hata beton altinda gizlenir.",
      "Bir inşaat mühendisi için doğru yaklasim, kolonu yalnızca demir metraj kalemi değil, deprem davranisinin sahada yazildigi ana eleman olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["kolon donatı", "etriye sıklaştırma", "TBDY 2018", "TS 500", "düğüm bolgesi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti",
    kind: "topic",
    quote: "Çatı iskeleti, üst kaplamanin altinda kaybolan bir karkas değil; suyun yonunu, ekipman lojigini ve üst kabugun omrunu belirleyen ana geometri sistemidir.",
    tip: "Çatı geometri sini sadece egim sayisi olarak okumak, mahya-dere davranisi, bağlantı güvenliği ve sonraki kaplama omrunu aynı anda riske atar.",
    intro: [
      "Çatı iskeleti, ahşap veya metal taşıyıcı ailelerle üst yapının son buyuk geometrik kararini kuran asamadir. Kaplama, yalitim ve su yalitim katmanlari daha sonra bu karkasin uzerine oturur. Bu nedenle karkastaki her aks sapmasi, her bağlantı zafiyeti ve her ters egim riski sonraki tüm çatı katmanlarina yayilir.",
      "Sahada çatı iskeleti cogu zaman kaplama öncesi ara faz gibi gorulur; oysa gercekte suyla ilk ciddi teknik mucadelenin basladigi yer burasidir. Mahya, dere, asik, mertek, makas, ankraj, cihaz ayaklari ve baca gecisleri birlikte dusunulmezse kaplama ne kadar kaliteli olursa olsun sorunlarin tohumu bu asamada atilir.",
      "Bir inşaat mühendisi için çatı iskeletini anlamak, sadece aciklik ve egim hesabini bilmek değil; kaplama sistemiyle uyumlu taşıyıcı ritmi, rüzgar altindaki bağlantı ihtiyaci, bakım erisimi ve sonradan gelecek cihaz gecislerini de görmek anlamina gelir. Çatı uzerindeki en pahali su sizintisi ve bakım problemi, cogu kez iskelet asamasinda eksik dusunulmus bir detaydan dogar.",
      "Bu yazida çatı iskeletini blog standardina uygun bicimde; geometri, taşıyıcı düzen, su yonu, saha kontrol noktasi, sayisal egim yorumu ve uygulamada en sık yapilan hatalarla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Çatı iskeleti iki ana gorev tasir: yukleri güvenli sekilde ana taşıyıcı sisteme aktarmak ve üst katmanlar için doğru geometriyi uretmek. Bu iki gorev birbirinden bağımsız degildir. Taşıyıcı aile kaplama tipine uygun aralikta kurulmazsa yüzey dalgalanir; geometri tahliyeye uygun degilse su detay dugumlerinde toplanir. Dolayisiyla çatı karkasi, taşıyıcı mühendislik ile yapı fiziginin kesistigi alandir.",
      "Su yonu çatı muhendisliginin merkezi kavramidir. Tek egimli, cift egimli veya düşük egimli sistemlerde bile suyun en kısa ve en güvenli yoldan tahliye noktasina gitmesi hedeflenir. Bu nedenle sadece başlangıç ve bitis kotunu doğru kurmak yetmez; ara hatlarin da burulma ve dalga uretmeyecek sekilde doğru duzlemde kalmasi gerekir. Küçük bir lokal ters egim, uzun vadede kaplama detayini zorlar.",
      "Bağlantı güvenliği ikinci buyuk eksendir. Hafif gorunen çatı sistemlerinde rüzgar emmesi, servis yukleri ve bakım trafigi bağlantı noktalarinda yogunlasir. Makas, mertek, asik ve ankraj detaylari bu nedenle yalnız montaj kolayligi ile değil, tekrar edilebilir teknik bir düğüm mantigi ile kurulmalidir. Bağlantı disiplini zayifsa kaplama alti sistem sessizce gevser.",
      "Ayrıca çatı iskeleti, baca, su inis, gunes paneli, klima ayagi veya menfez gibi sonradan gelecek tüm ogeler için rezerv uretmelidir. Bu rezervler basta cozulmediginde ekipler sonradan karkasi keser, deler veya lokal yama yapar. Bu da geometriyi ve su yalitim mantigini bozar. Iyi çatı, gelecek mudahaleyi de önceden dusunen catidir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Çatı kaplamasi ve tahliye sistemi ile uyumlu sürekli geometri kurulmalidir",
        reference: "TS 825 + uygulama detaylari",
        note: "Egim karari kaplamadan bağımsız dusunulemez.",
      },
      {
        parameter: "Taşıyıcı ritim ve bağlantı",
        limitOrRequirement: "Makas, asik, mertek ve bağlantı araliklari secilen sistemle uyumlu olmali ve tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1 + proje paftası",
        note: "Rüzgar etkisi hafif sistemlerde bağlantı kalitesini on plana cikarir.",
      },
      {
        parameter: "Tahliye ve gecisler",
        limitOrRequirement: "Mahya, dere, su inis ve cihaz gecisleri karkas asamasinda geometriye dahil edilmelidir",
        reference: "Çatı detay paftası",
        note: "Sonradan acilan gecisler su riski uretir.",
      },
      {
        parameter: "Bakım güvenliği",
        limitOrRequirement: "Çatı ustu cihaz ve bakım rotalari güvenli erişim mantigi ile planlanmalidir",
        reference: "Saha güvenliği + isletme plani",
        note: "Bakım erisimi dusunulmeyen çatı, sonradan zorlayici mudahale ister.",
      },
    ],
    designOrApplicationSteps: [
      "Kaplama tipi, tahliye noktasi ve cihaz yerlesimlerini netlestirip çatı geometri sini onlara göre kür.",
      "Makas, asik ve ikincil taşıyıcı ritmi için numune aks olustur; tüm çatıda aynı duzlem mantigini koru.",
      "Mahya, dere ve en düşük kotlari lazer nivo ile baslangictan itibaren takip et; göz karariyla duzlem kabul etme.",
      "Baca, gunes paneli, klima ayagi ve benzeri gecisleri karkas asamasinda rezerve et; sonradan kesme ihtiyaci yaratma.",
      "Ankraj ve bağlantı dugumlerini numune detay uzerinden teyit edip sonra seri uygulamaya gec.",
      "Kaplama öncesi son turda geometri, bağlantı, tahliye ve bakım rotalarini aynı checklist ile denetle.",
    ],
    criticalChecks: [
      "Gercek çatı egimi tahliye noktasina kesintisiz yonleniyor mu?",
      "Makas, asik ve bağlantı ritmi proje mantigiyla uyumlu mu?",
      "Mahya ve dere hatlarinda burulma veya dalga var mi?",
      "Baca, menfez ve cihaz gecisleri sonradan yama gerektirecek durumda mi?",
      "Ankraj ve bağlantı detaylari her dugumde tekrar edilebilir kaliteyle kurulmus mu?",
      "Bakım veya servis için güvenli yol ve platform mantigi var mi?",
    ],
    numericalExample: {
      title: "12 m çatıda %3 egim için kot farki ve ara hat yorumu",
      inputs: [
        { label: "Yatay çatı boyu", value: "12 m", note: "Tek yone su toplayan hat" },
        { label: "Hedef egim", value: "%3", note: "Ornek saha ve kaplama uyum degeri" },
        { label: "Tahliye noktasi", value: "Tek dere ve inis", note: "En düşük kot" },
        { label: "Amac", value: "Gollenmesiz geometri kurmak", note: "Kaplama öncesi karkas kontrolü" },
      ],
      assumptions: [
        "Kaplama sistemi bu egim araligiyla uyumludur.",
        "Ara taşıyıcı hatlar aynı duzlemde kurulacaktir.",
        "Tahliye noktasi ve gecisler paftada sabittir.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "12 x 0,03 = 0,36 m",
          result: "Tahliye noktasina doğru en az 36 cm kot farki gerekir.",
          note: "Bu deger, çatı iskeletinin sadece aciklik değil geometri problemi oldugunu gosterir.",
        },
        {
          title: "Ara hat riskini yorumla",
          result: "36 cm teorik fark saglansa bile ara asik hatlarinda dalga veya lokal ters egim varsa su cebi yine olusabilir.",
          note: "Sadece bas ve son kötü dogrulamak yeterli degildir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Çatı iskeletinde basari, hesaplanan egimin tüm yüzey boyunca sürekli ve bağlantı acisindan stabil sekilde korunmasidir.",
          note: "Kaplama omru önce karkas duzleminde kazanilir veya kaybedilir.",
        },
      ],
      checks: [
        "Egim sahada başlangıç ve bitis noktasi ile sinirli değil, ara hatlarda da kontrol edilmelidir.",
        "Tahliye noktasi geometriye sonradan uydurulmamalidir.",
        "Bağlantı kalitesi ve geometri birlikte denetlenmelidir.",
        "Kaplama öncesi tespit edilen lokal cokme veya ters egim mutlaka duzeltilmelidir.",
      ],
      engineeringComment: "Çatı iskeletinde su riski genelde santimetrelerle değil, o santimetrelerin tüm hat boyunca korunup korunmamasi ile belirlenir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Egim kararini yalnız teorik sayi olarak görmek.", correct: "Ara hat ve tahliye noktasi ile birlikte sürekli geometri olarak denetlemek." },
      { wrong: "Bağlantı dugumlerini usta refleksine birakmak.", correct: "Numune detay ve tekrar edilebilir teknik bağlantı mantigi kurmak." },
      { wrong: "Baca ve cihaz gecislerini kaplama asamasinda cozmeyi dusunmek.", correct: "Karkas asamasinda rezerv ve detaylarini netlestirmek." },
      { wrong: "Sadece başlangıç ve bitis kotlarini dogrulamak.", correct: "Tüm çatı duzlemini lazer ve ara hat kontrolü ile okumak." },
      { wrong: "Bakım erisimini proje disi konu saymak.", correct: "Catiyi isletme ve servis rotasi ile birlikte dusunmek." },
      { wrong: "Kaplama altindaki dalgalanmayi onemsiz görmek.", correct: "Kaplama omrunun karkas duzlemine bagli oldugunu kabul etmek." },
    ],
    designVsField: [
      "Projede çatı iskeleti cogu zaman cizgi ve aci olarak görünür; sahada ise suyu, ruzgari ve bakimi yoneten fiziksel geometriye donusur.",
      "Kaplama altinda kalacagi için gözden kacmasi kolaydir; ama çatı sorunlarinin buyuk kismi ilk olarak bu görünmez karkasta başlar.",
      "Iyi çatı iskeleti, yalnız tasiyan değil aynı zamanda suyu doğru yone goturen ve sonraki imalatlara net duzlem veren iskelettir.",
    ],
    conclusion: [
      "Çatı iskeleti, üst kabugun hem taşıyıcı hem geometrik temelidir. Geometri, bağlantı ve tahliye kararlarini birlikte cozen bir saha yaklasimi olmadan uzun omurlu çatı performansi beklenemez.",
      "Bir inşaat mühendisi için doğru bakis, çatı karkasini ara imalat değil su, geometri ve isletme performansinin ana karari olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["çatı iskeleti", "egim", "mahya", "tahliye", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti/ahsap-cati", "ince-isler/cati-kaplamasi/membran-cati"],
  },
];
