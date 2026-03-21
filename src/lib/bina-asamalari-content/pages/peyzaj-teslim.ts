import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";
import { peyzajTeslimLeafSpecs } from "./peyzaj-teslim-leaves";

const CLOSEOUT_TOOLS: BinaGuideTool[] = [
  { category: "Takip", name: "Punch list takip tablosu", purpose: "Eksik ve kusur maddelerini disiplin bazlı kapatmak." },
  { category: "Çizim", name: "As-built pafta seti", purpose: "Gerçek imalat ile teslim dokümanını eşlemek." },
  { category: "Saha", name: "Kot ve drenaj kontrol çizelgeleri", purpose: "Dış saha eğim ve su yönetimini ölçülebilir kılmak." },
  { category: "Arşiv", name: "Teslim klasörü / dijital arşiv", purpose: "Test, garanti ve bakım dokümanlarını tek set halinde toplamak." },
];

const CLOSEOUT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Lazer nivo ve total station", purpose: "Dış saha kotları ve yüzey eğimlerini doğrulamak.", phase: "Peyzaj" },
  { group: "Uygulama", name: "Sert zemin uygulama ekipmanları", purpose: "Yol, bordür ve kaplama yüzeylerini kontrollü tamamlamak.", phase: "Peyzaj" },
  { group: "Uygulama", name: "Bitkisel peyzaj ekipmanları", purpose: "Toprak hazırlığı, dikim ve ilk bakım işlemlerini yürütmek.", phase: "Peyzaj" },
  { group: "Doküman", name: "As-built ve bakım teslim klasörü", purpose: "İşletmeye geçiş için gerekli tüm teknik kayıtları toplamak.", phase: "Teslim" },
];

const PEYZAJ_SOURCES = BRANCH_SOURCE_LEDGER["peyzaj-teslim"];

export const peyzajTeslimSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "peyzaj-teslim",
    kind: "branch",
    quote: "Teslim, şantiyenin bitmesi değil; yapının işletmeye güvenli ve okunabilir şekilde devredilmesidir.",
    tip: "Dış saha, punch list ve iskan dosyası ayrı işler gibi yönetildiğinde kapanış uzar; oysa üçü aynı teslim zincirinin parçalarıdır.",
    intro: [
      "Peyzaj ve teslim fazı, yapının tamamlandığını değil; güvenle kullanılabilir hale geldiğini gösteren son aşamadır. Bu fazda dış saha kotları, drenaj, eksik listeleri, as-built güncellemeleri ve iskan süreci birlikte ilerler.",
      "Birçok projede şantiye neredeyse bittiği için bu aşama hafife alınır; oysa kullanıcı ilk izlenimi, bakım kalitesi ve resmi kapanış burada belirlenir.",
      "İnşaat mühendisi açısından bu faz, kalan imalatları toparlama dönemi değil; önceki tüm imalatların ölçü, kayıt ve işletme mantığı bakımından sınandığı kapanış kapısıdır. Açık sahada birkaç santimetrelik kot hatası, teslimden sonra su göllenmesi veya erişim sorunu olarak geri döner; eksik bırakılan bir test raporu ise resmi süreci durdurabilir.",
    ],
    theory: [
      "Teslim kalitesi, yalnızca eksiklerin kapatılması değildir. Yapının gerçek sahadaki hali ile teslim edilen teknik dokümanın birbiriyle eşleşmesi gerekir.",
      "Dış saha eğimleri, sert zeminler, bitkisel peyzaj ve giriş kotları kullanımı doğrudan etkiler. Aynı anda punch list ve iskan sürecinin de teknik kayıtlarla desteklenmesi gerekir.",
      "Bu nedenle kapanış fazı, uygulamadan daha az değil; daha disiplinli doküman ve saha kontrolü gerektirir.",
      "Kapanış sürecinde mühendis, hem teknik ofis hem de saha koordinatörü gibi davranır. Garanti başlangıç tarihleri, ekipman devreye alma formları, ortak alan güvenliği, yönlendirme elemanları ve bakım senaryosu birbirinden kopuk tutulursa bina fiziksel olarak bitmiş olsa bile işletmeye hazır sayılamaz.",
      "Özellikle peyzaj ve teslim fazında mevsimsellik etkisi de önemlidir. Yağışlı döneme giren projede drenaj, çimlenme, bitki tutma başarısı ve sert zemin su davranışı kuru hava gözlemlerinden farklı sonuç verebilir. Bu nedenle teslim kararı sadece görsel tamamlanmaya değil, fonksiyonel çalışmaya dayanmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Teslim dosyası",
        limitOrRequirement: "As-built, test ve bakım kayıtları eksiksiz olmalı",
        reference: "Saha teslim disiplini",
        note: "İşletmeye devredilemeyen bilgi tamamlanmış sayılmaz.",
      },
      {
        parameter: "Dış saha kullanımı",
        limitOrRequirement: "Kot, eğim ve drenaj kullanıcı güvenliğini sağlamalı",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha kalite planı",
        note: "Peyzaj yalnızca estetik değil, fonksiyonel yüzey düzenidir.",
      },
      {
        parameter: "Resmi kapanış",
        limitOrRequirement: "İskan ve ilgili resmi süreçler güncel teknik kayıtlarla desteklenmeli",
        reference: "3194 sayılı İmar Kanunu + Planlı Alanlar İmar Yönetmeliği",
        note: "Saha gerçekliği ile dosya içeriği uyuşmalıdır.",
      },
      {
        parameter: "Ortak alan güvenliği ve erişim",
        limitOrRequirement: "Giriş, rampa, yaya aksı ve ortak alanlar güvenli ve okunabilir olmalı",
        reference: "Planlı Alanlar İmar Yönetmeliği + saha teslim disiplini",
        note: "Teslimde estetik kadar emniyetli kullanım da doğrulanmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Dış saha ve bina çevresi için son kot ve drenaj kontrollerini tamamla.",
      "Disiplin bazlı punch list oluştur ve kapanış tarihlerini yazılı takip et.",
      "As-built setini gerçek saha imalatına göre güncelle.",
      "Bakım, garanti ve test evraklarını teslim klasörüne topla.",
      "İskan ve resmi kapanış sürecini teknik dosyayla birlikte yürüt.",
      "Teslim öncesi kullanıcı rotası üzerinden saha turu yaparak giriş, otopark, peyzaj ve ortak alan akışını kontrol et.",
      "Mekanik, elektrik ve yangın sistemleri için devreye alma kayıtlarını tek kapanış matrisinde birleştir.",
    ],
    criticalChecks: [
      "Dış saha eğimleri yapıya su yönlendiriyor mu?",
      "Punch list maddeleri tarihe ve sorumluya bağlı mı?",
      "As-built seti gerçekten sahadaki son durumu gösteriyor mu?",
      "Bakım ve garanti evrakları eksiksiz mi?",
      "İskan için gereken teknik kayıtlar hazır mı?",
      "Ortak alanlarda yönlendirme, aydınlatma ve güvenli dolaşım yeterli mi?",
      "Devreye alınan sistemlerin garanti başlangıç ve sorumluluk bilgileri açık mı?",
    ],
    numericalExample: {
      title: "Punch list kapanış oranı için örnek yönetim mantığı",
      inputs: [
        { label: "Toplam punch maddesi", value: "64 adet", note: "Tüm disiplinler" },
        { label: "Kritik güvenlik maddesi", value: "12 adet", note: "Öncelikli kapanış grubu" },
        { label: "Hedef ilk kapanış süresi", value: "10 iş günü", note: "Kritik maddeler için" },
        { label: "Tam kapanış hedefi", value: "21 iş günü", note: "Tüm maddeler için örnek plan" },
      ],
      assumptions: [
        "Maddeler disiplin ve önem seviyesine göre sınıflandırılmıştır.",
        "Kritik güvenlik maddeleri önce kapatılacaktır.",
        "Kapanan her madde yeniden kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Öncelik bandını belirle",
          result: "64 maddenin 12'si kullanıcı güvenliği ve işletme için önceliklidir.",
          note: "Tüm maddeleri aynı sırada kapatmak verimsizdir.",
        },
        {
          title: "Kapanış temposunu yorumla",
          result: "Kritik maddeler 10 iş gününde kapatılamıyorsa teslim tarihi gerçekçi değildir.",
          note: "Teslim planı eksik listeden bağımsız kurulamaz.",
        },
        {
          title: "Kritik yoğunluğu sayısallaştır",
          formula: "12 / 64 = %18,75",
          result: "Toplam listenin yaklaşık beşte biri kritik güvenlik ve işletme maddesidir.",
          note: "Yüzdesi düşük görünse de teslim kararını bu grup belirler; kozmetik eksikler bu maddelerin önüne geçmemelidir.",
        },
      ],
      checks: [
        "Kritik maddeler ile kozmetik maddeler aynı öncelikte yönetilmemelidir.",
        "Kapanan her madde ikinci kontrolle doğrulanmalıdır.",
        "Teslim tarihi, gerçek punch list kapanış durumuna göre güncellenmelidir.",
        "Teknik sistem devreye alma kayıtları kapanış listesiyle aynı klasörde izlenmelidir.",
      ],
      engineeringComment: "Teslimin hızı, eksikleri saklamaktan değil onları doğru sırada kapatmaktan gelir.",
    },
    tools: CLOSEOUT_TOOLS,
    equipmentAndMaterials: CLOSEOUT_EQUIPMENT,
    mistakes: [
      { wrong: "Punch listi iş bittiğinde hazırlamak.", correct: "Kapanış yaklaşırken disiplinli şekilde başlatmak." },
      { wrong: "As-built çizimlerini sona bırakmak.", correct: "Saha değişiklikleri oluştukça güncellemek." },
      { wrong: "Peyzaj eğimlerini göz kararı vermek.", correct: "Kot ve su yönünü ölçüyle doğrulamak." },
      { wrong: "Teslim klasörünü yalnızca evrak arşivi görmek.", correct: "İşletme başlangıcının teknik rehberi olarak hazırlamak." },
      { wrong: "İskan sürecini şantiye kapanışından bağımsız sanmak.", correct: "Teknik dosya ile birlikte yürütmek." },
      { wrong: "Kritik güvenlik eksiklerini kozmetik maddelerle aynı torbada takip etmek.", correct: "Öncelik sınıfı tanımlı punch list kullanmak." },
    ],
    designVsField: [
      "Proje bitmiş göründüğünde teslimin kolay olacağı düşünülür; sahada ise en zor kısım gerçek imalatı belgeyle eşleştirmektir.",
      "Bu nedenle kapanış fazı, şantiyenin en disiplinli teknik ofis anlarından biridir.",
      "İyi kapanış yapan ekip yalnız eksik kapatmaz; yapıyı işletme personelinin anlayacağı kadar okunabilir hale getirir.",
    ],
    conclusion: [
      "Peyzaj ve teslim fazı doğru yönetildiğinde kullanıcı güvenli, bakım ekibi ise okunabilir bir bina devralır. Zayıf yönetildiğinde ise proje tamamlanmış görünse bile teknik olarak kapanmaz.",
      "Saha mühendisi için bu fazın ana prensibi şudur: son metrajdan çok son kontrol belirleyicidir. Kapanışın kalitesi, yapı kullanıma açıldıktan sonraki ilk aylarda ortaya çıkan sorun sayısıyla doğrudan ölçülür.",
    ],
    sources: PEYZAJ_SOURCES,
    keywords: ["peyzaj ve teslim", "punch list", "as-built", "iskan hazırlığı", "şantiye kapanışı"],
  },
  {
    slugPath: "peyzaj-teslim/peyzaj-ve-cevre-duzenleme",
    kind: "topic",
    quote: "Peyzaj ve çevre düzenleme, binanın çevresini süslemek değil; suyu, erişimi ve açık alan kullanımını doğru yönetmektir.",
    tip: "Sert zemin ve bitkisel peyzajı sadece görsel karar gibi görmek, drenaj ve bakım sorunlarını görünmez bırakır.",
    intro: [
      "Peyzaj ve çevre düzenleme, bina çevresindeki sert zemin, yürüyüş aksları, bitkisel alanlar, bordürler ve açık alan kullanım kurgusunu kapsar.",
      "Bu alanın başarısı, ilk bakıştaki estetikten önce kot, eğim, drenaj, güvenli erişim ve bakım kolaylığıyla belirlenir.",
      "Şantiye pratiğinde açık alanlar çoğu zaman sona kaldığı için aceleyle tamamlanır. Oysa çevre düzenleme; bina girişi, otopark, yağmur suyu davranışı, gece kullanımı ve bakım lojistiği gibi birçok işlevi aynı anda taşır. Bu yüzden dış saha, küçük bir mimari dekor değil; proje kapanışında performansı en görünür paketlerden biridir.",
    ],
    theory: [
      "Dış saha uygulamalarında su yönetimi ana belirleyicidir. Yanlış eğim, en iyi kaplama malzemesinde bile göllenme, buzlanma ve bozulma üretir.",
      "Bitkisel peyzaj tarafında ise toprak derinliği, sulama ve bakım planı sistemin devamlılığını belirler. Teslim edilen ama bakımı düşünülmeyen peyzaj kısa sürede değer kaybeder.",
      "Bu nedenle çevre düzenleme, mimari uzantı değil açık alan mühendisliğidir.",
      "Sert zemin imalatlarında yalnız üst kaplama değil, alt temel kalınlığı, sıkışma seviyesi, bordür kilitlemesi ve menhol kapaklarının kaplama kotuna uyumu birlikte değerlendirilmelidir. Yüzeyde görülen çökme veya dalgalanmanın önemli kısmı, kaplama malzemesinden değil altyapı hazırlığından kaynaklanır.",
      "Açık alanlarda kullanıcı güvenliği de teknik kararın parçasıdır. Rampa eğimi, kayma riski, gece aydınlatması, yağmur sonrası suyun birikmediği geçişler ve bakım araçlarının erişimi dış sahayı çalışır kılan unsurlardır.",
    ],
    ruleTable: [
      {
        parameter: "Sert zemin eğimi",
        limitOrRequirement: "Yüzey suyu yapıdan uzağa yönlendirilmeli",
        reference: "Saha kalite planı",
        note: "Giriş kotları ve drenaj hatları birlikte düşünülmelidir.",
      },
      {
        parameter: "Bitkisel peyzaj altyapısı",
        limitOrRequirement: "Toprak ve sulama altyapısı kalıcı bakım mantığıyla kurulmalı",
        reference: "Peyzaj uygulama disiplini",
        note: "Sadece bitki dikimi yeterli değildir.",
      },
      {
        parameter: "Erişim ve kullanım",
        limitOrRequirement: "Yaya yolları, rampalar ve açık alan dolaşımı güvenli olmalı",
        reference: "Planlı Alanlar İmar Yönetmeliği",
        note: "Dış alan kullanımı bina girişleriyle birlikte değerlendirilmelidir.",
      },
      {
        parameter: "Kaplama alt temel ve sıkışma",
        limitOrRequirement: "Yüzey taşıyıcılığına uygun altyapı ve kot sürekliliği sağlanmalı",
        reference: "Saha kalite planı",
        note: "Üst kaplamadaki performans, alt yapı hazırlığı kadar iyidir.",
      },
    ],
    designOrApplicationSteps: [
      "Dış saha kotlarını bina giriş kotlarıyla birlikte doğrula.",
      "Kaplama alt temelini, sıkışma seviyesini ve yağmur suyu güzergahını uygulama öncesi kontrol et.",
      "Sert zemin eğimlerini drenaj yönüne göre planla.",
      "Bitkisel alanlarda toprak derinliği ve sulama altyapısını hazırla.",
      "Bordür, kaplama ve yeşil alan geçişlerini temiz detaylarla tamamla.",
      "Teslim öncesi göllenme, erişim ve bakım kontrolü yap.",
      "Açık alan aydınlatması, yönlendirme ve bakım araçlarının erişimini kullanıcı senaryosuna göre gözden geçir.",
    ],
    criticalChecks: [
      "Yaya yolları ve girişler güvenli eğimde mi?",
      "Göllenme riski yaratan düşük noktalar var mı?",
      "Toprak derinliği ve sulama altyapısı hazır mı?",
      "Sert zemin ile yeşil alan geçişleri temiz mi?",
      "Bakım ekibi için erişim ve kullanım senaryosu düşünülmüş mü?",
      "Kaplama alt temelinde çökme veya zayıf sıkışma işareti var mı?",
      "Rögar, ızgara ve kapak kotları bitmiş yüzeyle uyumlu mu?",
    ],
    numericalExample: {
      title: "Sert zemin eğimi için örnek hesap",
      inputs: [
        { label: "Yaya yolu uzunluğu", value: "12 m", note: "Bina girişine yaklaşan aks" },
        { label: "Hedef eğim", value: "%1,5", note: "Yüzey suyu yönlendirme hedefi" },
        { label: "Gerekli kot farkı", value: "18 cm", note: "12 m boyunca" },
        { label: "Kaplama tipi", value: "Beton parke", note: "Sert zemin örneği" },
      ],
      assumptions: [
        "Yüzey suyu yapıya değil drenaj hattına yönlendirilecektir.",
        "Alt temel ve bordür sistemi bu geometriyi destekleyecektir.",
        "Rampalı erişim başka bir aksla çözülecektir.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "12 m x %1,5 = 0,18 m",
          result: "En az 18 cm düşüş gerekir.",
          note: "Yüzeyde su tutmayan düzen için ölçüsel hedef sağlar.",
        },
        {
          title: "Kullanım etkisini yorumla",
          result: "Eğim, giriş güvenliği ve yağış sonrası kullanım konforunu doğrudan etkiler.",
          note: "Aşırı veya yetersiz eğim her iki durumda da sorun üretir.",
        },
        {
          title: "Kritik kot ilişkisini kontrol et",
          result: "18 cm toplam düşüşün giriş kotunda değil, güvenli drenaj aksında çözülmesi gerekir.",
          note: "Kot farkının tamamını eşik yakınında vermek, erişim ve kullanıcı konforunu bozar.",
        },
      ],
      checks: [
        "Eğim saha ölçüsüyle doğrulanmalıdır.",
        "Su girişe yönlenmemelidir.",
        "Kaplama altı temel ve bordür sistemi eğimi koruyacak şekilde kurulmalıdır.",
        "Menhol ve yağmur suyu ızgarası kotları bitmiş kaplama ile aynı sistemde kontrol edilmelidir.",
      ],
      engineeringComment: "Dış sahada birkaç santimetrelik kot farkı, yıllarca sürecek su yönetimi davranışını belirler.",
    },
    tools: CLOSEOUT_TOOLS,
    equipmentAndMaterials: CLOSEOUT_EQUIPMENT,
    mistakes: [
      { wrong: "Peyzajı yalnızca bitki seçimi olarak görmek.", correct: "Kot ve drenajı ana karar saymak." },
      { wrong: "Sert zemin eğimini göz kararı vermek.", correct: "Ölçüyle kontrol etmek." },
      { wrong: "Toprak derinliğini bakım ekibine bırakmak.", correct: "Uygulama aşamasında yeterli kesiti sağlamak." },
      { wrong: "Dış giriş kotlarını sonradan ayarlamak.", correct: "Bina ve çevre kotlarını birlikte çözmek." },
      { wrong: "Peyzajı teslim edip bakım bilgisini vermemek.", correct: "Bakım gereksinimini teslim paketine eklemek." },
      { wrong: "Kaplama alt temel sıkışmasını üst kaplama kadar önemsememek.", correct: "Alt yapı kabulünü yüzey kapatma öncesi yapmak." },
    ],
    designVsField: [
      "Peyzaj çizimleri çoğu zaman dekoratif algılanır; sahada ise suyun nereye gideceğini ve kullanıcının nasıl yürüyeceğini belirler.",
      "Bu nedenle çevre düzenleme, mimarinin dış mekan performans boyutudur.",
      "İyi bir dış saha detayı, yalnız açılış gününde değil ilk yağmur ve ilk bakım döneminde de doğru çalışmalıdır.",
    ],
    conclusion: [
      "Peyzaj ve çevre düzenleme doğru yapıldığında bina çevresi güvenli, kuru ve okunabilir olur. Yanlış yapıldığında ise sorunlar yağmurla birlikte görünür hale gelir.",
      "İnşaat mühendisi için temel ders nettir: açık alan imalatı, sonradan toparlanacak küçük iş değil; binanın kullanım kalitesini dışarıda tanımlayan mühendislik paketidir.",
    ],
    sources: PEYZAJ_SOURCES,
    keywords: ["peyzaj", "çevre düzenleme", "sert zemin eğimi", "göllenme", "açık alan kullanımı"],
  },
  {
    slugPath: "peyzaj-teslim/iskan-ruhsati",
    kind: "topic",
    quote: "İskan ruhsatı, yapının tamamlandığını değil; projeye ve kullanım güvenliğine uygun biçimde kapanabildiğini gösterir.",
    tip: "İskanı son hafta işi gibi görmek, teknik dosya ile saha gerçekliği arasındaki farkı büyütür.",
    intro: [
      "İskan ruhsatı, yapının projeye, mevzuata ve kullanım şartlarına uygun tamamlandığını gösteren resmi kapanış adımıdır.",
      "Bu süreç yalnızca belge toplama değildir; sahadaki son durumun, testlerin ve kullanım güvenliğinin resmi dosyayla uyumlu hale getirilmesidir.",
      "Şantiyede en sık yapılan hata, iskanı resmi başvuru günü başlayan bir süreç gibi görmektir. Oysa yapı kullanma izni, kaba imalattan itibaren üretilen test, revizyon ve as-built kayıtlarının sonunda anlam kazanır. Son haftaya bırakılan kapanış kültürü, bu nedenle en çok iskan aşamasında kırılır.",
    ],
    theory: [
      "İskan süreci, ruhsat aşamasının kapanış karşılığıdır. Ancak bu kez tasarımdan çok, fiilen inşa edilmiş yapının kayıt altına alınması önemlidir.",
      "Bu nedenle as-built paftalar, test raporları, yangın güvenliği, tesisat devreye alma kayıtları ve erişim düzenleri birlikte değerlendirilir.",
      "İskan başarısı, şantiyenin bitmesinden önce teknik ofis ve saha ekiplerinin kayıt kültürüne bağlıdır.",
      "Mühendislik bakışında iskan, fiili durum ile onaylı durum arasındaki sapmanın yönetimidir. Sahada yapılan her revizyonun çizime, hesap gerekirse proje müellifi onayına ve teslim dosyasına yansımış olması gerekir. Aksi halde küçük görünen bir uygulama farkı, resmi süreçte büyük açıklama ihtiyacı doğurur.",
      "Ayrıca iskan; kullanıcı güvenliği, ortak alan çalışırlığı ve bakım erişimi bakımından da bir kalite filtresidir. Yangın güvenliği, tahliye düzeni, ortak hacimlerin bitmişliği ve sistemlerin devreye alınmış olması, dosya kadar sahada da görünür şekilde doğrulanmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Yapı kullanma izni",
        limitOrRequirement: "Yapı ruhsatı eki projelere uygun tamamlanmalı",
        reference: "3194 sayılı İmar Kanunu",
        note: "Fiili durum ile onaylı sistem arasında açıklanamayan fark kalmamalıdır.",
      },
      {
        parameter: "Teknik ve resmi belgeler",
        limitOrRequirement: "Güncel test, kontrol ve teslim kayıtları bulunmalı",
        reference: "Planlı Alanlar İmar Yönetmeliği",
        note: "Eksik teknik kayıt, resmi süreci doğrudan etkiler.",
      },
      {
        parameter: "Kullanım güvenliği",
        limitOrRequirement: "Yangın, erişim ve temel işletme koşulları sağlanmalı",
        reference: "Yangın Yönetmeliği + saha teslim disiplini",
        note: "İskan dosyası yalnızca kağıt değil, güvenlik göstergesidir.",
      },
      {
        parameter: "As-built ve devreye alma uyumu",
        limitOrRequirement: "Gerçek saha uygulaması, güncel pafta ve test kayıtlarıyla birebir izlenebilir olmalı",
        reference: "3194 sayılı İmar Kanunu + Yapı Denetimi uygulama disiplini",
        note: "Belge ile saha arasında açıklanamayan fark bırakılmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "As-built ve teknik teslim dosyasını sahadaki son durumla eşleştir.",
      "Sistem testleri, devreye alma ve bakım evraklarını eksiksiz tamamla.",
      "Yangın, erişim ve ortak alan güvenliği için son kontrolleri yap.",
      "Resmi başvuru evraklarını teknik dosya referanslarıyla birleştir.",
      "İskan öncesi saha turunda açık kalan maddeleri kapat.",
      "Ruhsat eki paftalar ile fiili saha uygulaması arasında kalan tüm farkları revizyon listesinde tek tek kapat.",
      "Başvuru öncesi iç denetim turu yaparak eksik evrak ile eksik imalatı ayrı iki liste halinde yönet.",
    ],
    criticalChecks: [
      "As-built seti son saha durumunu gösteriyor mu?",
      "Test ve devreye alma kayıtları tamamlandı mı?",
      "Yangın ve erişim güvenliği son kez kontrol edildi mi?",
      "Ortak alan ve dış saha kullanımı hazır mı?",
      "Resmi dosya ile saha arasında fark kaldı mı?",
      "Bağımsız bölüm, ortak alan ve teknik hacimlerde ruhsat setinden kopan uygulama farkı var mı?",
      "Başvuruya girecek her belge için sorumlu kişi ve kapanış tarihi tanımlı mı?",
    ],
    numericalExample: {
      title: "İskan öncesi teknik dosya tamamlama matrisi örneği",
      inputs: [
        { label: "Ana belge grubu", value: "6 grup", note: "As-built, test, yangın, bakım, garanti, resmi formlar" },
        { label: "Eksik belge", value: "2 grup", note: "Henüz kapanmamış" },
        { label: "Hedef", value: "0 eksik grup", note: "Başvuru ön koşulu" },
        { label: "Kritik etki", value: "Başvuru gecikmesi", note: "Teslim takvimini kaydırır" },
      ],
      assumptions: [
        "Tüm belge grupları sorumlulara atanmıştır.",
        "Eksik belgeler teknik gerçekliğe dayalıdır; sonradan uydurulmayacaktır.",
        "Başvuru öncesi saha ile dosya tekrar karşılaştırılacaktır.",
      ],
      steps: [
        {
          title: "Eksik oranını yorumla",
          formula: "2 / 6 = %33",
          result: "Teknik dosyanın üçte biri eksik durumdadır.",
          note: "Bu seviyede eksik, başvuru takviminin hazır olmadığı anlamına gelir.",
        },
        {
          title: "Başvuru kararını ver",
          result: "Eksik belge grupları kapanmadan başvuru yapılmamalıdır.",
          note: "İskan takvimi belge gerçekliğine göre kurulmalıdır.",
        },
        {
          title: "Kapanış eşiğini yorumla",
          result: "Altı ana grubun tamamı kapatılmadan resmi süreçte güvenli ilerleme beklenmez.",
          note: "İki eksik grup küçük görünse de as-built veya yangın testleri gibi kritik başlıklara denk gelirse başvuruyu doğrudan geciktirir.",
        },
      ],
      checks: [
        "Teknik dosya eksiksiz olmadan resmi takvim başlatılmamalıdır.",
        "Saha durumu ile dosya uyumu son kez kontrol edilmelidir.",
        "Eksik kayıtlar son anda değil süreç içinde tamamlanmalıdır.",
        "İç denetim turu yapılmadan resmi denetim tarihi kilitlenmemelidir.",
      ],
      engineeringComment: "İskan sürecini hızlandıran şey acele değil, şantiye kapanırken tutulan düzgün teknik kayıttır.",
    },
    tools: CLOSEOUT_TOOLS,
    equipmentAndMaterials: CLOSEOUT_EQUIPMENT,
    mistakes: [
      { wrong: "İskanı yalnızca belediye evrak süreci sanmak.", correct: "Teknik dosya ve saha uyum süreci olarak görmek." },
      { wrong: "As-built güncellemesini sona bırakmak.", correct: "İlerlerken tamamlamak." },
      { wrong: "Test kayıtlarını farklı ekiplerde dağınık tutmak.", correct: "Tek teslim klasöründe toplamak." },
      { wrong: "Eksik maddeleri gizleyerek başvuruya gitmek.", correct: "Önce teknik kapanışı tamamlamak." },
      { wrong: "İskan sonrası bakım bilgisini düşünmek.", correct: "Bakım ve işletme evrakını teslimle birlikte hazırlamak." },
      { wrong: "Ruhsat eki paftalar ile fiili uygulama farklarını sözlü açıklamayla kapatmaya çalışmak.", correct: "Revizyon ve as-built kaydını yazılı hale getirmek." },
    ],
    designVsField: [
      "Masa başında iskan bir dosya işi gibi görünür; sahada ise yapının gerçekten çalışır, güvenli ve kayıtlı olduğunu kanıtlama sürecidir.",
      "Bu nedenle iskan ruhsatı, teknik kapanış disiplininin en görünür resmi sonucudur.",
      "Sahada düzgün tutulan as-built ve test zinciri, resmi süreçte en güçlü hızlandırıcıdır; eksik kayıt ise aynı hızla geciktiriciye dönüşür.",
    ],
    conclusion: [
      "İskan ruhsatı doğru hazırlandığında proje güvenle kullanıma açılır ve teknik sorumluluk netleşir. Hatalı hazırlandığında ise şantiye bitmiş görünse bile bina tam kapanmış sayılmaz.",
      "Bu nedenle inşaat mühendisi için iskan, bir form doldurma işi değil; şantiyenin bütün hafızasını doğrulanabilir dosyaya dönüştürme aşamasıdır.",
    ],
    sources: [...PEYZAJ_SOURCES, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.planliAlanlar],
    keywords: ["iskan ruhsatı", "yapı kullanma izni", "as-built", "teknik teslim dosyası", "şantiye resmi kapanışı"],
  },
  ...peyzajTeslimLeafSpecs,
];
