import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_GUCLU_KOLON: DepremPhase3Override = {
  slug: "tbdy-2018-guclu-kolon-kontrolu",
  description: "TBDY 2018 Madde 7.3.5–7.3.6'ya göre güçlü kolon–zayıf kiriş ilkesinin birleşim moment kapasiteleri, istisnaları ve kat düzeyindeki αi koşulu üzerinden nasıl denetlendiğini açıklar.",
  seoTitle: "TBDY 2018 Güçlü Kolon Kontrolü | Denklem 7.3 ve αi Rehberi",
  seoDescription: "Güçlü kolon-zayıf kiriş koşulu, Denklem 7.3, 1.2 kapasite oranı, Nd istisnası, αi ≥ 0.70 kat kontrolü ve 1/αi büyütmesi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "kapasite-tasarimi-amaci",
      title: "Güçlü kolon kontrolü tek bir oran kontrolü değil, plastik mekanizmayı kirişlere yönlendiren kapasite tasarımı kuralıdır",
      content: phase3Lines(
        "TBDY 7.3.5'in amacı deprem sırasında kolonların kirişlerden önce yaygın biçimde plastikleştiği kat mekanizmalarını önlemektir. Kontrol, kolon ve kirişlerin analiz momentlerini değil, birleşim yüzlerindeki moment kapasitelerini karşılaştırır.",
        "",
        "| Kontrol katmanı | Yönetmelik başlığı | Proje sorusu |",
        "|---|---|---|",
        "| Birleşim kapasitesi | 7.3.5.1, Denklem (7.3) | Kolon moment kapasiteleri kiriş kapasitelerine göre yeterli mi? |",
        "| Yön ve işaret | 7.3.5.2 | Her deprem doğrultusu ve iki deprem yönü ayrı incelendi mi? |",
        "| İstisnalar | 7.3.5.3 | Kontrolün aranmadığı özel durum gerçekten sağlanıyor mu? |",
        "| Kat düzeyi kontrol | 7.3.6 | Bazı düğümler sağlamıyorsa αi koşulu ve sonuçları uygulanıyor mu? |",
        "",
        "> [!engineering] Kapasite ile analiz momentini karıştırmayın",
        "> Güçlü kolon koşulunda kullanılan büyüklükler kesitlerin moment taşıma kapasiteleridir. Analizden çıkan talep momentlerini doğrudan Denklem (7.3)'e koymak farklı bir kontrol üretir."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-3",
      title: "7.3.5.1: Birleşimde kolon moment kapasiteleri toplamı kiriş moment kapasiteleri toplamının en az 1.2 katı olmalıdır",
      content: phase3Lines(
        "Yüksek süneklikli çerçevelerde kolon-kiriş birleşimi için temel koşul **Denklem (7.3)** ile `(Mra + Mrü) ≥ 1.2(Mri + Mrj)` biçiminde verilir. Mra ve Mrü birleşimin alt ve üstündeki kolon uç moment kapasitelerini; Mri ve Mrj ise birleşime bağlanan kirişlerin kolon yüzlerindeki moment kapasitelerini temsil eder.",
        "",
        "Kirişlerdeki kapasite hesabı deprem yönüne bağlı moment işaretine göre yapılır. Kolon kapasitelerinde ise 7.3.5.2 uyarınca söz konusu deprem doğrultusuyla uyumlu ve kolon moment kapasitesini en küçük yapan eksenel kuvvet **Nd** dikkate alınır.",
        "",
        "> [!check] Dört senaryoyu görünür kılın",
        "> X ve Y doğrultuları ile her doğrultunun iki deprem yönünü ayrı kontrol satırlarında raporlayın. Tek bir “strong column = OK” etiketi hangi işaretin belirleyici olduğunu gizler."
      ),
      subsections: [],
    },
    {
      id: "istisnalar",
      title: "7.3.5.3: Denklem (7.3) her birleşimde koşulsuz aranmaz; istisnalar açıkça belgelenmelidir",
      content: phase3Lines(
        "TBDY 7.3.5.3 üç özel durumda güçlü kolon koşulunun aranmayabileceğini tanımlar. Bunların ilki, birleşimin her iki tarafındaki kolonlarda **Nd ≤ 0.10 Ac fck** koşulunun sağlanmasıdır. Ayrıca tek katlı binalarda ve kolonların yukarıya devam etmediği düğümlerde kontrol aranmaz; kirişin perdenin zayıf doğrultusunda kolon gibi çalışan perde koluna bağlandığı özel durum da madde kapsamında istisnadır.",
        "",
        "İstisna kullanımı, birleşimi modelden veya detay kontrolünden çıkarmak anlamına gelmez. Birleşim bölgesi kesme güvenliği, sarılma ve diğer eleman detay hükümleri kendi maddelerine göre ayrıca devam eder.",
        "",
        "> [!warning] Tek kolonun düşük eksenel yükü yetmez",
        "> `Nd ≤ 0.10 Ac fck` istisnasını kullanırken birleşimin iki tarafındaki ilgili kolon koşullarının birlikte sağlandığını ve kullanılan Nd değerinin doğru yükleme durumundan geldiğini doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "kat-duzeyi-alpha",
      title: "7.3.6: Bazı birleşimler Denklem (7.3)'ü sağlamıyorsa kat düzeyinde αi = Vis / Vik oranı devreye girer",
      content: phase3Lines(
        "TBDY, tek bir birleşimin başarısızlığını otomatik olarak bütün sistemin reddi saymaz; 7.3.6 kat düzeyinde ek bir kapasite dağılımı kontrolü tanımlar. Yönetmelikte tanımlanan kesme kuvveti toplamlarıyla **αi = Vis / Vik** oranı hesaplanır ve Denklem (7.4) kapsamında **αi ≥ 0.70** koşulu aranır.",
        "",
        "Vis, ilgili katta Denklem (7.3)'ü belirlenen biçimde sağlayan kolonlara ait kesme kuvveti toplamını; Vik ise katın ilgili kolon kesme kuvveti toplamını temsil eden yönetmelik büyüklüğüdür. Hesap, her deprem doğrultusu için ayrı yürütülmelidir.",
        "",
        "> [!engineering] Düğüm listesinden kat kararına",
        "> Önce hangi düğümlerin Denklem (7.3)'ü sağladığını işaretleyin, sonra aynı analiz durumundan kolon kesmelerini kullanarak αi hesabını kurun. Farklı yükleme durumlarının sonuçlarını aynı oranda karıştırmayın."
      ),
      subsections: [],
    },
    {
      id: "alpha-buyutme",
      title: "0.70 ≤ αi < 1.0 aralığında, koşulu sağlayan kolonların iç kuvvetleri 1/αi ile büyütülür",
      content: phase3Lines(
        "Kat düzeyinde **0.70 ≤ αi < 1.0** elde edildiğinde 7.3.6.2, Denklem (7.3)'ü alt ve üst birleşimlerinde sağlayan kolonların moment ve kesme kuvvetlerinin **1/αi** katsayısıyla büyütülmesini ister. Koşulu sağlamayan kolonların tasarımında ise ilgili yönetmelik hükümleri ayrıca uygulanır.",
        "",
        "αi değeri 1.0'a yaklaştıkça büyütme azalır; 0.70 sınırına yaklaştıkça talep artar. Bu işlem güçlü kolon ilkesinin kat genelindeki eksikliğini kalan kolon taleplerine yansıtan kapasite tasarımı mekanizmasıdır.",
        "",
        "> [!check] Otomatik büyütmeyi doğrulayın",
        "> Yazılım αi hesabını otomatik yapıyorsa hangi kolonların `1/αi` ile büyütüldüğünü rapordan örnek bir katta elle doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "alpha-yetersiz",
      title: "7.3.6.3: αi < 0.70 ise konu yalnız donatı artırımı değildir; çerçeve sisteminin süneklik sınıfı etkilenir",
      content: phase3Lines(
        "Bir katta Denklem (7.4) sağlanmıyorsa, yani **αi < 0.70** ise, 7.3.6.3 uyarınca ilgili doğrultudaki bütün çerçeveler Tablo 4.1 bağlamında sınırlı süneklik düzeyindeki çerçeveler olarak ele alınır. Yüksek süneklikli perdelerle birlikte kullanılan karma sistemlerde taşıyıcı sistem sınıflandırması ve buna bağlı R/D seçimleri yeniden değerlendirilmelidir.",
        "",
        "Bu nedenle başarısız güçlü kolon kontrolünü yalnız kolon boyuna donatısını artırarak kapatmaya çalışmak doğru iş akışı değildir. Kesitler, kiriş kapasiteleri, kolon eksenel kuvvetleri ve taşıyıcı sistem sınıfı birlikte yeniden okunmalıdır.",
        "",
        "> [!warning] Sistem seviyesinde sonuç",
        "> Güçlü kolon kontrolünün kritik başarısızlığı eleman detayı olmaktan çıkıp analiz parametrelerini değiştirebilen bir taşıyıcı sistem kararıdır."
      ),
      subsections: [],
    },
    {
      id: "kapasite-kesme-baglantisi",
      title: "Güçlü kolon kontrolü tamamlandıktan sonra kolon kesme güvenliği ayrı kapasite tasarımı adımı olarak sürdürülür",
      content: phase3Lines(
        "7.3.5–7.3.6 moment kapasitesi dağılımını ve plastik mekanizma tercihini denetler. Kolonların deprem kesme kuvveti ise 7.3.7 kapsamında kapasite momentlerinden türetilen ayrı bir kontrol zinciridir. Birinin sağlanması diğerini otomatik sağlamaz.",
        "",
        "Projede güçlü kolon sonucu, kolon kapasite kesmesi, birleşim bölgesi kesmesi ve sarılma detayları ayrı kontrol satırlarında tutulmalıdır. Böylece bir revizyonun hangi güvenlik mekanizmasını etkilediği izlenebilir.",
        "",
        "> [!engineering] Source-of-truth ayrımı",
        "> Kolon kapasite kesmesinin Denklem (7.5) ve kesme sınırları bu projede ayrı FAZ 3 makalesinde yönetiliyor; burada aynı hükümleri tekrar ederek iki farklı teknik kaynak üretmeyin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Her birleşimde **Denklem (7.3)** için `(Mra + Mrü) ≥ 1.2(Mri + Mrj)` kontrolü doğru kapasite momentleriyle yapıldı mı?",
        "- Kontrol her deprem doğrultusu ve iki işaret için ayrı tekrarlandı mı?",
        "- Kolon kapasitesinde kullanılan Nd, moment kapasitesini en küçük yapan uyumlu eksenel kuvvet durumundan alındı mı?",
        "- 7.3.5.3 istisnası kullanılıyorsa **Nd ≤ 0.10 Ac fck** dahil tüm istisna koşulları açıkça belgeli mi?",
        "- Başarısız düğümler varsa kat için **αi = Vis / Vik** hesaplandı ve **αi ≥ 0.70** sınırı kontrol edildi mi?",
        "- **0.70 ≤ αi < 1.0** ise gerekli kolon moment/kesme kuvvetleri **1/αi** ile büyütüldü mü?",
        "- **αi < 0.70** durumunda 7.3.6.3'e göre taşıyıcı sistem/süneklik sınıfı yeniden değerlendirildi mi?",
        "- Güçlü kolon kontrolünden bağımsız olarak kolon kapasite kesmesi ve birleşim kesme güvenliği tamamlandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.5, 7.3.6 ve bağlantılı 7.3.7"),
  keywords: ["TBDY 2018", "güçlü kolon", "zayıf kiriş", "Denklem 7.3", "kapasite tasarımı", "αi", "kolon-kiriş birleşimi"],
  tags: ["TBDY 2018", "Güçlü Kolon", "Kapasite Tasarımı", "Kolon-Kiriş"],
};
