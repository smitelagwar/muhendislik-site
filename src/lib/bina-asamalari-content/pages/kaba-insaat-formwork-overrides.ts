import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_FORMWORK_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const FORMWORK_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Kalip, iskele ve sokum sirasi paftalari", purpose: "Kurulumdan sokume kadar yuku ve sirayi sahada okunabilir hale getirmek." },
  { category: "Ölçüm", name: "Lazer nivo, deformasyon ve sehim takip listesi", purpose: "Kalip geometrisini ve sokum sonrasi davranisi kontrollu izlemek." },
  { category: "Planlama", name: "Kat cevrimi ve reshoring cizelgesi", purpose: "Betonun erken yas davranisini takvim baskisindan ayirarak yonetmek." },
  { category: "Kontrol", name: "Beton öncesi ve sokum öncesi checklist", purpose: "Kalip kabulunu ve kalip sokum kararini kisilere degil standarda baglamak." },
];

const FORMWORK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Panel kalip, H20 kiris, ahşap kusak ve dikme sistemi", purpose: "Taze beton, isci ve ekipman yuklerini guvenle tasimak.", phase: "Kurulum" },
  { group: "Bağlantı", name: "Tij, kilit, kusak, kama ve destek elemanlari", purpose: "Kalip rijitligini ve geometri surekliligini korumak.", phase: "Montaj ve sıkma" },
  { group: "Ölçüm", name: "Kot civi, şakul, metre, total station ve lazer seti", purpose: "Kalip alt kötü, duzlem ve şakul dogrulugunu izlemek.", phase: "Ölçüm ve kabul" },
  { group: "Güvenlik", name: "Reshoring dikmeleri, platform ve kenar koruma ekipmanlari", purpose: "Sokum sonrasi yuk transferini ve saha guvenligini yonetmek.", phase: "Sokum ve sonrasi" },
];

export const kabaInsaatFormworkOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/kalip-isleri",
    kind: "topic",
    quote: "Kalip isleri, betonu tasiyan gecici bir aparat degil; taşıyıcı sistemin gercek geometrisini sahada ureten ilk muhendislik katmanidir.",
    tip: "Kalibi yalnız panel kurulum hizi olarak yonetirsen, geometri, betonlama ve bitis kalitesi arasindaki zinciri daha dokum gunu kirarsin.",
    intro: [
      "Kalip isleri, betonarme yapida projedeki kesit, aks ve kot bilgilerini sahada fiziksel geometriye donusturen ana fazdir. Kolon, kiris, doseme, perde ve aciklik detaylarinin hepsi once kalipta gerceklesir; beton daha sonra yalnız bu geometrinin icini doldurur. Bu nedenle kalip kalitesi, beton kalitesinden once gelen bir dogruluk problemidir.",
      "Sahada en sık gorulen yanilgi, kalip islerini yalnız panel kurma ve sokme operasyonu gibi okumaktir. Oysa kalip, geometri, rijitlik, destek duzeni, rezervasyon, güvenlik ve sonraki imalatlarin referansi gibi birden fazla fonksiyonu aynı anda tasir. Bu fonksiyonlardan biri ihmal edildiginde hata genellikle kalip kapanirken degil, beton sertlestikten sonra görünür olur.",
      "Bir insaat muhendisi için kalip isi; beton gelmeden once kesitin doğru olup olmadigini, beton gelirken bu dogrulugun korunup korunmayacagini ve beton sonrasi sokumla bir sonraki kata guvenli gecilip gecilemeyecegini yonetmek demektir. Bu yuzden kalip, kurulan degil izlenen bir sistemdir.",
      "Kalip islerini zayif yoneten sahalarda aynı anda birden fazla sorun ortaya cikar: kolonlar eksenden kacar, kiris alt kötü bozulur, dosemede dalga olusur, beton yuzeyi peteklenir ya da rezervasyonlar sonradan kirma ihtiyaci dogurur. Hepsinin kokunde cogu zaman aynı problem vardir: kalip fazi muhendislik olarak degil, rutin iscilik olarak ele alinmistir.",
    ],
    theory: [
      "Kalip sistemleri, taze betonun hidrostatik ve operasyonel yukleri altinda sekil degistirmeden kalabilmelidir. Bu gereklilik, yalnız panel saglamligi degil; tij, kusak, alt taşıyıcı, dikme ve taban oturumunun birlikte calismasi anlamina gelir. Saglam gorunen ama dengesiz oturan bir sistem, beton baskisi altinda beklenenden fazla hareket edebilir.",
      "Kalip islerinin ikinci temel rolu geometri uretmektir. Bir kolonun ekseni, bir kirisin alt kötü, bir dosemenin duzlemi ve bir boslugun net olcusu kalipta belirlenir. Bu geometri bozulursa, donati kalitesi doğru olsa bile yapisal ve mimari sonuc birlikte etkilenir. Dolayisiyla kalip, statik ve mimari disiplinlerin sahadaki ortak ara yuzudur.",
      "Ayrıca kalip isleri betonlama ile ayrilmaz bag icindedir. Betonun nereden verilecegi, hangi hizla ilerleyecegi, vibratorun nasil calisacagi ve yedek ekipmanin nerede olacagi kalip davranisini etkiler. Kalip projesi ile betonlama plani birbirinden bagimsiz dusunulemez.",
      "Kalip sistemlerinde sokum ve reshoring de teorinin parcasidir. Beton yeterli erken yas dayanimi ve rijitligine ulasmadan kalibi almak, daha once doğru kurulan sistemi sonradan riskli hale getirebilir. Bu nedenle kalip isi, montaj kadar sokum kararlariyla da muhendislik niteligi tasir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve tolerans",
        limitOrRequirement: "Aks, kot, kesit boyutu ve bosluklar beton öncesi olculerek dogrulanmali",
        reference: "TS EN 13670 uygulama prensipleri",
        note: "Olculmeyen kalip, doğru kabul edilemez.",
      },
      {
        parameter: "Rijitlik ve taşıyıcı duzen",
        limitOrRequirement: "Panel, tij, kusak ve alt destekler taze beton yukune uygun kurulmali",
        reference: "Kalip tasarim disiplini + TS EN 13670",
        note: "Kalip varligi ile kalip yeterliligi aynı sey degildir.",
      },
      {
        parameter: "Rezervasyon ve gomulu detaylar",
        limitOrRequirement: "Tesisat bosluklari, embed ve filiz detaylari kalip kapanmadan netlestirilmeli",
        reference: "Shop drawing + saha koordinasyon turu",
        note: "Sonradan delik acmak geometri ve dayanimi bozar.",
      },
      {
        parameter: "Betonlama uyumu",
        limitOrRequirement: "Beton dokum hizi ve kalip davranisi birlikte yonetilmeli",
        reference: "Betonlama kalite plani",
        note: "Hiz baskisi, kalip guvenligini tek basina zayiflatabilir.",
      },
      {
        parameter: "Sokum ve reshoring",
        limitOrRequirement: "Kalip ve tali destekler, betonun erken yas davranisina göre planli kaldirilmali",
        reference: "TS EN 13670 + kat cevrimi plani",
        note: "Erken sokum, gorunmeyen sehim ve catlak riski uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Kalip paftasi, akslar, rezervasyonlar ve bitis kotlarini uygulama öncesi ekiple birlikte oku.",
      "Panel, alt taşıyıcı ve dikme duzenini aciklik, kesit ve dokum yukune göre kur; taban oturumunu ihmal etme.",
      "Beton öncesi son turda aks, şakul, alt kot, kesit ve bosluk dogrulugunu olcerek kapat.",
      "Dokum planini kalip rijitligiyle uyumlu hale getir; hiz gerektiren her kararda kalip davranisini once dusun.",
      "Kalip acma sonrasi kusurlari bir sonraki kalip kurulumuna geri bildirim olarak kullan.",
      "Sokum ve reshoring kararlarini takvim refleksiyle degil, teknik kabul ve saha verisiyle ver.",
    ],
    criticalChecks: [
      "Aks, kot ve kesit olculeri beton öncesi gercekten alinmis mi?",
      "Alt destek duzeni ve taban oturumu yuk aktarimini saglikli tasiyor mu?",
      "Rezervasyonlar ve gomulu detaylar kalip kapanmadan once dogrulandi mi?",
      "Dokum hizina bagli yanak acilmasi veya alt kot kaybi riski var mi?",
      "Kalip acma kusurlari sonraki katta aynen tekrar ediyor mu?",
      "Sokum karari, betonun durumundan bagimsiz yalnız takvime göre mi veriliyor?",
    ],
    numericalExample: {
      title: "8,0 x 6,0 m doseme parcasinda taze beton yuk yorumu",
      inputs: [
        { label: "Doseme kalinligi", value: "14 cm", note: "Tipik kat dosemesi" },
        { label: "Taze beton birim hacim agirligi", value: "25 kN/m3", note: "Yaklasik saha degeri" },
        { label: "Alan", value: "48 m2", note: "8 x 6 m panel alani" },
        { label: "Hedef", value: "Alt taşıyıcı mantigini okumak", note: "Kalip kurulum karari için" },
      ],
      assumptions: [
        "Donati ve isci yukleri için ilave emniyet payi ayri degerlendirilir.",
        "Alt taşıyıcı sistem yukleri dikmelere dengeli dagitacak sekilde kurulmustur.",
        "Taban zemini oturma riskine karsi kontrol edilmistir.",
      ],
      steps: [
        {
          title: "Betonun birim alan yukunu hesapla",
          formula: "0,14 x 25 = 3,50 kN/m2",
          result: "Yalnız taze beton yuku yaklasik 3,50 kN/m2 olur.",
          note: "Bu deger, kalip ve canli yapim yukleri eklenmeden onceki temel referanstir.",
        },
        {
          title: "Toplam beton yukunu yorumla",
          formula: "48 x 3,50 = 168 kN",
          result: "Sadece beton olarak bu panel parçası yaklasik 168 kN yuk uretir.",
          note: "Bu buyukluk, kalibin neden yalnız gozle degil yuk mantigiyla kurulmasi gerektigini gosterir.",
        },
        {
          title: "Kalip kararina etkisini bagla",
          result: "Dikme araligi, alt taşıyıcı yonu ve taban plakalari bu yuk seviyesine göre disiplinli kurulmalidir.",
          note: "Küçük gorunen destek ihmali genis alanda buyuyen sehim uretebilir.",
        },
      ],
      checks: [
        "Yuk hesabi kalip kurulumunu hiz isi olmaktan cikarip muhendislik kararina donusturur.",
        "Toplam alan buyudukce küçük kot farklari ve oturma etkileri onem kazanir.",
        "Kalip tasarımı, yalnız panel sayisi degil yuk akisi mantigiyla okunmalidir.",
        "Dokum plani bu tasima mantigina aykiri hiz baskisi olusturmamalidir.",
      ],
      engineeringComment: "Kalip islerinde asil gorunmeyen sey panel degil, o panelin altinda dolasan yuktur.",
    },
    tools: FORMWORK_TOOLS,
    equipmentAndMaterials: FORMWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Kalibi yalnız panel adedi ve kurulum hizina göre degerlendirmek.", correct: "Geometri, yuk ve sonraki imalat etkisini birlikte okumak." },
      { wrong: "Beton öncesi ölçü almadan dokuma gecmek.", correct: "Aks, kot ve kesit kabulunu yazili ve olculu tamamlamak." },
      { wrong: "Rezervasyonlari son dakika sahada cozmek.", correct: "Embed ve bosluk detaylarini kalip kapanmadan once kapatmak." },
      { wrong: "Kalip kusurunu yalnız beton yüzey hatasi sanmak.", correct: "Bitis kötü ve diger disiplinlere etkisini de sorgulamak." },
      { wrong: "Sokumu takvim baskisiyla yapmak.", correct: "Betonun erken yas davranisini ve reshoring ihtiyacini teknik veriyle degerlendirmek." },
      { wrong: "Her katta aynı hatayi tekrar etmek.", correct: "Kalip acma gozlemlerini sonraki kurulumun geri bildirimi haline getirmek." },
    ],
    designVsField: [
      "Projede kalip isleri cizim ve kesit notlariyla tarif edilir; sahada ise bu tarif, yuk tasiyan ve geometri ureten fiziksel sisteme donusur.",
      "Iyi kalip, beton gelmeden once doğru gorunen ve beton geldikten sonra da dogrulugunu koruyan kaliptir.",
      "Bu nedenle kalip isleri, kaba insaatin en görünmez ama en belirleyici kalite kapilarindan biridir.",
    ],
    conclusion: [
      "Kalip isleri doğru geometri, doğru rijitlik ve doğru sokum karari ile yonetildiginde taşıyıcı sistem projedeki davranisina daha yakin uretilir. Zayif yonetildiginde ise hata yalnız beton yuzeyinde degil, tüm kat geometrisinde dolasir.",
      "Saha acisindan en doğru yaklasim, kalibi montaj kalemi degil yuk, tolerans ve teslim zinciri olarak okumaktir. Bu bakis hem yapisal kaliteyi hem de sonraki imalatlarin hizini belirgin bicimde iyilestirir.",
    ],
    sources: [...KABA_FORMWORK_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalip isleri", "kalip kabulu", "geometri kontrolu", "reshoring", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/kalip-isleri/kolon-kalibi", "kaba-insaat/kalip-isleri/kalip-sokumu"],
  },
  {
    slugPath: "kaba-insaat/kalip-isleri/kalip-sokumu",
    kind: "topic",
    quote: "Kalip sokumu, paneli yerinden almak degil; yuk transferinin hangi anda ve hangi riskle betona devredilecegini yonetmektir.",
    tip: "Kalip sokumunu sadece takvim hizlandirma araci gibi gormek, betonun erken yas davranisini ihmal edip gorunmeyen hasari bizzat uretmek demektir.",
    intro: [
      "Kalip sokumu, santiyede en yanlış anlasilan kalip asamalarindan biridir. Kurulum görünür ve yoğun emek ister; buna karsilik sokum genellikle 'iş bitti' algisi yarattigi için daha basit sanilir. Oysa gercekte en hassas kararlardan biri burada verilir: beton, gecici taşıyıcı sistemden ayrildiginda yuku guvenle devralabilecek durumda midir?",
      "Sahada en sık yapilan hata, kalip sokumunu yalnız sure kazanci uzerinden degerlendirmektir. Kat cevrimi hizlandikca sokum baskisi artar; ancak betonun erken yas dayanimi, eleman acikligi, hava kosullari, kalip tipi ve reshoring gereksinimi birlikte dusunulmeden verilen kararlar gorunmeyen sehim, catlak veya uzun vadeli deformasyon riski uretir.",
      "Bir insaat muhendisi için kalip sokumu, yalnız ustanin panel sokmesi degil; betonun olgunlasma davranisini okumak, hangi elemanda ne zaman tali destek birakilacagini belirlemek ve bir sonraki katin yukunu guvenli yonetmek anlamina gelir.",
      "Bu nedenle kalip sokumu, beton dokumunun bittigi gun baslayan ama cogu zaman yeterince planlanmayan ayri bir muhendislik asamasidir.",
    ],
    theory: [
      "Beton, dokuldugu anda nihai tasima kapasitesine ulasmaz. Erken yasta dayanim ve rijitlik kazanir, fakat bu kazanim sıcaklık, kur, cimento tipi, karisim ozellikleri ve eleman boyutlarina göre degisir. Bu nedenle tek bir takvim kuralini tüm elemanlara kor bicimde uygulamak doğru degildir. Kolon yanagi ile genis aciklikli doseme alt destegi aynı anda degerlendirilemez.",
      "Kalip sokumunda iki kavram ayrilmalidir: kalibin alinmasi ve yukunun gercekten betona devri. Bir elemanin yan kaliplarinin alinmasiyla alt desteklerin kaldirilmasi aynı risk seviyesinde degildir. Ozellikle kiris ve dosemelerde reshoring veya tali destek, beton yuk tasimaya alisana kadar emniyetli geçiş saglar.",
      "Erken sokumun riski yalnız ani gocme degildir. Daha sinsi ve daha yaygin risk, kalici sehim, sacaklanmis catlaklar, tavan dalgasi ve sonraki kaplama islerinde ortaya cikan geometri kaybidir. Bu nedenle zarar cogu zaman aynı gun degil, haftalar sonra fark edilir.",
      "Kalip sokum karari, betonun test sonuclari, kur kosullari, hava sicakligi, aciklik uzunlugu ve eleman tipi birlikte okunarak verilmelidir. Yani sokum, aliskanlik degil veri odakli bir karar sureci olmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Eleman tipine göre sokum",
        limitOrRequirement: "Kolon, perde, kiris ve doseme için aynı sokum mantigi uygulanmamali",
        reference: "TS EN 13670 + saha teknik plani",
        note: "Yanal kalip sokumu ile alt destek sokumu birbirinden ayrilmalidir.",
      },
      {
        parameter: "Erken yas beton davranisi",
        limitOrRequirement: "Sokum karari betonun dayanim ve kur durumuna göre verilmeli",
        reference: "TS 500 + TS EN 13670",
        note: "Takvim bilgisi, teknik kabulun yerini alamaz.",
      },
      {
        parameter: "Reshoring ve tali destek",
        limitOrRequirement: "Aciklik ve üst kat yukune göre gerekli tali destekler planli birakilmali",
        reference: "Kat cevrimi ve kalip plani",
        note: "Kalibi almak, tüm destegi aynı anda kaldirmak demek degildir.",
      },
      {
        parameter: "Hava ve kur etkisi",
        limitOrRequirement: "Soğuk, ruzgarli veya asiri sıcak havada sokum karari ayri degerlendirilmelidir",
        reference: "Beton kur ve saha gozlem plani",
        note: "Aynı gun sayisi farkli hava kosulunda aynı davranisi uretmez.",
      },
      {
        parameter: "Sokum sonrasi izleme",
        limitOrRequirement: "Sokumden sonra sehim, catlak ve yüzey davranisi gozlenerek kayıt altina alinmali",
        reference: "Saha kalite kontrol plani",
        note: "Sokum karari, sokum aniyla bitmez; sonraki davranisla dogrulanir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine göre hangi kalip elemaninin ne zaman alinacagini ve hangi desteklerin kalacagini yazili planla tanimla.",
      "Betonun dokum tarihi, kur sarti, hava durumu ve varsa erken yas dayanim verisini sokum karariyla birlikte degerlendir.",
      "Yan kalip, alt kalip ve reshoring kararlarini birbirinden ayir; hepsini aynı anda sokme refleksinden kacin.",
      "Sokum ekibine yalnız tarih degil, sirali islem adimi ver; panel alma, temizleme ve tali destek koruma mantigini aynı planda anlat.",
      "Sokum sonrasi ilk gunlerde eleman yuzeyini, aciklik ortasini ve mesnet davranisini izleyerek sehim veya catlak belirtisini kontrol et.",
      "Bir sonraki kat yuku ya da malzeme istifi gelmeden once alttaki elemanin tasima duzenini yeniden gözden gecir.",
    ],
    criticalChecks: [
      "Sokum karari eleman tipine göre ayristirildi mi?",
      "Betonun erken yas durumu ve kur kosullari fiilen degerlendirildi mi?",
      "Alt desteklerin hangisinin kalacagi, hangisinin kaldirilacagi sahada acik mi?",
      "Sokum sonrasi aciklik ortasinda ani sehim veya tavan dalgasi belirtisi var mi?",
      "Bir sonraki katin yuku alttaki reshoring planini bozuyor mu?",
      "Sokum kararlari yalnız aliskanlikla mi yoksa veriyle mi veriliyor?",
    ],
    numericalExample: {
      title: "5,5 m aciklikli dosemede reshoring yorumu",
      inputs: [
        { label: "Doseme acikligi", value: "5,5 m", note: "Konut kat dosemeleri" },
        { label: "Doseme kalinligi", value: "14 cm", note: "Ornek betonarme doseme" },
        { label: "Dokumden sonra gecen sure", value: "7 gun", note: "Takvim bilgisi" },
        { label: "Hedef", value: "Alt destegin tamamen alinip alinmayacagini yorumlamak", note: "Saha karari için" },
      ],
      assumptions: [
        "Hava kosullari ideal kabul edilmemektedir; saha sicakligi degisken olabilir.",
        "Kesin karar için proje ekibinin kullandigi dayanim verisi ve kur bilgisi ayrıca bulunacaktir.",
        "Yuksek kat cevrimi nedeniyle ustten yeni yuk gelme ihtimali vardir.",
      ],
      steps: [
        {
          title: "Takvim bilgisini tek basina sorgula",
          result: "7 gun bilgisi tek basina tam sokum karari vermek için yeterli degildir.",
          note: "Aynı sure, farkli hava ve kur kosullarinda farkli sonuc uretir.",
        },
        {
          title: "Aciklik etkisini oku",
          result: "5,5 m aciklik, ozellikle alt destek kaldirilirken sehim acisindan dikkatli okunmalidir.",
          note: "Kısa acikliktaki davranis ile aynı kabul edilmemelidir.",
        },
        {
          title: "Reshoring kararini yorumla",
          result: "Yan kalip sokulebilir olsa bile alt desteklerin kademeli veya kismi birakilmasi daha guvenli bir yaklasim olabilir.",
          note: "Sokum ve tam yuk devri aynı anda yapilmak zorunda degildir.",
        },
      ],
      checks: [
        "Takvim verisi ile teknik kabul birbirine karistirilmamalidir.",
        "Aciklik arttikca reshoring kararlari daha kritik hale gelir.",
        "Bir sonraki kat yuku gelecekse alttaki destek plani yeniden okunmalidir.",
        "Sokum sonrasi gozlem, karari dogrulayan ikinci asamadir.",
      ],
      engineeringComment: "Kalip sokumunda en pahali hata, betonun hazir oldugunu takvimden varsaymaktir.",
    },
    tools: FORMWORK_TOOLS,
    equipmentAndMaterials: FORMWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Kalip sokumunu sadece gun sayisina baglamak.", correct: "Eleman tipi, kur ve erken yas davranisini birlikte degerlendirmek." },
      { wrong: "Yan kalip ile alt destek sokumunu aynı karar gibi gormek.", correct: "Yuk transferi mantigina göre ayri ayri planlamak." },
      { wrong: "Reshoring ihtiyacini zaman kaybi saymak.", correct: "Kalici sehim ve catlak riskini azaltan teknik araç olarak kullanmak." },
      { wrong: "Sokum sonrasi davranisi izlememek.", correct: "Ilk gunlerde sehim ve catlak gozlemini zorunlu kontrol yapmak." },
      { wrong: "Üst kat malzeme yukunu alttaki genc betondan bagimsiz dusunmek.", correct: "Kat cevrimini düşey yuk zinciri olarak birlikte yonetmek." },
      { wrong: "Aliskanlikla verilen sokum kararini teknik veri yerine koymak.", correct: "Saha verisini ve proje disiplinini kararin merkezine almak." },
    ],
    designVsField: [
      "Projede kalip sokumu cogu zaman kısa notlarla gecer; sahada ise yukunun ne zaman gercekten betona aktarilacagina karar verilir.",
      "Kalibin sokulmesi isin bittigi an degil, betonun kendi basina calismaya basladigi en hassas geçiş anidir.",
      "Bu nedenle kalip sokumu, kaba insaatta gorunmeyen ama en çok sonuc ureten karar asamalarindan biridir.",
    ],
    conclusion: [
      "Kalip sokumu doğru veri, doğru sira ve doğru reshoring disipliniyle yurutuldugunde kat cevrimi guvenli ilerler ve eleman geometrisi korunur. Aynı iş yalnız takvime göre yurutuldugunde gorunmeyen yapisal kalite kaybi uretme riski tasir.",
      "Saha tarafinda en saglam yaklasim, kalip sokumunu panel alma isi degil yuk devri yonetimi olarak gormek ve tüm kararlari bu bakisla vermektir. Bu yaklasim, uzun vadeli sehim ve catlak riskini ciddi bicimde azaltir.",
    ],
    sources: [...KABA_FORMWORK_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalip sokumu", "reshoring", "erken yas beton", "yuk transferi", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/kalip-isleri", "kaba-insaat/kalip-isleri/doseme-kalibi"],
  },
];
