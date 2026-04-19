import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13279_SOURCE: BinaGuideSource = {
  title: "TS EN 13279 Alcili Baglayicilar ve Alci Sivalar",
  shortCode: "TS EN 13279",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alci siva malzemeleri, siniflandirma ve temel performans gereklilikleri için referans kabul edilir.",
};

const PLASTER_TOOLS: BinaGuideTool[] = [
  { category: "Hazirlik", name: "Yüzey nemi ve duzlugu kontrol seti", purpose: "Alci sivanin tutunacagi zemini malzeme öncesi dogrulamak." },
  { category: "Uygulama", name: "Mastar, köşe profili ve kalinlik referanslari", purpose: "Sivayi sadece kaplama degil geometri duzeltme araci olarak yonetmek." },
  { category: "Kontrol", name: "Mahal bazli bitis kalitesi checklisti", purpose: "Boyadan once görünmez kusurlari yakalamak." },
  { category: "Kayıt", name: "Numune duvar ve kabul panosu", purpose: "Ustanin yorum farkini azaltip ortak kalite dili kurmak." },
];

const PLASTER_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Malzeme", name: "Alci baglayici, siva harci ve yardimci katkilar", purpose: "İç mekan duvar ve tavanlarda düzgün bitis zemini olusturmak.", phase: "Karisim ve uygulama" },
  { group: "Yüzey hazirlik", name: "Astar, file, köşe profili ve onarim malzemeleri", purpose: "Tutunmayi ve koselerde darbe direncini desteklemek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Mastar, mala, spatula ve kalinlik aparatlari", purpose: "Sivayi kontrollu kalinlik ve duzluguyle uygulamak.", phase: "Uygulama" },
  { group: "Kontrol", name: "Nem olcer, uzun mastar ve isik kontrol ekipmani", purpose: "Boyadan once kalan dalga, bosluk ve nem riskini yakalamak.", phase: "Kabul" },
];

export const finishPlasterDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/siva/alci-siva",
    kind: "topic",
    quote: "Alci siva, duvari boyaya hazirlayan ince katman degil; iç mekandaki duzlugu, detay okunurlugunu ve son kaplama kalitesini belirleyen temel zemin isidir.",
    tip: "Alci sivayi boyadan once gelen son dokunus gibi gormek, yüzey nemi, kalinlik, file detaylari ve koselerdeki geometrik kaliteyi gözden kacirmaktir.",
    intro: [
      "Alci siva iç mekanda cogu zaman son boya öncesi yapilan rutin bir kalem gibi algilanir. Oysa boyada gorulen dalga, kapida fark edilen kirik koseler, mobilya montajinda ortaya cikan duvar egiklikleri ve isik altinda beliren yüzey kusurlari buyuk olcude alci sivanin kalitesine dayanir. Bu nedenle alci siva basit bir duvar kaplama isi degil; son gorunen mekan kalitesini belirleyen temel ara tabakadir.",
      "Sahada en sık problem, alci sivanin 'boya nasil olsa toparlar' varsayimi ile ele alinmasidir. Nemli veya tozlu yuzeye girilen siva kabarir, kalinlik kontrolu zayifsa duvar dalgalanir, koselerde profil kullanilmazsa darbe ve kirmalar baslar, farkli malzeme birlesimlerinde file atlanirsa kısa surede catlak belirir. Bu kusurlar teslime kadar bazen gizlenir; fakat gun isigi ve kullanıcı temasi ile hemen ortaya cikar.",
      "Bir insaat muhendisi için alci siva, yalnız dekoratif bir bitis degildir. Duvar altyapisinin ne kadar doğru oldugunu, mekan geometri kalitesini, tesisat tamiratlarinin ne kadar temiz kapatildigini ve boya ekibinin ne kadar saglam zeminde calisacagini belirler. Dolayisiyla ince islerin zincir etkisi bu kalemde çok nettir.",
      "Bu yazida alci sivayi; malzeme teorisi, standart gereksinimleri, sayisal kalinlik yorumu, saha araclari ve sık yapilan hatalarla birlikte tam blog yazisi duzeyinde ele aliyoruz. Hedef, alci sivayi boyaya hazirlik adimi degil, mekan kalitesinin taşıyıcı altligi olarak gormektir.",
    ],
    theory: [
      "Alci sivanin teorik temeli, yuzeye kontrollu kalinlikta yapisarak düzgün, ince dokulu ve boyaya uygun bir bitis zemini olusturmasidir. Fakat bu davranis malzemenin tek basina ozelligi degildir; alt yuzeyin emiciligi, temizligi, nem durumu ve uygulama kalinligi sonucu belirler. Aynı torba malzeme, iki farkli duvarda çok farkli performans gosterebilir.",
      "Yüzey hazirligi bu nedenle hayati onemdedir. Asiri emici bir yuzeyde siva suyunu çok hızlı kaybedebilir, tozlu veya gevsek altlikta tutunma azalir, betonarme ile tugla birlesimlerinde ise farkli hareketler catlak riski dogurur. Bu gecislerde file, astar veya uygun onarim hazirligi olmadan atilan siva kısa surede sorun uretir.",
      "Kalinlik ve geometri kontrolu de diger temel unsurdur. Alci siva, duvari sinirsiz kalinlikla duzelten bir malzeme degildir. Çok kalin uygulamalar kurumayi zorlastirir, yuzeyde cekme farklari yaratir ve isciligi zayiflatir. Çok ince ve dengesiz uygulamalar ise alttaki kusuru kapatamaz. Bu nedenle siva, duvari kurtaran bir kamuflaj degil; kontrollu bir bitis katmani olarak dusunulmelidir.",
      "Köşe ve birlesim detaylari kullanıcı deneyiminde çok daha belirgindir. Duvar tavan birlesimi, pencere kenari, elektrik kasa cevresi ve kapı donusleri isik alan hassas bolgelerdir. Buralarda zayif mastarlama veya profilsiz uygulama tüm mekanin kalitesini asagi ceker. Iyi alci siva sadece duz duvar degil, temiz detay donusleri de uretmelidir.",
      "Bu bakisla alci siva, ince islerin arka planda kalan kahramanidir. Boya, duvar kagidi veya dekoratif kaplama ne kadar iyi olursa olsun, altlik kalitesi zayifsa final sonuc tatmin etmez.",
    ],
    ruleTable: [
      {
        parameter: "Malzeme ve uygulama cercevesi",
        limitOrRequirement: "Alci siva malzemesi ve uygulama kosullari uygun sinifta ve tavsiye edilen hazirlikla kullanilmalidir",
        reference: "TS EN 13279",
        note: "Malzeme secimi kadar karisim ve uygulama kosulu da performansi belirler.",
      },
      {
        parameter: "Yüzey hazirligi",
        limitOrRequirement: "Alt yüzey temiz, uygun emicilikte ve gerekirse astarlanmis olmalidir",
        reference: "TS EN 13914 + saha uygulama disiplini",
        note: "Hazirlanmamis yuzeye iyi siva tutunmasi beklenemez.",
      },
      {
        parameter: "Kalinlik ve duzlugu kontrolu",
        limitOrRequirement: "Siva duvari kamufle eden asiri kalin katman yerine kontrollu kalinlikta uygulanmalidir",
        reference: "Uygulama kalite plani",
        note: "Siva kalitesi mastar ve referansla yonetilmelidir.",
      },
      {
        parameter: "Birlesim ve catlak kontrolu",
        limitOrRequirement: "Farkli malzeme gecisleri, tamirat noktalar ve hassas koseler uygun detaylarla guclendirilmelidir",
        reference: "TS EN 13914",
        note: "Catlaklar cogu zaman malzeme farkinin dikkate alinmadigi noktada baslar.",
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
      "Mahal bazli referans kotlari ve mastar noktalarini kurarak duvari göz karariyla degil cizgisel referansla duzelt.",
      "Köşe profilleri, pencere donusleri ve tesisat tamirat noktalarini genel uygulamadan once hazirla.",
      "Alci sivayi kontrollu kalinlikta ve yeterli isleme suresi icinde uygula; kurumus malzemeyi su ile geri canlandirma.",
      "Bitis öncesi isik altinda ve uzun mastarla dalga, cukur ve catlak risklerini tara.",
      "Boyaya gecmeden once nem, duzlugu ve lokal tamirleri ayri kabul tutanagiyla kapat.",
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
      title: "4 m uzunlugunda duvarda siva kalinlik yorumu",
      inputs: [
        { label: "Olculen en derin duvar kacikligi", value: "18 mm", note: "Mastar altinda okunan en olumsuz nokta" },
        { label: "Hedef ortalama siva kalinligi", value: "10 mm", note: "Bitis kalitesi için istenen bant" },
        { label: "Lokal fark", value: "8 mm", note: "Duvar geometri sapmasi" },
        { label: "Amac", value: "Siva ile duvar geometri iliskisini yorumlamak", note: "Ogretici saha karari" },
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
          note: "Bu fark once altlikta veya onarimla cozulmezse siva katmani gereksiz yere zorlanir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Alci siva, ciddi duvar kacikliklarini gizlemek için degil son duzlugu vermek için kullanilmalidir.",
          note: "Sivayla geometri kurtarmaya çalışmak kalinlik ve catlak riski uretir.",
        },
      ],
      checks: [
        "Mastar okumasi duvari boydan boya tarayacak uzunlukta yapilmalidir.",
        "Yerel onarim gerektiren bolgeler genel siva kalinligina yayilmamalidir.",
        "Koseler ve donusler duvar orta aksindan ayri olarak kontrol edilmelidir.",
        "Boya öncesi isik kontrolu geometri kusurlarini daha net gosterecektir.",
      ],
      engineeringComment: "Alci siva duvari kurtaran mucize degil; düzgün altyapi isteyen hassas bir bitis katmanidir.",
    },
    tools: PLASTER_TOOLS,
    equipmentAndMaterials: PLASTER_EQUIPMENT,
    mistakes: [
      { wrong: "Nemli, tozlu veya astarsiz yuzeye alci siva uygulamak.", correct: "Yüzey hazirligini malzeme davranisinin temel adimi kabul etmek." },
      { wrong: "Duvar kacikliklarini tek katta asiri kalin siva ile kapatmaya çalışmak.", correct: "Lokal duzeltme ve kontrollu kalinlik mantigi kurmak." },
      { wrong: "Malzeme birlesimlerinde file ve detay takviyesini atlamak.", correct: "Catlak riski olan gecisleri önceden guclendirmek." },
      { wrong: "Koseleri profisiz ve göz karariyla bitirmek.", correct: "Köşe profil ve mastar referansi ile net geometri saglamak." },
      { wrong: "Boya öncesi mastar ve isik kontrolunu gereksiz gormek.", correct: "Son kat öncesi ayri kalite kapisi kurmak." },
      { wrong: "Kuruyan malzemeyi tekrar suyla yumusatip kullanmak.", correct: "Taze karisim ve doğru uygulama suresine sadik kalmak." },
    ],
    designVsField: [
      "Projede alci siva cogu zaman bir satir nottur; sahada ise duvar, tavan ve doğrama kenarinin butun gorunen kalitesini belirler.",
      "Iyi alci siva dikkat cekmez, kötü alci siva ise boya bittiginde bile mekani dalgali ve aceleci gosterir.",
      "Bu nedenle alci siva, ince islerin sessiz ama en etkili kalite belirleyicilerinden biridir.",
    ],
    conclusion: [
      "Alci siva doğru yüzey hazirligi, doğru kalinlik ve doğru detaylarla uygulandiginda boya ve diger son katlar için guclu bir zemin olusturur. Bu disiplinler ihmal edildiginde ise kusur final yuzeyde buyuyerek görünür hale gelir.",
      "Bir insaat muhendisi için en saglam yaklasim, alci sivayi dekoratif son dokunus degil; mekan geometri ve yüzey kalitesini belirleyen teknik altlik olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.tsEn13914, TS_EN_13279_SOURCE],
    keywords: ["alci siva", "TS EN 13279", "yüzey duzlugu", "köşe profili", "boya alti hazirlik"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/ic-siva", "ince-isler/siva/dis-siva"],
  },
];
