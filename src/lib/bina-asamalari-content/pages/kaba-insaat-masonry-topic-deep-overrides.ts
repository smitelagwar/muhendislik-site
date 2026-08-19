import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_MASONRY_TOPIC_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_771_4_SOURCE: BinaGuideSource = {
  title: "TS EN 771-4 Kagir Birimleri - Otoklavlanmis Gazbeton Kagir Birimleri",
  shortCode: "TS EN 771-4",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Gazbeton bloklarin birim ozellikleri, boyutsal disiplin ve urun tanimi için temel referanslardan biridir.",
};

const TS_EN_998_2_SOURCE: BinaGuideSource = {
  title: "TS EN 998-2 Kagir Harci - Orgulu Kagir Harclari",
  shortCode: "TS EN 998-2",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Duvar harci ve ince derz uygulamalarinda harc secimi ile uygulama mantigini cerceveleyen temel standartlardan biridir.",
};

const MASONRY_TOPIC_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Mimari aks, boşluk ve mahal overlay paftası", purpose: "Duvar eksenini, kapi-pencere kararlarini ve tesisat rotalarini aynı duzende okumak." },
  { category: "Ölçüm", name: "Lazer nivo, şakul, mastar ve ip seti", purpose: "Ilk sıra, dusaylik ve duzlem kalitesini sayisal olarak kontrol etmek." },
  { category: "Kalite", name: "Duvar teslim checklisti ve foto arşivi", purpose: "Siva ve doğrama öncesi duvar kalitesini mahal bazinda kayda baglamak." },
  { category: "Planlama", name: "Modul ve kesim cizelgesi", purpose: "Aciklik kenarlarinda zayif parca birakmamak için blok veya tuğla dizisini bastan kurgulamak." },
];

const MASONRY_TOPIC_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Uygulama", name: "Blok veya tuğla birimleri, uygun örgü harci ve yardimci bağlantı elemanlari", purpose: "Dolgu duvari doğru modul ve birleşim mantigiyla kurmak.", phase: "Duvar örümü" },
  { group: "Ölçüm", name: "Şakul, lazer, metre, mastar ve derz kontrol aparatlari", purpose: "Aks, kot ve duzlem surekliligini kontrol etmek.", phase: "Sürekli kontrol" },
  { group: "Detay", name: "Lento, ankraj, file ve geçiş kiliflari", purpose: "Acikliklar ve betonarme temaslarinda çatlak ve zayiflik riskini azaltmak.", phase: "Detay cozumleri" },
  { group: "Kesim", name: "Kontrollu kesim tezgahi ve el aletleri", purpose: "Kirik parca yerine okunur ve tekrarlanabilir kenar detaylari uretmek.", phase: "Acilik ve kenarlar" },
];

export const kabaInsaatMasonryTopicDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/duvar-orme",
    kind: "topic",
    quote: "Duvar örme, boşluğu kapatan ikincil bir imalat değil; kaba inşaat ile ince isler arasindaki tolerans zincirini tasiyan ana ara katmandir.",
    tip: "Duvar kalitesini yalnız duvarcinin hiziyle okumak, siva, doğrama, seramik ve tesisat ekibinin aylar sonra odedigi bir hata uretir.",
    intro: [
      "Duvar örme asamasi, taşıyıcı sistem tamamlandiktan sonra mekanlari fiziksel olarak tanimlayan, doğrama bosluklarini netlestiren ve tesisat rotalarini somutlastiran kritik uygulama paketidir. Bu nedenle yalnızca birim elemanlari üst uste koyma operasyonu degildir; aks, kot, boşluk, birleşim ve teslim kalitesi yonetimidir.",
      "Sahada duvarlardan kaynaklanan buyuk sorunlarin cogu, duvar tamamlanirken değil; siva ekibi, pencere montajcisi, seramik ustasi veya elektrik mekanik ekipleri alana girdiginde gorulur. Dalga yapan bir duvar daha fazla siva kalinligi ister, yanlış kaba boşluk doğrama montajini zorlar, plansiz chase kirimlari ise duvari hem zayiflatir hem de teslimi geciktirir.",
      "Bir inşaat mühendisi için duvar örme, maliyeti düşük bir kalem gibi gorunebilir; fakat sahadaki tekrar iş maliyeti acisindan en pahali santimetreler cogu zaman burada uretilir. Ilk sıra kotunun kacmasi, aksin sasilmasi veya aciklik kenarlarinda zayif parca birakilmasi, sonradan hemen her ekip tarafindan yeniden duzeltilmek zorunda kalir.",
      "Bu yazida duvar ormeyi; teorik davranis, yönetmelik ve standart baglami, saha kabul mantigi, sayisal boşluk ornegi, araç listesi ve sık yapilan hatalarla birlikte uzun-form blog standardinda ele aliyoruz. Odagimiz, bir saha muhendisinin sabah duvar kontrol turunda gercekten kullanabilecegi bir akil kurmak.",
    ],
    theory: [
      "Dolgu duvarlar cogu projede taşıyıcı sistem elemani olarak hesaba katilmasa da yapının kullanım kalitesi, hasar dagilimi ve bitis islerinin geometrisi üzerinde belirleyicidir. Duvarin kendi rijitligi, betonarme çerçeve ile kurdugu temas, rötre ve sıcaklık etkileri nedeniyle en zayif hatlar genellikle malzeme değişim sinirlarinda olusur. Bu nedenle iyi duvar, yalnız düz gorunen değil; kolon, kiriş ve aciklik etrafinda kontrollu davranan duvardir.",
      "Duvar kalitesi ilk sırada kurulur. Ilk siradaki kot veya aks hatasi yukari ciktikca buyur ve sonunda mastar, siva, denizlik, denge ve kapı ekseni problemlerine donusur. Bu nedenle duvar örme isinde hiz, ilk siradan sonra gelir; önce referans ve modulu doğru kurmak gerekir. Sahadaki bircok duvar hatasi aslinda ilk saatte verilen yanlış bir kararin zincirleme sonucudur.",
      "Baska bir kritik konu, duvar ile tesisat iliskisidir. Elektrik buatlari, mekanik gecisler, klima drenajlari veya rezervuar baglantilari duvar tamamlandiktan sonra rastgele kirilarak cozuldugunde hem blok veya tuğla düzeni bozulur hem de çatlak için zayif cizgiler uretilir. Bu nedenle duvar, elektrik ve mekanik overlay ile birlikte okunmali; sonradan kırma zorunlulugu azaltilmalidir.",
      "Duvar örme aynı zamanda bir teslim kalitesidir. Taşıyıcı sistem tarafinda toleranslar milimetre veya santimetre bandinda tartisilirken, duvar tarafinda 'siva duzeltir' anlayisi hala yaygindir. Oysa iyi saha yönetimi, duvari kendi asamasinda kabul eder; siva ekibini bozuk geometriyi saklamakla gorevlendirmez.",
    ],
    ruleTable: [
      {
        parameter: "Aks, kot ve dusaylik",
        limitOrRequirement: "Ilk sıra ve köşe referanslari lazer ve ip hattiyla kurulup duvar boyunca şakul ve mastar ile korunmalidir",
        reference: "TS EN 13670 uygulama disiplini + saha kalite plani",
        note: "Duvar geometri hatasi sonraki tüm imalatlari iter.",
      },
      {
        parameter: "Aciliklar ve kaba boşluklar",
        limitOrRequirement: "Kapı-pencere boşlukları, doğrama montaj toleransi ve siva payi birlikte dusunulerek tamamlanmalidir",
        reference: "Mimari detay + uygulama kabul formu",
        note: "Doğru net geçiş, yalnız kaba boşluk ölçüsü ile saglanmaz.",
      },
      {
        parameter: "Betonarme ile birleşim",
        limitOrRequirement: "Kolon, kiriş ve lento temaslarinda çatlak riskini azaltacak file, ankraj veya uygun detay disiplini kurulmalidir",
        reference: "TS 500 + saha detay paftası",
        note: "Catlaklar en çok malzeme değişim sinirlarinda belirir.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Buat, kanal ve cihaz gecisleri duvar ilerlerken tanimlanmali, plansiz kirimdan kacinilmalidir",
        reference: "MEP overlay ve mahal bazli koordinasyon matrisi",
        note: "Kirilan duvar yalnız zayiflamaz; yüzey duzlugu de bozulur.",
      },
      {
        parameter: "Teslim öncesi yüzey kalitesi",
        limitOrRequirement: "Siva öncesi duvar mastar, boşluk, zayif parca ve tamir izleri acisindan ayri bir kabul turuna tabi tutulmalidir",
        reference: "Mahal bazli teslim cizelgesi",
        note: "Siva, duvar hatasini ortmek için değil, bitis kalitesini tamamlamak için vardir.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari plan, doğrama listesi ve tesisat overlay'ini aynı zemin aplikasyonu üzerinde birlestir; duvar akslarini önce kagit üzerinde netlestir.",
      "Ilk sirayi kot, aks ve köşe referansi ile kür; duvari telafi mantigi yerine referans mantigiyla başlat.",
      "Acilik etrafinda kesim parcalarini, lento çözümünü ve kenar elemanlarini duvar ilerlemeden önce planla.",
      "Elektrik ve mekanik ekipleriyle buat, chase, rezervuar ve cihaz gecislerini duvar örümü ile es zamanli kilitle.",
      "Betonarme temaslarinda çatlak riski yaratan bolgeleri file, ankraj veya uygun birleşim detaylariyla bastan cozumle.",
      "Siva ve doğrama öncesi duvari mastar, boşluk, duzlem, aciklik ekseni ve tamir izi acisindan ikinci bir kalite turundan gecir.",
    ],
    criticalChecks: [
      "Ilk sıra ve köşe referanslari tüm duvar boyunca korunmus mu?",
      "Kapı ve pencere boşlukları net doğrama kararina göre yeterli tolerans birakiyor mu?",
      "Kolon ve kiriş temaslarinda çatlak riski yaratacak zayif hatlar veya kopuk fileler var mi?",
      "Tesisat için duvar bittikten sonra yeni kırım ihtiyaci doguyor mu?",
      "Acilik kenarlarinda zayif, kirik veya dar parca kaldi mi?",
      "Siva kalinligini gereksiz buyutecek dalga, sehim veya yama izleri mevcut mu?",
    ],
    numericalExample: {
      title: "4,80 m duvarda kapı boşluğu ve kalan örgü boyunun yorumu",
      inputs: [
        { label: "Toplam duvar boyu", value: "4,80 m", note: "Koridor yan duvari" },
        { label: "Kapı kaba boşluğu", value: "95 cm", note: "90 cm net geçiş hedefi için ornek boşluk" },
        { label: "Kalan net örgü boyu", value: "3,85 m", note: "4,80 - 0,95" },
        { label: "Hedef", value: "Her iki yanda düzgün duvar parçası", note: "Pervaz, siva ve kaplama kalitesi için" },
      ],
      assumptions: [
        "Kapının duvar ortasina yakin yerlestirildigi varsayilmistir.",
        "Siva ve kasa toleransi önceden tanimlanmistir.",
        "Modul plani duvar malzemesine göre yeniden teyit edilecektir.",
      ],
      steps: [
        {
          title: "Kalan örgü boyunu hesapla",
          formula: "4,80 - 0,95 = 3,85 m",
          result: "Kapı disinda kalan duvar uzunlugu 3,85 m olur.",
          note: "Bu uzunluk iki yana dagitilacak duvar parçası ve kesim stratejisini belirler.",
        },
        {
          title: "Simetrik dagilimi yorumla",
          formula: "3,85 / 2 = 1,925 m",
          result: "Kapı ortalanirsa her iki yanda yaklasik 1,93 m duvar parçası kalir.",
          note: "Bu deger kaba olarak iyi gorunse de moduler kesim plani ayrıca test edilmelidir.",
        },
        {
          title: "Saha sonucunu bagla",
          result: "Boşluk genisligi tek basina yeterli degildir; kapının duvar ekseni, kesim parcalari ve siva sonrasi net geçiş birlikte okunmalidir.",
          note: "Duvar kalitesini belirleyen, boslugun santimetresi kadar etrafindaki detay kalitesidir.",
        },
      ],
      checks: [
        "Boşluk karari siva ve kasa payi ile birlikte onaylanmalidir.",
        "Kalan duvar parçası, zayif kenar ve kirik kesim uretmeyecek sekilde modul planina oturmalidir.",
        "Lento ve aciklik kenarlari duvarin geri kalanindan ayri kontrol edilmelidir.",
        "Aks hatasi boşluk genisligi doğru olsa bile kullanimi bozar.",
      ],
      engineeringComment: "Duvar ormede en pahali santimetreler, kapı ve pencere etrafinda yanlış karar verilen santimetrelerdir.",
    },
    tools: MASONRY_TOPIC_TOOLS,
    equipmentAndMaterials: MASONRY_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Ilk sirayi göz karari ilerletmek.", correct: "Ilk sirayi tüm duvarin geometrik referansi olarak hassas kurmak." },
      { wrong: "Kaba boşlukları yalnız metreden bakarak onaylamak.", correct: "Kasa, siva ve montaj toleransini birlikte kontrol etmek." },
      { wrong: "Tesisat kirimlarini duvar bittikten sonra rastgele acmak.", correct: "Gecisleri duvar örümü ile birlikte planlamak." },
      { wrong: "Kolon-duvar temasini onemsiz bir detay saymak.", correct: "Çatlak riskini bu birlesimlerde ozel detay olarak ele almak." },
      { wrong: "Siva duzeltir diye dalgali duvari kabul etmek.", correct: "Duvari kendi asamasinda mastar ve şakul ile teslim etmek." },
      { wrong: "Kirik veya çok dar parcalari aciklik kenarlarinda kullanmak.", correct: "Modul plani yapip kontrollu kesimle temiz kenar detaylari uretmek." },
    ],
    designVsField: [
      "Projede duvar bir tarama alani gibi görünür; sahada ise doğrama, tesisat, siva ve mahal netlerini aynı anda tasiyan bir koordinasyon duvarina donusur.",
      "Iyi duvar, kendini duvar biterken değil, sonraki ekipler geldiginde sessizce belli eder; düzgün pervaz, az tamir ve temiz yüzey onun sonucudur.",
      "Bu nedenle duvar örme, taşıyıcı olmayan bir kalem olsa da şantiyenin genel kalite algisini belirleyen ana uygulamalardan biridir.",
    ],
    conclusion: [
      "Duvar örme; aks, boşluk, tesisat koordinasyonu ve teslim kalitesi birlikte yonetildiginde ince islerin omurgasini düzgün kurar. Gevsek yonetildiginde ise siva, doğrama ve kaplama ekiplerinin uzerine dagilan gizli bir hata havuzuna donusur.",
      "Bir inşaat mühendisi için doğru yaklasim, duvari yalnız metraj ve hiz kalemi olarak görmek değil; kaba inşaat ile bitis imalatlari arasindaki kritik tolerans koprusunu burada kurmaktir.",
    ],
    sources: [...KABA_MASONRY_TOPIC_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["duvar örme", "dolgu duvar", "kapı boşluğu", "tesisat koordinasyonu", "saha toleransi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme/tugla-duvar", "kaba-insaat/duvar-orme/ytong-gazbeton", "kaba-insaat/duvar-orme/briket"],
  },
  {
    slugPath: "kaba-insaat/duvar-orme/ytong-gazbeton",
    kind: "topic",
    quote: "Gazbeton duvarin asil avantaji hafifligi değil; doğru kesim, ince derz ve temiz tolerans yönetimi kuruldugunda tekrar isi azaltmasidir.",
    tip: "Gazbeton hafif diye göz karariyla orulen duvar, issilik, çatlak ve aciklik bozuklugu nedeniyle tugladan daha pahali bir tekrar iş uretebilir.",
    intro: [
      "Gazbeton bloklar, hafiflikleri, daha iyi isil performanslari ve buyuk modulleri nedeniyle konut ve ticari yapilarda yaygin kullanilir. Ancak bu avantajlar, yalnızca doğru modul planlamasi, ince derz disiplini ve kontrollu kesim ile gercege donusur. Malzeme hafif diye saha disiplini gevsetildiginde duvar hızlı yukselir ama hatalar da aynı hizla buyur.",
      "Sahada gazbetonla ilgili en yaygin sorunlar; ilk sırada kot kacmasi, ince derz yerine kalin yastik harc kullanilmasi, plansiz chase kirimlari, pencere kenarlarinda zayif parca birakilmasi ve kolon temaslarinda çatlak olusmasidir. Gazbetonun blok boyu buyuk oldugu için bu hatalar az sayida satirda buyuk geometrik bozukluk olarak geri doner.",
      "Bir inşaat mühendisi acisindan gazbeton, yalnız hafif duvar secenegi degildir. Yapının kullanimi, dış kabuk davranisi, iş gucu hizi, kesim kalitesi ve elektrik mekanik koordinasyonu bu malzemenin gercek performansini belirler. Yani gazbeton avantajini urun katalogundan değil, saha uygulamasindan alir.",
      "Bu rehberde gazbeton duvari; birim ozellikler, ince derz mantigi, aciklik etrafindaki kritik detaylar, sayisal modul ornegi ve saha kontrol noktalarina odaklanarak daha derin bir blog standardinda ele aliyoruz.",
    ],
    theory: [
      "Gazbeton bloklar TS EN 771-4 kapsamindaki birim davranis mantigi ile tanimlanir. Buyuk boyutlu ve hafif olmalarinin sonucu olarak duvar daha hızlı ilerler; ancak aynı buyukluk, ilk sıra hatasini daha görünür hale getirir. Tek blokta yapilan yatay veya dusay hata, tüm yuzeyde dalga olarak daha cabuk fark edilir. Bu nedenle gazbetonda ilk sıra, tugladan bile daha kritik hale gelebilir.",
      "Ince derz mantigi gazbetonun temel saha farkidir. Malzeme boyutsal olarak daha duzenli oldugu için kalin örgü harciyla telafi mantigina değil, daha kontrollu ve ince bir birleşim disiplinine dayanır. Bu mantik bozulup derz kalinliklari saha aliskanligina birakildiginda, malzemenin en buyuk avantaji olan duzlem ve hiz kaybedilir.",
      "Gazbeton duvarlarda kesim kalitesi de belirleyicidir. Buyuk bloklar nedeniyle pencere kosesi, lento altlari veya tesisat kutusu cevresinde dar ve kirik parca birakmak daha tehlikelidir; cunku birim elemanin geometri avantaji bozulur. Kontrollu kesim yapilmadiginda duvar, siva altinda gizlenmeye calisilan buyuk boşluklar ve zayif kenarlarla dolu hale gelir.",
      "Ayrıca gazbeton duvar, issil kabuk ve nem davranisi acisindan da okunmalidir. Dış duvar veya disa bakan ara duvar uygulamalarinda kolon-duvar temaslari, pencere pervazi, denizlik ve dış siva sistemi ile birlikte dusunulmezse malzemenin kagit uzerindeki isi avantaji saha detayinda kaybedilebilir.",
    ],
    ruleTable: [
      {
        parameter: "Birim ve boyutsal disiplin",
        limitOrRequirement: "Gazbeton birimleri urun standardina uygun ve hasarsiz olmali, örgü sırasında darbe kaynakli kirik blok kullanilmamalidir",
        reference: "TS EN 771-4",
        note: "Hasarli blok, ince derz mantigini ve duzlem kalitesini bozar.",
      },
      {
        parameter: "Ince derz ve harc secimi",
        limitOrRequirement: "Sistem, gazbetona uygun ince derz harci ve kontrollu yatak kalinligi ile uygulanmalidir",
        reference: "TS EN 998-2 + uretici uygulama prensipleri",
        note: "Kalıp mantigiyla kalin derz kullanmak gazbetonun avantajini siler.",
      },
      {
        parameter: "Acilik ve kenar parcalari",
        limitOrRequirement: "Pencere ve kapı kenarlarinda zayif, dar veya kirik parca yerine kontrollu kesim ve uygun lento cozumleri kullanilmalidir",
        reference: "Mimari detay + saha kabul formu",
        note: "Aciklik cevresi çatlak ve siva problemi uretmeye en yatkin bolgedir.",
      },
      {
        parameter: "Tesisat chase ve buatlar",
        limitOrRequirement: "Elektrik ve mekanik gecisler duvar orumune paralel planlanmali, sonradan derin ve genis kirimdan kacinilmalidir",
        reference: "Koordinasyon overlay'i",
        note: "Gazbeton hafif diye plansiz oyma yapmak duvari hizla zayiflatir.",
      },
      {
        parameter: "Kabuk ve dış yüzey iliskisi",
        limitOrRequirement: "Disa bakan duvarlarda siva, doğrama ve isi koprusu detaylari kabuk performansiyla birlikte ele alinmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Malzemenin issil avantaji, kötü detayla kolayca kaybedilir.",
      },
    ],
    designOrApplicationSteps: [
      "Gazbeton blok olculerine göre modul planini, aciklik konumlarini ve kesim ihtiyaclarini duvar başlamadan önce cikart.",
      "Ilk sirayi kot, aks ve taban duzeltmesi ile hassas kür; üst siralarda telafi mantigina guvenme.",
      "Ince derz harcini ve uygulama ekipmanini gazbeton sistemine uygun sec; kalin harcla duzeltme yapma.",
      "Pencere ve kapı etrafinda kontrollu kesim, lento ve kenar detayi için numune bölge olustur.",
      "Elektrik buatlari, tesisat chase'leri ve agir ekipman noktalarini duvar ilerlerken koordine et; sonradan oyma ihtiyacini azalt.",
      "Dış yüzey bitecekse siva, denizlik, file ve doğrama detaylarini gazbeton duvarla birlikte tek paket halinde denetle.",
    ],
    criticalChecks: [
      "Ilk sıra kötü ve blok dizisi tüm duvar boyunca korunuyor mu?",
      "Ince derz ritmi kalin yastik harc kullanimi ile bozulmus mu?",
      "Acilik kenarlarinda dar veya kirik bloklar kalmis mi?",
      "Tesisat için sonradan buyuk oyma veya yama ihtiyaci doguyor mu?",
      "Kolon ve pencere cevresinde çatlak için zayif hatlar olusuyor mu?",
      "Dış kabukla iliskili denizlik, siva ve isi koprusu detaylari çözülmüş mu?",
    ],
    numericalExample: {
      title: "6,00 m gazbeton duvarda pencere boşluğu ve modul yorumu",
      inputs: [
        { label: "Toplam duvar boyu", value: "6,00 m", note: "Dış cephe duvari" },
        { label: "Pencere kaba boşluğu", value: "1,20 m", note: "Orta aks pencere" },
        { label: "Ornek blok modulu", value: "60 cm", note: "Gazbeton blok boyu için tipik saha varsayimi" },
        { label: "Hedef", value: "Zayif kesim parçası birakmamak", note: "Aciklik etrafinda temiz detay" },
      ],
      assumptions: [
        "Pencere aksa yakin yerlestirilmis ve doğrama toleransi netlestirilmistir.",
        "Kesimler kontrollu ekipmanla yapilacaktir.",
        "Lento ve denizlik detaylari proje paftasında tanimlidir.",
      ],
      steps: [
        {
          title: "Kalan örgü boyunu bul",
          formula: "6,00 - 1,20 = 4,80 m",
          result: "Pencere disinda kalan örgü boyu 4,80 m'dir.",
          note: "Bu boy iki yana dagitilan blok dizisini tanimlar.",
        },
        {
          title: "Blok modulu ile yorumla",
          formula: "4,80 / 2 = 2,40 m = 4 adet 60 cm modul",
          result: "Pencere ortalandiysa her iki yanda tam 4 blokluk temiz bir dizilim elde edilebilir.",
          note: "Bu, kesim parçası gerektirmeden düzgün kenar detayi uretmek için elverisli bir senaryodur.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Gazbetonda modul planini basta yapmak, hem kesim kaybini hem de aciklik etrafindaki çatlak riskini azaltir.",
          note: "Malzemenin hiz avantajini koruyan sey, tam da bu on planlamadir.",
        },
      ],
      checks: [
        "Modul plani yalnız toplam uzunlugu değil, aciklik etrafindaki kenar detayini da hesaba katmalidir.",
        "Tam modul yakalanmiyorsa pencere ekseni veya kesim stratejisi basktan revize edilmelidir.",
        "Lento, denizlik ve doğrama toleransi aynı senaryoya dahil edilmelidir.",
        "Kesim karari rastgele değil, numune parca uzerinden test edilmelidir.",
      ],
      engineeringComment: "Gazbeton duvarda iyi planlanan modul, usta hizindan daha fazla kalite kazandirir.",
    },
    tools: MASONRY_TOPIC_TOOLS,
    equipmentAndMaterials: MASONRY_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Gazbetonu hafif diye göz karari dizmek.", correct: "Ilk sıra ve modul planini hassas kurmak." },
      { wrong: "Ince derz yerine kalin örgü harci ile telafi yapmak.", correct: "Gazbetona uygun ince derz mantigina sadik kalmak." },
      { wrong: "Acilik kenarlarinda dar ve kirik blok kullanmak.", correct: "Kontrollu kesimle düzgün kenar ve lento detayi uretmek." },
      { wrong: "Tesisat chase'lerini duvar bittikten sonra derin oymak.", correct: "Elektrik ve mekanik gecisleri duvar ilerlerken koordine etmek." },
      { wrong: "Dış duvarda gazbetonun isi avantajini detaylardan bağımsız sanmak.", correct: "Siva, doğrama, denizlik ve isi koprusu detaylarini birlikte cozumlemek." },
      { wrong: "Kirik veya hasarli bloklari duvarda kullanmaya devam etmek.", correct: "Hasarli bloklari ayirip düzgün birimlerle tekrarlanabilir geometri kurmak." },
    ],
    designVsField: [
      "Gazbeton katalogda hafif ve hızlı bir urun gibi görünür; sahada ise modul, kesim ve ince derz disiplinini ne kadar korudugunuz kadar iyidir.",
      "Malzemenin isi performansi ve düzgün gorunumu, ancak pencere, denizlik ve kolon temaslarinda doğru detay kuruldugunda sahaya tasinir.",
      "Bu nedenle gazbeton, kolay duvar değil; doğru uygulandiginda kolaylastiran duvar sistemidir.",
    ],
    conclusion: [
      "Gazbeton duvar, temiz modul planlamasi, ince derz disiplini ve kontrollu kesim ile uygulandiginda hızlı ve düzgün bir dolgu duvar cozumune donusur. Bu disiplin kaybedildiginde ise hafiflik avantaji, yama ve çatlak maliyetine teslim olur.",
      "Bir inşaat mühendisi için en sağlam yaklasim, gazbetonu sadece hafif blok olarak değil; aciklik, kabuk ve koordinasyon mantigi isteyen teknik bir sistem olarak yonetmektir.",
    ],
    sources: [...KABA_MASONRY_TOPIC_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, TS_EN_771_4_SOURCE, TS_EN_998_2_SOURCE],
    keywords: ["gazbeton", "ytong", "TS EN 771-4", "ince derz", "dış duvar koordinasyonu"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/duvar-orme", "ince-isler/siva/dis-siva"],
  },
];
