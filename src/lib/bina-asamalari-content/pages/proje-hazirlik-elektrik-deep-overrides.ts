import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJE_ELEKTRIK_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const ELEKTRIK_PROJECT_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "BIM modeli ve cakisma matrisi", purpose: "Pano, tava, saft ve zayif akim kararlarini mimari ve mekanikle birlikte okumak." },
  { category: "Cizim", name: "Tek hat semasi ve tava overlay paftalari", purpose: "Elektrik projesini saha tarafinda da okunabilir hale getirmek." },
  { category: "Kontrol", name: "Yuk listesi ve secicilik tablosu", purpose: "Kesici, kablo ve pano kararlarinin aynı mantikla ilerledigini dogrulamak." },
  { category: "Kayıt", name: "Revizyon ve teslim takip matrisi", purpose: "Ruhsat seti, uygulama seti ve saha revizyonunu tek kaynaktan yonetmek." },
];

const ELEKTRIK_PROJECT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokuman", name: "Pano semasi, devre listesi ve etiket seti", purpose: "Sahada okunabilir ve isletmeye devredilebilir elektrik altyapisini kurmak.", phase: "Proje ve teslim" },
  { group: "Koordinasyon", name: "Tava, boru ve saft kesit detaylari", purpose: "Asma tavan ve düşey saftlarda uygulama öncesi cakismayi azaltmak.", phase: "Koordinasyon" },
  { group: "Test", name: "Megger, sureklilik ve topraklama ölçüm ekipmani", purpose: "Proje kararlarinin devreye alma asamasinda olculebilir olmasini saglamak.", phase: "Devreye alma" },
  { group: "Kayıt", name: "As-built ve devre etiketleme klasoru", purpose: "Bakım ekibinin sahadaki devreyi proje diliyle okuyabilmesini saglamak.", phase: "Teslim" },
];

export const projeHazirlikElektrikDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/elektrik-projesi",
    kind: "topic",
    quote: "Elektrik projesi, kablonun nereye gidecegini degil; enerjinin binada nasil guvenli, okunabilir ve buyutulebilir yasayacagini tarif eder.",
    tip: "Elektrik projesini sadece pano ve priz sembolleri gibi gormek, saft, tava, secicilik, yangin gecisi ve bakım erisimi kararlarini sahaya birakmak demektir.",
    intro: [
      "Elektrik projesi, bir yapinin gunluk kullanimi ile acil durum davranisi arasinda kopru kuran ana sistemlerden biridir. Aydinlatma, priz, kuvvetli akim, zayif akim, pano hiyerarsisi, topraklama ve kritik yedek beslemeler aynı proje dilinde toplanmadiginda saha koordinasyonu hizla dagilir.",
      "Uygulamada en sık gorulen sorun, elektrik projesinin ruhsat eki seviyesinde kalmasi ve saha uygulanabilirliginin gecikmis revizyonlarla cozuleceginin varsayilmasidir. Oysa kablo tavalari, dikey saftlar, pano nisleri, zayif akim rezervleri ve yangin gecisleri proje asamasinda olgunlastirilmazsa asma tavanlar ve servis bosluklari sahada yeniden acilir.",
      "Bir insaat muhendisi için elektrik projesi yalnız elektrikcinin teknik dosyasi degildir. Tavan kötü, saft kesiti, yangin guvenligi, bakım erisimi ve teslim senaryosu bu projeyle doğrudan baglidir. Bu nedenle elektrik projesi, mimari ve mekanik disiplinlerle aynı masada okunmasi gereken bir koordinasyon belgesidir.",
      "Iyi elektrik projesi, montaj ekibinin ne yapacagini gosterdigi kadar bakım ekibinin yillar sonra neyi nasil okuyacagini da tanimlar. Proje kalitesi bu ikinci soruya da cevap verebildiginde olgunlasir.",
    ],
    theory: [
      "Elektrik projesinde iki ana eksen vardir: enerji tasima ve koruma mantigi. Enerjiyi doğru noktaya goturmek yeterli degildir; kısa devre, kacak akim, secicilik ve topraklama surekliligi doğru kurulmazsa aynı sistem guvenli kabul edilemez. Bu nedenle yuk listesi, kesici secimi ve kablo guzergahi birbirinden bagimsiz dusunulemez.",
      "Fiziksel yerlesim de en az hesap kadar onemlidir. Bir pano teorik olarak doğru secilebilir; ancak pano onunde bakım boslugu yoksa, tava dolulugu asiriysa veya zayif akim aynı alanda rezervsiz cozulduyse sistem isletmede sorun uretir. Elektrik projesi bu nedenle yalnız tek hat semasindan ibaret degildir; hacimsel bir koordinasyon modelidir.",
      "Yangin guvenligi elektrik projesinin ayri bir koludur. Kablo gecisleri, yangina dayanikli bolmeler, kritik hatlarin korunmasi ve acil durum sistemlerinin okunabilirligi proje notuna degil detay seviyesine ihtiyaç duyar. Sahada bu detaylar gecikirse yangin guvenligi performansi doğrudan zayiflar.",
      "TS HD 60364 mantigi da bunu destekler: proje cizilmekle bitmez, olculur, test edilir ve etiketlenir. Projede bu teslim zinciri kurulmamissa sahadaki kaliteli montaj dahi tam anlamiyla guvence uretemez.",
    ],
    ruleTable: [
      {
        parameter: "Koruma ve secicilik",
        limitOrRequirement: "Kesiciler, kablo kesitleri ve topraklama mantigi koordineli secilmeli",
        reference: "TS HD 60364",
        note: "Yuk listesi ile pano semasi ayri hikaye anlatmamali.",
      },
      {
        parameter: "Yangin gecisleri ve zonlar",
        limitOrRequirement: "Kablo gecisleri ve kritik devreler yangin guvenligi stratejisiyle birlikte tanimlanmali",
        reference: "Binalarin Yangindan Korunmasi Hakkinda Yonetmelik",
        note: "Yangin durdurucu karari saha refleksine birakilamaz.",
      },
      {
        parameter: "Pano ve tava yerlesimi",
        limitOrRequirement: "Bakım erisimi, rezerv alan ve okunabilir etiketleme proje asamasinda kurulmus olmali",
        reference: "TS HD 60364 + proje koordinasyon disiplini",
        note: "Sigan ama bakım yapilmayan yerlesim teknik olarak eksiktir.",
      },
      {
        parameter: "Devreye alma teslimi",
        limitOrRequirement: "Izolasyon, sureklilik ve etiketleme senaryosu proje dosyasina dahil edilmeli",
        reference: "TS HD 60364 dogrulama yaklasimi",
        note: "Teslim plani cizimin sonradan eki degil projenin parcasidir.",
      },
    ],
    designOrApplicationSteps: [
      "Yuk listesi, pano hiyerarsisi ve kritik besleme senaryosunu bina kullanimina göre netlestir.",
      "Tava, boru ve saft guzergahlarini mekanik sistemler ve asma tavan kararlarina karsi overlay ile cakistir.",
      "Pano nisleri, servis bosluklari ve test-ölçüm erisimini mimari planlarda kesinlestir.",
      "Yangin gecisleri, zayif akim rezervleri ve kritik hat ayrimlarini detay paftalara tasir.",
      "Tek hat semasi ile saha etiketleme mantigini aynı devre kodlari uzerinden kur.",
      "As-built, test ve devreye alma teslimini ana teslim paketi olarak planla.",
    ],
    criticalChecks: [
      "Pano onlerinde bakım ve acma-kapama için yeterli servis alani var mi?",
      "Ana tava ve saftlar gelecekteki rezerv ihtiyacini tasiyor mu?",
      "Yangin bolmelerindeki kablo geçiş detaylari acikca tanimlandi mi?",
      "Zayif akim ve kuvvetli akim ayrimi fiziki ve dokumansal olarak net mi?",
      "Devre etiketleri pano semasi, saha etiketi ve as-built cizimle birebir uyumlu mu?",
      "Test ve dogrulama adimlari daha proje asamasinda yazili mi?",
    ],
    numericalExample: {
      title: "400 x 60 mm kablo tavasinda doluluk ve rezerv yorumu",
      inputs: [
        { label: "Tava genisligi", value: "400 mm", note: "Ana koridor hattinda ornek tava" },
        { label: "Faydali yukseklik", value: "60 mm", note: "Yerlesim için etkili yukseklik" },
        { label: "Toplam kablo paketi", value: "11.000 mm2", note: "Kuvvetli akim devrelerinin yaklasik alan toplami" },
        { label: "Hedef doluluk bandi", value: "%40-%60", note: "Bakım ve buyume rezervi için" },
      ],
      assumptions: [
        "Zayif akim bu tavadan ayridir.",
        "Dirsek ve bağlantı noktalarinda ilave yer kaybi olacaktir.",
        "Asgari bir buyume rezervi istenmektedir.",
      ],
      steps: [
        {
          title: "Brut tava kesitini hesapla",
          formula: "400 x 60 = 24.000 mm2",
          result: "Tavanin brut tasima alani 24.000 mm2 görünür.",
          note: "Gercek kullanilabilir alan, tutucu elemanlar ve donuslerle azalir.",
        },
        {
          title: "Doluluk oranini hesapla",
          formula: "11.000 / 24.000 ~= %46",
          result: "Yaklasik %46 doluluk, ilk kurulum için dengeli bir bandi isaret eder.",
          note: "Bu oran, hem montaj hem gelecek ilaveler için makul rezerv birakir.",
        },
        {
          title: "Proje kararini yorumla",
          result: "Aynı tavaya ilave zayif akim veya yeni besleme eklenecekse ayrik hat veya daha buyuk tava dusunulmelidir.",
          note: "Elektrik projesinde rezerv, luks degil uzun omurlu bakım kararidir.",
        },
      ],
      checks: [
        "Tava dolulugu tek basina yeterli kriter degildir; erişim ve etiketleme de korunmalidir.",
        "Yangin ve acil durum hatlari gerekirse ayri guzergah mantigiyla ele alinmalidir.",
        "Pano ve tava kodlari aynı sistemde isimlendirilmeli, sahada farkli dil olusmamalidir.",
        "Rezervsiz cozum, ilk revizyonda asma tavan ve saft krizine donusebilir.",
      ],
      engineeringComment: "Elektrik projesinde bosluk, tasarim zayifligi degil bakım ve buyume aklinin kanitidir.",
    },
    tools: ELEKTRIK_PROJECT_TOOLS,
    equipmentAndMaterials: ELEKTRIK_PROJECT_EQUIPMENT,
    mistakes: [
      { wrong: "Elektrik projesini yalnız tek hat semasiyla kapatmak.", correct: "Tava, saft, yangin gecisi ve bakım erisimini aynı set icinde cozmek." },
      { wrong: "Pano yerini bos kalan duvara göre belirlemek.", correct: "Servis boslugu ve isletme senaryosu ile birlikte secmek." },
      { wrong: "Yangin gecislerini saha refleksine birakmak.", correct: "Detay paftada net tarifleyip koordinasyonla kapatmak." },
      { wrong: "Etiketleme planini teslim sonuna ertelemek.", correct: "Proje kodlamasini montaj baslangicindan itibaren kurmak." },
      { wrong: "Tava boyutunu sadece bugunku kablo listesine göre secmek.", correct: "Bakım ve buyume rezervi birakmak." },
      { wrong: "Test ve dogrulama mantigini uygulama sonrasi dusunmek.", correct: "Proje paketi icine daha en basta yazmak." },
    ],
    designVsField: [
      "Tasarim masasinda elektrik projesi cizgiler ve sembollerle ilerler; sahada ise aynı kararlar saft kesiti, tava donusu, pano on boslugu ve etiket dili olarak fiziksel karsilik bulur.",
      "Bu nedenle iyi elektrik projesi, sadece enerji veren degil bakım ve yangin guvenligi acisindan okunabilir bir sistem kurar.",
      "Sahada en az problem cikan projeler, devre mantigini montaj ekibi kadar isletme ekibinin de anlayabildigi projelerdir.",
    ],
    conclusion: [
      "Elektrik projesi erken safhada olgunlastirildiginda saftlar, tavanlar ve pano mekanlari sahada ikinci kez tartisilmaz; montaj daha temiz, teslim daha guvenli ilerler.",
      "Zayif kurgulandiginda ise sorun yalnız kabloda degil; yangin guvenliginden bakım okunabilirligine kadar binanin tüm isletme omrune yayilir.",
    ],
    sources: [...PROJE_ELEKTRIK_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi, SOURCE_LEDGER.planliAlanlar],
    keywords: ["elektrik projesi", "tek hat semasi", "pano secicilik", "kablo tavasi", "TS HD 60364"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/tesisat-projesi", "tesisat-isleri/elektrik-tesisati"],
  },
];
