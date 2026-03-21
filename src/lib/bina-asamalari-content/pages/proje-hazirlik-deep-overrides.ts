import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const PROJE_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const PROJE_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "BIM/koordinasyon modeli ve cakisma matrisi", purpose: "Mekanik, elektrik, sihhi ve yangin sistemlerini mimari ve statikle birlikte okumak." },
  { category: "Cizim", name: "Ruhsat eki tesisat pafta seti", purpose: "Onay, uygulama ve disiplinler arasi teslim beklentilerini tek dilde toplamak." },
  { category: "Kontrol", name: "Proje revizyon ve onay takip tablosu", purpose: "Revizyon sirkulasyonunu ve ilgili kurum/ekip onaylarini izlemek." },
  { category: "Kayit", name: "Ruhsat ekleri ve hesap klasoru", purpose: "Tesisat projesini yalniz cizim degil, hesap ve mevzuat paketi olarak saklamak." },
];

const PROJE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Proje", name: "Mekanik, elektrik, sihhi ve yangin tesisat paftalari", purpose: "Disiplinler arasi koordinasyon ve ruhsat/onay surecini yurutmek.", phase: "Proje hazirlik" },
  { group: "Hesap", name: "Yuk, debi, basinc, yangin ve guc hesap dosyalari", purpose: "Tesisat cizimlerini sayisal gerekce ile desteklemek.", phase: "Hesap ve onay" },
  { group: "Koordinasyon", name: "Saft, asma tavan ve cihaz yerlestim detaylari", purpose: "Uygulama oncesi kritik cakismalari azaltmak.", phase: "Koordinasyon" },
  { group: "Teslim", name: "Revizyon listesi, kurum onaylari ve uygulama notlari", purpose: "Sahaya dogru proje versiyonunu indirmek ve izlenebilirlik saglamak.", phase: "Onay ve saha devri" },
];

export const projeHazirlikDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/tesisat-projesi",
    kind: "topic",
    quote: "Tesisat projesi, duvar kapandiktan sonra hatirlanan bir servis cizimi degil; binanin kullanilabilirlik ve isletme omurgasini daha proje masasinda kuran ana koordinasyon setidir.",
    tip: "Tesisat projesini ruhsat eki formalitesi gibi gormek, sahadaki en pahali cakismalari ve sonradan kirma islerini daha proje asamasinda davet etmek demektir.",
    intro: [
      "Tesisat projesi; sihhi tesisat, elektrik, mekanik iklimlendirme, yangin, zayif akim ve ilgili altyapi sistemlerinin bina icinde nasil yerlesecegini ve nasil calisacagini belirleyen ana proje paketidir. Mimari ve statik projeden ayri gibi gorunse de aslinda o projelerin kullanilabilir hale gelmesini saglayan servis omurgasini kurar.",
      "Sahada en sik gorulen proje kaynakli sorunlardan biri, tesisat paftalarinin yalniz ruhsat eki ya da sonradan sahaya gonderilecek yardimci cizimler gibi degerlendirilmesidir. Oysa saftlarin boyutu, asma tavan bosluklari, cihaz odasi yerleri, pano duvarlari, kollector cepleri, drenaj rotalari ve yangin gecisleri daha proje asamasinda cozulmezse uygulama asamasinda pahali kirma ve revizyon kacinilmaz olur.",
      "Bir insaat muhendisi icin tesisat projesi; yalniz teknik uzmanlarin konusu degil, uygulama sirasini ve saha koordinasyonunu dogrudan etkileyen proje yonetim basligidir. Cunku bir tavan yuksekligi kaybi, bir saft yetmezligi veya bir cihaz erisim problemi mimariyi, statigi ve maliyeti birlikte etkiler.",
      "Bu nedenle tesisat projesi, cizilmis olmakla tamamlanan degil; disiplinler arasi okunmus, cakismalari azaltilmis, ruhsat ve saha beklentisiyle uyumlu hale getirilmis bir tasarim paketi olarak ele alinmalidir.",
    ],
    theory: [
      "Tesisat projelerinin ana fonksiyonu yalniz hat guzergahi gostermek degildir. Bu projeler, enerjinin, suyun, havanin ve guvenlik sistemlerinin yapi icinde hangi mekan mantigiyla dolasacagini tanimlar. Dolayisiyla her tesisat cizgisi, mimari alan kullanimini, bakim erisimini ve uygulama maliyetini etkileyen fiziksel bir karar tasir.",
      "Iyi bir tesisat projesi, disiplinler arasinda erken koordinasyon kurar. Mekanik kanal ile kiris kotu, elektrik tavasi ile sprinkler hatti, atik su dusey hatti ile mimari wc duzeni, pano odasi ile yangin kacis mesafesi birlikte okunmadiginda proje sahada parcalanir. Parcalanmis proje, cogu zaman iyi detay yerine mecburi revizyon uretir.",
      "Ruhsat ve mevzuat boyutu da onemlidir. Tesisat projesi yalniz sahaya gidecek uygulama cizimi degil; Planli Alanlar Imar Yonetmeligi, yangin mevzuati ve ilgili teknik standartlara gore ruhsat/onay paketinin de parcasidir. Bu yuzden proje cizgisi ile hesap dokumani, aciklama notlari ve pafta uyumu birlikte yurumelidir.",
      "Ayrica proje kalitesi, yalniz tasarim ofisinde degil uygulama oncesi saha okunabilirliginde olculur. Saft icinde hangi hattin nereye gectigi, bakim icin hangi kapagin birakilacagi, asma tavanda hangi siralamayla gidilecegi ve ekipmanlarin hangi servis boslugunu istedigi projede net degilse, saha kendi cozumlerini uretmeye baslar. Bu da kaliteyi kisisel tecrubeye bagimli hale getirir.",
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
        limitOrRequirement: "Mimari, statik ve tum MEP disiplinleri ortak bosluk ve guzergah mantiginda uzlastirilmali",
        reference: "Koordinasyon modeli ve uygulama disiplini",
        note: "Koordine olmayan tesisat projesi, sahada kirma ve revizyon uretir.",
      },
      {
        parameter: "Bakim ve erisim",
        limitOrRequirement: "Pano, kollector, vana, cihaz ve test noktalari bakim erisimi dusunulerek yerlestirilmeli",
        reference: "Saha isletme ve teslim mantigi",
        note: "Calisan ama bakim yapilamayan sistem teknik olarak eksiktir.",
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
        note: "Yanlis revizyonun sahaya inmesi, iyi projenin bile bozulmasina neden olur.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari kat planlarini, saftlari, teknik hacimleri ve cihaz odalarini tesisat ihtiyaclari acisindan erken safhada oku.",
      "Sihhi, mekanik, elektrik ve yangin disiplinlerini tek koordinasyon modeli veya matrisi uzerinde cakistir.",
      "Hat guzergahlari kadar bakim erisimi, kapak yerleri, cihaz servis boslugu ve ekipman degisim senaryosunu da projeye isle.",
      "Debi, basinc, yuk ve koruma hesaplarini pafta kararlariyla eslestir; cizim ile hesap arasinda celiski birakma.",
      "Ruhsat eki seti, uygulama paftasi ve saha revizyonlarini tek revizyon mantigiyla yonet; farkli ekiplerde farkli versiyon birakma.",
      "Sahaya devretmeden once tesisat projesini okunabilirlik turundan gecir; yalniz dogru degil uygulanabilir olup olmadigini da sorgula.",
    ],
    criticalChecks: [
      "Saft ve asma tavan bosluklari tum tesisat disiplinleri icin gercekten yeterli mi?",
      "Pano, kollector, vana ve cihaz yerleri bakim erisimi acisindan kullanilabilir mi?",
      "Paftadaki guzergahlar statik elemanlar ve mimari bitislerle cakisiyor mu?",
      "Hesap dosyasi ile pafta uzerindeki cap, kesit ve cihaz kararlari uyumlu mu?",
      "Ruhsat/onay icin gereken proje eki ve aciklama notlari eksiksiz mi?",
      "Sahaya tek ve guncel proje revizyonu indirildigi kesin mi?",
    ],
    numericalExample: {
      title: "Saft alani yeterliligi icin on degerlendirme mantigi",
      inputs: [
        { label: "Saft net olcusu", value: "120 x 80 cm", note: "Tipik konut safti" },
        { label: "Mekanik kanal ihtiyaci", value: "40 x 30 cm", note: "Net kanal govdesi" },
        { label: "Pis su dusey hatti", value: "O110 mm", note: "Ana kolon" },
        { label: "Elektrik tava ve zayif akim", value: "20 x 10 cm + servis boslugu", note: "Ornek yerlestim" },
      ],
      assumptions: [
        "Yalniz net ekipman olcusu degil aski, izolasyon ve bakim boslugu da dikkate alinacaktir.",
        "Saft icinde disiplinler ust uste rastgele cozumlenmeyecektir.",
        "Yerlestirim semasi uygulama oncesi 3B veya kesit bazinda kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Net ekipman olculerini toplu oku",
          result: "Kanal, atik su hatti ve tava olculeri kagit uzerinde saft icine sigiyor gibi gorunebilir.",
          note: "Ancak bu okuma yalniz govde olcusunu ifade eder; aski ve servis alani henuz dahil degildir.",
        },
        {
          title: "Bakim ve montaj boslugunu ekle",
          result: "Vanaya, temizleme kapagina veya kablo gecisine erisim icin ek bosluk gerektiginde saft hizla yetersiz kalabilir.",
          note: "Sigmak ile calisabilir olmak ayni sey degildir.",
        },
        {
          title: "Proje kararina yorum getir",
          result: "Saft kesiti kritik gorunuyorsa pafta asamasinda buyutmek, sahada kirma ve taviz uretmekten daha dogrudur.",
          note: "Erken buyutulen saft, gec fark edilen cakismadan daha ucuzdur.",
        },
      ],
      checks: [
        "Net ekipman olcusu ile gercek montaj alani birbirine karistirilmamalidir.",
        "Saft kesiti yalniz bugunku hatlar icin degil bakim ve revizyon senaryosu icin de yeterli olmalidir.",
        "Kesit ve 3B kontrol yapilmadan 'sigiyor' karari verilmemelidir.",
        "Saha uygulanabilirligi, ruhsat uygunlugundan ayri dusunulmemelidir.",
      ],
      engineeringComment: "Tesisat projesinde en pahali santimetre, sahada yetmedigi fark edilen saft santimetresidir.",
    },
    tools: PROJE_TOOLS,
    equipmentAndMaterials: PROJE_EQUIPMENT,
    mistakes: [
      { wrong: "Tesisat projesini ruhsat eki formalitesi gibi gormek.", correct: "Saha koordinasyonunu belirleyen ana tasarim paketi olarak ele almak." },
      { wrong: "Saft ve asma tavan bosluklarini yalniz tek disipline gore cozmek.", correct: "Tum MEP ve mimari disiplinleri ayni modelde cakistirmak." },
      { wrong: "Bakim erisimini uygulama sonrasina birakmak.", correct: "Pano, vana, cihaz ve kapak erisimini proje asamasinda tanimlamak." },
      { wrong: "Cizim ile hesap arasinda kopukluk birakmak.", correct: "Debi, yuk, cap ve kesit kararlarini hesap dosyasiyla eslestirmek." },
      { wrong: "Revizyonlari e-posta trafiginde kaybetmek.", correct: "Tek kaynakli ve izlenebilir revizyon yonetimi kurmak." },
      { wrong: "Sahaya koordinasyonsuz pafta indirmek.", correct: "Uygulanabilirlik turundan gecmis guncel paftayi devretmek." },
    ],
    designVsField: [
      "Tasarim ofisinde tesisat projesi cizgiler, semboller ve notlardan olusur; sahada ise bu cizgiler ya sorunsuz bir montaj akisina ya da surekli revizyona donusur.",
      "Iyi tesisat projesi yalniz dogru hesaplanmis proje degildir; sahada okunabilir, bakim yapilabilir ve diger disiplinlerle kavga etmeyen projedir.",
      "Bu nedenle tesisat projesi, proje hazirlik asamasinda maliyetten cok kalite ve uygulama riski belirleyen basliklardan biridir.",
    ],
    conclusion: [
      "Tesisat projesi dogru koordine edildiginde bina daha ruhsat ve uygulama asamasinda nefes alir; saftlar yeterli olur, tavanlar daha temiz cozulur, saha kirma ihtiyaci azalir ve teslim daha okunabilir hale gelir. Zayif koordine edilen proje ise sorunu cizimde degil santiyede cozdurur.",
      "Saha acisindan en dogru yaklasim, tesisat projesini sonradan eklenecek servis cizimi degil, yapinin calisabilirlik altyapisini kuran ana proje seti olarak gormek ve bu ciddiyetle yonetmektir.",
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
