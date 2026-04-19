import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const INCE_LEAF_OVERRIDE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const PAINT_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Renk kartelasi ve numune paneli", purpose: "Rengi katalogda degil, gercek mekan isigi altinda dogrulamak." },
  { category: "Ölçüm", name: "Nem olcer, yan isik lambasi ve 2 m mastar", purpose: "Boya öncesi yüzey kuruluk, dalga ve lokal kusurlari yakalamak." },
  { category: "Kontrol", name: "Katman ve kuruma takip cizelgesi", purpose: "Astar, macun, ara zimpara ve son kat sirasini disiplinli tutmak." },
  { category: "Kayıt", name: "Mahal bazli teslim foyi", purpose: "Renk tonu, tamir noktasi ve son kabul notlarini alan bazinda arsivlemek." },
];

const PAINT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Astar, macun ve yüzey tamir malzemeleri", purpose: "Boyayi tasiyacak homojen, tozsuz ve dengeli emicilikte alt yüzey uretmek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Rulo, firca, havasiz boya makinesi ve karisim ekipmani", purpose: "Mekan tipine ve uygulama hizina göre kontrollu katman olusturmak.", phase: "Boya uygulamasi" },
  { group: "Koruma", name: "Maskeleme bantlari, zemin ortuleri ve köşe koruyucular", purpose: "Boya sirasinda doğrama, seramik ve zeminleri leke riskinden korumak.", phase: "Hazirlik ve uygulama" },
  { group: "Kontrol", name: "Yan isik projektoru ve rulo izi kontrol ekipmani", purpose: "Son kat öncesi ve sonrasinda görünür kusurlari tespit etmek.", phase: "Kalite kontrol" },
];

const PLASTER_TOOLS: BinaGuideTool[] = [
  { category: "Ölçüm", name: "Lazer nivo, aluminium mastar ve şakul", purpose: "İç siva duzlemini ve köşe dogrulugunu mahal bazinda sayisal hale getirmek." },
  { category: "Detay", name: "Köşe profili ve file detay paftalari", purpose: "Kolon-duvar, pencere kosesi ve chase tamirlerini tek standarda baglamak." },
  { category: "Kontrol", name: "Kuruma ve tamir takip cizelgesi", purpose: "Siva sonrasinda boya öncesi bekleme surelerini ve tamir kalemlerini izlemek." },
  { category: "Kayıt", name: "Deneme paneli ve fotograf arşivi", purpose: "Secilen harc ve iscilik kalitesini genellemeden once gormek." },
];

const PLASTER_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Yüzey temizlik ekipmanlari ve aderans astari", purpose: "Tozlu, parlak veya emiciligi dengesiz yuzeyleri siva için hazir hale getirmek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Cimento esasli veya alci esasli iç siva sistemi", purpose: "Mahal kullanimina ve alt yuzeye uygun ana duzlem katmanini olusturmak.", phase: "Siva uygulamasi" },
  { group: "Detay", name: "Siva filesi, köşe profili ve denizlik profili", purpose: "Catlak riski yuksek birlesim ve köşe hatlarini guclendirmek.", phase: "Detay cozumu" },
  { group: "Koruma", name: "Nem ve hava akisi kontrol ekipmanlari", purpose: "Asiri hızlı kuruma, tozuma ve yüzey yanigini azaltmak.", phase: "Uygulama sonrasi" },
];

const CERAMIC_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Modul plani ve gider detay paftalari", purpose: "Seramik dizisini, kesim noktalarini ve gider cevresi cozumu uygulama öncesi sabitlemek." },
  { category: "Ölçüm", name: "Lazer terazi, mastar ve egim kontrol takozlari", purpose: "Alt zemin duzlugu ile islak hacim egimini seramik öncesi ve sirasinda dogrulamak." },
  { category: "Kontrol", name: "Yapıştırıcı ve derz tuketim foyi", purpose: "Karisim, uygulama hizi ve deneme alanini veriyle takip etmek." },
  { category: "Kayıt", name: "Mahal bazli bosluk ve golenme test listesi", purpose: "Teslim öncesi tok ses, bosluk ve su birikmesi risklerini kayıt altina almak." },
];

const CERAMIC_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Tesviye sapi, astar ve su yalitimi katmanlari", purpose: "Seramigi tasiyacak duz, saglam ve suya karsi hazir bir alt sistem kurmak.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Seramik, porselen karo ve kenar bitis elemanlari", purpose: "Mahal kullanimina uygun asinma, hijyen ve görünür kalite saglamak.", phase: "Kaplama" },
  { group: "Birlesim", name: "TS EN 12004 sinifina uygun yapıştırıcı, derz dolgu ve hareket profilleri", purpose: "Kaplamanin aderansini ve kontrollu hareketini saglamak.", phase: "Montaj ve bitis" },
  { group: "Kontrol", name: "Mala disi, vakumlu taşıyıcı ve tok ses kontrol ekipmani", purpose: "Doğru yatak kalinligi ve tam temas kalitesini izlemek.", phase: "Uygulama ve kabul" },
];

export const inceIslerLeafOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/duvar-kaplamalari/boya",
    kind: "topic",
    quote: "Boya, duvara sonradan gelen renk degil; onceki tüm hazirlik kararlarinin görünür raporudur.",
    tip: "Renk secimine saatler ayirip nem, macun ve yan isik kontrolunu atlamak, teslim gununde gozle gorulen kusuru bizzat uretmek demektir.",
    intro: [
      "Boya isleri, santiyede cogu zaman en sona kalan ve bu nedenle en kolay sanilan ince iş kalemlerinden biridir. Oysa kullanıcı algisinda ilk okunan kalite katmani cogunlukla boyadir. Duvar ne kadar duz, köşe ne kadar temiz ve renk ne kadar dengeli gorunuyorsa, yapinin geneline dair kalite hissi de o kadar yukselir.",
      "Bir insaat muhendisi için boya isi yalnız malzeme teslim almak veya ustanin uygulama hizini izlemek degildir. Boya öncesi sivanin kuruma seviyesi, macun kalinligi, ara zimpara kalitesi, farkli ekiplerin aynı mekanda yarattigi leke ve darbe riski bir arada yonetilmelidir. Bu zincir kurulmazsa sorun son katta degil, daha onceki asamada kaybedilir.",
      "Sahada en sık gorulen sikayetler; ton farki, rulo izi, yan isikta dalga, erken kirlenme ve lokal tamir yerlerinin belli olmasidir. Bu problemlerin buyuk kismi boya markasindan degil, alt yüzey hazirliginin duzensizliginden ve katmanlar arasindaki bekleme disiplininin bozulmasindan kaynaklanir.",
      "Bu nedenle boya isi, dekoratif kapanis kalemi olmaktan çok, duvar kaplamasi ve siva kalitesinin teknik kabul asamasi olarak ele alinmalidir.",
    ],
    theory: [
      "Boya performansi alt yuzeyin emiciligi ile doğrudan iliskilidir. Aynı mahal icinde farkli emicilige sahip siva, tamir harci ve macun adalari varsa son kat boya, aynı renkte uygulansa bile farkli parlaklik ve ton yansitabilir. Bu nedenle homojen olmayan yuzeyde iyi son kat beklemek gercekci degildir.",
      "Ayrıca boya, yan isik altinda yüzey kusurlarini buyuten bir kaplamadir. Gunes alan koridorlar, pencere yanaklari veya lineer aydinlatmali tavan cevrelerinde milimetrik dalga bile belirgin hale gelir. Bu nedenle boya kabulunun duz tavandan degil, gercek isik senaryosundan okunmasi gerekir.",
      "Katman mantigi da kritik onemdedir. Astar, yalnız toz tutan ilk katman degil; emiciligi dengeleyen, macun ile son kat arasinda adezyonu ve renk stabilitesini yoneten teknik baglayicidir. Astar atlanirsa veya hiz ugruna yetersiz kuruma ile üst katmana gecilirse son kat kalitesi gecici görünür.",
      "İç mekan boyalarinda havalandirma ve kuruma kosullari da sonuca etki eder. Asiri hızlı hava akimi, toz tasinmasi veya soğuk ve nemli ortam, boya filminin düzgün olusmasini zorlastirir. Dolayisiyla iyi boya, yalnız rulo hareketi degil ortam kontrolu isidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey kuruluk ve saglamlik",
        limitOrRequirement: "Boya öncesi siva tam kurumus, tozumayan ve lokal kabarma gostermeyen durumda olmali",
        reference: "TS EN 13914 uygulama prensipleri + saha kabul disiplini",
        note: "Nemli veya zayif yüzey uzerindeki boya once parlaklik, sonra kabarma problemi verir.",
      },
      {
        parameter: "Astar ve macun sistemi",
        limitOrRequirement: "Yüzey emiciligine göre uygun astar ve macun kombinasyonu secilmeli",
        reference: "Urun teknik foyi + saha numune paneli",
        note: "Her duvar aynı emicilikte kabul edilmemelidir.",
      },
      {
        parameter: "Katlar arasi bekleme",
        limitOrRequirement: "Ara kat kuruma suresi ve zimpara temizligi atlanmamali",
        reference: "Uygulama talimati",
        note: "Hiz için kisaltilan bekleme, son katta iz ve soyulma riskini buyutur.",
      },
      {
        parameter: "Yüzey kabul sekli",
        limitOrRequirement: "Kabul yalnız on cepheden degil, yan isik ve kullanıcı göz seviyesinde yapilmali",
        reference: "Mahal bazli teslim kriteri",
        note: "Duz bakista iyi gorunen iş, yan isikta kusur verebilir.",
      },
      {
        parameter: "Koruma ve temizlik",
        limitOrRequirement: "Boya alani doğrama, seramik ve zeminlerden ayrilarak temiz ve kontrollu uygulanmali",
        reference: "Şantiye bitis plani",
        note: "Son katta leke ve darbe cogu zaman baska ekiplerin kontrolsuz girisinden gelir.",
      },
    ],
    designOrApplicationSteps: [
      "Boya öncesi tüm mahali gezerek siva tamiri, catlak, nem ve toz problemlerini tek listede topla.",
      "Astar ve son kat rengini katalogdan degil, gercek mahalde uygulanan numune paneli uzerinden onaylat.",
      "Macun kalinligini duvari kurtaracak bir dolgu gibi degil, son duzeltme katmani olarak ele al; ciddi dalgalari once alt yuzeyde coz.",
      "Ara zimpara, toz temizligi ve köşe kontrolunu son kat kadar ciddiye al; bunlari ustaya birakilmis küçük detay sayma.",
      "Son kati planlarken mekan isigi, cephe yonu ve iş programini dikkate al; farkli gunlerde boyanan yuzeylerin kesintisini görünür yerde birakma.",
      "Teslim öncesi yan isik, kapı cephesi ve kullanıcı temasi yuksek alanlarda ayri kalite turu yap.",
    ],
    criticalChecks: [
      "Yuzeyde boya altindan okunacak nemli bölge, tozuma veya kabarma var mi?",
      "Macun tamir noktalarinin emiciligi ile genel duvar emiciligi dengelendi mi?",
      "Köşe, tavan-duvar birlesimi ve doğrama yanlarinda keskin ve temiz bitis saglandi mi?",
      "Yan isik altinda dalga, rulo izi veya bindirme farki olusuyor mu?",
      "Aynı mekan icinde farkli gunlerde yapilan boyalarda ton farki beliriyor mu?",
      "Son kat sonrasi alan, baska ekiplerin kirli islerine karsi gercekten korunuyor mu?",
    ],
    numericalExample: {
      title: "420 m2 ofis duvarinda son kat boya tuketim ve iş plani yorumu",
      inputs: [
        { label: "Toplam boyanacak net alan", value: "420 m2", note: "Kapılar ve sabit mobilya dusulmus" },
        { label: "Urunun teorik sarfiyati", value: "9 m2/L/kat", note: "Teknik foye göre ornek deger" },
        { label: "Planlanan son kat sayisi", value: "2 kat", note: "Astar ayri degerlendiriliyor" },
        { label: "İş kaybi ve rulo transfer payi", value: "%10", note: "Saha gercegi için emniyet payi" },
      ],
      assumptions: [
        "Alt yüzey macun ve astar acisindan kabul edilmistir.",
        "Aynı boya partisi ve aynı renk tüm alan için birlikte temin edilmistir.",
        "Aydinlatma, uygulama sirasinda nihai kullanım senaryosuna yakindir.",
      ],
      steps: [
        {
          title: "Bir kat boya ihtiyacini hesapla",
          formula: "420 / 9 = 46,7 L",
          result: "Teorik olarak bir son kat için yaklasik 47 litre boya gerekir.",
          note: "Gercek sahada duvar emiciligi ve uygulama yontemi bu degeri degistirebilir.",
        },
        {
          title: "Iki kat toplam ihtiyaci bul",
          formula: "46,7 x 2 = 93,4 L",
          result: "Iki son kat için teorik miktar yaklasik 93,4 litredir.",
          note: "Astar ve lokal tamir boyasi bu hesabin disindadir.",
        },
        {
          title: "Saha payini ekle",
          formula: "93,4 x 1,10 = 102,7 L",
          result: "Yaklasik 103 litre siparis plani saha için daha guvenli olur.",
          note: "Parca parca siparis verilirse parti farki ve ton farki riski buyur.",
        },
      ],
      checks: [
        "Malzeme hesabinda yalnız teorik sarfiyat degil, saha kaybi ve yedek parti gereksinimi dusunulmelidir.",
        "Boya partilerinin karistirilmasi veya birlikte siparis edilmesi ton farki riskini azaltir.",
        "Buyuk mahalde uygulama gunleri ve ekip sinirlari görünür kesit yaratmayacak sekilde planlanmalidir.",
        "Sarfiyat beklenenden çok yuksek cikiyorsa alt yüzey emiciligi yeniden sorgulanmalidir.",
      ],
      engineeringComment: "Boya hesabindaki en pahali hata, litreden çok dengesiz alt yuzeyin gec fark edilmesidir.",
    },
    tools: PAINT_TOOLS,
    equipmentAndMaterials: PAINT_EQUIPMENT,
    mistakes: [
      { wrong: "Nemli veya yeni tamir edilmis yuzeye aceleyle boya gecmek.", correct: "Kuruma ve yüzey saglamligini sayisal ve görsel olarak dogrulamak." },
      { wrong: "Renk onayini yalnız katalog uzerinden vermek.", correct: "Gercek mahal isigi altinda numune panel yapmak." },
      { wrong: "Macunla buyuk duvar bozukluklarini saklamaya çalışmak.", correct: "Ana duzlem sorununu boya öncesi alt yuzeyde cozmek." },
      { wrong: "Ara zimparayi veya toz temizligini ikincil iş saymak.", correct: "Ara kat kalitesini son kat kadar ciddiye almak." },
      { wrong: "Aynı mekani farkli partilerle ve farkli ekiplerle plansiz boyamak.", correct: "Kesitleri, malzeme partisini ve ekip dagilimini en bastan tanimlamak." },
      { wrong: "Teslimden once korumayi kaldirip alani diger ekiplere acmak.", correct: "Boyayi son dokunus olarak koruma planina baglamak." },
    ],
    designVsField: [
      "Tasarim asamasinda boya bir renk kodudur; sahada ise siva, macun, astar ve aydinlatma kalitesinin ortak sonucudur.",
      "Kagit üzerinde aynı renk iki mekanda esit algilanabilir; gercekte cephe yonu, gunes miktari ve yapay isik tonda belirgin fark yaratir.",
      "Bu nedenle iyi boya uygulamasi, duvara renk surmekten çok, duvari o renge layik hale getirme isidir.",
    ],
    conclusion: [
      "Boya isi, santiyenin kapanis kalemi oldugu için degil, görünür kaliteyi en hızlı ele veren katman oldugu için teknik disiplin ister. Doğru hazirlik, doğru numune ve doğru kabul yontemi olmadan pahali boya da beklenen sonucu vermez.",
      "Saha tarafinda en doğru yaklasim, boyayi dekoratif degil denetlenebilir bir kalite paketi olarak ele almaktir. Boylece teslim gununde surpriz degil, ongorulen sonuc elde edilir.",
    ],
    sources: [...INCE_LEAF_OVERRIDE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["boya", "iç cephe boya", "yan isik kontrolu", "macun", "teslim kalitesi"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/siva/ic-siva"],
  },
  {
    slugPath: "ince-isler/siva/ic-siva",
    kind: "topic",
    quote: "İç siva, duvari kapatan bir katman degil; odanin geometri hissini belirleyen ana referans duzlemdir.",
    tip: "Boyanin tüm kusuru saklayacagini dusunmek sahadaki en pahali yanilgilardan biridir; bozuk duvar once siva asamasinda yakalanmalidir.",
    intro: [
      "İç siva, bir mekanin goze gorunmeyen ama her an hissedilen kalitesini belirler. Duvarlarin duz gorunmesi, köşe hatlarinin temiz cikmasi, priz ve buat cevrelerinin derli toplu okunmasi, hatta mobilya ile duvar iliskisinin düzgün gorunmesi once iç siva kalitesine baglidir.",
      "Bu nedenle iç siva isi, yalnız alci veya cimento esasli bir malzemenin duvara surulmesi olarak gorulmemelidir. Alt yüzey emiciligi, betonarme ile dolgu duvar birlesimleri, chase tamirleri, file detaylari ve kuruma rejimi birlikte ele alinmalidir.",
      "Sahada siva ile ilgili sikayetler cogu zaman boya geldikten sonra fark edilir; fakat o asamada yapilan tamirler hem iz birakir hem de zaman kaybettirir. En saglikli yol, siva kalitesini mastar, lazer ve yan isik yardimiyla erken asamada netlestirmektir.",
      "Bir insaat muhendisi için iç siva, sonraki tüm duvar kaplamalarinin taşıyıcı alt sistemi oldugu için saha programinin tam ortasinda duran bir kalite kalemidir.",
    ],
    theory: [
      "İç siva sistemleri alt yuzeyin cinsine göre farkli davranir. Betonarme yuzeyler daha duz ama daha düşük emicilige sahip olabilirken, tugla veya gazbeton yuzeyler daha emici ve daha dalgali olabilir. Bu farki okumadan aynı karisim ve aynı uygulama ritmiyle ilerlemek tutarsiz sonuc uretir.",
      "Catlak davranisi da genellikle malzeme degisim hatlarinda baslar. Kolon-duvar birlesimleri, pencere koseleri, elektrik chase tamirleri ve küçük yamalar ana risk bolgeleridir. Bu cizgiler guclendirilmezse son kat ne kadar iyi olursa olsun zamanla görünür catlaklar cikar.",
      "İç siva kalinligi yalnız metrekaresel bir sarfiyat konusu degildir. Asiri kalin tek kat uygulama, hem agirlik hem kuruma hem de rotresel catlak riski yaratir. Bu nedenle buyuk bozukluklar ana siva ile degil, once yerel duzeltme ve referans mastar mantigiyla ele alinmalidir.",
      "Kuruma kosullari da sonucu belirler. Hava akimi, sıcaklık ve nem dengesi, sivanin yüzey sertligi ve boya altindaki performansi üzerinde doğrudan etkilidir. Siva hizla kurusun diye acilan sert hava akimi bazen yuzeyi yakar ve tozuma yaratir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey hazirligi",
        limitOrRequirement: "Gevsek parca, kalip yagi, toz ve aderansi zayif tabakalar temizlenmeli",
        reference: "TS EN 13914 uygulama prensipleri",
        note: "Hazir olmayan yüzey uzerine iyi siva yapilamaz.",
      },
      {
        parameter: "Katman kalinligi ve referans",
        limitOrRequirement: "Ana duzlem mastar ve referans noktalarla kurulmalı, lokal cepler tek katla kapatilmamali",
        reference: "Saha kalite plani",
        note: "Kalinligi artiran her santimetre, kuruma ve catlak riskini buyutur.",
      },
      {
        parameter: "Kritik birlesimler",
        limitOrRequirement: "Kolon-duvar, pencere kosesi ve chase tamirlerinde file veya uygun takviye detayi uygulanmali",
        reference: "TS EN 13914 + saha catlak kontrol disiplini",
        note: "En çok sorun veren yerler genellikle buyuk yüzey degil bu cizgilerdir.",
      },
      {
        parameter: "Kuruma rejimi",
        limitOrRequirement: "Siva ani rüzgar, asiri sıcaklık ve erken islak/kirli kullanimdan korunmali",
        reference: "Şantiye uygulama plani",
        note: "Kuruma kontrolu olmadan boya takvimi guvenilir kurulamaz.",
      },
      {
        parameter: "Kabul yontemi",
        limitOrRequirement: "Duzlem, köşe ve tamir izleri boya öncesi bagimsiz bir turla kontrol edilmeli",
        reference: "Mahal bazli teslim kriteri",
        note: "Boyaciya birakilan duzeltme gec ve pahali olur.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yuzeyi betonarme, gazbeton, tugla ve tamir adalari olarak ayir; her biri için farkli hazirlik ihtiyacini yazili hale getir.",
      "Mastar referanslarini, köşe profillerini ve kritik akslari siva baslamadan once sabitle.",
      "Buyuk bozukluklari once yerel duzeltme ile azalt, ana siva katmanini yuzeyi kurtarma operasyonuna donusturme.",
      "Kolon-duvar birlesimleri, pencere koseleri ve elektrik chase hatlarinda file ve tamir disiplinini atlama.",
      "Siva bitince mekani hemen sonraki ekibe acma; kuruma, yüzey sertligi ve tozuma kontrolu yap.",
      "Boya öncesi her mahalde yan isik, mastar ve el ile yoklama turu yaparak tamir listesini kapat.",
    ],
    criticalChecks: [
      "Alt yuzeyde sivanin tutunmasini zayiflatacak toz, parlaklik veya gevsek tabaka kaldi mi?",
      "Mastar hatlari arasinda dalga veya ani kalinlik artisi var mi?",
      "Kolon-duvar ve chase tamir cizgilerinde file veya guclendirme gercekten uygulanmis mi?",
      "Pencere yanaklari, köşe donusleri ve tavan-duvar birlesimleri net ve düzgün mu?",
      "Siva yuzeyi kuruma sirasinda tozuma, yanik veya cekme catlagi gosteriyor mu?",
      "Boya ekibi alana girmeden once tamir listesi kapatildi mi?",
    ],
    numericalExample: {
      title: "5,20 m duvarda siva kalinligi ve duzeltme karari",
      inputs: [
        { label: "Duvar uzunlugu", value: "5,20 m", note: "Salon ana duvari" },
        { label: "Olculen en buyuk seviye farki", value: "18 mm", note: "2 m mastar ve lazer kontrolu" },
        { label: "Planlanan ortalama ana siva kalinligi", value: "12 mm", note: "Boya alti hedef uygulama" },
        { label: "Hedef", value: "Tek katta asiri kalinliktan kacinmak", note: "Catlak ve kuruma riski için" },
      ],
      assumptions: [
        "Alt yüzey genel olarak saglamdir ve aderans problemi yoktur.",
        "Boya alti kalite talebi yuksektir, yan isik etkisi olacaktir.",
        "Lokal duzeltmeler ana siva öncesi yapilabilir durumdadir.",
      ],
      steps: [
        {
          title: "Bozuklugu planlanan katmanla karsilastir",
          formula: "18 mm > 12 mm",
          result: "Ana siva kalinligi yuzeyi tek basina toparlamaya yetmeyecektir.",
          note: "Tek katta 18 mm doldurmaya çalışmak dengesiz kuruma ve catlak riski yaratir.",
        },
        {
          title: "Yerel duzeltme gereksinimini belirle",
          formula: "18 - 12 = 6 mm",
          result: "Yaklasik 6 mm'lik fark lokal on duzeltme veya referans mastar ile yonetilmelidir.",
          note: "Boylece ana siva kontrollu ve daha esit kalinlikta kalir.",
        },
        {
          title: "Kabul kararini kur",
          result: "Ana siva ancak yerel bozukluklar alindiktan sonra boya alti kalitede verimli olur.",
          note: "Sivanin gorevi tüm yapisal kusuru gizlemek degil, doğru duzlemi kurmaktir.",
        },
      ],
      checks: [
        "Siva kalinligi, hatayi saklayacak kadar degil, duzlemi saglayacak kadar tasarlanmalidir.",
        "Asiri kalin lokal cepler, once alt hazirlikta azaltilmalidir.",
        "Mastar kabulu boya öncesi aynı cihaz ve aynı kriterle tekrarlanmalidir.",
        "Birlesim cizgilerinde file detayi bu karardan bagimsiz dusunulmemelidir.",
      ],
      engineeringComment: "İç siva kalitesi, duvarin ne kadar bozuk oldugunu degil, o bozuklugun ne kadar erken fark edilip teknik olarak yonetildigini gosterir.",
    },
    tools: PLASTER_TOOLS,
    equipmentAndMaterials: PLASTER_EQUIPMENT,
    mistakes: [
      { wrong: "Kalip yagli veya tozlu yuzeye doğrudan siva atmak.", correct: "Yuzeyi temizleyip aderans kosullarini siva öncesi saglamak." },
      { wrong: "Butun bozuklugu tek kat kalin siva ile cozmek.", correct: "Yerel duzeltme ve referans mastar mantigi kurmak." },
      { wrong: "Kolon-duvar ve pencere koselerinde fileyi gereksiz gormek.", correct: "Malzeme degisim cizgilerini ana catlak riski olarak ele almak." },
      { wrong: "Kuruma tamamlanmadan boyaya veya mekanik montaja gecmek.", correct: "Kuruma ve yüzey saglamligini bagimsiz kabul adimi yapmak." },
      { wrong: "Tamir adalarini sonradan lokal yama ile kapatmak.", correct: "Tamirleri ana duzlemin parçası olarak once yapmak." },
      { wrong: "Yan isik kontrolunu teslim sonunda hatirlamak.", correct: "Siva bitince erken asamada yan isikta kontrol yapmak." },
    ],
    designVsField: [
      "Projede iç siva cogu zaman tek bir metraj satiridir; sahada ise mekan geometri hissini, boya kalitesini ve mobilya algisini belirleyen ana referans yuzeydir.",
      "Tasarim tarafinda duvar duz kabul edilir, ama sahada tesisat chase'i, dolgu duvar dalgasi ve betonarme cikintisi aynı duzleme toplanmak zorundadir.",
      "Bu nedenle iyi iç siva, malzeme sarfiyatindan once saha karar kalitesinin gostergesidir.",
    ],
    conclusion: [
      "İç siva doğru hazirlik, doğru referans ve doğru kuruma disipliniyle yapildiginda sonraki tüm duvar kaplamalarinin performansini yukselten ana alt katman olur. Zayif uygulandiginda ise boya ve duvar kaplamasi ne kadar iyi olursa olsun kusur kendini ele verir.",
      "Saha pratiginde en saglam yol, iç sivayi hiz kalemi degil kabul kalemi olarak yonetmektir. Bu bakis, hem tekrar isciligi hem de teslim sonrasi kullanıcı sikayetlerini belirgin bicimde azaltir.",
    ],
    sources: [...INCE_LEAF_OVERRIDE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["iç siva", "duzlem kontrolu", "catlak kontrolu", "file detayi", "boya alti kalite"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/duvar-kaplamalari/boya"],
  },
  {
    slugPath: "ince-isler/zemin-kaplamalari/seramik-kaplama",
    kind: "topic",
    quote: "Seramik kaplama, sert ve duzenli görünür; ama gercek kalitesi alt zeminin ne kadar disiplinli hazirlandiginda saklidir.",
    tip: "Yapıştırıcının alt zemin hatasini duzeltecegini dusunmek, seramigi pahali bir tamir malzemesine cevirmekten baska bir sey degildir.",
    intro: [
      "Seramik kaplama; islak hacimlerden ortak alanlara, mutfaklardan balkonlara kadar çok genis bir kullanım alani bulur. Hijyen, asinma dayanimi ve bakım kolayligi nedeniyle tercih edilir. Ancak bu avantajlar, ancak alt zemin geometrisi, yapıştırıcı secimi ve derz duzeni doğru kuruldugunda gercek performansa donusur.",
      "Bir insaat muhendisi için seramik isi, yalnız karo ebat ve renk secmek degildir. Gider cevresi egimi, su yalitimi, modul karari, hareket derzi, esik birlesimi ve bosluk kontrolu birlikte ele alinmalidir. Aksi halde seramik güzel gorunse bile su birikmesi, tok ses ve kirik karo sikayetleri kısa surede gelir.",
      "Sahada en yaygin hata, seramik uygulamasini alt zemin kusurunu gizleyecek son kaplama gibi gormektir. Oysa seramik sert ve duzenli bir sistem oldugu için bozuklugu saklamaz; tam tersine daha görünür hale getirir.",
      "Bu nedenle seramik kaplama; sap kabulunden teslim testine kadar veriyle yonetilmesi gereken, hem saha hem de kullanıcı acisindan kritik bir ince iş paketidir.",
    ],
    theory: [
      "Seramik sisteminin aderansi, yalnız yapıştırıcının markasina bagli degildir. Alt zemin emiciligi, tozsuzlugu, duzlugu ve gerekiyorsa su yalitim katmaninin butunlugu bir arada degerlendirilmelidir. Yüzey zayifsa iyi yapıştırıcı bile tam performans gostermez.",
      "Buyuk ebatli karolarda yatak doluluk orani daha da onem kazanir. Yetersiz mala disi secimi, eksik tarak izi yonu veya gerekliyken arka yuz buttering yapilmamasi, yuzeyde bosluk birakabilir. Bu bosluklar ilk basta görünmez ama ileride tok ses, kirilma veya kenar catlagi olarak ortaya cikar.",
      "Islak alanlarda egim geometriyi belirler. Suyun gider yerine golenme yapmasi, seramigin degerini ve temizlik kalitesini doğrudan dusurur. Bu nedenle seramik uygulamasi, sapin verdigi egimi korumali; uygulama sirasinda bu geometriyi bozacak duzensiz yapıştırıcı yataklarindan kacinmalidir.",
      "Dilatasyon ve birlesim detaylari da kritik onemdedir. Sert kaplama hareketi sevmez; bu nedenle genis alan, esik ve farkli alt sistemler arasinda kontrollu hareket imkani birakilmazsa derz acilmasi ve kaplama catlagi kacinilmaz hale gelir.",
    ],
    ruleTable: [
      {
        parameter: "Alt zemin ve su yalitimi",
        limitOrRequirement: "Seramik öncesi sap, duzlem, egim ve gerekli ise su yalitimi bagimsiz kabulden gecmeli",
        reference: "Saha kalite plani + islak hacim kabul kriteri",
        note: "Seramik, bozuk sap ve eksik su yalitimini duzeltemez.",
      },
      {
        parameter: "Yapıştırıcı secimi",
        limitOrRequirement: "Karo ebadi, mahal kullanım sinifi ve yüzey kosuluna uygun TS EN 12004 sinifi secilmeli",
        reference: "TS EN 12004 performans siniflari",
        note: "Buyuk ebat ve zorlayici ortam aynı yapistiriciyi kabul etmeyebilir.",
      },
      {
        parameter: "Modul ve kesim karari",
        limitOrRequirement: "Dar parca, capraz kayma ve gider etrafinda zayif geometri olusturmayacak layout planlanmali",
        reference: "Mahal modul plani",
        note: "Görsel kalite ve saha hizinin anahtari uygulama öncesi layout'tur.",
      },
      {
        parameter: "Derz ve hareket detaylari",
        limitOrRequirement: "Derz genisligi, esik ve genis alan hareket cizgileri bastan tanimlanmali",
        reference: "Uygulama disiplini",
        note: "Sert kaplama sistemi rastgele hareketi tolere etmez.",
      },
      {
        parameter: "Teslim kontroli",
        limitOrRequirement: "Bosluk, tok ses, golenme ve derz surekliligi mahal bazinda test edilmeli",
        reference: "Teslim checklisti",
        note: "Görsel kontrol tek basina yeterli degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Seramigi mahal kullanimina, islaklik riskine ve temizlenebilirlik ihtiyacina göre sec; aynı anda yapıştırıcı ve derz sistemini de netlestir.",
      "Uygulama öncesi sap duzlugunu, gider konumunu ve egim yonunu lazer ve mastarla olcerek kabul et.",
      "Merkez aks, kapı esigi, duvar bitisi ve gider etrafini iceren net bir modul plani olustur.",
      "Uygun mala disi, doğru tarak yonu ve gerekiyorsa arka yuz uygulamasi ile tam temas hedefle.",
      "Islak alanda suyun yonunu bozacak lokal yapıştırıcı tepeleri veya keskin kot oyunlari birakma.",
      "Teslimden once tok ses, golenme, derz boslugu ve kenar kiriklarini sistematik turla kontrol et.",
    ],
    criticalChecks: [
      "Sap altinda veya seramik altinda bosluk yaratacak seviye farki kaldi mi?",
      "Gider etrafi ve dus alani egimi sahada olculerek dogrulandi mi?",
      "Modul plani köşe ve esiklerde çok dar kesim parçası birakiyor mu?",
      "Buyuk ebatli karolarda tam temas için ilave arka yuz uygulamasi gerekti mi?",
      "Derz genisligi ve cizgi surekliligi mahal boyunca tutarli mi?",
      "Teslim testinde tok ses veya golenme tespit edilen alanlar kayda alindi mi?",
    ],
    numericalExample: {
      title: "60 x 60 karo ile 2,40 x 1,80 m banyoda modul ve egim yorumu",
      inputs: [
        { label: "Mahal olculeri", value: "240 x 180 cm", note: "Net kaplama alani" },
        { label: "Karo ebadi", value: "60 x 60 cm", note: "Porselen seramik" },
        { label: "Derz araligi", value: "3 mm", note: "Ornek tasarim karari" },
        { label: "Dus alaninda hedef egim", value: "%1,5", note: "Suzgece yonelim için ornek kabul" },
      ],
      assumptions: [
        "Yerlesim merkez aksa göre simetrik planlanacaktir.",
        "Su yalitimi ve sap uygulamasi seramik öncesi kabul edilmistir.",
        "Gider konumu sabittir ve layout buna göre okunacaktir.",
      ],
      steps: [
        {
          title: "180 cm genislikte kenar parca hesabini yap",
          formula: "(1800 - 600 x 2 - 3) / 2 = 298,5 mm",
          result: "Iki tam karo ve iki yanda yaklasik 29,9 cm'lik esit kesim parçası elde edilir.",
          note: "Bu deger yarim karodan buyuk oldugu için görsel olarak dengeli bir layout verir.",
        },
        {
          title: "240 cm uzunlukta yerlesim mantigini oku",
          formula: "(2400 - 600 x 3 - 6) / 2 = 297 mm",
          result: "Uc tam karo ve iki yanda yaklasik 29,7 cm'lik esit kesim parçası elde edilir.",
          note: "Dar ve zayif kenar parçası olusmadigi için uygulama daha temiz ilerler.",
        },
        {
          title: "Dus alaninda gerekli kot farkini hesapla",
          formula: "180 x 0,015 = 2,7 cm",
          result: "1,80 m boyunca suyun akmasi için yaklasik 2,7 cm kot farki gerekir.",
          note: "Bu geometri sapta yoksa seramik uygulamasi sirasinda saglikli bicimde kurtarilamaz.",
        },
      ],
      checks: [
        "Modul plani ile egim plani birlikte okunmalidir; güzel layout tek basina yeterli degildir.",
        "Kesim parcalari yarim karoya yakinsa görsel kalite ve uygulama hizi artar.",
        "Gider cevresinde su birikmeyecek geometri seramik öncesi saglanmalidir.",
        "Hesap kagit üzerinde uygun olsa da sahada mutlaka kuru dizgi veya referans cizgisiyle dogrulanmalidir.",
      ],
      engineeringComment: "Seramikte en pahali hata, uygunsuz geometriyi yapistiriciyla duzeltmeye calismaktir.",
    },
    tools: CERAMIC_TOOLS,
    equipmentAndMaterials: CERAMIC_EQUIPMENT,
    mistakes: [
      { wrong: "Sap bozuklugunu yapıştırıcı kalinligini arttirarak telafi etmeye çalışmak.", correct: "Alt zemini once tesviye edip sonra kaplamaya gecmek." },
      { wrong: "Islak alanda egimi seramik dizesi sirasinda karara baglamak.", correct: "Egimi seramik öncesi olcerek kabul etmek." },
      { wrong: "Modul plani yapmadan kaplama baslamak.", correct: "Merkez aks, esik ve gider cevresini once kagit üzerinde cozumlemek." },
      { wrong: "Buyuk ebatli karolarda tam temas gereksinimini göz ardi etmek.", correct: "Mala disi ve uygulama yontemini karo boyutuna göre secmek." },
      { wrong: "Derz ve hareket cizgilerini rastgele birakmak.", correct: "Genis alan ve geçiş detaylarini bastan tanimlamak." },
      { wrong: "Teslimde yalnız goruntuye bakmak.", correct: "Tok ses ve golenme testlerini de zorunlu kontrol yapmak." },
    ],
    designVsField: [
      "Tasarim asamasinda seramik ebat, renk ve doku olarak secilir; sahada ise asil kaliteyi belirleyen sey alt zemin, layout ve egim disiplinidir.",
      "Güzel gorunen bir karo, eger suyu tasimiyor veya tok ses veriyorsa teknik olarak basarisizdir.",
      "Bu nedenle seramik kaplama, estetik karar kadar uygulama geometrisi ve malzeme uyumu isidir.",
    ],
    conclusion: [
      "Seramik kaplama doğru sap, doğru layout ve doğru yapıştırıcı sistemiyle birlestiginde uzun omurlu, temiz ve guvenilir bir zemin ya da duvar cozumu olur. Sorun cogu zaman karoda degil, karo gelmeden once verilmis saha kararlarindadir.",
      "Muhendislik bakisiyla bakildiginda seramik isi; modul, egim ve bosluk kontrolunu aynı tabloda yonetmeyi gerektirir. Bu disiplin kuruldugunda hem görsel kalite hem de kullanım performansi belirgin bicimde yukselir.",
    ],
    sources: [...INCE_LEAF_OVERRIDE_SOURCES, SOURCE_LEDGER.tsEn12004],
    keywords: ["seramik kaplama", "TS EN 12004", "egim kontrolu", "modul plani", "tok ses kontrolu"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/duvar-kaplamalari/fayans"],
  },
];
