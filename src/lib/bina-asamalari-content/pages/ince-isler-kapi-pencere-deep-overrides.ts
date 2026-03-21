import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_KAPI_PENCERE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_14351_1_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-1 Pencereler ve Kapilar - Mamul Standardi, Performans Karakteristikleri - Pencereler ve Dis Kapi Setleri",
  shortCode: "TS EN 14351-1",
  type: "standard",
  url: "https://intweb.tse.org.tr/",
  note: "Pencere ve dis kapi setlerinde temel performans karakteristikleri, hava-su gecirimsizligi ve urun beyanlari icin temel referanslardan biridir.",
};

const KAPI_PENCERE_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Dograma listesi, tip kesitleri ve mahal bitis paftasi", purpose: "Ic kapi, dis kapi ve pencere kararlarini tek cizelgede duvar ve doseme bitisleriyle eslestirmek." },
  { category: "Olcum", name: "Lazer nivo, diyagonal metre ve aciklik kontrol cizelgesi", purpose: "Kaba bosluklari ve montaj toleransini sahada standart hale getirmek." },
  { category: "Kontrol", name: "Hava-su sizdirmazlik ve fonksiyon checklisti", purpose: "Acilma kapanma kadar denizlik, mastik ve drenaj detaylarini da ayni kabul turuna dahil etmek." },
  { category: "Kayit", name: "Cephe ve mahal bazli dograma foyi", purpose: "Numune, revizyon ve teslim notlarini urun tipi bazinda izlemek." },
];

const KAPI_PENCERE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Urun", name: "PVC, aluminyum veya kompozit dograma setleri", purpose: "Mahal ihtiyacina gore isi, hava, su ve kullanim performansini saglamak.", phase: "Montaj" },
  { group: "Birlesim", name: "Ankraj, takoz, bant, mastik ve kontrolu dolgu malzemeleri", purpose: "Dograma ile duvar arasindaki kritik performans araligini yonetmek.", phase: "Birlesim" },
  { group: "Tamamlayici", name: "Denizlik, damlalik, esik ve pervaz detaylari", purpose: "Su yonetimi ve bitmis mekan kalitesini birlestirmek.", phase: "Bitis" },
  { group: "Koruma", name: "Kose koruma, kanat sabitleme ve temizlik ekipmani", purpose: "Montaj sonrasi diger islerin dograma yuzeyine zarar vermesini onlemek.", phase: "Teslim oncesi" },
];

export const inceIslerKapiPencereDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/kapi-pencere",
    kind: "topic",
    quote: "Kapi ve pencere sistemleri, bosluk kapatan urunler degil; kabuk performansi ile gunluk kullanim kalitesini ayni anda tasiyan birlesim sistemleridir.",
    tip: "Dogramayi yalniz urun secimine indirgemek, en kritik alan olan duvar-bosluk-birlesim hattini gozden kacirmak demektir.",
    intro: [
      "Kapi ve pencere sistemleri, yapinin kullanici ile dis cevre arasindaki en hassas temas katmanlarindan biridir. Pencere gunesi, yagmuru, ruzgari ve isi kontrol ederken; kapilar gecis, guvenlik, mahremiyet ve bazen yangin veya akustik gereksinimini ayni anda yonetir. Bu nedenle dograma isleri, santiyede gorundugunden cok daha fazla performans karari icerir.",
      "Sahada sik yapilan hata, dograma kalitesini sadece profil markasi, cam kalinligi veya kapi kanadi ile okumaktir. Oysa pek cok sorun urunden degil, urunun duvarla bulustugu birlesim hattindan dogar. Yetersiz montaj boslugu, yanlis ankraj, eksik bant-mastik, denizlikte suyun geri itilmesi veya bitmis doseme kotunun dikkate alinmamasi iyi urunu bile zayif sonuca donusturebilir.",
      "Bir insaat muhendisi icin kapi pencere konusu yalnizca mimari detay veya marangozluk kalemi degildir. Cephede isi ve su davranisi, ic mekanda fonksiyon ve akustik, detayda ise tolerans ve bakim kabiliyeti bir aradadir. Bu nedenle bu baslik hem kabuk muhendisligini hem de bitmis mekan kalitesini birlestiren ozel bir koordinasyon alanidir.",
      "Bu yazida kapi ve pencere islerini; urun secimi, montaj toleransi, birlesim detaylari, ic-dis farklari, saha kabul turu ve sayisal bir bosluk ornegi ile birlikte daha kapsamli bir blog standardinda ele aliyoruz.",
    ],
    theory: [
      "Pencere ve dis kapi tarafinda performansin cekirdegi; hava sizdirmazligi, su gecirimsizligi, isi kaybi kontrolu ve uzun vadeli acilma kapanma davranisidir. Bu performanslar urun beyanlariyla tarif edilebilir; ancak sahada gercege donusmesi, urunun dogru aksa, dogru boslukla ve dogru sizdirmazlik katmaniyla yerlesmesine baglidir. Bu nedenle pencere montaji, cephenin en kritik zayif halka noktalarindan biridir.",
      "Ic kapilarda ise fiziksel dis ortam etkisinden cok kullanim konforu, geometri, donanim kalitesi ve bazen akustik veya yangin davranisi one cikar. Ayni binadaki tum kapilari ayni mantikla cozmeye calismak hatalidir; ofis, islak hacim, servis odasi, yangin kacis kapisi ve konut odasi farkli gereksinimlere sahiptir. Yani kapi listesi bir urun listesi degil, fonksiyon matrisi olarak okunmalidir.",
      "Duvar-birlesim hatti iki tarafta da en kritik bolgedir. Pencerede suyun iceri girmesi, kisin yogusma riski veya hava kacagi genelde bu cevrede ortaya cikar. Kapi tarafinda da ayni hat; pervaz-aciklik uyumsuzlugu, kasa sehimleri, kilit karsiligi problemi ve bitmis doseme hatasiyla gunluk arizaya donusebilir. Dolayisiyla dograma muhendisliginin ana konusu urunun kendisinden cok birlesimin kendisidir.",
      "Bir baska teori basligi da toleranstir. Duvar boslugu, siva kalinligi, mantolama kalinligi, denizlik yuksekligi, dograma kasa olculeri ve montaj bandinin gerektirdigi aralik birlikte dusunulmelidir. Sahadaki milimetre farklari burada zincirleme etki yaratir. Bu yuzden kapi pencere islerinde 'yerinde uydururuz' yaklasimi genellikle hem estetik hem performans kaybina yol acar.",
      "TS EN 14351-1 cercevesi urunun performans karakteristiklerini tanimlarken, TS 825 ve enerji performansi mantigi dogramayi bina kabugunun parcasi olarak gorur. Iyi santiyede bu iki bakis birlestirilir: urun dogru secilir, sonra birlesim detayi bu performansi koruyacak sekilde uygulanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun performansi ve sinif secimi",
        limitOrRequirement: "Pencere ve dis kapi setleri, mahalin maruziyetine uygun performans siniflariyla secilmelidir",
        reference: "TS EN 14351-1",
        note: "Cephedeki aciklik, sadece goruntu karari degil performans karari uretir.",
      },
      {
        parameter: "Kabuk uyumu",
        limitOrRequirement: "Dograma detaylari isi kaybi, hava kacaklari ve yogusma riski acisindan bina kabugu ile birlikte cozulmelidir",
        reference: "TS 825 + Binalarda Enerji Performansi Yonetmeligi",
        note: "Pencereyi duvardan ayri bir urun gibi dusunmek isi koprusu riskini buyutur.",
      },
      {
        parameter: "Montaj boslugu ve ankraj",
        limitOrRequirement: "Kasa cevresinde kontrollu tolerans birakilmali, mekanik sabitleme ve sizdirmazlik katmanlari birlikte uygulanmalidir",
        reference: "Uretici detaylari + saha kalite plani",
        note: "Yalniz kopuk veya mastik ile performans beklemek dogru degildir.",
      },
      {
        parameter: "Su yonetimi",
        limitOrRequirement: "Denizlik, damlalik, dis derz ve su tahliye detaylari aktif olarak cozulmelidir",
        reference: "Cephe ve dograma detay paftasi",
        note: "Yagmur suyu, profil kadar detaydaki egim ve yonle de yonetilir.",
      },
      {
        parameter: "Ic mekan fonksiyonlari",
        limitOrRequirement: "Ic kapilar mahal kullanimina gore fonksiyon, donanim ve ozel performans gereksinimi ile secilmelidir",
        reference: "TS EN 14351-2 + mahal listesi",
        note: "Her kapi ayni kullanima hizmet etmedigi icin ayni detayla cozulmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Kapi ve pencere listesini sadece ebat tablosu olarak degil, mahal fonksiyonu ve cephe maruziyeti matrisi olarak dondur.",
      "Kaba bosluklari siva, yalitim, denizlik, esik ve bitmis doseme kalinliklariyla birlikte yeniden olc; urunu bosluga degil, bitmis detaya gore sec.",
      "Dograma montajinda ankraj, takoz, bant, mastik ve su tahliye detaylarini ayni paket olarak uygula; birini sonradan telafi etmeye calisma.",
      "Pencere ve dis kapilarda denizlik, damlalik ve dis derz su yonunu maket veya numune detayla teyit et.",
      "Ic kapilarda mentese, kilit, pervaz ve alt bosluk ayarlarini bitmis zemin geldikten sonra gercek kullanimla test et.",
      "Teslim oncesi cephe bazli ve mahal bazli iki ayri kabul turu yap; birinde su-hava davranisini, digerinde fonksiyon ve gorunur kaliteyi oku.",
    ],
    criticalChecks: [
      "Kaba bosluk ile kasa olculeri arasinda gerekli montaj toleransi var mi?",
      "Pencere ve dis kapilarda denizlik, damlalik ve dis derz detaylari suyu gercekten disari yonlendiriyor mu?",
      "Dograma kasasi sadece kopukle mi tasiniyor, yoksa mekanik olarak da sabit mi?",
      "Ic kapilarda bitmis doseme kotu ve supurgelik iliskisi test edildi mi?",
      "Cephede isi koprusu ve yogusma riski yaratacak bosluk veya kesinti var mi?",
      "Numune dograma detayi gercekte sahadaki tum tipleri temsil ediyor mu?",
    ],
    numericalExample: {
      title: "Pencere montaj boslugu ve denizlik karari icin sayisal yorum",
      inputs: [
        { label: "Pencere kasa olcusu", value: "1400 x 1500 mm", note: "Ornek dis pencere" },
        { label: "Olculen kaba bosluk", value: "1430 x 1535 mm", note: "Siva oncesi aciklik" },
        { label: "Planlanan ic-dis bitis toplam payi", value: "10 mm / yan", note: "Siva ve bitis toleransi yorumu" },
        { label: "Amac", value: "Dengeli montaj ve sizdirmazlik payi saglamak", note: "Dogru birlesim kararini okumak" },
      ],
      assumptions: [
        "Bosluk olcusu sahada dogrulanmistir ve duvar aks sapmasi buyuk degildir.",
        "Dograma cevresinde bant ve mastik sistemi birlikte kullanilacaktir.",
        "Denizlik ve damlalik detayi pencere montaji ile ayni anda cozulmektedir.",
      ],
      steps: [
        {
          title: "Genislikte toplam montaj payini bul",
          formula: "1430 - 1400 = 30 mm",
          result: "Genislikte toplam 30 mm, yani iki yanda yaklasik 15 mm montaj payi bulunur.",
          note: "Bu pay kasayi zorlamadan yerlestirmek ve sizdirmazlik katmani icin gereklidir.",
        },
        {
          title: "Yukseklikte toplam montaj payini bul",
          formula: "1535 - 1500 = 35 mm",
          result: "Yukseklikte toplam 35 mm pay vardir; bu degerin denizlik ve ust bitis detaylariyla birlikte okunmasi gerekir.",
          note: "Yalniz yan bosluk dogru diye ust ve alt detay dogru kabul edilmez.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Olculer ilk bakista uygundur; ancak denizlik egimi, damlalik ve kasa eksen konumu cozulmeden bu bosluk tek basina performans garantisi vermez.",
          note: "Dograma muhendisliginde sayi kadar su yonu ve birlesim katmani da belirleyicidir.",
        },
      ],
      checks: [
        "Bosluk dengesiz dagiliyorsa dograma zorlanarak degil duvar ve bitis duzeltmesiyle cozulmelidir.",
        "Pencere aksinin duvar kesitindeki konumu isi ve yogusma davranisini etkiler.",
        "Dis dogramalarda denizlik ve damlalik olmadan yalniz mastige guvenilmemelidir.",
        "Ic kapilar icin ayni mantik bitmis doseme ve fonksiyon testi ile yeniden okunmalidir.",
      ],
      engineeringComment: "Dogru montaj boslugu, urunun performans beyanini sahada koruyan sessiz ama kritik karar noktasidir.",
    },
    tools: KAPI_PENCERE_TOOLS,
    equipmentAndMaterials: KAPI_PENCERE_EQUIPMENT,
    mistakes: [
      { wrong: "Dograma secimini yalniz katalog ve fiyat uzerinden yapmak.", correct: "Mahal fonksiyonu, cephe maruziyeti ve kabuk detayi ile birlikte degerlendirmek." },
      { wrong: "Kasa cevresinde sifira yakin toleransla montaj yapmaya calismak.", correct: "Kontrollu montaj payi ve sizdirmazlik katmani icin gerekli araligi korumak." },
      { wrong: "Pencere montajinda denizlik ve damlalik detayini ikinci plana atmak.", correct: "Suyun yonunu ana montaj paketi icinde cozumlemek." },
      { wrong: "Ic kapilari bitmis doseme gelmeden kesin kabul etmek.", correct: "Alt bosluk ve fonksiyon testini final zemin kosulunda yapmak." },
      { wrong: "Kopugu tasiyici ve sizdirmaz tek cozum gibi kullanmak.", correct: "Ankraj, bant, mastik ve destek malzemelerini birlikte uygulamak." },
      { wrong: "Numune detay onayi olmadan cephe genelinde seri montaja gecmek.", correct: "Temsil kabiliyeti yuksek bir numune ile detay performansini sahada gormek." },
    ],
    designVsField: [
      "Tasarimda kapi ve pencere cogu zaman tip numaralari ve ebatlarla gorunur; sahada ise her biri su, hava, isi, ses ve kullanim performansi tasiyan kritik bir birlesime donusur.",
      "Pahali bir profil sistemi bile yanlis birlesim detayinda performansini kaybeder; orta sinif bir sistem ise iyi detaya oturdugunda daha dengeli sonuc verebilir.",
      "Bu nedenle kapi pencere islerinde asil muhendislik, urunu duvarla dogru bulusturma becerisidir.",
    ],
    conclusion: [
      "Kapi ve pencere sistemleri, urun secimi kadar montaj toleransi, sizdirmazlik katmani, su yonetimi ve mahal fonksiyonu ile birlikte deger kazanan ince is kalemleridir. Bu zincir dogru kuruldugunda hem kabuk performansi hem gunluk kullanim kalitesi yukselir.",
      "Bir insaat muhendisi icin dogru yaklasim, dogramayi sadece takilan bir urun degil, yapinin en hassas birlesim sistemi olarak gormektir. Bu bakis teslim sonrasi su sizintisi, ayar problemi ve enerji kaybi riskini ciddi bicimde azaltir.",
    ],
    sources: [...INCE_KAPI_PENCERE_SOURCES, SOURCE_LEDGER.planliAlanlar, TS_EN_14351_1_SOURCE],
    keywords: ["kapi pencere", "dograma montaji", "TS EN 14351-1", "TS 825", "montaj boslugu"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere/pencere", "ince-isler/kapi-pencere/ic-kapi"],
  },
];
