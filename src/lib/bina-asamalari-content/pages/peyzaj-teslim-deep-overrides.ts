import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PEYZAJ_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["peyzaj-teslim"]];

const PEYZAJ_TOOLS: BinaGuideTool[] = [
  { category: "Ölçüm", name: "Total station, lazer nivo ve drenaj kontrol listesi", purpose: "Acik alan kotlarini, yüzey egimlerini ve su yonunu sayisal olarak dogrulamak." },
  { category: "Koordinasyon", name: "Peyzaj as-built ve altyapi matrisi", purpose: "Sulama, aydinlatma, drenaj ve sert zemin detaylarini tek kapanis setinde toplamak." },
  { category: "Bakım", name: "Bitkisel bakım ve mevsimsel takip plani", purpose: "Teslim sonrasi ilk bakım surecini isletme ekibine okunabilir halde devretmek." },
  { category: "Kontrol", name: "Acil alan kullanimi ve yaya rotasi checklisti", purpose: "Acik alanin yalnız estetik degil guvenli kullanım performansini da denetlemek." },
];

const PEYZAJ_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Altyapi", name: "Alt temel, drenaj hatti, yağmur suyu ızgarasi ve geotekstil katmanlar", purpose: "Sert zemin ve yesil alanlarda su davranisini kontrollu sekilde yönetmek.", phase: "Alt hazirlik" },
  { group: "Uygulama", name: "Bordur, parke, beton yol ve zemin sıkıştırma ekipmanlari", purpose: "Acik alan yüzeyini taşıyıcı ve düzgün hale getirmek.", phase: "Sert zemin imalati" },
  { group: "Bitkisel", name: "Bitkisel toprak, sulama hatti, damlatma sistemi ve dikim ekipmanlari", purpose: "Bitkisel peyzaji yalnız dikmek değil yaşatmak için gerekli altyapiyi kurmak.", phase: "Bitkisel peyzaj" },
  { group: "Teslim", name: "Bakım klasoru, bitki listesi ve garanti kayitlari", purpose: "Isletme ekibine bakım ve yenileme bilgisini düzenli devretmek.", phase: "Kapanis" },
];

export const peyzajTeslimDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "peyzaj-teslim/peyzaj-ve-cevre-duzenleme",
    kind: "topic",
    quote: "Peyzaj ve çevre duzenleme, bina cevresini guzellestirmekten once suyu, erisimi ve acik alan kullanimini doğru yonetme isidir.",
    tip: "Dış sahayi sadece son görsel dokunus gibi gormek, ilk yagmurda ortaya cikacak kot, golenme ve erişim sorunlarini gizlemekten baska bir sey degildir.",
    intro: [
      "Peyzaj ve çevre duzenleme, bir yapinin kullaniciyla ilk fiziksel temas kurdugu alandir. Yaya akslari, girisler, sert zeminler, bordurler, yesil alanlar, sulama ve acik alan mobilyalari burada bir araya gelir. Kullanıcı binayi gormeden once çoğu kez dış sahayi deneyimler; bu nedenle acik alan performansi, yapinin genel kalite algisinin parcasidir.",
      "Sahada en sık yapılan hata, peyzaji santiyenin sonunda kalan dekoratif paket gibi ele almaktir. Oysa dış saha; yagmur suyunun nereye gittigini, aracin nerede durdugunu, engelli veya cocuklu bir kullanicinin nasıl ilerledigini ve bakım ekibinin bu alanlari nasil yonetecegini belirler. Yani mesele bitki secmekten daha büyüktür.",
      "Bir insaat muhendisi için peyzaj ve çevre duzenleme; kot, egim, sikistirma, drenaj, altyapi koordinasyonu ve teslim sonrasi bakım bilgisinin birlikte kapatildigi son saha paketidir. Bu paket zayif kaldiginda bina fiziksel olarak bitmis görünse bile kullanima hazir görünmez.",
      "Bu nedenle dış sahayi son anda tamamlanan bir estetik kalem yerine, projenin acik alan performansini tanimlayan teknik kapanis fazi olarak okumak gerekir.",
    ],
    theory: [
      "Dış saha performansinin ana belirleyicisi su yonetimidir. Sert zemin doğru egimde degilse, bordur ve ızgara kotlari uyumlu degilse veya alt temel suyu saglikli tasimiyorsa en pahali kaplama bile kısa surede cökme, golenme veya kirlenme problemi uretir. Yuzeyde gorunen kusur çoğu zaman altyapı problemidir.",
      "Bitkisel peyzaj tarafında da benzer bir durum vardir. Bitki secimi kadar toprak derinligi, sulama altyapisi, drenaj ve mevsimsel bakım planı kritiktir. Sadece dikilen ama yasatilmayan peyzaj, teslim aninda güzel görünse de ilk mevsim degisiminde kalite kaybeder. Bu nedenle peyzajın teknik başarısı, dikim gunu değil sonraki bakım senaryosuyla ölçülür.",
      "Açik alanlar aynı zamanda güvenlik ve erişim alanlarıdır. Giriş rampasi, yaya yolu, otopark geçişi, acil durum erişimi ve gece kullanımı birlikte çözülmelidir. Yüzey kaplamasinin kayma davranışı, kot farklarının yönetimi ve aydınlatma ile yönlendirme elemanları bu performansin ayrılmaz parçasıdır.",
      "Bu yüzden peyzaj ve çevre duzenleme, mimari çizimde renkli tarama olarak görülen bir tema değil; su, zemin ve kullanıcı hareketinin birlikte yönetildigi açık alan mühendisliğidir.",
    ],
    ruleTable: [
      {
        parameter: "Kot ve egim sürekliligi",
        limitOrRequirement: "Acik alan suyu yapidan uzağa ve tasarlanan drenaj noktasina yonlendirilmeli",
        reference: "Planli Alanlar Imar Yonetmeligi + saha kalite plani",
        note: "Dış sahada yanlış kot, binaya doğru su basma riskini büyütür.",
      },
      {
        parameter: "Alt temel ve sikistirma",
        limitOrRequirement: "Sert zemin kaplamasi taşıyıcı alt temel ve yeterli sikistirma uzerine kurulmalı",
        reference: "Saha kabul disiplini",
        note: "Kaplamanin ömrü üst malzemeden çok alt hazırlığa bağlıdır.",
      },
      {
        parameter: "Yaya erisimi ve güvenlik",
        limitOrRequirement: "Yaya rotalari, girişler ve kot farklari güvenli, okunabilir ve bakım dostu olmalı",
        reference: "Planli Alanlar Imar Yonetmeligi",
        note: "Peyzaj estetik kadar günlük kullanım güvenliği de üretmelidir.",
      },
      {
        parameter: "Bitkisel peyzaj altyapisi",
        limitOrRequirement: "Toprak derinligi, sulama ve drenaj sistemi bitkinin kalici yasamina uygun olmali",
        reference: "Peyzaj uygulama ve teslim plani",
        note: "Sadece dikim yapmak, peyzaji tamamlamak anlamina gelmez.",
      },
      {
        parameter: "Teslim ve bakım devri",
        limitOrRequirement: "As-built, bitki listesi, sulama zonlari ve bakım talimatlari isletmeye aktarilmali",
        reference: "Teslim kalite plani",
        note: "Bakım bilgisi devredilmeyen dış saha, yarim teslimdir.",
      },
    ],
    designOrApplicationSteps: [
      "Bina giriş kotlari ile dış saha kotlarini tek modelde okuyup suyun akacagi yönleri kesinleştir.",
      "Sert zemin alt temelini, sıkıştırma seviyesini ve ızgara/menhol kotlarini kaplama öncesi bağımsız kabul et.",
      "Yaya akslari, araç rotasi, engelli erişimi ve bakım güzergahlarini çakışma üretmeyecek şekilde planla.",
      "Bitkisel alanlarda toprak derinligi, drenaj tabakasi ve sulama zonlarini dikimden önce sahada doğrula.",
      "Bordür, kaplama, yeşil alan ve altyapi kapaklari arasindaki kot geçişlerini temiz bitiş detayıyla tamamla.",
      "Teslimden once yagmur veya su verme senaryosu üzerinden açık alanı gez; golenme, çamur, kayma ve erişim riskini fiilen test et.",
    ],
    criticalChecks: [
      "Giriş ve yaya yollarinda suyu yapıya geri iten ters egim var mi?",
      "Kaplama alt temelinde zayif sıkışma veya lokal oturma belirtisi görülüyor mu?",
      "Rögar, ızgara ve kapak kotlari bitmis yuzeyle uyumlu mu?",
      "Bitkisel alanlarda toprak derinligi ve sulama hattı gerçekten yeterli mi?",
      "Yaya rotasi gece kullanimi ve bakım araci erişimi açısından güvenli mi?",
      "Teslim dosyasinda bitkisel bakım ve sulama zon bilgisi açık biçimde yer aliyor mu?",
    ],
    numericalExample: {
      title: "18 m yaya aksinda egim ve kot farki yorumu",
      inputs: [
        { label: "Yaya yolu uzunlugu", value: "18 m", note: "Ana giriş aksı" },
        { label: "Hedef yüzey egimi", value: "%1,5", note: "Suyun kontrollu tahliyesi için" },
        { label: "Kaplama tipi", value: "Beton parke", note: "Sert zemin ornegi" },
        { label: "Hedef", value: "Golenmesiz ve güvenli açık alan", note: "Teslim performansı için" },
      ],
      assumptions: [
        "Suyun yönleneceği ızgara veya drenaj noktası projede belirlenmiştir.",
        "Kaplama alt temel ve bordür sistemi bu geometriyi taşıyacaktır.",
        "Rampa ihtiyaci ayri aksla çözülmemiş, ana yaya aksı içinde değerlendirilmektedir.",
      ],
      steps: [
        {
          title: "Toplam kot farkini hesapla",
          formula: "18 x 0,015 = 0,27 m",
          result: "18 m boyunca yaklasik 27 cm kot farki gerekir.",
          note: "Bu fark, suyun yüzeyde kalmadan planlanan drenaj noktasina akmasına yardim eder.",
        },
        {
          title: "Kullanıcı etkisini yorumla",
          result: "Kot farki bir noktada yığılmamalı, yol boyunca dengeli dagitilmalidir.",
          note: "Tüm farki giriş önünde vermek, erişim ve konforu bozar.",
        },
        {
          title: "Altyapi uyumunu kontrol et",
          result: "Izgara, menhol ve bordür kotlari 27 cm'lik genel geometri ile aynı mantıkta çözülmelidir.",
          note: "Aksi halde yüzey doğru görünse bile su en zayif detaya birikir.",
        },
      ],
      checks: [
        "Eğim hesabı sahada lazer ile doğrulanmalidir.",
        "Suyun akacagi nokta net değilse doğru egim de tek basina yeterli olmaz.",
        "Kaplama alt temel ve kenar detaylari genel geometriyle birlikte okunmalidir.",
        "Teslim öncesi kontrollu su deneyi, kağıt üzerindeki kot kararını sahada test etmelidir.",
      ],
      engineeringComment: "Dış sahada birkaç santimetrelik kot farki, kullanicinin yıllarca yaşayacağı su davranisini belirler.",
    },
    tools: PEYZAJ_TOOLS,
    equipmentAndMaterials: PEYZAJ_EQUIPMENT,
    mistakes: [
      { wrong: "Peyzaji yalnız bitki ve kaplama seçimi gibi görmek.", correct: "Kot, drenaj ve erişim performansini ana karar olarak ele almak." },
      { wrong: "Sert zemin alt temelini üst kaplama kadar ciddiye almamak.", correct: "Sıkıştırma ve altyapı kabulünü kaplama öncesi yapmak." },
      { wrong: "Rögar ve ızgara kotlarini sonradan ayarlamaya çalışmak.", correct: "Yüzey geometrisiyle birlikte en baştan çözmek." },
      { wrong: "Bitkisel alanı bakım altyapisindan bağımsız düşünmek.", correct: "Toprak, sulama ve mevsimsel bakım planını birlikte kurmak." },
      { wrong: "Yaya güvenliğini estetikten sonra düşünmek.", correct: "Giriş, rampa ve gece kullanımını tasarımın merkezine almak." },
      { wrong: "Teslimde bakım ve as-built bilgisini vermemek.", correct: "Isletmeye açık, okunabilir ve güncel devir dosyasi bırakmak." },
    ],
    designVsField: [
      "Tasarim tarafinda peyzaj renkli ve davetkar bir plan gibi görünür; sahada ise suyun nereye gittigi, kullanicinin nereden yürüdügü ve bakım ekibinin alanı nasıl yönetecegi asıl kaliteyi belirler.",
      "Dış saha ne kadar iyi tasarlanırsa tasarlansin, eger kot ve altyapi düzgün kurulmamissa ilk yagmur kalite testini başarısız geçirir.",
      "Bu nedenle çevre duzenleme, mimari son dokunus degil işleyen açık alan sistemi üretme işidir.",
    ],
    conclusion: [
      "Peyzaj ve çevre duzenleme doğru kot, doğru altyapi ve doğru bakım devri ile yürütüldüğünde yapının açık alan performansını güvenli ve uzun ömürlü hale getirir. Aynı alan bu disiplinler kurulmadan tamamlanırsa sorun ilk mevsim değişiminde görünür olur.",
      "Saha tarafinda en sağlam yaklaşım, dış sahayi son dakika kapanan dekoratif kalem değil, teslimin en görünür fonksiyon testi olarak yönetmektir. Bu bakış, hem kullanıcı memnuniyetini hem de teslim sonrasi bakım maliyetini doğrudan etkiler.",
    ],
    sources: [...PEYZAJ_DEEP_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu],
    keywords: ["peyzaj ve çevre duzenleme", "dış saha kötü", "drenaj", "sert zemin", "teslim ve bakım"],
    relatedPaths: ["peyzaj-teslim", "peyzaj-teslim/sert-zemin", "peyzaj-teslim/bitkisel-peyzaj"],
  },
];
