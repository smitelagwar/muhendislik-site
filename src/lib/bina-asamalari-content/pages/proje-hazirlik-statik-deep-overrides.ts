import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const PROJE_STATIK_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const TS_498_SOURCE: BinaGuideSource = {
  title: "TS 498 Yapı Elemanlarinin Boyutlandirilmasinda Alinacak Yuklerin Hesap Degerleri",
  shortCode: "TS 498",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "Statik on tasarimda sabit yük, hareketli yük ve yük kombinasyonu mantigini kurarken temel referanslardan biridir.",
};

const STATIK_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad, ETABS veya benzeri taşıyıcı sistem yazilimlari", purpose: "Sistem davranisi, düzensizlik ve eleman iç kuvvetlerini tutarli modellemek." },
  { category: "Kontrol", name: "Excel kontrol sayfalari ve elle hesap notlari", purpose: "Program ciktisini kritik kesitlerde mühendislik filtresinden gecirmek." },
  { category: "Koordinasyon", name: "Mimari-statik-MEP overlay paftaları", purpose: "Shaft, boşluk, perde, kolon ve kiriş cakismalarini saha öncesi görmek." },
  { category: "Saha", name: "Dugum detayi checklisti ve donatı okunurlugu seti", purpose: "Projeyi kalıp ve demir ekiplerinin yorumsuz okuyacagi netlige tasimak." },
];

const STATIK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokumantasyon", name: "Hesap raporu, kalıp planlari, donatı paftaları ve detay sayfalari", purpose: "Taşıyıcı sistem kararlarini ofisten sahaya kayipsiz aktarmak.", phase: "Proje" },
  { group: "Koordinasyon", name: "Aks paftaları, rezervasyon listesi ve disiplin clash raporlari", purpose: "Statik kararlarin mimari ve tesisatla tutarli kalmasini saglamak.", phase: "Koordinasyon" },
  { group: "Kontrol", name: "Revizyon takip sistemi ve pafta onay matrisi", purpose: "Sahaya giden her cizimin guncel ve onayli oldugunu garanti etmek.", phase: "Sürekli" },
  { group: "Saha baglantisi", name: "Dugum buyutme ciktisi, shop drawing ve numune imalat notlari", purpose: "Kritik birleşimlerin uygulamada kaybolmamasini saglamak.", phase: "Uygulama öncesi" },
];

export const projeHazirlikStatikDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/statik-proje",
    kind: "topic",
    quote: "Statik proje, hesabin kagitta doğru olmasindan önce yapının sahada aynı mantikla kurulabilmesini garanti etmelidir.",
    tip: "Modelde güzel duran bir taşıyıcı sistem, eger akslara, rezervasyonlara ve donatı okunurluguna inmiyorsa saha için tamamlanmis proje sayilmaz.",
    intro: [
      "Statik proje, bir binanin taşıyıcı karakterini belirleyen ana teknik omurgadir. Yuklerin hangi elemanlardan gecerek zemine inecegi, deprem altinda hangi mekanizma ile davranacagi, kritik düğümlerde donatı ve kalıp duzeninin nasil kurulacagi bu projede tarif edilir. Bu nedenle statik proje bir hesap klasoru değil; tasarim, uygulama ve denetimi aynı cizgide birlestiren ana mühendislik dokumanidir.",
      "Sahada en çok vakit ve maliyet kaybettiren sorunlardan biri, analiz olarak tamamlanmis ama uygulama dili eksik statik projedir. Perde-kiriş birlesimlerinin okunmayan paftaları, donatı yogunlugunun sahaya nasil indirilecegini soylemeyen kesitler, sonradan delinmek zorunda kalinan döşeme boşlukları ve katlar arasinda aks mantigini bulandiran mimari revizyonlar; kaliteli bir hesap raporunu bile zayif bir saha belgesine donusturebilir.",
      "Bir inşaat mühendisi için statik projeyi anlamak sadece program ciktisini okumak demek degildir. Yük tanimlari, on boyut kararlari, düzensizlik kontrolü, deprem davranisi, temel secimi, rezervasyon disiplinleri ve imalatin ne kadar okunabilir olacagi bir butun olarak degerlendirilmelidir. Bu bakis yoksa sahada betonarme ekipleri ikinci kez tasarim yapmak zorunda kalir ki bu, kaliteli projecilik acisindan ciddi bir zafiyettir.",
      "Bugun turkiyedeki pek çok projede ana çerçeve; yüklerin TS 498 mantigiyla tanimlandigi, betonarme detaylarin TS 500 ile sekillendigi ve deprem davranisinin TBDY 2018 ile belirlendigi bir zincire dayanır. Dolayisiyla statik proje, sadece kesit hesabinin değil, bu standartlarin sahada birbiriyle konusan uygulama dilinin olgunlastirilmis halidir.",
      "Bu yazida statik projeyi ofis merkezli bir tasarim paketi olarak değil, şantiyede karar kalitesini belirleyen aktif araç olarak ele aliyoruz. Mimari ile overlay ihtiyacindan kolon on boyut mantigina, kritik düğümlerde donatı sikismasi riskinden shop drawing derinligine kadar bir inşaat muhendisinin bilmesi gereken esaslari detayli bicimde tartisiyoruz.",
    ],
    theory: [
      "Statik projenin teorik temeli, yüklerin tanimlanmasi ve taşıyıcı sistem icinde mantikli bir yol izlemesidir. Sabit yükler, hareketli yükler, cephe ve dolgu yukleri, çatı ve kar etkileri, mekanik ekipman yukleri ve deprem etkileri modele girerken yalnızca rakam olarak değil, sistemde nereden nereye akacaklari dusunulerek ele alinmalidir. Yük tanimi hataliysa en güzel model bile yanlış temelden başlar.",
      "Taşıyıcı sistem secimi ikinci kritik kavramdir. Çerçeve ağırlıklı, perde-çerçeve karma veya farkli sistem kurgularinin her biri rijitlik, deplasman, düzensizlik ve saha uygulanabilirligi acisindan farkli sonuclar uretir. Kagit üzerinde rijitligi artirmak için eklenen bir perde, mimaride kapatilmasi zor bir aksi bloke edebilir; mimari talebi korumak için inceltilen bir eleman ise deprem davranisini zayiflatabilir. Bu nedenle statik proje, matematiksel optimum ile yapilabilir optimum arasinda denge kurma sanatidir.",
      "Deprem tasarımı bu teorik zeminin icinde ayri bir ağırlık tasir. TBDY 2018 mantigi; yalnız eleman dayanimina değil, sistem duzensizliklerine, süneklik kapasitesine, kat otelemelerine, perde surekliligine ve düğüm davranisina odaklanir. Bu nedenle bir eleman kesitini tek basina buyutmek, sistem problemini her zaman cozmeye yetmez. Statik proje bu ayrimi anlamadiginda, detaylar güçlü ama sistem davranisi zayif çözümler uretebilir.",
      "Uygulanabilirlik ise teorik tartismanin sahadaki gercek testidir. Kesisen donatilarin betonlanabilirligi, kalıp kurulabilirligi, pompa hortumu ve vibrator erisimi, rezervasyonlarin sonradan delme ihtiyaci dogurmamasi ve kritik bolgelerde donatı acilimlarinin okunabilir olmasi; projenin nihai degerini belirler. Gercek hayatta kalitesiz saha sonuclarinin buyuk kismi hesap hatasindan değil, uygulanabilirlik filtresinin zayif olmasindan kaynaklanir.",
      "Bu nedenle statik proje uretiminde iki göz birlikte calismalidir: biri analitik doğruluğu, digeri saha mantigini temsil eder. Sadece ofis gozuyle cizilen proje fazlaca idealize olabilir; sadece saha gozuyle revize edilen proje ise standartlardan uzaklasabilir. Mühendislik kalitesi bu iki denetimin aynı paftada birlesmesiyle ortaya çıkar.",
    ],
    ruleTable: [
      {
        parameter: "Yük tanimlari ve on tasarim girdileri",
        limitOrRequirement: "Sabit ve hareketli yük varsayimlari yapının kullanimina göre TS 498 mantigi ile tutarli tanimlanmalidir",
        reference: "TS 498",
        note: "Yanlış yük kabulu, daha ilk adimda eleman ve sistem kararlarini bozar.",
      },
      {
        parameter: "Deprem davranisi ve sistem duzensizlikleri",
        limitOrRequirement: "Taşıyıcı sistem secimi, düzensizlik kontrolü ve deprem etkileri TBDY 2018'in ilgili bolumleri ile uyumlu olmalidir",
        reference: "TBDY 2018, Bölüm 3, Bölüm 4 ve Bölüm 7",
        note: "Kesit hesabinin doğru olmasi, sistem davranisinin de doğru oldugu anlamina gelmez.",
      },
      {
        parameter: "Betonarme malzeme ve detay kurallari",
        limitOrRequirement: "Kesit, donatı, paspayı, bindirme ve birleşim kararlari TS 500 çerçevesinde acik ve sahada okunur olmalidir",
        reference: "TS 500, Madde 6-12 ve Madde 16",
        note: "Saha yorumuna kalan her detay kalite kaybi riski tasir.",
      },
      {
        parameter: "Temel ve zemin uyumu",
        limitOrRequirement: "Temel tipi ve yük aktarimi zemin verileri ile deprem etkileri birlikte degerlendirilerek secilmelidir",
        reference: "TBDY 2018, Bölüm 12 + zemin etudu",
        note: "Üst yapida kurulan mantik, temel seviyesinde kopmamali.",
      },
      {
        parameter: "Koordinasyon ve rezervasyonlar",
        limitOrRequirement: "MEP boşlukları, şaftlar ve kritik gecisler projede kontrollu tarif edilmelidir",
        reference: "Disiplin overlay plani",
        note: "Sonradan delme ihtiyaci doguran döşeme ve kirişler statik proje eksigidir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari aks, cekirdek, şaft ve cephe kurgusunu erken al; taşıyıcı sistem secimini bunlardan bağımsız yapma.",
      "Yukleri TS 498 mantigiyla net tanimla, sonra sistem alternatiflerini deprem davranisi ve yapılabilirlik acisindan karsilastir.",
      "Perde, kolon, kiriş ve döşeme iliskisini yalnız program sonucuna göre değil, kat otelemeleri, donatı yoğunluğu ve boşluk ihtiyaci ile birlikte degerlendir.",
      "Kritik düğümlerde shop drawing mantigina yakin buyutmeler uret; ustanin yorumuna kalan belirsiz alan birakma.",
      "Temel sistemi secilirken zemin etudu, yük dagilimi, deprem etkisi ve saha lojistigini birlikte oku; üst yapı karari ile temel kararini ayri ekiplerin sorunu gibi dusunme.",
      "Pafta yayina cikmadan önce mimari ve MEP overlay, donatı okunurlugu ve saha uygulanabilirligi uzerinden son kalite turu yap.",
    ],
    criticalChecks: [
      "Kolon, perde ve kiriş akslari mimari revizyonlara ragmen katlar boyunca sürekli mi?",
      "Kritik düğümlerde donatı sikismasi nedeniyle beton yerlesimi zorlasiyor mu?",
      "Döşeme ve kirişler için kontrolsüz sonradan delme ihtiyaci doguracak boşluk eksigi var mi?",
      "Temel tipi, zemin etudu ve üst yapı rijitlik dagilimi ile aynı mühendislik mantigini tasiyor mu?",
      "Paftalar saha ekiplerinin yorumsuz okuyabilecegi netlikte mi, yoksa kesit ve detay eksikleri var mi?",
      "Son revizyondan sonra hesap modeli, pafta seti ve shop drawing mantigi birbirini gercekten tutuyor mu?",
    ],
    numericalExample: {
      title: "6 katli bir konut yapisinda alt kat kolon on boyut yorumu",
      inputs: [
        { label: "Kolonun etkiledigi alan", value: "24 m2", note: "Ornek tributary alan" },
        { label: "Kat basi tasarim düşey yük", value: "11 kN/m2", note: "Sabit + hareketli yük için kaba on tasarim degeri" },
        { label: "Kat sayisi", value: "6", note: "Aynı yük dagiliminin yaklasik kabul edildigi senaryo" },
        { label: "On secilen kolon kesiti", value: "40 x 40 cm", note: "Alt kat için ilk yaklasim" },
      ],
      assumptions: [
        "Hesap ogretici amaclidir; nihai kolon tasarımı deprem etkileri, momentler ve ikinci mertebe etkileri ile birlikte yapilir.",
        "Yük dagilimi katlar boyunca benzer kabul edilmistir.",
        "Kaba kontrol için kolon kendi agirligi ve lokal düzensizlik etkileri ihmal edilmistir.",
      ],
      steps: [
        {
          title: "Bir katin kolona getirdigi düşey yükü bul",
          formula: "24 x 11 = 264 kN",
          result: "Kolonun bir katta tasidigi yaklasik düşey yük 264 kN olarak okunur.",
          note: "Bu deger on boyutlandirma icindir; nihai analiz sonucu farkli olabilir.",
        },
        {
          title: "Alt kattaki toplam yaklasik yükü hesapla",
          formula: "6 x 264 = 1584 kN",
          result: "Alt kat kolonunda yaklasik 1584 kN seviyesinde düşey yük beklenir.",
          note: "Deprem ve moment etkileri bu doğrudan basinc hesabina dahil degildir.",
        },
        {
          title: "Ortalama gerilme seviyesini yorumla",
          formula: "1584 kN / 0,16 m2 = 9900 kN/m2 ~ 9,9 MPa",
          result: "40 x 40 cm kolon için ortalama basinc seviyesi yaklasik 9,9 MPa olur.",
          note: "C30/37 beton için bu sonucun kesin yeterlilik anlami yoktur; ama ilk kesit seciminin mertebesini test eder.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Kesit boyutu ilk bakista makul gorunse de kolon nihai olarak deprem etkileri, eksenel kuvvet-moment etkilesimi, donatı yerlesimi ve kat otelemeleri ile birlikte doğrulanmalıdır.",
          note: "Statik projede on boyut mantigi, nihai tasarımı hizlandirir ama onun yerine gecmez.",
        },
      ],
      checks: [
        "On boyut sonucu mimari duvar kalinliklari ve kullanilabilir alanla uyumlu mu?",
        "Kolon kesiti, donatı yerlesimi ve birleşim bolgesi okunurlugu için yeterli alan birakiyor mu?",
        "Perde ve kolon dagilimi yalnız eksenel yük değil deprem davranisi acisindan da dengeli mi?",
        "Kesin karar verilmeden önce analiz modeli ve detay paftaları birlikte guncellenmeli.",
      ],
      engineeringComment: "Iyi on boyutlandirma, programe girilen rastgele bir kesit değil; mimari, deprem ve saha okunurlugu arasinda kurulan ilk mühendislik uzlasisidir.",
    },
    tools: STATIK_TOOLS,
    equipmentAndMaterials: STATIK_EQUIPMENT,
    mistakes: [
      { wrong: "Statik projeyi yalnız program ciktisi ve otomatik pafta paketi olarak kabul etmek.", correct: "Model, detay ve saha uygulanabilirligini aynı kalite turundan gecirmek." },
      { wrong: "Mimari revizyonlardan sonra taşıyıcı sistem surekliligini yeniden sorgulamamak.", correct: "Aks ve düzensizlik etkilerini her buyuk revizyonda tekrar okumak." },
      { wrong: "MEP bosluklarini döşemede sonradan delmeye birakmak.", correct: "Kritik rezervasyonlari statik paftaya kontrollu sekilde islemek." },
      { wrong: "Donatı yoğunluğu yüksek dugumleri kagit üzerinde çözülmüş saymak.", correct: "Betonlanabilirlik ve vibrator erisimini saha gozuyle degerlendirmek." },
      { wrong: "Temel secimini üst yapidan bağımsız ve sadece zemin raporuna birakmak.", correct: "Zemin verisini yük dagilimi ve deprem davranisi ile birlikte okumak." },
      { wrong: "Revizyon kontrolünü zayif tutup farkli pafta setlerinin sahaya cikmasina izin vermek.", correct: "Hesap modeli, pafta ve shop drawing zincirini tek revizyon mantigina baglamak." },
    ],
    designVsField: [
      "Tasarim ofisinde statik proje tablo, model ve paftadan olusur; sahada ise aynı proje kalıp sırası, demir yoğunluğu, beton yerlesimi ve denetim turleri olarak yasatilir.",
      "Projede okunmayan bir bindirme bolgesi, sahada eksik etriye veya yanlış ek boyu olarak geri doner. Bu nedenle detay netligi yapisal guvenligin ayrilmaz parcasidir.",
      "En iyi statik proje, yalnız emniyet katsayilari saglayan değil, usta, formen ve kontrol muhendisinin aynı sonucu okudugu projedir.",
    ],
    conclusion: [
      "Statik proje; yük tanimi, sistem secimi, deprem davranisi, detay okunurlugu ve saha uygulanabilirligi birlikte cozuldugunda gercek degerini uretir. Aksi halde iyi analiz bile sahada eksik uygulamaya donusebilir.",
      "Bir inşaat mühendisi için temel hedef, projeyi yalnız doğru hesaplanmis değil, doğru okunur ve doğru uygulanir hale getirmektir. Bu bakis şantiyede revizyonu, kırma-duzeltmeyi ve yapisal kalite kaybini belirgin bicimde azaltir.",
    ],
    sources: [...PROJE_STATIK_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500, TS_498_SOURCE],
    keywords: ["statik proje", "TS 498", "TBDY 2018", "TS 500", "taşıyıcı sistem", "on boyutlandirma"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/mimari-proje", "kaba-insaat/donati-isleri/kiris-donati"],
  },
];
