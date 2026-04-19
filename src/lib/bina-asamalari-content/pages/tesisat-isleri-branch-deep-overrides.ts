import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const TESISAT_BRANCH_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const TESISAT_BRANCH_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "MEP overlay, shaft matrisi ve asma tavan cakisma paftasi", purpose: "Görünmez imalatlari daha kapanmadan once ortak dilde cozumlemek." },
  { category: "Test", name: "Basinc, izolasyon, sureklilik ve fonksiyon test matrisi", purpose: "Her sistemin kabulunu tek teslim mantigina baglamak." },
  { category: "Kayıt", name: "Etiketleme standardi ve as-built veri seti", purpose: "Bakım ekibinin kapanmis sistemleri sahada tekrar okuyabilmesini saglamak." },
  { category: "Devreye alma", name: "Commissioning checklisti ve mahal bazli deneme senaryolari", purpose: "Sistemi sadece monte edilmis degil, calisir halde teslim etmek." },
];

const TESISAT_BRANCH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Mekanik", name: "Temiz su, atik su, isitma-sogutma ve havalandirma altyapisi", purpose: "Binanin konfor ve hijyen omurgasini kurmak.", phase: "Mekanik imalat" },
  { group: "Elektrik", name: "Pano, kablolama, topraklama ve zayif akim altyapisi", purpose: "Guvenli enerji dagitimi ve izlenebilir elektrik omurgasi saglamak.", phase: "Elektrik imalati" },
  { group: "Yangin", name: "Yangin suyu, alarm arayuzu, dolap, vana ve koruma elemanlari", purpose: "Acil durumda calisacak aktif güvenlik zincirini olusturmak.", phase: "Yangin tesisati" },
  { group: "Teslim", name: "Etiket, test raporu, as-built, isletme klasoru ve bakım notlari", purpose: "Sistemleri kullaniciya ve teknik ekibe anlasilir bicimde devretmek.", phase: "Devreye alma ve teslim" },
];

export const tesisatIsleriBranchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri",
    kind: "branch",
    quote: "Tesisat isleri kapandiginda görünmez olur; bu yuzden kaliteyi goruntuyle degil koordinasyon, test ve teslim disipliniyle okumak gerekir.",
    tip: "Boru ve kablo tavanda kayboldu diye isin bittigini sanmak, santiyenin en pahali geri donuslerini teslim sonrasina birakmaktir.",
    intro: [
      "Tesisat isleri; temiz su, atik su, isitma-sogutma, havalandirma, elektrik, zayif akim ve yangin sistemlerinin bir araya geldigi kritik uygulama fazidir. Bu fazi digerlerinden ayiran temel ozellik, imalatlarin buyuk kisminin daha sonra görünmez hale gelmesidir. Duvar kapanir, asma tavan kapanir, shaft kapanir ve hata fark edilirse duzeltme maliyeti katlanarak artar.",
      "Bu nedenle tesisat islerinde kaliteyi yalnız düzgün montajla tanimlamak eksiktir. Doğru guzergah, bakım erisimi, test kabiliyeti, etiketleme, as-built kaydi, devreye alma ve disiplinler arasi koordinasyon birlikte saglanmadikca iş teknik olarak tamamlanmis sayilmamalidir. Sahadaki en pahali tekrar isler, cogu zaman görünmez imalatlarin 'nasil olsa sonra bakariz' anlayisiyla yonetilmesinden dogar.",
      "Bir insaat muhendisi için tesisat islerini bilmek, her sistemin uzman hesabini bizzat yapmak anlamina gelmez; ancak hangi sistemin hangi noktada digeriyle cakistigini, test edilmeden kapatilmasi halinde hangi riskin dogdugunu, bakım erisimi birakilmayan bir vananin veya buatin teslimden sonra nasil buyuk probleme donustugunu bilmek anlamina gelir. Bu bilgi saha yonetiminde zaman, maliyet ve teknik risk acisindan belirleyicidir.",
      "Tesisat isleri aynı zamanda proje olgunlugunun gercek testidir. Mimari, statik, mekanik, elektrik ve yangin cizimleri masada uyumlu gorunebilir; fakat asma tavan icinde ilk kanal, ilk tava ve ilk yangin borusu aynı hacme girdiginde gercek koordinasyon seviyesi ortaya cikar. Iyi bir saha yonetimi burada reactif degil, onleyici davranir.",
      "Bu rehberde tesisat islerini tekil sistemler listesi olarak degil, koordinasyon, test ve teslim zinciri olarak ele aliyoruz. Saha ipuclari, sayisal ornek, devreye alma bakisi ve bir insaat muhendisinin her fazda sormasi gereken kritik sorularla uzun-form standardinda bir çatı metin kuruyoruz.",
    ],
    theory: [
      "Tesisat islerinin teorik temeli, farkli sistemlerin aynı bina geometri si icinde kendi performans gereksinimlerini koruyarak bir arada var olabilmesidir. Mekanik hatlar egim ister, elektrik hatlari ayristirma ve koruma ister, yangin hatlari erişim ve güvenlik onceligi ister. Bu gereksinimler birbirinden bagimsiz degildir; aynı shaft ve tavan boslugunda kesisirler. Bu nedenle MEP muhendisligi aslinda bir uzlasma ve onceliklendirme muhendisligidir.",
      "Bu fazda en kritik kavramlardan biri erisimdir. Bir sistem ne kadar doğru hesaplanmis olursa olsun; vanasina, buatina, filtre veya cihazina ulasilamiyorsa isletme acisindan eksiktir. Bu nedenle tesisat koordinasyonunda 'sigi yormuyor' mantigi yerine 'montaj, test ve bakım ucgeni için yeterli alan birakiyor mu' sorusu sorulmalidir. Bir santiyede doğru tasarlanmis ama erisimsiz bir sistem, kismen yanlış bir sistemdir.",
      "Ikinci temel kavram test edilebilirliktir. Basinc testi, izolasyon olcumu, fonksiyon testi, drenaj senaryosu, alarm entegrasyonu veya devre surekliligi tamamlanmadan sistemin kapatilmasi, aslinda sorunlarin saklanmasi anlamina gelebilir. Bu yuzden tesisat islerinde kalite, kapatma sonrasi goruntuden degil kapatma öncesi ne kadar olculebildiginden okunur.",
      "Bir diger ana eksen dokumantasyondur. Cogu saha, montaja ciddi zaman ayirirken etiketleme ve as-built kaydini ikincil gorur. Oysa isletme doneminde teknik ekip için en degerli belge, gercekte neyin nereye baglandigini gosteren guncel kayittir. Etiketsiz vana, kodlanmamis pano cikisi veya krokiye islenmemis bir shaft degisikligi, teslimden sonraki ilk arizada doğrudan zaman ve para kaybi uretir.",
      "Bu nedenle tesisat isleri, yalnizca saha imalati degil; koordinasyon, devreye alma ve isletmeye hazirlama disiplini olarak gorulmelidir. En iyi saha, sistemi kapatmadan once tüm hayati kararlarini görünür ve olculebilir hale getiren sahadir.",
    ],
    ruleTable: [
      {
        parameter: "Temiz su ve atik su temel esaslari",
        limitOrRequirement: "Hijyen, egim, havalik ve bakım erisimi temiz su ve pis su sistemlerinde korunmalidir",
        reference: "TS EN 806 + TS EN 12056",
        note: "Boru gecmesi yeterli degil; sistem temiz, bakimli ve doğru egimli calismalidir.",
      },
      {
        parameter: "Elektrik guvenligi ve izlenebilirlik",
        limitOrRequirement: "Topraklama, koruma, pano okunurlugu ve ölçüm zinciri tamamlanmalidir",
        reference: "TS HD 60364",
        note: "Görünmez hatlar ancak etiket ve test ile izlenebilir kalir.",
      },
      {
        parameter: "Yangin sistemleri",
        limitOrRequirement: "Aktif yangin koruma sistemi pasif yangin butunlugunu bozmadan kurulmalidir",
        reference: "Binalarin Yangindan Korunmasi Hakkinda Yonetmelik",
        note: "Yangin tesisati ayricalikli güvenlik onceligine sahiptir.",
      },
      {
        parameter: "Kabuk ve enerji uyumu",
        limitOrRequirement: "Tesisat gecisleri ve cihaz yerlesimleri bina kabugu ve enerji performansi hedefleri ile uyumlu olmalidir",
        reference: "TS 825 + Binalarda Enerji Performansi Yonetmeligi",
        note: "Tesisat karari bina kabugunu delip gecen teknik bir karardir.",
      },
      {
        parameter: "Test, etiketleme ve teslim",
        limitOrRequirement: "Her sistem kapatma öncesi test edilmis, etiketlenmis ve as-built kaydina islenmis olmalidir",
        reference: "Teslim kalite plani",
        note: "Montaji bitmis ama kaydi eksik sistem teslime hazir degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Shaftlari, cihaz odalarini ve asma tavan bosluklarini mimari, statik ve MEP overlay ile daha imalat baslamadan kilitle.",
      "Montaj siralamasini en çok erişim ve test ihtiyaci olan sistemleri once gosterir bicimde planla; tavanda kimin once girecegi rastgele belirlenmesin.",
      "Mekanik, elektrik ve yangin ekipleri için ortak kodlama ve etiketleme standardi tanimla; sonradan uyarlanmaya birakma.",
      "Her sistem için kapatma öncesi zorunlu test listesi hazirla ve eksik testli bolgeleri fiziksel olarak kapanisa kapat.",
      "As-built guncellemesini sahayla es zamanli yurut; sahada degisen guzergahlar paftaya aylar sonra degil aynı hafta islensin.",
      "Devreye alma asamasinda mahal bazli senaryolar kullan; sadece cihaz calisiyor mu degil, sistem butun senaryoda doğru tepki veriyor mu sorusunu cevapla.",
    ],
    criticalChecks: [
      "Asma tavan ve shaft koordinasyonunda sonradan kirma gerektirecek cakisma kaldi mi?",
      "Vana, buat, filtre ve pano gibi bakım noktalarina gercekten erisilebiliyor mu?",
      "Kapatma öncesi basinc, izolasyon, sureklilik ve fonksiyon testleri tek matriste toplandi mi?",
      "Etiketleme ile as-built kodlamasi aynı referans dilini kullaniyor mu?",
      "Yangin, elektrik ve mekanik gecislerinde pasif koruma butunlugu bozuldu mu?",
      "Devreye alma senaryolari sadece cihaz bazli degil mahal ve sistem bazli da denendi mi?",
    ],
    numericalExample: {
      title: "6 katli yapida tesisat teslim matrisi kapasite yorumu",
      inputs: [
        { label: "Kat sayisi", value: "6", note: "Tipik orta olcekli apartman/ofis kurgusu" },
        { label: "Ana sistem sayisi", value: "4", note: "Sihhi, elektrik, isitma-sogutma, yangin" },
        { label: "Kat bazli kontrol turu", value: "3 ana test grubu", note: "Basinc veya akis, izolasyon, fonksiyon" },
        { label: "Etiketlenecek kritik ekipman", value: "96 adet", note: "Vana, kolektor, cihaz, pano ve saha noktasi" },
      ],
      assumptions: [
        "Her katta tüm sistemler aktif olarak yer almaktadir.",
        "Testler disiplin bazli ayri ekiplerce yapilip merkezi matriste toplanacaktir.",
        "Saha degisiklikleri as-built setine es zamanli islenecektir.",
      ],
      steps: [
        {
          title: "Kontrol yogunlugunu oku",
          formula: "6 kat x 4 sistem = 24 kat-sistem paketi",
          result: "Yalnız kat ve sistem sayisina bakildiginda bile en az 24 ana kontrol paketi ortaya cikar.",
          note: "Bu yuk, teslimin neden son haftaya sikistirilamayacagini gosterir.",
        },
        {
          title: "Test matrisini buyut",
          formula: "24 paket x 3 test grubu = 72 ana test adimi",
          result: "Yaklasik 72 ana test adimi merkezi takvim ve tek kodlama olmadan saglikli izlenemez.",
          note: "Daginik test kaydi, teknik eksikleri saklar ve teslimi zayiflatir.",
        },
        {
          title: "Etiketleme ihtiyacini bagla",
          result: "96 kritik ekipman için standart etiket ve as-built eslesmesi kurulmazsa ilk arizada saha tekrar kesfedilmek zorunda kalir.",
          note: "Etiketleme isletme konforu degil, teknik zorunluluktur.",
        },
      ],
      checks: [
        "Teslim matrisi sistem bazli degil kat-sistem bazli kurulursa sorumluluk netlesir.",
        "Etiket ve as-built referansi aynı kodu tasimaliyse ariza bulma suresi kisalir.",
        "Son hafta devreye alma anlayisi bu yogunlugu saglikli yonetemez.",
        "Test sonucu olmayan kat veya mahal fiziksel olarak kapanisa girmemelidir.",
      ],
      engineeringComment: "Tesisat islerinde kalite, kac metre boru veya kablo dondurulduguyla degil; bu hacmin ne kadar test edilip kayda baglandigiyla anlasilir.",
    },
    tools: TESISAT_BRANCH_TOOLS,
    equipmentAndMaterials: TESISAT_BRANCH_EQUIPMENT,
    mistakes: [
      { wrong: "Shaft ve asma tavan koordinasyonunu sahada dogaclama cozmeye çalışmak.", correct: "Overlay ve numune alan ile kesisimleri daha kapanmadan once netlestirmek." },
      { wrong: "Bakım erisimi gerektiren noktalari yalnız montaj sigiyor mu diye okumak.", correct: "Montaj, test ve bakım ucgenine göre yer ayirmak." },
      { wrong: "Her disiplinin kendi testini kendi evraginda birakmak.", correct: "Teslim için merkezi bir test matrisi kullanmak." },
      { wrong: "Etiketleme ve as-built'i teslim haftasinin kagit isi saymak.", correct: "Montaj ile es zamanli ve kodlu sistem halinde ilerletmek." },
      { wrong: "Yangin tesisatini diger hatlarla aynı oncelikte koordine etmek.", correct: "Güvenlik onceligi nedeniyle yangin hatlarini kritik kesisimlerde once cozumlemek." },
      { wrong: "Sistemi cihaz calisti diye teslim etmek.", correct: "Mahal, kat ve senaryo bazli devreye alma ile butun zinciri test etmek." },
    ],
    designVsField: [
      "Ofiste MEP cizimleri farkli renklerde üst uste durur; sahada ise aynı hacimde siraya, oncelige ve fiziksel alana donusur.",
      "Görünmez imalatlarin kalitesi, ustlerinin kapanmasindan once ne kadar acik ve olculebilir olduklariyla anlasilir.",
      "Bu nedenle tesisat isleri, montaj fazindan çok teslime hazirlama ve isletmeye geçiş muhendisligi olarak dusunulmelidir.",
    ],
    conclusion: [
      "Tesisat isleri, binanin en kritik ama en kolay saklanan kalite alanlarindan biridir. Koordinasyon, test, etiketleme ve devreye alma zinciri doğru kurulursa sistemler yillarca sorunsuz calisir; bu zincir zayiflarsa arizalar kapali tavan ve duvarlarin arkasinda buyur.",
      "Bir insaat muhendisi için saglam yaklasim, tesisati yalnizca ustalara dagitilan imalat listesi olarak degil, butun santiyenin görünmez omurgasi olarak yonetmektir. Bu bakis teslim kalitesini ve isletme guvenilirligini belirgin bicimde yukselir.",
    ],
    sources: [...TESISAT_BRANCH_SOURCES, SOURCE_LEDGER.tsEn806, SOURCE_LEDGER.tsEn12056, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["tesisat isleri", "MEP koordinasyon", "devreye alma", "etiketleme", "as-built"],
    relatedPaths: ["tesisat-isleri/elektrik-tesisati", "tesisat-isleri/yangin-tesisati", "proje-hazirlik/tesisat-projesi"],
  },
];
