import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PEYZAJ_LEAF_SOURCES = [...BRANCH_SOURCE_LEDGER["peyzaj-teslim"]];

const SERT_ZEMIN_TOOLS: BinaGuideTool[] = [
  { category: "Aplikasyon", name: "AutoCAD / Civil 3D kot paftaları", purpose: "Yaya aksı, bordür ve rögar kapakları için hedef kotları sahaya net indirmek." },
  { category: "Ölçüm", name: "Lazer nivo ve total station", purpose: "Eğim, kot farkı ve hat doğruluğunu kaplama öncesi doğrulamak." },
  { category: "Saha", name: "Plaka kompaktör / tandem silindir", purpose: "Alt temel, plentmiks ve yataklama katmanında sıkışma kalitesini sağlamak." },
  { category: "Kontrol", name: "Su tutma ve drenaj gözlem formu", purpose: "Teslim öncesi göllenme, rögar çevresi ve yüzey akış davranışını kayıt altına almak." },
];

const SERT_ZEMIN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt yapı", name: "Kırmataş alt temel ve plentmiks", purpose: "Yükü zemine yaymak ve kaplama altı rijitliği oluşturmak.", phase: "Alt temel hazırlığı" },
  { group: "Sınır elemanı", name: "Bordür, oluk taşı ve kenar kısıtlayıcılar", purpose: "Kaplama kenarının kaçmasını önlemek ve su yönünü tanımlamak.", phase: "Hat oluşturma" },
  { group: "Kaplama", name: "Kilit parke / beton plak / taş kaplama", purpose: "Kullanım sınıfına uygun nihai yürüme ve araç yüzeyini oluşturmak.", phase: "Üst kaplama" },
  { group: "Kontrol", name: "Mastar, ip iskelesi ve derz kumu", purpose: "Düzlem, derz ve yüzey sürekliliğini sahada kontrol etmek.", phase: "Kaplama sonrası ince ayar" },
];

const BITKISEL_TOOLS: BinaGuideTool[] = [
  { category: "Plan", name: "Peyzaj ve sulama aplikasyon planı", purpose: "Bitki, damlama hattı ve servis erişimi kararlarını tek paftada toplamak." },
  { category: "Ölçüm", name: "Toprak pH / nem ölçer ve debi kontrol seti", purpose: "Bitkisel toprak uygunluğunu ve sulama bölgelerinin çalışmasını doğrulamak." },
  { category: "Saha", name: "Rotovatör, çapa ve dikim ekipmanları", purpose: "Toprak hazırlığı, çukur açımı ve dikim sonrası yüzey düzeltmesini yürütmek." },
  { category: "Bakım", name: "İlk bakım ve can suyu çizelgesi", purpose: "Teslimden sonraki kritik yerleşme dönemini disiplinli takip etmek." },
];

const BITKISEL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Toprak", name: "Bitkisel toprak, organik madde ve drenaj tabakası", purpose: "Kök gelişimini destekleyen geçirgen ve besinli yetişme ortamını hazırlamak.", phase: "Toprak hazırlığı" },
  { group: "Sulama", name: "Damlama hattı, sprinkler ve vana kutuları", purpose: "Tür bazlı su ihtiyacını kontrollü ve zonlu biçimde karşılamak.", phase: "Sulama altyapısı" },
  { group: "Bitki", name: "Ağaç, çalı, yer örtücü ve çim karışımları", purpose: "Mahal kullanımı, iklim ve bakım kapasitesiyle uyumlu bitkisel doku oluşturmak.", phase: "Dikim" },
  { group: "Koruma", name: "Ağaç kazığı, bağlama elemanı ve mulch", purpose: "İlk dönemde kök-sürgün dengesini korumak ve yüzey nem kaybını azaltmak.", phase: "Dikim sonrası bakım" },
];

export const peyzajTeslimLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "peyzaj-teslim/peyzaj-ve-cevre-duzenleme/sert-zemin",
    kind: "topic",
    quote: "Sert zemin, kaplama seçimiyle değil; kot, drenaj ve sıkışma zinciriyle iyi çalışır.",
    tip: "Sert zemindeki en pahalı hata, güzel görünen kaplamayı sorun sanmaktır; çoğu problem aslında alt temel, bordür kotu ve su yönünden çıkar.",
    intro: [
      "Sert zemin uygulamaları; yaya yolları, araç yolları, bina girişleri, otoparklar, rampalar, bordürler ve açık alan meydanlarını kapsayan temel dış saha işlerinden biridir. Şantiyede bu iş kalemi çoğu zaman peyzajın dekoratif kısmı gibi görülür; oysa kullanıcının ilk adım attığı yüzey burasıdır ve bina çevresindeki su davranışı büyük ölçüde bu yüzeyle belirlenir.",
      "Bir inşaat mühendisi için sert zemin yalnız kaplama malzemesi seçimi değildir. Alt zeminin taşıma durumu, plentmiks veya kırmataş temel kalınlığı, rögar ve ızgara kotları, yaya konforu, engelli erişimi, bordür sürekliliği ve yağmur sonrası göllenme riski birlikte yönetilmelidir. Şantiye sonunda hız baskısıyla yapılan sert zeminler genellikle ilk kışta bozulur; nedeni de çoğu zaman malzeme değil, geometri ve sıkışma disiplinidir.",
    ],
    theory: [
      "Sert zemin sisteminin taşıyıcı mantığı yukarıdan aşağıya değil, aşağıdan yukarıya okunmalıdır. Nihai kaplama yalnızca görünen yüzeydir; asıl performansı alt zeminin stabilitesi, alt temel tabakası, yataklama katmanı ve kenar kısıtlayıcıların sürekliliği belirler. Zayıf alt zemin üzerine iyi parke koymak, iyi boya ile zayıf sıvayı örtmeye benzer; sorun gecikir ama ortadan kalkmaz.",
      "Dış sahada su yönetimi, sert zemin performansının kalbidir. Yüzey eğimi doğru kurulmazsa derzler açılır, bordürler yerinden oynar, rögar çevresinde çökme başlar ve kaplama üstünde donma-çözülme etkisi büyür. Bu nedenle sert zemin projesi, mimari görünüşten önce yüzey akış projesidir. İnşaat mühendisi özellikle bina giriş kotu ile saha kotu arasındaki ilişkiyi kontrol etmeden kaplama kararına güvenmemelidir.",
      "Sahadaki kritik kararlar çoğu zaman kaplama öncesinde verilir. Dolgu veya kazıdan çıkan zemin korunacak mı, geotekstil gerekecek mi, plentmiks hangi kalınlıkta serilecek, kompaksiyon kaç geçişte sağlanacak, rögar kapakları nihai kotla nasıl eşlenecek? Bu sorular net değilse en pahalı taş kaplama bile kısa sürede dalgalı, su tutan ve bakım isteyen bir yüzeye dönüşür.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey eğimi ve su yönü",
        limitOrRequirement: "Yüzey suyu bina cephesine değil güvenli tahliye hattına yönlenmelidir.",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha drenaj disiplini",
        note: "Giriş saçakları ve zemin kat kotlarıyla birlikte değerlendirilmelidir.",
      },
      {
        parameter: "Alt temel ve sıkışma",
        limitOrRequirement: "Kaplama altı tabakalar kontrollü serim ve sıkıştırma ile tamamlanmalıdır.",
        reference: "4708 sayılı Kanun kapsamındaki saha kalite yaklaşımı",
        note: "Yüzey düzgünlüğü sıkışma yetersizliğini gizlemez.",
      },
      {
        parameter: "Yaya erişimi ve geçişler",
        limitOrRequirement: "Kot geçişleri, girişler ve açık alan dolaşımı güvenli ve okunabilir olmalıdır.",
        reference: "Planlı Alanlar İmar Yönetmeliği",
        note: "Sert zemin kararı bina giriş performansının uzantısıdır.",
      },
      {
        parameter: "Bakım ve servis noktaları",
        limitOrRequirement: "Rögar, ızgara ve servis kapakları nihai kaplama kotuyla uyumlu bitirilmelidir.",
        reference: "Yapı denetim ve teslim kontrol mantığı",
        note: "Teslim sonrası çökme ve su birikmesinin ilk işareti genellikle bu düğümlerde görülür.",
      },
    ],
    designOrApplicationSteps: [
      "Bina giriş kotları, saha aksları ve tahliye noktaları birlikte okunmadan sert zemin aplikasyonunu başlatma.",
      "Alt zeminde yumuşak bölge, gevşek dolgu veya su birikimi varsa önce zemini iyileştir; kaplamayla saklamaya çalışma.",
      "Bordür ve kenar kısıtlayıcıları nihai kot referansı olarak kur, sonra alt temel ve yataklama katmanını bu geometriye göre ilerlet.",
      "Kaplama serimi sırasında rögar kapakları, mazgallar ve derz çizgilerini hat bazında kontrol et; tek noktadan doğru görünen yüzeye güvenme.",
      "Teslim öncesi kontrollü sulama veya yağmur sonrası gözlemle göllenme, kenar açılması ve sehim üreten bölgeleri işaretleyip düzelt.",
    ],
    criticalChecks: [
      "Alt zeminde oturma yapan veya ayak altında çalışan bölgeler kaldı mı?",
      "Bordür üst kotu ve nihai kaplama kotu kesintisiz okunuyor mu?",
      "Rögar kapakları ve mazgallar kaplama yüzeyiyle aynı davranışı gösteriyor mu?",
      "Yüzey akışı bina cephesinden ve girişlerden uzaklaşıyor mu?",
      "Kenar kısıtlaması olmayan bölgelerde kaplama kaçma riski taşıyor mu?",
    ],
    numericalExample: {
      title: "240 m² kilit parke alanda tabaka ve eğim hesabı",
      inputs: [
        { label: "Kaplama alanı", value: "240 m²", note: "Otopark ve yaya yolu birleşik alanı" },
        { label: "Kırmataş alt temel kalınlığı", value: "15 cm", note: "Sıkıştırılmış kalınlık" },
        { label: "Yataklama kumu kalınlığı", value: "4 cm", note: "Kaplama altı düzeltme katmanı" },
        { label: "Hedef yüzey eğimi", value: "%2", note: "Mazgala yönlenen tek doğrultulu eğim" },
      ],
      assumptions: [
        "Alt zemin kabul edilmiş ve yumuşak bölgeler temizlenmiştir.",
        "Kırmataş alt temel için yaklaşık %10 saha fire ve sıkışma payı öngörülmektedir.",
        "Yüzey akışı 10 m genişlik boyunca bir mazgal hattına yönlenecektir.",
      ],
      steps: [
        {
          title: "Alt temel hacmini hesapla",
          formula: "240 x 0,15 = 36,0 m³",
          result: "Sıkıştırılmış alt temel hacmi yaklaşık 36,0 m³ olur.",
          note: "Sipariş ve serim planında saha payı eklenecektir.",
        },
        {
          title: "Saha payı ile malzeme ihtiyacını yorumla",
          formula: "36,0 x 1,10 = 39,6 m³",
          result: "Sipariş bandı yaklaşık 39,6 m³ olarak okunmalıdır.",
          note: "Bu değer alt zemindeki yerel düzeltmeler için güvenli tampon sağlar.",
        },
        {
          title: "Yataklama kumu hacmini belirle",
          formula: "240 x 0,04 = 9,6 m³",
          result: "Kaplama seriminden önce yaklaşık 9,6 m³ yataklama kumu gerekir.",
          note: "Yataklama kumu taşıyıcı tabaka gibi kullanılmamalıdır; görevi yüzey düzeltmektir.",
        },
        {
          title: "Eğimden doğan kot farkını kontrol et",
          formula: "10 m x %2 = 0,20 m",
          result: "10 m boyunca en az 20 cm kot farkı kurulmalıdır.",
          note: "Kaplama sonrası göllenme riski çoğu zaman bu 20 cm'lik geometrinin sahada kaybolmasından doğar.",
        },
      ],
      checks: [
        "Alt temel hacmi ile gerçek serim alanı günlük olarak karşılaştırılmalıdır.",
        "Mazgal kotu nihai yüzeyin doğal en düşük noktası olarak bırakılmalıdır.",
        "Yataklama kumu ile kot düzeltmeye çalışmak yerine alt temel geometrisi düzeltilmelidir.",
      ],
      engineeringComment: "Sert zeminde kalıcılığı kaplama taşı değil, kaplama altında görünmeyen geometri ve sıkışma disiplini üretir.",
    },
    tools: SERT_ZEMIN_TOOLS,
    equipmentAndMaterials: SERT_ZEMIN_EQUIPMENT,
    mistakes: [
      { wrong: "Kaplama altındaki yumuşak zemini serim sırasında bastırarak çözmeye çalışmak.", correct: "Zayıf bölgeyi açıp alt yapıyı yeniden kurmak." },
      { wrong: "Rögar kapaklarını kaplama bittikten sonra kotlamak.", correct: "Nihai yüzey geometrisini baştan bu düğümlere göre kurmak." },
      { wrong: "Eğimi sadece genel planda doğru görüp saha ölçüsü almamak.", correct: "Lazer nivo ile her aksı kontrol etmek." },
      { wrong: "Kenar kısıtlayıcısı olmadan parke serimini tamamlamak.", correct: "Bordür ve sınır elemanlarını sistemin taşıyıcı parçası gibi düşünmek." },
      { wrong: "Göllenme testini teslim sonrasına bırakmak.", correct: "Sert zemin kabulünden önce kontrollü su gözlemi yapmak." },
    ],
    designVsField: [
      "Projede sert zemin çoğu zaman renk, doku ve desen kararı gibi görünür; sahada ise asıl kalite alt zeminin nasıl hazırlandığı ve suyun nereye gönderildiğiyle anlaşılır.",
      "Bu nedenle iyi sert zemin uygulaması, mimari dili bozmadan mühendislik davranışı üreten yüzeydir. Kullanıcı fark etmezse doğru yapılmıştır; ilk yağmurda sorun görünüyorsa zincirin bir halkası eksik kalmıştır.",
    ],
    conclusion: [
      "Sert zemin işi, peyzajın son dokunuşu değil; bina çevresinin su, erişim ve bakım düzenini kuran mühendislik işidir. İnşaat mühendisi bu aşamada kot, sıkışma ve tahliye disiplinini elden bırakmazsa teslim sonrası şikayetlerin büyük bölümü daha başlamadan engellenir.",
    ],
    sources: [...PEYZAJ_LEAF_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yapiDenetim],
    keywords: ["sert zemin", "kilit parke", "alt temel", "göllenme kontrolü", "peyzaj kotu"],
    relatedPaths: [
      "peyzaj-teslim",
      "peyzaj-teslim/peyzaj-ve-cevre-duzenleme",
      "peyzaj-teslim/peyzaj-ve-cevre-duzenleme/bitkisel-peyzaj",
    ],
  },
  {
    slugPath: "peyzaj-teslim/peyzaj-ve-cevre-duzenleme/bitkisel-peyzaj",
    kind: "topic",
    quote: "Bitkisel peyzaj, dikim anıyla değil; toprağın, suyun ve ilk bakımın birlikte çalışmasıyla başarılı olur.",
    tip: "Render görselindeki bitkiyi sahaya aynen taşımak çoğu zaman kötü sonuç verir; asıl doğru seçim iklime, toprağa ve bakım kapasitesine uyan bitkidir.",
    intro: [
      "Bitkisel peyzaj; ağaç, çalı, yer örtücü, çim ve mevsimlik bitkilerin yalnız yerleştirilmesini değil, yaşamasını sağlayan tüm sistemi kapsar. Dışarıdan bakıldığında mimariyi tamamlayan yeşil doku gibi görünse de saha gerçeğinde konu toprak derinliği, drenaj, sulama zonları, kök gelişimi ve bakım disipliniyle ilgilidir.",
      "Şantiye kapanışına doğru bitkisel peyzajın aceleye gelmesi çok yaygındır. İnce işler ve teslim baskısı altında hızlı dikim yapılır; ancak toprağın yapısı, can suyu planı, sulama hattı, rüzgar etkisi ve tür uyumu düşünülmezse ilk birkaç ay içinde kuruma, sararma, devrilme veya kök çürümesi görülür. İnşaat mühendisi bu aşamada yalnız peyzaj mimarının çizimine değil, sahadaki yetişme ortamına odaklanmalıdır.",
    ],
    theory: [
      "Bitkisel peyzajın mühendislik tarafı, kök bölgesinin sürekliliğini korumaktır. Bitki kökü için gerekli hacim, geçirgenlik ve su yönetimi sağlanmazsa üstte görünen sağlıklı yaprak dokusu kısa sürede bozulur. Bu yüzden bitkisel toprak kalınlığı, drenaj davranışı ve sıkışma seviyesi, seçilen tür kadar belirleyicidir.",
      "Sulama tasarımı peyzajın gizli taşıyıcı sistemidir. Ağaç, çalı ve çim gibi farklı bitki gruplarının su ihtiyacı aynı değildir; tek vana hattına bağlanan karışık zonlar ya bazı bitkileri fazla suyla çürütür ya da diğerlerini susuz bırakır. Teslime yakın dönemde sulama hattının gerçekten çalışıp çalışmadığını ölçmeden yapılan dikim, şantiye estetiği üretir ama kalıcı peyzaj üretmez.",
      "Bitkisel peyzaj aynı zamanda bakım senaryosudur. Şantiyede dikim tamamlanınca iş bitmiş sayılır; oysa bitkinin sahaya tutunması için ilk haftalarda can suyu, bağlama kontrolü, malç yenileme, yabancı ot temizliği ve bozulmuş çanakların onarımı gerekir. Uzun ömürlü dış alan performansı, dikim günü kadar ilk bakım periyodunda kazanılır.",
    ],
    ruleTable: [
      {
        parameter: "Toprak ve kök hacmi",
        limitOrRequirement: "Bitki türünün gerektirdiği kök gelişim hacmi ve geçirgen yetişme ortamı sağlanmalıdır.",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha peyzaj uygulama disiplini",
        note: "Kazıdan çıkan her toprak bitkisel toprak yerine kullanılamaz.",
      },
      {
        parameter: "Sulama ve ilk bakım",
        limitOrRequirement: "Sulama sistemi devreye alınmış ve teslim sonrası bakım programı yazılı hale getirilmiş olmalıdır.",
        reference: "Teslim kalite planı + 4708 sayılı Kanun kapsamındaki kontrol yaklaşımı",
        note: "Dikimi bitmiş ama suyu çalışmayan peyzaj teslim edilmiş sayılmaz.",
      },
      {
        parameter: "Açık alan güvenliği",
        limitOrRequirement: "Bitki yerleşimi kaçış, servis ve yaya dolaşımını engellememelidir.",
        reference: "Binaların Yangından Korunması Hakkında Yönetmelik + Planlı Alanlar İmar Yönetmeliği",
        note: "Ağaç, çalı ve saksı yerleşimi fonksiyonel açık alan kullanımını bozmayacak biçimde çözülmelidir.",
      },
      {
        parameter: "Altyapı ile koordinasyon",
        limitOrRequirement: "Kök bölgesi, drenaj ve sulama hatları altyapı elemanlarıyla çakışmayacak biçimde planlanmalıdır.",
        reference: "As-built ve saha koordinasyon disiplini",
        note: "Özellikle temel perde yakınlarında ve menhol çevrelerinde kritik hale gelir.",
      },
    ],
    designOrApplicationSteps: [
      "Dikim öncesi güneş, rüzgar, su birikimi ve mevcut toprak durumunu sahada gözlemle; yalnız render görüntüsüne göre tür seçme.",
      "Bitkisel toprak kalınlığını ve drenaj davranışını tür bazında kontrol et; gerekirse toprak ıslahı ve drenaj katmanı oluştur.",
      "Sulama zonlarını bitki grubu ve güneşlenme durumuna göre ayır, debi ve basınç testini dikimden önce tamamla.",
      "Ağaç çukurları, çalı yatakları ve çim alanları için gerçek saha ölçüsüne göre hazırlık yap; kök boğazını gömecek aşırı dolgu bırakma.",
      "Dikim sonrası can suyu, bağlama kontrolü, mulch yenileme ve ilk bakım programını teslim paketiyle birlikte işletmeye devret.",
    ],
    criticalChecks: [
      "Sahaya gelen bitkisel toprağın drenaj ve doku kalitesi beklenen seviyede mi?",
      "Ağaç çukurları gerçek kök hacmine izin veriyor mu, yoksa dar ve sıkışık mı kaldı?",
      "Sulama zonlarında basınç ve debi farkı nedeniyle kuru veya aşırı ıslak bölgeler oluşuyor mu?",
      "Ağaç bağları gövdeyi yaralayacak kadar sıkı bırakıldı mı?",
      "Dikim sonrası ilk 4-6 haftalık bakım ve can suyu planı yazılı olarak tanımlandı mı?",
    ],
    numericalExample: {
      title: "12 ağaç ve 180 m² çalı alanı için toprak ve can suyu planı",
      inputs: [
        { label: "Ağaç sayısı", value: "12 adet", note: "Her biri 1,20 x 1,20 x 0,80 m çukur" },
        { label: "Çalı alanı", value: "180 m²", note: "35 cm bitkisel toprak kalınlığı" },
        { label: "Ağaç can suyu", value: "80 L/ağaç", note: "İlk sulama için örnek değer" },
        { label: "Çalı alanı can suyu", value: "15 L/m²", note: "İlk tesis suyu için" },
      ],
      assumptions: [
        "Mevcut kazı toprağının tamamı bitkisel toprak olarak kullanılmayacaktır.",
        "Sulama altyapısı dikimden önce basınç ve kaçak açısından test edilmiştir.",
        "Dikim mevsimi iklim koşulları açısından uygundur ve aşırı sıcak dönem dışında çalışılmaktadır.",
      ],
      steps: [
        {
          title: "Ağaç çukuru toprak hacmini hesapla",
          formula: "12 x 1,20 x 1,20 x 0,80 = 13,82 m³",
          result: "Ağaç çukurları için yaklaşık 13,82 m³ uygun yetişme ortamı gerekir.",
          note: "Bu hacim, sıkışık veya moloz karışık toprakla doldurulmamalıdır.",
        },
        {
          title: "Çalı alanı bitkisel toprak hacmini belirle",
          formula: "180 x 0,35 = 63,0 m³",
          result: "Çalı alanında yaklaşık 63,0 m³ bitkisel toprak gerekir.",
          note: "Toprak yüksekliği uygulama sonrası oturma payı düşünülerek ayarlanmalıdır.",
        },
        {
          title: "İlk can suyu ihtiyacını hesapla",
          formula: "(12 x 80 L) + (180 x 15 L) = 3.660 L",
          result: "İlk sulama için yaklaşık 3,66 m³ su planlanmalıdır.",
          note: "Bu değer, sulama sisteminin ilk gün gerçekten çalışması gerektiğini gösterir.",
        },
      ],
      checks: [
        "Toprak hacmi hesaplanırken yalnız yüzey alanı değil kök derinliği de dikkate alınmalıdır.",
        "İlk can suyu kapasitesi tanker veya sulama hattı üzerinden sahada doğrulanmalıdır.",
        "Dikim sonrası bakım planı olmadan yapılan hacim hesabı tek başına kalıcı performans üretmez.",
      ],
      engineeringComment: "Bitkisel peyzajda en kritik sayı çoğu zaman bitki adedi değil, kökün yaşayacağı hacim ve ilk haftalarda alacağı sudur.",
    },
    tools: BITKISEL_TOOLS,
    equipmentAndMaterials: BITKISEL_EQUIPMENT,
    mistakes: [
      { wrong: "Kazıdan çıkan toprağı elemeden ve ıslah etmeden doğrudan bitkisel toprak gibi kullanmak.", correct: "Toprağın doku ve geçirgenlik durumunu değerlendirip uygun karışım hazırlamak." },
      { wrong: "Bitki türünü yalnız görsel beğeniye göre seçmek.", correct: "İklim, güneşlenme ve bakım kapasitesine göre tür belirlemek." },
      { wrong: "Sulama hattını dikimden sonra test etmek.", correct: "Basınç, debi ve kaçak kontrolünü dikim öncesi tamamlamak." },
      { wrong: "Ağaç kök boğazını toprak altında bırakmak.", correct: "Kök boğazını doğru kotta ve hava alacak şekilde bırakmak." },
      { wrong: "Teslimden sonra bakım gerekmeyeceğini varsaymak.", correct: "İlk bakım periyodunu yazılı teslim paketi olarak tanımlamak." },
    ],
    designVsField: [
      "Peyzaj projesinde bitkisel doku dengeli ve dolu görünür; sahada ise aynı görünümün kalıcı olabilmesi için kök hacmi, sulama zonu ve bakım iş programı aynı ciddiyetle kurulmalıdır.",
      "Bitkisel peyzajın gerçek başarısı, teslim fotoğrafında değil, bir mevsim sonra da canlı ve dengeli kalabilmesinde ölçülür. Bu nedenle mühendislik yaklaşımı estetik kararın arkasındaki altyapıyı korumalıdır.",
    ],
    conclusion: [
      "Bitkisel peyzaj işi, son gün dikim yapıp alanı yeşillendirmekten ibaret değildir. Toprağı, suyu ve bakım zincirini birlikte çözerseniz bina çevresi gerçekten yaşar; aksi halde kısa sürede kuruyan ve sürekli müdahale isteyen bir açık alan ortaya çıkar.",
    ],
    sources: [...PEYZAJ_LEAF_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, SOURCE_LEDGER.planliAlanlar],
    keywords: ["bitkisel peyzaj", "dikim", "bitkisel toprak", "sulama zonu", "can suyu"],
    relatedPaths: [
      "peyzaj-teslim",
      "peyzaj-teslim/peyzaj-ve-cevre-duzenleme",
      "peyzaj-teslim/peyzaj-ve-cevre-duzenleme/sert-zemin",
    ],
  },
];
