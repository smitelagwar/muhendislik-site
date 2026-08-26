import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

const DASK_SCOPE = "https://www.dask.gov.tr/tr/teminat-ve-kapsami";
const DASK_LAW = "https://www.dask.gov.tr/tr/kanun";
const DASK_TERMS = "https://www.dask.gov.tr/tr/zds-genel-sartlar";

export const DEPREM_PHASE3_DASK: DepremPhase3Override = {
  slug: "deprem-sigortasi-dask-ve-muhendislik-baglantisi",
  description: "Zorunlu Deprem Sigortası'nın finansal teminat işlevi ile bir binanın TBDY kapsamında yapısal deprem performansının değerlendirilmesini birbirinden ayırır; DASK poliçesinin güvenlik belgesi olmadığını açıklar.",
  seoTitle: "DASK Poliçesi Yapısal Deprem Güvenliğini Gösterir mi? | Mühendislik Rehberi",
  seoDescription: "6305 sayılı Kanun, Zorunlu Deprem Sigortası kapsamı ve DASK poliçesi ile TBDY yapısal performans değerlendirmesi arasındaki fark.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "temel-ayrim",
      title: "Poliçe finansal teminattır; yapısal performans raporu değildir",
      content: phase3Lines(
        "DASK tarafından düzenlenen **Zorunlu Deprem Sigortası**, deprem ve deprem sonucu meydana gelen belirli doğrudan maddi zararların poliçe koşulları ve teminat limiti içinde karşılanmasına yönelik bir risk transfer mekanizmasıdır. Bir binaya poliçe düzenlenmiş olması, o binanın TBDY'ye göre analiz edildiği veya belirli bir deprem performans hedefini sağladığı anlamına gelmez.",
        "",
        "Bir başka ifadeyle DASK poliçesi **yapısal güvenlik belgesi değildir**. Yapısal deprem güvenliği; proje, malzeme, geometri, zemin, taşıyıcı sistem ve mevcut bina söz konusuysa yerinde bilgi toplama/analiz gibi mühendislik verileriyle değerlendirilir.",
        "",
        "> [!warning] Kritik çıkarım",
        "> 'DASK yapılabiliyorsa bina güvenlidir' sonucu teknik olarak kurulamaz. Sigortalanabilirlik ile yapısal performans iki farklı karar alanıdır."
      ),
      subsections: [],
    },
    {
      id: "dask-tbdy-karsilastirma",
      title: "DASK ile mühendislik değerlendirmesinin çıktısı farklıdır",
      content: phase3Lines(
        "| Başlık | Zorunlu Deprem Sigortası | Yapısal deprem güvenliği değerlendirmesi |",
        "|---|---|---|",
        "| Ana amaç | Depreme bağlı maddi kaybın finansal olarak karşılanması | Taşıyıcı sistemin deprem etkisi altındaki davranışının değerlendirilmesi |",
        "| Dayanak | 6305 sayılı Kanun, ZDS genel şartları ve poliçe koşulları | Uygulanabilir deprem yönetmeliği, proje ve mühendislik esasları |",
        "| Tipik çıktı | Poliçe, sigorta bedeli ve teminat kapsamı | Hesap/model, performans veya tasarım sonucu ve mühendislik kararı |",
        "| Yapısal güvenlik ispatı | Hayır | Değerlendirmenin doğrudan konusudur |",
        "| Temel veri | Sigorta sistemi için gerekli bina/poliçe bilgileri | Taşıyıcı sistem, malzeme, zemin, yük ve saha verileri |",
        "",
        "Bu iki süreç birbirinin alternatifi değildir. Bir binanın sigortalı olması mühendislik incelemesini gereksiz kılmaz; mühendislik değerlendirmesi de poliçenin finansal teminat işlevinin yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "kanun-amaci",
      title: "6305 sayılı Kanun neyi amaçlar?",
      content: phase3Lines(
        "6305 sayılı Afet Sigortaları Kanunu'nun Zorunlu Deprem Sigortası çerçevesi, deprem nedeniyle binalarda oluşan maddi zararların sigorta sistemi içinde karşılanmasına yöneliktir. Kanunun konusu bir taşıyıcı sistem performans hesabı üretmek değildir.",
        "",
        "Bu ayrım önemlidir: kanuni sigorta yükümlülüğü ile mühendislik mevzuatındaki tasarım/değerlendirme yükümlülüğü aynı prosedür değildir. Bir belgede 'sigortalı' yazması, taşıyıcı sistemin süneklik, dayanım, ötelenme, düzensizlik veya performans kontrollerinin yapıldığına dair teknik kanıt oluşturmaz."
      ),
      subsections: [],
    },
    {
      id: "teminat-kapsami",
      title: "DASK hangi tür maddi hasarları teminat kapsamına alır?",
      content: phase3Lines(
        "DASK'ın resmî teminat açıklamasına göre deprem ve depremin doğrudan neden olduğu yangın, infilak, tsunami ve yer kaymasının sigortalı binada doğrudan yol açtığı maddi zararlar poliçe limiti içinde değerlendirilir. Temel, ana duvar, bağımsız bölümleri ayıran ortak duvar, bahçe duvarı, istinat duvarı, tavan ve taban, merdiven, asansör, sahanlık, koridor, çatı ve baca gibi bina bölümleri kapsam açıklamasında sayılır.",
        "",
        "Bu liste, söz konusu yapı elemanlarının mühendislik açısından yeterli olduğu anlamına gelmez; yalnız sigorta teminatının hangi fiziksel bina kısımlarındaki doğrudan zarara uzanabileceğini açıklar."
      ),
      subsections: [],
    },
    {
      id: "kapsam-disi-yorum",
      title: "Kapsam dışı hükümler güvenlik sınıflandırması değildir",
      content: phase3Lines(
        "DASK'ın kapsam sayfası; projesiz ve mühendislik hizmeti görmeden inşa edilen bazı binalar, taşıyıcı sistemi olumsuz etkileyen tadilatlar veya ilgili mevzuata/projeye aykırı yapılar gibi çeşitli durumları sigorta kapsamı bakımından ayrıca ele alır.",
        "",
        "Ancak bu sınıflama tersinden okunamaz: kapsam içinde kalan her bina 'depreme güvenli', kapsam dışında kalan her bina da aynı teknik performans seviyesinde 'güvensiz' ilan edilmiş değildir. Sigorta kapsamı bir **mühendislik performans sınıflandırması** değildir.",
        "",
        "> [!engineering] Mühendis için pratik sonuç",
        "> Müşteri 'DASK'ım var, bina sağlam mı?' diye sorduğunda poliçe bilgisini yapısal performans verisi olarak kullanmayın. Yapının güvenliği için gerekli proje ve mevcut durum verilerini ayrı toplayın."
      ),
      subsections: [],
    },
    {
      id: "dogru-muhendislik-yolu",
      title: "Yapısal deprem güvenliği için doğru yol",
      content: phase3Lines(
        "Yeni bir binada güvenlik, yürürlükteki tasarım hükümlerine göre taşıyıcı sistemin doğru modellenmesi, yüklerin tanımlanması, eleman kontrolleri ve detaylandırmayla sağlanır. Mevcut bir binanın deprem performansı soruluyorsa TBDY'nin mevcut binalara ilişkin değerlendirme çerçevesi ve gerekiyorsa ilgili diğer yasal prosedürler esas alınır.",
        "",
        "Sadece bina yaşı, DASK poliçesi, tapu kaydı veya gözle görünür çatlak bulunmaması tek başına performans sonucuna dönüştürülemez. Mühendislik değerlendirmesi için hangi prosedürün gerektiği, sorulan hukuki/teknik amaca göre belirlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- DASK poliçesi ile yapısal performans değerlendirmesi açıkça ayrıldı mı?",
        "- 6305 sayılı Kanun'un finansal risk/teminat amacı doğru ifade edildi mi?",
        "- Poliçenin güvenlik belgesi olmadığı müşteriye açıkça anlatıldı mı?",
        "- Sigorta kapsamındaki maddi zarar ile taşıyıcı elemanın mühendislik yeterliliği birbirine karıştırılmadı mı?",
        "- Mevcut bina için gerekli mühendislik değerlendirme yöntemi sorunun amacına göre seçildi mi?",
        "- TBDY performans sonucu olmadan 'bina güvenlidir' hükmü kurulmadı mı?",
        "- DASK kapsam koşulları güncel resmî DASK kaynaklarından doğrulandı mı?",
        "- Mühendislik raporunda poliçe bilgisinin yalnız idari/finansal bilgi olduğu belirtiliyor mu?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase3References("Bölüm 3 ve Bölüm 15 — yapısal tasarım ve mevcut bina değerlendirme çerçevesi"),
    { label: "DASK — Zorunlu Deprem Sigortası Teminat ve Kapsamı", href: DASK_SCOPE },
    { label: "DASK — 6305 sayılı Afet Sigortaları Kanunu", href: DASK_LAW },
    { label: "DASK — Zorunlu Deprem Sigortası Genel Şartları", href: DASK_TERMS },
  ],
  keywords: ["DASK", "Zorunlu Deprem Sigortası", "6305", "deprem güvenliği", "yapısal performans", "TBDY"],
  tags: ["DASK", "TBDY 2018", "Yapısal Güvenlik", "Mevcut Bina"],
};
