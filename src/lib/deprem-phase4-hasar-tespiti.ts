import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const HASAR_TESPIT_GENELGESI = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/Genelge/Hasar_Tespit_Genelgesi_ve_Ekleri.pdf";
const AFET_HASAR_MEVZUATI = "https://yapiisleri.csb.gov.tr/afet-koordinasyon-dairesi-ve-afet-hasarlari-tespiti-dairesi-mevzuati-102056";

export const DEPREM_PHASE4_HASAR_TESPITI: DepremPhase4Override = {
  slug: "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi",
  description: "Türkiye'de afet sonrası bina hasar tespitinin AFAD 7663 sayılı Genelge kapsamındaki amacını, resmî hasar derecelerini, acil yıktırılacak bina sürecini ve 'yeşil-sarı-kırmızı etiket' yaklaşımının resmî Türk hasar sınıflandırmasıyla karıştırılmaması gerektiğini açıklar.",
  seoTitle: "Deprem Sonrası Bina Hasar Tespiti | Resmî Hasar Dereceleri ve Etiket Ayrımı",
  seoDescription: "AFAD 7663 Hasar Tespit Genelgesi kapsamında afet etkisi belirleme, kesin/itiraz hasar tespiti, Hasarsız-Az-Orta-Ağır-Yıkık dereceleri ve acil yıktırılacak bina süreci.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "resmi-tanim",
      title: "Resmî hasar tespiti, gerçekleşen afetin binada oluşturduğu hasarı gözlemsel olarak derecelendirir",
      content: phase4Lines(
        "AFAD'ın **14.04.2014 tarihli 7663 sayılı Hasar Tespit Genelgesi**, hasar tespitini meydana gelen afetin binaya verdiği hasarın **gözlemsel olarak değerlendirilip derecelendirilmesi** olarak tanımlar.",
        "",
        "Genelge, bu çalışmanın 7269 sayılı Kanun kapsamındaki acil yardım, hak sahipliği, kira yardımı ve yer seçimi gibi sonraki işlemlere hazırlık niteliğinde olduğunu; binanın **muhtemel afetler karşısındaki davranışını, performansını ve riskini ortaya koyan bir çalışma olmadığını** özellikle ayırır.",
        "",
        "Ayrıca değerlendirme yalnız gerçekleşen afetin oluşturduğu hasara yöneliktir. Önceden var olan hasarlar, bakım eksikliği, ekonomik ömür, projelendirme veya imalat kusurları aynı afetin hasarıymış gibi derecelendirmeye dahil edilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "renk-etiket-ayrimi",
      title: "Yeşil–sarı–kırmızı üçlüsü AFAD 7663'ün resmî hasar derece sistemi değildir",
      content: phase4Lines(
        "Eski slug'da geçen 'yeşil-sarı-kırmızı etiket' ifadesi, uluslararası bazı hızlı bina güvenlik tarama sistemlerindeki renkli etiket mantığıyla ilişkilidir. Ancak Türkiye'deki **AFAD 7663 Hasar Tespit Genelgesi ve ek formları**, resmî hasar sonuçlarını üç renkli bir sistem olarak tanımlamaz.",
        "",
        "Genelgenin kesin ve itiraz hasar tespit formlarında kullanılan ana dereceler **Hasarsız, Az Hasarlı, Orta Hasarlı, Ağır Hasarlı ve Yıkık** biçimindedir. Ayrıca tehlikeli durumu nedeniyle derhal işlem gerektiren yapı için ayrı **Acil Yıktırılacak Bina Raporu (Ek-2)** bulunur.",
        "",
        "Bu nedenle Türkiye'deki resmî hasar tespitini anlatan bir teknik içerikte 'yeşil = güvenli, sarı = sınırlı kullanım, kırmızı = girilmez' şeklinde evrensel ve resmî bir Türk sınıflandırması varmış gibi tablo vermek doğru değildir. Başka bir renkli etiket metodolojisi kullanılacaksa adı ve kaynağı ayrıca belirtilmelidir."
      ),
      subsections: [],
    },
    {
      id: "is-akisi",
      title: "Hasar tespit süreci tek aşamalı bir saha etiketi değil, birbirini izleyen resmî işlemlerden oluşur",
      content: phase4Lines(
        "7663 sayılı Genelge ve Bakanlığın afet hasar tespit görev tanımları birlikte okunduğunda süreç; afet etkisinin belirlenmesi, gerekli acil işlemler, kesin hasar tespiti ve itiraz değerlendirmesi gibi farklı safhalara ayrılır.",
        "",
        "| Safha | Temel amaç | Çıktı / işlem |",
        "|---|---|---|",
        "| **Afet etkisi belirleme** | Hasarın yoğun olduğu alanları, acil yardım gereksinimini ve genel etkiyi hızlıca belirlemek | Ön bilgi ve acil yardım formları |",
        "| **Acil yıktırılacak bina tespiti** | Ağır hasarlı ve tehlikeli durumu nedeniyle acil müdahale gereken binayı ayırmak | Ek-2 Acil Yıktırılacak Bina Raporu |",
        "| **Kesin hasar tespiti** | Binaları tek tek inceleyip resmî hasar derecesini belirlemek | Kesin hasar tespit raporu ve listeleri |",
        "| **İtiraz hasar tespiti** | İlan edilen kesin hasar sonucuna yapılan itirazı yeniden teknik incelemeye tabi tutmak | İtiraz hasar tespit raporu/listesi |",
        "",
        "Aynı binanın farklı tarihlerdeki kayıtlarını karşılaştırırken hangi safhanın sonucu olduğunun yazılması gerekir; 'ilk etiket' ile 'kesin/itiraz sonucu' aynı veri alanı gibi tutulmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "resmi-hasar-dereceleri",
      title: "Resmî sonuçlar hasar derecesiyle tutulur; aciliyet ile hasar derecesini birbirine karıştırmayın",
      content: phase4Lines(
        "AFAD ek formları hasar tespit sonuçlarını aşağıdaki ana derece alanlarıyla izler:",
        "",
        "| Resmî derece / durum | Kayıt mantığı |",
        "|---|---|",
        "| **Hasarsız** | Gerçekleşen afet nedeniyle hasar tespit edilmeyen yapı |",
        "| **Az Hasarlı** | Afetin oluşturduğu sınırlı hasar derecesi |",
        "| **Orta Hasarlı** | Az hasardan daha ileri, fakat ağır/yıkık sınıfından ayrı hasar derecesi |",
        "| **Ağır Hasarlı** | Ağır hasar derecesi |",
        "| **Yıkık** | Yapının afet nedeniyle yıkık/enkaz durumunda olması |",
        "| **Acil Yıktırılacak** | Genelgede ayrı raporlanan, tehlikeli durumu nedeniyle acil boşaltma/yıkım işlemi gerektiren durum |",
        "",
        "Buradaki son satır bir 'renk etiketi' değildir. Genelge Ek-2'de, ağır hasar görmüş ve tehlikeli durumu nedeniyle acilen yıktırılması gereken bina için ayrı rapor düzenlenmesini öngörür. Bu ayrım veri tabanında da korunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "bina-duzeyi-karar",
      title: "Çok katlı binada hasar sonucu bağımsız bölüm bazında parçalanmaz",
      content: phase4Lines(
        "7663 sayılı Genelgenin **9. maddesi**, birden fazla bağımsız bölümü bulunan çok katlı binalara kat veya konut ayrımı yapılmaksızın **tek bir hasar derecesi** verilmesini; buna karşılık tüm bağımsız birim bilgilerinin rapor ve listelerde ayrı ayrı kaydedilmesini öngörür.",
        "",
        "Bu kural özellikle apartmanlarda önemlidir. Bir dairenin sıvası az hasarlı görünürken başka bir katta taşıyıcı sistemde daha ciddi hasar varsa 'daire daire farklı resmî bina hasar derecesi' üretmek genelgedeki bina düzeyi kayıt mantığıyla uyumlu değildir.",
        "",
        "Saha notu ve bağımsız bölüm gözlemi ayrıntılı tutulabilir; fakat resmî bina hasar sonucu ile bağımsız bölümdeki lokal gözlem aynı alan olarak kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "saha-kaydi",
      title: "Saha kaydı fotoğraf, yapı kimliği ve taşıyıcı sistem bilgisiyle izlenebilir olmalıdır",
      content: phase4Lines(
        "Genelge, hasar derecelendirmesine esas tespitlerin fotoğraflanmasını ister. Kesin hasar tespit formu da adres/kimlik bilgilerinin yanında yapı tipi, kullanım amacı, kat adedi, taşıyıcı sistem, döşeme, çatı, taşıyıcı ve taşıyıcı olmayan sistem hasar bilgileri gibi alanlar içerir.",
        "",
        "Pratik kayıt düzeni şu omurgayı korumalıdır:",
        "",
        "1. İl–ilçe–mahalle/köy, açık adres ve mümkünse koordinat.",
        "2. Yapının kimliği, kullanım amacı ve temel geometrik bilgileri.",
        "3. Taşıyıcı sistem türü ve kat bilgileri.",
        "4. Taşıyıcı / taşıyıcı olmayan eleman hasar gözlemleri.",
        "5. Hasar derecesini destekleyen fotoğraflar ve fotoğraf numarası.",
        "6. İnceleme safhası: afet etkisi belirleme, kesin hasar veya itiraz.",
        "",
        "Amaç yalnız son dereceyi yazmak değil, o dereceye hangi saha gözlemiyle ulaşıldığını geriye dönük izleyebilmektir."
      ),
      subsections: [],
    },
    {
      id: "performans-farki",
      title: "Hasar tespit sonucu gelecekteki deprem performansı veya TBDY Bölüm 15 sonucu değildir",
      content: phase4Lines(
        "AFAD Genelgesi'nin kapsam tanımı ile TBDY **15.1.6** aynı kritik ayrımı farklı yönden pekiştirir. Hasar tespit çalışması olmuş afetin verdiği hasarı derecelendirir; TBDY ise binada hasara neden olan bir deprem sonrasında hasarlı binanın deprem güvenliğinin normal Bölüm 15 değerlendirmesiyle belirlenemeyeceğini söyler.",
        "",
        "Bu nedenle aşağıdaki çıkarımlar otomatik yapılamaz:",
        "",
        "- 'Hasarsız/az hasarlı çıktı → gelecekteki DD-2 depreminde performansı yeterlidir.'",
        "- 'Orta/ağır hasarlı çıktı → 6306 kapsamında otomatik riskli yapıdır.'",
        "- 'Renk etiketi yeşil → mühendislik performans analizi gereksizdir.'",
        "",
        "Deprem performansı, riskli yapı tespiti, onarım/güçlendirme tasarımı ve afet sonrası resmî hasar derecesi; amacı, mevzuatı, veri kapsamı ve sonuç formatı farklı süreçlerdir."
      ),
      subsections: [],
    },
    {
      id: "veri-modeli",
      title: "Dijital hasar tespit kaydında derece, süreç safhası ve karar tarihi ayrı alanlar olmalıdır",
      content: phase4Lines(
        "Hasar tespit verisini yazılım veya tabloya aktarırken yalnız 'durum' adlı tek seçim alanı kullanmak izlenebilirliği zayıflatır. En azından şu alanlar birbirinden ayrılmalıdır:",
        "",
        "| Alan | Örnek değer |",
        "|---|---|",
        "| İnceleme safhası | Afet etkisi / Kesin / İtiraz |",
        "| Hasar derecesi | Hasarsız / Az / Orta / Ağır / Yıkık |",
        "| Acil işlem | Acil yıktırılacak raporu var / yok |",
        "| İnceleme tarihi | Güncel saha inceleme tarihi |",
        "| Heyet / kayıt | Rapor veya form referansı |",
        "| Fotoğraf kanıtı | Fotoğraf numaraları / dosya bağlantıları |",
        "",
        "Böylece kesin sonuç ile itiraz sonucu, bina hasar derecesi ile acil yıkım kararı ve saha gözlemi ile sonraki idari işlem birbirine karışmaz."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Kullanılan ana dayanak **14.04.2014 tarihli 7663 sayılı Hasar Tespit Genelgesi** olarak açıkça belirtildi mi?",
        "- İncelemenin yalnız gerçekleşen afetin oluşturduğu hasarı değerlendirdiği, gelecekteki deprem **performansını ve riskini** belirlemediği yazıldı mı?",
        "- 'Yeşil-sarı-kırmızı' üçlüsü resmî AFAD hasar derecesi gibi sunulmaktan çıkarıldı mı?",
        "- Kayıtlarda **Hasarsız, Az Hasarlı, Orta Hasarlı, Ağır Hasarlı, Yıkık** dereceleri doğru isimlerle tutuluyor mu?",
        "- **Acil Yıktırılacak Bina Raporu** hasar derecesinden ayrı acil işlem olarak izleniyor mu?",
        "- Afet etkisi belirleme, **Kesin hasar tespiti** ve **itiraz hasar tespiti** safhaları birbirinden ayrıldı mı?",
        "- Çok katlı binada tek bina hasar derecesi ile bağımsız bölüm gözlemleri birbirine karıştırılmadı mı?",
        "- Hasar kararını destekleyen fotoğraf, adres/koordinat, taşıyıcı sistem ve kat bilgileri kayda bağlandı mı?",
        "- Hasarlı binanın gelecekteki deprem güvenliği için TBDY **15.1.6** kapsam sınırı ayrıca dikkate alındı mı?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase4References("Bölüm 15.1.6–15.1.7 — deprem sonrası hasarlı bina kapsam sınırı"),
    {
      label: "AFAD — 7663 sayılı Hasar Tespit Genelgesi ve Ekleri",
      href: HASAR_TESPIT_GENELGESI,
      note: "Afet sonrası hasar tespitinin tanımı, kapsamı, süreç safhaları ve resmî formları için ana kaynak.",
    },
    {
      label: "ÇŞİDB Yapı İşleri — Afet Koordinasyon Dairesi ve Afet Hasarları Tespiti Dairesi Mevzuatı",
      href: AFET_HASAR_MEVZUATI,
      note: "Hasar Tespit Genelgesi'nin Bakanlığın güncel afet hasar mevzuatı listesinde yer aldığını ve ilgili görev alanını doğrulayan resmî sayfa.",
    },
  ],
  keywords: ["hasar tespit", "7663", "deprem sonrası hasar", "az hasarlı", "orta hasarlı", "ağır hasarlı", "acil yıktırılacak", "itiraz hasar tespiti", "TBDY 15.1.6"],
  tags: ["Hasar Tespit", "AFAD 7663", "Mevcut Bina", "Afet Sonrası", "TBDY Bölüm 15"],
};
