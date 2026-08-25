import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KIRIS_KAPASITE_KESME: DepremPhase3Override = {
  slug: "tbdy-betonarme-kiris-kapasite-kesme",
  description: "TBDY 2018 Madde 7.4.5'e göre kiriş kesme tasarım kuvvetinin uç moment kapasiteleri ve düşey yük kesmesiyle belirlenmesini, dayanım üst sınırlarını ve Vc=0 koşulunu açıklar.",
  seoTitle: "TBDY Kiriş Kapasite Kesmesi | Denklem 7.9 ve 7.10",
  seoDescription: "Ve=Vdy±(Mpi+Mpj)/ℓn, Ve≤Vr, Ve≤0.85bw d√fck ve sarılma bölgesinde Vc=0 koşullarının mühendislik kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "kapasite-tasarimi-mantigi",
      title: "7.4.5: Kesme hesabı yalnız analizden okunan Vd ile bitmez",
      content: phase3Lines(
        "Süneklik düzeyi yüksek kirişlerde amaç, gevrek kesme kırılmasından önce uç bölgelerde sünek eğilme davranışının gelişebilmesidir. Bu nedenle TBDY 7.4.5, enine donatı hesabına esas `Ve` kesme kuvvetini olası uç moment kapasiteleri ile kurar.",
        "",
        "| Tasarım adımı | Yönetmelik karşılığı |",
        "|---|---|",
        "| Düşey yük kesmesi | Vdy |",
        "| Kiriş uç moment kapasiteleri | Mpi, Mpj |",
        "| Net açıklık | ℓn |",
        "| Kapasite esaslı kesme | Denklem (7.9) |",
        "| Kesme dayanım sınırları | Denklem (7.10) |",
        "",
        "> [!engineering] İki deprem yönü",
        "> Denklem (7.9), depremin soldan sağa ve sağdan sola etkimesi için ayrı ayrı ve elverişsiz sonucu verecek işaretlerle uygulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-9",
      title: "Denklem 7.9: Düşey yük kesmesine uç kapasite kesmesini doğru işaretle ekleyin",
      content: phase3Lines(
        "Kirişin i ve j uçlarındaki moment kapasitelerinin aynı deprem yönünde oluşturduğu kesme etkisi, net açıklığa bölünerek düşey yük kesmesiyle birleştirilir.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.9) — kiriş kapasite kesmesi",
        "V_e = V_dy ± (M_pi + M_pj) / ℓ_n",
        "@symbol: V_e | Enine donatı hesabına esas kesme kuvveti | kN",
        "@symbol: V_dy | Depremsiz durumda düşey yüklerden oluşan basit kiriş kesme kuvveti | kN",
        "@symbol: M_pi | i ucundaki olası moment kapasitesi | kN·m",
        "@symbol: M_pj | j ucundaki olası moment kapasitesi | kN·m",
        "@symbol: ℓ_n | Kirişin kolon yüzleri arasındaki net açıklığı | m",
        "```",
        "",
        "TBDY, uç moment kapasitelerinin yaklaşık olarak `Mpi ≈ 1.4Mri` ve `Mpj ≈ 1.4Mrj` alınabileceğini belirtir. Bu yaklaşım, kapasite tasarımının yalnız elastik analiz momentlerini kopyalamadığını gösterir."
      ),
      subsections: [],
    },
    {
      id: "d-ile-artirilmis-kesme",
      title: "D ile artırılmış deprem kesmesi daha küçükse 7.4.5.1 özel üst sınırı devreye girer",
      content: phase3Lines(
        "7.4.5.1'e göre, düşey yüklerle birlikte depremden hesaplanan ve dayanım fazlalığı katsayısı `D` ile artırılmış kesme kuvvetlerinin toplamı Denklem (7.9) ile bulunan `Ve` değerinden **daha küçükse**, enine donatı hesabında `Ve` yerine bu daha küçük artırılmış kesme değeri kullanılır.",
        "",
        "> [!warning] Maksimumu körlemesine almak doğru değildir",
        "> Yönetmelikteki bu özel hüküm nedeniyle kapasite denkleminden çıkan değer ile D ile artırılmış analiz kesmesi karşılaştırılmalıdır. Yazılımın hangi değeri kullandığı rapordan doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-10",
      title: "Denklem 7.10 iki ayrı kesme dayanım kapısı getirir",
      content: phase3Lines(
        "7.4.5.2'ye göre belirlenen `Ve`, hem TS 500'e göre hesaplanan kesme dayanımını hem de beton basınç dayanımına bağlı yönetmelik üst sınırını sağlamalıdır:",
        "",
        "`Ve ≤ Vr`",
        "",
        "`Ve ≤ 0.85 bw d √fck`",
        "",
        "İkinci sınır sağlanmıyorsa yalnız etriye miktarını artırmak çözüm değildir; TBDY kesit boyutlarının gerektiği kadar büyütülerek deprem hesabının tekrarlanmasını ister.",
        "",
        "> [!engineering] Gevrek kırılma sınırı",
        "> Bu kontrol, kesme dayanımını sınırsız biçimde enine donatıyla büyütme yaklaşımını engeller."
      ),
      subsections: [],
    },
    {
      id: "vc-sifir-kosulu",
      title: "Sarılma bölgesinde bazı durumlarda betonun kesme katkısı Vc=0 alınır",
      content: phase3Lines(
        "7.4.5.3'e göre kiriş enine donatısı hesabında betonun kesme dayanımına katkısı `Vc` genel olarak TS 500'e göre belirlenir. Ancak 7.4.4'teki kiriş sarılma bölgelerinde, **yalnız deprem yüklerinden oluşan kesme kuvveti depremli durumdaki toplam kesme kuvvetinin yarısından büyükse** beton katkısı `Vc = 0` alınır.",
        "",
        "Ayrıca çerçeve kirişlerinde pilyelerin kesme dayanımına katkısı hesaba katılmaz.",
        "",
        "> [!check] Kritik bölge kontrolü",
        "> `Vc=0` koşulu tüm kiriş boyunca otomatik uygulanacak genel bir kural değildir; sarılma bölgesi ve deprem kesmesinin toplam kesmedeki payı birlikte kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Depremin iki yönü için Denklem (7.9) ayrı ayrı kurulmuş mu?",
        "- Vdy düşey yüklerden elde edilen basit kiriş kesmesi olarak doğru işaretle kullanılmış mı?",
        "- Mpi ve Mpj kapasite momentleri elastik analiz momentleriyle karıştırılmamış mı?",
        "- Net açıklık ℓn kolon yüzleri arasında alınmış mı?",
        "- Denklem (7.9) sonucu D ile artırılmış kesme toplamıyla karşılaştırılmış mı?",
        "- Ve ≤ Vr koşulu sağlanıyor mu?",
        "- Ve ≤ 0.85 bw d √fck üst sınırı sağlanıyor mu?",
        "- Sarılma bölgesinde deprem kesmesi toplamın yarısından büyükse Vc=0 alınmış mı?",
        "- Çerçeve kirişlerinde pilye katkısı kesme dayanımına eklenmemiş mi?",
        "- Belirleyici Ve'ye göre etriye hesabı ve 7.4.4 detaylandırması birlikte tamamlanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.4.5, Denklem (7.9) ve (7.10)"),
  keywords: ["TBDY 2018", "kiriş kesme", "kapasite tasarımı", "Ve", "Vdy", "Mpi", "Mpj", "Vc=0", "7.4.5"],
  tags: ["TBDY 2018", "Betonarme", "Kiriş", "Kesme", "Kapasite Tasarımı"],
};