import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_ESDEGER_DEPREM_YUKU: DepremPhase3Override = {
  slug: "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",
  description: "TBDY 2018 Madde 4.6 ve Tablo 4.4'e göre Eşdeğer Deprem Yükü Yöntemi'nin hangi DTS–BYS ve düzensizlik koşullarındaki binalarda kullanılabileceğini, modal yöntemlerin genel uygulanabilirliğinden ayırarak açıklar.",
  seoTitle: "TBDY Eşdeğer Deprem Yükü Yöntemi Sınırları | Tablo 4.4",
  seoDescription: "Eşdeğer Deprem Yükü Yöntemi için DTS, BYS, burulma düzensizliği ve B2 yumuşak kat koşulları; TBDY 2018 Madde 4.6.2 ve Tablo 4.4 teknik rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "yontem-secim-kapisi",
      title: "Önce yöntem seçimi kapısını geçin",
      content: phase3Lines(
        "TBDY 4.6.1, Dayanıma Göre Tasarım kapsamındaki doğrusal deprem hesabı için **Eşdeğer Deprem Yükü Yöntemi** ile **Modal Hesap Yöntemleri**ni tanımlar. Ancak iki yöntem aynı uygulanabilirlik alanına sahip değildir: 4.6.2.1'e göre modal yöntemlerden herhangi biri bu Bölüm kapsamındaki binaların tümünde kullanılabilirken, Eşdeğer Deprem Yükü Yöntemi yalnız 4.6.2.2 ve **Tablo 4.4** sınırları içinde kullanılabilir.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> DTS grubunu ve BYS'yi doğrulayın; her katta burulma düzensizliği katsayısı ηbi değerini kontrol edin; B2 türü komşu katlar arası rijitlik düzensizliği bulunup bulunmadığını belirleyin; sonra Tablo 4.4'teki ilgili satır ve sütunu birlikte okuyun. Yöntemi yalnız bina alçak olduğu veya yazılımda kolay olduğu için seçmeyin."
      ),
      subsections: [],
    },
    {
      id: "tablo-4-4",
      title: "Tablo 4.4: DTS, BYS ve düzensizlik aynı anda okunur",
      content: phase3Lines(
        "Tablo 4.4 iki DTS grubunu ve iki bina durumunu birlikte değerlendirir. `BYS ≥ n` ifadesinde sayısal olarak daha büyük BYS, daha düşük bina yüksekliği sınıfına karşı gelir; bu nedenle koşulu yalnız sayı karşılaştırması gibi değil, Tablo 3.3'teki yükseklik sınıflamasıyla birlikte okuyun.",
        "",
        "| Bina durumu | DTS = 1, 1a, 2, 2a | DTS = 3, 3a, 4, 4a |",
        "|---|---:|---:|",
        "| Her katta ηbi ≤ 2.0 ve B2 düzensizliği yok | BYS ≥ 4 | BYS ≥ 5 |",
        "| Diğer tüm binalar | BYS ≥ 5 | BYS ≥ 6 |",
        "",
        "> [!regulation] SOURCE_VALUE",
        "> `ηbi ≤ 2.0`, `BYS ≥ 4/5/6` sınırları TBDY 2018 **Tablo 4.4**'ten alınmıştır. B2'nin bulunmaması şartı yalnız ilk satır için geçerlidir; koşullardan biri sağlanmazsa “diğer tüm binalar” satırına geçilir."
      ),
      subsections: [],
    },
    {
      id: "duzensizlik-okumasi",
      title: "ηbi ve B2 aynı şey değildir",
      content: phase3Lines(
        "Burulma düzensizliği katsayısı **ηbi**, A1 türü burulma düzensizliğinin ölçüsüdür. Tablo 4.4 ilk satırda A1'in hiç bulunmamasını istemez; her katta **ηbi ≤ 2.0** sınırını ister. Buna karşılık **B2 — Komşu Katlar Arası Rijitlik Düzensizliği (Yumuşak Kat)** için ilk satırda doğrudan “bulunmaması” koşulu vardır.",
        "",
        "TBDY Tablo 3.6'ya göre B2, bodrum katlar dışında bir kattaki ortalama göreli kat ötelemesi oranının komşu kattaki değere oranıyla tanımlanan rijitlik düzensizliği katsayısı ηki'nin **2.0'den büyük** olması durumudur. 3.6.2.1 ayrıca A1 ve B2 düzensizliklerinin 4.6'ya göre hesap yöntemi seçiminde etkili olduğunu açıkça belirtir.",
        "",
        "> [!warning] Sık hata",
        "> `ηbi > 1.2` ile tanımlanan A1 düzensizliği var diye Eşdeğer Deprem Yükü Yöntemi otomatik olarak yasaklanmaz. Tablo 4.4 açısından kritik eşik ηbi ≤ 2.0'dır; ayrıca B2 koşulu ve DTS–BYS sınırı birlikte sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "karar-ornekleri",
      title: "Çözümlü karar örnekleri",
      content: phase3Lines(
        "**Örnek 1 — ASSUMPTION:** DTS = 2, BYS = 4, tüm katlarda ηbi ≤ 2.0 ve B2 yok. İlk satır ile DTS = 1/1a/2/2a sütunu kesiştiğinde **BYS ≥ 4** şartı sağlanır; yöntem uygulanabilir.",
        "",
        "**Örnek 2 — ASSUMPTION:** DTS = 2, BYS = 4 fakat bir katta ηbi = 2.15. İlk satır artık kullanılamaz; “diğer tüm binalar” satırında DTS = 2 için **BYS ≥ 5** gerekir. BYS = 4 bu şartı sağlamadığından Eşdeğer Deprem Yükü Yöntemi uygulanamaz; modal yönteme geçilir.",
        "",
        "**Örnek 3 — ASSUMPTION:** DTS = 4, BYS = 5, ηbi ≤ 2.0 ve B2 yok. İlk satırın ikinci DTS grubunda **BYS ≥ 5** sağlandığı için yöntem uygulanabilir. Aynı binada B2 bulunsaydı diğer satıra geçilecek ve **BYS ≥ 6** gerekecekti.",
        "",
        "> [!engineering] Sonuç yorumu",
        "> Örneklerdeki DTS/BYS ve ηbi değerleri yöntemi göstermek için seçilmiş ASSUMPTION'lardır. Uygulanabilirlik eşikleri ise Tablo 4.4 SOURCE_VALUE'larıdır."
      ),
      subsections: [],
    },
    {
      id: "modal-yontemle-iliski",
      title: "Sınır aşılırsa çözüm: modal yöntemlerden birini seçin",
      content: phase3Lines(
        "Tablo 4.4 sınırının aşılması binanın deprem hesabının yapılamayacağı anlamına gelmez. TBDY 4.6.2.1'e göre 4.8'de tanımlanan **Mod Birleştirme Yöntemi** veya **Mod Toplama Yöntemi** Bölüm 4 kapsamındaki binaların tümünün deprem hesabında kullanılabilir. Yani Tablo 4.4, modal yöntemin değil yalnız Eşdeğer Deprem Yükü Yöntemi'nin kullanım alanını sınırlar.",
        "",
        "| Kontrol sonucu | Yöntem kararı |",
        "|---|---|",
        "| Tablo 4.4 şartları sağlanıyor | Eşdeğer Deprem Yükü veya uygun modal yöntem seçilebilir |",
        "| Tablo 4.4 şartlarından biri sağlanmıyor | Eşdeğer yöntem kullanılamaz; modal hesap yöntemine geçilir |",
        "| Zaman tanım alanında modal hesap seçiliyor | 4.8.3 hükümleri ayrıca uygulanır |",
        "",
        "> [!check] Raporlama",
        "> Hesap raporunda yalnız kullanılan yöntemi yazmayın; yöntemin **neden uygulanabilir olduğunu** DTS, BYS, ηbi ve B2 kontrolüyle birlikte gösterin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- BKS → DTS → BYS sınıflandırması güncel proje verisiyle doğrulandı mı?",
        "- Her katta ηbi değeri hesaplandı mı?",
        "- İlk satır kullanılacaksa tüm katlarda ηbi ≤ 2.0 sağlanıyor mu?",
        "- B2 — Komşu Katlar Arası Rijitlik Düzensizliği kontrol edildi mi?",
        "- B2 varsa yanlışlıkla Tablo 4.4 ilk satırı kullanılmamış mı?",
        "- DTS doğru sütun grubuna yerleştirildi mi?",
        "- BYS sınırı `≥` işaretiyle doğru okundu mu?",
        "- Eşdeğer yöntem uygun değilse modal yöntem seçimi ve yeterli mod kontrolü yapıldı mı?",
        "- Yöntem seçimi hesap raporunda Tablo 4.4 dayanağıyla belgelenmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.6.1–4.6.2; Tablo 4.4 ve Tablo 3.6"),
  keywords: ["TBDY 2018", "eşdeğer deprem yükü", "Tablo 4.4", "DTS", "BYS", "ηbi", "B2 düzensizliği", "yumuşak kat", "modal analiz", "hesap yöntemi"],
  tags: ["TBDY 2018", "Eşdeğer Deprem Yükü", "Analiz Yöntemi", "Düzensizlik"],
};
