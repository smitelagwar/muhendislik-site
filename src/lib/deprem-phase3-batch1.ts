import type { ArticleData } from "./articles-data";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const UPDATED_AT = "25 Ağustos 2026";

function lines(...parts: string[]) {
  return parts.join("\n");
}

interface DepremPhase3Override {
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  readTime: string;
  sections: ArticleData["sections"];
  references: NonNullable<ArticleData["references"]>;
  keywords: string[];
  tags: string[];
}

function tbdyReferences(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `AFAD — Türkiye Bina Deprem Yönetmeliği 2018, ${scope}`,
      href: TBDY_PDF,
      note: "Bağlayıcı teknik hükümler ve tablo/denklem numaraları AFAD'ın yayımladığı resmî metinden doğrulanmıştır.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası",
      href: TBDY_PAGE,
      note: "Yönetmelik 18 Mart 2018 tarihli ve 30364 mükerrer sayılı Resmî Gazete'de yayımlanmış, 1 Ocak 2019'da yürürlüğe girmiştir.",
    },
  ];
}

export const DEPREM_PHASE3_ARTICLES: readonly DepremPhase3Override[] = [
  {
    slug: "tbdy-bks-dts-bys-belirleme",
    description: "TBDY 2018 Bölüm 3'e göre Bina Kullanım Sınıfı (BKS), Deprem Tasarım Sınıfı (DTS) ve Bina Yükseklik Sınıfı (BYS) kararını; kullanım amacı, SDS ve deprem hesabına esas bina yüksekliği HN üzerinden tek ve denetlenebilir akışta kurar.",
    seoTitle: "TBDY 2018 BKS, DTS ve BYS Belirleme | Tablo 3.1–3.3",
    seoDescription: "BKS ve önem katsayısı, SDS ile DTS seçimi, HN ile BYS belirleme ve proje kontrol sırası; TBDY 2018 Tablo 3.1, 3.2 ve 3.3'e göre teknik rehber.",
    updatedAt: UPDATED_AT,
    readTime: "9 dk",
    sections: [
      {
        id: "karar-akisi",
        title: "Karar akışı: BKS → DTS → BYS",
        content: lines(
          "BKS, DTS ve BYS birbirinden bağımsız üç etiket değildir. **BKS kullanım amacından**, **DTS BKS ile DD-2 için kısa periyot tasarım spektral ivme katsayısı SDS'den**, **BYS ise DTS ile deprem hesabına esas bina yüksekliği HN'den** türetilir. Bu nedenle kontrol sırası kullanım → deprem tehlikesi/zemin → bina tabanı ve yükseklik şeklinde kurulmalıdır.",
          "",
          "> [!engineering] Mühendis için hızlı özet",
          "> 1) Kullanım amacından BKS ve I değerini seçin. 2) Proje konumu ve yerel zemin verisinden elde edilen DD-2 SDS ile Tablo 3.2'den DTS'yi belirleyin. 3) Bina tabanını 3.3.1'e göre tanımlayıp HN'yi ölçün. 4) DTS–HN ikilisini Tablo 3.3'te okuyarak BYS'yi belirleyin. 5) Sonraki taşıyıcı sistem, analiz ve performans kararlarında aynı sınıflandırmayı tutarlı biçimde kullanın."
        ),
        subsections: [],
      },
      {
        id: "bks-ve-onem-katsayisi",
        title: "BKS ve bina önem katsayısı: ilk karar kullanım amacıdır",
        content: lines(
          "TBDY 2018 Madde 3.1, Bina Kullanım Sınıfı'nı kullanım amacına göre tanımlar ve aynı Tablo 3.1'de bina önem katsayısı **I** değerini verir. Proje müellifi burada yalnız yapı adını değil, fiilî kullanım ve deprem sonrasındaki işlev gereksinimini esas almalıdır.",
          "",
          "| BKS | Tablo 3.1'deki kullanım çerçevesi | I | Proje kontrolü |",
          "|---|---|---:|---|",
          "| BKS = 1 | Deprem sonrası kullanımı gereken; uzun süreli/yoğun kullanım, değerli eşya veya tehlikeli madde içeren yapılar | 1.5 | Kullanım tanımını ruhsat/proje fonksiyonuyla doğrula |",
          "| BKS = 2 | İnsanların kısa süreli ve yoğun bulunduğu yapılar | 1.2 | Toplanma ve yoğun kullanım niteliğini kontrol et |",
          "| BKS = 3 | BKS 1 ve 2 kapsamına girmeyen diğer binalar | 1.0 | Konut, işyeri, otel vb. kullanımın gerçekten bu gruba girdiğini doğrula |",
          "",
          "> [!regulation] Kaynak değeri",
          "> BKS ve I değerleri TBDY 2018 **Tablo 3.1**'den alınan SOURCE_VALUE'lardır. Kullanım türünü farklı yorumlayarak katsayı üretmek veya ara değer kullanmak doğru değildir."
        ),
        subsections: [],
      },
      {
        id: "dts-belirleme",
        title: "DTS: BKS ile DD-2 SDS birlikte okunur",
        content: lines(
          "Madde 3.2'ye göre Deprem Tasarım Sınıfı, **DD-2 deprem yer hareketi düzeyi için SDS** ile BKS'nin birlikte değerlendirilmesiyle belirlenir. BKS = 1 yapılar aynı SDS bandında `a` eki alan DTS sınıfına geçer; BKS = 2 ve 3 için ana DTS sınıfı kullanılır.",
          "",
          "| DD-2 için SDS aralığı | BKS = 1 | BKS = 2 veya 3 |",
          "|---:|---|---|",
          "| SDS < 0.33 | DTS = 4a | DTS = 4 |",
          "| 0.33 ≤ SDS < 0.50 | DTS = 3a | DTS = 3 |",
          "| 0.50 ≤ SDS < 0.75 | DTS = 2a | DTS = 2 |",
          "| 0.75 ≤ SDS | DTS = 1a | DTS = 1 |",
          "",
          "> [!warning] Sık hata",
          "> DTS seçiminde harita ham katsayısı ile SDS'yi karıştırmayın. Tablo 3.2'nin girdisi, TBDY 2.3.2.2'de tanımlanan **kısa periyot tasarım spektral ivme katsayısı SDS**'dir."
        ),
        subsections: [],
      },
      {
        id: "bys-ve-hn",
        title: "BYS: önce bina tabanını, sonra HN'yi doğru tanımlayın",
        content: lines(
          "BYS hesabının kritik noktası yalnız toplam mimari yükseklik değildir. Madde 3.3.1, bodrumlu binalarda bina tabanının hangi seviyede alınacağını koşullara bağlar; **HN bu tanımlanmış bina tabanından itibaren ölçülen deprem hesabına esas yüksekliktir**. Madde 3.3.2 daha sonra DTS–HN ikilisini Tablo 3.3'te sekiz BYS sınıfından birine bağlar.",
          "",
          "> [!check] Bina tabanı kontrolü",
          "> Rijit bodrum perdeleri ve periyot oranı için 3.3.1.1'deki iki koşul birlikte sağlanmadan bina tabanını bodrum perdelerinin üst kotuna taşımayın. Koşullardan biri sağlanmıyorsa 3.3.1.2 uyarınca bina tabanı temel üst kotunda tanımlanır.",
          "",
          "**Çözümlü kontrol örneği — ASSUMPTION:** BKS = 3 bir bina için DD-2 SDS = 0.62 ve 3.3.1'e göre belirlenmiş HN = 32 m kabul edilsin. Tablo 3.2'de `0.50 ≤ SDS < 0.75` olduğundan **DTS = 2** bulunur. DTS = 2 için Tablo 3.3'te `28 < HN ≤ 42 m` aralığı **BYS = 4**'tür. Sonuç: örnek sınıflandırma **BKS 3 → DTS 2 → BYS 4** olur.",
          "",
          "> [!engineering] Mühendislik yorumu",
          "> Örnekteki 0.62 ve 32 m değerleri yönetmelik sınırı değil, hesabı göstermek için seçilmiş ASSUMPTION'lardır. DTS bandı ve BYS aralığı ise resmî tablolardan gelen SOURCE_VALUE'lardır."
        ),
        subsections: [],
      },
      {
        id: "proje-etkisi",
        title: "Sınıflandırmanın analiz ve proje kararlarına etkisi",
        content: lines(
          "BKS–DTS–BYS zinciri, sonraki TBDY hükümlerini hangi koşullarda okuyacağınızı belirleyen bir proje anahtarıdır. Taşıyıcı sistem seçimi ve yükseklik sınırları, performans hedefleri, yüksek bina hükümleri ve bazı analiz kabulleri bu sınıflandırma ile ilişkilidir. Bu nedenle sınıflar hesap raporunun başında açıkça gösterilmeli ve model girdileriyle aynı kalmalıdır.",
          "",
          "| Kontrol | Yanlış sınıflandırmanın olası sonucu | Tasarım aksiyonu |",
          "|---|---|---|",
          "| BKS yanlış | I ve `a` sınıfı ayrımı yanlış okunabilir | Mimari kullanım ile statik rapor girişini çapraz kontrol et |",
          "| SDS yanlış | DTS yanlış banda düşer | Koordinat, zemin sınıfı ve spektrum üretim zincirini doğrula |",
          "| Bina tabanı/HN yanlış | BYS ve yüksek bina sınıflaması yanlış olabilir | 3.3.1 bodrum koşullarını ayrıca belgeleyip HN'yi yeniden ölç |",
          "| Sonraki tabloda eski sınıf kullanımı | Model ile rapor arasında tutarsızlık oluşur | Tek bir proje sınıflandırma özeti kullan |"
        ),
        subsections: [],
      },
      {
        id: "kontrol-listesi",
        title: "Proje kontrol listesi",
        content: lines(
          "- Kullanım amacı BKS = 1/2/3 tanımlarından hangisine giriyor?",
          "- BKS'ye karşılık gelen I değeri Tablo 3.1 ile aynı mı?",
          "- DTS girdisi gerçekten DD-2 için SDS mi?",
          "- SDS bandının alt/üst sınırlarında eşitlik işaretleri doğru okundu mu?",
          "- Bodrumlu binada bina tabanı 3.3.1.1 veya 3.3.1.2'ye göre gerekçelendirildi mi?",
          "- HN aynı bina tabanından ölçüldü mü?",
          "- DTS–HN ikilisi Tablo 3.3'te doğru BYS satırına oturuyor mu?",
          "- BKS, DTS ve BYS hesap raporu, model ve proje notlarında aynı mı?"
        ),
        subsections: [],
      },
    ],
    references: tbdyReferences("Bölüm 3; Tablo 3.1, 3.2 ve 3.3"),
    keywords: ["TBDY 2018", "BKS", "DTS", "BYS", "SDS", "bina önem katsayısı", "HN", "Tablo 3.1", "Tablo 3.2", "Tablo 3.3"],
    tags: ["TBDY 2018", "BKS", "DTS", "BYS", "Sınıflandırma"],
  },
  {
    slug: "tbdy-performans-hedefleri-dd-sh-kh-go",
    description: "TBDY 2018 Bölüm 3.4–3.5'teki deprem yer hareketi düzeyi, bina performans düzeyi ve DGT/ŞGDT yaklaşımı ilişkisini; yeni, mevcut, yüksek ve deprem yalıtımlı bina ayrımını koruyarak açıklar.",
    seoTitle: "TBDY Performans Hedefleri: DD, KK, SH, KH, GÖ | Tablo 3.4–3.5",
    seoDescription: "DD düzeyleri ile KK, SH, KH ve GÖ performans hedeflerinin eşleştirilmesi; DGT/ŞGDT yaklaşımı ve TBDY 2018 Tablo 3.4–3.5 proje kontrolü.",
    updatedAt: UPDATED_AT,
    readTime: "10 dk",
    sections: [
      {
        id: "uc-farkli-kavram",
        title: "Üç farklı kavramı ayırın: DD düzeyi, performans düzeyi, tasarım yaklaşımı",
        content: lines(
          "TBDY'de **DD-1, DD-2, DD-3 ve DD-4 deprem yer hareketi düzeyleridir**; **KK, SH, KH ve GÖ bina performans düzeyleridir**; **DGT ve ŞGDT ise değerlendirme/tasarım yaklaşımlarıdır**. Bir performans hedefi, belirli bir DD düzeyi altında hangi performans düzeyinin sağlanacağını ve ilgili tabloda hangi yaklaşımın kullanılacağını birlikte tarif eder.",
          "",
          "> [!engineering] Mühendis için hızlı özet",
          "> Önce bina grubunu ve DTS'yi belirleyin. Sonra Tablo 3.4 veya deprem yalıtımlı bina ise Tablo 3.5'i seçin. İlgili DD satırındaki performans hedefini ve DGT/ŞGDT yaklaşımını birlikte okuyun. `DD-2 = KH` gibi tek satırlık ezber, yüksek bina, mevcut bina, ileri performans ve deprem yalıtımı ayrımlarını kaybettirir."
        ),
        subsections: [],
      },
      {
        id: "performans-duzeyleri",
        title: "KK, SH, KH ve GÖ neyi ifade eder?",
        content: lines(
          "TBDY 3.4, performans düzeylerini taşıyıcı sistemde oluşan yapısal hasar ve doğrusal olmayan davranışın seviyesi üzerinden tanımlar.",
          "",
          "| Performans düzeyi | Yönetmelik çerçevesinin teknik özeti | Proje yorumu |",
          "|---|---|---|",
          "| KK — Kesintisiz Kullanım | Yapısal hasar yok veya ihmal edilebilir düzeyde | Taşıyıcı sistem davranışı esasen elastik/hasarsız hedefe yakındır |",
          "| SH — Sınırlı Hasar | Yapısal hasar sınırlı, doğrusal olmayan davranış sınırlı | Hasar ve plastikleşme sıkı biçimde sınırlandırılır |",
          "| KH — Kontrollü Hasar | Can güvenliğini sağlayan, çok ağır olmayan ve çoğunlukla onarılabilir hasar | Kontrollü sünek davranış ve can güvenliği odaklı hedef |",
          "| GÖ — Göçmenin Önlenmesi | İleri ağır hasar oluşabilir; kısmi/tam göçme önlenir | Göçme öncesi sınır durum; hasarsızlık veya ekonomik onarım hedefi değildir |",
          "",
          "> [!warning] Terminoloji hatası",
          "> GÖ'yü “göçme kabul edilir” şeklinde okumayın. TBDY tanımı, ileri ağır hasara rağmen binanın kısmen veya tamamen göçmesinin önlenmesini hedefler."
        ),
        subsections: [],
      },
      {
        id: "tablo-3-4",
        title: "Tablo 3.4: bina türü ve DTS aynı anda okunur",
        content: lines(
          "Tablo 3.4 tek bir performans satırı değildir; yeni yüksek olmayan binalar, yüksek binalar ve mevcut yüksek olmayan binalar için ayrı alt tablolar içerir. Ayrıca DTS = 1a ve 2a için ileri performans sütunları ve dipnot koşulları bulunur.",
          "",
          "| Bina grubu | Normal hedefte temel eşleşme | Yaklaşım | Kontrol notu |",
          "|---|---|---|---|",
          "| Yeni yerinde dökme/önüretimli betonarme ve çelik, yüksek bina dışında | DD-2 → KH | DGT | Tablo 3.4(a) dipnotları ve DTS 1a/2a ileri hedefleri ayrıca okunur |",
          "| Yeni veya mevcut yüksek bina, BYS = 1 | DD-4 → KK; DD-2 → KH; DD-1 → GÖ | DGT / ŞGDT | DD-2 DGT ön tasarım, DD-1 ŞGDT performans kontrolüdür |",
          "| Mevcut betonarme/çelik, yüksek bina dışında | DD-2 → KH | ŞGDT | Yeni bina ile aynı yöntem varsayılmaz |",
          "",
          "> [!regulation] İleri performans hedefi",
          "> Madde 3.5.1.1, DTS = 1a ve 2a için ileri performans hedeflerini Tablo 3.4 ve 3.5'te tanımlar. Tablo 3.4'te ayrıca yapı sahibinin isteğiyle ilgili DD düzeylerine karşı daha ileri hedef seçilebileceği belirtilir. Dipnot kapsamları göz ardı edilmemelidir."
        ),
        subsections: [],
      },
      {
        id: "tablo-3-5",
        title: "Tablo 3.5: deprem yalıtımlı binaları ayrı değerlendirin",
        content: lines(
          "Deprem yalıtımlı binalarda üstyapı ile yalıtım sistemi/altyapı aynı hedef matrisine indirgenmez. Tablo 3.5; yeni yalıtımlı bina üstyapısı, yalıtımla güçlendirilecek mevcut bina üstyapısı ve yalıtım sistemi–altyapı için ayrı alt tablolar verir.",
          "",
          "| Tablo 3.5 grubu | Normal performans örneği | Tasarım yaklaşımı |",
          "|---|---|---|",
          "| Yeni deprem yalıtımlı bina — üstyapı | DD-2 → SH | DGT |",
          "| Yalıtımla güçlendirilecek mevcut bina — üstyapı | DD-2 → KH | DGT |",
          "| Yalıtım sistemi ve altyapı | DD-1 → KK | Yalıtım sistemi için ŞGDT, altyapı için DGT |",
          "",
          "> [!check] Tablo seçimi",
          "> Yapı “deprem yalıtımlı” ise Tablo 3.4'teki normal bina hedefini doğrudan kopyalamayın. Üstyapı, yalıtım sistemi ve altyapı için Tablo 3.5'in ilgili kısmını ayrı okuyun."
        ),
        subsections: [],
      },
      {
        id: "modelleme-etkisi",
        title: "Performans hedefi model ve kabul kriterlerini baştan belirler",
        content: lines(
          "Performans hedefi analiz bittikten sonra rapora eklenen bir etiket değildir. DGT veya ŞGDT seçimi; kullanılacak analiz çerçevesini, doğrusal olmayan davranışın modele nasıl taşınacağını, hangi tepki büyüklüklerinin kontrol edileceğini ve kabul kriterlerinin hangi bölümden okunacağını değiştirir.",
          "",
          "| Hata | Teknik sonuç | Düzeltme |",
          "|---|---|---|",
          "| DD ile performans düzeyini aynı kavram sanmak | Talep düzeyi ile kabul hedefi karışır | DD, performans ve yaklaşımı üç ayrı kolon halinde raporla |",
          "| Yeni ve mevcut binayı aynı satırdan okumak | DGT/ŞGDT seçimi yanlış olabilir | Bina grubunu Tablo 3.4 alt başlığından doğrula |",
          "| BYS = 1 yüksek binayı normal bina gibi ele almak | Çoklu DD hedefleri kaybolur | Yüksek bina satırlarını ayrı kontrol et |",
          "| Deprem yalıtımlı yapıda Tablo 3.4 kullanmak | Üstyapı/yalıtım/altyapı hedefleri karışır | Tablo 3.5'e geç |"
        ),
        subsections: [],
      },
      {
        id: "kontrol-listesi",
        title: "Proje kontrol listesi",
        content: lines(
          "- Bina yeni mi, mevcut mu, yüksek bina mı, deprem yalıtımlı mı?",
          "- DTS normal veya ileri performans sütunlarından hangisini gerektiriyor?",
          "- DD düzeyi ile performans düzeyi ayrı kaydedildi mi?",
          "- Tablo 3.4/3.5 dipnotları proje koşuluna uygulanıyor mu?",
          "- DGT ve ŞGDT seçimi ilgili tabloyla aynı mı?",
          "- Yüksek binada DD-4, DD-2 ve DD-1 hedefleri birlikte izleniyor mu?",
          "- Mevcut binada yeni bina DGT yaklaşımı yanlışlıkla kopyalanmış mı?",
          "- Deprem yalıtımlı binada üstyapı ile yalıtım sistemi/altyapı ayrılmış mı?"
        ),
        subsections: [],
      },
    ],
    references: tbdyReferences("Bölüm 3.4–3.5; Tablo 3.4 ve Tablo 3.5"),
    keywords: ["TBDY 2018", "performans hedefi", "DD-1", "DD-2", "DD-3", "DD-4", "KK", "SH", "KH", "GÖ", "DGT", "ŞGDT", "Tablo 3.4", "Tablo 3.5"],
    tags: ["TBDY 2018", "Performans", "DGT", "ŞGDT"],
  },
  {
    slug: "tbdy-kutle-kaynagi-hareketli-yuk-katilimi",
    description: "TBDY 2018 Madde 4.5.9, Denklem 4.16 ve Tablo 4.3'e göre deprem hesabındaki düğüm/kat kütlesinin sabit yükler ile kullanım türüne bağlı hareketli yük katılımından nasıl üretildiğini ve model sonuçlarına etkisini açıklar.",
    seoTitle: "TBDY Kütle Kaynağı ve Hareketli Yük Katılımı | Denklem 4.16, Tablo 4.3",
    seoDescription: "Deprem kütlesi, hareketli yük kütle katılım katsayısı n, TBDY Denklem 4.16 ve Tablo 4.3; kat kütlesi, modal analiz ve model kontrol rehberi.",
    updatedAt: UPDATED_AT,
    readTime: "10 dk",
    sections: [
      {
        id: "kutle-kaynagi-akisi",
        title: "Kütle kaynağı: yük tanımından dinamik modele",
        content: lines(
          "Deprem hesabında kütle kaynağı, yük durumlarını menüden işaretlemekten ibaret değildir. TBDY 4.5.9, elemanların yayılı kütlelerinden düğüm noktası kütlelerine ve rijit diyafram kullanılan katlarda ana düğüm kütlelerine kadar kütlenin analiz modelinde nasıl temsil edileceğini tanımlar.",
          "",
          "> [!engineering] Mühendis için hızlı özet",
          "> Sabit yük bileşenlerini eksiksiz kurun; hareketli yükün yalnız Tablo 4.3'teki `n` oranını kütleye katın; Denklem 4.16 ile ağırlığı kütleye dönüştürün; kütlenin kat/diyafram ve düğümlere dağılımını kontrol edin. Yanlış kütle kaynağı periyotları, modal kütle katılımını ve deprem etkilerinin büyüklük/dağılımını değiştirir."
        ),
        subsections: [],
      },
      {
        id: "denklem-4-16",
        title: "Denklem 4.16: sabit + katılan hareketli yük → kütle",
        content: lines(
          "Madde 4.5.9.2'de tipik bir sonlu eleman düğüm noktası için önce bileşke ağırlık, ardından kütle tanımlanır. `n` katsayısı hareketli yükün deprem kütlesine katılan kısmını temsil eder; sabit yükü azaltan bir katsayı değildir.",
          "",
          "```formula",
          "@label: TBDY 4.5.9.2 — Denklem (4.16)",
          "w_j^(S) = w_G,j^(S) + n w_Q,j^(S)",
          "m_j^(S) = w_j^(S) / g",
          "@symbol: w_j^(S) | j düğüm noktasına etkiyen bileşke ağırlık | kN",
          "@symbol: w_G,j^(S) | j düğüm noktasına etkiyen bileşke sabit yük | kN",
          "@symbol: w_Q,j^(S) | j düğüm noktasına etkiyen bileşke hareketli yük | kN",
          "@symbol: n | Hareketli yük kütle katılım katsayısı | boyutsuz",
          "@symbol: m_j^(S) | j düğüm noktasında tanımlanan kütle | kN·s²/m",
          "@symbol: g | Yerçekimi ivmesi | m/s²",
          "```",
          "",
          "> [!regulation] Geçerlilik ve özel durumlar",
          "> `n` değerleri Tablo 4.3'ten alınır. Madde 4.5.9.2 ayrıca endüstri binalarındaki sabit ekipman ağırlıkları için n = 1 alınacağını, vinç kaldırma yüklerinin kat ağırlıklarında dikkate alınmayacağını ve çatı katı ağırlığında kar yükünün %30'unun hesaba katılacağını belirtir."
        ),
        subsections: [],
      },
      {
        id: "tablo-4-3",
        title: "Tablo 4.3: hareketli yük kütle katılım katsayısı n",
        content: lines(
          "Katsayı kullanım amacına göre seçilir. Aynı projede farklı kullanım bölgeleri varsa tek bir `n` değerini tüm yapıya gelişigüzel yaymak yerine ilgili yüklerin hangi kullanım alanına ait olduğunu kontrol etmek gerekir.",
          "",
          "| Binanın kullanım amacı — TBDY Tablo 4.3 özeti | n |",
          "|---|---:|",
          "| Depo, antrepo vb. | 0.80 |",
          "| Okul, öğrenci yurdu, spor tesisi, sinema, tiyatro, konser salonu, ibadethane, lokanta, mağaza vb. | 0.60 |",
          "| Konut, işyeri, otel, hastane, otopark vb. | 0.30 |",
          "",
          "> [!warning] Modelleme hatası",
          "> Hareketli yük kombinasyon katsayılarını veya başka standartlardaki yük azaltmalarını Tablo 4.3'teki `n` ile karıştırmayın. Buradaki katsayı deprem hesabındaki **kütle katılımı** içindir."
        ),
        subsections: [],
      },
      {
        id: "ornek-hesap",
        title: "Çözümlü örnek: bir konut katının deprem kütlesi",
        content: lines(
          "**ASSUMPTION:** Bir konut katına atanan bileşke sabit yük `wG = 8000 kN`, hareketli yük `wQ = 2000 kN` olsun. Konut için Tablo 4.3'ten **SOURCE_VALUE n = 0.30** alınır. Örnekte kütle dönüşümü için `g = 9.81 m/s²` kullanılmıştır.",
          "",
          "1. Katılan hareketli yük: `0.30 × 2000 = 600 kN`.",
          "2. Bileşke ağırlık: `w = 8000 + 600 = 8600 kN`.",
          "3. Kütle: `m = 8600 / 9.81 = 876.66 kN·s²/m` (sayısal olarak yaklaşık `876.66 t`).",
          "",
          "> [!engineering] Sonuç yorumu",
          "> `n = 1.00` kullanılsaydı model kütlesi gereksiz biçimde büyürdü; `n = 0` kullanılsaydı yönetmeliğin katılmasını istediği hareketli yük kütlesi kaybolurdu. Etkinin taban kesmesi veya belirli bir moddaki tepki üzerinde ne yönde/ne kadar olacağı yalnız bu aritmetikten değil, değişen periyot ve spektral talepten de etkilenir; sonuç model üzerinden kontrol edilmelidir."
        ),
        subsections: [],
      },
      {
        id: "model-dagilimi",
        title: "Kütlenin katlara, düğümlere ve diyaframa dağılımı",
        content: lines(
          "Madde 4.5.9.1, çubuk/levha/kabuk elemanlardaki yayılı kütlelerin düğüm kütleleri olarak temsilini; 4.5.9.3 ise rijit diyafram kabulünde kat kütlelerinin kaydırılmamış kütle merkezindeki ana düğüm noktasına atanmasını tarif eder. Bu ana düğüm yatay öteleme serbestlikleri ile düşey eksen etrafındaki dönme serbestliğini taşır.",
          "",
          "| Model kontrolü | Neden önemli? |",
          "|---|---|",
          "| Öz-ağırlık aynı anda iki kez kütleye giriyor mu? | Çifte kütle periyot ve atalet kuvvetlerini bozar |",
          "| Duvar, kaplama, sabit tesisat gibi sabit yükler eksik mi? | Gerçek kat kütlesi küçülür |",
          "| `n` kullanım türüne göre atanmış mı? | Hareketli yükün kütleye katılan kısmı yanlış olur |",
          "| Rijit diyaframda kütle merkezi ve dönme ataletleri doğru mu? | Torsiyon ve kat tepkileri etkilenir |",
          "| X/Y birikimli modal kütle sonuçları beklenen düzeyde mi? | Model serbestlikleri veya kütle dağılımı hatası görülebilir |"
        ),
        subsections: [],
      },
      {
        id: "kontrol-listesi",
        title: "Proje kontrol listesi",
        content: lines(
          "- Öz-ağırlık kütle kaynağına tam bir kez dahil mi?",
          "- Sabit kaplama, duvar ve ekipman yükleri doğru bölgelerde mi?",
          "- Hareketli yük için n değeri Tablo 4.3'teki kullanım türünden mi seçildi?",
          "- Endüstri sabit ekipmanı, vinç kaldırma yükü ve çatı kar yükü için 4.5.9.2 özel hükümleri kontrol edildi mi?",
          "- Ağırlık–kütle dönüşümünde birimler tutarlı mı?",
          "- Kat kütlelerinin plan içindeki dağılımı ve kütle merkezi makul mü?",
          "- Rijit diyafram ana düğümünde öteleme/dönme kütle özellikleri doğru mu?",
          "- Periyot, toplam kütle ve modal kütle katılım raporu bağımsız bir kütle özetiyle karşılaştırıldı mı?"
        ),
        subsections: [],
      },
    ],
    references: tbdyReferences("Madde 4.5.9; Denklem (4.16) ve Tablo 4.3"),
    keywords: ["TBDY 2018", "kütle kaynağı", "hareketli yük kütle katılımı", "Denklem 4.16", "Tablo 4.3", "n katsayısı", "modal kütle", "diyafram kütlesi"],
    tags: ["TBDY 2018", "Kütle", "Dinamik Analiz", "Modelleme"],
  },
  {
    slug: "tbdy-rijit-yari-rijit-diyafram",
    description: "TBDY 2018 Madde 4.5.6–4.5.7'ye göre döşemenin düzlem içi kuvvet aktarımını; rijit diyafram kabulü ile iki boyutlu sonlu elemanlarla temsil edilen yarı rijit/esnek diyafram modelinin seçim kriterleri üzerinden açıklar.",
    seoTitle: "TBDY Rijit ve Yarı Rijit Diyafram Seçimi | Madde 4.5.6–4.5.7",
    seoDescription: "Rijit diyafram kabulünün sınırları, A2/A3 düzensizlikleri, kirişsiz döşeme, geçiş katı ve 2B sonlu eleman modellemesi; TBDY 4.5.6–4.5.7 rehberi.",
    updatedAt: UPDATED_AT,
    readTime: "10 dk",
    sections: [
      {
        id: "model-secim-akisi",
        title: "Model seçimi: döşeme gerçekten rijit diyafram gibi davranıyor mu?",
        content: lines(
          "Döşeme, yalnız düşey yük taşıyan bir eleman değildir; depremde kat atalet kuvvetlerini düşey taşıyıcı elemanlara aktarır ve bu kuvvetleri eleman rijitliklerine göre dağıtır. TBDY 4.5.6.1 bu düzlem içi yük aktarımının uygun biçimde modellenmesini esas alır.",
          "",
          "> [!engineering] Mühendis için hızlı özet",
          "> A2/A3 düzensizliği varsa, döşemenin rijit diyafram çalışması beklenmiyorsa veya sistem kirişsiz döşemeli ise 4.5.6.2 uyarınca döşemeyi iki boyutlu sonlu elemanlarla modelleyin. A2/A3 yoksa ve planda düzenli betonarme döşemede önemli düzlem içi şekil değiştirme beklenmiyorsa 4.5.6.3 rijit diyafram modeline izin verir. Geçiş katı döşemeleri ise A2/A3'ten bağımsız olarak 4.5.7.2 kapsamında 2B sonlu elemanlarla modellenir."
        ),
        subsections: [],
      },
      {
        id: "rijit-diyafram-fizigi",
        title: "Rijit diyafram kabulünün fiziksel anlamı",
        content: lines(
          "Rijit diyafram kabulü, kat döşemesinin düzlem içi şekil değiştirmesini taşıyıcı sistemin yatay davranışı bakımından ihmal edilebilir kabul eder. Böylece aynı diyaframa bağlı düğümlerin yatay hareketleri, katın iki yatay ötelemesi ve düşey eksen etrafındaki dönmesiyle kinematik olarak ilişkilendirilir.",
          "",
          "Bu kabul **döşemenin sonsuz dayanımlı olduğu** veya döşeme içi kuvvetlerin kontrol edilmeyeceği anlamına gelmez. Madde 4.5.6.4, rijit diyafram çözümünde düşey elemanlara aktarılan kuvvetin ilgili elemanın üst ve alt kat kesme kuvvetleri farkından belirlenmesini; 4.5.6.5 ise bu düzlem içi kuvvetlerin güvenle aktarılmasının hesapla gösterilmesini ister.",
          "",
          "> [!warning] Kritik hata",
          "> “Rijit diyafram seçtim, döşemeyi modellememe gerek yok” yaklaşımı yük aktarım kontrolünü ortadan kaldırmaz. Gerekli durumlarda ek bağlantı donatısı ve aktarım elemanları tasarlanmalıdır."
        ),
        subsections: [],
      },
      {
        id: "iki-boyutlu-model",
        title: "Yarı rijit yaklaşım: TBDY'deki 2B sonlu eleman modelinin karşılığı",
        content: lines(
          "Uygulama yazılımlarında “yarı rijit diyafram” adı çoğunlukla döşemenin gerçek düzlem içi rijitliğinin membran/kabuk türü iki boyutlu sonlu elemanlarla modele dahil edilmesini ifade eder. TBDY'nin bağlayıcı metni 4.5.6.2'de doğrudan **iki boyutlu sonlu elemanlarla modelleme** şartını tanımlar; yazılım menüsündeki isimden çok modelin bu fiziksel davranışı temsil edip etmediği önemlidir.",
          "",
          "| Durum | TBDY çerçevesindeki model kararı | Mühendislik etkisi |",
          "|---|---|---|",
          "| A2 veya A3 düzensizliği var | 2B sonlu eleman | Döşeme içi şekil değiştirme ve kuvvet akışı modele girer |",
          "| Döşemenin rijit diyafram çalışması beklenmiyor | 2B sonlu eleman | Dar boğaz, büyük boşluk ve zayıf bağlantı etkileri görülebilir |",
          "| Betonarme kirişsiz döşeme sistemi | 2B sonlu eleman | Döşeme düzlem içi davranışı açıkça temsil edilir |",
          "| A2/A3 yok, plan düzenli ve önemli düzlem içi şekil değiştirme beklenmiyor | Rijit diyafram kullanılabilir | Daha düşük modelleme maliyetiyle kinematik bağ kabulü yapılır |",
          "| Geçiş katı döşemesi | 2B sonlu eleman | Bodrum çevre perdelerine kuvvet aktarımı doğrudan kontrol edilir |"
        ),
        subsections: [],
      },
      {
        id: "geometri-ve-yuk-aktarimi",
        title: "Boşluk, dar bağlantı ve geçiş döşemelerinde yük yolunu okuyun",
        content: lines(
          "Büyük merdiven/asansör boşlukları, U/L biçimli planlar, bloklar arasında dar döşeme boyunları, farklı rijitlikte çekirdek/perde kümeleri ve ani bodrum rijitlik geçişleri düzlem içi kuvvet akışını yoğunlaştırabilir. Böyle bir geometride tek bir rijit diyafram bağı, gerçek membran deformasyonunu ve lokal kuvvet yığılmalarını görünmez kılabilir.",
          "",
          "Geçiş katlarında problem daha belirgindir: üstyapıdan gelen atalet kuvvetlerinin önemli bölümü çok rijit bodrum çevre perdelerine aktarılabilir. TBDY 4.5.7.1–4.5.7.3, geçiş döşemesinin yeterli düzlem içi rijitlik/dayanıma sahip olmasını, 2B sonlu elemanlarla modellenmesini ve bodrum çevre perdelerine aktarılan kuvvetler için dayanımın gösterilmesini ister.",
          "",
          "> [!check] Sonlu eleman ağı",
          "> Yarı rijit/2B model seçmek tek başına kalite değildir. Boşluk köşeleri, perde bağlantıları, dar aktarım bölgeleri ve kuvvet gradyenlerinin yüksek olduğu alanlarda ağın sonuçları yakalayacak yeterlilikte olduğunu; aşırı kaba veya anlamsız derecede ince ağın sonuçları bozmadığını kontrol edin."
        ),
        subsections: [],
      },
      {
        id: "sonuclara-etki",
        title: "Diyafram kabulü iç kuvvet, torsiyon ve dağılımı nasıl değiştirir?",
        content: lines(
          "Diyafram modeli, aynı kattaki düşey taşıyıcıların birbirine kinematik olarak nasıl bağlandığını belirlediği için perde/kolon kesme kuvveti dağılımını, torsiyon talebini, toplayıcı/aktarım kuvvetlerini ve döşeme membran kuvvetlerini etkileyebilir. Özellikle rijitlik merkezi–kütle merkezi ilişkisi ile lokal döşeme esnekliğinin birlikte önemli olduğu düzensiz planlarda fark yalnız döşemede değil, düşey eleman tasarım kuvvetlerinde de ortaya çıkabilir.",
          "",
          "| Karşılaştırma çıktısı | Rijit ve 2B model arasında ne aranmalı? |",
          "|---|---|",
          "| Perde/kolon kat kesmeleri | Kuvvet dağılımında açıklanabilir değişim |",
          "| Kat torsiyonu ve eleman uç kuvvetleri | Lokal esneklik nedeniyle yeniden dağılım |",
          "| Döşeme membran kuvvetleri | Dar boğaz/boşluk çevresinde yoğunlaşma |",
          "| Geçiş katı kuvvetleri | Çevre perdesine aktarımın sürekliliği |",
          "| Deplasman şekli | Diyafram içinde göreli düzlem içi şekil değiştirme |"
        ),
        subsections: [],
      },
      {
        id: "kontrol-listesi",
        title: "Proje kontrol listesi",
        content: lines(
          "- A2/A3 düzensizlikleri kontrol edildi mi?",
          "- Kirişsiz döşeme varsa 4.5.6.2 gereği 2B model kullanılıyor mu?",
          "- Büyük boşluk, dar bağlantı veya planda kuvvet aktarım kesintisi var mı?",
          "- Rijit diyafram kullanılıyorsa önemli düzlem içi şekil değiştirme beklenmediği teknik olarak gerekçelendirildi mi?",
          "- Geçiş katı döşemesi 4.5.7.2'ye göre 2B sonlu elemanlarla modellendi mi?",
          "- Döşemeden perde/kolona aktarılan düzlem içi kuvvetlerin dayanımı gösterildi mi?",
          "- Gerekli bağlantı donatısı/aktarım elemanları projede detaylandırıldı mı?",
          "- 2B modelde ağ yakınsaması ve kritik bölgelerde kuvvet akışı kontrol edildi mi?",
          "- Rijit ve 2B model sonuçları arasında mühendislik açısından açıklanamayan fark varsa model varsayımları yeniden incelendi mi?"
        ),
        subsections: [],
      },
    ],
    references: tbdyReferences("Madde 4.5.6–4.5.7"),
    keywords: ["TBDY 2018", "rijit diyafram", "yarı rijit diyafram", "döşeme", "A2 düzensizliği", "A3 düzensizliği", "sonlu eleman", "geçiş katı", "yük aktarımı"],
    tags: ["TBDY 2018", "Diyafram", "Modelleme", "Döşeme"],
  },
] as const;

const PHASE3_BY_SLUG = new Map(DEPREM_PHASE3_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE3_SLUGS = new Set(DEPREM_PHASE3_ARTICLES.map((article) => article.slug));

export function applyDepremPhase3Override(article: ArticleData): ArticleData {
  const override = PHASE3_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPhase3ContentSignature(): string {
  return DEPREM_PHASE3_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
