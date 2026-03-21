import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const TESISAT_FIRE_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const TS_EN_12845_SOURCE: BinaGuideSource = {
  title: "TS EN 12845 Sabit Yangin Sondurme Sistemleri - Otomatik Sprinkler Sistemleri",
  shortCode: "TS EN 12845",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Sprinkler sistemi kurgusu, zonlama, su beslemesi ve test mantigi icin temel teknik referanslardan biridir.",
};

const FIRE_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Yangin senaryosu, zon plani ve kat dolap paftasi", purpose: "Aktif koruma elemanlarini kacis, zon ve mimariyle ayni dilde okumak." },
  { category: "Hidrolik", name: "Sprinkler ve hidrolik hesap tablosu", purpose: "Debi, basinc ve en olumsuz nokta davranisini montaj oncesi dogrulamak." },
  { category: "Test", name: "Basinc test pompasi, debimetre ve test-drenaj matrisi", purpose: "Devreye almada hattin yalniz dolu degil calisir oldugunu kanitlamak." },
  { category: "Koordinasyon", name: "Pompa odasi checklisti ve vana etiketleme sistemi", purpose: "Kritik ekipmanlari isletme ekibinin tek bakista okuyacagi hale getirmek." },
];

const FIRE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dagitim", name: "Yangin pompasi, jockey pompa, kolektor ve vana setleri", purpose: "Sistem basinc dengesini ve devre guvenligini kurmak.", phase: "Pompa odasi" },
  { group: "Hat", name: "Yangin borulari, sprinkler, yangin dolabi ve kat vanalari", purpose: "Suyu dogru zon ve dogru mahalde gecikmeden kullanilabilir hale getirmek.", phase: "Dagitim ve son nokta" },
  { group: "Kontrol", name: "Akis anahtari, basinc gostergesi, test-drenaj ve alarm arayuzu", purpose: "Sistemin gercek calisma anini izlenebilir ve test edilebilir kilmak.", phase: "Devreye alma" },
  { group: "Pasif guvenlik", name: "Yangin durdurucu gecis malzemeleri ve saft detaylari", purpose: "Aktif sistem kurulurken bolme butunlugunu korumak.", phase: "Gecis ve kapanis" },
];

export const tesisatIsleriFireDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri/yangin-tesisati",
    kind: "topic",
    quote: "Yangin tesisati, yangin cikinca hatirlanan degil; yangin cikmadan once defalarca dogrulanmis bir guvenlik sistemidir.",
    tip: "Yangin hattini sadece boru montaji gibi gormek, basinc, erisim, alarm entegrasyonu ve pasif yangin butunlugunu ayni anda kaybetmek anlamina gelir.",
    intro: [
      "Yangin tesisati, yapinin mekanik altyapisinin icinde yer alsa da islevi diger butun tesisatlardan farklidir. Temiz su tesisati gunluk kullanimla, isitma sogutma sistemi konforla test edilir; yangin tesisati ise umulan o ki hic kullanilmadan, ama kullanilmasi gereken anda tek seferde eksiksiz calismak zorundadir. Bu nedenle tasarim, montaj ve kabul zinciri daha sert bir muhendislik disiplinine baglanir.",
      "Sahada yangin tesisati ile ilgili en yaygin yanlis, sistemi yalnizca kirmizi boya ile ayristirilmis bir borulama olarak okumaktir. Oysa sistemin gercek kalitesi; su kaynagi, pompa odasi, vana erisimi, zonlama, sprinkler veya dolap yerlesimi, test-drenaj, alarm entegrasyonu ve saft gecislerindeki yangin durdurucu mantik birlikte kuruldugunda ortaya cikar. Bu halkalardan biri zayifsa hat gorunur sekilde tamamlanmis olsa bile emniyet seviyesi eksik kalir.",
      "Bir insaat muhendisi icin yangin tesisatini bilmek, butun hidrolik hesabi tek basina yapmak anlamina gelmez. Ancak pompa odasinda hangi ekipmanin neden bulundugunu, kat koridorundaki dolabin neden o noktaya kondugunu, neden bazi vanalar kapali dolap arkasina saklanmamasi gerektigini, test bosaltmasi ve drenajin neden sadece formalite olmadigini bilmek anlamina gelir. Santiye kapanmadan once yakalanan her yangin tesisati hatasi, isletme asamasinda cok daha buyuk riskin onune gecer.",
      "Bu yazida yangin tesisatini bir mekanik kalemden fazla, bir guvenlik zinciri olarak ele aliyoruz. Tasarim ofisinin hesaplari ile saha pratigi arasinda kopma yaratmadan; pompa odasindan kat ekipmanina, boru askilarindan yangin durdurucu detaylara kadar bir insaat muhendisinin dikkat etmesi gereken esaslari sistematik olarak topluyoruz.",
    ],
    theory: [
      "Yangin tesisatinin teorik temeli, belirli bir senaryo altinda gerekli debi ve basinc degerini, gerekli sure boyunca gerekli noktaya ulastirabilmektir. Bu cumle basit gorunse de icinde su kaynagi, pompa secimi, zonlama, hat kayiplari, seviye farki, son nokta basinc ihtiyaci ve ayni anda calisacak ekipman varsayimlari bulunur. Bir dolabin ya da sprinkler grubunun calisabilmesi, yalnizca o mahalde bir boru ucunun olmasina degil, butun zincirin o noktayi besleyebilmesine baglidir.",
      "Yangin tesisati ayni zamanda aktif ve pasif koruma sistemlerinin kesisim noktasidir. Aktif koruma; pompalar, dolaplar, sprinklerler, algilama ve alarm gibi elemanlarla yangina mudahale eder. Pasif koruma ise kompartiman, yangin kapisi, yangin damperi ve yangin durdurucu detaylarla yanginin yayilmasini sinirlar. Sahada en kritik kopmalardan biri, aktif hattin kurulurken pasif butunlugun bozulmasidir. Duvar veya doseme deliniyor ama uygun yangin durdurucu ile kapatilmiyorsa, boru dogru olsa bile sistem butuncul olarak yanlistir.",
      "Hidrolik tarafta dikkat edilmesi gereken bir diger nokta zonlama mantigidir. Orta ve buyuk yapilarda tum sistemi tek parca gibi dusunmek yerine, kontrol edilebilir, test edilebilir ve arizasi izole edilebilir bolgelere ayirmak gerekir. Vana yerlesiminin mantigi burada baslar. Her vana yalnizca suyu kesen bir parca degil; bakim, onarim ve acil durumda hangi bolgenin ne kadar sureyle devre disi kalacagini belirleyen karar noktasidir.",
      "Saha tarafinda yuksek hata potansiyeli tasiyan bir konu da pompa odasidir. Borular ve kat dolaplari gorsel olarak dikkat cekerken, pompa odasi bazen teslimin son haftasina birakilir. Oysa jockey pompa, ana pompa, enerji beslemesi, emis ve basma taraflari, kollektorler, manometreler, test hatti ve drenaj duzeni sistemin kalbidir. Kalpteki bir kurgu hatasi, katlardaki dogru montaji anlamsiz hale getirir.",
      "Ayrica yangin tesisati, isletmeye alindiktan sonra da canli bir sistemdir. Bu nedenle etiketleme, test kayitlari ve erisim kalitesi yalnizca teslim dosyasinin guzel gorunmesi icin degil, sonraki yillarda periyodik kontrollerin saglikli yurutulebilmesi icin zorunludur. Muhendislik burada boruyu bitirdigi anda degil, sistem bakim ekibine anlasilir bicimde devredildiginde tamamlanir.",
    ],
    ruleTable: [
      {
        parameter: "Genel yangin senaryosu ve zonlama",
        limitOrRequirement: "Sistem, bina kullanim senaryosu, kacis kurgusu ve aktif koruma ihtiyacina uygun zonlara ayrilmalidir",
        reference: "Binalarin Yangindan Korunmasi Hakkinda Yonetmelik",
        note: "Yangin hatti yalniz mekanik bir hat degil, yapinin guvenlik senaryosunun parcasi olarak kurgulanir.",
      },
      {
        parameter: "Sprinkler ve otomatik su bazli sistemler",
        limitOrRequirement: "Su beslemesi, hidrolik hesap, alarm ve test mantigi TS EN 12845 cercevesinde cozulmelidir",
        reference: "TS EN 12845",
        note: "En olumsuz noktadaki basinc ve debi kabul edilmeden montaj tamamlanmis sayilmaz.",
      },
      {
        parameter: "Yangin dolabi, vana ve ekipman erisimi",
        limitOrRequirement: "Dolap, vana, test noktasi ve pompa ekipmani kullanim ve bakim sirasinda engelsiz erisilebilir kalmalidir",
        reference: "Yangin Yonetmeligi + saha kalite plani",
        note: "Dolabin onune mobilya, vana onune kaplama geliyorsa sistem kismen devre disidir.",
      },
      {
        parameter: "Gecislerde pasif yangin butunlugu",
        limitOrRequirement: "Boru gecisleri duvar ve doseme yangin dayanimini bozmayacak sekilde kapatilmalidir",
        reference: "Yangin Yonetmeligi",
        note: "Aktif hatti kurarken kompartiman duvarini zayiflatmak butun yaklasimi bozar.",
      },
      {
        parameter: "Devreye alma ve dokumantasyon",
        limitOrRequirement: "Basinc testi, fonksiyon testi, alarm entegrasyonu ve etiketleme kayit altina alinmalidir",
        reference: "Teslim kalite plani",
        note: "Yangin tesisatinda test edilmeyen kalem kabul edilmemis kalemdir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari kullanim, kacis senaryosu ve yapinin risk sinifini okuyarak aktif yangin koruma ihtiyacini daha proje basinda netlestir.",
      "Pompa odasi, su deposu, kolektor, kat vanalari ve son nokta ekipmanlarini tek hat semasi ile degil, saha erisim senaryosu ile birlikte cozumle.",
      "Yangin dolabi, sprinkler, akis anahtari ve vana yerlerini asma tavan, saft ve mobilya kararlarindan once koordine et; dekoratif gizleme ugruna erisimi kaybetme.",
      "Boru guzergahlarini aski, deprem sabitlemesi, test-drenaj ve bosaltma lojistigi ile birlikte kur; hattin sadece tavanda ilerlemesi yeterli kabul edilmez.",
      "Duvar ve doseme gecislerinde yangin durdurucu detaylari borudan sonra degil, boru ile ayni is paketi icinde tamamla.",
      "Devreye alma asamasinda pompa odasi, dolaplar, alarm entegrasyonu ve test bosaltmalarini ayni matris uzerinden kayda baglayarak sistemi bakim ekibine anlasilir sekilde devret.",
    ],
    criticalChecks: [
      "Pompa odasi ekipman siralamasi ve vana etiketleri gercekten okunabilir mi?",
      "Kat dolaplari, vanalar ve test noktalarinin onunde erisim engeli olusturan kaplama veya sabit mobilya var mi?",
      "Sprinkler veya son nokta elemanlari asma tavan, kanal veya aydinlatma ile cakisip koruma alani kaybediyor mu?",
      "Boru gecislerinde yangin durdurucu malzeme ve detay tam olarak tamamlandi mi?",
      "Basinc ve fonksiyon testleri yalniz imzalanmis mi, yoksa sahada gercekten uygulanip kaydedilmis mi?",
      "Test bosaltma ve drenaj suyu icin guvenli bosaltim senaryosu kuruldu mu?",
    ],
    numericalExample: {
      title: "Iki yangin dolabinin eszamanli calismasi icin su hacmi yorumu",
      inputs: [
        { label: "Eszamanli calisacak dolap sayisi", value: "2 adet", note: "Ornek konut veya kucuk ticari yapi senaryosu" },
        { label: "Bir dolap debisi", value: "100 L/dk", note: "Ornek saha kabul degeri" },
        { label: "Hedef calisma suresi", value: "30 dk", note: "Basit rezerv yorum hesabi" },
        { label: "Amac", value: "Tank ve devreye alma mantigini okumak", note: "Nihai proje hesabi yerine gecmez" },
      ],
      assumptions: [
        "Hesap yalniz ogretici amaclidir; nihai kapasite yangin senaryosu ve ilgili sistem tipine gore belirlenir.",
        "Sadece yangin dolabi ihtiyaci yorumlanmakta, sprinkler veya diger ihtiyaclar eklenmemektedir.",
        "Pompa ve seviye farki kayiplari ayrica degerlendirilecektir.",
      ],
      steps: [
        {
          title: "Toplam anlik debiyi bul",
          formula: "2 x 100 = 200 L/dk",
          result: "Ayni anda iki dolap kullaniliyorsa sistemin en az 200 L/dk suyu bu noktaya ulastirmasi gerekir.",
          note: "Anlik debi, yalniz tanktan degil pompa ve hat zincirinden birlikte okunur.",
        },
        {
          title: "Toplam hacmi hesapla",
          formula: "200 x 30 = 6000 L",
          result: "Sadece bu basit senaryo icin 30 dakikada yaklasik 6000 litre yani 6 m3 su gerekir.",
          note: "Gercek projede sprinkler, hidrant, emniyet payi ve yonetmelik sinifi bu degeri buyutebilir.",
        },
        {
          title: "Muhendislik yorumunu yap",
          result: "Tank hacmi dogru olsa bile pompa odasi, vana konumu ve en olumsuz noktadaki basinc dogrulanmadan sistem tamamlanmis sayilmaz.",
          note: "Yangin tesisatinda hacim hesabi ilk basamaktir; fonksiyon bunun uzerine kurulur.",
        },
      ],
      checks: [
        "Tank hacmi hesabina yalniz metrekup olarak bakmak yeterli degildir; kullanilabilir su ve emis kosullari degerlendirilmelidir.",
        "Basinc testi ve akis testi son noktadaki performansi teyit etmelidir.",
        "Drenaj ve test bosaltma hatti tasarimi devreye alma senaryosunun ayrilmaz parcasidir.",
        "Gercek proje sinifi degistikce gerekli debi ve sure ciddi bicimde farklasabilir.",
      ],
      engineeringComment: "Yangin tesisatinda dogru rakam, ancak dogru erisim ve dogru test ile anlam kazanir.",
    },
    tools: FIRE_TOOLS,
    equipmentAndMaterials: FIRE_EQUIPMENT,
    mistakes: [
      { wrong: "Yangin tesisatini diger mekanik hatlarla ayni oncelik seviyesinde koordinasyonsuz yurutmek.", correct: "Guvenlik onceligini kabul edip yangin hatlarini kritik kesisimlerde once cozumlemek." },
      { wrong: "Dolap ve vanalari dekoratif kaplamanin veya mobilyanin arkasinda birakmak.", correct: "Bakim ve mudahale senaryosuna gore engelsiz erisim saglamak." },
      { wrong: "Pompa odasi kurulumunu teslimin son haftasina sikistirmak.", correct: "Pompa odasini sistemin kalbi olarak erken programlamak ve test etmek." },
      { wrong: "Boru gecislerinde yangin durdurucu detaylari sonradan tamamlanacak kucuk is saymak.", correct: "Gecis kapatmalarini montaj paketinin zorunlu parcasi olarak ayni anda bitirmek." },
      { wrong: "Basinc testini yalniz evrak imzasi seviyesinde ele almak.", correct: "Testi debi, drenaj ve son nokta davranisi ile birlikte fiilen uygulamak." },
      { wrong: "Etiketleme ve as-built setini ihmal etmek.", correct: "Pompa odasi, vanalar, zonlar ve test noktalarini isletme ekibinin okuyabilecegi netlikte belgelemek." },
    ],
    designVsField: [
      "Tasarim ofisinde yangin tesisati bir senaryo ve hesap problemidir; sahada ise bu senaryonun erisilebilir, test edilebilir ve bakim yapilabilir fiziksel bir sisteme donusmesi gerekir.",
      "Projede dogru cizilen bir vana, eger alcipan arkasinda kaliyor veya etiketlenmiyorsa gercekte dogru cozum sayilmaz.",
      "Bu nedenle yangin tesisati kalitesi, kirmizi borunun duzgun gorunmesinden cok, yangin aninda gecikmeden calisacak kadar net kurulmus olmasiyla olculur.",
    ],
    conclusion: [
      "Yangin tesisati ancak su kaynagi, pompa odasi, dagitim hatti, son nokta ekipmani, yangin durdurucu detay ve test zinciri birlikte kuruldugunda guvenlik uretir. Bu zincirin her halkasi santiyede gorunur ve olculur hale getirilmelidir.",
      "Bir insaat muhendisi icin en saglam yaklasim, yangin tesisatini montaj tamamlama isi degil, risk azaltma sistemi olarak okumaktir. Boylesi bir bakis, teslimden sonra fark edilen en pahali eksikleri santiye asamasinda yakalar.",
    ],
    sources: [...TESISAT_FIRE_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_12845_SOURCE],
    keywords: ["yangin tesisati", "sprinkler", "yangin dolabi", "pompa odasi", "TS EN 12845"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/elektrik-tesisati", "proje-hazirlik/tesisat-projesi"],
  },
];
