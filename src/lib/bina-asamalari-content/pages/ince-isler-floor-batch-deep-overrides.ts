import { BRANCH_SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FLOOR_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_1504_2_SOURCE: BinaGuideSource = {
  title: "TS EN 1504-2 Beton Yüzey Koruma Sistemleri",
  shortCode: "TS EN 1504-2",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Beton yuzeyler uzerindeki koruyucu kaplama ve performans beklentileri için temel referanslardan biridir.",
};

const TS_EN_13813_SOURCE: BinaGuideSource = {
  title: "TS EN 13813 Sap Malzemeleri ve Zemin Saplari",
  shortCode: "TS EN 13813",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Epoksi altligi olacak sap ve alt zemin kalitesinin yorumlanmasinda kullanilan temel standart eksenlerinden biridir.",
};

const EPOXY_TOOLS: BinaGuideTool[] = [
  { category: "Hazirlik", name: "Nem olcer, pull-off test ve yüzey profil karti", purpose: "Alt betonun epoksiye hazir olup olmadigini sayisal olarak dogrulamak." },
  { category: "Uygulama", name: "Shot blasting, sanayi vakumu ve karisim ekipmani", purpose: "Parlak ve tozlu yuzeyi aderans kabul edecek purlulukte hazirlamak." },
  { category: "Kontrol", name: "Katman kalinlik takibi ve ortam sıcaklık-nem cizelgesi", purpose: "Sistemin yalnız surulmus degil doğru kosulda uygulanmis oldugunu gostermek." },
  { category: "Teslim", name: "Alan koruma plani ve trafik acma matrisi", purpose: "Erken kullanimla kaplamanin zedelenmesini onlemek." },
];

const EPOXY_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt zemin", name: "Beton veya sap altlik, catlak tamir harci ve lokal onarim malzemeleri", purpose: "Kaplamanin tasiyacagi yuzeyi düzgün ve taşıyıcı hale getirmek.", phase: "Hazirlik" },
  { group: "Hazirlik ekipmani", name: "Shot blast, taslama, freze ve vakum seti", purpose: "Yüzey sutunu, tozu ve gevsek tabakalari kontrollu bicimde uzaklastirmak.", phase: "Mekanik hazirlik" },
  { group: "Kaplama sistemi", name: "Astar, ara kat, quartz serpme ve son kat epoksi", purpose: "Kullanım sinifina uygun katmanli performans sistemi olusturmak.", phase: "Uygulama" },
  { group: "Kontrol", name: "Film kalinlik taragi, higrometre ve koruma bariyerleri", purpose: "Katman kalinligini ve kur sartlarini teslim anina kadar izlemek.", phase: "Kabul" },
];

export const inceIslerFloorBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/zemin-kaplamalari/epoksi-kaplama",
    kind: "topic",
    quote: "Epoksi kaplama, zemini boyamaz; doğru hazirlanmis altligi kimyasal, mekanik ve hijyenik bir performans kabuguna donusturur.",
    tip: "Epoksi kaplamada en buyuk hata, parlak son yuzeyi basari sanip alt betonun nemini, purlulugunu ve catlaklarini ikinci plana atmaktir.",
    intro: [
      "Epoksi kaplama; otopark, endustriyel alan, laboratuvar, depo, teknik hacim ve hijyenik mahallerde sık kullanilan derzsiz zemin sistemlerinden biridir. Kolay temizlenmesi, kontrollu doku secenekleri, kimyasal dayanim ve yoğun trafik altinda servis verebilmesi onu cazip hale getirir. Ancak sahadaki gercek basari, son katin renginde veya parlakliginda degil; alt yuzeyin bu sistemi gercekten tasiyip tasiyamadiginda gizlidir.",
      "Santiyede epoksi kaplama cogu zaman son dakikada giren bir 'parlatma' kalemi gibi algilanir. Bu bakis hatalidir. Cunku epoksi, boya gibi kusuru orten bir katman degil; kusuru oldugu gibi yukariya tasiyan ince bir performans sistemidir. Nemli beton, zayif sap, tozlu yüzey, iyi tamir edilmemis catlak veya yetersiz mekanik hazirlik varsa sistem kısa surede kabarma, soyulma, baloncuk veya yerel kopmalar uretir.",
      "Bir insaat muhendisi için epoksi kaplama yalnız ince iş konusu degildir. Alt betonun kacinci gunde oldugu, saha kuruma kosullari, beton sinifi, lokal tamirlerin kalitesi, zemin derzleri ve kullanima acma takvimi birlikte okunmalidir. Cunku epoksinin performansi, alt yapinin ne kadar disiplinli tamamlandigiyla doğrudan baglantilidir.",
      "Bu yazida epoksi kaplamayi; teorik aderans mantigi, standart ekseni, sayisal nem ve katman yorumu, araçlar, malzemeler ve saha hatalariyla birlikte tam blog yazisi derinliginde ele aliyoruz. Amac, epoksiyi son kat estetik karar degil; zemin performans muhendisligi olarak okumak.",
    ],
    theory: [
      "Epoksi sisteminin teorik temeli, alt zemin ile kaplama arasinda hem mekanik hem kimyasal bir bag kurmasidir. Bu bag ancak beton veya sap yeterince saglam, temiz ve uygun purlulukte ise calisir. Yüzey sutunun kaldirilmasi, tozun tamamen uzaklastirilmasi ve gevsek bolgelerin temizlenmesi bu nedenle sadece hazirlik degil, sistemin omurgasidir. Mekanik hazirlik zayifsa, iyi recine bile saglam yapisamaz.",
      "Nem konusu epoksinin en kritik davranislarindan biridir. Beton icindeki serbest su veya alttan gelen kapiler nem, kaplama altinda buhar basinci ureterek kabarma ve aderans kaybi dogurabilir. Üst yüzey kuru gibi gorunse bile alt tabakada nem tutulabilir. Bu nedenle epoksiye gecmeden once nemin cihazla ve kayitla dogrulanmasi gerekir; göz karariyla verilen onay, bu sistemde pahali hatadir.",
      "Katman kurgusu da doğrudan kullanım sinifina baglidir. Hafif yaya trafigi olan teknik mahal, forklift giren depo, kimyasal temizlige maruz laboratuvar ve otopark aynı sistemi istemez. Bazilarinda ince sealer tipi cozum yeterli olabilirken bazilarinda quartz dolgulu, kaymaz ve daha kalin yapili sistem gerekir. Epoksi secimi bu nedenle renk katalogu degil, servis sinifi kararidir.",
      "Catlaklar ve derzler ayri bir muhendislik konusudur. Mevcut yapisal catlagi yalnız recine ile uzerinden gecmek, problemi estetige indirmek olur. Hareket eden derzler, kontrol derzleri ve yapisal catlaklar farkli cozum ister. Epoksi katman hareketi absorbe etmeyen kisimlarda sadece kusuru görünür hale getirmez; aynı zamanda daha genis alanlara yayabilir.",
      "Son olarak saha lojistigi unutulmamalidir. Epoksi tamamlandiktan sonra erken trafik, tozlu ortam, baska ekiplerin calismaya devam etmesi veya uygunsuz temizlik bile sistemi bozabilir. Bu nedenle epoksi kaplama yalnız uygulama degil, uygulama sonrasi alan koruma ve devreye alma planidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt zemin saglamligi ve hazirligi",
        limitOrRequirement: "Beton veya sap, tozdan arindirilmis, taşıyıcı ve mekanik hazirligi tamamlanmis durumda olmalidir",
        reference: "TS EN 1504-2",
        note: "Parlak ama zayif bir yüzey epoksi için uygun kabul edilmez.",
      },
      {
        parameter: "Nem kontrolu",
        limitOrRequirement: "Kaplama öncesi alt zemin nemi urun sisteminin izin verdigi esiklerle dogrulanmalidir",
        reference: "Urun teknik foyu + saha kontrol plani",
        note: "Üst yüzey kuru gorunse bile iç nem kritik sorun yaratabilir.",
      },
      {
        parameter: "Sap ve altlik kalitesi",
        limitOrRequirement: "Epoksi altligi olacak sap, düzgün, catlaksiz ve yeterli yüzey dayanimina sahip olmalidir",
        reference: "TS EN 13813",
        note: "Zayif sap, iyi epoksiyi de kısa surede tasiyamaz hale getirir.",
      },
      {
        parameter: "Katman ve kullanım sinifi uyumu",
        limitOrRequirement: "Astar, ara kat ve son kat kalinligi trafik, kimyasal maruziyet ve kaymazlik gereksinimine göre secilmelidir",
        reference: "Sistem tasarim karari",
        note: "Her mahal için aynı epoksi sistemi kullanmak teknik olarak zayif bir yaklasimdir.",
      },
      {
        parameter: "Kullanım acma suresi",
        limitOrRequirement: "Yaya ve araç trafigine acma sureleri urun sistemine ve ortam kosullarina göre korunmalidir",
        reference: "Uretici uygulama talimati",
        note: "Erken trafik, yeni tamamlanmis sistemi geri donusuz zedeleyebilir.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal kullanım senaryosunu netlestir; hafif trafik, agir trafik, kimyasal maruziyet ve kaymazlik ihtiyacini tek tabloda topla.",
      "Alt betonu veya sapi nem, purluluk, dayanim ve catlak acisindan test et; epoksiye gecmeden once sorunlu bolgeleri teknik olarak onar.",
      "Shot blast, taslama ve vakum temizligi ile yüzey sutunu ve tozu tamamen uzaklastir; epoksiyi kirli yuzeye emanet etme.",
      "Astar, ara kat ve son kat sistemini mahal riskine göre sec; kaymazlik veya quartz serpme gibi ihtiyaclari renk seciminden once belirle.",
      "Uygulama sirasinda ortam sicakligi, bagil nem ve katmanlar arasi bekleme pencerelerini kayda bagla.",
      "Kaplama sonrasi alan koruma, toz kontrolu ve trafik acma planini netlestir; diger ekiplerin zemine erken girisini engelle.",
    ],
    criticalChecks: [
      "Alt zemin nemi cihazla olculdu mu ve kayda baglandi mi?",
      "Yuzeyde parlak sut tabakasi, yag, toz veya gevsek bölge kaldi mi?",
      "Catlaklar hareketli mi, yapisal mi, yoksa yalnız yuzeysel mi; buna göre ayri cozum uygulandi mi?",
      "Secilen epoksi sistemi gercek trafik ve kimyasal kullanima uygun mu?",
      "Katman kalinligi ve katlar arasi bekleme suresi sahada kontrol edildi mi?",
      "Kaplama bittikten sonra alanin korunmasi ve kullanima acma takvimi net mi?",
    ],
    numericalExample: {
      title: "Nem ve kaplama takvimi için basit saha yorumu",
      inputs: [
        { label: "Alan", value: "450 m2", note: "Depo ve teknik koridor karmasi" },
        { label: "Olculen alt zemin nemi", value: "%4,5", note: "Urun teknik foyi ornek esigi olan %4'un ustunde" },
        { label: "Hedef sistem", value: "Astar + quartz dolgulu ara kat + son kat", note: "Agir trafik hedefi" },
        { label: "Planlanan teslim", value: "4 gun sonra", note: "Program baskisi olan saha" },
      ],
      assumptions: [
        "Nem olcumu aynı cihaz ve benzer ortam kosulunda birden fazla noktada alinmistir.",
        "Urun sistemi %4 nem ustunde uygulama için ilave cozum istemektedir.",
        "Alan agir ekipman trafigine acilacaktir.",
      ],
      steps: [
        {
          title: "Nem verisini esikle karsilastir",
          formula: "4,5 > 4,0",
          result: "Alt zemin, secilen sistem için halen riskli nem seviyesindedir.",
          note: "Gorunurde kuru yüzey, sistem için guvenli oldugu anlamina gelmez.",
        },
        {
          title: "Takvim baskisini yorumla",
          result: "4 gun sonraki teslim hedefi, ilave kuruma veya nem bariyer cozumleri degerlendirilmeden teknik olarak zayif kalir.",
          note: "Epoksi program baskisiyla zorlandiginda hata altinda gizlenir, ustunde degil.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Ya kuruma sureci uzatilmali ya da sisteme uygun nem bariyerli bir kurguya gecilmelidir.",
          note: "Teslim tarihi, zeminin teknik gerceginden once gelemez.",
        },
      ],
      checks: [
        "Nem olcumu tek noktada degil alan dagilimina göre tekrarlanmalidir.",
        "Agir trafik alanlari ince dekoratif sistemlerle gecistirilmemelidir.",
        "Takvim karari teknik esiklerin onune gecmemelidir.",
        "Kaplama sonrasi ilk trafik zamani sahada yazili ve kontrollu ilan edilmelidir.",
      ],
      engineeringComment: "Epoksi kaplamada en pahali hata, zeminin hazir olmadigi bir gunde yalnız program hazir diye uygulamaya girmektir.",
    },
    tools: EPOXY_TOOLS,
    equipmentAndMaterials: EPOXY_EQUIPMENT,
    mistakes: [
      { wrong: "Epoksiyi son kat boya gibi dusunup mekanik yüzey hazirligini hafife almak.", correct: "Aderansi belirleyen asil konunun alt zemin oldugunu kabul etmek." },
      { wrong: "Nem olcmeden uygulamaya girmek.", correct: "Urun esiklerine göre cihazla ölçüm yapip kayıt tutmak." },
      { wrong: "Catlak ve derzleri estetik kusur gibi ele almak.", correct: "Hareketli ve yapisal kusurlari ayri teknik detayla cozumlemek." },
      { wrong: "Her mahalde aynı epoksi kalinligini kullanmak.", correct: "Trafik, kimyasal ve kaymazlik ihtiyacina göre sistem secmek." },
      { wrong: "Kaplama biter bitmez alani diger ekiplere acmak.", correct: "Kullanım acma suresini sistem sartina göre disiplinle korumak." },
      { wrong: "Yüzey purlulugunu ve temizligini göz karariyla onaylamak.", correct: "Hazirligi test, goruntu ve kontrol listesiyle belgelemek." },
    ],
    designVsField: [
      "Projede epoksi renk ve doku olarak secilir; sahada ise bu rengin altinda duran betonun ne kadar kuru, temiz ve taşıyıcı oldugu sonucu belirler.",
      "Iyi epoksi kaplama parlamaktan once saglam tutunur; kötü epoksi ise ilk darbede veya ilk buhar basincinda gercegini ortaya koyar.",
      "Bu nedenle epoksi, ince isler icinde belki de en fazla alt yapı kalitesine bagimli sistemlerden biridir.",
    ],
    conclusion: [
      "Epoksi kaplama doğru alt zemin, doğru sistem secimi ve doğru alan yonetimi ile uygulandiginda uzun omurlu, temizlenebilir ve teknik olarak guvenilir bir zemin sunar. Bu zincirlerden biri zayif oldugunda hata son katta degil butun sistemde kendini gosterir.",
      "Bir insaat muhendisi için en saglam bakis, epoksiyi dekoratif parlaklik degil; beton altligin kabulunu zorunlu kilan bir performans kaplamasi olarak gormektir.",
    ],
    sources: [...FLOOR_BATCH_SOURCES, TS_EN_1504_2_SOURCE, TS_EN_13813_SOURCE],
    keywords: ["epoksi kaplama", "TS EN 1504-2", "TS EN 13813", "zemin nemi", "yüzey hazirligi"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
];
