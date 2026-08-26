import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DUZENSIZ_DINAMIK: DepremPhase3Override = {
  slug: "duzensiz-binalarda-dinamik-analiz-zorunlulugu",
  description: "TBDY 2018'de A1–A3 ve B1–B3 düzensizliklerinin hesap yöntemine etkisini; özellikle A1/B2 ile Tablo 4.4 arasındaki ilişkiyi ve modal analiz–eşdeğer deprem yükü ayrımını açıklar.",
  seoTitle: "TBDY 2018 Düzensiz Binalarda Dinamik Analiz Zorunluluğu | Tablo 4.4",
  seoDescription: "A1 ve B2 düzensizliklerinde hesap yöntemi seçimi, Tablo 4.4 BYS sınırları, modal analiz ve A2/A3 döşeme modelleme koşulları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "otomatik-zorunluluk-yok",
      title: "Düzensizlik, otomatik olarak dinamik analiz zorunluluğu demek değildir",
      content: phase3Lines(
        "TBDY 2018'de 'düzensizlik var → mutlaka dinamik analiz yapılır' biçiminde tek bir genel kural yoktur. Madde 3.6.2.1, **A1 Burulma Düzensizliği** ile **B2 Komşu Katlar Arası Rijitlik Düzensizliği** için hesap yöntemi seçiminin Madde 4.6'ya göre yapılacağını söyler.",
        "",
        "Madde 4.6.2.1'e göre modal hesap yöntemleri Bölüm 4 kapsamındaki binaların tümünde kullanılabilir. Buna karşılık eşdeğer deprem yükü yönteminin kullanılabilmesi Madde 4.6.2.2 ve Tablo 4.4'teki koşullara bağlıdır. Dolayısıyla modal yöntem her bina için zorunlu değildir; fakat eşdeğer deprem yükü yönteminin izin alanı düzensizlik ve BYS ile daralabilir.",
        "",
        "> [!warning] İki farklı eşik",
        "> A1 düzensizliğinin tanım eşiği Tablo 3.6'da `ηbi > 1.2` iken, Tablo 4.4'te yöntemin seçimi için kullanılan koşul `ηbi ≤ 2.0` ve B2'nin bulunmamasıdır. Bu iki sınır aynı kontrol değildir."
      ),
      subsections: [],
    },
    {
      id: "a1-b2-yontem-secimi",
      title: "A1 ve B2: yöntemi etkileyen düzensizlikler",
      content: phase3Lines(
        "A1, kat içindeki göreli ötelenme dağılımının burulma nedeniyle düzensizleşmesini; B2 ise bir katın ortalama göreli ötelenmesinin komşu kata göre aşırı büyümesini ifade eder. TBDY bu iki düzensizliği doğrudan Madde 4.6'daki doğrusal hesap yöntemi seçimiyle ilişkilendirir.",
        "",
        "Burada doğru soru 'A1 veya B2 var mı?' ile bitmez. Binanın DTS grubu, BYS değeri, her kattaki burulma düzensizliği katsayısı ve B2 durumu birlikte Tablo 4.4'e taşınmalıdır.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> `ηbi`, B2 durumu, DTS ve BYS değerleri yöntem seçim tablosunun SOURCE_VALUE girdileridir; hesap raporunda yalnız seçilen yöntemi değil, bu seçimi doğuran değerleri de gösterin."
      ),
      subsections: [],
    },
    {
      id: "tablo-4-4",
      title: "Tablo 4.4: eşdeğer deprem yükü yönteminin sınırları",
      content: phase3Lines(
        "TBDY Tablo 4.4, eşdeğer deprem yükü yönteminin uygulanabileceği bina yükseklik sınıflarını iki ana durum üzerinden sınırlar. Özet karar tablosu şöyledir:",
        "",
        "| Bina durumu | DTS grubu | Eşdeğer deprem yükü için sınır |",
        "|---|---|---:|",
        "| Tüm katlarda `ηbi ≤ 2.0` ve B2 yok | DTS = 1, 1a, 2, 2a | `BYS ≥ 4` |",
        "| Tüm katlarda `ηbi ≤ 2.0` ve B2 yok | DTS = 3, 3a, 4, 4a | `BYS ≥ 5` |",
        "| Yukarıdaki koşulu sağlamayan diğer binalar | DTS = 1, 1a, 2, 2a | `BYS ≥ 5` |",
        "| Yukarıdaki koşulu sağlamayan diğer binalar | DTS = 3, 3a, 4, 4a | `BYS ≥ 6` |",
        "",
        "Tablodaki sonuç 'dinamik analiz yalnız düzensiz binalarda yapılır' anlamına gelmez. Modal hesap yöntemi 4.6.2.1 uyarınca genel olarak kullanılabilir; Tablo 4.4 esas olarak eşdeğer deprem yükü yönteminin hangi binalarda yeterli kabul edildiğini sınırlar."
      ),
      subsections: [],
    },
    {
      id: "a2-a3-modelleme",
      title: "A2 ve A3'ün sonucu: döşeme yük aktarımının modellenmesi",
      content: phase3Lines(
        "Madde 3.6.2.2, A2 Döşeme Süreksizlikleri ve A3 Planda Çıkıntılar Bulunması düzensizliklerinde döşemelerin yatay düzlemdeki şekil değiştirmelerinin güvenli yük aktarımını bozup bozmadığının gösterilmesini ister. Bu amaçla döşemeler iki boyutlu membran veya kabuk sonlu elemanlarla modellenir.",
        "",
        "Bu hüküm bir 'dinamik analiz zorunluluğu' değil, **modelleme ve yük aktarımı** hükmüdür. A2/A3 bulunan bir binada yöntemi seçmek ile diyaframı doğru temsil etmek iki ayrı mühendislik kararıdır.",
        "",
        "> [!warning] Sık hata",
        "> A2/A3'ü yalnız düzensizlik kutucuğu olarak işaretleyip döşemeyi rijit diyafram kabulüyle geçmek, yönetmeliğin yük aktarımının iki boyutlu sonlu elemanlarla gösterilmesi talebini karşılamayabilir."
      ),
      subsections: [],
    },
    {
      id: "b1-b3-farkli-sonuclar",
      title: "B1 ve B3 farklı tasarım sonuçları üretir",
      content: phase3Lines(
        "B1 Komşu Katlar Arası Dayanım Düzensizliği için yönetmelik, zayıf kat katsayısına bağlı olarak taşıyıcı sistem davranış katsayısının değiştirilmesi veya sistemin güçlendirilmesi gibi ayrı hükümler verir. B3 ise düşey taşıyıcı elemanların süreksizliğine ilişkin geometrik ve yük aktarımı koşullarını düzenler.",
        "",
        "Bu nedenle A1–A3 ve B1–B3 düzensizliklerini tek sonuç altında toplamak teknik olarak yanlıştır. Her düzensizlik türü için önce **tanım**, sonra **yönetmelik sonucu**, sonra **modelleme/tasarım aksiyonu** ayrı kaydedilmelidir."
      ),
      subsections: [],
    },
    {
      id: "ofis-karar-akisi",
      title: "Ofis karar akışı: düzensizlikten analiz yöntemine",
      content: phase3Lines(
        "1. Tablo 3.6'ya göre A1, A2, A3, B1, B2 ve B3 kontrollerini ayrı ayrı sonuçlandırın.",
        "2. A1 için `ηbi` değerini yalnız 1.2 eşiğiyle değil, Tablo 4.4'teki `ηbi ≤ 2.0` yöntem koşuluyla da karşılaştırın.",
        "3. B2 bulunup bulunmadığını belirleyin; DTS ve BYS ile birlikte Tablo 4.4'e girin.",
        "4. Eşdeğer deprem yükü yöntemi sınır dışında kalıyorsa Madde 4.6 kapsamındaki modal hesap yöntemlerinden uygun olanını seçin.",
        "5. A2/A3 varsa hesap yöntemi kararından bağımsız olarak döşeme yük aktarımı modelini 3.6.2.2'ye göre kurun.",
        "6. B1 ve B3 için kendilerine özgü tasarım ve süreksizlik hükümlerini ayrıca kontrol edin.",
        "7. Raporun yöntem seçimi bölümünde yalnız 'modal analiz yapıldı' demeyin; Tablo 4.4 karar girdilerini ve düzensizlik sonuçlarını gösterin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- A1 için `ηbi > 1.2` tanım eşiği ile `ηbi ≤ 2.0` yöntem koşulu birbirine karıştırılmadı mı?",
        "- B2 kontrolü tüm katlar için tamamlandı mı?",
        "- DTS ve BYS doğru belirlendi mi?",
        "- Tablo 4.4'te doğru satır ve BYS sınırı kullanıldı mı?",
        "- Modal yöntemin her bina için zorunlu olmadığı, fakat tüm binalarda kullanılabildiği doğru ifade edildi mi?",
        "- A2/A3 için membran veya kabuk sonlu eleman modeli gerektiğinde kuruldu mu?",
        "- B1 ve B3 sonuçları ayrı hükümlere göre değerlendirildi mi?",
        "- Analiz yöntemi, modelleme kabulü ve düzensizlik sonucu raporda birbirinden ayrıldı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 3.6.2; Madde 4.6; Tablo 4.4"),
  keywords: ["düzensiz bina", "dinamik analiz", "modal analiz", "Tablo 4.4", "A1", "B2", "BYS"],
  tags: ["TBDY 2018", "Düzensizlik", "Analiz Yöntemi", "Modal Analiz"],
};
