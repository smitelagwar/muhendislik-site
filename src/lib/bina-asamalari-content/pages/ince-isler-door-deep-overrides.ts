import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_DOOR_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_14351_2_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-2 Pencereler ve Kapılar - Mamul Standardi - Yaya Gecisine Uygun Hazir İç Kapılar",
  shortCode: "TS EN 14351-2",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "İç kapı setlerinin performans karakteristikleri, uygunluk ve urun tanimi için temel referanslardan biridir.",
};

const DOOR_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Kapı listesi, mahal bitis paftası ve kasa kesitleri", purpose: "Her kapiyi yalnız numarayla değil, duvar tipi ve bitmis kotuyla birlikte tarif etmek." },
  { category: "Ölçüm", name: "Lazer nivo, şakul, diyagonal metre ve mastar", purpose: "Kasa geometrisini göz karariyla değil sayisal olarak kabul etmek." },
  { category: "Kontrol", name: "Fonksiyon testi ve donanim checklisti", purpose: "Kilit dili, mentese, stop, alt boşluk ve pervaz kalitesini aynı turda kontrol etmek." },
  { category: "Kayıt", name: "Mahal bazli kapı foyi ve revizyon listesi", purpose: "Her odadaki kapiyi tekil kusur ve ayar notlari ile takip etmek." },
];

const DOOR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kapı seti", name: "Kasa, kanat, pervaz, esik ve aksesuarlar", purpose: "Kapiyi parca parca değil tek performans paketi olarak kurmak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Mekanik ankraj, takoz ve kontrollu dolgu malzemesi", purpose: "Kasayi yalnız kopuge birakmadan sabit ve tekrar ayarlanabilir hale getirmek.", phase: "Sabitleme" },
  { group: "Donanim", name: "Mentese, kilit, kol, hidrolik veya ozel mahal aksesuarlari", purpose: "Kullanım yoğunluğu ve mahal fonksiyonuna göre doğru acilma kapanma davranisi saglamak.", phase: "Donanim montaji" },
  { group: "Koruma", name: "Köşe koruyucu, ambalaj ve son temizlik ekipmani", purpose: "Boyasi bitmis kanat ve pervazlari son isler sirasinda darbe ve leke riskinden korumak.", phase: "Montaj sonrasi" },
];

export const inceIslerDoorDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/kapi-pencere/ic-kapi",
    kind: "topic",
    quote: "İç kapı, duvarda acilan bir boşluğu kapatmaz; mekanlar arasi gecisin sesini, konforunu ve kullanım disiplinini tanimlar.",
    tip: "Kasa montajini sadece kopuk ve pervazla bitirmek, bitmis döşeme kotunu, duvar kalinligini ve gunluk kullanimdaki ayar davranisini gormezden gelmek demektir.",
    intro: [
      "İç kapılar, şantiyede cogu zaman hafif iş olarak gorulur. Oysa kullanicinin binada en sık temas ettigi bilesenlerden biri iç kapidir. Her acilis, her kapanis, her kilit denemesi ve her carpma aninda kapının gercek kalitesi test edilir. Bu nedenle kapida kalan küçük bir montaj hatasi, duvarda saklanabilen diger ince iş kusurlarindan çok daha hızlı fark edilir.",
      "Bir mühendis için iç kapı, yalnız marangozun alanina birakilacak bir montaj paketi degildir. Kasa boşluğu, bitmis döşeme kötü, süpürgelik kalinligi, duvar bitisleri, kilit yonu, mentese kapasitesi, islak hacim veya ofis gibi farkli kullanım senaryolari ve bazi mahallerde yangın ya da akustik gereksinimi birlikte okunmalidir. Bu unsurlardan biri atlandiginda kapının estetik gorunmesi bile uzun omurlu kullanım için yeterli olmaz.",
      "Sahada en sık gorulen problemler; kanadin surtmesi, kendi kendine acilip kapanmasi, pervazin duvara tam oturmamasi, alt boslugun tutarsiz olmasi, kilit dilinin tam karsilik bulmamasi ve zamanla mentese sarkmasidir. Bu problemlerin ortak kok nedeni, kapının urun olarak değil, bitmis mekan sistemi icinde bir performans paketi olarak dusunulmemesidir.",
      "Doğru iç kapı uygulamasi; ölçülendirme, montaj, ayar ve koruma disiplinlerini aynı anda gerektirir. Bu yazida bir iç kapının şantiyede nasil okunmasi gerektigini; proje listesinden son fonksiyon testine, bitmis döşeme kotundan ozel mahal gereksinimlerine kadar kapsamli bicimde ele aliyoruz.",
    ],
    theory: [
      "İç kapı performansi esas olarak geometri, donanim ve bitmis yüzey iliskisine dayanir. Geometri bozuldugunda kanat surtmeye, acik kalmaya veya kilitlenmekte zorlanmaya başlar. Donanim yetersiz secildiginde aynı kapı bir süre sonra sarkar, kol bosalir veya kilit dili karsiligini kaybeder. Bitmis yüzey iliskisi hatali cozuldugunda ise duvar, süpürgelik ve pervaz birlesimlerinde gozle gorulen kalitesizlik ortaya çıkar.",
      "Kasa montaji bu sistemin cekirdegidir. Kasa sakulunde veya diyagonalinde küçük sapma bile kanat bosluklarini dengesiz hale getirir. Kapının üst boşluğu bir tarafta 2 mm, diger tarafta 5 mm oldugunda sorun yalnızca goruntu olmaz; kanat agirligi ve mentese ayari zamanla bu farki buyutur. Bu nedenle iç kapı kabulunde göz karari yeterli degildir; ölçü alarak geometriyi kayda baglamak gerekir.",
      "İç kapılar farkli mahallerde farkli performans ister. Konut oda kapısı, islak hacim kapısı, ofis koridor kapısı, yangın kacisinda kullanilan ozel kapılar veya hasta odasi kapısı aynı davranis beklentisine sahip degildir. Suya dayanım, ses yalitimi, yangın dayanım sinifi, darbe dayanikliligi ve donanim secimi kullanım senaryosuna göre degisir. Bu yuzden kapı listesi yalnız ebat tablosu olarak değil, mahal fonksiyon matrisi olarak okunmalidir.",
      "Bunun yaninda bitmis döşeme kötü iç kapı performansinda kritik rol oynar. Seramik, parke, epoksi veya hali kalinligi; kapının alt boslugunu, hava sirkulasyonunu ve bazen ses kontrolünü etkiler. Kasa kötü kaba dosemeye göre sabitlenip daha sonra zemin kalinlasirsa kanat surtmesi kacinilmaz hale gelir. Tersine alt boşluk fazla buyurse mahremiyet, akustik ve görsel kalite zayiflar.",
      "Son olarak koruma disiplini unutulmamalidir. İç kapı cogu kez boyasi tamamlanmis, hassas yuzeyli bir urundur. Son isler surerken darbeye, neme ve kirlenmeye aciktir. Doğru monte edilen bir kapı, yeterli koruma yapilmadigi için teslimden önce zarar gorebilir. Bu nedenle kapının kalitesi sadece montaj aninda değil, diger ekipler bittikten sonra nasil korundugunda da belirlenir.",
    ],
    ruleTable: [
      {
        parameter: "Urun ve performans sinifi",
        limitOrRequirement: "İç kapılar mahal kullanimina uygun performans ve urun tanimi ile secilmelidir",
        reference: "TS EN 14351-2",
        note: "Her iç kapının aynı dayanım, ses veya ozel kullanım seviyesine sahip olmasi beklenmez.",
      },
      {
        parameter: "Kasa geometri kontrolü",
        limitOrRequirement: "Kasa şakul, gonye ve diyagonal olculeri fonksiyonel acilma kapanma davranisini saglayacak duzeyde olmalidir",
        reference: "Saha montaj disiplini",
        note: "İç kapidaki bircok problem malzemeden değil geometri kaybindan dogar.",
      },
      {
        parameter: "Bitmis yüzey ve döşeme kötü uyumu",
        limitOrRequirement: "Kasa, bitmis döşeme yuksekligi, süpürgelik ve duvar bitis kalinliklariyla birlikte konumlandirilmalidir",
        reference: "Mahal bitis paftası",
        note: "Kapı, kaba imalata göre değil tamamlanmis mekana göre ayarlanir.",
      },
      {
        parameter: "Ozel mahal kapıları",
        limitOrRequirement: "Yangın, akustik veya islak hacim gereksinimi olan kapılar ilgili mahal kosullarina uygun detay ve donanima sahip olmalidir",
        reference: "Yangın Yönetmeliği + proje notlari",
        note: "İç kapı genel bir basliktir; ozel mahallerde standart kapı davranisi yeterli olmaz.",
      },
      {
        parameter: "Sabitleme ve kabul",
        limitOrRequirement: "Kasa yalnız dolgu kopugune birakilmamali, mekanik sabitleme ve fonksiyon testiyle kabul edilmelidir",
        reference: "Uretici montaj detayi + saha kalite plani",
        note: "Iyi gorunen ama test edilmeyen kapı, teslimden sonra ariza olarak geri doner.",
      },
    ],
    designOrApplicationSteps: [
      "Kapı listesini mahal fonksiyonu, duvar tipi, kanat yonu, aksesuar ve ozel performans gereksinimi ile birlikte dondur.",
      "Kaba acikliklari yalnız bant metre ile değil, bitmis sıva kalinligi ve döşeme paketini de dusunerek yeniden kontrol et.",
      "Kasayi takoz ve mekanik bağlantı ile sabitle; kopugu destekleyici malzeme olarak kullan, taşıyıcı çözüm gibi gorme.",
      "Pervaz, süpürgelik ve esik iliskisini aynı anda cozumle; biri bittikten sonra digerine uydurma yolu kaliteyi bozar.",
      "Kanat takildiktan sonra kapının kendiliginden acilip kapanmadigini, bosluklarin dengeli dagildigini ve kilit karsiliginin tam oturdugunu test et.",
      "Son isler tamamlanana kadar kapıları koruyucu kaplama ve mahal bazli teslim listesi ile koru; darbe ve leke riskini teslime birakma.",
    ],
    criticalChecks: [
      "Kasa diyagonalleri ve şakul dogrulamasi olculerek yapildi mi?",
      "Bitmis döşeme kalinligi kapının alt bosluguna doğru yansitildi mi?",
      "Pervaz ile duvar bitisi arasinda acik, kirik veya asiri mastik ihtiyaci doguran boşluk var mi?",
      "Mentese, kilit ve kol takimi mahal kullanım yogunluguna uygun mu?",
      "Islak hacim, akustik veya yangın gerektiren mahallerde ozel kapılar genel tip ile karistirildi mi?",
      "Montaj sonrasi kapılar diger ekiplerin darbelerine karsi gercekten korunuyor mu?",
    ],
    numericalExample: {
      title: "Bitmis döşeme kotuna göre kapı alti boşluk karari",
      inputs: [
        { label: "Kapının ham montajdaki alt boşluğu", value: "28 mm", note: "Kaba döşeme üzerinde olculen boşluk" },
        { label: "Planlanan zemin paketi", value: "15 mm", note: "Seramik + yapıştırıcı veya parke paketi" },
        { label: "Hedef son boşluk", value: "8 mm", note: "Ornek oda kapısı fonksiyon boşluğu" },
        { label: "Amac", value: "Kasa kötü ve kanat ayarini önceden belirlemek", note: "Teslimde surtme riskini azaltmak" },
      ],
      assumptions: [
        "Kasa henuz son sabitleme asamasindadir ve ayar yapilabilir durumdadir.",
        "Zemin kaplaması kalinligi mahal listesinde dogrulanmistir.",
        "Kapının altinda ozel akustik veya yangın contasi gereksinimi yoktur.",
      ],
      steps: [
        {
          title: "Bitmis zemin sonrasi kalacak boşluğu hesapla",
          formula: "28 - 15 = 13 mm",
          result: "Zemin kaplaması bittiginde kapının altinda yaklasik 13 mm boşluk kalir.",
          note: "Ham montajdaki boşluk, bitmis kullanım boşluğu ile aynı okunmamalidir.",
        },
        {
          title: "Hedef boslukla karsilastir",
          formula: "13 - 8 = 5 mm",
          result: "Hedeflenen 8 mm yerine 13 mm kaldigi için 5 mm fazla boşluk vardir.",
          note: "Bu fark ses, mahremiyet ve görünür kaliteyi olumsuz etkileyebilir.",
        },
        {
          title: "Saha kararini ver",
          result: "Kasa kötü veya kanat boyu sabitleme öncesi yeniden ayarlanmali; sorun teslime birakilmamalidir.",
          note: "İç kapida en ucuz revizyon montaj sirasinda yapilan revizyondur.",
        },
      ],
      checks: [
        "Bitmis döşeme paketi tüm mahal tipleri için aynı olmayabilir; oda bazli kontrol gerekir.",
        "Kapı alti boşluğu sadece surtme için değil, akustik ve mahremiyet için de degerlendirilmelidir.",
        "Kilit ve mentese ayari, geometriyi kurtarmanin araci değil, ince ayar adimidir.",
        "Kasa sabitlendi ve pervaz kapandiysa sonradan duzeltme çok daha maliyetli hale gelir.",
      ],
      engineeringComment: "İç kapida milimetre seviyesindeki kot karari, kullanicinin her gun hissedecegi bir konfor sonucuna donusur.",
    },
    tools: DOOR_TOOLS,
    equipmentAndMaterials: DOOR_EQUIPMENT,
    mistakes: [
      { wrong: "Kasayi yalnız kaba acikliga göre secip bitmis sıva ve dosemeyi ihmal etmek.", correct: "Montaji bitmis mekan kalinliklariyla birlikte planlamak." },
      { wrong: "Kopugu taşıyıcı sabitleme gibi kullanmak.", correct: "Kasayi mekanik bağlantı ve kontrollu takoz sistemiyle kurmak." },
      { wrong: "Kapı listesinde butun mahalleri aynı urun tipiyle gecmek.", correct: "Kullanım senaryosuna göre donanim ve performans farklarini tanimlamak." },
      { wrong: "Pervaz ve süpürgelik iliskisini sonraya birakmak.", correct: "Kapı montajini duvar ve zemin bitisleriyle aynı karar paketi icinde cozumlemek." },
      { wrong: "Fonksiyon testini sadece rastgele birkaç kapida yapmak.", correct: "Tüm kapıları mahal bazli acilma, kapanma ve kilit testiyle kabul etmek." },
      { wrong: "Montaj bitince kapıları korumasiz birakmak.", correct: "Teslime kadar darbe, nem ve lekeye karsi kapıları aktif olarak korumak." },
    ],
    designVsField: [
      "Projede iç kapı numara ve ebat tablosu olarak görünür; sahada ise duvar kalinligi, döşeme kötü, pervaz bitisi ve donanim ayarinin birlesimine donusur.",
      "Iyi iç kapı dikkat cekmeden calisir; kötü iç kapı ise her acilis kapanista yapının kalitesini sorgulatir.",
      "Bu nedenle iç kapida basitlik algisi aldaticidir; detay ne kadar sessizse mühendislik o kadar doğru kurulmustur.",
    ],
    conclusion: [
      "İç kapilarin uzun omurlu ve kullanışlı olmasi, urun kalitesi kadar ölçülendirme, montaj, ayar ve koruma zincirinin doğru kurulmasina baglidir. Şantiyede bu zincir ihmal edilirse kusur kullanıcı tarafindan her gun tekrar fark edilir.",
      "Bir inşaat mühendisi için en doğru yaklasim, iç kapiyi marangozluk kalemi değil, bitmis mekan performans detayi olarak gormektir. Boylesi bir bakis hem estetik kusurlari hem de teslim sonrasi servis cagrilarini belirgin bicimde azaltir.",
    ],
    sources: [...INCE_DOOR_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_14351_2_SOURCE],
    keywords: ["iç kapı", "kasa montaji", "TS EN 14351-2", "bitmis döşeme kötü", "pervaz"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/dis-kapi"],
  },
];
