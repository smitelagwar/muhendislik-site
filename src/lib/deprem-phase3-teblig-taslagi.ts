import { PHASE3_UPDATED_AT, TBDY_PAGE, TBDY_PDF, phase3Lines, type DepremPhase3Override } from "./deprem-phase3-shared";

const RESMI_GAZETE = "https://www.resmigazete.gov.tr/";
const AFAD_2019_REPORT = "https://afad.gov.tr/kurumlar/afad.gov.tr/e_Kutuphane/Kurumsal-Raporlar/AFAD-2019-Idare-Faaliyet-Raporu1.pdf";
const IMO_DRAFT_NOTICE = "https://www.imo.org.tr/TR%2C215032/sosyal-mecralarda-yer-alan-yeni-tbdy-tebligi-hakkinda-duyuru.html";
const IMO_DRAFT_SEMINAR = "https://www.imo.org.tr/TR%2C216364/tbdy-2018nin-uygulama-esaslarina-iliskin-teblig-taslagi-konulu-seminer-gerceklestirildi--02-mayis-2026.html";

export const DEPREM_PHASE3_TEBLIG_TASLAGI: DepremPhase3Override = {
  slug: "tbdy-uygulama-esaslari-taslak-statusu",
  description: "2026'da dolaşıma giren yeni TBDY Uygulama Esasları tebliğ taslağının hukuki statüsünü, 17 Temmuz 2019'da yayımlanmış ve yürürlükte olan Uygulama Esaslarına Dair Tebliğ'den ayırarak açıklar.",
  seoTitle: "2026 TBDY Tebliğ Taslağı Resmî Statüsü | 2019 Tebliğinden Farkı",
  seoDescription: "2026'da paylaşılan yeni TBDY uygulama esasları taslağı yürürlükte mi? 2019 tarihli yürürlükteki Tebliğ ile taslak metnin hukuki ve proje kullanım farkı.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "iki-farkli-metin",
      title: "Önce iki farklı metni ayırın: 2019 yürürlükteki Tebliğ ve 2026 taslağı",
      content: phase3Lines(
        "“TBDY uygulama esasları” ifadesi 2026 tartışmalarında iki farklı belgeyi birbirine karıştırmaya elverişlidir. **17 Temmuz 2019 tarihli, 30834 sayılı Resmî Gazete'de yayımlanan `Türkiye Bina Deprem Yönetmeliği Kapsamında Yapılacak Binalarla İlgili Uygulama Esaslarına Dair Tebliğ` yürürlüğe girmiş resmî düzenlemedir.** Buna karşılık 2026'da sosyal mecralarda `...Uygulama Esaslarına İlişkin Tebliğ` başlığıyla dolaşıma giren yeni metin ayrı bir taslaktır.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> 2019 Tebliği = yayımlanmış ve ruhsatlandırma süreçlerinde yürürlükteki düzenleme. 2026 metni = yeni teknik hükümler öneren taslak; Resmî Gazete yayımı olmadan bağlayıcı proje kuralı değildir. Hesap raporunda ikisini aynı “TBDY tebliği” adı altında kaynak göstermeyin."
      ),
      subsections: [],
    },
    {
      id: "2019-yururlukteki-teblig",
      title: "2019 Uygulama Esaslarına Dair Tebliğ neyi düzenler?",
      content: phase3Lines(
        "AFAD'ın 2019 faaliyet raporu, TBDY'nin yerelde farklı uygulanmasının önüne geçmek amacıyla ruhsatlandırma hizmetlerine ilişkin usul ve esasları belirleyen Tebliğin **17 Temmuz 2019 tarih ve 30834 sayılı Resmî Gazete'de yayımlandığını** kaydeder. Tebliğ yayımlandığı tarihte yürürlüğe girmiştir.",
        "",
        "Madde 4'ün ana çerçevesinde TBDY hükümlerinin hangi ruhsat başvurularında uygulanacağı tarif edilir; 1 Ocak 2019 sonrası yeni/değiştirilecek/büyütülecek binalar, BKS değişikliği veya esaslı tadilat, belirli ruhsat yenileme durumları ve eksik katlı yapılara kat ilavesi gibi başlıklar bu çerçevededir.",
        "",
        "| Belge | Statü | Projede kullanım |",
        "|---|---|---|",
        "| 18.03.2018 TBDY | Yönetmelik; 01.01.2019 yürürlük | Teknik deprem tasarım hükümleri |",
        "| 17.07.2019 Uygulama Esaslarına **Dair** Tebliğ | Resmî Gazete 30834; yürürlükte | TBDY'nin ruhsatlandırma/uygulama geçiş esasları |",
        "| 2026 Uygulama Esaslarına **İlişkin** Tebliğ metni | Taslak | Resmî yayıma kadar bağlayıcı kural olarak kullanılmaz |"
      ),
      subsections: [],
    },
    {
      id: "2026-taslak-statusu",
      title: "2026 taslağının 25 Ağustos 2026 itibarıyla doğrulanan statüsü",
      content: phase3Lines(
        "TMMOB İnşaat Mühendisleri Odası 2 Mart 2026 tarihli duyurusunda sosyal medyada paylaşılan yeni metnin ilgili Bakanlıkça **henüz Resmî Gazete'de yayımlanmadığını ve hukuki geçerliliğinin bulunmadığını** açıkça bildirdi. İMO'nun 2 Mayıs 2026 tarihli etkinliği de metni hâlâ “TBDY (2018)'nin Uygulama Esaslarına İlişkin Tebliğ Taslağı” olarak adlandırdı.",
        "",
        "**25 Ağustos 2026 güncellemesi:** Resmî Gazete ve güncel resmî/meslek odası kayıtlarında bu yeni 2026 taslağının yürürlüğe girdiğini gösteren bir yayıma rastlanmamıştır. Bu nedenle bu makalede yeni metnin statüsü **taslak — yürürlükte değil** olarak korunmaktadır.",
        "",
        "> [!warning] Statü zamanla değişebilir",
        "> Bu bilgi tarih damgalıdır. Yeni metin ileride Resmî Gazete'de yayımlanırsa yürürlük tarihi, geçiş hükümleri ve nihai metnin taslaktan farkları yeniden doğrulanmadan bu makaledeki statü kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "taslak-nasil-kullanilir",
      title: "Taslak metin teknik incelemede kullanılabilir; mevzuat girdisi olarak kullanılamaz",
      content: phase3Lines(
        "Bir taslak, olası gelecek değişiklikleri anlamak, kurum içi hazırlık yapmak ve mevcut hesap akışının hangi noktalarının etkilenebileceğini görmek için teknik olarak incelenebilir. Ancak resmî yayımdan önce taslaktaki katsayı, eşik, yöntem veya detay şartını “yürürlükteki TBDY kuralı” etiketiyle projeye aktarmak mevzuat kaynağını yanlış gösterir.",
        "",
        "| Kullanım | Uygun mu? |",
        "|---|---|",
        "| Gelecek değişikliklere hazırlık / fark analizi | Evet, açıkça TASLAK etiketiyle |",
        "| Eğitim ve senaryo çalışması | Evet, yürürlükteki kuraldan ayrılarak |",
        "| Ruhsat projesinde bağlayıcı madde diye atıf | Hayır, resmî yayım yoksa |",
        "| Yürürlükteki TBDY 2018 hükmünün yerine koymak | Hayır |",
        "",
        "> [!check] SOURCE_VALUE disiplini",
        "> Ruhsat ve tasarım kararındaki sayısal değerlerin kaynağını yürürlükteki yönetmelik/tebliğ maddesine bağlayın. Taslaktan alınan bir değeri yalnız karşılaştırma amacıyla kullanıyorsanız `DRAFT_VALUE` olarak açıkça işaretleyin."
      ),
      subsections: [],
    },
    {
      id: "surum-ve-kaynak-kontrolu",
      title: "Bir metnin yürürlüğe girdiğini nasıl doğrularsınız?",
      content: phase3Lines(
        "PDF dosyasının üzerinde kurum logosu bulunması, sosyal medyada dolaşması veya bir seminerde tartışılması tek başına yürürlük kanıtı değildir. Mevzuat statüsü için yayımlanma kaydı ve yürürlük maddesi aranmalıdır.",
        "",
        "1. Resmî Gazete'de tam belge başlığını arayın.",
        "2. Yayım tarihi ve sayı numarasını kaydedin.",
        "3. Metindeki yürürlük maddesini ve varsa geçiş hükümlerini okuyun.",
        "4. Taslak ile nihai metni aynı dosya kabul etmeyin; madde/ek farklarını karşılaştırın.",
        "5. Hesap raporuna kullanılan mevzuatın tam adını, tarihini, sayısını ve erişim tarihini yazın.",
        "",
        "> [!engineering] Adlandırma kontrolü",
        "> 2019 belgesinin başlığındaki **“Dair Tebliğ”** ile 2026'da dolaşıma giren **“İlişkin Tebliğ” taslağı** arasındaki ad farkı küçük görünse de iki ayrı dokümanı ayırmak için kritik bir sürüm işaretidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Kullanılan metnin tam belge başlığı yazıldı mı?",
        "- 17 Temmuz 2019 / 30834 sayılı yürürlükteki Uygulama Esaslarına Dair Tebliğ, 2026 taslağından ayrıldı mı?",
        "- 2026 yeni metni için Resmî Gazete yayımlanma kaydı gerçekten var mı?",
        "- Yalnız sosyal medya PDF'si veya sunum kopyası resmî kaynak gibi kullanılmamış mı?",
        "- Taslak sayısal değerleri DRAFT_VALUE olarak yürürlükteki SOURCE_VALUE'lardan ayrıldı mı?",
        "- TBDY 2018'in yürürlükteki maddeleri taslak hükümlerle sessizce değiştirilmedi mi?",
        "- Ruhsat başvurusunda 2019 Tebliği'nin geçiş/uygulama hükümleri kontrol edildi mi?",
        "- Hesap raporunda mevzuat adı, Resmî Gazete tarihi/sayısı ve erişim tarihi kayıtlı mı?",
        "- Yeni bir Resmî Gazete yayımı varsa taslak–nihai metin fark analizi yapıldı mı?"
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018",
      href: TBDY_PDF,
      note: "Yürürlükteki ana teknik deprem yönetmeliği metni.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası",
      href: TBDY_PAGE,
      note: "TBDY 2018'in resmî AFAD erişim sayfası.",
    },
    {
      label: "Resmî Gazete — mevzuat ve sayı arşivi",
      href: RESMI_GAZETE,
      note: "17 Temmuz 2019 tarihli 30834 sayılı Tebliğ ve gelecekteki olası yeni yayım bu resmî arşivden doğrulanmalıdır.",
    },
    {
      label: "AFAD — 2019 İdare Faaliyet Raporu",
      href: AFAD_2019_REPORT,
      note: "2019 Uygulama Esaslarına Dair Tebliğin 17 Temmuz 2019 / 30834 sayılı Resmî Gazete'de yayımlandığını kaydeder.",
    },
    {
      label: "TMMOB İMO — Sosyal Mecralarda Yer Alan Yeni TBDY Tebliği Hakkında Duyuru",
      href: IMO_DRAFT_NOTICE,
      note: "2 Mart 2026 tarihli duyuru yeni metnin yayımlanmadığını ve hukuki geçerliliği bulunmadığını bildirir.",
    },
    {
      label: "TMMOB İMO — 2 Mayıs 2026 Tebliğ Taslağı semineri",
      href: IMO_DRAFT_SEMINAR,
      note: "Mayıs 2026'da yeni metnin hâlâ tebliğ taslağı olarak ele alındığını gösteren tarihli kaynak.",
    },
  ],
  keywords: ["TBDY 2018", "uygulama esasları", "tebliğ taslağı", "2019 tebliği", "2026 taslak", "Resmî Gazete 30834", "mevzuat statüsü", "DRAFT_VALUE"],
  tags: ["TBDY 2018", "Mevzuat", "Tebliğ", "Taslak"],
};
