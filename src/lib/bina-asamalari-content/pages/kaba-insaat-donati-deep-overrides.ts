import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_DONATI_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const DONATI_DEEP_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad / ETABS donati ciktilari", purpose: "Kiris boyunca degisen ihtiyaci saha paftasiyla eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve bukum listesi", purpose: "Cap, adet, bindirme ve etriye mantigini tekrar edilebilir hale getirmek." },
  { category: "Kontrol", name: "Bindirme ve pas payi checklisti", purpose: "Beton oncesi son kabulde kritik detaylari hizli kapatmak." },
  { category: "Olcum", name: "Spacer, sehpa ve dugum kabul listesi", purpose: "Yogun dugumlerde betonun gececegi boslugu korumak." },
];

const DONATI_DEEP_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve bukum sehpalari", purpose: "Donatinin cap, boy ve kanca detayina uygun hazirlanmasini saglamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense ve montaj ekipmani", purpose: "Boyuna ve enine donatinin beton oncesi stabil kalmasini saglamak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Pas payi takozu, spacer ve sehpa", purpose: "Ortuyu ve katman araligini beton dokumu boyunca korumak.", phase: "On kabul" },
  { group: "Guvenlik", name: "Filiz koruyucu ve gecici platformlar", purpose: "Yogun donati alanlarinda saha guvenligi ve duzenli erisim saglamak.", phase: "Montaj sonrasi" },
];

export const kabaInsaatDonatiDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kiris-donati",
    kind: "topic",
    quote: "Kiris donatisi, demir adedinin degil; moment, kesme, ankraj ve beton yerlesebilirliginin ayni kesitte uzlasmasidir.",
    tip: "Kiris donatisini sadece alt-ust demir sayisi gibi gormek, mesnet dugumu, etriye sikilastirmasi ve betonun o dugumden gecme ihtiyacini ihmal etmek demektir.",
    intro: [
      "Kiris donatisi, betonarme sistemin sahada en sik tekrar eden ama en yogun hata biriktiren imalatlarindan biridir. Cunku kiris, aciklik momenti ile mesnet davranisini, boyuna donati ile etriyeyi, shop drawing ile beton yerlesebilirligini ayni anda yonetir.",
      "Bir saha muhendisi icin kiris donatisi yalnizca demir baglatmak degildir. Ust donatinin nerede devraldigi, alt donatinin aciklikta nasil calistigi, etriye adiminin nerede degistigi, bindirmelerin nereye yigildigi ve vibratorun bu dugume nasil girecegi birlikte okunmalidir.",
      "Sahada en yaygin hata, analizden gelen donati miktarini nihai cozum sanmaktir. Oysa shop drawing zayifsa demirler ust uste biner, pas payi kaybolur, kalipla mesafe azalir ve betonun akisi bozulur.",
      "Bu nedenle kiris donatisi, hesap dogrulugunun saha okunabilirligine donustugu ana esiktir. Iyi yonetilmeyen kiris detayi, ilk anda degil kalip sokumu ve servis davranisinda sorun uretir.",
    ],
    theory: [
      "Kirislerde boyuna donati egilme momentini tasir; etriyeler ise kesme kuvveti, sargi ve dugum disiplininde kritik rol oynar. Boyuna demiri arttirmak, etriye veya bindirme hatasini telafi etmez. Yani elemanin guvenligi toplamdaki metal miktarindan cok detay organizasyonuna baglidir.",
      "Mesnet ve aciklik bolgeleri ayni mantikla okunmaz. Mesnette ustte, aciklikta altta calisan donati ihtiyaci degisir. Bu nedenle kiris tek kesit cizimiyle anlasilmaz; boy boyunca donati davranisinin nerede degistigi paftada net olmali, sahada da buna gore kurulum yapilmalidir.",
      "Bindirme ve ankraj kararlari yalniz dayanima degil saha uygulanabilirligine de baglidir. Kritik dugumlerde ayni anda fazla demir toplandiginda beton gecisi zorlasir, vibrator erisimi kaybolur ve kagit uzerinde dogru olan detay sahada kalitesiz uretilebilir.",
      "TS 500 ve TBDY 2018 mantigi birlikte okundugunda kiris, deprem davranisinin da kritik elemanlarindan biridir. Bu nedenle etriye sikilastirma ve boyuna donati surekliligi, yalniz ustalik refleksiyle degil muhendislik denetimiyle korunmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna donati surekliligi",
        limitOrRequirement: "Mesnet ve aciklik donatilari paftada net ayrismali, kesilen ve devam eden barlar acikca gosterilmeli",
        reference: "TS 500 + TBDY 2018 Bolum 7",
        note: "Kiris boyunca degisen davranis tek bir kesit resmiyle anlatilamaz.",
      },
      {
        parameter: "Etriye ve sikilastirma bolgesi",
        limitOrRequirement: "Mesnete yakin bolgelerde etriye adimi deprem detaylarina uygun sikilikta korunmali",
        reference: "TBDY 2018 Bolum 7",
        note: "Saha kolayligi icin etriye acmak deprem performansini dusurur.",
      },
      {
        parameter: "Bindirme ve ankraj",
        limitOrRequirement: "Bindirmeler kritik dugumlere yigilmamali, ankraj mantigi shop drawing uzerinden okunabilmeli",
        reference: "TS 500",
        note: "Ayni noktaya yigilmis demir, beton yerlesebilirligini bozar.",
      },
      {
        parameter: "Beton gecisi ve pas payi",
        limitOrRequirement: "Donati dizilisi vibrator ve taze beton gecisine izin verecek sekilde kurulmalidir",
        reference: "TS EN 13670 + saha kabul disiplini",
        note: "Hesapta yeterli olan her dugum sahada betonlanabilir olmayabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Analiz ciktisini shop drawing mantigina cevir; alt, ust, mesnet ve aciklik bolgelerini ayri ayri tarif et.",
      "Etriye adimi degisen bolgeleri paftada ve sahada kolay okunur isaretlerle belirle.",
      "Kiris-kolon dugumunde kolon donatisi, doseme donatisi ve tesisat rezervasyonlarini birlikte kontrol et.",
      "Spacer, sehpa ve pas payi elemanlarini donatinin gercek agirligini tasiyacak sekilde sec.",
      "Yogun dugumlerde hortum ve vibrator erisimini beton oncesi saha turunda fiilen denetle.",
      "Son kabulde cap, adet, bindirme, etriye adimi ve beton gecisi mantigini ayni checklistte kapat.",
    ],
    criticalChecks: [
      "Mesnet ve aciklik donatilari shop drawing uzerinde net okunuyor mu?",
      "Etriye sikilastirma bolgeleri sahada seyreltilmis mi?",
      "Bindirmeler ayni kesitte yigilarak beton gecisini zorluyor mu?",
      "Kolon-kiris dugumunde vibrator girecek bosluk gercekten var mi?",
      "Pas payi ve sehpa duzeni donatinin agirligini tasiyor mu?",
      "Beton oncesi cap ve adet kontrolu gercekten yapildi mi?",
    ],
    numericalExample: {
      title: "30/60 kiriste ilk alt donati alani yorumu",
      inputs: [
        { label: "Kesit", value: "b = 300 mm, h = 600 mm", note: "Tipik betonarme kiris" },
        { label: "Faydali yukseklik", value: "d = 550 mm", note: "Yaklasik saha degeri" },
        { label: "Tasarim momenti", value: "Md = 180 kNm", note: "Aciklik bolgesi" },
        { label: "Donati dayanimi", value: "fyd = 365 MPa", note: "B420C varsayimi" },
      ],
      assumptions: [
        "Hizli saha yorumu icin z ~= 0,9d kabul edilmistir.",
        "Icil kuvvetler proje hesabindan gelmektedir.",
        "Nihai secim deprem detaylariyla birlikte yapilacaktir.",
      ],
      steps: [
        {
          title: "Ic kuvvet kolunu tahmin et",
          formula: "z ~= 0,9 x 550 = 495 mm",
          result: "Yaklasik tasarim kolu 495 mm kabul edilir.",
          note: "Bu adim kesin kesit hesabinin yerine gecmez, saha on yorumu saglar.",
        },
        {
          title: "Gerekli donati alanini hesapla",
          formula: "As ~= 180000000 / (365 x 495) = 996 mm2",
          result: "Yaklasik 1000 mm2 alt donati ihtiyaci gorunur.",
          note: "4phi18 teorik olarak bu alani saglar; ancak dugum yogunlugu ayrica sorgulanmalidir.",
        },
        {
          title: "Uygulanabilirligi yorumla",
          result: "Alan yeterli gorunse bile mesnet ust donatisi ve etriye yogunlugu ile birlikte kesit tekrar okunmalidir.",
          note: "Kiris donatisi yalniz alan hesabiyla kapanmaz; beton gecisi de kontrol ister.",
        },
      ],
      checks: [
        "Alan hesabiyla secilen donati deprem detayi ve bindirme mantigi ile birlikte okunmalidir.",
        "Daha buyuk cap her zaman daha iyi saha cozumu anlamina gelmez.",
        "Boyuna donati karari etriye yogunlugundan bagimsiz dusunulmemelidir.",
        "Nihai cozum shop drawing uzerinde beton yerlesebilirligiyle dogrulanmalidir.",
      ],
      engineeringComment: "Kiris donatisinda hesap ilk kapidir; asil kalite, o hesabin sahada baglanabilir ve betonlanabilir bir dugume donusebilmesidir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Kiris donatisini yalniz alt ust demir sayisi gibi okumak.", correct: "Mesnet, aciklik, etriye ve beton gecisi mantigini birlikte yonetmek." },
      { wrong: "Bindirmeleri sahada bos buldugu yere toplamak.", correct: "Kritik dugumlerden uzak ve paftada tanimli bolgelerde tutmak." },
      { wrong: "Etriye sikilastirmasini usta kolayligina gore seyretmek.", correct: "Deprem detayi olarak aynen korumak." },
      { wrong: "Spacer ve sehpa secimini onemsiz gormek.", correct: "Donati stabilitesinin ana parcasi saymak." },
      { wrong: "Yogun dugumde betonu kendi akisiyla birakmak.", correct: "Vibrator ve hortum erisimini once denetlemek." },
      { wrong: "Pafta okumasini kalip kapanmadan once tamamlamamak.", correct: "Beton oncesi dugum detayini birlikte kapatmak." },
    ],
    designVsField: [
      "Tasarim ofisinde kiris donatisi alan ve caplarla gorunur; sahada ise ayni kararlarin baglanabilir, betonlanabilir ve denetlenebilir hale gelmesi gerekir.",
      "Iyi kiris detayi, projede guclu gorundugu icin degil sahada fazla yorum istemeden tekrarlandigi icin degerlidir.",
      "Bu nedenle kiris donatisi, statik hesap kadar uygulama muhendisligi cizimidir.",
    ],
    conclusion: [
      "Kiris donatisi dogru cizilip dogru kurulursa betonarme sistem projedeki davranisina daha yakin uretilir.",
      "Yanlis yonetildiginde ise sorun yalniz demir eksigi olarak degil; petek, pas payi kaybi, dugum zorlugu ve uzun vadeli performans dususu olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["kiris donati", "betonarme kiris", "etriye", "bindirme", "TS 500 TBDY"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kolon-donati"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/pas-payi",
    kind: "topic",
    quote: "Pas payi, milimetre gibi gorunen ama betonarme elemanin omru, aderansi ve yangin davranisini ayni anda belirleyen bir koruma katmanidir.",
    tip: "Pas payini yalniz takoz koyma isi sanmak, donatinin betonda hangi mesafede yasadigini ve yapinin uzun omrunu belirleyen kalite kapisini kucumsemektir.",
    intro: [
      "Pas payi, donati ile dis ortam arasinda birakilan koruyucu beton ortusudur. Uygulamada kucuk bir detay gibi gorunse de korozyon direnci, aderans, yangin performansi ve gorunur beton kalitesi bu kararin dogruluguna dogrudan baglidir.",
      "Sahada pas payi genellikle beton oncesi kisa bir bakisla kontrol edilen basliklardan biridir. Oysa takoz tipi, yerlestirme araligi, kalip rijitligi, yurume trafigi ve donati agirligi birlikte dusunulmezse beton oncesi dogru gorunen sistem dokum aninda bozulabilir.",
      "Bir muhendis icin pas payi, proje notunu yerine getirmekten fazlasidir. Donatinin eleman kesitindeki gercek konumunu garanti altina almak anlamina gelir. Fazla ortu etkili yuksekligi degistirir, az ortu ise korozyon ve yangin riskini buyutur.",
      "Bu nedenle pas payi, sahada en cok gorulup gecilen ama teslim sonrasi en pahali sonuc ureten kalite basliklarindan biridir.",
    ],
    theory: [
      "Beton ortusu iki temel is gorur: donatiyi cevresel etkilerden korur ve aderans-calisma kosulunu saglar. Ortunun yetersiz olmasi karbonatlasma ve nem etkisinin donatiya hizla ulasmasina neden olur. Fazla ortu ise kesitin gercek calisma geometrisini proje varsayimindan uzaklastirabilir.",
      "Pas payi teorik bir cizgi degil, sahada takoz, spacer, sehpa ve kalip davranisi ile korunan bir imalattir. Proje notu dogru olsa bile uygulama sistemi zayifsa sonuc yine hatali olabilir.",
      "Kiris, kolon, doseme ve temelde ortu davranisi farkli riskler uretir. Dosemede ust donati sehpasi zayifsa ust ortu kaybolur; kolonda yan takoz yetersizse donati kaliba yasar; temelde alt zemin bozuksa alt ortu kaybolur. Yani pas payi problemi tek bir ekipman secimi degil tum donati lojistiginin sonucudur.",
      "TS 500 ve TS EN 13670 birlikte okundugunda pas payi, dayanimin gorunmeyen girdilerinden biridir. Milimetre seviyesindeki kayip, yapi omrune yillar seviyesinde etki edebilir.",
    ],
    ruleTable: [
      {
        parameter: "Nominal ortu degeri",
        limitOrRequirement: "Eleman, maruziyet ve proje notuna uygun beton ortusu korunmali",
        reference: "TS 500",
        note: "Tum elemanlarda ayni ortu degeri kullanmak dogru kabul degildir.",
      },
      {
        parameter: "Spacer ve takoz duzeni",
        limitOrRequirement: "Pas payi elemanlari donati agirligini tasiyacak aralik ve dayanimda olmali",
        reference: "TS EN 13670 + saha kalite plani",
        note: "Az sayida zayif takoz, dokum aninda ortunun kaybolmasina yol acar.",
      },
      {
        parameter: "Dokum sirasinda koruma",
        limitOrRequirement: "Beton oncesi kurulan ortu, hortum ve yurume trafigi altinda bozulmamalidir",
        reference: "Saha kabul disiplini",
        note: "Pas payi yalniz montaj aninda degil, beton aninda da korunur.",
      },
      {
        parameter: "Olcu ve kayit",
        limitOrRequirement: "Kritik elemanlarda ortu kabulunun olcu, foto ve checklist ile kapatilmasi tercih edilmeli",
        reference: "Kalite ve denetim zinciri",
        note: "Gorsel kanaat tek basina yeterli kontrol yontemi degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine gore gerekli pas payi degerlerini shop drawing uzerinde acikca yaz.",
      "Takoz ve spacer secimini donati capi ile agirligina gore yap; gelisiguzel malzeme kullanma.",
      "Kiris, kolon ve dosemede takoz yerlestirim araligini standart hale getir.",
      "Kalip kapanmadan once yan ortu, alt ortu ve ust donati kotunu olcuyle kontrol et.",
      "Beton dokumu sirasinda hortum ve yurume trafiginin ortuyu bozmayacagi gecis duzeni kur.",
      "Dokum sonrasi kritik elemanlarda kayma ihtimalini tekrar gozden gecir ve kayda bagla.",
    ],
    criticalChecks: [
      "Projedeki pas payi degeri eleman bazinda ekibe anlatildi mi?",
      "Takoz ve spacer sayisi gercek donati agirligini tasiyor mu?",
      "Kolon yan yuzlerinde donati kaliba yaklasiyor mu?",
      "Dosemede ust donati sehpasi yurume trafigi altinda zayifliyor mu?",
      "Beton aninda hortum hareketi alt ortuyu bozuyor mu?",
      "Kritik elemanlarda olculu kabul yapildi mi?",
    ],
    numericalExample: {
      title: "Pas payi sapmasinin kiris etkin derinligine etkisi",
      inputs: [
        { label: "Kiris yuksekligi", value: "600 mm", note: "Ornek betonarme kiris" },
        { label: "Nominal pas payi", value: "30 mm", note: "Kalip yuzeyinden etriyeye" },
        { label: "Etriye capi", value: "8 mm", note: "phi8" },
        { label: "Boyuna donati", value: "16 mm", note: "phi16" },
      ],
      assumptions: [
        "Donati merkezine kadar olan mesafe pas payi + etriye + yaricap mantigiyla okunur.",
        "Gercek uygulamada ortu 15 mm seviyesine dusmus olabilir.",
        "Amac dayanimi hesaplamak degil, geometri degisimini gostermektir.",
      ],
      steps: [
        {
          title: "Tasarlanan etkin derinligi hesapla",
          formula: "d = 600 - (30 + 8 + 8) = 554 mm",
          result: "Proje varsayimiyla etkin derinlik 554 mm olur.",
          note: "Bu deger ortu dogru korundugunda gecerlidir.",
        },
        {
          title: "Eksik ortu durumunu yorumla",
          formula: "d = 600 - (15 + 8 + 8) = 569 mm",
          result: "Etkin derinlik kagit uzerinde artsa da donati koruma katmani ciddi bicimde zayiflar.",
          note: "Pas payi eksigi dayanim avantaji degil, dayaniklilik riski uretir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kiris biraz daha derin calisiyor gorunse bile korozyon ve yangin davranisi acisindan proje disi hale gelir.",
          note: "Pas payi kontrolu yalniz mukavemet degil servis omru kontroludur.",
        },
      ],
      checks: [
        "Pas payi sapmasi dayanimi tek basina anlatmaz; dayaniklilik ve yangin performansi ile birlikte okunmalidir.",
        "Daha fazla etkin derinlik gorunmesi, eksik ortuyu kabul edilebilir yapmaz.",
        "Spacer sistemi zayifsa proje notu sahada anlamsizlasir.",
        "Olcuyle teyit edilmeyen pas payi, goze guvenilen bir varsayimdan ibaret kalir.",
      ],
      engineeringComment: "Pas payi, milimetre kaybedildiginde ilk anda gorunmez; ama yillar icinde yapinin en pahali kusurlarindan birine donusebilir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Pas payini sadece beton oncesi kisa bakisla kapatmak.", correct: "Takoz sistemi ve olculu kontrolle dogrulamak." },
      { wrong: "Her elemanda ayni spacer mantigini kullanmak.", correct: "Eleman ve maruziyete gore sistem secmek." },
      { wrong: "Dosemede zayif sehpa ile ust donatiyi kabul etmek.", correct: "Yurume ve dokum yukune dayanacak sehpa duzeni kurmak." },
      { wrong: "Kolon yan takozlarini sayica azaltmak.", correct: "Donatinin kaliptan uzakligini koruyacak aralik kullanmak." },
      { wrong: "Pas payi eksigini kucuk tolerans gibi gormek.", correct: "Korozyon ve yangin riski olarak okumak." },
      { wrong: "Beton sirasinda bozulan ortuyu fark etmeden devam etmek.", correct: "Dokum esnasinda da aktif ortu takibi yapmak." },
    ],
    designVsField: [
      "Tasarim tarafinda pas payi tek bir not gibi gorunur; sahada ise takoz, kalip, yurume trafigi ve dokum lojistigi ile korunur.",
      "Bu nedenle pas payi, cizimde yazildigi icin degil sahada son ana kadar korundugu icin gerceklesir.",
      "Iyi pas payi kontrolu, kullanici gormeden yapinin omrunu uzatan sessiz bir muhendislik kazanimidir.",
    ],
    conclusion: [
      "Pas payi dogru korundugunda betonarme eleman yalniz hesapta degil dayaniklilik ve servis omru acisindan da projedeki niteligine yaklasir.",
      "Ihmal edildiginde ise milimetre seviyesindeki kayip, yillar icinde korozyon, catlak ve erken onarim maliyeti olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["pas payi", "beton ortusu", "spacer", "TS 500", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
];
