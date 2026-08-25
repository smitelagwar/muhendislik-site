import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KOLON_KAPASITE_KESME: DepremPhase3Override = {
  slug: "tbdy-betonarme-kolon-kapasite-kesme",
  description: "TBDY 2018 Madde 7.3.7'ye göre kolon tasarım kesme kuvvetinin kapasite tasarımıyla elde edilmesini, Ve alt/üst sınırlarını ve sarılma bölgelerinde Vc=0 koşulunu açıklar.",
  seoTitle: "TBDY Kolon Kapasite Kesmesi | Denklem 7.5–7.7",
  seoDescription: "Ve=(Ma+Mü)/ℓn, güçlü kolon koşuluna göre uç momentlerin seçimi, Ve≥Vd, Ve≤Vr, 0.85Awfck ve Vc=0 kontrolleri.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "kapasite-tasarimi-amaci",
      title: "Kolon kesmesi yalnız analiz programındaki elastik V sonucu değildir",
      content: phase3Lines(
        "7.3.7'nin amacı, kolonun eğilme kapasitesine ulaşması halinde oluşabilecek kesme talebini önceden öngörerek **gevrek kesme kırılmasını sünek eğilme mekanizmasının önüne geçirmemektir**. Bu nedenle enine donatı hesabına esas kesme kuvveti `Ve`, uç momentlerden türetilir.",
        "",
        "> [!warning] Ham analiz kesmesi ile bitirmeyin",
        "> Bölüm 4 analizinden gelen kolon kesme kuvveti gerekli karşılaştırmalardan biridir; ancak yüksek sünek kolonda kapasite tasarımı adımı atlanamaz."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-5",
      title: "Denklem (7.5): Ve = (Ma + Mü) / ℓn",
      content: phase3Lines(
        "Kolonun alt ve üst uçlarında kapasite tasarımına göre belirlenen momentler kullanılarak enine donatı hesabına esas kesme kuvveti hesaplanır.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.5) — kolon kapasite kesmesi",
        "V_e = (M_a + M_ü) / ℓ_n",
        "@symbol: V_e | Kolon enine donatı hesabına esas kesme kuvveti | kN",
        "@symbol: M_a, M_ü | Kolon alt ve üst uçlarında 7.3.7.2/7.3.7.3'e göre belirlenen momentler | kN·m",
        "@symbol: ℓ_n | Kolonun serbest yüksekliği | m",
        "```",
        "",
        "> [!engineering] İşaret değil mekanizma",
        "> `Ma` ve `Mü`, tek bir analiz kombinasyonundaki momentlerin mutlak değerlerini gelişigüzel toplamak değildir. Uç momentler 7.3.7.2 veya 7.3.7.3 kapasite mantığıyla, deprem doğrultusu ve yönü gözetilerek belirlenir."
      ),
      subsections: [],
    },
    {
      id: "uc-momentlerin-secimi",
      title: "Güçlü kolon koşulunun sağlanıp sağlanmaması uç moment hesabını değiştirir",
      content: phase3Lines(
        "Denklem (7.3) güçlü kolon–zayıf kiriş koşulu sağlanıyorsa, düğüme birleşen kiriş uç moment kapasiteleri toplamı `ΣMp` bulunur ve kolon uçlarına analiz momentleri oranında dağıtılır. Daha kesin hesap yapılmadığında kiriş uç kapasiteleri yaklaşık `Mpi ≈ 1.4Mri`, `Mpj ≈ 1.4Mrj` alınabilir.",
        "",
        "Denklem (7.3) sağlanmıyorsa kolon uç momentleri doğrudan kolon moment kapasiteleri olarak belirlenir; daha kesin hesap yoksa `Mpa ≈ 1.4Mra` ve `Mpü ≈ 1.4Mrü` yaklaşımı kullanılabilir. Bu kapasite hesabında `Nd`, ilgili momenti en büyük yapan deprem yönüyle uyumlu seçilir.",
        "",
        "> [!check] Temel üstü",
        "> Temele bağlanan kolonun alt ucundaki `Ma` da 7.3.7.3'teki kolon moment kapasitesi yaklaşımıyla belirlenir."
      ),
      subsections: [],
    },
    {
      id: "ve-alt-ust-sinirlari",
      title: "Ve için üç ayrı kapı vardır: D-artırılmış talep, Vr ve 0.85Awfck",
      content: phase3Lines(
        "7.3.7.1 ve 7.3.7.5 birlikte okunduğunda kapasite kesmesi tek başına nihai değer değildir.",
        "",
        "| Kontrol | Yönetmelik mantığı |",
        "|---|---|",
        "| D-artırılmış deprem + düşey yük kesmesi | Bu değer `Ve`'den küçükse onun kullanılması mümkündür; 7.3.7.5 gereği esas `Ve`, `Vd`'den küçük olamaz |",
        "| Kesme dayanımı | `Ve ≤ Vr` |",
        "| Kesme gerilmesi üst sınırı | `Ve ≤ 0.85 Aw fck` |",
        "",
        "İkinci üst sınır sağlanmıyorsa yalnız etriye artırmak yeterli kabul edilmez; **kesit boyutları büyütülerek deprem hesabı tekrarlanır**.",
        "",
        "> [!warning] Program kontrolü",
        "> Yazılımın yalnız `Ve/Vr` oranını göstermesi, `0.85Awfck` üst sınırının ve doğru kapasite `Ve` üretiminin ayrıca doğrulanması gereğini ortadan kaldırmaz."
      ),
      subsections: [],
    },
    {
      id: "beton-katkisi-ve-kisa-kolon",
      title: "Bazı sarılma bölgelerinde betonun kesme katkısı Vc = 0 alınır",
      content: phase3Lines(
        "7.3.7.6'ya göre normal durumda `Vc` TS 500'e göre belirlenir. Ancak kolon sarılma bölgesinde yalnız deprem yüklerinden oluşan kesme, depremli durumdaki toplam kesmenin **yarısından büyükse** ve aynı zamanda `Nd/(Ac fck) ≤ 0.05` ise betonun kesme dayanımına katkısı `Vc = 0` alınır.",
        "",
        "Kısa kolonlarda 7.3.8 kapasite kesmesi mantığını daha da kritik hale getirir: `ℓn` kısa kolonun gerçek serbest boyu alınır; uç momentler yaklaşık `1.4Mr` kapasite düzeyinde değerlendirilir ve sarılma bölgesi minimum enine donatısı kısa kolon boyunca uygulanır.",
        "",
        "> [!engineering] Kısa kolon etkisi",
        "> Aynı moment kapasitesi daha küçük `ℓn`'ye bölündüğünde `Ve` hızla büyür. Dolgu duvarı boşluğu gibi geometriler modelde gerçek serbest boyla temsil edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Kolon kesmesi Denklem (7.5) ile kapasite tasarımına göre üretilmiş mi?",
        "- `Ma` ve `Mü`, güçlü kolon koşulunun sağlanma durumuna göre 7.3.7.2 veya 7.3.7.3'ten mi geliyor?",
        "- Depremin iki yönü için elverişsiz uç kapasitesi seçilmiş mi?",
        "- Temel üstü kolon alt ucunda kolon moment kapasitesi kullanılmış mı?",
        "- Esas kesme kuvveti `Vd`'den küçük bırakılmış mı?",
        "- `Ve ≤ Vr` sağlanıyor mu?",
        "- `Ve ≤ 0.85Awfck` üst sınırı sağlanıyor mu?",
        "- Sarılma bölgesinde deprem kesmesi > toplamın yarısı ve `Nd/(Ac fck) ≤0.05` ise `Vc=0` alınmış mı?",
        "- Kısa kolon varsa gerçek `ℓn` ve tüm boy boyunca sıklaştırma koşulları uygulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.7–7.3.8, Denklem (7.5)–(7.7)"),
  keywords: ["TBDY 2018", "kolon kesme", "kapasite tasarımı", "Ve", "Denklem 7.5", "0.85 Aw fck", "Vc=0", "kısa kolon"],
  tags: ["TBDY 2018", "Betonarme", "Kolon", "Kesme", "Kapasite Tasarımı"],
};
