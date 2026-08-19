import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];
const KAZI_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];
const INCE_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_12063_SOURCE: BinaGuideSource = {
  title: "TS EN 12063 Çelik Palplanslar - Üretim Toleranslari ve Teslim Kosullari",
  shortCode: "TS EN 12063",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Çelik palplans kesitleri, toleranslari ve urun tanimi için temel referanslardan biridir.",
};

const TS_EN_14782_SOURCE: BinaGuideSource = {
  title: "TS EN 14782 Çatı ve Cephede Kullanilan Kendini Tasiyan Metal Saclar",
  shortCode: "TS EN 14782",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Metal çatı panellerinde urun tipi, geometri ve uygulama siniflari için temel referanslardan biridir.",
};

const KABA_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Planlama", name: "Kat cevrimi ve saha lojistik matrisi", purpose: "Kaba inşaat imalatlarini kalıp, donatı, beton ve duvar olarak aynı ritimde yonetmek." },
  { category: "Kontrol", name: "Aks, kot ve tolerans checklisti", purpose: "Her katta geometri sapmalarini bitis islerine kalmadan yakalamak." },
  { category: "Koordinasyon", name: "MEP rezervasyon ve gomulu eleman listesi", purpose: "Kaba inşaat icinde unutulan rezervasyonlari azaltmak." },
  { category: "Kayıt", name: "Gunluk imalat ve test arşivi", purpose: "Beton, donatı, duvar ve kalıp kararlarini sonradan izlenebilir kilmak." },
];

const KAZI_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Geoteknik on hesap ve deplasman yorum tablosu", purpose: "Palplans boyu, kademe ve komşu etkisini sayisal izlemek." },
  { category: "Ölçüm", name: "Prizma, total station ve titreim izleme seti", purpose: "Kaz cevresi hareketini ve darbeli cakma etkisini takip etmek." },
  { category: "Saha", name: "Cakma-dals logu ve su seviyesi formu", purpose: "Her palplans elemaninin imalat davranisini kayda baglamak." },
  { category: "Kontrol", name: "Komşu yapı hasar ve çatlak izleme listesi", purpose: "Kaz ilerledikce çevre etkisini dokumante etmek." },
];

const ROOF_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Metal çatı katman ve düğüm paftası", purpose: "Mahya, dere, kenar ve panel bindirme detaylarini sahada tekrarlanabilir kilmak." },
  { category: "Ölçüm", name: "Egim, aci ve panel dogrultu kontrol seti", purpose: "Su yonu ve panel ritmini sayisal olarak denetlemek." },
  { category: "Kontrol", name: "Vida, klips ve szdrmazlik checklisti", purpose: "Rüzgar emmesi ve su riski tasiyan dugumleri sistematik kontrol etmek." },
  { category: "Kayıt", name: "Su testi ve termal hareket takip notu", purpose: "Metal çatıda panel davranisini teslim dosyasina baglamak." },
];

const KABA_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Lazer nivo, total station ve aks referans ekipmanlari", purpose: "Kaba inşaat geometri disiplinini kat kat dogrulamak.", phase: "Tüm süreç" },
  { group: "Imalat", name: "Kalıp, iskele, donatı ve beton ekipmanlari", purpose: "Taşıyıcı sistem imalatlarini planli sıra ile yurtmek.", phase: "Kat cevrimi" },
  { group: "Koordinasyon", name: "Rezervasyon kaliplari ve gomulu elemanlar", purpose: "MEP ve mimari gecisleri kaba inşaat icinde doğru yerlestirmek.", phase: "Beton öncesi" },
  { group: "Kayıt", name: "Numune, foto ve kalite arşivi", purpose: "Yapilan imalatin izlenebilirligini ve teslim kalitesini desteklemek.", phase: "Sürekli" },
];

const KAZI_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Palplans profilleri, kaskat ve basma/cakma ekipmani", purpose: "Çelik levhalari tasarim dorultusunda zemine yerlestirmek.", phase: "Cakma" },
  { group: "Destek", name: "Kusak kirii, kuak profili ve i destek/ankraj elemanlari", purpose: "Palplans duvarin yatay davranisini kontrol etmek.", phase: "Iksa tamamlama" },
  { group: "Ölçüm", name: "Prizma, total station, vibrasyon ve su seviyesi ekipmani", purpose: "Kaz cevresindeki hereket, titreim ve su davranisini izlemek.", phase: "Kaz sresince" },
  { group: "Lojistik", name: "Vin, klavuz ase ve akma hatt dzeni", purpose: "Profillerin aks, deylik ve kilit devamllyla indirilmesini saglamak.", phase: "Montaj" },
];

const ROOF_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt sistem", name: "Asik, mertek, alt taşıyıcı ve buhar kontrol katmanlari", purpose: "Metal panelin oturacagi doğru geometri ve kabuk davranisini kurmak.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Metal çatı paneli, mahya ve dere elemanlari", purpose: "Su gecirimsizlik ve rüzgar altinda kaplama butunlugunu saglamak.", phase: "Panel montaji" },
  { group: "Bağlantı", name: "Vida, klips, conta ve hareket detayi elemanlari", purpose: "Panelin termal hareketine izin verirken szdrmazl korumak.", phase: "Sabitleme" },
  { group: "Koruma", name: "Gecici yuruyus yolu ve teslim koruma malzemeleri", purpose: "Bitmis panelin erken hasar veya ezilmeden korunmasini saglamak.", phase: "Teslim öncesi" },
];

export const structureEnvelopeBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat",
    kind: "branch",
    quote: "Kaba inşaat, yapının iskeletini kuran ilk buyuk fazdir; hatalari da doğru kararlarla erken, pahali sekilde de burada uretir.",
    tip: "Kaba insaati yalnız betonarme imalati gibi okumak, geometri, rezervasyon, duvar ve çatı baglantilarinin urettigi tekrar isiligi gormemektir.",
    intro: [
      "Kaba inşaat; temel ustunden itibaren taşıyıcı sistemin, dolgu duvarlarin, ana geometri kararlarinin ve çatı iskeletine kadar uzanan ana yapisal fazin adidir. Bu nedenle yalnızca kolon, kiriş ve döşeme doken bir süreç değil; sahadaki tüm sonraki imalatlar için referans olusturan bir geometri ve kalite evresidir.",
      "Sahada kaba inşaat asamasinda yapilan bir hata cogu zaman aynı gun fark edilmez. Yanlış aks, yetersiz rezervasyon, unutulmus gomulu parca, hatali kat cevrimi veya dalgali döşeme gibi kusurlar; mekanik, elektrik, duvar, siva ve doğrama ekipleri alana girdikce buyur. Bu nedenle kaba inşaat kalite seviyesi, yalnız beton dayanımı ile değil, butun proje disiplinlerinin ne kadar temiz ilerleyebildigi ile de ölçülür.",
      "Bir inşaat mühendisi için kaba inşaat, taşıyıcı sistem hesabi ile saha lojistiginin bulustugu alandir. Kalıp, donatı, beton, rezervasyon, duvar, dikey sirkulasyon ve çatı iskeleti aynı takvimde ve aynı geometri mantiginda yonetilmelidir. Bu zincirdeki bir kopukluk kat cevrimini, maliyeti ve kaliteyi aynı anda bozar.",
      "Bu rehberde kaba insaati; teorik omurga, yönetmelik ve standart ekseni, sayisal bir kat cevrimi ornegi, araçlar ve saha hatalari uzerinden daha derin ve kullanışlı bir blog yazisi haline getiriyoruz.",
    ],
    theory: [
      "Kaba insaatin teorik temeli, taşıyıcı sistemin geometri, rijitlik ve süreklilik kararlarini sahada gercege donusturmektir. Tasarim ofisinde kolon, kiriş, döşeme ve perdeler bir analiz modeli olarak görünür; sahada ise bunlarin kalıp kurulabilirligi, donatı okunurlugu, betonlanabilirligi ve rezervasyonlarla uyumu aynı derecede önemlidir.",
      "Kat cevrimi burada belirleyici bir kavramdir. Bir katin kalıp, donatı, MEP rezervasyon, beton, kür, sokum ve duvar ilerleyisi bir ritim icinde yonetilmezse şantiyede ne üretim hz ne de kalite korunabilir. Çok hızlı ama kontrolsüz ilerleyen bir kat cevrimi, bir sonraki ekiplere fazla yama, fazla siva ve fazla kırma birakir.",
      "Kaba inşaat aynı zamanda tolerans yonetimidir. Aks, kot, düşeylik, boşluk ve aciklik kararlari bu evrede kurulur. Şantiyede sık duyulan 'ince isler duzeltir' yaklasimi teknik olarak yanlistir; cunku kaba insaattaki geometri hatasi, sonraki imalatlar tarafindan ancak pahali telafilerle ortulebilir.",
      "Bu nedenle kaba inşaat, yalnız taşıyıcı eleman imalati değil; tüm yapının okunur, tekrarlanabilir ve kontrollu ina ritmini kuran ana sahadir. Iyi kaba inşaat sessizdir; kötü kaba inşaat ise kendini her sonraki ekipte yeni bir sorun olarak belli eder.",
    ],
    ruleTable: [
      {
        parameter: "Taşıyıcı sistem uygulamasi",
        limitOrRequirement: "Beton, donatı, kalıp ve geometri kararlar TS 500, TS EN 206 ve TS EN 13670 mantigiyla uyumlu yurutilmelidir",
        reference: "TS 500 + TS EN 206 + TS EN 13670",
        note: "Kaba inşaat kalitesi sadece dayanima değil uygulama disiplinine de baglidir.",
      },
      {
        parameter: "Deprem davranisi ve detay devamlligi",
        limitOrRequirement: "Kolon, kiriş, perde ve düğüm blgeleri TBDY 2018 mantigina uygun okunur detaylarla uygulanmalidir",
        reference: "TBDY 2018",
        note: "Sahadaki detay hatasi deprem davranisina doğrudan yansir.",
      },
      {
        parameter: "Rezervasyon ve gomulu elemanlar",
        limitOrRequirement: "MEP gecisleri, ankrajlar ve rezervasyonlar beton öncesi doğrulanmalıdır",
        reference: "Disiplin koordinasyon plani",
        note: "Sonradan kırma, kaba inşaat kalitesinin doğrudan kaybidir.",
      },
      {
        parameter: "Geometri ve tolerans",
        limitOrRequirement: "Aks, kot, dusaylik ve acikliklar her katta ölçülerek kayda bağlanmalıdır",
        reference: "Saha tolerans checklisti",
        note: "Kaba insaattaki geometri hatasi sonraki tüm ekipleri iter.",
      },
      {
        parameter: "Kat cevrimi disiplini",
        limitOrRequirement: "Kalıp, donatı, beton, kür ve sokum ritmi plansiz hiz yerine kontrollu sureklilikle yonetilmelidir",
        reference: "Şantiye programi ve kalite plani",
        note: "Kontrolsuz hiz, en pahali tekrar isiligi uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Temel ustu ilk aks kurulumundan itibaren geometriyi tek referans sistemiyle yonet; kat kat yeni dogrular uretme.",
      "Kalıp, donatı ve beton öncesi rezervasyonlari aynı checklist ile kontrol et; MEP overlay'i kaba insaattan ayirma.",
      "Her kat için kalıp, donatı, beton, kür ve sokum sırasını ekip kapasitesiyle uyumlu kat cevrimi planina bagla.",
      "Kolon-kiriş-düğüm, perde ve döşeme gibi kritik bolgeleri beton öncesi ayri kalite turundan gecir.",
      "Dolgu duvar ve çatı iskeleti gibi sonraki kaba paketleri taşıyıcı sistem geometri kontrolü tamamlanmadan ilerletme.",
      "Kat teslimlerinde sadece beton dayanımı değil, aks, kot, aciklik ve yüzey okunurlugunu da onay kriteri yap.",
    ],
    criticalChecks: [
      "Aks, kot ve acikliklar kat kat kayda baglaniyor muc",
      "MEP rezervasyonlari ve gomulu elemanlar beton öncesi dogrulandi mic",
      "Kritik düğümlerde donatı sikismasi veya beton gecisi riski var mic",
      "Kat cevrimi hizi kalite kontrolünü geride birakti mic",
      "Dolgu duvar ve çatı gibi sonraki paketler için yeterli geometri kalitesi saglandi mic",
      "Beton sonrasi sokum, tamir ve kür disiplini plansiz yuruyor muc",
    ],
    numericalExample: {
      title: "650 m2 tip kat için 7 gunluk kaba inşaat cevrimi yorumu",
      inputs: [
        { label: "Tip kat alani", value: "650 m2", note: "Orta olcekli konut/blogu ornegi" },
        { label: "Kalıp ve iskele", value: "2 gun", note: "Kurulum ve son duzeltme" },
        { label: "Donatı ve rezervasyon", value: "2 gun", note: "Beton öncesi hazirlik" },
        { label: "Beton ve erken kür", value: "1 gun", note: "Dokum ve ilk koruma" },
        { label: "Sokum ve duzeltme", value: "2 gun", note: "Kontrollu devir" },
      ],
      assumptions: [
        "Ekip kapasitesi bu ritmi destekleyecek duzendedir.",
        "MEP rezervasyonlari son anda değişiklik yaratmayacaktir.",
        "Hava kosullari betonu ve kalıp sokum sırasını bozacak seviyede degildir.",
      ],
      steps: [
        {
          title: "Toplam cevrimi hesapla",
          formula: "2 + 2 + 1 + 2 = 7 gun",
          result: "Tip kat için teorik 7 gunluk bir kaba inşaat cevrimi olusur.",
          note: "Bu, yalnız program degeri değil; kaliteyi tasiyacak minimum kontrol penceresidir.",
        },
        {
          title: "Riskli sikismayi yorumla",
          result: "Bu 7 gun icinde MEP rezervasyon, beton kabul veya sokum kontrolü skistirilirsa geometri hatalari bir sonraki kata tasinir.",
          note: "Hiz kazanimi gibi gorunen durum, alt ekipler için gecikme ve tamir olarak geri donebilir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Kaba insaattaki kat cevrimi, sadece gun sayisi değil; kalite adimlarinin eksiksiz tasindigi bir ritim olarak okunmalidir.",
          note: "Doğru cevrim, hiz ile kontrol arasinda kurulmus dengedir.",
        },
      ],
      checks: [
        "Kat cevrimi kalite kontrol adimlari dusulmeden hesaplanmalidir.",
        "Rezervasyon ve geometri kontrolleri beton programina kurban edilmemelidir.",
        "Sokum ve duzeltme süreleri bir sonraki kata zorlama aktarilmamalidir.",
        "Kat teslimi, program kadar l ve yzey kalitesiyle de onaylanmalidir.",
      ],
      engineeringComment: "Kaba insaatta hızlı olmak, daha az gun yazmak değil; kalite adimlarini eksiltmeden ritmi koruyabilmektir.",
    },
    tools: KABA_BATCH_TOOLS,
    equipmentAndMaterials: KABA_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Kaba insaati yalnız betonarme dokum takvimi gibi yonetmek.", correct: "Kalıp, donatı, rezervasyon, duvar ve geometriyi tek sistem gibi ele almak." },
      { wrong: "Rezervasyonlari sonradan kirariz mantigiyla gecmek.", correct: "MEP gecislerini beton öncesi kilitlemek." },
      { wrong: "Kat cevrimi için kalite adimlarini kisaltmak.", correct: "Kontrol pencerelerini cevrimin ayrilmaz parçası yapmak." },
      { wrong: "Aks ve kot sapmalarini ince islere birakmak.", correct: "Geometriyi kaba insaatta dzeltmek ve kayda baglamak." },
      { wrong: "Sokum ve kür disiplinini program baskisiyla gevsetmek.", correct: "Beton sonrasi koruma ve kontrollu devir mantigi kurmak." },
      { wrong: "Dolgu duvar ve çatı iskeleti için taşıyıcı sistem teslimini erken varsaymak.", correct: "Sonraki paketleri geometri kalitesi dogrulanmadan baslatmamak." },
    ],
    designVsField: [
      "Ofiste kaba inşaat bir analiz modeli gibi görünür; sahada ise aynı model lojistik, ekip kapasitesi ve geometri disipliniyle gercege donusur.",
      "Iyi kaba inşaat kendini sessizlikle gosterir; sonraki ekipler daha az kirar, daha az yamalar ve daha hızlı ilerler.",
      "Bu nedenle kaba inşaat kalitesi, yalnız beton sinifi değil butun şantiyenin ritim kalitesidir.",
    ],
    conclusion: [
      "Kaba inşaat, yapının ilk buyuk kalitesini ve sonraki tüm imalatlarin referans geometrisini kurar. Burada doğru kurulan ritim ve tolerans disiplini, şantiyenin geri kalaninda tekrar isi dramatik bicimde azaltir.",
      "Bir inşaat mühendisi için en sağlam bakis, kaba insaati tek tek imalatlar toplami değil; tüm yapının okunabilirlik ve uygulanabilirlik omurgasi olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670],
    keywords: ["kaba inşaat", "kat cevrimi", "rezervasyon", "geometri toleransi", "saha koordinasyonu"],
    relatedPaths: ["kaba-insaat/beton-isleri", "kaba-insaat/kalip-isleri", "kaba-insaat/donati-isleri", "kaba-insaat/duvar-orme"],
  },
  {
    slugPath: "kazi-temel/iksa-sistemi/palplans",
    kind: "topic",
    quote: "Palplans, ince gorunen bir çelik levha duvar değil; suyu, zemini ve komşu etkiyi aynı anda kontrol etmeye çalışan hızlı bir geoteknik savunma sistemidir.",
    tip: "Palplansi yalnız profil boyu secimi gibi görmek, kilit devamlligi, titreim etkisi ve su davranisini gözden kacirmaktir.",
    intro: [
      "Palplans sistemleri, ozellikle yeralt suyu etkisinin yüksek oldugu, hızlı kuruluma ihtiyaç duyulan veya mevcut altyapi ve komşu etkisinin sinirli deplasmanla yonetilmesi gereken kazilarda sık kullanilan çelik iksa cozumleridir. Ince kesitli olduklari için yaln grnrler; ancak davranislari yalnız profil rijitligine değil zemin, su, destek seviyesi ve kilit devamllna baglidir.",
      "Sahada palplansla ilgili en kritik fark, sistemin imalat sırasında aynı anda hem geometri hem de titreim etkisi uretmesidir. Cakma ya da basma surecinde komşu yapilar, yol kaplamasi, yer alti hatlari ve su seviyesi birlikte izlenmezse profil doru secilse bile saha riski buyuyebilir.",
      "Bir inşaat mühendisi için palplans, hızlı bir iksa alternatifi olmanin otesinde iyi izleme ve iyi saha lojistigi isteyen bir geoteknik sistemdir. Kilitlerin kapanmasi, profilin dusayligi, kuak kirii veya ankrajla baglantisi ve su kesme davranisi birlikte okunmaldr.",
      "Bu rehberde palplans sistemini; teorik temel, standart ekseni, sayisal profil boyu ornegi, saha ekipmanlari ve sık yapilan hatalarla birlikte daha derin ve kullanilabilir bir yazya donusturuyoruz.",
    ],
    theory: [
      "Palplans davranisinin merkezi, profilin zemin icindeki gomulu boyu ile kilitli duvar etkisidir. Tek tek çelik levhalar ancak kilitleri sayesinde sürekli bir perde gibi davranir; bu nedenle tek bir profilin boyu kadar komşu profillerle kurulan geometri ve kilit devamlligi de kritik oneme sahiptir. Sahada kilidi acik veya aks disi inen tek bir eleman tüm duvar davranisini zayiflatabilir.",
      "Sistemin ikinci kritik ekseni su davranisidir. Palplans, tam anlamiyla su gecirmez bir duvar gibi dusunulmemeli; ancak su yolunu zorlastiran ve drenaj stratejisiyle birlikte çalışan bir kontrol elemani olarak okunmalidir. Yeralti suyu yüksek alanlarda yalnız profil cakmak yeterli olmaz; pompaj, taban stabilitesi ve dewatering senaryosu da tasarim zincirine dahil edilmelidir.",
      "Titreim ve komşu etki de palplansin baska bir ayirici ozelligidir. Darbe ile cakilan sistemlerde titreim, komşu yapilarin hassasiyeti, altyapi hatlari ve yol kotlari üzerinde etkili olabilir. Bu nedenle palplans secimi yalnız kesit ekonomisiyle değil, sahadaki imalat yöntemi ve çevre riskleriyle birlikte degerlendirilmelidir.",
      "TS EN 12063 profil ve tolerans cercevesini verir; ancak sahadaki gercek basari, profilin ne kadar doğru aksla indirildigi, hangi destekleme duzeniyle calistigi ve titreim-su birlikte izleme disiplininin kurulup kurulmadigi ile belirlenir.",
    ],
    ruleTable: [
      {
        parameter: "Profil ve tolerans secimi",
        limitOrRequirement: "Palplans profili, cekme ve gomulme davranisini tasiyacak kesit ve toleransla secilmelidir",
        reference: "TS EN 12063",
        note: "Kesit secimi yalnız malzeme ekonomisine indirgenmemelidir.",
      },
      {
        parameter: "Gomulme ve destek seviyesi",
        limitOrRequirement: "Kaz derinligi, su seviyesi ve destekleme duzeniyle uyumlu gomulme boyu saglanmalidir",
        reference: "Geoteknik tasarim mantigi + saha izleme plani",
        note: "Palplansin yukarida kalan boyu kadar zemindeki boyu da belirleyicidir.",
      },
      {
        parameter: "Kilit devamlligi ve dusaylik",
        limitOrRequirement: "Profiller aks, dusaylik ve kilit kapanisi acisindan imalat boyunca kontrol edilmelidir",
        reference: "Saha imalat logu",
        note: "Tek bir kilit problemi su ve deformasyon davranisini bozabilir.",
      },
      {
        parameter: "Titreim ve komşu etki",
        limitOrRequirement: "Cakma veya basma surecinde komşu yapı, yol ve altyapi etkileri izlenmelidir",
        reference: "Komşu etki ve titreim takip plani",
        note: "Palplans imalati cevreyi etkileyen aktif bir surectir.",
      },
      {
        parameter: "Su kontrolü",
        limitOrRequirement: "Palplans uygulamasi, drenaj ve pompaj stratejisiyle birlikte ele alinmalidir",
        reference: "Kaz su kontrol plani",
        note: "Profil tek basina tm hidrostatik problemi cozmeyebilir.",
      },
    ],
    designOrApplicationSteps: [
      "Profil tipini, kesit rijitligini ve imalat yontemini komşu etki, su seviyesi ve kaz derinligiyle birlikte sec.",
      "Palplans aksini klavuz sistemle kür; ilk profillerin dusayligini butun duvarin referansi olarak kabul et.",
      "Cakma veya basma sırasında kilit kapanisini, profil boyunu ve imalat sırasını logla.",
      "Kusak kirişi, i destek veya ankraj gibi tamamlayici elemanlari palplans davranisindan ayri dusunme.",
      "Yeralt suyu, titreim ve komşu yapı takibini imalatla aynı gunluk ritimde yurt.",
      "Kaz ilerledikce palplans duvarin basligi, kötü ve deplasman davranisini tekrar tekrar olcerek teyit et.",
    ],
    criticalChecks: [
      "Ilk profillerin aks ve dusaylik hatasi duvar boyunca tasindi mic",
      "Kilitlerde acilma, atlama veya kapanmama riski var mic",
      "Titreim etkisi komşu yapı ve altyapi için izleniyor muc",
      "Kaz derinligi arttikca destek seviyesi palplans davranisini yeterince tutuyor muc",
      "Yeralt suyu ve pompaj stratejisi duvarla aynı anda ynetiliyor muc",
      "Profil boyu ve gercek gomulme sahada loga isleniyor muc",
    ],
    numericalExample: {
      title: "4,50 m kazda palplans toplam boyu için on yorum",
      inputs: [
        { label: "Kaz derinligi", value: "4,50 m", note: "Yol kenari kısa derin kaz" },
        { label: "On gomulme boyu", value: "2,50 m", note: "Su ve zemin kontrolü için konsept varsayim" },
        { label: "Baslik payi", value: "0,50 m", note: "Kuak ve kesim toleransi" },
        { label: "Hedef", value: "Toplam profil boyu", note: "Saha lojistigi ve siparis karari" },
      ],
      assumptions: [
        "Nihai tasarim geoteknik analizle teyit edilecektir.",
        "Profil basligi kesim ve kuak uygulamasi için belli pay birakacaktir.",
        "Su etkisi ve komşu hassasiyeti nedeniyle gomulme yalnız min. statik ihtiyaca göre secilmeyecektir.",
      ],
      steps: [
        {
          title: "Toplam boyu hesapla",
          formula: "4,50 + 2,50 + 0,50 = 7,50 m",
          result: "On saha yorumu için yaklasik 7,50 m profil boyu gerekir.",
          note: "Bu deger siparis ve lojistik planina ilk girdi sağlar; nihai boy geoteknik modelle doğrulanmalıdır.",
        },
        {
          title: "Destek ve su etkisini ekle",
          result: "Kaz kademesi, su seviyesi ve destekleme düzeni bu boyu dorudan etkileyebilir.",
          note: "Profil boyu yalnız kaz derinligi kadar okunursa sistem riske girer.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Palplans seiminde profil boyu, geometri ve çevre etkisi birlikte okunmalidir.",
          note: "Hızlı sistem olmasi, detaysiz sistem oldugu anlamina gelmez.",
        },
      ],
      checks: [
        "On boy hesab geoteknik tasarimin yerine gecmez; yalnız saha planina giriş sağlar.",
        "Gomulme boyu su ve komşu etki ile birlikte degerlendirilmelidir.",
        "Profil siparisi destek ve kesim paylari dahil dnlmelidir.",
        "malat yöntemi kaynakli titreim riski ilk boy hesabindan ayri dusunulmemelidir.",
      ],
      engineeringComment: "Palplansda en tehlikeli yanlış, profil boyunu yalnız acikta kalan derinlik kadar sanmaktir.",
    },
    tools: KAZI_BATCH_TOOLS,
    equipmentAndMaterials: KAZI_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Palplansi yalnız profil boyu secimi gibi görmek.", correct: "Kilit, destek, su ve titreim etkisini birlikte deerlendirmek." },
      { wrong: "Ilk profillerin aks hatasini göz ardi etmek.", correct: "Başlangıç profillerini butun duvarin referansi olarak hassas kurmak." },
      { wrong: "Komşu yapilari imalat bitince kontrol etmek.", correct: "Titreim ve hareket takibini imalatla eszamanli yrtmek." },
      { wrong: "Su kontrolünü palplansin tek basina cozdugunu varsaymak.", correct: "Pompaj ve drenaj stratejisini sistemle birlikte tasarlamak." },
      { wrong: "Kilit kapanisini saha hizina feda etmek.", correct: "Her profilin dusaylik ve kilit devamlligini loglamak." },
      { wrong: "Nihai geoteknik dogrulamayi atlayip on boy hesabiyla siparisi kapatmak.", correct: "Konsept hesab geoteknik model ve saha izleme ile teyit etmek." },
    ],
    designVsField: [
      "Palplans kagit üzerinde seri cizgiler gibi görünür; sahada ise her profil komşu etki ve su davranisi ureten aktif bir imalattir.",
      "Iyi palplans sistemi, hızlı kurulandan çok, aksi ve kilidi kontrollu kurulandir.",
      "Bu nedenle palplans, ekonomisi kadar izleme disipliniyle de degerlendirilmelidir.",
    ],
    conclusion: [
      "Palplans sistemi doğru profil, doğru gomulme ve doğru izleme disiplini ile kullanildiginda hızlı ve etkili bir iksa cozumudur. Bu zincir zayif kuruldugunda ise su, titreim ve geometri sorunlari kısa surede belirginlesir.",
      "Bir inşaat mühendisi için doğru bakis, palplansi basit bir çelik perde değil; sahada çevre etkisiyle birlikte yasayan bir geoteknik sistem olarak gormektir.",
    ],
    sources: [...KAZI_BATCH_SOURCES, SOURCE_LEDGER.afadHazard, TS_EN_12063_SOURCE],
    keywords: ["palplans", "TS EN 12063", "cift tarafli iksa", "titreim etkisi", "su kontrolü"],
    relatedPaths: ["kazi-temel/iksa-sistemi", "kazi-temel/iksa-sistemi/ankrajli-iksa", "kazi-temel/iksa-sistemi/fore-kazik"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/metal-cati",
    kind: "topic",
    quote: "Metal çatı, hafif ve hızlı bir kaplama gibi görünür; ama gercek basarisi termal hareketi, rüzgar emmesini ve yogusmayi aynı anda yonetebilmesindedir.",
    tip: "Metal çatıda en sık hata, paneli sac olarak görmek ve alt sistem, hareket detayi ve yoğuşma kontrolünü ikinci plana atmaktir.",
    intro: [
      "Metal çatı sistemleri; hızlı montaj, düşük ağırlık ve uzun aciklik avantajlari nedeniyle endustriyel yapilarda, depolarda ve bazi konut uygulamalarinda sık tercih edilir. Ancak bu sistemlerin sahadaki gercek kalitesi, yalnız panel kalnligina veya boya cinsine değil; alt taşıyıcı, bağlantı, hareket detayi ve yoğuşma kontrolunun birlikte cozulmesine baglidir.",
      "Sahada metal catiyla ilgili sikayetlerin buyuk kismi panelden değil, dugumlerden dogar. Mahya, dere, sacak, baca gecisi, cihaz ayagi, vida detayi veya hareket payi unutulan uzun panel hatlari ilk bakista problemsiz gorunse de mevsimsel hareketle beraber sızıntı, ses veya panel deformasyonu uretir.",
      "Bir inşaat mühendisi için metal çatı, yalnız üst ortuyu kapatan hızlı bir imalat degildir. Rüzgar emmesi, termal uzama, yoğuşma, alt sistem duzlugu ve bakım erisimi birlikte okunmalidir. En iyi panel bile egri asik uzerine, yanlış vida ritmiyle ve buhar kontrolü olmadan uygulandiginda beklenen performansi vermez.",
      "Bu rehberde metal caty; teorik temel, standart ekseni, termal hareket ornegi, yazilim-araç listesi ve saha hatalariyla birlikte daha derin ve uygulanabilir bir blog yazisi olarak ele aliyoruz.",
    ],
    theory: [
      "Metal çatı davranisinin ilk anahtari termal harekettir. Catinin uzerindeki metal panel, guneslenme ve gece-gunduz sıcaklık farklariyla uzar-kisalir. Bu hareket iin yeterli bağlantı detayi ve kayma mantigi kurulmazsa panelde ses, dalgalanma, vida zorlanmasi ve sızdırmazlık kaybi başlar. Dolayisiyla metal çatı tasarımı, paneli sabitlemek kadar panelin kontrollu hareketine izin vermektir.",
      "Ikinci kritik eksen rüzgar emmesidir. Hafif bir sistem olan metal çatı, kenar ve köşe bolgelerde daha yüksek emme kuvvetlerine maruz kalabilir. Bu nedenle panel tipi, asik araligi, vida/klips ritmi ve kenar detaylari merkez bolgeden farkli okunmalidir. 'Her yerde aynı vida araligi' refleksi bu sistemde yeterli degildir.",
      "Ucuncu ana konu yoğuşma ve buhar kontroludur. Metal panel tek basina bir kabuk davranisi sunmaz; altindaki buhar kesici, isi yalitimi, hava boşluğu ve yoğuşma ynetimi birlikte calisir. Ozellikle isitilan veya iç nemi yüksek hacimlerde panel alti yoğuşma, yapının sessiz ama pahali kusurlarindandir.",
      "TS EN 14782 panel ailesinin teknik cercevesini verir; ancak sahadaki asil kalite, alt sistem duzlugu, hareket detayi, su yolu ve kabuk katmanlarinin birlikte doğru kurulmasi ile saglanir.",
    ],
    ruleTable: [
      {
        parameter: "Panel ve urun secimi",
        limitOrRequirement: "Metal panel, aciklik, maruziyet ve kullanım senaryosuna uygun tip ve kalinlikta secilmelidir",
        reference: "TS EN 14782",
        note: "Urun secimi yalnız katalog estetiiyle belirlenmemelidir.",
      },
      {
        parameter: "Alt taşıyıcı ve geometri",
        limitOrRequirement: "Asik veya alt taşıyıcı duzlem, panel dogrultusu ve tahliye geometrisi ile uyumlu kurulmalidir",
        reference: "Saha geometri ve çatı detay plani",
        note: "Egri alt sistem, panelde dalga ve birleşim zorlanmasi uretir.",
      },
      {
        parameter: "Termal hareket",
        limitOrRequirement: "Uzun panel hatlarinda hareket payi ve kayar sabitleme mantigi korunmalidir",
        reference: "TS EN 14782 + sistem detaylari",
        note: "Panelin hareketini sifirlamak teknik olarak doğru degildir.",
      },
      {
        parameter: "Rüzgar emmesi ve sabitleme",
        limitOrRequirement: "Kenar, köşe ve yüksek riskli bolgelerde vida/klips ritmi artirilmalidir",
        reference: "Çatı sabitleme plani",
        note: "Metal çatıda risk, genellikle doğrudan bağlantı noktasinda dogar.",
      },
      {
        parameter: "Buhar, yoğuşma ve isi kontrolü",
        limitOrRequirement: "Metal çatı sistemi buhar kesici, isi yalitimi ve havalandirma mantigiyla birlikte ele alinmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Panel altindaki yoğuşma, ustteki sızıntı kadar yikici olabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Panel tipini, acikliklari, maruziyet yonunu ve bakım senaryosunu birlikte okuyarak sistem secimini yap.",
      "Asik dogrultusu, duzlemi ve tahliye geometrisini panel montajindan önce bağımsız bir kalite kalemi olarak onayla.",
      "Mahya, dere, kenar, sacak, baca ve cihaz gecisleri için standart düğüm paftalarini sahaya indirmeden montaja baslama.",
      "Uzun panel hatlarinda hareket payi ve kayar-sabit bağlantı mantigini karistirma; vida ritmini risk bolgelerine göre farklilastir.",
      "Buhar kesici, isi yalitimi ve yoğuşma detaylarini panel altinda kopuksuz kür; metal paneli tek basina kabuk sanma.",
      "Teslim öncesi su testi, bağlantı kontrolü ve panel deformasyon turu yaparak kritik dugumleri tek tek kayda bagla.",
    ],
    criticalChecks: [
      "Alt taşıyıcı duzlem panel montajina uygun dogrulukta mic",
      "Uzun panel hatlarinda hareket payi unutuldu muc",
      "Kenar ve köşe bolgelerde sabitleme ritmi risk seviyesine göre artirildi mic",
      "Mahya, dere ve cihaz gecisleri standart detayla cozuldu muc",
      "Yoğuşma ve buhar kontrol katmanlari panel altinda süreklilik gosteriyor muc",
      "Su testi yalnız genis yuzeyde değil kritik düğümlerde de yapildi mic",
    ],
    numericalExample: {
      title: "12 m metal panelde termal uzama yorumu",
      inputs: [
        { label: "Panel boyu", value: "12 m", note: "Uzun tek parca panel hatt" },
        { label: "Lineer genlesme katsayisi", value: "12 x 10^-6 / C", note: "Celigin tipik genlesme katsayisi" },
        { label: "Sıcaklık farki", value: "50 C", note: "Gece-gunduz ve mevsimsel fark için ornek" },
        { label: "Hedef", value: "Bağlantı detayinda hareket payi okumak", note: "Sızdırmazlık ve ses riskini azaltmak" },
      ],
      assumptions: [
        "Panel sabitlenmis ama hareket detayi olan bir sistemle uygulanacaktir.",
        "Alt taşıyıcı geometri doğru kurulmustur.",
        "Hesap kavramsal hareket payi okumasi icindir.",
      ],
      steps: [
        {
          title: "Uzamayi hesapla",
          formula: "DeltaL = alpha x L x DeltaT = 12x10^-6 x 12 x 50 = 0,0072 m",
          result: "Panel yaklasik 7,2 mm termal hareket potansiyeli tasir.",
          note: "Bu miktar küçük gorunse de vida, klips ve birleşim detayi için oldukca kritik olabilir.",
        },
        {
          title: "Bağlantı etkisini yorumla",
          result: "Sabit bağlantı mantigi tüm hat boyunca kullanilirse panel hareketi ses, dalga veya sızdırmazlık kayb olarak geri donebilir.",
          note: "Hareketi yok saymak yerine kontrollu yonetmek gerekir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Metal çatı detaylarinda milimetre seviyesindeki termal hareket, uzun vadeli performansi belirleyen temel etkilerden biridir.",
          note: "Doğru panel kadar doğru hareket detayi da esastir.",
        },
      ],
      checks: [
        "Uzun panel boylari bağlantı detayiyle birlikte degerlendirilmelidir.",
        "Mahya ve dere detaylari termal harekete izin verecek sekilde okunmalidir.",
        "Vida ritmi, panel hareketini tamamen kilitleyen bir mantikta olmamalidir.",
        "Termal hesap yalnız sac üzerinde değil tüm düğüm davranisi icinde yorumlanmalidir.",
      ],
      engineeringComment: "Metal çatıda sorunlar santimetrelerle değil, ihmal edilen milimetrelerle başlar.",
    },
    tools: ROOF_BATCH_TOOLS,
    equipmentAndMaterials: ROOF_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Metal paneli sadece sac olarak görmek.", correct: "Alt sistem, hareket detayi ve kabuk katmanlariyla birlikte sistem olarak ele almak." },
      { wrong: "Tüm çatıda aynı vida ritmini kullanmak.", correct: "Kenar ve köşe bolgeleri farkli risk olarak deerlendirmek." },
      { wrong: "Termal hareketi ihmal etmek.", correct: "Uzun panel boylarinda kayar-sabit bağlantı mantigi kurmak." },
      { wrong: "Mahya, dere ve cihaz gecislerini saha uydurmasina brakmak.", correct: "Kritik dugumleri standart detayla cozumlemek." },
      { wrong: "Yoğuşma kontrolünü yalnız panel kaplamasina baglamak.", correct: "Buhar kesici, isi yalitimi ve havalandirmayi birlikte ele almak." },
      { wrong: "Teslim öncesi su testini atlamak.", correct: "Kritik dugumleri de kapsayan kontrollu kabul testi yapmak." },
    ],
    designVsField: [
      "Metal çatı katalogda düz ve temiz bir panel gibi görünür; sahada ise hereket, rüzgar ve yoğuşma ile birlikte yasayan bir kabuk sistemidir.",
      "Iyi metal çatı sessiz, kuru ve stabil calisir; kötü metal çatı ise ilk mevsim degisiminde kendini belli eder.",
      "Bu nedenle metal çatı performansi panel seciminden çok düğüm kalitesiyle lulur.",
    ],
    conclusion: [
      "Metal çatı, doğru alt sistem, doğru hareket detayi ve doğru kabuk kurgusuyla uygulandiginda hızlı ve uzun omurlu bir çatı cozumudur. Bu zincir koptugunda ise sızıntı, ses, yousma ve panel deformasyonu kısa surede ortaya çıkar.",
      "Bir inşaat mühendisi için en sağlam yaklasim, metal caty sac montaji değil; termal hareket ve su yonu yönetimi gerektiren teknik bir sistem olarak gormektir.",
    ],
    sources: [...INCE_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, TS_EN_14782_SOURCE],
    keywords: ["metal çatı", "TS EN 14782", "termal uzama", "rüzgar emmesi", "yoğuşma kontrolü"],
    relatedPaths: ["ince-isler/cati-kaplamasi", "ince-isler/cati-kaplamasi/membran-cati", "kaba-insaat/cati-iskeleti"],
  },
];
