import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const CONCRETE_TOOLS: BinaGuideTool[] = [
  { category: "Planlama", name: "Dokum senaryosu, sevkiyat cizelgesi ve numune matrisi", purpose: "Santral temposu ile saha kapasitesini ayni akista birlestirmek." },
  { category: "Kontrol", name: "Slump, sicaklik ve sevkiyat kayit formu", purpose: "Taze beton kabulunu olculu ve izlenebilir hale getirmek." },
  { category: "Saha", name: "Vibrator, pompa ve kur checklisti", purpose: "Yerlestirme ve erken yas korumasini tesadufe birakmamak." },
  { category: "Kayit", name: "Eleman bazli laboratuvar ve dokum arsivi", purpose: "Dayanim sonucunu hangi imalatla eslestirmek gerektigini net tutmak." },
];

const CONCRETE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kabul", name: "Slump konisi, termometre, numune kalibi ve etiket seti", purpose: "Mikserden inen betonu teknik olarak kabul etmek.", phase: "Dokum oncesi" },
  { group: "Yerlestirme", name: "Pompa, hortum, vibrator ve yedek enerji", purpose: "Kesintisiz dokum ve bosluksuz sikistirma saglamak.", phase: "Dokum" },
  { group: "Koruma", name: "Kur ortusu, curing malzemesi ve iklim koruma ekipmani", purpose: "Erken yas su kaybi ve isi sokunu azaltmak.", phase: "Dokum sonrasi" },
  { group: "Kayit", name: "Sevkiyat formlari ve laboratuvar takip dosyasi", purpose: "Dayanim raporlarini eleman bazli okumak.", phase: "Surekli" },
];

export const kabaInsaatConcreteBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/beton-isleri",
    kind: "topic",
    quote: "Beton isleri, mikserden gelen malzemeyi dokmek degil; kabul, yerlesim, sikistirma ve kur zincirini koparmadan yonetmektir.",
    tip: "Dokum gununu yalniz hiz uzerinden okumak, yapisal kaliteyi daha beton taze iken kaybetmeye yol acar.",
    intro: [
      "Beton isleri sahada en sik gorulen fakat en kolay basitlestirilen imalatlardan biridir. Beton gelince odak cogu zaman pompaya, mikser sayisina ve ilerleme hizina kayar. Oysa gercek kalite; sevkiyat kabulunde, yerlesim sirasinda ve dokum biter bitmez baslatilan koruma surecinde olusur.",
      "Bir santiyede beton sinifi dogru secilmis olsa bile sevkiyat temposu zayifsa, vibrator yetersizse veya kur plani yoksa eleman kalitesi beklenen seviyeye ulasmaz. Bu nedenle beton isi malzeme kadar organizasyon kalitesidir.",
      "Bir insaat muhendisi icin beton dokumu; hangi elemanin hangi sirayla beslenecegini, hangi sevkiyatin hangi numune ile eslesecegini, soguk derz riskinin nerde oldugunu ve erken yas korumasinin nasil yapilacagini ayni anda yonetmektir.",
      "Bu rehberde beton islerini teknik temel, standart ekseni, sayisal ornek, saha araclari ve kritik hatalarla birlikte uzun-form bir saha yazisi gibi ele aliyoruz.",
    ],
    theory: [
      "Betonun teorik performansi ile yerinde uygulama performansi farklidir. TS EN 206 tarafindan tarif edilen sinif ve kivam, saha uygulamasinda dogru kabul edilmez ve dogru yerlestirilmezse beklenen dayanim ve dayaniklilik duzeyi sahada korunamaz.",
      "Yerlesim ve vibrasyon zinciri beton islerinin merkezidir. Yuksekten serbest dusurulen, bekletilen veya yetersiz sikistirilan beton peteklenme, segregasyon ve soguk derz riski uretir. Bu nedenle dokum hizi ile vibrator kapasitesi dengeli olmali; pompa hortumu hareketi plansiz ilerlememelidir.",
      "Erken yas korumasi da ayni derecede kritiktir. Sicaklik, ruzgar ve nem kaybi betonun ilk saatlerdeki davranisini belirler. Kur, dokum gununun ertesi gun isi degil; dokumun ayrilmaz parcasi olarak okunmalidir.",
      "Son olarak beton isleri bir kayit disiplinidir. Hangi mikserin hangi elemana gittigi, hangi numunenin hangi dokume ait oldugu ve hangi alanda ne zaman kur baslatildigi bilinmiyorsa beton teknik olarak eksik yonetilmis demektir.",
    ],
    ruleTable: [
      {
        parameter: "Taze beton kabul zinciri",
        limitOrRequirement: "Sinif, kivam, sevkiyat suresi ve saha kabul kosullari siparisle uyumlu olmalidir",
        reference: "TS EN 206",
        note: "Irsaliye ile fiili saha davranisi birlikte okunmalidir.",
      },
      {
        parameter: "Yerlestirme ve sikistirma",
        limitOrRequirement: "Beton kontrollu dokulmeli ve bosluksuz yerlesimi saglayacak vibrasyon disiplini korunmalidir",
        reference: "TS EN 13670",
        note: "Hiz tek basina kalite gostergesi degildir.",
      },
      {
        parameter: "Numune ve izlenebilirlik",
        limitOrRequirement: "Numune alma ve raporlama eleman bazli kayit duzeniyle yurutulmelidir",
        reference: "Taze Beton Numune Tebligi",
        note: "Sonradan gelen raporun hangi imalata ait oldugu net olmalidir.",
      },
      {
        parameter: "Kur ve koruma",
        limitOrRequirement: "Kur, dokum biter bitmez hava kosuluna uygun yontemle baslatilmalidir",
        reference: "TS EN 13670",
        note: "Erken yas korumasi ertelenemez.",
      },
      {
        parameter: "Yogun dugumler",
        limitOrRequirement: "Sik donatili ve dar kesitli bolgeler icin ayri yerlesim stratejisi belirlenmelidir",
        reference: "Saha kalite plani",
        note: "Standart refleks her elemanda ayni sonucu vermez.",
      },
    ],
    designOrApplicationSteps: [
      "Dokumden once eleman sirasi, hava kosulu ve sevkiyat temposunu ayni plana bagla.",
      "Kalip, donati, rezervasyon ve vibrator erisimi icin son on kabul turunu bitir.",
      "Her mikseri slump ve sevkiyat kaydiyla kabul et; eleman eslestirmesini ayni anda yap.",
      "Pompa ve vibrator rotasini soguk derz ve segregasyon riskine gore yonet.",
      "Yogun dugumlerde dokum hizini gerekirse dusurerek beton akisini gozle.",
      "Dokum biter bitmez kur ve koruma zincirini devreye al.",
    ],
    criticalChecks: [
      "Sevkiyat ritmi saha kapasitesiyle uyumlu mu?",
      "Her mikser icin slump, sicaklik ve eleman kaydi tutuluyor mu?",
      "Sik donatili bolgelerde betonun ilerleyisini zorlayan risk var mi?",
      "Soguk derz olusabilecek bekleme pencereleri tanimli mi?",
      "Kur malzemesi dokumden once hazir miydi?",
      "Numune ve saha arsivi tek dosyada eslestirildi mi?",
    ],
    numericalExample: {
      title: "96 m3 dokum icin sevkiyat ritmi yorumu",
      inputs: [
        { label: "Toplam hacim", value: "96 m3", note: "Perde ve doseme karmasi tek dokum" },
        { label: "Mikser kapasitesi", value: "8 m3", note: "Standart sefer varsayimi" },
        { label: "Tahmini sefer sayisi", value: "12 sefer", note: "Yedekli plan gerekir" },
        { label: "Hedef", value: "Kesintisiz ve kontrollu akista soguk derz riskini azaltmak", note: "Saha organizasyon hedefi" },
      ],
      assumptions: [
        "Pompa ve vibrator ekipleri dokum boyunca aktif ve yedekli calisacaktir.",
        "Numune alma sureci sevkiyati gereksiz bekletmeyecektir.",
        "Dokum alani icin onceden rota plani olusturulmustur.",
      ],
      steps: [
        {
          title: "Sefer sayisini hesapla",
          formula: "96 / 8 = 12",
          result: "Dokumun tamamlanmasi icin yaklasik 12 mikser seferi gerekir.",
          note: "Bu yalniz miktar bilgisi degil, saha ritminin baslangic verisidir.",
        },
        {
          title: "Ritmi yorumla",
          result: "Seferler arasinda uzun bosluk olusursa soguk derz ve vibrator temposu bozulur.",
          note: "Mikser adedi kadar aralik suresi de kalite verisidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Dokum plani, mikser sayisindan cok saha ekiplerinin bu akisi kaliteli tasiyip tasiyamayacagina gore kurulmalidir.",
          note: "Hizli gelen beton kontrolsuz yerlesirse avantaj degil risktir.",
        },
      ],
      checks: [
        "Sevkiyat araligi saha kapasitesini asmamalidir.",
        "Yedek vibrator ve enerji ekipmani olmadan buyuk dokume girilmemelidir.",
        "Numune kaydi ile dokum alani birbirinden kopuk tutulmamalidir.",
        "Kur sistemi dokum gununun ayrilmaz parcasi olmalidir.",
      ],
      engineeringComment: "Beton islerinde kalite, mikserin gelmesiyle degil her sevkiyatin kontrollu bicimde yapisal elemana donusmesiyle olusur.",
    },
    tools: CONCRETE_TOOLS,
    equipmentAndMaterials: CONCRETE_EQUIPMENT,
    mistakes: [
      { wrong: "Beton sinifi dogruysa dokum gunu detaylarini ikincil gormek.", correct: "Kabul, yerlesim, numune ve kur zincirini ayni teknik butun olarak yonetmek." },
      { wrong: "Yedeksiz ekiple buyuk dokume girmek.", correct: "Ekipman ve personel yedegini hazir bulundurmak." },
      { wrong: "Numune zincirini laboratuvarin isi sanmak.", correct: "Eleman ve sevkiyat ile birlikte izlenebilir hale getirmek." },
      { wrong: "Yogun dugumlerde standart dokum refleksiyle devam etmek.", correct: "Bu bolgeler icin ozel yerlesim stratejisi kurmak." },
      { wrong: "Kur uygulamasini geciktirmek.", correct: "Dokum biter bitmez korumayi baslatmak." },
      { wrong: "Mikser beklemesinde eleman sirasini plansiz degistirmek.", correct: "Soguk derz riskine gore kontrollu rota guncellemek." },
    ],
    designVsField: [
      "Projede beton sinifi ve kesit hesabi gorulur; sahada ise ayni karar sevkiyat, vibrator, numune ve kur disipliniyle gercege donusur.",
      "Iyi beton isi dayanim kadar izlenebilirlik ve tekrar edilebilir saha davranisi da uretir.",
      "Bu nedenle beton dokumu bir gunluk operasyon degil, yapisal kalite surecidir.",
    ],
    conclusion: [
      "Beton isleri dogru yonetildiginde tasarimda beklenen davranis sahada guvenli bicimde olusur. Kabul, yerlesim ve kur zincirlerinden biri zayif kaldiginda ise hata yapisal sistemin icinde kalici hale gelir.",
      "Bir insaat muhendisi icin en dogru bakis, beton dokumunu yalniz malzeme teslimi degil; her adimi kayitli ve kontrollu bir kalite operasyonu olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tazeBetonNumuneTebligi],
    keywords: ["beton isleri", "beton dokumu", "slump", "kur", "TS EN 206"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/beton-isleri/beton-dokumu", "kaba-insaat/beton-isleri/vibrasyon", "kaba-insaat/beton-isleri/kur-islemi"],
  },
  {
    slugPath: "kaba-insaat/beton-isleri/beton-sinifi",
    kind: "topic",
    quote: "Beton sinifi secimi daha guclu beton istemek degil; eleman talebi, maruziyet ve saha uygulanabilirligini ayni tarifte bulusturmaktir.",
    tip: "C30, C35 veya C40'i yalniz rakam farki gibi gormek; maruziyet, kivam, agrega ve dokum gercegini kaybetmektir.",
    intro: [
      "Beton sinifi betonarme tasarimin en temel girdilerinden biridir. Ancak sahadaki performans yalniz C30/37 veya C35/45 gibi bir ifade ile belirlenmez; ayni siparisin icinde maruziyet sinifi, kivam, maksimum agrega boyutu ve pompalanabilirlik gibi uygulama parametreleri de gercek sonucu belirler.",
      "Yanlis beton secimi her zaman dusuk sinif secmek anlamina gelmez. Bazen gereksiz yuksek sinif secmek de islenebilirligi zayiflatir, maliyeti arttirir ve dar kesitlerde kaliteyi zorlar. Dogru beton, yalniz daha yuksek rakamli olan degil; tasarim talebi ile saha gercegine uygun olandir.",
      "Bir insaat muhendisi icin beton sinifi; statik ofisin kararini sahaya tercume etmek demektir. Hangi eleman neden daha fazla dayanim ister, hangi eleman hangi cevresel kosula maruz kalir ve hangi dugumde hangi kivam daha uygulanabilir sorulari bu tercumenin parcasi olur.",
      "Bu yazida beton sinifini teknik temel, yonetmelik ekseni, sayisal ornek ve saha hatalariyla birlikte tam bir rehber mantiginda ele aliyoruz.",
    ],
    theory: [
      "Beton sinifi ifadesi karakteristik dayanim duzeyini tanimlar; fakat saha davranisi bu ifade ile bitmez. Su/cimento orani, katki, agrega capi ve kivam gibi parametreler ayni sinifin farkli uygulama sonuclari vermesine neden olabilir.",
      "Maruziyet kosulu secimin ikinci ana eksenidir. Temel, acikta kalan eleman, su ile temas eden yuzey veya normal ic mekan ayni dayaniklilik beklentisine sahip degildir. Bu nedenle beton secimi yalniz kesit hesabina degil, elemanin yasayacagi ortama da dayanmalidir.",
      "Saha uygulanabilirligi ucuncu kritik basliktir. Sik donatili perde, kolon dugumu veya radye gibi alanlarda dogru kivam ve dogru agrega secimi, yalniz dayanimi degil uygulama kalitesini de belirler. Uygulanamayan beton teorik olarak dogru olsa bile sahada kalite avantajini kaybeder.",
      "TBDY 2018 ve TS 500 tarafindan verilen alt sinirlar bir taban guvence sunar. Ancak bunun ustune cikarken eleman tipine gore akilci davranmak gerekir. Fazla guclu ama zor yerlesen beton, dar kesitte bosluk ve segregasyonla teorik avantajini yitirebilir.",
    ],
    ruleTable: [
      {
        parameter: "Deprem etkili betonarme icin alt sinif",
        limitOrRequirement: "Deprem tasariminda gerekli minimum sinif korunmalidir",
        reference: "TBDY 2018, Madde 7.2.1",
        note: "Sinif secimi yonetmelik tabanindan baslar.",
      },
      {
        parameter: "Eleman talebi ile uyum",
        limitOrRequirement: "Secilen sinif kesit hesabina ve tasiyici talebe uygun olmalidir",
        reference: "TS 500",
        note: "Gereksiz yuksek veya dusuk secim ayni derecede sorun yaratabilir.",
      },
      {
        parameter: "Dayaniklilik ve maruziyet",
        limitOrRequirement: "Beton tarifi elemanin maruz kalacagi su, nem ve cevre etkisiyle uyumlu olmalidir",
        reference: "TS EN 206",
        note: "Dogru beton yalniz dayanim degil, dayaniklilik uyumudur.",
      },
      {
        parameter: "Kivam ve agrega",
        limitOrRequirement: "Donati yogunlugu ve pompa yontemine uygun saha uygulanabilirligi korunmalidir",
        reference: "TS EN 206",
        note: "Uygulanamayan beton sinifi avantajini kaybeder.",
      },
      {
        parameter: "Siparis tanimi",
        limitOrRequirement: "Sinif, kivam, maruziyet ve agrega kararlari birlikte siparis edilmelidir",
        reference: "Hazir beton siparis disiplini",
        note: "Yalniz C sinifi yazmak teknik olarak eksiktir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman talebini ve deprem gereklerini okuyarak minimum sinifi belirle.",
      "Temel, perde, doseme ve kolonlarin maruziyet farklarini ayri ayri degerlendir.",
      "Sik donatili veya dar kesitli bolgelerde kivam ve agrega kararini saha gercegiyle birlikte kur.",
      "Beton sinifini siparis ederken tum performans parametrelerini acikca tarif et.",
      "Ilk dokumlerde secimin uygulama davranisini gozle ve gerekli ise tarifi teknik olarak guncelle.",
      "Ayni santiyede farkli elemanlar icin farkli beton tarifleri kullanmaktan gerekirse kacinma.",
    ],
    criticalChecks: [
      "Secilen sinif yonetmelik alt sinirini karsiliyor mu?",
      "Maruziyet kosulu siparis tarifine yansitildi mi?",
      "Sik donatili bolgelerde agrega ve kivam yeterince dusunuldu mu?",
      "Ayni santiyede tum elemanlara ayni tarif refleksiyle gidiliyor mu?",
      "Irsaliyedeki tarif saha beklentisi ile birebir uyusuyor mu?",
      "Ilk dokumlerden sonra saha geribildirimi teknik olarak degerlendirildi mi?",
    ],
    numericalExample: {
      title: "Kolon ve doseme icin secim farki yorumu",
      inputs: [
        { label: "Kolon talebi", value: "Yuksek eksenel kuvvet ve yogun dugum", note: "Daha yuksek yapisal talep" },
        { label: "Doseme talebi", value: "Genis alan ve daha rahat yerlesim", note: "Daha yayvan uygulama" },
        { label: "Temel kosulu", value: "Toprak ve nem etkisi", note: "Dayaniklilik beklentisi artar" },
        { label: "Hedef", value: "Tek sinif refleksi yerine eleman bazli yorum", note: "Akilci secim amaci" },
      ],
      assumptions: [
        "Minimum yonetmelik sinirlari saglanmistir.",
        "Santiyede birden fazla tarif lojistik olarak yonetilebilir durumdadir.",
        "Saha ekipleri farkli tarifleri kayitsiz karistirmayacaktir.",
      ],
      steps: [
        {
          title: "Eleman taleplerini ayir",
          result: "Kolon, doseme ve temel ayni dayanim ve dayaniklilik beklentisine sahip olmayabilir.",
          note: "Beton secimi eleman bazli okunmaya burada baslar.",
        },
        {
          title: "Uygulanabilirligi ekle",
          result: "Kolon dugumunde daha uygun kivam ve agrega ihtiyaci, salt dayanim kararinin otesinde saha sonucunu etkiler.",
          note: "Ayni beton her kesitte ayni kaliteyi vermeyebilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Dogru secim, tasarim guvenligi ile saha uygulanabilirligini tek tarifte bulusturan secimdir.",
          note: "Rakami buyutmek her zaman kaliteyi buyutmez.",
        },
      ],
      checks: [
        "Farkli elemanlar icin farkli tarif gerekip gerekmedigi tartisilmalidir.",
        "Maruziyet sinifi temel ve acik elemanlarda ayri okunmalidir.",
        "Siparis formu saha dili ile statik ofis dilini birlestirmelidir.",
        "Ilk dokumlerden gelen geribildirim secimi dogrulamak icin kullanilmalidir.",
      ],
      engineeringComment: "Beton sinifinda en dogru karar, daha yuksek rakam yazan degil; elemanin hesabina ve santiyesine uyan karardir.",
    },
    tools: CONCRETE_TOOLS,
    equipmentAndMaterials: CONCRETE_EQUIPMENT,
    mistakes: [
      { wrong: "Beton sinifini yalniz C rakamiyla tarif etmek.", correct: "Maruziyet, kivam ve agrega gibi parametreleri de siparise yazmak." },
      { wrong: "Daha yuksek sinifi otomatik olarak daha iyi sanmak.", correct: "Eleman talebi ve uygulanabilirligi birlikte degerlendirmek." },
      { wrong: "Temel ve acik elemanlarda dayaniklilik kosullarini ihmal etmek.", correct: "Maruziyet sinifini secime dogrudan yansitmak." },
      { wrong: "Sik donatili bolgelerde ayni agrega ve kivam refleksiyle gitmek.", correct: "Kesit geometri ve pompa davranisina gore tarifi ayarlamak." },
      { wrong: "Tum elemanlara ayni tarifi kolaylik adina dayatmak.", correct: "Gerekli ise eleman bazli daha akilci tarifler kullanmak." },
      { wrong: "Ilk dokumlerden gelen saha geribildirimini onemsiz gormek.", correct: "Secimin sahadaki davranisini teknik veri olarak kullanmak." },
    ],
    designVsField: [
      "Tasarim ofisinde beton sinifi bir hesap girdisidir; sahada ise ayni karar kivam, pompa ve maruziyet detaylariyla gercege donusur.",
      "Iyi secilmis beton sinifi hem kesit hesabini hem dokum kalitesini destekler.",
      "Bu nedenle beton sinifi secimi, proje ile saha arasindaki en somut tercume kararlarindan biridir.",
    ],
    conclusion: [
      "Beton sinifi secimi dogru yapildiginda tasarim guvenligi, dayaniklilik ve saha uygulanabilirligi ayni tarifte bulusur. Yanlis yapildiginda sorun ya gereksiz maliyet ya da dokum kalitesinde kayip olarak geri doner.",
      "Bir insaat muhendisi icin en saglam yaklasim, beton sinifini rakam tercihi degil; elemanin ihtiyacini ve sahanin gercegini birlikte tarif eden teknik bir karar olarak okumaktir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn206],
    keywords: ["beton sinifi", "C30/37", "TS EN 206", "TBDY 2018", "maruziyet sinifi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/beton-isleri", "kaba-insaat/beton-isleri/beton-dokumu", "kaba-insaat/beton-isleri/beton-testi"],
  },
];
