import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const INCE_MORE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const SIVA_TOOLS: BinaGuideTool[] = [
  { category: "Kontrol", name: "Mastar, lazer nivo ve köşe şablonları", purpose: "Sıva düzlemi, köşe doğruluğu ve dalga kontrolünü sistematik hale getirmek." },
  { category: "Ölçüm", name: "Nem ölçer ve yüzey sertlik kontrolü", purpose: "Sonraki katmana geçiş için sıva kuruluğu ve sağlamlığını doğrulamak." },
  { category: "Detay", name: "Cephe ve iç mekan sıva detay paftaları", purpose: "Köşe, denizlik, file ve profil çözümünü sahada tekrarlanabilir kılmak." },
  { category: "Kayıt", name: "Alan bazlı kalite föyü", purpose: "Çatlak, yüzey bozukluğu ve tamir gerektiren bölgeleri mahal bazında izlemek." },
];

const SIVA_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazırlık", name: "Astar, serpme köprüsü ve yüzey temizlik ekipmanları", purpose: "Alt yüzeyi aderans ve emicilik açısından sıvaya hazır hale getirmek.", phase: "Hazırlık" },
  { group: "Uygulama", name: "Çimento bazlı sıva, alçı sıva ve ilgili karışım ekipmanı", purpose: "İç veya dış mekana uygun sıva katmanını kontrollü üretmek.", phase: "Sıva uygulaması" },
  { group: "Detay", name: "Köşe profili, sıva filesi ve damlalık profilleri", purpose: "Köşe, birleşim ve cephe kritik bölgelerinde çatlak riskini azaltmak.", phase: "Detay çözümü" },
  { group: "Koruma", name: "Kür, gölgeleme ve yüzey koruma ekipmanı", purpose: "Ani kuruma, yağmur ve darbe riskine karşı yeni sıvayı korumak.", phase: "Uygulama sonrası" },
];

const ZEMIN_TOOLS: BinaGuideTool[] = [
  { category: "Ölçüm", name: "CM nem ölçer, mastar ve lazer terazi", purpose: "Şap kabulü, kot sürekliliği ve kaplama öncesi yüzey durumunu doğrulamak." },
  { category: "Detay", name: "Mahal kaplama ve eşik paftaları", purpose: "Ürün geçişleri, süpürgelik ve derz sürekliliğini uygulamadan önce netleştirmek." },
  { category: "Kontrol", name: "Tüketim ve deneme alanı föyü", purpose: "Kaplama sistemini küçük alanda doğrulayıp ana uygulamaya risksiz geçmek." },
  { category: "Kayıt", name: "Teslim ve koruma çizelgesi", purpose: "Tamamlanan zeminlerin trafik açılışını ve yüzey korumasını yönetmek." },
];

const ZEMIN_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazırlık", name: "Tesviye şapı, astar ve yüzey düzeltme malzemeleri", purpose: "Kaplama altı zemini düz, sağlam ve uygun emicilikte bırakmak.", phase: "Hazırlık" },
  { group: "Kaplama", name: "Parke, seramik ve doğal taş ürünleri", purpose: "Mahal kullanımına uygun nihai zemin performansını üretmek.", phase: "Kaplama" },
  { group: "Birleşim", name: "Altlık, yapıştırıcı, derz dolgu ve eşik profilleri", purpose: "Kaplama sistemini kenar ve geçiş detaylarıyla birlikte tamamlamak.", phase: "Montaj ve bitiş" },
  { group: "Koruma", name: "Yüzey koruma örtüsü ve geçici trafik önlemleri", purpose: "Yeni uygulanan kaplamayı diğer ekiplerden ve erken kullanımdan korumak.", phase: "Teslim öncesi" },
];

const DUVAR_FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Duvar modül ve renk paftaları", purpose: "Boya, duvar kağıdı ve birleşim detaylarını uygulama öncesi kesinleştirmek." },
  { category: "Ölçüm", name: "Yan ışık kontrolü ve yüzey mastarı", purpose: "Boya altı kalite ile duvar kağıdı yüzey düzgünlüğünü görünür hale getirmek." },
  { category: "Kontrol", name: "Katman ve kuruma takip çizelgesi", purpose: "Astar, macun ve son katların doğru sırayla tamamlanmasını sağlamak." },
  { category: "Kayıt", name: "Mahal bazlı onay listesi", purpose: "Renk, doku ve yüzey kabulünü kullanıcı alanı bazında arşivlemek." },
];

const DUVAR_FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazırlık", name: "Astar, macun ve yüzey tamir ürünleri", purpose: "Duvar kaplamasını taşıyacak düzgün ve homojen alt yüzeyi üretmek.", phase: "Hazırlık" },
  { group: "Kaplama", name: "İç cephe boya sistemleri ve duvar kağıdı türleri", purpose: "Mahal kullanımına uygun görünüm, temizlenebilirlik ve yüzey performansı sağlamak.", phase: "Kaplama" },
  { group: "Birleşim", name: "Köşe profili, birleşim bandı ve bitiş elemanları", purpose: "Derz, köşe ve geçiş bölgelerinde görsel sürekliliği korumak.", phase: "Bitiş" },
  { group: "Koruma", name: "Geçici yüzey koruma ve leke önleme ekipmanı", purpose: "Son kat uygulama sonrası duvar yüzeyini darbe ve kirden korumak.", phase: "Teslim öncesi" },
];

const CATI_MORE_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Çatı katman paftası ve birleşim çizimleri", purpose: "Membran veya metal çatı detaylarını montaj öncesi netleştirmek." },
  { category: "Ölçüm", name: "Eğim, bindirme ve doğrultu kontrol ekipmanı", purpose: "Kaplama yüzeyinin su yönünü ve montaj ritmini doğrulamak." },
  { category: "Kontrol", name: "Sabitleme ve sızdırmazlık checklisti", purpose: "Kritik düğümlerde sistem dışı uygulamayı önlemek." },
  { category: "Kayıt", name: "Çatı kabul ve su testi foto arşivi", purpose: "Teslim öncesi çatı davranışını kayıt altına almak." },
];

const CATI_MORE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Alt katman", name: "Membran, buhar kesici, metal alt taşıyıcı ve yardımcı katmanlar", purpose: "Kaplama tipine göre su, buhar ve hareket davranışını yönetmek.", phase: "Alt hazırlık" },
  { group: "Kaplama", name: "Membran veya metal çatı panelleri/levhaları", purpose: "Su geçirimsizlik ve dış etkiye dayanım sağlayan ana üst katmanı oluşturmak.", phase: "Kaplama montajı" },
  { group: "Birleşim", name: "Bindirme, mahya, dere ve kenar aksesuarları", purpose: "En riskli su geçiş bölgelerini sistematik kapatmak.", phase: "Detay çözümü" },
  { group: "Sabitleme", name: "Vida, klips ve rüzgar güvenlik elemanları", purpose: "Kaplamanın servis ömrü boyunca yerinde ve güvenli kalmasını sağlamak.", phase: "Sabitleme" },
];

const KAPI_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Kapı kasası ve eşik paftaları", purpose: "İç ve dış kapı montajını duvar bitişiyle birlikte çözmek." },
  { category: "Ölçüm", name: "Şakül, diyagonal ve boşluk kontrol seti", purpose: "Kapı kasası doğruluğu ile kanat boşluklarını fonksiyonel seviyede tutmak." },
  { category: "Kontrol", name: "Açılma, kilit ve sızdırmazlık test listesi", purpose: "Kapıyı montajdan sonra gerçek kullanım senaryosuyla doğrulamak." },
  { category: "Kayıt", name: "Donanım ve anahtar teslim föyü", purpose: "Menteşe, kilit ve aksesuar setini işletmeye okunabilir biçimde devretmek." },
];

const KAPI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Doğrama", name: "İç kapı, dış kapı kasası ve kanat sistemi", purpose: "Mahal kullanımına uygun güvenlik, akustik ve dayanım performansı sağlamak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Ankraj, takoz, köpük ve mastik sistemi", purpose: "Kapı kasasını duvar içinde dengeli, doğru ve sızdırmaz biçimde yerleştirmek.", phase: "Kasa montajı" },
  { group: "Donanım", name: "Menteşe, kilit, kapı kolu ve eşik elemanları", purpose: "Kapının kullanım davranışını ve günlük işletme kalitesini belirlemek.", phase: "Son ayar" },
  { group: "Koruma", name: "Geçici koruyucu bant ve yüzey örtüleri", purpose: "Teslim öncesi kapı yüzeyini darbe ve lekeye karşı korumak.", phase: "Teslim öncesi" },
];

export const inceIslerMoreLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/zemin-kaplamalari/parke-kaplama",
    kind: "topic",
    quote: "Parke, sıcak görünen bir yüzeydir; ama gerçek başarısı şap nemi ve altlık disiplininde saklıdır.",
    tip: "Parkede en yaygın hata, zeminin kuru olduğunu varsayıp hızlı montaja geçmektir; birkaç gün kazanmak çoğu zaman aylarca sürecek kabarma sorununa dönüşür.",
    intro: [
      "Parke kaplama, konut ve ofis gibi iç mekanlarda sıcak görünüm, yürüme konforu ve hızlı uygulama avantajı nedeniyle sık tercih edilir. Ancak parke sistemleri neme ve alt yüzey bozukluğuna diğer birçok kaplamadan daha duyarlıdır. Bu yüzden başarısı ürün markasından önce şap kabulüne bağlıdır.",
      "İnşaat mühendisi için parke işi yalnız dekoratif seçim değildir. Şapın nemi, mastar toleransı, altlık uyumu, eşik geçişi ve süpürgelik detayları birlikte çözülmezse, en kaliteli parke bile kısa sürede açılma, gıcırdama veya kabarma ile sorun üretir.",
    ],
    theory: [
      "Parke sistemi, hareket eden bir yüzey mantığıyla çalışır. Ahşap veya laminat tabaka çevresel nem ve sıcaklıktan etkilenir; bu nedenle genleşme boşlukları ve altlık sistemi kaplamanın ayrılmaz parçasıdır. Sıfır tolerans ve sıkışık montaj, özellikle duvar diplerinde deformasyonu artırır.",
      "Alt zemin ise parkede belirleyici unsurdur. Nemli şap, zayıf tesviye veya noktasal çukur bölgeler önce görünmez; fakat kullanımla birlikte ses, sallanma veya birleşim açılması olarak kendini gösterir. Parke, alt yüzey hatalarını affetmeyen bir kaplamadır.",
      "Ayrıca parke kaplama takvimi de önemlidir. Boya, sıva ve ıslak işlerden gelen inşaat nemi tam atılmadan yapılan montaj, kaplamanın üretimden değil şantiyeden bozulmasına yol açar. Bu yüzden parke işi, şantiye kapanışında en son olgunlaştırılması gereken yüzeylerden biridir.",
    ],
    ruleTable: [
      {
        parameter: "Nem ve şap kabulü",
        limitOrRequirement: "Parke öncesi şap nemi ve yüzey dengesizliği ölçüyle doğrulanmalıdır.",
        reference: "TS EN 13329 + saha kabul disiplini",
        note: "Nem kontrolü yapılmayan parke işi takvim kararı değil risk kararıdır.",
      },
      {
        parameter: "Altlık ve genleşme boşluğu",
        limitOrRequirement: "Altlık sistemi ve çevre boşlukları üretici önerisiyle uyumlu kurulmalıdır.",
        reference: "TS EN 13329",
        note: "Parke yalnız üst tabakadan ibaret görülmemelidir.",
      },
      {
        parameter: "Geçiş ve eşik detayları",
        limitOrRequirement: "Mahal geçişleri, kapı altları ve süpürgelik bitişleri ölçülü çözülmelidir.",
        reference: "Mahal bitiş paftası",
        note: "Görsel düzen kadar hareket kabiliyeti de düşünülmelidir.",
      },
      {
        parameter: "Koruma ve kullanım açılışı",
        limitOrRequirement: "Montaj sonrası yüzey darbe ve ıslak temizlikten korunmalıdır.",
        reference: "Teslim planı",
        note: "Erken kullanım yeni döşenen parkede kalıcı iz üretebilir.",
      },
    ],
    designOrApplicationSteps: [
      "Parke tipini mahal kullanım sınıfı ve bakım beklentisine göre seç.",
      "Şap nemini ve 2 m mastarda yüzey sapmasını ölçmeden uygulamaya başlama.",
      "Altlık, buhar kesici ve çevre genleşme boşluklarını sistem olarak kur.",
      "Kapı altı, eşik ve süpürgelik birleşimlerini montajla eş zamanlı çöz.",
      "Montaj sonrası alanı kontrollü aç ve ağır ekip girişini koruma planına bağla.",
    ],
    criticalChecks: [
      "Şap nemi parkeye uygun eşik altında mı?",
      "Altlık ve buhar kesici süreklilik gösteriyor mu?",
      "Duvar diplerinde yeterli genleşme boşluğu bırakıldı mı?",
      "Eşik ve kapı altı geçişleri sıkışma üretmeyecek şekilde çözüldü mü?",
      "Yeni döşenen yüzey erken temizlik veya darbeye açıldı mı?",
    ],
    numericalExample: {
      title: "32 m² mahalde nem ve genleşme yorumu",
      inputs: [
        { label: "Mahal alanı", value: "32 m²", note: "Yatak odası + giyinme alanı" },
        { label: "Ölçülen CM nemi", value: "%2,3", note: "Üç noktada benzer sonuç" },
        { label: "Örnek hedef eşik", value: "<%2,0", note: "Hassas parke montajı için örnek kabul" },
        { label: "Hedef", value: "Montaj zamanını belirlemek", note: "Kalite odaklı karar" },
      ],
      assumptions: [
        "Parke sistemi neme hassas bir ürün grubudur.",
        "Şap yeni ve inşaat nemi henüz tamamen atılmamıştır.",
        "Ölçüm aynı cihazla ve aynı gün alınmıştır.",
      ],
      steps: [
        {
          title: "Nem değerini yorumla",
          formula: "2,3 > 2,0",
          result: "Mevcut durumda montaj için erken davranılmış olur.",
          note: "Yüzey düzgün olsa bile nem kriteri sağlanmadan montaj başlanmamalıdır.",
        },
        {
          title: "Takvim kararını ver",
          result: "Kuruma süresi uzatılmalı ve ölçüm tekrar edilmelidir.",
          note: "Birkaç gün beklemek, parkede aylarca sürecek kusuru önleyebilir.",
        },
      ],
      checks: [
        "Parke takvimi şantiye kapanış baskısıyla değil nem verisiyle kurulmalıdır.",
        "Altlık ve çevre boşluğu montaj kalitesi kadar önemlidir.",
        "Şap nemi uygun değilse ürün değiştirmek değil, zemin şartını düzeltmek gerekir.",
      ],
      engineeringComment: "Parkede görünen yüzey kalitesinin arkasında, çoğu zaman görünmeyen tek bir veri vardır: zemin gerçekten kuru mu?",
    },
    tools: ZEMIN_TOOLS,
    equipmentAndMaterials: ZEMIN_EQUIPMENT,
    mistakes: [
      { wrong: "Şap nemini ölçmeden parkeye başlamak.", correct: "CM nem ölçümüyle kararı sayısal veriye bağlamak." },
      { wrong: "Duvar diplerinde genleşme boşluğu bırakmamak.", correct: "Sistemin hareketine izin verecek çevre boşluğu oluşturmak." },
      { wrong: "Altlık kalitesini önemsiz görmek.", correct: "Altlığı sistemin akustik ve hareket parçası olarak değerlendirmek." },
      { wrong: "Eşik detaylarını montaj sonuna bırakmak.", correct: "Kapı altı ve geçişleri önceden planlamak." },
      { wrong: "Yeni döşenen parkeyi hemen yoğun kullanıma açmak.", correct: "Teslim ve koruma sürecini kontrollü yönetmek." },
    ],
    designVsField: [
      "Parke katalogda kusursuz görünür; sahada ise onu başarıya götüren şey alt yüzeyin gerçekten hazır olmasıdır.",
      "İyi parke sıcak ve sessiz bir yüzey bırakır. Kötü parke ise önce ses, sonra açıklık ve kabarma ile kendini ele verir.",
    ],
    conclusion: [
      "Parke kaplama doğru nem, doğru altlık ve doğru genleşme disipliniyle uzun ömürlü olur. Bu üç şart göz ardı edildiğinde sorun ürün seçiminden değil şantiye kararından doğar.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13329],
    keywords: ["parke kaplama", "şap nemi", "TS EN 13329", "altlık", "genleşme boşluğu"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
  {
    slugPath: "ince-isler/zemin-kaplamalari/seramik-kaplama",
    kind: "topic",
    quote: "Seramik zemin, sert bir kaplama olduğu için hatayı saklamaz; alt yüzeydeki her bozukluğu görünür hale getirir.",
    tip: "Seramikte en sık hata, mastar ve modül disiplinini yapıştırıcıyla çözebileceğini sanmaktır; sonuçta hem görünüm hem dayanım bozulur.",
    intro: [
      "Seramik zemin kaplaması; ıslak hacimler, mutfaklar, koridorlar ve yoğun sirkülasyonlu alanlarda hijyen, aşınma dayanımı ve kolay temizlik avantajı nedeniyle sık tercih edilir. Görünürde dayanıklı bir kaplama olduğundan toleranslı sanılır; oysa seramik, alt yüzey hatalarını en hızlı gösteren sistemlerden biridir.",
      "İnşaat mühendisi için seramik kaplama işi yalnız karo seçimi değildir. Şap kötü, su yönü, modül planı, dilatasyon, eşik ve süpürgelik ilişkisi birlikte çözülmelidir. Kötü alt yüzey üzerine doğru karo döşemek mümkün değildir; çünkü problem seramikte değil zeminin kendisindedir.",
    ],
    theory: [
      "Seramik sisteminin performansı, yapıştırıcı sınıfı kadar alt yüzeyin düzlemselliğine bağlıdır. Dolu görünmeyen yapıştırıcı yatağı, boşluklu döşeme ve dengesiz derz aralıkları yürüyüş sırasında kırılma veya ses problemi oluşturabilir.",
      "Islak mahallerde zemin seramiği aynı zamanda su yönünü taşır. Gider çevresi, duş alanı veya balkon gibi bölgelerde eğim hatası varsa, en iyi seramik bile göllenme ve kir tutma problemi üretir. Bu nedenle seramik kaplama, şap geometrisinin doğru okunmasına bağımlıdır.",
      "Dilatasyon ve birleşim detayları da göz ardı edilmemelidir. Özellikle büyük alanlarda veya ürün geçişlerinde kontrollü hareket bırakılmadığında çatlak veya derz açılması görülür.",
    ],
    ruleTable: [
      {
        parameter: "Yapıştırıcı sistemi",
        limitOrRequirement: "Seramik boyutu ve kullanım yerine uygun yapıştırıcı sınıfı seçilmelidir.",
        reference: "TS EN 12004",
        note: "Büyük ebat veya ıslak mahal seramiği farklı performans gerektirir.",
      },
      {
        parameter: "Alt zemin ve eğim",
        limitOrRequirement: "Şap yüzeyi düz, sağlam ve gereken bölgelerde doğru eğimde olmalıdır.",
        reference: "Saha kalite planı",
        note: "Seramik uygulaması yanlış eğimi sonradan düzeltemez.",
      },
      {
        parameter: "Derz ve modül planı",
        limitOrRequirement: "Derz çizgileri ve kesim kararları mahal boyunca kontrollü yürütülmelidir.",
        reference: "Mahal modül paftası",
        note: "Seramikte görsel kalite büyük ölçüde modül kararından gelir.",
      },
      {
        parameter: "Dilatasyon ve birleşim",
        limitOrRequirement: "Geniş alan ve geçiş bölgelerinde hareket detayları unutulmamalıdır.",
        reference: "Uygulama disiplini",
        note: "Sert kaplama sistemi hareketi yok saydığında kırılma riski artar.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal kullanımına ve ıslaklık riskine göre seramik boyutu ile yapıştırıcı sistemini belirle.",
      "Şap düzlemselliğini ve gider çevresi eğimini uygulamadan önce ölçerek kabul et.",
      "Merkez aksı, başlangıç sırasını ve dar parça riskini modül planıyla çöz.",
      "Dilatasyon, eşik ve duvar birleşim detaylarını kaplama ile birlikte uygula.",
      "Teslim öncesi seramik yüzeyi boşluk, göllenme ve derz sürekliliği açısından kontrol et.",
    ],
    criticalChecks: [
      "Şap yüzeyinde seramik altında boşluk yaratacak seviye farkı var mı?",
      "Gider ve ıslak alan eğimleri saha ölçüsüyle doğrulandı mı?",
      "Modül planı dar ve zayıf parça bırakıyor mu?",
      "Ürün geçişlerinde eşik ve hareket detayı çözüldü mü?",
      "Derz dolgu ve yüzey temizliği mahal boyunca aynı kaliteyi gösteriyor mu?",
    ],
    numericalExample: {
      title: "Banyo zemini eğim yorumu",
      inputs: [
        { label: "Duş alanı boyu", value: "1,80 m", note: "Süzgece yönlenen kısa hat" },
        { label: "Örnek hedef eğim", value: "%1,5", note: "Göllenmesiz akış için saha kabulü" },
        { label: "Gerekli kot farkı", value: "2,7 cm", note: "1,80 x 0,015" },
        { label: "Hedef", value: "Şap geometrisini doğrulamak", note: "Seramik öncesi kontrol" },
      ],
      assumptions: [
        "Süzgeç konumu sabittir ve seramik öncesi belirlenmiştir.",
        "Şap düzeltmesi seramikten önce yapılacaktır.",
        "Seramik boyutu büyük ebatlı ise kesim ve eğim ilişkisi ayrıca kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "1,80 x 0,015 = 0,027 m",
          result: "Yaklaşık 2,7 cm kot farkı gerekir.",
          note: "Bu değer, suyu seramiğe değil süzgece emanet etmenin temelidir.",
        },
        {
          title: "Kaplama kararını yorumla",
          result: "Şapta bu geometri yoksa seramik montajı sırasında düzeltmeye çalışmak risklidir.",
          note: "Su yönü şapta çözülür, kaplama üstünde yalnız görünür hale gelir.",
        },
      ],
      checks: [
        "Islak mahal eğimi seramik öncesi saha ölçüsüyle doğrulanmalıdır.",
        "Büyük ebat seramiklerde eğim ve boşluk riski ayrıca değerlendirilmelidir.",
        "Süzgeç çevresi detayları kaplama kalitesi kadar kritiktir.",
      ],
      engineeringComment: "Seramikte görünen düzgün yüzeyin arkasında, çoğu zaman görünmeyen ama doğru kurulmuş bir şap geometrisi vardır.",
    },
    tools: ZEMIN_TOOLS,
    equipmentAndMaterials: ZEMIN_EQUIPMENT,
    mistakes: [
      { wrong: "Eğimi seramik uygulaması sırasında vermeye çalışmak.", correct: "Şap geometrisini kaplama öncesi çözmek." },
      { wrong: "Büyük ebat seramiği aynı yapıştırıcı ve aynı alışkanlıkla uygulamak.", correct: "Ürün ve mahal tipine göre sistem seçmek." },
      { wrong: "Boşluklu döşemeyi normal kabul etmek.", correct: "Dolu yatak ve saha kontrolüyle çalışmak." },
      { wrong: "Derz ve modül planını montaj anında karar vermek.", correct: "Başlangıç aksını önceden kurmak." },
      { wrong: "Gider çevresini en sona bırakmak.", correct: "Islak mahal düğümünü baştan detaylandırmak." },
    ],
    designVsField: [
      "Seramik katalogda dayanıklı görünür; sahada ise onun başarısını belirleyen şey şap düzlüğü ve su yönüdür.",
      "İyi seramik kaplama temiz, tok ve sakin görünür. Kötü uygulama ise derz şaşıklığı, boşluk ve göllenmeyle hemen anlaşılır.",
    ],
    conclusion: [
      "Seramik zemin kaplama doğru şap, doğru modül ve doğru yapıştırıcıyla uzun ömürlü olur. Bu üçlüden biri eksildiğinde sert görünen sistem kısa sürede kusur üretmeye başlar.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn12004],
    keywords: ["seramik kaplama", "zemin seramiği", "TS EN 12004", "gider eğimi", "modül planı"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/parke-kaplama"],
  },
  {
    slugPath: "ince-isler/zemin-kaplamalari/mermer-kaplama",
    kind: "topic",
    quote: "Mermer ve granit kaplama, taşın kendisinden çok altındaki taşıyıcı disiplin ve derz doğruluğu kadar iyi görünür.",
    tip: "Doğal taşta en sık hata, taşın pahalı olmasının iyi sonucu garanti ettiğini sanmaktır; oysa ton farkı, kalınlık toleransı ve taşıma kalitesi birlikte yönetilmelidir.",
    intro: [
      "Mermer ve granit kaplamalar, lobi, merdiven, holler ve prestijli ortak alanlarda görsel etki ve dayanım beklentisi nedeniyle tercih edilen doğal taş çözümleridir. Doğal taşın estetik değeri yüksektir; ancak saha uygulamasında bu değer, taşın altındaki geometri ve taşıma kalitesiyle korunabilir.",
      "İnşaat mühendisi için doğal taş işi yalnız malzeme tedariki değildir. Kalınlık toleransı, yüzey işleme farkı, derz ritmi, köşe dönüşü, merdiven burun detayı ve alt yatak kalitesi birlikte düşünülmezse, pahalı taş bile düzensiz, ses yapan veya kırılgan bir yüzeye dönüşebilir.",
    ],
    theory: [
      "Doğal taş kaplamada ürünün kendisi standardize seramiğe göre daha fazla varyasyon taşır. Ton farkı, damar yönü ve kalınlık küçük ama görünür sapmalar yaratabilir. Bu nedenle taş uygulaması depo-kutu mantığıyla değil, alan bazlı seçme ve dizme mantığıyla yönetilmelidir.",
      "Taş altı yatak ve yüzey düzgünlüğü de kritik önemdedir. Özellikle büyük boyutlu taşlarda boşluklu yatak, köşe kırığı ve çatlak riskini artırır. Taş sert görünür; fakat noktasal boşluklar altında kırılmaya açık hale gelebilir.",
      "Ayrıca derz ve yüzey işleme kararları taş sisteminin uzun vadeli davranışını etkiler. Merdiven, eşik ve yüksek trafik alanlarında kaymazlık ve köşe dayanımı, yalnız görsel karardan ayrı düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Taş seçimi ve parti kontrolü",
        limitOrRequirement: "Ton, damar ve kalınlık farkları montaj öncesi ayıklanmalıdır.",
        reference: "Saha kabul ve ürün disiplini",
        note: "Doğal taşta kalite kontrol, montaj öncesi ayrıştırmayla başlar.",
      },
      {
        parameter: "Yatak ve aderans",
        limitOrRequirement: "Taş altı taşıyıcı yatak boşluksuz ve düzgün kurulmalıdır.",
        reference: "Uygulama kalite planı",
        note: "Büyük ebat doğal taşlar boşlukları affetmez.",
      },
      {
        parameter: "Derz ve geometri",
        limitOrRequirement: "Yüzey derzleri, merdiven ve eşik detayları aksa sadık çözülmelidir.",
        reference: "Mahal detay paftası",
        note: "Pahalı taş, kötü geometriyi gizlemez.",
      },
      {
        parameter: "Kullanım güvenliği",
        limitOrRequirement: "Kaymazlık, burun ve köşe detayları kullanım senaryosuna uygun olmalıdır.",
        reference: "Planlı Alanlar yaklaşımı + saha güvenliği",
        note: "Doğal taş kararları yalnız görsel etkiyle verilmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Taş partisini mahal bazlı ayır, ton ve damar sürekliliğini montaj öncesi yerde prova et.",
      "Alt zemini doğal taşın ağırlığına ve düzlem ihtiyacına uygun hazırlayıp boşluk riskini azalt.",
      "Merdiven, eşik ve köşe detaylarını düz yüzeylerden ayrı ele al.",
      "Taşları kontrollü aksla yerleştir; kesim ve dar parça riskini baştan yönet.",
      "Teslim öncesi ses, köşe dayanımı ve yüzey sürekliliği açısından alanı detaylı kontrol et.",
    ],
    criticalChecks: [
      "Ton ve damar farkları istenmeyen yamalı görünüm oluşturuyor mu?",
      "Taş altında boşluk veya sehim riski taşıyan bölgeler var mı?",
      "Merdiven burun ve eşik detayları güvenli mi?",
      "Derz ritmi ve yüzey kotları alan boyunca süreklilik gösteriyor mu?",
      "Parlatma veya son yüzey işlemi kullanım senaryosuna uygun mu?",
    ],
    numericalExample: {
      title: "36 m² lobi alanında plaka planı yorumu",
      inputs: [
        { label: "Alan", value: "36 m²", note: "6 m x 6 m kare lobi" },
        { label: "Örnek plaka ölçüsü", value: "60 x 60 cm", note: "Doğal taş modülü" },
        { label: "Teorik plaka adedi", value: "100 adet", note: "36 / 0,36" },
        { label: "Hedef", value: "Kesim ve ton planını yönetmek", note: "Uygulama öncesi hazırlık" },
      ],
      assumptions: [
        "Alan simetrik ve ana aksa göre döşenecektir.",
        "Taşlar aynı partiden gelmiş olsa da ton farkı kontrolü yapılacaktır.",
        "Kesin adet saha fire ve seçme payıyla artırılacaktır.",
      ],
      steps: [
        {
          title: "Temel modülü hesapla",
          formula: "36 / 0,36 = 100",
          result: "Teorik olarak yaklaşık 100 plaka gerekir.",
          note: "Doğal taşta teori kadar seçme ve ayıklama payı da düşünülmelidir.",
        },
        {
          title: "Kalite planını yorumla",
          result: "Montaj öncesi yerde prova yapılmadan 100 plakanın alana dengeli dağılması güvence üretmez.",
          note: "Taş kaplamada sayı kadar dizim kalitesi de sonucu belirler.",
        },
      ],
      checks: [
        "Doğal taşta fire ve seçme payı standart kaplamalara göre daha dikkatle yönetilmelidir.",
        "Yerde prova yapılmadan kritik alan montajına geçilmemelidir.",
        "Merdiven ve eşik gibi özel bölgeler ana alandan ayrı planlanmalıdır.",
      ],
      engineeringComment: "Doğal taşın pahası sonucu garantilemez; onu değerli gösteren şey doğru dizim ve doğru taşıyıcı disiplindir.",
    },
    tools: ZEMIN_TOOLS,
    equipmentAndMaterials: ZEMIN_EQUIPMENT,
    mistakes: [
      { wrong: "Taşları paketlerden gelişigüzel çıkarıp döşemek.", correct: "Ton ve damar kontrolüyle planlı dizim yapmak." },
      { wrong: "Boşluklu yatağı kabul etmek.", correct: "Doğal taş altında tam destek sağlamak." },
      { wrong: "Merdiven burun detayını düz yüzey gibi çözmek.", correct: "Darbe ve güvenlik açısından ayrı detaylandırmak." },
      { wrong: "Eşik ve köşe bitişlerini son ana bırakmak.", correct: "Özel bölgeleri ana yüzeyle birlikte planlamak." },
      { wrong: "Parlak yüzeyi her mahal için doğru kabul etmek.", correct: "Kaymazlık ve kullanım güvenliğini de değerlendirmek." },
    ],
    designVsField: [
      "Doğal taş projede lüks malzeme gibi görünür; sahada ise en küçük geometri ve yatak hatasını bile açıkça gösterir.",
      "İyi mermer/granit uygulaması sakin, dengeli ve tok görünür. Kötü uygulama ise ton yaması, köşe kırığı ve seviye farkıyla kendini belli eder.",
    ],
    conclusion: [
      "Mermer ve granit kaplama doğru seçme, doğru yatak ve doğru detayla birleştiğinde kalıcı bir yüzey değeri üretir. Bu üç koşul eksikse doğal taşın potansiyeli hızla kusura dönüşür.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.planliAlanlar],
    keywords: ["mermer kaplama", "granit kaplama", "doğal taş", "eşik detayı", "zemin modülü"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/boya",
    kind: "topic",
    quote: "Boya son kat gibi görünür; ama aslında tüm yüzey hazırlığının görünür hale gelmiş özetidir.",
    tip: "Boyada en büyük hata, kusuru son katta kapatabileceğini sanmaktır; boya örtücü olabilir ama yüzey dalgasını ve kötü macunu saklayamaz.",
    intro: [
      "Boya uygulaması, iç mekanların algısını ve bakım kolaylığını doğrudan etkileyen en yaygın son kat işidir. Renk kararı ön planda görünse de teknik tarafta astar, macun, zımpara, kat sayısı ve kuruma disiplini sonucu belirler.",
      "İnşaat mühendisi için boya, 'en son yapılacak kolay iş' değildir. Sıva doğruluğu, alçıpan derz kalitesi, nem durumu, pencere doğrama birleşimleri ve yan ışık etkisi boyada ortaya çıkar.",
    ],
    theory: [
      "Boya sisteminde başarı, alt yüzey emiciliğini ve yüzey homojenliğini kontrol etmekle başlar. Yalnız son kat boya seçmek yeterli değildir; altındaki macun, astar ve zımpara kalitesi son görüntüyü belirler.",
      "Ayrıca iç mekan kullanım senaryosu boyanın performans beklentisini değiştirir. Koridor, çocuk odası veya teknik hacim aynı temizlenebilirlik ve dayanım ihtiyacına sahip değildir.",
      "Sahadaki en kritik konu ışık ve kuruma kontrolüdür. Gün ışığı veya lineer yapay ışık alan yüzeylerde boya kusurları hızla görünür.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Macun, astar ve zımpara işlemleri homojen ve ürün uyumlu tamamlanmalıdır.",
        reference: "Ürün teknik föyü + saha kalite planı",
        note: "Boya kalitesi son katta değil alt yüzeyde başlar.",
      },
      {
        parameter: "Nem ve kuruma",
        limitOrRequirement: "Yüzey yeterince kuru ve boya kabul seviyesinde olmalıdır.",
        reference: "Uygulama disiplini",
        note: "Nemli yüzeyde boya kısa sürede sorun çıkarır.",
      },
      {
        parameter: "Mahal kullanım uygunluğu",
        limitOrRequirement: "Boya tipi temizlenebilirlik ve aşınma ihtiyacına uygun seçilmelidir.",
        reference: "Mahal finish matrisi",
        note: "Her mekanda aynı boya performansı beklenmemelidir.",
      },
      {
        parameter: "Görsel kabul",
        limitOrRequirement: "Yan ışık, köşe ve geniş yüzeylerde homojen görünüm sağlanmalıdır.",
        reference: "Saha kabul planı",
        note: "Ön cepheden iyi görünen yüzey, yandan sorunlu olabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Duvarı boya öncesi macun, tamir ve zımpara açısından gerçek kabul seviyesine getir.",
      "Astar seçimini yüzey emiciliğine ve önceki katman türüne göre yap.",
      "Mahal kullanımına uygun boya tipi ve son kat parlaklık derecesini belirle.",
      "Katlar arası kuruma ve temizlik disiplinine uyarak uygulamayı ilerlet.",
      "Teslim öncesi yüzeyi hem doğal hem yapay yan ışık altında kontrol et.",
    ],
    criticalChecks: [
      "Macun ve zımpara kalitesi geniş yüzeyde süreklilik gösteriyor mu?",
      "Yüzey boya öncesi yeterince kuru mu?",
      "Köşe, tavan birleşimi ve doğrama diplerinde keskin ve temiz hat bırakıldı mı?",
      "Mahal kullanımına uygun boya sınıfı seçildi mi?",
      "Yan ışıkta dalga, iz veya kat farkı görülüyor mu?",
    ],
    numericalExample: {
      title: "180 m² duvar alanında kat planı yorumu",
      inputs: [
        { label: "Net boyanacak alan", value: "180 m²", note: "Aynı kat ofis mahali" },
        { label: "Örnek tüketim", value: "0,12 L/m²/kat", note: "Ürün ve yüzeye göre değişir" },
        { label: "Kat sayısı", value: "1 astar + 2 son kat", note: "Örnek sistem" },
        { label: "Hedef", value: "Malzeme ve iş akışı planı", note: "Kuruma süreleriyle birlikte" },
      ],
      assumptions: [
        "Yüzey hazırlığı tamamlanmıştır ve ek tamir ihtiyacı düşüktür.",
        "Aynı ürün sistemi kullanılarak devam edilecektir.",
        "Kesin tüketim saha deneme uygulamasıyla teyit edilecektir.",
      ],
      steps: [
        {
          title: "Son kat tüketimini oku",
          formula: "180 x 0,12 x 2 = 43,2 L",
          result: "İki son kat için yaklaşık 43,2 litre tüketim beklenir.",
          note: "Astar ve rötuş payı ayrıca planlanmalıdır.",
        },
        {
          title: "İş akışını yorumla",
          result: "Malzeme hesabı kadar katlar arası kuruma ve ışık kontrolü de planın parçası olmalıdır.",
          note: "Boya işi hız işi değil, yüzey olgunlaştırma işidir.",
        },
      ],
      checks: [
        "Tüketim hesabı yüzey hazırlığı seviyesinden bağımsız düşünülmemelidir.",
        "Kuruma yeterli değilse sonraki kat uygulanmamalıdır.",
        "Görsel kabul ışık koşuluyla birlikte değerlendirilmelidir.",
      ],
      engineeringComment: "Boyanın iyi görünmesini sağlayan şey kova değil, o kovadan önce doğru hazırlanmış yüzeydir.",
    },
    tools: DUVAR_FINISH_TOOLS,
    equipmentAndMaterials: DUVAR_FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Macun ve zımpara kalitesini son katta düzeltebileceğini düşünmek.", correct: "Yüzeyi boya öncesi gerçek kabul seviyesine getirmek." },
      { wrong: "Tüm mahallerde aynı boya tipini kullanmak.", correct: "Kullanım ve temizlik ihtiyacına göre boya sınıfı seçmek." },
      { wrong: "Katlar arası yeterli kuruma beklememek.", correct: "Ürün sistemine uygun süre disiplinine uymak." },
      { wrong: "Yüzeyi yalnız ön cepheden kontrol etmek.", correct: "Yan ışık altında da değerlendirmek." },
      { wrong: "Doğrama ve tavan birleşimlerini son rötuşa bırakmak.", correct: "Keskin hat ve temiz maskeleme ile ilerlemek." },
    ],
    designVsField: [
      "Renk kartelasında seçilen ton tasarımı anlatır; sahada ise o rengin iyi görünüp görünmeyeceğini yüzey hazırlığı belirler.",
      "İyi boya yüzeyi sakin ve homojen görünür. Kötü boya ise ışık değiştiğinde tüm kusurlarıyla ortaya çıkar.",
    ],
    conclusion: [
      "Boya uygulaması doğru yüzey hazırlığı, doğru mahal seçimi ve doğru ışık kontrolüyle başarılı olur. Son katı önemseyip alt katları ihmal eden yaklaşım ise görünür kaliteyi kısa sürede zayıflatır.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["boya", "duvar boyası", "yüzey hazırlığı", "yan ışık kontrolü", "astar macun"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/duvar-kagidi"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/duvar-kagidi",
    kind: "topic",
    quote: "Duvar kağıdı kusuru örten değil, yüzey kusurunu büyüten bir kaplamadır; bu yüzden başarısı duvarda değil hazırlıkta başlar.",
    tip: "Duvar kağıdında en sık hata, boyaya uygun duvarın kağıda da uygun olduğunu sanmaktır; oysa kağıt, alt yüzey pürüzünü çok daha sert şekilde gösterir.",
    intro: [
      "Duvar kağıdı kaplaması, iç mekanlarda doku, desen ve sıcaklık etkisi yaratmak için kullanılan hassas bir son kat sistemidir. Görsel etkisi güçlüdür; fakat teknik olarak boyadan daha seçici davranır. Çünkü duvar kağıdı yüzey altındaki dalga, çizik ve emicilik farklarını çoğu zaman daha belirgin hale getirir.",
      "İnşaat mühendisi için duvar kağıdı işi yalnız dekorasyon seçimi değildir. Alçı sıva veya macun kalitesi, düzgün köşe, priz-buat çevresi, ek yeri planı ve mahal nemi birlikte kontrol edilmelidir. Duvar kağıdı, yüzey kusuruna toleransı düşük bir kaplama olduğu için yanlış zamanda ve zayıf duvara uygulanmamalıdır.",
    ],
    theory: [
      "Duvar kağıdı performansı, alt yüzeyin homojen ve stabil olmasına bağlıdır. Boyada rötuşla çözülebilecek bazı çizgi veya pürüzler, kağıtta birleşim hattı veya yüzey kabarması olarak daha görünür hale gelir.",
      "Ayrıca duvar kağıdında desen yönü, ek çizgileri ve köşe dönüşleri başlı başına teknik karardır. Özellikle lineer desenli veya büyük raporlu ürünlerde ilk şerit kararı tüm duvarın görünümünü belirler. Rastgele başlatılan uygulamalar, pahalı ürünü amatör görünür hale getirebilir.",
      "Mahal nemi ve kullanıcı senaryosu da önemlidir. Yetersiz kurumuş duvar, güneş alan cephe, buhar yükü yüksek alan veya yoğun silme gerektiren mekanlarda uygun ürün seçimi yapılmadığında kaplama kısa sürede kalkma veya kirlenme sorunu üretir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey düzgünlüğü",
        limitOrRequirement: "Alt duvar boyadan daha yüksek hassasiyetle düzgün hazırlanmalıdır.",
        reference: "Saha kalite planı",
        note: "Kağıt kaplama dalga ve çizik riskini görünür hale getirir.",
      },
      {
        parameter: "Astar ve yapıştırıcı uyumu",
        limitOrRequirement: "Duvar emiciliği ve ürün tipine uygun sistem kullanılmalıdır.",
        reference: "Ürün teknik föyü",
        note: "Her kağıt aynı yapıştırıcı ve astar davranışı istemez.",
      },
      {
        parameter: "Desen ve ek planı",
        limitOrRequirement: "Rapor, yön ve birleşim çizgileri uygulama öncesi planlanmalıdır.",
        reference: "Mahal modül planı",
        note: "İlk şerit kararı tüm duvarın kalitesini etkiler.",
      },
      {
        parameter: "Mahal uygunluğu",
        limitOrRequirement: "Nem, güneş ve kullanım yüküne uygun ürün seçilmelidir.",
        reference: "Mahal finish matrisi",
        note: "Dekoratif seçim tek başına yeterli değildir.",
      },
    ],
    designOrApplicationSteps: [
      "Duvar yüzeyini boya kabulünden bir seviye daha hassas hazırlıkla düzelt.",
      "Astar ve yapıştırıcı sistemini ürün tipine göre belirle, deneme alanı yap.",
      "İlk şerit, köşe dönüşü ve priz-buat ilişkisini uygulama öncesi planla.",
      "Ek yerlerini ve desen yönünü tüm duvar boyunca izleyerek ilerle.",
      "Teslim öncesi kabarma, ek açılması ve desen sürekliliğini ışık altında kontrol et.",
    ],
    criticalChecks: [
      "Duvar yüzeyi kağıt kaplama için yeterince düzgün mü?",
      "Astar ve yapıştırıcı ürün tipine uygun mu?",
      "Desen yönü ve ek çizgileri önceden planlandı mı?",
      "Köşe dönüşlerinde şaşma veya açıklık var mı?",
      "Mahal nemi ve güneş etkisi ürün kullanımına uygun mu?",
    ],
    numericalExample: {
      title: "12 m çevreye sahip mahalde rulo planı yorumu",
      inputs: [
        { label: "Net duvar çevresi", value: "12 m", note: "Kapı/pencere düşülmeden kaba çevre" },
        { label: "Duvar yüksekliği", value: "2,80 m", note: "Şerit boyu" },
        { label: "Rulo net kaplama eni", value: "53 cm", note: "Standart duvar kağıdı örneği" },
        { label: "Hedef", value: "Şerit sayısını önceden okumak", note: "Ek planı için" },
      ],
      assumptions: [
        "Kapı ve pencere fireleri ayrıca değerlendirilecektir.",
        "Desen raporu nedeniyle ilave boy kaybı oluşabilir.",
        "Kesin sipariş saha duvar planıyla teyit edilecektir.",
      ],
      steps: [
        {
          title: "Yaklaşık şerit sayısını hesapla",
          formula: "12 / 0,53 ≈ 22,6",
          result: "Yaklaşık 23 düşey şerit gerekeceği öngörülür.",
          note: "Desen raporu ve fireler bu sayıyı artırabilir.",
        },
        {
          title: "Ek planını yorumla",
          result: "Köşe ve odak duvarlarda ek çizgileri görünmeyecek veya simetrik algılanacak şekilde planlanmalıdır.",
          note: "Sayıyı bilmek kadar ek yerinin nerede biteceğini bilmek önemlidir.",
        },
      ],
      checks: [
        "Sipariş ve iş planı desen raporu dikkate alınarak yapılmalıdır.",
        "İlk şerit kararı odak duvar mantığıyla verilmelidir.",
        "Köşe dönüşleri ve açıklıklar uygulama sırasında değil öncesinde çözülmelidir.",
      ],
      engineeringComment: "Duvar kağıdında iyi sonuç, ürünü doğru yapıştırmaktan çok ilk şeridi doğru yerden başlatmakla alınır.",
    },
    tools: DUVAR_FINISH_TOOLS,
    equipmentAndMaterials: DUVAR_FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Boyaya uygun yüzeyi kağıda da uygun sanmak.", correct: "Kağıt için daha hassas yüzey hazırlığı yapmak." },
      { wrong: "Desen yönünü uygulama sırasında doğaçlamak.", correct: "İlk şerit ve rapor planını önceden kurmak." },
      { wrong: "Mahal nemini göz ardı etmek.", correct: "Ürünü kullanım ve ortam şartına göre seçmek." },
      { wrong: "Köşe dönüşlerini en sona bırakmak.", correct: "Ek ve köşe stratejisini baştan belirlemek." },
      { wrong: "Ek yerini yalnız yakından kontrol etmek.", correct: "Uzak bakışta da ritim ve sürekliliği değerlendirmek." },
    ],
    designVsField: [
      "Duvar kağıdı katalogda desen üzerinden seçilir; sahada ise onun şık mı amatör mü görüneceğini yüzey hazırlığı ve ek planı belirler.",
      "İyi duvar kağıdı kaplaması mekanın parçası gibi görünür. Kötü uygulama ise ek çizgileri ve köşe bozukluklarıyla hemen fark edilir.",
    ],
    conclusion: [
      "Duvar kağıdı uygulaması düzgün yüzey, doğru ürün ve doğru ek planıyla başarılı olur. Bu üçlü zayıf kurulduğunda dekoratif avantaj kısa sürede kusura dönüşür.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["duvar kağıdı", "yüzey hazırlığı", "ek planı", "desen raporu", "iç mekan kaplaması"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/boya"],
  },
  {
    slugPath: "ince-isler/siva/ic-siva",
    kind: "topic",
    quote: "İç sıva, duvarı kapatan katman değil; sonraki tüm yüzey kalitesinin referans düzlemidir.",
    tip: "İç sıvada en sık hata, sıvayı boya öncesi kaba düzeltme gibi görmektir; oysa boya ve kaplama hatalarının önemli bölümü burada doğar.",
    intro: [
      "İç sıva, iç mekan duvar ve tavanlarda yüzey düzgünlüğü, köşe doğruluğu ve boya/kaplama altı hazırlığı sağlayan temel ince iş katmanıdır. Görünürde ara katman gibi dursa da, mekan kalitesinin büyük kısmı bu aşamada belirlenir.",
      "İnşaat mühendisi için iç sıva, kaba duvar ile son kat boya arasındaki en kritik köprüdür. Bu aşamada yapılan küçük tolerans hataları, sonraki işlerde daha pahalı düzeltmelere dönüşür. Bu yüzden sıvayı yalnız kapatma değil, referans yüzey üretme işi olarak okumak gerekir.",
    ],
    theory: [
      "İç sıva performansı alt yüzey emiciliği, katman kalınlığı ve uygulama ortamıyla belirlenir. Duvarın aşırı kuru veya düzensiz olması, harcın aderans ve kuruma davranışını bozar. Sonuçta çatlak, tozuma veya dalga oluşabilir.",
      "İç sıvada asıl hedef, boya veya duvar kaplamasını taşıyacak homojen ve kontrollü yüzey üretmektir. Bu nedenle köşe profilleri, mastar çizgileri ve lokal tamirler yalnız görünüm için değil sonraki katmanların sürekliliği için de gereklidir.",
      "Sahada ayrıca priz kutuları, pencere kenarları, kolon-kiriş birleşimleri ve tavan geçişleri daha hassas bölgeler oluşturur. İç sıvanın gerçek kalitesi geniş düz duvarda değil, tam da bu birleşim detaylarında anlaşılır.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey hazırlığı",
        limitOrRequirement: "Yüzey temiz, sağlam ve uygun emicilikte olmalıdır.",
        reference: "TS EN 13914",
        note: "Zayıf veya tozlu alt yüzey aderansı doğrudan düşürür.",
      },
      {
        parameter: "Katman kalınlığı",
        limitOrRequirement: "Tek katta aşırı kalın sıva uygulamasından kaçınılmalıdır.",
        reference: "TS EN 13914",
        note: "Kalınlık arttıkça rötre ve çatlak riski büyür.",
      },
      {
        parameter: "Köşe ve mastar doğruluğu",
        limitOrRequirement: "Köşeler ve düzlem hatları mastar ve profil ile kontrol edilmelidir.",
        reference: "Saha kalite planı",
        note: "Boya altı kalite, çoğu zaman burada belirlenir.",
      },
      {
        parameter: "Kuruma ve sonraki iş geçişi",
        limitOrRequirement: "Yeterli kuruma olmadan boya veya kaplama aşamasına geçilmemelidir.",
        reference: "Uygulama disiplini",
        note: "Takvim baskısı, sıva performansını hızla zayıflatır.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yüzeyi temizle, gevşek parçaları kaldır ve emicilik farklarını gerekli hazırlıkla dengele.",
      "Mastar çizgileri ve köşe profilleri kurarak referans düzlemi belirle.",
      "Sıvayı kontrollü kalınlıkta uygula; lokal büyük boşlukları tek katta kapatmaya çalışma.",
      "Pencere, priz ve tavan birleşimlerinde hassas yüzey geçişlerini ayrıca düzelt.",
      "Boyaya geçmeden önce yüzeyi mastar ve yan ışık altında tekrar kontrol et.",
    ],
    criticalChecks: [
      "Alt yüzeyde gevşek, kirli veya aşırı emici bölgeler kaldı mı?",
      "Köşe ve düşey hatlar bütün mahal boyunca tutarlı mı?",
      "Priz kutuları ve doğrama çevresinde sıva kalitesi zayıf mı?",
      "Tek katta aşırı kalın uygulama yapılan bölge var mı?",
      "Yüzey boya öncesi yeterince kurudu mu?",
    ],
    numericalExample: {
      title: "4,8 m duvarda mastar sapması yorumu",
      inputs: [
        { label: "Duvar uzunluğu", value: "4,8 m", note: "Salon ana duvarı" },
        { label: "Ölçülen lokal bozukluk", value: "12 mm", note: "Kaba yüzey taraması" },
        { label: "Hedef iç sıva kalınlığı", value: "10-15 mm", note: "Örnek uygulama aralığı" },
        { label: "Hedef", value: "Boya altı düzgün yüzey", note: "Mastar kontrolüyle" },
      ],
      assumptions: [
        "Duvar genel geometri açısından kabul edilebilir durumdadır.",
        "Ortam koşulları aşırı sıcak veya aşırı rüzgarlı değildir.",
        "Sonraki katman boya olacaktır.",
      ],
      steps: [
        {
          title: "Yüzey bozukluğunu yorumla",
          result: "12 mm bozukluk, hedef iç sıva kalınlığı içinde yönetilebilir görünür.",
          note: "Daha büyük sapmalarda alt yüzey düzeltmesi veya ek tamir gerekebilir.",
        },
        {
          title: "Boya altı kalite kararını ver",
          result: "Mastar ve köşe kontrolü sıva sırasında yapılmazsa boya sonrası dalga riski artar.",
          note: "İç sıvada kalite son katta değil, mastar aşamasında kazanılır.",
        },
      ],
      checks: [
        "Lokal bozukluklar sonradan macunla çözülmeye bırakılmamalıdır.",
        "Mastar kontrolü geniş yüzey ve birleşim detaylarında birlikte yapılmalıdır.",
        "Kuruma tamamlanmadan boya aşamasına geçilmemelidir.",
      ],
      engineeringComment: "İç sıvada birkaç milimetrelik hata, son katta bütün duvar boyunca görünür hale gelebilir.",
    },
    tools: SIVA_TOOLS,
    equipmentAndMaterials: SIVA_EQUIPMENT,
    mistakes: [
      { wrong: "Sıvayı boya öncesi kaba düzeltme işi gibi görmek.", correct: "Boya altı referans düzlem olarak yönetmek." },
      { wrong: "Aşırı kalın sıvayı tek katta kapatmak.", correct: "Katman ve lokal tamir mantığıyla ilerlemek." },
      { wrong: "Köşe ve doğrama çevrelerini ikinci plana atmak.", correct: "Birleşim detaylarını özel kontrol bölgesi saymak." },
      { wrong: "Kuruma tamamlanmadan sonraki işe geçmek.", correct: "Takvimi yüzey olgunluğuna göre kurmak." },
      { wrong: "Yüzeyi yalnız önden kontrol etmek.", correct: "Mastar ve yan ışık altında da değerlendirmek." },
    ],
    designVsField: [
      "İç sıva projede görünmeyen ara katman gibidir; sahada ise mekanın temiz ve düzgün algılanmasının gerçek üreticisidir.",
      "İyi iç sıva sessizce çalışır; kötü iç sıva boya sonrası bütün dalga ve eğrilikleri görünür kılar.",
    ],
    conclusion: [
      "İç sıva doğru yüzey hazırlığı, doğru kalınlık ve doğru mastar disipliniyle yapıldığında sonraki tüm ince işleri rahatlatır. Zayıf uygulandığında ise kusur, mekanın en görünür yüzeylerine taşınır.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["iç sıva", "TS EN 13914", "mastar kontrolü", "boya altı yüzey", "köşe doğruluğu"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/alci-siva"],
  },
  {
    slugPath: "ince-isler/siva/dis-siva",
    kind: "topic",
    quote: "Dış sıva, cepheyi düzeltmekten önce suya, güneşe ve sıcaklık farkına karşı çalışan bir koruma katmanıdır.",
    tip: "Dış sıvada en sık hata, iç sıva mantığıyla davranmaktır; oysa dış yüzeyde su, sıcaklık değişimi ve rüzgar çok daha belirleyicidir.",
    intro: [
      "Dış sıva, cephe yüzeylerinde düzgünlük sağlarken aynı zamanda dış etkilere karşı ilk koruyucu katmanı oluşturan önemli bir uygulamadır. İç sıvaya benzer görünse de çalışma koşulları tamamen farklıdır; güneş, yağmur, rüzgar ve sıcaklık farkı dış sıvanın davranışını doğrudan etkiler.",
      "İnşaat mühendisi için dış sıva, boya altı hazırlıktan daha fazlasıdır. Cephe su davranışı, denizlik ve damlalık detayları, file kullanımı, köşe dayanımı ve kür disiplini birlikte ele alınmalıdır. Aksi halde ilk kışta çatlak, kabarma veya akıntı izleri oluşur.",
    ],
    theory: [
      "Dış sıva sisteminde rötre, sıcaklık gerilmesi ve su emme davranışı başlıca belirleyicilerdir. Geniş cephe yüzeylerinde lokal zayıflıklar, kuruma farkları veya detay eksikleri kısa sürede çatlak ağına dönüşebilir.",
      "Cephede en kritik bölgeler pencere kenarları, parapet altları, denizlik birleşimleri ve kolon-kiriş yüzey geçişleridir. Bu bölgelerdeki detay kusuru yalnız estetik değil, suyun duvar içine taşınmasına da yol açabilir.",
      "Bu nedenle dış sıva, düz yüzey üretmek kadar cephe detaylarını güvenli hale getirmek işidir. İyi görünen ama suyu yönetemeyen bir dış sıva uzun ömürlü sayılmaz.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey ve aderans",
        limitOrRequirement: "Cephe yüzeyi temiz, sağlam ve sıva tutacak nitelikte hazırlanmalıdır.",
        reference: "TS EN 13914",
        note: "Dış sıvada aderans sorunu kısa sürede kabarmaya dönebilir.",
      },
      {
        parameter: "Katman ve çatlak kontrolü",
        limitOrRequirement: "Katman kalınlığı ve gerekli yerlerde file/aksesuar kullanımı doğru planlanmalıdır.",
        reference: "TS EN 13914 + cephe detayı",
        note: "Birleşim bölgeleri düz yüzeyden daha kritik davranır.",
      },
      {
        parameter: "Su yönetimi",
        limitOrRequirement: "Denizlik, damlalık ve parapet dönüşleri suyu cepheden uzaklaştırmalıdır.",
        reference: "Cephe ve saha detay disiplini",
        note: "Dış sıva suyu tutmamalı, yönlendirmelidir.",
      },
      {
        parameter: "Uygulama koşulları",
        limitOrRequirement: "Aşırı sıcak, rüzgar veya yağış altında korumasız uygulama yapılmamalıdır.",
        reference: "Uygulama ve kür planı",
        note: "Hava koşulu, dış sıvada iç mekana göre çok daha belirleyicidir.",
      },
    ],
    designOrApplicationSteps: [
      "Cephe yüzeyini aderans açısından hazırla; gevşek ve kirli bölgeleri sıva öncesi gider.",
      "Damlalık, denizlik, file ve köşe aksesuarlarını dış sıvanın ayrılmaz parçası olarak kur.",
      "Geniş yüzeylerde uygulamayı hava koşuluna göre etaplandır; öğlen güneşinde hız için kaliteyi bozma.",
      "Pencere çevresi, kiriş-kolon geçişi ve parapet altlarını özel kontrol bölgesi say.",
      "Cephe boyası öncesi çatlak, su izi ve yüzey sürekliliğini tüm yüzey boyunca değerlendir.",
    ],
    criticalChecks: [
      "Dış yüzeyde aderansı zayıflatacak tozlu veya gevşek alan kaldı mı?",
      "Damlalık ve denizlik detayları gerçek su davranışına uygun mu?",
      "Pencere köşelerinde ve birleşim hatlarında çatlak riski taşıyan bölgeler var mı?",
      "Uygulama hava koşulları nedeniyle aşırı hızlı kuruma yaşandı mı?",
      "Cephe boyunca renk veya doku farkı oluşturacak uygulama kesileri kaldı mı?",
    ],
    numericalExample: {
      title: "Cephede damlalık etkisi için basit yorum",
      inputs: [
        { label: "Denizlik çıkması", value: "4 cm", note: "Pencere altı örnek detay" },
        { label: "Damlalık oluğu", value: "1 cm içerden", note: "Örnek uygulama kararı" },
        { label: "Cephe yüksekliği", value: "12 m", note: "4 katlı yapı" },
        { label: "Hedef", value: "Suyun yüzeye yapışmadan kopması", note: "Cephe kirlenmesini azaltmak" },
      ],
      assumptions: [
        "Denizlik eğimi dışa doğru yeterlidir.",
        "Damlalık kesintisiz uygulanacaktır.",
        "Cephe boyası sıva kuruduktan sonra yapılacaktır.",
      ],
      steps: [
        {
          title: "Detay mantığını yorumla",
          result: "4 cm çıkma ve doğru konumlu damlalık, suyun alt yüzeyden geri dönmesini zorlaştırır.",
          note: "Bu küçük detay, tüm cephede kirlenme ve su izi davranışını etkiler.",
        },
        {
          title: "Cephe ölçeğine taşı",
          result: "12 m yüksek cephede küçük detay hataları çok daha görünür su izi üretir.",
          note: "Dış sıvada detay kalitesi, geniş yüzey performansını belirler.",
        },
      ],
      checks: [
        "Damlalık ve denizlik detayları makette değil sahada da kontrol edilmelidir.",
        "Su izi oluşturan kritik birleşimler boyadan önce düzeltilmelidir.",
        "Cephe kalitesi geniş yüzey kadar düğüm noktalarıyla da değerlendirilmelidir.",
      ],
      engineeringComment: "Dış sıvada bazen en büyük farkı, birkaç santimetrelik doğru bir su detayı yaratır.",
    },
    tools: SIVA_TOOLS,
    equipmentAndMaterials: SIVA_EQUIPMENT,
    mistakes: [
      { wrong: "Dış sıvayı iç sıva mantığıyla uygulamak.", correct: "Cephe su ve sıcaklık davranışını önceliklendirmek." },
      { wrong: "Damlalık ve denizlik detaylarını ihmal etmek.", correct: "Su yönetimini sıva sisteminin parçası görmek." },
      { wrong: "Aşırı sıcak veya rüzgarda korumasız çalışmak.", correct: "Uygulamayı hava koşuluna göre etaplandırmak." },
      { wrong: "Pencere çevresini geniş yüzey kadar kritik görmemek.", correct: "Birleşim bölgelerini özel kalite alanı olarak yönetmek." },
      { wrong: "Cephe boyasıyla dış sıva kusurunu kapatabileceğini düşünmek.", correct: "Sorunu sıva aşamasında çözmek." },
    ],
    designVsField: [
      "Dış sıva cephede düz bir yüzey gibi algılanır; sahada ise suyu, gölgeyi ve hava koşulunu birlikte yöneten aktif bir katmandır.",
      "İyi dış sıva cepheyi sakin gösterir. Kötü dış sıva ise çatlak ve akıntı iziyle kendini ilk mevsim değişiminde anlatır.",
    ],
    conclusion: [
      "Dış sıva doğru aderans, doğru detay ve doğru hava koşulu yönetimiyle uzun ömürlü çalışır. Bu üçlü bozulduğunda sorun yalnız estetik değil, cephe dayanımı problemine dönüşür.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13914, SOURCE_LEDGER.planliAlanlar],
    keywords: ["dış sıva", "cephe sıvası", "TS EN 13914", "damlalık", "su izi"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/ic-siva"],
  },
  {
    slugPath: "ince-isler/siva/alci-siva",
    kind: "topic",
    quote: "Alçı sıva iç mekanda hız ve pürüzsüzlük sağlar; ama bu avantaj yalnız doğru kalınlık ve doğru kuruma ile korunur.",
    tip: "Alçı sıvada en sık hata, pürüzsüz görünümü yeterli sanmaktır; oysa yanlış kalınlık ve zayıf kuruma sonradan boya çatlağına dönüşür.",
    intro: [
      "Alçı sıva, iç mekanlarda düzgün ve ince yüzey kalitesi üretmek için kullanılan hızlı priz alan sıva sistemidir. Özellikle boya altı pürüzsüz yüzey gerektiren konut ve ofis mahallerinde yaygın tercih edilir. Hız avantajı nedeniyle çok sevilir; fakat bu hız, kalite disiplininden taviz verildiğinde sorunu da hızla görünür hale getirir.",
      "İnşaat mühendisi için alçı sıva, son kat boya öncesi en hassas yüzey üretim aşamasıdır. Kaba sıva veya duvar yüzeyi kabul edilmeden yalnız alçı ile mucize beklemek doğru değildir. Alçı sıva, iyi hazırlanmış alt yüzey üzerinde, doğru kalınlık ve kuruma ile başarılı olur.",
    ],
    theory: [
      "Alçı sıva sisteminin en büyük avantajı, ince ve düzgün bitiş sağlayabilmesidir. Ancak aynı özellik onu yüzey bozukluğuna ve hızlı kuruma sorunlarına hassas hale getirir. Aşırı kalın uygulama, farklı emicilikte alt yüzey veya düzensiz su kaybı, yüzeyde ağ çatlağı ve performans kaybı yaratabilir.",
      "Alçı sıva özellikle boya ve duvar kağıdı altı yüzeyde değerlidir; çünkü ince detayları gösterecek kadar düzgün bir tabaka bırakır. Bu nedenle alçı sıva kusuru da daha görünür kılar. Hatalı bir uygulama, son katta daha çok fark edilir.",
      "Sahadaki kritik karar, alçı sıvayı gerçekten uygun mahallerde ve doğru sırayla kullanmaktır. Sürekli nem alan veya dış etkiye açık bölgeler için doğru sistem değildir. İç mekan bile olsa mahal kullanım senaryosu dikkate alınmadan seçilmemelidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey uyumu",
        limitOrRequirement: "Alt yüzey alçı sıva için uygun emicilik ve sağlamlıkta olmalıdır.",
        reference: "TS EN 13914 + ürün sistemi",
        note: "Zayıf hazırlık, hızlı ama kalitesiz sonuç üretir.",
      },
      {
        parameter: "Katman kalınlığı ve hız",
        limitOrRequirement: "Uygulama kalınlığı ve priz süreci kontrol edilmelidir.",
        reference: "Uygulama disiplini",
        note: "Hız avantajı, kalınlık hatasını telafi etmez.",
      },
      {
        parameter: "Mahal uygunluğu",
        limitOrRequirement: "Alçı sıva yalnız uygun iç mekan ve nem koşullarında tercih edilmelidir.",
        reference: "Mahal finish matrisi",
        note: "Her iç yüzey alçı sıva için doğru aday değildir.",
      },
      {
        parameter: "Son kat hazırlığı",
        limitOrRequirement: "Boya veya kağıt öncesi homojen ve kuru yüzey bırakılmalıdır.",
        reference: "İç mekan kalite planı",
        note: "Pürüzsüzlük kadar kuruluk da kritiktir.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yüzeyi alçı sıvaya uygun hale getir; aşırı emici veya gevşek bölgeleri önceden düzelt.",
      "Alçı sıvayı kontrollü kalınlıkta uygula, lokal büyük düzeltmeleri aynı katmanda çözmeye çalışma.",
      "Köşe, tavan birleşimi ve doğrama çevresinde pürüzsüz geçişleri özel olarak kontrol et.",
      "Kuruma sürecini hız baskısıyla zorlamadan boya veya duvar kağıdı geçişini planla.",
      "Teslim öncesi yüzeyi hem dokunsal hem görsel olarak kontrol ederek hataları erken düzelt.",
    ],
    criticalChecks: [
      "Alt yüzey alçı sıva için gerçekten uygun mu?",
      "Aşırı kalın uygulanan veya sonradan rötuşla doldurulan bölgeler var mı?",
      "Yüzey boya veya duvar kağıdı öncesi yeterince kuru mu?",
      "Köşe ve birleşim hatlarında pürüzsüzlük sürekliliği sağlandı mı?",
      "Mahalin nem yükü alçı sıva için uygun mu?",
    ],
    numericalExample: {
      title: "22 m² duvar alanında alçı sıva iş akışı yorumu",
      inputs: [
        { label: "Net alan", value: "22 m²", note: "Yatak odası duvarları" },
        { label: "Örnek ortalama kalınlık", value: "8 mm", note: "İnce iç yüzey bitişi" },
        { label: "Alt yüzey bozukluğu", value: "5-6 mm", note: "Kabul edilebilir düzeltme bandı" },
        { label: "Hedef", value: "Boya altı pürüzsüz yüzey", note: "Kuruma kontrollü olacak" },
      ],
      assumptions: [
        "Alt yüzey genel olarak alçı sıva için uygundur.",
        "Mahal sürekli ıslak hacim değildir.",
        "Sonraki kat boya olarak planlanmaktadır.",
      ],
      steps: [
        {
          title: "Kalınlık kararını yorumla",
          result: "8 mm ortalama kalınlık, ince iç yüzey düzeltmesi için yönetilebilir bir bandı gösterir.",
          note: "Daha büyük düzeltmeler için önce alt yüzey kararı gözden geçirilmelidir.",
        },
        {
          title: "Son kat etkisini oku",
          result: "Alçı sıva düzgün görünse bile kuruma tamamlanmadan boya yapılırsa kusur görünür hale gelir.",
          note: "Pürüzsüz yüzey, doğru zamanlama ile korunur.",
        },
      ],
      checks: [
        "Alçı sıva, alt yüzey problemi çözme aracı gibi kullanılmamalıdır.",
        "Kuruma ve son kat takvimi birlikte planlanmalıdır.",
        "Yüzey düzgünlüğü kadar mahalin nem yükü de dikkate alınmalıdır.",
      ],
      engineeringComment: "Alçı sıvada güzel görünen yüzeyi kalıcı yapan şey, priz hızından çok doğru kalınlık ve doğru kuruma disiplinidir.",
    },
    tools: SIVA_TOOLS,
    equipmentAndMaterials: SIVA_EQUIPMENT,
    mistakes: [
      { wrong: "Alçı sıvayla büyük yüzey bozukluğunu kapatmaya çalışmak.", correct: "Alt yüzey kabulünü önce çözmek." },
      { wrong: "Hız için kuruma sürecini zorlamak.", correct: "Boya takvimini yüzey olgunluğuna göre kurmak." },
      { wrong: "Nemli mahallerde aynı sistemi kullanmak.", correct: "Mahal uygunluğunu baştan sorgulamak." },
      { wrong: "Pürüzsüz görüntüyü kalite için yeterli saymak.", correct: "Kuruluk ve aderansı da doğrulamak." },
      { wrong: "Köşe ve doğrama çevresini son rötuşa bırakmak.", correct: "İnce bitiş detaylarını uygulama sırasında çözmek." },
    ],
    designVsField: [
      "Alçı sıva kağıt üzerinde hızlı ve temiz çözüm gibi görünür; sahada ise en çok disiplin isteyen iç yüzeylerden biridir.",
      "İyi alçı sıva son katı taşır; kötü alçı sıva ise son katı da sorunlu hale getirir.",
    ],
    conclusion: [
      "Alçı sıva doğru alt yüzey, doğru kalınlık ve doğru kuruma ile çok yüksek iç mekan kalitesi üretir. Bu zincirin halkaları zayıf kurulursa pürüzsüz görünen yüzey kısa sürede kusur göstermeye başlar.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["alçı sıva", "TS EN 13914", "boya altı yüzey", "kuruma", "iç mekan sıvası"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/ic-siva"],
  },
  {
    slugPath: "ince-isler/kapi-pencere/dis-kapi",
    kind: "topic",
    quote: "Dış kapı, girişte görülen ilk elemandır; ama asıl görevi güvenlik, sızdırmazlık ve eşik davranışını birlikte yönetmektir.",
    tip: "Dış kapıda en sık hata, ürünü güçlü seçip birleşim detayını zayıf bırakmaktır; su ve hava sorunları çoğu zaman kasadan değil çevresinden çıkar.",
    intro: [
      "Dış kapı sistemi, yapının ana giriş güvenliğini, hava-su kontrolünü ve kullanıcı ilk temasını belirleyen önemli bir doğrama elemanıdır. Çelik, kompozit veya farklı sistemlerle çözülebilir; ancak hangi ürün seçilirse seçilsin montaj ve eşik detayı doğru kurulmadıkça beklenen performans sağlanmaz.",
      "İnşaat mühendisi açısından dış kapı yalnız kanat ve kasa seçimi değildir. Giriş kötü, yağmur suyu davranışı, eşik yüksekliği, ankraj, açılım yönü ve kilit/donanım performansı birlikte çözülmelidir. Özellikle dış ortam etkisine açık girişlerde küçük detay eksikleri hızla su alma ve hava sızıntısı problemine dönüşür.",
    ],
    theory: [
      "Dış kapı performansı güvenlik kadar birleşim kalitesine bağlıdır. Kasa çevresinde yetersiz montaj boşluğu, eksik sızdırmazlık veya hatalı eşik çözümü varsa kapı kanadı ne kadar kaliteli olursa olsun hava ve su davranışı zayıflar.",
      "Kapı eşiği giriş güvenliğiyle su yönetimi arasında kritik bölgedir. Çok yüksek eşik erişimi zorlaştırır; çok düşük ve yanlış çözülen eşik ise yağmur suyunu içeri yönlendirir. Bu nedenle dış kapı detayı tek çizimle geçilemeyecek kadar hassastır.",
      "Sahada ayrıca donanım kalitesi ve fonksiyon testi öne çıkar. Kilit, menteşe, hidrolik veya otomatik kapanma gibi sistemler montaj sonrası hassas ayar ister. Dış kapı montajı yalnız duvara yerleştirme değil, güvenli giriş senaryosunu devreye alma işidir.",
    ],
    ruleTable: [
      {
        parameter: "Güvenlik ve ankraj",
        limitOrRequirement: "Kasa, duvarla güvenli ve dengeli ankraj düzeniyle bağlanmalıdır.",
        reference: "Kapı montaj detayı + saha kalite planı",
        note: "Sert kapı kanadı zayıf ankrajla güvenlik üretmez.",
      },
      {
        parameter: "Su ve hava sızdırmazlığı",
        limitOrRequirement: "Kasa çevresi ile eşik detayında süreklilik sağlanmalıdır.",
        reference: "TS 825 + giriş detayı yaklaşımı",
        note: "Dış kapı birleşimi kabuk performansının parçasıdır.",
      },
      {
        parameter: "Erişim ve eşik",
        limitOrRequirement: "Eşik çözümü güvenlik ile erişimi birlikte karşılamalıdır.",
        reference: "Planlı Alanlar yaklaşımı",
        note: "Su yönetimi nedeniyle erişim kalitesi bozulmamalıdır.",
      },
      {
        parameter: "Fonksiyon ve donanım",
        limitOrRequirement: "Kilitleme, kapanma ve açılım sistemi teslim öncesi test edilmelidir.",
        reference: "Saha kabul ve işletme planı",
        note: "Çalışmayan donanım güçlü kapıyı değersizleştirir.",
      },
    ],
    designOrApplicationSteps: [
      "Giriş kötü, sundurma/saçak etkisi ve su yönünü dış kapı detayıyla birlikte değerlendir.",
      "Kaba boşluk ve kasa payını montaj öncesi yeniden ölç; ankraj noktalarını rastgele belirleme.",
      "Eşik, denizlik ve çevre sızdırmazlık katmanlarını tek sistem mantığıyla uygula.",
      "Kilitleme, kapatma kuvveti ve kanat ayarlarını montaj bitiminde test et.",
      "Teslim öncesi dıştan su davranışını ve içten hava sızıntısını kontrol et.",
    ],
    criticalChecks: [
      "Kasa çevresi dengeli montaj boşluğu ve güçlü ankrajla kuruldu mu?",
      "Eşik detayı suyu içeri değil dışarı yönlendiriyor mu?",
      "Kapı kanadı sürtmeden ve dengeli kapanıyor mu?",
      "Kilit ve donanım sistemi gerçek kullanım senaryosunda test edildi mi?",
      "Kapı çevresinde ısı köprüsü veya hava kaçağı riski kaldı mı?",
    ],
    numericalExample: {
      title: "Dış kapı eşik kötü için hızlı yorum",
      inputs: [
        { label: "Dış sahanlık kötü", value: "+0,00", note: "Giriş önü zemin kötü" },
        { label: "İç zemin kötü", value: "+0,03 m", note: "Örnek 3 cm iç yükselti" },
        { label: "Kapı eşiği çözümü", value: "kontrollü geçiş ve sızdırmazlık", note: "Su davranışına bağlı" },
        { label: "Hedef", value: "Su girişi olmadan erişilebilir giriş", note: "Giriş kalitesi" },
      ],
      assumptions: [
        "Giriş önünde yağmur suyu birikmeyecek şekilde saha eğimi sağlanacaktır.",
        "Kapı altında uygun contalı eşik sistemi kullanılacaktır.",
        "Saçak veya giriş koruması sınırlı destek sağlar; ana çözüm detaydadır.",
      ],
      steps: [
        {
          title: "Kot farkını yorumla",
          result: "3 cm iç yükselti, eşik ve su davranışı için çalışılabilir bir tampon sağlar.",
          note: "Bu tampon erişim ve su yönetimi birlikte düşünülerek detaylandırılmalıdır.",
        },
        {
          title: "Detay kararını ver",
          result: "Dış saha eğimi ve kapı altı contası birlikte çözülmezse küçük kot farkı yeterli olmayabilir.",
          note: "Eşik tek başına değil giriş çevresiyle birlikte çalışır.",
        },
      ],
      checks: [
        "Eşik kötü dış saha eğimiyle birlikte değerlendirilmelidir.",
        "Kapı altı contası ve birleşim detayları saha testine tabi tutulmalıdır.",
        "Güvenlik ve erişim kriterleri birlikte düşünülmelidir.",
      ],
      engineeringComment: "Dış kapıda güvenli görünen giriş, çoğu zaman iyi çözülmüş birkaç santimetrelik eşik ve su detayıyla mümkün olur.",
    },
    tools: KAPI_TOOLS,
    equipmentAndMaterials: KAPI_EQUIPMENT,
    mistakes: [
      { wrong: "Dış kapı performansını yalnız kanat malzemesine bağlamak.", correct: "Montaj ve eşik detayını sistemin parçası görmek." },
      { wrong: "Sızdırmazlığı yalnız silikonla çözmek.", correct: "Bant, köpük, mastik ve eşik sistemini birlikte kullanmak." },
      { wrong: "Giriş kotunu kapı montajından bağımsız düşünmek.", correct: "Dış saha su davranışıyla birlikte çözmek." },
      { wrong: "Kilitleme ve kapanma ayarını teslim sonrasına bırakmak.", correct: "Montajın son aşamasında test etmek." },
      { wrong: "Güçlü kasa için yeterli ankraj bırakmamak.", correct: "Bağlantı düzenini güvenlik kriteri saymak." },
    ],
    designVsField: [
      "Dış kapı katalogda güvenlik ürünüdür; sahada ise su, hava ve kullanıcı deneyimini aynı anda yöneten giriş detayına dönüşür.",
      "İyi dış kapı kendini sorun çıkarmadan belli eder. Kötü dış kapı ise ilk yağmurda veya ilk zor kapanmada gerçek kalitesini ortaya koyar.",
    ],
    conclusion: [
      "Dış kapı sistemi doğru ürün kadar doğru eşik, doğru ankraj ve doğru sızdırmazlıkla çalışır. Bu üçlü zayıf kurulduğunda giriş performansı hızla düşer.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar],
    keywords: ["dış kapı", "giriş detayı", "eşik", "sızdırmazlık", "kapı ankrajı"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/pencere"],
  },
  {
    slugPath: "ince-isler/kapi-pencere/ic-kapi",
    kind: "topic",
    quote: "İç kapı, taşıyıcı olmayan basit bir eleman gibi görünür; ama günlük kullanım kalitesini her gün sessizce belirler.",
    tip: "İç kapıda en sık hata, kasayı bitmiş duvara göre değil kaba açıklığa göre zorlamaktır; sonuç sürten kanat, çatlayan pervaz ve zayıf detay olur.",
    intro: [
      "İç kapı sistemi, mahaller arası geçiş, mahremiyet, akustik ve dolaşım kalitesini belirleyen temel iç mekan doğrama elemanıdır. Hafif bir iş gibi algılansa da kullanıcı tarafından en sık dokunulan ve en sık test edilen yapı bileşenlerinden biridir. Bu nedenle küçük montaj hataları çok hızlı fark edilir.",
      "İnşaat mühendisi için iç kapı, yalnız mobilya montajı değildir. Kasa boşluğu, bitmiş döşeme kötü, süpürgelik ilişkisi, menteşe doğruluğu, kilit dili ve duvar kalınlığı uyumu birlikte değerlendirilmelidir. Özellikle bitmiş sıva ve kaplama toleranslarıyla kapı kasası arasındaki ilişki düzgün kurulmazsa estetik ve fonksiyon bir arada bozulur.",
    ],
    theory: [
      "İç kapı performansı esas olarak geometri ve donanım davranışına bağlıdır. Kasa şakülden saparsa kanat sürter; diyagonal bozuksa kapı kendi kendine açılır veya kapanır; menteşe ayarı zayıfsa kısa sürede sarkma oluşur. Yani iç kapının kalitesi büyük ölçüde ölçü ve ayar disiplinidir.",
      "Ayrıca kapı, bitmiş mekan yüzeyleri arasında bir geçiş elemanıdır. Süpürgelik, duvar boyası, zemin kaplaması ve eşik kararı kapıyla birlikte düşünülmelidir. Sonradan uydurulan pervaz veya yanlış eşik, iç mekan kalitesini hızla düşürür.",
      "Akustik ve gizlilik de bazı mahallerde önemlidir. Oda kapıları, ofis bölmeleri veya ıslak hacim kapıları aynı donanım ve boşluk davranışını istemez. Bu yüzden iç kapı seçimi yalnız görünüş değil, mekan fonksiyonuyla birlikte yapılmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Kasa doğruluğu",
        limitOrRequirement: "Kasa şakül, gönye ve diyagonal doğrulukla monte edilmelidir.",
        reference: "Saha montaj disiplini",
        note: "İç kapıdaki fonksiyon kusuru çoğu zaman geometri hatasından doğar.",
      },
      {
        parameter: "Bitmiş yüzey uyumu",
        limitOrRequirement: "Kapı kasası sıva, zemin ve süpürgelik kalınlıklarıyla uyumlu yerleşmelidir.",
        reference: "Mahal bitiş paftası",
        note: "Bitmiş yüzeyler dikkate alınmadan yapılan montaj sonradan sorun üretir.",
      },
      {
        parameter: "Donanım ve kullanım",
        limitOrRequirement: "Menteşe, kilit ve kapı kolu gerçek kullanım yüküne uygun seçilmelidir.",
        reference: "Mahal kullanım matrisi",
        note: "Yoğun kullanım alanı ile konut odası aynı davranışı istemez.",
      },
      {
        parameter: "Fonksiyon testi",
        limitOrRequirement: "Açılma-kapanma, dil çalışma ve boşluk kontrolü teslim öncesi yapılmalıdır.",
        reference: "Saha kabul planı",
        note: "İyi görünen ama sürten kapı kabul edilmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Bitmiş duvar ve döşeme kalınlıklarını dikkate alarak net kasa açıklığını doğrula.",
      "Kasayı şakül ve diyagonal kontrolüyle yerine al; montajı köpüğe bırakma.",
      "Süpürgelik, pervaz ve eşik ilişkisini kapı montajıyla aynı aşamada çöz.",
      "Kanat, menteşe ve kilit ayarlarını kapı takıldıktan sonra gerçek kullanımda test et.",
      "Teslim öncesi tüm kapıları mahal bazında açılma-kapanma ve görünüm açısından dolaşarak kontrol et.",
    ],
    criticalChecks: [
      "Kasa şakül ve diyagonal değerleri fonksiyonel seviyede mi?",
      "Kanat altı ve yan boşluklar eşit dağılıyor mu?",
      "Süpürgelik ve pervaz birleşimleri temiz mi?",
      "Kilitleme ve kapı kolu rahat çalışıyor mu?",
      "Kapı türü mahal kullanım senaryosuna uygun mu?",
    ],
    numericalExample: {
      title: "İç kapı boşluk kontrolü yorumu",
      inputs: [
        { label: "Kapı kanat ölçüsü", value: "90 x 210 cm", note: "Tek kanat oda kapısı" },
        { label: "Ölçülen üst boşluk", value: "3 mm", note: "Örnek saha ölçümü" },
        { label: "Sol-sağ yan boşluk", value: "2 mm / 5 mm", note: "Dengesiz örnek durum" },
        { label: "Hedef", value: "Dengeli çalışma boşluğu", note: "Fonksiyon kalitesi" },
      ],
      assumptions: [
        "Zemin kaplaması ve süpürgelik tamamlanmıştır.",
        "Menteşe ayarı yapılabilir durumdadır.",
        "Kapı kasası büyük montaj hatası taşımamaktadır.",
      ],
      steps: [
        {
          title: "Boşluk dengesini yorumla",
          result: "2 mm / 5 mm yan boşluk, kasanın veya kanadın ayar istediğini gösterir.",
          note: "İç kapıda görsel kalite kadar boşluk dengesi de fonksiyon sonucudur.",
        },
        {
          title: "Montaj kararını ver",
          result: "Menteşe ayarı ve gerekirse kasa doğrulaması yapılmadan kapı kabul edilmemelidir.",
          note: "Boşluk farkı sürtme ve kilit çalışma sorununa dönebilir.",
        },
      ],
      checks: [
        "Kapı boşlukları yalnız görünüm için değil sürtme riskine karşı da kontrol edilmelidir.",
        "Bitmiş döşeme kötü kapı altı boşluk kararına dahil edilmelidir.",
        "Pervaz-temizlik kalitesi fonksiyon testinden ayrı düşünülmemelidir.",
      ],
      engineeringComment: "İç kapının kalitesi çoğu zaman ilk bakışta değil, günde onlarca kez sorunsuz açılıp kapanmasında anlaşılır.",
    },
    tools: KAPI_TOOLS,
    equipmentAndMaterials: KAPI_EQUIPMENT,
    mistakes: [
      { wrong: "Kasayı yalnız kaba açıklığa göre zorlayarak yerleştirmek.", correct: "Bitmiş yüzey ve şakül kontrolüyle monte etmek." },
      { wrong: "Köpüğü taşıyıcı çözüm gibi görmek.", correct: "Ankraj ve takoz düzeniyle kasayı mekanik olarak sabitlemek." },
      { wrong: "Süpürgelik ve pervaz ilişkisini sonradan çözmek.", correct: "Kapı montajıyla birlikte planlamak." },
      { wrong: "Menteşe ve kilit ayarını küçük kusur saymak.", correct: "Fonksiyon testini kabul kriteri yapmak." },
      { wrong: "Tüm iç kapıları aynı donanımla çözmek.", correct: "Mahal kullanımına göre donanım ve detay seçmek." },
    ],
    designVsField: [
      "İç kapı çizimde basit bir açıklık kapanışı gibi durur; sahada ise mekan kalitesini her gün tekrar tekrar test eden detaylı bir birleşime dönüşür.",
      "İyi iç kapı dikkat çekmez; kötü iç kapı ise her kullanımda sürter, ses yapar veya estetik kusur üretir.",
    ],
    conclusion: [
      "İç kapı sistemi doğru geometri, doğru bitiş ve doğru donanımla uzun süre sorunsuz çalışır. Bu zincirin herhangi bir halkası zayıfsa, küçük görünen kusur günlük kullanımda büyür.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.planliAlanlar],
    keywords: ["iç kapı", "kapı kasası", "şakül", "pervaz", "kapı fonksiyon testi"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/dis-kapi"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/membran-cati",
    kind: "topic",
    quote: "Membran çatı, düz görünen yüzeyde suyu görünmez biçimde yöneten bir sistemdir; başarısı membranda değil katman sürekliliğindedir.",
    tip: "Membran çatıda en sık hata, su yalıtımını tek katman sanmaktır; oysa eğim, alt hazırlık, dönüş detayları ve koruma katmanı birlikte çalışır.",
    intro: [
      "Membran çatı sistemi, teras ve düşük eğimli çatılarda su geçirimsizlik sağlamak için kullanılan temel çatı kaplama çözümüdür. Görünüşte düz ve sade bir yüzey bırakır; fakat bu sadeliğin arkasında çok hassas bir geometri ve detay disiplini vardır. Çünkü bu sistemde suyu yönlendiren şey yüksek eğim değil, santimetre seviyesindeki katman doğruluğudur.",
      "İnşaat mühendisi açısından membran çatı, yalnız rulonun serilmesi değildir. Eğim betonu, süzgeç kötü, parapet dönüşü, dilatasyon, mekanik ekipman ayakları ve koruma katmanı birlikte ele alınmalıdır. Membran sistemlerin çoğu ana yüzeyde değil, detay düğümlerinde başarısız olur.",
    ],
    theory: [
      "Membran çatı performansı, suyu yüzeyde bekletmeden güvenli tahliye etmeye dayanır. Bu nedenle eğim katmanı, süzgeç yerleşimi ve su yönü sistemin kalbidir. Membran kaliteli olsa bile su uzun süre yanlış noktada bekliyorsa yaşlanma ve detay zorlanması hızla artar.",
      "Parapet dönüşleri, köşe detayları, süzgeç çevresi ve ekipman geçişleri en kritik bölgelerdir. Ana yüzey kusursuz görünse bile bu noktalarda eksik bindirme, keskin dönüş veya zayıf koruma varsa sistem arıza verir. Bu yüzden membran çatı, yüzey işinden çok detay yönetimidir.",
      "Ayrıca mekanik koruma ve bakım da düşünülmelidir. Membran üstü dolaşım, klima ayakları veya güneş paneli taşıyıcıları sonradan kontrolsüz eklenirse bütün su yalıtım mantığı bozulur. İyi membran çatı, gelecekteki müdahaleyi de bugünden öngörür.",
    ],
    ruleTable: [
      {
        parameter: "Eğim ve tahliye",
        limitOrRequirement: "Yüzey suyu süzgeç veya tahliye hattına güvenli eğimle yönlendirilmelidir.",
        reference: "TS 825 + saha çatı detay disiplini",
        note: "Düz görünen teras çatıda bile su geometrisi ölçüyle kurulmalıdır.",
      },
      {
        parameter: "Katman sürekliliği",
        limitOrRequirement: "Astar, membran, bindirme ve koruma katmanı kesintisiz çözülmelidir.",
        reference: "Sistem uygulama planı",
        note: "Membran tek başına değil tüm katman zinciriyle çalışır.",
      },
      {
        parameter: "Parapet ve geçiş detayları",
        limitOrRequirement: "Köşe, parapet, süzgeç ve ekipman geçişleri özel detay olarak ele alınmalıdır.",
        reference: "Çatı detay paftası",
        note: "Arızalar çoğu zaman düz yüzeyde değil düğüm noktalarında başlar.",
      },
      {
        parameter: "Koruma ve bakım",
        limitOrRequirement: "Membran yüzeyi bakım ve mekanik darbelere karşı korunmalıdır.",
        reference: "İşletme ve bakım yaklaşımı",
        note: "Korumasız membran erken hasara açıktır.",
      },
    ],
    designOrApplicationSteps: [
      "Süzgeç yerlerini ve teras eğimini membran uygulamasından önce sayısal olarak doğrula.",
      "Alt yüzeyi temiz, kuru ve keskin çıkıntılardan arındırılmış şekilde hazırla.",
      "Parapet dönüşleri, köşe detayları ve ekipman ayaklarını ana yüzeyle aynı aşamada çöz.",
      "Bindirme ve katman sürekliliğini uygulama boyunca kayıt altına al.",
      "Koruma katmanı ve bakım yürüyüşünü planlayarak membran yüzeyini teslim et.",
    ],
    criticalChecks: [
      "Süzgeç kötü gerçekten en düşük noktayı oluşturuyor mu?",
      "Bindirmeler ve köşe dönüşleri sistem kurallarına uygun mu?",
      "Parapet diplerinde ve köşelerde zorlanan veya açık kalan bölge var mı?",
      "Mekanik ekipman ayakları membranı zedeleyecek şekilde mi çözülmüş?",
      "Koruma katmanı olmadan membran erken kullanıma açıldı mı?",
    ],
    numericalExample: {
      title: "10 m teras hattında eğim yorumu",
      inputs: [
        { label: "Yüzey boyu", value: "10 m", note: "Tek yöne süzgece akan hat" },
        { label: "Örnek hedef eğim", value: "%2", note: "Teras çatı saha kabulü" },
        { label: "Gerekli kot farkı", value: "20 cm", note: "10 x 0,02" },
        { label: "Hedef", value: "Göllenmesiz tahliye", note: "Membran ömrünü korumak" },
      ],
      assumptions: [
        "Eğim katmanı membran öncesi uygulanacaktır.",
        "Süzgeç yeri sabittir ve çevre detayı ayrıca güçlendirilecektir.",
        "Parapet dönüşleri bu geometriyi bozmayacak şekilde planlanmıştır.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "10 x 0,02 = 0,20 m",
          result: "Yaklaşık 20 cm kot farkı gerekir.",
          note: "Düz görünen teras yüzeyi, aslında ciddi bir geometri yönetimi ister.",
        },
        {
          title: "Detay riskini yorumla",
          result: "Ana yüzey eğimi doğru olsa bile süzgeç ve parapet detayları hatalıysa su yine sorun çıkarır.",
          note: "Membran çatıda ana yüzey kadar düğüm noktası da kritiktir.",
        },
      ],
      checks: [
        "Eğim sahada nivo ile teyit edilmelidir.",
        "Süzgeç çevresi lokal çukur veya ters eğim bırakmamalıdır.",
        "Koruma ve bakım stratejisi membran uygulaması kadar önemlidir.",
      ],
      engineeringComment: "Membran çatıda başarı suyu durdurmakta değil, onu doğru yerden doğru hızla uzaklaştırmaktadır.",
    },
    tools: CATI_MORE_TOOLS,
    equipmentAndMaterials: CATI_MORE_EQUIPMENT,
    mistakes: [
      { wrong: "Membranı tek başına çözüm sanmak.", correct: "Eğim, detay ve koruma katmanıyla birlikte değerlendirmek." },
      { wrong: "Süzgeç kotunu saha sonunda ayarlamak.", correct: "En düşük noktayı baştan tanımlamak." },
      { wrong: "Parapet dönüşlerini standart yüzey gibi uygulamak.", correct: "Detay düğümü olarak özel çözmek." },
      { wrong: "Membran üstü trafiği kontrolsüz bırakmak.", correct: "Koruma ve bakım yolunu planlamak." },
      { wrong: "Mekanik ekipman ayaklarını sonradan delerek eklemek.", correct: "Geçiş detaylarını başlangıçta çözmek." },
    ],
    designVsField: [
      "Membran çatı projede düz bir yüzey gibi görünür; sahada ise her süzgeç, her köşe ve her parapet dönüşü ayrı kalite noktasıdır.",
      "İyi membran çatı sessiz çalışır. Kötü membran çatı ise ilk yoğun yağışta göllenme ve sızıntıyla kendini anlatır.",
    ],
    conclusion: [
      "Membran çatı doğru eğim, doğru detay ve doğru koruma ile uzun ömürlü olur. Bu zincirin bir halkası eksik bırakıldığında su, sistemin en zayıf noktasını hızla bulur.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["membran çatı", "teras çatı", "süzgeç kötü", "bindirme", "su yalıtımı"],
    relatedPaths: ["ince-isler", "ince-isler/cati-kaplamasi", "ince-isler/cati-kaplamasi/metal-cati"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/metal-cati",
    kind: "topic",
    quote: "Metal çatı, hafif ve hızlı bir sistemdir; ama bu hız ancak doğru doğrultu, doğru bindirme ve doğru sabitlemeyle güvenli olur.",
    tip: "Metal çatıda en sık hata, panel montajını atölye doğruluğuna bırakmaktır; sahadaki eksen, klips ve bindirme hatası doğrudan su ve rüzgar sorununa döner.",
    intro: [
      "Metal çatı kaplaması; geniş açıklıklı yapılarda, sanayi binalarında ve hafif sistem istenen çatılarda tercih edilen hızlı montajlı kaplama çözümüdür. Panel veya kenet sistem olarak uygulanabilir. Görsel olarak temiz ve modern bir yüzey üretir; fakat bu yüzeyin güvenli çalışabilmesi, montaj toleranslarının ciddiyetle yönetilmesine bağlıdır.",
      "İnşaat mühendisi için metal çatı yalnız panel siparişi değildir. Alt taşıyıcı doğrultusu, panel boyu, bindirme, sabitleme, hareket payı, dere ve mahya detayları birlikte değerlendirilmelidir. Hızlı montaj avantajı, saha kontrolü zayıfsa aynı hızla probleme dönüşebilir.",
    ],
    theory: [
      "Metal çatı sistemlerinde performans; suyu yüzeyde hızlı yönlendirmek, rüzgar etkisine karşı panelleri güvenli tutmak ve termal hareketlere izin vermek üzerine kuruludur. Bu üç davranıştan biri ihmal edilirse sistem ya gürültü üretir, ya sızdırır ya da bağlantı noktalarında zayıflar.",
      "Bindirme ve sabitleme bölgeleri metal çatının en kritik hatlarıdır. Panel geniş yüzeyi kusursuz görünse bile klips, vida ve kenet davranışı yeterli değilse rüzgar altında titreşim ve su girişi görülebilir. Bu nedenle metal çatıda ayrıntılar, yüzeyden daha belirleyicidir.",
      "Ayrıca yoğuşma ve bakım da dikkate alınmalıdır. Isı farkı yüksek yapılarda alt katman ve buhar davranışı doğru çözülmezse metal çatı iç yüzünde yoğuşma oluşabilir. Bu yüzden sistem seçimi yalnız üst kaplamadan ibaret değildir.",
    ],
    ruleTable: [
      {
        parameter: "Doğrultu ve bindirme",
        limitOrRequirement: "Panel doğrultusu ve bindirmeler suyu kesintisiz yönlendirecek biçimde kurulmalıdır.",
        reference: "Çatı detay paftası",
        note: "Sahadaki küçük eksen hatası uzun hat boyunca büyür.",
      },
      {
        parameter: "Sabitleme ve rüzgar",
        limitOrRequirement: "Vida/klips düzeni rüzgar etkisine uygun tamamlanmalıdır.",
        reference: "Sistem montaj ve saha kalite planı",
        note: "Eksik sabitleme hafif sistemde kritik risktir.",
      },
      {
        parameter: "Alt katman ve yoğuşma",
        limitOrRequirement: "Alt taşıyıcı ve yardımcı katmanlar yoğuşma riskini sınırlayacak biçimde çözülmelidir.",
        reference: "TS 825 + enerji performansı yaklaşımı",
        note: "Metal yüzey tek başına kabuk performansını tamamlamaz.",
      },
      {
        parameter: "Mahya, dere ve kenar detayları",
        limitOrRequirement: "Özel detay bölgeleri sistem parçalarıyla birlikte tamamlanmalıdır.",
        reference: "Çatı birleşim disiplini",
        note: "Arıza çoğu zaman panel ortasında değil özel düğümlerde çıkar.",
      },
    ],
    designOrApplicationSteps: [
      "Alt taşıyıcı doğrultusunu ve panel modülünü montaj öncesi kontrol ederek işe başla.",
      "Panel bindirmelerini, mahya ve dere detaylarıyla birlikte sistemli sırada ilerlet.",
      "Vida veya klips düzenini rüzgar alan kenar bölgelerde ayrıca güçlendir.",
      "Yoğuşma ve su davranışı için alt katman sürekliliğini montaj boyunca denetle.",
      "Teslim öncesi gevşek bağlantı, ters bindirme ve detay düğümlerini çatı turuyla kontrol et.",
    ],
    criticalChecks: [
      "Panel doğrultusu hat boyunca eksen kaçıklığı gösteriyor mu?",
      "Bindirmeler ve sabitlemeler sistem kurallarına göre tamamlandı mı?",
      "Kenar ve saçak bölgelerde rüzgar açısından zayıf alan kaldı mı?",
      "Mahya, dere ve baca çevresi detayları güvenli mi?",
      "Alt katman ve yoğuşma kontrolü ihmal edilmiş bölge var mı?",
    ],
    numericalExample: {
      title: "18 m panel hattında bindirme ve hareket yorumu",
      inputs: [
        { label: "Çatı hattı uzunluğu", value: "18 m", note: "Panel akış doğrultusu" },
        { label: "Panel sistem tipi", value: "Kenet / panel sistem", note: "Örnek saha kurgusu" },
        { label: "Kritik konu", value: "bindirme ve sabitleme", note: "Uzun hatta tolerans büyür" },
        { label: "Hedef", value: "Su ve rüzgar güvenli hat", note: "Uzun açıklık davranışı" },
      ],
      assumptions: [
        "Alt taşıyıcı hat doğrultusu uygundur.",
        "Panel boyu ve ek kararı sistem üreticisine göre belirlenmiştir.",
        "Kenar bölgelerde rüzgar etkisi ayrıca dikkate alınacaktır.",
      ],
      steps: [
        {
          title: "Uzun hat riskini yorumla",
          result: "18 m gibi uzun bir hatta küçük doğrultu veya bindirme hataları büyüyerek görünür hale gelir.",
          note: "Bu nedenle ilk panel doğruluğu tüm yüzey için referans kabul edilmelidir.",
        },
        {
          title: "Sabitleme kararını ver",
          result: "Özellikle kenar bölgelerde standart ritim yerine güçlendirilmiş sabitleme gerekebilir.",
          note: "Hafif sistemde bağlantı kalitesi yüzey kadar kritiktir.",
        },
      ],
      checks: [
        "İlk panel hattı sahada tekrar tekrar doğrulanmalıdır.",
        "Uzun yüzeylerde kenar bölge davranışı ayrıca değerlendirilmelidir.",
        "Metal çatı montajı hız için toleranstan taviz vermemelidir.",
      ],
      engineeringComment: "Metal çatı hızlıdır; ama güven veren hız, hızlı panel koymaktan değil hattı hızlı ve doğru stabilize etmekten gelir.",
    },
    tools: CATI_MORE_TOOLS,
    equipmentAndMaterials: CATI_MORE_EQUIPMENT,
    mistakes: [
      { wrong: "İlk panel doğrultusunu gevşek almak.", correct: "İlk hattı tüm yüzey için referans seviyede kurmak." },
      { wrong: "Bindirme ve kenet detaylarını sahada doğaçlamak.", correct: "Sistem parçasına uygun sıralı montaj yapmak." },
      { wrong: "Kenar bölgelerde sabitlemeyi azaltmak.", correct: "Rüzgar yükünü kritik bölgede artırılmış ciddiyetle ele almak." },
      { wrong: "Yoğuşma riskini yalnız üst kaplamayla çözmeye çalışmak.", correct: "Alt katman ve kabuk davranışını birlikte düşünmek." },
      { wrong: "Teslim öncesi çatı turunu atlamak.", correct: "Tüm detay düğümlerini gözle ve elle kontrol etmek." },
    ],
    designVsField: [
      "Metal çatı projede temiz çizgiler ve düzgün panellerle görünür; sahada ise gerçek kalite sabitleme, bindirme ve kenar detayında ortaya çıkar.",
      "İyi metal çatı hafif, hızlı ve güvenli bir kabuk üretir. Kötü metal çatı ise rüzgarla ses yapar, yağışla su alır.",
    ],
    conclusion: [
      "Metal çatı sistemi doğru doğrultu, doğru sabitleme ve doğru yoğuşma yönetimiyle çok verimli bir çözüm sunar. Bu kararlar zayıfsa hafiflik avantajı hızla yapısal ve işletmesel riske dönüşür.",
    ],
    sources: [...INCE_MORE_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["metal çatı", "panel çatı", "bindirme", "rüzgar sabitlemesi", "yoğuşma"],
    relatedPaths: ["ince-isler", "ince-isler/cati-kaplamasi", "ince-isler/cati-kaplamasi/membran-cati"],
  },
];
