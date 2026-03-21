import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];
const KAZI_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];
const INCE_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_12063_SOURCE: BinaGuideSource = {
  title: "TS EN 12063 Celik Palplanslar - Uretim Toleranslari ve Teslim Kosullari",
  shortCode: "TS EN 12063",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Celik palplans kesitleri, toleranslari ve urun tanimi icin temel referanslardan biridir.",
};

const TS_EN_14782_SOURCE: BinaGuideSource = {
  title: "TS EN 14782 Cati ve Cephede Kullanilan Kendini Tasiyan Metal Saclar",
  shortCode: "TS EN 14782",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Metal cati panellerinde urun tipi, geometri ve uygulama siniflari icin temel referanslardan biridir.",
};

const KABA_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Planlama", name: "Kat cevrimi ve saha lojistik matrisi", purpose: "Kaba insaat imalatlarini kalip, donati, beton ve duvar olarak ayni ritimde yonetmek." },
  { category: "Kontrol", name: "Aks, kot ve tolerans checklisti", purpose: "Her katta geometri sapmalarini bitis islerine kalmadan yakalamak." },
  { category: "Koordinasyon", name: "MEP rezervasyon ve gomulu eleman listesi", purpose: "Kaba insaat icinde unutulan rezervasyonlari azaltmak." },
  { category: "Kayit", name: "Gunluk imalat ve test arsivi", purpose: "Beton, donati, duvar ve kalip kararlarini sonradan izlenebilir kilmak." },
];

const KAZI_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Geoteknik on hesap ve deplasman yorum tablosu", purpose: "Palplans boyu, kademe ve komsu etkisini sayisal izlemek." },
  { category: "Olcum", name: "Prizma, total station ve titreim izleme seti", purpose: "Kaz cevresi hareketini ve darbeli cakma etkisini takip etmek." },
  { category: "Saha", name: "Cakma-dals logu ve su seviyesi formu", purpose: "Her palplans elemaninin imalat davranisini kayda baglamak." },
  { category: "Kontrol", name: "Komsu yapi hasar ve catlak izleme listesi", purpose: "Kaz ilerledikce cevre etkisini dokumante etmek." },
];

const ROOF_BATCH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Metal cati katman ve dugum paftasi", purpose: "Mahya, dere, kenar ve panel bindirme detaylarini sahada tekrarlanabilir kilmak." },
  { category: "Olcum", name: "Egim, aci ve panel dogrultu kontrol seti", purpose: "Su yonu ve panel ritmini sayisal olarak denetlemek." },
  { category: "Kontrol", name: "Vida, klips ve szdrmazlik checklisti", purpose: "Ruzgar emmesi ve su riski tasiyan dugumleri sistematik kontrol etmek." },
  { category: "Kayit", name: "Su testi ve termal hareket takip notu", purpose: "Metal catida panel davranisini teslim dosyasina baglamak." },
];

const KABA_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Olcum", name: "Lazer nivo, total station ve aks referans ekipmanlari", purpose: "Kaba insaat geometri disiplinini kat kat dogrulamak.", phase: "Tum surec" },
  { group: "Imalat", name: "Kalip, iskele, donati ve beton ekipmanlari", purpose: "Tasiyici sistem imalatlarini planli sira ile yurtmek.", phase: "Kat cevrimi" },
  { group: "Koordinasyon", name: "Rezervasyon kaliplari ve gomulu elemanlar", purpose: "MEP ve mimari gecisleri kaba insaat icinde dogru yerlestirmek.", phase: "Beton oncesi" },
  { group: "Kayit", name: "Numune, foto ve kalite arsivi", purpose: "Yapilan imalatin izlenebilirligini ve teslim kalitesini desteklemek.", phase: "Surekli" },
];

const KAZI_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Palplans profilleri, kaskat ve basma/cakma ekipmani", purpose: "Celik levhalari tasarim dorultusunda zemine yerlestirmek.", phase: "Cakma" },
  { group: "Destek", name: "Kusak kirii, kuak profili ve i destek/ankraj elemanlari", purpose: "Palplans duvarin yatay davranisini kontrol etmek.", phase: "Iksa tamamlama" },
  { group: "Olcum", name: "Prizma, total station, vibrasyon ve su seviyesi ekipmani", purpose: "Kaz cevresindeki hereket, titreim ve su davranisini izlemek.", phase: "Kaz sresince" },
  { group: "Lojistik", name: "Vin, klavuz ase ve akma hatt dzeni", purpose: "Profillerin aks, deylik ve kilit devamllyla indirilmesini saglamak.", phase: "Montaj" },
];

const ROOF_BATCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt sistem", name: "Asik, mertek, alt tasiyici ve buhar kontrol katmanlari", purpose: "Metal panelin oturacagi dogru geometri ve kabuk davranisini kurmak.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Metal cati paneli, mahya ve dere elemanlari", purpose: "Su gecirimsizlik ve ruzgar altinda kaplama butunlugunu saglamak.", phase: "Panel montaji" },
  { group: "Baglanti", name: "Vida, klips, conta ve hareket detayi elemanlari", purpose: "Panelin termal hareketine izin verirken szdrmazl korumak.", phase: "Sabitleme" },
  { group: "Koruma", name: "Gecici yuruyus yolu ve teslim koruma malzemeleri", purpose: "Bitmis panelin erken hasar veya ezilmeden korunmasini saglamak.", phase: "Teslim oncesi" },
];

export const structureEnvelopeBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat",
    kind: "branch",
    quote: "Kaba insaat, yapinin iskeletini kuran ilk buyuk fazdir; hatalari da dogru kararlarla erken, pahali sekilde de burada uretir.",
    tip: "Kaba insaati yalniz betonarme imalati gibi okumak, geometri, rezervasyon, duvar ve cati baglantilarinin urettigi tekrar isiligi gormemektir.",
    intro: [
      "Kaba insaat; temel ustunden itibaren tasiyici sistemin, dolgu duvarlarin, ana geometri kararlarinin ve cati iskeletine kadar uzanan ana yapisal fazin adidir. Bu nedenle yalnizca kolon, kiris ve doseme doken bir surec degil; sahadaki tum sonraki imalatlar icin referans olusturan bir geometri ve kalite evresidir.",
      "Sahada kaba insaat asamasinda yapilan bir hata cogu zaman ayni gun fark edilmez. Yanlis aks, yetersiz rezervasyon, unutulmus gomulu parca, hatali kat cevrimi veya dalgali doseme gibi kusurlar; mekanik, elektrik, duvar, siva ve dograma ekipleri alana girdikce buyur. Bu nedenle kaba insaat kalite seviyesi, yalniz beton dayanimi ile degil, butun proje disiplinlerinin ne kadar temiz ilerleyebildigi ile de olculur.",
      "Bir insaat muhendisi icin kaba insaat, tasiyici sistem hesabi ile saha lojistiginin bulustugu alandir. Kalip, donati, beton, rezervasyon, duvar, dikey sirkulasyon ve cati iskeleti ayni takvimde ve ayni geometri mantiginda yonetilmelidir. Bu zincirdeki bir kopukluk kat cevrimini, maliyeti ve kaliteyi ayni anda bozar.",
      "Bu rehberde kaba insaati; teorik omurga, yonetmelik ve standart ekseni, sayisal bir kat cevrimi ornegi, araclar ve saha hatalari uzerinden daha derin ve kullanisli bir blog yazisi haline getiriyoruz.",
    ],
    theory: [
      "Kaba insaatin teorik temeli, tasiyici sistemin geometri, rijitlik ve sureklilik kararlarini sahada gercege donusturmektir. Tasarim ofisinde kolon, kiris, doseme ve perdeler bir analiz modeli olarak gorunur; sahada ise bunlarin kalip kurulabilirligi, donati okunurlugu, betonlanabilirligi ve rezervasyonlarla uyumu ayni derecede onemlidir.",
      "Kat cevrimi burada belirleyici bir kavramdir. Bir katin kalip, donati, MEP rezervasyon, beton, kur, sokum ve duvar ilerleyisi bir ritim icinde yonetilmezse santiyede ne uretim hz ne de kalite korunabilir. Cok hizli ama kontrolsuz ilerleyen bir kat cevrimi, bir sonraki ekiplere fazla yama, fazla siva ve fazla kirma birakir.",
      "Kaba insaat ayni zamanda tolerans yonetimidir. Aks, kot, duseylik, bosluk ve aciklik kararlari bu evrede kurulur. Santiyede sik duyulan 'ince isler duzeltir' yaklasimi teknik olarak yanlistir; cunku kaba insaattaki geometri hatasi, sonraki imalatlar tarafindan ancak pahali telafilerle ortulebilir.",
      "Bu nedenle kaba insaat, yalniz tasiyici eleman imalati degil; tum yapinin okunur, tekrarlanabilir ve kontrollu ina ritmini kuran ana sahadir. Iyi kaba insaat sessizdir; kotu kaba insaat ise kendini her sonraki ekipte yeni bir sorun olarak belli eder.",
    ],
    ruleTable: [
      {
        parameter: "Tasiyici sistem uygulamasi",
        limitOrRequirement: "Beton, donati, kalip ve geometri kararlar TS 500, TS EN 206 ve TS EN 13670 mantigiyla uyumlu yurutilmelidir",
        reference: "TS 500 + TS EN 206 + TS EN 13670",
        note: "Kaba insaat kalitesi sadece dayanima degil uygulama disiplinine de baglidir.",
      },
      {
        parameter: "Deprem davranisi ve detay devamlligi",
        limitOrRequirement: "Kolon, kiris, perde ve dugum blgeleri TBDY 2018 mantigina uygun okunur detaylarla uygulanmalidir",
        reference: "TBDY 2018",
        note: "Sahadaki detay hatasi deprem davranisina dogrudan yansir.",
      },
      {
        parameter: "Rezervasyon ve gomulu elemanlar",
        limitOrRequirement: "MEP gecisleri, ankrajlar ve rezervasyonlar beton oncesi dogrulanmalidir",
        reference: "Disiplin koordinasyon plani",
        note: "Sonradan kirma, kaba insaat kalitesinin dogrudan kaybidir.",
      },
      {
        parameter: "Geometri ve tolerans",
        limitOrRequirement: "Aks, kot, dusaylik ve acikliklar her katta olculerek kayda baglanmalidir",
        reference: "Saha tolerans checklisti",
        note: "Kaba insaattaki geometri hatasi sonraki tum ekipleri iter.",
      },
      {
        parameter: "Kat cevrimi disiplini",
        limitOrRequirement: "Kalip, donati, beton, kur ve sokum ritmi plansiz hiz yerine kontrollu sureklilikle yonetilmelidir",
        reference: "Santiye programi ve kalite plani",
        note: "Kontrolsuz hiz, en pahali tekrar isiligi uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Temel ustu ilk aks kurulumundan itibaren geometriyi tek referans sistemiyle yonet; kat kat yeni dogrular uretme.",
      "Kalip, donati ve beton oncesi rezervasyonlari ayni checklist ile kontrol et; MEP overlay'i kaba insaattan ayirma.",
      "Her kat icin kalip, donati, beton, kur ve sokum sirasini ekip kapasitesiyle uyumlu kat cevrimi planina bagla.",
      "Kolon-kiris-dugum, perde ve doseme gibi kritik bolgeleri beton oncesi ayri kalite turundan gecir.",
      "Dolgu duvar ve cati iskeleti gibi sonraki kaba paketleri tasiyici sistem geometri kontrolu tamamlanmadan ilerletme.",
      "Kat teslimlerinde sadece beton dayanimi degil, aks, kot, aciklik ve yuzey okunurlugunu da onay kriteri yap.",
    ],
    criticalChecks: [
      "Aks, kot ve acikliklar kat kat kayda baglaniyor muc",
      "MEP rezervasyonlari ve gomulu elemanlar beton oncesi dogrulandi mic",
      "Kritik dugumlerde donati sikismasi veya beton gecisi riski var mic",
      "Kat cevrimi hizi kalite kontrolunu geride birakti mic",
      "Dolgu duvar ve cati gibi sonraki paketler icin yeterli geometri kalitesi saglandi mic",
      "Beton sonrasi sokum, tamir ve kur disiplini plansiz yuruyor muc",
    ],
    numericalExample: {
      title: "650 m2 tip kat icin 7 gunluk kaba insaat cevrimi yorumu",
      inputs: [
        { label: "Tip kat alani", value: "650 m2", note: "Orta olcekli konut/blogu ornegi" },
        { label: "Kalip ve iskele", value: "2 gun", note: "Kurulum ve son duzeltme" },
        { label: "Donati ve rezervasyon", value: "2 gun", note: "Beton oncesi hazirlik" },
        { label: "Beton ve erken kur", value: "1 gun", note: "Dokum ve ilk koruma" },
        { label: "Sokum ve duzeltme", value: "2 gun", note: "Kontrollu devir" },
      ],
      assumptions: [
        "Ekip kapasitesi bu ritmi destekleyecek duzendedir.",
        "MEP rezervasyonlari son anda degisiklik yaratmayacaktir.",
        "Hava kosullari betonu ve kalip sokum sirasini bozacak seviyede degildir.",
      ],
      steps: [
        {
          title: "Toplam cevrimi hesapla",
          formula: "2 + 2 + 1 + 2 = 7 gun",
          result: "Tip kat icin teorik 7 gunluk bir kaba insaat cevrimi olusur.",
          note: "Bu, yalniz program degeri degil; kaliteyi tasiyacak minimum kontrol penceresidir.",
        },
        {
          title: "Riskli sikismayi yorumla",
          result: "Bu 7 gun icinde MEP rezervasyon, beton kabul veya sokum kontrolu skistirilirsa geometri hatalari bir sonraki kata tasinir.",
          note: "Hiz kazanimi gibi gorunen durum, alt ekipler icin gecikme ve tamir olarak geri donebilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Kaba insaattaki kat cevrimi, sadece gun sayisi degil; kalite adimlarinin eksiksiz tasindigi bir ritim olarak okunmalidir.",
          note: "Dogru cevrim, hiz ile kontrol arasinda kurulmus dengedir.",
        },
      ],
      checks: [
        "Kat cevrimi kalite kontrol adimlari dusulmeden hesaplanmalidir.",
        "Rezervasyon ve geometri kontrolleri beton programina kurban edilmemelidir.",
        "Sokum ve duzeltme sureleri bir sonraki kata zorlama aktarilmamalidir.",
        "Kat teslimi, program kadar l ve yzey kalitesiyle de onaylanmalidir.",
      ],
      engineeringComment: "Kaba insaatta hizli olmak, daha az gun yazmak degil; kalite adimlarini eksiltmeden ritmi koruyabilmektir.",
    },
    tools: KABA_BATCH_TOOLS,
    equipmentAndMaterials: KABA_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Kaba insaati yalniz betonarme dokum takvimi gibi yonetmek.", correct: "Kalip, donati, rezervasyon, duvar ve geometriyi tek sistem gibi ele almak." },
      { wrong: "Rezervasyonlari sonradan kirariz mantigiyla gecmek.", correct: "MEP gecislerini beton oncesi kilitlemek." },
      { wrong: "Kat cevrimi icin kalite adimlarini kisaltmak.", correct: "Kontrol pencerelerini cevrimin ayrilmaz parcasi yapmak." },
      { wrong: "Aks ve kot sapmalarini ince islere birakmak.", correct: "Geometriyi kaba insaatta dzeltmek ve kayda baglamak." },
      { wrong: "Sokum ve kur disiplinini program baskisiyla gevsetmek.", correct: "Beton sonrasi koruma ve kontrollu devir mantigi kurmak." },
      { wrong: "Dolgu duvar ve cati iskeleti icin tasiyici sistem teslimini erken varsaymak.", correct: "Sonraki paketleri geometri kalitesi dogrulanmadan baslatmamak." },
    ],
    designVsField: [
      "Ofiste kaba insaat bir analiz modeli gibi gorunur; sahada ise ayni model lojistik, ekip kapasitesi ve geometri disipliniyle gercege donusur.",
      "Iyi kaba insaat kendini sessizlikle gosterir; sonraki ekipler daha az kirar, daha az yamalar ve daha hizli ilerler.",
      "Bu nedenle kaba insaat kalitesi, yalniz beton sinifi degil butun santiyenin ritim kalitesidir.",
    ],
    conclusion: [
      "Kaba insaat, yapinin ilk buyuk kalitesini ve sonraki tum imalatlarin referans geometrisini kurar. Burada dogru kurulan ritim ve tolerans disiplini, santiyenin geri kalaninda tekrar isi dramatik bicimde azaltir.",
      "Bir insaat muhendisi icin en saglam bakis, kaba insaati tek tek imalatlar toplami degil; tum yapinin okunabilirlik ve uygulanabilirlik omurgasi olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670],
    keywords: ["kaba insaat", "kat cevrimi", "rezervasyon", "geometri toleransi", "saha koordinasyonu"],
    relatedPaths: ["kaba-insaat/beton-isleri", "kaba-insaat/kalip-isleri", "kaba-insaat/donati-isleri", "kaba-insaat/duvar-orme"],
  },
  {
    slugPath: "kazi-temel/iksa-sistemi/palplans",
    kind: "topic",
    quote: "Palplans, ince gorunen bir celik levha duvar degil; suyu, zemini ve komsu etkiyi ayni anda kontrol etmeye calisan hizli bir geoteknik savunma sistemidir.",
    tip: "Palplansi yalniz profil boyu secimi gibi gormek, kilit devamlligi, titreim etkisi ve su davranisini gozden kacirmaktir.",
    intro: [
      "Palplans sistemleri, ozellikle yeralt suyu etkisinin yuksek oldugu, hizli kuruluma ihtiyac duyulan veya mevcut altyapi ve komsu etkisinin sinirli deplasmanla yonetilmesi gereken kazilarda sik kullanilan celik iksa cozumleridir. Ince kesitli olduklari icin yaln grnrler; ancak davranislari yalniz profil rijitligine degil zemin, su, destek seviyesi ve kilit devamllna baglidir.",
      "Sahada palplansla ilgili en kritik fark, sistemin imalat sirasinda ayni anda hem geometri hem de titreim etkisi uretmesidir. Cakma ya da basma surecinde komsu yapilar, yol kaplamasi, yer alti hatlari ve su seviyesi birlikte izlenmezse profil doru secilse bile saha riski buyuyebilir.",
      "Bir insaat muhendisi icin palplans, hizli bir iksa alternatifi olmanin otesinde iyi izleme ve iyi saha lojistigi isteyen bir geoteknik sistemdir. Kilitlerin kapanmasi, profilin dusayligi, kuak kirii veya ankrajla baglantisi ve su kesme davranisi birlikte okunmaldr.",
      "Bu rehberde palplans sistemini; teorik temel, standart ekseni, sayisal profil boyu ornegi, saha ekipmanlari ve sik yapilan hatalarla birlikte daha derin ve kullanilabilir bir yazya donusturuyoruz.",
    ],
    theory: [
      "Palplans davranisinin merkezi, profilin zemin icindeki gomulu boyu ile kilitli duvar etkisidir. Tek tek celik levhalar ancak kilitleri sayesinde surekli bir perde gibi davranir; bu nedenle tek bir profilin boyu kadar komsu profillerle kurulan geometri ve kilit devamlligi de kritik oneme sahiptir. Sahada kilidi acik veya aks disi inen tek bir eleman tum duvar davranisini zayiflatabilir.",
      "Sistemin ikinci kritik ekseni su davranisidir. Palplans, tam anlamiyla su gecirmez bir duvar gibi dusunulmemeli; ancak su yolunu zorlastiran ve drenaj stratejisiyle birlikte calisan bir kontrol elemani olarak okunmalidir. Yeralti suyu yuksek alanlarda yalniz profil cakmak yeterli olmaz; pompaj, taban stabilitesi ve dewatering senaryosu da tasarim zincirine dahil edilmelidir.",
      "Titreim ve komsu etki de palplansin baska bir ayirici ozelligidir. Darbe ile cakilan sistemlerde titreim, komsu yapilarin hassasiyeti, altyapi hatlari ve yol kotlari uzerinde etkili olabilir. Bu nedenle palplans secimi yalniz kesit ekonomisiyle degil, sahadaki imalat yontemi ve cevre riskleriyle birlikte degerlendirilmelidir.",
      "TS EN 12063 profil ve tolerans cercevesini verir; ancak sahadaki gercek basari, profilin ne kadar dogru aksla indirildigi, hangi destekleme duzeniyle calistigi ve titreim-su birlikte izleme disiplininin kurulup kurulmadigi ile belirlenir.",
    ],
    ruleTable: [
      {
        parameter: "Profil ve tolerans secimi",
        limitOrRequirement: "Palplans profili, cekme ve gomulme davranisini tasiyacak kesit ve toleransla secilmelidir",
        reference: "TS EN 12063",
        note: "Kesit secimi yalniz malzeme ekonomisine indirgenmemelidir.",
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
        parameter: "Titreim ve komsu etki",
        limitOrRequirement: "Cakma veya basma surecinde komsu yapi, yol ve altyapi etkileri izlenmelidir",
        reference: "Komsu etki ve titreim takip plani",
        note: "Palplans imalati cevreyi etkileyen aktif bir surectir.",
      },
      {
        parameter: "Su kontrolu",
        limitOrRequirement: "Palplans uygulamasi, drenaj ve pompaj stratejisiyle birlikte ele alinmalidir",
        reference: "Kaz su kontrol plani",
        note: "Profil tek basina tm hidrostatik problemi cozmeyebilir.",
      },
    ],
    designOrApplicationSteps: [
      "Profil tipini, kesit rijitligini ve imalat yontemini komsu etki, su seviyesi ve kaz derinligiyle birlikte sec.",
      "Palplans aksini klavuz sistemle kur; ilk profillerin dusayligini butun duvarin referansi olarak kabul et.",
      "Cakma veya basma sirasinda kilit kapanisini, profil boyunu ve imalat sirasini logla.",
      "Kusak kirisi, i destek veya ankraj gibi tamamlayici elemanlari palplans davranisindan ayri dusunme.",
      "Yeralt suyu, titreim ve komsu yapi takibini imalatla ayni gunluk ritimde yurt.",
      "Kaz ilerledikce palplans duvarin basligi, kotu ve deplasman davranisini tekrar tekrar olcerek teyit et.",
    ],
    criticalChecks: [
      "Ilk profillerin aks ve dusaylik hatasi duvar boyunca tasindi mic",
      "Kilitlerde acilma, atlama veya kapanmama riski var mic",
      "Titreim etkisi komsu yapi ve altyapi icin izleniyor muc",
      "Kaz derinligi arttikca destek seviyesi palplans davranisini yeterince tutuyor muc",
      "Yeralt suyu ve pompaj stratejisi duvarla ayni anda ynetiliyor muc",
      "Profil boyu ve gercek gomulme sahada loga isleniyor muc",
    ],
    numericalExample: {
      title: "4,50 m kazda palplans toplam boyu icin on yorum",
      inputs: [
        { label: "Kaz derinligi", value: "4,50 m", note: "Yol kenari kisa derin kaz" },
        { label: "On gomulme boyu", value: "2,50 m", note: "Su ve zemin kontrolu icin konsept varsayim" },
        { label: "Baslik payi", value: "0,50 m", note: "Kuak ve kesim toleransi" },
        { label: "Hedef", value: "Toplam profil boyu", note: "Saha lojistigi ve siparis karari" },
      ],
      assumptions: [
        "Nihai tasarim geoteknik analizle teyit edilecektir.",
        "Profil basligi kesim ve kuak uygulamasi icin belli pay birakacaktir.",
        "Su etkisi ve komsu hassasiyeti nedeniyle gomulme yalniz min. statik ihtiyaca gore secilmeyecektir.",
      ],
      steps: [
        {
          title: "Toplam boyu hesapla",
          formula: "4,50 + 2,50 + 0,50 = 7,50 m",
          result: "On saha yorumu icin yaklasik 7,50 m profil boyu gerekir.",
          note: "Bu deger siparis ve lojistik planina ilk girdi saglar; nihai boy geoteknik modelle dogrulanmalidir.",
        },
        {
          title: "Destek ve su etkisini ekle",
          result: "Kaz kademesi, su seviyesi ve destekleme duzeni bu boyu dorudan etkileyebilir.",
          note: "Profil boyu yalniz kaz derinligi kadar okunursa sistem riske girer.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Palplans seiminde profil boyu, geometri ve cevre etkisi birlikte okunmalidir.",
          note: "Hizli sistem olmasi, detaysiz sistem oldugu anlamina gelmez.",
        },
      ],
      checks: [
        "On boy hesab geoteknik tasarimin yerine gecmez; yalniz saha planina giris saglar.",
        "Gomulme boyu su ve komsu etki ile birlikte degerlendirilmelidir.",
        "Profil siparisi destek ve kesim paylari dahil dnlmelidir.",
        "malat yontemi kaynakli titreim riski ilk boy hesabindan ayri dusunulmemelidir.",
      ],
      engineeringComment: "Palplansda en tehlikeli yanlis, profil boyunu yalniz acikta kalan derinlik kadar sanmaktir.",
    },
    tools: KAZI_BATCH_TOOLS,
    equipmentAndMaterials: KAZI_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Palplansi yalniz profil boyu secimi gibi gormek.", correct: "Kilit, destek, su ve titreim etkisini birlikte deerlendirmek." },
      { wrong: "Ilk profillerin aks hatasini goz ardi etmek.", correct: "Baslangic profillerini butun duvarin referansi olarak hassas kurmak." },
      { wrong: "Komsu yapilari imalat bitince kontrol etmek.", correct: "Titreim ve hareket takibini imalatla eszamanli yrtmek." },
      { wrong: "Su kontrolunu palplansin tek basina cozdugunu varsaymak.", correct: "Pompaj ve drenaj stratejisini sistemle birlikte tasarlamak." },
      { wrong: "Kilit kapanisini saha hizina feda etmek.", correct: "Her profilin dusaylik ve kilit devamlligini loglamak." },
      { wrong: "Nihai geoteknik dogrulamayi atlayip on boy hesabiyla siparisi kapatmak.", correct: "Konsept hesab geoteknik model ve saha izleme ile teyit etmek." },
    ],
    designVsField: [
      "Palplans kagit uzerinde seri cizgiler gibi gorunur; sahada ise her profil komsu etki ve su davranisi ureten aktif bir imalattir.",
      "Iyi palplans sistemi, hizli kurulandan cok, aksi ve kilidi kontrollu kurulandir.",
      "Bu nedenle palplans, ekonomisi kadar izleme disipliniyle de degerlendirilmelidir.",
    ],
    conclusion: [
      "Palplans sistemi dogru profil, dogru gomulme ve dogru izleme disiplini ile kullanildiginda hizli ve etkili bir iksa cozumudur. Bu zincir zayif kuruldugunda ise su, titreim ve geometri sorunlari kisa surede belirginlesir.",
      "Bir insaat muhendisi icin dogru bakis, palplansi basit bir celik perde degil; sahada cevre etkisiyle birlikte yasayan bir geoteknik sistem olarak gormektir.",
    ],
    sources: [...KAZI_BATCH_SOURCES, SOURCE_LEDGER.afadHazard, TS_EN_12063_SOURCE],
    keywords: ["palplans", "TS EN 12063", "cift tarafli iksa", "titreim etkisi", "su kontrolu"],
    relatedPaths: ["kazi-temel/iksa-sistemi", "kazi-temel/iksa-sistemi/ankrajli-iksa", "kazi-temel/iksa-sistemi/fore-kazik"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/metal-cati",
    kind: "topic",
    quote: "Metal cati, hafif ve hizli bir kaplama gibi gorunur; ama gercek basarisi termal hareketi, ruzgar emmesini ve yogusmayi ayni anda yonetebilmesindedir.",
    tip: "Metal catida en sik hata, paneli sac olarak gormek ve alt sistem, hareket detayi ve yogusma kontrolunu ikinci plana atmaktir.",
    intro: [
      "Metal cati sistemleri; hizli montaj, dusuk agirlik ve uzun aciklik avantajlari nedeniyle endustriyel yapilarda, depolarda ve bazi konut uygulamalarinda sik tercih edilir. Ancak bu sistemlerin sahadaki gercek kalitesi, yalniz panel kalnligina veya boya cinsine degil; alt tasiyici, baglanti, hareket detayi ve yogusma kontrolunun birlikte cozulmesine baglidir.",
      "Sahada metal catiyla ilgili sikayetlerin buyuk kismi panelden degil, dugumlerden dogar. Mahya, dere, sacak, baca gecisi, cihaz ayagi, vida detayi veya hareket payi unutulan uzun panel hatlari ilk bakista problemsiz gorunse de mevsimsel hareketle beraber sizinti, ses veya panel deformasyonu uretir.",
      "Bir insaat muhendisi icin metal cati, yalniz ust ortuyu kapatan hizli bir imalat degildir. Ruzgar emmesi, termal uzama, yogusma, alt sistem duzlugu ve bakim erisimi birlikte okunmalidir. En iyi panel bile egri asik uzerine, yanlis vida ritmiyle ve buhar kontrolu olmadan uygulandiginda beklenen performansi vermez.",
      "Bu rehberde metal caty; teorik temel, standart ekseni, termal hareket ornegi, yazilim-arac listesi ve saha hatalariyla birlikte daha derin ve uygulanabilir bir blog yazisi olarak ele aliyoruz.",
    ],
    theory: [
      "Metal cati davranisinin ilk anahtari termal harekettir. Catinin uzerindeki metal panel, guneslenme ve gece-gunduz sicaklik farklariyla uzar-kisalir. Bu hareket iin yeterli baglanti detayi ve kayma mantigi kurulmazsa panelde ses, dalgalanma, vida zorlanmasi ve sizdirmazlik kaybi baslar. Dolayisiyla metal cati tasarimi, paneli sabitlemek kadar panelin kontrollu hareketine izin vermektir.",
      "Ikinci kritik eksen ruzgar emmesidir. Hafif bir sistem olan metal cati, kenar ve kose bolgelerde daha yuksek emme kuvvetlerine maruz kalabilir. Bu nedenle panel tipi, asik araligi, vida/klips ritmi ve kenar detaylari merkez bolgeden farkli okunmalidir. 'Her yerde ayni vida araligi' refleksi bu sistemde yeterli degildir.",
      "Ucuncu ana konu yogusma ve buhar kontroludur. Metal panel tek basina bir kabuk davranisi sunmaz; altindaki buhar kesici, isi yalitimi, hava boslugu ve yogusma ynetimi birlikte calisir. Ozellikle isitilan veya ic nemi yuksek hacimlerde panel alti yogusma, yapinin sessiz ama pahali kusurlarindandir.",
      "TS EN 14782 panel ailesinin teknik cercevesini verir; ancak sahadaki asil kalite, alt sistem duzlugu, hareket detayi, su yolu ve kabuk katmanlarinin birlikte dogru kurulmasi ile saglanir.",
    ],
    ruleTable: [
      {
        parameter: "Panel ve urun secimi",
        limitOrRequirement: "Metal panel, aciklik, maruziyet ve kullanim senaryosuna uygun tip ve kalinlikta secilmelidir",
        reference: "TS EN 14782",
        note: "Urun secimi yalniz katalog estetiiyle belirlenmemelidir.",
      },
      {
        parameter: "Alt tasiyici ve geometri",
        limitOrRequirement: "Asik veya alt tasiyici duzlem, panel dogrultusu ve tahliye geometrisi ile uyumlu kurulmalidir",
        reference: "Saha geometri ve cati detay plani",
        note: "Egri alt sistem, panelde dalga ve birlesim zorlanmasi uretir.",
      },
      {
        parameter: "Termal hareket",
        limitOrRequirement: "Uzun panel hatlarinda hareket payi ve kayar sabitleme mantigi korunmalidir",
        reference: "TS EN 14782 + sistem detaylari",
        note: "Panelin hareketini sifirlamak teknik olarak dogru degildir.",
      },
      {
        parameter: "Ruzgar emmesi ve sabitleme",
        limitOrRequirement: "Kenar, kose ve yuksek riskli bolgelerde vida/klips ritmi artirilmalidir",
        reference: "Cati sabitleme plani",
        note: "Metal catida risk, genellikle dogrudan baglanti noktasinda dogar.",
      },
      {
        parameter: "Buhar, yogusma ve isi kontrolu",
        limitOrRequirement: "Metal cati sistemi buhar kesici, isi yalitimi ve havalandirma mantigiyla birlikte ele alinmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Panel altindaki yogusma, ustteki sizinti kadar yikici olabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Panel tipini, acikliklari, maruziyet yonunu ve bakim senaryosunu birlikte okuyarak sistem secimini yap.",
      "Asik dogrultusu, duzlemi ve tahliye geometrisini panel montajindan once bagimsiz bir kalite kalemi olarak onayla.",
      "Mahya, dere, kenar, sacak, baca ve cihaz gecisleri icin standart dugum paftalarini sahaya indirmeden montaja baslama.",
      "Uzun panel hatlarinda hareket payi ve kayar-sabit baglanti mantigini karistirma; vida ritmini risk bolgelerine gore farklilastir.",
      "Buhar kesici, isi yalitimi ve yogusma detaylarini panel altinda kopuksuz kur; metal paneli tek basina kabuk sanma.",
      "Teslim oncesi su testi, baglanti kontrolu ve panel deformasyon turu yaparak kritik dugumleri tek tek kayda bagla.",
    ],
    criticalChecks: [
      "Alt tasiyici duzlem panel montajina uygun dogrulukta mic",
      "Uzun panel hatlarinda hareket payi unutuldu muc",
      "Kenar ve kose bolgelerde sabitleme ritmi risk seviyesine gore artirildi mic",
      "Mahya, dere ve cihaz gecisleri standart detayla cozuldu muc",
      "Yogusma ve buhar kontrol katmanlari panel altinda sureklilik gosteriyor muc",
      "Su testi yalniz genis yuzeyde degil kritik dugumlerde de yapildi mic",
    ],
    numericalExample: {
      title: "12 m metal panelde termal uzama yorumu",
      inputs: [
        { label: "Panel boyu", value: "12 m", note: "Uzun tek parca panel hatt" },
        { label: "Lineer genlesme katsayisi", value: "12 x 10^-6 / C", note: "Celigin tipik genlesme katsayisi" },
        { label: "Sicaklik farki", value: "50 C", note: "Gece-gunduz ve mevsimsel fark icin ornek" },
        { label: "Hedef", value: "Baglanti detayinda hareket payi okumak", note: "Sizdirmazlik ve ses riskini azaltmak" },
      ],
      assumptions: [
        "Panel sabitlenmis ama hareket detayi olan bir sistemle uygulanacaktir.",
        "Alt tasiyici geometri dogru kurulmustur.",
        "Hesap kavramsal hareket payi okumasi icindir.",
      ],
      steps: [
        {
          title: "Uzamayi hesapla",
          formula: "DeltaL = alpha x L x DeltaT = 12x10^-6 x 12 x 50 = 0,0072 m",
          result: "Panel yaklasik 7,2 mm termal hareket potansiyeli tasir.",
          note: "Bu miktar kucuk gorunse de vida, klips ve birlesim detayi icin oldukca kritik olabilir.",
        },
        {
          title: "Baglanti etkisini yorumla",
          result: "Sabit baglanti mantigi tum hat boyunca kullanilirse panel hareketi ses, dalga veya sizdirmazlik kayb olarak geri donebilir.",
          note: "Hareketi yok saymak yerine kontrollu yonetmek gerekir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Metal cati detaylarinda milimetre seviyesindeki termal hareket, uzun vadeli performansi belirleyen temel etkilerden biridir.",
          note: "Dogru panel kadar dogru hareket detayi da esastir.",
        },
      ],
      checks: [
        "Uzun panel boylari baglanti detayiyle birlikte degerlendirilmelidir.",
        "Mahya ve dere detaylari termal harekete izin verecek sekilde okunmalidir.",
        "Vida ritmi, panel hareketini tamamen kilitleyen bir mantikta olmamalidir.",
        "Termal hesap yalniz sac uzerinde degil tum dugum davranisi icinde yorumlanmalidir.",
      ],
      engineeringComment: "Metal catida sorunlar santimetrelerle degil, ihmal edilen milimetrelerle baslar.",
    },
    tools: ROOF_BATCH_TOOLS,
    equipmentAndMaterials: ROOF_BATCH_EQUIPMENT,
    mistakes: [
      { wrong: "Metal paneli sadece sac olarak gormek.", correct: "Alt sistem, hareket detayi ve kabuk katmanlariyla birlikte sistem olarak ele almak." },
      { wrong: "Tum catida ayni vida ritmini kullanmak.", correct: "Kenar ve kose bolgeleri farkli risk olarak deerlendirmek." },
      { wrong: "Termal hareketi ihmal etmek.", correct: "Uzun panel boylarinda kayar-sabit baglanti mantigi kurmak." },
      { wrong: "Mahya, dere ve cihaz gecislerini saha uydurmasina brakmak.", correct: "Kritik dugumleri standart detayla cozumlemek." },
      { wrong: "Yogusma kontrolunu yalniz panel kaplamasina baglamak.", correct: "Buhar kesici, isi yalitimi ve havalandirmayi birlikte ele almak." },
      { wrong: "Teslim oncesi su testini atlamak.", correct: "Kritik dugumleri de kapsayan kontrollu kabul testi yapmak." },
    ],
    designVsField: [
      "Metal cati katalogda duz ve temiz bir panel gibi gorunur; sahada ise hereket, ruzgar ve yogusma ile birlikte yasayan bir kabuk sistemidir.",
      "Iyi metal cati sessiz, kuru ve stabil calisir; kotu metal cati ise ilk mevsim degisiminde kendini belli eder.",
      "Bu nedenle metal cati performansi panel seciminden cok dugum kalitesiyle lulur.",
    ],
    conclusion: [
      "Metal cati, dogru alt sistem, dogru hareket detayi ve dogru kabuk kurgusuyla uygulandiginda hizli ve uzun omurlu bir cati cozumudur. Bu zincir koptugunda ise sizinti, ses, yousma ve panel deformasyonu kisa surede ortaya cikar.",
      "Bir insaat muhendisi icin en saglam yaklasim, metal caty sac montaji degil; termal hareket ve su yonu yonetimi gerektiren teknik bir sistem olarak gormektir.",
    ],
    sources: [...INCE_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, TS_EN_14782_SOURCE],
    keywords: ["metal cati", "TS EN 14782", "termal uzama", "ruzgar emmesi", "yogusma kontrolu"],
    relatedPaths: ["ince-isler/cati-kaplamasi", "ince-isler/cati-kaplamasi/membran-cati", "kaba-insaat/cati-iskeleti"],
  },
];
