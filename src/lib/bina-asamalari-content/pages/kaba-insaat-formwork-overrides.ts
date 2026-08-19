import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_FORMWORK_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const FORMWORK_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Kalıp, iskele ve sokum sırası paftaları", purpose: "Kurulumdan sokume kadar yükü ve sirayi sahada okunabilir hale getirmek." },
  { category: "Ölçüm", name: "Lazer nivo, deformasyon ve sehim takip listesi", purpose: "Kalıp geometrisini ve sokum sonrasi davranisi kontrollu izlemek." },
  { category: "Planlama", name: "Kat cevrimi ve reshoring cizelgesi", purpose: "Betonun erken yas davranisini takvim baskisindan ayirarak yonetmek." },
  { category: "Kontrol", name: "Beton öncesi ve sokum öncesi checklist", purpose: "Kalıp kabulunu ve kalıp sokum kararini kisilere değil standarda baglamak." },
];

const FORMWORK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Panel kalıp, H20 kiriş, ahşap kusak ve dikme sistemi", purpose: "Taze beton, isci ve ekipman yuklerini guvenle tasimak.", phase: "Kurulum" },
  { group: "Bağlantı", name: "Tij, kilit, kusak, kama ve destek elemanlari", purpose: "Kalıp rijitligini ve geometri surekliligini korumak.", phase: "Montaj ve sıkma" },
  { group: "Ölçüm", name: "Kot civi, şakul, metre, total station ve lazer seti", purpose: "Kalıp alt kötü, duzlem ve şakul dogrulugunu izlemek.", phase: "Ölçüm ve kabul" },
  { group: "Güvenlik", name: "Reshoring dikmeleri, platform ve kenar koruma ekipmanlari", purpose: "Sokum sonrasi yük transferini ve saha guvenligini yonetmek.", phase: "Sokum ve sonrasi" },
];

export const kabaInsaatFormworkOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/kalip-isleri",
    kind: "topic",
    quote: "Kalıp isleri, betonu tasiyan gecici bir aparat değil; taşıyıcı sistemin gercek geometrisini sahada ureten ilk mühendislik katmanidir.",
    tip: "Kalibi yalnız panel kurulum hizi olarak yonetirsen, geometri, betonlama ve bitis kalitesi arasindaki zinciri daha dokum gunu kirarsin.",
    intro: [
      "Kalıp isleri, betonarme yapida projedeki kesit, aks ve kot bilgilerini sahada fiziksel geometriye donusturen ana fazdir. Kolon, kiriş, döşeme, perde ve aciklik detaylarinin hepsi önce kalipta gerceklesir; beton daha sonra yalnız bu geometrinin icini doldurur. Bu nedenle kalıp kalitesi, beton kalitesinden önce gelen bir dogruluk problemidir.",
      "Sahada en sık gorulen yanilgi, kalıp islerini yalnız panel kurma ve sokme operasyonu gibi okumaktir. Oysa kalıp, geometri, rijitlik, destek düzeni, rezervasyon, güvenlik ve sonraki imalatlarin referansi gibi birden fazla fonksiyonu aynı anda tasir. Bu fonksiyonlardan biri ihmal edildiginde hata genellikle kalıp kapanirken değil, beton sertlestikten sonra görünür olur.",
      "Bir inşaat mühendisi için kalıp isi; beton gelmeden önce kesitin doğru olup olmadigini, beton gelirken bu dogrulugun korunup korunmayacagini ve beton sonrasi sokumla bir sonraki kata güvenli gecilip gecilemeyecegini yonetmek demektir. Bu yuzden kalıp, kurulan değil izlenen bir sistemdir.",
      "Kalıp islerini zayif yoneten sahalarda aynı anda birden fazla sorun ortaya çıkar: kolonlar eksenden kacar, kiriş alt kötü bozulur, döşemede dalga olusur, beton yuzeyi peteklenir ya da rezervasyonlar sonradan kırma ihtiyaci dogurur. Hepsinin kokunde cogu zaman aynı problem vardir: kalıp fazi mühendislik olarak değil, rutin iscilik olarak ele alinmistir.",
    ],
    theory: [
      "Kalıp sistemleri, taze betonun hidrostatik ve operasyonel yukleri altinda sekil degistirmeden kalabilmelidir. Bu gereklilik, yalnız panel saglamligi değil; tij, kusak, alt taşıyıcı, dikme ve taban oturumunun birlikte calismasi anlamina gelir. Saglam gorunen ama dengesiz oturan bir sistem, beton baskisi altinda beklenenden fazla hareket edebilir.",
      "Kalıp islerinin ikinci temel rolu geometri uretmektir. Bir kolonun ekseni, bir kirişin alt kötü, bir döşemenin duzlemi ve bir boslugun net ölçüsü kalipta belirlenir. Bu geometri bozulursa, donatı kalitesi doğru olsa bile yapisal ve mimari sonuc birlikte etkilenir. Dolayisiyla kalıp, statik ve mimari disiplinlerin sahadaki ortak ara yuzudur.",
      "Ayrıca kalıp isleri betonlama ile ayrilmaz bag icindedir. Betonun nereden verilecegi, hangi hizla ilerleyecegi, vibratorun nasil calisacagi ve yedek ekipmanin nerede olacagi kalıp davranisini etkiler. Kalıp projesi ile betonlama plani birbirinden bağımsız dusunulemez.",
      "Kalıp sistemlerinde sokum ve reshoring de teorinin parcasidir. Beton yeterli erken yas dayanımı ve rijitligine ulasmadan kalıbı almak, daha önce doğru kurulan sistemi sonradan riskli hale getirebilir. Bu nedenle kalıp isi, montaj kadar sokum kararlariyla da mühendislik niteligi tasir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve tolerans",
        limitOrRequirement: "Aks, kot, kesit boyutu ve boşluklar beton öncesi ölçülerek dogrulanmali",
        reference: "TS EN 13670 uygulama prensipleri",
        note: "Olculmeyen kalıp, doğru kabul edilemez.",
      },
      {
        parameter: "Rijitlik ve taşıyıcı düzen",
        limitOrRequirement: "Panel, tij, kusak ve alt destekler taze beton yukune uygun kurulmali",
        reference: "Kalıp tasarim disiplini + TS EN 13670",
        note: "Kalıp varligi ile kalıp yeterliligi aynı sey degildir.",
      },
      {
        parameter: "Rezervasyon ve gomulu detaylar",
        limitOrRequirement: "Tesisat boşlukları, embed ve filiz detaylari kalıp kapanmadan netlestirilmeli",
        reference: "Shop drawing + saha koordinasyon turu",
        note: "Sonradan delik acmak geometri ve dayanımı bozar.",
      },
      {
        parameter: "Betonlama uyumu",
        limitOrRequirement: "Beton dokum hizi ve kalıp davranisi birlikte yonetilmeli",
        reference: "Betonlama kalite plani",
        note: "Hiz baskisi, kalıp guvenligini tek basina zayiflatabilir.",
      },
      {
        parameter: "Sokum ve reshoring",
        limitOrRequirement: "Kalıp ve tali destekler, betonun erken yas davranisina göre planli kaldirilmali",
        reference: "TS EN 13670 + kat cevrimi plani",
        note: "Erken sokum, gorunmeyen sehim ve çatlak riski uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Kalıp paftası, akslar, rezervasyonlar ve bitis kotlarini uygulama öncesi ekiple birlikte oku.",
      "Panel, alt taşıyıcı ve dikme duzenini aciklik, kesit ve dokum yukune göre kür; taban oturumunu ihmal etme.",
      "Beton öncesi son turda aks, şakul, alt kot, kesit ve boşluk dogrulugunu olcerek kapat.",
      "Dokum planini kalıp rijitligiyle uyumlu hale getir; hiz gerektiren her kararda kalıp davranisini önce dusun.",
      "Kalıp acma sonrasi kusurlari bir sonraki kalıp kurulumuna geri bildirim olarak kullan.",
      "Sokum ve reshoring kararlarini takvim refleksiyle değil, teknik kabul ve saha verisiyle ver.",
    ],
    criticalChecks: [
      "Aks, kot ve kesit olculeri beton öncesi gercekten alinmis mi?",
      "Alt destek düzeni ve taban oturumu yük aktarimini sağlıklı tasiyor mu?",
      "Rezervasyonlar ve gomulu detaylar kalıp kapanmadan önce dogrulandi mi?",
      "Dokum hizina bagli yanak acilmasi veya alt kot kaybi riski var mi?",
      "Kalıp acma kusurlari sonraki katta aynen tekrar ediyor mu?",
      "Sokum karari, betonun durumundan bağımsız yalnız takvime göre mi veriliyor?",
    ],
    numericalExample: {
      title: "8,0 x 6,0 m döşeme parcasinda taze beton yük yorumu",
      inputs: [
        { label: "Döşeme kalinligi", value: "14 cm", note: "Tipik kat dosemesi" },
        { label: "Taze beton birim hacim agirligi", value: "25 kN/m3", note: "Yaklasik saha degeri" },
        { label: "Alan", value: "48 m2", note: "8 x 6 m panel alani" },
        { label: "Hedef", value: "Alt taşıyıcı mantigini okumak", note: "Kalıp kurulum karari için" },
      ],
      assumptions: [
        "Donatı ve isci yukleri için ilave emniyet payi ayri degerlendirilir.",
        "Alt taşıyıcı sistem yukleri dikmelere dengeli dagitacak sekilde kurulmustur.",
        "Taban zemini oturma riskine karsi kontrol edilmistir.",
      ],
      steps: [
        {
          title: "Betonun birim alan yükünü hesapla",
          formula: "0,14 x 25 = 3,50 kN/m2",
          result: "Yalnız taze beton yükü yaklasik 3,50 kN/m2 olur.",
          note: "Bu deger, kalıp ve canli yapim yukleri eklenmeden önceki temel referanstir.",
        },
        {
          title: "Toplam beton yükünü yorumla",
          formula: "48 x 3,50 = 168 kN",
          result: "Sadece beton olarak bu panel parçası yaklasik 168 kN yük uretir.",
          note: "Bu buyukluk, kalıbın neden yalnız gozle değil yük mantigiyla kurulmasi gerektigini gosterir.",
        },
        {
          title: "Kalıp kararina etkisini bagla",
          result: "Dikme araligi, alt taşıyıcı yonu ve taban plakalari bu yük seviyesine göre disiplinli kurulmalidir.",
          note: "Küçük gorunen destek ihmali genis alanda buyuyen sehim uretebilir.",
        },
      ],
      checks: [
        "Yük hesabi kalıp kurulumunu hiz isi olmaktan cikarip mühendislik kararina donusturur.",
        "Toplam alan buyudukce küçük kot farklari ve oturma etkileri önem kazanir.",
        "Kalıp tasarımı, yalnız panel sayisi değil yük akisi mantigiyla okunmalidir.",
        "Dokum plani bu tasima mantigina aykiri hiz baskisi olusturmamalidir.",
      ],
      engineeringComment: "Kalıp islerinde asil gorunmeyen sey panel değil, o panelin altinda dolasan yuktur.",
    },
    tools: FORMWORK_TOOLS,
    equipmentAndMaterials: FORMWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Kalibi yalnız panel adedi ve kurulum hizina göre degerlendirmek.", correct: "Geometri, yük ve sonraki imalat etkisini birlikte okumak." },
      { wrong: "Beton öncesi ölçü almadan dokuma gecmek.", correct: "Aks, kot ve kesit kabulunu yazili ve olculu tamamlamak." },
      { wrong: "Rezervasyonlari son dakika sahada çözmek.", correct: "Embed ve boşluk detaylarini kalıp kapanmadan önce kapatmak." },
      { wrong: "Kalıp kusurunu yalnız beton yüzey hatasi sanmak.", correct: "Bitis kötü ve diger disiplinlere etkisini de sorgulamak." },
      { wrong: "Sokumu takvim baskisiyla yapmak.", correct: "Betonun erken yas davranisini ve reshoring ihtiyacini teknik veriyle degerlendirmek." },
      { wrong: "Her katta aynı hatayi tekrar etmek.", correct: "Kalıp acma gozlemlerini sonraki kurulumun geri bildirimi haline getirmek." },
    ],
    designVsField: [
      "Projede kalıp isleri cizim ve kesit notlariyla tarif edilir; sahada ise bu tarif, yük tasiyan ve geometri ureten fiziksel sisteme donusur.",
      "Iyi kalıp, beton gelmeden önce doğru gorunen ve beton geldikten sonra da dogrulugunu koruyan kaliptir.",
      "Bu nedenle kalıp isleri, kaba insaatin en görünmez ama en belirleyici kalite kapilarindan biridir.",
    ],
    conclusion: [
      "Kalıp isleri doğru geometri, doğru rijitlik ve doğru sokum karari ile yonetildiginde taşıyıcı sistem projedeki davranisina daha yakin uretilir. Zayif yonetildiginde ise hata yalnız beton yuzeyinde değil, tüm kat geometrisinde dolasir.",
      "Saha acisindan en doğru yaklasim, kalıbı montaj kalemi değil yük, tolerans ve teslim zinciri olarak okumaktir. Bu bakis hem yapisal kaliteyi hem de sonraki imalatlarin hizini belirgin bicimde iyilestirir.",
    ],
    sources: [...KABA_FORMWORK_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalıp isleri", "kalıp kabulu", "geometri kontrolü", "reshoring", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/kalip-isleri/kolon-kalibi", "kaba-insaat/kalip-isleri/kalip-sokumu"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/kalip-sokumu",
    kind: "topic",
    quote: "Kalıp sokumu, paneli yerinden almak değil; yük transferinin hangi anda ve hangi riskle betona devredilecegini yonetmektir.",
    tip: "Kalıp sokumunu sadece takvim hizlandirma araci gibi görmek, betonun erken yas davranisini ihmal edip gorunmeyen hasari bizzat uretmek demektir.",
    intro: [
      "Kalıp sokumu, şantiyede en yanlış anlasilan kalıp asamalarindan biridir. Kurulum görünür ve yoğun emek ister; buna karsilik sokum genellikle 'iş bitti' algisi yarattigi için daha basit sanilir. Oysa gercekte en hassas kararlardan biri burada verilir: beton, gecici taşıyıcı sistemden ayrildiginda yükü guvenle devralabilecek durumda midir?",
      "Sahada en sık yapilan hata, kalıp sokumunu yalnız süre kazanci uzerinden degerlendirmektir. Kat cevrimi hizlandikca sokum baskisi artar; ancak betonun erken yas dayanımı, eleman acikligi, hava kosullari, kalıp tipi ve reshoring gereksinimi birlikte dusunulmeden verilen kararlar gorunmeyen sehim, çatlak veya uzun vadeli deformasyon riski uretir.",
      "Bir inşaat mühendisi için kalıp sokumu, yalnız ustanin panel sokmesi değil; betonun olgunlasma davranisini okumak, hangi elemanda ne zaman tali destek birakilacagini belirlemek ve bir sonraki katin yükünü güvenli yonetmek anlamina gelir.",
      "Bu nedenle kalıp sokumu, beton dokumunun bittigi gun baslayan ama cogu zaman yeterince planlanmayan ayri bir mühendislik asamasidir.",
    ],
    theory: [
      "Beton, dokuldugu anda nihai tasima kapasitesine ulasmaz. Erken yasta dayanım ve rijitlik kazanir, fakat bu kazanim sıcaklık, kür, cimento tipi, karisim ozellikleri ve eleman boyutlarina göre degisir. Bu nedenle tek bir takvim kuralini tüm elemanlara kor bicimde uygulamak doğru degildir. Kolon yanagi ile genis aciklikli döşeme alt destegi aynı anda degerlendirilemez.",
      "Kalıp sokumunda iki kavram ayrilmalidir: kalıbın alinmasi ve yukunun gercekten betona devri. Bir elemanin yan kaliplarinin alinmasiyla alt desteklerin kaldirilmasi aynı risk seviyesinde degildir. Ozellikle kiriş ve dosemelerde reshoring veya tali destek, beton yük tasimaya alisana kadar emniyetli geçiş sağlar.",
      "Erken sokumun riski yalnız ani gocme degildir. Daha sinsi ve daha yaygin risk, kalici sehim, sacaklanmis çatlaklar, tavan dalgasi ve sonraki kaplama islerinde ortaya cikan geometri kaybidir. Bu nedenle zarar cogu zaman aynı gun değil, haftalar sonra fark edilir.",
      "Kalıp sokum karari, betonun test sonuclari, kür kosullari, hava sicakligi, aciklik uzunlugu ve eleman tipi birlikte okunarak verilmelidir. Yani sokum, aliskanlik değil veri odakli bir karar süreci olmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Eleman tipine göre sokum",
        limitOrRequirement: "Kolon, perde, kiriş ve döşeme için aynı sokum mantigi uygulanmamali",
        reference: "TS EN 13670 + saha teknik plani",
        note: "Yanal kalıp sokumu ile alt destek sokumu birbirinden ayrilmalidir.",
      },
      {
        parameter: "Erken yas beton davranisi",
        limitOrRequirement: "Sokum karari betonun dayanım ve kür durumuna göre verilmeli",
        reference: "TS 500 + TS EN 13670",
        note: "Takvim bilgisi, teknik kabulun yerini alamaz.",
      },
      {
        parameter: "Reshoring ve tali destek",
        limitOrRequirement: "Aciklik ve üst kat yukune göre gerekli tali destekler planli birakilmali",
        reference: "Kat cevrimi ve kalıp plani",
        note: "Kalibi almak, tüm destegi aynı anda kaldirmak demek degildir.",
      },
      {
        parameter: "Hava ve kür etkisi",
        limitOrRequirement: "Soğuk, ruzgarli veya asiri sıcak havada sokum karari ayri degerlendirilmelidir",
        reference: "Beton kür ve saha gozlem plani",
        note: "Aynı gun sayisi farkli hava kosulunda aynı davranisi uretmez.",
      },
      {
        parameter: "Sokum sonrasi izleme",
        limitOrRequirement: "Sokumden sonra sehim, çatlak ve yüzey davranisi gozlenerek kayıt altina alinmali",
        reference: "Saha kalite kontrol plani",
        note: "Sokum karari, sokum aniyla bitmez; sonraki davranisla doğrulanır.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre hangi kalıp elemaninin ne zaman alinacagini ve hangi desteklerin kalacagini yazili planla tanimla.",
      "Betonun dokum tarihi, kür sarti, hava durumu ve varsa erken yas dayanım verisini sokum karariyla birlikte degerlendir.",
      "Yan kalıp, alt kalıp ve reshoring kararlarini birbirinden ayir; hepsini aynı anda sokme refleksinden kacin.",
      "Sokum ekibine yalnız tarih değil, sirali islem adimi ver; panel alma, temizleme ve tali destek koruma mantigini aynı planda anlat.",
      "Sokum sonrasi ilk gunlerde eleman yuzeyini, aciklik ortasini ve mesnet davranisini izleyerek sehim veya çatlak belirtisini kontrol et.",
      "Bir sonraki kat yükü ya da malzeme istifi gelmeden önce alttaki elemanin tasima duzenini yeniden gözden gecir.",
    ],
    criticalChecks: [
      "Sokum karari eleman tipine göre ayristirildi mi?",
      "Betonun erken yas durumu ve kür kosullari fiilen degerlendirildi mi?",
      "Alt desteklerin hangisinin kalacagi, hangisinin kaldirilacagi sahada acik mi?",
      "Sokum sonrasi aciklik ortasinda ani sehim veya tavan dalgasi belirtisi var mi?",
      "Bir sonraki katin yükü alttaki reshoring planini bozuyor mu?",
      "Sokum kararlari yalnız aliskanlikla mi yoksa veriyle mi veriliyor?",
    ],
    numericalExample: {
      title: "5,5 m aciklikli döşemede reshoring yorumu",
      inputs: [
        { label: "Döşeme acikligi", value: "5,5 m", note: "Konut kat döşemeleri" },
        { label: "Döşeme kalinligi", value: "14 cm", note: "Ornek betonarme döşeme" },
        { label: "Dokumden sonra gecen süre", value: "7 gun", note: "Takvim bilgisi" },
        { label: "Hedef", value: "Alt destegin tamamen alinip alinmayacagini yorumlamak", note: "Saha karari için" },
      ],
      assumptions: [
        "Hava kosullari ideal kabul edilmemektedir; saha sicakligi değişken olabilir.",
        "Kesin karar için proje ekibinin kullandigi dayanım verisi ve kür bilgisi ayrıca bulunacaktir.",
        "Yüksek kat cevrimi nedeniyle ustten yeni yük gelme ihtimali vardir.",
      ],
      steps: [
        {
          title: "Takvim bilgisini tek basina sorgula",
          result: "7 gun bilgisi tek basina tam sokum karari vermek için yeterli degildir.",
          note: "Aynı süre, farkli hava ve kür kosullarinda farkli sonuc uretir.",
        },
        {
          title: "Aciklik etkisini oku",
          result: "5,5 m aciklik, ozellikle alt destek kaldirilirken sehim acisindan dikkatli okunmalidir.",
          note: "Kısa acikliktaki davranis ile aynı kabul edilmemelidir.",
        },
        {
          title: "Reshoring kararini yorumla",
          result: "Yan kalıp sokulebilir olsa bile alt desteklerin kademeli veya kismi birakilmasi daha güvenli bir yaklasim olabilir.",
          note: "Sokum ve tam yük devri aynı anda yapilmak zorunda degildir.",
        },
      ],
      checks: [
        "Takvim verisi ile teknik kabul birbirine karistirilmamalidir.",
        "Aciklik arttikca reshoring kararlari daha kritik hale gelir.",
        "Bir sonraki kat yükü gelecekse alttaki destek plani yeniden okunmalidir.",
        "Sokum sonrasi gozlem, karari dogrulayan ikinci asamadir.",
      ],
      engineeringComment: "Kalıp sokumunda en pahali hata, betonun hazir oldugunu takvimden varsaymaktir.",
    },
    tools: FORMWORK_TOOLS,
    equipmentAndMaterials: FORMWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Kalıp sokumunu sadece gun sayisina baglamak.", correct: "Eleman tipi, kür ve erken yas davranisini birlikte degerlendirmek." },
      { wrong: "Yan kalıp ile alt destek sokumunu aynı karar gibi görmek.", correct: "Yük transferi mantigina göre ayri ayri planlamak." },
      { wrong: "Reshoring ihtiyacini zaman kaybi saymak.", correct: "Kalici sehim ve çatlak riskini azaltan teknik araç olarak kullanmak." },
      { wrong: "Sokum sonrasi davranisi izlememek.", correct: "Ilk gunlerde sehim ve çatlak gozlemini zorunlu kontrol yapmak." },
      { wrong: "Üst kat malzeme yükünü alttaki genc betondan bağımsız dusunmek.", correct: "Kat cevrimini düşey yük zinciri olarak birlikte yonetmek." },
      { wrong: "Aliskanlikla verilen sokum kararini teknik veri yerine koymak.", correct: "Saha verisini ve proje disiplinini kararin merkezine almak." },
    ],
    designVsField: [
      "Projede kalıp sokumu cogu zaman kısa notlarla gecer; sahada ise yukunun ne zaman gercekten betona aktarilacagina karar verilir.",
      "Kalibin sokulmesi isin bittigi an değil, betonun kendi basina calismaya basladigi en hassas geçiş anidir.",
      "Bu nedenle kalıp sokumu, kaba insaatta gorunmeyen ama en çok sonuc ureten karar asamalarindan biridir.",
    ],
    conclusion: [
      "Kalıp sokumu doğru veri, doğru sıra ve doğru reshoring disipliniyle yurutuldugunde kat cevrimi güvenli ilerler ve eleman geometrisi korunur. Aynı iş yalnız takvime göre yurutuldugunde gorunmeyen yapisal kalite kaybi uretme riski tasir.",
      "Saha tarafinda en sağlam yaklasim, kalıp sokumunu panel alma isi değil yük devri yönetimi olarak görmek ve tüm kararlari bu bakisla vermektir. Bu yaklasim, uzun vadeli sehim ve çatlak riskini ciddi bicimde azaltir.",
    ],
    sources: [...KABA_FORMWORK_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalıp sokumu", "reshoring", "erken yas beton", "yük transferi", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/kalip-isleri", "kaba-insaat/kalip-isleri/doseme-kalibi"],
  },
];
