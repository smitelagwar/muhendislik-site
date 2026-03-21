import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_LEAF_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const BETON_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "İdecad / ETABS betonarme çıktıları", purpose: "Eleman kesitleri, beton sınıfı ve döküm öncesi kritik düğümleri proje ile eşlemek." },
  { category: "Kalite", name: "Slump, sıcaklık ve numune kayıt çizelgesi", purpose: "Her transmikserde taze beton kabulünü ve deney zincirini izlemek." },
  { category: "Planlama", name: "Beton sevkiyat çizelgesi", purpose: "Pompa kapasitesi ile santral sevkiyat ritmini aynı tabloda yönetmek." },
  { category: "Kontrol", name: "Excel / Python metraj ve döküm şablonları", purpose: "Hacim, iş derzi ve kür planını döküm öncesi hızlı kontrol etmek." },
];

const KALIP_TOOLS: BinaGuideTool[] = [
  { category: "Çizim", name: "AutoCAD / Revit kalıp paftaları", purpose: "Aks, rezervasyon ve kot detaylarını saha okunabilirliğinde netleştirmek." },
  { category: "Ölçüm", name: "Lazer nivo ve total station", purpose: "Kolon şakülü, kiriş alt kotu ve döşeme düzlemini beton öncesi doğrulamak." },
  { category: "Planlama", name: "Kat çevrimi ve söküm çizelgesi", purpose: "Kurulum, döküm, tali destek ve söküm sırasını disiplinli yönetmek." },
  { category: "Kontrol", name: "Sehim ve deformasyon kontrol listeleri", purpose: "Açıklık arttıkça kalıp ve iskele davranışını önceden izlemek." },
];

const DONATI_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "İdecad / ETABS donatı çıktıları", purpose: "Kesit taleplerini pafta üzerindeki donatı düzeniyle doğrulamak." },
  { category: "Çizim", name: "Büküm listesi ve shop drawing paftaları", purpose: "Montaj sırasını saha diline çevirerek çakışmaları azaltmak." },
  { category: "Kontrol", name: "Excel donatı metraj ve bindirme şablonları", purpose: "Adet, çap ve bindirme bölgelerini beton öncesi hızlı kontrol etmek." },
  { category: "Ölçüm", name: "Pas payı ve düğüm kontrol listeleri", purpose: "Spacer, etriye ve yoğun düğüm bölgelerinde saha kabulünü standardize etmek." },
];

const DUVAR_TOOLS: BinaGuideTool[] = [
  { category: "Çizim", name: "Mimari aks ve mahal paftaları", purpose: "Duvar eksenlerini, kapı boşluklarını ve mahal ölçülerini sahada doğru okumak." },
  { category: "Koordinasyon", name: "Tesisat geçiş matrisi", purpose: "Sonradan kırma ihtiyacını azaltmak için duvar ve tesisatı birlikte planlamak." },
  { category: "Ölçüm", name: "Lazer terazi, şakül ve mastar seti", purpose: "Duvar düşeyliği ve yüzey sürekliliğini hızlı biçimde doğrulamak." },
  { category: "Kontrol", name: "Mahal bazlı bitiş kontrol çizelgesi", purpose: "Doğrama, sıva ve kaplama öncesi duvar teslim kalitesini izlemek." },
];

const CATI_TOOLS: BinaGuideTool[] = [
  { category: "Çizim", name: "Çatı planı, kesit ve detay paftaları", purpose: "Eğim, aşık düzeni, mahya ve dere birleşimlerini sahaya net indirmek." },
  { category: "Ölçüm", name: "Lazer nivo ve eğim kontrol ekipmanı", purpose: "Çatı geometrisini ve tahliye yönünü montaj sırasında doğrulamak." },
  { category: "Koordinasyon", name: "Mekanik geçiş ve ekipman matrisi", purpose: "Baca, menfez, güneş enerjisi ve cihaz ayaklarını iskeletle birlikte çözmek." },
  { category: "Kontrol", name: "Bağlantı ve ankraj kontrol listesi", purpose: "Rüzgar, montaj sırası ve bakım erişimi açısından düğüm noktalarını izlemek." },
];

const KABA_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kalıp", name: "Panel kalıp, kuşak ve iskele sistemi", purpose: "Kesit geometrisini ve taze beton yükünü güvenle taşımak.", phase: "Kalıp" },
  { group: "Beton", name: "Beton pompası ve dağıtım hortumu", purpose: "Döküm sırasını kontrollü ilerletmek ve yüksekten düşmeyi azaltmak.", phase: "Betonlama" },
  { group: "Beton", name: "İğne vibratör ve yedek set", purpose: "Taze betonun donatı çevresinde boşluksuz yerleşmesini sağlamak.", phase: "Betonlama" },
  { group: "Kalite", name: "Slump konisi, termometre ve numune kalıpları", purpose: "Taze beton kabulünü ve basınç deneyi için örneklemeyi belgelemek.", phase: "Beton kabulü" },
  { group: "Kontrol", name: "Pas payı takozu, şakül ve mastar ekipmanları", purpose: "Donatı örtüsü ile kalıp geometrisini beton öncesi doğrulamak.", phase: "Ön kabul" },
];

const DONATI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "İmalat", name: "Kesme-bükme tezgahı", purpose: "Donatıları proje boyu ve büküm açısına uygun hazırlamak.", phase: "Atölye ve saha" },
  { group: "Montaj", name: "Bağ teli, pense ve bağlama ekipmanı", purpose: "Boyuna ve enine donatıyı montaj sırasında sabitlemek.", phase: "Donatı montajı" },
  { group: "Kontrol", name: "Pas payı takozu, spacer ve sehpa", purpose: "Örtü betonu ile katman aralığını korumak.", phase: "Ön kabul" },
  { group: "Ölçüm", name: "Metre, kumpas ve işaretleme seti", purpose: "Bindirme boyu, aralık ve düğüm ölçülerini kontrol etmek.", phase: "Donatı kontrolü" },
  { group: "Güvenlik", name: "Filiz başlık koruyucuları", purpose: "Açık filizlerin yaralanma riskini azaltmak.", phase: "Montaj sonrası" },
];

const DUVAR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Uygulama", name: "Mala, derz malası ve lastik tokmak", purpose: "Blok veya tuğla elemanları kontrollü şekilde yerleştirmek.", phase: "Duvar örümü" },
  { group: "Ölçüm", name: "Şakül, mastar ve lazer terazi", purpose: "Duvar düşeyliği ile yüzey düzgünlüğünü izlemek.", phase: "Duvar kontrolü" },
  { group: "Hazırlık", name: "Blok kesme makinesi veya keski seti", purpose: "Kapı boşluğu, lento altı ve köşe dönüşlerinde düzgün kesim yapmak.", phase: "Duvar örümü" },
  { group: "Bağlantı", name: "Duvar ankraj elemanları ve lento profilleri", purpose: "Betonarme birleşimleri ve açıklıkları güvenli çözmek.", phase: "Birleşim detayları" },
  { group: "Koordinasyon", name: "Tesisat kılıf ve geçiş parçaları", purpose: "Sonradan kırmayı azaltacak planlı geçişler bırakmak.", phase: "Tesisat koordinasyonu" },
];

const CATI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Makas, aşık ve bağlantı elemanları", purpose: "Çatı iskeletinin ana geometrisini ve yük aktarımını kurmak.", phase: "Montaj" },
  { group: "Ölçüm", name: "Lazer nivo, metre ve açı ölçer", purpose: "Eğim, mahya doğrultusu ve aks sürekliliğini kontrol etmek.", phase: "Montaj kontrolü" },
  { group: "Bağlantı", name: "Bulon, levha ve ankraj setleri", purpose: "Çelik veya ahşap birleşimlerde taşıyıcı sürekliliği sağlamak.", phase: "Birleşim montajı" },
  { group: "Kaplama öncesi", name: "OSB, alt kaplama veya su yalıtım altlıkları", purpose: "Kaplama katmanına düzgün ve sürekli bir alt yüzey hazırlamak.", phase: "Kaplama hazırlığı" },
  { group: "Güvenlik", name: "İskele, yaşam hattı ve düşmeye karşı ekipman", purpose: "Çatı montajında güvenli çalışma platformu oluşturmak.", phase: "Tüm süreç" },
];

export const kabaInsaatLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/beton-isleri/beton-dokumu",
    kind: "topic",
    quote: "Beton dökümü, şantiyede en görünür hız gösterilerinden biri gibi görünür; gerçekte ise en sıkı hazırlık isteyen kalite operasyonudur.",
    tip: "Beton dökümünde sorun çoğu zaman mikser geldikten sonra değil, mikser gelmeden önce sevkiyat, pompa ve iş derzi planı kurulmadığında başlar.",
    intro: [
      "Beton dökümü, kalıp ve donatı ile hazırlanan taşıyıcı sistemin taze betonla gerçek yapıya dönüştüğü andır. Bu an, sahada en kalabalık ve en kritik operasyonlardan biridir; çünkü kalıp, donatı, laboratuvar, pompa, santral ve şantiye yönetimi aynı zaman çizgisinde çalışmak zorundadır.",
      "Birçok projede hazır beton sınıfı doğru seçildiği halde kalite, döküm organizasyonu zayıf kurulduğu için kaybedilir. Geciken transmikser, yanlış pompaj sırası, yoğun düğümlerde yetersiz vibrasyon veya hazırlıksız iş derzi kararı yapısal ve estetik sorunları aynı anda büyütür. Bu nedenle beton dökümü yalnız malzeme kabulü değil, uçtan uca saha yönetimidir.",
    ],
    theory: [
      "Taze betonun sahadaki davranışı, kıvam ve karışım tasarımı kadar yerleştirme ritmine bağlıdır. Beton uzun süre beklerse işlenebilirlik kaybı yaşanır; çok hızlı ve kontrolsüz verilirse segregasyon veya kalıp zorlanması oluşabilir. Bu dengeyi kurmak için pompa kapasitesi ile sevkiyat kapasitesi birbirine göre kalibre edilmelidir.",
      "Beton dökümünde asıl risk, sürekliliğin bozulmasıdır. Döküm zonları önceden tanımlanmazsa ekip yalnız betonu yetiştirmeye odaklanır ve iş derzi nerede oluştuğunu sonradan fark eder. Oysa soğuk derz, geometrik değil zamanla oluşan bir problemdir; bu yüzden karar saha saatine göre yönetilmelidir.",
      "Ayrıca döküm, kalıp ve donatı ile ayrı düşünülmemelidir. Donatının sık olduğu bölgelerde betonun geçiş yönü, hortum erişimi ve vibratör sırası değişir. İyi bir döküm planı, elemanın kesitini okumakla başlar; pompa hortumunu nereye koyacağını bilmekle tamamlanır.",
    ],
    ruleTable: [
      {
        parameter: "Hazır beton kabulü",
        limitOrRequirement: "Beton sınıfı, kıvamı ve sevk bilgileri irsaliye ile doğrulanmalıdır.",
        reference: "TS EN 206",
        note: "Sahaya gelen her araç, proje betonunu getirmiş sayılmaz; kabul prosedürü işletilmelidir.",
      },
      {
        parameter: "Yerleştirme ve uygulama",
        limitOrRequirement: "Beton kontrollü yükseklikten, katmanlı ve vibrasyonla birlikte yerleştirilmelidir.",
        reference: "TS EN 13670",
        note: "Yerleştirme sırası planlanmadan yapılan dökümde kalite rastlantıya bırakılır.",
      },
      {
        parameter: "Döküm kaydı ve numune",
        limitOrRequirement: "Her sevkiyat numune ve saha kaydıyla izlenmelidir.",
        reference: "Taze Beton Numune Tebliği",
        note: "Numune zinciri yalnız laboratuvar için değil, teslim sorumluluğu için de kritiktir.",
      },
    ],
    designOrApplicationSteps: [
      "Döküm öncesi kalıp, donatı, rezervasyon, pompa yeri ve personel dağılımını tek kontrol formunda kapat.",
      "Beton sevkiyat saatlerini pompa kapasitesi ve eleman hacmine göre santral ile sabitle.",
      "Dökümü şeritler veya bölgeler halinde planlayarak olası iş derzi yerlerini önceden belirle.",
      "İlk araçtan itibaren slump, sıcaklık ve numune zincirini aynı disiplinle sürdür.",
      "Döküm biter bitmez yüzey koruma ve kür başlatma adımını ayrı ekip sorumluluğuna bağla.",
    ],
    criticalChecks: [
      "Transmikser aralıkları pompayı bekletmeyecek kadar dengeli mi?",
      "Döküm zonları ve olası iş derzi yerleri önceden tanımlandı mı?",
      "Yoğun donatı düğümlerinde hortum ve vibratör erişimi çözülmüş mü?",
      "Numune, slump ve irsaliye kayıtları aynı sıra ile tutuluyor mu?",
      "Döküm sonrası ilk saatler için kür malzemesi ve ekip hazır mı?",
    ],
    numericalExample: {
      title: "95 m³ kolon-kiriş-döşeme dökümü için süre hesabı",
      inputs: [
        { label: "Toplam beton hacmi", value: "95 m³", note: "Tipik kat dökümü" },
        { label: "Etkili pompa kapasitesi", value: "30 m³/saat", note: "Gerçek saha kapasitesi" },
        { label: "Tahmini saf döküm süresi", value: "3,2 saat", note: "95 / 30" },
        { label: "Saha kayıp payı", value: "1,0-1,5 saat", note: "Numune, bekleme ve manevra etkisi" },
      ],
      assumptions: [
        "Pompa konumu tüm döküm alanına erişebilmektedir.",
        "İki aktif vibratör ve bir yedek set sahadadır.",
        "Transmikserler ortalama sabit aralıkla şantiyeye ulaşmaktadır.",
      ],
      steps: [
        {
          title: "Saf pompa süresini hesapla",
          formula: "95 / 30 = 3,17 saat",
          result: "Teorik olarak beton yaklaşık 3,2 saatte yerleştirilebilir.",
          note: "Bu değer, saha içi beklemeleri içermeyen ideal süredir.",
        },
        {
          title: "Gerçek operasyon süresini yorumla",
          result: "Numune alma, hortum taşıma ve düğüm bölgelerde yavaşlama ile toplam süre 4,2-4,7 saate çıkabilir.",
          note: "Bu fark önceden bilinmezse iş derzi ve personel yorgunluğu riski artar.",
        },
      ],
      checks: [
        "Döküm planı teorik değil gerçek saha kapasitesiyle yapılmalıdır.",
        "Katman kalınlığı ve bekleme süresi birlikte yönetilmelidir.",
        "Süre uzadıkça kür başlangıcı geciktirilmemelidir.",
      ],
      engineeringComment: "Beton dökümünde kalite çoğu zaman beton reçetesinden değil, gerçek saha süresinin dürüst hesaplanıp hesaplanmadığından anlaşılır.",
    },
    tools: BETON_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Pompa kapasitesini katalog değeri üzerinden planlayıp saha kayıplarını yok saymak.", correct: "Gerçek saha temposunu kullanarak sevkiyat ve personel planı yapmak." },
      { wrong: "Döküm zonlarını sahada anlık kararlarla belirlemek.", correct: "İş derzi ihtimalini önceden değerlendirip alanı planlamak." },
      { wrong: "İrsaliye ve slump kaydını birkaç araçtan sonra gevşetmek.", correct: "Tüm döküm boyunca aynı kabul disiplinini sürdürmek." },
      { wrong: "Yoğun düğümlerde betonun kendi akışıyla yerleşeceğini varsaymak.", correct: "Vibrasyon ve yerleştirme sırasını özel olarak planlamak." },
      { wrong: "Kür hazırlığını beton bittikten sonra başlatmak.", correct: "Döküm devam ederken eşzamanlı koruma planını hazır tutmak." },
    ],
    designVsField: [
      "Projede beton dökümü yalnız bir not veya beton sınıfı gibi görünür; sahada ise saat, ekipman ve koordinasyonun aynı anda doğru işlemesi gereken bir operasyon zinciridir.",
      "Bu yüzden iyi beton dökümü, yalnız iyi beton siparişi değil; iyi akış tasarımı anlamına gelir.",
    ],
    conclusion: [
      "Beton dökümü hazırlıklı yürütüldüğünde taşıyıcı sistem projedeki davranışa daha yakın oluşur. Hazırlıksız yürütüldüğünde ise sorun beton donmadan önce değil, çoğu zaman kalıp açıldıktan sonra görünür hale gelir.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tazeBetonNumuneTebligi],
    keywords: ["beton dökümü", "hazır beton kabulü", "iş derzi", "pompa planı", "taze beton numunesi"],
  },
  {
    slugPath: "kaba-insaat/beton-isleri/vibrasyon",
    kind: "topic",
    quote: "Vibrasyon, betonun fazlalık suyla değil enerjinin doğru dozuyla yerleşmesini sağlayan kritik kalite adımıdır.",
    tip: "Eksik vibrasyon kadar aşırı vibrasyon da sorundur; biri boşluk bırakır, diğeri segregasyon ve şerbet ayrışması üretir.",
    intro: [
      "Vibrasyon, taze betonun donatı çevresini ve kalıp köşelerini boşluksuz doldurabilmesi için uygulanan sıkıştırma işlemidir. Beton dökümündeki en kritik kalite halkalarından biridir; çünkü beton sınıfı ne kadar doğru olursa olsun, yerleşmeyen beton kesitte gerçek dayanımını ve yüzey kalitesini gösteremez.",
      "Şantiyede vibrasyon çoğu zaman ustalık refleksiyle yürütülür; oysa iyi vibrasyon belirli aralık, süre ve sıra gerektirir. Özellikle kolon uçları, kiriş mesnetleri, perde dipleri ve yoğun donatı düğümleri vibrasyon kalitesinin en hızlı sınandığı yerlerdir. Bu nedenle vibrasyon, 'titreştir geç' işi değil, kesit okuma işidir.",
    ],
    theory: [
      "İğne vibratör, betonda geçici akışkanlık oluşturarak tanelerin yeniden düzenlenmesini ve hapsolmuş havanın dışarı çıkmasını sağlar. Amaç betona su eklemek değil, mevcut karışımın kesit içinde daha iyi yerleşmesine yardım etmektir. Bu yüzden doğru ekipman seçimi ve uygulama süresi kritik hale gelir.",
      "Yetersiz vibrasyon boşluk, peteklenme ve donatı çevresinde aderans zayıflığı üretir. Aşırı vibrasyon ise iri agreganın ayrışmasına, yüzeyde fazla şerbet birikmesine ve özellikle yüksek kıvamlı karışımlarda istenmeyen segregasyona neden olabilir. İki uç davranış da beton kalitesini düşürür; doğru olan kontrollü orta noktadır.",
      "Vibrasyonun başarısı yalnız cihazın çalışmasına değil, katman mantığına bağlıdır. Beton çok kalın tek tabaka halinde bırakılıp yüzeyden vibrasyon yapılırsa alt kısım yeterince etkilenmeyebilir. Bu nedenle döküm katmanları ile vibrasyon sırası birbirine bağlı düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Katmanlı yerleştirme",
        limitOrRequirement: "Vibrasyon, betonun kontrollü katmanlar halinde yerleştirildiği düzende uygulanmalıdır.",
        reference: "TS EN 13670",
        note: "Kalın ve kontrolsüz tabaka, vibrasyon etkisini kesit içinde zayıflatır.",
      },
      {
        parameter: "Ekipman ve erişim",
        limitOrRequirement: "Kesit boyutuna ve donatı yoğunluğuna uygun iğne vibratör kullanılmalıdır.",
        reference: "Saha uygulama disiplini",
        note: "Kalın iğne her düğüme giremeyebilir; ince iğne de büyük hacimde yetersiz kalabilir.",
      },
      {
        parameter: "Ayrışma kontrolü",
        limitOrRequirement: "Vibrasyon süresi segregasyon yaratmayacak şekilde sınırlı tutulmalıdır.",
        reference: "TS EN 13670 + saha deneyimi",
        note: "Titreşim süresi beton kıvamı ve kesit geometrisine göre okunmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre uygun vibratör çapı ve yedek ekipmanı döküm öncesi hazırla.",
      "Betonu katmanlı yerleştirerek vibratörün tüm kesite etkili ulaşmasını sağla.",
      "İğneyi düzenli aralıklarla daldır, bir önceki katmana kısmen geçirerek süreklilik oluştur.",
      "Köşe, düğüm ve yoğun donatı bölgelerinde özel dikkat göster; şerbet ayrışması görürsen süreyi kısalt.",
      "Kalıp açıldığında görülen yüzey kusurlarını bir sonraki döküm için vibrasyon geri bildirimi olarak kullan.",
    ],
    criticalChecks: [
      "Vibratör çapı kesit ve donatı yoğunluğuna uygun mu?",
      "Katman kalınlığı vibrasyon etkisini zayıflatacak kadar büyük mü?",
      "Köşe ve düğüm bölgelerinde peteklenme riski görülen alanlar var mı?",
      "Aşırı vibrasyona bağlı segregasyon veya fazla şerbet birikimi oluşuyor mu?",
      "Yedek vibratör sahada çalışır halde hazır mı?",
    ],
    numericalExample: {
      title: "30 x 60 cm kirişte vibrasyon noktası mantığı",
      inputs: [
        { label: "Kiriş kesiti", value: "30 x 60 cm", note: "Yoğun etriyeli örnek" },
        { label: "Katman yüksekliği", value: "30 cm", note: "İki katmanlı yerleştirme" },
        { label: "Vibratör aralığı", value: "yaklaşık 40-50 cm", note: "Etkili alan örtüşecek şekilde" },
        { label: "Hedef", value: "Peteklenmesiz ve segregasyonsuz kesit", note: "Kalite ölçütü" },
      ],
      assumptions: [
        "Beton kıvamı proje kabul aralığındadır.",
        "İğne vibratör donatı aralarına erişebilmektedir.",
        "Yerleştirme yüksekliği kontrol altındadır.",
      ],
      steps: [
        {
          title: "Katman düzenini kur",
          result: "60 cm yüksekliğin tek sefer yerine iki katmanda yönetilmesi vibrasyon etkinliğini artırır.",
          note: "İlk katman tam yerleşmeden ikinci katmana geçmek uygun değildir.",
        },
        {
          title: "Nokta aralığını yorumla",
          result: "Yaklaşık 40-50 cm aralık, etkili bölgelerin örtüşmesini sağlar ve boş alan bırakma riskini azaltır.",
          note: "Aralık büyüdükçe görünmeyen boşluk riski artar; çok küçüldükçe aşırı vibrasyon riski oluşur.",
        },
      ],
      checks: [
        "Vibrasyon noktaları sahada rastgele değil düzenli ilerlemelidir.",
        "Bir önceki katmanla kısmi örtüşme sağlanmalıdır.",
        "Segregasyon görülen bölgelerde süre ve sıklık yeniden ayarlanmalıdır.",
      ],
      engineeringComment: "Vibrasyonun doğrusu, betonu titreştirmekten çok kesit içinde boşluk bırakmayacak bir ritim kurabilmektir.",
    },
    tools: BETON_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Vibrasyonu yalnız beton yüzeyinde gezdirerek yapmak.", correct: "İğneyi kesit içine kontrollü daldırıp katmanları birlikte sıkıştırmak." },
      { wrong: "Her elemanda aynı süre ve aralığı mekanik biçimde kullanmak.", correct: "Kesit boyutu ve donatı yoğunluğuna göre uygulamayı ayarlamak." },
      { wrong: "Peteklenmeyi yalnız beton sınıfına bağlamak.", correct: "Yerleştirme ve vibrasyon kalitesini birlikte sorgulamak." },
      { wrong: "Aşırı şerbet çıkmasını iyi vibrasyon sanmak.", correct: "Segregasyonu işaret eden belirtileri fark edip süreyi sınırlamak." },
      { wrong: "Yedek vibratör bulundurmadan büyük döküme girmek.", correct: "Arıza riskine karşı yedek ekipman ve personel hazırlamak." },
    ],
    designVsField: [
      "Projede vibrasyon diye ayrı bir çizgi yoktur; ama sahada beton kalitesinin en görünmeyen belirleyicilerinden biri budur.",
      "İyi vibrasyon, tasarımda yazılı dayanımı sahada gerçek kesite dönüştüren sessiz işlemdir.",
    ],
    conclusion: [
      "Vibrasyon doğru yönetildiğinde betonun donatı çevresinde boşluksuz ve homojen yerleşmesini sağlar. İhmal edildiğinde veya aşırı uygulandığında ise kusur beton sertleştikten sonra görünür hale gelir.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tsEn206],
    keywords: ["vibrasyon", "iğne vibratör", "peteklenme", "segregasyon", "beton yerleşimi"],
  },
  {
    slugPath: "kaba-insaat/beton-isleri/kur-islemi",
    kind: "topic",
    quote: "Kür işlemi, beton dökümünün sonradan eklenen değil; döküm anında başlayan ikinci yarısıdır.",
    tip: "Kürü ertesi güne bırakmak, betonun en kritik erken yaş saatlerini kontrolsüz biçimde kaybetmek anlamına gelir.",
    intro: [
      "Kür işlemi, betonun hidratasyonunu sürdürebilmesi ve tasarım dayanımına güvenli biçimde ulaşabilmesi için nem ve sıcaklık koşullarının kontrollü yönetilmesidir. Özellikle döşeme, radye ve geniş yüzeyli elemanlarda dökümden sonraki ilk saatler, betonun uzun vadeli performansını belirleyecek kadar kritiktir.",
      "Şantiyede kür çoğu zaman yalnız sulama olarak düşünülür; oysa doğru kür, yüzeyin ne zaman korunacağı, hangi yöntemle nem kaybının önleneceği ve hava koşullarına göre ne kadar süre devam edileceği sorularını birlikte içerir. Beton iyi yerleşmiş olsa bile kür zayıfsa rötre çatlağı, yüzey tozuması ve dayanım kaybı gibi sorunlar kaçınılmaz hale gelir.",
    ],
    theory: [
      "Betonda dayanım gelişimi, çimento hidratasyonunun devam etmesine bağlıdır. Bu reaksiyon için yeterli nem ve uygun sıcaklık aralığı gerekir. Beton yüzeyi özellikle rüzgar, güneş ve düşük bağıl nem etkisi altında çok hızlı su kaybederse hidratasyon erken yavaşlar ve yüzey iç kısımdan farklı davranmaya başlar.",
      "Erken yaşta oluşan nem farkları, plastik rötre ve termal gerilme çatlaklarını tetikleyebilir. Bu nedenle kürün amacı yalnız su vermek değil; yüzeyin ani kaybını azaltmak, sıcaklık farklarını sınırlamak ve betonun kontrollü gelişmesini sağlamaktır. Her hava koşulu için aynı kür yöntemi uygun olmayabilir.",
      "Kür planı eleman tipine göre de değişir. Kolon ve perdede kalıbın bir süre korunması zaten bir tür koruma sağlar; döşeme ve radye gibi açık yüzeylerde ise ilk müdahale çok daha kritik olur. Bu yüzden kür, kalıp söküm takvimiyle de birlikte düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Erken yaş nem kontrolü",
        limitOrRequirement: "Beton yüzeyi döküm sonrası mümkün olan en erken aşamada korunmalıdır.",
        reference: "TS EN 13670",
        note: "En büyük kayıp çoğu zaman ilk saatlerde gerçekleşir.",
      },
      {
        parameter: "Hava koşuluna göre yöntem seçimi",
        limitOrRequirement: "Sulama, kür örtüsü veya kimyasal kür yöntemi sahadaki sıcaklık ve rüzgara göre belirlenmelidir.",
        reference: "TS EN 13670 + saha kalite planı",
        note: "Tek yöntem her projede aynı sonucu vermez.",
      },
      {
        parameter: "Koruma süresi",
        limitOrRequirement: "Kür süresi takvim baskısıyla değil beton gelişimi ve iklimle birlikte okunmalıdır.",
        reference: "TS EN 13670",
        note: "Erken bırakılan kür, görünmeyen dayanıklılık kaybı üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Dökümden önce eleman tipine ve hava durumuna göre kür yöntemini ve sorumlu ekibi belirle.",
      "Beton yüzeyi ilk fırsatta örtü, membran veya kontrollü sulama ile koruma altına al.",
      "Özellikle rüzgarlı ve sıcak havada yüzey nem kaybını sık aralıklarla gözle ve müdahale et.",
      "Kalıp sökümüyle birlikte koruma kesintiye uğramayacak şekilde alternatif kür düzeni kur.",
      "Kür süresini yalnız gün sayısıyla değil yüzey davranışı, sıcaklık ve iş programı ile birlikte değerlendir.",
    ],
    criticalChecks: [
      "Kür malzemesi döküm günü sahada hazır mı?",
      "Yüzey koruması beton bittikten hemen sonra başlatıldı mı?",
      "Sıcaklık, rüzgar ve güneş etkisi dikkate alındı mı?",
      "Kalıp söküldüğünde koruma kesintiye uğruyor mu?",
      "Yüzeyde erken çatlak veya tozuma belirtisi görülüyor mu?",
    ],
    numericalExample: {
      title: "Sıcak havada döşeme yüzeyi için kür riski yorumu",
      inputs: [
        { label: "Hava sıcaklığı", value: "32°C", note: "Yaz dökümü" },
        { label: "Rüzgar", value: "orta şiddette", note: "Yüzey kaybını artırıyor" },
        { label: "Eleman tipi", value: "18 cm döşeme", note: "Geniş açık yüzey" },
        { label: "Hedef", value: "İlk saatlerde nem kaybını sınırlamak", note: "Plastik rötreyi azaltmak" },
      ],
      assumptions: [
        "Beton yerleştirme ve perdahlama tamamlanmıştır.",
        "Yüzey geniş alanlı olduğu için açıkta kalma süresi kritiktir.",
        "Kür örtüsü ve su kaynağı sahada mevcuttur.",
      ],
      steps: [
        {
          title: "Risk düzeyini tanımla",
          result: "32°C ve rüzgar kombinasyonu, yüzey su kaybı açısından yüksek risk oluşturur.",
          note: "Bu durumda ertesi gün sulama başlatmak açıkça geç kalmak anlamına gelir.",
        },
        {
          title: "Kür yöntemini seç",
          result: "İlk aşamada yüzeyi koruyacak örtü veya uygun yüzey koruma yöntemi devreye alınmalı, ardından kontrollü nemlendirme sürdürülmelidir.",
          note: "Amaç suyu bolca dökmek değil, kaybı düzenli biçimde sınırlamaktır.",
        },
      ],
      checks: [
        "Sıcak hava dökümlerinde kür başlangıcı saatler değil dakikalarla düşünülmelidir.",
        "Yöntem seçimi yüzey tipi ve iş programı ile uyumlu olmalıdır.",
        "Erken çatlak görüldüğünde kür protokolü yeniden sıkılaştırılmalıdır.",
      ],
      engineeringComment: "Kür, betonun dayanımını sonradan artıran bir ek iş değil; döküm sırasında kaybetmemeyi sağlayan koruma işidir.",
    },
    tools: BETON_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Kürü yalnız sulama olarak görmek.", correct: "Nem ve sıcaklık kontrolünü birlikte yöneten yöntem seçmek." },
      { wrong: "Döküm biter bitmez ekibi dağıtıp yüzeyi korumasız bırakmak.", correct: "Kür ekibini döküm operasyonunun parçası olarak hazır tutmak." },
      { wrong: "Sıcak ve rüzgarlı havada standart prosedürü aynen uygulamak.", correct: "Hava koşuluna göre daha erken ve daha sık koruma başlatmak." },
      { wrong: "Kalıp sökümü ile kürün de bittiğini varsaymak.", correct: "Koruma kesintisiz sürecek ikinci düzeni önceden kurmak." },
      { wrong: "Yüzey çatlaklarını yalnız karışım problemine bağlamak.", correct: "Erken yaş kür başarısını da sorgulamak." },
    ],
    designVsField: [
      "Projede kür çoğu zaman tek satırlık bir nottur; sahada ise betonun ilk günlerdeki gerçek yaşam koşulunu belirleyen temel kalite kararıdır.",
      "İyi kür, görünmeyen ama uzun ömürlü bir performans yatırımıdır.",
    ],
    conclusion: [
      "Kür işlemi disiplinli yürütüldüğünde betonun dayanım, dayanıklılık ve yüzey performansı birlikte iyileşir. İhmal edildiğinde ise hata çoğu zaman geri döndürülemez bir erken yaş problemi olarak kalır.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tsEn206],
    keywords: ["kür işlemi", "erken yaş beton", "plastik rötre", "nem kaybı", "beton koruma"],
  },
  {
    slugPath: "kaba-insaat/beton-isleri/beton-sinifi",
    kind: "topic",
    quote: "Beton sınıfı seçimi, şantiyeye yalnız daha güçlü beton istemek değil; taşıyıcı ihtiyacı, çevre koşulu ve uygulama kabiliyetini birlikte tarif etmektir.",
    tip: "Beton sınıfını yalnız dayanım harfi ve rakamı olarak görmek, çevresel etki sınıfı, kıvam ve agrega boyutu gibi gerçek saha parametrelerini görünmez hale getirir.",
    intro: [
      "Beton sınıfı, taşıyıcı sistemin beklenen basınç dayanımını tanımlayan temel tasarım kararlarından biridir. Ancak sahadaki performans yalnız C30/37, C35/45 gibi sınıf adıyla belirlenmez; aynı sipariş içinde çevresel etki sınıfı, kıvam, maksimum agrega çapı ve pompalanabilirlik gibi parametreler de gerçek kaliteyi şekillendirir.",
      "Bu nedenle beton sınıfı seçimi, statik proje ile saha uygulamasının ortak karar alanıdır. Kolon, perde, radye veya döşeme için aynı beton her zaman en iyi çözüm olmayabilir. Doğru seçim; eleman geometrisi, donatı yoğunluğu, çevre etkisi ve döküm yöntemi birlikte okunarak yapılır.",
    ],
    theory: [
      "Beton sınıfı ifadesindeki ilk değer silindir, ikinci değer küp dayanımına karşılık gelir. Tasarım açısından bu sınıf, kesit hesabında kullanılacak dayanım düzeyini belirler; uygulama açısından ise karışım tasarımı, su/çimento oranı ve işlenebilirlik üzerinde dolaylı etki yaratır. Daha yüksek sınıf beton her zaman daha kolay uygulanabilir veya daha ekonomik olmayabilir.",
      "Beton seçimi çevresel etki sınıfından bağımsız düşünülemez. Toprakla temas, donma-çözülme, klor etkisi veya sürekli ıslaklık gibi koşullar aynı dayanım sınıfında bile farklı dayanıklılık gereksinimleri doğurabilir. Bu yüzden doğru beton yalnız yüksek dayanım değil, doğru maruziyet uyumudur.",
      "Sahada bir diğer kritik konu pompalanabilirlik ve kesit geçirgenliğidir. Donatısı çok sık bir perde veya kolon düğümünde seçilen agrega çapı ve kıvam, laboratuvar değerinden daha pratik hale gelir. Kâğıt üzerinde iyi görünen karışım, kesit içine güvenle giremiyorsa sınıf seçimi eksik yapılmış demektir.",
    ],
    ruleTable: [
      {
        parameter: "Minimum beton sınıfı",
        limitOrRequirement: "Deprem etkili betonarme sistemlerde yönetmelik alt sınırı korunmalıdır.",
        reference: "TBDY 2018, 7.2.1",
        note: "Sınıf seçimi yalnız alışkanlıkla değil yönetmelik tabanı ile başlamalıdır.",
      },
      {
        parameter: "Karışım ve performans",
        limitOrRequirement: "Dayanım sınıfı, kıvam ve çevresel etki koşulu birlikte sipariş edilmelidir.",
        reference: "TS EN 206",
        note: "Tek başına C sınıfı yazmak eksik sipariş bilgisidir.",
      },
      {
        parameter: "Kesit ve uygulama uyumu",
        limitOrRequirement: "Agrega çapı ve işlenebilirlik donatı yoğunluğuna uygun seçilmelidir.",
        reference: "TS EN 206 + saha uygulama disiplini",
        note: "Eleman geometrisi, seçilen karışımın sahadaki gerçek testidir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre dayanım ihtiyacını ve yönetmelik alt sınırını belirle.",
      "Çevresel etki koşullarını okuyarak dayanıklılık gereksinimini siparişe dahil et.",
      "Donatı yoğunluğu ve pompaj koşuluna göre kıvam ile agrega çapını değerlendir.",
      "Aynı projede farklı elemanlar için gereksiz tek tip beton yerine rasyonel sınıf paketleri oluştur.",
      "Seçilen sınıfın sahadaki slump, numune ve yerleşme davranışını ilk dökümlerde yakından izle.",
    ],
    criticalChecks: [
      "Beton siparişinde yalnız dayanım sınıfı mı yazıyor, yoksa çevresel etki ve kıvam da tarifli mi?",
      "Yoğun donatı düğümlerinde seçilen agrega çapı uygun mu?",
      "Aynı beton sınıfı tüm elemanlara alışkanlıkla mı uygulanıyor?",
      "Pompa ve taşıma yöntemi işlenebilirliği etkiliyor mu?",
      "İlk dökümlerde seçilen sınıfın saha davranışı kayıt altına alınıyor mu?",
    ],
    numericalExample: {
      title: "Kolon ve döşeme için beton sınıfı paketini ayırma mantığı",
      inputs: [
        { label: "Kolon/perde elemanları", value: "yoğun donatılı, deprem kritik", note: "Daha sık düğüm bölgeleri" },
        { label: "Döşeme elemanları", value: "geniş alan, daha rahat kesit", note: "Pompaj sürekliliği önemli" },
        { label: "Yönetmelik alt sınırı", value: "C25/30", note: "TBDY tabanı" },
        { label: "Örnek saha tercihi", value: "kolon/perde C35, döşeme C30", note: "Projeye göre değişir" },
      ],
      assumptions: [
        "Kesin seçim statik proje ve laboratuvar tasarımı ile teyit edilecektir.",
        "Kolon düğümlerinde daha yüksek dayanım ve işlenebilirlik birlikte aranabilir.",
        "Döşemede pompalanabilirlik ve yüzey bitiş kalitesi önemlidir.",
      ],
      steps: [
        {
          title: "Alt sınırı belirle",
          result: "Önce yönetmelik gereği alt sınırın altına düşülmeyeceği netleştirilir.",
          note: "Karar yüksek sınıftan başlamak değil, doğru tabanı kurmaktır.",
        },
        {
          title: "Eleman bazında ayrımı yorumla",
          result: "Yoğun düğüm bölgeleri ile geniş açık yüzeyler için aynı beton her zaman en rasyonel çözüm olmayabilir.",
          note: "Amaç gereksiz çeşit değil, teknik olarak anlamlı sınıf paketidir.",
        },
      ],
      checks: [
        "Beton sınıfı kararı eleman davranışı ile birlikte okunmalıdır.",
        "Sipariş dili laboratuvar ve saha tarafından aynı anlaşılmalıdır.",
        "İlk dökümlerin performansı sonraki siparişleri beslemelidir.",
      ],
      engineeringComment: "Beton sınıfı seçiminin başarısı, dayanım rakamından çok sahada doğru elemanda doğru karışımın kullanılıp kullanılmadığıyla anlaşılır.",
    },
    tools: BETON_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Beton sınıfını yalnız C değeri üzerinden tarif etmek.", correct: "Çevresel etki, kıvam ve agrega boyutu ile birlikte tanımlamak." },
      { wrong: "Yüksek sınıf betonun her zaman daha iyi olduğunu varsaymak.", correct: "Eleman, maliyet ve uygulama kabiliyetini birlikte değerlendirmek." },
      { wrong: "Yoğun donatı kesitlerinde işlenebilirlik konusunu yok saymak.", correct: "Kesit geçirgenliği ve pompajı sipariş kararına dahil etmek." },
      { wrong: "İlk dökümlerde gelen veriyi sonraki siparişe yansıtmamak.", correct: "Saha geri bildirimini karışım ve kabul planına entegre etmek." },
      { wrong: "Yönetmelik alt sınırını proje dışı yorumla aşındırmak.", correct: "TBDY ve TS EN 206 çerçevesinde net sipariş dili kurmak." },
    ],
    designVsField: [
      "Tasarımda beton sınıfı bir dayanım parametresidir; sahada ise kıvam, agrega, pompaj ve çevresel dayanıklılık kararlarının toplandığı operasyonel bir pakettir.",
      "Bu yüzden iyi sınıf seçimi, statik ofis kararı ile saha gerçekliğinin tam ortasında yapılır.",
    ],
    conclusion: [
      "Beton sınıfı doğru seçildiğinde kesit hesabı, saha yerleşebilirliği ve dayanıklılık aynı pakette buluşur. Yanlış seçildiğinde ise ya gereksiz maliyet ya da uygulama zorluğu çok hızlı ortaya çıkar.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.tsEn206],
    keywords: ["beton sınıfı", "C30/37", "çevresel etki sınıfı", "beton seçimi", "TBDY 7.2.1"],
  },
  {
    slugPath: "kaba-insaat/beton-isleri/beton-testi",
    kind: "topic",
    quote: "Beton testleri, dökülen malzemenin yalnız geldiğini değil, proje şartını gerçekten sağladığını ispatlayan kayıt zinciridir.",
    tip: "Beton testinde en sık hata numuneyi almakla işi bitmiş sanmaktır; asıl güvence numune, kür, rapor ve saha kaydının kopmadan ilerlemesidir.",
    intro: [
      "Beton testleri, taze ve sertleşmiş betonun projedeki performans koşullarını sağlayıp sağlamadığını doğrulamak için yürütülen kabul zinciridir. Slump deneyi, sıcaklık kontrolü, numune alma, laboratuvar basınç deneyi ve gerektiğinde karot veya tahribatsız incelemeler bu zincirin parçalarıdır.",
      "Şantiyede testin değeri yalnız sonuç rakamında değildir. Hangi transmikserden numune alındığı, küplerin veya silindirlerin nasıl saklandığı, laboratuvara nasıl gönderildiği ve raporun hangi döküm bölgesiyle eşleştirildiği net değilse test veri değil gürültü üretir. Bu yüzden beton testi, numune kadar izlenebilirlik işidir.",
    ],
    theory: [
      "Taze beton testleri, karışımın şantiyeye ulaşma anındaki işlenebilirliğini ve kabul edilebilirliğini kontrol eder. Ancak slump veya sıcaklık uygun çıktı diye dayanımın da otomatik uygun olacağı varsayılmamalıdır. Dayanım, numune alma kalitesi ve kür koşullarına da bağlı olarak doğrulanır.",
      "Basınç deneyi sonuçları, numunenin temsil gücü kadar anlam taşır. Yanlış alınmış, kötü saklanmış veya etiketlenmemiş numune; laboratuvardan sayısal sonuç çıksa bile mühendislik anlamı taşımaz. Bu nedenle numune alma işlemi, laboratuvar işi değil saha kalite işidir.",
      "Bazı durumlarda küp veya silindir testleri yeterli olmayabilir. Yerinde dayanım şüphesi, yangın veya uygulama kusuru gibi durumlarda karot, Schmidt çekici veya ultrases gibi ek yöntemler devreye girer. Bu yöntemlerin amacı da tek başına karar vermek değil, saha gerçeğini daha net okumaktır.",
    ],
    ruleTable: [
      {
        parameter: "Taze beton numunesi",
        limitOrRequirement: "Numune alma, işaretleme ve takip süreci resmi tebliğ doğrultusunda kayıt altına alınmalıdır.",
        reference: "Taze Beton Numune Tebliği",
        note: "Numunenin izlenebilirliği sonuç kadar kritiktir.",
      },
      {
        parameter: "Kabul deneyleri",
        limitOrRequirement: "Slump, sıcaklık ve dayanım deneyleri döküm zinciriyle ilişkilendirilmelidir.",
        reference: "TS EN 206",
        note: "Test raporu hangi döküm bölgesine ait olduğu açıkça okunmalıdır.",
      },
      {
        parameter: "Ek değerlendirme yöntemleri",
        limitOrRequirement: "Şüpheli durumlarda karot ve tahribatsız testler birlikte yorumlanmalıdır.",
        reference: "Yapı denetim ve mühendislik değerlendirmesi",
        note: "Tek bir yöntemle hüküm vermek yerine çapraz okuma yapılmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Döküm öncesi numune alma planını sevkiyat ve döküm bölgeleriyle eşleştir.",
      "Her numuneyi araç, saat, eleman ve döküm yeri bilgisiyle net etiketle.",
      "Taze beton deneylerini kabul sırasında yap ve uygunsuzlukları anında kayda geçir.",
      "Numunelerin ilk kür, taşıma ve laboratuvar teslim zincirini sorumlu kişilerle tanımla.",
      "Sonuç raporlarını döküm tarihi ve saha notlarıyla birlikte arşivleyip değerlendir.",
    ],
    criticalChecks: [
      "Numune hangi araç ve hangi döküm bölgesinden alındığı net mi?",
      "Slump ve sıcaklık verileri rapora bağlı mı?",
      "Numune ilk kür koşulları uygunsuz mu kaldı?",
      "Laboratuvar sonucu ile saha gözlemi arasında çelişki var mı?",
      "Gerektiğinde karot veya tahribatsız test kararı hızlı alınabiliyor mu?",
    ],
    numericalExample: {
      title: "8 transmikserlik dökümde numune planı mantığı",
      inputs: [
        { label: "Toplam sevkiyat", value: "8 transmikser", note: "Tek kat dökümü" },
        { label: "Döküm alanı", value: "iki ayrı blok", note: "Kolon-perde ve döşeme" },
        { label: "Hedef", value: "Temsil gücü yüksek numune zinciri", note: "Bölgelere yayılmış takip" },
        { label: "Ek saha kaydı", value: "slump + sıcaklık + araç saati", note: "Her numune ile ilişkili" },
      ],
      assumptions: [
        "Döküm iki ana bölgede yürütülmektedir.",
        "Araç bazlı saha kayıtları düzenli tutulmaktadır.",
        "Numuneler etiket ve ilk kür koşulu bozulmadan laboratuvara aktarılacaktır.",
      ],
      steps: [
        {
          title: "Temsil ilkesini kur",
          result: "Numune planı yalnız ilk araçtan değil, farklı döküm bölgelerini temsil edecek şekilde kurgulanmalıdır.",
          note: "Aksi halde sonuç bir bölgeyi doğrular, tüm dökümü değil.",
        },
        {
          title: "Saha verisini raporla bağla",
          result: "Her numunenin slump, sıcaklık, saat ve eleman bilgisi sonuç raporuyla ilişkilendirilmelidir.",
          note: "Bu bağ kurulmazsa düşük sonuç geldiğinde hangi bölgeyi araştıracağın belirsiz kalır.",
        },
      ],
      checks: [
        "Numune planı dökümün gerçek sahasını temsil etmelidir.",
        "Etiketsiz veya ilk kür koşulu bozulmuş numune veri kalitesini düşürür.",
        "Sonuçlar saha gözlemiyle birlikte okunmalıdır.",
      ],
      engineeringComment: "Beton testinde en değerli şey rapordaki sayı değil, o sayının sahadaki hangi betona ait olduğunu tereddütsüz söyleyebilmektir.",
    },
    tools: BETON_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Numuneyi alıp etiket ve saha bağını zayıf bırakmak.", correct: "Araç, saat, eleman ve bölge bilgisiyle tam izlenebilirlik kurmak." },
      { wrong: "Slump ve sıcaklık deneylerini formaliteye çevirmek.", correct: "Kabul kararının gerçek parçası olarak görmek." },
      { wrong: "Düşük sonucu hemen laboratuvar hatası saymak.", correct: "Numune alma, kür ve saha uygulamasını birlikte sorgulamak." },
      { wrong: "Şüpheli sahalarda yalnız tek bir test yöntemine dayanmak.", correct: "Karot ve tahribatsız yöntemleri birlikte değerlendirmek." },
      { wrong: "Raporları saha notlarından kopuk arşivlemek.", correct: "Döküm kaydı ile test raporunu aynı dosya zincirinde tutmak." },
    ],
    designVsField: [
      "Projede beton testi çoğu zaman şartname satırı olarak görünür; sahada ise teslim sorumluluğunu ve kalite hafızasını taşıyan en önemli kayıt setlerinden biridir.",
      "Bu nedenle iyi test yönetimi, yalnız laboratuvar ilişkisi değil güçlü saha disiplini gerektirir.",
    ],
    conclusion: [
      "Beton testleri doğru yürütüldüğünde dökülen betonun performansı güvenle izlenebilir hale gelir. Zayıf yürütüldüğünde ise sorun olduğunda geriye dönük teknik okuma yapmak çok zorlaşır.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tazeBetonNumuneTebligi, SOURCE_LEDGER.yapiDenetim],
    keywords: ["beton testleri", "slump deneyi", "beton numunesi", "karot", "EBIS"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/kolon-kalibi",
    kind: "topic",
    quote: "Kolon kalıbı, düşey taşıyıcının kesitini vermek kadar, yapının bütün katlarında aks disiplinini koruyan ilk saha filtresidir.",
    tip: "Kolon kalıbında birkaç milimetrelik ihmal tek katta küçük görünür; katlar yükseldikçe aks kayması ve kaplama problemi olarak büyür.",
    intro: [
      "Kolon kalıbı, düşey taşıyıcı elemanın boyutunu, şakulünü ve beton yüzey kalitesini belirleyen kritik kalıp imalatıdır. Düşey elemanlar yapıdaki aks disiplininin ana omurgasını oluşturduğu için kolon kalıbında yapılan hata yalnız bir kesit sorunu olarak kalmaz; üst katlardaki kiriş oturumunu, duvar eksenini ve ince iş doğruluğunu da etkiler.",
      "Sahada kolon kalıbı hızlı tekrar eden bir iş gibi görünür; ama her tekrar aynı hassasiyeti gerektirir. Gergi düzeni, panel birleşimi, köşe doğruluğu, pas payı takozlarının sıkıştırılmaması ve döküm sırasında kalıbın açılmaması kolon kalıbının asıl kalite başlıklarıdır. İyi kolon kalıbı, beton döküldüğünde değil beton gelmeden önce anlaşılır.",
    ],
    theory: [
      "Kolon kalıbında ana mühendislik konusu düşeylik ve kesit sürekliliğidir. Kolon elemanı taze beton basıncını nispeten dar bir yüzeye topladığı için panel rijitliği ve gergi sistemi yeterli değilse kesit şişebilir veya açılabilir. Bu durum hem boyut sapması hem de yüzey kusuru üretir.",
      "Köşe detayları kolon kalıbının en hassas bölgeleridir. Panel birleşimleri iyi çözülmezse sütun kenarlarında çapak, açıklık veya ölçü sapması oluşur. Aynı zamanda şakül ayarı yalnız kurulumda değil, beton öncesi son kontrolde yeniden doğrulanmalıdır; çünkü donatı montajı ve saha trafiği kalıbın ayarını bozabilir.",
      "Kolon kalıbı, kiriş ve perde birleşimlerini de önceden düşünmek zorundadır. Üstte bırakılan kot, filizlerin konumu ve kiriş oturumu sonraki imalatlara referans verir. Bu nedenle kolon kalıbı bağımsız marangoz işi değil, kat çevrim koordinasyon işidir.",
    ],
    ruleTable: [
      {
        parameter: "Kesit ölçüsü ve aks",
        limitOrRequirement: "Kolon boyutu ve aksı beton öncesi ölçüyle doğrulanmalıdır.",
        reference: "TS EN 13670",
        note: "Kesit ve aks birlikte okunmadan yalnız panel ölçüsü yeterli kabul edilemez.",
      },
      {
        parameter: "Şakül ve düşeylik",
        limitOrRequirement: "Her kolon için kurulum ve döküm öncesi düşeylik kontrolü yapılmalıdır.",
        reference: "Saha kalite planı",
        note: "Düşeylik kaybı katlar ilerledikçe katlanarak sorun üretir.",
      },
      {
        parameter: "Kalıp rijitliği",
        limitOrRequirement: "Panel, kuşak ve gergi sistemi taze beton basıncına uygun olmalıdır.",
        reference: "TS EN 13670 + uygulama mühendisliği",
        note: "Yetersiz sıkılık kesit şişmesi ve yüzey kusuru doğurur.",
      },
    ],
    designOrApplicationSteps: [
      "Aks aplikasyonunu ve kolon ayak izini döşeme üzerinde net biçimde işaretle.",
      "Panel birleşimlerini, köşe elemanlarını ve gergileri kesite uygun sıkılıkta kur.",
      "Donatı ile kalıp arasında pas payı ve filiz konumunun bozulmadığını kontrol et.",
      "Şakül ve aks ölçümünü beton öncesi son kez alarak saha kaydına işle.",
      "Döküm sırasında ilk yükselen betonda kolon kalıbını gözle izle ve olası açılmalara anında müdahale et.",
    ],
    criticalChecks: [
      "Kolon kesiti proje ölçüsüne tam kapatıldı mı?",
      "Köşe birleşimleri ve panel derzleri sızıntı yapacak açıklıkta mı?",
      "Şakül kontrolü beton öncesi tekrarlandı mı?",
      "Pas payı takozu ve donatı kalıba değmeden korunuyor mu?",
      "Kiriş veya perde birleşim kotları doğru bırakıldı mı?",
    ],
    numericalExample: {
      title: "40 x 60 cm kolon için aks ve şakül kontrol mantığı",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Projeden alınan değer" },
        { label: "Kat yüksekliği", value: "3,20 m", note: "Düşey kontrol mesafesi" },
        { label: "Ölçüm yöntemi", value: "lazer + şakül ipi", note: "Çift doğrulama" },
        { label: "Hedef", value: "aks ve düşeylik kaybını engellemek", note: "Tekrarlı kat imalatı için" },
      ],
      assumptions: [
        "Kolon donatısı önceden kabul edilmiştir.",
        "Panel sistemi yeterli rijitliktedir.",
        "Beton döküm hızı aşırı yükseltilmeyecektir.",
      ],
      steps: [
        {
          title: "Taban aksını doğrula",
          result: "Kolon ayak izi, döşeme aplikasyonu üzerinden iki doğrultuda kontrol edilmelidir.",
          note: "Tabanda küçük kayma üstte daha büyük geometri hatası olarak görünür.",
        },
        {
          title: "Düşeyliği üst kotta tekrar kontrol et",
          result: "3,20 m boyunca alınan üst başlık ölçüsü, kolonun yalnız tabanda değil tüm yükseklikte doğru kurulduğunu gösterir.",
          note: "Tek noktadan ölçüm kolonun dönmesini veya burulmasını gizleyebilir.",
        },
      ],
      checks: [
        "Aks ve düşeylik iki farklı yöntemle teyit edilmelidir.",
        "İlk beton yükselişinde kalıpta hareket gözlenmelidir.",
        "Kolon tepesindeki kot, sonraki kiriş kalıbını etkileyecek şekilde yeniden kontrol edilmelidir.",
      ],
      engineeringComment: "Kolon kalıbında doğruluk, panel kapandığında değil; aks ve şakül birlikte aynı sonucu verdiğinde başlar.",
    },
    tools: KALIP_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Kolon aksını yalnız ilk işaretlemede doğru kabul etmek.", correct: "Beton öncesi son kontrolle aksı yeniden doğrulamak." },
      { wrong: "Köşe açıklıklarını beton şerbeti kapatır diye önemsememek.", correct: "Panel birleşimlerini sızıntısız ve sıkı hale getirmek." },
      { wrong: "Şakül kontrolünü tek yüzeyden yapmak.", correct: "İki doğrultuda ve üst kotta tekrar ölçmek." },
      { wrong: "Pas payı takozlarının kalıp kapanırken kaymasına izin vermek.", correct: "Donatı-kalıp mesafesini son kontrolde tekrar doğrulamak." },
      { wrong: "İlk beton basıncında kolon kalıbını izlemeden dökümü hızlandırmak.", correct: "Başlangıç aşamasını aktif gözlem altında tutmak." },
    ],
    designVsField: [
      "Projede kolon kalıbı yalnız bir kesit ölçüsü gibi görünür; sahada ise bütün katların aks disiplini bu ilk düşey imalattan etkilenir.",
      "Bu yüzden kolon kalıbı, küçük hatanın katlanarak büyümesini en erken aşamada durduran kontroldür.",
    ],
    conclusion: [
      "Kolon kalıbı doğru kurulduğunda düşey taşıyıcı sistem temiz, ölçülü ve okunabilir biçimde yükselir. Yanlış kurulduğunda ise sonraki tüm ekipler aynı aks hatasının etrafında çözüm üretmek zorunda kalır.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["kolon kalıbı", "şakül kontrolü", "aks doğruluğu", "kalıp gergisi", "kesit toleransı"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/kiris-kalibi",
    kind: "topic",
    quote: "Kiriş kalıbı, taşıyıcının yalnız kesitini değil; açıklık boyunca alt kot sürekliliğini ve döşeme ile birleşim doğruluğunu da belirler.",
    tip: "Kiriş kalıbında alt kotu birkaç noktada doğru görmek yeterli değildir; süreklilik bozulursa tavanda dalga, tesisatta çakışma ve sehim problemi birlikte çıkar.",
    intro: [
      "Kiriş kalıbı, açıklık geçen betonarme elemanın alt kotunu, kesit yüksekliğini ve mesnet bölgelerindeki doğru oturumunu sağlayan temel kalıp imalatıdır. Kirişler kolonlarla düğüm oluşturduğu ve döşeme kalıbını taşıdığı için burada yapılan hata tek elemanda kalmaz; tüm kat geometrisini etkileyebilir.",
      "Sahada kiriş kalıbını zorlaştıran ana konu, açıklık boyunca alt kot sürekliliği ve orta bölgelerde oluşabilecek sehim riskidir. Mekanik rezervasyonlar, döşeme kotu, donatı yoğunluğu ve iskele dizilimi birlikte düşünülmediğinde kiriş kalıbı beton sonrası en görünür dalga ve kaçıklıklardan birini üretir.",
    ],
    theory: [
      "Kiriş kalıbında ana mühendislik problemi, taze beton ve donatı yükü altında formunu koruyan bir alt taşıma düzeni kurmaktır. Uzayan açıklıklar ve artan kesit yükleri, tali destek ve iskele planını daha kritik hale getirir. Özellikle orta açıklıkta küçük deformasyonlar bile tavan düzleminde belirgin hale gelir.",
      "Kiriş alt kotu yalnız estetik konu değildir. Tesisat geçişleri, asma tavan boşluğu ve döşeme kalınlığı ile doğrudan ilişkilidir. Bu nedenle kiriş kalıbının birkaç noktada ölçülmesi yerine açıklık boyunca süreklilik halinde kontrol edilmesi gerekir.",
      "Kiriş-kolon birleşimleri de burada önem kazanır. Kolon üst kotundaki küçük hata veya kiriş yan panellerindeki kaçıklık, düğüm bölgesinde donatı sıkışıklığı ve beton yerleşme problemi yaratabilir. İyi kiriş kalıbı, mesnet bölgesini de orta açıklık kadar ciddiye alır.",
    ],
    ruleTable: [
      {
        parameter: "Alt kot ve sehim kontrolü",
        limitOrRequirement: "Açıklık boyunca alt kot sürekliliği beton öncesi doğrulanmalıdır.",
        reference: "TS EN 13670",
        note: "Orta noktada doğru kot görmek tüm açıklığın doğru olduğu anlamına gelmez.",
      },
      {
        parameter: "Mesnet ve birleşim detayı",
        limitOrRequirement: "Kolon, perde ve döşeme birleşimleri kesit devamlılığını bozmayacak şekilde kurulmalıdır.",
        reference: "Saha uygulama disiplini",
        note: "Düğüm bölgeleri beton ve donatı açısından en kritik alanlardır.",
      },
      {
        parameter: "İskele yeterliliği",
        limitOrRequirement: "Tali destek ve kalıp altı taşıyıcılar açıklığa göre planlanmalıdır.",
        reference: "TS EN 13670 + uygulama mühendisliği",
        note: "Yetersiz destek, beton öncesi görünmeyen deformasyonu büyütür.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon üst kotlarını kontrol ederek kiriş alt kot referansını doğru noktadan başlat.",
      "Yan panelleri ve alt tablaları kesit yüksekliğine tam uyacak şekilde kur.",
      "İskele ve tali destek düzenini açıklık ve yük durumuna göre sıkılaştır.",
      "Açıklık boyunca lazer veya nivo ile alt kot sürekliliğini kontrol et.",
      "Düğüm bölgelerinde donatı, rezervasyon ve beton geçişinin kalıpla uyumlu olduğunu beton öncesi doğrula.",
    ],
    criticalChecks: [
      "Kiriş alt kotu açıklık boyunca süreklilik gösteriyor mu?",
      "Mesnet bölgelerinde panel kaçıklığı veya kesit daralması var mı?",
      "Tali destek düzeni orta açıklıkta yetersiz mi kalıyor?",
      "Donatı yoğunluğu nedeniyle kalıp içinde beton geçişi zorlaşıyor mu?",
      "Kiriş-döşeme birleşimi tavan düzlemi açısından temiz kapanıyor mu?",
    ],
    numericalExample: {
      title: "6,5 m kirişte alt kot kontrol mantığı",
      inputs: [
        { label: "Kiriş açıklığı", value: "6,5 m", note: "Orta açıklık örneği" },
        { label: "Kesit", value: "30 x 60 cm", note: "Yoğun donatılı kiriş" },
        { label: "Kontrol noktası", value: "en az 3 ana nokta", note: "mesnet-orta-mesnet" },
        { label: "Hedef", value: "süreklilik ve sehim riskini erken görmek", note: "Beton öncesi kalite" },
      ],
      assumptions: [
        "Kolon başlık kotları doğru kabul edilmiştir.",
        "İskele sistemi üretici önerisine uygun kurulmuştur.",
        "Rezervasyon etkisi orta bölgede sınırlıdır.",
      ],
      steps: [
        {
          title: "Kontrol noktalarını kur",
          result: "Yalnız orta nokta değil, iki mesnet ve orta açıklık birlikte okunmalıdır.",
          note: "Tek nokta ölçümü açıklık boyunca eğriyi gizleyebilir.",
        },
        {
          title: "Sürekliliği yorumla",
          result: "Mesnet-orta-mesnet çizgisi düzenli değilse iskele veya alt tabla sistemi yeniden ayarlanmalıdır.",
          note: "Bu düzeltme beton öncesi ucuz, beton sonrası ise zordur.",
        },
      ],
      checks: [
        "Alt kot kontrolü açıklık boyunca yapılmalıdır.",
        "Tesisat boşluğu gerekiyorsa kiriş alt kotu bununla birlikte doğrulanmalıdır.",
        "Düğüm bölgesi donatı yoğunluğu kalıp geometrisini bozmamalıdır.",
      ],
      engineeringComment: "Kiriş kalıbında doğruluk, ölçünün birkaç noktada tutmasından değil, açıklık boyunca aynı davranışı vermesinden anlaşılır.",
    },
    tools: KALIP_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Alt kotu yalnız orta noktada kontrol etmek.", correct: "Mesnet ve orta açıklık boyunca süreklilik halinde ölçmek." },
      { wrong: "Kolon üst kotlarındaki hatayı kiriş kalıbında fark etmeyip devralmak.", correct: "Kiriş kurulmadan önce mesnet referanslarını tekrar doğrulamak." },
      { wrong: "Uzun açıklıkta tali destekleri ekonomik diye seyrek bırakmak.", correct: "Yük ve açıklığa göre yeterli destek dizilimi kurmak." },
      { wrong: "Donatı düğüm bölgelerini kalıp kurulumundan ayrı düşünmek.", correct: "Beton geçişini de dikkate alarak düğümü birlikte çözmek." },
      { wrong: "Kiriş-döşeme birleşiminde tavan düzlemini sonradan düzeltmeye bırakmak.", correct: "Kalıp aşamasında temiz geometri kurmak." },
    ],
    designVsField: [
      "Projede kiriş kesiti iki çizgi arası bir yükseklik gibi görünür; sahada ise alt kot sürekliliği ve iskele rijitliği o çizgilerin gerçeğe ne kadar dönüştüğünü belirler.",
      "Bu nedenle kiriş kalıbı, açıklık davranışını ilk kez sahada görünür kılan uygulamadır.",
    ],
    conclusion: [
      "Kiriş kalıbı iyi kurulduğunda açıklık boyunca temiz geometri, doğru kot ve daha güvenli beton yerleşimi elde edilir. Zayıf kurulduğunda ise sehim ve dalga problemi beton sonrası en görünür kusurlardan biri olur.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["kiriş kalıbı", "alt kot kontrolü", "iskele düzeni", "sehim riski", "kiriş-döşeme birleşimi"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/doseme-kalibi",
    kind: "topic",
    quote: "Döşeme kalıbı, katın yatay düzlemini kurar; bu düzlem doğru değilse sonraki tüm ekipler bozuk referansla çalışır.",
    tip: "Döşeme kalıbında birkaç santimetrelik dalga yalnız tavan görüntüsünü bozmaz; şap, kaplama ve tesisat yükünü de büyütür.",
    intro: [
      "Döşeme kalıbı, geniş alanlı betonarme yüzeylerde kot, düzlemsellik ve çalışma platformu güvenliğini aynı anda sağlayan sistemdir. Kolon ve kiriş kalıpları noktasal veya çizgisel geometri üretirken, döşeme kalıbı tüm katın ortak referans yüzeyini kurar. Bu nedenle burada oluşan hata en geniş kullanıcı etkisine sahiptir.",
      "Şantiyede döşeme kalıbı çoğu zaman hızlı tekrar eden rutin bir imalat gibi görülür; ancak geniş alanın her noktasında aynı kaliteyi korumak en zor işlerden biridir. İskele aralığı, alt tabla rijitliği, kenar dönmeleri, döşeme boşlukları ve tesisat rezervasyonları birlikte çözülmezse geniş yüzeyde dalga, sehim ve kalınlık farkı oluşur.",
    ],
    theory: [
      "Döşeme kalıbında temel problem, geniş yüzey boyunca aynı rijitlik ve aynı kotu korumaktır. Taze beton yükü ve işçi trafiği, özellikle orta bölgelerde iskele sistemini zorlar. Bu nedenle sistem yalnız kurulduğu an için değil, döküm boyunca nasıl davranacağı düşünülerek tasarlanmalıdır.",
      "Geniş yüzeylerde küçük deformasyonlar bile toplam etkiyi büyütür. Örneğin birkaç milimetrelik yerel sehim, şap kalınlığı, kaplama tüketimi ve tavan çizgisi üzerinde hissedilir hale gelir. Bu yüzden döşeme kalıbı yalnız taşıyıcılık açısından değil, nihai bitiş kalitesi açısından da kritik bir kaba inşaat konusudur.",
      "Ayrıca döşeme kalıbı birçok disiplinin rezerv alanını taşır. Şaft boşlukları, merdiven kovaları, tesisat geçişleri ve parapet gibi detaylar kalıp aşamasında net değilse beton sonrasında kırma ve düzeltme ihtiyacı doğar. İyi döşeme kalıbı, gelecekteki delik ve boşlukları da bugünden bilir.",
    ],
    ruleTable: [
      {
        parameter: "Kot ve düzlemsellik",
        limitOrRequirement: "Geniş yüzey boyunca aynı referans düzlem korunmalıdır.",
        reference: "TS EN 13670",
        note: "Yerel dalga geniş yüzeylerde büyüyerek görünür hale gelir.",
      },
      {
        parameter: "İskele ve çalışma platformu",
        limitOrRequirement: "İskele düzeni taze beton yükü ve işçi yükünü güvenle taşımalıdır.",
        reference: "TS EN 13670 + uygulama mühendisliği",
        note: "Geniş alanda tek zayıf halka tüm yüzeye yansıyabilir.",
      },
      {
        parameter: "Boşluk ve rezervasyon",
        limitOrRequirement: "Şaft, merdiven, tesisat ve parapet detayları beton öncesi netleşmelidir.",
        reference: "Saha koordinasyon disiplini",
        note: "Sonradan açılan boşluklar maliyet ve kalite riski üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon ve kiriş referanslarından döşeme üst ve alt kotlarını netleştir.",
      "Panel, teleskopik dikme ve tali taşıyıcı düzenini açıklık ve yük durumuna göre kur.",
      "Şaft, boşluk ve tesisat rezervasyonlarını kalıp kapanmadan önce yerleştir.",
      "Geniş alan boyunca nivo ile kot kontrolü yaparak yerel dalgaları beton öncesi düzelt.",
      "Döküm sırasında çalışma trafiğini kalıp sistemini bozmayacak şekilde sınırla.",
    ],
    criticalChecks: [
      "Döşeme düzlemi geniş alan boyunca aynı kotta mı?",
      "Orta bölgelerde iskele ve alt tabla yetersiz mi kalıyor?",
      "Şaft ve boşluk detayları net mi?",
      "Kenar bölgelerinde dönme veya düşme riski var mı?",
      "Döküm sırasında kalıp üstünde düzensiz malzeme yükü oluşuyor mu?",
    ],
    numericalExample: {
      title: "7,0 x 9,0 m döşeme panelinde kot kontrol mantığı",
      inputs: [
        { label: "Döşeme boyutu", value: "7,0 m x 9,0 m", note: "Tek geniş panel" },
        { label: "Döşeme kalınlığı", value: "15 cm", note: "Projeden" },
        { label: "Kontrol ağı", value: "3 x 4 nokta", note: "En az 12 ana ölçüm noktası" },
        { label: "Hedef", value: "yerel dalga oluşturmadan düzlem kurmak", note: "Beton öncesi doğrulama" },
      ],
      assumptions: [
        "Kiriş alt kotları önceden doğrulanmıştır.",
        "İskele sistemi tüm panelde aynı tiptedir.",
        "Boşluk ve rezervasyonlar yerleştirilmiştir.",
      ],
      steps: [
        {
          title: "Ölçüm ağını oluştur",
          result: "Geniş panel birkaç noktadan değil, ağ mantığıyla okunmalıdır.",
          note: "Aksi halde yerel sehim veya kabarma bölgeleri gözden kaçabilir.",
        },
        {
          title: "Sapmaları yorumla",
          result: "Ağ içinde tutarsızlık görülen bölgelerde iskele ve panel bağlantıları yeniden ayarlanmalıdır.",
          note: "Bu düzeltme döküm öncesi yapılırsa hızlıdır; döküm sonrası ise masraflıdır.",
        },
      ],
      checks: [
        "Kot kontrolü ağ mantığıyla yapılmalıdır.",
        "Geniş yüzeyde lokal sorunlar genelleştirilmeden yerinde çözülmelidir.",
        "Rezervasyonlar sonradan delme gerektirmeyecek kesinlikte olmalıdır.",
      ],
      engineeringComment: "Döşeme kalıbında düzlem kalitesi, tek noktadaki doğru ölçüden değil tüm panelin aynı davranışı vermesinden anlaşılır.",
    },
    tools: KALIP_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Geniş paneli birkaç uç noktadan ölçüp düz kabul etmek.", correct: "Alanı ağ mantığıyla ölçüp yerel sapmaları bulmak." },
      { wrong: "Şaft ve boşluk kararlarını saha anına bırakmak.", correct: "Tüm rezervasyonları kalıp kapanmadan önce netleştirmek." },
      { wrong: "İskele üstüne düzensiz malzeme yüklemek.", correct: "Döküm ve çalışma trafiğini kontrollü yönetmek." },
      { wrong: "Döşeme dalgasını şap ile düzeltiriz diye düşünmek.", correct: "Doğru referans yüzeyi kalıp aşamasında üretmek." },
      { wrong: "Kenar ve parapet bölgelerini orta alan kadar dikkatle kontrol etmemek.", correct: "Tüm paneli aynı hassasiyetle değerlendirmek." },
    ],
    designVsField: [
      "Projede döşeme kalıbı tek bir yatay çizgi gibi görünür; sahada ise yüzlerce küçük taşıyıcı karar o çizginin gerçekten düz olup olmayacağını belirler.",
      "Bu yüzden döşeme kalıbı, geniş alanlı yapı kalitesinin kaba inşaattaki ilk aynasıdır.",
    ],
    conclusion: [
      "Döşeme kalıbı doğru kurulduğunda kat düzlemi temiz, okunabilir ve sonraki işler için ekonomik hale gelir. Yanlış kurulduğunda ise dalga ve kot farkı tüm bitiş sürecine yayılır.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["döşeme kalıbı", "düzlemsellik", "kat kotu", "iskele sistemi", "rezervasyon kontrolü"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/kalip-sokumu",
    kind: "topic",
    quote: "Kalıp sökümü, beton döküldü diye biten değil; betonun yeterli güvenliğe ulaşıp ulaşmadığını ölçerek verilen mühendislik kararıdır.",
    tip: "Kalıp sökümünde takvim baskısı, dayanım bilgisinin önüne geçerse risk yalnız yüzey kusuru değil taşıyıcı elemanın güvenliğidir.",
    intro: [
      "Kalıp sökümü, betonarme elemanın taze beton aşamasından kendi kendini taşıyabilen aşamaya geçtiği kritik geçiş işlemidir. Şantiyede çoğu zaman hız baskısı burada yoğunlaşır; çünkü bir üst kat çevrimi, panel geri kazanımı ve iş programı doğrudan söküm zamanına bağlıdır. Ancak erken ve plansız söküm, kaba inşaatın en yüksek riskli hatalarından biridir.",
      "Doğru kalıp sökümü yalnız gün sayısına bakılarak yapılmaz. Betonun dayanım gelişimi, hava sıcaklığı, açıklık, eleman tipi ve tali destek ihtiyacı birlikte değerlendirilmelidir. Kolon kalıbının alınması ile döşeme altı dikmelerin çekilmesi aynı karar değildir; her biri farklı yapısal anlam taşır.",
    ],
    theory: [
      "Beton priz aldıktan kısa süre sonra şekil koruyabilir; fakat bu, tüm yükleri güvenle taşıdığı anlamına gelmez. Özellikle kiriş ve döşeme gibi açıklık geçen elemanlarda erken söküm, sehim, çatlak ve hatta göçme riskini artırabilir. Bu nedenle kalıp sökümünde asıl konu elemanın yük transfer yolunu ne zaman güvenle devraldığıdır.",
      "Tali destekler bu geçişte hayati rol oynar. Ana kalıp alınsa bile ara desteklerin bir süre korunması, betonun yaşına ve açıklık davranışına göre gerekir. Şantiyede en sık hata, ana panel ile tali desteğin aynı anda sökülmesidir. Oysa söküm bir an değil, aşamalı bir süreçtir.",
      "Söküm kararı kaliteyi de etkiler. Çok erken sökülen kalıpta köşe kırıkları, yüzey ezilmeleri ve alt kot deformasyonları görülür. Bu kusurlar yalnız estetik değildir; bazı durumlarda elemanın dayanım ve servis performansını da etkileyebilir. Bu yüzden söküm hızı değil, güvenli söküm sırası önemlidir.",
    ],
    ruleTable: [
      {
        parameter: "Söküm kararı",
        limitOrRequirement: "Eleman tipi, açıklık ve beton dayanımı birlikte değerlendirilmelidir.",
        reference: "TS EN 13670",
        note: "Takvim tek başına yeterli kriter değildir.",
      },
      {
        parameter: "Tali destekler",
        limitOrRequirement: "Ara destekler planlı biçimde ve gerektiği süre korunmalıdır.",
        reference: "TS EN 13670 + saha mühendisliği",
        note: "Ana panel sökümü ile tali destek sökümü aynı işlem değildir.",
      },
      {
        parameter: "Söküm sırası ve güvenlik",
        limitOrRequirement: "Söküm yukarıdan aşağıya değil, eleman davranışına göre emniyetli sırada yapılmalıdır.",
        reference: "Saha kalite ve güvenlik planı",
        note: "Söküm sırasında oluşan ani yük transferleri önceden düşünülmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman bazında söküm planını döküm günü değil kalıp kurulum aşamasında hazırla.",
      "Beton yaşını, hava koşullarını ve gerekiyorsa numune sonuçlarını söküm kararıyla ilişkilendir.",
      "Kolon, perde, kiriş ve döşeme için farklı söküm eşikleri uygula; tüm sistemi tek paket sayma.",
      "Ana kalıbı alırken tali desteklerin kalacağını veya ne zaman azaltılacağını net belirt.",
      "Söküm sonrası alt kot, köşe ve yüzey davranışını gözle; bir sonraki çevrim için geri bildirim üret.",
    ],
    criticalChecks: [
      "Söküm kararı yalnız takvime göre mi veriliyor?",
      "Eleman tipi ve açıklık farklılıkları planda ayrılmış mı?",
      "Tali destekler aynı anda çekilme riski taşıyor mu?",
      "Söküm sonrası çatlak, sehim veya köşe kırığı gözleniyor mu?",
      "Bir sonraki kat yükü, alttaki eleman yeterince olgunlaşmadan veriliyor mu?",
    ],
    numericalExample: {
      title: "5,5 m kiriş açıklığında tali destek kararı için hızlı yorum",
      inputs: [
        { label: "Kiriş açıklığı", value: "5,5 m", note: "Tipik konut açıklığı" },
        { label: "Eleman tipi", value: "kiriş + döşeme birlikte", note: "Açıklık geçen sistem" },
        { label: "Hava durumu", value: "serin mevsim", note: "Dayanım gelişimi görece yavaş" },
        { label: "Hedef", value: "ana panel sökümü sonrası tali desteği korumak", note: "Güvenli geçiş" },
      ],
      assumptions: [
        "Beton dayanımı yerinde veya dolaylı veriyle izlenmektedir.",
        "Alt katta ek yükleme yapılmayacaktır.",
        "Söküm ekibi planlı sıraya göre çalışacaktır.",
      ],
      steps: [
        {
          title: "Eleman riskini sınıfla",
          result: "5,5 m açıklık geçen elemanda söküm kararı kolon kalıbı kadar erken verilemez.",
          note: "Açıklık arttıkça kendi kendini taşıma riski büyür.",
        },
        {
          title: "Tali destek kararını ayır",
          result: "Ana panel sökülse bile ara desteklerin bir süre korunması gerekebilir.",
          note: "Bu ayrım yapılmazsa ani yük transferi oluşur.",
        },
      ],
      checks: [
        "Söküm kararında eleman türü belirleyici olmalıdır.",
        "Serin havada dayanım gelişimi daha yavaş yorumlanmalıdır.",
        "Söküm sonrası deformasyon gözlemi bir sonraki çevrimi beslemelidir.",
      ],
      engineeringComment: "Kalıp sökümünde güvenli karar, kalıbın kaç günde açıldığından çok elemanın yükü ne zaman devralabildiğini bilmektir.",
    },
    tools: KALIP_TOOLS,
    equipmentAndMaterials: KABA_EQUIPMENT,
    mistakes: [
      { wrong: "Tüm elemanlar için aynı gün sayısını söküm kuralı yapmak.", correct: "Kolon, kiriş ve döşemeyi açıklık ve davranışa göre ayrı değerlendirmek." },
      { wrong: "Ana panelle tali desteği aynı anda çekmek.", correct: "Aşamalı söküm ve destek koruma planı uygulamak." },
      { wrong: "Serin hava veya düşük dayanım gelişimini dikkate almamak.", correct: "Hava koşulunu ve beton gelişimini söküm kararına dahil etmek." },
      { wrong: "Söküm sonrası yüzey kusurlarını önemsiz görmek.", correct: "Erken söküm işareti olabilecek kırık ve sehimleri analiz etmek." },
      { wrong: "Takvim baskısı nedeniyle saha mühendisliği onayı olmadan kalıp açmak.", correct: "Söküm kararını teknik onayla ve kayıtla vermek." },
    ],
    designVsField: [
      "Projede kalıp sökümü çoğu zaman bir tarih gibi düşünülür; sahada ise betonun gerçekten yük taşıyabilir hale gelip gelmediğini anlama sürecidir.",
      "Bu yüzden iyi söküm planı, kat çevrimi hızını değil yapısal güvenliği önceleyen plandır.",
    ],
    conclusion: [
      "Kalıp sökümü disiplinli yönetildiğinde hem güvenli çalışma sağlanır hem de eleman geometrisi korunur. Erken ve plansız yapıldığında ise hız kazanmak yerine yapısal ve program riski büyütülmüş olur.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalıp sökümü", "tali destek", "erken söküm", "beton dayanımı", "kat çevrimi"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/kolon-donati",
    kind: "topic",
    quote: "Kolon donatısı, düşey taşıyıcının yalnız dayanımını değil, depremde sünek davranış gösterip göstermeyeceğini belirleyen en kritik saha imalatlarından biridir.",
    tip: "Kolon donatısında en pahalı hata yalnız eksik demir değildir; etriye sıklaştırmasını, bindirme bölgesini ve pas payını projedeki davranış mantığından koparmaktır.",
    intro: [
      "Kolon donatısı, düşey taşıyıcı sistemin deprem ve düşey yükler altındaki davranışını sahada gerçek kesite dönüştüren imalattır. Kolon elemanı projede sadece boyuna donatı adediyle tarif ediliyor gibi görünse de sahadaki gerçek kalite; etriye sıklaştırması, bindirme düzeni, pas payı ve düğüm bölgesindeki okunabilirlikle ölçülür.",
      "Şantiyede kolon donatısını zorlaştıran konu, kesitin kompakt olması ve birçok kritik detayın aynı hacimde toplanmasıdır. Boyuna çubuklar, etriyeler, kanca yönleri, bindirme boyları, kiriş düğümü içindeki sıkışıklık ve filiz devamlılığı birlikte yönetilmediğinde betonun yerleşmesi zorlaşır ve tasarımdaki sünek davranış zayıflar. Bu nedenle kolon donatısı, demir miktarı kadar detay disiplinidir.",
    ],
    theory: [
      "Kolonlarda boyuna donatı, eksenel kuvvet ve moment etkilerini taşırken etriyeler beton çekirdeğini sarmalar, burkulmayı geciktirir ve kesme dayanımına katkı verir. Deprem etkisi altında özellikle uç bölgelerdeki etriye sıklaştırması ve kanca detayı davranışın ana parçasıdır. Bu yüzden kolon donatısı yalnız alan hesabı değil, sargılama mantığı ile okunmalıdır.",
      "Bindirme bölgeleri kolonlarda çok kritik hale gelir. Aynı kesitte fazla bindirme yığılması beton geçişini zorlaştırır ve düğüm bölgesini zayıflatabilir. Bu nedenle boyuna çubukların ek yerleri proje mantığına uygun dağıtılmalı, kesitte aşırı yoğunluk oluşup oluşmadığı yalnız paftadan değil sahadaki gerçek montajdan da görülmelidir.",
      "Kolon donatısında pas payı da yapısal davranışın parçasıdır. Yetersiz örtü, korozyon ve aderans riski oluştururken aşırı içe kaçan donatı da kesitin etkin çalışmasını değiştirebilir. Dolayısıyla spacer ve takoz kullanımı ikincil değil temel kalite önlemidir.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna donatı ve süneklik",
        limitOrRequirement: "Kolon boyuna donatısı ve minimum beton sınıfı yönetmelik hükümleriyle uyumlu olmalıdır.",
        reference: "TBDY 2018, 7.2.1 ve TS 500",
        note: "Kolon, deprem davranışında alt sınırların altında yorumlanamaz.",
      },
      {
        parameter: "Etriye sıklaştırması ve detay",
        limitOrRequirement: "Uç bölgelerde etriye aralığı, kanca yönü ve sarılma devamlılığı projeye uygun olmalıdır.",
        reference: "TBDY 2018 Bölüm 7 + TS 500",
        note: "Süneklik davranışı sahada en çok bu bölgede kaybedilir.",
      },
      {
        parameter: "Bindirme ve pas payı",
        limitOrRequirement: "Ek bölgeleri yığılma yaratmamalı, örtü betonu her yüzde korunmalıdır.",
        reference: "TS 500",
        note: "Kesitte sığan detayın betona da yer bırakması gerekir.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon paftasını boyuna donatı, etriye bölgesi ve bindirme mantığıyla birlikte oku.",
      "Boyuna donatıları kesit içinde doğru köşe ve yüz ortası yerleşiminde sabitle.",
      "Etriye sıklaştırma bölgelerini alt ve üst uçlarda projedeki boylarla net işaretle.",
      "Bindirme ve filiz düzenini aynı kesitte aşırı yığılma oluşturmayacak şekilde dağıt.",
      "Kalıp kapanmadan önce pas payı, şakül ve düğüm bölgesi foto-kaydını tamamla.",
    ],
    criticalChecks: [
      "Etriye sıklaştırma bölgesi boyu sahada doğru uygulanmış mı?",
      "Kanca yönleri ve etriye kapanışı projeyle tutarlı mı?",
      "Bindirme bölgeleri aynı kesitte yığılmış mı?",
      "Kolon-kiriş düğümünde beton geçişini engelleyen sıkışıklık var mı?",
      "Pas payı takozları tüm yüzlerde gerçekten çalışıyor mu?",
    ],
    numericalExample: {
      title: "40 x 60 cm kolonda etriye bölgesi için hızlı saha okuması",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Tipik betonarme kolon" },
        { label: "Boyuna donatı", value: "8Ø16", note: "Örnek pafta verisi" },
        { label: "Uç bölge etriyesi", value: "sıklaştırılmış", note: "Deprem davranışı için kritik" },
        { label: "Hedef", value: "süneklik ve beton yerleşebilirliğini birlikte korumak", note: "Saha kalite amacı" },
      ],
      assumptions: [
        "Kesin aralık ve boylar proje paftasından alınacaktır.",
        "Kalıp kapanmadan önce düğüm bölgesi açıkça görülebilmektedir.",
        "Spacer ve takoz sistemi standart uygulanmaktadır.",
      ],
      steps: [
        {
          title: "Kesit içi yoğunluğu değerlendir",
          result: "8Ø16 boyuna donatı, etriye ve bindirme ile birlikte okunmalı; yalnız adet olarak yeterli kabul edilmemelidir.",
          note: "Asıl soru kesitin sığıp sığmadığı kadar betonun geçip geçemeyeceğidir.",
        },
        {
          title: "Uç bölgeyi ayrı kontrol et",
          result: "Kolon uçlarında sık etriye bölgesi, orta bölgeden bağımsız foto ve ölçü ile doğrulanmalıdır.",
          note: "Sahada en sık kayıp, bu bölgenin göz kararı gevşetilmesidir.",
        },
      ],
      checks: [
        "Uç bölge ve orta bölge aynı aralık mantığıyla yürütülmemelidir.",
        "Düğüm bölgesi beton geçişi montaj tamamlandıktan sonra tekrar düşünülmelidir.",
        "Bindirme ve pas payı aynı anda doğrulanmalıdır.",
      ],
      engineeringComment: "Kolon donatısında doğru davranış, demirin çok olmasından değil; sünekliği sağlayan detayların eksiksiz kurulmasından gelir.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Uç bölge etriye sıklaştırmasını orta bölge mantığıyla seyrekleştirmek.", correct: "Deprem kritik bölgeleri paftadaki boy ve aralıkla aynen uygulamak." },
      { wrong: "Bindirmeleri kesitte rastgele toplamak.", correct: "Ek bölgelerini yığılmayı azaltacak şekilde düzenlemek." },
      { wrong: "Pas payını yalnız kalıp kapanınca kendiliğinden oluşur sanmak.", correct: "Takoz ve spacer ile aktif olarak korumak." },
      { wrong: "Düğüm bölgesindeki sıkışıklığı beton ekibi çözer diye bırakmak.", correct: "Montaj aşamasında beton geçişini düşünerek düzenlemek." },
      { wrong: "Kanca yönlerini usta alışkanlığına bırakmak.", correct: "Projede tanımlanan kapanış mantığını birebir takip etmek." },
    ],
    designVsField: [
      "Tasarımda kolon donatısı birkaç çağrı ve kesit çizimiyle görünür; sahada ise sünek davranışın gerçekten kurulup kurulmadığı etriye, bindirme ve pas payı detayında anlaşılır.",
      "Bu yüzden kolon donatısı, deprem güvenliğinin sahadaki en net sınavlarından biridir.",
    ],
    conclusion: [
      "Kolon donatısı doğru kurulduğunda düşey taşıyıcı eleman hem dayanım hem süneklik açısından projeye yaklaşır. Zayıf kurulduğunda ise en kritik yapısal detaylardan biri görünmeden değer kaybeder.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["kolon donatısı", "etriye sıklaştırması", "bindirme boyu", "kolon düğümü", "süneklik detayı"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/kiris-donati",
    kind: "topic",
    quote: "Kiriş donatısı, moment çizgisinin kağıt üzerindeki yorumunu sahada gerçek yük yoluna dönüştüren detay imalatıdır.",
    tip: "Kirişte asıl hata çoğu zaman demirin eksik olması değil; negatif-pozitif moment bölgelerini ve etriye dizisini sahada birbirine karıştırmaktır.",
    intro: [
      "Kiriş donatısı, açıklık geçen betonarme elemanın eğilme ve kesme etkileri altındaki davranışını belirleyen ana çelik düzenidir. Üst ve alt boyuna donatılar, mesnetlerdeki negatif moment bölgeleri, açıklıktaki pozitif moment alanları ve kesmeye çalışan etriyeler birlikte çalışır. Bu nedenle kiriş donatısı doğrusal bir demir dizisi değil, bölgeler arası rol değişimi içeren bir sistemdir.",
      "Şantiyede kiriş donatısını zorlaştıran konu, kesitin uzunluğu boyunca detayların değişmesidir. Aynı kirişte mesnette yoğunlaşan üst donatı, açıklıkta değişen alt donatı, ek bölgeleri ve etriye aralıkları farklı davranır. Eğer bu değişim sahada net işaretlenmezse paftadaki doğru çözüm montaj sırasında sadeleştirilir ve yapısal davranış zayıflar.",
    ],
    theory: [
      "Kirişte eğilme davranışı, moment diyagramına göre üst ve alt liflerde değişir. Mesnet yakınında üst donatı kritik hale gelirken açıklık ortasında alt donatı talebi öne çıkar. Bu yüzden hangi çubuğun nerede devam edeceği ve nerede kesileceği yapısal davranışın ayrılmaz parçasıdır.",
      "Kesme davranışı açısından etriyeler yalnız taşıyıcı katkı vermez; boyuna donatıların konumunu da korur. Özellikle mesnet bölgelerinde etriye aralığı sıkılaştıkça montaj zorluğu artar; ancak bu zorluk, kesme güvenliği ve deprem davranışı için gereklidir. Etriye azaltmak kolaylık sağlar gibi görünse de kritik bölgeyi zayıflatır.",
      "Kiriş donatısında bir başka saha konusu ankraj ve bindirme boylarıdır. Üst donatının kolon içine yeterli devamı, alt donatının kesim noktası ve bindirmelerin aynı yerde yığılmaması iyi kiriş davranışı için zorunludur. Detayın anlamı yalnız çubuk sayısında değil, çubukların nerede aktif olduğundadır.",
    ],
    ruleTable: [
      {
        parameter: "Moment bölgeleri",
        limitOrRequirement: "Üst ve alt boyuna donatı bölgeleri projedeki moment dağılımına göre uygulanmalıdır.",
        reference: "TS 500",
        note: "Mesnet ve açıklık bölgeleri aynı montaj mantığıyla okunamaz.",
      },
      {
        parameter: "Kesme ve etriye düzeni",
        limitOrRequirement: "Mesnet yakınında etriye aralıkları ve kapalı etriye detayları korunmalıdır.",
        reference: "TS 500 + TBDY 2018",
        note: "Kesme ve süneklik gereksinimi sahada en çok burada kaybedilir.",
      },
      {
        parameter: "Ankraj ve bindirme",
        limitOrRequirement: "Donatı devamı ve ek boyları düğüm bölgesi dikkate alınarak uygulanmalıdır.",
        reference: "TS 500",
        note: "Kiriş donatısının aktif bölgesi kesit içinde rastgele kısaltılamaz.",
      },
    ],
    designOrApplicationSteps: [
      "Kirişi mesnet, orta açıklık ve ek bölgesi olarak ayrı ayrı okuyarak montaj planı hazırla.",
      "Üst ve alt boyuna donatıları paftadaki devam boylarına göre yerleştir.",
      "Etriye aralıklarını özellikle mesnet yakınında işaretleyerek karışmayı önle.",
      "Kolon düğümünde ankraj ve bindirme bölgelerini beton geçişi ile birlikte kontrol et.",
      "Kalıp kapanmadan önce kiriş boyunca donatı foto-kaydını bölge mantığıyla tamamla.",
    ],
    criticalChecks: [
      "Mesnet ve açıklık bölgeleri sahada net ayrılmış mı?",
      "Etriye aralıkları yanlışlıkla tek düzene mi dönmüş?",
      "Üst donatının kolon içine devamı yeterli mi?",
      "Bindirmeler aynı kritik bölgede toplanmış mı?",
      "Düğüm bölgesinde beton geçişini engelleyen yığılma var mı?",
    ],
    numericalExample: {
      title: "6,0 m açıklıklı kirişte bölge mantığı kontrolü",
      inputs: [
        { label: "Kiriş açıklığı", value: "6,0 m", note: "Tipik kat kirişi" },
        { label: "Kesit", value: "30 x 60 cm", note: "Örnek kiriş" },
        { label: "Bölge", value: "mesnet + orta açıklık", note: "İki ana davranış bölgesi" },
        { label: "Hedef", value: "üst-alt donatıyı rolüne göre korumak", note: "Montaj amacı" },
      ],
      assumptions: [
        "Kesin donatı çap ve adetleri proje paftasından alınacaktır.",
        "Kolon düğüm bölgesi erişilebilir şekilde açıktır.",
        "Kiriş boyunca kalıp kapanmadan önce gözden geçirme yapılacaktır.",
      ],
      steps: [
        {
          title: "Mesnet bölgesini tanımla",
          result: "Mesnet yakınında üst donatı ve sık etriye kontrolü ayrı bir saha başlığı olarak ele alınmalıdır.",
          note: "Bu bölge açıklık ortasıyla aynı montaj hızıyla geçilmemelidir.",
        },
        {
          title: "Orta açıklığı yorumla",
          result: "Açıklıkta alt donatı sürekliliği ve kesim noktaları proje mantığına göre izlenmelidir.",
          note: "Sahada pratik olsun diye erken kesilen çubuk davranışı doğrudan etkiler.",
        },
      ],
      checks: [
        "Kiriş boyu tek parça değil bölge mantığıyla kontrol edilmelidir.",
        "Etriye ve boyuna donatı birlikte okunmalıdır.",
        "Düğüm bölgesi foto-kaydında ankraj açıkça görülmelidir.",
      ],
      engineeringComment: "Kiriş donatısında doğru montaj, her çubuğun neden o bölgede bulunduğunu sahada açıklayabilmektir.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Mesnet ve açıklık bölgesini aynı donatı mantığıyla uygulamak.", correct: "Moment bölgelerini ayrı okuyup montajı buna göre yapmak." },
      { wrong: "Etriye aralıklarını kolaylık için eşitlemek.", correct: "Projede tanımlanan sık ve seyrek bölgeleri aynen korumak." },
      { wrong: "Üst donatının kolon içine girişini kısaltmak.", correct: "Ankraj devamını düğüm bölgesinde net doğrulamak." },
      { wrong: "Bindirmeleri görünmeyecek yerde olsun diye kritik bölgede toplamak.", correct: "Ekleri yapısal mantığa göre dağıtmak." },
      { wrong: "Kiriş boyunca tek foto ile ön kabul yapmak.", correct: "Mesnet ve açıklık bölgelerini ayrı ayrı kayda almak." },
    ],
    designVsField: [
      "Projede kiriş donatısı kesit ve görünüşle anlatılır; sahada ise her bölgenin farklı rol oynadığı uzun bir davranış zinciri olarak monte edilir.",
      "Bu nedenle kiriş donatısı, pafta okuma kalitesinin en net göründüğü betonarme imalatlardan biridir.",
    ],
    conclusion: [
      "Kiriş donatısı doğru uygulandığında eleman hem eğilme hem kesme açısından projedeki davranışa yaklaşır. Montaj sadeleştirilip bölgeler karıştırıldığında ise hata betonla birlikte kalıcı hale gelir.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["kiriş donatısı", "negatif moment", "etriye aralığı", "ankraj boyu", "kiriş düğümü"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/doseme-donati",
    kind: "topic",
    quote: "Döşeme donatısı, geniş yüzeyli elemanın yalnız moment kapasitesini değil, çatlak kontrolünü ve kat düzleminin servis performansını belirler.",
    tip: "Döşeme donatısında en sık hata, geniş yüzey rahatlığına aldanıp asal donatı, dağıtma donatısı ve ek bölgelerini sahada birbirine karıştırmaktır.",
    intro: [
      "Döşeme donatısı, geniş alanlı betonarme elemanlarda yük dağılımını, çatlak kontrolünü ve servis davranışını belirleyen ana çelik düzenidir. Döşeme, kiriş kadar dramatik düğümler göstermediği için imalatı kolay sanılır; oysa büyük alan boyunca aralık sürekliliği, üst-alt donatı ilişkisi, rezervasyonlar ve pas payı yönetimi burada en önemli kalite konularıdır.",
      "Şantiyede döşeme donatısının en kritik tarafı düzenin bozulmaya çok açık olmasıdır. İşçi trafiği, pompa hortumu hareketi, üst donatı sehpa yetersizliği veya sonradan eklenen tesisat rezervasyonları geniş yüzeyde hızlıca deformasyon yaratabilir. Bu nedenle döşeme donatısı, miktar kadar düzene de ihtiyaç duyan bir imalattır.",
    ],
    theory: [
      "Döşeme donatısında asal ve dağıtma çubukları, yüklerin ana yönüne ve çatlak kontrolüne göre birlikte çalışır. Tek doğrultuda çalışan sistemlerde bile dağıtma donatısı ihmal edilemez; iki doğrultulu döşemelerde ise donatı yönleri sahada doğru okunmadığında kesit davranışı bozulur. Bu nedenle montaj öncesi yön bilgisi mutlaka netleştirilmelidir.",
      "Geniş yüzeyli elemanlarda çatlak kontrolü çoğu zaman servis performansı açısından kritik hale gelir. Donatı aralığının bozulması, ek bölgelerinin aynı alanda toplanması veya sehpa yetersizliği üst donatının aşağı çökmesine yol açarsa döşemenin gerçek davranışı projeden sapar. Bu sapma hemen fark edilmese de zamanla sehim ve çatlak olarak ortaya çıkabilir.",
      "Döşeme donatısında rezervasyonlar ve boşluklar da ayrı önem taşır. Şaft, tesisat geçişi, merdiven boşluğu veya büyük elektrik kutuları nedeniyle donatı kesilecekse bunun proje mantığı içinde telafisi planlanmalıdır. Sonradan rastgele kesilen çubuklar geniş yüzeyde gizli zayıflık üretir.",
    ],
    ruleTable: [
      {
        parameter: "Asal ve dağıtma düzeni",
        limitOrRequirement: "Donatı yönleri ve aralıkları proje düzenine göre korunmalıdır.",
        reference: "TS 500",
        note: "Geniş alan rahatlığı, yön bilgisinin kaybolmasına yol açmamalıdır.",
      },
      {
        parameter: "Üst donatı konumu",
        limitOrRequirement: "Sehpa ve spacer sistemi üst donatının tasarım kotunda kalmasını sağlamalıdır.",
        reference: "TS EN 13670 + saha uygulama disiplini",
        note: "Üst donatının aşağı düşmesi görünmeyen ama etkili bir kalite kaybıdır.",
      },
      {
        parameter: "Boşluk ve kesinti yönetimi",
        limitOrRequirement: "Rezervasyonlar donatı sürekliliğini bozmayacak şekilde önceden çözülmelidir.",
        reference: "TS 500 + proje koordinasyonu",
        note: "Sonradan kesilen çubuklar ancak mühendislik kararıyla telafi edilir.",
      },
    ],
    designOrApplicationSteps: [
      "Donatı yönlerini ve açıklık davranışını paftadan saha üzerinde net işaretle.",
      "Alt donatıyı aralık düzenini bozmadan ser, ardından sehpa sistemini yerleştir.",
      "Üst donatıyı sehpa ve spacer üzerinde tasarım kotunda sabitle.",
      "Şaft, kutu ve tesisat rezervasyonlarını donatı kesmeden önce proje ile doğrula.",
      "Beton öncesi geniş alanı bölgesel değil ağ mantığıyla dolaşıp sehpa çökmesi veya aralık bozulmalarını düzelt.",
    ],
    criticalChecks: [
      "Asal ve dağıtma yönleri sahada karışmış mı?",
      "Üst donatı sehpa üzerinde yeterince korunuyor mu?",
      "İşçi trafiği bazı bölgelerde donatı aralığını bozmuş mu?",
      "Rezervasyonlar nedeniyle kesilen çubuklar projede telafi edilmiş mi?",
      "Beton öncesi geniş alan kontrolü tüm panelde tamamlandı mı?",
    ],
    numericalExample: {
      title: "5,0 x 8,0 m döşemede çubuk adedi için hızlı saha hesabı",
      inputs: [
        { label: "Döşeme paneli", value: "5,0 m x 8,0 m", note: "Tek panel örneği" },
        { label: "Donatı aralığı", value: "Ø12 / 15 cm", note: "Ana yön için örnek" },
        { label: "5,0 m yönünde adet", value: "34 çubuk", note: "(5,0 / 0,15) + 1" },
        { label: "8,0 m yönünde adet", value: "54 çubuk", note: "(8,0 / 0,15) + 1" },
      ],
      assumptions: [
        "Hesap ilk saha kontrolü içindir; bindirme ve fire ayrıca değerlendirilecektir.",
        "Panel içinde büyük rezervasyon bulunmadığı kabul edilmiştir.",
        "Üst ve alt donatı düzenleri ayrıca işaretlenmiştir.",
      ],
      steps: [
        {
          title: "Adet kontrolünü yap",
          result: "Yaklaşık adet hesabı, sahaya gelen demirin pafta ile kaba uyumunu hızlıca doğrular.",
          note: "Bu kontrol yanlış sayım veya eksik serim riskini erken yakalar.",
        },
        {
          title: "Düzenin bozulup bozulmadığını yorumla",
          result: "Adet doğru olsa bile sehpa çökmesi veya yön karışıklığı varsa tasarım davranışı bozulabilir.",
          note: "Geniş yüzeyde nicelik kadar konum da önemlidir.",
        },
      ],
      checks: [
        "Adet hesabı yalnız başlangıç kontrolüdür, sehpa ve yön kontrolü ile tamamlanmalıdır.",
        "Rezervasyonlar adedi ve sürekliliği etkiliyorsa ayrıca değerlendirilmelidir.",
        "Üst donatı beton günü yeniden kontrol edilmelidir.",
      ],
      engineeringComment: "Döşeme donatısında düzen bozulduğunda sorun çoğu zaman adet eksikliğinden değil, geniş yüzeyde kaybolan konum disiplininden doğar.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Donatı yönlerini sahada sözlü tarifle bırakmak.", correct: "Yön ve bölge bilgisini fiziksel işaretleme ile netleştirmek." },
      { wrong: "Üst donatıyı yeterli sehpa olmadan serip işçi trafiğine bırakmak.", correct: "Sehpa sistemini panel boyunca standart kurmak." },
      { wrong: "Rezervasyon için çubukları sahada kesip geçmek.", correct: "Kesinti ve telafi detayını proje ile birlikte çözmek." },
      { wrong: "Geniş panelde birkaç bölgeye bakıp tüm yüzeyi kabul etmek.", correct: "Ağ mantığıyla tüm paneli kontrol etmek." },
      { wrong: "Dağıtma donatısını ikincil görüp gevşek uygulamak.", correct: "Çatlak kontrolündeki rolünü dikkate alarak aynı disiplinle yerleştirmek." },
    ],
    designVsField: [
      "Projede döşeme donatısı tekrarlı çizgiler gibi görünür; sahada ise bu çizgilerin yönünü, aralığını ve kotunu korumak başlı başına bir kalite işidir.",
      "Bu yüzden döşeme donatısı, geniş alanlı sistemlerde düzen koruma disiplininin en net örneklerinden biridir.",
    ],
    conclusion: [
      "Döşeme donatısı doğru yönetildiğinde yüzey çatlak kontrolü, servis davranışı ve genel kat kalitesi birlikte iyileşir. Düzen bozulduğunda ise hata beton altında görünmez hale gelir ama etkisi devam eder.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts500],
    keywords: ["döşeme donatısı", "asal donatı", "dağıtma donatısı", "sehpa", "rezervasyon kontrolü"],
  },
  {
    slugPath: "kaba-insaat/donati-isleri/pas-payi",
    kind: "topic",
    quote: "Pas payı, birkaç santimetrelik boşluk gibi görünür; gerçekte betonarmenin korozyon, aderans ve yangın performansını koruyan güvenlik bandıdır.",
    tip: "Pas payını yalnız estetik yüzey mesafesi gibi görmek, donatının dayanıklılık ömrünü sahada baştan kısaltmak demektir.",
    intro: [
      "Pas payı, donatının dış yüzeyden belirli bir beton örtüsü ile korunmasını sağlayan temel detaydır. Betonarmede çoğu zaman 'takoz işi' gibi küçük görülür; oysa bu birkaç santimetrelik mesafe, donatının korozyondan korunması, aderansın sağlıklı gelişmesi ve yangın etkisine karşı davranışın sürdürülmesi açısından kritik önemdedir.",
      "Sahada pas payı hatası en sık donatının kalıba dayanması, takozların yetersiz veya zayıf seçilmesi ve işçi trafiğiyle üst donatının aşağı çökmesi şeklinde görülür. Sorun çoğu zaman beton dökülürken fark edilmez; ancak eleman açıldığında veya yıllar içinde korozyon olarak ortaya çıkar. Bu yüzden pas payı, küçük ama stratejik bir kalite konusudur.",
    ],
    theory: [
      "Beton örtüsü donatıyı dış ortam etkilerinden ayırır ve çeliğin çevresinde alkali koruyucu ortamın korunmasına katkı verir. Örtü yetersiz olduğunda karbonatlaşma ve nem etkisi çeliğe daha hızlı ulaşır; paslanma başladığında ise hacim artışı çatlak ve kabuk atmasına yol açabilir. Bu nedenle pas payı dayanıklılığın ilk savunma hattıdır.",
      "Pas payı yalnız korozyon için değil aderans için de önemlidir. Donatı çok yüzeye yakın konumlandığında betonun çeliği sarması ve kuvvet aktarımı zayıflayabilir. Aynı şekilde yangın etkisinde örtü kalınlığı, çeliğin ısınma hızını belirler. Bu yüzden pas payı ihlali, birden çok performans başlığını aynı anda etkiler.",
      "Sahadaki asıl mesele teorik değeri yazmak değil, o değerin tüm yüzeylerde gerçekten korunmasını sağlamaktır. Uygun takoz tipi, yeterli adet, doğru yerleştirme ve beton öncesi son kontrol olmadan pas payı yalnız paftada kalır. Ölçülmeyen pas payı, uygulanmış kabul edilmemelidir.",
    ],
    ruleTable: [
      {
        parameter: "Örtü kalınlığı",
        limitOrRequirement: "Eleman tipi ve çevre koşuluna uygun minimum beton örtüsü korunmalıdır.",
        reference: "TS 500",
        note: "Kolon, kiriş, döşeme ve temel için örtü aynı düşünülmez.",
      },
      {
        parameter: "Saha uygulama yöntemi",
        limitOrRequirement: "Takoz, spacer ve sehpa sistemi pas payını kesit boyunca korumalıdır.",
        reference: "TS EN 13670 + saha kalite planı",
        note: "Yerel birkaç takoz tüm eleman için yeterli kabul edilemez.",
      },
      {
        parameter: "Beton öncesi doğrulama",
        limitOrRequirement: "Kalıp kapanmadan veya dökümden önce pas payı fiziksel kontrolle teyit edilmelidir.",
        reference: "Ön kabul disiplini",
        note: "Foto-kayıt ve ölçü, özellikle yoğun düğümlerde zorunlu düşünülmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre hedef pas payı değerini pafta ve şartnameden netleştir.",
      "Alt, yan ve üst yüzeylerde uygun takoz ve spacer tipini seç.",
      "Donatı montajı sırasında takoz adetini eleman boyunca düzenli dağıt.",
      "Kalıp kapanmadan önce donatının kalıba değmediğini fiziksel olarak kontrol et.",
      "Beton günü işçi trafiği veya hortum hareketiyle pas payı bozuluyorsa anında düzeltme yap.",
    ],
    criticalChecks: [
      "Donatı herhangi bir yüzde kalıba değiyor mu?",
      "Takozlar yük altında ezilecek kadar zayıf mı?",
      "Üst donatı sehpa sisteminden dolayı tasarım kotunda mı kalıyor?",
      "Yoğun düğüm ve köşe bölgelerinde örtü korunuyor mu?",
      "Beton öncesi pas payı kontrolü kayda bağlandı mı?",
    ],
    numericalExample: {
      title: "Kiriş yan yüzünde pas payı kontrol mantığı",
      inputs: [
        { label: "Eleman tipi", value: "30 x 60 cm kiriş", note: "Tipik betonarme eleman" },
        { label: "Hedef pas payı", value: "40 mm", note: "Örnek saha kontrol değeri" },
        { label: "Kullanılan takoz", value: "40 mm spacer", note: "Yan yüz için seçilen eleman" },
        { label: "Hedef", value: "donatının kalıba yaklaşmamasını sağlamak", note: "Döküm öncesi kontrol" },
      ],
      assumptions: [
        "Kesin örtü değeri proje ve çevresel etki şartına göre belirlenmiştir.",
        "Yan yüzlerde yeterli sayıda spacer kullanılacaktır.",
        "Kalıp kapanmadan önce fiziksel gözlem mümkündür.",
      ],
      steps: [
        {
          title: "Takoz tipini hedefe eşle",
          result: "Seçilen spacer kalınlığı hedef örtü ile uyumlu olmalıdır.",
          note: "Yaklaşık seçilmiş takozla pas payı tesadüfe bırakılmış olur.",
        },
        {
          title: "Dağılımı yorumla",
          result: "Tek bir noktada doğru spacer kullanmak yeterli değildir; eleman boyunca düzenli dağılım gerekir.",
          note: "Aksi halde beton sırasında donatı yer değiştirir.",
        },
      ],
      checks: [
        "Pas payı ölçüsü eleman boyunca süreklilik göstermelidir.",
        "Takoz tipi ve adedi birlikte değerlendirilmelidir.",
        "Beton günü üst donatı için ikinci bir kontrol yapılmalıdır.",
      ],
      engineeringComment: "Pas payı sahada kendiliğinden oluşan boşluk değil, aktif olarak üretilen bir kalite değeridir.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Takozları birkaç noktada gösterip elemanın geri kalanını boş bırakmak.", correct: "Örtüyü tüm eleman boyunca sürekli koruyacak dağılım kurmak." },
      { wrong: "Uygun olmayan, ezilen veya rastgele kalınlıkta parça kullanmak.", correct: "Standart spacer ve sehpa sistemi kullanmak." },
      { wrong: "Üst donatının beton günü aşağı çöktüğünü fark etmemek.", correct: "Beton öncesi son kontrolde kotu yeniden doğrulamak." },
      { wrong: "Pas payını yalnız korozyon konusu sanmak.", correct: "Aderans ve yangın etkisini de düşünerek yönetmek." },
      { wrong: "Köşe ve düğüm bölgelerinde örtü kaybını gözden kaçırmak.", correct: "En sıkışık bölgeleri ayrıca ölçmek." },
    ],
    designVsField: [
      "Paftada pas payı küçük bir rakamdır; sahada ise betonarmenin ömrünü belirleyen fiziksel bir koruma katmanıdır.",
      "Bu nedenle pas payı, küçük görünen ama en stratejik saha kontrollerinden biridir.",
    ],
    conclusion: [
      "Pas payı doğru korunduğunda betonarme eleman hem dayanıklılık hem aderans açısından daha güvenli davranır. İhmal edildiğinde ise hata beton içinde gizlenir ama uzun vadede maliyeti büyür.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["pas payı", "örtü betonu", "spacer", "korozyon koruması", "aderans"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/tugla-duvar",
    kind: "topic",
    quote: "Tuğla duvar, şantiyede geleneksel göründüğü için hafife alınır; oysa doğru eksen, derz ve birleşim disiplini istemeyen hiçbir duvar yoktur.",
    tip: "Tuğla duvarda sorun çoğu zaman malzemenin kendisinden değil; ilk sıra, kapı boşluğu ve betonarme birleşimlerinin plansız bırakılmasından doğar.",
    intro: [
      "Tuğla duvar, konut ve küçük ölçekli yapılarda en yaygın dolgu duvar çözümlerinden biridir. Kullanımı gelenekseldir; ancak bu tanıdıklık, imalatın teknik disiplin gerektirmediği anlamına gelmez. Tuğlanın düşeylik, derz kalınlığı, açıklık detayları ve tesisat koordinasyonu doğru kurulmadığında sorun ilk ince iş katmanlarında görünür hale gelir.",
      "Özellikle kapı-pencere boşlukları, kolon-perde birleşimleri ve uzun duvarlarda çatlak riski tuğla duvarı doğrudan etkiler. Bu nedenle tuğla duvar örümü, basit malzeme istifi değil; mekan ölçüsünü ve yüzey kalitesini güvenceye alan uygulama işidir.",
    ],
    theory: [
      "Tuğla duvarın davranışı, birimlerin harç yatağı ve düşey derzleri ile birlikte çalışmasına bağlıdır. Yatay derz düzeni bozulduğunda veya bloklar şaşırtma mantığıyla örülmediğinde duvar bütünlüğü zayıflar. Ayrıca duvarın kendi ağırlığı ve oturacağı taban düzgün değilse ilk sıra hatası tüm yüksekliğe taşınır.",
      "Tuğla duvar, betonarme çerçeve ile birebir aynı deformasyonu yapmaz. Bu nedenle kolon ve kiriş birleşimlerinde çatlak riski yüksek olur. Esnek birleşim detayları, ankraj elemanları veya sıva öncesi ağ takviyeleri çoğu projede bu geçişi yönetmek için kullanılır. Betonarme ile tuğla arasındaki geçiş detayını ihmal etmek, duvarda kaçınılmaz çatlak hattı bırakmaktır.",
      "Ayrıca tesisat hatları tuğla duvarı doğrudan etkiler. Sonradan açılan geniş kanallar, özellikle ince duvarlarda kesit bütünlüğünü azaltır. Bu yüzden elektrik ve mekanik geçişlerin duvar örümü sırasında düşünülmesi, sonradan düzeltmekten çok daha ekonomiktir.",
    ],
    ruleTable: [
      {
        parameter: "İlk sıra ve eksen",
        limitOrRequirement: "Duvar ekseni ilk sıradan itibaren aksa bağlı kurulmalıdır.",
        reference: "Saha uygulama disiplini",
        note: "İlk sıradaki hata tüm yüzeye taşınır ve sızva yükünü büyütür.",
      },
      {
        parameter: "Birleşim ve açıklık detayı",
        limitOrRequirement: "Kolon-perde birleşimleri ile kapı-pencere boşlukları detayına uygun çözülmelidir.",
        reference: "Mimari detay + saha mühendisliği",
        note: "Lento ve ankraj kararı duvar çatlak davranışını doğrudan etkiler.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Kanal ve geçişler planlı bırakılmalı, kontrolsüz kırma yapılmamalıdır.",
        reference: "Şantiye koordinasyon planı",
        note: "Önce duvarı örüp sonra geniş kanal açmak duvar bütünlüğünü zayıflatır.",
      },
    ],
    designOrApplicationSteps: [
      "Aks, kapı boşluğu ve duvar kalınlığını örüme başlamadan önce zemin üzerinde netleştir.",
      "İlk sırayı nivo ve mastarla kurarak duvarın geri kalanına doğru referans üret.",
      "Şaşırtmalı örgü düzenini ve derz sürekliliğini yükseklik boyunca koru.",
      "Kolon-perde birleşimleri ile lento altı bölgeleri proje detayına göre tamamla.",
      "Tesisat geçişlerini ve kutu boşluklarını duvar örümü sırasında bırakıp sonradan kırmayı azalt.",
    ],
    criticalChecks: [
      "İlk sıra doğru kot ve eksende mi?",
      "Kapı ve pencere boşlukları doğrama toleransıyla uyumlu mu?",
      "Uzun duvarlarda düşeylik ve yüzey sürekliliği korunuyor mu?",
      "Betonarme birleşimlerinde çatlak riski için detay düşünülmüş mü?",
      "Tesisat kanalları kontrolsüz kırma gerektiriyor mu?",
    ],
    numericalExample: {
      title: "90 cm kapı için tuğla duvar boşluğu kontrolü",
      inputs: [
        { label: "Kapı neti", value: "90 cm", note: "İç kapı örneği" },
        { label: "Montaj payı", value: "3-4 cm", note: "Kasa ve montaj boşluğu" },
        { label: "Hedef kaba boşluk", value: "93-94 cm", note: "Saha pratik değeri" },
        { label: "Sıva etkisi", value: "iki yüzde toplam dikkate alınır", note: "Net geçiş için" },
      ],
      assumptions: [
        "Kapı tipi ve kasa kalınlığı önceden belirlenmiştir.",
        "Sıva kalınlığı mahal bazında standart kabul edilmiştir.",
        "Duvar ekseni mimari aksla uyumludur.",
      ],
      steps: [
        {
          title: "Kaba boşluğu belirle",
          result: "90 cm net kapı için yaklaşık 93-94 cm boşluk bırakmak montajı rahatlatır.",
          note: "Sıfır tolerans bırakmak saha kesme ve düzeltme ihtiyacı üretir.",
        },
        {
          title: "Sıva etkisini kontrol et",
          result: "Boşluk kararı sıva sonrası net geçişi koruyacak şekilde verilmelidir.",
          note: "Aksi halde duvar doğru örülmüş görünür ama doğrama montajı sorunlu olur.",
        },
      ],
      checks: [
        "Kapı boşluğu duvar örümü sırasında ölçüyle kontrol edilmelidir.",
        "Doğrama ekibi gelmeden önce kaba boşluklar yeniden gözden geçirilmelidir.",
        "Lento ve açıklık kenarları düzgün bırakılmalıdır.",
      ],
      engineeringComment: "Tuğla duvarda birkaç santimetrelik açıklık hatası, doğrama ve sıva ekipleri için günlerce süren düzeltmeye dönüşebilir.",
    },
    tools: DUVAR_TOOLS,
    equipmentAndMaterials: DUVAR_EQUIPMENT,
    mistakes: [
      { wrong: "İlk sırayı kaba yüzey üzerine hızlıca oturtmak.", correct: "İlk sırayı mastar ve nivo ile gerçek referans olarak kurmak." },
      { wrong: "Kapı boşluklarını doğrama gelince ayarlarız diye bırakmak.", correct: "Boşlukları duvar örümü sırasında net ölçüyle tamamlamak." },
      { wrong: "Betonarme birleşimlerini sıradan örgü detayı gibi geçirmek.", correct: "Çatlak riskine karşı birleşim detayını ayrıca yönetmek." },
      { wrong: "Tesisat kanallarını sonradan geniş kırmak.", correct: "Geçişleri örüm sırasında planlamak." },
      { wrong: "Yüzey bozukluğunu sıva ekibine bırakmak.", correct: "Duvarı ince işe yakın doğrulukta teslim etmek." },
    ],
    designVsField: [
      "Projede tuğla duvar tek bir dolgu çizgisi gibi görünür; sahada ise mekan ölçüsü, doğrama boşluğu ve sıva kalınlığı bu çizginin gerçek değerini belirler.",
      "Bu nedenle tuğla duvar, kaba inşaat ile ince iş arasındaki geçiş kalitesinin ilk sınavıdır.",
    ],
    conclusion: [
      "Tuğla duvar doğru uygulandığında ekonomik ve güvenilir bir dolgu çözümü sunar. Eksik eksen, hatalı açıklık ve zayıf birleşim detayı bırakıldığında ise sorun duvarla birlikte değil, sonraki tüm ekiplerle büyür.",
    ],
    sources: KABA_LEAF_SOURCES,
    keywords: ["tuğla duvar", "kapı boşluğu", "dolgu duvar", "betonarme birleşimi", "tesisat koordinasyonu"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/ytong-gazbeton",
    kind: "topic",
    quote: "Gazbeton duvar, hafifliği ve ölçü hassasiyetiyle hız kazandırır; ama bu avantaj ancak ince derz ve temiz yüzey disipliniyle korunur.",
    tip: "Gazbetonda klasik kalın harç alışkanlığını sürdürmek, malzemenin en büyük avantajı olan ölçü ve hafiflik performansını sahada kaybetmektir.",
    intro: [
      "Ytong veya genel adıyla gazbeton, hafifliği, ısı performansı ve düzgün blok geometrisi nedeniyle konut ve ticari yapılarda çok tercih edilen bir dolgu duvar malzemesidir. Tuğlaya kıyasla daha büyük bloklarla çalışıldığı için hız avantajı sunar; aynı zamanda düzgün yüzey elde etmeyi kolaylaştırır.",
      "Ancak gazbetonun iyi görünmesi, otomatik olarak iyi uygulandığı anlamına gelmez. İnce yapıştırma harcı, doğru blok kesimi, köşe dönüşleri, ankraj ve tesisat detayları doğru çözülmezse malzemenin potansiyeli kaybolur. Gazbeton, hız kadar hassasiyet isteyen bir sistemdir.",
    ],
    theory: [
      "Gazbetonun temel avantajı, düşük birim ağırlık ve hassas blok ölçüsüdür. Bu sayede duvar yükü azalır ve ince derzli uygulama ile yüzey sürekliliği daha kolay sağlanır. Ancak aynı hassasiyet, sahadaki toleransları da görünür hale getirir; alt taban bozuksa veya ilk sıra yanlış kurulmuşsa sapma blok boyunca birikir.",
      "İnce derzli sistem mantığında bloklar kalın yatak harcıyla telafi edilmez. Bu nedenle taban tesviyesi ve ilk sıra çok daha kritik hale gelir. Ayrıca gazbetonun kesilmesi kolay olsa da bu kolaylık, sonradan rastgele oyuk açmayı teşvik etmemelidir; tesisat kanalları yine kontrollü ve sınırlı düşünülmelidir.",
      "Malzemenin ısı ve hafiflik avantajı, birleşim detaylarında da korunmalıdır. Betonarme kolon-perde birleşimleri, lento altları ve ankraj noktaları düzensiz bırakılırsa hem çatlak hem ısı köprüsü riski büyüyebilir. Bu nedenle gazbeton duvarı yalnız blok olarak değil, sistem olarak düşünmek gerekir.",
    ],
    ruleTable: [
      {
        parameter: "İnce derz uygulaması",
        limitOrRequirement: "Bloklar sistem yapıştırıcısı ile düzgün ve ince yataklı yerleştirilmelidir.",
        reference: "Ürün sistemi + saha kalite planı",
        note: "Kalın harç ile telafi, ölçü avantajını ortadan kaldırır.",
      },
      {
        parameter: "İlk sıra ve taban tesviyesi",
        limitOrRequirement: "İlk sıra, düzgün tesviye üzerinde referans katman olarak kurulmalıdır.",
        reference: "Uygulama pratiği",
        note: "Gazbetonda ilk sıra hatası üst sıralarda daha görünür hale gelir.",
      },
      {
        parameter: "Birleşim ve çatlak kontrolü",
        limitOrRequirement: "Betonarme birleşimleri ve açıklık çevresi detaylı çözülmelidir.",
        reference: "Mimari ve saha detayı",
        note: "Malzeme hafif olsa da birleşim düğümleri kritik kalır.",
      },
    ],
    designOrApplicationSteps: [
      "Taban tesviyesini yapıp ilk sırayı lazer ve mastarla doğru referansta başlat.",
      "Blokları sistem yapıştırıcısı ile ince derz mantığında yerleştir.",
      "Köşe dönüşlerinde ve kısa parçalarda kesimleri temiz yaparak şaşırtma düzenini koru.",
      "Lento, ankraj ve betonarme birleşim detaylarını blok örümüyle birlikte çöz.",
      "Tesisat kanallarını kontrollü açıp blok bütünlüğünü gereksiz yere zayıflatma.",
    ],
    criticalChecks: [
      "İlk sıra düzgün tesviye üzerinde mi?",
      "Kalın harç ile telafi edilen bölgeler var mı?",
      "Blok kesimleri ve köşe birleşimleri temiz mi?",
      "Açıklık çevresinde çatlak riskine karşı detay uygulanmış mı?",
      "Tesisat için aşırı oyuk açılmış mı?",
    ],
    numericalExample: {
      title: "600 x 250 mm blok ile yatay sıra hesabı",
      inputs: [
        { label: "Duvar uzunluğu", value: "4,80 m", note: "Örnek iç duvar" },
        { label: "Blok boyu", value: "60 cm", note: "Nominal yatay uzunluk" },
        { label: "Teorik blok sayısı", value: "8 adet", note: "4,80 / 0,60" },
        { label: "Hedef", value: "minimum kesimle düzenli sıra", note: "Saha verimliliği" },
      ],
      assumptions: [
        "Kapı veya pencere boşluğu bulunmamaktadır.",
        "Derz sistemi ince yapıştırıcı mantığındadır.",
        "Köşe bağlantıları ayrı değerlendirilmiştir.",
      ],
      steps: [
        {
          title: "Teorik sıra adetini hesapla",
          result: "4,80 m uzunlukta tek sırada yaklaşık 8 blokla düzen kurulabilir.",
          note: "Bu, sahadaki kesim ihtiyacını önceden görmeye yardımcı olur.",
        },
        {
          title: "Kesim ve şaşırtmayı yorumla",
          result: "Düşey derzlerin üst üste binmemesi için sonraki sıralarda blok kaydırma planlanmalıdır.",
          note: "Sadece ilk sıra verimli olsun diye tüm duvar düzeni bozulmamalıdır.",
        },
      ],
      checks: [
        "Kesim oranı fazla ise duvar başlangıç noktası yeniden değerlendirilebilir.",
        "İnce derzli sistemde ölçü toleransı daha dikkatli izlenmelidir.",
        "Köşe ve açıklık bölgeleri ayrıca planlanmalıdır.",
      ],
      engineeringComment: "Gazbetonda hız avantajı, blokları hızlı koymaktan değil; ilk sırayı ve kesim planını doğru kurmaktan gelir.",
    },
    tools: DUVAR_TOOLS,
    equipmentAndMaterials: DUVAR_EQUIPMENT,
    mistakes: [
      { wrong: "Gazbetonu tuğla gibi kalın harçla telafi ederek örmek.", correct: "Sistem yapıştırıcısı ve ince derz mantığını korumak." },
      { wrong: "İlk sıra hatasını üst sıralarda kesimle kapatmaya çalışmak.", correct: "İlk sırayı gerçek referans olarak doğru kurmak." },
      { wrong: "Tesisat için blokları genişçe oymak.", correct: "Kontrollü geçişler bırakıp gereksiz zayıflatmadan kaçınmak." },
      { wrong: "Betonarme birleşimlerini blok sistemiyle uyumsuz bırakmak.", correct: "Ankraj ve çatlak detayını ayrıca çözmek." },
      { wrong: "Kesim planı yapmadan kısa parça ve fireyi artırmak.", correct: "Duvar başlangıç ve bitişini blok modülüne göre planlamak." },
    ],
    designVsField: [
      "Gazbeton projede hafif ve düzenli bir duvar çözümü gibi görünür; sahada ise bu düzeni korumak ince derz ve ilk sıra hassasiyeti ister.",
      "Bu nedenle gazbetonun avantajı malzemenin kendisinde değil, sistemi disiplinli uygulayabilen ekipte ortaya çıkar.",
    ],
    conclusion: [
      "Gazbeton duvar doğru uygulandığında hızlı, düzgün ve performanslı bir dolgu çözümü sunar. Yanlış uygulandığında ise hafiflik ve ölçü avantajı kısa sürede kaybolur.",
    ],
    sources: KABA_LEAF_SOURCES,
    keywords: ["gazbeton", "ytong", "ince derz", "hafif blok", "duvar kesim planı"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/briket",
    kind: "topic",
    quote: "Briket veya bims duvar, ekonomik çözüm gibi görünür; ama düzenli örülmediğinde yüzey ve dayanıklılık sorunlarını hızla görünür hale getirir.",
    tip: "Briket duvarda düşük birim maliyete güvenip derz, nem ve yüzey disiplinini ihmal etmek, sonradan daha pahalı sıva ve düzeltme yükü doğurur.",
    intro: [
      "Briket veya bims blok duvarlar, bölgesel bulunabilirlik ve ekonomik avantaj nedeniyle birçok yapıda tercih edilir. Malzeme hafif agregalı veya boşluklu yapısıyla hızlı örülebilir; ancak yüzey düzgünlüğü, derz kalitesi ve su emme davranışı iyi yönetilmezse sonraki katmanlara yüksek düzeltme yükü bırakır.",
      "Bu duvar tipinde en kritik konu, malzemenin üretim toleranslarının daha değişken olabilmesidir. Aynı palette küçük boyut farkları veya emicilik değişimleri görülebilir. Bu nedenle briket duvar, düşük maliyetli olduğu için daha az dikkat değil; tam tersine daha sistemli kontrol ister.",
    ],
    theory: [
      "Briket duvarın performansı blok geometrisi, boşluk düzeni ve harçla birlikte değerlendirilir. Malzeme yüzeyi ve emiciliği farklı olabildiği için derz davranışı ve sıva altı hazırlığı tuğla ya da gazbetona göre daha dikkatli yönetilmelidir. Özellikle düzensiz birim ölçüler, duvar düşeyliğini ve derz sürekliliğini zorlayabilir.",
      "Nem ve yüzey emiciliği de burada önemli başlıktır. Yüksek emicilik, harç suyunun hızlı kaybına yol açarak aderans sorunları yaratabilir; çok kuru veya çok ıslak bloklarla çalışmak derz kalitesini etkiler. Dolayısıyla malzemenin sahadaki bekleme ve hazırlık koşulları da uygulamanın parçasıdır.",
      "Briket duvarlarda açıklık çevresi ve betonarme birleşimleri yine kritik düğümlerdir. Malzemenin ekonomik olması bu bölgelerde detay ihtiyacını ortadan kaldırmaz. Aksine yüzey düzgünlüğü ve çatlak kontrolü için daha fazla dikkat gerektirir.",
    ],
    ruleTable: [
      {
        parameter: "Blok kalitesi ve ölçü kontrolü",
        limitOrRequirement: "Şantiyeye gelen blokların ölçü ve hasar durumu örüm öncesi kontrol edilmelidir.",
        reference: "Saha kabul disiplini",
        note: "Değişken üretim toleransı yüzey kalitesini doğrudan etkiler.",
      },
      {
        parameter: "Derz ve yüzey sürekliliği",
        limitOrRequirement: "Yatay ve düşey derzler duvar bütünlüğünü koruyacak şekilde düzenli uygulanmalıdır.",
        reference: "Uygulama pratiği",
        note: "Düzensiz derz, sıva yükünü ve çatlak riskini artırır.",
      },
      {
        parameter: "Nem ve emicilik yönetimi",
        limitOrRequirement: "Blok yüzeyi uygulama öncesi uygun durumda olmalıdır; aşırı kuru veya bozuk blokla örüme başlanmamalıdır.",
        reference: "Saha kalite yaklaşımı",
        note: "Harç davranışı malzemenin emiciliğiyle yakından ilişkilidir.",
      },
    ],
    designOrApplicationSteps: [
      "Şantiyeye gelen blokları kırık, çatlak ve ölçü farkı açısından ayıkla.",
      "İlk sırayı düzgün kotta kurarak değişken blok toleransını başlangıçta kontrol altına al.",
      "Derz kalınlığını düzenli tutup yüzey sürekliliğini mastarla sık kontrol et.",
      "Kapı, pencere ve birleşim bölgelerinde düzensiz kısa parçalardan kaçınarak temiz detay kur.",
      "Sıva öncesi duvar yüzeyini dalga, boşluk ve tesisat kırıkları açısından yeniden değerlendir.",
    ],
    criticalChecks: [
      "Kırık veya ölçüsü bozuk bloklar sahaya karışıyor mu?",
      "Derz düzeni duvar boyunca korunuyor mu?",
      "Blok emiciliği nedeniyle harç davranışı bozuluyor mu?",
      "Açıklık çevresinde düzensiz kısa parça kullanılmış mı?",
      "Sıva öncesi yüzey dalgası kabul edilebilir düzeyde mi?",
    ],
    numericalExample: {
      title: "19 cm briket duvarda kalınlık ve sıva etkisi yorumu",
      inputs: [
        { label: "Blok kalınlığı", value: "19 cm", note: "Nominal duvar kalınlığı" },
        { label: "Hedef duvar hattı", value: "mimari aksa bağlı", note: "Net mahal ölçüsü için" },
        { label: "Sıva kalınlığı", value: "iki yüzde toplam dikkate alınır", note: "Net ölçü etkisi" },
        { label: "Hedef", value: "mahal ölçüsünü korurken düzgün yüzey bırakmak", note: "Bitiş amacı" },
      ],
      assumptions: [
        "Blok toleranslarında küçük saha farkları olabileceği kabul edilir.",
        "İlk sıra doğru kotta kurulmuştur.",
        "Sıva kalınlığı aşırı düzeltme amacıyla büyütülmeyecektir.",
      ],
      steps: [
        {
          title: "Nominal kalınlığı eksene bağla",
          result: "19 cm blok kalınlığı, mimari aks ve bitiş katmanları birlikte düşünülerek yerleştirilmelidir.",
          note: "Nominal değer tek başına net mahal ölçüsünü garanti etmez.",
        },
        {
          title: "Sıva yükünü yorumla",
          result: "Duvar dalgalı bırakılırsa sıva kalınlığı gereksiz artar ve ekonomi avantajı kaybolur.",
          note: "Ucuz duvar, pahalı düzeltmeye dönüşmemelidir.",
        },
      ],
      checks: [
        "Briket duvar bitiş yüküyle birlikte değerlendirilmelidir.",
        "Yüzey dalgası mastar kontrolüyle erken fark edilmelidir.",
        "Ekonomik malzeme seçimi kalite kontrolünü gevşetmemelidir.",
      ],
      engineeringComment: "Briket duvarda gerçek ekonomi, blok fiyatından çok ne kadar az düzeltme ihtiyacı bıraktığıyla ölçülür.",
    },
    tools: DUVAR_TOOLS,
    equipmentAndMaterials: DUVAR_EQUIPMENT,
    mistakes: [
      { wrong: "Kırık ve ölçüsü bozuk blokları da duvarda kullanmak.", correct: "Örüm öncesi ayıklama yaparak yüzey kalitesini korumak." },
      { wrong: "Derz kalınlığını blok hatasını telafi aracı haline getirmek.", correct: "İlk sırayı doğru kurup derz düzenini korumak." },
      { wrong: "Briketin ekonomik oluşunu kalite kontrolünü gevşetmek için kullanmak.", correct: "Mastar ve şakül kontrolünü daha sistemli yapmak." },
      { wrong: "Tesisat kırıklarını sıva ile kapatılacak kusur sanmak.", correct: "Planlı geçiş ve temiz kanal düzeni kurmak." },
      { wrong: "Açıklık kenarlarında kısa ve düzensiz parçalarla devam etmek.", correct: "Lento ve kenar detayını temiz parça düzeniyle çözmek." },
    ],
    designVsField: [
      "Projede briket duvar basit bir dolgu katmanı gibi görünür; sahada ise blok toleransı ve yüzey doğruluğu bu katmanın gerçek performansını belirler.",
      "Bu nedenle ekonomik malzeme kullanmak, daha düşük teknik disiplin anlamına gelmez.",
    ],
    conclusion: [
      "Briket duvar doğru kontrol edildiğinde ekonomik ve işlevsel bir çözüm sunabilir. Kontrol gevşetildiğinde ise yüzey bozukluğu ve düzeltme ihtiyacı tüm avantajı hızla tüketir.",
    ],
    sources: KABA_LEAF_SOURCES,
    keywords: ["briket", "bims duvar", "derz düzeni", "yüzey düzgünlüğü", "ekonomik dolgu duvar"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/ahsap-cati",
    kind: "topic",
    quote: "Ahşap çatı, hafifliği sayesinde hızlıdır; ama uzun ömrü, kerestenin değil detayın ne kadar doğru kurulduğuna bağlıdır.",
    tip: "Ahşap çatı karkasında en büyük risk kesit seçimi değil; nemli malzeme, zayıf bağlantı ve havalandırmasız detaylarla sistemi erken yaşlandırmaktır.",
    intro: [
      "Ahşap çatı, düşük ağırlığı ve kolay işlenebilirliği sayesinde konut tipi yapılarda yaygın kullanılan bir taşıyıcı çözümdür. Makas, aşık, mertek ve kaplama altı elemanlardan oluşan bu sistem doğru kurulduğunda hızlı ilerler ve bakım erişimi görece kolay olur.",
      "Ancak ahşap çatı başarısı yalnız doğru kesit seçimine bağlı değildir. Kerestenin kuru ve düzgün olması, birleşimlerin gerçekten taşıyıcı davranması, çatı boşluğunun havalanması ve suyun kaplama altına girmeyeceği detayların kurulması birlikte düşünülmelidir. Ahşap çatıda hatalar çoğu zaman montaj günü değil birkaç mevsim sonra görünür hale gelir.",
    ],
    theory: [
      "Ahşap taşıyıcı sistemlerde yük aktarımı kesit büyüklüğü kadar bağlantı davranışına bağlıdır. Mertekten aşığa, aşıktan makasa ve oradan duvar oturumuna kadar her düğüm kuvveti yeni bir elemana geçirir. Bu nedenle iyi ahşap çatı, tekil çubuklardan çok bir düğüm sistemi gibi düşünülmelidir.",
      "Nem ahşap çatı için en önemli saha girdilerinden biridir. Yeterince kuru olmayan malzeme zamanla dönme, çekme ve çatlama yapabilir; bu da kaplama düzlemini bozar. Aynı şekilde havalandırması yetersiz veya buhar hareketi düşünülmemiş çatı boşluklarında yoğuşma, biyolojik bozulma ve bağlantı zayıflığı görülebilir.",
      "Ahşap sistemin hafifliği avantajdır; ancak rüzgar etkisi ve ankraj ihtiyacı da bu nedenle daha görünür hale gelir. Taşıyıcı duvara oturma, ankraj ve mahya sürekliliği güvenli kurulmazsa sistem hafif olmasının bedelini stabilite riskleriyle ödeyebilir.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve nem durumu",
        limitOrRequirement: "Taşıyıcı ahşap kuru, düzgün ve uygulamaya uygun durumda olmalıdır.",
        reference: "Saha kalite disiplini",
        note: "Montaj günü ıslak veya dönük elemanla kurulan çatı uzun vadede geometri kaybeder.",
      },
      {
        parameter: "Bağlantı ve ankraj",
        limitOrRequirement: "Makas, aşık ve duvar oturumları mekanik bağlantılarla güvenceye alınmalıdır.",
        reference: "Planlı Alanlar İmar Yönetmeliği + çatı detay pratiği",
        note: "Hafif sistemler rüzgar ve kaldırma etkisine karşı dikkat ister.",
      },
      {
        parameter: "Isı, buhar ve havalandırma",
        limitOrRequirement: "Çatı kabuğu TS 825 hedefleriyle uyumlu ve havalandırılabilir düşünülmelidir.",
        reference: "TS 825",
        note: "Taşıyıcı iskelet, kaplama ve ısı katmanı birbirinden ayrı düşünülmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Ahşap elemanları montaj öncesi nem, eğrilik ve kesit doğruluğu açısından ayıkla.",
      "Makas, aşık ve mertek düzenini çatı planı ve açıklık mantığına göre kur.",
      "Bağlantı levhası, ankraj ve oturma detaylarını yalnız çivi alışkanlığına bırakmadan tamamla.",
      "Kaplama altı düzlemi, havalandırma boşluğu ve buhar katmanını taşıyıcı iskeletle birlikte düşün.",
      "Montaj sonrası mahya doğrultusu, eğim ve rüzgara karşı ankraj sürekliliğini son kez kontrol et.",
    ],
    criticalChecks: [
      "Kullanılan kereste kuru ve dönmesiz mi?",
      "Bağlantı noktaları gerçekten mekanik süreklilik sağlıyor mu?",
      "Eğim ve mahya doğrultusu tüm çatı boyunca korunuyor mu?",
      "Havalandırma ve buhar geçişi için boşluk bırakıldı mı?",
      "Duvar oturumunda ankraj ve oturma detayı net mi?",
    ],
    numericalExample: {
      title: "Ahşap çatıda eğimden doğan kot farkının hızlı yorumu",
      inputs: [
        { label: "Yatay yarım açıklık", value: "4,0 m", note: "Tek eğimli yarı kesit" },
        { label: "Hedef eğim", value: "%33", note: "Yaklaşık 1/3 eğim" },
        { label: "Kot farkı", value: "1,32 m", note: "4,0 x 0,33" },
        { label: "Hedef", value: "mahya ve saçak geometrisini net kurmak", note: "Montaj doğruluğu" },
      ],
      assumptions: [
        "Kaplama tipi seçilen eğime uygundur.",
        "Mahya kotu mimari siluete göre önceden netleşmiştir.",
        "Taşıyıcı duvar oturum kotları doğrudur.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "4,0 x 0,33 = 1,32 m",
          result: "Saçak ile mahya arasında yaklaşık 1,32 m kot farkı gerekir.",
          note: "Bu değer çatı geometrisini sahada somutlaştırır ve makas boylarını netleştirir.",
        },
        {
          title: "Montaj doğruluğunu yorumla",
          result: "Mahya hattı bu kot farkını bütün açıklık boyunca tutarlı vermelidir.",
          note: "Aksi halde kaplama altı düzlem bozulur ve su tahliyesi zayıflar.",
        },
      ],
      checks: [
        "Kot farkı tüm makaslarda aynı mantıkla kurulmalıdır.",
        "Kaplama düzlemi mahya boyunca süreklilik göstermelidir.",
        "Ankraj ve bağlantı detayları geometri kadar önemlidir.",
      ],
      engineeringComment: "Ahşap çatı hafif olabilir; ama doğru eğim ve doğru bağlantı kurulmadan hafiflik avantaj değil kırılganlık üretir.",
    },
    tools: CATI_TOOLS,
    equipmentAndMaterials: CATI_EQUIPMENT,
    mistakes: [
      { wrong: "Nemli veya eğri ahşabı montaja almak.", correct: "Elemanları kuruluk ve düzgünlük açısından ayıklamak." },
      { wrong: "Bağlantıları usta alışkanlığıyla çözmek.", correct: "Her düğümü taşıyıcı davranış mantığıyla sabitlemek." },
      { wrong: "Havalandırma boşluğunu ikincil görmek.", correct: "Çatı kabuğunun parçası olarak planlamak." },
      { wrong: "Mahya ve saçak doğrultusunu birkaç noktadan doğru görmekle yetinmek.", correct: "Tüm hat boyunca sürekliliği kontrol etmek." },
      { wrong: "Rüzgar ankrajını hafif sistemde önemsiz sanmak.", correct: "Oturum ve bağlantı detaylarını özellikle güçlendirmek." },
    ],
    designVsField: [
      "Ahşap çatı projede sıcak ve basit bir çözüm gibi görünür; sahada ise kuruluk, bağlantı ve havalandırma birlikte yönetilmezse aynı sadelik hızla soruna dönüşebilir.",
      "Bu nedenle ahşap çatı, doğal malzemenin ancak disiplinli detayla uzun ömürlü olabildiği bir sistemdir.",
    ],
    conclusion: [
      "Ahşap çatı doğru malzeme ve doğru detayla kurulduğunda hafif, hızlı ve verimli bir çözüm sunar. Nem, bağlantı ve havalandırma disiplininden taviz verildiğinde ise avantajını kısa sürede kaybeder.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar],
    keywords: ["ahşap çatı", "mertek", "mahya", "havalandırma boşluğu", "çatı ankrajı"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/celik-cati",
    kind: "topic",
    quote: "Çelik çatı, geniş açıklığı hızlı kapatır; ama montaj doğruluğu ve bağlantı kalitesi zayıfsa bu hız doğrudan risk üretir.",
    tip: "Çelik çatıda en sık hata, atölye doğruluğuna güvenip sahadaki aks, bulon ve çapraz sürekliliğini ikinci plana atmaktır.",
    intro: [
      "Çelik çatı, büyük açıklıkları görece hafif kesitlerle geçebilmesi ve hızlı montaj imkanı sunması nedeniyle sanayi yapıları, salonlar ve geniş hacimli binalarda sık tercih edilir. Makaslar, aşıklar, çaprazlar ve bağlantı levhaları birlikte çalışarak hem düşey yükleri hem rüzgar etkisini taşır.",
      "Ancak çelik çatının hızı, sahadaki tolerans disiplinini daha da önemli hale getirir. Atölyeden doğru çıkan elemanlar bile sahada yanlış aksa oturtulur, bulonlar tam sıkılmaz veya çapraz sürekliliği bozulursa sistem davranışı zayıflar. Çelik çatı montajı, ön imalat kadar saha düzeltme yetkinliği de gerektirir.",
    ],
    theory: [
      "Çelik çatı sistemlerinde taşıyıcı davranış, elemanların tekil dayanımından çok düğüm ve çapraz sistem sürekliliği ile belirlenir. Makaslar açıklığı geçer, aşıklar kaplama yükünü taşır, çaprazlar ise sistemin yatay stabilitesini sağlar. Bu üçlüden biri eksik veya gevşek kalırsa çatı beklenen rijitliğe ulaşamaz.",
      "Montaj toleransı çelik çatıda çok kritiktir. Birkaç milimetrelik atölye hatası sahada ayarlanabilir; fakat aks oturumu, kolon başlık kotu veya çapraz düzlemi yanlışsa kaplama altında dalga, bağlantıda zorlanma ve hatta ikincil gerilme oluşabilir. Bu nedenle montaj sırası, civata sıkma ve geçici sabitleme planlanmadan çelik çatı güvenle ilerletilemez.",
      "Çelik çatıda bakım ve yangın davranışı da düşünülmelidir. Korozyon koruması, bağlantı erişimi, kaplama altı yoğuşma ve yangın yönetmeliği ile ilişkili gereksinimler taşıyıcı sistem kararından ayrı tutulmamalıdır. Sahadaki iyi montaj, uzun vadeli bakım mantığına da yer bırakmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Aks ve montaj doğruluğu",
        limitOrRequirement: "Makas ve aşık sistemi kolon akslarına ve hedef kote uygun kurulmalıdır.",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha montaj disiplini",
        note: "Atölye doğruluğu sahadaki aks hatasını telafi etmez.",
      },
      {
        parameter: "Bağlantı ve çapraz sürekliliği",
        limitOrRequirement: "Bulon, levha ve çapraz elemanlar montaj sırasına göre tam devreye alınmalıdır.",
        reference: "Yangın ve saha güvenlik planı + çelik montaj pratiği",
        note: "Geçici sabitlemenin kalıcı sistem gibi davranacağı varsayılmamalıdır.",
      },
      {
        parameter: "Yoğuşma ve kabuk ilişkisi",
        limitOrRequirement: "Çatı kabuğu TS 825 hedefleriyle uyumlu ve yoğuşma riskini sınırlayacak detayda kurulmalıdır.",
        reference: "TS 825",
        note: "Taşıyıcı çelik ile kaplama katmanı aynı çatı performansının parçasıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon başlık kotu ve akslarını çelik montaj öncesi yeniden doğrula.",
      "Makasları montaj sırasına göre kaldırıp geçici değil planlı şekilde sabitle.",
      "Aşık ve çapraz sistemini taşıyıcı sürekliliği tamamlamadan kaplama altı işe geçme.",
      "Bulon sıkma, levha oturumu ve mahya doğruluğunu montaj boyunca kontrol et.",
      "Kaplama öncesi çelik iskeletin korozyon, yoğuşma ve bakım erişimi detaylarını tamamla.",
    ],
    criticalChecks: [
      "Kolon başlık kotları çatı montajına uygun mu?",
      "Geçici montaj elemanları kalıcı sistem gibi bırakılmış mı?",
      "Çapraz ve stabilite elemanları eksiksiz devreye alındı mı?",
      "Bulon ve levha oturumlarında açıklık veya gevşeklik var mı?",
      "Kaplama altı düzlem ve yoğuşma detayları net mi?",
    ],
    numericalExample: {
      title: "18 m açıklıklı çelik çatıda montaj kademesi yorumu",
      inputs: [
        { label: "Açıklık", value: "18 m", note: "Sanayi yapısı örneği" },
        { label: "Makas sayısı", value: "6 adet", note: "Ana taşıyıcı sıra" },
        { label: "Montaj hedefi", value: "önce ana makas + sonra aşık ve çapraz", note: "Stabilite sırası" },
        { label: "Kritik konu", value: "geçici sabitleme süresi", note: "Montaj güvenliği" },
      ],
      assumptions: [
        "Kolon aksları önceden ölçülmüştür.",
        "Kaldırma ekipmanı açıklığa uygundur.",
        "Kaplama montajına, stabilite sistemi tamamlanmadan başlanmayacaktır.",
      ],
      steps: [
        {
          title: "Ana montaj sırasını kur",
          result: "Makaslar tek tek kaldırılırken aradaki aşık ve çaprazlar sistem davranışını hızlıca tamamlamalıdır.",
          note: "Aksi halde her makas uzun süre geçici durumda kalır.",
        },
        {
          title: "Geçici durum riskini yorumla",
          result: "18 m açıklıkta geçici sabitleme süresinin uzaması rüzgar ve montaj hatası riskini büyütür.",
          note: "Bu nedenle montaj sırası lojistik değil yapısal karar olarak ele alınmalıdır.",
        },
      ],
      checks: [
        "Makaslar tek başına bırakılmamalıdır.",
        "Stabilite elemanları montajın erken safhasında devreye alınmalıdır.",
        "Kaplama, taşıyıcı süreklilikten sonra başlamalıdır.",
      ],
      engineeringComment: "Çelik çatıda hız, elemanları hızlı kaldırmaktan değil sistemi hızlı stabil hale getirmekten gelir.",
    },
    tools: CATI_TOOLS,
    equipmentAndMaterials: CATI_EQUIPMENT,
    mistakes: [
      { wrong: "Atölye toleransına güvenip saha aks kontrolünü gevşetmek.", correct: "Montaj öncesi kolon başlık ve aks doğrulamasını yeniden yapmak." },
      { wrong: "Çaprazları sonradan takılacak ikincil eleman gibi görmek.", correct: "Sistemin stabilite parçası olarak erken devreye almak." },
      { wrong: "Bulon sıkmayı montaj sonuna bırakmak.", correct: "Bağlantı kalitesini aşamalı kontrol etmek." },
      { wrong: "Geçici sabitlemeyi uzun süre kalıcı çözüm gibi kullanmak.", correct: "Montaj sırasını yapısal sürekliliğe göre planlamak." },
      { wrong: "Yoğuşma ve bakım erişimini kaplama sonrasına ertelemek.", correct: "Taşıyıcı iskeletle birlikte düşünmek." },
    ],
    designVsField: [
      "Çelik çatı projede temiz çizgiler ve simetrik kesitlerle görünür; sahada ise gerçek kalite aks, bağlantı ve geçici montaj davranışında ortaya çıkar.",
      "Bu nedenle çelik çatının güveni atölyeden gelir ama doğrulaması sahada yapılır.",
    ],
    conclusion: [
      "Çelik çatı doğru montajlandığında geniş açıklıkları hızlı ve güvenli biçimde kapatır. Montaj sırası ve bağlantı disiplini zayıfsa ise aynı hız yapısal riske dönüşebilir.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.yanginYonetmeligi, SOURCE_LEDGER.planliAlanlar],
    keywords: ["çelik çatı", "makas montajı", "çapraz sistem", "bulon kontrolü", "geniş açıklık"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/teras-cati",
    kind: "topic",
    quote: "Teras çatı, düz göründüğü için kolay sanılır; gerçekte ise eğimi görünmez ama zorunlu olan bir su yönetim sistemidir.",
    tip: "Teras çatıda en sık hata suyu kaplamanın çözeceğini düşünmektir; oysa taşıyıcı eğim, süzgeç kotu ve detay sürekliliği kurulmadan hiçbir kaplama tek başına yeterli olmaz.",
    intro: [
      "Teras çatı, düz veya düşük eğimli görünen çatı tiplerinde su yalıtımı, ısı yalıtımı ve kullanım yüzeyini aynı kabukta toplayan sistemdir. Bu sistemde taşıyıcı döşeme, eğim katmanı, su yalıtımı, koruma katmanı ve kaplama bir arada çalışır. Dolayısıyla teras çatı yalnız çatı kaplaması değil, katmanlı bir mühendislik paketidir.",
      "Sahada teras çatıyı zorlaştıran asıl konu, eğimin gözle zor algılanmasıdır. Su birikintisi çoğu zaman birkaç santimetrelik kot hatasından doğar. Ayrıca parapet dönüşleri, süzgeç çevresi, tesisat ayakları ve döşeme sonlandırmaları detay çözülmeden ilerletilirse yalıtım performansı hızla düşer. Teras çatıda görünmeyen detay, görünen su lekesi olarak geri döner.",
    ],
    theory: [
      "Teras çatıda ana hedef, suyu yapıdan güvenli biçimde uzaklaştırmaktır. Bu nedenle eğim katmanı ve tahliye noktaları tüm sistemin kalbidir. Yalıtım malzemesi ne kadar iyi olursa olsun, suyun uzun süre beklediği yüzeylerde detay zorlukları ve yaşlanma etkisi büyür. Su yönetimi katman kurgusundan başlar.",
      "Isı ve buhar hareketi de teras çatıda kritik rol oynar. TS 825 hedefleri doğrultusunda yeterli ısı yalıtımı sağlanmazsa yalnız enerji kaybı değil, yoğuşma ve malzeme ömrü sorunları da oluşabilir. Bu nedenle teras çatı, taşıyıcı sistem ile enerji performansının doğrudan buluştuğu bir detay paketidir.",
      "Bakım erişimi ve mekanik ekipman ayakları da sistemin parçasıdır. Klima dış üniteleri, güneş enerjisi ayakları veya çatıdaki servis yolları sonradan düşünülürse yalıtım katmanı tekrar tekrar delinmek zorunda kalır. İyi teras çatı, gelecekteki bakım senaryosunu şimdiden taşır.",
    ],
    ruleTable: [
      {
        parameter: "Eğim ve drenaj",
        limitOrRequirement: "Yüzey suyu süzgeç ve tahliye hattına güvenli eğimle yönlendirilmelidir.",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha kalite planı",
        note: "Gözle düz görünen çatı, ölçüyle doğru eğimi vermelidir.",
      },
      {
        parameter: "Isı ve kabuk performansı",
        limitOrRequirement: "Katman kurgusu TS 825 hedefleriyle uyumlu olmalıdır.",
        reference: "TS 825",
        note: "Teras çatı enerji performansının en hassas yüzeylerinden biridir.",
      },
      {
        parameter: "Yalıtım ve detay sürekliliği",
        limitOrRequirement: "Parapet, süzgeç ve ekipman geçişlerinde kesintisiz detay çözülmelidir.",
        reference: "Saha detay disiplini + yapı denetim yaklaşımı",
        note: "Düz alan değil detay düğümü zafiyet üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Taşıyıcı döşeme kotunu, eğim planını ve süzgeç yerlerini birlikte netleştir.",
      "Eğim katmanını uygulamadan önce düşük kotlu bölgeleri ölçüyle belirle.",
      "Su yalıtımı, parapet dönüşü ve süzgeç detaylarını ana yüzeyle birlikte tamamla.",
      "Isı yalıtımı, koruma katmanı ve son kaplamayı sistem mantığıyla sırala.",
      "Teslim öncesi kontrollü su testi veya drenaj gözlemi ile davranışı doğrula.",
    ],
    criticalChecks: [
      "Süzgeç kotları gerçekten en düşük nokta mı?",
      "Eğim katmanı tüm yüzeyde süreklilik gösteriyor mu?",
      "Parapet ve köşe dönüşleri düzgün çözülmüş mü?",
      "Ekipman ayakları yalıtım bütünlüğünü bozuyor mu?",
      "Teslim öncesi suyun davranışı gözlenmiş mi?",
    ],
    numericalExample: {
      title: "20 m teras çatıda eğimden doğan kot farkı",
      inputs: [
        { label: "Yüzey boyu", value: "20 m", note: "Tek yönlü akış örneği" },
        { label: "Hedef eğim", value: "%2", note: "Teras çatı için örnek saha değeri" },
        { label: "Kot farkı", value: "40 cm", note: "20 x 0,02" },
        { label: "Hedef", value: "göllenmesiz tahliye", note: "Süzgeç odaklı drenaj" },
      ],
      assumptions: [
        "Çatı suyu tek ana hattaki süzgeçlere yönlendirilecektir.",
        "Eğim katmanı uygulaması taşıyıcı döşeme üstünde yapılacaktır.",
        "Süzgeç detayları bu geometriye göre seçilecektir.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "20 x 0,02 = 0,40 m",
          result: "Uçtan uca yaklaşık 40 cm kot farkı gerekir.",
          note: "Bu değer, düz görünen çatının aslında ölçüsel geometri gerektirdiğini gösterir.",
        },
        {
          title: "Tahliye kararını yorumla",
          result: "Süzgeç kotu ve çevre eğim aynı mantıkla kurulmazsa yerel göllenme kaçınılmaz olur.",
          note: "Sorun çoğu zaman kaplamadan değil düşük noktanın yanlış yerinden doğar.",
        },
      ],
      checks: [
        "Eğim kararı yalnız kağıtta kalmamalı, saha ölçüsüyle doğrulanmalıdır.",
        "Süzgeç çevresi lokal detay olarak ayrıca kontrol edilmelidir.",
        "Su testi veya gözlem yapılmadan sistem tamamlanmış sayılmamalıdır.",
      ],
      engineeringComment: "Teras çatıda başarının sırrı, suyu kaplama üstünde tutmamayı daha geometri aşamasında başarabilmektir.",
    },
    tools: CATI_TOOLS,
    equipmentAndMaterials: CATI_EQUIPMENT,
    mistakes: [
      { wrong: "Eğimi yalıtımın çözeceğini düşünmek.", correct: "Taşıyıcı ve eğim katmanını su yönetiminin ana parçası olarak kurmak." },
      { wrong: "Süzgeç kotlarını saha anında belirlemek.", correct: "En düşük noktaları önceden ölçüyle tanımlamak." },
      { wrong: "Parapet ve ekipman detaylarını ana yüzeyden ayrı düşünmek.", correct: "Yalıtım sürekliliğini tüm düğümlerde birlikte çözmek." },
      { wrong: "Bakım erişimini sonradan eklemek.", correct: "Çatı kullanım ve bakım senaryosunu baştan planlamak." },
      { wrong: "Teslim öncesi drenaj davranışını test etmemek.", correct: "Su akışı ve göllenmeyi sahada gözlemek." },
    ],
    designVsField: [
      "Teras çatı projede düz bir yüzey gibi görünür; sahada ise birkaç santimetrelik kot kararları tüm su davranışını belirler.",
      "Bu nedenle teras çatı, görünmeyen eğimin en kritik olduğu bina kabuğu detaylarından biridir.",
    ],
    conclusion: [
      "Teras çatı doğru katman ve doğru eğimle kurulduğunda hem kuru hem enerji verimli bir kabuk sunar. Hatalı kurulduğunda ise sorun ilk yağmurla birlikte görünür olur.",
    ],
    sources: [...KABA_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yapiDenetim],
    keywords: ["teras çatı", "eğim katmanı", "süzgeç kotu", "göllenme", "çatı su yalıtımı"],
  },
];
