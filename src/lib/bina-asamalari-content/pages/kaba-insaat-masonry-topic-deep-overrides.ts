import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_MASONRY_TOPIC_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_771_4_SOURCE: BinaGuideSource = {
  title: "TS EN 771-4 Kagir Birimleri - Otoklavlanmis Gazbeton Kagir Birimleri",
  shortCode: "TS EN 771-4",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Gazbeton bloklarin birim ozellikleri, boyutsal disiplin ve urun tanimi icin temel referanslardan biridir.",
};

const TS_EN_998_2_SOURCE: BinaGuideSource = {
  title: "TS EN 998-2 Kagir Harci - Orgulu Kagir Harclari",
  shortCode: "TS EN 998-2",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Duvar harci ve ince derz uygulamalarinda harc secimi ile uygulama mantigini cerceveleyen temel standartlardan biridir.",
};

const MASONRY_TOPIC_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Mimari aks, bosluk ve mahal overlay paftasi", purpose: "Duvar eksenini, kapi-pencere kararlarini ve tesisat rotalarini ayni duzende okumak." },
  { category: "Olcum", name: "Lazer nivo, sakul, mastar ve ip seti", purpose: "Ilk sira, dusaylik ve duzlem kalitesini sayisal olarak kontrol etmek." },
  { category: "Kalite", name: "Duvar teslim checklisti ve foto arsivi", purpose: "Siva ve dograma oncesi duvar kalitesini mahal bazinda kayda baglamak." },
  { category: "Planlama", name: "Modul ve kesim cizelgesi", purpose: "Aciklik kenarlarinda zayif parca birakmamak icin blok veya tugla dizisini bastan kurgulamak." },
];

const MASONRY_TOPIC_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Uygulama", name: "Blok veya tugla birimleri, uygun orgu harci ve yardimci baglanti elemanlari", purpose: "Dolgu duvari dogru modul ve birlesim mantigiyla kurmak.", phase: "Duvar orumu" },
  { group: "Olcum", name: "Sakul, lazer, metre, mastar ve derz kontrol aparatlari", purpose: "Aks, kot ve duzlem surekliligini kontrol etmek.", phase: "Surekli kontrol" },
  { group: "Detay", name: "Lento, ankraj, file ve gecis kiliflari", purpose: "Acikliklar ve betonarme temaslarinda catlak ve zayiflik riskini azaltmak.", phase: "Detay cozumleri" },
  { group: "Kesim", name: "Kontrollu kesim tezgahi ve el aletleri", purpose: "Kirik parca yerine okunur ve tekrarlanabilir kenar detaylari uretmek.", phase: "Acilik ve kenarlar" },
];

export const kabaInsaatMasonryTopicDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/duvar-orme",
    kind: "topic",
    quote: "Duvar orme, boslugu kapatan ikincil bir imalat degil; kaba insaat ile ince isler arasindaki tolerans zincirini tasiyan ana ara katmandir.",
    tip: "Duvar kalitesini yalniz duvarcinin hiziyle okumak, siva, dograma, seramik ve tesisat ekibinin aylar sonra odedigi bir hata uretir.",
    intro: [
      "Duvar orme asamasi, tasiyici sistem tamamlandiktan sonra mekanlari fiziksel olarak tanimlayan, dograma bosluklarini netlestiren ve tesisat rotalarini somutlastiran kritik uygulama paketidir. Bu nedenle yalnizca birim elemanlari ust uste koyma operasyonu degildir; aks, kot, bosluk, birlesim ve teslim kalitesi yonetimidir.",
      "Sahada duvarlardan kaynaklanan buyuk sorunlarin cogu, duvar tamamlanirken degil; siva ekibi, pencere montajcisi, seramik ustasi veya elektrik mekanik ekipleri alana girdiginde gorulur. Dalga yapan bir duvar daha fazla siva kalinligi ister, yanlis kaba bosluk dograma montajini zorlar, plansiz chase kirimlari ise duvari hem zayiflatir hem de teslimi geciktirir.",
      "Bir insaat muhendisi icin duvar orme, maliyeti dusuk bir kalem gibi gorunebilir; fakat sahadaki tekrar is maliyeti acisindan en pahali santimetreler cogu zaman burada uretilir. Ilk sira kotunun kacmasi, aksin sasilmasi veya aciklik kenarlarinda zayif parca birakilmasi, sonradan hemen her ekip tarafindan yeniden duzeltilmek zorunda kalir.",
      "Bu yazida duvar ormeyi; teorik davranis, yonetmelik ve standart baglami, saha kabul mantigi, sayisal bosluk ornegi, arac listesi ve sik yapilan hatalarla birlikte uzun-form blog standardinda ele aliyoruz. Odagimiz, bir saha muhendisinin sabah duvar kontrol turunda gercekten kullanabilecegi bir akil kurmak.",
    ],
    theory: [
      "Dolgu duvarlar cogu projede tasiyici sistem elemani olarak hesaba katilmasa da yapinin kullanim kalitesi, hasar dagilimi ve bitis islerinin geometrisi uzerinde belirleyicidir. Duvarin kendi rijitligi, betonarme cerceve ile kurdugu temas, rotre ve sicaklik etkileri nedeniyle en zayif hatlar genellikle malzeme degisim sinirlarinda olusur. Bu nedenle iyi duvar, yalniz duz gorunen degil; kolon, kiris ve aciklik etrafinda kontrollu davranan duvardir.",
      "Duvar kalitesi ilk sirada kurulur. Ilk siradaki kot veya aks hatasi yukari ciktikca buyur ve sonunda mastar, siva, denizlik, denge ve kapi ekseni problemlerine donusur. Bu nedenle duvar orme isinde hiz, ilk siradan sonra gelir; once referans ve modulu dogru kurmak gerekir. Sahadaki bircok duvar hatasi aslinda ilk saatte verilen yanlis bir kararin zincirleme sonucudur.",
      "Baska bir kritik konu, duvar ile tesisat iliskisidir. Elektrik buatlari, mekanik gecisler, klima drenajlari veya rezervuar baglantilari duvar tamamlandiktan sonra rastgele kirilarak cozuldugunde hem blok veya tugla duzeni bozulur hem de catlak icin zayif cizgiler uretilir. Bu nedenle duvar, elektrik ve mekanik overlay ile birlikte okunmali; sonradan kirma zorunlulugu azaltilmalidir.",
      "Duvar orme ayni zamanda bir teslim kalitesidir. Tasiyici sistem tarafinda toleranslar milimetre veya santimetre bandinda tartisilirken, duvar tarafinda 'siva duzeltir' anlayisi hala yaygindir. Oysa iyi saha yonetimi, duvari kendi asamasinda kabul eder; siva ekibini bozuk geometriyi saklamakla gorevlendirmez.",
    ],
    ruleTable: [
      {
        parameter: "Aks, kot ve dusaylik",
        limitOrRequirement: "Ilk sira ve kose referanslari lazer ve ip hattiyla kurulup duvar boyunca sakul ve mastar ile korunmalidir",
        reference: "TS EN 13670 uygulama disiplini + saha kalite plani",
        note: "Duvar geometri hatasi sonraki tum imalatlari iter.",
      },
      {
        parameter: "Aciliklar ve kaba bosluklar",
        limitOrRequirement: "Kapi-pencere bosluklari, dograma montaj toleransi ve siva payi birlikte dusunulerek tamamlanmalidir",
        reference: "Mimari detay + uygulama kabul formu",
        note: "Dogru net gecis, yalniz kaba bosluk olcusu ile saglanmaz.",
      },
      {
        parameter: "Betonarme ile birlesim",
        limitOrRequirement: "Kolon, kiris ve lento temaslarinda catlak riskini azaltacak file, ankraj veya uygun detay disiplini kurulmalidir",
        reference: "TS 500 + saha detay paftasi",
        note: "Catlaklar en cok malzeme degisim sinirlarinda belirir.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Buat, kanal ve cihaz gecisleri duvar ilerlerken tanimlanmali, plansiz kirimdan kacinilmalidir",
        reference: "MEP overlay ve mahal bazli koordinasyon matrisi",
        note: "Kirilan duvar yalniz zayiflamaz; yuzey duzlugu de bozulur.",
      },
      {
        parameter: "Teslim oncesi yuzey kalitesi",
        limitOrRequirement: "Siva oncesi duvar mastar, bosluk, zayif parca ve tamir izleri acisindan ayri bir kabul turuna tabi tutulmalidir",
        reference: "Mahal bazli teslim cizelgesi",
        note: "Siva, duvar hatasini ortmek icin degil, bitis kalitesini tamamlamak icin vardir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari plan, dograma listesi ve tesisat overlay'ini ayni zemin aplikasyonu uzerinde birlestir; duvar akslarini once kagit uzerinde netlestir.",
      "Ilk sirayi kot, aks ve kose referansi ile kur; duvari telafi mantigi yerine referans mantigiyla baslat.",
      "Acilik etrafinda kesim parcalarini, lento cozumunu ve kenar elemanlarini duvar ilerlemeden once planla.",
      "Elektrik ve mekanik ekipleriyle buat, chase, rezervuar ve cihaz gecislerini duvar orumu ile es zamanli kilitle.",
      "Betonarme temaslarinda catlak riski yaratan bolgeleri file, ankraj veya uygun birlesim detaylariyla bastan cozumle.",
      "Siva ve dograma oncesi duvari mastar, bosluk, duzlem, aciklik ekseni ve tamir izi acisindan ikinci bir kalite turundan gecir.",
    ],
    criticalChecks: [
      "Ilk sira ve kose referanslari tum duvar boyunca korunmus mu?",
      "Kapi ve pencere bosluklari net dograma kararina gore yeterli tolerans birakiyor mu?",
      "Kolon ve kiris temaslarinda catlak riski yaratacak zayif hatlar veya kopuk fileler var mi?",
      "Tesisat icin duvar bittikten sonra yeni kirim ihtiyaci doguyor mu?",
      "Acilik kenarlarinda zayif, kirik veya dar parca kaldi mi?",
      "Siva kalinligini gereksiz buyutecek dalga, sehim veya yama izleri mevcut mu?",
    ],
    numericalExample: {
      title: "4,80 m duvarda kapi boslugu ve kalan orgu boyunun yorumu",
      inputs: [
        { label: "Toplam duvar boyu", value: "4,80 m", note: "Koridor yan duvari" },
        { label: "Kapi kaba boslugu", value: "95 cm", note: "90 cm net gecis hedefi icin ornek bosluk" },
        { label: "Kalan net orgu boyu", value: "3,85 m", note: "4,80 - 0,95" },
        { label: "Hedef", value: "Her iki yanda duzgun duvar parcasi", note: "Pervaz, siva ve kaplama kalitesi icin" },
      ],
      assumptions: [
        "Kapinin duvar ortasina yakin yerlestirildigi varsayilmistir.",
        "Siva ve kasa toleransi onceden tanimlanmistir.",
        "Modul plani duvar malzemesine gore yeniden teyit edilecektir.",
      ],
      steps: [
        {
          title: "Kalan orgu boyunu hesapla",
          formula: "4,80 - 0,95 = 3,85 m",
          result: "Kapi disinda kalan duvar uzunlugu 3,85 m olur.",
          note: "Bu uzunluk iki yana dagitilacak duvar parcasi ve kesim stratejisini belirler.",
        },
        {
          title: "Simetrik dagilimi yorumla",
          formula: "3,85 / 2 = 1,925 m",
          result: "Kapi ortalanirsa her iki yanda yaklasik 1,93 m duvar parcasi kalir.",
          note: "Bu deger kaba olarak iyi gorunse de moduler kesim plani ayrica test edilmelidir.",
        },
        {
          title: "Saha sonucunu bagla",
          result: "Bosluk genisligi tek basina yeterli degildir; kapinin duvar ekseni, kesim parcalari ve siva sonrasi net gecis birlikte okunmalidir.",
          note: "Duvar kalitesini belirleyen, boslugun santimetresi kadar etrafindaki detay kalitesidir.",
        },
      ],
      checks: [
        "Bosluk karari siva ve kasa payi ile birlikte onaylanmalidir.",
        "Kalan duvar parcasi, zayif kenar ve kirik kesim uretmeyecek sekilde modul planina oturmalidir.",
        "Lento ve aciklik kenarlari duvarin geri kalanindan ayri kontrol edilmelidir.",
        "Aks hatasi bosluk genisligi dogru olsa bile kullanimi bozar.",
      ],
      engineeringComment: "Duvar ormede en pahali santimetreler, kapi ve pencere etrafinda yanlis karar verilen santimetrelerdir.",
    },
    tools: MASONRY_TOPIC_TOOLS,
    equipmentAndMaterials: MASONRY_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Ilk sirayi goz karari ilerletmek.", correct: "Ilk sirayi tum duvarin geometrik referansi olarak hassas kurmak." },
      { wrong: "Kaba bosluklari yalniz metreden bakarak onaylamak.", correct: "Kasa, siva ve montaj toleransini birlikte kontrol etmek." },
      { wrong: "Tesisat kirimlarini duvar bittikten sonra rastgele acmak.", correct: "Gecisleri duvar orumu ile birlikte planlamak." },
      { wrong: "Kolon-duvar temasini onemsiz bir detay saymak.", correct: "Catlak riskini bu birlesimlerde ozel detay olarak ele almak." },
      { wrong: "Siva duzeltir diye dalgali duvari kabul etmek.", correct: "Duvari kendi asamasinda mastar ve sakul ile teslim etmek." },
      { wrong: "Kirik veya cok dar parcalari aciklik kenarlarinda kullanmak.", correct: "Modul plani yapip kontrollu kesimle temiz kenar detaylari uretmek." },
    ],
    designVsField: [
      "Projede duvar bir tarama alani gibi gorunur; sahada ise dograma, tesisat, siva ve mahal netlerini ayni anda tasiyan bir koordinasyon duvarina donusur.",
      "Iyi duvar, kendini duvar biterken degil, sonraki ekipler geldiginde sessizce belli eder; duzgun pervaz, az tamir ve temiz yuzey onun sonucudur.",
      "Bu nedenle duvar orme, tasiyici olmayan bir kalem olsa da santiyenin genel kalite algisini belirleyen ana uygulamalardan biridir.",
    ],
    conclusion: [
      "Duvar orme; aks, bosluk, tesisat koordinasyonu ve teslim kalitesi birlikte yonetildiginde ince islerin omurgasini duzgun kurar. Gevsek yonetildiginde ise siva, dograma ve kaplama ekiplerinin uzerine dagilan gizli bir hata havuzuna donusur.",
      "Bir insaat muhendisi icin dogru yaklasim, duvari yalniz metraj ve hiz kalemi olarak gormek degil; kaba insaat ile bitis imalatlari arasindaki kritik tolerans koprusunu burada kurmaktir.",
    ],
    sources: [...KABA_MASONRY_TOPIC_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["duvar orme", "dolgu duvar", "kapi boslugu", "tesisat koordinasyonu", "saha toleransi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme/tugla-duvar", "kaba-insaat/duvar-orme/ytong-gazbeton", "kaba-insaat/duvar-orme/briket"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/ytong-gazbeton",
    kind: "topic",
    quote: "Gazbeton duvarin asil avantaji hafifligi degil; dogru kesim, ince derz ve temiz tolerans yonetimi kuruldugunda tekrar isi azaltmasidir.",
    tip: "Gazbeton hafif diye goz karariyla orulen duvar, issilik, catlak ve aciklik bozuklugu nedeniyle tugladan daha pahali bir tekrar is uretebilir.",
    intro: [
      "Gazbeton bloklar, hafiflikleri, daha iyi isil performanslari ve buyuk modulleri nedeniyle konut ve ticari yapilarda yaygin kullanilir. Ancak bu avantajlar, yalnizca dogru modul planlamasi, ince derz disiplini ve kontrollu kesim ile gercege donusur. Malzeme hafif diye saha disiplini gevsetildiginde duvar hizli yukselir ama hatalar da ayni hizla buyur.",
      "Sahada gazbetonla ilgili en yaygin sorunlar; ilk sirada kot kacmasi, ince derz yerine kalin yastik harc kullanilmasi, plansiz chase kirimlari, pencere kenarlarinda zayif parca birakilmasi ve kolon temaslarinda catlak olusmasidir. Gazbetonun blok boyu buyuk oldugu icin bu hatalar az sayida satirda buyuk geometrik bozukluk olarak geri doner.",
      "Bir insaat muhendisi acisindan gazbeton, yalniz hafif duvar secenegi degildir. Yapinin kullanimi, dis kabuk davranisi, is gucu hizi, kesim kalitesi ve elektrik mekanik koordinasyonu bu malzemenin gercek performansini belirler. Yani gazbeton avantajini urun katalogundan degil, saha uygulamasindan alir.",
      "Bu rehberde gazbeton duvari; birim ozellikler, ince derz mantigi, aciklik etrafindaki kritik detaylar, sayisal modul ornegi ve saha kontrol noktalarina odaklanarak daha derin bir blog standardinda ele aliyoruz.",
    ],
    theory: [
      "Gazbeton bloklar TS EN 771-4 kapsamindaki birim davranis mantigi ile tanimlanir. Buyuk boyutlu ve hafif olmalarinin sonucu olarak duvar daha hizli ilerler; ancak ayni buyukluk, ilk sira hatasini daha gorunur hale getirir. Tek blokta yapilan yatay veya dusay hata, tum yuzeyde dalga olarak daha cabuk fark edilir. Bu nedenle gazbetonda ilk sira, tugladan bile daha kritik hale gelebilir.",
      "Ince derz mantigi gazbetonun temel saha farkidir. Malzeme boyutsal olarak daha duzenli oldugu icin kalin orgu harciyla telafi mantigina degil, daha kontrollu ve ince bir birlesim disiplinine dayanir. Bu mantik bozulup derz kalinliklari saha aliskanligina birakildiginda, malzemenin en buyuk avantaji olan duzlem ve hiz kaybedilir.",
      "Gazbeton duvarlarda kesim kalitesi de belirleyicidir. Buyuk bloklar nedeniyle pencere kosesi, lento altlari veya tesisat kutusu cevresinde dar ve kirik parca birakmak daha tehlikelidir; cunku birim elemanin geometri avantaji bozulur. Kontrollu kesim yapilmadiginda duvar, siva altinda gizlenmeye calisilan buyuk bosluklar ve zayif kenarlarla dolu hale gelir.",
      "Ayrica gazbeton duvar, issil kabuk ve nem davranisi acisindan da okunmalidir. Dis duvar veya disa bakan ara duvar uygulamalarinda kolon-duvar temaslari, pencere pervazi, denizlik ve dis siva sistemi ile birlikte dusunulmezse malzemenin kagit uzerindeki isi avantaji saha detayinda kaybedilebilir.",
    ],
    ruleTable: [
      {
        parameter: "Birim ve boyutsal disiplin",
        limitOrRequirement: "Gazbeton birimleri urun standardina uygun ve hasarsiz olmali, orgu sirasinda darbe kaynakli kirik blok kullanilmamalidir",
        reference: "TS EN 771-4",
        note: "Hasarli blok, ince derz mantigini ve duzlem kalitesini bozar.",
      },
      {
        parameter: "Ince derz ve harc secimi",
        limitOrRequirement: "Sistem, gazbetona uygun ince derz harci ve kontrollu yatak kalinligi ile uygulanmalidir",
        reference: "TS EN 998-2 + uretici uygulama prensipleri",
        note: "Kalip mantigiyla kalin derz kullanmak gazbetonun avantajini siler.",
      },
      {
        parameter: "Acilik ve kenar parcalari",
        limitOrRequirement: "Pencere ve kapi kenarlarinda zayif, dar veya kirik parca yerine kontrollu kesim ve uygun lento cozumleri kullanilmalidir",
        reference: "Mimari detay + saha kabul formu",
        note: "Aciklik cevresi catlak ve siva problemi uretmeye en yatkin bolgedir.",
      },
      {
        parameter: "Tesisat chase ve buatlar",
        limitOrRequirement: "Elektrik ve mekanik gecisler duvar orumune paralel planlanmali, sonradan derin ve genis kirimdan kacinilmalidir",
        reference: "Koordinasyon overlay'i",
        note: "Gazbeton hafif diye plansiz oyma yapmak duvari hizla zayiflatir.",
      },
      {
        parameter: "Kabuk ve dis yuzey iliskisi",
        limitOrRequirement: "Disa bakan duvarlarda siva, dograma ve isi koprusu detaylari kabuk performansiyla birlikte ele alinmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Malzemenin issil avantaji, kotu detayla kolayca kaybedilir.",
      },
    ],
    designOrApplicationSteps: [
      "Gazbeton blok olculerine gore modul planini, aciklik konumlarini ve kesim ihtiyaclarini duvar baslamadan once cikart.",
      "Ilk sirayi kot, aks ve taban duzeltmesi ile hassas kur; ust siralarda telafi mantigina guvenme.",
      "Ince derz harcini ve uygulama ekipmanini gazbeton sistemine uygun sec; kalin harcla duzeltme yapma.",
      "Pencere ve kapi etrafinda kontrollu kesim, lento ve kenar detayi icin numune bolge olustur.",
      "Elektrik buatlari, tesisat chase'leri ve agir ekipman noktalarini duvar ilerlerken koordine et; sonradan oyma ihtiyacini azalt.",
      "Dis yuzey bitecekse siva, denizlik, file ve dograma detaylarini gazbeton duvarla birlikte tek paket halinde denetle.",
    ],
    criticalChecks: [
      "Ilk sira kotu ve blok dizisi tum duvar boyunca korunuyor mu?",
      "Ince derz ritmi kalin yastik harc kullanimi ile bozulmus mu?",
      "Acilik kenarlarinda dar veya kirik bloklar kalmis mi?",
      "Tesisat icin sonradan buyuk oyma veya yama ihtiyaci doguyor mu?",
      "Kolon ve pencere cevresinde catlak icin zayif hatlar olusuyor mu?",
      "Dis kabukla iliskili denizlik, siva ve isi koprusu detaylari cozulmus mu?",
    ],
    numericalExample: {
      title: "6,00 m gazbeton duvarda pencere boslugu ve modul yorumu",
      inputs: [
        { label: "Toplam duvar boyu", value: "6,00 m", note: "Dis cephe duvari" },
        { label: "Pencere kaba boslugu", value: "1,20 m", note: "Orta aks pencere" },
        { label: "Ornek blok modulu", value: "60 cm", note: "Gazbeton blok boyu icin tipik saha varsayimi" },
        { label: "Hedef", value: "Zayif kesim parcasi birakmamak", note: "Aciklik etrafinda temiz detay" },
      ],
      assumptions: [
        "Pencere aksa yakin yerlestirilmis ve dograma toleransi netlestirilmistir.",
        "Kesimler kontrollu ekipmanla yapilacaktir.",
        "Lento ve denizlik detaylari proje paftasinda tanimlidir.",
      ],
      steps: [
        {
          title: "Kalan orgu boyunu bul",
          formula: "6,00 - 1,20 = 4,80 m",
          result: "Pencere disinda kalan orgu boyu 4,80 m'dir.",
          note: "Bu boy iki yana dagitilan blok dizisini tanimlar.",
        },
        {
          title: "Blok modulu ile yorumla",
          formula: "4,80 / 2 = 2,40 m = 4 adet 60 cm modul",
          result: "Pencere ortalandiysa her iki yanda tam 4 blokluk temiz bir dizilim elde edilebilir.",
          note: "Bu, kesim parcasi gerektirmeden duzgun kenar detayi uretmek icin elverisli bir senaryodur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Gazbetonda modul planini basta yapmak, hem kesim kaybini hem de aciklik etrafindaki catlak riskini azaltir.",
          note: "Malzemenin hiz avantajini koruyan sey, tam da bu on planlamadir.",
        },
      ],
      checks: [
        "Modul plani yalniz toplam uzunlugu degil, aciklik etrafindaki kenar detayini da hesaba katmalidir.",
        "Tam modul yakalanmiyorsa pencere ekseni veya kesim stratejisi basktan revize edilmelidir.",
        "Lento, denizlik ve dograma toleransi ayni senaryoya dahil edilmelidir.",
        "Kesim karari rastgele degil, numune parca uzerinden test edilmelidir.",
      ],
      engineeringComment: "Gazbeton duvarda iyi planlanan modul, usta hizindan daha fazla kalite kazandirir.",
    },
    tools: MASONRY_TOPIC_TOOLS,
    equipmentAndMaterials: MASONRY_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Gazbetonu hafif diye goz karari dizmek.", correct: "Ilk sira ve modul planini hassas kurmak." },
      { wrong: "Ince derz yerine kalin orgu harci ile telafi yapmak.", correct: "Gazbetona uygun ince derz mantigina sadik kalmak." },
      { wrong: "Acilik kenarlarinda dar ve kirik blok kullanmak.", correct: "Kontrollu kesimle duzgun kenar ve lento detayi uretmek." },
      { wrong: "Tesisat chase'lerini duvar bittikten sonra derin oymak.", correct: "Elektrik ve mekanik gecisleri duvar ilerlerken koordine etmek." },
      { wrong: "Dis duvarda gazbetonun isi avantajini detaylardan bagimsiz sanmak.", correct: "Siva, dograma, denizlik ve isi koprusu detaylarini birlikte cozumlemek." },
      { wrong: "Kirik veya hasarli bloklari duvarda kullanmaya devam etmek.", correct: "Hasarli bloklari ayirip duzgun birimlerle tekrarlanabilir geometri kurmak." },
    ],
    designVsField: [
      "Gazbeton katalogda hafif ve hizli bir urun gibi gorunur; sahada ise modul, kesim ve ince derz disiplinini ne kadar korudugunuz kadar iyidir.",
      "Malzemenin isi performansi ve duzgun gorunumu, ancak pencere, denizlik ve kolon temaslarinda dogru detay kuruldugunda sahaya tasinir.",
      "Bu nedenle gazbeton, kolay duvar degil; dogru uygulandiginda kolaylastiran duvar sistemidir.",
    ],
    conclusion: [
      "Gazbeton duvar, temiz modul planlamasi, ince derz disiplini ve kontrollu kesim ile uygulandiginda hizli ve duzgun bir dolgu duvar cozumune donusur. Bu disiplin kaybedildiginde ise hafiflik avantaji, yama ve catlak maliyetine teslim olur.",
      "Bir insaat muhendisi icin en saglam yaklasim, gazbetonu sadece hafif blok olarak degil; aciklik, kabuk ve koordinasyon mantigi isteyen teknik bir sistem olarak yonetmektir.",
    ],
    sources: [...KABA_MASONRY_TOPIC_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, TS_EN_771_4_SOURCE, TS_EN_998_2_SOURCE],
    keywords: ["gazbeton", "ytong", "TS EN 771-4", "ince derz", "dis duvar koordinasyonu"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "ince-isler/siva/dis-siva"],
  },
];
