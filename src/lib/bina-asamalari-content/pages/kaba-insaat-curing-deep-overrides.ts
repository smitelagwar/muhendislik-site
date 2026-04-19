import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_CURING_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const CURING_TOOLS: BinaGuideTool[] = [
  { category: "Planlama", name: "Dokum gunu hava senaryosu ve kur plani", purpose: "Rüzgar, gunes ve gece sicakligi degisimi gorulmeden kur karari vermemek." },
  { category: "Ölçüm", name: "Yüzey termometresi, higrometre ve rüzgar olcer", purpose: "Erken yas nem kaybi riskini göz karari yerine veriyle takip etmek." },
  { category: "Kontrol", name: "Kur başlangıç saati ve vardiya takip formu", purpose: "Kurun ertesi gune sarkmasini veya ekip degisiminde unutulmasini engellemek." },
  { category: "Kayıt", name: "Numune, kur fotografi ve hava logu", purpose: "Dayanim ve yüzey davranisini dokum kosullariyla birlikte yorumlamak." },
];

const CURING_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Koruma", name: "Kur ortusu, geotekstil, PE ortu ve golgeleme ekipmani", purpose: "Genis acik yuzeylerde ani su kaybini ve gunes etkisini sinirlamak.", phase: "Ilk saatler" },
  { group: "Nem kontrolu", name: "Kontrollu sulama seti ve su dağıtım hortumlari", purpose: "Yuzeyi darbelemeyen, duzenli ve yaygin nem koruma saglamak.", phase: "Kur sureci" },
  { group: "Kimyasal yontem", name: "Kur kimyasali ve pulverizator seti", purpose: "Sulamanin zor oldugu veya programin hassas oldugu durumlarda yüzey buharlasmasini azaltmak.", phase: "Alternatif uygulama" },
  { group: "Takip", name: "Termometre, higrometre ve saha vardiya cizelgesi", purpose: "Kur planini insan hafizasina degil ölçü ve kayda baglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatCuringDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/beton-isleri/kur-islemi",
    kind: "topic",
    quote: "Kur islemi, beton dokumunun sonradan eklenen bir eki degil; betonun doğru dayanima ve dayanikliliga ulasmasi için dokumun ayrilmaz ikinci yarasidir.",
    tip: "Beton iyi yerlesti diye isin bittigini dusunmek, en kritik ilk saatleri rüzgar, gunes ve iş programi baskisina teslim etmek demektir.",
    intro: [
      "Kur islemi, beton dokumu sonrasinda nem ve sıcaklık kosullarinin kontrollu yonetilmesiyle hidratasyonun devamini saglayan temel uygulamadir. Santiyede cogu kez yalnizca sulama olarak anlasilsa da, gercekte kur; ne zaman baslanacagi, hangi yontemin secilecegi, hangi yuzeyin nasil korunacagi ve ne kadar sure devam edecegi kararlarini birlikte icerir.",
      "Bir insaat muhendisi için kur konusu teorik bir laboratuvar basligi degil, sahadaki en ucuz ve en etkili kalite yatirimlarindan biridir. Betonun ilk saatlerinde kaybettigi suyu ve yüzey dengesi bozulduktan sonra geri getirmek çok zordur. Bu nedenle iyi yerlestirilmis ama kötü korunmus bir beton, orta halli bir betondan bile daha problemli servis davranisi uretebilir.",
      "Ozellikle doseme, radye, saha betonu, teras ve genis acik yuzeylerde kurun onemi artar. Cunku bu elemanlar gunes, rüzgar ve düşük bagil nem etkisine en acik alanlardir. Aynı zamanda program baskisi, uzeri yurunecek veya bir sonraki imalat gelecek dusuncesiyle kur suresinin kisaltilmasina yol acar. Sahadaki pek çok yüzey catlagi, tozuma ve erken dayanim kaybi bu aceleden dogar.",
      "Bu yazida kur islemini sadece 'ne kadar sulayalim' sorusuna indirgemeden; erken yas beton davranisi, hava kosuluna göre yontem secimi, vardiya ve ekip planlamasi, kalip sokumu ile birlikte koruma zinciri ve sayisal bir saha ornegiyle birlikte ele aliyoruz.",
    ],
    theory: [
      "Betonda dayanim gelisimi cimento hidratasyonunun devamina baglidir. Hidratasyon için yeterli su ve uygun sıcaklık gerekir. Yuzeyden suyun hizla cekildigi durumlarda, ozellikle ilk saatlerde betonun üst bolgesi alt bolgeye göre farkli davranmaya baslar. Bu fark, plastik rotre, erken cekme catlagi ve yüzey sertligi kaybi olarak okunabilir.",
      "Kurun amaci sadece su vermek degildir. Ana hedef, betonun yuzeyini ani buharlasma ve termal salinimlardan korumak, boylece iç gerilme dengesini ve hidratasyon devamini desteklemektir. Bu nedenle gunes altinda rastgele hortum tutmak bazen yeterli degil, bazen de zararlidir. Yuzeye suyu ne zaman, hangi ritimle ve hangi koruma katmani ile verdiginiz sonucu belirler.",
      "Kur yontemi eleman tipine göre degisir. Kolon ve perde gibi kalip icinde kalan elemanlar bir sure dogal olarak korunur; ancak kalip sokumu sonrasinda yüzey birden acikta kalabilir. Doseme ve radye gibi acik yuzeylerde ise ilk mudahale çok daha kritik hale gelir. Bu nedenle kur planini sadece hava durumu degil, eleman tipi ve kalip sokum takvimi ile birlikte okumak gerekir.",
      "Bir diger kritik konu da insan faktorudur. Kur cogu santiyede net sahibi olmayan bir iş kalemi gibi gorulur. Betoncu dokumu bitirdiginde saha terk eder, sonraki ekip ise kurun ne zaman baslayacagini bilmez. Sonuc olarak en kritik ilk 2-4 saat boslukta kalir. Iyi santiyede kur bir refleks degil, vardiya ve sorumluluk matrisi ile yonetilen yazili bir plandir.",
      "TS EN 13670 ve TS EN 206 mantigi, betonun yalnız taze halde teslimini degil, uygulanma ve koruma kosullarini da kalite zincirinin parçası olarak gorur. Dolayisiyla kur disiplinini yok saymak, aslinda betonun uygun uygulanmasi kisminda standardin ruhundan uzaklasmak anlamina gelir.",
    ],
    ruleTable: [
      {
        parameter: "Erken yas koruma baslangici",
        limitOrRequirement: "Yüzey, dokum ve ilk bitirme operasyonlari biter bitmez uygun koruma altina alinmalidir",
        reference: "TS EN 13670",
        note: "Kur için ertesi gunu beklemek en degerli ilk zamani kaybetmektir.",
      },
      {
        parameter: "Yontem secimi",
        limitOrRequirement: "Sulama, ortu veya kimyasal kur yontemi saha sicakligi, rüzgar ve yüzey tipine göre secilmelidir",
        reference: "TS EN 13670 + saha kalite plani",
        note: "Her hava ve her eleman için aynı yontem aynı sonucu vermez.",
      },
      {
        parameter: "Kur suresi ve sureklilik",
        limitOrRequirement: "Kur sureci program baskisi ile degil beton gelisimi ve iklim kosullari ile birlikte belirlenmelidir",
        reference: "TS EN 13670 + TS EN 206",
        note: "Kısa tutulan kur sureci genelde gozle gorunmeyen dayaniklilik kaybi birakir.",
      },
      {
        parameter: "Kalip sokumu ile bağlantı",
        limitOrRequirement: "Kalip sokumu sonrasinda koruma kesintiye ugramadan devam etmelidir",
        reference: "TS EN 13670",
        note: "Kalip korumasinin bittigi anda yüzey birden risk altina girebilir.",
      },
      {
        parameter: "Izleme ve kayıt",
        limitOrRequirement: "Hava verisi, kur baslangici, yontem ve gozlenen yüzey davranisi saha kaydina baglanmalidir",
        reference: "Beton kalite guvence plani",
        note: "Olculmeyen ve kayda baglanmayan kur disiplini tekrarlanabilir kalite uretmez.",
      },
    ],
    designOrApplicationSteps: [
      "Dokumden once hava durumu, eleman tipi ve sonraki imalat baskisina göre yazili bir kur plani hazirla.",
      "Kur ekipmanini dokum sahasinda beton gelmeden hazir bulundur; ortu, su, kimyasal malzeme ve vardiya sorumlusu sonradan aranmasin.",
      "Yüzey perdah ve ilk bitis kabulunu takiben, hava kosuluna uygun korumayi dakikalar seviyesinde devreye al.",
      "Genis acik yuzeylerde rüzgar ve gunes etkisini saatlik takip et; gerekiyorsa golgeleme, daha sık nemlendirme veya yontem degisikligi yap.",
      "Kalip sokumu yapilacak elemanlarda sokum aniyla birlikte yeni koruma zinciri kur; kalibin sagladigi pasif korumayi bir anda kaybetme.",
      "Kur sureci boyunca yuzeyde catlak, renk farki, tozuma veya kenar kurumasi gibi belirtileri izleyip plana geri besleme yap.",
    ],
    criticalChecks: [
      "Kur malzemesi ve ekip sorumlusu beton dokumunden once netlesti mi?",
      "Yüzey korumasi dokumun bittigi gun ve uygun zamanda gercekten basladi mi?",
      "Rüzgar, gunes ve bagil nem riski saha verisi ile takip ediliyor mu?",
      "Kalip sokumu sonrasinda koruma zincirinde bosluk olusuyor mu?",
      "Yuzeyde erken yas catlagi, tozuma veya renklenme farki beliriyor mu?",
      "Kur sureci test numunesi, hava verisi ve saha kaydi ile birlikte okunuyor mu?",
    ],
    numericalExample: {
      title: "32 m x 18 m dosemede buharlasma riski ve vardiya plani yorumu",
      inputs: [
        { label: "Doseme alani", value: "576 m2", note: "Genis acik yüzey" },
        { label: "Hava sicakligi", value: "31 C", note: "Yaz ogleden sonrasi senaryosu" },
        { label: "Rüzgar hizi", value: "18 km/sa", note: "Yüzey su kaybini artiran orta kuvvet" },
        { label: "Planlanan ilk aktif kur ekibi", value: "3 kisi", note: "Ortme ve nemlendirme için" },
      ],
      assumptions: [
        "Perdah ve son yüzey islemleri programli sekilde tamamlanmistir.",
        "Kur ortusu ve kontrollu sulama ekipmani sahada hazirdir.",
        "Bu hesap standarttaki ayrintili buharlasma formulunun yerine gecmez; saha karar mantigini gosterir.",
      ],
      steps: [
        {
          title: "Risk seviyesini yorumla",
          result: "31 C ve 18 km/sa rüzgar, genis dosemede ilk saatlerde yuksek buharlasma riski olusturur.",
          note: "Bu durumda kurun ertesi gune birakilmasi acik bir kalite zafiyetidir.",
        },
        {
          title: "Alan bazli ekip ihtiyacini dusun",
          formula: "576 / 3 = 192 m2/kisi",
          result: "Uc kisilik ekip için kisi basi yaklasik 192 m2 yüzey dusmektedir.",
          note: "Bu oran, ilk mudahalenin tek kisiye birakilamayacagini gosterir.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Kur yontemi ortu + kontrollu nem koruma olarak hemen baslamali, vardiya devri ve gece takibi daha dokum bitmeden planlanmalidir.",
          note: "Kur, sadece yontem secimi degil ekip ve zamanlama problemidir.",
        },
      ],
      checks: [
        "Genis yuzeylerde kur kapasitesi ekip sayisi ile birlikte planlanmalidir.",
        "Rüzgar etkisi sadece hava sicakligi kadar belirleyici olabilir.",
        "Ilk aktif koruma dakikalar seviyesinde gecikirse daha sonraki sulama her kaybi telafi etmez.",
        "Yüzey davranisi ile test numunesi sonuclari birlikte izlenmelidir.",
      ],
      engineeringComment: "Kur kalitesi genellikle beton sinifindan degil, ilk saatlerdeki disiplin seviyesinden okunur.",
    },
    tools: CURING_TOOLS,
    equipmentAndMaterials: CURING_EQUIPMENT,
    mistakes: [
      { wrong: "Kurun ertesi gun sulama ile baslayabilecegini dusunmek.", correct: "Ilk korumayi dokum gunu ve uygun ilk anda devreye almak." },
      { wrong: "Her mevsim ve her eleman için aynı kur yontemini kullanmak.", correct: "Hava, yüzey tipi ve lojistige göre yontemi ayarlamak." },
      { wrong: "Kalip icinde kaldigi için elemanin tamamen guvende oldugunu varsaymak.", correct: "Kalip sokumu sonrasindaki ani risk artisini planlamak." },
      { wrong: "Kur isini net sorumlusu olmayan genel şantiye gorevi gibi gormek.", correct: "Sorumlu ekip, vardiya ve kontrol formu ile yazili yonetmek." },
      { wrong: "Yuzeyde ilk catlak gorulene kadar mudahale etmemek.", correct: "Catlak cikmadan once hava ve yüzey davranisina göre onleyici hareket etmek." },
      { wrong: "Kur surecini kayda baglamadan yalnizca tecrubeye dayali yurutmek.", correct: "Hava, saat, yontem ve gozlemi kalite kaydina islemek." },
    ],
    designVsField: [
      "Ofiste beton sinifi ve kesit kapasitesi konusulur; sahada ise bu potansiyelin gercege donusmesi kur disiplini ile saglanir.",
      "Doğrudan gorunmeyen bir kalite kalemi oldugu için kur kolayca ihmal edilir; oysa uzun vadeli dayaniklilik sorunlarinin buyuk bolumu burada baslar.",
      "Iyi santiyede kur, hortum tutma refleksi degil; beton dokum planinin yazili ve sahipli parçası olarak yurur.",
    ],
    conclusion: [
      "Kur islemi, betonun hem erken yas hem de uzun vadeli davranisini belirleyen kritik uygulama basligidir. Doğru sinifta beton kullanmak kadar, o betonu ilk saatlerde doğru kosullarda korumak da muhendislik sorumlulugudur.",
      "Bir insaat muhendisi için en saglam yaklasim, kuru tamamlayici küçük iş degil, beton dokum kararinin vazgecilmez parçası olarak yonetmektir. Bu bakis yüzey catlagi, tozuma ve dayaniklilik kaybi riskini belirgin bicimde azaltir.",
    ],
    sources: [...KABA_CURING_SOURCES, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tsEn206],
    keywords: ["kur islemi", "beton kuru", "TS EN 13670", "erken yas beton", "nem kontrolu"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/beton-isleri", "kaba-insaat/beton-isleri/beton-dokumu"],
  },
];
