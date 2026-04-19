import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const INCE_LEAF_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const ALCIPAN_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Tavan ve duvar overlay paftaları", purpose: "Alçıpan yüzey, kapı boşluğu ve tesisat geçişlerini çakışmasız çözmek." },
  { category: "Ölçüm", name: "Lazer nivo, mastar ve kot çizelgesi", purpose: "Asma tavan düzlemi, bölme duvar aksı ve kapı boşluğu doğruluğunu kontrol etmek." },
  { category: "Kontrol", name: "Vida aralığı ve profil kontrol föyü", purpose: "Taşıyıcı sistem kurulumunu ustalık alışkanlığından çıkarıp ölçülebilir hale getirmek." },
  { category: "Kayıt", name: "Kapatma öncesi foto-log", purpose: "Tesisat geçişleri, takviye noktaları ve kapatma öncesi karkası belgelemek." },
];

const ALCIPAN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Galvaniz U/C profiller, askı çubukları ve taşıyıcı kanallar", purpose: "Asma tavan ve bölme duvar karkasını rijit ve tekrarlanabilir şekilde kurmak.", phase: "Karkas montajı" },
  { group: "Kaplama", name: "Standart, neme dayanımlı veya yangına dayanımlı alçıpan levhalar", purpose: "Mahal kullanımına göre yüzey, yangın ve nem performansı üretmek.", phase: "Levha kaplama" },
  { group: "Tamamlama", name: "Derz bandı, derz dolgu ve köşe profilleri", purpose: "Birleşim çizgilerini çatlak ve darbe riskine karşı stabilize etmek.", phase: "Derz ve yüzey hazırlığı" },
  { group: "Destek", name: "Kapı üstü takviye profili ve ekipman karkas destekleri", purpose: "Kapı, menfez, armatür ve erişim kapağı gibi noktasal yükleri güvenle taşımak.", phase: "Detay çözümü" },
];

const WET_FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Fayans modül paftası ve aks şeması", purpose: "Derz çizgisi, niş, armatür ve köşe dönüşlerini uygulamadan önce netleştirmek." },
  { category: "Ölçüm", name: "Nem ölçer, mastar ve lazer terazi", purpose: "Yüzey hazırlığı, su yalıtımı ve derz doğruluğunu kontrol etmek." },
  { category: "Kontrol", name: "Karışım ve tüketim takip föyü", purpose: "Astar, yapıştırıcı ve derz dolgu tüketimini uygulama kalitesiyle birlikte izlemek." },
  { category: "Kayıt", name: "Islak hacim su testi ve foto arşivi", purpose: "Kaplama öncesi ve sonrası kritik düğümlerin teslim dokümantasyonunu oluşturmak." },
];

const WET_FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazırlık", name: "Astar, yüzey düzeltme harcı ve su yalıtım katmanları", purpose: "Kaplama altı yüzeyi aderans ve su davranışı açısından hazır hale getirmek.", phase: "Hazırlık" },
  { group: "Kaplama", name: "Seramik/fayans, epoksi reçine ve uygun sistem bileşenleri", purpose: "Mahal kullanımına uygun son kat performansını üretmek.", phase: "Kaplama" },
  { group: "Birleşim", name: "Yapıştırıcı, derz dolgu, köşe profili ve dilatasyon elemanları", purpose: "Kenar, dönüş ve birleşim noktalarını kontrollü kapatmak.", phase: "Montaj ve bitiş" },
  { group: "Koruma", name: "Yüzey koruma örtüsü ve geçici trafik bariyerleri", purpose: "Kür veya ilk dayanım sürecinde tamamlanan kaplamayı korumak.", phase: "Teslim öncesi" },
];

const CATI_FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Çatı eğim ve katman paftası", purpose: "Kiremit aksı, mahya, baca dibi ve su yönünü montaj öncesi netleştirmek." },
  { category: "Ölçüm", name: "Lazer nivo, ip iskelesi ve eğim kontrolü", purpose: "Taşıyıcı üstü latalama ve kaplama doğrultusunu doğrulamak." },
  { category: "Kontrol", name: "Rüzgar ve sabitleme kontrol listesi", purpose: "Kritik kenar, mahya ve saçak bölgelerinde eksik sabitlemeyi önlemek." },
  { category: "Kayıt", name: "Çatı detay foto-logu", purpose: "Kapatıldıktan sonra görülemeyecek su yalıtımı ve alt katman detaylarını arşivlemek." },
];

const CATI_FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt katman", name: "Su yalıtım örtüsü, çıta ve lata sistemi", purpose: "Kiremit altı su yönlendirmesini ve havalandırma boşluğunu oluşturmak.", phase: "Alt hazırlık" },
  { group: "Kaplama", name: "Kiremit, mahya elemanı ve kenar parçaları", purpose: "Eğimli çatıda ana su atma ve görünür kaplama performansını sağlamak.", phase: "Kaplama montajı" },
  { group: "Sabitleme", name: "Klips, vida ve rüzgar güvenlik elemanları", purpose: "Saçak, mahya ve kenar bölgelerinde kaplama güvenliğini artırmak.", phase: "Sabitleme" },
  { group: "Detay", name: "Baca dibi, dere ve parapet birleşim aksesuarları", purpose: "Su riski yüksek düğüm noktalarını sistematik olarak çözmek.", phase: "Detay çözümü" },
];

const DOGRAMA_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Doğrama montaj paftası ve U-değer karşılaştırma tablosu", purpose: "Kasa konumu, montaj boşluğu ve kabuk performansını birlikte okumak." },
  { category: "Ölçüm", name: "Lazer metre, şakül ve diyagonal kontrol çizelgesi", purpose: "Kaba boşluk ile doğrama doğruluğunu montaj öncesi ve sonrası test etmek." },
  { category: "Kontrol", name: "Açılma-kapanma ve sızdırmazlık kontrol listesi", purpose: "Montajı yalnız yerleştirme değil fonksiyon testiyle birlikte teslim almak." },
  { category: "Kayıt", name: "Cam-doğrama etiket ve bakım kayıt föyü", purpose: "Cam paketi, açılım tipi ve servis bilgisini işletmeye aktarmak." },
];

const DOGRAMA_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Doğrama", name: "PVC/alüminyum kasa-kanat sistemi ve cam paketi", purpose: "Isı, hava ve su performansı ile gün ışığı ihtiyacını birlikte karşılamak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Montaj ankrajı, dübel ve ayar takozları", purpose: "Kasayı duvar içinde taşıyıcı ve ayarlı biçimde sabitlemek.", phase: "Kasa yerleşimi" },
  { group: "Sızdırmazlık", name: "Bant, köpük, mastik ve denizlik aksesuarları", purpose: "Kasa çevresinde su-hava sızdırmazlığı ve ısı köprüsü kontrolü sağlamak.", phase: "Birleşim çözümü" },
  { group: "Kontrol", name: "Ayar ekipmanı ve fonksiyon test donanımı", purpose: "Kanat ayarı, kilit ve donanım davranışını teslim öncesi doğrulamak.", phase: "Son ayar" },
];

export const inceIslerLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan/asma-tavan",
    kind: "topic",
    quote: "Asma tavan, tavanı gizleyen değil; tesisatı disipline eden ve mekanı okunabilir hale getiren ikinci bir yapı katmanıdır.",
    tip: "Asma tavanda en büyük hata, düzgün görünen yüzeyi yeterli sanmaktır; oysa servis kapağı, tesisat yüksekliği ve karkas disiplini çözülmeden bu düzgünlük kısa ömürlü olur.",
    intro: [
      "Asma tavan sistemi; mekanik-elektrik tesisatını gizlemek, aydınlatma ve akustik elemanları düzenlemek, bazı mahallerde yangın veya hijyen performansını desteklemek için kurulan ikinci tavan katmanıdır. Kullanıcı için çoğu zaman pürüzsüz bir yüzey gibi görünür; ancak saha gerçeğinde bu yüzeyin arkasında yoğun bir koordinasyon vardır.",
      "İnşaat mühendisi açısından asma tavan, yalnız alçıpan kaplama işi değildir. Mekanik kanalların alt kötü, sprinkler başlıkları, menfezler, aydınlatma armatürleri, revizyon kapakları ve duvar birleşimleri tek bir düzlem üzerinde çözümlenir. Bu koordinasyon kurulmadan tavana başlamak, sonradan kırma, sarkma ve eğri yüzey demektir.",
    ],
    theory: [
      "Asma tavan performansı iki ana başlıkta okunur: karkas rijitliği ve üst boşluk koordinasyonu. Karkas yeterince doğru kurulmazsa levha derzlerinde çatlak, yüzeyde dalga veya armatür çevresinde deformasyon görülür. Üst boşluk yeterince planlanmazsa en iyi karkas bile tesisat müdahaleleri sırasında bozulur.",
      "Ayrıca asma tavan, yangın ve bakım stratejisinin de parçasıdır. Özellikle koridorlar, kaçış yolları ve ıslak hacimler gibi alanlarda kullanılacak levha tipi, erişim kapağı ve menfez konumu mahalin teknik ihtiyacına göre belirlenmelidir. Tesisata ulaşamayan veya söküldüğünde geri dönemeyen tavan çözümü, iyi ince iş sayılmaz.",
      "Bu nedenle asma tavan montajı yüzey işçiliğinden önce kot mühendisliğidir. Düzgün görünen ama içinde kaos barındıran tavanlar, ilk bakım veya kaçak anında tüm kalite algısını kaybeder.",
    ],
    ruleTable: [
      {
        parameter: "Kot ve koordinasyon",
        limitOrRequirement: "Asma tavan kötü, üstteki mekanik-elektrik yükseklikleriyle çakışmasız kurulmalıdır.",
        reference: "Saha koordinasyon planı",
        note: "Tavan kötü çizimde değil sahadaki en düşük tesisat noktasında doğrulanmalıdır.",
      },
      {
        parameter: "Levha tipi ve mahal uyumu",
        limitOrRequirement: "Neme veya yangına duyarlı mahallerde uygun levha tipi seçilmelidir.",
        reference: "Yangın Yönetmeliği + mahal kullanım disiplini",
        note: "Standart levha her mahal için yeterli değildir.",
      },
      {
        parameter: "Bakım erişimi",
        limitOrRequirement: "Valf, damper, buat ve benzeri ekipmanlar için revizyon erişimi bırakılmalıdır.",
        reference: "İşletme ve bakım yaklaşımı",
        note: "Bakım kapağı unutulan tavan, bakım maliyetini duvar kırmaya çevirir.",
      },
      {
        parameter: "Yüzey sürekliliği",
        limitOrRequirement: "Askı, taşıyıcı profil ve vida düzeni yüzey çatlağı üretmeyecek biçimde uygulanmalıdır.",
        reference: "Saha kalite planı",
        note: "Derz kalitesi yalnız macunla değil karkas doğruluğuyla belirlenir.",
      },
    ],
    designOrApplicationSteps: [
      "Tavana başlamadan önce tüm üst tesisatların son kotunu ve güzergahını sahada tekrar doğrula.",
      "Taşıyıcı askı ve ana profilleri, armatür ve menfez yüklerini de dikkate alarak kur.",
      "Revizyon kapağı, lineer aydınlatma ve menfez yerlerini levha modülüyle birlikte planla.",
      "Levha kapatma öncesi üst boşluğu foto-log ile kaydet; sonradan görünmeyecek detayları belgele.",
      "Derz, boya ve son kat öncesi yüzeyi yan ışık altında kontrol edip dalga ve sehimleri düzelt.",
    ],
    criticalChecks: [
      "En düşük mekanik veya elektrik elemanı tavan kotunu zorluyor mu?",
      "Aydınlatma ve menfez yerleri karkasla uyumlu mu?",
      "Bakım kapağı gereken tüm noktalarda erişim bırakıldı mı?",
      "Levha derzleri taşıyıcı profile denk geliyor mu?",
      "Tavan yüzeyinde sehim veya dalga oluşturan askı eksikliği var mı?",
    ],
    numericalExample: {
      title: "48 m² ofis asma tavanında ana profil ve revizyon planı",
      inputs: [
        { label: "Mahal alanı", value: "48 m²", note: "8 m x 6 m ofis" },
        { label: "Hedef tavan kötü", value: "2,70 m", note: "Net kullanım kötü" },
        { label: "Üstteki en düşük tesisat kötü", value: "2,88 m", note: "Kanal altı" },
        { label: "Hedef", value: "Çakışmasız tavan boşluğu", note: "Servis erişimi korunacak" },
      ],
      assumptions: [
        "Levha sistemi standart modül ve çevre profiliyle kurulacaktır.",
        "Armatür ve menfez yerleri montaj öncesi belirlenmiştir.",
        "Bakım gerektiren iki vana ve bir buat için revizyon kapağı gerekmektedir.",
      ],
      steps: [
        {
          title: "Boşluk payını hesapla",
          formula: "2,88 - 2,70 = 0,18 m",
          result: "Tesisat ile bitmiş tavan arasında yaklaşık 18 cm boşluk vardır.",
          note: "Bu boşluk yalnız profil değil servis müdahalesi için de okunmalıdır.",
        },
        {
          title: "Koordinasyon kararını yorumla",
          result: "18 cm sınırda bir boşluk olduğundan armatür kasaları ve revizyon kapağı derinlikleri ayrıca kontrol edilmelidir.",
          note: "Kağıtta yeterli görünen boşluk, sahada ekipman kalınlıklarıyla hızla daralabilir.",
        },
      ],
      checks: [
        "Tavan kötü üstteki en düşük tesisat elemanına göre güncellenmelidir.",
        "Revizyon kapakları yalnız çizimde değil gerçek ekipman yerinde kontrol edilmelidir.",
        "Aydınlatma ve menfez boşlukları karkas düzenini zayıflatmayacak şekilde çözülmelidir.",
      ],
      engineeringComment: "Asma tavan kalitesi, görünen düzlem kadar görünmeyen boşluğun da düzenli olmasına bağlıdır.",
    },
    tools: ALCIPAN_TOOLS,
    equipmentAndMaterials: ALCIPAN_EQUIPMENT,
    mistakes: [
      { wrong: "Tavan kotunu yalnız mimari kesitten almak.", correct: "En düşük tesisat kotunu sahada doğrulayıp sonra karar vermek." },
      { wrong: "Revizyon kapağını sonradan açarız diye düşünmek.", correct: "Bakım noktalarını tavana başlamadan planlamak." },
      { wrong: "Tüm mahallerde aynı levha tipini kullanmak.", correct: "Nem ve yangın ihtiyacına göre levha seçmek." },
      { wrong: "Armatür boşluklarını karkas kurulduktan sonra rastgele kesmek.", correct: "Karkası armatür ve menfez modülüyle birlikte çözmek." },
      { wrong: "Kapatma öncesi üst boşluğu kayıt altına almamak.", correct: "Bakım ve sonraki müdahaleler için foto-log oluşturmak." },
    ],
    designVsField: [
      "Projede asma tavan temiz bir yatay çizgidir; sahada ise onlarca küçük tesisat kararı bu çizginin arkasında toplanır.",
      "Bu nedenle iyi asma tavan yalnız estetik değil, bakım ve koordinasyon açısından da sakin çalışan tavandır.",
    ],
    conclusion: [
      "Asma tavan doğru kot, doğru karkas ve doğru erişim kararlarıyla yapıldığında mekanı toparlar ve tesisatı disipline eder. Bu zincir zayıf kurulursa sorunlar ilk bakımda, ilk çatlakta veya ilk su kaçağında görünür hale gelir.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["asma tavan", "alçıpan tavan", "revizyon kapağı", "tavan kötü", "tesisat koordinasyonu"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan", "ince-isler/alcipan/bolme-duvar"],
  },
  {
    slugPath: "ince-isler/alcipan/bolme-duvar",
    kind: "topic",
    quote: "Bölme duvar hafif olabilir; ama mekan organizasyonu, akustik ve kapı doğruluğu büyük ölçüde burada belirlenir.",
    tip: "Bölme duvarı taşıyıcı olmadığı için önemsiz görmek, kapı boşluğu kaçıklığı, çatlak ve zayıf akustik gibi sürekli sorunlar üretir.",
    intro: [
      "Alçıpan bölme duvar sistemi, hafif karkas ve levha kaplamayla mekanları hızlı biçimde ayırmak için kullanılan modern ince iş çözümüdür. Konut, ofis, hastane ve ticari yapılarda yaygınlaşmasının nedeni hız ve esnekliktir; fakat bu esneklik ancak aks, kapı boşluğu ve tesisat geçişleri disiplinli kurulduğunda avantaj sağlar.",
      "İnşaat mühendisi açısından bölme duvarlar, 'taşıyıcı değil' diye ikinci plana atılmamalıdır. Kapı kanadının düzgün çalışması, seramik veya boya yüzeyinin çatlamaması, tesisat kutularının levhayı zayıflatmaması ve bazı mahallerde akustik-yangın beklentisinin karşılanması bu duvarların doğru kurulmasına bağlıdır.",
    ],
    theory: [
      "Bölme duvar performansı; karkas aralığı, levha katmanı, dolgu malzemesi ve kenar birleşimleriyle belirlenir. İnce profillerle hızlı duvar örmek mümkün görünür; fakat kapı açıklığı, yüksek duvar boyu veya ağır ekipman askısı varsa aynı hafiflik sorun üretmeye başlar.",
      "Akustik ve yangın davranışı da sistem mantığı gerektirir. Profil aralığı, levha kat sayısı, derz sürekliliği ve yalıtım dolgusu birlikte düşünülmediğinde duvar görünürde kapalı olsa bile beklenen sessizlik veya güvenlik seviyesine ulaşamaz.",
      "Sahadaki en kritik konu, kapatma öncesi tesisat ve takviye koordinasyonudur. Gömme rezervuar, ağır dolap, TV askısı, lavabo taşıyıcısı veya kapı kasası noktalarında takviye bırakılmadan kapatılan duvarlar, sonradan pahalı söküm gerektirir.",
    ],
    ruleTable: [
      {
        parameter: "Aks ve düşeylik",
        limitOrRequirement: "Bölme duvar aksı, kapı boşluğu ve birleşim çizgileri mimari plana sadık kurulmalıdır.",
        reference: "Saha aplikasyon ve kalite planı",
        note: "Taşıyıcı olmayan duvarlarda bile aks kaçıklığı mekan kalitesini bozar.",
      },
      {
        parameter: "Profil ve levha sistemi",
        limitOrRequirement: "Duvar yüksekliği ve kullanımına uygun karkas/levha kombinasyonu seçilmelidir.",
        reference: "Mahal kullanım disiplini + yangın yaklaşımı",
        note: "Her duvar aynı profil ve tek levha ile çözülemez.",
      },
      {
        parameter: "Kapı ve ekipman takviyesi",
        limitOrRequirement: "Kapı kasası ve noktasal yük alanlarında ilave destek bırakılmalıdır.",
        reference: "Saha detay çözümü",
        note: "Sonradan dübel ile çözmeye çalışmak sistem davranışını zayıflatır.",
      },
      {
        parameter: "Akustik / yangın performansı",
        limitOrRequirement: "Gereken mahallerde yalıtım dolgusu ve uygun levha katmanı birlikte uygulanmalıdır.",
        reference: "Yangın Yönetmeliği + mahal performans beklentisi",
        note: "Levha tipi ile dolgu seçimi birbirinden bağımsız düşünülmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Duvar akslarını ve kapı boşluklarını zeminde net olarak işaretle; sonra profil montajına geç.",
      "Kapı açıklıkları, gömme ekipmanlar ve askı gelecek noktalar için karkas takviyelerini önceden yerleştir.",
      "Tesisat kutuları ve geçişleri için levhayı zayıflatmayacak koordinasyonu kapatma öncesi tamamla.",
      "Gereken mahallerde akustik/yangın dolgusu ve çift levha sistemini eksiksiz uygula.",
      "Derz ve yüzey hazırlığına geçmeden önce düşeylik, kapı açıklığı ve birleşim çizgilerini tekrar ölç.",
    ],
    criticalChecks: [
      "Duvar aksı ve kapı açıklığı mimari ölçülerle uyumlu mu?",
      "Ağır ekipman veya kapı kasası için karkas takviyesi bırakıldı mı?",
      "Elektrik kutuları ve tesisat geçişleri profilleri zayıflatıyor mu?",
      "Yalıtım dolgusu ve levha katmanı mahal ihtiyacına uygun mu?",
      "Levha birleşimleri ve kenar detayları çatlak riski taşımayacak biçimde çözüldü mü?",
    ],
    numericalExample: {
      title: "5,40 m uzunlukta bölme duvarda dikme sayısı yorumu",
      inputs: [
        { label: "Duvar uzunluğu", value: "5,40 m", note: "Ofis bölme duvarı" },
        { label: "Duvar yüksekliği", value: "3,00 m", note: "Net kat yüksekliği" },
        { label: "Örnek profil aks aralığı", value: "60 cm", note: "Standart uygulama yaklaşımı" },
        { label: "Kapı boşluğu", value: "90 cm", note: "Tek kanat kapı" },
      ],
      assumptions: [
        "Kapı boşluğu için ilave jamb profili kullanılacaktır.",
        "Levha sistemi standart ofis kullanımına uygundur.",
        "Kesin profil aralığı üretici ve sistem detayına göre teyit edilecektir.",
      ],
      steps: [
        {
          title: "Teorik dikme aralığını oku",
          formula: "5,40 / 0,60 = 9 aralık",
          result: "Kapı hariç yaklaşık 10 ana dikme hattı gerektirir.",
          note: "Bu hesap yalnız düz duvar mantığını gösterir; kapı ve köşeler ilave dikme ister.",
        },
        {
          title: "Kapı etkisini yorumla",
          result: "90 cm kapı boşluğu nedeniyle bu bölgede standart aralık değil, güçlendirilmiş jamb çözümü gerekir.",
          note: "Kapı bölgesi diğer duvar alanları gibi değerlendirilmemelidir.",
        },
      ],
      checks: [
        "Kapı boşluğu, standart dikme ritmini kesen özel bölge olarak düşünülmelidir.",
        "Takviye gerektiren noktalar levha kapanmadan çözülmelidir.",
        "Düşeylik kontrolü yalnız sonunda değil karkas aşamasında yapılmalıdır.",
      ],
      engineeringComment: "Bölme duvar hafif sistemdir; ama kapı ve ekipman yükleri bu hafifliği kolayca zayıf halkaya çevirebilir.",
    },
    tools: ALCIPAN_TOOLS,
    equipmentAndMaterials: ALCIPAN_EQUIPMENT,
    mistakes: [
      { wrong: "Kapı boşluğunu standart duvar ritmi içinde çözmek.", correct: "Kapı bölgesini takviyeli özel detay olarak ele almak." },
      { wrong: "Ağır ekipman geleceğini sonradan düşünmek.", correct: "Karkas içinde takviye noktalarını önceden yerleştirmek." },
      { wrong: "Elektrik kutularını profil keserek rastgele açmak.", correct: "Kutu ve geçişleri karkas düzeniyle uyumlu çözmek." },
      { wrong: "Akustik beklentiyi yalnız levha kalınlığıyla çözmeye çalışmak.", correct: "Profil, dolgu ve levha katmanını birlikte düşünmek." },
      { wrong: "Levha kapandıktan sonra doğruluk kontrolü yapmak.", correct: "Aks ve düşeyliği karkas aşamasında doğrulamak." },
    ],
    designVsField: [
      "Mimari planda ince bir çizgi olan bölme duvar, sahada kapı, tesisat, akustik ve bitiş kalitesini taşıyan gerçek bir sistem haline gelir.",
      "Bu nedenle bölme duvarı hafif iş gibi görmek yanıltıcıdır; doğru kurulduğunda mekanı düzenler, hatalı kurulduğunda ise tüm ince iş yüzeylerine sorun taşır.",
    ],
    conclusion: [
      "Alçıpan bölme duvar, doğru aks, doğru takviye ve doğru kapatma sırasıyla yapıldığında hızlı ve temiz bir çözüm sunar. Aynı sistem, gelişigüzel kurulduğunda kapı açıklığından boya çatlağına kadar birçok kusuru birlikte üretir.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["bölme duvar", "alçıpan duvar", "kapı boşluğu", "karkas takviyesi", "akustik duvar"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan", "ince-isler/alcipan/asma-tavan"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/fayans",
    kind: "topic",
    quote: "Fayans uygulaması, karo yapıştırmak değil; suya, temizliğe ve modüle karşı çalışan bir duvar sistemi kurmaktır.",
    tip: "Fayansta en pahalı hata, su yalıtımı ve modül planını sonradan düşünmektir; derz çizgisiyle başlayan sorun kısa sürede sızdırma veya kötü görünüm olarak geri döner.",
    intro: [
      "Fayans uygulaması özellikle banyo, WC, mutfak ve servis mahallerinde hijyen, temizlenebilirlik ve suya dayanım sağlamak için tercih edilen temel duvar kaplamasıdır. Görünürde basit bir seramik kaplama işi gibi dursa da gerçekte altındaki su yalıtımı, yapıştırıcı seçimi, modül düzeni ve köşe bitişleriyle birlikte çalışan çok katmanlı bir sistemdir.",
      "İnşaat mühendisi için fayans işi yalnız estetik dizilim değildir. Tesisat çıkışlarının merkezlenmesi, niş ve süzgeç detayları, ıslak hacim su davranışı ve dar parça riskleri montaj öncesi çözülmezse, sonradan ne kadar dikkatli uygulama yapılırsa yapılsın sonuç zayıf görünür. Başarılı fayans uygulaması ürün kutusu açılmadan önce planlanır.",
    ],
    theory: [
      "Fayans performansı, yüzey hazırlığı ile başlar. Alt sıva veya tesviye yüzeyi emicilik, sağlamlık ve düzlemsellik açısından uygun değilse yapıştırıcı performansı düşer ve karo yüzeyinde şaşıklık başlar. Fayansın kendisi dayanıklı olsa da onu taşıyan alt zemin zayıfsa sistem kalıcı olmaz.",
      "Islak hacimlerde su yalıtımı ile fayans birbirinden ayrı düşünülemez. Kaplama son kat olduğundan, su davranışını aslında alttaki katmanlar yönetir. Köşe dönüşleri, süzgeç çevresi, batarya çıkışları ve niş birleşimleri gibi düğümler en kritik bölgelerdir; ana yüzey çoğu zaman sorun çıkarmaz, detay düğümleri çıkarır.",
      "Modül planı da teknik bir karardır. Armatür eksenleri, derz çizgileri, niş başlangıç-bitişleri ve kapı pervazı ilişkisi birlikte çözülmelidir. Dar kesilmiş parçalar, kaçan derz çizgileri ve hizasız çıkışlar kullanıcı tarafından hemen fark edilir. Bu yüzden fayans, estetikten önce aks disiplinidir.",
    ],
    ruleTable: [
      {
        parameter: "Yapıştırıcı ve sistem uyumu",
        limitOrRequirement: "Kaplama tipi ve mahal kullanımına uygun yapıştırıcı sistemi seçilmelidir.",
        reference: "TS EN 12004",
        note: "Her seramik aynı yapıştırıcı sınıfıyla güvenle uygulanmaz.",
      },
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Alt yüzey düz, temiz ve yapışmaya uygun olmalıdır.",
        reference: "Saha kalite planı",
        note: "Mastar bozukluğu fayans yüzeyinde doğrudan görünür hale gelir.",
      },
      {
        parameter: "Islak hacim detayı",
        limitOrRequirement: "Köşe, tesisat çıkışı ve suyla temaslı bölgeler sistematik çözülmelidir.",
        reference: "TS EN 12004 + ıslak hacim uygulama disiplini",
        note: "Görünür sorun çoğu zaman görünmeyen detay eksikliğinden doğar.",
      },
      {
        parameter: "Derz ve modül sürekliliği",
        limitOrRequirement: "Derz çizgileri ve bitişler mekanda ölçülü ve simetrik olmalıdır.",
        reference: "Mahal bazlı modül planı",
        note: "Dar parça ve şaşıklık riski montaj öncesi çözülmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Armatür, niş, kapı pervazı ve köşe ilişkisini okuyup modül planını montajdan önce oluştur.",
      "Alt yüzeyi astar, tesviye ve gerekiyorsa su yalıtımı ile fayans kabul seviyesine getir.",
      "Merkez aksı ve ilk sıra kararını sahada lazerle kur; duvardaki ilk karo tüm duvarın kalitesini belirler.",
      "Köşe dönüşleri, batarya çıkışları ve niş bitişlerini uygulama ilerlerken sürekli kontrol et.",
      "Derz dolgu ve son temizlik sonrası yüzeyi ışık altında kontrol edip kaçan derzleri teslim öncesi düzelt.",
    ],
    criticalChecks: [
      "Alt yüzey emicilik ve düzlemsellik açısından uygun mu?",
      "Su yalıtımı gereken bölgeler kaplama öncesi tamamlandı mı?",
      "Armatür çıkışları derz ve karo modülüyle uyumlu mu?",
      "Köşelerde dar parça veya şaşmış derz riski kaldı mı?",
      "Derz dolgu rengi ve doluluk kalitesi duvar boyunca aynı mı?",
    ],
    numericalExample: {
      title: "240 cm genişlikte banyo duvarında modül yerleşimi",
      inputs: [
        { label: "Duvar genişliği", value: "240 cm", note: "Ana duş duvarı" },
        { label: "Fayans ölçüsü", value: "60 x 120 cm", note: "Düşey uygulama" },
        { label: "Derz aralığı", value: "2 mm", note: "Örnek uygulama kararı" },
        { label: "Hedef", value: "Simetrik bitiş", note: "Köşelerde dar parça bırakmamak" },
      ],
      assumptions: [
        "Uygulama merkez aksa göre simetrik başlatılacaktır.",
        "Tesisat çıkışları modüle göre küçük kaydırmalarla uyumlandırılabilir durumdadır.",
        "Kesin ölçü, uygulama öncesi duvardan yeniden alınacaktır.",
      ],
      steps: [
        {
          title: "Modül kararını oku",
          result: "240 cm genişlik, 60 cm modülde simetrik aks düzeni için avantajlıdır; kesimler köşelerde yönetilebilir kalır.",
          note: "Ön plan yapılmazsa aynı duvarda dar parça riski kolayca oluşur.",
        },
        {
          title: "Tesisat eksenini yorumla",
          result: "Batarya ve niş eksenleri modülle birlikte okunmalı; yalnız duvar genişliğine göre karar verilmemelidir.",
          note: "Göze ilk çarpan unsur çoğu zaman karo değil, çıkışların derzle ilişkisi olur.",
        },
      ],
      checks: [
        "Modül planı yalnız net duvar ölçüsüne değil tesisat çıkışlarına göre kurulmalıdır.",
        "İlk sıra ve aks kararı saha uygulamasının başında kesinleşmelidir.",
        "Su yalıtımı ve modül planı birbirinden ayrı düşünülmemelidir.",
      ],
      engineeringComment: "Fayans duvarında iyi görünen iş, usta hızından çok iyi kurulmuş modül disiplininin ürünüdür.",
    },
    tools: WET_FINISH_TOOLS,
    equipmentAndMaterials: WET_FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Modül planı yapmadan uygulamaya başlamak.", correct: "İlk karodan önce aks ve parça planını çözmek." },
      { wrong: "Yüzey bozukluğunu yapıştırıcıyla telafi etmeye çalışmak.", correct: "Alt yüzeyi önceden tesviye etmek." },
      { wrong: "Su yalıtımını fayans işinden bağımsız görmek.", correct: "Islak hacim kaplamasını tek sistem olarak düşünmek." },
      { wrong: "Tesisat çıkışlarını karo diziliminden bağımsız bırakmak.", correct: "Çıkış eksenlerini derz ve karo modülüyle birlikte çözmek." },
      { wrong: "Son kontrolü yalnız yakından yapmak.", correct: "Yüzeyi birkaç açıdan ve yan ışıkta da değerlendirmek." },
    ],
    designVsField: [
      "Projede seçilen karo rengi ve ölçüsü tasarım kararını anlatır; sahada ise o kararın doğru görünüp görünmeyeceğini yüzey hazırlığı ve modül planı belirler.",
      "İyi fayans uygulaması, kullanıcı tarafından temiz ve sakin algılanır. Kötü uygulama ise derz çizgisi, köşe parçası ve tesisat ekseniyle kendini hemen ele verir.",
    ],
    conclusion: [
      "Fayans uygulaması doğru alt yüzey, doğru modül ve doğru ıslak hacim detayıyla birleştiğinde uzun ömürlü ve temiz bir sonuç verir. Bu üç ayaktan biri eksik bırakıldığında kusur, en görünür duvarlarda ortaya çıkar.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.tsEn12004],
    keywords: ["fayans", "ıslak hacim", "TS EN 12004", "modül planı", "seramik duvar kaplaması"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/boya"],
  },
  {
    slugPath: "ince-isler/zemin-kaplamalari/epoksi-kaplama",
    kind: "topic",
    quote: "Epoksi kaplama, zemini boyamaz; doğru hazırlanmış bir yüzeyi kimyasal ve mekanik olarak koruyan yeni bir katman oluşturur.",
    tip: "Epoksi işinde en büyük hata, parlak yüzeyi başarı sanmaktır; gerçek kalite beton nemi, yüzey hazırlığı ve katman kalınlığında gizlidir.",
    intro: [
      "Epoksi kaplama; endüstriyel alanlar, otoparklar, teknik hacimler, hijyenik mahaller ve yoğun kimyasal temizliğe maruz yüzeylerde kullanılan derzsiz zemin çözümüdür. Dayanım, kolay temizlik ve kontrollü görünüm avantajı sunar; ancak bu avantajlar, uygulama öncesi beton yüzeyin gerçekten hazır olması şartıyla elde edilir.",
      "Şantiyede epoksi çoğu zaman son kat bir boya gibi algılanır. Oysa sistem; yüzey pürüzlülüğü, nem düzeyi, çatlak tamiri, astar, ara kat ve son katın bir arada çalışmasına dayanır. İnşaat mühendisi bu işte özellikle alt betonun kabul kriterlerini ciddiye almalıdır; çünkü zayıf alt yüzey üzerinde iyi epoksi uygulaması yoktur.",
    ],
    theory: [
      "Epoksi sisteminin aderansı, beton yüzeyle kurduğu mekanik ve kimyasal bağa bağlıdır. Yüzey sütü temizlenmemiş, yağ-kir barındıran veya kapiler nem taşıyan bir beton üzerine yapılan uygulamalar kısa sürede kabarma, soyulma veya noktasal kopma üretir.",
      "Ayrıca epoksi katman kalınlığı ve kullanım senaryosu birlikte düşünülmelidir. Hafif yaya trafiği, forklift trafiği, kimyasal yük veya ıslak temizlik aynı sistemi gerektirmez. Bu nedenle epoksi kalınlığı ve sistem bileşeni yalnız görsel tercihle değil, kullanım sınıfıyla belirlenmelidir.",
      "Sahada en kritik dönem kür ve ilk trafik sürecidir. Kaplama tamamlandıktan sonra alan erken açılırsa yüzey çizilir, iz bırakır veya tam performansına ulaşmadan zarar görür. Bu yüzden epoksi işi uygulama kadar alan yönetimi işidir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Beton yüzey temiz, sağlam ve kaplamaya uygun pürüzlülükte olmalıdır.",
        reference: "Ürün teknik föyü + saha kalite planı",
        note: "Parlak veya tozlu beton yüzey, aderans için uygun kabul edilmez.",
      },
      {
        parameter: "Nem kontrolü",
        limitOrRequirement: "Beton nemi sistem üreticisinin izin verdiği sınırın altında olmalıdır.",
        reference: "Uygulama disiplini + nem ölçümü",
        note: "Kabarma ve soyulmanın başlıca nedeni çoğu zaman yüzey altı nemdir.",
      },
      {
        parameter: "Sistem kalınlığı",
        limitOrRequirement: "Kullanım senaryosuna uygun astar, ara kat ve son kat kurgusu seçilmelidir.",
        reference: "Mahal kullanım matrisi",
        note: "Depo, otopark ve hijyen alanı aynı katman ihtiyacına sahip değildir.",
      },
      {
        parameter: "Kür ve alan açma",
        limitOrRequirement: "Kaplama tam dayanım almadan trafiğe açılmamalıdır.",
        reference: "Sistem uygulama planı",
        note: "Erken trafik, yeni kaplamanın ömrünü ilk günden kısaltır.",
      },
    ],
    designOrApplicationSteps: [
      "Beton yüzeyin nem, dayanım ve kir durumunu ölçmeden epoksi sistem seçimine geçme.",
      "Taşlama, shot-blast veya uygun hazırlık yöntemiyle yüzeyi aç; çatlak ve boşlukları tamir et.",
      "Astar ve ara katı üretici sistemine uygun şekilde, tüketim ve bekleme sürelerini kaydederek uygula.",
      "Son kat öncesi yüzeyi yeniden kontrol edip toz ve kir girişini engelle.",
      "Kür sürecinde alanı izole et; erken trafik veya su temasına karşı koruma planı uygula.",
    ],
    criticalChecks: [
      "Beton yüzeyde yağ, toz veya gevşek tabaka kaldı mı?",
      "Nem ölçümü sistem sınırlarına uygun mu?",
      "Çatlak ve derzler epoksi öncesi doğru tamir edildi mi?",
      "Katlar arası bekleme süresi ve tüketim değerleri kayda alındı mı?",
      "Alan, tam kür almadan kullanıcı veya ekipman trafiğine açıldı mı?",
    ],
    numericalExample: {
      title: "180 m² teknik hacimde epoksi tüketim yorumu",
      inputs: [
        { label: "Alan", value: "180 m²", note: "Teknik hacim ve servis koridoru" },
        { label: "Örnek toplam sistem tüketimi", value: "2,5 kg/m²", note: "Astar + ara kat + son kat için örnek kabul" },
        { label: "Tahmini toplam malzeme", value: "450 kg", note: "180 x 2,5" },
        { label: "Hedef", value: "Sipariş ve uygulama planı oluşturmak", note: "Kesin değer sistem föyüne göre doğrulanır" },
      ],
      assumptions: [
        "Yüzey emiciliği olağan seviyededir ve büyük tamir ihtiyacı yoktur.",
        "Sistem seçimi hafif-orta hizmet koşullarına göredir.",
        "Kesin tüketim, saha deneme alanı ve üretici verisiyle teyit edilecektir.",
      ],
      steps: [
        {
          title: "Toplam malzeme bandını hesapla",
          formula: "180 x 2,5 = 450 kg",
          result: "Örnek sistem için yaklaşık 450 kg toplam malzeme gerekir.",
          note: "Bu değer alt yüzey emiciliğine göre değişebilir.",
        },
        {
          title: "Yüzey hazırlığı etkisini yorumla",
          result: "Zayıf veya emici yüzeylerde gerçek tüketim artar; bu nedenle sayı kadar yüzey kabulü de kritik önemdedir.",
          note: "Malzeme hesabı iyi olsa bile yüzey hazırlığı zayıfsa sonuç başarısız olabilir.",
        },
      ],
      checks: [
        "Tüketim hesabı yüzey hazırlığından bağımsız düşünülmemelidir.",
        "Deneme alanı yapılmadan büyük yüzey uygulamasına geçilmemelidir.",
        "Kür süresi planı malzeme siparişi kadar kritik bir girdidir.",
      ],
      engineeringComment: "Epoksi kaplamada asıl risk, malzeme eksikliğinden çok yüzeyin sistemi kabul etmeye hazır olmamasıdır.",
    },
    tools: WET_FINISH_TOOLS,
    equipmentAndMaterials: WET_FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Epoksiyi son kat boya gibi düşünmek.", correct: "Yüzey hazırlığı ve katman sistemi olarak ele almak." },
      { wrong: "Nem ölçmeden uygulamaya başlamak.", correct: "Beton nemini sistem sınırıyla karşılaştırmak." },
      { wrong: "Çatlakları kaplama altında bırakmak.", correct: "Tamir ve derz çözümünü epoksi öncesi tamamlamak." },
      { wrong: "Katlar arası bekleme süresini hız için kısaltmak.", correct: "Sistem uygulama zamanına sadık kalmak." },
      { wrong: "Alanı erken trafiğe açmak.", correct: "Tam kür süresi dolana kadar koruma planı uygulamak." },
    ],
    designVsField: [
      "Projede epoksi tek renkli, temiz bir yüzey gibi görünür; sahada ise o yüzeyin altında nem, pürüzlülük ve aderans kalitesi belirleyicidir.",
      "İyi epoksi kaplama sakin ve bakımı kolay görünür. Kötü epoksi ise kabarma ve soyulmayla kısa sürede kendini belli eder.",
    ],
    conclusion: [
      "Epoksi kaplama doğru beton kabulü, doğru sistem seçimi ve doğru kür yönetimiyle çok güçlü bir zemin çözümüne dönüşür. Bu zincir bozulduğunda en modern görünen uygulama bile kısa sürede kusur üretir.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.yapiDenetim],
    keywords: ["epoksi kaplama", "zemin nemi", "aderans", "endüstriyel zemin", "derzsiz kaplama"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/kiremit",
    kind: "topic",
    quote: "Kiremit kaplama, geleneksel bir görüntüden fazlasıdır; suyu, havayı ve bakım güvenliğini birlikte yöneten bir çatı sistemidir.",
    tip: "Kiremit çatıda en sık hata, tüm sorumluluğu kiremidin üstüne yüklemektir; oysa suyu asıl yöneten sistem alt örtü, lata aksı ve detay düğümleridir.",
    intro: [
      "Kiremit çatı kaplaması, eğimli çatılarda suyu yerçekimiyle güvenle uzaklaştıran ve uzun ömürlü kullanım sunan klasik kaplama sistemidir. Görsel olarak tanıdık olduğu için kolay sanılır; fakat sahada alt örtü, lata ritmi, mahya ve saçak detayları doğru çözülmediğinde en geleneksel sistem bile hızla arıza üretir.",
      "İnşaat mühendisi için kiremit çatı, yalnız kaplama dizme işi değildir. Çatı iskeletinin doğruluğu, buhar/su katmanlarının sürekliliği, bacalar ve parapet birleşimleri, rüzgar etkisi ve bakım yürüyüş güvenliği birlikte değerlendirilmelidir. Özellikle detay noktalarında yapılan küçük hatalar, yapının içine su girişinin en yaygın nedenlerinden biridir.",
    ],
    theory: [
      "Kiremit sisteminde ana mantık suyu geçirmemek değil, onu sürekli olarak aşağı yönlendirmektir. Bu nedenle kiremidin altında yer alan su yalıtım örtüsü, karşı lata ve lata sistemi en az kiremit kadar kritiktir. Eğim doğru ama alt örtü zayıfsa, ilk ters rüzgar veya yoğun yağışta sorun ortaya çıkar.",
      "Mahya, saçak, dere, baca dibi ve kenar dönüşleri sistemin en hassas düğümleridir. Ana yüzey düzgün görünse bile bu bölgelerdeki boşluklar, yetersiz bindirme veya zayıf sabitleme tüm çatının performansını bozar. Kiremit çatıyı mühendislik işi yapan da tam olarak bu düğümlerin disiplinli çözümüdür.",
      "Ayrıca kiremit çatıda havalandırma ve bakım düşünülmelidir. Nemli alt katmanlar ve hava almayan boşluklar zamanla ahşap elemanları veya metal parçaları yıpratır. İyi kiremit çatı, yalnız yağmurdan korumaz; altındaki sistemin ömrünü de uzatır.",
    ],
    ruleTable: [
      {
        parameter: "Eğim ve akış yönü",
        limitOrRequirement: "Kiremit sistemi uygun eğim ve kesintisiz su yönüyle kurulmalıdır.",
        reference: "Çatı katman ve saha detay disiplini",
        note: "Yetersiz eğim veya ters su yönü kiremidin performansını düşürür.",
      },
      {
        parameter: "Alt katman sürekliliği",
        limitOrRequirement: "Su yalıtım örtüsü, karşı lata ve lata sistemi kaplama ile uyumlu olmalıdır.",
        reference: "TS 825 + çatı uygulama pratiği",
        note: "Kiremit tek başına tam koruma sistemi değildir.",
      },
      {
        parameter: "Mahya ve kenar detayları",
        limitOrRequirement: "Mahya, dere, baca dibi ve saçak çözümleri sistemli uygulanmalıdır.",
        reference: "Saha detay paftası",
        note: "Arızaların büyük bölümü ana yüzeyden değil bu düğümlerden çıkar.",
      },
      {
        parameter: "Sabitleme ve rüzgar güvenliği",
        limitOrRequirement: "Kritik bölgelerde kiremitlerin güvenli sabitlemesi sağlanmalıdır.",
        reference: "Uygulama ve bakım güvenliği yaklaşımı",
        note: "Özellikle saçak ve kenarlarda gevşek parça bırakılmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Çatı eğimi ve su yönünü, alt örtü ve yağmur oluğu planıyla birlikte kesinleştir.",
      "Lata ritmini seçilen kiremit sistemine göre kur; göz kararı aralık bırakma.",
      "Mahya, dere, baca dibi ve saçak detaylarını kaplama başlamadan sahada prova et.",
      "Kritik kenar ve rüzgar alan bölgelerde sabitleme elemanlarını eksiksiz uygula.",
      "Teslim öncesi çatı üzerinde su akışı, gevşek parça ve detay düğümleri için son tur yap.",
    ],
    criticalChecks: [
      "Alt örtü ve lata sistemi kiremit montajından önce eksiksiz kuruldu mu?",
      "Mahya ve dere bölgelerinde açıklık veya gevşek parça kaldı mı?",
      "Baca dibi ve parapet dönüşleri suyu güvenle yönlendiriyor mu?",
      "Saçak ve kenarlarda rüzgar etkisine açık gevşek kiremit var mı?",
      "Yağmur oluğu ve düşey inişlerle çatı suyu birlikte çözülmüş mü?",
    ],
    numericalExample: {
      title: "7,6 m eğimli çatı hattında kiremit sıra sayısı yorumu",
      inputs: [
        { label: "Eğim boyunca uzunluk", value: "7,6 m", note: "Saçaktan mahyaya net hat" },
        { label: "Örnek görünür kiremit boyu", value: "33 cm", note: "Sistem değerine göre teyit edilir" },
        { label: "Hedef", value: "Lata ritmini okumak", note: "Ön montaj kontrolü" },
        { label: "Kritik konu", value: "Mahyada kalan son sıra", note: "Kesim ve detay planı" },
      ],
      assumptions: [
        "Kiremit tipi ve bindirme oranı sistem üreticisine göre doğrulanacaktır.",
        "Saçak başlangıcı ve mahya detayı saha paftasında sabitlenmiştir.",
        "Bu hesap ön kontrol niteliğindedir.",
      ],
      steps: [
        {
          title: "Yaklaşık sıra sayısını hesapla",
          formula: "7,6 / 0,33 ≈ 23 sıra",
          result: "Eğim boyunca yaklaşık 23 sıra kiremit gerekir.",
          note: "Son sıra ve mahya detayı ayrıca saha ölçüsüyle kontrol edilmelidir.",
        },
        {
          title: "Lata kararını yorumla",
          result: "Mahyada kalan mesafe uygunsuzsa başlangıç veya ritim küçük düzeltmelerle revize edilmelidir.",
          note: "Ritim kararı montaj sırasında değil öncesinde verildiğinde temiz görünüm elde edilir.",
        },
      ],
      checks: [
        "Lata aralığı seçilen kiremit sistemiyle sahada tekrar doğrulanmalıdır.",
        "Mahya ve saçak başlangıcı sıra hesabına dahil edilmelidir.",
        "Görsel düzgünlük ile su yönü aynı anda korunmalıdır.",
      ],
      engineeringComment: "Kiremit çatıda düzenli ritim yalnız estetik değil, suyu güvenle taşıyan sistem davranışının da işaretidir.",
    },
    tools: CATI_FINISH_TOOLS,
    equipmentAndMaterials: CATI_FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Lata aralıklarını sahada rastgele ayarlamak.", correct: "Seçilen kiremit sistemine göre ölçülü ritim kurmak." },
      { wrong: "Alt örtüyü ikincil görmek.", correct: "Kiremit altı su yönlendirmesinin ana parçası olarak düşünmek." },
      { wrong: "Baca dibi ve dere detaylarını montaj sonuna bırakmak.", correct: "Kaplama başlamadan sahada çözmek." },
      { wrong: "Kenar bölgelerde sabitlemeyi azaltmak.", correct: "Rüzgar etkisini özellikle saçak ve kenarda ciddiye almak." },
      { wrong: "Çatıyı yalnız yukarıdan bakarak teslim etmek.", correct: "Oluk, iniş ve detay düğümleriyle birlikte bütüncül kontrol yapmak." },
    ],
    designVsField: [
      "Kiremit çatı projede ritmik ve sade görünür; sahada ise asıl kalite saçak, dere, baca ve mahyada okunur.",
      "İyi kiremit çatı yıllarca sessizce çalışır. Kötü kiremit çatı ise ilk fırtına veya ilk yoğun yağışta kendini belli eder.",
    ],
    conclusion: [
      "Kiremit kaplama doğru eğim, doğru alt katman ve doğru detaylarla birleştiğinde uzun ömürlü ve güvenli bir çatı sunar. Bu zincirin bir halkası zayıf bırakıldığında ise en küçük detay kusuru bile su sorununa dönüşür.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar],
    keywords: ["kiremit", "eğimli çatı", "mahya detayı", "saçak", "çatı su tahliyesi"],
    relatedPaths: ["ince-isler", "ince-isler/cati-kaplamasi", "ince-isler/cati-kaplamasi/membran-cati"],
  },
  {
    slugPath: "ince-isler/kapi-pencere/pencere",
    kind: "topic",
    quote: "Pencere, boşluğu kapatan doğrama değil; gün ışığı, hava, su ve ısı davranışını aynı anda yöneten cephe elemanıdır.",
    tip: "Pencerede en sık hata, doğramayı ürün sanıp birleşimi ihmal etmektir; oysa sorunların çoğu camdan değil kasa-duvar birleşiminden çıkar.",
    intro: [
      "Pencere sistemi, gün ışığı, havalandırma, dış hava kontrolü ve ısı performansını bir arada yöneten temel cephe elemanıdır. Yapının enerji davranışı, kullanıcı konforu ve cephe bakım ihtiyacı büyük ölçüde pencere montaj kalitesine bağlıdır. Bu nedenle pencereyi yalnız estetik veya marangozluk işi gibi görmek ciddi bir yanılsamadır.",
      "İnşaat mühendisi açısından pencere montajı; kaba boşluk ölçüsü, kasa aksı, montaj boşluğu, ankraj, denizlik, bant-köpük-mastik sistemi ve açılım fonksiyonunun birlikte çözülmesidir. En iyi profil ve cam paketi bile hatalı birleşim yüzünden ısı köprüsü, su sızıntısı veya zor çalışan kanat problemi üretebilir.",
    ],
    theory: [
      "Pencere performansı iki katmanda okunur: ürün performansı ve birleşim performansı. Profil sınıfı, cam paketi ve donanım ürün tarafını; kasa konumu, montaj boşluğu, bant/mastik sürekliliği ve denizlik çözümü ise birleşim tarafını belirler. Sahadaki arızaların büyük bölümü ikinci katmandan çıkar.",
      "Ayrıca pencere cephe kabuğunun zayıf noktasıdır. Duvarın U-değeri ne kadar iyi olursa olsun, yanlış yerleştirilmiş ve kötü yalıtılmış bir doğrama çevresi yapı kabuğunda ısı köprüsü oluşturur. Bu nedenle pencere montajı enerji performansı açısından da kritik detay işidir.",
      "Sahadaki başka bir kritik konu da fonksiyon testidir. Kanadın açılıp kapanması, kilit noktalarının dengesi, su tahliye delikleri ve pervaz-denizlik ilişkisi teslim öncesi tek tek kontrol edilmelidir. Doğrama montajı, duvara oturtma işi değil işletmeye hazır hale getirme işidir.",
    ],
    ruleTable: [
      {
        parameter: "Kabuk ve enerji performansı",
        limitOrRequirement: "Pencere detayı, duvar sistemiyle birlikte TS 825 ve BEP hedefleriyle uyumlu olmalıdır.",
        reference: "TS 825 + Binalarda Enerji Performansı Yönetmeliği",
        note: "Doğrama seçimi kadar doğru montaj düzlemi de önemlidir.",
      },
      {
        parameter: "Montaj boşluğu ve ankraj",
        limitOrRequirement: "Kasa çevresinde dengeli montaj payı ve güvenli sabitleme bırakılmalıdır.",
        reference: "Cephe ve doğrama uygulama disiplini",
        note: "Sıfır tolerans montaj, deformasyon ve sızdırmazlık sorunu üretir.",
      },
      {
        parameter: "Su yönetimi",
        limitOrRequirement: "Denizlik, damlalık ve dış birleşim detayları suyu güvenle dışarı atmalıdır.",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha detay çözümü",
        note: "İyi profil, kötü su detayını telafi edemez.",
      },
      {
        parameter: "Fonksiyon ve bakım",
        limitOrRequirement: "Kanat açılımı, kilit sistemi ve servis ayarları teslim öncesi doğrulanmalıdır.",
        reference: "Saha kabul ve işletme yaklaşımı",
        note: "Doğrama montajı fonksiyon testinden geçmeden tamamlanmış sayılmaz.",
      },
    ],
    designOrApplicationSteps: [
      "Kaba boşluğu ve net kasa ölçüsünü montaj payıyla birlikte sahada yeniden ölç.",
      "Kasayı duvar içinde enerji ve su davranışını destekleyecek doğru düzleme yerleştir.",
      "Ankraj, takoz, bant, köpük ve mastik katmanlarını tek sistem mantığıyla uygula.",
      "Denizlik ve dış su tahliye detayını pencere montajıyla aynı anda tamamla.",
      "Teslim öncesi açılma-kapanma, kilit, sızdırmazlık ve su tahliye davranışını test et.",
    ],
    criticalChecks: [
      "Kaba boşluk doğramaya yeterli ve dengeli montaj payı bırakıyor mu?",
      "Kasa çevresinde kesintisiz sızdırmazlık sistemi kuruldu mu?",
      "Denizlik ve damlalık suyu cepheden uzağa atıyor mu?",
      "Kanat ayarı, kilit baskısı ve açılım rahatlığı uygun mu?",
      "Doğrama çevresinde ısı köprüsü ve yoğuşma riski yaratacak boşluk kaldı mı?",
    ],
    numericalExample: {
      title: "Pencere ısı kaybı için hızlı U x A yorumu",
      inputs: [
        { label: "Pencere alanı", value: "2,10 m²", note: "1,40 x 1,50 m örnek pencere" },
        { label: "Uw değeri", value: "1,4 W/m²K", note: "Yeni pencere sistemi" },
        { label: "Sıcaklık farkı", value: "20 C", note: "İç-dış anlık fark" },
        { label: "Hedef", value: "Isı kaybını hızlı okumak", note: "Karşılaştırmalı ön değerlendirme" },
      ],
      assumptions: [
        "Bu hesap anlık ve yaklaşık bir iletim kıyaslamasıdır.",
        "Hava sızıntısı ve güneş kazancı hesaba katılmamıştır.",
        "Doğrama çevresi montaj kalitesi ürün performansını desteklemektedir.",
      ],
      steps: [
        {
          title: "Anlık ısı kaybını hesapla",
          formula: "Q = U x A x ΔT = 1,4 x 2,10 x 20",
          result: "Yaklaşık 58,8 W anlık iletim kaybı oluşur.",
          note: "Bu değer pencerenin tek başına ne kadar kritik bir kabuk elemanı olduğunu gösterir.",
        },
        {
          title: "Montaj etkisini yorumla",
          result: "Ürün değeri iyi olsa bile kasa çevresindeki kötü montaj bu teorik performansı sahada zayıflatabilir.",
          note: "Pencere kalitesi ürün ve birleşim performansının toplamıdır.",
        },
      ],
      checks: [
        "Enerji performansı değerlendirmesi doğrama çevresi detayıyla birlikte yapılmalıdır.",
        "Sızdırmazlık sistemi eksikse teorik Uw değeri sahada tam karşılığını bulmaz.",
        "Fonksiyon testi yapılmadan enerji performansı tek başına yeterli kabul edilmemelidir.",
      ],
      engineeringComment: "Pencerede iyi ürün seçimi önemlidir; ama kullanıcının hissettiği konforu asıl belirleyen şey çoğu zaman montaj detayının kalitesidir.",
    },
    tools: DOGRAMA_TOOLS,
    equipmentAndMaterials: DOGRAMA_EQUIPMENT,
    mistakes: [
      { wrong: "Doğramayı kaba boşluğa sıfır toleransla sıkıştırmak.", correct: "Montaj ve sızdırmazlık için dengeli boşluk bırakmak." },
      { wrong: "Sızdırmazlığı yalnız silikonla çözmek.", correct: "Bant, köpük ve mastiği sistem olarak kullanmak." },
      { wrong: "Denizlik detayını sonradan düşünmek.", correct: "Pencere montajıyla birlikte çözmek." },
      { wrong: "Kanat ayarını teslim sonrasına bırakmak.", correct: "Fonksiyon testini montaj bitiminde yapmak." },
      { wrong: "Enerji performansını sadece profil katalog değeri üzerinden okumak.", correct: "Duvar birleşimi ve montaj düzlemiyle birlikte değerlendirmek." },
    ],
    designVsField: [
      "Çizimde pencere bir boşluk ve semboldür; sahada ise su, hava, gün ışığı ve ısı davranışını aynı anda yöneten karmaşık bir birleşim haline gelir.",
      "İyi pencere montajı dikkat çekmez; kötü montaj ise su alma, yoğuşma, rüzgar sesi veya zor çalışan kanatlarla kendini hemen belli eder.",
    ],
    conclusion: [
      "Pencere sistemi doğru ürün seçimi kadar doğru montaj ve birleşim disipliniyle çalışır. İnşaat mühendisi bu aşamada kaba boşluktan denizliğe kadar tüm zinciri yönetirse hem enerji hem kullanım konforu tarafında güçlü bir sonuç elde edilir.",
    ],
    sources: [...INCE_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, SOURCE_LEDGER.planliAlanlar],
    keywords: ["pencere", "doğrama montajı", "TS 825", "Uw değeri", "denizlik detayı"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/dis-kapi"],
  },
];
