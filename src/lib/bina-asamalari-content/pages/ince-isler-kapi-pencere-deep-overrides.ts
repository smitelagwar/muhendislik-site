import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_KAPI_PENCERE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_14351_1_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-1 Pencereler ve Kapılar - Mamul Standardi, Performans Karakteristikleri - Pencereler ve Dış Kapı Setleri",
  shortCode: "TS EN 14351-1",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "Pencere ve dış kapı setlerinde temel performans karakteristikleri, hava-su gecirimsizligi ve urun beyanlari için temel referanslardan biridir.",
};

const KAPI_PENCERE_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Doğrama listesi, tip kesitleri ve mahal bitis paftası", purpose: "İç kapı, dış kapı ve pencere kararlarini tek cizelgede duvar ve döşeme bitisleriyle eslestirmek." },
  { category: "Ölçüm", name: "Lazer nivo, diyagonal metre ve aciklik kontrol cizelgesi", purpose: "Kaba bosluklari ve montaj toleransini sahada standart hale getirmek." },
  { category: "Kontrol", name: "Hava-su sızdırmazlık ve fonksiyon checklisti", purpose: "Acilma kapanma kadar denizlik, mastik ve drenaj detaylarini da aynı kabul turuna dahil etmek." },
  { category: "Kayıt", name: "Cephe ve mahal bazli doğrama foyi", purpose: "Numune, revizyon ve teslim notlarini urun tipi bazinda izlemek." },
];

const KAPI_PENCERE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Urun", name: "PVC, aluminyum veya kompozit doğrama setleri", purpose: "Mahal ihtiyacina göre isi, hava, su ve kullanım performansini saglamak.", phase: "Montaj" },
  { group: "Birleşim", name: "Ankraj, takoz, bant, mastik ve kontrolü dolgu malzemeleri", purpose: "Doğrama ile duvar arasindaki kritik performans araligini yonetmek.", phase: "Birleşim" },
  { group: "Tamamlayici", name: "Denizlik, damlalik, esik ve pervaz detaylari", purpose: "Su yönetimi ve bitmis mekan kalitesini birlestirmek.", phase: "Bitis" },
  { group: "Koruma", name: "Köşe koruma, kanat sabitleme ve temizlik ekipmani", purpose: "Montaj sonrasi diger islerin doğrama yuzeyine zarar vermesini onlemek.", phase: "Teslim öncesi" },
];

export const inceIslerKapiPencereDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/kapi-pencere",
    kind: "topic",
    quote: "Kapı ve pencere sistemleri, boşluk kapatan urunler değil; kabuk performansi ile gunluk kullanım kalitesini aynı anda tasiyan birleşim sistemleridir.",
    tip: "Dogramayi yalnız urun secimine indirgemek, en kritik alan olan duvar-boşluk-birleşim hattini gözden kacirmak demektir.",
    intro: [
      "Kapı ve pencere sistemleri, yapının kullanıcı ile dış çevre arasindaki en hassas temas katmanlarindan biridir. Pencere gunesi, yagmuru, ruzgari ve isi kontrol ederken; kapılar geçiş, güvenlik, mahremiyet ve bazen yangın veya akustik gereksinimini aynı anda yonetir. Bu nedenle doğrama isleri, şantiyede gorundugunden çok daha fazla performans karari icerir.",
      "Sahada sık yapilan hata, doğrama kalitesini sadece profil markasi, cam kalinligi veya kapı kanadi ile okumaktir. Oysa pek çok sorun urunden değil, urunun duvarla bulustugu birleşim hattindan dogar. Yetersiz montaj boşluğu, yanlış ankraj, eksik bant-mastik, denizlikte suyun geri itilmesi veya bitmis döşeme kotunun dikkate alinmamasi iyi urunu bile zayif sonuca donusturebilir.",
      "Bir inşaat mühendisi için kapı pencere konusu yalnızca mimari detay veya marangozluk kalemi degildir. Cephede isi ve su davranisi, iç mekanda fonksiyon ve akustik, detayda ise tolerans ve bakım kabiliyeti bir aradadir. Bu nedenle bu baslik hem kabuk muhendisligini hem de bitmis mekan kalitesini birlestiren ozel bir koordinasyon alanidir.",
      "Bu yazida kapı ve pencere islerini; urun secimi, montaj toleransi, birleşim detaylari, iç-dış farklari, saha kabul turu ve sayisal bir boşluk ornegi ile birlikte daha kapsamli bir blog standardinda ele aliyoruz.",
    ],
    theory: [
      "Pencere ve dış kapı tarafinda performansin cekirdegi; hava sizdirmazligi, su gecirimsizligi, isi kaybi kontrolü ve uzun vadeli acilma kapanma davranisidir. Bu performanslar urun beyanlariyla tarif edilebilir; ancak sahada gercege donusmesi, urunun doğru aksa, doğru boslukla ve doğru sızdırmazlık katmaniyla yerlesmesine baglidir. Bu nedenle pencere montaji, cephenin en kritik zayif halka noktalarindan biridir.",
      "İç kapilarda ise fiziksel dış ortam etkisinden çok kullanım konforu, geometri, donanim kalitesi ve bazen akustik veya yangın davranisi one çıkar. Aynı binadaki tüm kapıları aynı mantikla cozmeye çalışmak hatalidir; ofis, islak hacim, servis odasi, yangın kacis kapısı ve konut odasi farkli gereksinimlere sahiptir. Yani kapı listesi bir urun listesi değil, fonksiyon matrisi olarak okunmalidir.",
      "Duvar-birleşim hatti iki tarafta da en kritik bolgedir. Pencerede suyun iceri girmesi, kisin yoğuşma riski veya hava kacagi genelde bu cevrede ortaya çıkar. Kapı tarafinda da aynı hat; pervaz-aciklik uyumsuzlugu, kasa sehimleri, kilit karsiligi problemi ve bitmis döşeme hatasiyla gunluk arizaya donusebilir. Dolayisiyla doğrama muhendisliginin ana konusu urunun kendisinden çok birlesimin kendisidir.",
      "Bir baska teori basligi da toleranstir. Duvar boşluğu, sıva kalinligi, mantolama kalinligi, denizlik yuksekligi, doğrama kasa olculeri ve montaj bandinin gerektirdigi aralik birlikte dusunulmelidir. Sahadaki milimetre farklari burada zincirleme etki yaratir. Bu yuzden kapı pencere islerinde 'yerinde uydururuz' yaklasimi genellikle hem estetik hem performans kaybina yol acar.",
      "TS EN 14351-1 cercevesi urunun performans karakteristiklerini tanimlarken, TS 825 ve enerji performansi mantigi dogramayi bina kabugunun parçası olarak gorur. Iyi şantiyede bu iki bakis birlestirilir: urun doğru secilir, sonra birleşim detayi bu performansi koruyacak sekilde uygulanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun performansi ve sinif secimi",
        limitOrRequirement: "Pencere ve dış kapı setleri, mahalin maruziyetine uygun performans siniflariyla secilmelidir",
        reference: "TS EN 14351-1",
        note: "Cephedeki aciklik, sadece goruntu karari değil performans karari uretir.",
      },
      {
        parameter: "Kabuk uyumu",
        limitOrRequirement: "Doğrama detaylari isi kaybi, hava kacaklari ve yoğuşma riski acisindan bina kabugu ile birlikte çözülmelidir",
        reference: "TS 825 + Binalarda Enerji Performansi Yönetmeliği",
        note: "Pencereyi duvardan ayri bir urun gibi dusunmek isi koprusu riskini buyutur.",
      },
      {
        parameter: "Montaj boşluğu ve ankraj",
        limitOrRequirement: "Kasa cevresinde kontrollu tolerans birakilmali, mekanik sabitleme ve sızdırmazlık katmanlari birlikte uygulanmalidir",
        reference: "Uretici detaylari + saha kalite plani",
        note: "Yalnız kopuk veya mastik ile performans beklemek doğru degildir.",
      },
      {
        parameter: "Su yönetimi",
        limitOrRequirement: "Denizlik, damlalik, dış derz ve su tahliye detaylari aktif olarak çözülmelidir",
        reference: "Cephe ve doğrama detay paftası",
        note: "Yagmur suyu, profil kadar detaydaki egim ve yonle de yonetilir.",
      },
      {
        parameter: "İç mekan fonksiyonlari",
        limitOrRequirement: "İç kapılar mahal kullanimina göre fonksiyon, donanim ve ozel performans gereksinimi ile secilmelidir",
        reference: "TS EN 14351-2 + mahal listesi",
        note: "Her kapı aynı kullanima hizmet etmedigi için aynı detayla cozulmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Kapı ve pencere listesini sadece ebat tablosu olarak değil, mahal fonksiyonu ve cephe maruziyeti matrisi olarak dondur.",
      "Kaba bosluklari sıva, yalitim, denizlik, esik ve bitmis döşeme kalinliklariyla birlikte yeniden olc; urunu bosluga değil, bitmis detaya göre sec.",
      "Doğrama montajinda ankraj, takoz, bant, mastik ve su tahliye detaylarini aynı paket olarak uygula; birini sonradan telafi etmeye çalışma.",
      "Pencere ve dış kapilarda denizlik, damlalik ve dış derz su yonunu maket veya numune detayla teyit et.",
      "İç kapilarda mentese, kilit, pervaz ve alt boşluk ayarlarini bitmis zemin geldikten sonra gercek kullanimla test et.",
      "Teslim öncesi cephe bazli ve mahal bazli iki ayri kabul turu yap; birinde su-hava davranisini, digerinde fonksiyon ve görünür kaliteyi oku.",
    ],
    criticalChecks: [
      "Kaba boşluk ile kasa olculeri arasinda gerekli montaj toleransi var mi?",
      "Pencere ve dış kapilarda denizlik, damlalik ve dış derz detaylari suyu gercekten disari yonlendiriyor mu?",
      "Doğrama kasasi sadece kopukle mi tasiniyor, yoksa mekanik olarak da sabit mi?",
      "İç kapilarda bitmis döşeme kötü ve süpürgelik iliskisi test edildi mi?",
      "Cephede isi koprusu ve yoğuşma riski yaratacak boşluk veya kesinti var mi?",
      "Numune doğrama detayi gercekte sahadaki tüm tipleri temsil ediyor mu?",
    ],
    numericalExample: {
      title: "Pencere montaj boşluğu ve denizlik karari için sayisal yorum",
      inputs: [
        { label: "Pencere kasa ölçüsü", value: "1400 x 1500 mm", note: "Ornek dış pencere" },
        { label: "Olculen kaba boşluk", value: "1430 x 1535 mm", note: "Sıva öncesi aciklik" },
        { label: "Planlanan iç-dış bitis toplam payi", value: "10 mm / yan", note: "Sıva ve bitis toleransi yorumu" },
        { label: "Amac", value: "Dengeli montaj ve sızdırmazlık payi saglamak", note: "Doğru birleşim kararini okumak" },
      ],
      assumptions: [
        "Boşluk ölçüsü sahada dogrulanmistir ve duvar aks sapmasi buyuk degildir.",
        "Doğrama cevresinde bant ve mastik sistemi birlikte kullanilacaktir.",
        "Denizlik ve damlalik detayi pencere montaji ile aynı anda cozulmektedir.",
      ],
      steps: [
        {
          title: "Genislikte toplam montaj payini bul",
          formula: "1430 - 1400 = 30 mm",
          result: "Genislikte toplam 30 mm, yani iki yanda yaklasik 15 mm montaj payi bulunur.",
          note: "Bu pay kasayi zorlamadan yerlestirmek ve sızdırmazlık katmani için gereklidir.",
        },
        {
          title: "Yukseklikte toplam montaj payini bul",
          formula: "1535 - 1500 = 35 mm",
          result: "Yukseklikte toplam 35 mm pay vardir; bu degerin denizlik ve üst bitis detaylariyla birlikte okunmasi gerekir.",
          note: "Yalnız yan boşluk doğru diye üst ve alt detay doğru kabul edilmez.",
        },
        {
          title: "Mühendislik kararini bagla",
          result: "Olculer ilk bakista uygundur; ancak denizlik egimi, damlalik ve kasa eksen konumu cozulmeden bu boşluk tek basina performans garantisi vermez.",
          note: "Doğrama muhendisliginde sayi kadar su yonu ve birleşim katmani da belirleyicidir.",
        },
      ],
      checks: [
        "Boşluk dengesiz dagiliyorsa doğrama zorlanarak değil duvar ve bitis duzeltmesiyle çözülmelidir.",
        "Pencere aksinin duvar kesitindeki konumu isi ve yoğuşma davranisini etkiler.",
        "Dış dogramalarda denizlik ve damlalik olmadan yalnız mastige guvenilmemelidir.",
        "İç kapılar için aynı mantik bitmis döşeme ve fonksiyon testi ile yeniden okunmalidir.",
      ],
      engineeringComment: "Doğru montaj boşluğu, urunun performans beyanini sahada koruyan sessiz ama kritik karar noktasidir.",
    },
    tools: KAPI_PENCERE_TOOLS,
    equipmentAndMaterials: KAPI_PENCERE_EQUIPMENT,
    mistakes: [
      { wrong: "Doğrama secimini yalnız katalog ve fiyat uzerinden yapmak.", correct: "Mahal fonksiyonu, cephe maruziyeti ve kabuk detayi ile birlikte degerlendirmek." },
      { wrong: "Kasa cevresinde sifira yakin toleransla montaj yapmaya çalışmak.", correct: "Kontrollu montaj payi ve sızdırmazlık katmani için gerekli araligi korumak." },
      { wrong: "Pencere montajinda denizlik ve damlalik detayini ikinci plana atmak.", correct: "Suyun yonunu ana montaj paketi icinde cozumlemek." },
      { wrong: "İç kapıları bitmis döşeme gelmeden kesin kabul etmek.", correct: "Alt boşluk ve fonksiyon testini final zemin kosulunda yapmak." },
      { wrong: "Kopugu taşıyıcı ve sızdırmaz tek çözüm gibi kullanmak.", correct: "Ankraj, bant, mastik ve destek malzemelerini birlikte uygulamak." },
      { wrong: "Numune detay onayi olmadan cephe genelinde seri montaja gecmek.", correct: "Temsil kabiliyeti yüksek bir numune ile detay performansini sahada görmek." },
    ],
    designVsField: [
      "Tasarimda kapı ve pencere cogu zaman tip numaralari ve ebatlarla görünür; sahada ise her biri su, hava, isi, ses ve kullanım performansi tasiyan kritik bir birlesime donusur.",
      "Pahali bir profil sistemi bile yanlış birleşim detayinda performansini kaybeder; orta sinif bir sistem ise iyi detaya oturdugunda daha dengeli sonuc verebilir.",
      "Bu nedenle kapı pencere islerinde asil mühendislik, urunu duvarla doğru bulusturma becerisidir.",
    ],
    conclusion: [
      "Kapı ve pencere sistemleri, urun secimi kadar montaj toleransi, sızdırmazlık katmani, su yönetimi ve mahal fonksiyonu ile birlikte deger kazanan ince iş kalemleridir. Bu zincir doğru kuruldugunda hem kabuk performansi hem gunluk kullanım kalitesi yukselir.",
      "Bir inşaat mühendisi için doğru yaklasim, dogramayi sadece takilan bir urun değil, yapının en hassas birleşim sistemi olarak gormektir. Bu bakis teslim sonrasi su sizintisi, ayar problemi ve enerji kaybi riskini ciddi bicimde azaltir.",
    ],
    sources: [...INCE_KAPI_PENCERE_SOURCES, SOURCE_LEDGER.planliAlanlar, TS_EN_14351_1_SOURCE],
    keywords: ["kapı pencere", "doğrama montaji", "TS EN 14351-1", "TS 825", "montaj boşluğu"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere/pencere", "ince-isler/kapi-pencere/ic-kapi"],
  },
];
