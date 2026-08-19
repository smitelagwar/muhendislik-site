import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJECT_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];
const CLOSEOUT_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["peyzaj-teslim"]];

const PROJECT_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Revit / CAD overlay ve clash seti", purpose: "Mimari, statik ve MEP kararlarini tek bir koordinat sisteminde karsilastirmak." },
  { category: "Kontrol", name: "Mahal listesi, şaft matrisi ve karar logu", purpose: "Mimari kararlarin revizyon kaybina ugramadan izlenmesini saglamak." },
  { category: "Ruhsat", name: "Imar ve yangın uygunluk checklisti", purpose: "Ruhsat ve uygulama paketleri arasinda eksik madde kalmamasini saglamak." },
  { category: "Saha", name: "Detay okuma ve uygulama notu seti", purpose: "Kritik dugumlerin ofisten sahaya net aktarilmasini saglamak." },
];

const CLOSEOUT_TOOLS: BinaGuideTool[] = [
  { category: "Takip", name: "Punch list matrisi ve kapama plan", purpose: "Eksiklerin kritik ve kozmetik olarak ayrilip kapanis sirasina baglanmasini saglamak." },
  { category: "Dokuman", name: "As-built ve test dosyasi klasoru", purpose: "Gercek saha imalatini resmi teslim evraklariyla eslestirmek." },
  { category: "Saha", name: "Kabul turu checklisti", purpose: "Ortak alan, yangın, tesisat ve çevre duzeninin tek turda denetlenmesini saglamak." },
  { category: "Resmi Süreç", name: "İskan evrak takip cizelgesi", purpose: "Yapı kullanma izin surecindeki belge ve onay bagimliliklarini görmek." },
];

const PROJECT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokumantasyon", name: "Plan, kesit, görünüş ve detay pafta seti", purpose: "Mimari kararlarin disiplinlerce aynı sekilde okunmasini saglamak.", phase: "Proje" },
  { group: "Koordinasyon", name: "Overlay, clash raporu ve revizyon kayitlari", purpose: "Disiplinler arasi cakismazlik ve karar izini görünür kilmak.", phase: "Koordinasyon" },
  { group: "Saha", name: "Detay ciktisi ve aplikasyon referanslari", purpose: "Kritik dugumlerin sahada yorumsuz uygulanmasini desteklemek.", phase: "Uygulama öncesi" },
  { group: "Kontrol", name: "Onay ve revizyon matrisi", purpose: "Ruhsat paketi ile uygulama paketi arasindaki farklari kapatmak.", phase: "Sürekli" },
];

const CLOSEOUT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Lazer nivo, total station ve saha kabul formlari", purpose: "Ortak alan kotlari, erişim ve çevre duzenini olcerek kapatmak.", phase: "Teslim öncesi" },
  { group: "Dokuman", name: "As-built, test, garanti ve bakım klasoru", purpose: "Resmi kapanis ile isletme devrini aynı bilgi setinde birlestirmek.", phase: "Kapanis" },
  { group: "Koordinasyon", name: "Disiplin bazli punch list ve sorumlu listesi", purpose: "Eksiklerin kim tarafindan ne zaman kapatilacagini netlestirmek.", phase: "Punch list" },
  { group: "Resmi Süreç", name: "Yapı kullanma izin evrak seti", purpose: "İskan surecinde gereken onay ve teknik belgeleri eksiksiz toplamak.", phase: "İskan" },
];

export const projectCloseoutBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/mimari-proje",
    kind: "topic",
    quote: "Mimari proje, estetik kararlar paketi değil; tüm disiplinlerin oturacagi koordinat sistemini kuran ana teknik omurgadir.",
    tip: "Mimari projeyi yalnız plan ve görünüş seti gibi görmek, sahadaki en pahali revizyonlari daha proje hazirlik asamasinda davet eder.",
    intro: [
      "Mimari proje, bir yapının yalnız gorunen yuzunu değil; taşıyıcı sistemi, tesisat rotalarini, yangın kacisini, cephe davranisini ve kullanıcı akisini aynı anda tanimlayan temel karar paketidir. Bu nedenle mimari proje yalnız mimarin sorumlulugunda kalan bir cizim seti değil, tüm disiplinlerin baglandigi ana referanstir.",
      "Sahada en pahali revizyonlarin buyuk bolumu eksik veya gec olgunlasmis mimari kararlardan dogar. Yanlış boyutlanan şaft, gec kesinlesen doğrama akslari, belirsiz parapet detayi veya kötü çözülmüş islak hacim kurgusu; statik, mekanik ve elektrik ekiplerini ikinci kez tasarim yapmaya zorlar.",
      "Bir inşaat mühendisi için mimari proje yalnız uygulama öncesi okunacak bir dosya degildir. Uygulama sirasini, aplikasyon kolayligini, saha lojistigini ve hatta teslim sonrasi bakım davranisini belirler. Yani iyi mimari proje, ofiste güzel gorunen değil; sahada daha az kırma, daha az dogaclama ve daha az tekrar iş ureten projedir.",
      "Bu yazida mimari projeyi; teorik koordinasyon mantigi, resmi gereksinimler, sayisal bir şaft ornegi, araç listesi ve sık yapilan hatalarla birlikte uzun-form ve sahada kullanilabilir bir rehber olarak ele aliyoruz.",
    ],
    theory: [
      "Mimari proje, disiplin koordinasyonunun ilk veri tabanidir. Akslar, cekirdekler, islak hacimler, doğrama bosluklari, cephe modulu ve kot iliskileri burada doğru kurulmadiginda statik ve tesisat disiplinleri çözüm uretemez; yalnız uyarlama yapar. Bu da projenin ilerleyen asamalarinda zincirleme revizyon ve sahada yoruma acik detaylar dogurur.",
      "Mahal organizasyonu yalnız kullanıcı deneyimini değil; ekipman yerlesimini, yangın kacisini, acik sahada erisimi ve mekanik elektrik rotalarini da etkiler. Ornegin bir koridor genisligi veya şaft yeri mimari gorunmekle birlikte yangın senaryosu, tesisat gecisi ve bakım erisimi için de belirleyicidir. Bu nedenle mimari proje, mekan estetikleri kadar teknik boşluklar projesidir.",
      "Kabuk ve cephe kararlarinin da mimari projede yeterli olgunlukta kurulmasi gerekir. Doğrama akslari, denizlik, parapet, gunes kontrol elemanlari ve isi koprusu riski tasiyan birleimler erken cozulmezse uygulama paketi sahada uretilmeye başlar. Bu durum kaliteyi ustaya, maliyeti ise santiyeye birakir.",
      "Iyi mimari proje yalnız cizim uretmez; belirsizligi azaltir. Her karar sahadaki bir uygulama sirasini, bir detay uretimini veya bir imar-yangın uygunluk kontrolünü doğrudan etkiler. Bu nedenle mimari proje, proje hazirlik asamasinin en kritik mühendislik katmanlarindan biridir.",
    ],
    ruleTable: [
      {
        parameter: "Imar ve ruhsat uyumu",
        limitOrRequirement: "Yapı kurgusu, emsal, cekme mesafesi, ortak alanlar ve kullanım kararlarini resmi mevzuatla uyumlu tasimalidir",
        reference: "3194 sayili Imar Kanunu + Planli Alanlar Imar Yönetmeliği",
        note: "Mimari kararlarin ruhsat asamasinda değil, taslak asamasinda dogrulanmasi gerekir.",
      },
      {
        parameter: "Yangın ve kacis kurgusu",
        limitOrRequirement: "Kacis mesafesi, merdiven, cekirdek ve yangın güvenliği kararlar mimari planda erken tanimlanmalidir",
        reference: "Yangın Yönetmeliği",
        note: "Yangın kacisi sonradan cephe veya plan icine eklenebilecek bir detay degildir.",
      },
      {
        parameter: "Shaft ve teknik hacim koordinasyonu",
        limitOrRequirement: "Dikey tesisat hacimleri, montaj ve bakım bosluklariyla birlikte overlay uzerinden doğrulanmalıdır",
        reference: "Disiplin koordinasyon plani",
        note: "Yalnız boru kesiti kadar yer ayirmak teknik olarak yetersiz olabilir.",
      },
      {
        parameter: "Kabuk ve enerji davranisi",
        limitOrRequirement: "Cephe, doğrama ve kabuk detaylari isi, nem ve su davranisini destekleyecek sekilde kurgulanmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Mimari detaylar enerji performansindan bağımsız dusunulemez.",
      },
      {
        parameter: "Uygulanabilir detay seviyesi",
        limitOrRequirement: "Kritik düğümler olcekli, okunur ve saha yorumuna minimum alan birakacak detay setiyle desteklenmelidir",
        reference: "Uygulama proje disiplini",
        note: "Belirsiz detay sahada ek tasarim demektir.",
      },
    ],
    designOrApplicationSteps: [
      "Imar haklari, fonksiyon programi ve cekirdek kararlarini erken asamada tek omurgada kilitle.",
      "Mimari plan, statik akslar ve MEP overlay'i aynı koordinat sisteminde calistir; cakismazliklari pafta öncesi coz.",
      "Shaft, islak hacim, merdiven, asansor ve teknik hacimleri yalnız yerlesim olarak değil montaj-bakım senaryosu olarak oku.",
      "Doğrama akslari, parapet, denizlik, balkon, cephe ve çatı birlesimlerini uygulama paketi olgunlugunda detaylandir.",
      "Ruhsat paketi ile uygulama paketi arasindaki bosluklari santiyeye cikmadan kapat; uygulama notlarini revizyon matrisi ile takip et.",
      "Sahaya cikacak kritik detaylar için mahal bazli veya düğüm bazli numune mantigi kur.",
    ],
    criticalChecks: [
      "Shaft ve teknik hacimler montaj ve bakım boslugunu gercekten karsiliyor muc",
      "Merdiven, asansor ve cekirdek düzeni yangın kurgusuyla uyumlu muc",
      "Doğrama akslari, cephe modulu ve taşıyıcı sistem birbiriyle cakisiyor muc",
      "Kritik köşe, esik, parapet ve denizlik detaylari sahada yorumsuz okunabilir mic",
      "Ruhsat mimarisi ile uygulama mimarisi arasinda kayda deger fark birikti mic",
      "Mimari kararlarin enerji, yangın ve MEP etkileri birlikte kontrol edildi mic",
    ],
    numericalExample: {
      title: "Shaft boyutunda montaj ve bakım boşluğu yorumu",
      inputs: [
        { label: "Planlanan şaft ölçüsü", value: "80 x 150 cm", note: "Ilk mimari taslak" },
        { label: "Pis su ve havalik zonu", value: "25 cm", note: "Boru ve bağlantı alan" },
        { label: "Yangın / temiz su zonu", value: "15 cm", note: "Dikey kolon ve vana alani" },
        { label: "Elektrik tava ve kablo zonu", value: "20 cm", note: "Ayrik servis alani" },
        { label: "Bakım boşluğu hedefi", value: "25 cm", note: "Vana ve mudahale için asgari çalışma payi" },
      ],
      assumptions: [
        "Shaft aynı anda mekanik, elektrik ve yangın sistemlerine hizmet etmektedir.",
        "Sistemler üst uste değil, bakım yapilabilir mantikta zonlanacaktir.",
        "Net ölçüler saha uygulamasinda kaplama ve yalitim etkisiyle kuculebilir.",
      ],
      steps: [
        {
          title: "Toplam ihtiyaci topla",
          formula: "25 + 15 + 20 + 25 = 85 cm",
          result: "Shaftin en az bir yonunde yaklasik 85 cm net ihtiyaç olusur.",
          note: "Bu deger, yalnız borularin sigmasini değil bakım boslugunu da icerir.",
        },
        {
          title: "Mimari taslakla karsilastir",
          formula: "80 cm < 85 cm",
          result: "Taslak genislik kritik sinirin altinda kalmaktadir.",
          note: "Kagit üzerinde sigan sistem saha montaji ve bakım acisindan zorlayici olabilir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Mimari şaft kararinda yalnız eleman kesiti değil, montaj ve bakım boşluğu da tasarim girdisidir.",
          note: "Shafti 90-100 cm banda cekmek sonraki disiplinlerde pahali revizyonu azaltabilir.",
        },
      ],
      checks: [
        "Teknik hacim kararlari yalnız tayan eleman sayisina göre verilmemelidir.",
        "Net ölçü, kaplama ve yalitim kayiplari dusunulerek okunmalidir.",
        "Bakım senaryosu yoksa şaft karari eksik kabul edilmelidir.",
        "Mimari revizyonun maliyeti sahadaki kırma maliyetinden daima daha dusuktur.",
      ],
      engineeringComment: "Mimari projede eksik bir teknik boşluk, sahada metrelerce kırma ve bitmeyen koordinasyon toplantisi olarak geri doner.",
    },
    tools: PROJECT_TOOLS,
    equipmentAndMaterials: PROJECT_EQUIPMENT,
    mistakes: [
      { wrong: "Mimari projeyi yalnız estetik ve yerlesim paketi gibi okumak.", correct: "Disiplin koordinasyonunun ana omurgasi olarak ele almak." },
      { wrong: "Shaft ve islak hacim kararlarini gec dondurmek.", correct: "Bu alanlari overlay ile erken kilitlemek." },
      { wrong: "Yangın ve kacis kararlarini son paftaya birakmak.", correct: "Merdiven ve cekirdek kurgusunu taslakta netlestirmek." },
      { wrong: "Kritik detaylari sahada cozulur diye bos birakmak.", correct: "Parapet, doğrama, esik ve cephe birlesimlerini proje asamasinda cozumlemek." },
      { wrong: "Ruhsat paketiyle uygulama paketini aynı kabul etmek.", correct: "Sahaya cikacak uygulama detaylarini ayri olgunlukta tamamlamak." },
      { wrong: "Enerji ve kabuk davranisini sadece malzeme secimine indirmek.", correct: "Cephe ve doğrama detaylarini TS 825 mantigiyla birlikte okumak." },
    ],
    designVsField: [
      "Ofiste mimari proje plan ve gorunusle anlatilir; sahada aynı proje ekiplerin birbirini bekleyip beklemeyecegini belirler.",
      "Iyi mimari proje daha az kırma, daha az revizyon ve daha temiz detay uretir.",
      "Bu nedenle mimari proje, estetik karar kadar uygulama lojistigi ve teknik boşluklar projesidir.",
    ],
    conclusion: [
      "Mimari proje doğru kuruldugunda tüm disiplinlerin uzerine oturdugu temiz bir koordinasyon zemini olusturur. Eksik olgunlastiginda ise sorun cepheden değil, tüm proje zincirinden geri doner.",
      "Bir inşaat mühendisi için en kritik ders sudur: iyi mimari proje sahada güzel gorunen değil, daha az dogaclama ve daha az tekrar iş ureten projedir.",
    ],
    sources: [...PROJECT_BATCH_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.yanginYonetmeligi, SOURCE_LEDGER.ts825],
    keywords: ["mimari proje", "şaft koordinasyonu", "uygulama detayi", "imar uyumu", "disiplin overlay"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/statik-proje", "proje-hazirlik/tesisat-projesi"],
  },
  {
    slugPath: "peyzaj-teslim/iskan-ruhsati",
    kind: "topic",
    quote: "İskan ruhsatı, binanin bittiini soyleyen kagit değil; yapının onayli projeye ve güvenli kullanima uygun tamamlandigini gosteren teknik kapanis kapisidir.",
    tip: "Iskani yalnız belediyeye teslim edilecek bir evrak isi gibi görmek, sahadaki eksikleri dosya kapanisiyla saklayabilecegini sanmaktir.",
    intro: [
      "İskan ruhsatı ya da yapı kullanma izin süreci, bir binanin yalnız fiziken tamamlandigini değil; onayli projeye, ortak alan guvenligine, teknik sistem devreye alma kayitlarina ve resmi uygunluk kosullarina göre kullanima hazir oldugunu gosteren son asamadir. Bu nedenle iskan, şantiyenin sonundaki formalite değil; teknik kapanisin ana esigidir.",
      "Sahada iskan surecini zorlayan konularin buyuk kismi belediye masasnda değil, bina icinde dogar. Eksik as-built seti, devreye alma kaydı olmayan yangın sistemi, kapatilamamis punch list maddeleri, ortak alan imalatlarindaki sapmalar veya projeden kopmus son dakika degisiklikleri resmi süreci doğrudan kilitler.",
      "Bir inşaat mühendisi için iskan süreci; teknik ofis, saha ve resmi kurum ucgeninde aynı anda yuruyen bir dogrulama isidir. Saha kapanisi, evrak kapanisi ve kullaniciya güvenli teslim birbirinden ayrildiginda bina bitmis gorunse bile gercek anlamda tamamlanmis sayilmaz.",
      "Bu yazida iskan ruhsatini; mevzuat ekseni, saha kapanis mantigi, sayisal belge tamamlilik ornegi, kullanilan araçlar ve sık yapilan hatalarla birlikte daha derin ve islevli bir blog yazisina donusturuyoruz.",
    ],
    theory: [
      "İskan surecinin teorik omurgasi, onayli proje ile gercek saha uretiminin aynı sistem olarak okunmasidir. Ruhsat eki paftalar, yangın güvenliği, ortak alan kullanimi, erişim, teknik hacimler ve belediye kayitlari birbiriyle uyumlu degilse fiziksel tamamlanma tek basina yeterli olmaz. Bu nedenle iskan, yapının dogrulugu ile dokumantasyonunun dogrulugunu aynı anda test eder.",
      "Teknik sistemler burada ozellikle kritik hale gelir. Yangın pompasi, algilama, asansor, jeneratr, temiz ve pis su sistemleri, ortak alan aydinlatmasi ve acil durum yonlendirmeleri yalnız monte edilmis olmamalidir; test edilmis, kayda baglanmis ve isletmeye devredilebilir durumda olmalidir. İskan dosyasinda eksik kalan her teknik kayıt, sahadaki fiziksel tamamlanmaya ragmen süreci durdurabilir.",
      "As-built mantigi de aynı derecede önemlidir. Uygulama sirasinda yapilan her degisiklik belediye veya ilgili teknik onay zinciriyle uyumlu kayda baglanmadiysa, saha ile dosya arasinda fark birikir. En riskli durum da budur; cunku problem sahada yokmus gibi görünür ama resmi surecte bir anda onunuze gelir.",
      "Bu nedenle iskan ruhsatı, belediyeye teslim edilmis belgeler toplami değil; şantiyenin tüm kapanis mantiginin, ortak alan guvenliginin ve teknik sistem okunurlugunun sonucudur. Iyi yonetilen bir projede iskan dosyasi son hafta hazirlanmaz; tüm kapanis fazi boyunca olgunlasir.",
    ],
    ruleTable: [
      {
        parameter: "Onayli proje ile saha uyumu",
        limitOrRequirement: "Gercek imalat, ruhsat eki mimari ve teknik projelerle uyumlu olmalidir",
        reference: "3194 sayili Imar Kanunu + Planli Alanlar Imar Yönetmeliği",
        note: "Sahadaki son durum ile dosya arasindaki uyumsuzluk iskan surecini durdurur.",
      },
      {
        parameter: "Ortak alan ve kullanım güvenliği",
        limitOrRequirement: "Girisler, rampalar, kacis yollar, ortak hacimler ve teknik alanlar güvenli kullanima uygun tamamlanmalidir",
        reference: "Planli Alanlar Imar Yönetmeliği + Yangın Yönetmeliği",
        note: "İskan, bağımsız bölüm kadar ortak alan performansini da sorgular.",
      },
      {
        parameter: "Teknik sistem devreye alma kayitlari",
        limitOrRequirement: "Yangın, asansor, enerji ve tesisat sistemleri için test, kabul veya devreye alma kayitlari eksiksiz tutulmalidir",
        reference: "Yapı denetim ve ilgili teknik kabul disiplini",
        note: "Montaj, kayıt olmadan resmi olarak tamamlanmis sayilmaz.",
      },
      {
        parameter: "As-built ve belge butunlugu",
        limitOrRequirement: "As-built, garanti, bakım, test ve punch list kapanis bilgileri tek teslim dosyasi mantiginda toplanmalidir",
        reference: "Saha kapanis disiplini",
        note: "Parcali dosya, süreci yavaslatir ve sorumluluk zincirini bozar.",
      },
      {
        parameter: "Kritik eksiklerin nceligi",
        limitOrRequirement: "Güvenlik ve resmi uygunluk etkili eksikler, kozmetik maddelerden önce kapatilmalidir",
        reference: "Punch list yönetimi",
        note: "Teslim kalitesi, doğru ncelik sırası ile kazanilir.",
      },
    ],
    designOrApplicationSteps: [
      "Onayli pafta seti ile sahadaki son imalati karsilastir; farklari belediye veya teknik onay zincirine uygun sekilde netlestir.",
      "Ortak alan, giriş, rampa, kacis ve teknik hacim kabul turlarini tek tek değil, iskan mantigiyla butunsel yap.",
      "Yangın, asansor, enerji ve tesisat sistemleri için test-devreye alma kayitlarini punch list'ten bağımsız bir kalite kapısı olarak yonet.",
      "As-built, garanti, bakım ve iletme belgelerini tek bir kapanis klasorunde standart formatla topla.",
      "Kritik güvenlik eksikleri ile kozmetik eksikleri ayristir ve kapanis sirasini bu oncelige göre kur.",
      "İskan basvurusu öncesi, teknik ofis ve saha ekibiyle bir son dosya-durum toplantisi yaparak acik riskleri kapat.",
    ],
    criticalChecks: [
      "Sahadaki son durum onayli projelerle gercekten uyumlu muc",
      "Yangın ve ortak alan güvenliği etkileyen eksik madde kaldi mic",
      "Asansor, yangın, jeneratr, pompa ve benzeri sistemler için test belgeleri eksiksiz mic",
      "As-built seti uygulama degisikliklerini gercekten yansitiyor muc",
      "Punch list'te kritik resmi uygunluk maddeleri kapanmadan dosya süreci ilerletiliyor muc",
      "Bakım ve garanti klasoru isletmeye devredilebilir netlikte mic",
    ],
    numericalExample: {
      title: "İskan dosyasinda belge tamamlilik orani yorumu",
      inputs: [
        { label: "Toplam gerekli belge paketi", value: "22 adet", note: "As-built, test, garanti ve resmi evraklar dahil" },
        { label: "Tamamlanan belge", value: "17 adet", note: "Teslime hazir grnen dosya" },
        { label: "Eksik belge", value: "5 adet", note: "Bunlarin 2'si yangın ve asansor kabul kaydı" },
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
          note: "Ancak oranin yüksek olmasi kritik belge eksigi olmadigi anlamina gelmez.",
        },
        {
          title: "Kritik eksikleri ayristir",
          result: "Eksik 5 belgenin 2'si yangın ve asansor kabulune aitse surecin resmi riski kozmetik evraktan ok daha yuksektir.",
          note: "Belgeler adet olarak değil, süreci kilitleme etkisine göre degerlendirilmelidir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "İskan dosyasi sayisal tamamlilik yerine kritik bagimlilik mantigiyla yonetilmelidir.",
          note: "Bir tek eksik teknik kabul kaydı, onlarca tamamlanmis belgeyi anlamsiz hale getirebilir.",
        },
      ],
      checks: [
        "Belge tamamlilik orani kritik eksik kontrolü ile birlikte okunmalidir.",
        "Teknik sistem kabul kayitlari dier belgelerden ayri onceliklendirilmelidir.",
        "Sahadaki fiziksel durum ile evrak seti aynı anda kapanmalidir.",
        "Basvuru tarihi dosya kalitesine göre revize edilmelidir; takvime göre dayatilmamalidir.",
      ],
      engineeringComment: "İskan surecinde eksik olan sey genelde kagit değil; kagidin dayandigi teknik dogrulamadir.",
    },
    tools: CLOSEOUT_TOOLS,
    equipmentAndMaterials: CLOSEOUT_EQUIPMENT,
    mistakes: [
      { wrong: "Iskani şantiyenin sonunda hazirlanacak bir evrak isi sanmak.", correct: "Kapanis fazi boyunca olgunlasan teknik süreç olarak yonetmek." },
      { wrong: "As-built cizimlerini son gune birakmak.", correct: "Saha degisikliklerini olustukca dosyaya islemek." },
      { wrong: "Yangın ve asansor kabul kayitlarini punch list kozmetigiyle aynı listede eritmek.", correct: "Kritik resmi uygunluk kalemlerini ayri onceliklendirmek." },
      { wrong: "Saha tamam gibi gorunuyor diye belge eksigini onemsiz sanmak.", correct: "Belge ve saha kapanisini aynı kalite kapisinda bulusturmak." },
      { wrong: "Ortak alan eksiklerini bağımsız bölüm tesliminden ayri dusunmek.", correct: "İskan mantiginda ortak alan guvenligini ana kabul kriteri saymak." },
      { wrong: "Bakım ve garanti klasorunu sonradan toparlanir diye bos birakmak.", correct: "sletmeye devir bilgisini iskan surecinin parçası olarak toplamak." },
    ],
    designVsField: [
      "Kagit üzerinde bitmis bir dosya, sahada bitmis bina anlamina gelmez; ikisi aynı gercegi gosterdiginde iskan süreci sağlıklı ilerler.",
      "Iyi kapanis yapan ekip, belediyeye belge veren değil; belgelerin dayandigi teknik kaliteyi de kapatan ekiptir.",
      "İskan ruhsatı, şantiyenin son formalitesi değil; yapının ilk isletme testi olarak okunmalidir.",
    ],
    conclusion: [
      "İskan ruhsatı süreci, onayli proje, saha kapanisi, ortak alan güvenliği ve teknik sistem belgeleri aynı hizda ilerlediginde sorunsuz tamamlanir. Bu halkalardan biri geride kaldiginda bina bitmis gorunse bile teknik olarak kapanmis sayilmaz.",
      "Bir inşaat mühendisi için en saglam yaklasim, iskani belediye basvurusundan önce saha-kalite dosyasi olarak tamamlamaktir.",
    ],
    sources: [...CLOSEOUT_BATCH_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.yapiDenetim, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["iskan ruhsatı", "yapı kullanma izin", "punch list", "as-built", "teknik kapanis"],
    relatedPaths: ["peyzaj-teslim", "peyzaj-teslim/peyzaj-ve-cevre-duzenleme", "proje-hazirlik/yapi-ruhsati"],
  },
];
