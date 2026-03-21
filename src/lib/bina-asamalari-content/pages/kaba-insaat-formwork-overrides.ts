import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_FORMWORK_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const FORMWORK_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Kalip, iskele ve sokum sirasi paftalari", purpose: "Kurulumdan sokume kadar yuku ve sirayi sahada okunabilir hale getirmek." },
  { category: "Olcum", name: "Lazer nivo, deformasyon ve sehim takip listesi", purpose: "Kalip geometrisini ve sokum sonrasi davranisi kontrollu izlemek." },
  { category: "Planlama", name: "Kat cevrimi ve reshoring cizelgesi", purpose: "Betonun erken yas davranisini takvim baskisindan ayirarak yonetmek." },
  { category: "Kontrol", name: "Beton oncesi ve sokum oncesi checklist", purpose: "Kalip kabulunu ve kalip sokum kararini kisilere degil standarda baglamak." },
];

const FORMWORK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Tasiyici", name: "Panel kalip, H20 kiris, ahsap kusak ve dikme sistemi", purpose: "Taze beton, isci ve ekipman yuklerini guvenle tasimak.", phase: "Kurulum" },
  { group: "Baglanti", name: "Tij, kilit, kusak, kama ve destek elemanlari", purpose: "Kalip rijitligini ve geometri surekliligini korumak.", phase: "Montaj ve sikma" },
  { group: "Olcum", name: "Kot civi, sakul, metre, total station ve lazer seti", purpose: "Kalip alt kotu, duzlem ve sakul dogrulugunu izlemek.", phase: "Olcum ve kabul" },
  { group: "Guvenlik", name: "Reshoring dikmeleri, platform ve kenar koruma ekipmanlari", purpose: "Sokum sonrasi yuk transferini ve saha guvenligini yonetmek.", phase: "Sokum ve sonrasi" },
];

export const kabaInsaatFormworkOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/kalip-isleri",
    kind: "topic",
    quote: "Kalip isleri, betonu tasiyan gecici bir aparat degil; tasiyici sistemin gercek geometrisini sahada ureten ilk muhendislik katmanidir.",
    tip: "Kalibi yalniz panel kurulum hizi olarak yonetirsen, geometri, betonlama ve bitis kalitesi arasindaki zinciri daha dokum gunu kirarsin.",
    intro: [
      "Kalip isleri, betonarme yapida projedeki kesit, aks ve kot bilgilerini sahada fiziksel geometriye donusturen ana fazdir. Kolon, kiris, doseme, perde ve aciklik detaylarinin hepsi once kalipta gerceklesir; beton daha sonra yalniz bu geometrinin icini doldurur. Bu nedenle kalip kalitesi, beton kalitesinden once gelen bir dogruluk problemidir.",
      "Sahada en sik gorulen yanilgi, kalip islerini yalniz panel kurma ve sokme operasyonu gibi okumaktir. Oysa kalip, geometri, rijitlik, destek duzeni, rezervasyon, guvenlik ve sonraki imalatlarin referansi gibi birden fazla fonksiyonu ayni anda tasir. Bu fonksiyonlardan biri ihmal edildiginde hata genellikle kalip kapanirken degil, beton sertlestikten sonra gorunur olur.",
      "Bir insaat muhendisi icin kalip isi; beton gelmeden once kesitin dogru olup olmadigini, beton gelirken bu dogrulugun korunup korunmayacagini ve beton sonrasi sokumla bir sonraki kata guvenli gecilip gecilemeyecegini yonetmek demektir. Bu yuzden kalip, kurulan degil izlenen bir sistemdir.",
      "Kalip islerini zayif yoneten sahalarda ayni anda birden fazla sorun ortaya cikar: kolonlar eksenden kacar, kiris alt kotu bozulur, dosemede dalga olusur, beton yuzeyi peteklenir ya da rezervasyonlar sonradan kirma ihtiyaci dogurur. Hepsinin kokunde cogu zaman ayni problem vardir: kalip fazi muhendislik olarak degil, rutin iscilik olarak ele alinmistir.",
    ],
    theory: [
      "Kalip sistemleri, taze betonun hidrostatik ve operasyonel yukleri altinda sekil degistirmeden kalabilmelidir. Bu gereklilik, yalniz panel saglamligi degil; tij, kusak, alt tasiyici, dikme ve taban oturumunun birlikte calismasi anlamina gelir. Saglam gorunen ama dengesiz oturan bir sistem, beton baskisi altinda beklenenden fazla hareket edebilir.",
      "Kalip islerinin ikinci temel rolu geometri uretmektir. Bir kolonun ekseni, bir kirisin alt kotu, bir dosemenin duzlemi ve bir boslugun net olcusu kalipta belirlenir. Bu geometri bozulursa, donati kalitesi dogru olsa bile yapisal ve mimari sonuc birlikte etkilenir. Dolayisiyla kalip, statik ve mimari disiplinlerin sahadaki ortak ara yuzudur.",
      "Ayrica kalip isleri betonlama ile ayrilmaz bag icindedir. Betonun nereden verilecegi, hangi hizla ilerleyecegi, vibratorun nasil calisacagi ve yedek ekipmanin nerede olacagi kalip davranisini etkiler. Kalip projesi ile betonlama plani birbirinden bagimsiz dusunulemez.",
      "Kalip sistemlerinde sokum ve reshoring de teorinin parcasidir. Beton yeterli erken yas dayanimi ve rijitligine ulasmadan kalibi almak, daha once dogru kurulan sistemi sonradan riskli hale getirebilir. Bu nedenle kalip isi, montaj kadar sokum kararlariyla da muhendislik niteligi tasir.",
    ],
    ruleTable: [
      {
        parameter: "Geometri ve tolerans",
        limitOrRequirement: "Aks, kot, kesit boyutu ve bosluklar beton oncesi olculerek dogrulanmali",
        reference: "TS EN 13670 uygulama prensipleri",
        note: "Olculmeyen kalip, dogru kabul edilemez.",
      },
      {
        parameter: "Rijitlik ve tasiyici duzen",
        limitOrRequirement: "Panel, tij, kusak ve alt destekler taze beton yukune uygun kurulmali",
        reference: "Kalip tasarim disiplini + TS EN 13670",
        note: "Kalip varligi ile kalip yeterliligi ayni sey degildir.",
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
        limitOrRequirement: "Kalip ve tali destekler, betonun erken yas davranisina gore planli kaldirilmali",
        reference: "TS EN 13670 + kat cevrimi plani",
        note: "Erken sokum, gorunmeyen sehim ve catlak riski uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Kalip paftasi, akslar, rezervasyonlar ve bitis kotlarini uygulama oncesi ekiple birlikte oku.",
      "Panel, alt tasiyici ve dikme duzenini aciklik, kesit ve dokum yukune gore kur; taban oturumunu ihmal etme.",
      "Beton oncesi son turda aks, sakul, alt kot, kesit ve bosluk dogrulugunu olcerek kapat.",
      "Dokum planini kalip rijitligiyle uyumlu hale getir; hiz gerektiren her kararda kalip davranisini once dusun.",
      "Kalip acma sonrasi kusurlari bir sonraki kalip kurulumuna geri bildirim olarak kullan.",
      "Sokum ve reshoring kararlarini takvim refleksiyle degil, teknik kabul ve saha verisiyle ver.",
    ],
    criticalChecks: [
      "Aks, kot ve kesit olculeri beton oncesi gercekten alinmis mi?",
      "Alt destek duzeni ve taban oturumu yuk aktarimini saglikli tasiyor mu?",
      "Rezervasyonlar ve gomulu detaylar kalip kapanmadan once dogrulandi mi?",
      "Dokum hizina bagli yanak acilmasi veya alt kot kaybi riski var mi?",
      "Kalip acma kusurlari sonraki katta aynen tekrar ediyor mu?",
      "Sokum karari, betonun durumundan bagimsiz yalniz takvime gore mi veriliyor?",
    ],
    numericalExample: {
      title: "8,0 x 6,0 m doseme parcasinda taze beton yuk yorumu",
      inputs: [
        { label: "Doseme kalinligi", value: "14 cm", note: "Tipik kat dosemesi" },
        { label: "Taze beton birim hacim agirligi", value: "25 kN/m3", note: "Yaklasik saha degeri" },
        { label: "Alan", value: "48 m2", note: "8 x 6 m panel alani" },
        { label: "Hedef", value: "Alt tasiyici mantigini okumak", note: "Kalip kurulum karari icin" },
      ],
      assumptions: [
        "Donati ve isci yukleri icin ilave emniyet payi ayri degerlendirilir.",
        "Alt tasiyici sistem yukleri dikmelere dengeli dagitacak sekilde kurulmustur.",
        "Taban zemini oturma riskine karsi kontrol edilmistir.",
      ],
      steps: [
        {
          title: "Betonun birim alan yukunu hesapla",
          formula: "0,14 x 25 = 3,50 kN/m2",
          result: "Yalniz taze beton yuku yaklasik 3,50 kN/m2 olur.",
          note: "Bu deger, kalip ve canli yapim yukleri eklenmeden onceki temel referanstir.",
        },
        {
          title: "Toplam beton yukunu yorumla",
          formula: "48 x 3,50 = 168 kN",
          result: "Sadece beton olarak bu panel parcasi yaklasik 168 kN yuk uretir.",
          note: "Bu buyukluk, kalibin neden yalniz gozle degil yuk mantigiyla kurulmasi gerektigini gosterir.",
        },
        {
          title: "Kalip kararina etkisini bagla",
          result: "Dikme araligi, alt tasiyici yonu ve taban plakalari bu yuk seviyesine gore disiplinli kurulmalidir.",
          note: "Kucuk gorunen destek ihmali genis alanda buyuyen sehim uretebilir.",
        },
      ],
      checks: [
        "Yuk hesabi kalip kurulumunu hiz isi olmaktan cikarip muhendislik kararina donusturur.",
        "Toplam alan buyudukce kucuk kot farklari ve oturma etkileri onem kazanir.",
        "Kalip tasarimi, yalniz panel sayisi degil yuk akisi mantigiyla okunmalidir.",
        "Dokum plani bu tasima mantigina aykiri hiz baskisi olusturmamalidir.",
      ],
      engineeringComment: "Kalip islerinde asil gorunmeyen sey panel degil, o panelin altinda dolasan yuktur.",
    },
    tools: FORMWORK_TOOLS,
    equipmentAndMaterials: FORMWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Kalibi yalniz panel adedi ve kurulum hizina gore degerlendirmek.", correct: "Geometri, yuk ve sonraki imalat etkisini birlikte okumak." },
      { wrong: "Beton oncesi olcu almadan dokuma gecmek.", correct: "Aks, kot ve kesit kabulunu yazili ve olculu tamamlamak." },
      { wrong: "Rezervasyonlari son dakika sahada cozmek.", correct: "Embed ve bosluk detaylarini kalip kapanmadan once kapatmak." },
      { wrong: "Kalip kusurunu yalniz beton yuzey hatasi sanmak.", correct: "Bitis kotu ve diger disiplinlere etkisini de sorgulamak." },
      { wrong: "Sokumu takvim baskisiyla yapmak.", correct: "Betonun erken yas davranisini ve reshoring ihtiyacini teknik veriyle degerlendirmek." },
      { wrong: "Her katta ayni hatayi tekrar etmek.", correct: "Kalip acma gozlemlerini sonraki kurulumun geri bildirimi haline getirmek." },
    ],
    designVsField: [
      "Projede kalip isleri cizim ve kesit notlariyla tarif edilir; sahada ise bu tarif, yuk tasiyan ve geometri ureten fiziksel sisteme donusur.",
      "Iyi kalip, beton gelmeden once dogru gorunen ve beton geldikten sonra da dogrulugunu koruyan kaliptir.",
      "Bu nedenle kalip isleri, kaba insaatin en gorunmez ama en belirleyici kalite kapilarindan biridir.",
    ],
    conclusion: [
      "Kalip isleri dogru geometri, dogru rijitlik ve dogru sokum karari ile yonetildiginde tasiyici sistem projedeki davranisina daha yakin uretilir. Zayif yonetildiginde ise hata yalniz beton yuzeyinde degil, tum kat geometrisinde dolasir.",
      "Saha acisindan en dogru yaklasim, kalibi montaj kalemi degil yuk, tolerans ve teslim zinciri olarak okumaktir. Bu bakis hem yapisal kaliteyi hem de sonraki imalatlarin hizini belirgin bicimde iyilestirir.",
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
      "Kalip sokumu, santiyede en yanlis anlasilan kalip asamalarindan biridir. Kurulum gorunur ve yogun emek ister; buna karsilik sokum genellikle 'is bitti' algisi yarattigi icin daha basit sanilir. Oysa gercekte en hassas kararlardan biri burada verilir: beton, gecici tasiyici sistemden ayrildiginda yuku guvenle devralabilecek durumda midir?",
      "Sahada en sik yapilan hata, kalip sokumunu yalniz sure kazanci uzerinden degerlendirmektir. Kat cevrimi hizlandikca sokum baskisi artar; ancak betonun erken yas dayanimi, eleman acikligi, hava kosullari, kalip tipi ve reshoring gereksinimi birlikte dusunulmeden verilen kararlar gorunmeyen sehim, catlak veya uzun vadeli deformasyon riski uretir.",
      "Bir insaat muhendisi icin kalip sokumu, yalniz ustanin panel sokmesi degil; betonun olgunlasma davranisini okumak, hangi elemanda ne zaman tali destek birakilacagini belirlemek ve bir sonraki katin yukunu guvenli yonetmek anlamina gelir.",
      "Bu nedenle kalip sokumu, beton dokumunun bittigi gun baslayan ama cogu zaman yeterince planlanmayan ayri bir muhendislik asamasidir.",
    ],
    theory: [
      "Beton, dokuldugu anda nihai tasima kapasitesine ulasmaz. Erken yasta dayanim ve rijitlik kazanir, fakat bu kazanim sicaklik, kur, cimento tipi, karisim ozellikleri ve eleman boyutlarina gore degisir. Bu nedenle tek bir takvim kuralini tum elemanlara kor bicimde uygulamak dogru degildir. Kolon yanagi ile genis aciklikli doseme alt destegi ayni anda degerlendirilemez.",
      "Kalip sokumunda iki kavram ayrilmalidir: kalibin alinmasi ve yukunun gercekten betona devri. Bir elemanin yan kaliplarinin alinmasiyla alt desteklerin kaldirilmasi ayni risk seviyesinde degildir. Ozellikle kiris ve dosemelerde reshoring veya tali destek, beton yuk tasimaya alisana kadar emniyetli gecis saglar.",
      "Erken sokumun riski yalniz ani gocme degildir. Daha sinsi ve daha yaygin risk, kalici sehim, sacaklanmis catlaklar, tavan dalgasi ve sonraki kaplama islerinde ortaya cikan geometri kaybidir. Bu nedenle zarar cogu zaman ayni gun degil, haftalar sonra fark edilir.",
      "Kalip sokum karari, betonun test sonuclari, kur kosullari, hava sicakligi, aciklik uzunlugu ve eleman tipi birlikte okunarak verilmelidir. Yani sokum, aliskanlik degil veri odakli bir karar sureci olmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Eleman tipine gore sokum",
        limitOrRequirement: "Kolon, perde, kiris ve doseme icin ayni sokum mantigi uygulanmamali",
        reference: "TS EN 13670 + saha teknik plani",
        note: "Yanal kalip sokumu ile alt destek sokumu birbirinden ayrilmalidir.",
      },
      {
        parameter: "Erken yas beton davranisi",
        limitOrRequirement: "Sokum karari betonun dayanim ve kur durumuna gore verilmeli",
        reference: "TS 500 + TS EN 13670",
        note: "Takvim bilgisi, teknik kabulun yerini alamaz.",
      },
      {
        parameter: "Reshoring ve tali destek",
        limitOrRequirement: "Aciklik ve ust kat yukune gore gerekli tali destekler planli birakilmali",
        reference: "Kat cevrimi ve kalip plani",
        note: "Kalibi almak, tum destegi ayni anda kaldirmak demek degildir.",
      },
      {
        parameter: "Hava ve kur etkisi",
        limitOrRequirement: "Soguk, ruzgarli veya asiri sicak havada sokum karari ayri degerlendirilmelidir",
        reference: "Beton kur ve saha gozlem plani",
        note: "Ayni gun sayisi farkli hava kosulunda ayni davranisi uretmez.",
      },
      {
        parameter: "Sokum sonrasi izleme",
        limitOrRequirement: "Sokumden sonra sehim, catlak ve yuzey davranisi gozlenerek kayit altina alinmali",
        reference: "Saha kalite kontrol plani",
        note: "Sokum karari, sokum aniyla bitmez; sonraki davranisla dogrulanir.",
      },
    ],
    designOrApplicationSteps: [
      "Eleman tipine gore hangi kalip elemaninin ne zaman alinacagini ve hangi desteklerin kalacagini yazili planla tanimla.",
      "Betonun dokum tarihi, kur sarti, hava durumu ve varsa erken yas dayanim verisini sokum karariyla birlikte degerlendir.",
      "Yan kalip, alt kalip ve reshoring kararlarini birbirinden ayir; hepsini ayni anda sokme refleksinden kacin.",
      "Sokum ekibine yalniz tarih degil, sirali islem adimi ver; panel alma, temizleme ve tali destek koruma mantigini ayni planda anlat.",
      "Sokum sonrasi ilk gunlerde eleman yuzeyini, aciklik ortasini ve mesnet davranisini izleyerek sehim veya catlak belirtisini kontrol et.",
      "Bir sonraki kat yuku ya da malzeme istifi gelmeden once alttaki elemanin tasima duzenini yeniden gozden gecir.",
    ],
    criticalChecks: [
      "Sokum karari eleman tipine gore ayristirildi mi?",
      "Betonun erken yas durumu ve kur kosullari fiilen degerlendirildi mi?",
      "Alt desteklerin hangisinin kalacagi, hangisinin kaldirilacagi sahada acik mi?",
      "Sokum sonrasi aciklik ortasinda ani sehim veya tavan dalgasi belirtisi var mi?",
      "Bir sonraki katin yuku alttaki reshoring planini bozuyor mu?",
      "Sokum kararlari yalniz aliskanlikla mi yoksa veriyle mi veriliyor?",
    ],
    numericalExample: {
      title: "5,5 m aciklikli dosemede reshoring yorumu",
      inputs: [
        { label: "Doseme acikligi", value: "5,5 m", note: "Konut kat dosemeleri" },
        { label: "Doseme kalinligi", value: "14 cm", note: "Ornek betonarme doseme" },
        { label: "Dokumden sonra gecen sure", value: "7 gun", note: "Takvim bilgisi" },
        { label: "Hedef", value: "Alt destegin tamamen alinip alinmayacagini yorumlamak", note: "Saha karari icin" },
      ],
      assumptions: [
        "Hava kosullari ideal kabul edilmemektedir; saha sicakligi degisken olabilir.",
        "Kesin karar icin proje ekibinin kullandigi dayanim verisi ve kur bilgisi ayrica bulunacaktir.",
        "Yuksek kat cevrimi nedeniyle ustten yeni yuk gelme ihtimali vardir.",
      ],
      steps: [
        {
          title: "Takvim bilgisini tek basina sorgula",
          result: "7 gun bilgisi tek basina tam sokum karari vermek icin yeterli degildir.",
          note: "Ayni sure, farkli hava ve kur kosullarinda farkli sonuc uretir.",
        },
        {
          title: "Aciklik etkisini oku",
          result: "5,5 m aciklik, ozellikle alt destek kaldirilirken sehim acisindan dikkatli okunmalidir.",
          note: "Kisa acikliktaki davranis ile ayni kabul edilmemelidir.",
        },
        {
          title: "Reshoring kararini yorumla",
          result: "Yan kalip sokulebilir olsa bile alt desteklerin kademeli veya kismi birakilmasi daha guvenli bir yaklasim olabilir.",
          note: "Sokum ve tam yuk devri ayni anda yapilmak zorunda degildir.",
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
      { wrong: "Yan kalip ile alt destek sokumunu ayni karar gibi gormek.", correct: "Yuk transferi mantigina gore ayri ayri planlamak." },
      { wrong: "Reshoring ihtiyacini zaman kaybi saymak.", correct: "Kalici sehim ve catlak riskini azaltan teknik arac olarak kullanmak." },
      { wrong: "Sokum sonrasi davranisi izlememek.", correct: "Ilk gunlerde sehim ve catlak gozlemini zorunlu kontrol yapmak." },
      { wrong: "Ust kat malzeme yukunu alttaki genc betondan bagimsiz dusunmek.", correct: "Kat cevrimini dusey yuk zinciri olarak birlikte yonetmek." },
      { wrong: "Aliskanlikla verilen sokum kararini teknik veri yerine koymak.", correct: "Saha verisini ve proje disiplinini kararin merkezine almak." },
    ],
    designVsField: [
      "Projede kalip sokumu cogu zaman kisa notlarla gecer; sahada ise yukunun ne zaman gercekten betona aktarilacagina karar verilir.",
      "Kalibin sokulmesi isin bittigi an degil, betonun kendi basina calismaya basladigi en hassas gecis anidir.",
      "Bu nedenle kalip sokumu, kaba insaatta gorunmeyen ama en cok sonuc ureten karar asamalarindan biridir.",
    ],
    conclusion: [
      "Kalip sokumu dogru veri, dogru sira ve dogru reshoring disipliniyle yurutuldugunde kat cevrimi guvenli ilerler ve eleman geometrisi korunur. Ayni is yalniz takvime gore yurutuldugunde gorunmeyen yapisal kalite kaybi uretme riski tasir.",
      "Saha tarafinda en saglam yaklasim, kalip sokumunu panel alma isi degil yuk devri yonetimi olarak gormek ve tum kararlari bu bakisla vermektir. Bu yaklasim, uzun vadeli sehim ve catlak riskini ciddi bicimde azaltir.",
    ],
    sources: [...KABA_FORMWORK_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn13670],
    keywords: ["kalip sokumu", "reshoring", "erken yas beton", "yuk transferi", "TS EN 13670"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/kalip-isleri", "kaba-insaat/kalip-isleri/doseme-kalibi"],
  },
];
