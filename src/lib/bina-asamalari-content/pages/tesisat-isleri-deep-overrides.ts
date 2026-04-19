import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const TESISAT_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const ELEKTRIK_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Tek hat semasi ve panel yuk tablosu", purpose: "Pano cikislari, koruma elemanlari ve hat dagitimini saha ile aynı dilde okumak." },
  { category: "Analiz", name: "Caneco veya benzeri yuk hesap araci", purpose: "Talep gucu, koruma secimi ve hat akimlarini ilk tasarimla karsilastirmak." },
  { category: "Ölçüm", name: "Megger, topraklama test cihazi ve loop olcer", purpose: "Kapatma öncesi ve devreye alma aninda elektriksel guvenligi sayisal olarak dogrulamak." },
  { category: "Koordinasyon", name: "Saha etiketleme ve devre takip matrisi", purpose: "Buat, linye, panel ve priz devrelerini teslimde okunabilir kılmak." },
];

const ELEKTRIK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dağıtım", name: "Pano, sigorta, kacak akim koruma ve bara sistemleri", purpose: "Yuklerin güvenli dagitimi ve koruma seçiciligini saglamak.", phase: "Pano montaji" },
  { group: "Hat", name: "Boru, tava, kablo ve buat sistemleri", purpose: "Elektrik dagitimini mekanik ve mimari ile uyumlu sekilde tasimak.", phase: "Kaba ve ince tesisat" },
  { group: "Test", name: "Megger, multimetre, topraklama ve sureklilik test ekipmanlari", purpose: "Izolasyon, devre sürekliligi ve koruma kalitesini olcmek.", phase: "Devreye alma" },
  { group: "Kontrol", name: "Etiket, devre şemasi ve as-built klasoru", purpose: "Sistemi isletme ekibi için okunabilir ve bakım yapilabilir halde devretmek.", phase: "Teslim" },
];

export const tesisatIsleriDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri/elektrik-tesisati",
    kind: "topic",
    quote: "Elektrik tesisati görünmez calisir; ama hatali kuruldugunda kendini ya ariza ya da güvenlik riski olarak en sert bicimde hissettirir.",
    tip: "Boru ve kabloyu duvara gommek isi bitirmek degildir; test, etiketleme ve panoda okunabilirlik kurulmadan sistem teslim edilmis sayilmaz.",
    intro: [
      "Elektrik tesisati, bir binanin gunluk kullanım kalitesini ve emniyetini aynı anda belirleyen temel omurgalardan biridir. Aydinlatma, priz, zayif akim, pano dagitimi, topraklama ve yanginla iliskili geçiş detaylari bir araya gelerek yalnız enerji surekliligini degil, can ve mal guvenligini de etkiler.",
      "Sahada elektrik isleri cogu zaman iki asamada görülür: borulama ve kablolama. Oysa teknik bakimdan asil mesele bu iki asama arasindaki koordinasyon, paneldeki secicilik, hat etiketleme, test disiplini ve yangin dayanimli gecislerin birlikte yonetilmesidir. Sadece kabloyu cekmek, sistemin doğru calisacagini garanti etmez.",
      "Bir insaat muhendisi için elektrik tesisatini anlamak, elektrik muhendisi rolunu almak anlamina gelmez; ama saha kapanmadan once hangi kontrollere bakilacagini, hangi eksiklerin kapatma öncesi yakalanmasi gerektigini bilmek anlamina gelir. Cunku sıva kapanıp seramik bittikten sonra fark edilen bir buat, eksik topraklama veya plansiz kanal, en pahali tekrar islerden birine donusebilir.",
      "Bu nedenle elektrik tesisati, yalnız bir uzmanlık paketi olarak degil, butun santiyenin koordinasyon ve teslim kalitesi problemi olarak ele alinmalidir.",
    ],
    theory: [
      "Elektrik tesisati performansinda ana mesele, akimin kaynaktan yuke guvenli sekilde ulasmasidir. Ancak bu güvenlik yalnız kablo kesitiyle saglanmaz. Koruma elemani secimi, kısa devre davranisi, kacak akim korumasi, topraklama butunlugu ve hat etiketleme birlikte okunmalidir.",
      "Saha tarafinda en yaygin sorunlardan biri, mekanik ve mimari koordinasyon eksikligidir. Asma tavan icinde mekanik kanal ile tava cakismasi, duvarda doğrama yanina gelen buat, islak hacimde plansiz priz yeri veya şaft icinde bakım erisimsiz kutu; bunlar tasarimin kağıt üzerinde doğru, sahada ise zorlanmis uygulandigini gösterir.",
      "Elektrik tesisatinda kapatma öncesi test çok kritiktir. İzolasyon ölçümü, devre sürekliliği, pano etiketleme ve topraklama testi yapilmadan alan kapatilirse sistem yalnız görünmez hale gelmez, aynı zamanda izlenemez hale gelir. Ariza aninda hangi linye nereye gidiyor sorusunun cevabi yoksa bakım maliyeti hızla yükselir.",
      "Ayrıca yangin güvenligi boyutu unutulmamalidir. Şaft, duvar ve döşeme geçişlerinde yangin dayaniminin bozulmasi, elektrik tesisatini yalnız enerji sistemi olmaktan cikarir ve yapinin bütün güvenlik senaryosunu etkiler. Bu nedenle elektrik isleri ile yangin geçiş detaylari birlikte değerlendirilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Koruma ve dağıtım mantigi",
        limitOrRequirement: "Pano, sigorta ve kacak akim koruma duzeni hat kullanimina uygun ve okunabilir olmalı",
        reference: "TS HD 60364",
        note: "Koruma elemani yalnız secilmis olmamali, devreyle doğru eşleşmelidir.",
      },
      {
        parameter: "Boru, tava ve kablo guzergahi",
        limitOrRequirement: "Hat guzergahlari bakım erisimli ve diger disiplinlerle cakismayacak sekilde cozulmeli",
        reference: "Saha koordinasyon plani",
        note: "Görünmez kalan hatlar sonradan bulunamayacak kadar karmasik kurulmamali.",
      },
      {
        parameter: "Topraklama ve sureklilik",
        limitOrRequirement: "Topraklama butunlugu ve devre surekliligi kapatma öncesi olculerek dogrulanmali",
        reference: "TS HD 60364",
        note: "Olculmeyen koruma, varsayilan korumadir.",
      },
      {
        parameter: "Yangin gecisleri ve saft disiplini",
        limitOrRequirement: "Duvar ve doseme gecislerinde yangin guvenligi detaylari bozulmadan tamamlanmali",
        reference: "Binalarin Yangindan Korunmasi Hakkinda Yonetmelik",
        note: "Tesisat gecisi bir delik degil, yangin butunlugu kararidir.",
      },
      {
        parameter: "Devreye alma ve etiketleme",
        limitOrRequirement: "Pano cikislari, linyeler ve kritik buatlar sahada okunabilir etiketlemeyle teslim edilmeli",
        reference: "Teslim kalite plani",
        note: "Bakım ekibi sistemi çizimsiz de okuyabilecek seviyede bilgiye sahip olmalı.",
      },
    ],
    designOrApplicationSteps: [
      "Tek hat semasi, mahal bazli priz-aydinlatma plani ve pano cikislarini sahaya inmeden once ortak koordinasyon diline cevir.",
      "Boru ve tava guzergahlarini mekanik hatlar, asma tavan boşlukları ve doğrama detaylariyla cakistirarak yürüt.",
      "Buat, priz, anahtar ve zayif akim noktalarini duvar örme ve siva bitişleriyle birlikte düşün; sonradan kırma gerektirecek karar verme.",
      "Pano iclerini yalnız montajla degil, devre numarasi, etiketleme ve yedek kapasite mantigiyla tamamla.",
      "Kapatma öncesi izolasyon, sureklilik, topraklama ve gerekiyorsa fonksiyon testlerini olcerek kayda bagla.",
      "Teslim öncesi devre listesi, pano etiketi, as-built ve kritik nokta fotoğraflarini tek pakette birlestir.",
    ],
    criticalChecks: [
      "Pano içindeki devre isimleri ve saha etiketleri birbiriyle uyumlu mu?",
      "Boru ve tava güzergahlari bakım veya ilave çekim için erişilebilir mi?",
      "Islak hacim, şaft ve kaçış yolu geçişlerinde yanlış konumlanmış elektrik elemani var mı?",
      "İzolasyon, topraklama ve süreklilik ölçümleri gerçekten kayıt altina alindi mi?",
      "Kapatma öncesi buat ve linye foto kaydi alindi mi?",
      "Yangin durdurucu detaylar elektrik geçişlerinde eksiksiz mi?",
    ],
    numericalExample: {
      title: "Kat panosu için talep akimi yorumu",
      inputs: [
        { label: "Toplam bagli yuk", value: "18 kW", note: "Bir katin aydinlatma ve priz toplami" },
        { label: "Talep katsayisi", value: "0,60", note: "Ornek saha planlama katsayisi" },
        { label: "Sistem", value: "3 faz, 400 V", note: "Kat panosu beslemesi" },
        { label: "Guc faktoru", value: "0,90", note: "Ornek yorum degeri" },
      ],
      assumptions: [
        "Yukler kat boyunca dengeli dagitilmistir.",
        "Talep katsayisi, yapinin kullanım senaryosuna göre belirlenmistir.",
        "Kesin koruma elemani secimi için kısa devre ve secicilik kontrolu ayrıca yapilacaktir.",
      ],
      steps: [
        {
          title: "Talep gücünü bul",
          formula: "18 x 0,60 = 10,8 kW",
          result: "Kat panosu için hesapta dikkate alinacak talep gücü 10,8 kW olur.",
          note: "Bagli yuk ile gercek işletme yükü aynı kabul edilmemelidir.",
        },
        {
          title: "Hat akimini hesapla",
          formula: "I = 10800 / (1,732 x 400 x 0,90) = 17,3 A",
          result: "Yaklasik hat akimi 17,3 A seviyesindedir.",
          note: "Bu sonuc yalnız on planlama içindir; koruma seçimi ek kontroller ister.",
        },
        {
          title: "Pano kararina yorum getir",
          result: "Ana koruma ve kablo kesiti secimi, bu akimin uzerine emniyet payi ve işletme kosullari eklenerek yapilmalidir.",
          note: "Pano seçiminde yalnız teorik akim değil, yedek kapasite ve secicilik de düşünülmelidir.",
        },
      ],
      checks: [
        "Talep katsayisi seçimi kullanima göre doğrulanmalıdır.",
        "Hesap, kablo kesiti ve koruma elemani secimini tek basina belirlemez; fakat on planlama için referans üretir.",
        "Pano etiketleme ve devre dagilimi, hesap sonucuyla uyumlu olmalıdır.",
        "Kritik yüklere ayrılan devreler genel yükten bağımsız okunabilir kalmalıdır.",
      ],
      engineeringComment: "Elektrik tesisatinda rakamlar, yalnız tasarim ofisi için degil; panonun sahada neden o sekilde kuruldugunu anlamak için de gereklidir.",
    },
    tools: ELEKTRIK_TOOLS,
    equipmentAndMaterials: ELEKTRIK_EQUIPMENT,
    mistakes: [
      { wrong: "Pano etiketlerini montaj sonuna veya teslim gunune birakmak.", correct: "Her devreyi kablo cekildigi anda tanimlayip pano ile sahayi birlikte etiketlemek." },
      { wrong: "Megger ve topraklama testlerini formalite gormek.", correct: "Kapatma öncesi teknik kabulun ana maddesi olarak uygulamak." },
      { wrong: "Buat ve priz yerlerini yalnız mimari bitise göre secmek.", correct: "Mekanik, doğrama ve kullanıcı rotasiyla birlikte koordine etmek." },
      { wrong: "Shaft gecislerini delik acip kablo geçirmek seviyesinde görmek.", correct: "Yangin butunlugu kararini da birlikte tamamlamak." },
      { wrong: "As-built setini saha degisikliklerinden kopuk tutmak.", correct: "Her degisikligi pano ve guzergahla birlikte belgelemek." },
      { wrong: "Bakım erisimi olmayan tava ve kutu bırakmak.", correct: "Teslim sonrası işletmeyi düşünerek erişilebilir sistem kurmak." },
    ],
    designVsField: [
      "Tasarim tarafinda elektrik tesisati çizgiler, simgeler ve panel tablolarindan oluşur; sahada ise bunlarin her biri bakım yapilabilir, test edilmiş ve doğru etiketlenmiş fiziksel sisteme donusmek zorundadir.",
      "Kagit üzerinde doğru bir tek hat şemasi, eğer panoda okunabilir degilse veya sahadaki devreyle eşleşmiyorsa tek başına yeterli sayilmaz.",
      "Bu nedenle elektrik tesisati kalitesi, kabloların gizlenmesinden çok sistemin görünmese de izlenebilir olmasiyla ölçülür.",
    ],
    conclusion: [
      "Elektrik tesisati doğru koordinasyon, doğru test ve doğru etiketleme ile yürütüldüğünde binanin en sorunsuz çalışan altyapilarindan birine dönüşür. Aynı sistem bu üç halka eksik olduğunda ariza, bakım zorlugu ve güvenlik riski üretir.",
      "Saha tarafinda en sağlam yaklaşım, elektrik işlerini montajdan ibaret görmemek ve kapatma öncesi doğrulama kültürünü zorunlu hale getirmektir. Bu yaklaşım, teslimden sonraki ilk ayların ariza profilini belirgin bicimde düşürür.",
    ],
    sources: [...TESISAT_DEEP_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["elektrik tesisati", "pano etiketleme", "topraklama", "TS HD 60364", "devreye alma"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/kablolama", "tesisat-isleri/pano-montaj"],
  },
];
