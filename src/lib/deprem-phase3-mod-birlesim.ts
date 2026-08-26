import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_MOD_BIRLESIM: DepremPhase3Override = {
  slug: "tbdy-mod-birlesim-srss-cqc",
  description: "TBDY 2018 EK 4B'ye göre modal maksimumların Tam Karesel Birleştirme (TKB/CQC) ile nasıl birleştirildiğini ve hangi koşulda KTKK/SRSS yönteminin kullanılabileceğini açıklar.",
  seoTitle: "TBDY 2018 Mod Birleştirme | TKB CQC ve KTKK SRSS",
  seoDescription: "TBDY EK 4B.2.4, Denklem 4B.4-4B.6, TKB/CQC, KTKK/SRSS, çapraz korelasyon ve beta_mn < 0.8 koşulu.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "modal-maksimumlar-eszamanli-degil",
      title: "4B.2.4: Modal maksimumlar eşzamanlı değildir; istatistiksel olarak birleştirilir",
      content: phase3Lines(
        "TBDY EK 4B.2.4, iç kuvvet, yerdeğiştirme ve göreli kat ötelemesi gibi her davranış büyüklüğü için her titreşim modundan elde edilen **eşzamanlı olmayan en büyük modal katkıların** istatistiksel olarak birleştirilmesini ister.",
        "",
        "Bu nedenle mod birleştirme, mod sonuçlarını cebirsel olarak toplamak değildir. Her cevap büyüklüğü için modal maksimumların büyüklüğü ve modlar arası korelasyon dikkate alınır.",
        "",
        "> [!warning] Mod şekillerini değil cevap maksimumlarını birleştirirsiniz",
        "> Yazılım çıktısında kat ötelemesi, kesme kuvveti veya moment için yapılan modal kombinasyonun aynı istatistiksel kuralı izlediğini kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "tkb-genel-kural",
      title: "Denklem 4B.4: Genel mod birleştirme kuralı Tam Karesel Birleştirme'dir",
      content: phase3Lines(
        "TBDY 4B.2.4(a), en genel mod birleştirme kuralı olarak **Tam Karesel Birleştirme (TKB)** kuralını verir. Uluslararası yazılımlarda bu yöntem çoğunlukla **CQC — Complete Quadratic Combination** adıyla görülür. TKB, modlar arası çapraz korelasyon katsayısı `ρmn` değerini açıkça hesaba katar.",
        "",
        "Aynı maddede KTKK/SRSS ise yalnız özel koşul sağlandığında kullanılabilen sadeleşmiş durumdur.",
        "",
        "> [!engineering] Varsayılan güvenli okuma",
        "> Mod yakınlığı/korelasyonu hakkında özel bir sadeleşme koşulu doğrulanmadıysa yönetmeliğin genel kuralı TKB/CQC'dir."
      ),
      subsections: [],
    },
    {
      id: "denklem-4b4-4b6",
      title: "Denklem 4B.4 ve 4B.6: TKB korelasyonu içerir, KTKK karelerin toplamının kareköküdür",
      content: phase3Lines(
        "İki kuralın matematiksel farkı aşağıdaki tek semantik blokta görülebilir:",
        "",
        "```formula",
        "@label: TBDY Denklem (4B.4) / (4B.6) — TKB ve KTKK modal birleştirme",
        "r_max = sqrt(sum_m sum_n rho_mn r_m,max r_n,max)  [TKB / CQC]",
        "r_max = sqrt(sum_n (r_n,max)^2)  [KTKK / SRSS]",
        "@symbol: r_max | İstatistiksel olarak birleştirilmiş en büyük davranış büyüklüğü | ilgili cevap birimi",
        "@symbol: r_m,max | m'inci moda ait en büyük modal davranış büyüklüğü | ilgili cevap birimi",
        "@symbol: r_n,max | n'inci moda ait en büyük modal davranış büyüklüğü | ilgili cevap birimi",
        "@symbol: rho_mn | m ve n modlarına ait çapraz korelasyon katsayısı | -",
        "@symbol: YM | Gözönüne alınan toplam mod sayısı | adet",
        "```",
        "",
        "KTKK, TKB bağıntısında farklı modlar için çapraz korelasyonun sıfır, aynı mod için bir kabul edildiği özel duruma karşılık gelir.",
        "",
        "> [!check] Sonuç işareti",
        "> Modal maksimum kombinasyonu büyüklük üretir; daha sonra deprem doğrultusu/işaret kombinasyonlarının nasıl oluşturulduğu ayrı yönetmelik adımlarıdır."
      ),
      subsections: [],
    },
    {
      id: "korelasyon-katsayisi",
      title: "Denklem 4B.5: TKB'nin çapraz korelasyonu periyot oranı ve modal sönüme bağlıdır",
      content: phase3Lines(
        "TBDY Denklem (4B.5a), `ρmn` çapraz korelasyon katsayısını `βmn = Tm/Tn` periyot oranı ile m ve n modlarının modal sönüm oranlarına bağlı olarak tanımlar. Bütün modlarda aynı modal sönüm kabul edilirse Denklem (4B.5b) ile sadeleştirilmiş ifade kullanılabilir.",
        "",
        "Dolayısıyla CQC/TKB seçiminin mühendislik anlamı, yalnız bir yazılım seçeneği olmaktan öte **yakın modal frekansların korelasyonunu hesaba katmaktır**.",
        "",
        "> [!warning] %5 sönüm varsayımı",
        "> TBDY'de aksi belirtilmedikçe modelleme için sönüm oranı %5 alınır; ancak TKB formülündeki modal sönüm değişkenlerinin yazılım kabulüyle uyumunu yine de kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "srss-kullanim-kapisi",
      title: "4B.2.4(d): KTKK/SRSS için tüm gözönüne alınan modlarda βmn < 0.8 koşulu gerekir",
      content: phase3Lines(
        "TBDY 4B.2.4(d)'ye göre gözönüne alınan **tüm modlar için** `βmn < 0.8` koşulu sağlanıyorsa Denklem (4B.4)'teki TKB yerine Denklem (4B.6)'daki **Karelerin Toplamının Karekökü (KTKK)** kuralı kullanılabilir. Yazılımlarda bu yöntem genellikle **SRSS — Square Root of Sum of Squares** olarak adlandırılır.",
        "",
        "| Durum | Kullanılacak yaklaşım |",
        "|---|---|",
        "| Genel durum / korelasyon ihmal edilemiyor | TKB / CQC — Denklem (4B.4) |",
        "| Tüm dikkate alınan modlarda βmn < 0.8 koşulu sağlanıyor | KTKK / SRSS kullanılabilir — Denklem (4B.6) |",
        "",
        "> [!engineering] 'Modlar birbirinden uzak gibi' yeterli değildir",
        "> SRSS seçimi sezgisel değil, yönetmelikte verilen `βmn < 0.8` kapısının bütün dikkate alınan modlar için doğrulanmasına dayanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "yazilim-kontrolu",
      title: "Yazılımda CQC/SRSS seçimi kadar modal sönüm ve dahil edilen mod kümesini de raporlayın",
      content: phase3Lines(
        "Bir analiz raporunda yalnız 'CQC kullanıldı' veya 'SRSS seçildi' ifadesi yeterli iz bırakmaz. Kullanılan mod sayısı, modal kütle katılım yeterliliği, modal sönüm kabulü ve KTKK kullanılmışsa `βmn < 0.8` koşulunun nasıl doğrulandığı birlikte kaydedilmelidir.",
        "",
        "Ayrıca TBDY 4B.2.2, X ve Y deprem doğrultularında ayrı elde edilen en büyük davranış büyüklüklerine 4.4.2'ye göre **doğrultu birleştirmesi** uygulanacağını belirtir. Bu adım mod birleştirmeyle aynı işlem değildir.",
        "",
        "> [!warning] SRSŞ gibi bozuk terim kullanmayın",
        "> Doğru terimler yönetmelikte TKB ve KTKK'dır; yazılım karşılıkları parantez içinde CQC ve SRSS olarak verilebilir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Her cevap büyüklüğü için modal maksimumların eşzamanlı olmadığı dikkate alındı mı?",
        "- Genel kuralın TKB/CQC — Denklem (4B.4) olduğu doğru tanımlandı mı?",
        "- Çapraz korelasyon katsayısı ρmn ve `βmn = Tm/Tn` anlamı doğru mu?",
        "- Modal sönüm kabulü analiz modeliyle uyumlu mu?",
        "- KTKK/SRSS kullanılmışsa bütün dikkate alınan modlarda `βmn < 0.8` koşulu doğrulandı mı?",
        "- KTKK Denklem (4B.6) ile karelerin toplamının karekökü olarak uygulanıyor mu?",
        "- Dahil edilen mod sayısı ve modal kütle katılım kontrolü ayrıca yapıldı mı?",
        "- Mod birleştirme ile X/Y doğrultu birleştirmesi birbirine karıştırılmadı mı?",
        "- Rapor terminolojisinde TKB/CQC ve KTKK/SRSS doğru eşleştirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("EK 4B; Madde 4B.2.1–4B.2.5 ve Denklem (4B.3)–(4B.7)"),
  keywords: ["CQC", "SRSS", "TKB", "KTKK", "mod birleştirme", "4B.4", "4B.6", "TBDY 2018"],
  tags: ["TBDY 2018", "Modal Analiz", "CQC", "SRSS"],
};
