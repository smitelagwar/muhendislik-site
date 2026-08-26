import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_PERDE_ZARF: DepremPhase3Override = {
  slug: "tbdy-betonarme-perde-moment-kesme-zarfi",
  description: "TBDY 2018 Madde 7.6.6'ya göre narin perdelerde analiz momentlerinin tasarım momenti zarfına dönüştürülmesini ve kapasite esaslı tasarım kesme kuvveti Ve'nin belirlenmesini açıklar.",
  seoTitle: "TBDY Perde Moment ve Kesme Zarfı | Denklem 7.16",
  seoDescription: "Hw/ℓw > 2 perdelerde Hcr moment zarfı, Denklem 7.16, βv=1.5/1.0, 1.25 moment kapasitesi ve 1.2D/1.4D kesme sınırlarının kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "moment-zarfi-hcr",
      title: "7.6.6.1: Hw/ℓw > 2.0 perdelerde ham analiz momenti doğrudan donatı zarfı değildir",
      content: phase3Lines(
        "`Hw/ℓw > 2.0` koşulunu sağlayan perdelerde tasarıma esas eğilme momenti, 7.6.2.2'ye göre belirlenen kritik perde yüksekliği boyunca **perde tabanında Bölüm 4'e göre hesaplanan eğilme momentine eşit sabit değer** alınır.",
        "",
        "Hcr'nin sona erdiği kesitin üstünde ise, Bölüm 4'e göre perdenin tabanında ve tepesinde hesaplanan momentleri birleştiren doğruya paralel doğrusal bir tasarım momenti diyagramı uygulanır.",
        "",
        "| Bölge | Tasarım momenti yaklaşımı |",
        "|---|---|",
        "| 0 – Hcr | Taban tasarım momentine eşit sabit zarf |",
        "| Hcr üstü | Bölüm 4 taban-tepe moment doğrusuna paralel doğrusal zarf |",
        "| Hw/ℓw ≤ 2.0 | Tüm kesitlerde Bölüm 4 momentleri |",
        "",
        "> [!engineering] Program diyagramını kopyalamayın",
        "> Analiz programındaki kat kat ham moment ordinatlarını doğrudan perde donatısına çevirmek, 7.6.6.1'in Hcr boyunca sabit moment zarfını atlayabilir."
      ),
      subsections: [],
    },
    {
      id: "moment-kapasitesi-kontrolu",
      title: "7.6.6.2: Her katta perde moment kapasitesi güçlü doğrultuda ayrıca kontrol edilir",
      content: phase3Lines(
        "`Hw/ℓw > 2.0` olan perdelerde her kattaki perde kesitlerinin taşıma gücü momentleri, perdenin güçlü doğrultusunda kolonlar için **Denklem (7.3)** ile verilen koşulu sağlamalıdır.",
        "",
        "Koşul sağlanmıyorsa TBDY, perde boyutları ve/veya donatılarının artırılmasını ve deprem hesabının tekrarlanmasını ister. Bu kontrol yalnız donatı alanını sonradan artırarak analiz kuvvetlerini değiştirmeden kapatılacak bağımsız bir detay kontrolü değildir.",
        "",
        "> [!warning] Analiz–tasarım döngüsü",
        "> Perde kesiti veya donatı düzeni taşıyıcı sistem rijitliği/kapasite dağılımını anlamlı biçimde değiştiriyorsa revizyon, hesap modeline ve ilgili tasarım kontrollerine geri beslenmelidir."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-16",
      title: "Denklem 7.16: Tasarım kesmesi moment kapasitesi oranı ve dinamik büyütmeyle elde edilir",
      content: phase3Lines(
        "`Hw/ℓw > 2.0` perdelerde enine donatı hesabına esas tasarım kesme kuvveti `Ve`, TBDY 7.6.6.3'e göre aşağıdaki kapasite esaslı bağıntıyla hesaplanır:",
        "",
        "```formula",
        "@label: TBDY Denklem (7.16) — perde tasarım kesme kuvveti",
        "V_e = β_v ((M_p)_t / (M_d)_t) V_d",
        "@symbol: V_e | Enine donatı hesabına esas tasarım kesme kuvveti | kN",
        "@symbol: β_v | Kesme kuvveti dinamik büyütme katsayısı | -",
        "@symbol: (M_p)_t | Perde tabanındaki moment kapasitesi | kN·m",
        "@symbol: (M_d)_t | Perde tabanındaki tasarım eğilme momenti | kN·m",
        "@symbol: V_d | Bölüm 4'e göre hesaplanan tasarım kesme kuvveti | kN",
        "```",
        "",
        "Denklemde `βv = 1.5` alınır. Ancak deprem yükünün tamamının betonarme perdelerle taşındığı binalarda `βv = 1.0` alınabilir.",
        "",
        "> [!engineering] Kapasite büyütmesinin amacı",
        "> Ve, yalnız elastik analiz kesmesini büyütmek için keyfi bir katsayı değildir; perdenin taban moment kapasitesinin tasarım momentine oranını ve dinamik kesme büyütmesini birlikte taşır."
      ),
      subsections: [],
    },
    {
      id: "moment-kapasitesi-yaklasimi",
      title: "Daha kesin hesap yoksa (Mp)t için 1.25(Mr)t üst kabulü kullanılabilir",
      content: phase3Lines(
        "TBDY 7.6.6.3, daha kesin hesap yapılmadığı durumda perde tabanındaki moment kapasitesi için `(Mp)t ≤ 1.25(Mr)t` kabulüne izin verir. Buradaki `Mr`, ilgili kesitin taşıma gücü momentidir.",
        "",
        "Bu `1.25` katsayısı, Denklem (7.16)'daki tüm momentleri 1.25 ile çarpma kuralı değildir. Yalnız daha kesin moment kapasitesi hesabı yapılmadığında `(Mp)t` için verilen sınırdır.",
        "",
        "> [!warning] Katsayıyı yanlış yere taşımayın",
        "> 1.25'i `Vd`, `(Md)t` veya nihai `Ve` üzerine doğrudan uygulamak yönetmelik bağıntısını değiştirir."
      ),
      subsections: [],
    },
    {
      id: "d-ile-buyutulmus-kesme",
      title: "1.2D / 1.4D ile büyütülmüş analiz kesmesi Denklem 7.16 sonucu ile karşılaştırılır",
      content: phase3Lines(
        "Düşey yükler ile Bölüm 4'e göre depremden hesaplanan kesme kuvvetinin, boşluksuz perdelerde `1.2D`, bağ kirişli perdelerde `1.4D` ile büyütülmesiyle elde edilen değer Denklem (7.16) ile bulunan `Ve`'den **küçükse**, enine donatı hesabında `Ve` yerine bu daha küçük büyütülmüş kesme değeri kullanılır.",
        "",
        "| Perde türü | Karşılaştırmada kullanılan büyütme |",
        "|---|---:|",
        "| Boşluksuz perde | 1.2D |",
        "| Bağ kirişli perde | 1.4D |",
        "",
        "Bu hüküm nedeniyle tasarım kesmesi yalnız Denklem (7.16)'yı çalıştırıp bırakılarak belirlenmez; D ile büyütülmüş Bölüm 4 kesmesi de aynı kesitte hesaplanıp karşılaştırılır.",
        "",
        "> [!check] Hangi değer kullanıldı?",
        "> Yazılım raporunda veya bağımsız kontrolde, Denklem (7.16) sonucu ile 1.2D/1.4D büyütülmüş kesmenin ikisini de gösterin ve yönetmeliğin tarif ettiği küçük değerin seçildiğini doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "bodur-perdeler-ve-kesme-guvenligi",
      title: "Hw/ℓw ≤ 2.0 perdelerde moment ve kesme Bölüm 4 sonuçlarına eşit alınır",
      content: phase3Lines(
        "7.6.6.1 ve 7.6.6.3, `Hw/ℓw ≤ 2.0` olan perdelerde tüm kesitlerde tasarım eğilme momentlerinin ve tasarım kesme kuvvetlerinin Bölüm 4'e göre hesaplanan değerlere eşit alınacağını belirtir.",
        "",
        "Bu ayrım, Denklem (7.16)'yı tüm perdelere otomatik uygulamamak gerektiğini gösterir. Narinlik oranı önce sınıflandırılmalı, ardından doğru zarf yöntemi seçilmelidir.",
        "",
        "Kesme kuvvetinin belirlenmesi 7.6.6 ile bitmez. Kesit kesme dayanımı ve üst sınırlar 7.6.7'de ayrıca kontrol edilir; tasarım kuvveti üretimi ile dayanım kontrolünü tek adım gibi değerlendirmeyin.",
        "",
        "> [!engineering] İki aşamalı kontrol",
        "> Önce 7.6.6 ile tasarım M–V zarfını üretin, sonra 7.6.7 ile bu talebe karşı kesme güvenliğini doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Her perde için `Hw/ℓw` oranı belirlenip >2.0 ve ≤2.0 dalları doğru ayrıldı mı?",
        "- `Hw/ℓw > 2.0` perdede Hcr boyunca tasarım momenti taban momentine eşit sabit zarf olarak düzenlendi mi?",
        "- Hcr üstündeki doğrusal moment zarfı Bölüm 4 taban-tepe moment doğrusuna paralel mi?",
        "- Her kattaki taşıma gücü momenti Denklem (7.3) koşuluyla kontrol edildi mi?",
        "- Denklem (7.16) için `(Mp)t`, `(Md)t`, `Vd` ve βv aynı perde/kesit tanımından mı geliyor?",
        "- Genel durumda βv = 1.5 kullanıldı mı; βv = 1.0 yalnız deprem yükünün tamamı betonarme perdelerle taşınıyorsa mı seçildi?",
        "- Daha kesin kapasite hesabı yoksa `(Mp)t ≤ 1.25(Mr)t` kabulü doğru yerde uygulandı mı?",
        "- Boşluksuz perdede 1.2D, bağ kirişli perdede 1.4D ile büyütülmüş Bölüm 4 kesmesi Denklem (7.16) Ve ile karşılaştırıldı mı?",
        "- `Hw/ℓw ≤ 2.0` perdelerde Bölüm 4 moment ve kesmeleri doğrudan kullanıldı mı?",
        "- Nihai Ve için 7.6.7 kesme dayanımı ve üst sınır kontrolleri ayrıca tamamlandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.6.6.1–7.6.6.3 ve Denklem (7.16)"),
  keywords: ["TBDY 2018", "perde moment zarfı", "perde kesme", "Ve", "βv", "Denklem 7.16", "7.6.6", "kapasite tasarımı"],
  tags: ["TBDY 2018", "Betonarme", "Perde", "Moment", "Kesme", "Kapasite Tasarımı"],
};
