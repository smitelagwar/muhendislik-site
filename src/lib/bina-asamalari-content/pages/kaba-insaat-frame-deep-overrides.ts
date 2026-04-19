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
  { category: "Proje", name: "Kolon donati acilimi ve dugum buyutme paftasi", purpose: "Boyuna donati, etriye ve bindirme mantigini sahada okunur hale getirmek." },
  { category: "Kontrol", name: "Etriye bolgesi ve bindirme checklisti", purpose: "Uc bölge, orta bölge ve pas payi kontrollerini standardize etmek." },
  { category: "Ölçüm", name: "Pas payi mastari, metre ve foto kayıt formu", purpose: "Kalip kapanmadan once kritik detaylari sayisal ve görsel kayda almak." },
  { category: "Koordinasyon", name: "Kiris-kolon dugum kontrol listesi", purpose: "Beton gecisi ve donati sikismasi riskini önceden gormek." },
];

const COLUMN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Donati", name: "Boyuna cubuklar, etriye ve ciroz setleri", purpose: "Kolonun deprem altindaki sargilama ve tasima davranisini kurmak.", phase: "Montaj" },
  { group: "Kontrol", name: "Spacer, pas payi takozu ve sabitleme ekipmani", purpose: "Ortu ve kesit geometri disiplinini korumak.", phase: "Kalip öncesi" },
  { group: "Kayıt", name: "Dugum foto arşivi ve ölçü formu", purpose: "Kapali kalacak kolon detaylarini kalite ve denetim için belgelendirmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Kiris dugum ve filiz devam detaylari", purpose: "Kolonun üst ve alt elemanlarla iliskisini tasarimdaki mantikta tutmak.", phase: "Birlesim" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Çatı geometri plani, mahya-dere kesiti ve cihaz yerlesim paftasi", purpose: "Taşıyıcı kurgu ile tahliye ve ekipman kararlarini tek duzende toplamak." },
  { category: "Ölçüm", name: "Lazer nivo, aci olcer ve hat ipi", purpose: "Egim, kot ve duzlem surekliligini sahada sayisal hale getirmek." },
  { category: "Kontrol", name: "Bağlantı ve tahliye checklisti", purpose: "Makas, asik, ankraj ve su yonu kararlarini aynı turda denetlemek." },
  { category: "Kayıt", name: "Numune dugum ve çatı kabul formu", purpose: "Kaplama öncesi son karkas durumunu belgelemek." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Makas, mertek, asik ve ikincil taşıyıcı aileleri", purpose: "Çatı geometrisini ve üst yuk aktarimini kurmak.", phase: "Karkas montaji" },
  { group: "Bağlantı", name: "Ankraj, civata, saplama ve bağlantı elemanlari", purpose: "Rüzgar ve servis yukleri altinda dugum guvenligini saglamak.", phase: "Birlesim" },
  { group: "Tahliye", name: "Mahya, dere, su inis ve geçiş detaylari", purpose: "Kaplama öncesi suyun yonunu ve geçiş lojigini belirlemek.", phase: "Geometri kilidi" },
  { group: "Güvenlik", name: "Iskele, platform ve yasam hatti", purpose: "Egimli yuzeyde guvenli montaj ve kontrol saglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatFrameDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kolon-donati",
    kind: "topic",
    quote: "Kolon donatisi, kesite sigan demir duzeni degil; deprem aninda kolonun sargilama, tasima ve suneklik kapasitesini gercege donduren saha imalatidir.",
    tip: "Kolon donatisinda en kritik kayip, cubuk adedinden once etriye bolgesi, bindirme yigilmasi ve beton gecisinin birlikte okunmamasidir.",
    intro: [
      "Kolon donatisi, betonarme yapinin en kritik saha imalatlarindan biridir. Bunun nedeni kolonun sadece düşey yuk tasimasi degil, deprem etkisi altinda kiris ve perde sistemleriyle birlikte yapinin genel davranisini belirlemesidir. Bu nedenle kolon sahada yalnizca boyuna demir dizisi olarak degil, etriye sargilamasi, bindirme duzeni, filiz surekliligi ve dugum bolgesi davranisiyla birlikte okunmalidir.",
      "Sahada kolon donatisini zorlastiran temel konu, çok sayida kritik detayin dar bir kesitte toplanmasidir. Boyuna cubuklar, etriye araliklari, kanca yonleri, cirozlar, kiris dugumleri, ek boylari ve pas payi aynı anda yonetilir. Bu yogunluk proje mantigiyla okunmazsa kesit kagit üzerinde doğru, sahada ise beton gecisinin zayif oldugu bir kitleye donusebilir.",
      "Bir insaat muhendisi için kolon donatisini anlamak, sadece paftadaki `8phi16` ifadesini okumak degildir. Hangi bolgede neden sık etriye isteniyor, hangi ek bolgesi neden kritik, niye aynı kesitte çok sayida bindirme toplanmamali ve spacer neden dekoratif degil yapisal bir kalite araci sayiliyor; bu sorularin cevabini sahada gormek gerekir.",
      "Bu yazida kolon donatisini uzun-form teknik içerik standardinda ele aliyor; teorik davranistan saha ipuclarina, sayisal kesit okumasindan sık yapilan hatalara kadar insaat muhendisinin sahada uygulayabilecegi bir kontrol mantigi kuruyoruz.",
    ],
    theory: [
      "Kolonlarda boyuna donati eksenel kuvvet ve moment etkilerini tasirken, etriyeler beton cekirdegini sarar, boyuna cubuklarin burkulmasini geciktirir ve kesme davranisina katkida bulunur. Deprem etkisi altinda bu sargilama davranisi kritik hale gelir; cunku kolonun sunek kalmasi, yalnız boyuna alanin yeterli olmasina degil, enine donati disiplininin de sahada eksiksiz kurulmasina baglidir.",
      "TBDY 2018 ve TS 500 mantiginda kolon dugumleri ve uc bolgeler, orta bolgeden farkli hassasiyet tasir. Uc bolgelerde sık etriye uygulanmasinin nedeni sadece yerel dayanimi artirmak degil, plastik sekil degistirme beklentisi altinda beton cekirdegini bir arada tutmaktir. Bu nedenle sahada en çok hata yapilan alan da genellikle burasidir; orta bölge mantigi uc bolgeye tasininca deprem davranisi sessizce zayiflar.",
      "Bindirme konusu da kolonlarda hayati onemdedir. Kesitte zaten sinirli olan bosluk, aynı seviyede çok sayida ek boyunun toplanmasiyla daha da zorlanir. Bu durumda vibrator erisimi ve beton gecisi bozulabilir. Dolayisiyla kolon donatisinda `kesite sigiyor mu` sorusu tek basina yeterli degildir; `beton saglikli sekilde gecebilir mi` sorusu aynı derecede onemlidir.",
      "Pas payi ve sabitleme elemanlari da kolon kalitesinin ayrilmaz parcasidir. Donati kaliba temas ediyor, takozlar kaymis veya cubuklar kalip kapanirken yer degistiriyorsa kesitin gercek davranisi projeden uzaklasir. Bu nedenle kolon donatisi, beton gelmeden once tamamlanan degil; beton öncesi son turda tekrar tekrar okunan bir kalite kalemidir.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve tasarim alt sinirlari",
        limitOrRequirement: "Kolon beton sinifi ve boyuna donati duzeni TBDY 2018 ve TS 500 ile uyumlu olmalidir",
        reference: "TBDY 2018, Bölüm 7 + TS 500",
        note: "Kolon deprem davranisinda alt sinirlarin altinda yorumlanamaz.",
      },
      {
        parameter: "Uc bölge sargilamasi",
        limitOrRequirement: "Uc bolgelerde etriye araligi, kanca detayi ve ciroz duzeni proje mantigina göre eksiksiz uygulanmalidir",
        reference: "TBDY 2018, Bölüm 7",
        note: "Suneiklik sahada en çok bu bolgede kaybedilir.",
      },
      {
        parameter: "Bindirme ve dugum yogunlugu",
        limitOrRequirement: "Ek bolgeleri aynı kesitte asiri yigilmaya neden olmamali, beton gecisi kontrol edilmelidir",
        reference: "TS 500",
        note: "Kesit icinde betona yer birakmayan duzen kalite sorunudur.",
      },
      {
        parameter: "Pas payi ve geometri",
        limitOrRequirement: "Ortu betonu butun yuzlerde spacer ve takoz sistemiyle korunmalidir",
        reference: "TS 500 + saha kalite plani",
        note: "Ortu, yalnız cizimde degil fiziksel sabitlemeyle gerceklesir.",
      },
    ],
    designOrApplicationSteps: [
      "Paftayi boyuna donati adedi olarak degil, uc bölge, orta bölge, bindirme ve dugum mantigi olarak oku.",
      "Kesme-bukme sonrasi boyuna cubuklarin ve etriyelerin kesitte nasil yerlesecegini numune kolonla prova et.",
      "Uc bölge siklastirma boylarini sahada renk veya etiketle belirginlestir; usta hafizasina birakma.",
      "Bindirme yerlerini aynı kotta yigilmaya zorlamadan, proje mantigina uygun dagit ve dugum yogunlugunu kontrol et.",
      "Kalip kapanmadan once pas payi, etriye kapanisi, kanca yonu ve beton gecisini foto-kayitla denetle.",
      "Beton öncesi son turda kiris dugumu ile kolon kesitini birlikte okuyup vibrasyon erisimini sorgula.",
    ],
    criticalChecks: [
      "Uc bölge ve orta bölge etriye araliklari sahada karismis mi?",
      "Kanca yonleri ve cirozlar sargilama mantigini gercekten tamamliyor mu?",
      "Bindirme duzeni aynı kesitte yigilmaya neden oluyor mu?",
      "Kiris-kolon dugumunde beton gecisini zorlayacak sikisiklik var mi?",
      "Takoz ve spacer butun yuzlerde aktif olarak calisiyor mu?",
      "Beton öncesi kolon kesiti ve dugum foto-kaydi alindi mi?",
    ],
    numericalExample: {
      title: "40 x 60 cm kolonda donati yogunlugu ve beton gecisi yorumu",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Tipik orta buyuklukte betonarme kolon" },
        { label: "Boyuna donati", value: "8phi16", note: "Ornek saha verisi" },
        { label: "Uc bölge", value: "Sık etriye", note: "Deprem davranisi için kritik bölge" },
        { label: "Amac", value: "Suneiklik ve beton yerlesmesini birlikte korumak", note: "Saha kalite yorumu" },
      ],
      assumptions: [
        "Kesin aralik ve boylar paftadan teyit edilmektedir.",
        "Kiris dugumu acik gorunmektedir ve beton öncesi kontrol imkani vardir.",
        "Pas payi elemanlari standart sekilde uygulanmistir.",
      ],
      steps: [
        {
          title: "Kesit icindeki donati yogunlugunu oku",
          result: "8phi16 boyuna donati ilk bakista makul gorunse de etriye, ciroz ve bindirme ile birlikte okunmadikca gercek saha yogunlugu anlasilmaz.",
          note: "Asil soru demirin sigmasi degil, betonun saglikli gecip gecememesidir.",
        },
        {
          title: "Uc bolgeyi ayri denetle",
          result: "Uc bolgede sık etriye uygulamasi, orta bolgeden ayri foto ve ölçü ile kontrol edilmelidir.",
          note: "Deprem davranisinda en buyuk kayip genelde bu ayrimin sahada silinmesidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kolon donatisinda yeterli alan kadar, sargilama davranisini ve beton gecisini koruyan detay disiplini de esastir.",
          note: "Kolonun sahadaki kalitesi kesit hesap raporundan once bu okumayla anlasilir.",
        },
      ],
      checks: [
        "Uc bölge ile orta bölge aynı aralik mantigiyla yurutulmemelidir.",
        "Bindirme ve pas payi aynı anda dogrulanmadan kabul verilmemelidir.",
        "Dugum bolgesi beton gecisi montaj tamamlandiktan sonra tekrar dusunulmelidir.",
        "Foto kaydi ve ölçü turu, beton gelmeden once tamamlanmalidir.",
      ],
      engineeringComment: "Kolon donatisinda kalite, demirin coklugundan once deprem davranisini saglayan detaylarin eksiksiz kurulmasinda yatar.",
    },
    tools: COLUMN_TOOLS,
    equipmentAndMaterials: COLUMN_EQUIPMENT,
    mistakes: [
      { wrong: "Uc bölge etriye mantigini orta bölge mantigiyla gevsetmek.", correct: "Deprem kritik bolgeleri paftadaki boy ve araliklarla aynen uygulamak." },
      { wrong: "Bindirmeleri sahada hangi cubuk denk gelirse orada toplamak.", correct: "Ek bolgelerini yigilmaya neden olmayacak sekilde dagitmak." },
      { wrong: "Pas payini kalip kapaninca kendiliginden olusur varsaymak.", correct: "Takoz ve spacer ile aktif olarak sabitlemek." },
      { wrong: "Kiris-kolon dugumunu beton ekibi cozer diye birakmak.", correct: "Montaj asamasinda beton gecisini ve vibrasyon erisimini birlikte degerlendirmek." },
      { wrong: "Kanca yonlerini usta aliskanligina birakmak.", correct: "Projede istenen kapanis mantigini sahada birebir takip etmek." },
      { wrong: "Beton öncesi kolon detayini kayitsiz kabul etmek.", correct: "Ölçü, foto ve checklist ile beton öncesi son turu zorunlu hale getirmek." },
    ],
    designVsField: [
      "Tasarimda kolon donatisi birkaç kesit ve not ile görünür; sahada ise sunekligin gercekte kurulup kurulmadigi etriye, bindirme ve pas payi detayinda ortaya cikar.",
      "Kolon, deprem guvenliginin sahadaki en net sinavlarindan biridir; bu yuzden toleranssiz gorunen detaylar burada daha da onem kazanir.",
      "Iyi kolon donatisi, paftayi ezbere uygulayan degil, kesitin neden o sekilde istendigini anlayan saha kulturu ile uretilir.",
    ],
    conclusion: [
      "Kolon donatisi, betonarme sistemin sahadaki en kritik kalite halkalarindan biridir. Boyuna donati, etriye, bindirme ve pas payi zinciri doğru kurulursa proje davranisi sahaya tasinir; zincir bozulursa hata beton altinda gizlenir.",
      "Bir insaat muhendisi için doğru yaklasim, kolonu yalnizca demir metraj kalemi degil, deprem davranisinin sahada yazildigi ana eleman olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["kolon donati", "etriye siklastirma", "TBDY 2018", "TS 500", "dugum bolgesi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti",
    kind: "topic",
    quote: "Çatı iskeleti, üst kaplamanin altinda kaybolan bir karkas degil; suyun yonunu, ekipman lojigini ve üst kabugun omrunu belirleyen ana geometri sistemidir.",
    tip: "Çatı geometri sini sadece egim sayisi olarak okumak, mahya-dere davranisi, bağlantı guvenligi ve sonraki kaplama omrunu aynı anda riske atar.",
    intro: [
      "Çatı iskeleti, ahşap veya metal taşıyıcı ailelerle üst yapinin son buyuk geometrik kararini kuran asamadir. Kaplama, yalitim ve su yalitim katmanlari daha sonra bu karkasin uzerine oturur. Bu nedenle karkastaki her aks sapmasi, her bağlantı zafiyeti ve her ters egim riski sonraki tüm çatı katmanlarina yayilir.",
      "Sahada çatı iskeleti cogu zaman kaplama öncesi ara faz gibi gorulur; oysa gercekte suyla ilk ciddi teknik mucadelenin basladigi yer burasidir. Mahya, dere, asik, mertek, makas, ankraj, cihaz ayaklari ve baca gecisleri birlikte dusunulmezse kaplama ne kadar kaliteli olursa olsun sorunlarin tohumu bu asamada atilir.",
      "Bir insaat muhendisi için çatı iskeletini anlamak, sadece aciklik ve egim hesabini bilmek degil; kaplama sistemiyle uyumlu taşıyıcı ritmi, rüzgar altindaki bağlantı ihtiyaci, bakım erisimi ve sonradan gelecek cihaz gecislerini de gormek anlamina gelir. Çatı uzerindeki en pahali su sizintisi ve bakım problemi, cogu kez iskelet asamasinda eksik dusunulmus bir detaydan dogar.",
      "Bu yazida çatı iskeletini blog standardina uygun bicimde; geometri, taşıyıcı duzen, su yonu, saha kontrol noktasi, sayisal egim yorumu ve uygulamada en sık yapilan hatalarla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Çatı iskeleti iki ana gorev tasir: yukleri guvenli sekilde ana taşıyıcı sisteme aktarmak ve üst katmanlar için doğru geometriyi uretmek. Bu iki gorev birbirinden bagimsiz degildir. Taşıyıcı aile kaplama tipine uygun aralikta kurulmazsa yüzey dalgalanir; geometri tahliyeye uygun degilse su detay dugumlerinde toplanir. Dolayisiyla çatı karkasi, taşıyıcı muhendislik ile yapı fiziginin kesistigi alandir.",
      "Su yonu çatı muhendisliginin merkezi kavramidir. Tek egimli, cift egimli veya düşük egimli sistemlerde bile suyun en kısa ve en guvenli yoldan tahliye noktasina gitmesi hedeflenir. Bu nedenle sadece başlangıç ve bitis kotunu doğru kurmak yetmez; ara hatlarin da burulma ve dalga uretmeyecek sekilde doğru duzlemde kalmasi gerekir. Küçük bir lokal ters egim, uzun vadede kaplama detayini zorlar.",
      "Bağlantı guvenligi ikinci buyuk eksendir. Hafif gorunen çatı sistemlerinde rüzgar emmesi, servis yukleri ve bakım trafigi bağlantı noktalarinda yogunlasir. Makas, mertek, asik ve ankraj detaylari bu nedenle yalnız montaj kolayligi ile degil, tekrar edilebilir teknik bir dugum mantigi ile kurulmalidir. Bağlantı disiplini zayifsa kaplama alti sistem sessizce gevser.",
      "Ayrıca çatı iskeleti, baca, su inis, gunes paneli, klima ayagi veya menfez gibi sonradan gelecek tüm ogeler için rezerv uretmelidir. Bu rezervler basta cozulmediginde ekipler sonradan karkasi keser, deler veya lokal yama yapar. Bu da geometriyi ve su yalitim mantigini bozar. Iyi çatı, gelecek mudahaleyi de önceden dusunen catidir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Çatı kaplamasi ve tahliye sistemi ile uyumlu surekli geometri kurulmalidir",
        reference: "TS 825 + uygulama detaylari",
        note: "Egim karari kaplamadan bagimsiz dusunulemez.",
      },
      {
        parameter: "Taşıyıcı ritim ve bağlantı",
        limitOrRequirement: "Makas, asik, mertek ve bağlantı araliklari secilen sistemle uyumlu olmali ve tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1 + proje paftasi",
        note: "Rüzgar etkisi hafif sistemlerde bağlantı kalitesini on plana cikarir.",
      },
      {
        parameter: "Tahliye ve gecisler",
        limitOrRequirement: "Mahya, dere, su inis ve cihaz gecisleri karkas asamasinda geometriye dahil edilmelidir",
        reference: "Çatı detay paftasi",
        note: "Sonradan acilan gecisler su riski uretir.",
      },
      {
        parameter: "Bakım guvenligi",
        limitOrRequirement: "Çatı ustu cihaz ve bakım rotalari guvenli erişim mantigi ile planlanmalidir",
        reference: "Saha guvenligi + isletme plani",
        note: "Bakım erisimi dusunulmeyen çatı, sonradan zorlayici mudahale ister.",
      },
    ],
    designOrApplicationSteps: [
      "Kaplama tipi, tahliye noktasi ve cihaz yerlesimlerini netlestirip çatı geometri sini onlara göre kur.",
      "Makas, asik ve ikincil taşıyıcı ritmi için numune aks olustur; tüm catida aynı duzlem mantigini koru.",
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
      "Bakım veya servis için guvenli yol ve platform mantigi var mi?",
    ],
    numericalExample: {
      title: "12 m catida %3 egim için kot farki ve ara hat yorumu",
      inputs: [
        { label: "Yatay çatı boyu", value: "12 m", note: "Tek yone su toplayan hat" },
        { label: "Hedef egim", value: "%3", note: "Ornek saha ve kaplama uyum degeri" },
        { label: "Tahliye noktasi", value: "Tek dere ve inis", note: "En düşük kot" },
        { label: "Amac", value: "Gollenmesiz geometri kurmak", note: "Kaplama öncesi karkas kontrolu" },
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
          note: "Bu deger, çatı iskeletinin sadece aciklik degil geometri problemi oldugunu gosterir.",
        },
        {
          title: "Ara hat riskini yorumla",
          result: "36 cm teorik fark saglansa bile ara asik hatlarinda dalga veya lokal ters egim varsa su cebi yine olusabilir.",
          note: "Sadece bas ve son kötü dogrulamak yeterli degildir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Çatı iskeletinde basari, hesaplanan egimin tüm yüzey boyunca surekli ve bağlantı acisindan stabil sekilde korunmasidir.",
          note: "Kaplama omru once karkas duzleminde kazanilir veya kaybedilir.",
        },
      ],
      checks: [
        "Egim sahada başlangıç ve bitis noktasi ile sinirli degil, ara hatlarda da kontrol edilmelidir.",
        "Tahliye noktasi geometriye sonradan uydurulmamalidir.",
        "Bağlantı kalitesi ve geometri birlikte denetlenmelidir.",
        "Kaplama öncesi tespit edilen lokal cokme veya ters egim mutlaka duzeltilmelidir.",
      ],
      engineeringComment: "Çatı iskeletinde su riski genelde santimetrelerle degil, o santimetrelerin tüm hat boyunca korunup korunmamasi ile belirlenir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Egim kararini yalnız teorik sayi olarak gormek.", correct: "Ara hat ve tahliye noktasi ile birlikte surekli geometri olarak denetlemek." },
      { wrong: "Bağlantı dugumlerini usta refleksine birakmak.", correct: "Numune detay ve tekrar edilebilir teknik bağlantı mantigi kurmak." },
      { wrong: "Baca ve cihaz gecislerini kaplama asamasinda cozmeyi dusunmek.", correct: "Karkas asamasinda rezerv ve detaylarini netlestirmek." },
      { wrong: "Sadece başlangıç ve bitis kotlarini dogrulamak.", correct: "Tüm çatı duzlemini lazer ve ara hat kontrolu ile okumak." },
      { wrong: "Bakım erisimini proje disi konu saymak.", correct: "Catiyi isletme ve servis rotasi ile birlikte dusunmek." },
      { wrong: "Kaplama altindaki dalgalanmayi onemsiz gormek.", correct: "Kaplama omrunun karkas duzlemine bagli oldugunu kabul etmek." },
    ],
    designVsField: [
      "Projede çatı iskeleti cogu zaman cizgi ve aci olarak görünür; sahada ise suyu, ruzgari ve bakimi yoneten fiziksel geometriye donusur.",
      "Kaplama altinda kalacagi için gözden kacmasi kolaydir; ama çatı sorunlarinin buyuk kismi ilk olarak bu görünmez karkasta baslar.",
      "Iyi çatı iskeleti, yalnız tasiyan degil aynı zamanda suyu doğru yone goturen ve sonraki imalatlara net duzlem veren iskelettir.",
    ],
    conclusion: [
      "Çatı iskeleti, üst kabugun hem taşıyıcı hem geometrik temelidir. Geometri, bağlantı ve tahliye kararlarini birlikte cozen bir saha yaklasimi olmadan uzun omurlu çatı performansi beklenemez.",
      "Bir insaat muhendisi için doğru bakis, çatı karkasini ara imalat degil su, geometri ve isletme performansinin ana karari olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["çatı iskeleti", "egim", "mahya", "tahliye", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti/ahsap-cati", "ince-isler/cati-kaplamasi/membran-cati"],
  },
];
