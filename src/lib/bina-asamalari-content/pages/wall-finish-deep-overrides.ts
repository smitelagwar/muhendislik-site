import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const WALL_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Modul plani, köşe ve bitis paftasi", purpose: "Duvar kaplamalarini usta refleksi yerine planli bitis mantigiyla kurmak." },
  { category: "Ölçüm", name: "Lazer hat, mastar ve derz kontrol listesi", purpose: "Kaplamanin goze güzel gorunmesini olcuyle desteklemek." },
  { category: "Kontrol", name: "Yüzey hazirlik ve aderans checklisti", purpose: "Fayans ve diger duvar kaplamalarini altlik kalitesine baglamak." },
  { category: "Kayıt", name: "Numune duvar ve mahal teslim formu", purpose: "Farkli ekiplerden gelen kalite farkini azaltmak." },
];

const WALL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Altlik", name: "Siva, tesviye, astar ve lokal onarim malzemeleri", purpose: "Kaplamanin oturacagi duvar yuzeyini uygulamaya hazir hale getirmek.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Fayans, seramik veya dekoratif duvar elemanlari", purpose: "Mahal kullanimina uygun son katman performansi saglamak.", phase: "Montaj" },
  { group: "Baglayici", name: "Yapıştırıcı, derz dolgu ve yardimci profiller", purpose: "Kaplamanin duvara uzun omurlu ve olculu bicimde tutunmasini saglamak.", phase: "Uygulama" },
  { group: "Kontrol", name: "Mastar, derz aparati ve numune panel", purpose: "Modul, hat ve bitis kalitesini teslim öncesi gormek.", phase: "Kabul" },
];

export const wallFinishDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/duvar-kaplamalari",
    kind: "topic",
    quote: "Duvar kaplamalari, rengin ve dokunun otesinde; yüzey hazirligi, modul ve bitis disiplininin görünür sonucudur.",
    tip: "Duvar kaplamasini yalnız urun secimi sanmak, alttaki siva, modul ve köşe kalitesini son katta gizlemeye calismaktir.",
    intro: [
      "Duvar kaplamalari; boya, fayans, seramik, dogal tas, duvar kagidi veya dekoratif panel gibi farkli sistemlerle iç mekanin gorunusunu ve temizlenebilirligini belirler. Ancak bu sistemlerin ortak paydasi urun degil alt yuzeydir. Alttaki duvar ne kadar doğru hazirlandiysa, ustteki kaplama da o kadar temiz ve uzun omurlu davranir.",
      "Sahada yaygin hata, duvar kaplamasini estetik tercih olarak gormektir. Oysa capraz isiginda belli olan dalga, bozuk köşe, sasmiş derz cizgisi veya bir sure sonra kalkmaya baslayan bir kaplama cogu zaman urunden degil, alttaki hazirlik ve bitis disiplininden kaynaklanir.",
      "Bir insaat muhendisi için duvar kaplamalari; siva kalitesi, modul plani, tesisat cikislari, islak hacim davranisi ve bitis dugumlerini birlikte okumak demektir. Cunku iyi kaplama yalnız güzel görünmez; bakimda sorun yaratmaz ve mahal kullanimi ile uyumlu davranir.",
      "Bu rehberde duvar kaplamalarini; teorik temel, standart ekseni, sayisal modul yorumu, ekipmanlar ve saha hatalariyla birlikte uzun ve akici bir yapiya tasiyoruz.",
    ],
    theory: [
      "Duvar kaplamasi performansi alt yüzey ile urun arasindaki uyuma dayanir. Yüzey nemli, tozlu, zayif aderansli veya dalgali ise en kaliteli kaplama dahi beklenen sonucu vermez. Bu nedenle kaplamanin dayanim omru, görünür son kat kadar gorunmeyen altyapi kalitesine baglidir.",
      "Modul ve bitis disiplini ikinci temel eksendir. Ozellikle fayans, seramik ve panel bazli sistemlerde köşe donusleri, nişler, armatür cikislari ve kapi-pencere kenarlari planlanmadan uygulamaya gecilirse dar parcalar, sasmiş eksenler ve zayif bir goruntu olusur. Modul plani bu nedenle estetik degil teknik zorunluluktur.",
      "Islak hacimlerde duvar kaplamasi aynı zamanda su riski ile baglantilidir. Yapiştirici, altlik, su yalitimi ve derz kararlari birbirinden ayri dusunulmez. Kuru hacimde güzel çalışan bir sistem, islak hacimde uygun altlik ve detay olmadan kısa surede problem uretir.",
      "Isik davranisi da bu sistemlerde belirleyicidir. Yan isik alan koridor, banyo aynasi cevresi veya uzun ofis duvarinda bozukluklar çok daha görünür hale gelir. Bu nedenle kabul sureci yalnız karsidan bakarak degil, farkli isik yonlerinde ve hat referanslariyla yapilmalidir.",
      "Bu bakisla duvar kaplamalari, ince islerin en görünür kalite aynalarindan biridir. Altlik ve bitis disiplini ne kadar saglam kurulduysa, son kat o kadar sessiz ve temiz görünür.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey hazirligi",
        limitOrRequirement: "Kaplama öncesi duvar temiz, düzgün, yeterli aderans ve uygun emicilikte olmalidir",
        reference: "TS EN 13914 + uygulama kalite plani",
        note: "Kötü altlik iyi urunu bozar.",
      },
      {
        parameter: "Yapıştırıcı ve sistem uyumu",
        limitOrRequirement: "Kaplama tipi ve mahal kullanimina uygun baglayici ve yardimci urun secilmelidir",
        reference: "TS EN 12004",
        note: "Her duvar kaplamasi aynı yapıştırıcı sistemi istemez.",
      },
      {
        parameter: "Modul ve bitis detaylari",
        limitOrRequirement: "Köşe, niş, tesisat cikisi ve bitisler önceden modul planiyla cozulmelidir",
        reference: "Detay paftasi ve numune mahal",
        note: "Dar parca ve sasmiş hatlar plansiz baslangicin sonucudur.",
      },
      {
        parameter: "Islak hacim davranisi",
        limitOrRequirement: "Su riski olan mahallerde kaplama alti detay ve derz sistemi buna uygun secilmelidir",
        reference: "Mahal kullanım plani",
        note: "Kaplama yalnız son kat degil, suyla çalışan sistemdir.",
      },
      {
        parameter: "Görsel kalite kabulü",
        limitOrRequirement: "Yan isik, derz hatlari ve köşe dogrulugu birlikte kontrol edilmelidir",
        reference: "Teslim kalite plani",
        note: "Yüzey kalitesi tek acidan bakilarak onaylanmamalidir.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal kullanimina göre uygun duvar kaplama sistemini ve temizlenebilirlik beklentisini belirle.",
      "Kaplama öncesi duvari nem, duzlugu ve aderans acisindan kabul etmeden montaja gecme.",
      "Köşe, niş, armatür, buat ve kapı kenarlari için modul planini sahaya isle.",
      "Yapıştırıcı, derz ve yardimci profilleri mahal kosuluna göre secerek katmanlari uyumlu kur.",
      "Kaplamayi genis yüzey kadar kritik bitis dugumlerinde de aynı kaliteyle tamamla.",
      "Teslim öncesi yan isik, derz hatlari ve modul butunlugunu kontrol ederek kabul ver.",
    ],
    criticalChecks: [
      "Alt yüzey düzgün ve kaplamaya hazir durumda mi?",
      "Modul plani köşe ve nislerde bozuluyor mu?",
      "Islak hacimlerde sistem secimi mahal kullanimina uygun mu?",
      "Derz cizgileri ve bitisler tüm duvar boyunca temiz mi?",
      "Yan isikta dalga ve sehim benzeri goruntu bozukluklari cikiyor mu?",
      "Numune mahal standardi tüm uygulamaya tasinabildi mi?",
    ],
    numericalExample: {
      title: "240 cm duvarda modul plani yorumu",
      inputs: [
        { label: "Duvar genisligi", value: "240 cm", note: "Banyo ana duvari" },
        { label: "Kaplama olcusu", value: "60 x 120 cm", note: "Dikey duvar fayansi senaryosu" },
        { label: "Derz araligi", value: "2 mm", note: "Ince derz uygulama" },
        { label: "Hedef", value: "Köşe ve merkezde simetrik goruntu", note: "Dar parca riskini azaltmak" },
      ],
      assumptions: [
        "Tesisat cikislari ve niş konumu modul planina dahil edilmistir.",
        "Kaplama merkez aksa göre baslatilacaktir.",
        "Köşe donusleri detayla cozulmustur.",
      ],
      steps: [
        {
          title: "Modul uygunlugunu oku",
          result: "240 cm, 60 cm genislikteki modul ile simetrik bir başlangıç için avantaj saglar.",
          note: "Bu avantaj plansiz baslangicla kolayca kaybedilebilir.",
        },
        {
          title: "Tesisat ve niş etkisini ekle",
          result: "Armatür ve niş yerleri merkez aksa göre kayiyorsa tam modul avantaji bozulabilir.",
          note: "Modul karari yalnız duvar genisligine göre verilmez.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Duvar kaplamasinda iyi goruntu, kutu acilmadan once yapilan modul ve dugum planlamasi ile kazanilir.",
          note: "Ustun urun, zayif modul planiyla kurtarilamaz.",
        },
      ],
      checks: [
        "Modul plani tesisat cikislari ve nislerle birlikte okunmalidir.",
        "Köşe ve bitislerde dar parca riski baslamadan once giderilmelidir.",
        "Derz cizgileri mahal boyunca sureklilik gostermelidir.",
        "Numune panel veya numune duvar ortak kalite dili kurmak için kullanilmalidir.",
      ],
      engineeringComment: "Duvar kaplamasinda en iyi sonuc, urun duvara gelmeden once modul ve detay karari verildiginde elde edilir.",
    },
    tools: WALL_TOOLS,
    equipmentAndMaterials: WALL_EQUIPMENT,
    mistakes: [
      { wrong: "Duvar kaplamasini yalnız urun secimi sanmak.", correct: "Altlik, modul ve bitis detaylarini aynı sistem olarak ele almak." },
      { wrong: "Modul planini sahada usta kararina birakmak.", correct: "Köşe, niş ve tesisat detaylarini önceden cizerek baslamak." },
      { wrong: "Alt yüzey dalgalarini son katta gizlemeye çalışmak.", correct: "Siva ve tesviye kalitesini once kabul etmek." },
      { wrong: "Islak hacim ile kuru hacmi aynı detay refleksiyle uygulamak.", correct: "Su ve bakım davranisina göre sistem secmek." },
      { wrong: "Kabulu yalnız on cepheden bakarak yapmak.", correct: "Yan isik ve hat kontrolu ile teslim kalitesini dogrulamak." },
      { wrong: "Numune mahal olusturmadan tüm uygulamaya baslamak.", correct: "Tekrarlanabilir kalite için numune ile standart belirlemek." },
    ],
    designVsField: [
      "Projede duvar kaplamasi renk ve kod ile görünür; sahada ise aynı karar modul, derz ve köşe kalitesiyle sonuclanir.",
      "Iyi duvar kaplamasi dikkat cekmeden temiz görünür; kötü kaplama ise ilk bakista derz ve bitis hatalariyla kendini ele verir.",
      "Bu nedenle duvar kaplamalari, ince islerin en acik kalite aynalarindan biridir.",
    ],
    conclusion: [
      "Duvar kaplamalari doğru altlik, doğru modul ve doğru bitis disiplinleriyle uygulandiginda uzun omurlu ve temiz bir son kat kalitesi uretir. Bu halkalardan biri zayif kaldiginda ise kusur en görünür yuzeyde ortaya cikar.",
      "Bir insaat muhendisi için en saglam yaklasim, duvar kaplamasini dekoratif secim degil; alt yüzey kalitesini ve detay disiplinini test eden teknik bir son kat olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.tsEn13914, SOURCE_LEDGER.tsEn12004],
    keywords: ["duvar kaplamalari", "modul plani", "TS EN 12004", "siva altligi", "duvar bitisleri"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari/fayans", "ince-isler/duvar-kaplamalari/boya", "ince-isler/siva"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/fayans",
    kind: "topic",
    quote: "Fayans uygulamasi, karo dizmek degil; modul, su riski ve detay kalitesini duvarda milimetrik olarak yonetmektir.",
    tip: "Fayansi yalnız yapıştırıcı ve usta hizina baglamak, altlik, modul ve islak hacim detaylarini ihmal etmektir.",
    intro: [
      "Fayans uygulamasi özellikle banyo, wc, mutfak ve servis hacimlerinde hem hijyen hem de temizlenebilirlik acisindan kritik bir duvar kaplama cozumudur. Ancak iyi bir fayans uygulamasi yalnız doğru urunu secmekle baslamaz; duvar altliginin kalitesi, modul karari, armatür ve niş detaylari ile birlikte olgunlasir.",
      "Sahadaki en yaygin hata, fayansi kutudan ciktigi gibi duvara dizilecek bir parca gibi gormektir. Oysa karo olcusu, duvar modulasyonu, suya maruz kalan bolgeler, tesisat cikislari ve derz devamlligi birlikte dusunulmezse pahali urun bile zayif bir sonuca donusebilir.",
      "Bir insaat muhendisi için fayans isi, yalnız seramik ekibinin isi degildir. Islak hacimlerde su davranisi, doğrama ve armatür bitisleri, sap ve siva toleransi, hatta duvardaki elektrik ve mekanik kutu yerleri bile bu kaliteyi etkiler. Bu nedenle fayans, onceki disiplinlerin bir araya geldigi bir teslim testidir.",
      "Bu rehberde fayansi; teorik temel, standart ekseni, sayisal modul ornegi, saha ekipmanlari ve sık yapilan hatalarla birlikte akici bir blog yazisi olarak ele aliyoruz.",
    ],
    theory: [
      "Fayans performansi duvarla kurdugu bag kadar modul duzeniyle de ilgilidir. TS EN 12004 eksenindeki yapıştırıcı secimi ve uygulama kalitesi seramiklerin duvarda kalmasini saglar; estetik ve kullanis kalitesi ise derz ritmi, köşe donusleri ve armatür cevresindeki kesim detaylariyla belirlenir. Bu nedenle fayans yalnız aderans konusu degil, geometri konusudur.",
      "Islak hacimlerde su ve temizlik davranisi da fayansin ayrilmaz parcasidir. Duvarda gorunen karo son katmandir; alttaki yüzey hazirligi, uygun yapıştırıcı ve derz sistemi olmadan bu son kat tek basina guvenli davranmaz. Buhar, temizlik kimyasali ve gunluk su sicrama etkileri bu detaylari uzun vadede test eder.",
      "Modul plani burada anahtar rol oynar. Koseye ince parca getiren, nisin ortasinda dengesiz kesim yaratan veya armatürü derz aksindan koparan baslangiclar sonradan duzeltilemez. Fayans isi bu nedenle kutu acilmadan once cozulmesi gereken bir geometri problemidir.",
      "Yüzey hazirligi de aynı derecede onemlidir. Dalgali veya kötü siva ustune fazla yapıştırıcı ile duzeltme yapmak hem aderansi hem de bitis kalitesini bozar. Bu bakisla fayans uygulamasi, küçük parcali bir son kat gibi gorunse de islak hacim kalitesini en net gosteren teknik bitis sistemlerinden biridir.",
    ],
    ruleTable: [
      {
        parameter: "Yapıştırıcı ve sistem uyumu",
        limitOrRequirement: "Fayans kaplamasi mahal kosuluna ve alt yuzeye uygun yapıştırıcı sistemi ile uygulanmalidir",
        reference: "TS EN 12004",
        note: "Islak hacim ve kuru hacim aynı sistem refleksiyle gecilemez.",
      },
      {
        parameter: "Alt yüzey duzlugu",
        limitOrRequirement: "Siva veya altlik, fayans modulunu bozmayacak duzlukte olmalidir",
        reference: "TS EN 13914 + saha kalite plani",
        note: "Yapıştırıcı kalinligi ile duvar geometri hatasi kapatilmaya calisilmamalidir.",
      },
      {
        parameter: "Modul ve bitis detaylari",
        limitOrRequirement: "Köşe, niş, buat ve armatür detaylari uygulama öncesi modul planiyla cozulmelidir",
        reference: "Detay paftasi ve numune mahal",
        note: "Dar parca ve sasmiş derz cizgileri başlangıç kararinin sonucudur.",
      },
      {
        parameter: "Derz ve islak hacim performansi",
        limitOrRequirement: "Derz sistemi mahalin su ve temizlik davranisina uygun secilmeli, bosluk birakilmamalidir",
        reference: "Mahal kullanım senaryosu",
        note: "Derz kalitesi yalnız görsel degil, servis omru konusudur.",
      },
      {
        parameter: "Kabul ve temizlik",
        limitOrRequirement: "Derz hatlari, köşe dogrulugu ve seramik yuzeyi teslim öncesi ayrintili kontrol edilmelidir",
        reference: "Teslim kalite plani",
        note: "Lekeli, kirik veya dengesiz hatli fayans teslim kusuru olarak geri doner.",
      },
    ],
    designOrApplicationSteps: [
      "Fayans olcusu, niş, armatür ve mahal genisligini birlikte okuyarak modul planini baslamadan once netlestir.",
      "Duvar altligini duzluk ve aderans acisindan kabul et; zayif sivayi yapıştırıcı ile telafi etmeye çalışma.",
      "Yapıştırıcı, derz ve yardimci profilleri mahal kosuluna göre secerek sistemi butun olarak kur.",
      "Köşe, buat, armatür ve doğrama cevresi gibi noktalari genel duvardan ayri kalite kalemi gibi ele al.",
      "Derzleri tek ritimle ve temiz boslukla doldur; yüzey temizligini uygulama ile aynı anda yonet.",
      "Teslim öncesi yan isik, armatür hizlari ve köşe butunlugunu kontrol ederek son kabul yap.",
    ],
    criticalChecks: [
      "Modul plani köşe ve nislerde dar parca birakiyor mu?",
      "Alt duvar düzgün ve aderansli durumda mi?",
      "Armatür ve buat cikislari derz ve modul ile uyumlu mu?",
      "Derz hatlari tüm duvarda aynı ritimde ilerliyor mu?",
      "Kirik, cizik veya renk tonu farki olusturan karolar var mi?",
      "Yüzey teslim öncesi temiz, bosluksuz ve okunur durumda mi?",
    ],
    numericalExample: {
      title: "60 x 120 cm fayans ile 240 cm duvarda modul yorumu",
      inputs: [
        { label: "Duvar genisligi", value: "240 cm", note: "Banyo ana duvari" },
        { label: "Karo olcusu", value: "60 x 120 cm", note: "Dikey uygulama" },
        { label: "Derz araligi", value: "2 mm", note: "Ince derz uygulama" },
        { label: "Hedef", value: "Simetrik ve temiz köşe bitisi", note: "Dar parca riskini azaltmak" },
      ],
      assumptions: [
        "Duvar merkez aksa göre baslatilacaktir.",
        "Armatür ve niş konumlari modul planina dahil edilmistir.",
        "Köşe donusleri tanimli detayla cozulmustur.",
      ],
      steps: [
        {
          title: "Modul uygunlugunu oku",
          result: "240 cm, 60 cm modul ile simetrik bir başlangıç için avantaj saglar.",
          note: "Bu avantaj plansiz baslangicla kolayca kaybedilebilir.",
        },
        {
          title: "Tesisat ve niş etkisini ekle",
          result: "Armatür ve niş yerleri merkez aksa göre kayiyorsa tam modul avantaji bozulabilir.",
          note: "Fayans kaliteli gorunsun diye tesisati degil, modul planini önceden cozumlemek gerekir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Fayans uygulamasinda iyi goruntu, kutu acilmadan once verilen modul ve detay kararindan dogar.",
          note: "Uygulama hizi bu kararin yerine gecemez.",
        },
      ],
      checks: [
        "Modul plani tesisat, niş ve köşe detaylariyla birlikte okunmalidir.",
        "Köşe ve bitislerde dar parca riski uygulama öncesi giderilmelidir.",
        "Derz cizgileri tek duvarda oldugu kadar mahal butununde de sureklilik gostermelidir.",
        "Numune duvar ortak kalite seviyesini sabitlemek için kullanilmalidir.",
      ],
      engineeringComment: "Fayans isinde kalite, seramik kutusunu actiktan sonra degil modul kararini verdiginiz anda kazanilir ya da kaybedilir.",
    },
    tools: WALL_TOOLS,
    equipmentAndMaterials: WALL_EQUIPMENT,
    mistakes: [
      { wrong: "Fayansi kutudan ciktigi gibi uygulamaya baslamak.", correct: "Modul, niş ve armatür planini once kurmak." },
      { wrong: "Alt duvar bozuklugunu yapıştırıcı ile kapatmaya çalışmak.", correct: "Altligi once kabul edip gerektiginde duzeltmek." },
      { wrong: "Derz kalitesini yalnız goruntu konusu sanmak.", correct: "Derzi servis omru ve temizlik performansinin parçası olarak gormek." },
      { wrong: "Köşe ve bitisleri sahada uydurmak.", correct: "Bu dugumleri uygulama baslamadan once detaylandirmak." },
      { wrong: "Islak hacim davranisini urun seciminden ayri dusunmek.", correct: "Yapıştırıcı, derz ve altlik kararlarini mahal kosuluyla birlikte vermek." },
      { wrong: "Teslim öncesi temizligi ve kirik kontrolunu hafife almak.", correct: "Fayansi uygulama kadar kabul sureciyle de yonetmek." },
    ],
    designVsField: [
      "Projede fayans kodu ve boyutu görünür; sahada ise aynı karar modul, derz, köşe ve tesisat hizlariyla anlam kazanir.",
      "Iyi fayans uygulamasi temiz bir ritim ve sessiz detay uretir; kötü uygulama ise ilk bakista sasmiş hatlariyla kendini belli eder.",
      "Bu nedenle fayans, islak hacim kalitesinin en net gostergelerinden biridir.",
    ],
    conclusion: [
      "Fayans uygulamasi doğru altlik, doğru modul ve doğru detay disiplinleriyle yapildiginda hem hijyenik hem de uzun omurlu bir son kat kalitesi sunar. Bu halkalardan biri zayif kaldiginda kusur en görünür yerde ortaya cikar.",
      "Bir insaat muhendisi için en saglam bakis, fayansi karo montaji degil; islak hacim ve duvar geometri kalitesini test eden teknik bir bitis sistemi olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.tsEn12004, SOURCE_LEDGER.tsEn13914],
    keywords: ["fayans", "duvar fayansi", "TS EN 12004", "modul plani", "islak hacim kaplamasi"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/boya", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
];
