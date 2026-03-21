import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_MASONRY_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const MASONRY_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Mimari aks, bosluk ve modul paftalari", purpose: "Duvar eksenini, lento kararini ve kesim noktalarini uygulama oncesi netlestirmek." },
  { category: "Olcum", name: "Lazer terazi, sakul, mastar ve ip seti", purpose: "Duseylik, duzlem ve derz ritmini duvar boyunca izlemek." },
  { category: "Koordinasyon", name: "Elektrik-mekanik chase ve buat matrisi", purpose: "Plansiz kirim yerine duvar imalatiyla birlikte tesisat koordinasyonu kurmak." },
  { category: "Kontrol", name: "Mahal bazli duvar kabul cizelgesi", purpose: "Siva, dograma ve kaplama oncesi duvar kalitesini standartlastirmak." },
];

const MASONRY_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Malzeme", name: "Tugla veya briket birimleri, orgu harci ve yardimci baglanti elemanlari", purpose: "Dolgu duvari dogru modul ve derz düzeniyle kurmak.", phase: "Duvar orumu" },
  { group: "Olcum", name: "Sakul, lazer, metre ve derz kontrol ekipmanlari", purpose: "Aks, dusaylik ve bitis bosluklarini sürekli takip etmek.", phase: "Surekli kontrol" },
  { group: "Kesim", name: "Kesim tezgahi, el aletleri ve kontrollu kenar tamamlama ekipmani", purpose: "Aciklik ve kenar detaylarinda kırık parcaya mecbur kalmamak.", phase: "Aciklik detaylari" },
  { group: "Koordinasyon", name: "Lento, ankraj, kilif ve gecis parcalari", purpose: "Acikliklari ve betonarme-temas detaylarini guvenli ve temiz tamamlamak.", phase: "Detay ve koordinasyon" },
];

export const kabaInsaatMasonryOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/duvar-orme/tugla-duvar",
    kind: "topic",
    quote: "Tugla duvar tanidik bir imalattir; ama sahadaki en pahali hatalari da genellikle bu tanidiklik yuzunden üretir.",
    tip: "Tuglada kalite sorunu çoğu zaman malzemenin kendisinden degil, modul, derz ve tesisat koordinasyonunun hafife alinmasindan dogar.",
    intro: [
      "Tugla duvar, konut ve ticari yapilarda halen en yaygin dolgu duvar cozumlerinden biridir. Temin kolayligi, usta alışkanligi ve tanidik uygulama dili nedeniyle hızlı tercih edilir. Ancak bu tanidiklik çoğu zaman kalite riskini görünmez kilar; 'nasil olsa yapilir' denilen işlerde hatalar tekrar eder.",
      "Sahada tugla duvarla ilgili en sik görülen problemler; duvar düzleminin dalgalanmasi, derz ritminin bozulmasi, açiklik kenarlarinda zayif ve kırik parçalar birakilmasi, kolon temaslarinda catlak ve tesisat için sonradan gelişi güzel kirim yapilmasidir. Bu hatalarin çoğu malzeme seciminden değil, uygulama sırasının disiplinli kurgulanmamasından doğar.",
      "Bir insaat muhendisi icin tugla duvar, tasiyici olmayan ikincil iş gibi görünse de bitiş kalitesini, dograma montajini, siva kalınlığını ve tesisat koordinasyonunu doğrudan etkiler. Kötü örülmüş bir tugla duvar kendini o gün değil, sonraki tüm ekipler geldikçe belli eder.",
      "Bu nedenle tugla duvar işini yalniz usta alışkanlığına bırakmak yerine, aks, modul, derz, boşluk ve birleşim detayları açısından sistematik biçimde yönetmek gerekir.",
    ],
    theory: [
      "Tugla, nispeten küçük birim elemanlardan oluştugu için duvar davranışında derz düzeni belirleyicidir. Yatay ve düşey derzlerdeki süreksizlik, duvarın kendi geometri doğruluğunu bozduğu gibi siva altında ilave kalınlık ihtiyaci ve lokal çatlak riski de üretir. Bu yüzden tuglada hızdan önce ritim gelir.",
      "Malzemenin su emme davranışı da önemlidir. Fazla kuru veya kontrolsüz ıslatılmış tugla, harc ile ilişkiyi zayıflatabilir. Saha pratiğinde birimlerin çevre koşuluna göre doğru hazırlanması, kağıt üzerindeki malzeme kalitesinden daha fazla fark yaratabilir. Aderans kalitesi, sonraki siva katmanının da davranışını etkiler.",
      "Tugla duvarın betonarme çerçeve içindeki davranışı da ihmal edilmemelidir. Kolon ve kirişlerle farklı rötre ve deformasyon karakterine sahip olduğu için en zayıf çizgiler malzeme değişim hatlarında oluşur. Bu yüzden pencere köşeleri, kolon temasları ve lento bölgeleri özel dikkat ister.",
      "Ayrica tugla duvar, tesisat için en çok müdahale gören dolgu tiplerinden biridir. Plansız buat ve kanal kirimlari, duvarın düzenini ve yüzey kalitesini hizla bozar. Bu nedenle tugla duvar işi, elektrik ve mekanik ekipleriyle birlikte planlanan bir koordinasyon imalatı olarak ele alınmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Derz ritmi ve modul",
        limitOrRequirement: "Yatay ve dusey derz duzeni duvar boyunca kontrollu ve tekrarlanabilir olmali",
        reference: "Saha uygulama disiplini",
        note: "Derz ritmi bozuldugunda duvar duzlemi ve siva kalitesi birlikte zarar gorur.",
      },
      {
        parameter: "Acilik ve kesim parcalari",
        limitOrRequirement: "Kapi-pencere kenarlarinda dar ve kirik parca birakmadan kontrollu kesim uygulanmali",
        reference: "Mimari bosluk detayi",
        note: "Aciklik kenarlari duvarin en zayif ve en gorunur bolgeleridir.",
      },
      {
        parameter: "Betonarme ile birlesim",
        limitOrRequirement: "Kolon ve kiris temaslarinda catlak riskini azaltacak detay ve kabul disiplini kurulmalı",
        reference: "Saha birlesim pratiği",
        note: "Malzeme degisim hattı, yüzey kusurunun en hızlı oluştugu bölgedir.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Buat, kanal ve gecisler duvar orme sirasinda tanimlanmali",
        reference: "Koordinasyon matrisi",
        note: "Duvar bittikten sonra rastgele kirim yapmak kaliteyi katlayarak bozar.",
      },
      {
        parameter: "Bosluk ve net ölçü",
        limitOrRequirement: "Dograma bosluklari siva ve montaj payi birlikte dusunulerek tamamlanmali",
        reference: "Mimari detay + saha kabul",
        note: "Net geçiş kararı yalnız kaba boşluk ölçüsüyle okunmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Tugla tipini, duvar kalinligini ve mahal bazli açiklik kararlarini uygulama öncesi netleştir.",
      "Ilk sirayi kot, aks ve ip referansi ile kur; köşeleri tüm duvarın ana sabiti olarak kabul et.",
      "Duvar ilerlerken derz ritmini koru, açiklik kenarlarinda kontrollu kesim kullan ve rastgele kırık parçayı reddet.",
      "Kolon, kiriş ve pencere köşelerinde catlak riski yaratacak zayif çizgileri erken fark edip detayını uygula.",
      "Elektrik ve mekanik ekipleriyle buat, kanal ve cihaz yerlerini duvar bitmeden netleştir.",
      "Siva ve dograma oncesi duvarı mastar, boşluk ve yüzey sürekliliği açısından ayrı bir kalite turundan geçir.",
    ],
    criticalChecks: [
      "Ilk sira ve köşe doğruluğu tüm duvar boyunca korunuyor mu?",
      "Derz kalinligi ve yatay-düşey ritim duvar boyunca tutarli mi?",
      "Aciklik kenarlarinda zayif dar parça veya kırık birim kaldi mi?",
      "Kolon ve kiriş birleşimlerinde catlak riski yaratacak hatlar görüldü mü?",
      "Tesisat için sonradan kirma ihtiyaci doguyor mu?",
      "Siva kalinligini gereksiz büyütecek dalga veya şaşkınlık var mı?",
    ],
    numericalExample: {
      title: "4,20 m duvarda kapi boslugu etrafinda modul karari",
      inputs: [
        { label: "Toplam duvar boyu", value: "420 cm", note: "Ic mekan tugla duvari" },
        { label: "Kapi kaba boslugu", value: "90 cm", note: "Dograma oncesi açiklik" },
        { label: "Modul varsayimi", value: "20 cm", note: "Tugla + derz için örnek saha modulu" },
        { label: "Hedef", value: "Dar kesim parcasi birakmamak", note: "Temiz uygulama için" },
      ],
      assumptions: [
        "Bosluk duvar ortasina yakin konumlandirilmistir.",
        "Kontrollu kesim ekipmani ve yeterli usta disiplini vardir.",
        "Dograma olcusu kesinlesmistir ve bosluk revizyonu imkani sınırlıdır.",
      ],
      steps: [
        {
          title: "Net duvar uzunlugunu hesapla",
          formula: "420 - 90 = 330 cm",
          result: "Bosluk disinda kalan net orgu boyu 330 cm olur.",
          note: "Bu boy iki yana dagitilacak tugla modullerini belirler.",
        },
        {
          title: "16 tam modul secenegini test et",
          formula: "330 - (16 x 20) = 10 cm",
          result: "16 tam modul kullanilirsa iki yanda 5'er cm parca kalir.",
          note: "5 cm kenar parcasi zayif ve uygunsuz kabul edilir.",
        },
        {
          title: "15 tam modul secenegini yorumla",
          formula: "330 - (15 x 20) = 30 cm",
          result: "15 tam modul kullanilirsa iki yanda 15'er cm kesim parcasi kalir.",
          note: "15 cm parca saha ve dayanım açısından daha makul, daha kontrollu bir cozum sunar.",
        },
      ],
      checks: [
        "Modul plani, yalnız toplam boyu değil kenarda kalacak en küçük parçayı da dikkate almalıdır.",
        "Dar parça riskinde boşluk konumu veya modul karari yeniden düşünülmelidir.",
        "Kesim karari kontrollu ekipmanla uygulanmali, kırık parça ile tamamlanmamalıdır.",
        "Dograma toleransi ve siva payi, modul hesabindan ayrı düşünülmemelidir.",
      ],
      engineeringComment: "Tugla duvarda birkaç santimetrelik kesim karari, sonradan dograma ve siva ekibinin gunlerini etkileyebilir.",
    },
    tools: MASONRY_TOOLS,
    equipmentAndMaterials: MASONRY_EQUIPMENT,
    mistakes: [
      { wrong: "Ilk sirayi goz karari ilerletmek.", correct: "Ilk sirayi tum duvarin referansi olarak hassas kurmak." },
      { wrong: "Aciklik kenarlarini kirik veya cok dar parcalarla tamamlamak.", correct: "Modul planini bastan yapip kontrollu kesim kullanmak." },
      { wrong: "Tesisat icin duvar bittikten sonra rastgele kanal kirimak.", correct: "Gecisleri duvar orumu ile birlikte planlamak." },
      { wrong: "Kolon-duvar temasini kucuk detay saymak.", correct: "Malzeme degisim hattini catlak riski olarak ayri takip etmek." },
      { wrong: "Siva duzeltir diye dalgali duvari kabul etmek.", correct: "Duvari kendi asamasinda duz teslim etmek." },
      { wrong: "Dograma bosluklarini yalniz kaba olcu ile onaylamak.", correct: "Montaj ve siva payini birlikte kontrol etmek." },
    ],
    designVsField: [
      "Projede tugla duvar bir tarama alanı gibi görünür; sahada ise dograma, tesisat ve siva toleranslarini tasiyan hassas bir koordinasyon yüzeyidir.",
      "Tasarimda basit görünen bir açiklik karari, uygulamada kesim parçasi, lento, tesisat ve net geçiş kalitesi olarak katmanlı sonuç üretir.",
      "Bu nedenle tugla duvar, klasik ama hafife alinmaması gereken bir saha mühendisliği işidir.",
    ],
    conclusion: [
      "Tugla duvar dogru modul, dogru derz ve dogru koordinasyonla uygulandiginda temiz, okunabilir ve bitiş ekiplerini zorlamayan bir dolgu duvar üretir. Aynı iş disiplin kaybettiginde ince işlerde en çok düzeltme isteyen yüzeylerden birine dönüşür.",
      "Saha tarafinda en saglam yaklasim, tugla duvarı usta alışkanlığına bırakmamak ve onu aks, boşluk, derz ve birleşim mantığı ile yönetmektir. Bu yaklaşım, tekrar işçiligi ciddi biçimde azaltır.",
    ],
    sources: [...KABA_MASONRY_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["tugla duvar", "dolgu duvar", "modul plani", "derz duzeni", "saha toleransi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "kaba-insaat/duvar-orme/ytong-gazbeton"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/briket",
    kind: "topic",
    quote: "Briket duvar hizli yukselir; ama modulu, agirligi ve tesisat müdahaleleri dogru yönetilmezse en sert görünümlü duvar bile zayif davranir.",
    tip: "Brikette sorun sadece yüzey dalgasi degildir; kotu kesim, zayif alt sira ve sonradan acilan kanallar duvarin butun mantigini bozar.",
    intro: [
      "Briket duvar, özellikle kalinlik, ekonomik temin ve uygulama hizi nedeniyle birçok projede tercih edilen bir dolgu duvar tipidir. Fakat daha büyük modullu ve nispeten daha ağır bir eleman olması, ona 'kolay' imalat görüntüsü verse de saha yönetimini basitleştirmez. Tersine, yanlış kararlar daha büyük boyutlu kusurlara dönüşebilir.",
      "Sahada briket duvarlarda en sık görülen problemler; ilk sırada kot kaçması, geniş modül nedeniyle yanlış boşluk kararları, köşe ve pencere kenarlarında zayıf kesimler, tesisat için sonradan açılan geniş kanallar ve ağır birimlerin neden olduğu yüzey oturmalarıdır. Bunlar duvar tamamlandığında değil, kaplama ve kullanım sürecinde daha görünür hale gelir.",
      "Bir insaat muhendisi icin briket duvarın önemi, yalnız metraj veya hız hesabı değildir. Briket duvar, döşeme üstündeki ek yükü, akustik beklentiyi, sıva davranışını ve mekanik-elektrik koordinasyonunu birlikte etkiler. Bu yüzden uygulama kalitesi kadar planlama kalitesi de kritik hale gelir.",
      "Briketi yalnız kalın ve sağlam görünen bir blok olarak değerlendirmek yeterli değildir; sistem ancak doğru oturur, doğru kesilir ve doğru teslim edilirse avantaj üretir.",
    ],
    theory: [
      "Briket duvarlarda birim eleman modülü büyüdükçe kesim stratejisi daha kritik hale gelir. Küçük parçalarla kenar tamamlama, tuglaya göre daha da sorunludur; çünkü parça büyüklüğü ve boşluk oranı duvarın kenar kalitesini hızlı biçimde zayıflatır. Bu nedenle briket duvarda boşluk planı uygulama başlamadan önce çözülmelidir.",
      "Briketin görece daha yüksek ağırlığı ve geniş yüzeyleri, ilk sıra doğruluğunu daha önemli kılar. İlk sıradaki küçük kot kaçması üst sıralarda büyür ve siva kalınlığını artırır. Ayrıca büyük modül nedeniyle dalga ve sakul hatası gözle de daha belirgin hale gelir.",
      "Tesisat müdahalesi de briket duvarlarda kritik konulardandır. Daha büyük ve kalın eleman hissi, sahada plansız kanal açmayı meşrulaştırıyormuş gibi algılanabilir; oysa geniş ve derin chase işlemleri duvarın bütünlüğünü ve yüzey dayanımını zayıflatır. Bu nedenle elektrik buatları ve mekanik geçişler önceden tasarlanmalıdır.",
      "Briket duvarın performansı yalnız duvar örme anında değil, sonraki siva, boya ve kullanım sürecinde okunur. Temiz örülmeyen, modulsüz kurulan ve sonradan çok müdahale gören briket duvar, ağır görünmesine rağmen uzun vadede problemli bir yüzey haline gelir.",
    ],
    ruleTable: [
      {
        parameter: "Modul ve kesim planı",
        limitOrRequirement: "Briket modulu, bosluk ve kenar parçaları uygulama öncesi çözümlenmeli",
        reference: "Mimari bosluk detayi + saha planlama",
        note: "Büyük modullu malzemede plansız kesim daha büyük kalite kaybı üretir.",
      },
      {
        parameter: "Ilk sira ve dusaylik",
        limitOrRequirement: "Ilk sira kot ve eksende hassas kurulmalı, duvar sakulu sürekli kontrol edilmeli",
        reference: "Saha uygulama disiplini",
        note: "Brikette ilk sıra hatası üst sıralarda katlanarak görünür olur.",
      },
      {
        parameter: "Acilik ve lento bölgeleri",
        limitOrRequirement: "Pencere ve kapi kenarlarında zayif kesim parcasi bırakmadan detay tamamlanmalı",
        reference: "Mimari detay + uygulama kabulü",
        note: "Acilik kenarlari hem yapisal hem görsel olarak en hassas bölgelerdir.",
      },
      {
        parameter: "Tesisat müdahalesi",
        limitOrRequirement: "Kanal ve buat yerleri önceden planlanmalı, sonradan genis kirimdan kaçinılmalı",
        reference: "Koordinasyon matrisi",
        note: "Briket duvarda plansız chase işlemi zayıf ve dağınık yüzey üretir.",
      },
      {
        parameter: "Bitiş öncesi kabul",
        limitOrRequirement: "Siva öncesi duzlem, bosluk, çatlak ve tesisat tamirleri mahal bazında kontrol edilmeli",
        reference: "Mahal bazli teslim cizelgesi",
        note: "Briket yüzeyindeki sorunlar üst kaplamada daha pahalı düzeltilir.",
      },
    ],
    designOrApplicationSteps: [
      "Briket ölçüsünü, duvar kalınlığını ve açiklik kararlarını mahal bazında uygulama öncesi netleştir.",
      "İlk sırayı kot ve aks referanslarıyla kur; köşe bloklarını bütün duvar için sabit referans kabul et.",
      "Açiklik çevresinde kontrolsüz küçük parça bırakmamak için modul planını önceden yap.",
      "Elektrik ve mekanik ekipleriyle buat, kanal ve geçiş noktalarını duvar ilerlemeden kilitle.",
      "Duvar tamamlandığında siva ekibine geçmeden önce mastar, sakul, boşluk ve tamir kontrolü yap.",
      "Gerekli tamirleri lokal yama mantığıyla değil, yüzey sürekliliğini bozmadan tamamla.",
    ],
    criticalChecks: [
      "Briket modulu açiklik çevresinde zayıf kesim parcasi bırakıyor mu?",
      "İlk sıra ve köşeler tüm duvar boyunca kot ve eksenini korudu mu?",
      "Tesisat için sonradan geniş chase açılması gerekecek noktalar var mı?",
      "Kolon veya kiriş temaslarında çatlak riski yaratan zayıf yüzeyler oluştu mu?",
      "Siva kalinligini gereksiz artıracak yüzey dalgası var mı?",
      "Duvarın teslimi öncesi buat ve kanal tamirleri gerçekten kapatıldı mı?",
    ],
    numericalExample: {
      title: "4,90 m duvarda pencere acikligi icin briket modul karari",
      inputs: [
        { label: "Toplam duvar boyu", value: "490 cm", note: "Dis veya ic bölme duvari" },
        { label: "Pencere kaba boslugu", value: "100 cm", note: "Ornek aciklik" },
        { label: "Briket modulu", value: "40 cm", note: "Briket + derz için örnek modül" },
        { label: "Hedef", value: "Dar kenar parçasi bırakmamak", note: "Temiz bitiş için" },
      ],
      assumptions: [
        "Pencere konumu revize edilebilir ya da modul merkezlenerek uygulanabilir durumdadir.",
        "Kesimler kontrollu ekipmanla yapilacaktir.",
        "Lento ve denizlik karari netleşmiştir.",
      ],
      steps: [
        {
          title: "Net orgu boyunu hesapla",
          formula: "490 - 100 = 390 cm",
          result: "Pencere disinda kalan net duvar boyu 390 cm olur.",
          note: "Bu boy iki yana dagitilacak briket modullerini belirler.",
        },
        {
          title: "9 tam modul secenegini test et",
          formula: "390 - (9 x 40) = 30 cm",
          result: "9 tam modul kullanildiginda iki yanda 15'er cm kesim parcasi kalir.",
          note: "15 cm parca, saha uygulamasi icin kontrollu ve kabul edilebilir bir karardir.",
        },
        {
          title: "10 tam modul secenegini yorumla",
          formula: "390 - (10 x 40) = -10 cm",
          result: "10 tam modul fiziksel olarak sigmaz; bu nedenle zorlanmis kesim karari uretir.",
          note: "Brikette modul zorlamasi, köşelerde zayıf parça ve kirik kesim olarak geri döner.",
        },
      ],
      checks: [
        "Briket modulu, açiklik planı ile birlikte düşünülmelidir; sonradan kesimle kurtarma güvenli değildir.",
        "Kontrollü görünen 15 cm parça dahi saha kesim kalitesiyle birlikte değerlendirilmelidir.",
        "Pencere merkezi ve denizlik-lento detayı modul kararından ayrı değildir.",
        "Tesisat geçişleri bu geometriyi sonradan bozmayacak şekilde planlanmalıdır.",
      ],
      engineeringComment: "Briket duvarda modul karari ne kadar erken verilirse, sonradan kirik parca ve zayif kenar üretme ihtiyaci o kadar azalir.",
    },
    tools: MASONRY_TOOLS,
    equipmentAndMaterials: MASONRY_EQUIPMENT,
    mistakes: [
      { wrong: "Briketi büyük modullu diye plansiz örmek.", correct: "Acilik ve kenar parçalarini bastan modul planina baglamak." },
      { wrong: "İlk sıra kot hatasını üstte düzeltmeye çalışmak.", correct: "İlk sırayı tüm duvar için ana referans kabul etmek." },
      { wrong: "Tesisat için sonradan geniş ve derin kanal açmak.", correct: "Buat ve geçişleri duvar imalatiyla birlikte koordine etmek." },
      { wrong: "Siva öncesi yüzey teslimini atlamak.", correct: "Mastar ve sakul kabulünü duvar aşamasında yapmak." },
      { wrong: "Açiklik kenarlarını küçük kırık parça ile tamamlamak.", correct: "Kesim kararını kontrollu ve dengeli modul ile vermek." },
      { wrong: "Briketin ağır görünmesini dayanım güvencesi sanmak.", correct: "Yüzey bütünlüğü ve planlı uygulamayı ana kalite kriteri saymak." },
    ],
    designVsField: [
      "Projede briket duvar bir kalınlık ve tarama olarak görünür; sahada ise modulu, boşluk ilişkisi ve tesisat müdahalesi kaliteyi belirler.",
      "Briket duvarın ağır ve rijit görünmesi, plansız uygulama hatalarını affettigi anlamina gelmez.",
      "Bu nedenle briket duvar, hem lojistik hem bitiş kalitesi açısından mühendislik dikkati isteyen bir dolgu sistemidir.",
    ],
    conclusion: [
      "Briket duvar dogru modul, dogru ilk sira ve dogru koordinasyon ile uygulandiginda temiz, sağlam görünen ve bitiş ekiplerini yormayan bir yüzey üretir. Plansız ilerlediğinde ise özellikle boşluk çevresi ve tesisat müdahalelerinde hızlı kalite kaybı yaşanır.",
      "Saha tarafinda en iyi sonuç, briket duvarı hız kalemi değil geometri ve koordinasyon kalemi olarak yöneten ekiplerde alınır. Bu yaklaşım, sonraki siva ve dograma işlerinde ciddi zaman kazandırır.",
    ],
    sources: [...KABA_MASONRY_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["briket duvar", "dolgu duvar", "modul karari", "tesisat koordinasyonu", "duvar kabul"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "kaba-insaat/duvar-orme/tugla-duvar"],
  },
];
