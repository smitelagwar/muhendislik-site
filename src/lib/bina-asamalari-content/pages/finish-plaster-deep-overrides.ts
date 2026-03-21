import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13279_SOURCE: BinaGuideSource = {
  title: "TS EN 13279 Alcili Baglayicilar ve Alci Sivalar",
  shortCode: "TS EN 13279",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alci siva malzemeleri, siniflandirma ve temel performans gereklilikleri icin referans kabul edilir.",
};

const PLASTER_TOOLS: BinaGuideTool[] = [
  { category: "Hazirlik", name: "Yuzey nemi ve duzlugu kontrol seti", purpose: "Alci sivanin tutunacagi zemini malzeme oncesi dogrulamak." },
  { category: "Uygulama", name: "Mastar, kose profili ve kalinlik referanslari", purpose: "Sivayi sadece kaplama degil geometri duzeltme araci olarak yonetmek." },
  { category: "Kontrol", name: "Mahal bazli bitis kalitesi checklisti", purpose: "Boyadan once gorunmez kusurlari yakalamak." },
  { category: "Kayit", name: "Numune duvar ve kabul panosu", purpose: "Ustanin yorum farkini azaltip ortak kalite dili kurmak." },
];

const PLASTER_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Malzeme", name: "Alci baglayici, siva harci ve yardimci katkilar", purpose: "Ic mekan duvar ve tavanlarda duzgun bitis zemini olusturmak.", phase: "Karisim ve uygulama" },
  { group: "Yuzey hazirlik", name: "Astar, file, kose profili ve onarim malzemeleri", purpose: "Tutunmayi ve koselerde darbe direncini desteklemek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Mastar, mala, spatula ve kalinlik aparatlari", purpose: "Sivayi kontrollu kalinlik ve duzluguyle uygulamak.", phase: "Uygulama" },
  { group: "Kontrol", name: "Nem olcer, uzun mastar ve isik kontrol ekipmani", purpose: "Boyadan once kalan dalga, bosluk ve nem riskini yakalamak.", phase: "Kabul" },
];

export const finishPlasterDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/siva/alci-siva",
    kind: "topic",
    quote: "Alci siva, duvari boyaya hazirlayan ince katman degil; ic mekandaki duzlugu, detay okunurlugunu ve son kaplama kalitesini belirleyen temel zemin isidir.",
    tip: "Alci sivayi boyadan once gelen son dokunus gibi gormek, yuzey nemi, kalinlik, file detaylari ve koselerdeki geometrik kaliteyi gozden kacirmaktir.",
    intro: [
      "Alci siva ic mekanda cogu zaman son boya oncesi yapilan rutin bir kalem gibi algilanir. Oysa boyada gorulen dalga, kapida fark edilen kirik koseler, mobilya montajinda ortaya cikan duvar egiklikleri ve isik altinda beliren yuzey kusurlari buyuk olcude alci sivanin kalitesine dayanir. Bu nedenle alci siva basit bir duvar kaplama isi degil; son gorunen mekan kalitesini belirleyen temel ara tabakadir.",
      "Sahada en sik problem, alci sivanin 'boya nasil olsa toparlar' varsayimi ile ele alinmasidir. Nemli veya tozlu yuzeye girilen siva kabarir, kalinlik kontrolu zayifsa duvar dalgalanir, koselerde profil kullanilmazsa darbe ve kirmalar baslar, farkli malzeme birlesimlerinde file atlanirsa kisa surede catlak belirir. Bu kusurlar teslime kadar bazen gizlenir; fakat gun isigi ve kullanici temasi ile hemen ortaya cikar.",
      "Bir insaat muhendisi icin alci siva, yalniz dekoratif bir bitis degildir. Duvar altyapisinin ne kadar dogru oldugunu, mekan geometri kalitesini, tesisat tamiratlarinin ne kadar temiz kapatildigini ve boya ekibinin ne kadar saglam zeminde calisacagini belirler. Dolayisiyla ince islerin zincir etkisi bu kalemde cok nettir.",
      "Bu yazida alci sivayi; malzeme teorisi, standart gereksinimleri, sayisal kalinlik yorumu, saha araclari ve sik yapilan hatalarla birlikte tam blog yazisi duzeyinde ele aliyoruz. Hedef, alci sivayi boyaya hazirlik adimi degil, mekan kalitesinin tasiyici altligi olarak gormektir.",
    ],
    theory: [
      "Alci sivanin teorik temeli, yuzeye kontrollu kalinlikta yapisarak duzgun, ince dokulu ve boyaya uygun bir bitis zemini olusturmasidir. Fakat bu davranis malzemenin tek basina ozelligi degildir; alt yuzeyin emiciligi, temizligi, nem durumu ve uygulama kalinligi sonucu belirler. Ayni torba malzeme, iki farkli duvarda cok farkli performans gosterebilir.",
      "Yuzey hazirligi bu nedenle hayati onemdedir. Asiri emici bir yuzeyde siva suyunu cok hizli kaybedebilir, tozlu veya gevsek altlikta tutunma azalir, betonarme ile tugla birlesimlerinde ise farkli hareketler catlak riski dogurur. Bu gecislerde file, astar veya uygun onarim hazirligi olmadan atilan siva kisa surede sorun uretir.",
      "Kalinlik ve geometri kontrolu de diger temel unsurdur. Alci siva, duvari sinirsiz kalinlikla duzelten bir malzeme degildir. Cok kalin uygulamalar kurumayi zorlastirir, yuzeyde cekme farklari yaratir ve isciligi zayiflatir. Cok ince ve dengesiz uygulamalar ise alttaki kusuru kapatamaz. Bu nedenle siva, duvari kurtaran bir kamuflaj degil; kontrollu bir bitis katmani olarak dusunulmelidir.",
      "Kose ve birlesim detaylari kullanici deneyiminde cok daha belirgindir. Duvar tavan birlesimi, pencere kenari, elektrik kasa cevresi ve kapi donusleri isik alan hassas bolgelerdir. Buralarda zayif mastarlama veya profilsiz uygulama tum mekanin kalitesini asagi ceker. Iyi alci siva sadece duz duvar degil, temiz detay donusleri de uretmelidir.",
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
        parameter: "Yuzey hazirligi",
        limitOrRequirement: "Alt yuzey temiz, uygun emicilikte ve gerekirse astarlanmis olmalidir",
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
        parameter: "Boya oncesi kabul",
        limitOrRequirement: "Yuzey duzlugu, nem durumu ve lokal tamirler boya oncesi ayri kalite kapisinda kabul edilmelidir",
        reference: "Son kat boya kalite plani",
        note: "Boyaya gecilen kusur, daha pahali bir sekilde tekrar geri doner.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yuzeyi toz, gevsek parca, asiri nem ve emicilik farki acisindan kontrol et; gerekirse astar ve file kararini onceden ver.",
      "Mahal bazli referans kotlari ve mastar noktalarini kurarak duvari goz karariyla degil cizgisel referansla duzelt.",
      "Kose profilleri, pencere donusleri ve tesisat tamirat noktalarini genel uygulamadan once hazirla.",
      "Alci sivayi kontrollu kalinlikta ve yeterli isleme suresi icinde uygula; kurumus malzemeyi su ile geri canlandirma.",
      "Bitis oncesi isik altinda ve uzun mastarla dalga, cukur ve catlak risklerini tara.",
      "Boyaya gecmeden once nem, duzlugu ve lokal tamirleri ayri kabul tutanagiyla kapat.",
    ],
    criticalChecks: [
      "Alt yuzeyde toz, gevsek tabaka veya nem kaynakli risk kalmis mi?",
      "Farkli malzeme birlesimlerinde file veya uygun detay kullanilmis mi?",
      "Koseler profil ve mastar ile gercekten duzgun cikmis mi?",
      "Uzun mastarla duvar duzlugu mahal boyunca kontrol edilmis mi?",
      "Tesisat tamiratlari duvar genel kalitesiyle ayni seviyede kapatilmis mi?",
      "Boya oncesi yuzey nemi ve kuruma durumu teyit edilmis mi?",
    ],
    numericalExample: {
      title: "4 m uzunlugunda duvarda siva kalinlik yorumu",
      inputs: [
        { label: "Olculen en derin duvar kacikligi", value: "18 mm", note: "Mastar altinda okunan en olumsuz nokta" },
        { label: "Hedef ortalama siva kalinligi", value: "10 mm", note: "Bitis kalitesi icin istenen bant" },
        { label: "Lokal fark", value: "8 mm", note: "Duvar geometri sapmasi" },
        { label: "Amac", value: "Siva ile duvar geometri iliskisini yorumlamak", note: "Ogretici saha karari" },
      ],
      assumptions: [
        "Duvar genel olarak uygulanabilir duzeydedir ancak lokal kaciklik tasimaktadir.",
        "Tek katla tum problemi kapatma hedefi yoktur.",
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
          result: "Alci siva, ciddi duvar kacikliklarini gizlemek icin degil son duzlugu vermek icin kullanilmalidir.",
          note: "Sivayla geometri kurtarmaya calismak kalinlik ve catlak riski uretir.",
        },
      ],
      checks: [
        "Mastar okumasi duvari boydan boya tarayacak uzunlukta yapilmalidir.",
        "Yerel onarim gerektiren bolgeler genel siva kalinligina yayilmamalidir.",
        "Koseler ve donusler duvar orta aksindan ayri olarak kontrol edilmelidir.",
        "Boya oncesi isik kontrolu geometri kusurlarini daha net gosterecektir.",
      ],
      engineeringComment: "Alci siva duvari kurtaran mucize degil; duzgun altyapi isteyen hassas bir bitis katmanidir.",
    },
    tools: PLASTER_TOOLS,
    equipmentAndMaterials: PLASTER_EQUIPMENT,
    mistakes: [
      { wrong: "Nemli, tozlu veya astarsiz yuzeye alci siva uygulamak.", correct: "Yuzey hazirligini malzeme davranisinin temel adimi kabul etmek." },
      { wrong: "Duvar kacikliklarini tek katta asiri kalin siva ile kapatmaya calismak.", correct: "Lokal duzeltme ve kontrollu kalinlik mantigi kurmak." },
      { wrong: "Malzeme birlesimlerinde file ve detay takviyesini atlamak.", correct: "Catlak riski olan gecisleri onceden guclendirmek." },
      { wrong: "Koseleri profisiz ve goz karariyla bitirmek.", correct: "Kose profil ve mastar referansi ile net geometri saglamak." },
      { wrong: "Boya oncesi mastar ve isik kontrolunu gereksiz gormek.", correct: "Son kat oncesi ayri kalite kapisi kurmak." },
      { wrong: "Kuruyan malzemeyi tekrar suyla yumusatip kullanmak.", correct: "Taze karisim ve dogru uygulama suresine sadik kalmak." },
    ],
    designVsField: [
      "Projede alci siva cogu zaman bir satir nottur; sahada ise duvar, tavan ve dograma kenarinin butun gorunen kalitesini belirler.",
      "Iyi alci siva dikkat cekmez, kotu alci siva ise boya bittiginde bile mekani dalgali ve aceleci gosterir.",
      "Bu nedenle alci siva, ince islerin sessiz ama en etkili kalite belirleyicilerinden biridir.",
    ],
    conclusion: [
      "Alci siva dogru yuzey hazirligi, dogru kalinlik ve dogru detaylarla uygulandiginda boya ve diger son katlar icin guclu bir zemin olusturur. Bu disiplinler ihmal edildiginde ise kusur final yuzeyde buyuyerek gorunur hale gelir.",
      "Bir insaat muhendisi icin en saglam yaklasim, alci sivayi dekoratif son dokunus degil; mekan geometri ve yuzey kalitesini belirleyen teknik altlik olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.tsEn13914, TS_EN_13279_SOURCE],
    keywords: ["alci siva", "TS EN 13279", "yuzey duzlugu", "kose profili", "boya alti hazirlik"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/siva/ic-siva", "ince-isler/siva/dis-siva"],
  },
];
