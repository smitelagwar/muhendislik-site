import { KDB_PAGE, RISKLI_YAPI_YONETMELIK, phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_RISKLI_YAPI: DepremPhase4Override = {
  slug: "mevcut-bina-riskli-yapi-ve-bolum-15-farki",
  description: "6306 sayılı Kanun kapsamındaki riskli yapı tespiti ile TBDY Bölüm 15 kapsamındaki mevcut bina deprem performansı değerlendirmesini amaç, yöntem, yetki ve çıktı bakımından birbirinden ayırır.",
  seoTitle: "Riskli Yapı Tespiti ile TBDY Bölüm 15 Arasındaki Fark | Mevcut Bina Rehberi",
  seoDescription: "6306/Ek-2 riskli yapı tespiti ile TBDY 2018 Bölüm 15 mevcut bina performans değerlendirmesinin farkları, doğru karar akışı ve raporlama sınırları.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "iki-farkli-soru",
      title: "İki farklı soru, iki farklı teknik-hukuki yol",
      content: phase4Lines(
        "Bir mevcut bina için '6306 kapsamında riskli yapı mıdır?' sorusu ile 'TBDY Bölüm 15'e göre hangi deprem performansını sağlar?' sorusu aynı değildir. İlk soru 6306 sayılı Kanun ve Uygulama Yönetmeliği'nin Ek-2'sindeki **Riskli Yapıların Tespit Edilmesine İlişkin Esaslar** çerçevesinde hukuki dönüşüm sürecine bağlanan özel bir tespit işlemidir. İkinci soru ise TBDY Bölüm 15'in mevcut ve güçlendirilecek binaların deprem etkisi altındaki performanslarının değerlendirilmesi ve güçlendirme tasarımı için kurduğu mühendislik çerçevesidir.",
        "",
        "> [!warning] Kritik ayrım",
        "> Bir riskli yapı tespit raporu, kendiliğinden TBDY Bölüm 15 performans raporuna dönüşmez. Aynı şekilde Bölüm 15 kapsamında yapılan bir performans değerlendirmesi de 6306 kapsamındaki resmî riskli yapı tespit prosedürünün yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "karsilastirma",
      title: "Amaç, dayanak, yetki ve çıktı aynı değildir",
      content: phase4Lines(
        "| Başlık | 6306 kapsamında riskli yapı tespiti | TBDY Bölüm 15 değerlendirmesi |",
        "|---|---|---|",
        "| Ana amaç | Kanun kapsamındaki riskli yapı tespitini ve dönüşüm sürecini başlatabilecek teknik sonucu üretmek | Mevcut/güçlendirilecek binanın deprem performansını değerlendirmek ve gerekiyorsa güçlendirme tasarımına esas oluşturmak |",
        "| Teknik dayanak | 6306 Uygulama Yönetmeliği Ek-2 ve ilgili resmî esaslar | TBDY 2018 Bölüm 15 ve atıf yapılan diğer bölümler |",
        "| Süreç sahibi | Kentsel Dönüşüm Başkanlığı sisteminde yetkili/lisanslı kurum ve kuruluşların yürüttüğü tespit | Proje amacına göre sorumlu inşaat mühendisi tarafından yürütülen mühendislik değerlendirmesi |",
        "| Tipik çıktı | Riskli/riskli değil yönünde 6306 sürecine özgü tespit ve idari devam işlemleri | Performans hedefi, hesap/model sonuçları, eleman davranışları ve gerekiyorsa güçlendirme kararı |",
        "| Birbirinin yerine geçer mi? | Hayır | Hayır |"
      ),
      subsections: [],
    },
    {
      id: "bolum-15-kapsami",
      title: "TBDY 15.1 kapsamı performans ve güçlendirme kararını tarif eder",
      content: phase4Lines(
        "TBDY 15.1.1, mevcut ve güçlendirilecek binaların ve bina türü yapıların deprem etkisi altındaki performanslarının değerlendirilmesinde kullanılacak hesap kurallarını, güçlendirme kararında esas alınacak ilkeleri ve güçlendirilecek binaların tasarım ilkelerini Bölüm 15'in kapsamına alır.",
        "",
        "Bu kapsam yalnız 'bina sağlam mı?' şeklinde tek cümlelik bir hüküm üretmek değildir. Bölüm 15; bilgi toplama, mevcut malzeme dayanımları, modelleme, hasar sınırları, performans hedefleri ve güçlendirme tasarımını birbirine bağlayan bir mühendislik zinciridir."
      ),
      subsections: [],
    },
    {
      id: "deprem-sonrasi-istisna",
      title: "Deprem sonrası hasarlı bina değerlendirmesinde özel sınır vardır",
      content: phase4Lines(
        "TBDY 15.1.6 açık bir sınır koyar: binada hasara neden olan bir deprem sonrasında, hasarlı binanın deprem güvenliği Bölüm 15'teki yöntemlerle belirlenemez. Bu nedenle afet sonrası hızlı hasar tespiti veya kullanım güvenliği kararı ile olağan mevcut bina performans analizi aynı iş değildir.",
        "",
        "Buna karşılık 15.1.7, depremde hasar görmüş bir binanın **güçlendirilmesi** ve güçlendirilmiş halinin performansının belirlenmesi için Bölüm 15 esaslarının uygulanacağını; mevcut hasarın dayanım ve rijitliklere ne ölçüde yansıtılacağına projeden sorumlu inşaat mühendisinin karar vereceğini belirtir."
      ),
      subsections: [],
    },
    {
      id: "riskli-yapi-sureci",
      title: "6306 tarafında doğru başlangıç noktası Ek-2 prosedürüdür",
      content: phase4Lines(
        "Kentsel Dönüşüm Başkanlığı'nın güncel resmî bilgilendirmesine göre riskli yapı tespiti, Bakanlıkça/Başkanlıkça yetki verilen kurum ve kuruluşlara yaptırılır ve tespit talebi elektronik sistem üzerinden yürütülür. Başkanlık ayrıca riskli yapıların 6306 sayılı Kanunun Uygulama Yönetmeliği'nin Ek-2'sinde yer alan esaslara göre tespit edildiğini açıkça belirtir.",
        "",
        "Bu nedenle müşterinin amacı 6306 kapsamındaki hukuki dönüşüm süreci ise dosya başlığını 'deprem performans raporu' olarak genellemek yerine doğrudan **riskli yapı tespiti** prosedürüne bağlamak gerekir. Yetkili kurum, rapor formatı, bildirim ve itiraz adımları bu hukuki sürecin parçasıdır."
      ),
      subsections: [],
    },
    {
      id: "karar-akisi",
      title: "Mühendislik ofisinde karar akışı önce işin amacını tanımlar",
      content: phase4Lines(
        "1. Talebin amacı yazılı olarak tanımlanır: 6306 risk tespiti mi, mevcut bina performansı mı, güçlendirme projesi mi?",
        "2. Seçilen amaca uygun bağlayıcı doküman belirlenir; 6306/Ek-2 ile TBDY Bölüm 15 birbirine karıştırılmaz.",
        "3. Veri toplama planı seçilen prosedüre göre hazırlanır. Numune, donatı tespiti, rölöve ve hesap kapsamı başka bir prosedürden kopyalanmaz.",
        "4. Rapor başlığında kullanılan yöntem, hukuki/teknik kapsam ve sınırlamalar açıkça yazılır.",
        "5. Sonuç yalnız kullanılan prosedürün izin verdiği anlamla sunulur; 'riskli değil = tüm deprem performans hedeflerini sağlar' veya 'Bölüm 15 sonucu = 6306 resmî tespiti' gibi çapraz yorum yapılmaz."
      ),
      subsections: [],
    },
    {
      id: "yaygin-hatalar",
      title: "En sık yapılan kapsam hataları",
      content: phase4Lines(
        "- 6306 kapsamındaki tespiti, güçlendirme projesi için yeterli veri seti kabul etmek.",
        "- TBDY Bölüm 15 performans sonucunu idari 6306 tespitinin yerine koymak.",
        "- Deprem sonrası hızlı hasar tespitini Bölüm 15 performans analiziyle aynı işlem gibi sunmak.",
        "- Rapor sonucunu kullanılan mevzuatın verdiği karar sınırının ötesinde yorumlamak.",
        "- İşverenin yalnız 'bina sağlam mı?' ifadesiyle yaptığı talebi teknik kapsam tanımlamadan kabul etmek."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Talebin 6306 riskli yapı tespiti mi yoksa TBDY Bölüm 15 performans değerlendirmesi mi olduğu yazılı mı?",
        "- Kullanılan mevzuat ve yöntem rapor kapağında/özetinde açık mı?",
        "- Riskli yapı tespitinde güncel Ek-2 ve yetkili kurum koşulları doğrulandı mı?",
        "- Bölüm 15 işinde bilgi düzeyi, saha ölçümü ve malzeme deney kapsamı doğru seçildi mi?",
        "- Deprem sonrası hasarlı bina için 15.1.6 sınırı dikkate alındı mı?",
        "- Güçlendirme projesinde 15.1.7 uyarınca mevcut hasarın rijitlik/dayanım etkisi mühendislik kararıyla belgelendi mi?",
        "- Sonuç başka bir mevzuat prosedürünün yerine geçiyormuş gibi ifade edilmedi mi?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase4References("Bölüm 15.1–15.2 — mevcut bina değerlendirme kapsamı ve bilgi toplama"),
    { label: "Kentsel Dönüşüm Başkanlığı — Riskli yapı tespiti ve yetkili kuruluşlar", href: KDB_PAGE },
    { label: "ÇŞİDB/KDB — 6306 sayılı Kanunun Uygulama Yönetmeliği", href: RISKLI_YAPI_YONETMELIK },
  ],
  keywords: ["riskli yapı", "6306", "TBDY Bölüm 15", "mevcut bina", "deprem performansı", "güçlendirme"],
  tags: ["Mevcut Bina", "TBDY 2018", "6306", "Riskli Yapı", "Güçlendirme"],
};
