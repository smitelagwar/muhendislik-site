import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_DONATI_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const DONATI_DEEP_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad / ETABS donati ciktilari", purpose: "Kiris boyunca degisen ihtiyaci saha paftasiyla eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve bukum listesi", purpose: "Cap, adet, bindirme ve etriye mantigini tekrar edilebilir hale getirmek." },
  { category: "Kontrol", name: "Bindirme ve pas payi checklisti", purpose: "Beton öncesi son kabulde kritik detaylari hızlı kapatmak." },
  { category: "Ölçüm", name: "Spacer, sehpa ve dugum kabul listesi", purpose: "Yoğun dugumlerde betonun gececegi boslugu korumak." },
];

const DONATI_DEEP_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve bukum sehpalari", purpose: "Donatinin cap, boy ve kanca detayina uygun hazirlanmasini saglamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense ve montaj ekipmani", purpose: "Boyuna ve enine donatinin beton öncesi stabil kalmasini saglamak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Pas payi takozu, spacer ve sehpa", purpose: "Ortuyu ve katman araligini beton dokumu boyunca korumak.", phase: "On kabul" },
  { group: "Güvenlik", name: "Filiz koruyucu ve gecici platformlar", purpose: "Yoğun donati alanlarinda saha guvenligi ve duzenli erişim saglamak.", phase: "Montaj sonrasi" },
];

export const kabaInsaatDonatiDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kiris-donati",
    kind: "topic",
    quote: "Kiris donatisi, demir adedinin degil; moment, kesme, ankraj ve beton yerlesebilirliginin aynı kesitte uzlasmasidir.",
    tip: "Kiris donatisini sadece alt-üst demir sayisi gibi gormek, mesnet dugumu, etriye sikilastirmasi ve betonun o dugumden gecme ihtiyacini ihmal etmek demektir.",
    intro: [
      "Kiris donatisi, betonarme sistemin sahada en sık tekrar eden ama en yoğun hata biriktiren imalatlarindan biridir. Cunku kiris, aciklik momenti ile mesnet davranisini, boyuna donati ile etriyeyi, shop drawing ile beton yerlesebilirligini aynı anda yonetir.",
      "Bir saha muhendisi için kiris donatisi yalnizca demir baglatmak degildir. Üst donatinin nerede devraldigi, alt donatinin aciklikta nasil calistigi, etriye adiminin nerede degistigi, bindirmelerin nereye yigildigi ve vibratorun bu dugume nasil girecegi birlikte okunmalidir.",
      "Sahada en yaygin hata, analizden gelen donati miktarini nihai cozum sanmaktir. Oysa shop drawing zayifsa demirler üst uste biner, pas payi kaybolur, kalipla mesafe azalir ve betonun akisi bozulur.",
      "Bu nedenle kiris donatisi, hesap dogrulugunun saha okunabilirligine donustugu ana esiktir. Iyi yonetilmeyen kiris detayi, ilk anda degil kalip sokumu ve servis davranisinda sorun uretir.",
    ],
    theory: [
      "Kirislerde boyuna donati egilme momentini tasir; etriyeler ise kesme kuvveti, sargi ve dugum disiplininde kritik rol oynar. Boyuna demiri arttirmak, etriye veya bindirme hatasini telafi etmez. Yani elemanin guvenligi toplamdaki metal miktarindan çok detay organizasyonuna baglidir.",
      "Mesnet ve aciklik bolgeleri aynı mantikla okunmaz. Mesnette ustte, aciklikta altta çalışan donati ihtiyaci degisir. Bu nedenle kiris tek kesit cizimiyle anlasilmaz; boy boyunca donati davranisinin nerede degistigi paftada net olmali, sahada da buna göre kurulum yapilmalidir.",
      "Bindirme ve ankraj kararlari yalnız dayanima degil saha uygulanabilirligine de baglidir. Kritik dugumlerde aynı anda fazla demir toplandiginda beton gecisi zorlasir, vibrator erisimi kaybolur ve kagit üzerinde doğru olan detay sahada kalitesiz uretilebilir.",
      "TS 500 ve TBDY 2018 mantigi birlikte okundugunda kiris, deprem davranisinin da kritik elemanlarindan biridir. Bu nedenle etriye sikilastirma ve boyuna donati surekliligi, yalnız ustalik refleksiyle degil muhendislik denetimiyle korunmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna donati surekliligi",
        limitOrRequirement: "Mesnet ve aciklik donatilari paftada net ayrismali, kesilen ve devam eden barlar acikca gosterilmeli",
        reference: "TS 500 + TBDY 2018 Bölüm 7",
        note: "Kiris boyunca degisen davranis tek bir kesit resmiyle anlatilamaz.",
      },
      {
        parameter: "Etriye ve sikilastirma bolgesi",
        limitOrRequirement: "Mesnete yakin bolgelerde etriye adimi deprem detaylarina uygun sikilikta korunmali",
        reference: "TBDY 2018 Bölüm 7",
        note: "Saha kolayligi için etriye acmak deprem performansini dusurur.",
      },
      {
        parameter: "Bindirme ve ankraj",
        limitOrRequirement: "Bindirmeler kritik dugumlere yigilmamali, ankraj mantigi shop drawing uzerinden okunabilmeli",
        reference: "TS 500",
        note: "Aynı noktaya yigilmis demir, beton yerlesebilirligini bozar.",
      },
      {
        parameter: "Beton gecisi ve pas payi",
        limitOrRequirement: "Donati dizilisi vibrator ve taze beton gecisine izin verecek sekilde kurulmalidir",
        reference: "TS EN 13670 + saha kabul disiplini",
        note: "Hesapta yeterli olan her dugum sahada betonlanabilir olmayabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Analiz ciktisini shop drawing mantigina cevir; alt, üst, mesnet ve aciklik bolgelerini ayri ayri tarif et.",
      "Etriye adimi degisen bolgeleri paftada ve sahada kolay okunur isaretlerle belirle.",
      "Kiris-kolon dugumunde kolon donatisi, doseme donatisi ve tesisat rezervasyonlarini birlikte kontrol et.",
      "Spacer, sehpa ve pas payi elemanlarini donatinin gercek agirligini tasiyacak sekilde sec.",
      "Yoğun dugumlerde hortum ve vibrator erisimini beton öncesi saha turunda fiilen denetle.",
      "Son kabulde cap, adet, bindirme, etriye adimi ve beton gecisi mantigini aynı checklistte kapat.",
    ],
    criticalChecks: [
      "Mesnet ve aciklik donatilari shop drawing üzerinde net okunuyor mu?",
      "Etriye sikilastirma bolgeleri sahada seyreltilmis mi?",
      "Bindirmeler aynı kesitte yigilarak beton gecisini zorluyor mu?",
      "Kolon-kiris dugumunde vibrator girecek bosluk gercekten var mi?",
      "Pas payi ve sehpa duzeni donatinin agirligini tasiyor mu?",
      "Beton öncesi cap ve adet kontrolu gercekten yapildi mi?",
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
        "Hızlı saha yorumu için z ~= 0,9d kabul edilmistir.",
        "Icil kuvvetler proje hesabindan gelmektedir.",
        "Nihai secim deprem detaylariyla birlikte yapilacaktir.",
      ],
      steps: [
        {
          title: "İç kuvvet kolunu tahmin et",
          formula: "z ~= 0,9 x 550 = 495 mm",
          result: "Yaklasik tasarim kolu 495 mm kabul edilir.",
          note: "Bu adim kesin kesit hesabinin yerine gecmez, saha on yorumu saglar.",
        },
        {
          title: "Gerekli donati alanini hesapla",
          formula: "As ~= 180000000 / (365 x 495) = 996 mm2",
          result: "Yaklasik 1000 mm2 alt donati ihtiyaci görünür.",
          note: "4phi18 teorik olarak bu alani saglar; ancak dugum yogunlugu ayrıca sorgulanmalidir.",
        },
        {
          title: "Uygulanabilirligi yorumla",
          result: "Alan yeterli gorunse bile mesnet üst donatisi ve etriye yogunlugu ile birlikte kesit tekrar okunmalidir.",
          note: "Kiris donatisi yalnız alan hesabiyla kapanmaz; beton gecisi de kontrol ister.",
        },
      ],
      checks: [
        "Alan hesabiyla secilen donati deprem detayi ve bindirme mantigi ile birlikte okunmalidir.",
        "Daha buyuk cap her zaman daha iyi saha cozumu anlamina gelmez.",
        "Boyuna donati karari etriye yogunlugundan bagimsiz dusunulmemelidir.",
        "Nihai cozum shop drawing üzerinde beton yerlesebilirligiyle dogrulanmalidir.",
      ],
      engineeringComment: "Kiris donatisinda hesap ilk kapidir; asil kalite, o hesabin sahada baglanabilir ve betonlanabilir bir dugume donusebilmesidir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Kiris donatisini yalnız alt üst demir sayisi gibi okumak.", correct: "Mesnet, aciklik, etriye ve beton gecisi mantigini birlikte yonetmek." },
      { wrong: "Bindirmeleri sahada bos buldugu yere toplamak.", correct: "Kritik dugumlerden uzak ve paftada tanimli bolgelerde tutmak." },
      { wrong: "Etriye sikilastirmasini usta kolayligina göre seyretmek.", correct: "Deprem detayi olarak aynen korumak." },
      { wrong: "Spacer ve sehpa secimini onemsiz gormek.", correct: "Donati stabilitesinin ana parçası saymak." },
      { wrong: "Yoğun dugumde betonu kendi akisiyla birakmak.", correct: "Vibrator ve hortum erisimini once denetlemek." },
      { wrong: "Pafta okumasini kalip kapanmadan once tamamlamamak.", correct: "Beton öncesi dugum detayini birlikte kapatmak." },
    ],
    designVsField: [
      "Tasarim ofisinde kiris donatisi alan ve caplarla görünür; sahada ise aynı kararlarin baglanabilir, betonlanabilir ve denetlenebilir hale gelmesi gerekir.",
      "Iyi kiris detayi, projede guclu gorundugu için degil sahada fazla yorum istemeden tekrarlandigi için degerlidir.",
      "Bu nedenle kiris donatisi, statik hesap kadar uygulama muhendisligi cizimidir.",
    ],
    conclusion: [
      "Kiris donatisi doğru cizilip doğru kurulursa betonarme sistem projedeki davranisina daha yakin uretilir.",
      "Yanlış yonetildiginde ise sorun yalnız demir eksigi olarak degil; petek, pas payi kaybi, dugum zorlugu ve uzun vadeli performans dususu olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["kiris donati", "betonarme kiris", "etriye", "bindirme", "TS 500 TBDY"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kolon-donati"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/pas-payi",
    kind: "topic",
    quote: "Pas payi, milimetre gibi gorunen ama betonarme elemanin omru, aderansi ve yangin davranisini aynı anda belirleyen bir koruma katmanidir.",
    tip: "Pas payini yalnız takoz koyma isi sanmak, donatinin betonda hangi mesafede yasadigini ve yapinin uzun omrunu belirleyen kalite kapisini kucumsemektir.",
    intro: [
      "Pas payi, donati ile dış ortam arasinda birakilan koruyucu beton ortusudur. Uygulamada küçük bir detay gibi gorunse de korozyon direnci, aderans, yangin performansi ve görünür beton kalitesi bu kararin dogruluguna doğrudan baglidir.",
      "Sahada pas payi genellikle beton öncesi kısa bir bakisla kontrol edilen basliklardan biridir. Oysa takoz tipi, yerlestirme araligi, kalip rijitligi, yürüme trafigi ve donati agirligi birlikte dusunulmezse beton öncesi doğru gorunen sistem dokum aninda bozulabilir.",
      "Bir muhendis için pas payi, proje notunu yerine getirmekten fazlasidir. Donatinin eleman kesitindeki gercek konumunu garanti altina almak anlamina gelir. Fazla ortu etkili yuksekligi degistirir, az ortu ise korozyon ve yangin riskini buyutur.",
      "Bu nedenle pas payi, sahada en çok gorulup gecilen ama teslim sonrasi en pahali sonuc ureten kalite basliklarindan biridir.",
    ],
    theory: [
      "Beton ortusu iki temel iş gorur: donatiyi cevresel etkilerden korur ve aderans-çalışma kosulunu saglar. Ortunun yetersiz olmasi karbonatlasma ve nem etkisinin donatiya hizla ulasmasina neden olur. Fazla ortu ise kesitin gercek çalışma geometrisini proje varsayimindan uzaklastirabilir.",
      "Pas payi teorik bir cizgi degil, sahada takoz, spacer, sehpa ve kalip davranisi ile korunan bir imalattir. Proje notu doğru olsa bile uygulama sistemi zayifsa sonuc yine hatali olabilir.",
      "Kiris, kolon, doseme ve temelde ortu davranisi farkli riskler uretir. Dosemede üst donati sehpasi zayifsa üst ortu kaybolur; kolonda yan takoz yetersizse donati kaliba yasar; temelde alt zemin bozuksa alt ortu kaybolur. Yani pas payi problemi tek bir ekipman secimi degil tüm donati lojistiginin sonucudur.",
      "TS 500 ve TS EN 13670 birlikte okundugunda pas payi, dayanimin gorunmeyen girdilerinden biridir. Milimetre seviyesindeki kayip, yapı omrune yillar seviyesinde etki edebilir.",
    ],
    ruleTable: [
      {
        parameter: "Nominal ortu degeri",
        limitOrRequirement: "Eleman, maruziyet ve proje notuna uygun beton ortusu korunmali",
        reference: "TS 500",
        note: "Tüm elemanlarda aynı ortu degeri kullanmak doğru kabul degildir.",
      },
      {
        parameter: "Spacer ve takoz duzeni",
        limitOrRequirement: "Pas payi elemanlari donati agirligini tasiyacak aralik ve dayanimda olmali",
        reference: "TS EN 13670 + saha kalite plani",
        note: "Az sayida zayif takoz, dokum aninda ortunun kaybolmasina yol acar.",
      },
      {
        parameter: "Dokum sirasinda koruma",
        limitOrRequirement: "Beton öncesi kurulan ortu, hortum ve yürüme trafigi altinda bozulmamalidir",
        reference: "Saha kabul disiplini",
        note: "Pas payi yalnız montaj aninda degil, beton aninda da korunur.",
      },
      {
        parameter: "Ölçü ve kayıt",
        limitOrRequirement: "Kritik elemanlarda ortu kabulunun ölçü, foto ve checklist ile kapatilmasi tercih edilmeli",
        reference: "Kalite ve denetim zinciri",
        note: "Görsel kanaat tek basina yeterli kontrol yontemi degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre gerekli pas payi degerlerini shop drawing üzerinde acikca yaz.",
      "Takoz ve spacer secimini donati capi ile agirligina göre yap; gelişigüzel malzeme kullanma.",
      "Kiris, kolon ve dosemede takoz yerlestirim araligini standart hale getir.",
      "Kalip kapanmadan once yan ortu, alt ortu ve üst donati kotunu olcuyle kontrol et.",
      "Beton dokumu sirasinda hortum ve yürüme trafiginin ortuyu bozmayacagi geçiş duzeni kur.",
      "Dokum sonrasi kritik elemanlarda kayma ihtimalini tekrar gözden gecir ve kayda bagla.",
    ],
    criticalChecks: [
      "Projedeki pas payi degeri eleman bazinda ekibe anlatildi mi?",
      "Takoz ve spacer sayisi gercek donati agirligini tasiyor mu?",
      "Kolon yan yuzlerinde donati kaliba yaklasiyor mu?",
      "Dosemede üst donati sehpasi yürüme trafigi altinda zayifliyor mu?",
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
          note: "Bu deger ortu doğru korundugunda gecerlidir.",
        },
        {
          title: "Eksik ortu durumunu yorumla",
          formula: "d = 600 - (15 + 8 + 8) = 569 mm",
          result: "Etkin derinlik kagit üzerinde artsa da donati koruma katmani ciddi bicimde zayiflar.",
          note: "Pas payi eksigi dayanim avantaji degil, dayaniklilik riski uretir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kiris biraz daha derin calisiyor gorunse bile korozyon ve yangin davranisi acisindan proje disi hale gelir.",
          note: "Pas payi kontrolu yalnız mukavemet degil servis omru kontroludur.",
        },
      ],
      checks: [
        "Pas payi sapmasi dayanimi tek basina anlatmaz; dayaniklilik ve yangin performansi ile birlikte okunmalidir.",
        "Daha fazla etkin derinlik gorunmesi, eksik ortuyu kabul edilebilir yapmaz.",
        "Spacer sistemi zayifsa proje notu sahada anlamsizlasir.",
        "Olcuyle teyit edilmeyen pas payi, goze guvenilen bir varsayimdan ibaret kalir.",
      ],
      engineeringComment: "Pas payi, milimetre kaybedildiginde ilk anda görünmez; ama yillar icinde yapinin en pahali kusurlarindan birine donusebilir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Pas payini sadece beton öncesi kısa bakisla kapatmak.", correct: "Takoz sistemi ve olculu kontrolle dogrulamak." },
      { wrong: "Her elemanda aynı spacer mantigini kullanmak.", correct: "Eleman ve maruziyete göre sistem secmek." },
      { wrong: "Dosemede zayif sehpa ile üst donatiyi kabul etmek.", correct: "Yürüme ve dokum yukune dayanacak sehpa duzeni kurmak." },
      { wrong: "Kolon yan takozlarini sayica azaltmak.", correct: "Donatinin kaliptan uzakligini koruyacak aralik kullanmak." },
      { wrong: "Pas payi eksigini küçük tolerans gibi gormek.", correct: "Korozyon ve yangin riski olarak okumak." },
      { wrong: "Beton sirasinda bozulan ortuyu fark etmeden devam etmek.", correct: "Dokum esnasinda da aktif ortu takibi yapmak." },
    ],
    designVsField: [
      "Tasarim tarafinda pas payi tek bir not gibi görünür; sahada ise takoz, kalip, yürüme trafigi ve dokum lojistigi ile korunur.",
      "Bu nedenle pas payi, cizimde yazildigi için degil sahada son ana kadar korundugu için gerceklesir.",
      "Iyi pas payi kontrolu, kullanıcı gormeden yapinin omrunu uzatan sessiz bir muhendislik kazanimidir.",
    ],
    conclusion: [
      "Pas payi doğru korundugunda betonarme eleman yalnız hesapta degil dayaniklilik ve servis omru acisindan da projedeki niteligine yaklasir.",
      "Ihmal edildiginde ise milimetre seviyesindeki kayip, yillar icinde korozyon, catlak ve erken onarim maliyeti olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["pas payi", "beton ortusu", "spacer", "TS 500", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
];
