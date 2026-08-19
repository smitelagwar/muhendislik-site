import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13279_SOURCE: BinaGuideSource = {
  title: "TS EN 13279 Alcili Baglayicilar ve Alçı Sivalar",
  shortCode: "TS EN 13279",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alçı sıva malzemeleri, siniflandirma ve temel performans gereklilikleri için referans kabul edilir.",
};

const PLASTER_TOOLS: BinaGuideTool[] = [
  { category: "Hazirlik", name: "Yüzey nemi ve duzlugu kontrol seti", purpose: "Alçı sıvanın tutunacagi zemini malzeme öncesi dogrulamak." },
  { category: "Uygulama", name: "Mastar, köşe profili ve kalinlik referanslari", purpose: "Sivayi sadece kaplama değil geometri duzeltme araci olarak yonetmek." },
  { category: "Kontrol", name: "Mahal bazli bitis kalitesi checklisti", purpose: "Boyadan önce görünmez kusurlari yakalamak." },
  { category: "Kayıt", name: "Numune duvar ve kabul panosu", purpose: "Ustanin yorum farkini azaltip ortak kalite dili kurmak." },
];

const PLASTER_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Malzeme", name: "Alçı baglayici, sıva harci ve yardimci katkilar", purpose: "İç mekan duvar ve tavanlarda düzgün bitis zemini olusturmak.", phase: "Karisim ve uygulama" },
  { group: "Yüzey hazirlik", name: "Astar, file, köşe profili ve onarim malzemeleri", purpose: "Tutunmayi ve koselerde darbe direncini desteklemek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Mastar, mala, spatula ve kalinlik aparatlari", purpose: "Sivayi kontrollu kalinlik ve duzluguyle uygulamak.", phase: "Uygulama" },
  { group: "Kontrol", name: "Nem olcer, uzun mastar ve isik kontrol ekipmani", purpose: "Boyadan önce kalan dalga, boşluk ve nem riskini yakalamak.", phase: "Kabul" },
];

export const finishPlasterDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/siva/alci-siva",
    kind: "topic",
    quote: "Alçı sıva, duvari boyaya hazirlayan ince katman değil; iç mekandaki duzlugu, detay okunurlugunu ve son kaplama kalitesini belirleyen temel zemin isidir.",
    tip: "Alçı sivayi boyadan önce gelen son dokunus gibi görmek, yüzey nemi, kalinlik, file detaylari ve koselerdeki geometrik kaliteyi gözden kacirmaktir.",
    intro: [
      "Alçı sıva iç mekanda cogu zaman son boya öncesi yapilan rutin bir kalem gibi algilanir. Oysa boyada gorulen dalga, kapida fark edilen kirik koseler, mobilya montajinda ortaya cikan duvar egiklikleri ve isik altinda beliren yüzey kusurlari buyuk olcude alçı sıvanın kalitesine dayanir. Bu nedenle alçı sıva basit bir duvar kaplama isi değil; son gorunen mekan kalitesini belirleyen temel ara tabakadir.",
      "Sahada en sık problem, alçı sıvanın 'boya nasil olsa toparlar' varsayimi ile ele alinmasidir. Nemli veya tozlu yuzeye girilen sıva kabarir, kalinlik kontrolü zayifsa duvar dalgalanir, koselerde profil kullanilmazsa darbe ve kirmalar başlar, farkli malzeme birlesimlerinde file atlanirsa kısa surede çatlak belirir. Bu kusurlar teslime kadar bazen gizlenir; fakat gun isigi ve kullanıcı temasi ile hemen ortaya çıkar.",
      "Bir inşaat mühendisi için alçı sıva, yalnız dekoratif bir bitis degildir. Duvar altyapisinin ne kadar doğru oldugunu, mekan geometri kalitesini, tesisat tamiratlarinin ne kadar temiz kapatildigini ve boya ekibinin ne kadar saglam zeminde calisacagini belirler. Dolayisiyla ince islerin zincir etkisi bu kalemde çok nettir.",
      "Bu yazida alçı sivayi; malzeme teorisi, standart gereksinimleri, sayisal kalinlik yorumu, saha araclari ve sık yapilan hatalarla birlikte tam blog yazisi duzeyinde ele aliyoruz. Hedef, alçı sivayi boyaya hazirlik adimi değil, mekan kalitesinin taşıyıcı altligi olarak gormektir.",
    ],
    theory: [
      "Alçı sıvanın teorik temeli, yuzeye kontrollu kalinlikta yapisarak düzgün, ince dokulu ve boyaya uygun bir bitis zemini olusturmasidir. Fakat bu davranis malzemenin tek basina ozelligi degildir; alt yuzeyin emiciligi, temizligi, nem durumu ve uygulama kalinligi sonucu belirler. Aynı torba malzeme, iki farkli duvarda çok farkli performans gosterebilir.",
      "Yüzey hazirligi bu nedenle hayati onemdedir. Asiri emici bir yuzeyde sıva suyunu çok hızlı kaybedebilir, tozlu veya gevsek altlikta tutunma azalir, betonarme ile tuğla birlesimlerinde ise farkli hareketler çatlak riski dogurur. Bu gecislerde file, astar veya uygun onarim hazirligi olmadan atilan sıva kısa surede sorun uretir.",
      "Kalinlik ve geometri kontrolü de diger temel unsurdur. Alçı sıva, duvari sinirsiz kalinlikla duzelten bir malzeme degildir. Çok kalin uygulamalar kurumayi zorlastirir, yuzeyde cekme farklari yaratir ve isciligi zayiflatir. Çok ince ve dengesiz uygulamalar ise alttaki kusuru kapatamaz. Bu nedenle sıva, duvari kurtaran bir kamuflaj değil; kontrollu bir bitis katmani olarak dusunulmelidir.",
      "Köşe ve birleşim detaylari kullanıcı deneyiminde çok daha belirgindir. Duvar tavan birleşimi, pencere kenari, elektrik kasa cevresi ve kapı donusleri isik alan hassas bolgelerdir. Buralarda zayif mastarlama veya profilsiz uygulama tüm mekanin kalitesini asagi ceker. Iyi alçı sıva sadece duz duvar değil, temiz detay donusleri de uretmelidir.",
      "Bu bakisla alçı sıva, ince islerin arka planda kalan kahramanidir. Boya, duvar kagidi veya dekoratif kaplama ne kadar iyi olursa olsun, altlik kalitesi zayifsa final sonuc tatmin etmez.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve uygulama cercevesi",
        limitOrRequirement: "Alçı sıva malzemesi ve uygulama kosullari uygun sinifta ve tavsiye edilen hazirlikla kullanilmalidir",
        reference: "TS EN 13279",
        note: "Malzeme secimi kadar karisim ve uygulama kosulu da performansi belirler.",
      },
      {
        parameter: "Yüzey hazirligi",
        limitOrRequirement: "Alt yüzey temiz, uygun emicilikte ve gerekirse astarlanmis olmalidir",
        reference: "TS EN 13914 + saha uygulama disiplini",
        note: "Hazirlanmamis yuzeye iyi sıva tutunmasi beklenemez.",
      },
      {
        parameter: "Kalinlik ve duzlugu kontrolü",
        limitOrRequirement: "Sıva duvari kamufle eden asiri kalin katman yerine kontrollu kalinlikta uygulanmalidir",
        reference: "Uygulama kalite plani",
        note: "Sıva kalitesi mastar ve referansla yonetilmelidir.",
      },
      {
        parameter: "Birleşim ve çatlak kontrolü",
        limitOrRequirement: "Farkli malzeme gecisleri, tamirat noktalar ve hassas koseler uygun detaylarla guclendirilmelidir",
        reference: "TS EN 13914",
        note: "Catlaklar cogu zaman malzeme farkinin dikkate alinmadigi noktada başlar.",
      },
      {
        parameter: "Boya öncesi kabul",
        limitOrRequirement: "Yüzey duzlugu, nem durumu ve lokal tamirler boya öncesi ayri kalite kapisinda kabul edilmelidir",
        reference: "Son kat boya kalite plani",
        note: "Boyaya gecilen kusur, daha pahali bir sekilde tekrar geri doner.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yuzeyi toz, gevsek parca, asiri nem ve emicilik farki acisindan kontrol et; gerekirse astar ve file kararini önceden ver.",
      "Mahal bazli referans kotlari ve mastar noktalarini kurarak duvari göz karariyla değil cizgisel referansla duzelt.",
      "Köşe profilleri, pencere donusleri ve tesisat tamirat noktalarini genel uygulamadan önce hazirla.",
      "Alçı sivayi kontrollu kalinlikta ve yeterli isleme süresi icinde uygula; kurumus malzemeyi su ile geri canlandirma.",
      "Bitis öncesi isik altinda ve uzun mastarla dalga, cukur ve çatlak risklerini tara.",
      "Boyaya gecmeden önce nem, duzlugu ve lokal tamirleri ayri kabul tutanagiyla kapat.",
    ],
    criticalChecks: [
      "Alt yuzeyde toz, gevsek tabaka veya nem kaynakli risk kalmis mi?",
      "Farkli malzeme birlesimlerinde file veya uygun detay kullanilmis mi?",
      "Koseler profil ve mastar ile gercekten düzgün cikmis mi?",
      "Uzun mastarla duvar duzlugu mahal boyunca kontrol edilmis mi?",
      "Tesisat tamiratlari duvar genel kalitesiyle aynı seviyede kapatilmis mi?",
      "Boya öncesi yüzey nemi ve kuruma durumu teyit edilmis mi?",
    ],
    numericalExample: {
      title: "4 m uzunlugunda duvarda sıva kalinlik yorumu",
      inputs: [
        { label: "Olculen en derin duvar kacikligi", value: "18 mm", note: "Mastar altinda okunan en olumsuz nokta" },
        { label: "Hedef ortalama sıva kalinligi", value: "10 mm", note: "Bitis kalitesi için istenen bant" },
        { label: "Lokal fark", value: "8 mm", note: "Duvar geometri sapmasi" },
        { label: "Amac", value: "Sıva ile duvar geometri iliskisini yorumlamak", note: "Ogretici saha karari" },
      ],
      assumptions: [
        "Duvar genel olarak uygulanabilir duzeydedir ancak lokal kaciklik tasimaktadir.",
        "Tek katla tüm problemi kapatma hedefi yoktur.",
        "Hesap malzeme katalog limitinin yerine gecmez, mantik anlatimi icindir.",
      ],
      steps: [
        {
          title: "Geometri sapmasini degerlendir",
          result: "18 mm'lik en olumsuz nokta, duvarda lokal bir duzeltme ihtiyaci oldugunu gosterir.",
          note: "Sivayi butun duvara asiri kalin tasimak yerine lokal duzeltme mantigi gerekir.",
        },
        {
          title: "Hedef ortalama ile karsilastir",
          formula: "18 - 10 = 8 mm",
          result: "Yaklasik 8 mm ilave yerel duzeltme ihtiyaci vardir.",
          note: "Bu fark önce altlikta veya onarimla cozulmezse sıva katmani gereksiz yere zorlanir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Alçı sıva, ciddi duvar kacikliklarini gizlemek için değil son duzlugu vermek için kullanilmalidir.",
          note: "Sivayla geometri kurtarmaya çalışmak kalinlik ve çatlak riski uretir.",
        },
      ],
      checks: [
        "Mastar okumasi duvari boydan boya tarayacak uzunlukta yapilmalidir.",
        "Yerel onarim gerektiren bolgeler genel sıva kalinligina yayilmamalidir.",
        "Koseler ve donusler duvar orta aksindan ayri olarak kontrol edilmelidir.",
        "Boya öncesi isik kontrolü geometri kusurlarini daha net gosterecektir.",
      ],
      engineeringComment: "Alçı sıva duvari kurtaran mucize değil; düzgün altyapi isteyen hassas bir bitis katmanidir.",
    },
    tools: PLASTER_TOOLS,
    equipmentAndMaterials: PLASTER_EQUIPMENT,
    mistakes: [
      { wrong: "Nemli, tozlu veya astarsiz yuzeye alçı sıva uygulamak.", correct: "Yüzey hazirligini malzeme davranisinin temel adimi kabul etmek." },
      { wrong: "Duvar kacikliklarini tek katta asiri kalin sıva ile kapatmaya çalışmak.", correct: "Lokal duzeltme ve kontrollu kalinlik mantigi kurmak." },
      { wrong: "Malzeme birlesimlerinde file ve detay takviyesini atlamak.", correct: "Çatlak riski olan gecisleri önceden guclendirmek." },
      { wrong: "Koseleri profisiz ve göz karariyla bitirmek.", correct: "Köşe profil ve mastar referansi ile net geometri saglamak." },
      { wrong: "Boya öncesi mastar ve isik kontrolünü gereksiz görmek.", correct: "Son kat öncesi ayri kalite kapısı kurmak." },
      { wrong: "Kuruyan malzemeyi tekrar suyla yumusatip kullanmak.", correct: "Taze karisim ve doğru uygulama suresine sadik kalmak." },
    ],
    designVsField: [
      "Projede alçı sıva cogu zaman bir satir nottur; sahada ise duvar, tavan ve doğrama kenarinin butun gorunen kalitesini belirler.",
      "Iyi alçı sıva dikkat cekmez, kötü alçı sıva ise boya bittiginde bile mekani dalgali ve aceleci gosterir.",
      "Bu nedenle alçı sıva, ince islerin sessiz ama en etkili kalite belirleyicilerinden biridir.",
    ],
    conclusion: [
      "Alçı sıva doğru yüzey hazirligi, doğru kalinlik ve doğru detaylarla uygulandiginda boya ve diger son katlar için guclu bir zemin olusturur. Bu disiplinler ihmal edildiginde ise kusur final yuzeyde buyuyerek görünür hale gelir.",
      "Bir inşaat mühendisi için en saglam yaklasim, alçı sivayi dekoratif son dokunus değil; mekan geometri ve yüzey kalitesini belirleyen teknik altlik olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.tsEn13914, TS_EN_13279_SOURCE],
    keywords: ["alçı sıva", "TS EN 13279", "yüzey duzlugu", "köşe profili", "boya alti hazirlik"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/ic-siva", "ince-isler/siva/dis-siva"],
  },
];
