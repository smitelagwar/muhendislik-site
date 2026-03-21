import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJECT_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];
const CLOSEOUT_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["peyzaj-teslim"]];

const PROJECT_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Revit / CAD overlay ve clash seti", purpose: "Mimari, statik ve MEP kararlarini tek bir koordinat sisteminde karsilastirmak." },
  { category: "Kontrol", name: "Mahal listesi, shaft matrisi ve karar logu", purpose: "Mimari kararlarin revizyon kaybina ugramadan izlenmesini saglamak." },
  { category: "Ruhsat", name: "Imar ve yangin uygunluk checklisti", purpose: "Ruhsat ve uygulama paketleri arasinda eksik madde kalmamasini saglamak." },
  { category: "Saha", name: "Detay okuma ve uygulama notu seti", purpose: "Kritik dugumlerin ofisten sahaya net aktarilmasini saglamak." },
];

const CLOSEOUT_TOOLS: BinaGuideTool[] = [
  { category: "Takip", name: "Punch list matrisi ve kapama plan", purpose: "Eksiklerin kritik ve kozmetik olarak ayrilip kapanis sirasina baglanmasini saglamak." },
  { category: "Dokuman", name: "As-built ve test dosyasi klasoru", purpose: "Gercek saha imalatini resmi teslim evraklariyla eslestirmek." },
  { category: "Saha", name: "Kabul turu checklisti", purpose: "Ortak alan, yangin, tesisat ve cevre duzeninin tek turda denetlenmesini saglamak." },
  { category: "Resmi Surec", name: "Iskan evrak takip cizelgesi", purpose: "Yapi kullanma izin surecindeki belge ve onay bagimliliklarini gormek." },
];

const PROJECT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokumantasyon", name: "Plan, kesit, gorunus ve detay pafta seti", purpose: "Mimari kararlarin disiplinlerce ayni sekilde okunmasini saglamak.", phase: "Proje" },
  { group: "Koordinasyon", name: "Overlay, clash raporu ve revizyon kayitlari", purpose: "Disiplinler arasi cakismazlik ve karar izini gorunur kilmak.", phase: "Koordinasyon" },
  { group: "Saha", name: "Detay ciktisi ve aplikasyon referanslari", purpose: "Kritik dugumlerin sahada yorumsuz uygulanmasini desteklemek.", phase: "Uygulama oncesi" },
  { group: "Kontrol", name: "Onay ve revizyon matrisi", purpose: "Ruhsat paketi ile uygulama paketi arasindaki farklari kapatmak.", phase: "Surekli" },
];

const CLOSEOUT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Olcum", name: "Lazer nivo, total station ve saha kabul formlari", purpose: "Ortak alan kotlari, erisim ve cevre duzenini olcerek kapatmak.", phase: "Teslim oncesi" },
  { group: "Dokuman", name: "As-built, test, garanti ve bakim klasoru", purpose: "Resmi kapanis ile isletme devrini ayni bilgi setinde birlestirmek.", phase: "Kapanis" },
  { group: "Koordinasyon", name: "Disiplin bazli punch list ve sorumlu listesi", purpose: "Eksiklerin kim tarafindan ne zaman kapatilacagini netlestirmek.", phase: "Punch list" },
  { group: "Resmi Surec", name: "Yapi kullanma izin evrak seti", purpose: "Iskan surecinde gereken onay ve teknik belgeleri eksiksiz toplamak.", phase: "Iskan" },
];

export const projectCloseoutBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/mimari-proje",
    kind: "topic",
    quote: "Mimari proje, estetik kararlar paketi degil; tum disiplinlerin oturacagi koordinat sistemini kuran ana teknik omurgadir.",
    tip: "Mimari projeyi yalniz plan ve gorunus seti gibi gormek, sahadaki en pahali revizyonlari daha proje hazirlik asamasinda davet eder.",
    intro: [
      "Mimari proje, bir yapinin yalniz gorunen yuzunu degil; tasiyici sistemi, tesisat rotalarini, yangin kacisini, cephe davranisini ve kullanici akisini ayni anda tanimlayan temel karar paketidir. Bu nedenle mimari proje yalniz mimarin sorumlulugunda kalan bir cizim seti degil, tum disiplinlerin baglandigi ana referanstir.",
      "Sahada en pahali revizyonlarin buyuk bolumu eksik veya gec olgunlasmis mimari kararlardan dogar. Yanlis boyutlanan shaft, gec kesinlesen dograma akslari, belirsiz parapet detayi veya kotu cozulmus islak hacim kurgusu; statik, mekanik ve elektrik ekiplerini ikinci kez tasarim yapmaya zorlar.",
      "Bir insaat muhendisi icin mimari proje yalniz uygulama oncesi okunacak bir dosya degildir. Uygulama sirasini, aplikasyon kolayligini, saha lojistigini ve hatta teslim sonrasi bakim davranisini belirler. Yani iyi mimari proje, ofiste guzel gorunen degil; sahada daha az kirma, daha az dogaclama ve daha az tekrar is ureten projedir.",
      "Bu yazida mimari projeyi; teorik koordinasyon mantigi, resmi gereksinimler, sayisal bir shaft ornegi, arac listesi ve sik yapilan hatalarla birlikte uzun-form ve sahada kullanilabilir bir rehber olarak ele aliyoruz.",
    ],
    theory: [
      "Mimari proje, disiplin koordinasyonunun ilk veri tabanidir. Akslar, cekirdekler, islak hacimler, dograma bosluklari, cephe modulu ve kot iliskileri burada dogru kurulmadiginda statik ve tesisat disiplinleri cozum uretemez; yalniz uyarlama yapar. Bu da projenin ilerleyen asamalarinda zincirleme revizyon ve sahada yoruma acik detaylar dogurur.",
      "Mahal organizasyonu yalniz kullanici deneyimini degil; ekipman yerlesimini, yangin kacisini, acik sahada erisimi ve mekanik elektrik rotalarini da etkiler. Ornegin bir koridor genisligi veya shaft yeri mimari gorunmekle birlikte yangin senaryosu, tesisat gecisi ve bakim erisimi icin de belirleyicidir. Bu nedenle mimari proje, mekan estetikleri kadar teknik bosluklar projesidir.",
      "Kabuk ve cephe kararlarinin da mimari projede yeterli olgunlukta kurulmasi gerekir. Dograma akslari, denizlik, parapet, gunes kontrol elemanlari ve isi koprusu riski tasiyan birleimler erken cozulmezse uygulama paketi sahada uretilmeye baslar. Bu durum kaliteyi ustaya, maliyeti ise santiyeye birakir.",
      "Iyi mimari proje yalniz cizim uretmez; belirsizligi azaltir. Her karar sahadaki bir uygulama sirasini, bir detay uretimini veya bir imar-yangin uygunluk kontrolunu dogrudan etkiler. Bu nedenle mimari proje, proje hazirlik asamasinin en kritik muhendislik katmanlarindan biridir.",
    ],
    ruleTable: [
      {
        parameter: "Imar ve ruhsat uyumu",
        limitOrRequirement: "Yapi kurgusu, emsal, cekme mesafesi, ortak alanlar ve kullanim kararlarini resmi mevzuatla uyumlu tasimalidir",
        reference: "3194 sayili Imar Kanunu + Planli Alanlar Imar Yonetmeligi",
        note: "Mimari kararlarin ruhsat asamasinda degil, taslak asamasinda dogrulanmasi gerekir.",
      },
      {
        parameter: "Yangin ve kacis kurgusu",
        limitOrRequirement: "Kacis mesafesi, merdiven, cekirdek ve yangin guvenligi kararlar mimari planda erken tanimlanmalidir",
        reference: "Yangin Yonetmeligi",
        note: "Yangin kacisi sonradan cephe veya plan icine eklenebilecek bir detay degildir.",
      },
      {
        parameter: "Shaft ve teknik hacim koordinasyonu",
        limitOrRequirement: "Dikey tesisat hacimleri, montaj ve bakim bosluklariyla birlikte overlay uzerinden dogrulanmalidir",
        reference: "Disiplin koordinasyon plani",
        note: "Yalniz boru kesiti kadar yer ayirmak teknik olarak yetersiz olabilir.",
      },
      {
        parameter: "Kabuk ve enerji davranisi",
        limitOrRequirement: "Cephe, dograma ve kabuk detaylari isi, nem ve su davranisini destekleyecek sekilde kurgulanmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Mimari detaylar enerji performansindan bagimsiz dusunulemez.",
      },
      {
        parameter: "Uygulanabilir detay seviyesi",
        limitOrRequirement: "Kritik dugumler olcekli, okunur ve saha yorumuna minimum alan birakacak detay setiyle desteklenmelidir",
        reference: "Uygulama proje disiplini",
        note: "Belirsiz detay sahada ek tasarim demektir.",
      },
    ],
    designOrApplicationSteps: [
      "Imar haklari, fonksiyon programi ve cekirdek kararlarini erken asamada tek omurgada kilitle.",
      "Mimari plan, statik akslar ve MEP overlay'i ayni koordinat sisteminde calistir; cakismazliklari pafta oncesi coz.",
      "Shaft, islak hacim, merdiven, asansor ve teknik hacimleri yalniz yerlesim olarak degil montaj-bakim senaryosu olarak oku.",
      "Dograma akslari, parapet, denizlik, balkon, cephe ve cati birlesimlerini uygulama paketi olgunlugunda detaylandir.",
      "Ruhsat paketi ile uygulama paketi arasindaki bosluklari santiyeye cikmadan kapat; uygulama notlarini revizyon matrisi ile takip et.",
      "Sahaya cikacak kritik detaylar icin mahal bazli veya dugum bazli numune mantigi kur.",
    ],
    criticalChecks: [
      "Shaft ve teknik hacimler montaj ve bakim boslugunu gercekten karsiliyor muc",
      "Merdiven, asansor ve cekirdek duzeni yangin kurgusuyla uyumlu muc",
      "Dograma akslari, cephe modulu ve tasiyici sistem birbiriyle cakisiyor muc",
      "Kritik kose, esik, parapet ve denizlik detaylari sahada yorumsuz okunabilir mic",
      "Ruhsat mimarisi ile uygulama mimarisi arasinda kayda deger fark birikti mic",
      "Mimari kararlarin enerji, yangin ve MEP etkileri birlikte kontrol edildi mic",
    ],
    numericalExample: {
      title: "Shaft boyutunda montaj ve bakim boslugu yorumu",
      inputs: [
        { label: "Planlanan shaft olcusu", value: "80 x 150 cm", note: "Ilk mimari taslak" },
        { label: "Pis su ve havalik zonu", value: "25 cm", note: "Boru ve baglanti alan" },
        { label: "Yangin / temiz su zonu", value: "15 cm", note: "Dikey kolon ve vana alani" },
        { label: "Elektrik tava ve kablo zonu", value: "20 cm", note: "Ayrik servis alani" },
        { label: "Bakim boslugu hedefi", value: "25 cm", note: "Vana ve mudahale icin asgari calisma payi" },
      ],
      assumptions: [
        "Shaft ayni anda mekanik, elektrik ve yangin sistemlerine hizmet etmektedir.",
        "Sistemler ust uste degil, bakim yapilabilir mantikta zonlanacaktir.",
        "Net olculer saha uygulamasinda kaplama ve yalitim etkisiyle kuculebilir.",
      ],
      steps: [
        {
          title: "Toplam ihtiyaci topla",
          formula: "25 + 15 + 20 + 25 = 85 cm",
          result: "Shaftin en az bir yonunde yaklasik 85 cm net ihtiyac olusur.",
          note: "Bu deger, yalniz borularin sigmasini degil bakim boslugunu da icerir.",
        },
        {
          title: "Mimari taslakla karsilastir",
          formula: "80 cm < 85 cm",
          result: "Taslak genislik kritik sinirin altinda kalmaktadir.",
          note: "Kagit uzerinde sigan sistem saha montaji ve bakim acisindan zorlayici olabilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Mimari shaft kararinda yalniz eleman kesiti degil, montaj ve bakim boslugu da tasarim girdisidir.",
          note: "Shafti 90-100 cm banda cekmek sonraki disiplinlerde pahali revizyonu azaltabilir.",
        },
      ],
      checks: [
        "Teknik hacim kararlari yalniz tayan eleman sayisina gore verilmemelidir.",
        "Net olcu, kaplama ve yalitim kayiplari dusunulerek okunmalidir.",
        "Bakim senaryosu yoksa shaft karari eksik kabul edilmelidir.",
        "Mimari revizyonun maliyeti sahadaki kirma maliyetinden daima daha dusuktur.",
      ],
      engineeringComment: "Mimari projede eksik bir teknik bosluk, sahada metrelerce kirma ve bitmeyen koordinasyon toplantisi olarak geri doner.",
    },
    tools: PROJECT_TOOLS,
    equipmentAndMaterials: PROJECT_EQUIPMENT,
    mistakes: [
      { wrong: "Mimari projeyi yalniz estetik ve yerlesim paketi gibi okumak.", correct: "Disiplin koordinasyonunun ana omurgasi olarak ele almak." },
      { wrong: "Shaft ve islak hacim kararlarini gec dondurmek.", correct: "Bu alanlari overlay ile erken kilitlemek." },
      { wrong: "Yangin ve kacis kararlarini son paftaya birakmak.", correct: "Merdiven ve cekirdek kurgusunu taslakta netlestirmek." },
      { wrong: "Kritik detaylari sahada cozulur diye bos birakmak.", correct: "Parapet, dograma, esik ve cephe birlesimlerini proje asamasinda cozumlemek." },
      { wrong: "Ruhsat paketiyle uygulama paketini ayni kabul etmek.", correct: "Sahaya cikacak uygulama detaylarini ayri olgunlukta tamamlamak." },
      { wrong: "Enerji ve kabuk davranisini sadece malzeme secimine indirmek.", correct: "Cephe ve dograma detaylarini TS 825 mantigiyla birlikte okumak." },
    ],
    designVsField: [
      "Ofiste mimari proje plan ve gorunusle anlatilir; sahada ayni proje ekiplerin birbirini bekleyip beklemeyecegini belirler.",
      "Iyi mimari proje daha az kirma, daha az revizyon ve daha temiz detay uretir.",
      "Bu nedenle mimari proje, estetik karar kadar uygulama lojistigi ve teknik bosluklar projesidir.",
    ],
    conclusion: [
      "Mimari proje dogru kuruldugunda tum disiplinlerin uzerine oturdugu temiz bir koordinasyon zemini olusturur. Eksik olgunlastiginda ise sorun cepheden degil, tum proje zincirinden geri doner.",
      "Bir insaat muhendisi icin en kritik ders sudur: iyi mimari proje sahada guzel gorunen degil, daha az dogaclama ve daha az tekrar is ureten projedir.",
    ],
    sources: [...PROJECT_BATCH_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.yanginYonetmeligi, SOURCE_LEDGER.ts825],
    keywords: ["mimari proje", "shaft koordinasyonu", "uygulama detayi", "imar uyumu", "disiplin overlay"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/statik-proje", "proje-hazirlik/tesisat-projesi"],
  },
  {
    slugPath: "peyzaj-teslim/iskan-ruhsati",
    kind: "topic",
    quote: "Iskan ruhsati, binanin bittiini soyleyen kagit degil; yapinin onayli projeye ve guvenli kullanima uygun tamamlandigini gosteren teknik kapanis kapisidir.",
    tip: "Iskani yalniz belediyeye teslim edilecek bir evrak isi gibi gormek, sahadaki eksikleri dosya kapanisiyla saklayabilecegini sanmaktir.",
    intro: [
      "Iskan ruhsati ya da yapi kullanma izin sureci, bir binanin yalniz fiziken tamamlandigini degil; onayli projeye, ortak alan guvenligine, teknik sistem devreye alma kayitlarina ve resmi uygunluk kosullarina gore kullanima hazir oldugunu gosteren son asamadir. Bu nedenle iskan, santiyenin sonundaki formalite degil; teknik kapanisin ana esigidir.",
      "Sahada iskan surecini zorlayan konularin buyuk kismi belediye masasnda degil, bina icinde dogar. Eksik as-built seti, devreye alma kaydi olmayan yangin sistemi, kapatilamamis punch list maddeleri, ortak alan imalatlarindaki sapmalar veya projeden kopmus son dakika degisiklikleri resmi sureci dogrudan kilitler.",
      "Bir insaat muhendisi icin iskan sureci; teknik ofis, saha ve resmi kurum ucgeninde ayni anda yuruyen bir dogrulama isidir. Saha kapanisi, evrak kapanisi ve kullaniciya guvenli teslim birbirinden ayrildiginda bina bitmis gorunse bile gercek anlamda tamamlanmis sayilmaz.",
      "Bu yazida iskan ruhsatini; mevzuat ekseni, saha kapanis mantigi, sayisal belge tamamlilik ornegi, kullanilan araclar ve sik yapilan hatalarla birlikte daha derin ve islevli bir blog yazisina donusturuyoruz.",
    ],
    theory: [
      "Iskan surecinin teorik omurgasi, onayli proje ile gercek saha uretiminin ayni sistem olarak okunmasidir. Ruhsat eki paftalar, yangin guvenligi, ortak alan kullanimi, erisim, teknik hacimler ve belediye kayitlari birbiriyle uyumlu degilse fiziksel tamamlanma tek basina yeterli olmaz. Bu nedenle iskan, yapinin dogrulugu ile dokumantasyonunun dogrulugunu ayni anda test eder.",
      "Teknik sistemler burada ozellikle kritik hale gelir. Yangin pompasi, algilama, asansor, jeneratr, temiz ve pis su sistemleri, ortak alan aydinlatmasi ve acil durum yonlendirmeleri yalniz monte edilmis olmamalidir; test edilmis, kayda baglanmis ve isletmeye devredilebilir durumda olmalidir. Iskan dosyasinda eksik kalan her teknik kayit, sahadaki fiziksel tamamlanmaya ragmen sureci durdurabilir.",
      "As-built mantigi de ayni derecede onemlidir. Uygulama sirasinda yapilan her degisiklik belediye veya ilgili teknik onay zinciriyle uyumlu kayda baglanmadiysa, saha ile dosya arasinda fark birikir. En riskli durum da budur; cunku problem sahada yokmus gibi gorunur ama resmi surecte bir anda onunuze gelir.",
      "Bu nedenle iskan ruhsati, belediyeye teslim edilmis belgeler toplami degil; santiyenin tum kapanis mantiginin, ortak alan guvenliginin ve teknik sistem okunurlugunun sonucudur. Iyi yonetilen bir projede iskan dosyasi son hafta hazirlanmaz; tum kapanis fazi boyunca olgunlasir.",
    ],
    ruleTable: [
      {
        parameter: "Onayli proje ile saha uyumu",
        limitOrRequirement: "Gercek imalat, ruhsat eki mimari ve teknik projelerle uyumlu olmalidir",
        reference: "3194 sayili Imar Kanunu + Planli Alanlar Imar Yonetmeligi",
        note: "Sahadaki son durum ile dosya arasindaki uyumsuzluk iskan surecini durdurur.",
      },
      {
        parameter: "Ortak alan ve kullanim guvenligi",
        limitOrRequirement: "Girisler, rampalar, kacis yollar, ortak hacimler ve teknik alanlar guvenli kullanima uygun tamamlanmalidir",
        reference: "Planli Alanlar Imar Yonetmeligi + Yangin Yonetmeligi",
        note: "Iskan, bagimsiz bolum kadar ortak alan performansini da sorgular.",
      },
      {
        parameter: "Teknik sistem devreye alma kayitlari",
        limitOrRequirement: "Yangin, asansor, enerji ve tesisat sistemleri icin test, kabul veya devreye alma kayitlari eksiksiz tutulmalidir",
        reference: "Yapi denetim ve ilgili teknik kabul disiplini",
        note: "Montaj, kayit olmadan resmi olarak tamamlanmis sayilmaz.",
      },
      {
        parameter: "As-built ve belge butunlugu",
        limitOrRequirement: "As-built, garanti, bakim, test ve punch list kapanis bilgileri tek teslim dosyasi mantiginda toplanmalidir",
        reference: "Saha kapanis disiplini",
        note: "Parcali dosya, sureci yavaslatir ve sorumluluk zincirini bozar.",
      },
      {
        parameter: "Kritik eksiklerin nceligi",
        limitOrRequirement: "Guvenlik ve resmi uygunluk etkili eksikler, kozmetik maddelerden once kapatilmalidir",
        reference: "Punch list yonetimi",
        note: "Teslim kalitesi, dogru ncelik sirasi ile kazanilir.",
      },
    ],
    designOrApplicationSteps: [
      "Onayli pafta seti ile sahadaki son imalati karsilastir; farklari belediye veya teknik onay zincirine uygun sekilde netlestir.",
      "Ortak alan, giris, rampa, kacis ve teknik hacim kabul turlarini tek tek degil, iskan mantigiyla butunsel yap.",
      "Yangin, asansor, enerji ve tesisat sistemleri icin test-devreye alma kayitlarini punch list'ten bagimsiz bir kalite kapisi olarak yonet.",
      "As-built, garanti, bakim ve iletme belgelerini tek bir kapanis klasorunde standart formatla topla.",
      "Kritik guvenlik eksikleri ile kozmetik eksikleri ayristir ve kapanis sirasini bu oncelige gore kur.",
      "Iskan basvurusu oncesi, teknik ofis ve saha ekibiyle bir son dosya-durum toplantisi yaparak acik riskleri kapat.",
    ],
    criticalChecks: [
      "Sahadaki son durum onayli projelerle gercekten uyumlu muc",
      "Yangin ve ortak alan guvenligi etkileyen eksik madde kaldi mic",
      "Asansor, yangin, jeneratr, pompa ve benzeri sistemler icin test belgeleri eksiksiz mic",
      "As-built seti uygulama degisikliklerini gercekten yansitiyor muc",
      "Punch list'te kritik resmi uygunluk maddeleri kapanmadan dosya sureci ilerletiliyor muc",
      "Bakim ve garanti klasoru isletmeye devredilebilir netlikte mic",
    ],
    numericalExample: {
      title: "Iskan dosyasinda belge tamamlilik orani yorumu",
      inputs: [
        { label: "Toplam gerekli belge paketi", value: "22 adet", note: "As-built, test, garanti ve resmi evraklar dahil" },
        { label: "Tamamlanan belge", value: "17 adet", note: "Teslime hazir grnen dosya" },
        { label: "Eksik belge", value: "5 adet", note: "Bunlarin 2'si yangin ve asansor kabul kaydi" },
        { label: "Hedef", value: "Kritik eksik kalmadan basvuru", note: "Zaman kaybi ve geri donusu azaltmak" },
      ],
      assumptions: [
        "Eksik belgelerin bir bolumu teknik sistem kabulune iliskindir.",
        "Sahadaki fiziksel imalat buyuk oranda tamamlanmistir.",
        "Kritik belge eksigi olan surecler belediye asamasinda bekleme yaratacaktir.",
      ],
      steps: [
        {
          title: "Tamamlilik oranini hesapla",
          formula: "17 / 22 = %77,3",
          result: "Dosya hacim olarak buyuk oranda tamam gibi gorunmektedir.",
          note: "Ancak oranin yuksek olmasi kritik belge eksigi olmadigi anlamina gelmez.",
        },
        {
          title: "Kritik eksikleri ayristir",
          result: "Eksik 5 belgenin 2'si yangin ve asansor kabulune aitse surecin resmi riski kozmetik evraktan ok daha yuksektir.",
          note: "Belgeler adet olarak degil, sureci kilitleme etkisine gore degerlendirilmelidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Iskan dosyasi sayisal tamamlilik yerine kritik bagimlilik mantigiyla yonetilmelidir.",
          note: "Bir tek eksik teknik kabul kaydi, onlarca tamamlanmis belgeyi anlamsiz hale getirebilir.",
        },
      ],
      checks: [
        "Belge tamamlilik orani kritik eksik kontrolu ile birlikte okunmalidir.",
        "Teknik sistem kabul kayitlari dier belgelerden ayri onceliklendirilmelidir.",
        "Sahadaki fiziksel durum ile evrak seti ayni anda kapanmalidir.",
        "Basvuru tarihi dosya kalitesine gore revize edilmelidir; takvime gore dayatilmamalidir.",
      ],
      engineeringComment: "Iskan surecinde eksik olan sey genelde kagit degil; kagidin dayandigi teknik dogrulamadir.",
    },
    tools: CLOSEOUT_TOOLS,
    equipmentAndMaterials: CLOSEOUT_EQUIPMENT,
    mistakes: [
      { wrong: "Iskani santiyenin sonunda hazirlanacak bir evrak isi sanmak.", correct: "Kapanis fazi boyunca olgunlasan teknik surec olarak yonetmek." },
      { wrong: "As-built cizimlerini son gune birakmak.", correct: "Saha degisikliklerini olustukca dosyaya islemek." },
      { wrong: "Yangin ve asansor kabul kayitlarini punch list kozmetigiyle ayni listede eritmek.", correct: "Kritik resmi uygunluk kalemlerini ayri onceliklendirmek." },
      { wrong: "Saha tamam gibi gorunuyor diye belge eksigini onemsiz sanmak.", correct: "Belge ve saha kapanisini ayni kalite kapisinda bulusturmak." },
      { wrong: "Ortak alan eksiklerini bagimsiz bolum tesliminden ayri dusunmek.", correct: "Iskan mantiginda ortak alan guvenligini ana kabul kriteri saymak." },
      { wrong: "Bakim ve garanti klasorunu sonradan toparlanir diye bos birakmak.", correct: "sletmeye devir bilgisini iskan surecinin parcasi olarak toplamak." },
    ],
    designVsField: [
      "Kagit uzerinde bitmis bir dosya, sahada bitmis bina anlamina gelmez; ikisi ayni gercegi gosterdiginde iskan sureci saglikli ilerler.",
      "Iyi kapanis yapan ekip, belediyeye belge veren degil; belgelerin dayandigi teknik kaliteyi de kapatan ekiptir.",
      "Iskan ruhsati, santiyenin son formalitesi degil; yapinin ilk isletme testi olarak okunmalidir.",
    ],
    conclusion: [
      "Iskan ruhsati sureci, onayli proje, saha kapanisi, ortak alan guvenligi ve teknik sistem belgeleri ayni hizda ilerlediginde sorunsuz tamamlanir. Bu halkalardan biri geride kaldiginda bina bitmis gorunse bile teknik olarak kapanmis sayilmaz.",
      "Bir insaat muhendisi icin en saglam yaklasim, iskani belediye basvurusundan once saha-kalite dosyasi olarak tamamlamaktir.",
    ],
    sources: [...CLOSEOUT_BATCH_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.yapiDenetim, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["iskan ruhsati", "yapi kullanma izin", "punch list", "as-built", "teknik kapanis"],
    relatedPaths: ["peyzaj-teslim", "peyzaj-teslim/peyzaj-ve-cevre-duzenleme", "proje-hazirlik/yapi-ruhsati"],
  },
];
