import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const SU_YALITIM_MEVZUAT = "https://meslekihizmetler.csb.gov.tr/mevzuat-ve-tebligler-i-112709";
const SU_YALITIM_SARTNAME = "https://webdosya.csb.gov.tr/db/yfk/icerikler/c19---su-yalitim-isler--20190412161733.pdf";

export const DEPREM_PHASE4_SU_YALITIMI: DepremPhase4Override = {
  slug: "su-yalitimi-ts-4749-uygulama-detaylari",
  description: "Temel, döşeme ve bodrum perdelerinde su yalıtımını güncel Binalarda Su Yalıtımı Yönetmeliği esaslarıyla; su etkisinin sınıflandırılması, drenaj gereği, yalıtım yöntemi, derz-geçiş detayları, koruma tabakası ve proje disiplinleri arası koordinasyon üzerinden açıklar.",
  seoTitle: "Temel ve Bodrum Perdelerinde Su Yalıtımı | Güncel Uygulama Rehberi",
  seoDescription: "Binalarda Su Yalıtımı Yönetmeliği Madde 6, 9-13: basınçlı/basınçsız su, k=10^-4 m/s eşiği, yeraltı suyu, drenaj, temel/perde detayları ve güncel standartlar.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "guncel-dayanak",
      title: "Eski standard numarasını değil, yürürlükteki Yönetmelik ve güncel uygulama standartlarını esas alın",
      content: phase4Lines(
        "Bu sayfanın URL'sinde tarihsel olarak **TS 4749** ifadesi bulunuyor. Ancak proje kontrolünde bir standard numarasını yalnız slug'da geçtiği için güncel bağlayıcı kural gibi kullanmak doğru değildir. Güncel ana mevzuat **Binalarda Su Yalıtımı Yönetmeliği**dir; Bakanlığın Su Yalıtım İşleri Genel Teknik Şartnamesi de uygulama türüne göre güncel ürün ve uygulama standartlarını listeler.",
        "",
        "Bakanlığın güncel teknik şartnamesinde temel/perde uygulamaları için örneğin **TS EN 15814**, **TS 13671** ve **TS 13766** gibi standartlar yer alır. Seçilen sistemin ürün standardı, uygulama kuralı ve üretici teknik dokümanı proje tarihinde yeniden doğrulanmalıdır.",
        "",
        "Dolayısıyla bu rehberin karar zinciri 'TS 4749'da ne yazıyordu?' sorusundan değil, **hangi su etkisi var → hangi sistem gerekli → hangi güncel standart o sistem için geçerli** sırasından kurulur."
      ),
      subsections: [],
    },
    {
      id: "madde-6-proje",
      title: "Madde 6 su yalıtımını mimari, tesisat ve gerektiğinde statik projenin ortak detayı yapar",
      content: phase4Lines(
        "Binalarda Su Yalıtımı Yönetmeliği **Madde 6**, su yalıtım detaylarının, drenaj sistemlerinin ve kullanılacak malzemelerin ilgili standartlarıyla birlikte mimari ve tesisat projelerinde gösterilmesini ister. **Temel altı, iksa yüzeyleri ve dilatasyon gibi taşıyıcı sistemle ilişkili detaylar statik projede de belirtilir.**",
        "",
        "Bu hüküm su yalıtımını şantiyede sonradan seçilecek bir kaplama olmaktan çıkarır. Radye altı bohçalama, perde dış yüzeyi, temel-perde birleşimi, iksa tarafı tek yüz kalıp çözümü, dilatasyon ve tesisat penetrasyonları proje aşamasında çözülmelidir.",
        "",
        "Proje detayında yalnız ürün adı değil; sistem katmanları, gerekli kalınlık/sarfiyat, bindirme/ek yerleri, koruma katmanı, bitiş kotu ve tahliye bağlantıları okunabilmelidir."
      ),
      subsections: [],
    },
    {
      id: "madde-9-su-etkisi",
      title: "Madde 9'da ilk karar malzeme değil, basınçlı veya basınçsız su etkisidir",
      content: phase4Lines(
        "Toprakla temas eden temel, döşeme ve perde duvarlarda tasarım; zemin ve temel etüt raporundaki **geçirgenlik, yeraltı su seviyesi, zemin/su kimyası ve mevsimsel en yüksek yeraltı su seviyesi** dikkate alınarak yapılır.",
        "",
        "| Zemin / su durumu | Yönetmelik yaklaşımı |",
        "|---|---|",
        "| Yeraltı suyu üstünde, çok geçirgen zemin `k ≥ 10^-4 m/s` ve uygun drenaj | Basınçsız su etkisi |",
        "| Yeraltı suyu üstünde, az geçirgen `k < 10^-4 m/s`, su birikmiyor | Basınçsız su etkisi |",
        "| Az geçirgen zemin, drenaj yok ve geçici su birikerek hidrostatik basınç oluşturuyor | **Basınçlı su etkisi** |",
        "| Temel/perde yeraltı su seviyesinin altında | Geçirgenlikten bağımsız **basınçlı su etkisi** |",
        "",
        "Ayrıca yapı yüksekliği **51,50 m'yi aşan** veya kapalı kullanma alanı **10.000 m²'den fazla** olan bodrumlu binalarda her koşulda basınçlı su etkisine göre su yalıtımı yapılır."
      ),
      subsections: [],
    },
    {
      id: "drenaj-ve-yeralti-suyu",
      title: "Drenaj su yalıtımının alternatifi değil; Madde 10 ve 13'e göre sistemi tamamlayan tahliye bileşenidir",
      content: phase4Lines(
        "Yönetmelik **Madde 10**, tabii/tesviye zemin kotu ile temel alt kotu arasındaki mesafe **3 m'den fazla** ise veya arazi eğimi yapı çevresinde su birikmesine yol açabiliyorsa temel yalıtımının drenaj sistemiyle birlikte kurulmasını ister.",
        "",
        "Temel çukurunda yeraltı suyu görülürse su temel taban kotunun altına düşürülmeden önce **komşu yapıların su düşümünden etkilenme durumu** etüt edilmelidir. Dewatering, yalnız şantiye kolaylığı değil çevre zemin deformasyonunu etkileyen geoteknik bir işlemdir.",
        "",
        "Madde **13** çevresel drenajı drenaj tabakası + boru + kontrol/bakım rögarlarıyla tanımlar; boru çevresinde yataklama ve filtrasyon önlemi ister ve toplanan suyun ilgili idarenin belirlediği şekilde deşarj edilmesini şart koşar. Drenajın varlığı, tasarım su seviyesini gerekçesiz sıfırlama hakkı vermez."
      ),
      subsections: [],
    },
    {
      id: "madde-11-sistem-secimi",
      title: "Yalıtım sistemi su etkisine göre yüzeysel, yapısal veya uyumlu birleşik çözüm olarak seçilir",
      content: phase4Lines(
        "Madde **11**, toprakla temas eden temel, döşeme ve perdelerde örtü veya sürme esaslı **yüzeysel yalıtım** ve/veya **yapısal yalıtım** yaklaşımına izin verir. Birden fazla malzeme ancak birbirleriyle uyumlu ise birlikte kullanılabilir.",
        "",
        "Basınçlı su etkisine maruz **yatay yüzeylerde**, yüzeysel yalıtım sisteminin **örtü tipi malzemelerle** oluşturulması esastır. Yapısal geçirimsizlik seçiliyorsa beton tasarımı, çatlak kontrolü, soğuk derzler ve sızdırmazlık tamamlayıcıları sistemin ayrılmaz parçasıdır.",
        "",
        "Malzeme; hidrostatik basınçta su geçirimsizliğini korumalı, zemin/yeraltı suyundaki kimyasallara dayanmalı ve oturma/hareket kaynaklı deformasyonları karşılayacak mekanik özellik veya çatlak köprüleme kabiliyetine sahip olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "derz-ve-sureklilik",
      title: "Su çoğunlukla katmanın ortasından değil, süreksizlik detaylarından girer",
      content: phase4Lines(
        "Yönetmelik **Madde 8 ve 12**, dilatasyon, tesisat geçişleri, zemin-duvar ve duvar-duvar birleşimleri gibi süreksizliklerde su geçirimsizliğini sürdürecek tamamlayıcı ürün ve ilave tedbir ister. Betonarme imalat sırasında su tutucu bant, suyla şişen bant ve dilatasyon bantları projedeki konumunda yerleştirilmelidir.",
        "",
        "Temel altı örtünün perde yüzeyine dönüşü, radye-perde soğuk derzi, perde tij delikleri, boru kovanları, asansör çukuru ve dilatasyonlar saha kontrol listesinde ayrı kalem olmalıdır. Yalıtım sistemi bodrumlu/bodrumsuz binalarda en az **su basman seviyesine kadar süreklilik** sağlayacak biçimde devam eder.",
        "",
        "Tek yüz kalıplı iksa tarafında çözüm uygulanacaksa yalıtımın hangi yüzeye, hangi koruma/taşıyıcı katmanla ve beton dökümünden önce nasıl sabitleneceği proje detayında ayrıca çözülmelidir."
      ),
      subsections: [],
    },
    {
      id: "koruma-ve-dolgu",
      title: "Dolgudan önce koruma katmanı ve drenaj işlevi saha kabulünün parçasıdır",
      content: phase4Lines(
        "Madde **12.6**, su yalıtımı tamamlandıktan sonra dolgu ve diğer imalatların yalıtım katmanını darbe, çarpma ve gerekirse iklim etkilerine karşı korumasını ister. Koruma duvarı, ısı yalıtım levhası ve/veya drenaj levhası gibi çözümler sistem tasarımına göre kullanılabilir.",
        "",
        "Dolgu malzemesi drenajın çalışmasını engellememeli ve yalıtım/koruma katmanına zarar vermeyecek dane boyutu ve uygulama yöntemine sahip olmalıdır. Perde etrafındaki drenaj borusu, filtre/yataklama katmanı ve rögarlar dolgu kapanmadan fotoğraflı kontrol edilmelidir.",
        "",
        "Şantiye kabulünde 'membran var' kontrolü yeterli değildir: yüzey hazırlığı, bindirmeler, penetrasyonlar, koruma, drenaj sürekliliği ve nihai deşarj birlikte doğrulanır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] URL'deki **TS 4749** ifadesini güncel proje hükmü olarak otomatik kullanmadım; Yönetmelik ve proje tarihindeki güncel standartları doğruladım.",
        "- [ ] Zemin raporundan geçirgenlik, mevsimsel en yüksek yeraltı suyu ve kimyasal ortam verilerini aldım.",
        "- [ ] `k ≥ 10^-4 m/s` / `k < 10^-4 m/s`, drenaj ve su birikmesi durumuna göre basınçlı–basınçsız su etkisini seçtim.",
        "- [ ] Yeraltı suyu altında veya yüksek/büyük bodrumlu bina koşulunda basınçlı su tasarımını uyguladım.",
        "- [ ] Kot farkı **>3 m** veya yüzey suyu birikmesi riski varsa drenaj sistemini projelendirdim.",
        "- [ ] Temel altı, perde dönüşü, soğuk derz, dilatasyon ve tesisat geçişlerini detaylandırdım.",
        "- [ ] Su tutucu/şişen bantların konumlarını beton dökümünden önce kontrol ettim.",
        "- [ ] Dolgudan önce yalıtım korumasını, drenaj borusu/filtre/rögar sürekliliğini ve deşarj noktasını doğruladım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Binalarda Su Yalıtımı Yönetmeliği (resmî mevzuat erişim sayfası)",
      href: SU_YALITIM_MEVZUAT,
      note: "Bakanlığın mevzuat sayfasında Binalarda Su Yalıtımı Yönetmeliğine güncel resmî erişim verilir.",
    },
    {
      label: "ÇŞİDB/Yüksek Fen Kurulu — Su Yalıtım İşleri Genel Teknik Şartnamesi",
      href: SU_YALITIM_SARTNAME,
      note: "Temel, perde ve çatı uygulamalarındaki güncel teknik şartname ve ilgili standart listeleri için resmî Bakanlık kaynağı.",
    },
  ],
  keywords: ["su yalıtımı", "temel yalıtımı", "bodrum perdesi", "basınçlı su", "drenaj", "TS 13671", "TS 13766"],
  tags: ["su yalıtımı", "temel", "bodrum", "drenaj"],
};
