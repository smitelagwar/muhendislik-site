import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_FRAME_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1995_SOURCE: BinaGuideSource = {
  title: "TS EN 1995-1-1 Eurocode 5 - Ahsap Yapilarin Tasarimi",
  shortCode: "TS EN 1995-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Ahsap cati elemanlari, baglanti detaylari ve servis kosullari icin temel teknik referanslardan biridir.",
};

const COLUMN_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Kolon donati acilimi ve dugum buyutme paftasi", purpose: "Boyuna donati, etriye ve bindirme mantigini sahada okunur hale getirmek." },
  { category: "Kontrol", name: "Etriye bolgesi ve bindirme checklisti", purpose: "Uc bolge, orta bolge ve pas payi kontrollerini standardize etmek." },
  { category: "Olcum", name: "Pas payi mastari, metre ve foto kayit formu", purpose: "Kalip kapanmadan once kritik detaylari sayisal ve gorsel kayda almak." },
  { category: "Koordinasyon", name: "Kiris-kolon dugum kontrol listesi", purpose: "Beton gecisi ve donati sikismasi riskini onceden gormek." },
];

const COLUMN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Donati", name: "Boyuna cubuklar, etriye ve ciroz setleri", purpose: "Kolonun deprem altindaki sargilama ve tasima davranisini kurmak.", phase: "Montaj" },
  { group: "Kontrol", name: "Spacer, pas payi takozu ve sabitleme ekipmani", purpose: "Ortu ve kesit geometri disiplinini korumak.", phase: "Kalip oncesi" },
  { group: "Kayit", name: "Dugum foto arsivi ve olcu formu", purpose: "Kapali kalacak kolon detaylarini kalite ve denetim icin belgelendirmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Kiris dugum ve filiz devam detaylari", purpose: "Kolonun ust ve alt elemanlarla iliskisini tasarimdaki mantikta tutmak.", phase: "Birlesim" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Cati geometri plani, mahya-dere kesiti ve cihaz yerlesim paftasi", purpose: "Tasiyici kurgu ile tahliye ve ekipman kararlarini tek duzende toplamak." },
  { category: "Olcum", name: "Lazer nivo, aci olcer ve hat ipi", purpose: "Egim, kot ve duzlem surekliligini sahada sayisal hale getirmek." },
  { category: "Kontrol", name: "Baglanti ve tahliye checklisti", purpose: "Makas, asik, ankraj ve su yonu kararlarini ayni turda denetlemek." },
  { category: "Kayit", name: "Numune dugum ve cati kabul formu", purpose: "Kaplama oncesi son karkas durumunu belgelemek." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Tasiyici", name: "Makas, mertek, asik ve ikincil tasiyici aileleri", purpose: "Cati geometrisini ve ust yuk aktarimini kurmak.", phase: "Karkas montaji" },
  { group: "Baglanti", name: "Ankraj, civata, saplama ve baglanti elemanlari", purpose: "Ruzgar ve servis yukleri altinda dugum guvenligini saglamak.", phase: "Birlesim" },
  { group: "Tahliye", name: "Mahya, dere, su inis ve gecis detaylari", purpose: "Kaplama oncesi suyun yonunu ve gecis lojigini belirlemek.", phase: "Geometri kilidi" },
  { group: "Guvenlik", name: "Iskele, platform ve yasam hatti", purpose: "Egimli yuzeyde guvenli montaj ve kontrol saglamak.", phase: "Tum surec" },
];

export const kabaInsaatFrameDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kolon-donati",
    kind: "topic",
    quote: "Kolon donatisi, kesite sigan demir duzeni degil; deprem aninda kolonun sargilama, tasima ve suneklik kapasitesini gercege donduren saha imalatidir.",
    tip: "Kolon donatisinda en kritik kayip, cubuk adedinden once etriye bolgesi, bindirme yigilmasi ve beton gecisinin birlikte okunmamasidir.",
    intro: [
      "Kolon donatisi, betonarme yapinin en kritik saha imalatlarindan biridir. Bunun nedeni kolonun sadece dusey yuk tasimasi degil, deprem etkisi altinda kiris ve perde sistemleriyle birlikte yapinin genel davranisini belirlemesidir. Bu nedenle kolon sahada yalnizca boyuna demir dizisi olarak degil, etriye sargilamasi, bindirme duzeni, filiz surekliligi ve dugum bolgesi davranisiyla birlikte okunmalidir.",
      "Sahada kolon donatisini zorlastiran temel konu, cok sayida kritik detayin dar bir kesitte toplanmasidir. Boyuna cubuklar, etriye araliklari, kanca yonleri, cirozlar, kiris dugumleri, ek boylari ve pas payi ayni anda yonetilir. Bu yogunluk proje mantigiyla okunmazsa kesit kagit uzerinde dogru, sahada ise beton gecisinin zayif oldugu bir kitleye donusebilir.",
      "Bir insaat muhendisi icin kolon donatisini anlamak, sadece paftadaki `8phi16` ifadesini okumak degildir. Hangi bolgede neden sik etriye isteniyor, hangi ek bolgesi neden kritik, niye ayni kesitte cok sayida bindirme toplanmamali ve spacer neden dekoratif degil yapisal bir kalite araci sayiliyor; bu sorularin cevabini sahada gormek gerekir.",
      "Bu yazida kolon donatisini uzun-form teknik icerik standardinda ele aliyor; teorik davranistan saha ipuclarina, sayisal kesit okumasindan sik yapilan hatalara kadar insaat muhendisinin sahada uygulayabilecegi bir kontrol mantigi kuruyoruz.",
    ],
    theory: [
      "Kolonlarda boyuna donati eksenel kuvvet ve moment etkilerini tasirken, etriyeler beton cekirdegini sarar, boyuna cubuklarin burkulmasini geciktirir ve kesme davranisina katkida bulunur. Deprem etkisi altinda bu sargilama davranisi kritik hale gelir; cunku kolonun sunek kalmasi, yalniz boyuna alanin yeterli olmasina degil, enine donati disiplininin de sahada eksiksiz kurulmasina baglidir.",
      "TBDY 2018 ve TS 500 mantiginda kolon dugumleri ve uc bolgeler, orta bolgeden farkli hassasiyet tasir. Uc bolgelerde sik etriye uygulanmasinin nedeni sadece yerel dayanimi artirmak degil, plastik sekil degistirme beklentisi altinda beton cekirdegini bir arada tutmaktir. Bu nedenle sahada en cok hata yapilan alan da genellikle burasidir; orta bolge mantigi uc bolgeye tasininca deprem davranisi sessizce zayiflar.",
      "Bindirme konusu da kolonlarda hayati onemdedir. Kesitte zaten sinirli olan bosluk, ayni seviyede cok sayida ek boyunun toplanmasiyla daha da zorlanir. Bu durumda vibrator erisimi ve beton gecisi bozulabilir. Dolayisiyla kolon donatisinda `kesite sigiyor mu` sorusu tek basina yeterli degildir; `beton saglikli sekilde gecebilir mi` sorusu ayni derecede onemlidir.",
      "Pas payi ve sabitleme elemanlari da kolon kalitesinin ayrilmaz parcasidir. Donati kaliba temas ediyor, takozlar kaymis veya cubuklar kalip kapanirken yer degistiriyorsa kesitin gercek davranisi projeden uzaklasir. Bu nedenle kolon donatisi, beton gelmeden once tamamlanan degil; beton oncesi son turda tekrar tekrar okunan bir kalite kalemidir.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve tasarim alt sinirlari",
        limitOrRequirement: "Kolon beton sinifi ve boyuna donati duzeni TBDY 2018 ve TS 500 ile uyumlu olmalidir",
        reference: "TBDY 2018, Bolum 7 + TS 500",
        note: "Kolon deprem davranisinda alt sinirlarin altinda yorumlanamaz.",
      },
      {
        parameter: "Uc bolge sargilamasi",
        limitOrRequirement: "Uc bolgelerde etriye araligi, kanca detayi ve ciroz duzeni proje mantigina gore eksiksiz uygulanmalidir",
        reference: "TBDY 2018, Bolum 7",
        note: "Suneiklik sahada en cok bu bolgede kaybedilir.",
      },
      {
        parameter: "Bindirme ve dugum yogunlugu",
        limitOrRequirement: "Ek bolgeleri ayni kesitte asiri yigilmaya neden olmamali, beton gecisi kontrol edilmelidir",
        reference: "TS 500",
        note: "Kesit icinde betona yer birakmayan duzen kalite sorunudur.",
      },
      {
        parameter: "Pas payi ve geometri",
        limitOrRequirement: "Ortu betonu butun yuzlerde spacer ve takoz sistemiyle korunmalidir",
        reference: "TS 500 + saha kalite plani",
        note: "Ortu, yalniz cizimde degil fiziksel sabitlemeyle gerceklesir.",
      },
    ],
    designOrApplicationSteps: [
      "Paftayi boyuna donati adedi olarak degil, uc bolge, orta bolge, bindirme ve dugum mantigi olarak oku.",
      "Kesme-bukme sonrasi boyuna cubuklarin ve etriyelerin kesitte nasil yerlesecegini numune kolonla prova et.",
      "Uc bolge siklastirma boylarini sahada renk veya etiketle belirginlestir; usta hafizasina birakma.",
      "Bindirme yerlerini ayni kotta yigilmaya zorlamadan, proje mantigina uygun dagit ve dugum yogunlugunu kontrol et.",
      "Kalip kapanmadan once pas payi, etriye kapanisi, kanca yonu ve beton gecisini foto-kayitla denetle.",
      "Beton oncesi son turda kiris dugumu ile kolon kesitini birlikte okuyup vibrasyon erisimini sorgula.",
    ],
    criticalChecks: [
      "Uc bolge ve orta bolge etriye araliklari sahada karismis mi?",
      "Kanca yonleri ve cirozlar sargilama mantigini gercekten tamamliyor mu?",
      "Bindirme duzeni ayni kesitte yigilmaya neden oluyor mu?",
      "Kiris-kolon dugumunde beton gecisini zorlayacak sikisiklik var mi?",
      "Takoz ve spacer butun yuzlerde aktif olarak calisiyor mu?",
      "Beton oncesi kolon kesiti ve dugum foto-kaydi alindi mi?",
    ],
    numericalExample: {
      title: "40 x 60 cm kolonda donati yogunlugu ve beton gecisi yorumu",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Tipik orta buyuklukte betonarme kolon" },
        { label: "Boyuna donati", value: "8phi16", note: "Ornek saha verisi" },
        { label: "Uc bolge", value: "Sik etriye", note: "Deprem davranisi icin kritik bolge" },
        { label: "Amac", value: "Suneiklik ve beton yerlesmesini birlikte korumak", note: "Saha kalite yorumu" },
      ],
      assumptions: [
        "Kesin aralik ve boylar paftadan teyit edilmektedir.",
        "Kiris dugumu acik gorunmektedir ve beton oncesi kontrol imkani vardir.",
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
          result: "Uc bolgede sik etriye uygulamasi, orta bolgeden ayri foto ve olcu ile kontrol edilmelidir.",
          note: "Deprem davranisinda en buyuk kayip genelde bu ayrimin sahada silinmesidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kolon donatisinda yeterli alan kadar, sargilama davranisini ve beton gecisini koruyan detay disiplini de esastir.",
          note: "Kolonun sahadaki kalitesi kesit hesap raporundan once bu okumayla anlasilir.",
        },
      ],
      checks: [
        "Uc bolge ile orta bolge ayni aralik mantigiyla yurutulmemelidir.",
        "Bindirme ve pas payi ayni anda dogrulanmadan kabul verilmemelidir.",
        "Dugum bolgesi beton gecisi montaj tamamlandiktan sonra tekrar dusunulmelidir.",
        "Foto kaydi ve olcu turu, beton gelmeden once tamamlanmalidir.",
      ],
      engineeringComment: "Kolon donatisinda kalite, demirin coklugundan once deprem davranisini saglayan detaylarin eksiksiz kurulmasinda yatar.",
    },
    tools: COLUMN_TOOLS,
    equipmentAndMaterials: COLUMN_EQUIPMENT,
    mistakes: [
      { wrong: "Uc bolge etriye mantigini orta bolge mantigiyla gevsetmek.", correct: "Deprem kritik bolgeleri paftadaki boy ve araliklarla aynen uygulamak." },
      { wrong: "Bindirmeleri sahada hangi cubuk denk gelirse orada toplamak.", correct: "Ek bolgelerini yigilmaya neden olmayacak sekilde dagitmak." },
      { wrong: "Pas payini kalip kapaninca kendiliginden olusur varsaymak.", correct: "Takoz ve spacer ile aktif olarak sabitlemek." },
      { wrong: "Kiris-kolon dugumunu beton ekibi cozer diye birakmak.", correct: "Montaj asamasinda beton gecisini ve vibrasyon erisimini birlikte degerlendirmek." },
      { wrong: "Kanca yonlerini usta aliskanligina birakmak.", correct: "Projede istenen kapanis mantigini sahada birebir takip etmek." },
      { wrong: "Beton oncesi kolon detayini kayitsiz kabul etmek.", correct: "Olcu, foto ve checklist ile beton oncesi son turu zorunlu hale getirmek." },
    ],
    designVsField: [
      "Tasarimda kolon donatisi birkac kesit ve not ile gorunur; sahada ise sunekligin gercekte kurulup kurulmadigi etriye, bindirme ve pas payi detayinda ortaya cikar.",
      "Kolon, deprem guvenliginin sahadaki en net sinavlarindan biridir; bu yuzden toleranssiz gorunen detaylar burada daha da onem kazanir.",
      "Iyi kolon donatisi, paftayi ezbere uygulayan degil, kesitin neden o sekilde istendigini anlayan saha kulturu ile uretilir.",
    ],
    conclusion: [
      "Kolon donatisi, betonarme sistemin sahadaki en kritik kalite halkalarindan biridir. Boyuna donati, etriye, bindirme ve pas payi zinciri dogru kurulursa proje davranisi sahaya tasinir; zincir bozulursa hata beton altinda gizlenir.",
      "Bir insaat muhendisi icin dogru yaklasim, kolonu yalnizca demir metraj kalemi degil, deprem davranisinin sahada yazildigi ana eleman olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["kolon donati", "etriye siklastirma", "TBDY 2018", "TS 500", "dugum bolgesi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti",
    kind: "topic",
    quote: "Cati iskeleti, ust kaplamanin altinda kaybolan bir karkas degil; suyun yonunu, ekipman lojigini ve ust kabugun omrunu belirleyen ana geometri sistemidir.",
    tip: "Cati geometri sini sadece egim sayisi olarak okumak, mahya-dere davranisi, baglanti guvenligi ve sonraki kaplama omrunu ayni anda riske atar.",
    intro: [
      "Cati iskeleti, ahsap veya metal tasiyici ailelerle ust yapinin son buyuk geometrik kararini kuran asamadir. Kaplama, yalitim ve su yalitim katmanlari daha sonra bu karkasin uzerine oturur. Bu nedenle karkastaki her aks sapmasi, her baglanti zafiyeti ve her ters egim riski sonraki tum cati katmanlarina yayilir.",
      "Sahada cati iskeleti cogu zaman kaplama oncesi ara faz gibi gorulur; oysa gercekte suyla ilk ciddi teknik mucadelenin basladigi yer burasidir. Mahya, dere, asik, mertek, makas, ankraj, cihaz ayaklari ve baca gecisleri birlikte dusunulmezse kaplama ne kadar kaliteli olursa olsun sorunlarin tohumu bu asamada atilir.",
      "Bir insaat muhendisi icin cati iskeletini anlamak, sadece aciklik ve egim hesabini bilmek degil; kaplama sistemiyle uyumlu tasiyici ritmi, ruzgar altindaki baglanti ihtiyaci, bakim erisimi ve sonradan gelecek cihaz gecislerini de gormek anlamina gelir. Cati uzerindeki en pahali su sizintisi ve bakim problemi, cogu kez iskelet asamasinda eksik dusunulmus bir detaydan dogar.",
      "Bu yazida cati iskeletini blog standardina uygun bicimde; geometri, tasiyici duzen, su yonu, saha kontrol noktasi, sayisal egim yorumu ve uygulamada en sik yapilan hatalarla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Cati iskeleti iki ana gorev tasir: yukleri guvenli sekilde ana tasiyici sisteme aktarmak ve ust katmanlar icin dogru geometriyi uretmek. Bu iki gorev birbirinden bagimsiz degildir. Tasiyici aile kaplama tipine uygun aralikta kurulmazsa yuzey dalgalanir; geometri tahliyeye uygun degilse su detay dugumlerinde toplanir. Dolayisiyla cati karkasi, tasiyici muhendislik ile yapi fiziginin kesistigi alandir.",
      "Su yonu cati muhendisliginin merkezi kavramidir. Tek egimli, cift egimli veya dusuk egimli sistemlerde bile suyun en kisa ve en guvenli yoldan tahliye noktasina gitmesi hedeflenir. Bu nedenle sadece baslangic ve bitis kotunu dogru kurmak yetmez; ara hatlarin da burulma ve dalga uretmeyecek sekilde dogru duzlemde kalmasi gerekir. Kucuk bir lokal ters egim, uzun vadede kaplama detayini zorlar.",
      "Baglanti guvenligi ikinci buyuk eksendir. Hafif gorunen cati sistemlerinde ruzgar emmesi, servis yukleri ve bakim trafigi baglanti noktalarinda yogunlasir. Makas, mertek, asik ve ankraj detaylari bu nedenle yalniz montaj kolayligi ile degil, tekrar edilebilir teknik bir dugum mantigi ile kurulmalidir. Baglanti disiplini zayifsa kaplama alti sistem sessizce gevser.",
      "Ayrica cati iskeleti, baca, su inis, gunes paneli, klima ayagi veya menfez gibi sonradan gelecek tum ogeler icin rezerv uretmelidir. Bu rezervler basta cozulmediginde ekipler sonradan karkasi keser, deler veya lokal yama yapar. Bu da geometriyi ve su yalitim mantigini bozar. Iyi cati, gelecek mudahaleyi de onceden dusunen catidir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Cati kaplamasi ve tahliye sistemi ile uyumlu surekli geometri kurulmalidir",
        reference: "TS 825 + uygulama detaylari",
        note: "Egim karari kaplamadan bagimsiz dusunulemez.",
      },
      {
        parameter: "Tasiyici ritim ve baglanti",
        limitOrRequirement: "Makas, asik, mertek ve baglanti araliklari secilen sistemle uyumlu olmali ve tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1 + proje paftasi",
        note: "Ruzgar etkisi hafif sistemlerde baglanti kalitesini on plana cikarir.",
      },
      {
        parameter: "Tahliye ve gecisler",
        limitOrRequirement: "Mahya, dere, su inis ve cihaz gecisleri karkas asamasinda geometriye dahil edilmelidir",
        reference: "Cati detay paftasi",
        note: "Sonradan acilan gecisler su riski uretir.",
      },
      {
        parameter: "Bakim guvenligi",
        limitOrRequirement: "Cati ustu cihaz ve bakim rotalari guvenli erisim mantigi ile planlanmalidir",
        reference: "Saha guvenligi + isletme plani",
        note: "Bakim erisimi dusunulmeyen cati, sonradan zorlayici mudahale ister.",
      },
    ],
    designOrApplicationSteps: [
      "Kaplama tipi, tahliye noktasi ve cihaz yerlesimlerini netlestirip cati geometri sini onlara gore kur.",
      "Makas, asik ve ikincil tasiyici ritmi icin numune aks olustur; tum catida ayni duzlem mantigini koru.",
      "Mahya, dere ve en dusuk kotlari lazer nivo ile baslangictan itibaren takip et; goz karariyla duzlem kabul etme.",
      "Baca, gunes paneli, klima ayagi ve benzeri gecisleri karkas asamasinda rezerve et; sonradan kesme ihtiyaci yaratma.",
      "Ankraj ve baglanti dugumlerini numune detay uzerinden teyit edip sonra seri uygulamaya gec.",
      "Kaplama oncesi son turda geometri, baglanti, tahliye ve bakim rotalarini ayni checklist ile denetle.",
    ],
    criticalChecks: [
      "Gercek cati egimi tahliye noktasina kesintisiz yonleniyor mu?",
      "Makas, asik ve baglanti ritmi proje mantigiyla uyumlu mu?",
      "Mahya ve dere hatlarinda burulma veya dalga var mi?",
      "Baca, menfez ve cihaz gecisleri sonradan yama gerektirecek durumda mi?",
      "Ankraj ve baglanti detaylari her dugumde tekrar edilebilir kaliteyle kurulmus mu?",
      "Bakim veya servis icin guvenli yol ve platform mantigi var mi?",
    ],
    numericalExample: {
      title: "12 m catida %3 egim icin kot farki ve ara hat yorumu",
      inputs: [
        { label: "Yatay cati boyu", value: "12 m", note: "Tek yone su toplayan hat" },
        { label: "Hedef egim", value: "%3", note: "Ornek saha ve kaplama uyum degeri" },
        { label: "Tahliye noktasi", value: "Tek dere ve inis", note: "En dusuk kot" },
        { label: "Amac", value: "Gollenmesiz geometri kurmak", note: "Kaplama oncesi karkas kontrolu" },
      ],
      assumptions: [
        "Kaplama sistemi bu egim araligiyla uyumludur.",
        "Ara tasiyici hatlar ayni duzlemde kurulacaktir.",
        "Tahliye noktasi ve gecisler paftada sabittir.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "12 x 0,03 = 0,36 m",
          result: "Tahliye noktasina dogru en az 36 cm kot farki gerekir.",
          note: "Bu deger, cati iskeletinin sadece aciklik degil geometri problemi oldugunu gosterir.",
        },
        {
          title: "Ara hat riskini yorumla",
          result: "36 cm teorik fark saglansa bile ara asik hatlarinda dalga veya lokal ters egim varsa su cebi yine olusabilir.",
          note: "Sadece bas ve son kotu dogrulamak yeterli degildir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Cati iskeletinde basari, hesaplanan egimin tum yuzey boyunca surekli ve baglanti acisindan stabil sekilde korunmasidir.",
          note: "Kaplama omru once karkas duzleminde kazanilir veya kaybedilir.",
        },
      ],
      checks: [
        "Egim sahada baslangic ve bitis noktasi ile sinirli degil, ara hatlarda da kontrol edilmelidir.",
        "Tahliye noktasi geometriye sonradan uydurulmamalidir.",
        "Baglanti kalitesi ve geometri birlikte denetlenmelidir.",
        "Kaplama oncesi tespit edilen lokal cokme veya ters egim mutlaka duzeltilmelidir.",
      ],
      engineeringComment: "Cati iskeletinde su riski genelde santimetrelerle degil, o santimetrelerin tum hat boyunca korunup korunmamasi ile belirlenir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Egim kararini yalniz teorik sayi olarak gormek.", correct: "Ara hat ve tahliye noktasi ile birlikte surekli geometri olarak denetlemek." },
      { wrong: "Baglanti dugumlerini usta refleksine birakmak.", correct: "Numune detay ve tekrar edilebilir teknik baglanti mantigi kurmak." },
      { wrong: "Baca ve cihaz gecislerini kaplama asamasinda cozmeyi dusunmek.", correct: "Karkas asamasinda rezerv ve detaylarini netlestirmek." },
      { wrong: "Sadece baslangic ve bitis kotlarini dogrulamak.", correct: "Tum cati duzlemini lazer ve ara hat kontrolu ile okumak." },
      { wrong: "Bakim erisimini proje disi konu saymak.", correct: "Catiyi isletme ve servis rotasi ile birlikte dusunmek." },
      { wrong: "Kaplama altindaki dalgalanmayi onemsiz gormek.", correct: "Kaplama omrunun karkas duzlemine bagli oldugunu kabul etmek." },
    ],
    designVsField: [
      "Projede cati iskeleti cogu zaman cizgi ve aci olarak gorunur; sahada ise suyu, ruzgari ve bakimi yoneten fiziksel geometriye donusur.",
      "Kaplama altinda kalacagi icin gozden kacmasi kolaydir; ama cati sorunlarinin buyuk kismi ilk olarak bu gorunmez karkasta baslar.",
      "Iyi cati iskeleti, yalniz tasiyan degil ayni zamanda suyu dogru yone goturen ve sonraki imalatlara net duzlem veren iskelettir.",
    ],
    conclusion: [
      "Cati iskeleti, ust kabugun hem tasiyici hem geometrik temelidir. Geometri, baglanti ve tahliye kararlarini birlikte cozen bir saha yaklasimi olmadan uzun omurlu cati performansi beklenemez.",
      "Bir insaat muhendisi icin dogru bakis, cati karkasini ara imalat degil su, geometri ve isletme performansinin ana karari olarak gormektir.",
    ],
    sources: [...KABA_FRAME_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["cati iskeleti", "egim", "mahya", "tahliye", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti/ahsap-cati", "ince-isler/cati-kaplamasi/membran-cati"],
  },
];
