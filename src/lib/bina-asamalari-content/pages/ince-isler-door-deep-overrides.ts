import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_DOOR_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_14351_2_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-2 Pencereler ve Kapilar - Mamul Standardi - Yaya Gecisine Uygun Hazir Ic Kapilar",
  shortCode: "TS EN 14351-2",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "Ic kapi setlerinin performans karakteristikleri, uygunluk ve urun tanimi icin temel referanslardan biridir.",
};

const DOOR_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Kapi listesi, mahal bitis paftasi ve kasa kesitleri", purpose: "Her kapiyi yalniz numarayla degil, duvar tipi ve bitmis kotuyla birlikte tarif etmek." },
  { category: "Olcum", name: "Lazer nivo, sakul, diyagonal metre ve mastar", purpose: "Kasa geometrisini goz karariyla degil sayisal olarak kabul etmek." },
  { category: "Kontrol", name: "Fonksiyon testi ve donanim checklisti", purpose: "Kilit dili, mentese, stop, alt bosluk ve pervaz kalitesini ayni turda kontrol etmek." },
  { category: "Kayit", name: "Mahal bazli kapi foyi ve revizyon listesi", purpose: "Her odadaki kapiyi tekil kusur ve ayar notlari ile takip etmek." },
];

const DOOR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kapi seti", name: "Kasa, kanat, pervaz, esik ve aksesuarlar", purpose: "Kapiyi parca parca degil tek performans paketi olarak kurmak.", phase: "Montaj" },
  { group: "Baglanti", name: "Mekanik ankraj, takoz ve kontrollu dolgu malzemesi", purpose: "Kasayi yalniz kopuge birakmadan sabit ve tekrar ayarlanabilir hale getirmek.", phase: "Sabitleme" },
  { group: "Donanim", name: "Mentese, kilit, kol, hidrolik veya ozel mahal aksesuarlari", purpose: "Kullanim yogunlugu ve mahal fonksiyonuna gore dogru acilma kapanma davranisi saglamak.", phase: "Donanim montaji" },
  { group: "Koruma", name: "Kose koruyucu, ambalaj ve son temizlik ekipmani", purpose: "Boyasi bitmis kanat ve pervazlari son isler sirasinda darbe ve leke riskinden korumak.", phase: "Montaj sonrasi" },
];

export const inceIslerDoorDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/kapi-pencere/ic-kapi",
    kind: "topic",
    quote: "Ic kapi, duvarda acilan bir boslugu kapatmaz; mekanlar arasi gecisin sesini, konforunu ve kullanim disiplinini tanimlar.",
    tip: "Kasa montajini sadece kopuk ve pervazla bitirmek, bitmis doseme kotunu, duvar kalinligini ve gunluk kullanimdaki ayar davranisini gormezden gelmek demektir.",
    intro: [
      "Ic kapilar, santiyede cogu zaman hafif is olarak gorulur. Oysa kullanicinin binada en sik temas ettigi bilesenlerden biri ic kapidir. Her acilis, her kapanis, her kilit denemesi ve her carpma aninda kapinin gercek kalitesi test edilir. Bu nedenle kapida kalan kucuk bir montaj hatasi, duvarda saklanabilen diger ince is kusurlarindan cok daha hizli fark edilir.",
      "Bir muhendis icin ic kapi, yalniz marangozun alanina birakilacak bir montaj paketi degildir. Kasa boslugu, bitmis doseme kotu, supurgelik kalinligi, duvar bitisleri, kilit yonu, mentese kapasitesi, islak hacim veya ofis gibi farkli kullanim senaryolari ve bazi mahallerde yangin ya da akustik gereksinimi birlikte okunmalidir. Bu unsurlardan biri atlandiginda kapinin estetik gorunmesi bile uzun omurlu kullanim icin yeterli olmaz.",
      "Sahada en sik gorulen problemler; kanadin surtmesi, kendi kendine acilip kapanmasi, pervazin duvara tam oturmamasi, alt boslugun tutarsiz olmasi, kilit dilinin tam karsilik bulmamasi ve zamanla mentese sarkmasidir. Bu problemlerin ortak kok nedeni, kapinin urun olarak degil, bitmis mekan sistemi icinde bir performans paketi olarak dusunulmemesidir.",
      "Dogru ic kapi uygulamasi; olculendirme, montaj, ayar ve koruma disiplinlerini ayni anda gerektirir. Bu yazida bir ic kapinin santiyede nasil okunmasi gerektigini; proje listesinden son fonksiyon testine, bitmis doseme kotundan ozel mahal gereksinimlerine kadar kapsamli bicimde ele aliyoruz.",
    ],
    theory: [
      "Ic kapi performansi esas olarak geometri, donanim ve bitmis yuzey iliskisine dayanir. Geometri bozuldugunda kanat surtmeye, acik kalmaya veya kilitlenmekte zorlanmaya baslar. Donanim yetersiz secildiginde ayni kapi bir sure sonra sarkar, kol bosalir veya kilit dili karsiligini kaybeder. Bitmis yuzey iliskisi hatali cozuldugunda ise duvar, supurgelik ve pervaz birlesimlerinde gozle gorulen kalitesizlik ortaya cikar.",
      "Kasa montaji bu sistemin cekirdegidir. Kasa sakulunde veya diyagonalinde kucuk sapma bile kanat bosluklarini dengesiz hale getirir. Kapinin ust boslugu bir tarafta 2 mm, diger tarafta 5 mm oldugunda sorun yalnizca goruntu olmaz; kanat agirligi ve mentese ayari zamanla bu farki buyutur. Bu nedenle ic kapi kabulunde goz karari yeterli degildir; olcu alarak geometriyi kayda baglamak gerekir.",
      "Ic kapilar farkli mahallerde farkli performans ister. Konut oda kapisi, islak hacim kapisi, ofis koridor kapisi, yangin kacisinda kullanilan ozel kapilar veya hasta odasi kapisi ayni davranis beklentisine sahip degildir. Suya dayanim, ses yalitimi, yangin dayanim sinifi, darbe dayanikliligi ve donanim secimi kullanim senaryosuna gore degisir. Bu yuzden kapi listesi yalniz ebat tablosu olarak degil, mahal fonksiyon matrisi olarak okunmalidir.",
      "Bunun yaninda bitmis doseme kotu ic kapi performansinda kritik rol oynar. Seramik, parke, epoksi veya hali kalinligi; kapinin alt boslugunu, hava sirkulasyonunu ve bazen ses kontrolunu etkiler. Kasa kotu kaba dosemeye gore sabitlenip daha sonra zemin kalinlasirsa kanat surtmesi kacinilmaz hale gelir. Tersine alt bosluk fazla buyurse mahremiyet, akustik ve gorsel kalite zayiflar.",
      "Son olarak koruma disiplini unutulmamalidir. Ic kapi cogu kez boyasi tamamlanmis, hassas yuzeyli bir urundur. Son isler surerken darbeye, neme ve kirlenmeye aciktir. Dogru monte edilen bir kapi, yeterli koruma yapilmadigi icin teslimden once zarar gorebilir. Bu nedenle kapinin kalitesi sadece montaj aninda degil, diger ekipler bittikten sonra nasil korundugunda da belirlenir.",
    ],
    ruleTable: [
      {
        parameter: "Urun ve performans sinifi",
        limitOrRequirement: "Ic kapilar mahal kullanimina uygun performans ve urun tanimi ile secilmelidir",
        reference: "TS EN 14351-2",
        note: "Her ic kapinin ayni dayanim, ses veya ozel kullanim seviyesine sahip olmasi beklenmez.",
      },
      {
        parameter: "Kasa geometri kontrolu",
        limitOrRequirement: "Kasa sakul, gonye ve diyagonal olculeri fonksiyonel acilma kapanma davranisini saglayacak duzeyde olmalidir",
        reference: "Saha montaj disiplini",
        note: "Ic kapidaki bircok problem malzemeden degil geometri kaybindan dogar.",
      },
      {
        parameter: "Bitmis yuzey ve doseme kotu uyumu",
        limitOrRequirement: "Kasa, bitmis doseme yuksekligi, supurgelik ve duvar bitis kalinliklariyla birlikte konumlandirilmalidir",
        reference: "Mahal bitis paftasi",
        note: "Kapi, kaba imalata gore degil tamamlanmis mekana gore ayarlanir.",
      },
      {
        parameter: "Ozel mahal kapilari",
        limitOrRequirement: "Yangin, akustik veya islak hacim gereksinimi olan kapilar ilgili mahal kosullarina uygun detay ve donanima sahip olmalidir",
        reference: "Yangin Yonetmeligi + proje notlari",
        note: "Ic kapi genel bir basliktir; ozel mahallerde standart kapi davranisi yeterli olmaz.",
      },
      {
        parameter: "Sabitleme ve kabul",
        limitOrRequirement: "Kasa yalniz dolgu kopugune birakilmamali, mekanik sabitleme ve fonksiyon testiyle kabul edilmelidir",
        reference: "Uretici montaj detayi + saha kalite plani",
        note: "Iyi gorunen ama test edilmeyen kapi, teslimden sonra ariza olarak geri doner.",
      },
    ],
    designOrApplicationSteps: [
      "Kapi listesini mahal fonksiyonu, duvar tipi, kanat yonu, aksesuar ve ozel performans gereksinimi ile birlikte dondur.",
      "Kaba acikliklari yalniz bant metre ile degil, bitmis siva kalinligi ve doseme paketini de dusunerek yeniden kontrol et.",
      "Kasayi takoz ve mekanik baglanti ile sabitle; kopugu destekleyici malzeme olarak kullan, tasiyici cozum gibi gorme.",
      "Pervaz, supurgelik ve esik iliskisini ayni anda cozumle; biri bittikten sonra digerine uydurma yolu kaliteyi bozar.",
      "Kanat takildiktan sonra kapinin kendiliginden acilip kapanmadigini, bosluklarin dengeli dagildigini ve kilit karsiliginin tam oturdugunu test et.",
      "Son isler tamamlanana kadar kapilari koruyucu kaplama ve mahal bazli teslim listesi ile koru; darbe ve leke riskini teslime birakma.",
    ],
    criticalChecks: [
      "Kasa diyagonalleri ve sakul dogrulamasi olculerek yapildi mi?",
      "Bitmis doseme kalinligi kapinin alt bosluguna dogru yansitildi mi?",
      "Pervaz ile duvar bitisi arasinda acik, kirik veya asiri mastik ihtiyaci doguran bosluk var mi?",
      "Mentese, kilit ve kol takimi mahal kullanim yogunluguna uygun mu?",
      "Islak hacim, akustik veya yangin gerektiren mahallerde ozel kapilar genel tip ile karistirildi mi?",
      "Montaj sonrasi kapilar diger ekiplerin darbelerine karsi gercekten korunuyor mu?",
    ],
    numericalExample: {
      title: "Bitmis doseme kotuna gore kapi alti bosluk karari",
      inputs: [
        { label: "Kapinin ham montajdaki alt boslugu", value: "28 mm", note: "Kaba doseme uzerinde olculen bosluk" },
        { label: "Planlanan zemin paketi", value: "15 mm", note: "Seramik + yapistirici veya parke paketi" },
        { label: "Hedef son bosluk", value: "8 mm", note: "Ornek oda kapisi fonksiyon boslugu" },
        { label: "Amac", value: "Kasa kotu ve kanat ayarini onceden belirlemek", note: "Teslimde surtme riskini azaltmak" },
      ],
      assumptions: [
        "Kasa henuz son sabitleme asamasindadir ve ayar yapilabilir durumdadir.",
        "Zemin kaplamasi kalinligi mahal listesinde dogrulanmistir.",
        "Kapinin altinda ozel akustik veya yangin contasi gereksinimi yoktur.",
      ],
      steps: [
        {
          title: "Bitmis zemin sonrasi kalacak boslugu hesapla",
          formula: "28 - 15 = 13 mm",
          result: "Zemin kaplamasi bittiginde kapinin altinda yaklasik 13 mm bosluk kalir.",
          note: "Ham montajdaki bosluk, bitmis kullanim boslugu ile ayni okunmamalidir.",
        },
        {
          title: "Hedef boslukla karsilastir",
          formula: "13 - 8 = 5 mm",
          result: "Hedeflenen 8 mm yerine 13 mm kaldigi icin 5 mm fazla bosluk vardir.",
          note: "Bu fark ses, mahremiyet ve gorunur kaliteyi olumsuz etkileyebilir.",
        },
        {
          title: "Saha kararini ver",
          result: "Kasa kotu veya kanat boyu sabitleme oncesi yeniden ayarlanmali; sorun teslime birakilmamalidir.",
          note: "Ic kapida en ucuz revizyon montaj sirasinda yapilan revizyondur.",
        },
      ],
      checks: [
        "Bitmis doseme paketi tum mahal tipleri icin ayni olmayabilir; oda bazli kontrol gerekir.",
        "Kapi alti boslugu sadece surtme icin degil, akustik ve mahremiyet icin de degerlendirilmelidir.",
        "Kilit ve mentese ayari, geometriyi kurtarmanin araci degil, ince ayar adimidir.",
        "Kasa sabitlendi ve pervaz kapandiysa sonradan duzeltme cok daha maliyetli hale gelir.",
      ],
      engineeringComment: "Ic kapida milimetre seviyesindeki kot karari, kullanicinin her gun hissedecegi bir konfor sonucuna donusur.",
    },
    tools: DOOR_TOOLS,
    equipmentAndMaterials: DOOR_EQUIPMENT,
    mistakes: [
      { wrong: "Kasayi yalniz kaba acikliga gore secip bitmis siva ve dosemeyi ihmal etmek.", correct: "Montaji bitmis mekan kalinliklariyla birlikte planlamak." },
      { wrong: "Kopugu tasiyici sabitleme gibi kullanmak.", correct: "Kasayi mekanik baglanti ve kontrollu takoz sistemiyle kurmak." },
      { wrong: "Kapi listesinde butun mahalleri ayni urun tipiyle gecmek.", correct: "Kullanim senaryosuna gore donanim ve performans farklarini tanimlamak." },
      { wrong: "Pervaz ve supurgelik iliskisini sonraya birakmak.", correct: "Kapi montajini duvar ve zemin bitisleriyle ayni karar paketi icinde cozumlemek." },
      { wrong: "Fonksiyon testini sadece rastgele birkac kapida yapmak.", correct: "Tum kapilari mahal bazli acilma, kapanma ve kilit testiyle kabul etmek." },
      { wrong: "Montaj bitince kapilari korumasiz birakmak.", correct: "Teslime kadar darbe, nem ve lekeye karsi kapilari aktif olarak korumak." },
    ],
    designVsField: [
      "Projede ic kapi numara ve ebat tablosu olarak gorunur; sahada ise duvar kalinligi, doseme kotu, pervaz bitisi ve donanim ayarinin birlesimine donusur.",
      "Iyi ic kapi dikkat cekmeden calisir; kotu ic kapi ise her acilis kapanista yapinin kalitesini sorgulatir.",
      "Bu nedenle ic kapida basitlik algisi aldaticidir; detay ne kadar sessizse muhendislik o kadar dogru kurulmustur.",
    ],
    conclusion: [
      "Ic kapilarin uzun omurlu ve kullanisli olmasi, urun kalitesi kadar olculendirme, montaj, ayar ve koruma zincirinin dogru kurulmasina baglidir. Santiyede bu zincir ihmal edilirse kusur kullanici tarafindan her gun tekrar fark edilir.",
      "Bir insaat muhendisi icin en dogru yaklasim, ic kapiyi marangozluk kalemi degil, bitmis mekan performans detayi olarak gormektir. Boylesi bir bakis hem estetik kusurlari hem de teslim sonrasi servis cagrilarini belirgin bicimde azaltir.",
    ],
    sources: [...INCE_DOOR_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_14351_2_SOURCE],
    keywords: ["ic kapi", "kasa montaji", "TS EN 14351-2", "bitmis doseme kotu", "pervaz"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/dis-kapi"],
  },
];
