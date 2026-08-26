import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

const TDTH_PORTAL = "https://tdth.afad.gov.tr/";

export const DEPREM_PHASE3_SS_S1: DepremPhase3Override = {
  slug: "tbdy-afad-ss-s1-okuma",
  description: "AFAD Türkiye Deprem Tehlike Haritası'ndan seçilen deprem yer hareketi düzeyi için Ss ve S1 harita spektral ivme katsayılarının nasıl alınacağını ve neden doğrudan SDS/SD1 olmadığını açıklar.",
  seoTitle: "AFAD Haritasından Ss ve S1 Okuma | TBDY 2018 Denklem 2.1",
  seoDescription: "Ss, S1, referans zemin (VS)30=760 m/s, DD düzeyi, FS/F1 ve SDS/SD1 dönüşümünün TBDY 2018 Bölüm 2'ye göre proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "ss-s1-resmi-tanim",
      title: "2.3.2: Ss kısa periyot, S1 ise 1.0 saniye periyot harita spektral ivme katsayısıdır",
      content: phase3Lines(
        "TBDY 2.3.2'de `Ss`, **kısa periyot harita spektral ivme katsayısı**; `S1` ise **1.0 saniye periyot için harita spektral ivme katsayısı** olarak tanımlanır. İki değer de seçilen deprem yer hareketi düzeyi ve proje konumu için Türkiye Deprem Tehlike Haritası'ndan alınır.",
        "",
        "Bu katsayılar, birbirine dik iki yatay doğrultudaki harita spektral ivmelerinin geometrik ortalamasının yerçekimi ivmesine bölünmesi ile tanımlanan **boyutsuz** harita değerleridir. Referans zemin koşulu `(VS)30 = 760 m/s` olarak verilir.",
        "",
        "> [!warning] S1'i 'yaklaşık orta periyot katsayısı' diye yuvarlamayın",
        "> Yönetmelik tanımı doğrudan `1.0 saniye periyot` içindir. Teknik raporda bu resmi tanımı kullanın."
      ),
      subsections: [],
    },
    {
      id: "harita-sorgu-akisi",
      title: "2.1.2: Harita sorgusunda proje noktası ve DD düzeyi birlikte sabitlenir",
      content: phase3Lines(
        "TBDY 2.1.2, deprem tehlikesi verileri için AFAD Türkiye Deprem Tehlike Haritaları'nı referans gösterir. Resmî sorgu adresi `tdth.afad.gov.tr`'dir. Harita çıktısı, **hangi proje noktası ve hangi DD düzeyi** için alındığı belirtilmeden tasarım girdisi haline gelmez.",
        "",
        "Kontrollü iş akışı:",
        "",
        "1. Parselin/proje noktasının doğru konumu belirlenir.",
        "2. Proje için gerekli DD-1, DD-2, DD-3 veya DD-4 düzeyi seçilir.",
        "3. Aynı sorgudan `Ss` ve `S1` değerleri kaydedilir.",
        "4. Yerel zemin sınıfı ayrıca zemin etüdünden alınır; harita sorgusundaki Ss/S1 ile karıştırılmaz.",
        "5. `FS` ve `F1` katsayıları uygulanarak `SDS` ve `SD1` elde edilir.",
        "",
        "> [!engineering] Girdi izi",
        "> Hesap dosyasında konum, DD düzeyi, Ss, S1 ve sorgu tarihi birlikte tutulursa spektrum girdisi sonraki revizyonda izlenebilir kalır."
      ),
      subsections: [],
    },
    {
      id: "denklem-2-1",
      title: "Denklem 2.1: Harita katsayıları yerel zemin etkisiyle tasarım katsayılarına dönüşür",
      content: phase3Lines(
        "`Ss` ve `S1` son tasarım spektrumu değerleri değildir. TBDY 2.3.3.1'de yerel zemin etki katsayıları kullanılarak `SDS` ve `SD1` hesaplanır:",
        "",
        "```formula",
        "@label: TBDY Denklem (2.1) — tasarım spektral ivme katsayıları",
        "S_DS = S_S F_S",
        "S_D1 = S_1 F_1",
        "@symbol: S_DS | Kısa periyot tasarım spektral ivme katsayısı | -",
        "@symbol: S_S | Kısa periyot harita spektral ivme katsayısı | -",
        "@symbol: F_S | Kısa periyot bölgesi yerel zemin etki katsayısı | -",
        "@symbol: S_D1 | 1.0 saniye periyot tasarım spektral ivme katsayısı | -",
        "@symbol: S_1 | 1.0 saniye periyot harita spektral ivme katsayısı | -",
        "@symbol: F_1 | 1.0 saniye periyot bölgesi yerel zemin etki katsayısı | -",
        "```",
        "",
        "Metin karşılığıyla **Denklem (2.1): SDS = Ss FS ve SD1 = S1 F1**. `FS`, Tablo 2.1'den; `F1`, Tablo 2.2'den seçilir ve ara harita değerlerinde doğrusal enterpolasyon yapılabilir.",
        "",
        "> [!check] SOURCE_VALUE / hesaplanan değer ayrımı",
        "> `Ss` ve `S1` haritadan gelen SOURCE_VALUE girdileridir; `SDS` ve `SD1` ise seçilen yerel zemin katsayılarıyla hesaplanan proje değerleridir."
      ),
      subsections: [],
    },
    {
      id: "referans-zemin-ve-sonum",
      title: "Harita katsayıları referans zemin ve %5 sönümlü standart spektrum bağlamında okunur",
      content: phase3Lines(
        "Harita `Ss/S1` değerlerinin tanımındaki referans zemin `(VS)30 = 760 m/s` koşuludur. Projedeki gerçek yerel zemin sınıfı ZA–ZF ise bu referans koşulun doğrudan yapıya uygulanması anlamına gelmez; yerel zemin etkisi sonraki adımda `FS/F1` veya ZF için sahaya özel analiz ile hesaba katılır.",
        "",
        "TBDY standart elastik tasarım spektrumlarını **%5 sönüm oranı** için tanımlar. Dolayısıyla harita katsayısı, yerel zemin sınıfı ve spektrum sönüm kabulü aynı hesap zincirinin farklı basamaklarıdır.",
        "",
        "> [!warning] Harita değeri = zemin etüt değeri değildir",
        "> `Ss/S1` deprem tehlikesini; yerel zemin sınıfı ise saha koşulunu temsil eder. Birini diğerinin yerine kullanmayın."
      ),
      subsections: [],
    },
    {
      id: "sorgu-sonucu-kalite-kontrol",
      title: "Ss/S1 için kalite kontrol yalnız ekrandaki iki sayıyı kopyalamak değildir",
      content: phase3Lines(
        "Aynı koordinat için farklı DD düzeylerinde farklı `Ss/S1` değerleri üretilebilir. Bu nedenle rapora yalnız iki sayı yazmak yerine sorgunun bağlamını da kaydedin.",
        "",
        "| Kontrol alanı | Raporda tutulması gereken bilgi |",
        "|---|---|",
        "| Proje noktası | Parsel/proje koordinatı veya eşdeğer kesin konum tanımı |",
        "| Deprem düzeyi | DD-1, DD-2, DD-3 veya DD-4 |",
        "| Harita girdileri | Ss ve S1 |",
        "| Saha girdisi | ZA–ZF yerel zemin sınıfı ve zemin etüdü referansı |",
        "| Dönüşüm | FS, F1, SDS ve SD1 |",
        "| İzlenebilirlik | Harita sorgu tarihi ve kullanılan TBDY sürümü |",
        "",
        "> [!engineering] Yuvarlama",
        "> Ss/S1 değerlerini erken aşamada gereksiz basamak kaybıyla yuvarlamak yerine harita çıktısındaki hassasiyeti koruyup sunum basamağını rapor sonunda düzenleyin."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık hatalar: şehir merkezi, yanlış DD düzeyi ve Ss/S1'i doğrudan spektruma girmek",
      content: phase3Lines(
        "En sık görülen üç hata, proje noktasının yerine yaklaşık şehir merkezi kullanmak, performans hedefinden farklı DD düzeyine ait harita değerini taşımak ve `Ss/S1` değerlerini `SDS/SD1` sanmaktır.",
        "",
        "Özellikle son hata zemin etkisini tamamen atlar. Doğru zincir `DD + konum → Ss/S1 → zemin sınıfı → FS/F1 → SDS/SD1 → TA/TB → spektrum` şeklindedir.",
        "",
        "> [!warning] Bir önceki projeden kopyalama",
        "> Aynı şehirdeki iki parsel için bile proje konumu ve zemin sınıfı farklı olabilir. Spektrum girdilerini proje bazında yeniden üretin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Ss, kısa periyot harita spektral ivme katsayısı olarak mı tanımlandı?",
        "- S1, 1.0 saniye periyot harita spektral ivme katsayısı olarak mı tanımlandı?",
        "- Harita tanımındaki referans zemin `(VS)30 = 760 m/s` ve %5 sönüm bağlamı doğru mu?",
        "- AFAD `tdth.afad.gov.tr` sorgusu tam proje noktası için mi yapıldı?",
        "- Kullanılan Ss/S1 değerleri proje için gerekli DD düzeyine mi ait?",
        "- Ss ve S1'in boyutsuz harita katsayıları olduğu raporda açık mı?",
        "- Denklem (2.1) ile `SDS = Ss FS` ve `SD1 = S1 F1` dönüşümü yapıldı mı?",
        "- FS/F1 seçimi gerçek yerel zemin sınıfı ve doğru tablo aralığına mı dayanıyor?",
        "- Ss/S1 ile SDS/SD1 birbirinden açıkça ayrılıyor mu?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase3References("Bölüm 2; Madde 2.1.2, 2.3.1–2.3.3 ve Denklem (2.1)"),
    {
      label: "AFAD — Türkiye Deprem Tehlike Haritaları",
      href: TDTH_PORTAL,
      note: "TBDY 2.1.2'nin yönlendirdiği resmî tehlike haritası portalıdır; Ss ve S1 değerleri proje konumu ve seçilen DD düzeyi için buradan sorgulanır.",
    },
  ],
  keywords: ["AFAD", "Ss", "S1", "SDS", "SD1", "TBDY 2018", "Türkiye Deprem Tehlike Haritası", "Denklem 2.1"],
  tags: ["TBDY 2018", "AFAD", "Ss", "S1", "Deprem Tehlike Haritası"],
};
