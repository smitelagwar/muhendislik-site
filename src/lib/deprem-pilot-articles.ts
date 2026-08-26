import type { ArticleData } from "./articles-data";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const SOIL_2019 = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";
const SOIL_2021 = "https://yapiisleri.csb.gov.tr/haberler/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-iliskin-teblig-yayimlanmistir-259001";
const SAFE_SOIL = "https://docs.csiamerica.com/help-files/safe/Menus/Define/Soil_Subgrade_Properties.htm";
const SAFE_TERMS = "https://docs.csiamerica.com/manuals/safe/SAFE%20Key%20Features%20and%20Terminology.pdf";
const FIRE_GUIDE = "https://webdosya.csb.gov.tr/v2/meslekihizmetler/2026/05/Binalar-n-Yang-n-Korunmas-Hakk-nda-Y-netmelik-K-lavuzu-20260507112134.pdf";
const FIRE_CONSOLIDATED = "https://www.emo.org.tr/mevzuat/mevzuat_detay.php?kod=152";
const IMAR_BASE = "https://webdosya.csb.gov.tr/db/tabiat/icerikler/planl-_alanlar_-mar-20191227075228.pdf";
const IMAR_2026 = "https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960";
const TS825_2025 = "https://meslekihizmetler.csb.gov.tr/haberler/isi-yalitim-standardi-tebligi-guncellendi-290597";
const TS825_APP = "https://meslekihizmetler.csb.gov.tr/haberler/isi-yalitim-uygulamasi-altyapisi-tamamlanarak-kullanima-sunuldu-291191";

const UPDATED_AT = "25 Ağustos 2026";

function lines(...parts: string[]) {
  return parts.join("\n");
}

interface DepremPilotOverride {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  readTime: string;
  image: string;
  sections: ArticleData["sections"];
  references: NonNullable<ArticleData["references"]>;
  keywords: string[];
  tags: string[];
}

export const DEPREM_PILOT_ARTICLES: DepremPilotOverride[] = [
  {
    slug: "tbdy-etkin-kesit-rijitlikleri",
    title: "Kiriş, Kolon, Perde ve Döşemelerde Etkin Kesit Rijitlikleri",
    description: "TBDY 2018 Tablo 4.2'deki etkin kesit rijitliği çarpanlarını, hangi rijitlik bileşenine ve hangi analiz durumlarına uygulanacağını proje modelleme mantığıyla açıklar.",
    seoTitle: "TBDY Etkin Kesit Rijitlikleri: Tablo 4.2 Uygulama Rehberi",
    seoDescription: "TBDY 2018 etkin kesit rijitliği çarpanları; perde, döşeme, bağ kirişi, çerçeve kirişi ve kolon için modelleme ve kontrol adımları.",
    updatedAt: UPDATED_AT,
    readTime: "7 dk",
    image: "/images/deprem-pilots/tbdy-etkin-kesit-rijitlikleri-cover.svg",
    sections: [
      {
        id: "neden-etkin-rijitlik",
        title: "Neden etkin kesit rijitliği kullanılır?",
        content: lines(
          "Betonarme elemanların deprem hesabında brüt kesit rijitliğini her elemanda aynen kullanmak, çatlama etkisini model dışında bırakır. TBDY 2018 Madde 4.5.8 bu nedenle betonarme elemanların etkin kesit rijitliklerini tanımlar ve Tablo 4.2'de eleman türüne göre çarpanlar verir.",
          "",
          "> [!regulation] TBDY 4.5.8.2 ve 4.5.8.3",
          "> Tablo 4.2'de verilen ilgili rijitlik çarpanları hesap modelinde birlikte dikkate alınır. Bu çarpanlar, deprem etkili yük birleşimlerinde yer alan yükler altındaki hesaplarda uygulanır; bütün yük durumlarına gelişigüzel yayılmaz.",
          "",
          "![Brüt ve etkin rijitlik yaklaşımının analiz modeline etkisi](/images/deprem-pilots/tbdy-etkin-kesit-rijitlikleri-diagram.svg)",
          "*Brüt kesit özelliklerinden etkin rijitlikli analiz modeline geçişin şematik gösterimi.*",
          "{figure:1 | note:Çarpanlar eleman ve davranış bileşenine göre uygulanır. | source:AFAD TBDY 2018 Tablo 4.2 | lightbox:true}"
        ),
        subsections: [],
      },
      {
        id: "tablo-4-2",
        title: "Tablo 4.2 değerleri nasıl okunur?",
        content: lines(
          "Aşağıdaki değerler TBDY 2018 Tablo 4.2'nin proje modelinde en sık karşılaşılan satırlarını özetler. Düzlem içi ve düzlem dışı davranış aynı katsayıyla temsil edilmez; perde ve döşemelerde hangi rijitlik bileşenini değiştirdiğiniz açıkça kayıt altına alınmalıdır.",
          "",
          "| Eleman / davranış | 1. rijitlik bileşeni | 2. rijitlik bileşeni |",
          "|---|---:|---:|",
          "| Perde — düzlem içi (eksenel / kayma) | 0.50 | 0.50 |",
          "| Bodrum perdesi — düzlem içi (eksenel / kayma) | 0.80 | 0.50 |",
          "| Döşeme — düzlem içi (eksenel / kayma) | 0.25 | 0.25 |",
          "| Perde — düzlem dışı (eğilme / kesme) | 0.25 | 1.00 |",
          "| Bodrum perdesi — düzlem dışı (eğilme / kesme) | 0.50 | 1.00 |",
          "| Döşeme — düzlem dışı (eğilme / kesme) | 0.25 | 1.00 |",
          "| Bağ kirişi — eğilme / kesme | 0.15 | 1.00 |",
          "| Çerçeve kirişi — eğilme / kesme | 0.35 | 1.00 |",
          "| Çerçeve kolonu — eğilme / kesme | 0.70 | 1.00 |",
          "",
          "> [!engineering] Model kontrolü",
          "> Program arayüzünde tek bir “stiffness modifier” alanı görmek, bütün davranış bileşenlerinin aynı çarpanla azaltılacağı anlamına gelmez. Yazılımın eksenel, eğilme, kesme ve kabuk bileşenlerini nasıl tanımladığını kontrol edin."
        ),
        subsections: [],
      },
      {
        id: "uygulama-akisi",
        title: "Modelleme ve doğrulama akışı",
        content: lines(
          "1. Elemanları perde, bodrum perdesi, döşeme, bağ kirişi, çerçeve kirişi ve kolon olarak doğru sınıflandırın.",
          "2. Tablo 4.2'deki çarpanı doğru rijitlik bileşenine tanımlayın; düzlem içi/dışı ayrımını özellikle kabuk elemanlarda kontrol edin.",
          "3. Deprem etkili kombinasyonlar ile yalnız düşey yük analizlerinin aynı modifier setini kullanıp kullanmadığını yazılım özelinde doğrulayın.",
          "4. Birinci mod periyotları, kat ötelenmeleri ve taban kesme dağılımını brüt rijitlikli kontrol modeliyle kıyaslayarak beklenen değişimin yönünü inceleyin.",
          "5. Hesap raporuna kullanılan çarpanları ve hangi yük durumlarında etkin olduklarını tablo halinde koyun.",
          "",
          "> [!warning] Sık hata",
          "> Tablo 4.2'deki sayıları kopyalamak tek başına yeterli değildir. Yanlış serbestlik derecesine uygulanan doğru katsayı da yanlış model üretir."
        ),
        subsections: [],
      },
      {
        id: "dayanak",
        title: "Mevzuat dayanağı",
        content: "Sayısal çarpanlar için ana kaynak **TBDY 2018 Madde 4.5.8 ve Tablo 4.2**'dir. Proje tesliminde kullanılan yönetmelik sürümünü ve yazılımın rijitlik tanımlarını ayrıca belgeleyin.",
        subsections: [],
      },
    ],
    references: [
      { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, Madde 4.5.8 ve Tablo 4.2", href: TBDY_PDF },
      { label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE },
    ],
    keywords: ["TBDY 2018", "etkin kesit rijitliği", "Tablo 4.2", "çatlamış kesit", "bağ kirişi", "perde rijitliği"],
    tags: ["TBDY 2018", "Analiz Modeli", "Etkin Rijitlik"],
  },
  {
    slug: "tbdy-betonarme-bag-kirisli-perde",
    title: "Bağ Kirişli Perdeler ve Çapraz Donatılı Bağ Kirişleri",
    description: "TBDY 2018 Madde 7.6.8'e göre bağ kirişlerinde klasik kesme donatısı ile çapraz donatı arasındaki karar koşullarını, ankraj ve sargı kontrolleriyle birlikte açıklar.",
    seoTitle: "TBDY 7.6.8 Bağ Kirişi ve Çapraz Donatı Tasarım Rehberi",
    seoDescription: "Bağ kirişli perdelerde 7.20 koşulları, çapraz donatı alanı, ankraj ve sargı detayları için TBDY 2018 uygulama özeti.",
    updatedAt: UPDATED_AT,
    readTime: "8 dk",
    image: "/images/deprem-pilots/tbdy-betonarme-bag-kirisli-perde-cover.svg",
    sections: [
      {
        id: "davranis",
        title: "Bağ kirişi neden ayrı ele alınır?",
        content: lines(
          "Bağ kirişli perdelerde iki perde parçası arasındaki kısa ve görece derin kirişler, katlar boyunca önemli kesme kuvveti ve tersinir eğilme talebi alabilir. TBDY 2018 Madde 7.6.8, perde parçalarına perde kurallarının uygulanmasını isterken bağ kirişinin kesme donatısı için özel bir karar akışı tanımlar.",
          "",
          "![Bağ kirişinde klasik ve çapraz donatı davranış şeması](/images/deprem-pilots/tbdy-betonarme-bag-kirisli-perde-diagram.svg)",
          "*Bağ kirişi geometrisi, çapraz basınç-çekme doğrultuları ve perde içine ankrajın şematik gösterimi.*",
          "{figure:1 | note:Şema detay projesinin yerine geçmez; yönetmelik karar akışını görselleştirir. | source:AFAD TBDY 2018 Madde 7.6.8 | lightbox:true}"
        ),
        subsections: [],
      },
      {
        id: "karar-kosullari",
        title: "7.20 koşulları: klasik mi, çapraz donatı mı?",
        content: lines(
          "TBDY 7.6.8.2(a)'da verilen iki koşuldan **herhangi biri** sağlanıyorsa bağ kirişinin kesme donatısı 7.4.5'e göre tasarlanabilir. Her iki koşul da sağlanamıyorsa 7.6.8.2(b) uyarınca kesme kuvveti ile bu kesmenin oluşturduğu eğilme momentini karşılamak üzere çapraz donatı düzenine geçilir.",
          "",
          "```formula",
          "l_n > 2 h   veya   V_d <= 1.5 b_w d f_ctd",
          "@label: TBDY 7.20 karar koşulları",
          "@symbol: l_n | Bağ kirişinin net açıklığı | mm",
          "@symbol: h | Bağ kirişi yüksekliği | mm",
          "@symbol: V_d | Tasarım kesme kuvveti | N",
          "@symbol: b_w | Kiriş gövde genişliği | mm",
          "@symbol: d | Faydalı yükseklik | mm",
          "@symbol: f_ctd | Betonun tasarım çekme dayanımı | MPa",
          "```",
          "",
          "> [!check] Karar cümlesi",
          "> 7.20a veya 7.20b'den biri sağlanıyorsa 7.4.5 yolu açıktır. İkisi birden sağlanmıyorsa çapraz donatı düzeni gerekir."
        ),
        subsections: [],
      },
      {
        id: "capraz-donati",
        title: "Çapraz donatı ve detay kontrolleri",
        content: lines(
          "Çapraz donatı gereken durumda her iki çapraz doğrultudaki donatı demetleri bağ kirişi kesmesini karşılayacak şekilde boyutlandırılır. TBDY'deki temel bağıntı aşağıdaki tasarım mantığıyla ifade edilir:",
          "",
          "```formula",
          "A_sd = V_d / (2 f_yd sin γ)",
          "@label: TBDY 7.21 — bir çapraz donatı demetinin toplam alanı",
          "@symbol: A_sd | Bir çapraz doğrultudaki toplam donatı alanı | mm²",
          "@symbol: V_d | Bağ kirişi tasarım kesme kuvveti | N",
          "@symbol: f_yd | Donatı çeliği tasarım akma dayanımı | MPa",
          "@symbol: γ | Çapraz donatının kiriş ekseni ile açısı | derece",
          "```",
          "",
          "- Her çapraz donatı demetinde en az dört donatı çubuğu bulunur.",
          "- Çapraz donatılar perde parçalarının içine yeterli kenetlenme sağlayacak biçimde uzatılır; TBDY 7.6.8.2 ayrıntısındaki ankraj koşulu projede doğrudan kontrol edilir.",
          "- Ayrı sargılanan çapraz demetlerde özel deprem etriyeleri kullanılır; etriye çapı ve aralığı yönetmelik sınırlarına göre çizimde gösterilir.",
          "- Bağ kirişi için ayrıca 7.6.8.3'te verilen kesme güvenliği üst sınırı kontrol edilir.",
          "",
          "> [!warning] Detaylandırma hesabın parçasıdır",
          "> Sadece A_sd değerini bulup paftada iki çapraz çizgi göstermek yeterli değildir. Demet geometrisi, perde içine kenetlenme, sargı, ek yatay/düşey donatı ve kiriş genişliği birlikte çözümlenmelidir."
        ),
        subsections: [],
      },
      {
        id: "proje-kontrol-listesi",
        title: "Proje kontrol listesi",
        content: lines(
          "1. Net açıklık l_n ve kiriş yüksekliği h model ile pafta arasında aynı mı?",
          "2. V_d doğru deprem tasarım zarfından mı alınmış?",
          "3. 7.20a ve 7.20b ayrı ayrı kontrol edilmiş mi?",
          "4. Çapraz donatı gerekiyorsa A_sd, donatı adedi, açı ve ankraj boyu çizimde okunuyor mu?",
          "5. Sargı etriyeleri ve bağ kirişi gövde donatıları yönetmelik detaylarıyla uyumlu mu?",
          "6. 7.6.8.3 kesme güvenliği sınırı ayrıca sağlanıyor mu?"
        ),
        subsections: [],
      },
    ],
    references: [
      { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, Madde 7.6.8", href: TBDY_PDF },
      { label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE },
    ],
    keywords: ["TBDY 7.6.8", "bağ kirişi", "bağ kirişli perde", "çapraz donatı", "A_sd", "kesme güvenliği"],
    tags: ["TBDY Bölüm 7", "Bağ Kirişi", "Betonarme Detay"],
  },
  {
    slug: "radye-temel-zemin-yayi-yatak-katsayisi",
    title: "Radye Temellerde Zemin Yayı ve Yatak Katsayısı Seçimi",
    description: "Radye temel sonlu eleman modelinde yatak katsayısının alan yayı ile düğüm yayına nasıl dönüştürüldüğünü, ağ bağımlılığı ve geoteknik rapor koordinasyonu üzerinden açıklar.",
    seoTitle: "Radye Temelde Zemin Yayı ve Yatak Katsayısı: Modelleme Rehberi",
    seoDescription: "Yatak katsayısı k_s, tributary area, K_i = k_s A_i dönüşümü, compression-only kabulü ve radye temel zemin yayı kontrolleri.",
    updatedAt: UPDATED_AT,
    readTime: "8 dk",
    image: "/images/deprem-pilots/radye-temel-zemin-yayi-yatak-katsayisi-cover.svg",
    sections: [
      {
        id: "temel-prensip",
        title: "Alan yayı ile düğüm yayı aynı sayı değildir",
        content: lines(
          "Radye temel modelinde zemin yatak katsayısı çoğunlukla birim alan başına yay rijitliği olarak tanımlanır. Sonlu eleman ağı düğümlere ayrıldığında bu alan özelliği düğüm yaylarına dönüştürülür. Aynı sayısal yay rijitliğini her düğüme doğrudan vermek, ağ sıklaştıkça toplam zemin rijitliğini yapay olarak artırabilir.",
          "",
          "```formula",
          "K_i = k_s A_i",
          "@label: Alan yatak katsayısının düğüm yayına dönüşümü",
          "@symbol: K_i | i düğümündeki düşey yay rijitliği | kuvvet/uzunluk",
          "@symbol: k_s | Zemin yatak katsayısı | kuvvet/uzunluk³",
          "@symbol: A_i | i düğümünün etkili/tributary alanı | uzunluk²",
          "```",
          "",
          "![Radye sonlu eleman ağında tributary alan ve düğüm yayları](/images/deprem-pilots/radye-temel-zemin-yayi-yatak-katsayisi-diagram.svg)",
          "*Aynı k_s alan özelliğinin ağ düğümlerine tributary alan oranında dağıtılması.*",
          "{figure:1 | note:K_i dönüşümü yazılımın alan yayı ayrıklaştırma mantığını açıklar; geoteknik parametre üretmez. | source:CSI SAFE modelleme dokümantasyonu | lightbox:true}"
        ),
        subsections: [],
      },
      {
        id: "ks-kaynagi",
        title: "k_s değeri nereden gelmeli?",
        content: lines(
          "Yatak katsayısı, taşıma gücüyle aynı büyüklük değildir ve tek başına zeminin değişmez bir malzeme sabiti gibi ele alınmamalıdır. Temel boyutu, yükleme düzeyi, zemin tabakalanması ve hedeflenen oturma davranışı model sonucunu etkiler. Bu nedenle kullanılacak k_s ve varsa doğrusal olmayan temas kabulleri geoteknik raporla koordineli belirlenmelidir.",
          "",
          "> [!regulation] Türkiye'deki rapor temeli",
          "> Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı 9 Mart 2019'da yayımlanmış, 17 Şubat 2021'de bazı hükümleri güncellenmiştir. Arazi/laboratuvar verileri, mühendislik özellikleri, yeraltı suyu ve yerel deprem etkileri bu raporlama çerçevesinde ele alınır.",
          "",
          "> [!warning] Evrensel dönüşüm formülü yok",
          "> “İzin verilebilir zemin gerilmesini sabit bir sayıya bölerek k_s bulma” gibi kestirme bağıntılar proje için evrensel yöntem değildir. Geoteknik raporda hangi parametrenin hangi model için verildiği açık olmalıdır."
        ),
        subsections: [],
      },
      {
        id: "model-kontrolleri",
        title: "Radye modelinde kontrol edilmesi gerekenler",
        content: lines(
          "- Alan yayı kullanılıyorsa yazılımın k_s birimini ve ağ düğümlerine dağıtım yöntemini doğrulayın.",
          "- Noktasal yay kullanılıyorsa her düğüm için tributary alanla ölçeklenmiş K_i değerini kullanın.",
          "- Zemin çekme taşımıyorsa, yükleme ve yazılım yetenekleri uygun olduğunda compression-only/temas ayrılması kabulünü değerlendirin.",
          "- Ağ sıklaştırma çalışması yapın; temel momentleri, temas basınçları ve toplam reaksiyonların fiziksel olarak yakınsadığını kontrol edin.",
          "- Toplam düşey zemin reaksiyonunu ilgili yük durumundaki düşey yük bileşkesiyle denge kontrolüne sokun.",
          "- Diferansiyel oturma ve toplam oturma sonuçlarını geoteknik rapordaki kabul ve sınırlarla karşılaştırın.",
          "",
          "> [!engineering] Yazılım notu",
          "> CSI SAFE dokümantasyonu, alan nesnesine atanan zemin yatak katsayısının sonlu eleman ağ noktalarına tributary alanları esas alınarak ayrık yaylar şeklinde dağıtıldığını açıklar. Bu, program uygulamasını doğrulayan bir kaynaktır; Türk mevzuatının yerine geçmez."
        ),
        subsections: [],
      },
      {
        id: "raporlama",
        title: "Hesap raporunda ne yazmalı?",
        content: "k_s kaynağını, birimini, temel boyutuyla ilişkisini, alan/nokta yay dönüşümünü, temas modelini, ağ boyutunu ve geoteknik rapordaki ilgili sayfa veya tabloyu açıkça belirtin. Böylece model parametresi sonradan denetlenebilir olur.",
        subsections: [],
      },
    ],
    references: [
      { label: "ÇŞİDB — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı (2019)", href: SOIL_2019 },
      { label: "ÇŞİDB — Zemin ve Temel Etüdü Rapor Formatı değişikliği (17.02.2021)", href: SOIL_2021 },
      { label: "CSI SAFE — Soil Subgrade Properties", href: SAFE_SOIL, note: "Yazılım modelleme davranışı için yardımcı kaynak; mevzuat değildir." },
      { label: "CSI SAFE — Key Features and Terminology", href: SAFE_TERMS, note: "Tributary alan esaslı ayrıklaştırma açıklaması." },
    ],
    keywords: ["radye temel", "zemin yayı", "yatak katsayısı", "k_s", "tributary area", "SAFE", "temas basıncı"],
    tags: ["Zemin ve Temel", "Radye Temel", "Sonlu Eleman Modeli"],
  },
  {
    slug: "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma",
    title: "Yangın Bölmesi, Koridor ve Kaçış Yolu Boyutlandırması",
    description: "Kaçış yolu genişliğini kullanıcı yükü, çıkış sayısı, koridor kullanımı ve yüksek bina koşullarıyla birlikte değerlendiren; yangın bölmesi kararını tahliye sürekliliğiyle ilişkilendiren uygulama rehberi.",
    seoTitle: "Yangın Kaçış Yolu ve Koridor Genişliği: Yönetmelik Rehberi",
    seoDescription: "Binaların Yangından Korunması Hakkında Yönetmelik kapsamında kaçış yolu genişliği, kullanıcı yükü, koridor ve yüksek bina kontrolleri.",
    updatedAt: UPDATED_AT,
    readTime: "8 dk",
    image: "/images/deprem-pilots/yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma-cover.svg",
    sections: [
      {
        id: "butunlesik-kacis",
        title: "Kaçış yolu tek bir koridor ölçüsü değildir",
        content: lines(
          "Kaçış güvenliği; odadan çıkış, koridor/geçit, kat çıkışı, korunmuş merdiven ve son çıkışa kadar kesintisiz bir sistem olarak çözülür. Bir noktada yeterli genişlik bulunması, güzergâhın diğer dar boğazlarını veya çıkışların bağımsızlığını telafi etmez.",
          "",
          "![Kullanıcı alanından son çıkışa kaçış yolu sürekliliği](/images/deprem-pilots/yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma-diagram.svg)",
          "*Kullanıcı yükünden kapı, koridor, merdiven ve son çıkışa kadar kapasite zinciri.*",
          "{figure:1 | note:Her segmentte net geçiş genişliği ve güzergâh sürekliliği ayrı kontrol edilir. | source:Binaların Yangından Korunması Hakkında Yönetmelik Madde 31-33 | lightbox:true}",
          "",
          "> [!regulation] Temel yaklaşım",
          "> Asansörler kaçış yolu olarak değerlendirilmez. Kaçış yolu hesabında kullanıcı yükü, çıkış sayısı, toplam çıkış genişliği, bağımsız güzergâh ve kullanım sınıfına bağlı diğer koşullar birlikte okunmalıdır."
        ),
        subsections: [],
      },
      {
        id: "genislik-kontrolu",
        title: "Kaçış yolu genişliği için eşik kontroller",
        content: lines(
          "Yönetmeliğin konsolide Madde 33 metnindeki temel genişlik kontrolleri aşağıdaki gibidir. Bunlar tek başına proje boyutu seçmek için yeterli değildir; Madde 32'deki kullanıcı yükü ve birim genişlik hesabı önce yapılır.",
          "",
          "| Durum | Kontrol edilen asgari genişlik |",
          "|---|---:|",
          "| Toplam kullanıcı 50–500 kişi ise kattaki bir kaçış yolu | 100 cm |",
          "| Toplam kullanıcı 501–2000 kişi ise kattaki bir kaçış yolu | 150 cm |",
          "| Toplam kullanıcı 2001 kişi ve üzeri ise kattaki bir kaçış yolu | 200 cm |",
          "| Kaçış yolu aynı zamanda koridor/hol olarak kullanılıyorsa | 110 cm |",
          "| Yüksek binalarda kaçış yolu ve merdiven | 120 cm |",
          "| Hiçbir çıkış/kaçış merdiveni/diğer kaçış yolu | Hesaplanan değerden ve 80 cm'den dar olamaz |",
          "",
          "> [!warning] Net genişlik esas alınır",
          "> Mimari plandaki aks veya kaba inşaat ölçüsü yerine kapı kanadı, kaplama, korkuluk ve diğer engeller sonrası kullanılabilir net geçişi kontrol edin."
        ),
        subsections: [],
      },
      {
        id: "bolme-ve-guzergah",
        title: "Yangın bölmesi ve güzergâh ilişkisi",
        content: lines(
          "Yangın bölmesi yalnız duvarın yangın dayanım sınıfını seçmek değildir. Bölmenin sınırı; kapılar, tesisat geçişleri, şaftlar ve döşeme birleşimleriyle birlikte süreklilik göstermelidir. Kaçış güzergâhı bir bölmeden diğerine geçiyorsa kapı ve koridor korunum koşulları da tahliye zincirinin parçasıdır.",
          "",
          "1. Kullanım sınıfı ve kullanıcı yükünü belirleyin.",
          "2. Gerekli çıkış sayısı ile çıkışların birbirinden bağımsızlığını kontrol edin.",
          "3. Toplam genişliği hesaplayın ve Madde 33 alt sınırlarıyla karşılaştırın.",
          "4. Kapı, koridor, hol ve merdivendeki en dar net kesiti bulun.",
          "5. Yangın bölmesi sınırındaki kapı ve penetrasyon detaylarının sürekliliğini kontrol edin.",
          "6. Son çıkışa kadar güzergâhın kesintisiz ve yönlendirilebilir olduğunu paftada gösterin."
        ),
        subsections: [],
      },
      {
        id: "guncellik",
        title: "Güncellik ve proje sorumluluğu",
        content: "Bakanlığın güncel yangın kılavuzu ile yürürlükteki konsolide yönetmelik metni birlikte kontrol edilmelidir. 2026'da yangın güvenliğine yönelik periyodik kontrol sistemi konusunda ayrıca yasal değişiklikler yapılmış olması, yeni yapı tasarımındaki kaçış geometrisi hükümlerini ortadan kaldırmaz.",
        subsections: [],
      },
    ],
    references: [
      { label: "ÇŞİDB — Binaların Yangından Korunması Hakkında Yönetmelik Kılavuzu", href: FIRE_GUIDE },
      { label: "EMO — Binaların Yangından Korunması Hakkında Yönetmelik konsolide metni", href: FIRE_CONSOLIDATED, note: "Madde 31-33 kaçış yolu hükümlerinin okunması için." },
    ],
    keywords: ["yangın kaçış yolu", "koridor genişliği", "Madde 33", "yangın bölmesi", "kaçış merdiveni", "kullanıcı yükü"],
    tags: ["Yangın Yönetmeliği", "Kaçış Yolu", "Mimari Kontrol"],
  },
  {
    slug: "imar-taks-kaks-emsal-hesabi",
    title: "TAKS, KAKS ve Emsal Hesabı",
    description: "TAKS ile taban alanı ve KAKS/Emsal ile emsale esas toplam kat alanı arasındaki farkı, net imar parseli ve güncel plan notu kontrolü üzerinden açıklar.",
    seoTitle: "TAKS KAKS Emsal Hesabı: Formüller ve 2026 İmar Kontrolü",
    seoDescription: "TAKS, KAKS (emsal), taban alanı ve emsale esas kat alanı formülleri; net imar parseli, plan notu ve 2026 yönetmelik değişikliği uyarıları.",
    updatedAt: UPDATED_AT,
    readTime: "7 dk",
    image: "/images/deprem-pilots/imar-taks-kaks-emsal-hesabi-cover.svg",
    sections: [
      {
        id: "kavramlar",
        title: "TAKS ile KAKS aynı şeyi sınırlandırmaz",
        content: lines(
          "TAKS, yapının parsel üzerinde kapladığı taban alanının imar parseli alanına oranını; KAKS ise yönetmelikte **Emsal** olarak da adlandırılan, emsale esas kat alanları toplamının imar parseli alanına oranını ifade eder. Bu iki oran aynı parsel için farklı geometrik sınırlar üretir.",
          "",
          "```formula",
          "A_taban = A_parsel × TAKS",
          "@label: Taban alanı hesabı",
          "@symbol: A_taban | İzin verilen taban alanı hesabındaki alan | m²",
          "@symbol: A_parsel | Hesaba esas imar parseli alanı | m²",
          "@symbol: TAKS | Taban alanı katsayısı | -",
          "```",
          "",
          "```formula",
          "A_emsal = A_parsel × KAKS",
          "@label: Emsale esas toplam kat alanı hesabı",
          "@symbol: A_emsal | Emsale esas toplam kat alanı | m²",
          "@symbol: A_parsel | Hesaba esas imar parseli alanı | m²",
          "@symbol: KAKS | Kat alanı katsayısı / Emsal | -",
          "```"
        ),
        subsections: [],
      },
      {
        id: "ornek",
        title: "Basit aritmetik örneği",
        content: lines(
          "Net imar parseli 1.000 m², TAKS 0,30 ve Emsal 1,50 kabul edilen yalnızca aritmetik bir örnekte:",
          "",
          "- Taban alanı hesabı: 1.000 × 0,30 = **300 m²**",
          "- Emsale esas toplam kat alanı hesabı: 1.000 × 1,50 = **1.500 m²**",
          "",
          "![TAKS ile parsel oturumu ve KAKS ile kat alanı ilişkisi](/images/deprem-pilots/imar-taks-kaks-emsal-hesabi-diagram.svg)",
          "*Aynı parselde taban oturumu ile katlar boyunca biriken emsal alanının farklı kontroller olduğu gösterilmiştir.*",
          "{figure:1 | note:Örnek yalnız formül aritmetiğini anlatır; imar hakkı taahhüdü değildir. | source:Planlı Alanlar İmar Yönetmeliği kavramları | lightbox:true}",
          "",
          "> [!warning] 1.500 m² sonucu “kesin yapılabilir inşaat alanı” değildir",
          "> Çekme mesafeleri, bina yüksekliği/kat adedi, plan notları, otopark, yangın, erişilebilirlik, sığınak ve emsal dışı alan hükümleri gerçek projeyi ayrıca sınırlar."
        ),
        subsections: [],
      },
      {
        id: "2026-kontrolu",
        title: "2026 itibarıyla hangi metin kontrol edilmeli?",
        content: lines(
          "Planlı Alanlar İmar Yönetmeliği 3 Temmuz 2017'de yayımlanmış ve sonraki yıllarda birçok kez değiştirilmiştir. **1 Temmuz 2026 tarihli değişiklik** emsal hesapları ve TAKS uygulamalarına ilişkin hükümleri de yeniden düzenledi. Bu nedenle eski bir PDF'deki tek paragrafı veya internet hesaplayıcısını güncel mevzuat kabul etmek doğru değildir.",
          "",
          "- Önce yürürlükteki uygulama imar planını ve plan notlarını alın.",
          "- Hesaba esas parsel alanının net imar parseli alanı olup olmadığını doğrulayın.",
          "- Planda açıkça verilen TAKS/KAKS değerlerini esas alın; yönetmeliğin planda değer bulunmayan durumlara ilişkin genel hükümlerini ayrıca kontrol edin.",
          "- Emsal harici alanları tek bir genel yüzde varsayımıyla toplamayın; her alanın güncel yönetmelik ve plan notundaki karşılığını ayrı inceleyin.",
          "",
          "> [!regulation] Güncel değişiklik",
          "> Bakanlığın 1 Temmuz 2026 duyurusuna göre, uygulama imar planında TAKS değeri belirtilmeyen ayrık veya blok nizam alanlarda genel TAKS üst sınırı yüzde 40 olarak düzenlenmiştir. Parsel özelindeki plan hükmü ve diğer şartlar yine ayrıca okunmalıdır."
        ),
        subsections: [],
      },
      {
        id: "ofis-akisi",
        title: "Ofiste hızlı ön kontrol sırası",
        content: "Parsel alanı → plan/plan notu → TAKS → çekme mesafeleriyle gerçek oturum → KAKS/Emsal → kat yüksekliği ve bina yüksekliği → emsal dışı alanlar → otopark/yangın/erişilebilirlik/sığınak kontrolleri sırasıyla ilerlenirse, yalnız iki katsayıdan hareketle yanlış daire veya kat vaadi verme riski azalır.",
        subsections: [],
      },
    ],
    references: [
      { label: "ÇŞİDB — Planlı Alanlar İmar Yönetmeliği temel metni", href: IMAR_BASE },
      { label: "ÇŞİDB — Planlı Alanlar İmar Yönetmeliği'nde 1 Temmuz 2026 değişikliği", href: IMAR_2026 },
    ],
    keywords: ["TAKS", "KAKS", "emsal", "taban alanı", "imar parseli", "Planlı Alanlar İmar Yönetmeliği", "2026 imar"],
    tags: ["İmar", "TAKS KAKS", "Ön Fizibilite"],
  },
  {
    slug: "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
    title: "Isı Yalıtımında U Değeri ve Yoğuşma Kontrolü",
    description: "TS 825:2024 uygulamasında katmanlı yapı elemanının U değerini ısıl direnç üzerinden kurmayı ve yoğuşma riskini sıcaklık-buhar basıncı ilişkisiyle kontrol etmeyi açıklar.",
    seoTitle: "TS 825:2024 U Değeri ve Yoğuşma Kontrolü Rehberi",
    seoDescription: "U = 1/R_T hesabı, katman ısıl dirençleri, buhar basıncı ve yoğuşma kontrolü; 1 Nisan 2025'ten beri yürürlükteki TS 825 uygulaması.",
    updatedAt: UPDATED_AT,
    readTime: "8 dk",
    image: "/images/deprem-pilots/bep-isi-yalitim-u-degeri-yogusma-kontrolu-cover.svg",
    sections: [
      {
        id: "u-degeri",
        title: "U değeri katmanların toplam ısıl direncinden gelir",
        content: lines(
          "Düzlemsel, katmanlı bir yapı elemanında ısıl geçirgenlik hesabının temel fiziksel ilişkisi toplam ısıl direnç üzerinden kurulur. Her katmanın kalınlığı ve tasarım ısıl iletkenlik değeri toplam dirence katkı verir; yüzey dirençleri de ilgili hesap yöntemine göre eklenir.",
          "",
          "```formula",
          "R_T = R_si + Σ(d_i / λ_i) + R_se",
          "@label: Toplam ısıl direnç",
          "@symbol: R_T | Toplam ısıl direnç | m²K/W",
          "@symbol: R_si | İç yüzey ısıl direnci | m²K/W",
          "@symbol: d_i | i katmanının kalınlığı | m",
          "@symbol: λ_i | i katmanının tasarım ısıl iletkenliği | W/mK",
          "@symbol: R_se | Dış yüzey ısıl direnci | m²K/W",
          "```",
          "",
          "```formula",
          "U = 1 / R_T",
          "@label: Isıl geçirgenlik katsayısı",
          "@symbol: U | Yapı elemanının ısıl geçirgenlik katsayısı | W/m²K",
          "@symbol: R_T | Toplam ısıl direnç | m²K/W",
          "```",
          "",
          "> [!engineering] Yorum",
          "> Aynı sınır koşullarında U küçüldükçe elemandan iletim yoluyla geçen ısı akısı azalır. Ancak projede kullanılacak λ değerleri, yüzey dirençleri ve hedef U sınırları güncel TS 825 dokümanından alınmalıdır."
        ),
        subsections: [],
      },
      {
        id: "ts825-2024",
        title: "TS 825:2024 için güncel durum",
        content: lines(
          "Bakanlık tarafından güncellenen TS 825 Isı Yalıtım Standardı Tebliği **1 Nisan 2025** itibarıyla yürürlüğe girdi. Bakanlığın duyurusunda iklim bölgesi sayısının 4'ten **6 iklim bölgesine** çıkarıldığı ve soğutma ihtiyacının hesap kapsamına alınmasına yönelik metodolojik güncellemeler yapıldığı belirtilir.",
          "",
          "> [!warning] Eski tabloyu yeni projeye taşımayın",
          "> İnternetteki eski TS 825 U değeri tabloları, iklim bölgesi sayıları veya malzeme λ listeleri güncel proje için otomatik olarak geçerli kabul edilmemelidir. Ruhsat hesabında yürürlükteki standardın ve Bakanlık altyapısının istediği değerleri kullanın."
        ),
        subsections: [],
      },
      {
        id: "yogusma",
        title: "Yoğuşma kontrolünün fiziksel mantığı",
        content: lines(
          "Katmanlar boyunca sıcaklık düştükçe su buharının doygunluk basıncı da değişir. Bir ara yüzeyde gerçek su buharı kısmi basıncı, o sıcaklıktaki doygunluk buhar basıncını aşarsa yoğuşma riski oluşur. Standardın hesap prosedürü malzeme ve iklim verileriyle uygulanmalıdır; aşağıdaki ifade yalnız kontrol mantığını özetler.",
          "",
          "```formula",
          "p_v(x) <= p_sat(θ_x)",
          "@label: Yoğuşmasız ara yüzey için fiziksel kontrol ilkesi",
          "@symbol: p_v(x) | x konumundaki su buharı kısmi basıncı | Pa",
          "@symbol: p_sat(θ_x) | θ_x sıcaklığındaki doygunluk buhar basıncı | Pa",
          "@symbol: θ_x | Katman ara yüzey sıcaklığı | °C",
          "```",
          "",
          "![Katmanlı duvarda ısı akışı, sıcaklık ve buhar basıncı kontrolü](/images/deprem-pilots/bep-isi-yalitim-u-degeri-yogusma-kontrolu-diagram.svg)",
          "*Katman kalınlıkları boyunca sıcaklık düşümü ile buhar basıncı kontrolünün birlikte okunması.*",
          "{figure:1 | note:Şema fiziksel kontrol mantığını gösterir; TS 825 hesap tablosunun yerine geçmez. | source:TS 825 ısı ve nem hesabı yaklaşımı | lightbox:true}"
        ),
        subsections: [],
      },
      {
        id: "proje-kontrolu",
        title: "Proje kontrol listesi",
        content: lines(
          "1. Yapı elemanı katmanlarını içten dışa doğru doğru sırada tanımlayın.",
          "2. Her katmanın d ve λ değerini güncel, belgeli kaynaktan alın.",
          "3. Toplam R_T ve U değerini yürürlükteki TS 825 sınırlarıyla karşılaştırın.",
          "4. Isıl köprüleri yalnız düzlemsel U hesabının içinde kaybolmuş varsaymayın; proje detaylarında ayrıca çözün.",
          "5. Yoğuşma hesabında iç/dış iklim, buhar direnci ve ara yüzey sıcaklıklarını standardın yöntemiyle değerlendirin.",
          "6. Bakanlığın Isı Yalıtım Raporu çıktısı ile mimari sistem detaylarının aynı katmanları kullandığını doğrulayın."
        ),
        subsections: [],
      },
    ],
    references: [
      { label: "ÇŞİDB — TS 825 Isı Yalıtım Standardı Tebliği güncellemesi (20.02.2025)", href: TS825_2025 },
      { label: "ÇŞİDB — Isı Yalıtım Uygulaması ve 1 Nisan 2025 yürürlük duyurusu", href: TS825_APP },
      { label: "TSE — TS 825:2024 Binalarda Isı Yalıtım Kuralları", href: "https://www.tse.org.tr/", note: "Standart metni ve güncel sürüm bilgisi için." },
    ],
    keywords: ["TS 825:2024", "U değeri", "ısıl direnç", "ısı yalıtımı", "yoğuşma", "buhar basıncı", "BEP"],
    tags: ["TS 825:2024", "Enerji", "Isı Yalıtımı"],
  },
];

const PILOT_BY_SLUG = new Map(DEPREM_PILOT_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PILOT_SLUGS = new Set(DEPREM_PILOT_ARTICLES.map((article) => article.slug));

export function applyDepremPilotOverride(article: ArticleData): ArticleData {
  const override = PILOT_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPilotContentSignature(): string {
  return DEPREM_PILOT_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.title}:${article.image}`)
    .join("|");
}
