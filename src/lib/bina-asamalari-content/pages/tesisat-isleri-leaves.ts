import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const TESISAT_LEAF_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const SIHHI_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Revit MEP / overlay paftaları", purpose: "Şaft, ıslak hacim ve döşeme geçişlerini mimariyle çakıştırmadan çözmek." },
  { category: "Test", name: "Basınç test pompası ve manometre", purpose: "Temiz su hatlarında sızdırmazlık ve basınç davranışını kapatma öncesi doğrulamak." },
  { category: "Ölçüm", name: "Lazer nivo ve eğim mastarı", purpose: "Pis su hatlarında kot, eğim ve askı sürekliliğini sahada okumak." },
  { category: "Kayıt", name: "Foto-log ve vana etiketleme listesi", purpose: "Kapanan hatların son durumunu ve bakım noktalarını işletmeye aktarılabilir hale getirmek." },
];

const SIHHI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Boru", name: "PP-R / PEX temiz su boruları ve fittings", purpose: "Hijyenik ve basınca dayanıklı içme-kullanma suyu dağıtımı oluşturmak.", phase: "Temiz su montajı" },
  { group: "Boru", name: "PVC / PP atık su boruları ve temizleme parçaları", purpose: "Pis su akışını koku ve geri basma üretmeden taşımak.", phase: "Pis su montajı" },
  { group: "Armatür", name: "Kollektör, vana ve sayaç grupları", purpose: "Hat zonlaması, kapatma ve bakım yönetimini sağlamak.", phase: "Dağıtım ve sonlandırma" },
  { group: "Kontrol", name: "Askı, kelepçe, izolatör ve kılıf geçiş elemanları", purpose: "Titreşim, ses ve hareket kaynaklı saha sorunlarını sınırlamak.", phase: "Montaj ve kapatma öncesi" },
];

const ELEKTRIK_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Yük listesi / tek hat şeması", purpose: "Devre akımı, koruma ve pano rezervi kararlarını tutarlı hale getirmek." },
  { category: "Saha", name: "Kablo çekim planı ve tava doluluk tablosu", purpose: "Güzergah, rezerv ve bakım erişimini fiziksel olarak yönetmek." },
  { category: "Test", name: "Megger, multimetre ve süreklilik test seti", purpose: "İzolasyon, PE sürekliliği ve faz sıralamasını devreye alma öncesi doğrulamak." },
  { category: "Kayıt", name: "Etiketleme ve as-built devre listesi", purpose: "Saha ucuyla panodaki devre tanımını kalıcı biçimde eşlemek." },
];

const ELEKTRIK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Kablo tavası, boru ve askı sistemleri", purpose: "Enerji hatlarını kontrollü ve bakım erişimli taşımak.", phase: "Güzergah montajı" },
  { group: "İletken", name: "Enerji kabloları, buatlar ve ek aksesuarları", purpose: "Devre sürekliliğini ve son nokta dağıtımını güvenli biçimde oluşturmak.", phase: "Kablolama" },
  { group: "Dağıtım", name: "Pano gövdesi, şalterler, kaçak akım ve parafudr", purpose: "Koruma, seçicilik ve işletme kontrolünü tek noktada toplamak.", phase: "Pano montajı" },
  { group: "Kontrol", name: "Topraklama barası ve etiketleme ekipmanı", purpose: "Koruma ile bakım okunabilirliğini sistemin ayrılmaz parçası haline getirmek.", phase: "Devreye alma" },
];

const IKLIM_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Revit MEP / mahal bazlı mekanik pafta", purpose: "Kollektör, iç-dış ünite, drenaj ve bakım boşluklarını birlikte okumak." },
  { category: "Test", name: "Basınç test pompası, manifold seti ve vakum pompası", purpose: "Yerden ısıtma ve klima devrelerinde sızdırmazlık ile devreye alma kalitesini doğrulamak." },
  { category: "Ölçüm", name: "Termal kamera ve yüzey sıcaklık ölçeri", purpose: "Yerden ısıtmada dağılımı, klimada drenaj ve soğutma davranışını kontrol etmek." },
  { category: "Kayıt", name: "Devre boyu ve bakım çizelgesi", purpose: "Şap altında kalan veya tavan arkasına geçen hatları işletme için okunabilir bırakmak." },
];

const IKLIM_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dağıtım", name: "Yerden ısıtma borusu, kollektör ve kenar bantları", purpose: "Düşük sıcaklıkta dengeli yüzey ısıtması kurmak.", phase: "Yerden ısıtma montajı" },
  { group: "Dağıtım", name: "Bakır boru, drenaj hattı ve izolasyon", purpose: "Klima devrelerinde soğutucu akışkan ve yoğuşma suyunu güvenli taşımak.", phase: "Klima montajı" },
  { group: "Kontrol", name: "Şap altı yalıtım levhası ve reflektif katman", purpose: "Yerden ısıtmada ısının doğru yöne gitmesini ve enerji kaybının sınırlanmasını sağlamak.", phase: "Hazırlık" },
  { group: "Servis", name: "Titreşim takozu, servis vanası ve kondens aksesuarları", purpose: "Cihaz ömrü, bakım erişimi ve sessiz çalışma performansını desteklemek.", phase: "Devreye alma" },
];

export const tesisatIsleriLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri/sihhi-tesisat/temiz-su",
    kind: "topic",
    quote: "Temiz su hattı yalnız su taşımaz; hijyen, basınç kararlılığı ve bakım güveni taşır.",
    tip: "Temiz su sisteminde en sık hata, hattın bir gün basınç tutmasını yeterli saymaktır; asıl kalite vana erişimi ve işletme okunabilirliğiyle ortaya çıkar.",
    intro: [
      "Temiz su tesisatı; şehir şebekesinden veya depodan başlayan, kullanıcı noktasında yeterli basınç ve hijyenle sona eren dağıtım sistemidir. Şantiyede boru duvar içinde kaybolduğu için basit görünür; fakat yapı kullanıma açıldığında üst katlarda düşük basınç, sıcak su gecikmesi ve erişilemeyen vana grupları ilk şikayet başlıkları olur.",
      "Bir inşaat mühendisi için temiz su hattı yalnız mekanik ekip işi değildir. Şaft genişliği, döşeme geçişi, ıslak hacim kalınlığı ve kapatma sırası kaba inşaatla doğrudan ilişkilidir. Bu sistemin kalitesi, boruyu döşemekten çok hattı testlenebilir, erişilebilir ve işletmeye devredilebilir biçimde kurabilmeye bağlıdır.",
    ],
    theory: [
      "Temiz su dağıtımında iki temel performans aynı anda gerekir: hijyen ve basınç. Boru malzemesi, ek yöntemi ve kör kol oluşmaması hijyen tarafını etkiler; basınç bölgesi, kolon yüksekliği ve kullanım senaryosu ise üst kat servis kalitesini belirler.",
      "Sıcak ve soğuk su hatları beraber çalıştığında enerji kaybı ve yoğuşma davranışı da önem kazanır. Uzun mesafeli dağıtımlarda izolasyon eksikliği hem enerji maliyetini hem de kullanıcı konforunu bozar.",
      "Şantiyedeki en kritik karar, kapatma öncesi test ve kayıt disiplinidir. Basınç testi, foto-dokümantasyon, vana etiketleme ve as-built işleme aynı zincirde yapılmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Hijyen ve dağıtım",
        limitOrRequirement: "Boru, ek ve dağıtım sistemi hijyenik kullanım ve bakım ilkelerine uygun kurulmalıdır.",
        reference: "TS EN 806",
        note: "Uzun süre kullanılmayan kör kollar ve erişilemeyen ekipman işletme riskini büyütür.",
      },
      {
        parameter: "Basınç ve sızdırmazlık",
        limitOrRequirement: "Kapatma öncesi basınç testi kayıtlı biçimde tamamlanmalıdır.",
        reference: "TS EN 806 + saha test planı",
        note: "Test sonucu teslim klasörüne girmeyen hat güvence üretmez.",
      },
      {
        parameter: "Isı kaybı ve yoğuşma kontrolü",
        limitOrRequirement: "Sıcak su ve yoğuşma riski taşıyan hatlarda uygun izolasyon bırakılmalıdır.",
        reference: "TS 825 + BEP Yönetmeliği yaklaşımı",
        note: "Konfor ve enerji performansı boru izolasyonundan doğrudan etkilenir.",
      },
      {
        parameter: "Bakım erişimi",
        limitOrRequirement: "Vana, sayaç ve kollektör grupları erişilebilir kalmalıdır.",
        reference: "4708 sayılı Kanun kapsamındaki saha kontrol yaklaşımı",
        note: "Gizlenmiş ama servis veremeyen ekipman teslim edilmiş sayılamaz.",
      },
    ],
    designOrApplicationSteps: [
      "Şebeke veya depo beslemesini, basınç bölgesi ihtiyacıyla birlikte değerlendir; üst kat servis seviyesini kağıt üstünde bırakma.",
      "Şaft, kolon ve ıslak hacim geçişlerini mimari kalınlıklarla birlikte netleştir; rastgele kırma ve sonradan yön değiştiren güzergah üretme.",
      "Vana, kollektör ve sayaç gruplarını bakım erişimine göre yerleştir; kapak ve servis boşluğu bırak.",
      "Kapatma öncesi basınç testini, foto-log ve etiketleme ile aynı zincirde tamamla.",
      "Sıcak su hatları ve yoğuşma riski olan bölgelerde izolasyon sürekliliğini kontrol edip as-built kaydını işletmeye hazırla.",
    ],
    criticalChecks: [
      "En uzak kullanıcı noktasına yeterli basınç ulaşacak mı, statik kot farkı hesaplandı mı?",
      "Sıcak ve soğuk su hatları bakım erişimli ve okunabilir mi?",
      "Basınç test raporu, foto-kayıt ve vana etiketleri eksiksiz mi?",
      "Boru kılıfları ve duvar/döşeme geçişleri kapatma öncesi tamamlandı mı?",
      "Yoğuşma veya ısı kaybı yaratacak çıplak hat bırakıldı mı?",
    ],
    numericalExample: {
      title: "5 katlı yapıda temiz su basınç gereksinimi yorumu",
      inputs: [
        { label: "En alt ve en üst kullanıcı arası kot farkı", value: "12 m", note: "Yaklaşık 4 kat x 3 m" },
        { label: "Üst katta istenen minimum kullanım basıncı", value: "2,5 bar", note: "Konforlu kullanım hedefi" },
        { label: "Hat ve vana kaynaklı tahmini kayıp", value: "0,4 bar", note: "Örnek saha kabulü" },
        { label: "Hedef", value: "Pompa çıkış basıncını okumak", note: "Ön tasarım yorumu" },
      ],
      assumptions: [
        "1 mSS yaklaşık 0,1 bar statik basınç karşılığı olarak alınmıştır.",
        "Sistem aynı anda pik debi altında çalışmamaktadır; bu örnek ön kontrol içindir.",
        "Boru çapı seçimi ayrıca hidrolik hesapla teyit edilecektir.",
      ],
      steps: [
        {
          title: "Statik kot kaybını hesapla",
          formula: "12 m x 0,1 bar/m = 1,2 bar",
          result: "Üst kata ulaşmak için yalnız kot farkı nedeniyle yaklaşık 1,2 bar gerekir.",
          note: "Bu değer, pompa veya şebeke basıncının ilk büyük payıdır.",
        },
        {
          title: "Gerekli çıkış basıncını yorumla",
          formula: "2,5 + 1,2 + 0,4 = 4,1 bar",
          result: "Üst katta 2,5 bar görmek için yaklaşık 4,1 bar çıkış bandı gerekir.",
          note: "Gerçek tasarımda eş zamanlı kullanım ve hat kayıpları daha detaylı kontrol edilir.",
        },
      ],
      checks: [
        "Statik kot farkı düşünülmeden yapılan temiz su planı üst kat şikayeti üretir.",
        "Pompa veya hidrofor seçimi yalnız kapasiteye değil kullanım basıncına göre de değerlendirilmelidir.",
        "Basınç yeterli olsa bile erişilemeyen vana ve izolasyonsuz hat işletme kalitesini düşürür.",
      ],
      engineeringComment: "Temiz su sisteminde kullanıcı musluğu açtığında hissedilen konfor, büyük ölçüde şaft içinde gizlenen basınç ve bakım kararlarının sonucudur.",
    },
    tools: SIHHI_TOOLS,
    equipmentAndMaterials: SIHHI_EQUIPMENT,
    mistakes: [
      { wrong: "Şaft içinde tüm vanaları arka arkaya yığıp bakım boşluğu bırakmamak.", correct: "Kapatma ve müdahale senaryosuna göre erişilebilir vana düzeni kurmak." },
      { wrong: "Basınç testini yalnız sözlü teyitle kapatmak.", correct: "Manometre kaydı, foto ve teslim formuyla belgelemek." },
      { wrong: "Sıcak su hattını izolasyonsuz bırakmak.", correct: "Konfor ve enerji kaybı açısından izolasyon sürekliliğini sağlamak." },
      { wrong: "Döşeme ve perde geçişlerini kılıfsız geçmek.", correct: "Bakım ve hareket güvenliği için uygun geçiş detayı bırakmak." },
      { wrong: "Üst kat kullanım basıncını saha sonuna kadar kontrol etmemek.", correct: "Kot farkını erken aşamada ön tasarım hesabına katmak." },
    ],
    designVsField: [
      "Projede birkaç düşey kolon ve yatay hat gibi görünen temiz su sistemi, sahada şaft genişliği, vana erişimi ve kapatma sırası yüzünden çok daha zorlayıcı hale gelir.",
      "İyi saha mühendisi temiz su hattını duvar kapanmadan çözer; kötü saha yönetiminde ise sorun kullanıcı taşındıktan sonra sızıntı veya düşük basınç olarak geri döner.",
    ],
    conclusion: [
      "Temiz su tesisatı düzgün tasarlandığında görünmez ama sorunsuz çalışır. İnşaat mühendisi bu aşamada basınç, erişim ve kayıt disiplinini birlikte yönetirse teslim sonrası müdahale ihtiyacı belirgin biçimde azalır.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.tsEn806, SOURCE_LEDGER.ts825],
    keywords: ["temiz su", "TS EN 806", "basınç testi", "hidrofor", "su tesisatı"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/sihhi-tesisat", "tesisat-isleri/sihhi-tesisat/pis-su"],
  },
  {
    slugPath: "tesisat-isleri/sihhi-tesisat/pis-su",
    kind: "topic",
    quote: "Pis su hattı taşıyıcı görünmez, ama eğimi ve havalığı doğru kurulmazsa yapının konforunu ilk bozan sistemlerden biri olur.",
    tip: "Pis su tesisatında 1-2 cm'lik kot hatası yalnız boruyu değil, asma tavanı, seramik kotunu ve kullanıcı konforunu birlikte bozar.",
    intro: [
      "Pis su tesisatı; lavabo, klozet, süzgeç ve benzeri atık su kaynaklarından gelen akışı ana kolona ve kanal bağlantısına güvenli biçimde taşıyan sistemdir. En büyük farkı, temiz su gibi basınçla değil ağırlıklı olarak eğim ve havalık mantığıyla çalışmasıdır.",
      "Şantiyede pis su işleri çoğu zaman 'boruyu geçir, kapat' yaklaşımıyla yürütüldüğünde ilk sorun koku, yavaş akış veya geri basma olarak ortaya çıkar. İnşaat mühendisi burada yalnız boru çapına değil; eğim sürekliliğine, temizleme kapaklarına, kat geçişlerine ve kapatma sırasına odaklanmalıdır.",
    ],
    theory: [
      "Pis su hattının performansı üç bileşene bağlıdır: yeterli eğim, doğru havalık ve bakım erişimi. Fazla düşük eğim katı maddelerin taşınmasını zorlaştırır, fazla yüksek eğim ise suyun hızlı akıp katı yükü geride bırakmasına neden olabilir.",
      "Binalarda atık su davranışı yalnız düşey kolona bağlı değildir. Yatay branşmanların döşeme içinde veya asma tavan üstünde nasıl döndüğü, temizleme parçası bırakılıp bırakılmadığı ve ıslak hacim ekipmanlarının birbirine göre kötü kritik rol oynar.",
      "Ayrıca pis su tesisatı ses ve koku davranışı da üretir. Boru askıları, dar kesit geçişleri ve havalık eksikliği kullanım kalitesini ciddi biçimde bozar.",
    ],
    ruleTable: [
      {
        parameter: "Atık su drenaj mantığı",
        limitOrRequirement: "Hat eğimi ve düşey-yatay geçişleri sürekli akış sağlayacak biçimde kurulmalıdır.",
        reference: "TS EN 12056",
        note: "Kot ve havalık birlikte okunmadan yalnız boru döşemek yeterli değildir.",
      },
      {
        parameter: "Havalık ve koku kontrolü",
        limitOrRequirement: "Sifonların korunması ve hava hareketi için sistem havalık düzeniyle birlikte değerlendirilmelidir.",
        reference: "TS EN 12056 + saha uygulama disiplini",
        note: "Koku sorunu çoğu zaman eksik veya yanlış havalık davranışından doğar.",
      },
      {
        parameter: "Bakım ve temizleme",
        limitOrRequirement: "Temizleme parçaları ve müdahale noktaları erişilebilir bırakılmalıdır.",
        reference: "4708 sayılı Kanun kapsamındaki teslim yaklaşımı",
        note: "Kapatılan ama açılamayan pis su hattı bakım açısından başarısızdır.",
      },
      {
        parameter: "Ses ve askı düzeni",
        limitOrRequirement: "Askı aralığı, titreşim ve şaft düzeni gürültü üretmeyecek biçimde çözülmelidir.",
        reference: "Saha kalite planı",
        note: "Pis su performansı yalnız akışla değil kullanıcı konforuyla da ölçülür.",
      },
    ],
    designOrApplicationSteps: [
      "Islak hacim ekipmanlarının yerini netleştirmeden yatay branşman kotlarını sahada doğaçlama çözme.",
      "Ana kolon, temizleme parçası ve havalık mantığını şaft kesitiyle birlikte doğrula.",
      "Yatay hatlarda gerçek kot farkını ölçerek ilerle; her dönüşü tavan ve döşeme kalınlığıyla birlikte kontrol et.",
      "Asma tavan kapanmadan önce hatın eğim ve bağlantı düzenini foto-log ile kaydet.",
      "Kullanım öncesi kontrollü su verme, akış gözlemi ve erişim kontrolünü birlikte tamamla.",
    ],
    criticalChecks: [
      "Yatay pis su hattı boyunca yeterli kot farkı gerçekten sağlandı mı?",
      "Kolon ve branşman geçişlerinde temizleme parçası bırakıldı mı?",
      "Havalık düzeni sifon boşalmasına ve kokuya yol açmayacak şekilde çözüldü mü?",
      "Askı ve kelepçe düzeni boruda sehim veya ses üretiyor mu?",
      "Asma tavan ve şaft kapanmadan önce hatın son hali kayıt altına alındı mı?",
    ],
    numericalExample: {
      title: "14 m yatay pis su hattında eğimden doğan kot farkı",
      inputs: [
        { label: "Yatay hat boyu", value: "14 m", note: "Mutfak ve ıslak hacim ortak branşmanı" },
        { label: "Hedef eğim", value: "%2", note: "Örnek saha tasarım eğimi" },
        { label: "Tavan boşluğu", value: "45 cm", note: "Asma tavan üstü kullanılabilir alan" },
        { label: "Hedef", value: "Kot farkının tavan içinde çözülmesi", note: "Koordinasyon kontrolü" },
      ],
      assumptions: [
        "Hattın tamamı aynı yönde akış verecek biçimde çözülecektir.",
        "Boru çapı ve fittings seçimi ayrıca projeye göre belirlenecektir.",
        "Asma tavan ve döşeme kalınlığı koordinasyonu erken aşamada yapılacaktır.",
      ],
      steps: [
        {
          title: "Gerekli kot farkını hesapla",
          formula: "14 m x %2 = 0,28 m",
          result: "Hat boyunca yaklaşık 28 cm kot farkı gerekir.",
          note: "Bu fark, asma tavan koordinasyonunu doğrudan etkiler.",
        },
        {
          title: "Tavan boşluğuyla karşılaştır",
          result: "45 cm'lik boşlukta 28 cm eğim mümkündür; fakat fittings, izolasyon ve askı payı ayrıca kontrol edilmelidir.",
          note: "Tavan boşluğu kağıt üstünde yeterli görünse de sahada diğer tesisatlarla daralabilir.",
        },
      ],
      checks: [
        "Eğim hesabı yalnız başlangıç-son kotla değil tüm dönüşler boyunca korunmalıdır.",
        "Asma tavan boşluğu diğer MEP hatlarıyla birlikte değerlendirilmelidir.",
        "Temizleme parçası ve havalık erişimi tavan kapandıktan sonra da sağlanmalıdır.",
      ],
      engineeringComment: "Pis su hattında birkaç santimetrelik ihmal, teslimden sonra kullanıcıya koku ve taşma şikayeti olarak döner.",
    },
    tools: SIHHI_TOOLS,
    equipmentAndMaterials: SIHHI_EQUIPMENT,
    mistakes: [
      { wrong: "Pis su eğimini sahada göz kararı vermek.", correct: "Hat boyu ve kot farkını ölçüyle kurmak." },
      { wrong: "Temizleme parçasını görünmesin diye kapatmak.", correct: "Bakım erişimini koruyarak çözmek." },
      { wrong: "Havalık sistemini ikincil görmek.", correct: "Akış ve koku davranışının ana parçası olarak değerlendirmek." },
      { wrong: "Tüm pis su sorunlarını boru çapıyla çözmeye çalışmak.", correct: "Eğim, havalık ve koordinasyonu birlikte okumak." },
      { wrong: "Asma tavan kapanmadan önce kayıt almamak.", correct: "Foto-log ve kot kontrolüyle sistemi belgelemek." },
    ],
    designVsField: [
      "Projede birkaç çizgiden ibaret görünen pis su hattı, sahada tavan boşluğu, seramik kötü ve şaft genişliğiyle sınanır.",
      "İyi pis su tesisatı kullanıcı tarafından fark edilmez; kötü tesisat ise koku, ses ve geri basma ile kendini hızla belli eder.",
    ],
    conclusion: [
      "Pis su hattı doğru eğim, havalık ve bakım erişimiyle kurulduğunda yapının konforunu sessizce taşır. Bu üçlüden biri eksildiğinde ise en küçük saha ihmali bile teslim sonrası sürekli müdahale isteyen bir probleme dönüşür.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.tsEn12056, SOURCE_LEDGER.yapiDenetim],
    keywords: ["pis su", "TS EN 12056", "eğim", "havalık", "atık su drenajı"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/sihhi-tesisat", "tesisat-isleri/sihhi-tesisat/temiz-su"],
  },
  {
    slugPath: "tesisat-isleri/elektrik-tesisati/kablolama",
    kind: "topic",
    quote: "Kablolama işi kablo çekmek değil; enerjiyi güvenli, okunabilir ve bakımı mümkün bir fiziksel omurga üzerinde taşımaktır.",
    tip: "Kablolamada en sık hata, tava ve boru güzergahını sadece boşluk bulma işi sanmaktır; yangın geçişi, rezerv kapasite ve etiketleme aynı kararın içindedir.",
    intro: [
      "Kablolama; enerji, aydınlatma, priz ve özel cihaz hatlarının kablo tavası, boru, buat ve cihaz uçları üzerinden fiziksel olarak kurulmasıdır. Bu iş kalemi ilk bakışta çekme ve bağlama operasyonu gibi görünür; ancak yanlış kurgulandığında bakım erişimi zayıf, aşırı dolu ve güvenlik riski taşıyan bir sistem bırakır.",
      "İnşaat mühendisinin kablolama sürecindeki rolü, özellikle diğer disiplinlerle çakışmaları ve kapatma öncesi test zincirini yönetmektir. Asma tavan, şaft, perde geçişi ve ekipman odaları yeterince düşünülmezse sonradan kırma, geçici çözümler ve etiketsiz hatlar oluşur.",
    ],
    theory: [
      "Elektrik kablolarının saha performansı yalnız iletken kesitinden ibaret değildir. Kablo çekme yarıçapı, tava doluluğu, güç ve zayıf akım ayrımı, yangın kesit geçişleri ve mekanik koruma seviyesi aynı derecede önemlidir.",
      "Özellikle yoğun tesisat bölgelerinde kablolama güzergahı mekanik hatlar, sprinkler boruları ve asma tavan askılarıyla çakışır. Bu durumda anlık boşluğa göre yön değiştirmek kısa vadede pratik görünür; fakat uzun vadede as-built dışı ve bakımı zor bir sistem üretir.",
      "Devreye alma öncesi kalite, ölçüm ve etiketleme ile anlaşılır. İzolasyon testi, süreklilik doğrulaması ve devre etiketleri yoksa kablolama tamamlanmış görünse bile güvenli teslim edilemez.",
    ],
    ruleTable: [
      {
        parameter: "Koruma ve devre bütünlüğü",
        limitOrRequirement: "Kablo tesisatı koruma ilkeleri, iletken sürekliliği ve topraklama mantığıyla uyumlu kurulmalıdır.",
        reference: "TS HD 60364",
        note: "Devre güvenliği yalnız şalterle değil fiziksel kablolama kalitesiyle başlar.",
      },
      {
        parameter: "Güzergah ve mekanik koruma",
        limitOrRequirement: "Kablolar uygun taşıyıcı sistem ve bakım erişimiyle döşenmelidir.",
        reference: "TS HD 60364 + saha koordinasyon planı",
        note: "Aşırı dolu tava ve keskin dönüşler uzun vadeli arıza riskini yükseltir.",
      },
      {
        parameter: "Yangın geçişleri",
        limitOrRequirement: "Döşeme ve şaft geçişleri yangın güvenliğiyle birlikte ele alınmalıdır.",
        reference: "Binaların Yangından Korunması Hakkında Yönetmelik",
        note: "Elektrik geçişleri pasif yangın güvenliğinden bağımsız düşünülemez.",
      },
      {
        parameter: "Ölçüm ve etiketleme",
        limitOrRequirement: "İzolasyon, süreklilik ve hat tanımları devreye alma öncesi tamamlanmalıdır.",
        reference: "TS HD 60364 + teslim test planı",
        note: "Kapatılmış ama doğrulanmamış kablo yolu güvenli sayılmaz.",
      },
    ],
    designOrApplicationSteps: [
      "Tek hat şeması, yük listesi ve saha güzergahını birlikte okuyup kablo yolu kapasitesini baştan ayarla.",
      "Güç ve kontrol hatlarını karışık ilerletme; tava, boru ve geçiş detayını kullanım türüne göre ayır.",
      "Kablo çekiminden önce tava doluluğunu, dönüş yarıçapını ve geçiş yangın durdurucu detaylarını kontrol et.",
      "Çekim tamamlandıkça devre uçlarını etiketle; devreye alma gününe toplu bırakma.",
      "İzolasyon ve süreklilik testlerini kapatma öncesi bitirip as-built güzergahla eşleştir.",
    ],
    criticalChecks: [
      "Kablo tavaları bakım ve ek çekim için yeterli rezerv bırakıyor mu?",
      "Güç ve zayıf akım hatları gerektiği gibi ayrılmış mı?",
      "Döşeme ve şaft geçişleri yangın durdurucu detayla tamamlandı mı?",
      "Kablo çekiminde keskin kıvrım veya ezilme oluşturan noktalar var mı?",
      "Hat etiketleri panodaki devre listesiyle birebir uyumlu mu?",
    ],
    numericalExample: {
      title: "28 kW üç fazlı yük için akım okuma örneği",
      inputs: [
        { label: "Aktif güç", value: "28 kW", note: "Küçük mekanik grup beslemesi" },
        { label: "Hat gerilimi", value: "400 V", note: "Üç faz sistem" },
        { label: "Güç katsayısı", value: "0,90", note: "Örnek tasarım kabulü" },
        { label: "Hedef", value: "Devre akımını ön kontrol olarak görmek", note: "Kesit ve koruma seçimine giriş" },
      ],
      assumptions: [
        "Sistem dengeli üç fazlı yük gibi değerlendirilmiştir.",
        "Gerilim düşümü ve montaj yöntemi ayrıca ayrıntılı hesapta kontrol edilecektir.",
        "Bu örnek, kablo kesiti seçiminin tek başına sonucu değildir; ön okuma içindir.",
      ],
      steps: [
        {
          title: "Devre akımını hesapla",
          formula: "I = P / (√3 x V x cosφ) = 28000 / (1,732 x 400 x 0,90)",
          result: "Yaklaşık 44,9 A akım beklenir.",
          note: "Bu değer, koruma ve kesit seçiminde ilk referansı verir.",
        },
        {
          title: "Saha kararını yorumla",
          result: "Kesit seçimi yalnız 45 A bilgisiyle yapılmaz; tava içi sıcaklık, gruplanma ve gerilim düşümü ayrıca değerlendirilir.",
          note: "Kablolama kalitesi, kağıt hesabı ile saha güzergahının birlikte okunmasını gerektirir.",
        },
      ],
      checks: [
        "Akım hesabı yapıldıktan sonra güzergah koşullarıyla yeniden doğrulama yapılmalıdır.",
        "Tava doluluğu ve diğer kabloların gruplanma etkisi ihmal edilmemelidir.",
        "Etiketsiz ve testsiz bırakılan hatlar devreye alınmamalıdır.",
      ],
      engineeringComment: "Kablolamada doğru akım hesabı başlangıçtır; asıl kalite bu hesabın saha taşıyıcı sistemi ve test zinciriyle korunmasında yatar.",
    },
    tools: ELEKTRIK_TOOLS,
    equipmentAndMaterials: ELEKTRIK_EQUIPMENT,
    mistakes: [
      { wrong: "Kablo tavalarını sonradan doldurulacak rastgele hatlar gibi düşünmek.", correct: "Rezerv ve bakım erişimini tasarımın parçası saymak." },
      { wrong: "Geçiş detaylarını yangın durdurucusuz bırakmak.", correct: "Elektrik geçişlerini pasif yangın güvenliğiyle birlikte tamamlamak." },
      { wrong: "Etiketlemeyi çekim bitince topluca yapmaya çalışmak.", correct: "Her hat ilerledikçe uçtan uca tanımlamak." },
      { wrong: "Kabloyu mekanik boşluğa göre sahada yön değiştirmek.", correct: "Koordinasyonu pafta ve saha ölçüsüyle önceden çözmek." },
      { wrong: "İzolasyon testini kapatma sonrasına bırakmak.", correct: "Kablo yolları açıkken ölçüm ve kayıt almak." },
    ],
    designVsField: [
      "Projede kablo güzergahı ince çizgilerle görünür; sahada ise bir tava yüksekliği, bir askı çakışması veya bir yangın geçişi tüm sistemi etkileyebilir.",
      "İyi kablolama sistemi göze çarpmaz ama bakım ekibi için nettir. Kötü kablolama ise ilk arıza anında, hangi hattın nereye gittiği anlaşılamadığında ortaya çıkar.",
    ],
    conclusion: [
      "Kablolama işi, elektrik tesisatının görünmeyen omurgasını kurar. İnşaat mühendisi bu omurgayı rezerv, güvenlik ve kayıt mantığıyla yönetirse hem devreye alma hem de uzun dönem bakım tarafında ciddi avantaj sağlar.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["kablolama", "TS HD 60364", "kablo tavası", "izolasyon testi", "elektrik güzergahı"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/elektrik-tesisati", "tesisat-isleri/elektrik-tesisati/pano-montaj"],
  },
  {
    slugPath: "tesisat-isleri/elektrik-tesisati/pano-montaj",
    kind: "topic",
    quote: "Pano montajı, cihazları kutuya dizmek değil; koruma, seçicilik ve okunabilir işletme mantığını tek gövdede kurmaktır.",
    tip: "Pano montajında en sık hata, bugün çalışan ama yarın bakımcının anlayamayacağı kadar sıkışık ve etiketsiz düzen bırakmaktır.",
    intro: [
      "Elektrik panosu, bina içindeki enerji dağıtımının beyni sayılabilecek noktadır. Ana şalter, kaçak akım koruma, otomatik sigortalar, parafudr ve ölçü ekipmanları burada bir araya gelir. Bu yüzden pano montajı yalnız elektrikçinin kendi işi değil, cihaz odası boyutu, duvar yerleşimi, havalandırma ve bakım erişimi açısından tüm proje disiplinlerini ilgilendirir.",
      "Şantiyede pano montajının değeri çoğu zaman kapak kapandıktan sonra anlaşılır. Etiketsiz devreler, yetersiz rezerv, karmaşık kablo girişi veya bakım alanı bırakmayan kurulumlar ilk arızada büyük zaman kaybı üretir.",
    ],
    theory: [
      "Bir panonun teknik başarısı üç başlıkta okunur: koruma, seçicilik ve okunabilirlik. Koruma cihazlarının doğru sırada ve uygun kapasitede yerleştirilmesi, arıza anında yalnız ilgili kısmın devreden çıkmasını sağlar.",
      "Okunabilirlik ise uzun vadeli bakımın anahtarıdır. Hangi devrenin nereye gittiği, yedek devre olup olmadığı, PE ve N baralarının nasıl ayrıldığı, kablo girişlerinin düzeni ve panoda bırakılan rezerv boşluklar işletme kalitesini belirler.",
      "Saha tarafında ayrıca pano önü boşluğu, nem riski ve servis aydınlatması önemlidir. Bu nedenle pano montajı son gün işi değil, cihaz odası planlamasının erken kararı olmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Koruma ve seçicilik",
        limitOrRequirement: "Ana koruma, kaçak akım ve son devre korumaları anlaşılır hiyerarşiyle kurulmalıdır.",
        reference: "TS HD 60364",
        note: "Arıza halinde tüm sistemin değil ilgili devrenin etkilenmesi hedeflenir.",
      },
      {
        parameter: "Topraklama ve bara düzeni",
        limitOrRequirement: "PE/N baraları ve bağlantılar ölçülebilir, erişilebilir ve net tanımlı olmalıdır.",
        reference: "TS HD 60364 + saha ölçüm disiplini",
        note: "Görsel düzen kadar ölçüm yapılabilirlik de kritik önemdedir.",
      },
      {
        parameter: "Bakım erişimi",
        limitOrRequirement: "Pano önü, yan boşluklar ve kablo giriş alanı güvenli bakım için yeterli bırakılmalıdır.",
        reference: "İşletme güvenliği ve yapı denetim yaklaşımı",
        note: "Pano montajı kapak açılınca başlayacak işi de düşünmelidir.",
      },
      {
        parameter: "Etiketleme ve dokümantasyon",
        limitOrRequirement: "Tüm devreler panoda ve as-built dokümanda aynı kodla tanımlanmalıdır.",
        reference: "Teslim kalite planı",
        note: "Etiketsiz çalışan pano, işletme riski taşır.",
      },
    ],
    designOrApplicationSteps: [
      "Yük listesi, tek hat şeması ve pano rezerv ihtiyacını montaj öncesi netleştir.",
      "Pano yerini nem, bakım alanı ve kablo giriş yönü açısından saha koşullarıyla doğrula.",
      "Koruma cihazları ile PE/N bara düzenini okunabilir hiyerarşiyle yerleştir.",
      "Kablo girişlerini düzenli bağla; gelişigüzel çaprazlama ve sıkışık bağlantı bırakma.",
      "Devreye alma öncesi ölçüm, etiketleme ve as-built eşlemesini tamamla.",
    ],
    criticalChecks: [
      "Pano önünde güvenli çalışma alanı gerçekten bırakıldı mı?",
      "Koruma cihazı sıralaması tek hat şemasıyla uyumlu mu?",
      "PE ve N bağlantıları ölçülebilir ve karışmayacak şekilde ayrıldı mı?",
      "Yedek devre veya modül rezervi bırakıldı mı?",
      "Etiketleme panodaki gerçek devre düzeniyle birebir örtüşüyor mu?",
    ],
    numericalExample: {
      title: "Devre rezervi için pano boyutlandırma yorumu",
      inputs: [
        { label: "Nihai devre sayısı", value: "32 adet", note: "Aydınlatma, priz ve özel hatlar dahil" },
        { label: "Önerilen rezerv oranı", value: "%20", note: "İşletme ve ilave ihtiyaçlar için" },
        { label: "Özel koruma ekipmanı", value: "ana şalter + kaçak akım + SPD", note: "Modül ihtiyacını artırır" },
        { label: "Hedef", value: "Sıkışmayan ve büyüyebilen pano", note: "Bakım odaklı yaklaşım" },
      ],
      assumptions: [
        "Modül hesabı marka-seri detayına göre ayrıca doğrulanacaktır.",
        "Rezerv oranı ileride gelebilecek küçük ilaveler için düşünülmüştür.",
        "Pano düzeni yalnız bugünkü devre sayısına göre kilitlenmeyecektir.",
      ],
      steps: [
        {
          title: "Rezervli devre ihtiyacını hesapla",
          formula: "32 x 1,20 = 38,4",
          result: "En az 39 devre kapasitesi düşünülmelidir.",
          note: "Uygulamada bu değer üst standart pano kademesine yuvarlanır.",
        },
        {
          title: "Pano yerleşimini yorumla",
          result: "Rezerv bırakılmadığında sonraki küçük ekler için ilave pano veya uygunsuz sıkıştırma gerekir.",
          note: "Bugün dolu kurulan pano, yarın ilk tadilatta problem üretir.",
        },
      ],
      checks: [
        "Pano seçimi yalnız bugün bağlanacak devre sayısına göre yapılmamalıdır.",
        "Koruma ekipmanları ve kablo giriş alanı modül hesabına dahil edilmelidir.",
        "Rezerv bırakmak maliyet değil, işletme esnekliği yatırımıdır.",
      ],
      engineeringComment: "İyi pano montajı, bugünkü devreleri düzenlerken yarının bakım ve ilave ihtiyaçlarını da öngören montajdır.",
    },
    tools: ELEKTRIK_TOOLS,
    equipmentAndMaterials: ELEKTRIK_EQUIPMENT,
    mistakes: [
      { wrong: "Panoyu mevcut devre sayısına tam dolu kurmak.", correct: "Rezerv modül ve büyüme payı bırakmak." },
      { wrong: "Etiketlemeyi kapak üstünde genel başlıklarla geçiştirmek.", correct: "Her devreyi panoda ve sahada birebir kodlamak." },
      { wrong: "PE ve N bağlantılarını dağınık bırakmak.", correct: "Ölçülebilir ve anlaşılır bara düzeni kurmak." },
      { wrong: "Pano önünü depo veya tesisat ekipmanıyla daraltmak.", correct: "Bakım ve güvenli müdahale alanını korumak." },
      { wrong: "Tek hat şeması ile sahadaki diziliş arasındaki farkı görmezden gelmek.", correct: "Montaj bitiminde as-built eşlemesini güncellemek." },
    ],
    designVsField: [
      "Projede pano tek kutu sembolüdür; sahada ise tüm dağıtım mantığının fiziksel karşılığıdır. Bu yüzden sahadaki birkaç yanlış bağlantı veya etiketsiz çıkış, kağıttaki doğru tasarımı boşa düşürebilir.",
      "Bakımcının panoyu açtığında aradığı devreyi hemen bulabilmesi, çoğu zaman kullanıcı fark etmese de en değerli kalite göstergesidir.",
    ],
    conclusion: [
      "Pano montajı düzenli, rezervli ve ölçülebilir yapıldığında elektrik sistemi hem güvenli hem de okunabilir olur. İnşaat mühendisi bu aşamada mekan, erişim ve dokümantasyon tarafını ciddiye alırsa yıllarca sürecek bakım problemlerini daha montaj gününde azaltır.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yapiDenetim],
    keywords: ["pano montajı", "TS HD 60364", "etiketleme", "seçicilik", "elektrik panosu"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/elektrik-tesisati", "tesisat-isleri/elektrik-tesisati/kablolama"],
  },
  {
    slugPath: "tesisat-isleri/isitma-sogutma/yerden-isitma",
    kind: "topic",
    quote: "Yerden ısıtma görünmez konfor üretir; bu yüzden sorunları da genellikle şap altına gömülmeden önce çözmek gerekir.",
    tip: "Yerden ısıtmada en büyük hata, boru serimini hızla bitirip kayıt almamaktır; şap döküldükten sonra en küçük ihmalin maliyeti katlanır.",
    intro: [
      "Yerden ısıtma sistemi, düşük sıcaklıkta çalışan sıcak su devrelerinin döşeme içine yerleştirilmesiyle homojen ısı dağılımı sağlayan mekanik çözümdür. Konforlu iç mekan hissi üretmesi ve enerji verimi avantajı nedeniyle sık tercih edilir; fakat bu avantajların sürdürülebilmesi, şap altındaki görünmeyen detayların doğru çözülmesine bağlıdır.",
      "Şantiyede yerden ısıtma çoğu zaman boru serme ve şap dökme sırasına sıkıştırılır. Oysa ısı yalıtım levhası, kenar bandı, kollektör yeri, devre boyu dengesi, basınç testi ve foto-kayıt zinciri bir arada yönetilmezse sistem ya dengesiz ısınır ya da olası kaçak durumunda kırmadan başka çözüm bırakmaz.",
    ],
    theory: [
      "Yerden ısıtma sisteminin başarısı, ısının döşeme yüzeyine dengeli dağılmasıyla ölçülür. Bu denge ise boru aralığı, devre boyu, kollektör yerleşimi ve alt yalıtımın yeterliliğiyle kurulur.",
      "Alt yalıtım ve kenar detayları enerji verimi açısından kritiktir. Yalıtımsız veya eksik kenar bandı bırakılmış döşeme, ısının aşağıya veya duvar birleşimlerine kaçmasına neden olur.",
      "Şap altı kalan her şey, kapatma öncesi test edilmek zorundadır. Basınç altında foto-kayıt almak, devre boylarını etiketlemek ve kollektör çıkışlarını tanımlamak saha mühendisliği için kritik görevlerdir.",
    ],
    ruleTable: [
      {
        parameter: "Enerji verimi ve kabuk ilişkisi",
        limitOrRequirement: "Döşeme altı ısı kaybı sınırlandırılmalı ve sistem kabuk performansıyla uyumlu kurulmalıdır.",
        reference: "TS 825 + Binalarda Enerji Performansı Yönetmeliği",
        note: "Yerden ısıtma verimi, döşeme altı yalıtım kalitesiyle doğrudan ilişkilidir.",
      },
      {
        parameter: "Devre boyu ve dengeleme",
        limitOrRequirement: "Kollektöre bağlı devreler dengeli uzunlukta ve etiketli olmalıdır.",
        reference: "Mekanik sistem tasarım ve devreye alma disiplini",
        note: "Aşırı dengesiz devreler konfor farkı ve basınç kaybı üretir.",
      },
      {
        parameter: "Şap öncesi test",
        limitOrRequirement: "Boru serpantinleri basınç altında test edilip kayıt altına alınmalıdır.",
        reference: "Saha kalite planı",
        note: "Şap altına kalan sistemde test kaydı teslimin ana belgesidir.",
      },
      {
        parameter: "Kollektör erişimi",
        limitOrRequirement: "Kollektör dolabı bakım ve dengeleme için erişilebilir bırakılmalıdır.",
        reference: "İşletme ve bakım yaklaşımı",
        note: "Erişilemeyen kollektör, dengesiz devreyi çözümsüz bırakır.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal ısı ihtiyacını ve döşeme kullanım senaryosunu okuyup kollektör yerini erken belirle.",
      "Alt yalıtım levhası, kenar bandı ve reflektif katmanı eksiksiz ser; yalnız boru desenine odaklanma.",
      "Devre boylarını dengeli tutacak serpantin planını çizip sahada aynı düzeni etiketle.",
      "Şap öncesi basınç testi, foto-kayıt ve mahal bazlı devre listesi oluştur.",
      "Devreye alma sırasında yüzey sıcaklık dağılımını kontrol edip kollektör ayarlarını teslim dosyasına işle.",
    ],
    criticalChecks: [
      "Alt yalıtım levhası ve kenar bantları tüm mahalde süreklilik gösteriyor mu?",
      "Devre boyları kollektörde dengeli dağılıyor mu?",
      "Şap dökülmeden önce basınç testi ve foto-log tamamlandı mı?",
      "Kollektör dolabı erişilebilir ve net etiketlenmiş mi?",
      "Sabit dolap veya tesisat delme riski olan bölgeler işaretlendi mi?",
    ],
    numericalExample: {
      title: "35 m² mahal için yerden ısıtma devre boyu yorumu",
      inputs: [
        { label: "Mahal alanı", value: "35 m²", note: "Salon örneği" },
        { label: "Boru serim aralığı", value: "15 cm", note: "Konfor odaklı örnek değer" },
        { label: "Pay katsayısı", value: "%10", note: "Dönüş ve kollektör bağlantı payı" },
        { label: "Hedef", value: "Devre boyunu dengeli bölmek", note: "Şap öncesi kontrol" },
      ],
      assumptions: [
        "Serpantin düzeni yaklaşık düzenli döşenecektir.",
        "Mahal sabit dolap ve boşlukları bu örnekte ihmal edilmiştir.",
        "Devre başına yaklaşık 90 m üst sınırı aşılmaması hedeflenmektedir.",
      ],
      steps: [
        {
          title: "Toplam boru boyunu yaklaşık hesapla",
          formula: "(35 / 0,15) x 1,10 = 256,7 m",
          result: "Toplam boru boyu yaklaşık 257 m okunur.",
          note: "Bu değer mahal geometrisine göre saha paftasında refine edilir.",
        },
        {
          title: "Devre sayısını yorumla",
          result: "257 m toplam boy, 3 devreye bölündüğünde devre başına yaklaşık 86 m verir.",
          note: "Bu dağılım, dengeli kollektör ayarı için yönetilebilir bir bant sağlar.",
        },
      ],
      checks: [
        "Toplam boru boyu tek devrede bırakılmamalıdır.",
        "Devre boyları birbirinden aşırı sapmamalıdır.",
        "Şap öncesi test ve foto-kayıt tamamlanmadan kapatma yapılmamalıdır.",
      ],
      engineeringComment: "Yerden ısıtmada konfor hissi, çoğu zaman şap altında saklı kalan dengeli devre boylarının sonucudur.",
    },
    tools: IKLIM_TOOLS,
    equipmentAndMaterials: IKLIM_EQUIPMENT,
    mistakes: [
      { wrong: "Boru devrelerini sahada kalan makara uzunluğuna göre bölmek.", correct: "Kollektör dengesi ve mahal ihtiyacına göre planlamak." },
      { wrong: "Kenar bandını bazı duvarlarda atlamak.", correct: "Döşeme genleşmesi ve ısı kaçışını birlikte düşünerek süreklilik sağlamak." },
      { wrong: "Şap öncesi basınç testini belgelememek.", correct: "Manometre kaydı ve foto-log ile teslim etmek." },
      { wrong: "Kollektörü erişilemeyecek dolap içine almak.", correct: "Bakım ve dengeleme yapılabilir yerde bırakmak." },
      { wrong: "Boru güzergahını as-built'e işlememek.", correct: "Delme ve bakım risklerini önlemek için mahal bazlı kayıt oluşturmak." },
    ],
    designVsField: [
      "Yerden ısıtma çizimde estetik bir serpantin olarak görünür; sahada ise en kritik konu, o desenin test edilmiş ve dengeli devrelere dönüşmesidir.",
      "Şap döküldüğünde sistem görünmez hale geldiği için saha disiplininin hataya toleransı düşer. Bu nedenle yerden ısıtma, iyi kayıt tutan ekiplerin sistemidir.",
    ],
    conclusion: [
      "Yerden ısıtma doğru yalıtım, dengeli devre ve güçlü kayıt disipliniyle kurulduğunda çok konforlu ve verimli çalışır. Bu üçlü bozulduğunda ise görünmeyen hatalar, kullanıcının hissettiği dengesiz ısınma veya pahalı kırma işleri olarak geri gelir.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["yerden ısıtma", "kollektör", "TS 825", "şap öncesi test", "devre boyu"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/isitma-sogutma", "tesisat-isleri/isitma-sogutma/klima-tesisat"],
  },
  {
    slugPath: "tesisat-isleri/isitma-sogutma/klima-tesisat",
    kind: "topic",
    quote: "Klima tesisatında cihaz seçimi kadar, bakır hat ve drenajın doğru kurulması da konforun gerçek belirleyicisidir.",
    tip: "Klima işlerinde en pahalı saha hatası, drenajı ve vakum sürecini ikincil görmek; çoğu arıza cihazdan değil bu görünmeyen detaylardan çıkar.",
    intro: [
      "Klima tesisatı; iç ve dış üniteler, bakır soğutucu akışkan hatları, drenaj boruları, enerji-kontrol kabloları ve titreşim azaltıcı bağlantılarla çalışan konfor sistemidir. Sistem başarılıysa kullanıcı yalnız serinliği veya ısıtmayı hisseder; başarısızsa su akması, ses veya verimsiz çalışma olarak fark edilir.",
      "İnşaat sahasında klima tesisatı çoğu zaman 'üniteyi tak, bakırı çek' refleksiyle yürütülür. Oysa drenaj eğimi, vakum ve kaçak testi, dış ünite servis boşluğu ve bakır boru izolasyonu çözülmeden yapılan montajlar hem enerji verimini hem de ömrü ciddi biçimde etkiler.",
    ],
    theory: [
      "Klima sisteminde iki ayrı akış aynı anda yönetilir: soğutucu akışkan hattı ve yoğuşma suyu drenajı. Bakır boru hattı cihaz verimini, drenaj hattı ise iç ünite kullanım kalitesini belirler.",
      "Dış ünite yerleşimi de sistem davranışının büyük parçasıdır. Yetersiz hava sirkülasyonu, titreşimli oturum veya servis erişimi olmaması cihaz kapasitesini düşürür ve bakım kabiliyetini azaltır.",
      "Sahadaki önemli kararlar arasında vakum, kaçak kontrolü ve drenaj testi yer alır. Özellikle tavan arkasında veya duvar içinde kalan hatlarda bu kontroller yapılmadan kapatma, ileride kullanıcı mahalline su akması veya performans düşüklüğü olarak geri döner.",
    ],
    ruleTable: [
      {
        parameter: "Enerji ve ısı kaybı",
        limitOrRequirement: "Soğutucu hat izolasyonu ve cihaz yerleşimi enerji performansını desteklemelidir.",
        reference: "TS 825 + Binalarda Enerji Performansı Yönetmeliği",
        note: "İzolasyon eksikliği yalnız kayıp değil yoğuşma ve damlama da üretir.",
      },
      {
        parameter: "Drenaj ve yoğuşma kontrolü",
        limitOrRequirement: "Kondens hattı kesintisiz eğim ve bakım imkanıyla çözülmelidir.",
        reference: "Saha mekanik kalite planı",
        note: "Su akma şikayetlerinin büyük kısmı cihazdan değil drenaj hattından doğar.",
      },
      {
        parameter: "Bakım erişimi ve servis boşluğu",
        limitOrRequirement: "İç ve dış üniteler servis yapılabilir konumda bırakılmalıdır.",
        reference: "İşletme ve bakım yaklaşımı",
        note: "Servis erişimi olmayan cihaz doğru çalışsa bile sürdürülebilir değildir.",
      },
      {
        parameter: "Geçiş ve yangın güvenliği",
        limitOrRequirement: "Şaft ve duvar geçişleri kapatma ve yangın güvenliğiyle uyumlu çözülmelidir.",
        reference: "Binaların Yangından Korunması Hakkında Yönetmelik + saha koordinasyonu",
        note: "Mekanik geçişler pasif yangın detayından ayrı ele alınmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "İç ve dış ünite yerlerini servis boşluğu ve cephe/şaft koordinasyonuyla birlikte belirle.",
      "Bakır hat güzergahını mümkün olduğunca kısa, erişilebilir ve izolasyon sürekliliği bozulmayacak biçimde kur.",
      "Drenaj hattını bağımsız düşünme; gerçek eğimi saha kotuyla birlikte doğrula.",
      "Kapatma öncesi vakum, kaçak kontrolü ve drenaj testini kayıt altına al.",
      "Devreye alma sonrası cihaz etiketleri, hat güzergahı ve bakım notlarını teslim klasörüne işle.",
    ],
    criticalChecks: [
      "Drenaj hattı boyunca sürekli eğim sağlandı mı, ters eğim noktası kaldı mı?",
      "Bakır boru izolasyonu tüm hat boyunca süreklilik gösteriyor mu?",
      "Dış ünitenin hava alma-verme ve servis boşluğu yeterli mi?",
      "Hat vakumu ve kaçak kontrolü kapatma öncesi belgelendi mi?",
      "İç ünite bakım kapağı ve filtre erişimi kullanıcı mahallinde mümkün mü?",
    ],
    numericalExample: {
      title: "8 m klima drenaj hattında minimum kot farkı yorumu",
      inputs: [
        { label: "Drenaj hattı boyu", value: "8 m", note: "İç üniteden şaft düşeyine kadar" },
        { label: "Hedef minimum eğim", value: "%1", note: "Örnek saha kabulü" },
        { label: "Asma tavan boşluğu", value: "20 cm", note: "Kullanılabilir net boşluk" },
        { label: "Hedef", value: "Drenajın tavan içinde çözülebilirliği", note: "Koordinasyon kontrolü" },
      ],
      assumptions: [
        "Hat boyunca gereksiz ters dönüş yapılmayacaktır.",
        "İzolasyon ve askı payı ayrıca boşluk hesabına dahil edilecektir.",
        "Pompa kullanılmayan doğal akış senaryosu düşünülmektedir.",
      ],
      steps: [
        {
          title: "Gerekli kot farkını hesapla",
          formula: "8 m x %1 = 0,08 m",
          result: "Hattın çalışması için yaklaşık 8 cm kot farkı gerekir.",
          note: "Bu fark, tavan boşluğu planlamasında ana girdidir.",
        },
        {
          title: "Boşlukla karşılaştır",
          result: "20 cm'lik tavan boşluğunda 8 cm eğim mümkündür; ancak askı, izolasyon ve diğer tesisatlarla çakışma ayrıca kontrol edilmelidir.",
          note: "Sahada ters eğim oluşturan tek bir askı hatası bile su akmasına yol açabilir.",
        },
      ],
      checks: [
        "Drenaj hesabı yapılmadan asma tavan kötü kesinleştirilmemelidir.",
        "Drenaj hattı içinde su biriktirecek sehimler bırakılmamalıdır.",
        "Vakum ve kaçak kontrolü kayda bağlanmadan sistem kapatılmamalıdır.",
      ],
      engineeringComment: "Klima tesisatında kullanıcıyı en hızlı rahatsız eden sorun çoğu zaman cihaz arızası değil, birkaç santimetrelik hatalı drenaj geometrisidir.",
    },
    tools: IKLIM_TOOLS,
    equipmentAndMaterials: IKLIM_EQUIPMENT,
    mistakes: [
      { wrong: "Drenaj hattını tesadüfi boşluğa göre döşemek.", correct: "Gerçek kot farkını önceden hesaplayıp ona göre çözmek." },
      { wrong: "Bakır boru izolasyonunu ek yerlerinde açık bırakmak.", correct: "Tüm hat boyunca süreklilik sağlamak." },
      { wrong: "Vakum ve kaçak testini hızlı geçmek.", correct: "Devreye alma kalitesinin ana parçası olarak belgelemek." },
      { wrong: "Dış üniteyi servis erişimsiz ve havasız noktaya sıkıştırmak.", correct: "Bakım ve hava sirkülasyonu için yeterli boşluk bırakmak." },
      { wrong: "İç ünite bakım kapağını dekoratif çözüm uğruna kapatmak.", correct: "Filtre ve servis erişimini görünmez ama mümkün bırakmak." },
    ],
    designVsField: [
      "Projede klima hattı birkaç sembol ve bakır çizgiden ibaret görünür; sahada ise drenaj eğimi, servis boşluğu ve izolasyon detayları cihaz performansını doğrudan belirler.",
      "İyi klima tesisatı sessiz, kuru ve bakımı kolay çalışır. Kötü klima tesisatı ise kullanıcıya cihazdan önce su damlaması ve sesle kendini anlatır.",
    ],
    conclusion: [
      "Klima tesisatı doğru drenaj, doğru vakum ve doğru erişimle kurulduğunda küçük görünmesine rağmen yüksek kullanıcı konforu sağlar. Bu detaylar ihmal edildiğinde ise teslim sonrası müdahale gerektiren ilk sistemlerden biri haline gelir.",
    ],
    sources: [...TESISAT_LEAF_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["klima tesisatı", "drenaj hattı", "vakum", "bakır boru", "yoğuşma suyu"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/isitma-sogutma", "tesisat-isleri/isitma-sogutma/yerden-isitma"],
  },
];
