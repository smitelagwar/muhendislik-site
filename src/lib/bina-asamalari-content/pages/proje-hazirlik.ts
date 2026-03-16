import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJECT_TOOLS: BinaGuideTool[] = [
  { category: "Çizim", name: "AutoCAD", purpose: "Pafta seti, detay çizimi ve disiplinler arası overlay kontrolü." },
  { category: "BIM", name: "Revit", purpose: "Mimari, statik ve MEP çakışmalarını model üzerinde erken yakalamak." },
  { category: "Analiz", name: "İdecad Statik", purpose: "Taşıyıcı sistem hesabı ile çizim setinin birbiriyle tutarlı ilerlemesini sağlamak." },
  { category: "Kontrol", name: "Excel / Python şablonları", purpose: "Revizyon listesi, mahal matrisi ve pafta karşılaştırma tabloları üretmek." },
];

const getProjeExtraSpecs = (): BinaGuidePageSpec[] => [
  {
    slugPath: "proje-hazirlik/elektrik-projesi",
    kind: "topic",
    quote: "Elektrik projesi, kablonun nereye gideceğini değil; enerjinin binada nasıl güvenli yaşayacağını tarif eder.",
    tip: "Pano gücü, tava güzergahı ve zayıf akım rezervleri aynı anda düşünülmezse sahada tavanlar ve şaftlar tekrar açılır.",
    intro: [
      "Elektrik projesi, enerji dağıtımının sadece çalışır olmasını değil; yangın güvenliği, bakım erişimi, seçicilik ve ilerideki genişleme ihtimalini de birlikte ele alır.",
      "Bir binada kablolama, zayıf akım, aydınlatma, topraklama ve pano yerleşimi mimariden ayrı düşünüldüğünde en sık görülen sorun; sonradan kırılan şaft kapakları, daraltılan asma tavanlar ve etiketlenmemiş devrelerdir.",
    ],
    theory: [
      "Elektrik projesi hacimsel bir koordinasyon problemidir. Tava ve boru güzergahları, pano nişleri, UPS veya jeneratör bağlantıları ve zayıf akım sonlandırma noktaları mimari geometriye fiziksel olarak sığmalıdır.",
      "Ayrıca koruma mantığı da proje aşamasında kurulmalıdır. Kaçak akım koruması, seçicilik, topraklama sürekliliği ve pano etiketleme düzeni ancak uygulama projesi netse sahada güvenle kurulur.",
      "Bu nedenle elektrik projesi, bir yük listesi kadar bir işletme ve bakım belgesidir.",
    ],
    ruleTable: [
      {
        parameter: "Alçak gerilim kurulum esasları",
        limitOrRequirement: "Koruma, kablolama ve devre ayırımı tasarım aşamasında tanımlanmalı",
        reference: "TS HD 60364",
        note: "Sahada yorumla tamamlanan sistemlerde seçicilik ve güvenlik zayıflar.",
      },
      {
        parameter: "Yangın güvenliği ve geçişler",
        limitOrRequirement: "Yangın bölgeleri ve geçiş detayları yazılı olmalı",
        reference: "Yangın Yönetmeliği",
        note: "Yangın durdurucu uygulanacak geçişler sonradan karar verilecek konu değildir.",
      },
      {
        parameter: "Topraklama ve pano erişimi",
        limitOrRequirement: "Bakım erişimine ve ölçüm düzenine izin vermeli",
        reference: "TS HD 60364",
        note: "Pano önü boşlukları ve topraklama ölçüm mantığı proje notlarında yer almalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Yük listesi ve kullanım senaryosuna göre ana pano ve tali pano düzenini kur.",
      "Tava, boru ve şaft güzergahlarını mekanik sistemlerle aynı model veya overlay üzerinde kilitle.",
      "Aydınlatma, priz, zayıf akım ve yangın algılama devrelerini ayırıp pano şemasına bağla.",
      "Topraklama, eşpotansiyel ve kritik cihaz beslemelerini proje notu olmaktan çıkarıp detay paftaya taşı.",
      "Etiketleme, test ve devreye alma sırasını teslim paketine yaz.",
    ],
    criticalChecks: [
      "Pano nişi ve servis boşlukları mimariye gerçekten sığıyor mu?",
      "Tava güzergahları mekanik askı ve kanal geçişleriyle çakışıyor mu?",
      "Zayıf akım sistemleri için gelecek rezervi ayrıldı mı?",
      "Topraklama noktaları ve test erişimi gösterildi mi?",
      "Pano etiketleme ve devre numaralandırması saha kurulumuna bağlanmış mı?",
    ],
    numericalExample: {
      title: "Kablo tavası doluluk oranı için ön yerleşim kontrolü",
      inputs: [
        { label: "Tava genişliği", value: "300 mm", note: "Ana koridor hattı" },
        { label: "Tava faydalı yüksekliği", value: "60 mm", note: "Tek sıra kablolama kabulü" },
        { label: "Güç kablosu paketi", value: "yaklaşık 8.000 mm²", note: "Tali besleme ve aydınlatma devreleri dahil" },
        { label: "Hedef doluluk", value: "%40-%60", note: "İleride rezerv bırakmak için" },
      ],
      assumptions: [
        "Kuvvetli ve zayıf akım aynı tava yerine ayrı düzende yönetilecektir.",
        "Tava içinde büyüme payı bırakılacaktır.",
        "Dönüşler ve kat geçişlerinde ilave düzen parçaları kullanılacaktır.",
      ],
      steps: [
        {
          title: "Tavanın teorik alanını hesapla",
          formula: "300 x 60 = 18.000 mm²",
          result: "Brüt kesit alanı 18.000 mm²",
          note: "Gerçek kullanılabilir alan, bağlantı ve bükülme etkileriyle daha düşüktür.",
        },
        {
          title: "Doluluk oranını kontrol et",
          formula: "8.000 / 18.000 = 0,44",
          result: "Yaklaşık %44 doluluk",
          note: "Bu oran, ilk kurulum için kabul edilebilir ve rezerv barındırır.",
        },
      ],
      checks: [
        "Doluluk %60'ı aşıyorsa tava genişliği artırılmalı veya hatlar ayrıştırılmalıdır.",
        "Yangın ve acil durum hatları gerekirse ayrı taşınmalıdır.",
        "Etiketleme ve servis erişimi tava yerleşimi kadar önemlidir.",
      ],
      engineeringComment: "Elektrik tesisatında boşluk lüks değil, bakım ve genleşme için zorunlu rezervdir.",
    },
    tools: [
      ...PROJECT_TOOLS,
      { category: "Elektrik", name: "Caneco / benzeri yük hesap aracı", purpose: "Yük, kesit ve pano seçim mantığını doğrulamak." },
      { category: "Kontrol", name: "Excel devre listesi", purpose: "Pano-devre-priz/aydınlatma eşleşmesini takip etmek." },
    ],
    equipmentAndMaterials: [
      ...PROJECT_EQUIPMENT,
      { group: "Test", name: "Megger", purpose: "İzolasyon direnci ölçümleri için kullanılır.", phase: "Devreye alma" },
      { group: "Test", name: "Multimetre ve pensampermetre", purpose: "Gerilim, akım ve devre doğrulaması.", phase: "Devreye alma" },
      { group: "Montaj", name: "Etiketleme seti", purpose: "Pano ve hat tanımlarını kalıcı hale getirmek.", phase: "Son montaj" },
    ],
    mistakes: [
      { wrong: "Tava boyutunu sadece ilk kablo listesine göre belirlemek.", correct: "Büyüme payı ve servis erişimi bırakarak yerleşim yapmak." },
      { wrong: "Pano konumunu mimari boşluk kalırsa yerleştirmek.", correct: "Pano nişini ve servis alanını proje aşamasında tanımlamak." },
      { wrong: "Yangın ve zayıf akım geçişlerini sahada doğaçlamak.", correct: "Geçiş ve durdurucu detaylarını önceden yazmak.", reference: "Yangın Yönetmeliği" },
      { wrong: "Topraklama ve eşpotansiyeli teslim sonunda düşünmek.", correct: "Sistemin başından itibaren pano, cihaz ve metal bileşenleri aynı mantığa bağlamak." },
      { wrong: "Etiketleme planını işletmeye devretmek.", correct: "Kurulum tamamlanır tamamlanmaz devre bazında etiketleme yapmak." },
    ],
    designVsField: [
      "Tasarım tarafında tek hat şemasıyla görünen sistem, sahada tava kesiti, dirsek, yangın geçişi, pano önü boşluğu ve test düzeni ister. Elektrik projesi bu fiziksel gerçekliği taşımadığında uygulama ekipleri birbirini bloke eder.",
      "Bu nedenle elektrik projesi sadece enerji hesabı değil, mekan ve bakım yönetimi belgesidir.",
    ],
    conclusion: [
      "Elektrik projesi erken aşamada olgunlaştırıldığında hem güvenlik hem de tesisat koordinasyonu rahatlar. Sahada en çok zaman kazandıran kararlar, tavalar ve panolar kırılma gerektirmeden yerini bulduğunda alınır.",
    ],
    sources: [...PROJE_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["elektrik projesi", "kablo tavası", "pano tasarımı", "TS HD 60364", "elektrik uygulama projesi"],
  },
  {
    slugPath: "proje-hazirlik/yapi-ruhsati",
    kind: "topic",
    quote: "Yapı ruhsatı, çizimin resmileşmesi değil; sahadaki imalatın hukuki ve teknik sorumluluk çerçevesine girmesidir.",
    tip: "Ruhsat süreci sadece evrak toplama olarak görüldüğünde, saha başlangıcında proje seti ile resmi set arasında tehlikeli kopukluk oluşur.",
    intro: [
      "Yapı ruhsatı, bir binanın imar mevzuatına, proje disiplinine ve idari onay zincirine uygun şekilde sahaya çıkabilmesi için zorunlu eşiktir. Bu aşama yalnızca belediye onayı almak değil; hangi proje takımıyla inşaata başlandığını kayda bağlamaktır.",
      "Teknik ekip açısından ruhsat sürecinin ana değeri, hangi paftaların resmileştiğini, hangi revizyonların sonradan uygulama setine taşınması gerektiğini ve saha sorumluluğunun hangi set üzerinden izleneceğini netleştirmesidir.",
    ],
    theory: [
      "Ruhsat, tasarım olgunluğu ile idari uygunluğun kesişim kümesidir. Bu nedenle mimari uygunluk, taşıyıcı sistem kararı, yangın, enerji ve altyapı kararları aynı teslim mantığına bağlanmalıdır.",
      "Uygulamada en kritik problem, ruhsat setinin yeterli olduğu varsayılarak detay projelerinin geciktirilmesidir. Oysa ruhsat seti çoğu zaman sahadaki detay seviyesini karşılamaz; bu fark teknik ofis tarafından bilinçli yönetilmelidir.",
      "Bu nedenle yapı ruhsatı, proje gelişiminin sonu değil; kontrollü saha başlangıcının resmi başlangıç kaydıdır.",
    ],
    ruleTable: [
      {
        parameter: "Ruhsat başvurusu",
        limitOrRequirement: "Onayı gerektiren proje ve belgeler eksiksiz olmalı",
        reference: "3194 sayılı İmar Kanunu",
        note: "Eksik veya tutarsız setler ruhsat süresini uzatır ve uygulama takvimini etkiler.",
      },
      {
        parameter: "Proje müellifi ve denetim zinciri",
        limitOrRequirement: "Sorumluluklar kayıtlı ve izlenebilir olmalı",
        reference: "4708 sayılı Yapı Denetimi Hakkında Kanun",
        note: "Saha kontrol süreci ruhsat eki belgelerden kopuk yürütülemez.",
      },
      {
        parameter: "Proje seti ve mimari uygunluk",
        limitOrRequirement: "Planlı alan kararları ve idari koşullar sağlanmalı",
        reference: "Planlı Alanlar İmar Yönetmeliği",
        note: "Net/brüt, çekme mesafesi, bağımsız bölüm ve ortak alan kararları tutarlı olmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "İmar durumu, aplikasyon ve arsa verilerini güncel resmi girdilerle netleştir.",
      "Mimari, statik ve tesisat proje setlerini ruhsat başvurusu seviyesinde tutarlı hale getir.",
      "Müelliflik, denetim ve başvuru evrak zincirini eksiksiz dosyala.",
      "Onay sonrası ruhsat eki set ile sahaya gidecek uygulama seti arasındaki farkı teknik ofis kaydına al.",
      "Ruhsat alındıktan sonra uygulama detaylarını yeni revizyon mantığıyla sahaya aktar.",
    ],
    criticalChecks: [
      "Ruhsat eki paftalar ile saha uygulama paftaları arasındaki fark yazılı mı?",
      "Müellif ve denetim sorumluluk zinciri eksiksiz mi?",
      "Belediye veya idareden dönen notlar teknik ofise aktı mı?",
      "Ruhsat setinde çözülmeyen detaylar uygulama setinde ayrıca tamamlandı mı?",
      "Saha başlangıcında geçerli tek referans takım belli mi?",
    ],
    numericalExample: {
      title: "Ruhsat başlangıcı için belge-akış süresi örneği",
      inputs: [
        { label: "Disiplin proje seti", value: "4 ana set", note: "Mimari, statik, mekanik, elektrik" },
        { label: "Resmi kontrol turu", value: "2 tur", note: "İlk başvuru + dönen notların kapanması" },
        { label: "Teknik ofis iç revizyon süresi", value: "5 iş günü", note: "Dönen notların güncellenmesi" },
        { label: "Hedef saha başlangıç tamponu", value: "7 gün", note: "Ruhsat sonrası uygulama seti dağıtımı için" },
      ],
      assumptions: [
        "Resmi kontrol notları aynı gün teknik ofise aktarılacaktır.",
        "Ruhsat eki set ile saha uygulama seti ayrı klasörlerde izlenecektir.",
        "Detay eksikleri ruhsat sonrası programa bilinçli olarak yazılacaktır.",
      ],
      steps: [
        {
          title: "Resmi kontrol çevrimini tanımla",
          formula: "2 tur x ortalama 5 iş günü",
          result: "Yaklaşık 10 iş günü resmi geri dönüş etkisi",
          note: "İdare yoğunluğuna göre artabilir; bu nedenle tampon gerekir.",
        },
        {
          title: "Saha başlangıç tamponunu ekle",
          formula: "10 gün + 5 gün iç revizyon + 7 gün saha dağıtımı",
          result: "En az 22 iş günü planlama bandı",
          note: "Ruhsatı almak ile sahaya sağlıklı başlamak aynı şey değildir.",
        },
      ],
      checks: [
        "Ruhsat takvimi sıfır tamponla kurgulanmamalıdır.",
        "Onay sonrası uygulama seti dağıtımı için ayrı zaman bırakılmalıdır.",
        "Dönen resmi notların pafta ve detay setine işlendiği kayıt altında olmalıdır.",
      ],
      engineeringComment: "Ruhsatın gecikmesi kadar, ruhsat alındıktan sonra sahaya eksik setle çıkmak da takvimi bozar.",
    },
    tools: [
      ...PROJECT_TOOLS,
      { category: "Süreç", name: "Belge takip matrisi", purpose: "Başvuru evrakları, resmi notlar ve kapanış tarihlerini izlemek." },
    ],
    equipmentAndMaterials: [
      ...PROJECT_EQUIPMENT,
      { group: "Doküman", name: "Ruhsat eki arşiv seti", purpose: "Onaylı pafta ve evrakı ayrı klasörde saklamak.", phase: "Başvuru ve saha başlangıcı" },
      { group: "Doküman", name: "Saha uygulama seti dağıtım formu", purpose: "Ruhsat sonrası güncel setin kimlere verildiğini izlemek.", phase: "Saha başlangıcı" },
    ],
    mistakes: [
      { wrong: "Ruhsatı proje gelişiminin sonu kabul etmek.", correct: "Ruhsat sonrası uygulama detaylarını ayrı programla tamamlamak." },
      { wrong: "Ruhsat eki set ile saha setini aynı klasör mantığında karışık tutmak.", correct: "Resmi ve uygulama takımlarını fark takibiyle ayırmak." },
      { wrong: "İdareden dönen notları sadece mail kutusunda bırakmak.", correct: "Tüm teknik notları pafta revizyon sistemine işlemek." },
      { wrong: "Yapı denetim ve saha kontrol zincirini birbirinden koparmak.", correct: "Denetim, ruhsat eki belge ve saha kabulünü aynı kayıtta izlemek.", reference: "4708 sayılı Kanun" },
      { wrong: "Ruhsat alınır alınmaz uygulama hazırlığı olmadan imalata başlamak.", correct: "Sahaya çıkacak güncel teknik seti hazırlamadan başlangıç yapmamak." },
    ],
    designVsField: [
      "Tasarım ofisinde ruhsat, dosya kapanışı gibi görünebilir; sahada ise ruhsat, hangi paftalarla hangi sorumluluk altında başlandığını gösteren ana kayıttır.",
      "Bu nedenle ruhsat süreci hukuki prosedür kadar teknik bir transfer süreci olarak da yönetilmelidir.",
    ],
    conclusion: [
      "Yapı ruhsatı, projenin resmileşmiş ilk eşiğidir. En sağlam uygulama stratejisi, ruhsat setini disiplinli şekilde arşivleyip uygulama setini bunun üzerine bilinçli ve kayıtlı şekilde inşa etmektir.",
    ],
    sources: [...PROJE_SOURCES, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yapiDenetim],
    keywords: ["yapı ruhsatı", "ruhsat süreci", "imar mevzuatı", "uygulama seti", "teknik ofis ruhsat takibi"],
  },
];

const PROJECT_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Total station", purpose: "Aks, kot ve aplikasyon kararlarının sahada doğrulanması.", phase: "Şantiye öncesi" },
  { group: "Ölçüm", name: "Lazer metre", purpose: "Mahal, doğrama boşluğu ve saha gerçek ölçüsünün hızlı kontrolü.", phase: "Uygulama öncesi" },
  { group: "Doküman", name: "Revizyon föyü ve pafta dağıtım listesi", purpose: "Eski paftanın sahada kalmasını engellemek.", phase: "Tüm süreç" },
  { group: "Doküman", name: "Uygulama kontrol klasörü", purpose: "Ruhsat seti, uygulama seti ve as-built farklarını tek yerde izlemek.", phase: "Tüm süreç" },
];

const PROJE_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

export const projeHazirlikSpecs: BinaGuidePageSpec[] = [
  ...getProjeExtraSpecs(),
  {
    slugPath: "proje-hazirlik",
    kind: "branch",
    quote: "İyi proje seti, sahadaki belirsizliği başlamadan azaltan ilk kalite kontrol katmanıdır.",
    tip: "Proje koordinasyonu, çizim üretmek değil; her disiplinin aynı yapı tarifini kullandığından emin olmaktır.",
    intro: [
      "Proje ve izin safhası, sahaya inmeden önce binanın hangi mantıkla kurulacağını netleştirir. Bu aşamada çözülemeyen her çakışma, şantiyede zaman, para ve kalite kaybı olarak geri döner.",
      "Okuyucu bu başlık altında yalnızca proje isimlerini değil; hangi paftanın neyi teslim ettiği, ruhsat ve uygulama setleri arasındaki kritik farklar ile revizyon yönetiminin neden yapı güvenliği kadar önemli olduğunu bulacaktır.",
      "Bu içerik özellikle saha mühendisi, tasarım mühendisi ve teknik ofis ekipleri arasında ortak bir dil kurmak için yazılmıştır.",
    ],
    theory: [
      "Bir bina projesi, mimari paftalardan ibaret değildir. Mimari, statik, mekanik ve elektrik projeleri aynı aks setine, aynı kat kotlarına ve aynı rezervasyon mantığına bağlanmadığında sahada doğru diye tek bir referans kalmaz.",
      "Bu nedenle proje yönetimi teknik bir doküman yönetimi problemidir. Her karar; çizim, hesap, mahal listesi, detay ve imalat sırasıyla birlikte okunmalıdır.",
      "İzin süreçleri de yalnızca bürokratik aşama değildir. Ruhsat eki olarak verilen her belge, uygulama aşamasında yasal ve teknik sorumluluğun parçası haline gelir.",
    ],
    ruleTable: [
      {
        parameter: "Pafta disiplini",
        limitOrRequirement: "Tüm disiplinlerde tek aks ve kot sistemi",
        reference: "Planlı Alanlar İmar Yönetmeliği + TBDY 2018, Bölüm 3",
        note: "Mimari pafta ile statik pafta aynı aks isimlerine bağlanmadan uygulamaya çıkılmamalıdır.",
      },
      {
        parameter: "Taşıyıcı sistem kararları",
        limitOrRequirement: "Mimari ve statik set birbiriyle çakışmamalı",
        reference: "TS 500, Madde 7 ve TBDY 2018, Bölüm 7",
        note: "Kolon, perde ve döşeme delikleri mimari kararlarla birlikte dondurulur.",
      },
      {
        parameter: "Ruhsat eki proje seti",
        limitOrRequirement: "Güncel revizyon ve onaylı takım üzerinden işlem",
        reference: "3194 sayılı İmar Kanunu + 4708 sayılı Kanun",
        note: "Sahaya çıkan takım ile onay takımının farklılaşması doğrudan risk üretir.",
      },
      {
        parameter: "Revizyon yönetimi",
        limitOrRequirement: "Eski pafta sahadan fiziksel olarak çekilmeli",
        reference: "Teknik ofis kalite prosedürü",
        note: "Revizyon listesi yalnızca mail kutusunda tutulursa sahada eski set kullanımı kaçınılmaz olur.",
      },
    ],
    designOrApplicationSteps: [
      "İmar, ruhsat ve işveren girdilerini toplayıp proje hedefini netleştir.",
      "Mimari-pafta aks sistemi ile kat kotlarını ana referans seti olarak sabitle.",
      "Statik, mekanik ve elektrik disiplinlerini aynı boşluk, şaft ve rezervasyon matrisi üzerinde konuştur.",
      "Büyük ölçekte çözülmesi gereken birleşim ve detayları 1/20 ile 1/5 arasında ayrı paftalara taşı.",
      "Uygulama seti çıkmadan önce revizyon listesi, mahal listesi ve pafta dağıtım tablosunu kilitle.",
      "Saha geri bildirimi geldikçe as-built mantığında tek güncel versiyonu yönet.",
    ],
    criticalChecks: [
      "Aks ve kot isimleri disiplin paftalarında birebir aynı mı?",
      "Şaft, baca, tesisat geçişi ve döşeme deliği kararları statik öncesi kapanmış mı?",
      "Ruhsat seti ile uygulama seti arasındaki fark kayıt altına alınmış mı?",
      "Revizyon tarihi, pafta numarası ve dağıtım listesi sahada izlenebiliyor mu?",
      "Mahal listesi, kapı/pencere çizelgesi ve detay paftaları arasında kopukluk var mı?",
    ],
    numericalExample: {
      title: "6 disiplinli konut projesinde revizyon çevrimi örneği",
      inputs: [
        { label: "Disiplin sayısı", value: "6 adet", note: "Mimari, statik, mekanik, elektrik, altyapı, peyzaj" },
        { label: "Toplam aktif pafta", value: "58 adet", note: "Onay sonrası uygulama seti" },
        { label: "Kritik çakışma noktası", value: "14 adet", note: "Şaft, döşeme deliği, pano nişi, baca ve kolon-perde kesişimi" },
        { label: "Revizyon hedef süresi", value: "72 saat", note: "Tek setten yeni dağıtım için üst sınır" },
      ],
      assumptions: [
        "Saha aplikasyonu başlamadan önce güncel tek set üretilecektir.",
        "Her kritik çakışma en az iki disiplin paftasında karşılık bulacaktır.",
        "Dağıtım, revizyon föyü ile fiziksel ve dijital olarak eşlenecektir.",
      ],
      steps: [
        {
          title: "Kritik pafta yoğunluğunu belirle",
          formula: "58 pafta / 14 çakışma noktası",
          result: "Her kritik karar ortalama 4-5 paftayı etkiler.",
          note: "Bu oran, revizyonun tek paftada kalmadığını gösterir.",
        },
        {
          title: "Revizyon çevrim süresini dağıt",
          formula: "72 saat = 24 saat koordinasyon + 24 saat çizim + 24 saat dağıtım",
          result: "Revizyon süresi parçalanmadan yönetildiğinde gecikme kontrol edilir.",
          note: "Saha başlayacaksa bu süre daha da aşağı çekilmelidir.",
        },
        {
          title: "Saha riski etkisini hesapla",
          formula: "14 çakışmanın %30'u sahaya taşınırsa ≈ 4 kritik imalat duruşu",
          result: "Erken proje koordinasyonu doğrudan şantiye sürekliliğini etkiler.",
          note: "Duraksayan her imalat kalemi zincirleme ekip kaydırması üretir.",
        },
      ],
      checks: [
        "Revizyon çevrimi 72 saatin üzerine çıkıyorsa proje ofisi-saha koordinasyonu zayıf kabul edilir.",
        "Aynı karar iki farklı paftada iki farklı ölçüyle görünüyorsa sahaya çıkış durdurulmalıdır.",
        "Kritik çakışmalar çözüldüğünde yeni set saha tarafından imza karşılığı teslim alınmalıdır.",
      ],
      engineeringComment: "Revizyon hızı tek başına başarı ölçütü değildir; önemli olan, sahada tek ve güvenilir teknik gerçeklik bırakmaktır.",
    },
    tools: PROJECT_TOOLS,
    equipmentAndMaterials: PROJECT_EQUIPMENT,
    mistakes: [
      {
        wrong: "Mimari paftayı ana referans kabul edip statik ve tesisat kararlarını sonradan sahada çözmeye çalışmak.",
        correct: "Şaft, delik, kolon-perde ve cihaz yerleşimlerini uygulama öncesi koordinasyon matrisiyle kilitlemek.",
        reference: "TBDY 2018, Bölüm 3 ve TS 500 proje koordinasyonu pratiği",
      },
      {
        wrong: "Eski paftayı sahadan çekmeden yeni revizyonu WhatsApp veya e-posta ile duyurmak.",
        correct: "Revizyon föyü ve dağıtım listesi ile tek güncel paftayı kayıtlı şekilde yaymak.",
      },
      {
        wrong: "Mahal listesi ile kapı-pencere çizelgesini ayrı ekiplerin yorumuna bırakmak.",
        correct: "Mimari proje, doğrama çizelgesi ve detay paftalarını aynı kontrol çevriminde okumak.",
      },
      {
        wrong: "Ruhsat setini uygulama projesi gibi kullanmak.",
        correct: "Ruhsat onayı sonrası uygulama detaylarını ayrıca olgunlaştırmak ve sahaya o seti indirmek.",
        reference: "3194 sayılı İmar Kanunu + Planlı Alanlar İmar Yönetmeliği",
      },
      {
        wrong: "As-built düzeltmelerini iş bitimine bırakmak.",
        correct: "Saha geri bildirimlerini imalat ilerledikçe ana proje setine işlemek.",
      },
    ],
    designVsField: [
      "Tasarım ofisi için bir şaft çoğu zaman iki çizgi arası boşluktur; saha için ise boru, kablo, askı, kapatma ve bakım erişimi anlamına gelir. Bu nedenle proje sayfasında yeterli görünen bir çözüm, sahada yetersiz kalabilir.",
      "Aynı şekilde ruhsat odaklı proje sunumu ile uygulama odaklı proje sunumu farklıdır. Ruhsat için yeterli olan bir bilgi seviyesi, şantiye için çoğu zaman eksiktir; bu fark bilinçli yönetilmelidir.",
    ],
    conclusion: [
      "Proje ve izin safhası ne kadar disiplinli yönetilirse, şantiyedeki sürprizler o kadar azalır. Kalite yalnızca doğru malzemeyle değil, doğru tarif edilmiş imalat zinciriyle başlar.",
      "Bu nedenle proje ofisi ile saha arasında ortak bir teknik kayıt kültürü kurmak, inşaatın geri kalanındaki verimi belirleyen ilk stratejik adımdır.",
    ],
    sources: PROJE_SOURCES,
    keywords: ["proje koordinasyonu", "uygulama projesi", "ruhsat projesi", "mimari statik uyumu", "şantiye teknik ofis"],
  },
  {
    slugPath: "proje-hazirlik/mimari-proje",
    kind: "topic",
    quote: "Mimari proje, estetik kararın değil; tüm görünür birleşimlerin teknik sözlüğüdür.",
    tip: "Mahal listesi, doğrama çizelgesi ve büyük ölçekli detaylar olmadan mimari proje sahada yarım konuşur.",
    intro: [
      "Mimari proje, mekan kurgusunu saha tarafından uygulanabilir bir tarif haline getirir. Kolon yerleri, net mahal ölçüleri, kapı-pencere boşlukları, ıslak hacim kurgusu ve bitiş kararları burada teknik bir düzene kavuşur.",
      "İyi mimari proje, yalnızca plan ve görünüşten oluşmaz; detay, mahal listesi ve birleşim mantığını da taşıyarak yorum yükünü azaltır.",
    ],
    theory: [
      "Mimari proje seti; plan, kesit, görünüş, mahal listesi ve detay paftalarının birlikte okunmasıyla anlam kazanır. Tek başına plan paftası, bitiş ve birleşim kararlarını sahada güvenle taşıyamaz.",
      "Özellikle kapı-pencere boşlukları, parapet, merdiven, ıslak hacim eğimleri ve asma tavan kararları diğer disiplinleri doğrudan etkiler.",
      "Bu nedenle mimari proje, taşıyıcı sistem ve MEP kararlarına referans vermek zorundadır; onlardan bağımsız bir sunum değildir.",
    ],
    ruleTable: [
      {
        parameter: "Plan, kesit ve görünüş tutarlılığı",
        limitOrRequirement: "Aynı kot ve aks sistemi",
        reference: "Planlı Alanlar İmar Yönetmeliği",
        note: "Kesitte görünen bir kot plan paftasında da aynı değerde yer almalıdır.",
      },
      {
        parameter: "Mahal listesi",
        limitOrRequirement: "Kaplama, kapı, tavan ve ıslak hacim kararlarıyla uyumlu olmalı",
        reference: "Uygulama proje disiplini",
        note: "Sahadaki satın alma ve imalat sırası için ana rehberdir.",
      },
      {
        parameter: "Büyük ölçekli detay",
        limitOrRequirement: "Kritik birleşimler 1/20-1/5 aralığında çözülmeli",
        reference: "Teknik ofis detay standardı",
        note: "Kuru duvar, doğrama, parapet ve su yalıtımı detayları bu ölçekte netleşir.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal ihtiyaç programını netleştir ve plan setine aktar.",
      "Net-brüt ilişkiyi, kapı-pencere ve dolaşım kararlarıyla birlikte sabitle.",
      "Kesit ve görünüşlerle kat kotlarını, döşeme kalınlıklarını ve parapet hatlarını teyit et.",
      "Islak hacim, merdiven, cephe ve çatı birleşimlerini büyük ölçekte detaylandır.",
      "Mahal listesi ile doğrama çizelgesini pafta setinin ayrılmaz parçası haline getir.",
    ],
    criticalChecks: [
      "Mahal listesi ile pafta üzerindeki isimlendirme birebir aynı mı?",
      "Kapı-pencere boşluk ölçüleri statik ve doğrama detaylarıyla uyumlu mu?",
      "Islak hacim kot ve eğim kararları kesitlerde açık mı?",
      "Büyük ölçekli detay gerektiren birleşimler boş bırakılmış mı?",
      "Cephe, parapet ve damlalık kararları su yönetimini çözüyor mu?",
    ],
    numericalExample: {
      title: "Mahal listesi ile doğrama çizelgesi uyum kontrolü",
      inputs: [
        { label: "Toplam mahal sayısı", value: "24 adet", note: "4 katlı konut bloğu" },
        { label: "Kapı tipi", value: "5 tip", note: "İç kapı, dış kapı, yangın kapısı dahil" },
        { label: "Pencere tipi", value: "4 tip", note: "PVC ve sabit doğrama birlikte" },
        { label: "Eksik detay kabul limiti", value: "0 adet", note: "Kritik birleşimlerde eksik detay bırakılmaz" },
      ],
      assumptions: [
        "Her mahalin bir zemin, duvar ve tavan kararı vardır.",
        "Her kapı/pencere tipi ilgili mahal listesiyle eşlenmiştir.",
        "Islak hacim ve balkon detayları büyük ölçekte ayrıca çözülmüştür.",
      ],
      steps: [
        {
          title: "Mahal başına doğrama ihtiyacını eşleştir",
          formula: "24 mahal x ortalama 2,1 doğrama",
          result: "Yaklaşık 50 doğrama bileşeni çizelgeye düşer.",
          note: "Çizelge-pafta uyumu sağlanmazsa sahada ölçü kayması başlar.",
        },
        {
          title: "Detay ihtiyacını belirle",
          formula: "Islak hacim + cephe + parapet + çatı = en az 8 kritik detay",
          result: "Büyük ölçekli pafta gerektiren birleşimler erkenden belirlenir.",
          note: "Bu kararları ustaya bırakmak, görünür kaliteyi rastlantıya bırakmaktır.",
        },
      ],
      checks: [
        "Her kapı tipi en az bir kesit ve çizelge referansına bağlanmalıdır.",
        "Mahal listesinde görünen kaplama kararı paftada karşılık bulmalıdır.",
        "Eksik detay sayısı sıfır değilse uygulama seti olgunlaşmış sayılmaz.",
      ],
      engineeringComment: "Mimari projede eksik detay, sahada pahalı doğaçlama anlamına gelir.",
    },
    tools: PROJECT_TOOLS,
    equipmentAndMaterials: PROJECT_EQUIPMENT,
    mistakes: [
      { wrong: "Plan paftasını yeterli görüp detay paftalarını ertelemek.", correct: "Kritik birleşimleri sahaya çıkmadan büyük ölçekte çözmek." },
      { wrong: "Mahal listesi ile çizelgeleri senkron tutmamak.", correct: "Mahal-karar-ürün ilişkisini tek veri setinde yönetmek." },
      { wrong: "Islak hacim kot ve eğimlerini kesitte göstermemek.", correct: "Banyo, balkon ve teraslarda eğim ve bitiş kararlarını açıkça yazmak." },
      { wrong: "Doğrama boşluklarını statik ve cephe sistemiyle kontrol etmemek.", correct: "Doğrama ölçülerini hem kaba inşaat hem cephe birleşimi üzerinden doğrulamak." },
      { wrong: "Cephe su yönetimini yalnızca malzemeyle çözmeye çalışmak.", correct: "Damlalık, parapet ve birleşim geometrisini de detaylandırmak." },
    ],
    designVsField: [
      "Tasarım aşamasında 2 cm'lik boşluk çoğu zaman kabul edilebilir görünür; sahada o boşluk doğrama kasası, mastik, denizlik ve yalıtım kalınlığını birlikte taşımak zorundadır.",
      "Bu yüzden mimari proje ancak birleşim detayı ve mahal kararıyla birlikte şantiye için anlamlı hale gelir.",
    ],
    conclusion: [
      "Mimari proje, binanın görünen kalitesini belirleyen ilk teknik çerçevedir. Ne kadar net tariflenirse, sahada o kadar az yorum ve kırma-düzeltme ihtiyacı doğar.",
    ],
    sources: [...PROJE_SOURCES, SOURCE_LEDGER.planliAlanlar],
    keywords: ["mimari proje", "uygulama detayı", "mahal listesi", "doğrama çizelgesi", "mimari uygulama projesi"],
  },
  {
    slugPath: "proje-hazirlik/statik-proje",
    kind: "topic",
    quote: "Statik proje, hesabın çizime dönüştüğü ve taşıyıcı sistemin sahaya konuştuğu noktadır.",
    tip: "Statik proje yalnızca kesit hesabı değildir; rezervasyon, bindirme ve uygulama sırasını da tarif etmelidir.",
    intro: [
      "Statik proje, taşıyıcı sistemin hangi kesitlerle, hangi donatı mantığıyla ve hangi detay kurallarıyla üretileceğini belirler. Bu belge olmadan betonarme imalat yalnızca yaklaşık bir uygulama olur.",
      "Kolon, kiriş, perde, döşeme ve temel kararları mimari gereksinimle birlikte okunur; bu nedenle statik proje saha için hesap raporundan daha kritik bir uygulama aracıdır.",
    ],
    theory: [
      "Taşıyıcı sistem kararı yalnızca yük taşımak için verilmez; deprem davranışı, rijitlik dağılımı, düzensizlikler ve yapım kolaylığı birlikte değerlendirilir.",
      "İyi bir statik proje, yalnızca donatı miktarını söylemez. Bindirme bölgeleri, etriye sıklaştırmaları, pas payı ve rezervasyon kararlarını da görünür hale getirir.",
      "Bu yüzden statik proje, TS 500 ve TBDY 2018 hükümlerini saha okunabilirliğine dönüştüren bir uygulama dokümanıdır.",
    ],
    ruleTable: [
      {
        parameter: "Betonarme tasarım çerçevesi",
        limitOrRequirement: "Kesit, donatı ve detay kararları TS 500 + TBDY uyumlu olmalı",
        reference: "TS 500, Madde 7-12 + TBDY 2018, Bölüm 7",
        note: "Deprem davranışı ile kesit detayları birlikte okunur.",
      },
      {
        parameter: "Taşıyıcı sistem sürekliliği",
        limitOrRequirement: "Kolon-perde aksları katlar arasında kopmamalı",
        reference: "TBDY 2018, düzensizlik ilkeleri",
        note: "Mimari değişiklikler statik sürekliliği bozuyorsa sistem yeniden değerlendirilir.",
      },
      {
        parameter: "Donatı detayları",
        limitOrRequirement: "Bindirme, etriye ve pas payı açıkça gösterilmeli",
        reference: "TS 500, Madde 6-9",
        note: "Saha okuması zayıf çizimler kontrolsüz imalat üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Taşıyıcı sistem akslarını mimari kurguyla birlikte sabitle.",
      "Deprem davranışı ve yük aktarımını etkileyen sistem seçimlerini hesap modeline yansıt.",
      "Kesit boyutlarını, açıklık oranlarını ve rijitlik dengesini ön tasarım seviyesinde doğrula.",
      "Donatı detaylarını yalnızca kesit hesabına değil, sahadaki uygulanabilirliğe göre çiz.",
      "MEP geçişleri ve döşeme boşluklarını statik paftaya kontrollü şekilde işle.",
    ],
    criticalChecks: [
      "Kolon ve perde aksları katlar boyunca süreklilik gösteriyor mu?",
      "Kiriş ve döşeme boşlukları sonradan delinmeye ihtiyaç bırakıyor mu?",
      "Bindirme ve sıklaştırma bölgeleri paftada açık mı?",
      "Temel ve üst yapı aksları aynı referansa bağlı mı?",
      "Mimari açıklık talepleri taşıyıcı sistem davranışını bozuyor mu?",
    ],
    numericalExample: {
      title: "6,0 m açıklıklı betonarme kiriş için ön boyut kontrolü",
      inputs: [
        { label: "Açıklık", value: "6,0 m", note: "Konut tipi döşeme geçişi" },
        { label: "Ön boyut yaklaşımı", value: "h ≈ L / 12", note: "Ön tasarım kontrolü" },
        { label: "Tahmini kiriş yüksekliği", value: "500 mm", note: "6000 / 12 ≈ 500 mm" },
        { label: "Beton sınıfı", value: "C30/37", note: "Yaygın konut pratiği" },
      ],
      assumptions: [
        "Kesin boyutlandırma analiz ve donatı hesabıyla ayrıca doğrulanacaktır.",
        "Kiriş açıklığı boyunca olağan konut yükleri kabul edilmiştir.",
        "Sehim ve donatı yerleşimi ön tasarım kararını etkileyebilir.",
      ],
      steps: [
        {
          title: "Ön kesit yüksekliğini tahmin et",
          formula: "h ≈ L / 12",
          result: "h ≈ 6000 / 12 = 500 mm",
          note: "Bu değer ilk yaklaşım olup nihai tasarım değildir.",
        },
        {
          title: "Mimari uyumu kontrol et",
          result: "500 mm kiriş yüksekliği asma tavan ve tesisat koordinasyonunu etkiler.",
          note: "Statik karar mimari ve MEP boşluklarıyla birlikte okunmalıdır.",
        },
      ],
      checks: [
        "Ön boyut mimari tavan kotunu bozuyorsa sistem alternatifi düşünülmelidir.",
        "Kiriş yüksekliği, donatı yerleşimine uygun minimum gövde genişliğiyle birlikte ele alınmalıdır.",
        "Nihai karar TS 500 ve TBDY hükümlerine göre analizle doğrulanmalıdır.",
      ],
      engineeringComment: "Ön boyutlandırma, tasarım süresini kısaltır; ama kesin çözüm yerine geçmez.",
    },
    tools: PROJECT_TOOLS,
    equipmentAndMaterials: PROJECT_EQUIPMENT,
    mistakes: [
      { wrong: "Statik paftayı yalnızca donatı miktarı olarak görmek.", correct: "Paftayı kesit, detay, rezervasyon ve uygulama sırasını tarif eden belge olarak okumak." },
      { wrong: "MEP geçişlerini statik projeden bağımsız bırakmak.", correct: "Döşeme delikleri ve şaft kararlarını taşıyıcı sistem tasarımıyla birlikte çözmek." },
      { wrong: "Ön boyutlandırmayı nihai tasarım gibi kabul etmek.", correct: "Analiz ve detay hesabı ile ön tasarımı doğrulamak.", reference: "TS 500, Madde 7" },
      { wrong: "Bindirme ve sıklaştırma bölgelerini belirsiz çizmek.", correct: "Saha okumaya uygun net detay paftaları üretmek." },
      { wrong: "Katlar arası aks sürekliliğini mimari değişikliğe feda etmek.", correct: "Sistem davranışını bozan kararları yeniden analiz etmek." },
    ],
    designVsField: [
      "Tasarım ofisinde çizgi olarak görülen bindirme bölgesi, sahada işçilik yoğunluğu, beton yerleşimi ve vibrasyon kalitesi üzerinde doğrudan etkili bir alandır.",
      "Bu nedenle statik proje yalnızca hesap raporu eki değil; ustanın, formeninin ve kontrol mühendisinin ortak çalışma dokümanı olmalıdır.",
    ],
    conclusion: [
      "Statik proje net değilse, kaba inşaatta kaliteli imalat tesadüfe kalır. Hesabın okunabilir çizime dönüşmesi, taşıyıcı sistem güvenliğinin saha tarafındaki en kritik adımıdır.",
    ],
    sources: [...PROJE_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["statik proje", "betonarme proje", "kiriş ön boyutlandırma", "taşıyıcı sistem", "TBDY TS500"],
  },
  {
    slugPath: "proje-hazirlik/tesisat-projesi",
    kind: "topic",
    quote: "Tesisat projesi, görünmeyen sistemlerin bina içinde çakışmadan yaşayabilmesini sağlar.",
    tip: "Bir şaftı çizmek yetmez; aynı şaftta hangi boru, kanal ve bakım erişimi ihtiyacının taşınacağı da tarif edilmelidir.",
    intro: [
      "Tesisat projesi, temiz su, pis su, yağmur suyu, ısıtma-soğutma, havalandırma ve yangın sistemlerinin bina kabuğu içinde çakışmadan yerleşmesini sağlar.",
      "Mimari ve statik kararlara sonradan eklenen tesisat çözümleri çoğu zaman kırma, kot kaybı ve bakım erişimi sorunları doğurur. Bu nedenle tesisat projesi uygulama öncesi olgunlaşmalıdır.",
    ],
    theory: [
      "Bir mekanik proje yalnızca cihaz yerlerini göstermez; şaft genişliği, eğim gereksinimi, askı sistemi, ses kontrolü ve bakım boşluğu gibi fiziksel gerçekleri de birlikte tarif eder.",
      "Özellikle düşey şaftlar ve asma tavan bölgeleri, tüm disiplinlerin aynı geometri içinde paylaştığı alanlardır.",
    ],
    ruleTable: [
      {
        parameter: "Temiz su hijyeni ve dağıtımı",
        limitOrRequirement: "Hatlar bakım erişimine ve test imkânına sahip olmalı",
        reference: "TS EN 806",
        note: "Kapatma öncesi basınç testi ve vana erişimi şarttır.",
      },
      {
        parameter: "Atık su ve havalık düzeni",
        limitOrRequirement: "Eğim ve havalık mantığı proje aşamasında çözülmeli",
        reference: "TS EN 12056",
        note: "Pis su hatları için şaft kesiti sonradan büyütülmeye bırakılmamalıdır.",
      },
      {
        parameter: "Yangın ve mekanik geçişler",
        limitOrRequirement: "Yangın zonu ve şaft geçiş detayları açık olmalı",
        reference: "Yangın Yönetmeliği",
        note: "Bölme duvar ve döşeme geçişleri detaysız kalmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Sistem ailesini bina kullanım senaryosuna göre netleştir.",
      "Şaft, cihaz odası ve asma tavan hacimlerini mimari kesitlerle birlikte kilitle.",
      "Temiz su, pis su, drenaj ve cihaz bağlantılarını bakım erişimiyle birlikte çöz.",
      "Yangın zonu, izolasyon ve askı sistemlerini detay paftalara taşı.",
      "Kapatma öncesi test planını proje setine ekle.",
    ],
    criticalChecks: [
      "Şaft kesiti hatları gerçekten taşıyor mu?",
      "Pis su ve yoğuşma drenajı için gerekli eğim bırakılmış mı?",
      "Cihazların önünde bakım boşluğu var mı?",
      "Asma tavan içinde servis çakışması çözülmüş mü?",
      "Kapatma öncesi test ve foto-kayıt planı yazılı mı?",
    ],
    numericalExample: {
      title: "Düşey şaft kapasitesi için tipik yerleşim kontrolü",
      inputs: [
        { label: "Şaft iç ölçüsü", value: "1000 x 700 mm", note: "Konut bloğu ana şaftı" },
        { label: "Temiz su hattı", value: "2 adet PPRC kolon", note: "Sıcak ve soğuk su" },
        { label: "Pis su hattı", value: "1 adet Ø110 kolon", note: "Ana atık su hattı" },
        { label: "Yangın hattı", value: "1 adet DN65", note: "Ortak şaft içinde geçiyor" },
      ],
      assumptions: [
        "Askı ve kelepçe payları dikkate alınacaktır.",
        "Bakım için erişim boşluğu tamamen sıfırlanmayacaktır.",
        "Şaft kapatma öncesi test edilecektir.",
      ],
      steps: [
        {
          title: "Hat kesit alanlarını kaba olarak topla",
          formula: "Boru dış çapları + askı/izolasyon boşlukları",
          result: "Şaft yalnızca boru için değil, montaj ve bakım için de alan ayırmalıdır.",
          note: "Geometrik olarak sığan çözüm, her zaman uygulanabilir çözüm değildir.",
        },
        {
          title: "Bakım payını kontrol et",
          result: "En az bir erişim yüzeyi boş bırakılmalıdır.",
          note: "Vana, sayaç ve bağlantı noktaları kapatma arkasına saklanmamalıdır.",
        },
      ],
      checks: [
        "Şaftta erişim yüzeyi kalmıyorsa kesit büyütülmeli veya sistem ayrıştırılmalıdır.",
        "Pis su için gerekli eğim ve yön değiştirme noktaları kesitte görünür olmalıdır.",
        "İzolasyon ve yangın durdurucu detayları ayrıca gösterilmelidir.",
      ],
      engineeringComment: "Şaft sorunu çoğu zaman sahada değil, projede birkaç santimetre eksik bırakıldığı için büyür.",
    },
    tools: [
      ...PROJECT_TOOLS,
      { category: "MEP", name: "Revit MEP / benzeri BIM kontrolü", purpose: "Şaft ve asma tavan çakışmalarını model düzeyinde görmek." },
    ],
    equipmentAndMaterials: [
      ...PROJECT_EQUIPMENT,
      { group: "Test", name: "Basınç test pompası", purpose: "Temiz su ve kapatılacak hatların sızdırmazlık doğrulaması.", phase: "Kapatma öncesi" },
      { group: "Montaj", name: "Askı, kelepçe ve izolasyon setleri", purpose: "Hatların titreşim, ses ve servis ömrünü kontrol etmek.", phase: "Montaj" },
    ],
    mistakes: [
      { wrong: "Şaftı yalnızca boru çapına göre boyutlandırmak.", correct: "Montaj, izolasyon ve bakım erişimi payını birlikte hesaplamak." },
      { wrong: "Asma tavanı tesisat için sınırsız boşluk varmış gibi kabul etmek.", correct: "Aydınlatma, menfez, sprinkler ve kanal yerleşimini birlikte çözmek." },
      { wrong: "Pis su eğimini sahada ustaya bırakmak.", correct: "Yön, kot ve bağlantıları projede açıkça göstermek.", reference: "TS EN 12056" },
      { wrong: "Kapatma öncesi test planını proje dışında yönetmek.", correct: "Basınç ve sızdırmazlık testini proje teslim paketinin parçası yapmak." },
      { wrong: "Bakım erişimini dekoratif kapatma arkasına saklamak.", correct: "Vana ve kritik bağlantıların servis erişimini açık bırakmak." },
    ],
    designVsField: [
      "Tasarımcı için birkaç boru hattı olarak görünen çözüm, sahada askı, kelepçe, izolasyon ve tamirat alanı talep eder. Bu yüzden mekanik proje çizgisel değil hacimsel okunmalıdır.",
      "Sahada kırma yapılmasının en yaygın nedeni, proje aşamasında bakım erişimi ve montaj toleranslarının hesaba katılmamasıdır.",
    ],
    conclusion: [
      "Tesisat projesi olgunlaşmadan başlayan şantiye, görünmeyen ama pahalı revizyonlarla ilerler. Proje aşamasında çözülen her şaft ve askı kararı, sahada büyük zaman kazancı üretir.",
    ],
    sources: [...PROJE_SOURCES, SOURCE_LEDGER.tsEn806, SOURCE_LEDGER.tsEn12056, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["tesisat projesi", "şaft koordinasyonu", "mekanik proje", "temiz su pis su", "uygulama öncesi MEP"],
  },
];
