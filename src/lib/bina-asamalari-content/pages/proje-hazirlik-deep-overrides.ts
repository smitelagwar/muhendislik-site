import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJE_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const PROJE_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "BIM/koordinasyon modeli ve cakisma matrisi", purpose: "Mekanik, elektrik, sihhi ve yangin sistemlerini mimari ve statikle birlikte okumak." },
  { category: "Cizim", name: "Ruhsat eki tesisat pafta seti", purpose: "Onay, uygulama ve disiplinler arasi teslim beklentilerini tek dilde toplamak." },
  { category: "Kontrol", name: "Proje revizyon ve onay takip tablosu", purpose: "Revizyon sirkulasyonunu ve ilgili kurum/ekip onaylarini izlemek." },
  { category: "Kayıt", name: "Ruhsat ekleri ve hesap klasoru", purpose: "Tesisat projesini yalnız cizim degil, hesap ve mevzuat paketi olarak saklamak." },
];

const PROJE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Proje", name: "Mekanik, elektrik, sihhi ve yangin tesisat paftalari", purpose: "Disiplinler arasi koordinasyon ve ruhsat/onay surecini yurutmek.", phase: "Proje hazirlik" },
  { group: "Hesap", name: "Yuk, debi, basinc, yangin ve guc hesap dosyalari", purpose: "Tesisat cizimlerini sayisal gerekce ile desteklemek.", phase: "Hesap ve onay" },
  { group: "Koordinasyon", name: "Saft, asma tavan ve cihaz yerlestim detaylari", purpose: "Uygulama öncesi kritik cakismalari azaltmak.", phase: "Koordinasyon" },
  { group: "Teslim", name: "Revizyon listesi, kurum onaylari ve uygulama notlari", purpose: "Sahaya doğru proje versiyonunu indirmek ve izlenebilirlik saglamak.", phase: "Onay ve saha devri" },
];

export const projeHazirlikDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/tesisat-projesi",
    kind: "topic",
    quote: "Tesisat projesi, duvar kapandiktan sonra hatirlanan bir servis cizimi degil; binanin kullanilabilirlik ve isletme omurgasini daha proje masasinda kuran ana koordinasyon setidir.",
    tip: "Tesisat projesini ruhsat eki formalitesi gibi gormek, sahadaki en pahali cakismalari ve sonradan kirma islerini daha proje asamasinda davet etmek demektir.",
    intro: [
      "Tesisat projesi; sihhi tesisat, elektrik, mekanik iklimlendirme, yangin, zayif akim ve ilgili altyapi sistemlerinin bina icinde nasil yerlesecegini ve nasil calisacagini belirleyen ana proje paketidir. Mimari ve statik projeden ayri gibi gorunse de aslinda o projelerin kullanilabilir hale gelmesini saglayan servis omurgasini kurar.",
      "Sahada en sık gorulen proje kaynakli sorunlardan biri, tesisat paftalarinin yalnız ruhsat eki ya da sonradan sahaya gonderilecek yardimci cizimler gibi degerlendirilmesidir. Oysa saftlarin boyutu, asma tavan bosluklari, cihaz odasi yerleri, pano duvarlari, kollector cepleri, drenaj rotalari ve yangin gecisleri daha proje asamasinda cozulmezse uygulama asamasinda pahali kirma ve revizyon kacinilmaz olur.",
      "Bir insaat muhendisi için tesisat projesi; yalnız teknik uzmanlarin konusu degil, uygulama sirasini ve saha koordinasyonunu doğrudan etkileyen proje yönetim basligidir. Cunku bir tavan yuksekligi kaybi, bir saft yetmezligi veya bir cihaz erişim problemi mimariyi, statigi ve maliyeti birlikte etkiler.",
      "Bu nedenle tesisat projesi, cizilmis olmakla tamamlanan degil; disiplinler arasi okunmus, cakismalari azaltilmis, ruhsat ve saha beklentisiyle uyumlu hale getirilmis bir tasarim paketi olarak ele alinmalidir.",
    ],
    theory: [
      "Tesisat projelerinin ana fonksiyonu yalnız hat guzergahi gostermek degildir. Bu projeler, enerjinin, suyun, havanin ve güvenlik sistemlerinin yapı icinde hangi mekan mantigiyla dolasacagini tanimlar. Dolayisiyla her tesisat cizgisi, mimari alan kullanimini, bakım erisimini ve uygulama maliyetini etkileyen fiziksel bir karar tasir.",
      "Iyi bir tesisat projesi, disiplinler arasinda erken koordinasyon kurar. Mekanik kanal ile kiris kötü, elektrik tavasi ile sprinkler hatti, atik su düşey hatti ile mimari wc duzeni, pano odasi ile yangin kacis mesafesi birlikte okunmadiginda proje sahada parcalanir. Parcalanmis proje, cogu zaman iyi detay yerine mecburi revizyon uretir.",
      "Ruhsat ve mevzuat boyutu da onemlidir. Tesisat projesi yalnız sahaya gidecek uygulama cizimi degil; Planli Alanlar Imar Yonetmeligi, yangin mevzuati ve ilgili teknik standartlara göre ruhsat/onay paketinin de parcasidir. Bu yuzden proje cizgisi ile hesap dokumani, aciklama notlari ve pafta uyumu birlikte yurumelidir.",
      "Ayrıca proje kalitesi, yalnız tasarim ofisinde degil uygulama öncesi saha okunabilirliginde olculur. Saft icinde hangi hattin nereye gectigi, bakım için hangi kapagin birakilacagi, asma tavanda hangi siralamayla gidilecegi ve ekipmanlarin hangi servis boslugunu istedigi projede net degilse, saha kendi cozumlerini uretmeye baslar. Bu da kaliteyi kisisel tecrubeye bagimli hale getirir.",
    ],
    ruleTable: [
      {
        parameter: "Ruhsat ve mevzuat uyumu",
        limitOrRequirement: "Tesisat projeleri ilgili ruhsat eki, hesap ve aciklama notlariyla mevzuata uygun hazirlanmali",
        reference: "Planli Alanlar Imar Yonetmeligi + 3194 sayili Imar Kanunu",
        note: "Cizim tek basina yeterli kabul edilmemelidir.",
      },
      {
        parameter: "Disiplinler arasi koordinasyon",
        limitOrRequirement: "Mimari, statik ve tüm MEP disiplinleri ortak bosluk ve guzergah mantiginda uzlastirilmali",
        reference: "Koordinasyon modeli ve uygulama disiplini",
        note: "Koordine olmayan tesisat projesi, sahada kirma ve revizyon uretir.",
      },
      {
        parameter: "Bakım ve erişim",
        limitOrRequirement: "Pano, kollector, vana, cihaz ve test noktalari bakım erisimi dusunulerek yerlestirilmeli",
        reference: "Saha isletme ve teslim mantigi",
        note: "Çalışan ama bakım yapilamayan sistem teknik olarak eksiktir.",
      },
      {
        parameter: "Hesap ve kapasite gerekcesi",
        limitOrRequirement: "Debi, basinc, yuk, yangin ve elektrik hesaplari pafta kararlariyla tutarli olmali",
        reference: "TS EN 806, TS HD 60364, Yangin Yonetmeligi ve ilgili hesap dosyalari",
        note: "Cizim ile hesap ayri hikaye anlatmamali.",
      },
      {
        parameter: "Revizyon yonetimi",
        limitOrRequirement: "Proje revizyonlari saha, kontrol ve ruhsat ekiplerine izlenebilir bicimde aktarilmali",
        reference: "Proje kalite plani",
        note: "Yanlış revizyonun sahaya inmesi, iyi projenin bile bozulmasina neden olur.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari kat planlarini, saftlari, teknik hacimleri ve cihaz odalarini tesisat ihtiyaclari acisindan erken safhada oku.",
      "Sihhi, mekanik, elektrik ve yangin disiplinlerini tek koordinasyon modeli veya matrisi üzerinde cakistir.",
      "Hat guzergahlari kadar bakım erisimi, kapak yerleri, cihaz servis boslugu ve ekipman degisim senaryosunu da projeye isle.",
      "Debi, basinc, yuk ve koruma hesaplarini pafta kararlariyla eslestir; cizim ile hesap arasinda celiski birakma.",
      "Ruhsat eki seti, uygulama paftasi ve saha revizyonlarini tek revizyon mantigiyla yonet; farkli ekiplerde farkli versiyon birakma.",
      "Sahaya devretmeden once tesisat projesini okunabilirlik turundan gecir; yalnız doğru degil uygulanabilir olup olmadigini da sorgula.",
    ],
    criticalChecks: [
      "Saft ve asma tavan bosluklari tüm tesisat disiplinleri için gercekten yeterli mi?",
      "Pano, kollector, vana ve cihaz yerleri bakım erisimi acisindan kullanilabilir mi?",
      "Paftadaki guzergahlar statik elemanlar ve mimari bitislerle cakisiyor mu?",
      "Hesap dosyasi ile pafta uzerindeki cap, kesit ve cihaz kararlari uyumlu mu?",
      "Ruhsat/onay için gereken proje eki ve aciklama notlari eksiksiz mi?",
      "Sahaya tek ve guncel proje revizyonu indirildigi kesin mi?",
    ],
    numericalExample: {
      title: "Saft alani yeterliligi için on degerlendirme mantigi",
      inputs: [
        { label: "Saft net olcusu", value: "120 x 80 cm", note: "Tipik konut safti" },
        { label: "Mekanik kanal ihtiyaci", value: "40 x 30 cm", note: "Net kanal govdesi" },
        { label: "Pis su düşey hatti", value: "O110 mm", note: "Ana kolon" },
        { label: "Elektrik tava ve zayif akim", value: "20 x 10 cm + servis boslugu", note: "Ornek yerlestim" },
      ],
      assumptions: [
        "Yalnız net ekipman olcusu degil aski, izolasyon ve bakım boslugu da dikkate alinacaktir.",
        "Saft icinde disiplinler üst uste rastgele cozumlenmeyecektir.",
        "Yerlestirim semasi uygulama öncesi 3B veya kesit bazinda kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Net ekipman olculerini toplu oku",
          result: "Kanal, atik su hatti ve tava olculeri kagit üzerinde saft icine sigiyor gibi gorunebilir.",
          note: "Ancak bu okuma yalnız govde olcusunu ifade eder; aski ve servis alani henuz dahil degildir.",
        },
        {
          title: "Bakım ve montaj boslugunu ekle",
          result: "Vanaya, temizleme kapagina veya kablo gecisine erişim için ek bosluk gerektiginde saft hizla yetersiz kalabilir.",
          note: "Sigmak ile calisabilir olmak aynı sey degildir.",
        },
        {
          title: "Proje kararina yorum getir",
          result: "Saft kesiti kritik gorunuyorsa pafta asamasinda buyutmek, sahada kirma ve taviz uretmekten daha dogrudur.",
          note: "Erken buyutulen saft, gec fark edilen cakismadan daha ucuzdur.",
        },
      ],
      checks: [
        "Net ekipman olcusu ile gercek montaj alani birbirine karistirilmamalidir.",
        "Saft kesiti yalnız bugunku hatlar için degil bakım ve revizyon senaryosu için de yeterli olmalidir.",
        "Kesit ve 3B kontrol yapilmadan 'sigiyor' karari verilmemelidir.",
        "Saha uygulanabilirligi, ruhsat uygunlugundan ayri dusunulmemelidir.",
      ],
      engineeringComment: "Tesisat projesinde en pahali santimetre, sahada yetmedigi fark edilen saft santimetresidir.",
    },
    tools: PROJE_TOOLS,
    equipmentAndMaterials: PROJE_EQUIPMENT,
    mistakes: [
      { wrong: "Tesisat projesini ruhsat eki formalitesi gibi gormek.", correct: "Saha koordinasyonunu belirleyen ana tasarim paketi olarak ele almak." },
      { wrong: "Saft ve asma tavan bosluklarini yalnız tek disipline göre cozmek.", correct: "Tüm MEP ve mimari disiplinleri aynı modelde cakistirmak." },
      { wrong: "Bakım erisimini uygulama sonrasina birakmak.", correct: "Pano, vana, cihaz ve kapak erisimini proje asamasinda tanimlamak." },
      { wrong: "Cizim ile hesap arasinda kopukluk birakmak.", correct: "Debi, yuk, cap ve kesit kararlarini hesap dosyasiyla eslestirmek." },
      { wrong: "Revizyonlari e-posta trafiginde kaybetmek.", correct: "Tek kaynakli ve izlenebilir revizyon yonetimi kurmak." },
      { wrong: "Sahaya koordinasyonsuz pafta indirmek.", correct: "Uygulanabilirlik turundan gecmis guncel paftayi devretmek." },
    ],
    designVsField: [
      "Tasarim ofisinde tesisat projesi cizgiler, semboller ve notlardan olusur; sahada ise bu cizgiler ya sorunsuz bir montaj akisina ya da surekli revizyona donusur.",
      "Iyi tesisat projesi yalnız doğru hesaplanmis proje degildir; sahada okunabilir, bakım yapilabilir ve diger disiplinlerle kavga etmeyen projedir.",
      "Bu nedenle tesisat projesi, proje hazirlik asamasinda maliyetten çok kalite ve uygulama riski belirleyen basliklardan biridir.",
    ],
    conclusion: [
      "Tesisat projesi doğru koordine edildiginde bina daha ruhsat ve uygulama asamasinda nefes alir; saftlar yeterli olur, tavanlar daha temiz cozulur, saha kirma ihtiyaci azalir ve teslim daha okunabilir hale gelir. Zayif koordine edilen proje ise sorunu cizimde degil santiyede cozdurur.",
      "Saha acisindan en doğru yaklasim, tesisat projesini sonradan eklenecek servis cizimi degil, yapinin calisabilirlik altyapisini kuran ana proje seti olarak gormek ve bu ciddiyetle yonetmektir.",
    ],
    sources: [
      ...PROJE_DEEP_SOURCES,
      SOURCE_LEDGER.planliAlanlar,
      SOURCE_LEDGER.tsEn806,
      SOURCE_LEDGER.tsHd60364,
      SOURCE_LEDGER.yanginYonetmeligi,
    ],
    keywords: ["tesisat projesi", "MEP koordinasyon", "saft planlama", "ruhsat eki projeler", "uygulama koordinasyonu"],
    relatedPaths: ["proje-hazirlik", "proje-hazirlik/mimari-proje", "proje-hazirlik/elektrik-projesi"],
  },
];
