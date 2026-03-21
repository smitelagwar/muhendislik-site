import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const PROJE_STATIK_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const TS_498_SOURCE: BinaGuideSource = {
  title: "TS 498 Yapi Elemanlarinin Boyutlandirilmasinda Alinacak Yuklerin Hesap Degerleri",
  shortCode: "TS 498",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "Statik on tasarimda sabit yuk, hareketli yuk ve yuk kombinasyonu mantigini kurarken temel referanslardan biridir.",
};

const STATIK_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad, ETABS veya benzeri tasiyici sistem yazilimlari", purpose: "Sistem davranisi, duzensizlik ve eleman ic kuvvetlerini tutarli modellemek." },
  { category: "Kontrol", name: "Excel kontrol sayfalari ve elle hesap notlari", purpose: "Program ciktisini kritik kesitlerde muhendislik filtresinden gecirmek." },
  { category: "Koordinasyon", name: "Mimari-statik-MEP overlay paftalari", purpose: "Shaft, bosluk, perde, kolon ve kiris cakismalarini saha oncesi gormek." },
  { category: "Saha", name: "Dugum detayi checklisti ve donati okunurlugu seti", purpose: "Projeyi kalip ve demir ekiplerinin yorumsuz okuyacagi netlige tasimak." },
];

const STATIK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokumantasyon", name: "Hesap raporu, kalip planlari, donati paftalari ve detay sayfalari", purpose: "Tasiyici sistem kararlarini ofisten sahaya kayipsiz aktarmak.", phase: "Proje" },
  { group: "Koordinasyon", name: "Aks paftalari, rezervasyon listesi ve disiplin clash raporlari", purpose: "Statik kararlarin mimari ve tesisatla tutarli kalmasini saglamak.", phase: "Koordinasyon" },
  { group: "Kontrol", name: "Revizyon takip sistemi ve pafta onay matrisi", purpose: "Sahaya giden her cizimin guncel ve onayli oldugunu garanti etmek.", phase: "Surekli" },
  { group: "Saha baglantisi", name: "Dugum buyutme ciktisi, shop drawing ve numune imalat notlari", purpose: "Kritik birlesimlerin uygulamada kaybolmamasini saglamak.", phase: "Uygulama oncesi" },
];

export const projeHazirlikStatikDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/statik-proje",
    kind: "topic",
    quote: "Statik proje, hesabin kagitta dogru olmasindan once yapinin sahada ayni mantikla kurulabilmesini garanti etmelidir.",
    tip: "Modelde guzel duran bir tasiyici sistem, eger akslara, rezervasyonlara ve donati okunurluguna inmiyorsa saha icin tamamlanmis proje sayilmaz.",
    intro: [
      "Statik proje, bir binanin tasiyici karakterini belirleyen ana teknik omurgadir. Yuklerin hangi elemanlardan gecerek zemine inecegi, deprem altinda hangi mekanizma ile davranacagi, kritik dugumlerde donati ve kalip duzeninin nasil kurulacagi bu projede tarif edilir. Bu nedenle statik proje bir hesap klasoru degil; tasarim, uygulama ve denetimi ayni cizgide birlestiren ana muhendislik dokumanidir.",
      "Sahada en cok vakit ve maliyet kaybettiren sorunlardan biri, analiz olarak tamamlanmis ama uygulama dili eksik statik projedir. Perde-kiris birlesimlerinin okunmayan paftalari, donati yogunlugunun sahaya nasil indirilecegini soylemeyen kesitler, sonradan delinmek zorunda kalinan doseme bosluklari ve katlar arasinda aks mantigini bulandiran mimari revizyonlar; kaliteli bir hesap raporunu bile zayif bir saha belgesine donusturebilir.",
      "Bir insaat muhendisi icin statik projeyi anlamak sadece program ciktisini okumak demek degildir. Yuk tanimlari, on boyut kararlari, duzensizlik kontrolu, deprem davranisi, temel secimi, rezervasyon disiplinleri ve imalatin ne kadar okunabilir olacagi bir butun olarak degerlendirilmelidir. Bu bakis yoksa sahada betonarme ekipleri ikinci kez tasarim yapmak zorunda kalir ki bu, kaliteli projecilik acisindan ciddi bir zafiyettir.",
      "Bugun turkiyedeki pek cok projede ana cerceve; yuklerin TS 498 mantigiyla tanimlandigi, betonarme detaylarin TS 500 ile sekillendigi ve deprem davranisinin TBDY 2018 ile belirlendigi bir zincire dayanir. Dolayisiyla statik proje, sadece kesit hesabinin degil, bu standartlarin sahada birbiriyle konusan uygulama dilinin olgunlastirilmis halidir.",
      "Bu yazida statik projeyi ofis merkezli bir tasarim paketi olarak degil, santiyede karar kalitesini belirleyen aktif arac olarak ele aliyoruz. Mimari ile overlay ihtiyacindan kolon on boyut mantigina, kritik dugumlerde donati sikismasi riskinden shop drawing derinligine kadar bir insaat muhendisinin bilmesi gereken esaslari detayli bicimde tartisiyoruz.",
    ],
    theory: [
      "Statik projenin teorik temeli, yuklerin tanimlanmasi ve tasiyici sistem icinde mantikli bir yol izlemesidir. Sabit yukler, hareketli yukler, cephe ve dolgu yukleri, cati ve kar etkileri, mekanik ekipman yukleri ve deprem etkileri modele girerken yalnizca rakam olarak degil, sistemde nereden nereye akacaklari dusunulerek ele alinmalidir. Yuk tanimi hataliysa en guzel model bile yanlis temelden baslar.",
      "Tasiyici sistem secimi ikinci kritik kavramdir. Cerceve agirlikli, perde-cerceve karma veya farkli sistem kurgularinin her biri rijitlik, deplasman, duzensizlik ve saha uygulanabilirligi acisindan farkli sonuclar uretir. Kagit uzerinde rijitligi artirmak icin eklenen bir perde, mimaride kapatilmasi zor bir aksi bloke edebilir; mimari talebi korumak icin inceltilen bir eleman ise deprem davranisini zayiflatabilir. Bu nedenle statik proje, matematiksel optimum ile yapilabilir optimum arasinda denge kurma sanatidir.",
      "Deprem tasarimi bu teorik zeminin icinde ayri bir agirlik tasir. TBDY 2018 mantigi; yalniz eleman dayanimina degil, sistem duzensizliklerine, suneklik kapasitesine, kat otelemelerine, perde surekliligine ve dugum davranisina odaklanir. Bu nedenle bir eleman kesitini tek basina buyutmek, sistem problemini her zaman cozmeye yetmez. Statik proje bu ayrimi anlamadiginda, detaylar guclu ama sistem davranisi zayif cozumler uretebilir.",
      "Uygulanabilirlik ise teorik tartismanin sahadaki gercek testidir. Kesisen donatilarin betonlanabilirligi, kalip kurulabilirligi, pompa hortumu ve vibrator erisimi, rezervasyonlarin sonradan delme ihtiyaci dogurmamasi ve kritik bolgelerde donati acilimlarinin okunabilir olmasi; projenin nihai degerini belirler. Gercek hayatta kalitesiz saha sonuclarinin buyuk kismi hesap hatasindan degil, uygulanabilirlik filtresinin zayif olmasindan kaynaklanir.",
      "Bu nedenle statik proje uretiminde iki goz birlikte calismalidir: biri analitik dogrulugu, digeri saha mantigini temsil eder. Sadece ofis gozuyle cizilen proje fazlaca idealize olabilir; sadece saha gozuyle revize edilen proje ise standartlardan uzaklasabilir. Muhendislik kalitesi bu iki denetimin ayni paftada birlesmesiyle ortaya cikar.",
    ],
    ruleTable: [
      {
        parameter: "Yuk tanimlari ve on tasarim girdileri",
        limitOrRequirement: "Sabit ve hareketli yuk varsayimlari yapinin kullanimina gore TS 498 mantigi ile tutarli tanimlanmalidir",
        reference: "TS 498",
        note: "Yanlis yuk kabulu, daha ilk adimda eleman ve sistem kararlarini bozar.",
      },
      {
        parameter: "Deprem davranisi ve sistem duzensizlikleri",
        limitOrRequirement: "Tasiyici sistem secimi, duzensizlik kontrolu ve deprem etkileri TBDY 2018'in ilgili bolumleri ile uyumlu olmalidir",
        reference: "TBDY 2018, Bolum 3, Bolum 4 ve Bolum 7",
        note: "Kesit hesabinin dogru olmasi, sistem davranisinin de dogru oldugu anlamina gelmez.",
      },
      {
        parameter: "Betonarme malzeme ve detay kurallari",
        limitOrRequirement: "Kesit, donati, pas payi, bindirme ve birlesim kararlari TS 500 cercevesinde acik ve sahada okunur olmalidir",
        reference: "TS 500, Madde 6-12 ve Madde 16",
        note: "Saha yorumuna kalan her detay kalite kaybi riski tasir.",
      },
      {
        parameter: "Temel ve zemin uyumu",
        limitOrRequirement: "Temel tipi ve yuk aktarimi zemin verileri ile deprem etkileri birlikte degerlendirilerek secilmelidir",
        reference: "TBDY 2018, Bolum 12 + zemin etudu",
        note: "Ust yapida kurulan mantik, temel seviyesinde kopmamali.",
      },
      {
        parameter: "Koordinasyon ve rezervasyonlar",
        limitOrRequirement: "MEP bosluklari, shaftlar ve kritik gecisler projede kontrollu tarif edilmelidir",
        reference: "Disiplin overlay plani",
        note: "Sonradan delme ihtiyaci doguran doseme ve kirisler statik proje eksigidir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari aks, cekirdek, shaft ve cephe kurgusunu erken al; tasiyici sistem secimini bunlardan bagimsiz yapma.",
      "Yukleri TS 498 mantigiyla net tanimla, sonra sistem alternatiflerini deprem davranisi ve yapilabilirlik acisindan karsilastir.",
      "Perde, kolon, kiris ve doseme iliskisini yalniz program sonucuna gore degil, kat otelemeleri, donati yogunlugu ve bosluk ihtiyaci ile birlikte degerlendir.",
      "Kritik dugumlerde shop drawing mantigina yakin buyutmeler uret; ustanin yorumuna kalan belirsiz alan birakma.",
      "Temel sistemi secilirken zemin etudu, yuk dagilimi, deprem etkisi ve saha lojistigini birlikte oku; ust yapi karari ile temel kararini ayri ekiplerin sorunu gibi dusunme.",
      "Pafta yayina cikmadan once mimari ve MEP overlay, donati okunurlugu ve saha uygulanabilirligi uzerinden son kalite turu yap.",
    ],
    criticalChecks: [
      "Kolon, perde ve kiris akslari mimari revizyonlara ragmen katlar boyunca surekli mi?",
      "Kritik dugumlerde donati sikismasi nedeniyle beton yerlesimi zorlasiyor mu?",
      "Doseme ve kirisler icin kontrolsuz sonradan delme ihtiyaci doguracak bosluk eksigi var mi?",
      "Temel tipi, zemin etudu ve ust yapi rijitlik dagilimi ile ayni muhendislik mantigini tasiyor mu?",
      "Paftalar saha ekiplerinin yorumsuz okuyabilecegi netlikte mi, yoksa kesit ve detay eksikleri var mi?",
      "Son revizyondan sonra hesap modeli, pafta seti ve shop drawing mantigi birbirini gercekten tutuyor mu?",
    ],
    numericalExample: {
      title: "6 katli bir konut yapisinda alt kat kolon on boyut yorumu",
      inputs: [
        { label: "Kolonun etkiledigi alan", value: "24 m2", note: "Ornek tributary alan" },
        { label: "Kat basi tasarim dusey yuk", value: "11 kN/m2", note: "Sabit + hareketli yuk icin kaba on tasarim degeri" },
        { label: "Kat sayisi", value: "6", note: "Ayni yuk dagiliminin yaklasik kabul edildigi senaryo" },
        { label: "On secilen kolon kesiti", value: "40 x 40 cm", note: "Alt kat icin ilk yaklasim" },
      ],
      assumptions: [
        "Hesap ogretici amaclidir; nihai kolon tasarimi deprem etkileri, momentler ve ikinci mertebe etkileri ile birlikte yapilir.",
        "Yuk dagilimi katlar boyunca benzer kabul edilmistir.",
        "Kaba kontrol icin kolon kendi agirligi ve lokal duzensizlik etkileri ihmal edilmistir.",
      ],
      steps: [
        {
          title: "Bir katin kolona getirdigi dusey yuku bul",
          formula: "24 x 11 = 264 kN",
          result: "Kolonun bir katta tasidigi yaklasik dusey yuk 264 kN olarak okunur.",
          note: "Bu deger on boyutlandirma icindir; nihai analiz sonucu farkli olabilir.",
        },
        {
          title: "Alt kattaki toplam yaklasik yuku hesapla",
          formula: "6 x 264 = 1584 kN",
          result: "Alt kat kolonunda yaklasik 1584 kN seviyesinde dusey yuk beklenir.",
          note: "Deprem ve moment etkileri bu dogrudan basinc hesabina dahil degildir.",
        },
        {
          title: "Ortalama gerilme seviyesini yorumla",
          formula: "1584 kN / 0,16 m2 = 9900 kN/m2 ~ 9,9 MPa",
          result: "40 x 40 cm kolon icin ortalama basinc seviyesi yaklasik 9,9 MPa olur.",
          note: "C30/37 beton icin bu sonucun kesin yeterlilik anlami yoktur; ama ilk kesit seciminin mertebesini test eder.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kesit boyutu ilk bakista makul gorunse de kolon nihai olarak deprem etkileri, eksenel kuvvet-moment etkilesimi, donati yerlesimi ve kat otelemeleri ile birlikte dogrulanmalidir.",
          note: "Statik projede on boyut mantigi, nihai tasarimi hizlandirir ama onun yerine gecmez.",
        },
      ],
      checks: [
        "On boyut sonucu mimari duvar kalinliklari ve kullanilabilir alanla uyumlu mu?",
        "Kolon kesiti, donati yerlesimi ve birlesim bolgesi okunurlugu icin yeterli alan birakiyor mu?",
        "Perde ve kolon dagilimi yalniz eksenel yuk degil deprem davranisi acisindan da dengeli mi?",
        "Kesin karar verilmeden once analiz modeli ve detay paftalari birlikte guncellenmeli.",
      ],
      engineeringComment: "Iyi on boyutlandirma, programe girilen rastgele bir kesit degil; mimari, deprem ve saha okunurlugu arasinda kurulan ilk muhendislik uzlasisidir.",
    },
    tools: STATIK_TOOLS,
    equipmentAndMaterials: STATIK_EQUIPMENT,
    mistakes: [
      { wrong: "Statik projeyi yalniz program ciktisi ve otomatik pafta paketi olarak kabul etmek.", correct: "Model, detay ve saha uygulanabilirligini ayni kalite turundan gecirmek." },
      { wrong: "Mimari revizyonlardan sonra tasiyici sistem surekliligini yeniden sorgulamamak.", correct: "Aks ve duzensizlik etkilerini her buyuk revizyonda tekrar okumak." },
      { wrong: "MEP bosluklarini dosemede sonradan delmeye birakmak.", correct: "Kritik rezervasyonlari statik paftaya kontrollu sekilde islemek." },
      { wrong: "Donati yogunlugu yuksek dugumleri kagit uzerinde cozulmus saymak.", correct: "Betonlanabilirlik ve vibrator erisimini saha gozuyle degerlendirmek." },
      { wrong: "Temel secimini ust yapidan bagimsiz ve sadece zemin raporuna birakmak.", correct: "Zemin verisini yuk dagilimi ve deprem davranisi ile birlikte okumak." },
      { wrong: "Revizyon kontrolunu zayif tutup farkli pafta setlerinin sahaya cikmasina izin vermek.", correct: "Hesap modeli, pafta ve shop drawing zincirini tek revizyon mantigina baglamak." },
    ],
    designVsField: [
      "Tasarim ofisinde statik proje tablo, model ve paftadan olusur; sahada ise ayni proje kalip sirasi, demir yogunlugu, beton yerlesimi ve denetim turleri olarak yasatilir.",
      "Projede okunmayan bir bindirme bolgesi, sahada eksik etriye veya yanlis ek boyu olarak geri doner. Bu nedenle detay netligi yapisal guvenligin ayrilmaz parcasidir.",
      "En iyi statik proje, yalniz emniyet katsayilari saglayan degil, usta, formen ve kontrol muhendisinin ayni sonucu okudugu projedir.",
    ],
    conclusion: [
      "Statik proje; yuk tanimi, sistem secimi, deprem davranisi, detay okunurlugu ve saha uygulanabilirligi birlikte cozuldugunda gercek degerini uretir. Aksi halde iyi analiz bile sahada eksik uygulamaya donusebilir.",
      "Bir insaat muhendisi icin temel hedef, projeyi yalniz dogru hesaplanmis degil, dogru okunur ve dogru uygulanir hale getirmektir. Bu bakis santiyede revizyonu, kirma-duzeltmeyi ve yapisal kalite kaybini belirgin bicimde azaltir.",
    ],
    sources: [...PROJE_STATIK_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500, TS_498_SOURCE],
    keywords: ["statik proje", "TS 498", "TBDY 2018", "TS 500", "tasiyici sistem", "on boyutlandirma"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/mimari-proje", "kaba-insaat/donati-isleri/kiris-donati"],
  },
];
