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
  { category: "Detay", name: "Doğrama listesi, tip kesitleri ve mahal bitis paftasi", purpose: "İç kapı, dış kapı ve pencere kararlarini tek cizelgede duvar ve doseme bitisleriyle eslestirmek." },
  { category: "Ölçüm", name: "Lazer nivo, diyagonal metre ve aciklik kontrol cizelgesi", purpose: "Kaba bosluklari ve montaj toleransini sahada standart hale getirmek." },
  { category: "Kontrol", name: "Hava-su sızdırmazlık ve fonksiyon checklisti", purpose: "Acilma kapanma kadar denizlik, mastik ve drenaj detaylarini da aynı kabul turuna dahil etmek." },
  { category: "Kayıt", name: "Cephe ve mahal bazli doğrama foyi", purpose: "Numune, revizyon ve teslim notlarini urun tipi bazinda izlemek." },
];

const KAPI_PENCERE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Urun", name: "PVC, aluminyum veya kompozit doğrama setleri", purpose: "Mahal ihtiyacina göre isi, hava, su ve kullanım performansini saglamak.", phase: "Montaj" },
  { group: "Birlesim", name: "Ankraj, takoz, bant, mastik ve kontrolu dolgu malzemeleri", purpose: "Doğrama ile duvar arasindaki kritik performans araligini yonetmek.", phase: "Birlesim" },
  { group: "Tamamlayici", name: "Denizlik, damlalik, esik ve pervaz detaylari", purpose: "Su yonetimi ve bitmis mekan kalitesini birlestirmek.", phase: "Bitis" },
  { group: "Koruma", name: "Köşe koruma, kanat sabitleme ve temizlik ekipmani", purpose: "Montaj sonrasi diger islerin doğrama yuzeyine zarar vermesini onlemek.", phase: "Teslim öncesi" },
];

export const inceIslerKapiPencereDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/kapi-pencere",
    kind: "topic",
    quote: "Kapı ve pencere sistemleri, bosluk kapatan urunler degil; kabuk performansi ile gunluk kullanım kalitesini aynı anda tasiyan birlesim sistemleridir.",
    tip: "Dogramayi yalnız urun secimine indirgemek, en kritik alan olan duvar-bosluk-birlesim hattini gözden kacirmak demektir.",
    intro: [
      "Kapı ve pencere sistemleri, yapinin kullanıcı ile dış çevre arasindaki en hassas temas katmanlarindan biridir. Pencere gunesi, yagmuru, ruzgari ve isi kontrol ederken; kapılar geçiş, güvenlik, mahremiyet ve bazen yangin veya akustik gereksinimini aynı anda yonetir. Bu nedenle doğrama isleri, santiyede gorundugunden çok daha fazla performans karari icerir.",
      "Sahada sık yapilan hata, doğrama kalitesini sadece profil markasi, cam kalinligi veya kapı kanadi ile okumaktir. Oysa pek çok sorun urunden degil, urunun duvarla bulustugu birlesim hattindan dogar. Yetersiz montaj boslugu, yanlış ankraj, eksik bant-mastik, denizlikte suyun geri itilmesi veya bitmis doseme kotunun dikkate alinmamasi iyi urunu bile zayif sonuca donusturebilir.",
      "Bir insaat muhendisi için kapı pencere konusu yalnizca mimari detay veya marangozluk kalemi degildir. Cephede isi ve su davranisi, iç mekanda fonksiyon ve akustik, detayda ise tolerans ve bakım kabiliyeti bir aradadir. Bu nedenle bu baslik hem kabuk muhendisligini hem de bitmis mekan kalitesini birlestiren ozel bir koordinasyon alanidir.",
      "Bu yazida kapı ve pencere islerini; urun secimi, montaj toleransi, birlesim detaylari, iç-dış farklari, saha kabul turu ve sayisal bir bosluk ornegi ile birlikte daha kapsamli bir blog standardinda ele aliyoruz.",
    ],
    theory: [
      "Pencere ve dış kapı tarafinda performansin cekirdegi; hava sizdirmazligi, su gecirimsizligi, isi kaybi kontrolu ve uzun vadeli acilma kapanma davranisidir. Bu performanslar urun beyanlariyla tarif edilebilir; ancak sahada gercege donusmesi, urunun doğru aksa, doğru boslukla ve doğru sızdırmazlık katmaniyla yerlesmesine baglidir. Bu nedenle pencere montaji, cephenin en kritik zayif halka noktalarindan biridir.",
      "İç kapilarda ise fiziksel dış ortam etkisinden çok kullanım konforu, geometri, donanim kalitesi ve bazen akustik veya yangin davranisi one cikar. Aynı binadaki tüm kapilari aynı mantikla cozmeye çalışmak hatalidir; ofis, islak hacim, servis odasi, yangin kacis kapisi ve konut odasi farkli gereksinimlere sahiptir. Yani kapı listesi bir urun listesi degil, fonksiyon matrisi olarak okunmalidir.",
      "Duvar-birlesim hatti iki tarafta da en kritik bolgedir. Pencerede suyun iceri girmesi, kisin yoğuşma riski veya hava kacagi genelde bu cevrede ortaya cikar. Kapı tarafinda da aynı hat; pervaz-aciklik uyumsuzlugu, kasa sehimleri, kilit karsiligi problemi ve bitmis doseme hatasiyla gunluk arizaya donusebilir. Dolayisiyla doğrama muhendisliginin ana konusu urunun kendisinden çok birlesimin kendisidir.",
      "Bir baska teori basligi da toleranstir. Duvar boslugu, siva kalinligi, mantolama kalinligi, denizlik yuksekligi, doğrama kasa olculeri ve montaj bandinin gerektirdigi aralik birlikte dusunulmelidir. Sahadaki milimetre farklari burada zincirleme etki yaratir. Bu yuzden kapı pencere islerinde 'yerinde uydururuz' yaklasimi genellikle hem estetik hem performans kaybina yol acar.",
      "TS EN 14351-1 cercevesi urunun performans karakteristiklerini tanimlarken, TS 825 ve enerji performansi mantigi dogramayi bina kabugunun parçası olarak gorur. Iyi santiyede bu iki bakis birlestirilir: urun doğru secilir, sonra birlesim detayi bu performansi koruyacak sekilde uygulanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun performansi ve sinif secimi",
        limitOrRequirement: "Pencere ve dış kapı setleri, mahalin maruziyetine uygun performans siniflariyla secilmelidir",
        reference: "TS EN 14351-1",
        note: "Cephedeki aciklik, sadece goruntu karari degil performans karari uretir.",
      },
      {
        parameter: "Kabuk uyumu",
        limitOrRequirement: "Doğrama detaylari isi kaybi, hava kacaklari ve yoğuşma riski acisindan bina kabugu ile birlikte cozulmelidir",
        reference: "TS 825 + Binalarda Enerji Performansi Yonetmeligi",
        note: "Pencereyi duvardan ayri bir urun gibi dusunmek isi koprusu riskini buyutur.",
      },
      {
        parameter: "Montaj boslugu ve ankraj",
        limitOrRequirement: "Kasa cevresinde kontrollu tolerans birakilmali, mekanik sabitleme ve sızdırmazlık katmanlari birlikte uygulanmalidir",
        reference: "Uretici detaylari + saha kalite plani",
        note: "Yalnız kopuk veya mastik ile performans beklemek doğru degildir.",
      },
      {
        parameter: "Su yonetimi",
        limitOrRequirement: "Denizlik, damlalik, dış derz ve su tahliye detaylari aktif olarak cozulmelidir",
        reference: "Cephe ve doğrama detay paftasi",
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
      "Kapı ve pencere listesini sadece ebat tablosu olarak degil, mahal fonksiyonu ve cephe maruziyeti matrisi olarak dondur.",
      "Kaba bosluklari siva, yalitim, denizlik, esik ve bitmis doseme kalinliklariyla birlikte yeniden olc; urunu bosluga degil, bitmis detaya göre sec.",
      "Doğrama montajinda ankraj, takoz, bant, mastik ve su tahliye detaylarini aynı paket olarak uygula; birini sonradan telafi etmeye çalışma.",
      "Pencere ve dış kapilarda denizlik, damlalik ve dış derz su yonunu maket veya numune detayla teyit et.",
      "İç kapilarda mentese, kilit, pervaz ve alt bosluk ayarlarini bitmis zemin geldikten sonra gercek kullanimla test et.",
      "Teslim öncesi cephe bazli ve mahal bazli iki ayri kabul turu yap; birinde su-hava davranisini, digerinde fonksiyon ve görünür kaliteyi oku.",
    ],
    criticalChecks: [
      "Kaba bosluk ile kasa olculeri arasinda gerekli montaj toleransi var mi?",
      "Pencere ve dış kapilarda denizlik, damlalik ve dış derz detaylari suyu gercekten disari yonlendiriyor mu?",
      "Doğrama kasasi sadece kopukle mi tasiniyor, yoksa mekanik olarak da sabit mi?",
      "İç kapilarda bitmis doseme kötü ve süpürgelik iliskisi test edildi mi?",
      "Cephede isi koprusu ve yoğuşma riski yaratacak bosluk veya kesinti var mi?",
      "Numune doğrama detayi gercekte sahadaki tüm tipleri temsil ediyor mu?",
    ],
    numericalExample: {
      title: "Pencere montaj boslugu ve denizlik karari için sayisal yorum",
      inputs: [
        { label: "Pencere kasa olcusu", value: "1400 x 1500 mm", note: "Ornek dış pencere" },
        { label: "Olculen kaba bosluk", value: "1430 x 1535 mm", note: "Siva öncesi aciklik" },
        { label: "Planlanan iç-dış bitis toplam payi", value: "10 mm / yan", note: "Siva ve bitis toleransi yorumu" },
        { label: "Amac", value: "Dengeli montaj ve sızdırmazlık payi saglamak", note: "Doğru birlesim kararini okumak" },
      ],
      assumptions: [
        "Bosluk olcusu sahada dogrulanmistir ve duvar aks sapmasi buyuk degildir.",
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
          note: "Yalnız yan bosluk doğru diye üst ve alt detay doğru kabul edilmez.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Olculer ilk bakista uygundur; ancak denizlik egimi, damlalik ve kasa eksen konumu cozulmeden bu bosluk tek basina performans garantisi vermez.",
          note: "Doğrama muhendisliginde sayi kadar su yonu ve birlesim katmani da belirleyicidir.",
        },
      ],
      checks: [
        "Bosluk dengesiz dagiliyorsa doğrama zorlanarak degil duvar ve bitis duzeltmesiyle cozulmelidir.",
        "Pencere aksinin duvar kesitindeki konumu isi ve yoğuşma davranisini etkiler.",
        "Dış dogramalarda denizlik ve damlalik olmadan yalnız mastige guvenilmemelidir.",
        "İç kapılar için aynı mantik bitmis doseme ve fonksiyon testi ile yeniden okunmalidir.",
      ],
      engineeringComment: "Doğru montaj boslugu, urunun performans beyanini sahada koruyan sessiz ama kritik karar noktasidir.",
    },
    tools: KAPI_PENCERE_TOOLS,
    equipmentAndMaterials: KAPI_PENCERE_EQUIPMENT,
    mistakes: [
      { wrong: "Doğrama secimini yalnız katalog ve fiyat uzerinden yapmak.", correct: "Mahal fonksiyonu, cephe maruziyeti ve kabuk detayi ile birlikte degerlendirmek." },
      { wrong: "Kasa cevresinde sifira yakin toleransla montaj yapmaya çalışmak.", correct: "Kontrollu montaj payi ve sızdırmazlık katmani için gerekli araligi korumak." },
      { wrong: "Pencere montajinda denizlik ve damlalik detayini ikinci plana atmak.", correct: "Suyun yonunu ana montaj paketi icinde cozumlemek." },
      { wrong: "İç kapilari bitmis doseme gelmeden kesin kabul etmek.", correct: "Alt bosluk ve fonksiyon testini final zemin kosulunda yapmak." },
      { wrong: "Kopugu taşıyıcı ve sizdirmaz tek cozum gibi kullanmak.", correct: "Ankraj, bant, mastik ve destek malzemelerini birlikte uygulamak." },
      { wrong: "Numune detay onayi olmadan cephe genelinde seri montaja gecmek.", correct: "Temsil kabiliyeti yuksek bir numune ile detay performansini sahada gormek." },
    ],
    designVsField: [
      "Tasarimda kapı ve pencere cogu zaman tip numaralari ve ebatlarla görünür; sahada ise her biri su, hava, isi, ses ve kullanım performansi tasiyan kritik bir birlesime donusur.",
      "Pahali bir profil sistemi bile yanlış birlesim detayinda performansini kaybeder; orta sinif bir sistem ise iyi detaya oturdugunda daha dengeli sonuc verebilir.",
      "Bu nedenle kapı pencere islerinde asil muhendislik, urunu duvarla doğru bulusturma becerisidir.",
    ],
    conclusion: [
      "Kapı ve pencere sistemleri, urun secimi kadar montaj toleransi, sızdırmazlık katmani, su yonetimi ve mahal fonksiyonu ile birlikte deger kazanan ince iş kalemleridir. Bu zincir doğru kuruldugunda hem kabuk performansi hem gunluk kullanım kalitesi yukselir.",
      "Bir insaat muhendisi için doğru yaklasim, dogramayi sadece takilan bir urun degil, yapinin en hassas birlesim sistemi olarak gormektir. Bu bakis teslim sonrasi su sizintisi, ayar problemi ve enerji kaybi riskini ciddi bicimde azaltir.",
    ],
    sources: [...INCE_KAPI_PENCERE_SOURCES, SOURCE_LEDGER.planliAlanlar, TS_EN_14351_1_SOURCE],
    keywords: ["kapı pencere", "doğrama montaji", "TS EN 14351-1", "TS 825", "montaj boslugu"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere/pencere", "ince-isler/kapi-pencere/ic-kapi"],
  },
];
