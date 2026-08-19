import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const TESISAT_FIRE_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const TS_EN_12845_SOURCE: BinaGuideSource = {
  title: "TS EN 12845 Sabit Yangın Sondurme Sistemleri - Otomatik Sprinkler Sistemleri",
  shortCode: "TS EN 12845",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Sprinkler sistemi kurgusu, zonlama, su beslemesi ve test mantigi için temel teknik referanslardan biridir.",
};

const FIRE_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Yangın senaryosu, zon plani ve kat dolap paftası", purpose: "Aktif koruma elemanlarini kacis, zon ve mimariyle aynı dilde okumak." },
  { category: "Hidrolik", name: "Sprinkler ve hidrolik hesap tablosu", purpose: "Debi, basinc ve en olumsuz nokta davranisini montaj öncesi dogrulamak." },
  { category: "Test", name: "Basinc test pompasi, debimetre ve test-drenaj matrisi", purpose: "Devreye almada hattin yalnız dolu değil calisir oldugunu kanitlamak." },
  { category: "Koordinasyon", name: "Pompa odasi checklisti ve vana etiketleme sistemi", purpose: "Kritik ekipmanlari isletme ekibinin tek bakista okuyacagi hale getirmek." },
];

const FIRE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dağıtım", name: "Yangın pompasi, jockey pompa, kolektor ve vana setleri", purpose: "Sistem basinc dengesini ve devre guvenligini kurmak.", phase: "Pompa odasi" },
  { group: "Hat", name: "Yangın borulari, sprinkler, yangın dolabi ve kat vanalari", purpose: "Suyu doğru zon ve doğru mahalde gecikmeden kullanilabilir hale getirmek.", phase: "Dağıtım ve son nokta" },
  { group: "Kontrol", name: "Akis anahtari, basinc gostergesi, test-drenaj ve alarm arayuzu", purpose: "Sistemin gercek çalışma anini izlenebilir ve test edilebilir kilmak.", phase: "Devreye alma" },
  { group: "Pasif güvenlik", name: "Yangın durdurucu geçiş malzemeleri ve saft detaylari", purpose: "Aktif sistem kurulurken bölme butunlugunu korumak.", phase: "Geçiş ve kapanis" },
];

export const tesisatIsleriFireDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri/yangin-tesisati",
    kind: "topic",
    quote: "Yangın tesisati, yangın cikinca hatirlanan değil; yangın cikmadan önce defalarca dogrulanmis bir güvenlik sistemidir.",
    tip: "Yangın hattini sadece boru montaji gibi görmek, basinc, erişim, alarm entegrasyonu ve pasif yangın butunlugunu aynı anda kaybetmek anlamina gelir.",
    intro: [
      "Yangın tesisati, yapının mekanik altyapisinin icinde yer alsa da islevi diger butun tesisatlardan farklidir. Temiz su tesisati gunluk kullanimla, ısıtma soğutma sistemi konforla test edilir; yangın tesisati ise umulan o ki hic kullanilmadan, ama kullanilmasi gereken anda tek seferde eksiksiz çalışmak zorundadir. Bu nedenle tasarim, montaj ve kabul zinciri daha sert bir mühendislik disiplinine baglanir.",
      "Sahada yangın tesisati ile ilgili en yaygin yanlış, sistemi yalnızca kirmizi boya ile ayristirilmis bir borulama olarak okumaktir. Oysa sistemin gercek kalitesi; su kaynagi, pompa odasi, vana erisimi, zonlama, sprinkler veya dolap yerlesimi, test-drenaj, alarm entegrasyonu ve saft gecislerindeki yangın durdurucu mantik birlikte kuruldugunda ortaya çıkar. Bu halkalardan biri zayifsa hat görünür sekilde tamamlanmis olsa bile emniyet seviyesi eksik kalir.",
      "Bir inşaat mühendisi için yangın tesisatini bilmek, butun hidrolik hesabi tek basina yapmak anlamina gelmez. Ancak pompa odasinda hangi ekipmanin neden bulundugunu, kat koridorundaki dolabin neden o noktaya kondugunu, neden bazi vanalar kapali dolap arkasina saklanmamasi gerektigini, test bosaltmasi ve drenajin neden sadece formalite olmadigini bilmek anlamina gelir. Şantiye kapanmadan önce yakalanan her yangın tesisati hatasi, isletme asamasinda çok daha buyuk riskin onune gecer.",
      "Bu yazida yangın tesisatini bir mekanik kalemden fazla, bir güvenlik zinciri olarak ele aliyoruz. Tasarim ofisinin hesaplari ile saha pratigi arasinda kopma yaratmadan; pompa odasindan kat ekipmanina, boru askilarindan yangın durdurucu detaylara kadar bir inşaat muhendisinin dikkat etmesi gereken esaslari sistematik olarak topluyoruz.",
    ],
    theory: [
      "Yangın tesisatinin teorik temeli, belirli bir senaryo altinda gerekli debi ve basinc degerini, gerekli süre boyunca gerekli noktaya ulastirabilmektir. Bu cumle basit gorunse de icinde su kaynagi, pompa secimi, zonlama, hat kayiplari, seviye farki, son nokta basinc ihtiyaci ve aynı anda calisacak ekipman varsayimlari bulunur. Bir dolabin ya da sprinkler grubunun calisabilmesi, yalnızca o mahalde bir boru ucunun olmasina değil, butun zincirin o noktayi besleyebilmesine baglidir.",
      "Yangın tesisati aynı zamanda aktif ve pasif koruma sistemlerinin kesisim noktasidir. Aktif koruma; pompalar, dolaplar, sprinklerler, algilama ve alarm gibi elemanlarla yangına mudahale eder. Pasif koruma ise kompartiman, yangın kapısı, yangın damperi ve yangın durdurucu detaylarla yanginin yayilmasini sinirlar. Sahada en kritik kopmalardan biri, aktif hattin kurulurken pasif butunlugun bozulmasidir. Duvar veya döşeme deliniyor ama uygun yangın durdurucu ile kapatilmiyorsa, boru doğru olsa bile sistem butuncul olarak yanlistir.",
      "Hidrolik tarafta dikkat edilmesi gereken bir diger nokta zonlama mantigidir. Orta ve buyuk yapilarda tüm sistemi tek parca gibi dusunmek yerine, kontrol edilebilir, test edilebilir ve arizasi izole edilebilir bolgelere ayirmak gerekir. Vana yerlesiminin mantigi burada başlar. Her vana yalnızca suyu kesen bir parca değil; bakım, onarim ve acil durumda hangi bolgenin ne kadar sureyle devre disi kalacagini belirleyen karar noktasidir.",
      "Saha tarafinda yüksek hata potansiyeli tasiyan bir konu da pompa odasidir. Borular ve kat dolaplari görsel olarak dikkat cekerken, pompa odasi bazen teslimin son haftasina birakilir. Oysa jockey pompa, ana pompa, enerji beslemesi, emis ve basma taraflari, kollektorler, manometreler, test hatti ve drenaj düzeni sistemin kalbidir. Kalpteki bir kurgu hatasi, katlardaki doğru montaji anlamsiz hale getirir.",
      "Ayrıca yangın tesisati, isletmeye alindiktan sonra da canli bir sistemdir. Bu nedenle etiketleme, test kayitlari ve erişim kalitesi yalnızca teslim dosyasinin güzel gorunmesi için değil, sonraki yillarda periyodik kontrollerin sağlıklı yurutulebilmesi için zorunludur. Mühendislik burada boruyu bitirdigi anda değil, sistem bakım ekibine anlasilir bicimde devredildiginde tamamlanir.",
    ],
    ruleTable: [
      {
        parameter: "Genel yangın senaryosu ve zonlama",
        limitOrRequirement: "Sistem, bina kullanım senaryosu, kacis kurgusu ve aktif koruma ihtiyacina uygun zonlara ayrilmalidir",
        reference: "Binalarin Yangindan Korunmasi Hakkinda Yönetmelik",
        note: "Yangın hatti yalnız mekanik bir hat değil, yapının güvenlik senaryosunun parçası olarak kurgulanir.",
      },
      {
        parameter: "Sprinkler ve otomatik su bazli sistemler",
        limitOrRequirement: "Su beslemesi, hidrolik hesap, alarm ve test mantigi TS EN 12845 çerçevesinde çözülmelidir",
        reference: "TS EN 12845",
        note: "En olumsuz noktadaki basinc ve debi kabul edilmeden montaj tamamlanmis sayilmaz.",
      },
      {
        parameter: "Yangın dolabi, vana ve ekipman erisimi",
        limitOrRequirement: "Dolap, vana, test noktası ve pompa ekipmani kullanım ve bakım sirasinda engelsiz erişilebilir kalmalidir",
        reference: "Yangın Yönetmeliği + saha kalite plani",
        note: "Dolabin onune mobilya, vana onune kaplama geliyorsa sistem kismen devre disidir.",
      },
      {
        parameter: "Gecislerde pasif yangın butunlugu",
        limitOrRequirement: "Boru gecisleri duvar ve döşeme yangın dayanimini bozmayacak sekilde kapatilmalidir",
        reference: "Yangın Yönetmeliği",
        note: "Aktif hatti kurarken kompartiman duvarini zayiflatmak butun yaklasimi bozar.",
      },
      {
        parameter: "Devreye alma ve dokumantasyon",
        limitOrRequirement: "Basinc testi, fonksiyon testi, alarm entegrasyonu ve etiketleme kayıt altina alinmalidir",
        reference: "Teslim kalite plani",
        note: "Yangın tesisatinda test edilmeyen kalem kabul edilmemis kalemdir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari kullanım, kacis senaryosu ve yapının risk sinifini okuyarak aktif yangın koruma ihtiyacini daha proje basinda netlestir.",
      "Pompa odasi, su deposu, kolektor, kat vanalari ve son nokta ekipmanlarini tek hat semasi ile değil, saha erişim senaryosu ile birlikte cozumle.",
      "Yangın dolabi, sprinkler, akis anahtari ve vana yerlerini asma tavan, saft ve mobilya kararlarindan önce koordine et; dekoratif gizleme ugruna erisimi kaybetme.",
      "Boru guzergahlarini aski, deprem sabitlemesi, test-drenaj ve bosaltma lojistigi ile birlikte kur; hattin sadece tavanda ilerlemesi yeterli kabul edilmez.",
      "Duvar ve döşeme gecislerinde yangın durdurucu detaylari borudan sonra değil, boru ile aynı iş paketi icinde tamamla.",
      "Devreye alma asamasinda pompa odasi, dolaplar, alarm entegrasyonu ve test bosaltmalarini aynı matris uzerinden kayda baglayarak sistemi bakım ekibine anlasilir sekilde devret.",
    ],
    criticalChecks: [
      "Pompa odasi ekipman siralamasi ve vana etiketleri gercekten okunabilir mi?",
      "Kat dolaplari, vanalar ve test noktalarinin onunde erişim engeli olusturan kaplama veya sabit mobilya var mi?",
      "Sprinkler veya son nokta elemanlari asma tavan, kanal veya aydinlatma ile cakisip koruma alani kaybediyor mu?",
      "Boru gecislerinde yangın durdurucu malzeme ve detay tam olarak tamamlandi mi?",
      "Basinc ve fonksiyon testleri yalnız imzalanmis mi, yoksa sahada gercekten uygulanip kaydedilmis mi?",
      "Test bosaltma ve drenaj suyu için güvenli bosaltim senaryosu kuruldu mu?",
    ],
    numericalExample: {
      title: "Iki yangın dolabinin eszamanli calismasi için su hacmi yorumu",
      inputs: [
        { label: "Eszamanli calisacak dolap sayisi", value: "2 adet", note: "Ornek konut veya küçük ticari yapı senaryosu" },
        { label: "Bir dolap debisi", value: "100 L/dk", note: "Ornek saha kabul degeri" },
        { label: "Hedef çalışma süresi", value: "30 dk", note: "Basit rezerv yorum hesabi" },
        { label: "Amac", value: "Tank ve devreye alma mantigini okumak", note: "Nihai proje hesabi yerine gecmez" },
      ],
      assumptions: [
        "Hesap yalnız ogretici amaclidir; nihai kapasite yangın senaryosu ve ilgili sistem tipine göre belirlenir.",
        "Sadece yangın dolabi ihtiyaci yorumlanmakta, sprinkler veya diger ihtiyaclar eklenmemektedir.",
        "Pompa ve seviye farki kayiplari ayrıca degerlendirilecektir.",
      ],
      steps: [
        {
          title: "Toplam anlik debiyi bul",
          formula: "2 x 100 = 200 L/dk",
          result: "Aynı anda iki dolap kullaniliyorsa sistemin en az 200 L/dk suyu bu noktaya ulastirmasi gerekir.",
          note: "Anlik debi, yalnız tanktan değil pompa ve hat zincirinden birlikte okunur.",
        },
        {
          title: "Toplam hacmi hesapla",
          formula: "200 x 30 = 6000 L",
          result: "Sadece bu basit senaryo için 30 dakikada yaklasik 6000 litre yani 6 m3 su gerekir.",
          note: "Gercek projede sprinkler, hidrant, emniyet payi ve yönetmelik sinifi bu degeri buyutebilir.",
        },
        {
          title: "Mühendislik yorumunu yap",
          result: "Tank hacmi doğru olsa bile pompa odasi, vana konumu ve en olumsuz noktadaki basinc dogrulanmadan sistem tamamlanmis sayilmaz.",
          note: "Yangın tesisatinda hacim hesabi ilk basamaktir; fonksiyon bunun uzerine kurulur.",
        },
      ],
      checks: [
        "Tank hacmi hesabina yalnız metrekup olarak bakmak yeterli degildir; kullanilabilir su ve emis kosullari degerlendirilmelidir.",
        "Basinc testi ve akis testi son noktadaki performansi teyit etmelidir.",
        "Drenaj ve test bosaltma hatti tasarımı devreye alma senaryosunun ayrilmaz parcasidir.",
        "Gercek proje sinifi degistikce gerekli debi ve süre ciddi bicimde farklasabilir.",
      ],
      engineeringComment: "Yangın tesisatinda doğru rakam, ancak doğru erişim ve doğru test ile anlam kazanir.",
    },
    tools: FIRE_TOOLS,
    equipmentAndMaterials: FIRE_EQUIPMENT,
    mistakes: [
      { wrong: "Yangın tesisatini diger mekanik hatlarla aynı oncelik seviyesinde koordinasyonsuz yurutmek.", correct: "Güvenlik onceligini kabul edip yangın hatlarini kritik kesisimlerde önce cozumlemek." },
      { wrong: "Dolap ve vanalari dekoratif kaplamanin veya mobilyanin arkasinda birakmak.", correct: "Bakım ve mudahale senaryosuna göre engelsiz erişim saglamak." },
      { wrong: "Pompa odasi kurulumunu teslimin son haftasina sikistirmak.", correct: "Pompa odasini sistemin kalbi olarak erken programlamak ve test etmek." },
      { wrong: "Boru gecislerinde yangın durdurucu detaylari sonradan tamamlanacak küçük iş saymak.", correct: "Geçiş kapatmalarini montaj paketinin zorunlu parçası olarak aynı anda bitirmek." },
      { wrong: "Basinc testini yalnız evrak imzasi seviyesinde ele almak.", correct: "Testi debi, drenaj ve son nokta davranisi ile birlikte fiilen uygulamak." },
      { wrong: "Etiketleme ve as-built setini ihmal etmek.", correct: "Pompa odasi, vanalar, zonlar ve test noktalarini isletme ekibinin okuyabilecegi netlikte belgelemek." },
    ],
    designVsField: [
      "Tasarim ofisinde yangın tesisati bir senaryo ve hesap problemidir; sahada ise bu senaryonun erişilebilir, test edilebilir ve bakım yapilabilir fiziksel bir sisteme donusmesi gerekir.",
      "Projede doğru cizilen bir vana, eger alçıpan arkasinda kaliyor veya etiketlenmiyorsa gercekte doğru çözüm sayilmaz.",
      "Bu nedenle yangın tesisati kalitesi, kirmizi borunun düzgün gorunmesinden çok, yangın aninda gecikmeden calisacak kadar net kurulmus olmasiyla olculur.",
    ],
    conclusion: [
      "Yangın tesisati ancak su kaynagi, pompa odasi, dağıtım hatti, son nokta ekipmani, yangın durdurucu detay ve test zinciri birlikte kuruldugunda güvenlik uretir. Bu zincirin her halkasi şantiyede görünür ve olculur hale getirilmelidir.",
      "Bir inşaat mühendisi için en saglam yaklasim, yangın tesisatini montaj tamamlama isi değil, risk azaltma sistemi olarak okumaktir. Boylesi bir bakis, teslimden sonra fark edilen en pahali eksikleri şantiye asamasinda yakalar.",
    ],
    sources: [...TESISAT_FIRE_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_12845_SOURCE],
    keywords: ["yangın tesisati", "sprinkler", "yangın dolabi", "pompa odasi", "TS EN 12845"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/elektrik-tesisati", "proje-hazirlik/tesisat-projesi"],
  },
];
