import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_MODAL_TABAN_KESME: DepremPhase3Override = {
  slug: "tbdy-modal-taban-kesme-olceklendirme",
  description: "TBDY 2018 Madde 4.8.4 ve Denklem 4.31'e göre modal hesapla elde edilen toplam deprem yükünün eşdeğer taban kesme alt sınırıyla karşılaştırılmasını, γE = 0.80/0.90 seçimini ve tüm azaltılmış tepki büyüklüklerinin ölçeklenmesini açıklar.",
  seoTitle: "TBDY Modal Taban Kesme Ölçeklendirmesi | Denklem 4.31",
  seoDescription: "Modal taban kesme karşılaştırması, γE 0.80/0.90, βtE büyütme katsayısı ve bodrumlu binalarda üst bölüm kontrolü; TBDY 4.8.4 rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "olcekleme-karari",
      title: "Ölçekleme kararı: modal toplamı doğrudan kabul etmeyin",
      content: phase3Lines(
        "TBDY 4.8.4.1, modal hesap yöntemleriyle bulunan toplam deprem yükünü bir referans alt sınırla karşılaştırır. Herhangi bir deprem doğrultusunda modal toplam `Vtx`, `γE VtE` değerinden küçükse yalnız taban kesmesini değil, modal hesapla elde edilen **tüm azaltılmış iç kuvvet ve yerdeğiştirme büyüklüklerini** aynı büyütme katsayısıyla ölçeklemek gerekir.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> İlgili doğrultuda VtE'yi eşdeğer deprem yükü yöntemi referansından alın; yapıdaki A1/B2/B3 düzensizliklerine göre γE'yi seçin; Vtx ile karşılaştırın; gerekiyorsa Denklem 4.31'den βtE ≥ 1 hesaplayın; eleman iç kuvvetleri, kat tepkileri ve yerdeğiştirmelerde aynı ölçeğin gerçekten uygulandığını doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-31",
      title: "Denklem 4.31: eşdeğer taban kesme büyütme katsayısı",
      content: phase3Lines(
        "TBDY, büyütme katsayısını aşağıdaki oranla tanımlar. Koşul sağlanmıyorsa katsayı 1'in altına düşürülmez; modal sonuçlar küçültülmez.",
        "",
        "```formula",
        "@label: TBDY 4.8.4.1 — Denklem (4.31)",
        "β_tE^(X) = γ_E V_tE^(X) / V_tx^(X) ≥ 1",
        "@symbol: β_tE^(X) | X doğrultusu eşdeğer taban kesme kuvveti büyütme katsayısı | boyutsuz",
        "@symbol: γ_E | Düzensizlik durumuna bağlı karşılaştırma çarpanı | boyutsuz",
        "@symbol: V_tE^(X) | Eşdeğer Deprem Yükü Yöntemi'ne göre referans toplam deprem yükü | kN",
        "@symbol: V_tx^(X) | Modal hesap yöntemine göre X doğrultusunda elde edilen toplam deprem yükü | kN",
        "```",
        "",
        "> [!regulation] Uygulama koşulu",
        "> `Vtx < γE VtE` ise büyütme yapılır. Denklem 4.31'de **βtE ≥ 1** koşulu vardır; modal tepkiyi referans değerden büyük çıktığı için küçültmek bu hükmün amacı değildir."
      ),
      subsections: [],
    },
    {
      id: "gamma-e-secimi",
      title: "γE = 0.90 mı, 0.80 mi?",
      content: phase3Lines(
        "Madde 4.8.4.1, γE seçimini Tablo 3.6'daki düzensizliklere bağlar.",
        "",
        "| Bina durumu | γE |",
        "|---|---:|",
        "| A1, B2 veya B3 düzensizliklerinden en az biri var | 0.90 |",
        "| Tablo 3.6'da tanımlanan düzensizliklerin hiçbiri yok | 0.80 |",
        "",
        "> [!warning] Aradaki durumları uydurmayın",
        "> Yönetmelik metni (a) bendinde A1/B2/B3'ten en az birinin bulunması için 0.90, (b) bendinde Tablo 3.6 düzensizliklerinin hiçbirinin bulunmaması için 0.80 verir. Projede başka bir düzensizlik kombinasyonu varsa γE seçimini yönetmelik metni ve proje özelindeki yorumla açıkça gerekçelendirin; tabloda olmayan ara katsayı üretmeyin."
      ),
      subsections: [],
    },
    {
      id: "ornek-olcekleme",
      title: "Çözümlü örnek: modal sonuçların büyütülmesi",
      content: phase3Lines(
        "**ASSUMPTION:** X doğrultusunda `VtE = 1000 kN`, modal toplam `Vtx = 700 kN` olsun ve binada Tablo 3.6 düzensizliklerinin hiçbiri bulunmasın. Bu durumda SOURCE_VALUE `γE = 0.80` alınır.",
        "",
        "1. Karşılaştırma sınırı: `γE VtE = 0.80 × 1000 = 800 kN`.",
        "2. `700 < 800` olduğundan ölçekleme gerekir.",
        "3. `βtE = 800 / 700 = 1.1429 ≈ 1.143`.",
        "4. Modal hesapla elde edilen azaltılmış iç kuvvet ve yerdeğiştirme büyüklükleri **1.143** ile büyütülür.",
        "",
        "> [!engineering] Karşı örnek",
        "> Aynı yapıda Vtx = 850 kN olsaydı `850 ≥ 800` koşulu sağlanır ve βtE = 1 alınırdı; sonuçlar 800/850 ile küçültülmezdi."
      ),
      subsections: [],
    },
    {
      id: "bodrum-ve-zarf",
      title: "Rijit bodrumlu binalarda ölçek hangi bölüme uygulanır?",
      content: phase3Lines(
        "Madde 4.8.4.2, 3.3.1 tanımına göre dıştan rijit perdelerle çevrelenen bodrumların bulunduğu binalarda eşdeğer taban kesme büyütme katsayısının **yalnız bodrum katlarının üstündeki üst bölüm için** hesaplanacağını belirtir. Bu ayrım, üst ve alt bölümün farklı dinamik özelliklerini dikkate alan Bölüm 4 yaklaşımıyla uyumludur.",
        "",
        "| Kontrol | Uygulama |",
        "|---|---|",
        "| Bodrumsuz / özel rijit bodrum tanımı yok | İlgili doğrultudaki tüm modal sonuç için 4.8.4.1 kontrolü |",
        "| 3.3.1'e göre dıştan rijit perdeli bodrum var | βtE yalnız üst bölüm için hesaplanır |",
        "| X ve Y doğrultuları | Karşılaştırma ve katsayı her doğrultuda ayrı yapılır |",
        "",
        "> [!check] Tasarım zarfı",
        "> Ölçek katsayısı yalnız raporlanan toplam taban kesmeye uygulanıp kolon, perde, kiriş, kat ötelenmesi ve diğer tasarım tepkileri eski modal sonuçlardan bırakılmamalıdır. Tasarım zarfları ölçeklenmiş sonuçlardan üretilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- X ve Y doğrultuları için Vtx ayrı ayrı çıkarıldı mı?",
        "- Referans VtE, TBDY 4.7 ve 4.8.4.1'in işaret ettiği esaslarla uyumlu mu?",
        "- A1, B2, B3 ve diğer Tablo 3.6 düzensizlikleri doğru sınıflandırıldı mı?",
        "- γE seçimi 0.80/0.90 koşuluyla gerekçelendirildi mi?",
        "- `Vtx < γE VtE` karşılaştırması her doğrultuda yapıldı mı?",
        "- βtE hiçbir durumda 1'in altına indirilmedi mi?",
        "- Tüm azaltılmış iç kuvvet ve yerdeğiştirmeler aynı katsayıyla büyütüldü mü?",
        "- Rijit bodrum varsa 4.8.4.2'deki üst bölüm ayrımı uygulandı mı?",
        "- Tasarım zarfları ve pafta kuvvetleri ölçeklenmiş sonuçlardan üretildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.8.4; Denklem (4.31), Tablo 3.6 ve Madde 3.3.1"),
  keywords: ["TBDY 2018", "modal taban kesme", "Denklem 4.31", "βtE", "γE", "0.80", "0.90", "VtE", "Vtx", "ölçekleme"],
  tags: ["TBDY 2018", "Modal Analiz", "Taban Kesme", "Ölçekleme"],
};
