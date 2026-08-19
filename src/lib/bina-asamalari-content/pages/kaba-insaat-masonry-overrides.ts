import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_MASONRY_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const MASONRY_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Mimari aks, boşluk ve modul paftaları", purpose: "Duvar eksenini, lento kararini ve kesim noktalarini uygulama öncesi netlestirmek." },
  { category: "Ölçüm", name: "Lazer terazi, şakul, mastar ve ip seti", purpose: "Duseylik, duzlem ve derz ritmini duvar boyunca izlemek." },
  { category: "Koordinasyon", name: "Elektrik-mekanik chase ve buat matrisi", purpose: "Plansiz kırım yerine duvar imalatiyla birlikte tesisat koordinasyonu kurmak." },
  { category: "Kontrol", name: "Mahal bazli duvar kabul cizelgesi", purpose: "Siva, doğrama ve kaplama öncesi duvar kalitesini standartlastirmak." },
];

const MASONRY_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Malzeme", name: "Tuğla veya briket birimleri, örgü harci ve yardimci bağlantı elemanlari", purpose: "Dolgu duvari doğru modul ve derz düzeniyle kurmak.", phase: "Duvar örümü" },
  { group: "Ölçüm", name: "Şakul, lazer, metre ve derz kontrol ekipmanlari", purpose: "Aks, dusaylik ve bitis bosluklarini sürekli takip etmek.", phase: "Sürekli kontrol" },
  { group: "Kesim", name: "Kesim tezgahi, el aletleri ve kontrollu kenar tamamlama ekipmani", purpose: "Aciklik ve kenar detaylarinda kırık parcaya mecbur kalmamak.", phase: "Aciklik detaylari" },
  { group: "Koordinasyon", name: "Lento, ankraj, kilif ve geçiş parcalari", purpose: "Acikliklari ve betonarme-temas detaylarini güvenli ve temiz tamamlamak.", phase: "Detay ve koordinasyon" },
];

export const kabaInsaatMasonryOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/duvar-orme/tugla-duvar",
    kind: "topic",
    quote: "Tuğla duvar tanidik bir imalattir; ama sahadaki en pahali hatalari da genellikle bu tanidiklik yuzunden üretir.",
    tip: "Tuglada kalite sorunu çoğu zaman malzemenin kendisinden değil, modul, derz ve tesisat koordinasyonunun hafife alinmasindan dogar.",
    intro: [
      "Tuğla duvar, konut ve ticari yapilarda halen en yaygin dolgu duvar cozumlerinden biridir. Temin kolayligi, usta alışkanligi ve tanidik uygulama dili nedeniyle hızlı tercih edilir. Ancak bu tanidiklik çoğu zaman kalite riskini görünmez kilar; 'nasil olsa yapilir' denilen işlerde hatalar tekrar eder.",
      "Sahada tuğla duvarla ilgili en sık görülen problemler; duvar düzleminin dalgalanmasi, derz ritminin bozulmasi, açiklik kenarlarinda zayif ve kırik parçalar birakilmasi, kolon temaslarinda çatlak ve tesisat için sonradan gelişi güzel kırım yapilmasidir. Bu hatalarin çoğu malzeme seciminden değil, uygulama sırasının disiplinli kurgulanmamasından doğar.",
      "Bir inşaat mühendisi için tuğla duvar, taşıyıcı olmayan ikincil iş gibi görünse de bitiş kalitesini, doğrama montajini, siva kalınlığını ve tesisat koordinasyonunu doğrudan etkiler. Kötü örülmüş bir tuğla duvar kendini o gün değil, sonraki tüm ekipler geldikçe belli eder.",
      "Bu nedenle tuğla duvar işini yalnız usta alışkanlığına bırakmak yerine, aks, modul, derz, boşluk ve birleşim detayları açısından sistematik biçimde yönetmek gerekir.",
    ],
    theory: [
      "Tuğla, nispeten küçük birim elemanlardan oluştugu için duvar davranışında derz düzeni belirleyicidir. Yatay ve düşey derzlerdeki süreksizlik, duvarın kendi geometri doğruluğunu bozduğu gibi siva altında ilave kalınlık ihtiyaci ve lokal çatlak riski de üretir. Bu yüzden tuglada hızdan önce ritim gelir.",
      "Malzemenin su emme davranışı da önemlidir. Fazla kuru veya kontrolsüz ıslatılmış tuğla, harc ile ilişkiyi zayıflatabilir. Saha pratiğinde birimlerin çevre koşuluna göre doğru hazırlanması, kağıt üzerindeki malzeme kalitesinden daha fazla fark yaratabilir. Aderans kalitesi, sonraki siva katmanının da davranışını etkiler.",
      "Tuğla duvarın betonarme çerçeve içindeki davranışı da ihmal edilmemelidir. Kolon ve kirişlerle farklı rötre ve deformasyon karakterine sahip olduğu için en zayıf çizgiler malzeme değişim hatlarında oluşur. Bu yüzden pencere köşeleri, kolon temasları ve lento bölgeleri özel dikkat ister.",
      "Ayrıca tuğla duvar, tesisat için en çok müdahale gören dolgu tiplerinden biridir. Plansız buat ve kanal kirimlari, duvarın düzenini ve yüzey kalitesini hizla bozar. Bu nedenle tuğla duvar işi, elektrik ve mekanik ekipleriyle birlikte planlanan bir koordinasyon imalatı olarak ele alınmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Derz ritmi ve modul",
        limitOrRequirement: "Yatay ve düşey derz düzeni duvar boyunca kontrollu ve tekrarlanabilir olmali",
        reference: "Saha uygulama disiplini",
        note: "Derz ritmi bozuldugunda duvar duzlemi ve siva kalitesi birlikte zarar görür.",
      },
      {
        parameter: "Acilik ve kesim parcalari",
        limitOrRequirement: "Kapı-pencere kenarlarinda dar ve kirik parca birakmadan kontrollu kesim uygulanmali",
        reference: "Mimari boşluk detayi",
        note: "Aciklik kenarlari duvarin en zayif ve en görünür bolgeleridir.",
      },
      {
        parameter: "Betonarme ile birleşim",
        limitOrRequirement: "Kolon ve kiriş temaslarinda çatlak riskini azaltacak detay ve kabul disiplini kurulmalı",
        reference: "Saha birleşim pratiği",
        note: "Malzeme değişim hattı, yüzey kusurunun en hızlı oluştugu bölgedir.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Buat, kanal ve gecisler duvar örme sırasında tanimlanmali",
        reference: "Koordinasyon matrisi",
        note: "Duvar bittikten sonra rastgele kırım yapmak kaliteyi katlayarak bozar.",
      },
      {
        parameter: "Boşluk ve net ölçü",
        limitOrRequirement: "Doğrama boşlukları siva ve montaj payi birlikte dusunulerek tamamlanmali",
        reference: "Mimari detay + saha kabul",
        note: "Net geçiş kararı yalnız kaba boşluk ölçüsüyle okunmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Tuğla tipini, duvar kalinligini ve mahal bazli açiklik kararlarini uygulama öncesi netleştir.",
      "Ilk sirayi kot, aks ve ip referansi ile kür; köşeleri tüm duvarın ana sabiti olarak kabul et.",
      "Duvar ilerlerken derz ritmini koru, açiklik kenarlarinda kontrollu kesim kullan ve rastgele kırık parçayı reddet.",
      "Kolon, kiriş ve pencere köşelerinde çatlak riski yaratacak zayif çizgileri erken fark edip detayını uygula.",
      "Elektrik ve mekanik ekipleriyle buat, kanal ve cihaz yerlerini duvar bitmeden netleştir.",
      "Siva ve doğrama öncesi duvarı mastar, boşluk ve yüzey sürekliliği açısından ayrı bir kalite turundan geçir.",
    ],
    criticalChecks: [
      "Ilk sıra ve köşe doğruluğu tüm duvar boyunca korunuyor mu?",
      "Derz kalinligi ve yatay-düşey ritim duvar boyunca tutarli mi?",
      "Aciklik kenarlarinda zayif dar parça veya kırık birim kaldi mi?",
      "Kolon ve kiriş birleşimlerinde çatlak riski yaratacak hatlar görüldü mü?",
      "Tesisat için sonradan kırma ihtiyaci doguyor mu?",
      "Siva kalinligini gereksiz büyütecek dalga veya şaşkınlık var mı?",
    ],
    numericalExample: {
      title: "4,20 m duvarda kapı boşluğu etrafinda modul karari",
      inputs: [
        { label: "Toplam duvar boyu", value: "420 cm", note: "İç mekan tuğla duvari" },
        { label: "Kapı kaba boşluğu", value: "90 cm", note: "Doğrama öncesi açiklik" },
        { label: "Modul varsayimi", value: "20 cm", note: "Tuğla + derz için örnek saha modulu" },
        { label: "Hedef", value: "Dar kesim parçası birakmamak", note: "Temiz uygulama için" },
      ],
      assumptions: [
        "Boşluk duvar ortasina yakin konumlandirilmistir.",
        "Kontrollu kesim ekipmani ve yeterli usta disiplini vardir.",
        "Doğrama ölçüsü kesinlesmistir ve boşluk revizyonu imkani sınırlıdır.",
      ],
      steps: [
        {
          title: "Net duvar uzunlugunu hesapla",
          formula: "420 - 90 = 330 cm",
          result: "Boşluk disinda kalan net örgü boyu 330 cm olur.",
          note: "Bu boy iki yana dagitilacak tuğla modullerini belirler.",
        },
        {
          title: "16 tam modul secenegini test et",
          formula: "330 - (16 x 20) = 10 cm",
          result: "16 tam modul kullanilirsa iki yanda 5'er cm parca kalir.",
          note: "5 cm kenar parçası zayif ve uygunsuz kabul edilir.",
        },
        {
          title: "15 tam modul secenegini yorumla",
          formula: "330 - (15 x 20) = 30 cm",
          result: "15 tam modul kullanilirsa iki yanda 15'er cm kesim parçası kalir.",
          note: "15 cm parca saha ve dayanım açısından daha makul, daha kontrollu bir çözüm sunar.",
        },
      ],
      checks: [
        "Modul plani, yalnız toplam boyu değil kenarda kalacak en küçük parçayı da dikkate almalıdır.",
        "Dar parça riskinde boşluk konumu veya modul karari yeniden düşünülmelidir.",
        "Kesim karari kontrollu ekipmanla uygulanmali, kırık parça ile tamamlanmamalıdır.",
        "Doğrama toleransi ve siva payi, modul hesabindan ayrı düşünülmemelidir.",
      ],
      engineeringComment: "Tuğla duvarda birkaç santimetrelik kesim karari, sonradan doğrama ve siva ekibinin gunlerini etkileyebilir.",
    },
    tools: MASONRY_TOOLS,
    equipmentAndMaterials: MASONRY_EQUIPMENT,
    mistakes: [
      { wrong: "Ilk sirayi göz karari ilerletmek.", correct: "Ilk sirayi tüm duvarin referansi olarak hassas kurmak." },
      { wrong: "Aciklik kenarlarini kirik veya çok dar parcalarla tamamlamak.", correct: "Modul planini bastan yapip kontrollu kesim kullanmak." },
      { wrong: "Tesisat için duvar bittikten sonra rastgele kanal kirimak.", correct: "Gecisleri duvar örümü ile birlikte planlamak." },
      { wrong: "Kolon-duvar temasini küçük detay saymak.", correct: "Malzeme değişim hattini çatlak riski olarak ayri takip etmek." },
      { wrong: "Siva duzeltir diye dalgali duvari kabul etmek.", correct: "Duvari kendi asamasinda düz teslim etmek." },
      { wrong: "Doğrama bosluklarini yalnız kaba ölçü ile onaylamak.", correct: "Montaj ve siva payini birlikte kontrol etmek." },
    ],
    designVsField: [
      "Projede tuğla duvar bir tarama alanı gibi görünür; sahada ise doğrama, tesisat ve siva toleranslarini tasiyan hassas bir koordinasyon yüzeyidir.",
      "Tasarimda basit görünen bir açiklik karari, uygulamada kesim parçasi, lento, tesisat ve net geçiş kalitesi olarak katmanlı sonuç üretir.",
      "Bu nedenle tuğla duvar, klasik ama hafife alinmaması gereken bir saha mühendisliği işidir.",
    ],
    conclusion: [
      "Tuğla duvar doğru modul, doğru derz ve doğru koordinasyonla uygulandiginda temiz, okunabilir ve bitiş ekiplerini zorlamayan bir dolgu duvar üretir. Aynı iş disiplin kaybettiginde ince işlerde en çok düzeltme isteyen yüzeylerden birine dönüşür.",
      "Saha tarafinda en sağlam yaklasim, tuğla duvarı usta alışkanlığına bırakmamak ve onu aks, boşluk, derz ve birleşim mantığı ile yönetmektir. Bu yaklaşım, tekrar işçiligi ciddi biçimde azaltır.",
    ],
    sources: [...KABA_MASONRY_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["tuğla duvar", "dolgu duvar", "modul plani", "derz düzeni", "saha toleransi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "kaba-insaat/duvar-orme/ytong-gazbeton"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/briket",
    kind: "topic",
    quote: "Briket duvar hızlı yukselir; ama modulu, agirligi ve tesisat müdahaleleri doğru yönetilmezse en sert görünümlü duvar bile zayif davranir.",
    tip: "Brikette sorun sadece yüzey dalgasi degildir; kötü kesim, zayif alt sıra ve sonradan acilan kanallar duvarin butun mantigini bozar.",
    intro: [
      "Briket duvar, özellikle kalinlik, ekonomik temin ve uygulama hizi nedeniyle birçok projede tercih edilen bir dolgu duvar tipidir. Fakat daha büyük modullu ve nispeten daha ağır bir eleman olması, ona 'kolay' imalat görüntüsü verse de saha yönetimini basitleştirmez. Tersine, yanlış kararlar daha büyük boyutlu kusurlara dönüşebilir.",
      "Sahada briket duvarlarda en sık görülen problemler; ilk sırada kot kaçması, geniş modül nedeniyle yanlış boşluk kararları, köşe ve pencere kenarlarında zayıf kesimler, tesisat için sonradan açılan geniş kanallar ve ağır birimlerin neden olduğu yüzey oturmalarıdır. Bunlar duvar tamamlandığında değil, kaplama ve kullanım sürecinde daha görünür hale gelir.",
      "Bir inşaat mühendisi için briket duvarın önemi, yalnız metraj veya hız hesabı değildir. Briket duvar, döşeme üstündeki ek yükü, akustik beklentiyi, sıva davranışını ve mekanik-elektrik koordinasyonunu birlikte etkiler. Bu yüzden uygulama kalitesi kadar planlama kalitesi de kritik hale gelir.",
      "Briketi yalnız kalın ve sağlam görünen bir blok olarak değerlendirmek yeterli değildir; sistem ancak doğru oturur, doğru kesilir ve doğru teslim edilirse avantaj üretir.",
    ],
    theory: [
      "Briket duvarlarda birim eleman modülü büyüdükçe kesim stratejisi daha kritik hale gelir. Küçük parçalarla kenar tamamlama, tuglaya göre daha da sorunludur; çünkü parça büyüklüğü ve boşluk oranı duvarın kenar kalitesini hızlı biçimde zayıflatır. Bu nedenle briket duvarda boşluk planı uygulama başlamadan önce çözülmelidir.",
      "Briketin görece daha yüksek ağırlığı ve geniş yüzeyleri, ilk sıra doğruluğunu daha önemli kılar. İlk sıradaki küçük kot kaçması üst sıralarda büyür ve siva kalınlığını artırır. Ayrıca büyük modül nedeniyle dalga ve şakul hatası gözle de daha belirgin hale gelir.",
      "Tesisat müdahalesi de briket duvarlarda kritik konulardandır. Daha büyük ve kalın eleman hissi, sahada plansız kanal açmayı meşrulaştırıyormuş gibi algılanabilir; oysa geniş ve derin chase işlemleri duvarın bütünlüğünü ve yüzey dayanımını zayıflatır. Bu nedenle elektrik buatları ve mekanik geçişler önceden tasarlanmalıdır.",
      "Briket duvarın performansı yalnız duvar örme anında değil, sonraki siva, boya ve kullanım sürecinde okunur. Temiz örülmeyen, modulsüz kurulan ve sonradan çok müdahale gören briket duvar, ağır görünmesine rağmen uzun vadede problemli bir yüzey haline gelir.",
    ],
    ruleTable: [
      {
        parameter: "Modul ve kesim planı",
        limitOrRequirement: "Briket modulu, boşluk ve kenar parçaları uygulama öncesi çözümlenmeli",
        reference: "Mimari boşluk detayi + saha planlama",
        note: "Büyük modullu malzemede plansız kesim daha büyük kalite kaybı üretir.",
      },
      {
        parameter: "Ilk sıra ve dusaylik",
        limitOrRequirement: "Ilk sıra kot ve eksende hassas kurulmalı, duvar şakülü sürekli kontrol edilmeli",
        reference: "Saha uygulama disiplini",
        note: "Brikette ilk sıra hatası üst sıralarda katlanarak görünür olur.",
      },
      {
        parameter: "Acilik ve lento bölgeleri",
        limitOrRequirement: "Pencere ve kapı kenarlarında zayif kesim parçası bırakmadan detay tamamlanmalı",
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
        limitOrRequirement: "Siva öncesi duzlem, boşluk, çatlak ve tesisat tamirleri mahal bazında kontrol edilmeli",
        reference: "Mahal bazli teslim cizelgesi",
        note: "Briket yüzeyindeki sorunlar üst kaplamada daha pahalı düzeltilir.",
      },
    ],
    designOrApplicationSteps: [
      "Briket ölçüsünü, duvar kalınlığını ve açiklik kararlarını mahal bazında uygulama öncesi netleştir.",
      "İlk sırayı kot ve aks referanslarıyla kür; köşe bloklarını bütün duvar için sabit referans kabul et.",
      "Açiklik çevresinde kontrolsüz küçük parça bırakmamak için modul planını önceden yap.",
      "Elektrik ve mekanik ekipleriyle buat, kanal ve geçiş noktalarını duvar ilerlemeden kilitle.",
      "Duvar tamamlandığında siva ekibine geçmeden önce mastar, şakul, boşluk ve tamir kontrolü yap.",
      "Gerekli tamirleri lokal yama mantığıyla değil, yüzey sürekliliğini bozmadan tamamla.",
    ],
    criticalChecks: [
      "Briket modulu açiklik çevresinde zayıf kesim parçası bırakıyor mu?",
      "İlk sıra ve köşeler tüm duvar boyunca kot ve eksenini korudu mu?",
      "Tesisat için sonradan geniş chase açılması gerekecek noktalar var mı?",
      "Kolon veya kiriş temaslarında çatlak riski yaratan zayıf yüzeyler oluştu mu?",
      "Siva kalinligini gereksiz artıracak yüzey dalgası var mı?",
      "Duvarın teslimi öncesi buat ve kanal tamirleri gerçekten kapatıldı mı?",
    ],
    numericalExample: {
      title: "4,90 m duvarda pencere acikligi için briket modul karari",
      inputs: [
        { label: "Toplam duvar boyu", value: "490 cm", note: "Dış veya iç bölme duvari" },
        { label: "Pencere kaba boşluğu", value: "100 cm", note: "Ornek aciklik" },
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
          title: "Net örgü boyunu hesapla",
          formula: "490 - 100 = 390 cm",
          result: "Pencere disinda kalan net duvar boyu 390 cm olur.",
          note: "Bu boy iki yana dagitilacak briket modullerini belirler.",
        },
        {
          title: "9 tam modul secenegini test et",
          formula: "390 - (9 x 40) = 30 cm",
          result: "9 tam modul kullanildiginda iki yanda 15'er cm kesim parçası kalir.",
          note: "15 cm parca, saha uygulamasi için kontrollu ve kabul edilebilir bir karardir.",
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
      { wrong: "Siva öncesi yüzey teslimini atlamak.", correct: "Mastar ve şakul kabulünü duvar aşamasında yapmak." },
      { wrong: "Açiklik kenarlarını küçük kırık parça ile tamamlamak.", correct: "Kesim kararını kontrollu ve dengeli modul ile vermek." },
      { wrong: "Briketin ağır görünmesini dayanım güvencesi sanmak.", correct: "Yüzey bütünlüğü ve planlı uygulamayı ana kalite kriteri saymak." },
    ],
    designVsField: [
      "Projede briket duvar bir kalınlık ve tarama olarak görünür; sahada ise modulu, boşluk ilişkisi ve tesisat müdahalesi kaliteyi belirler.",
      "Briket duvarın ağır ve rijit görünmesi, plansız uygulama hatalarını affettigi anlamina gelmez.",
      "Bu nedenle briket duvar, hem lojistik hem bitiş kalitesi açısından mühendislik dikkati isteyen bir dolgu sistemidir.",
    ],
    conclusion: [
      "Briket duvar doğru modul, doğru ilk sıra ve doğru koordinasyon ile uygulandiginda temiz, sağlam görünen ve bitiş ekiplerini yormayan bir yüzey üretir. Plansız ilerlediğinde ise özellikle boşluk çevresi ve tesisat müdahalelerinde hızlı kalite kaybı yaşanır.",
      "Saha tarafinda en iyi sonuç, briket duvarı hız kalemi değil geometri ve koordinasyon kalemi olarak yöneten ekiplerde alınır. Bu yaklaşım, sonraki siva ve doğrama işlerinde ciddi zaman kazandırır.",
    ],
    sources: [...KABA_MASONRY_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["briket duvar", "dolgu duvar", "modul karari", "tesisat koordinasyonu", "duvar kabul"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "kaba-insaat/duvar-orme/tugla-duvar"],
  },
];
