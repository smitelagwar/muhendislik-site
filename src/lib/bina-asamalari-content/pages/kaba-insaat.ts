import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const STRUCTURE_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "İdecad Statik", purpose: "Betonarme sistem, donatı ve kesit kararlarını proje setiyle birlikte yönetmek." },
  { category: "Analiz", name: "ETABS / SAP2000", purpose: "Taşıyıcı sistem davranışını ve eleman taleplerini doğrulamak." },
  { category: "Çizim", name: "AutoCAD / Revit", purpose: "Kalıp, rezervasyon ve detay paftalarını saha okunabilir hale getirmek." },
  { category: "Kontrol", name: "Excel / Python saha kontrol şablonları", purpose: "Döküm, numune, donatı ve kat çevrimi kayıtlarını izlemek." },
];

const getKabaExtraSpecs = (): BinaGuidePageSpec[] => [
  {
    slugPath: "kaba-insaat/beton-isleri",
    kind: "topic",
    quote: "Beton işleri, hazır beton siparişiyle değil; kabul, yerleştirme ve kür zinciriyle yönetilen bir kalite sürecidir.",
    tip: "Döküm günü hazırlıksız başlamak, beton kalitesini mikserden önce sahada kaybetmek demektir.",
    intro: [
      "Beton işleri, taze betonun sahaya kabulünden numune alınmasına, yerleştirmeden vibrasyona ve kür yönetimine kadar uzanan bir kalite zinciridir.",
      "Birçok şantiyede beton sınıfı doğru olsa bile döküm planı, vibrasyon disiplini veya kür yetersizliği yüzünden eleman performansı ve yüzey kalitesi zayıflar.",
    ],
    theory: [
      "Beton dayanımı laboratuvar sonucu kadar yerinde uygulama koşullarına da bağlıdır. Yerleştirme yüksekliği, kesintisiz döküm, vibrasyon sıklığı ve erken yaş nem kaybı taze betonu doğrudan etkiler.",
      "Beton işleri aynı zamanda ekip koordinasyonudur. Pompa, laboratuvar, kalıp ve donatı ekiplerinin hepsi aynı zaman çizgisinde hareket etmelidir.",
      "Bu yüzden beton dökümü bir anlık imalat değil, öncesi ve sonrası planlanmış bir süreçtir.",
    ],
    ruleTable: [
      {
        parameter: "Hazır beton performansı",
        limitOrRequirement: "Sınıf, kıvam ve çevresel etki koşulu projeye uygun olmalı",
        reference: "TS EN 206",
        note: "Sipariş formu proje notlarıyla tutarlı olmalıdır.",
      },
      {
        parameter: "Yerinde uygulama",
        limitOrRequirement: "Yerleştirme ve sıkıştırma kontrollü yapılmalı",
        reference: "TS EN 13670",
        note: "Beton kalitesi yalnızca sevk irsaliyesinden okunmaz.",
      },
      {
        parameter: "Erken yaş bakımı",
        limitOrRequirement: "Kür ve koruma planı dökümden önce hazır olmalı",
        reference: "TS EN 13670",
        note: "Özellikle sıcak, rüzgarlı veya soğuk havada kritik hale gelir.",
      },
    ],
    designOrApplicationSteps: [
      "Beton sınıfı, kıvamı ve sevkiyat temposunu proje ile uyumlu sipariş et.",
      "Döküm öncesi kalıp, donatı, rezervasyon ve ekipman ön kabulünü bitir.",
      "Taze beton kabulünü slump ve numune zinciriyle birlikte yürüt.",
      "Yerleştirme, vibrasyon ve soğuk derz riskini döküm akışına göre yönet.",
      "Döküm sonrası kür ve koruma planını aynı gün başlat.",
    ],
    criticalChecks: [
      "Sevkiyat akışı ile pompa kapasitesi uyumlu mu?",
      "Slump ve numune kayıtları kesintisiz tutuluyor mu?",
      "Yüksekten döküm veya segregasyon riski var mı?",
      "Vibratör erişimi ve yedek ekipman hazır mı?",
      "Kür uygulaması hava koşuluna göre başlatıldı mı?",
    ],
    numericalExample: {
      title: "82 m³ döküm için sevkiyat aralığı yorum örneği",
      inputs: [
        { label: "Toplam beton hacmi", value: "82 m³", note: "Tek vardiya dökümü" },
        { label: "Mikser kapasitesi", value: "8 m³", note: "Ortalama değer" },
        { label: "Tahmini mikser sayısı", value: "11 sefer", note: "Yedekli plan gerekir" },
        { label: "Hedef", value: "Soğuk derz oluşturmadan kesintisiz akış", note: "Kritik saha hedefi" },
      ],
      assumptions: [
        "Pompa ve vibrasyon ekipleri döküm boyunca hazırdır.",
        "Yüksek sıcaklık veya yağış gibi aşırı hava durumu yoktur.",
        "Numune alma ve kabul süreci akışı kesmeyecek biçimde planlanmıştır.",
      ],
      steps: [
        {
          title: "Sevkiyat sayısını belirle",
          formula: "82 / 8 ≈ 10,25",
          result: "Yaklaşık 11 mikser seferi gerekir.",
          note: "Gecikme riskine karşı yedek plan yapılmalıdır.",
        },
        {
          title: "Süreklilik riskini yorumla",
          result: "İki sevkiyat arasında uzun boşluk oluşursa soğuk derz ihtimali artar.",
          note: "Pompa beklerken döküm bölgesi ilerletilmemelidir.",
        },
      ],
      checks: [
        "Sevkiyat gecikmesinde teknik ekip ne yapacağını önceden bilmelidir.",
        "Numune alma, kabulü yavaşlatmadan organize edilmelidir.",
        "Kür planı döküm biter bitmez devreye alınmalıdır.",
      ],
      engineeringComment: "Beton kalitesi, sipariş formunda yazandan çok, şantiyede kesintisiz ve kontrollü yönetilen akışla korunur.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Beton sınıfı doğruysa saha koşullarını ikincil görmek.", correct: "Kabul, yerleştirme ve kür sürecini birlikte yönetmek." },
      { wrong: "Tek vibratörle büyük döküme girmek.", correct: "Yedek ekipman ve kesintisiz plan hazırlamak." },
      { wrong: "Numune zincirini düzensiz tutmak.", correct: "Sevkiyat bazında açık kayıt sistemi kurmak." },
      { wrong: "Kürü ertesi güne bırakmak.", correct: "Döküm sonrası erken yaş bakımını aynı gün başlatmak." },
      { wrong: "Soğuk derz riskini yalnızca ustalıkla çözmeye çalışmak.", correct: "Sevkiyat ve döküm planını buna göre önceden kurgulamak." },
    ],
    designVsField: [
      "Projede C30/37 yazmak yeterlidir; sahada ise bu sınıfın gerçekten performansa dönüşmesi için kabul, yerleştirme, vibrasyon ve kür disiplininin eksiksiz işlemesi gerekir.",
      "Bu yüzden beton işleri, tasarım kararının saha davranışıyla sınandığı en kritik halkalardan biridir.",
    ],
    conclusion: [
      "Beton işleri ne kadar planlı yürütülürse taşıyıcı sistem o kadar güvenle oluşur. Döküm günü alınan küçük disiplin kararları, yapının uzun dönem performansını doğrudan etkiler.",
    ],
    sources: [...KABA_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670],
    keywords: ["beton işleri", "beton dökümü", "slump", "kür işlemi", "TS EN 206"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme",
    kind: "topic",
    quote: "Duvar örme işi, boşluğu kapatmak değil; taşıyıcı sistemle uyumlu, ölçülü ve çatlamaya dirençli dolgu üretmektir.",
    tip: "Dolgu duvarı hızlı kapatmak, şantiye ilerlemesi gibi görünür; ama aks, derz ve tesisat koordinasyonu kurulmazsa ince işlerde bedeli büyür.",
    intro: [
      "Duvar örme işleri, taşıyıcı olmayan dolgu duvarların mekan ayrımı, tesisat koordinasyonu ve yüzey hazırlığı açısından kritik rol oynadığı aşamadır.",
      "Tuğla, gazbeton veya benzeri malzeme seçimi kadar önemli olan konu; duvarın aksa oturması, düşeyliği koruması ve tesisatla çakışmamasıdır.",
    ],
    theory: [
      "Dolgu duvarlar taşıyıcı sistem elemanı olmasalar da depremde hasar davranışı, kullanıcı güvenliği ve bitirme kalitesi üzerinde doğrudan etkilidir.",
      "Duvar örgüsünde yatay-düşey derz düzeni, ankraj detayları, lento ve açıklık kenarları birlikte okunmalıdır.",
      "Ayrıca tesisat ekipleri için bırakılan boşluklar sonradan rasgele kırılacak şekilde değil, imalat sırasına bağlanacak şekilde düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Duvar doğruluğu",
        limitOrRequirement: "Aks, şakül ve yüzey sürekliliği korunmalı",
        reference: "Saha uygulama disiplini",
        note: "İnce işlerde düzeltme yükü bırakılmamalıdır.",
      },
      {
        parameter: "Birleşim ve ankraj",
        limitOrRequirement: "Kolon/perde birleşimleri çatlak riskini azaltacak şekilde çözülmeli",
        reference: "Teknik detay pratiği",
        note: "Dolgu duvar ile betonarme arasındaki temas kritik bölgedir.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Kırma yerine planlı boşluk ve geçiş bırakılmalı",
        reference: "Şantiye koordinasyon disiplini",
        note: "Gelişi güzel kanal açma duvar performansını düşürür.",
      },
    ],
    designOrApplicationSteps: [
      "Malzeme tipini ve duvar kalınlığını mahal kullanımına göre belirle.",
      "Aks, kapı boşluğu ve tesisat geçişlerini örme öncesi işaretle.",
      "İlk sıra ve köşe doğruluğunu kontrol ederek örgüye başla.",
      "Lento, pencere altı ve betonarme birleşimlerini detayına uygun tamamla.",
      "Sıva ve kaplama öncesi yüzey sürekliliği ile tesisat geçişlerini son kez kontrol et.",
    ],
    criticalChecks: [
      "İlk sıra ve köşe doğruluğu sağlandı mı?",
      "Kapı/pencere boşlukları doğrama ölçüsüne uygun mu?",
      "Tesisat için sonradan kırma ihtiyacı bırakıldı mı?",
      "Betonarme birleşimlerinde çatlak riski azaltıldı mı?",
      "Yüzey sürekliliği sıva yükünü artıracak kadar bozuk mu?",
    ],
    numericalExample: {
      title: "Kapı boşluğu ve duvar ekseni uyumu için saha örneği",
      inputs: [
        { label: "Duvar kalınlığı", value: "13,5 cm", note: "Gazbeton blok" },
        { label: "Kapı kasa neti", value: "90 cm", note: "İç kapı" },
        { label: "Montaj ve köpük payı", value: "2-3 cm", note: "Her iki yan toplam tolerans" },
        { label: "Hedef kaba boşluk", value: "93-95 cm", note: "Uygulama pratiği" },
      ],
      assumptions: [
        "Kapı tipi ve kasa kalınlığı önceden netleşmiştir.",
        "Sıva kalınlığı boşluk hesabında dikkate alınacaktır.",
        "Duvar ekseni mimari aksa bağlıdır.",
      ],
      steps: [
        {
          title: "Kaba boşluk payını yorumla",
          result: "90 cm net kapı için yaklaşık 93-95 cm kaba boşluk hedeflenir.",
          note: "Doğrama ekibine sıfır tolerans bırakmak montajı zorlaştırır.",
        },
        {
          title: "Sıva etkisini ekle",
          result: "Sıva sonrası net geçiş korunacak şekilde boşluk kontrol edilmelidir.",
          note: "Aksi durumda kapı montajında kesme veya dolgu gerekir.",
        },
      ],
      checks: [
        "Boşluk ölçüsü doğrama tesliminden önce tekrar alınmalıdır.",
        "Duvar ekseni, mahal ölçüsünü bozacak şekilde kaymamalıdır.",
        "Tesisat kanalı açılacak yüzeylerde duvar bütünlüğü korunmalıdır.",
      ],
      engineeringComment: "Duvar örme işinde birkaç santimetrelik ihmal, doğrama ve sıva ekipleri için zincirleme düzeltme üretir.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Kapı boşluklarını doğrama ekibi gelirken netleştirmek.", correct: "Duvar örme öncesi ölçüleri kilitlemek." },
      { wrong: "Tesisat için rasgele kanal açmak.", correct: "Geçişleri önceden planlamak." },
      { wrong: "İlk sırayı hızlı geçmek.", correct: "İlk sıra ve köşeleri hassas kurmak." },
      { wrong: "Betonarme birleşimlerini sıradan duvar detayı gibi görmek.", correct: "Çatlak riskine karşı birleşim detayını özellikle takip etmek." },
      { wrong: "Sıva ekibi düzeltir yaklaşımıyla yüzey bozukluğu bırakmak.", correct: "Duvarı ince işe hazır doğrulukta teslim etmek." },
    ],
    designVsField: [
      "Projede basit bir dolgu duvar çizgisi olarak görülen imalat, sahada doğrama, tesisat, sıva ve kaplama ekiplerinin ortak başlangıç yüzeyi haline gelir.",
      "Bu nedenle duvar örme işi, ince iş kalitesinin erken habercisidir.",
    ],
    conclusion: [
      "Duvar örme işleri dikkatli yürütüldüğünde hem mekan ölçüsü korunur hem de sonraki ekipler için temiz bir yüzey oluşur. Özellikle doğrama ve tesisat koordinasyonu burada kazanılır.",
    ],
    sources: KABA_SOURCES,
    keywords: ["duvar örme", "gazbeton", "tuğla duvar", "kapı boşluğu", "dolgu duvar koordinasyonu"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti",
    kind: "topic",
    quote: "Çatı iskeleti, kaplamayı taşıyan karkastan öte; suyu yöneten ve üst yapıyı tamamlayan geometridir.",
    tip: "Çatı eğimi, taşıyıcı karkas ve tesisat geçişleri birlikte çözülmezse su tahliyesi ile bakım erişimi aynı anda sorun çıkarır.",
    intro: [
      "Çatı iskeleti, ahşap, çelik veya teras çatı öncesi taşıyıcı alt sistemin kurulduğu ve çatı geometrisinin kesinleştiği aşamadır.",
      "Bu fazda yapılan hata yalnızca bir üst kaplama sorunu yaratmaz; su tahliyesini, açıklık geçişini ve çatı üstü ekipman güvenliğini de etkiler.",
    ],
    theory: [
      "Çatı karkası, yükleri taşımanın yanında suyun yönünü ve kaplama katmanlarının oturacağı düzlemi belirler. Bu nedenle eğim, makas düzeni, aşık aralıkları ve bağlantı detayları birlikte okunmalıdır.",
      "Ahşap ve çelik çözümler farklı davranış gösterse de ortak ihtiyaç; rijitlik, bağlantı güvenliği ve kaplama altı sürekliliktir.",
      "Çatı iskeleti ayrıca yağmur inişi, baca ve ekipman geçişleri için de rezerv üretmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Çatı eğimi ve taşıyıcı düzen",
        limitOrRequirement: "Kaplama sistemi ile uyumlu geometri kurulmalı",
        reference: "Uygulama detayı ve üretici sistemi",
        note: "Eğim kararı kaplamadan bağımsız verilemez.",
      },
      {
        parameter: "Bağlantı güvenliği",
        limitOrRequirement: "Makas, aşık ve birleşim noktaları sabitlenmeli",
        reference: "Saha mühendisliği ve proje detayı",
        note: "Rüzgar etkisi özellikle hafif sistemlerde kritiktir.",
      },
      {
        parameter: "Geçiş ve drenaj",
        limitOrRequirement: "Baca, süzgeç ve ekipman geçişleri geometriye dahil edilmeli",
        reference: "Çatı uygulama disiplini",
        note: "Sonradan açılan geçişler su yalıtımı riskini artırır.",
      },
    ],
    designOrApplicationSteps: [
      "Çatı tipine göre eğim, açıklık ve taşıyıcı aileyi netleştir.",
      "Makas veya ana taşıyıcıları akslara bağlı şekilde kur.",
      "Aşık ve tali taşıyıcıları kaplama sistemine uygun aralıkta yerleştir.",
      "Baca, süzgeç ve ekipman geçişlerini iskelet aşamasında planla.",
      "Kaplama öncesi geometri, rijitlik ve bağlantı kontrolünü tamamla.",
    ],
    criticalChecks: [
      "Çatı eğimi suyu doğru yönde topluyor mu?",
      "Taşıyıcı karkas akslara ve projeye uygun mu?",
      "Bağlantı elemanları ve rijitlik yeterli mi?",
      "Geçişler kaplama öncesi netleşti mi?",
      "Kaplama altı düzlem dalgalanma üretiyor mu?",
    ],
    numericalExample: {
      title: "Yağmur suyu tahliyesi için eğim mantığı örneği",
      inputs: [
        { label: "Çatı yatay boyu", value: "10,0 m", note: "Tek yönlü eğim" },
        { label: "Hedef minimum eğim", value: "%2", note: "Örnek saha kabulü" },
        { label: "Gerekli kot farkı", value: "20 cm", note: "10,0 m boyunca" },
        { label: "Kaplama tipi", value: "Metal / membran alt sistem", note: "Sürekli su tahliyesi hedefi" },
      ],
      assumptions: [
        "Tahliye noktası ve yağmur inişi önceden belirlenmiştir.",
        "Kaplama sistemi seçilen eğime uygundur.",
        "İskelet düzlemi kaplama öncesi kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "10,0 m x %2 = 0,20 m",
          result: "En az 20 cm kot farkı gerekir.",
          note: "Bu değer çatı geometrisinin sahada ölçülebilir kurulmasını sağlar.",
        },
        {
          title: "Tahliye noktasını yorumla",
          result: "En düşük kot süzgeç veya iniş hattıyla uyumlu olmalıdır.",
          note: "Sadece taşıyıcıyı kurup tahliyeyi sonra çözmek doğru değildir.",
        },
      ],
      checks: [
        "Gerçek kot farkı lazer ölçümle doğrulanmalıdır.",
        "Kaplama öncesi geçiş ve tahliye noktaları sabitlenmelidir.",
        "Dalgaya neden olacak taşıyıcı sapmaları düzeltilmelidir.",
      ],
      engineeringComment: "Çatı iskeleti iyi kurulursa kaplama suyu iter; kötü kurulursa kaplama tek başına kusuru gizleyemez.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Çatı eğimini kaplama ekibine bırakmak.", correct: "Taşıyıcı geometri aşamasında kurmak." },
      { wrong: "Baca ve ekipman geçişlerini sonradan açmak.", correct: "İskelet aşamasında rezerv bırakmak." },
      { wrong: "Bağlantı detaylarını üretici alışkanlığına bırakmak.", correct: "Projeye ve rüzgar koşuluna göre doğrulamak." },
      { wrong: "Çatı düzlemini göz kararı kabul etmek.", correct: "Kaplama öncesi ölçü ve kot kontrolü yapmak." },
      { wrong: "Tahliye hattını taşıyıcı geometriye sonradan uydurmak.", correct: "Süzgeç ve inişi iskeletle birlikte planlamak." },
    ],
    designVsField: [
      "Projede birkaç eğim oku ve kesitle anlatılan çatı, sahada makas, aşık, geçiş, süzgeç ve bakım erişimiyle üç boyutlu problem haline gelir.",
      "Bu nedenle çatı iskeleti, üst yapının su güvenliği açısından kritik taşıyıcı aşamasıdır.",
    ],
    conclusion: [
      "Çatı iskeleti doğru kurulduğunda kaplama sistemi güvenle çalışır ve su yönetimi sorunsuz ilerler. Yanlış geometri ise en iyi kaplama malzemesinde bile sorun üretir.",
    ],
    sources: KABA_SOURCES,
    keywords: ["çatı iskeleti", "ahşap çatı", "çelik çatı", "çatı eğimi", "üst yapı su tahliyesi"],
  },
];

const STRUCTURE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kalıp", name: "Panel kalıp ve iskele sistemi", purpose: "Kesit geometrisini ve taze beton yükünü güvenle taşımak.", phase: "Kalıp" },
  { group: "Donatı", name: "Kesme-bükme tezgahı", purpose: "Donatı imalatını projeye uygun boy ve açılarla hazırlamak.", phase: "Donatı" },
  { group: "Beton", name: "İğne vibratör", purpose: "Taze betonun boşluksuz yerleşmesini sağlamak.", phase: "Döküm" },
  { group: "Beton", name: "Slump konisi ve numune kalıpları", purpose: "Taze beton kabulünü ve dayanım takibini yapmak.", phase: "Döküm" },
  { group: "Kontrol", name: "Pas payı takozu ve şakül ekipmanları", purpose: "Donatı örtüsü ve kalıp doğruluğunu güvenceye almak.", phase: "Ön kabul" },
];

const KABA_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

export const kabaInsaatSpecs: BinaGuidePageSpec[] = [
  ...getKabaExtraSpecs(),
  {
    slugPath: "kaba-insaat",
    kind: "branch",
    quote: "Kaba inşaat kalitesi, beton sertleştiğinde değil; kalıp kapanmadan önce kazanılır.",
    tip: "Kalıp, donatı ve beton ekipleri aynı kalite dilini paylaşmıyorsa kat çevrimi hızlansa bile yapısal güvence zayıflar.",
    intro: [
      "Kaba inşaat, taşıyıcı sistemin sahada gerçek hale geldiği ana fazdır. Bir kolon ekseni, bir kiriş pas payı veya bir döküm sırası burada yanlış kurulursa sonraki bütün ekipler bu hatanın üzerine çalışmak zorunda kalır.",
      "Bu rehber; kalıp, donatı, beton, duvar ve çatı iskeleti kararlarını yalnızca imalat sırası olarak değil, birbirine teslim üreten bir kalite zinciri olarak ele alır.",
      "Hedef, her kat çevriminde ölçülebilir, kaydedilebilir ve tekrar edilebilir bir saha standardı oluşturmaktır.",
    ],
    theory: [
      "Kaba inşaatta hata çoğu zaman tek bir ekipten doğmaz; kalıp toleransı, donatı sıkışıklığı ve beton yerleşimi birbirini etkiler. Bu yüzden sorunları tek kalemde değil, zincir halinde okumak gerekir.",
      "Taşıyıcı sistem davranışı projede hesaplanır; ancak sahada bu davranışı sağlayan unsur, doğru geometri, doğru pas payı, doğru vibrasyon ve doğru kür disiplinidir.",
      "Kaba inşaat fazı ayrıca sonraki bitirme ekipleri için de referans oluşturur. Duvar, kaplama ve doğrama doğruluğu çoğu zaman burada bırakılan ölçüyle şekillenir.",
    ],
    ruleTable: [
      {
        parameter: "Betonarme eleman detayları",
        limitOrRequirement: "Kesit, donatı ve detay kararları TS 500 ve TBDY uyumlu olmalı",
        reference: "TS 500 + TBDY 2018",
        note: "Sahadaki donatı yerleşimi hesap modelinin taşıdığı davranışı bozmamalıdır.",
      },
      {
        parameter: "Beton kabul ve uygulama",
        limitOrRequirement: "Hazır beton performansı ve uygulama sırası kayda bağlanmalı",
        reference: "TS EN 206 + TS EN 13670",
        note: "Sadece beton sınıfı değil, yerleştirme ve kür koşulları da kaliteyi belirler.",
      },
      {
        parameter: "Kalıp ve tolerans",
        limitOrRequirement: "Aks, kesit ve düşeylik kabul sınırları saha öncesi kontrol edilmeli",
        reference: "TS EN 13670",
        note: "Beton döküldükten sonra geometriyi düzeltme maliyeti çok yükselir.",
      },
    ],
    designOrApplicationSteps: [
      "Aplikasyon ve aks doğrulaması ile kalıp kurulumunu aynı referans setinde başlat.",
      "Kalıp kapanmadan önce donatı, rezervasyon ve gömülü eleman kontrollerini tamamla.",
      "Döküm planını pompa, vibrasyon ve numune zinciriyle birlikte önceden yaz.",
      "Beton sonrası kür, söküm ve bir sonraki kat hazırlığını aynı kalite döngüsüne bağla.",
      "Duvar ve çatı iskeleti gibi takip eden imalatları taşıyıcı sistemden kalan ölçüye göre başlat.",
    ],
    criticalChecks: [
      "Kalıp geometri ve aks kontrolü döküm öncesi yazılı mı?",
      "Donatı bindirme, etriye ve pas payı yerleşimi foto-kayıtlı mı?",
      "Beton sevki, slump ve numune zinciri kesintisiz izleniyor mu?",
      "Kür ve söküm kararı yalnızca takvim baskısıyla mı veriliyor?",
      "Bir kat tesliminde sonraki ekip için temiz ve ölçülü referans bırakılıyor mu?",
    ],
    numericalExample: {
      title: "Tipik kat çevrimi için beton döküm öncesi kontrol bandı",
      inputs: [
        { label: "Kat döşeme alanı", value: "380 m²", note: "Konut bloğu tip katı" },
        { label: "Planlanan beton hacmi", value: "82 m³", note: "Kolon, perde, kiriş ve döşeme birlikte" },
        { label: "Numune sıklığı", value: "her sevkiyat zincirinde", note: "Şantiye kalite planına bağlı" },
        { label: "Vibratör adedi", value: "2 aktif + 1 yedek", note: "Kesintisiz yerleştirme için" },
      ],
      assumptions: [
        "Döküm tek vardiyada tamamlanacaktır.",
        "Tüm rezervasyon ve gömülü eleman kontrolleri döküm öncesi bitirilmiştir.",
        "Kür planı hava durumuna göre hazırdır.",
      ],
      steps: [
        {
          title: "Sevkiyat temposunu kontrol et",
          result: "82 m³ için pompa ve mikser akışının boşluk bırakmadan ilerlemesi gerekir.",
          note: "Uzun bekleme, soğuk derz riskini artırır.",
        },
        {
          title: "Ekipman yedekliliğini yorumla",
          result: "2 aktif + 1 yedek vibratör, döküm kesintisi riskini azaltır.",
          note: "Tek ekipmana bağlı döküm yüksek risklidir.",
        },
      ],
      checks: [
        "Sevkiyat planı ile yerleştirme kapasitesi birbiriyle uyumlu olmalıdır.",
        "Numune ve slump kontrolü döküm akışından kopuk yürümemelidir.",
        "Döküm sonrası kür başlangıcı önceden tanımlanmalıdır.",
      ],
      engineeringComment: "Kaba inşaatta iyi gün, döküm sırasında sürpriz çıkmayan değil; sürprizler daha başlamadan kapatılmış olan gündür.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Kat çevrimini yalnızca hız metriğiyle yönetmek.", correct: "Hız ile kalite kayıtlarını birlikte izlemek." },
      { wrong: "Kalıp ve donatı kabulünü ayrı ekip sorunları gibi görmek.", correct: "Beton öncesi tek ortak ön kabul yapmak." },
      { wrong: "Kür ve söküm kararını takvim baskısıyla vermek.", correct: "Beton davranışı ve koşullara göre yönetmek.", reference: "TS EN 13670" },
      { wrong: "Rezervasyonları sonradan delme ile çözmek.", correct: "Kalıp ve donatı öncesinde tüm geçişleri projeye bağlamak." },
      { wrong: "Bir kat tesliminde temizlik ve ölçü kontrolünü atlamak.", correct: "Sonraki ekip için ölçülü saha bırakmak." },
    ],
    designVsField: [
      "Tasarım ofisinde taşıyıcı sistem çizgiler ve donatı çağrılarıyla anlatılır; sahada bu bilgiler kalıp paneli, spacer, vibratör ve numune kalıbı üzerinden gerçeğe dönüşür.",
      "Bu yüzden kaba inşaat kalitesi, saha disiplini ile proje tutarlılığının en görünür birleşimidir.",
    ],
    conclusion: [
      "Kaba inşaat fazı, yapısal güvenliği sahada görünür hale getiren omurgadır. Burada kurulan kalite standardı, hem üst yapının performansını hem de sonraki tüm ekiplerin hızını belirler.",
    ],
    sources: KABA_SOURCES,
    keywords: ["kaba inşaat", "betonarme saha kontrolü", "kat çevrimi", "kalıp donatı beton", "TS EN 206 TS 500"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri",
    kind: "topic",
    quote: "Kalıp işleri, betonun alacağı son şekli değil; yapının sahadaki ölçü disiplinini belirler.",
    tip: "Kalıp doğruluğu bozuksa donatı ve beton ekipleri kusuru yalnızca devralır; düzeltemez.",
    intro: [
      "Kalıp işleri, betonarme elemanların geometri, aks ve yüzey kalitesini belirleyen ilk fiziksel adımdır. Bir kolonun şaşıklığı, bir kiriş alt kotundaki sehim veya bir döşeme kenarındaki kaçıklık çoğu zaman kalıp aşamasında doğar.",
      "Bu nedenle kalıp işi yalnızca marangozluk faaliyeti değil; mühendislik toleranslarının sahada kurulmasıdır.",
    ],
    theory: [
      "Kalıp sistemi, taze beton yükü ile donatı yoğunluğunu taşırken aynı zamanda kesit boyutunu sabit tutmalıdır. Bu durum panel, dikme, kuşak, gergi ve iskele sisteminin birlikte çalışmasını gerektirir.",
      "Kalıp doğruluğu; aks, düşeylik, alt kot ve yüzey sürekliliği üzerinden okunur. Bu dört başlıktan biri zayıfsa beton sonrası düzeltme çok daha maliyetli hale gelir.",
      "Ayrıca kalıp kararı, söküm sırasını da içinde taşır; çünkü kurulan sistem, hangi elemanın ne zaman emniyetle açılabileceğini belirler.",
    ],
    ruleTable: [
      {
        parameter: "Geometri doğruluğu",
        limitOrRequirement: "Aks, kesit ve kot kontrolleri döküm öncesi tamamlanmalı",
        reference: "TS EN 13670",
        note: "Beton sonrası düzeltme kalite ve süre açısından risklidir.",
      },
      {
        parameter: "Taşıma kapasitesi",
        limitOrRequirement: "Kalıp ve iskele, taze beton yükü ile işçilik yükünü güvenle taşımalı",
        reference: "Uygulama mühendisliği",
        note: "Yetersiz iskele sistemi sehim ve güvenlik problemi doğurur.",
      },
      {
        parameter: "Söküm planı",
        limitOrRequirement: "Açıklık ve beton dayanımı dikkate alınmalı",
        reference: "TS EN 13670",
        note: "Tali destekler gelişi güzel çekilmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Aks ve kot aplikasyonunu kalıp kurulumundan önce doğrula.",
      "Panel, kuşak ve iskele düzenini eleman yüküne göre kur.",
      "Donatı ve rezervasyonla çakışmayan temiz kalıp iç yüzeyi bırak.",
      "Döküm öncesi düşeylik, alt kot ve ölçü kontrolünü kayda geçir.",
      "Söküm planını beton dayanımı ve açıklık durumuna göre önceden belirle.",
    ],
    criticalChecks: [
      "Kolon-kiriş-döşeme aksları tek referansta kapandı mı?",
      "Kalıp iç yüzeyinde açıklık, kir veya boşluk var mı?",
      "İskele ve tali destekler açıklığa göre yeterli mi?",
      "Alt kot ve düşeylik ölçüsü döküm öncesi alındı mı?",
      "Söküm sırası önceden tanımlandı mı?",
    ],
    numericalExample: {
      title: "6,0 m açıklıklı döşeme bölgesinde iskele aralığına dair saha mantığı",
      inputs: [
        { label: "Açıklık", value: "6,0 m", note: "Tipik konut döşemesi" },
        { label: "Döşeme kalınlığı", value: "15 cm", note: "Projeden alınan değer" },
        { label: "Kiriş alt kotu", value: "değişken", note: "Mekanik koordinasyon etkisi var" },
        { label: "Hedef", value: "Sehimi kontrol ederek düz yüzey bırakmak", note: "Beton öncesi kalite hedefi" },
      ],
      assumptions: [
        "İskele sistemi üretici talimatına uygun kurulacaktır.",
        "Tali destekler söküm sonuna kadar korunacaktır.",
        "Döküm esnasında ilave yük birikmesine izin verilmeyecektir.",
      ],
      steps: [
        {
          title: "En kritik bölgeyi tanımla",
          result: "Açıklığın ortası ve kiriş-döşeme birleşimi en hassas bölgelerdir.",
          note: "Saha kontrolü tüm yüzeye eşit değil, riskli bölgelere yoğunlaşmalıdır.",
        },
        {
          title: "Koordinasyon etkisini yorumla",
          result: "Mekanik geçiş varsa alt kot kontrolü yalnızca şerit metreyle bırakılmamalıdır.",
          note: "Lazer nivo ile kontrol, sonraki kırma riskini azaltır.",
        },
      ],
      checks: [
        "En riskli bölgeler için ilave destek veya sık kontrol planı bulunmalıdır.",
        "Döküm sırasında iskeleye aşırı malzeme yüklenmemelidir.",
        "Söküm öncesi deformasyon gözlemi yapılmalıdır.",
      ],
      engineeringComment: "Kalıp hatası, betonla birlikte kalıcı hale gelen en pahalı ölçü hatasıdır.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Kalıp kontrolünü göz kararıyla yapmak.", correct: "Aks, kot ve düşeyliği ölçüm ekipmanı ile doğrulamak." },
      { wrong: "Donatı yoğunlaştıkça kalıp gergilerini rastgele azaltmak.", correct: "Sistemin rijitliğini yük durumuna göre korumak." },
      { wrong: "İç yüzey temizliğini önemsiz görmek.", correct: "Beton yüzeyi ve aderans için kalıbı temiz teslim etmek." },
      { wrong: "Söküm planını dökümden sonra düşünmek.", correct: "Kurulum sırasında açılma sırasını tasarlamak." },
      { wrong: "Rezervasyonları kalıp ekibine son anda bildirmek.", correct: "Tüm gömülü ve boşluk kararlarını kurulum öncesi netleştirmek." },
    ],
    designVsField: [
      "Projede 30x60 kesit gibi görünen eleman, sahada panel birleşimi, kuşak rijitliği, alt destek ve şakül hassasiyeti ister.",
      "Bu nedenle kalıp işleri, kaba inşaatın en görünmez ama en belirleyici mühendislik uygulamalarından biridir.",
    ],
    conclusion: [
      "Kalıp işleri doğru kurulduğunda betonarme eleman geometriyi kaybetmeden oluşur. Yanlış kurulduğunda ise sahadaki tüm ekipler aynı hatanın üzerine çalışmak zorunda kalır.",
    ],
    sources: [...KABA_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalıp işleri", "iskele sistemi", "betonarme tolerans", "kalıp kontrolü", "TS EN 13670"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri",
    kind: "topic",
    quote: "Donatı işleri, çeliğin miktarından çok doğru yerde ve doğru sırada bulunmasıyla güvence üretir.",
    tip: "Donatı yoğunluğu arttığında proje okuma kalitesi düşmemeli; tam tersine saha kaydı daha sıkı hale gelmelidir.",
    intro: [
      "Donatı işleri, betonarmenin moment, kesme ve süneklik davranışını sahada somut hale getirir. Yanlış bindirme, eksik etriye veya bozulmuş pas payı, taşıyıcı sistemin hesapta öngörülen davranışını zayıflatır.",
      "Bu rehber, donatı yerleşimini yalnızca demir miktarı değil; sıralama, okunabilirlik ve beton yerleşimine izin veren düzen olarak ele alır.",
    ],
    theory: [
      "Betonarme elemanda donatı, betonla birlikte çalışacak şekilde konumlandırılır. Bu nedenle çeliğin sadece alanı değil; örtü betonu, bindirme boyu, ankraj ve etriye sıklaştırması da tasarım davranışının parçasıdır.",
      "Sahada en sık problem, teorik olarak doğru donatının uygulamada sıkışıklık oluşturmasıdır. Bu sıkışıklık hem beton yerleşimini zorlaştırır hem de proje dışı bükme-kesme kararları doğurur.",
      "İyi donatı uygulaması, projeyi okumayı kolaylaştırır ve beton ekiplerinin işini de güvenli hale getirir.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna ve enine donatı",
        limitOrRequirement: "Detaylar TS 500 ve TBDY esaslarına uygun yerleştirilmeli",
        reference: "TS 500 + TBDY 2018",
        note: "Sünek davranış için etriye ve bindirme bölgeleri özellikle kritiktir.",
      },
      {
        parameter: "Pas payı",
        limitOrRequirement: "Eleman ve çevre koşuluna uygun örtü bırakılmalı",
        reference: "TS 500",
        note: "Pas payı yalnızca korozyon değil, aderans ve yangın performansını da etkiler.",
      },
      {
        parameter: "Bindirme düzeni",
        limitOrRequirement: "Aynı kesitte yığılma yaratmayacak şekilde dağıtılmalı",
        reference: "TS 500",
        note: "Yoğun bölge oluşursa beton yerleşimi ve kalite zayıflar.",
      },
    ],
    designOrApplicationSteps: [
      "Donatı listesi ve büküm planını saha montaj sırasına göre hazırla.",
      "Kolon, perde, kiriş ve döşeme detaylarını pas payı ve bindirme bölgeleriyle birlikte oku.",
      "Donatı yoğunluğu yüksek bölgelerde beton yerleşimini önceden değerlendir.",
      "Spacer, takoz ve sehpa elemanlarını proje dışı değil standart hale getir.",
      "Kalıp kapanmadan önce foto-kayıt ve mühendis onayıyla ön kabul yap.",
    ],
    criticalChecks: [
      "Bindirme bölgeleri aynı kesitte yığılmış mı?",
      "Etriye sıklaştırmaları ve uç bölgeler net mi?",
      "Pas payı takozları yeterli ve doğru yerde mi?",
      "Rezervasyon ve gömülü elemanlar donatıyla çakışıyor mu?",
      "Beton yerleşimini engelleyen sıkışıklık noktaları var mı?",
    ],
    numericalExample: {
      title: "Kolon bindirme bölgesi için saha kontrol mantığı",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Orta yükte kolon" },
        { label: "Boyuna donatı", value: "8Ø16", note: "Projeden" },
        { label: "Etriye sıklaştırma bölgesi", value: "uç bölgelerde artırılmış", note: "Deprem davranışı için kritik" },
        { label: "Pas payı hedefi", value: "40 mm", note: "Örnek saha kontrol değeri" },
      ],
      assumptions: [
        "Bindirme aynı kesitte tam yığılmayacak şekilde dağıtılacaktır.",
        "Takoz ve sehpa elemanları standart olarak kullanılacaktır.",
        "Kalıp kapanmadan önce görsel ve ölçü kontrolü yapılacaktır.",
      ],
      steps: [
        {
          title: "Kesit içi yoğunluğu gözden geçir",
          result: "8Ø16 yerleşimi teorik olarak sığsa da etriye ve pas payı birlikte okunmalıdır.",
          note: "Kesit sığması tek başına yeterli uygulama kriteri değildir.",
        },
        {
          title: "Bindirme ve etriye bölgesini ayır",
          result: "Sıklaştırma bölgesinde ilave yığılma varsa montaj sırası yeniden düzenlenmelidir.",
          note: "Aksi halde beton yerleşimi zorlaşır.",
        },
      ],
      checks: [
        "Kesit içinde beton akışını engelleyecek düğüm oluşmamalıdır.",
        "Pas payı takozu tüm kritik yüzlerde doğrulanmalıdır.",
        "Foto-kayıt, proje okumasını destekleyecek netlikte olmalıdır.",
      ],
      engineeringComment: "Donatının doğru miktarı kadar, betona yer bırakacak kadar doğru yerleşimi de önemlidir.",
    },
    tools: STRUCTURE_TOOLS,
    equipmentAndMaterials: STRUCTURE_EQUIPMENT,
    mistakes: [
      { wrong: "Bindirmeleri aynı kesitte toplamak.", correct: "Yığılmayı azaltacak şekilde dağıtmak." },
      { wrong: "Pas payını sahada yaklaşık bırakmak.", correct: "Standart takoz ve sehpa kullanmak." },
      { wrong: "Yoğun düğüm noktalarını beton ekibine bırakmak.", correct: "Montaj öncesi düzenlemek." },
      { wrong: "Projeyi okumadan demirci tecrübesiyle karar üretmek.", correct: "Her kritik detay için pafta ve kesit referansı kullanmak." },
      { wrong: "Kalıp kapanmadan foto-kayıt almamak.", correct: "Ön kabulü belgeli hale getirmek." },
    ],
    designVsField: [
      "Tasarım tarafında donatı alanı sayısal bir değerdir; sahada ise bağ teli, etriye, takoz ve beton akışıyla yaşayan fiziksel bir düzen olur.",
      "Bu nedenle donatı işleri, hesap doğruluğunun saha okunabilirliğine dönüştüğü noktadır.",
    ],
    conclusion: [
      "Donatı işleri ne kadar düzenli ve kayıtlı yürütülürse betonarme davranışı o kadar öngörülebilir olur. İyi donatı uygulaması, hem dayanımı hem de beton kalitesini birlikte korur.",
    ],
    sources: [...KABA_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["donatı işleri", "pas payı", "bindirme boyu", "etriye sıklaştırma", "betonarme donatı kontrolü"],
  },
];
