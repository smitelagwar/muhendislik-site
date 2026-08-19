import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_DONATI_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const DONATI_DEEP_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad / ETABS donatı ciktilari", purpose: "Kiriş boyunca degisen ihtiyaci saha paftasiyla eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve bukum listesi", purpose: "Cap, adet, bindirme ve etriye mantigini tekrar edilebilir hale getirmek." },
  { category: "Kontrol", name: "Bindirme ve paspayı checklisti", purpose: "Beton öncesi son kabulde kritik detaylari hızlı kapatmak." },
  { category: "Ölçüm", name: "Spacer, sehpa ve düğüm kabul listesi", purpose: "Yoğun düğümlerde betonun gececegi boşluğu korumak." },
];

const DONATI_DEEP_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve bukum sehpalari", purpose: "Donatinin cap, boy ve kanca detayina uygun hazirlanmasini saglamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense ve montaj ekipmani", purpose: "Boyuna ve enine donatının beton öncesi stabil kalmasini saglamak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Paspayı takozu, spacer ve sehpa", purpose: "Ortuyu ve katman araligini beton dokumu boyunca korumak.", phase: "On kabul" },
  { group: "Güvenlik", name: "Filiz koruyucu ve gecici platformlar", purpose: "Yoğun donatı alanlarinda saha güvenliği ve duzenli erişim saglamak.", phase: "Montaj sonrasi" },
];

export const kabaInsaatDonatiDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/kiris-donati",
    kind: "topic",
    quote: "Kiriş donatısı, demir adedinin değil; moment, kesme, ankraj ve beton yerlesebilirliginin aynı kesitte uzlasmasidir.",
    tip: "Kiriş donatisini sadece alt-üst demir sayisi gibi görmek, mesnet düğümü, etriye sikilastirmasi ve betonun o dugumden gecme ihtiyacini ihmal etmek demektir.",
    intro: [
      "Kiriş donatısı, betonarme sistemin sahada en sık tekrar eden ama en yoğun hata biriktiren imalatlarindan biridir. Cunku kiriş, aciklik momenti ile mesnet davranisini, boyuna donatı ile etriyeyi, shop drawing ile beton yerlesebilirligini aynı anda yonetir.",
      "Bir saha mühendisi için kiriş donatısı yalnızca demir baglatmak degildir. Üst donatının nerede devraldigi, alt donatının aciklikta nasil calistigi, etriye adiminin nerede degistigi, bindirmelerin nereye yigildigi ve vibratorun bu dugume nasil girecegi birlikte okunmalidir.",
      "Sahada en yaygin hata, analizden gelen donatı miktarini nihai çözüm sanmaktir. Oysa shop drawing zayifsa demirler üst uste biner, paspayı kaybolur, kalipla mesafe azalir ve betonun akisi bozulur.",
      "Bu nedenle kiriş donatısı, hesap dogrulugunun saha okunabilirligine donustugu ana esiktir. Iyi yonetilmeyen kiriş detayi, ilk anda değil kalıp sokumu ve servis davranisinda sorun uretir.",
    ],
    theory: [
      "Kirislerde boyuna donatı egilme momentini tasir; etriyeler ise kesme kuvveti, sargi ve düğüm disiplininde kritik rol oynar. Boyuna demiri arttirmak, etriye veya bindirme hatasini telafi etmez. Yani elemanin güvenliği toplamdaki metal miktarindan çok detay organizasyonuna baglidir.",
      "Mesnet ve aciklik bolgeleri aynı mantikla okunmaz. Mesnette ustte, aciklikta altta çalışan donatı ihtiyaci degisir. Bu nedenle kiriş tek kesit cizimiyle anlasilmaz; boy boyunca donatı davranisinin nerede degistigi paftada net olmali, sahada da buna göre kurulum yapilmalidir.",
      "Bindirme ve ankraj kararlari yalnız dayanima değil saha uygulanabilirligine de baglidir. Kritik düğümlerde aynı anda fazla demir toplandiginda beton gecisi zorlasir, vibrator erisimi kaybolur ve kagit üzerinde doğru olan detay sahada kalitesiz uretilebilir.",
      "TS 500 ve TBDY 2018 mantigi birlikte okundugunda kiriş, deprem davranisinin da kritik elemanlarindan biridir. Bu nedenle etriye sikilastirma ve boyuna donatı sürekliliği, yalnız ustalik refleksiyle değil mühendislik denetimiyle korunmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna donatı sürekliliği",
        limitOrRequirement: "Mesnet ve aciklik donatilari paftada net ayrismali, kesilen ve devam eden barlar acikca gosterilmeli",
        reference: "TS 500 + TBDY 2018 Bölüm 7",
        note: "Kiriş boyunca degisen davranis tek bir kesit resmiyle anlatilamaz.",
      },
      {
        parameter: "Etriye ve sikilastirma bolgesi",
        limitOrRequirement: "Mesnete yakin bolgelerde etriye adimi deprem detaylarina uygun sikilikta korunmali",
        reference: "TBDY 2018 Bölüm 7",
        note: "Saha kolayligi için etriye acmak deprem performansini düşürür.",
      },
      {
        parameter: "Bindirme ve ankraj",
        limitOrRequirement: "Bindirmeler kritik dugumlere yigilmamali, ankraj mantigi shop drawing uzerinden okunabilmeli",
        reference: "TS 500",
        note: "Aynı noktaya yigilmis demir, beton yerlesebilirligini bozar.",
      },
      {
        parameter: "Beton gecisi ve paspayı",
        limitOrRequirement: "Donatı dizilisi vibrator ve taze beton gecisine izin verecek sekilde kurulmalidir",
        reference: "TS EN 13670 + saha kabul disiplini",
        note: "Hesapta yeterli olan her düğüm sahada betonlanabilir olmayabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Analiz ciktisini shop drawing mantigina cevir; alt, üst, mesnet ve aciklik bolgelerini ayri ayri tarif et.",
      "Etriye adimi degisen bolgeleri paftada ve sahada kolay okunur isaretlerle belirle.",
      "Kiriş-kolon dugumunde kolon donatısı, döşeme donatısı ve tesisat rezervasyonlarini birlikte kontrol et.",
      "Spacer, sehpa ve paspayı elemanlarini donatının gercek ağırlığını tasiyacak sekilde sec.",
      "Yoğun düğümlerde hortum ve vibrator erisimini beton öncesi saha turunda fiilen denetle.",
      "Son kabulde cap, adet, bindirme, etriye adimi ve beton gecisi mantigini aynı checklistte kapat.",
    ],
    criticalChecks: [
      "Mesnet ve aciklik donatilari shop drawing üzerinde net okunuyor mu?",
      "Etriye sikilastirma bolgeleri sahada seyreltilmis mi?",
      "Bindirmeler aynı kesitte yigilarak beton gecisini zorluyor mu?",
      "Kolon-kiriş dugumunde vibrator girecek boşluk gercekten var mi?",
      "Paspayı ve sehpa düzeni donatının ağırlığını tasiyor mu?",
      "Beton öncesi cap ve adet kontrolü gercekten yapildi mi?",
    ],
    numericalExample: {
      title: "30/60 kiriste ilk alt donatı alani yorumu",
      inputs: [
        { label: "Kesit", value: "b = 300 mm, h = 600 mm", note: "Tipik betonarme kiriş" },
        { label: "Faydali yükseklik", value: "d = 550 mm", note: "Yaklasik saha degeri" },
        { label: "Tasarim momenti", value: "Md = 180 kNm", note: "Aciklik bolgesi" },
        { label: "Donatı dayanımı", value: "fyd = 365 MPa", note: "B420C varsayimi" },
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
          note: "Bu adim kesin kesit hesabinin yerine gecmez, saha on yorumu sağlar.",
        },
        {
          title: "Gerekli donatı alanini hesapla",
          formula: "As ~= 180000000 / (365 x 495) = 996 mm2",
          result: "Yaklasik 1000 mm2 alt donatı ihtiyaci görünür.",
          note: "4phi18 teorik olarak bu alani sağlar; ancak düğüm yoğunluğu ayrıca sorgulanmalidir.",
        },
        {
          title: "Uygulanabilirligi yorumla",
          result: "Alan yeterli gorunse bile mesnet üst donatısı ve etriye yoğunluğu ile birlikte kesit tekrar okunmalidir.",
          note: "Kiriş donatısı yalnız alan hesabiyla kapanmaz; beton gecisi de kontrol ister.",
        },
      ],
      checks: [
        "Alan hesabiyla secilen donatı deprem detayi ve bindirme mantigi ile birlikte okunmalidir.",
        "Daha buyuk cap her zaman daha iyi saha çözümü anlamina gelmez.",
        "Boyuna donatı karari etriye yogunlugundan bağımsız dusunulmemelidir.",
        "Nihai çözüm shop drawing üzerinde beton yerlesebilirligiyle doğrulanmalıdır.",
      ],
      engineeringComment: "Kiriş donatisinda hesap ilk kapidir; asil kalite, o hesabin sahada baglanabilir ve betonlanabilir bir dugume donusebilmesidir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Kiriş donatisini yalnız alt üst demir sayisi gibi okumak.", correct: "Mesnet, aciklik, etriye ve beton gecisi mantigini birlikte yonetmek." },
      { wrong: "Bindirmeleri sahada bos buldugu yere toplamak.", correct: "Kritik dugumlerden uzak ve paftada tanimli bolgelerde tutmak." },
      { wrong: "Etriye sikilastirmasini usta kolayligina göre seyretmek.", correct: "Deprem detayi olarak aynen korumak." },
      { wrong: "Spacer ve sehpa secimini onemsiz görmek.", correct: "Donatı stabilitesinin ana parçası saymak." },
      { wrong: "Yoğun dugumde betonu kendi akisiyla birakmak.", correct: "Vibrator ve hortum erisimini önce denetlemek." },
      { wrong: "Pafta okumasini kalıp kapanmadan önce tamamlamamak.", correct: "Beton öncesi düğüm detayini birlikte kapatmak." },
    ],
    designVsField: [
      "Tasarim ofisinde kiriş donatısı alan ve caplarla görünür; sahada ise aynı kararlarin baglanabilir, betonlanabilir ve denetlenebilir hale gelmesi gerekir.",
      "Iyi kiriş detayi, projede güçlü gorundugu için değil sahada fazla yorum istemeden tekrarlandigi için degerlidir.",
      "Bu nedenle kiriş donatısı, statik hesap kadar uygulama muhendisligi cizimidir.",
    ],
    conclusion: [
      "Kiriş donatısı doğru cizilip doğru kurulursa betonarme sistem projedeki davranisina daha yakin uretilir.",
      "Yanlış yonetildiginde ise sorun yalnız demir eksigi olarak değil; petek, paspayı kaybi, düğüm zorlugu ve uzun vadeli performans dususu olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["kiriş donatı", "betonarme kiriş", "etriye", "bindirme", "TS 500 TBDY"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kolon-donati"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/pas-payi",
    kind: "topic",
    quote: "Paspayı, milimetre gibi gorunen ama betonarme elemanin omru, aderansi ve yangin davranisini aynı anda belirleyen bir koruma katmanidir.",
    tip: "Pas payini yalnız takoz koyma isi sanmak, donatının betonda hangi mesafede yasadigini ve yapının uzun omrunu belirleyen kalite kapisini kucumsemektir.",
    intro: [
      "Paspayı, donatı ile dış ortam arasinda birakilan koruyucu beton ortusudur. Uygulamada küçük bir detay gibi gorunse de korozyon direnci, aderans, yangin performansi ve görünür beton kalitesi bu kararin dogruluguna doğrudan baglidir.",
      "Sahada paspayı genellikle beton öncesi kısa bir bakisla kontrol edilen basliklardan biridir. Oysa takoz tipi, yerlestirme araligi, kalıp rijitligi, yürüme trafigi ve donatı agirligi birlikte dusunulmezse beton öncesi doğru gorunen sistem dokum aninda bozulabilir.",
      "Bir mühendis için paspayı, proje notunu yerine getirmekten fazlasidir. Donatinin eleman kesitindeki gercek konumunu garanti altina almak anlamina gelir. Fazla ortu etkili yüksekliği degistirir, az ortu ise korozyon ve yangin riskini buyutur.",
      "Bu nedenle paspayı, sahada en çok gorulup gecilen ama teslim sonrasi en pahali sonuc ureten kalite basliklarindan biridir.",
    ],
    theory: [
      "Beton ortusu iki temel iş görür: donatıyı cevresel etkilerden korur ve aderans-çalışma kosulunu sağlar. Ortunun yetersiz olmasi karbonatlasma ve nem etkisinin donatiya hizla ulasmasina neden olur. Fazla ortu ise kesitin gercek çalışma geometrisini proje varsayimindan uzaklastirabilir.",
      "Paspayı teorik bir cizgi değil, sahada takoz, spacer, sehpa ve kalıp davranisi ile korunan bir imalattir. Proje notu doğru olsa bile uygulama sistemi zayifsa sonuc yine hatali olabilir.",
      "Kiriş, kolon, döşeme ve temelde ortu davranisi farkli riskler uretir. Dosemede üst donatı sehpası zayifsa üst ortu kaybolur; kolonda yan takoz yetersizse donatı kaliba yasar; temelde alt zemin bozuksa alt ortu kaybolur. Yani paspayı problemi tek bir ekipman secimi değil tüm donatı lojistiginin sonucudur.",
      "TS 500 ve TS EN 13670 birlikte okundugunda paspayı, dayanimin gorunmeyen girdilerinden biridir. Milimetre seviyesindeki kayip, yapı omrune yillar seviyesinde etki edebilir.",
    ],
    ruleTable: [
      {
        parameter: "Nominal ortu degeri",
        limitOrRequirement: "Eleman, maruziyet ve proje notuna uygun beton ortusu korunmali",
        reference: "TS 500",
        note: "Tüm elemanlarda aynı ortu degeri kullanmak doğru kabul degildir.",
      },
      {
        parameter: "Spacer ve takoz düzeni",
        limitOrRequirement: "Paspayı elemanlari donatı ağırlığını tasiyacak aralik ve dayanimda olmali",
        reference: "TS EN 13670 + saha kalite plani",
        note: "Az sayida zayif takoz, dokum aninda ortunun kaybolmasina yol acar.",
      },
      {
        parameter: "Dokum sırasında koruma",
        limitOrRequirement: "Beton öncesi kurulan ortu, hortum ve yürüme trafigi altinda bozulmamalidir",
        reference: "Saha kabul disiplini",
        note: "Paspayı yalnız montaj aninda değil, beton aninda da korunur.",
      },
      {
        parameter: "Ölçü ve kayıt",
        limitOrRequirement: "Kritik elemanlarda ortu kabulunun ölçü, foto ve checklist ile kapatilmasi tercih edilmeli",
        reference: "Kalite ve denetim zinciri",
        note: "Görsel kanaat tek basina yeterli kontrol yöntemi degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre gerekli paspayı degerlerini shop drawing üzerinde acikca yaz.",
      "Takoz ve spacer secimini donatı capi ile agirligina göre yap; gelişigüzel malzeme kullanma.",
      "Kiriş, kolon ve döşemede takoz yerlestirim araligini standart hale getir.",
      "Kalıp kapanmadan önce yan ortu, alt ortu ve üst donatı kotunu olcuyle kontrol et.",
      "Beton dokumu sırasında hortum ve yürüme trafiginin ortuyu bozmayacagi geçiş düzeni kür.",
      "Dokum sonrasi kritik elemanlarda kayma ihtimalini tekrar gözden gecir ve kayda bagla.",
    ],
    criticalChecks: [
      "Projedeki paspayı degeri eleman bazinda ekibe anlatildi mi?",
      "Takoz ve spacer sayisi gercek donatı ağırlığını tasiyor mu?",
      "Kolon yan yuzlerinde donatı kaliba yaklasiyor mu?",
      "Dosemede üst donatı sehpası yürüme trafigi altinda zayifliyor mu?",
      "Beton aninda hortum hareketi alt ortuyu bozuyor mu?",
      "Kritik elemanlarda olculu kabul yapildi mi?",
    ],
    numericalExample: {
      title: "Paspayı sapmasinin kiriş etkin derinligine etkisi",
      inputs: [
        { label: "Kiriş yüksekliği", value: "600 mm", note: "Ornek betonarme kiriş" },
        { label: "Nominal paspayı", value: "30 mm", note: "Kalıp yuzeyinden etriyeye" },
        { label: "Etriye capi", value: "8 mm", note: "phi8" },
        { label: "Boyuna donatı", value: "16 mm", note: "phi16" },
      ],
      assumptions: [
        "Donatı merkezine kadar olan mesafe paspayı + etriye + yaricap mantigiyla okunur.",
        "Gercek uygulamada ortu 15 mm seviyesine dusmus olabilir.",
        "Amac dayanımı hesaplamak değil, geometri degisimini gostermektir.",
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
          result: "Etkin derinlik kagit üzerinde artsa da donatı koruma katmanı ciddi bicimde zayiflar.",
          note: "Paspayı eksigi dayanım avantaji değil, dayanıklılık riski uretir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Kiriş biraz daha derin calisiyor gorunse bile korozyon ve yangin davranisi acisindan proje disi hale gelir.",
          note: "Paspayı kontrolü yalnız mukavemet değil servis omru kontroludur.",
        },
      ],
      checks: [
        "Paspayı sapmasi dayanımı tek basina anlatmaz; dayanıklılık ve yangin performansi ile birlikte okunmalidir.",
        "Daha fazla etkin derinlik gorunmesi, eksik ortuyu kabul edilebilir yapmaz.",
        "Spacer sistemi zayifsa proje notu sahada anlamsizlasir.",
        "Olcuyle teyit edilmeyen paspayı, goze guvenilen bir varsayimdan ibaret kalir.",
      ],
      engineeringComment: "Paspayı, milimetre kaybedildiginde ilk anda görünmez; ama yillar icinde yapının en pahali kusurlarindan birine donusebilir.",
    },
    tools: DONATI_DEEP_TOOLS,
    equipmentAndMaterials: DONATI_DEEP_EQUIPMENT,
    mistakes: [
      { wrong: "Pas payini sadece beton öncesi kısa bakisla kapatmak.", correct: "Takoz sistemi ve olculu kontrolle dogrulamak." },
      { wrong: "Her elemanda aynı spacer mantigini kullanmak.", correct: "Eleman ve maruziyete göre sistem secmek." },
      { wrong: "Dosemede zayif sehpa ile üst donatıyı kabul etmek.", correct: "Yürüme ve dokum yukune dayanacak sehpa düzeni kurmak." },
      { wrong: "Kolon yan takozlarini sayica azaltmak.", correct: "Donatinin kaliptan uzakligini koruyacak aralik kullanmak." },
      { wrong: "Paspayı eksigini küçük tolerans gibi görmek.", correct: "Korozyon ve yangin riski olarak okumak." },
      { wrong: "Beton sırasında bozulan ortuyu fark etmeden devam etmek.", correct: "Dokum esnasinda da aktif ortu takibi yapmak." },
    ],
    designVsField: [
      "Tasarim tarafinda paspayı tek bir not gibi görünür; sahada ise takoz, kalıp, yürüme trafigi ve dokum lojistigi ile korunur.",
      "Bu nedenle paspayı, cizimde yazildigi için değil sahada son ana kadar korundugu için gerceklesir.",
      "Iyi paspayı kontrolü, kullanıcı gormeden yapının omrunu uzatan sessiz bir mühendislik kazanimidir.",
    ],
    conclusion: [
      "Paspayı doğru korundugunda betonarme eleman yalnız hesapta değil dayanıklılık ve servis omru acisindan da projedeki niteligine yaklasir.",
      "Ihmal edildiginde ise milimetre seviyesindeki kayip, yillar icinde korozyon, çatlak ve erken onarim maliyeti olarak geri doner.",
    ],
    sources: [...KABA_DONATI_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["paspayı", "beton ortusu", "spacer", "TS 500", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
];
