import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DEPREM_DERZI: DepremPhase3Override = {
  slug: "tbdy-deprem-derzi-hesabi",
  description: "TBDY 2018 Madde 4.9.3'e göre komşu bina veya bloklar arasındaki deprem derzi boşluğunu; göreli yerdeğiştirme temelli alt sınır, 30 mm + yükseklik artışı kuralı ve kat kotu uyumsuzluğu üzerinden açıklar.",
  seoTitle: "TBDY Deprem Derzi Hesabı | Madde 4.9.3 ve Minimum Derz",
  seoDescription: "Komşu blok yerdeğiştirmeleri, α=0.25(R/I) ve 0.5(R/I), 30 mm minimum derz, kat kotu farkı ve blok bağımsızlığı için TBDY 4.9.3 rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "iki-alt-sinir",
      title: "Deprem derzini iki ayrı alt sınırdan kontrol edin",
      content: phase3Lines(
        "TBDY 4.9.3'te deprem derzi tek bir sabit santimetre değeri değildir. Her kat için 4.9.3.1'deki **komşu blok yerdeğiştirmelerine bağlı dinamik alt sınır** ile 4.9.3.2'deki **yüksekliğe bağlı geometrik minimum** ayrı ayrı bulunur; daha elverişsiz olan değer esas alınır.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> 1) Komşu blokların azaltılmış kat yerdeğiştirmelerini aynı seviyelerde çıkarın. 2) Kat döşeme kotları aynı mı farklı mı belirleyin. 3) Uygun α katsayısı ile kareler toplamının karekökünü çarpın. 4) 30 mm + yükseklik artışı minimumunu ayrıca hesaplayın. 5) Her katta büyük olan gereksinimi sağlayın ve derzin mimari/tesisat detaylarında kapanmadığını kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "dinamik-alt-sinir",
      title: "4.9.3.1: komşu blokların yerdeğiştirmeleri birlikte hesaba katılır",
      content: phase3Lines(
        "Her bir kat için derz boşluğunun dinamik alt sınırı, komşu blok veya binalarda elde edilen yerdeğiştirmelerin karelerinin toplamının karekökü ile **α katsayısının çarpımından** az olamaz. Kullanılan kat yerdeğiştirmeleri, kolon veya perdelerin bağlandığı düğümlerde hesaplanan azaltılmış `ui(X)` yerdeğiştirmelerinin kat içindeki ortalamalarıdır.",
        "",
        "`d_dyn = α × √(u_1² + u_2²)`",
        "",
        "| Komşu kat döşemelerinin durumu | α katsayısı — SOURCE_VALUE |",
        "|---|---:|",
        "| Bütün katlarda aynı seviyede | `α = 0.25 (R/I)` |",
        "| Bazı katlarda bile farklı seviyede | tüm bina için `α = 0.5 (R/I)` |",
        "",
        "Mevcut eski bina için hesap yapılamıyorsa, yönetmelik eski binanın yerdeğiştirmesinin yeni bina için aynı katta hesaplanan değerden **daha küçük alınmasına izin vermez**.",
        "",
        "> [!warning] Tek blok ötelenmesi yeterli değildir",
        "> Derz, yalnız yeni binanın maksimum ötelemesine bakılarak seçilmez. Komşu iki yapının hareket olasılığı birlikte değerlendirilir; kat kotları uyuşmuyorsa α katsayısı iki katına çıkar."
      ),
      subsections: [],
    },
    {
      id: "geometrik-minimum",
      title: "4.9.3.2: 30 mm başlangıç ve yükseklik artışı",
      content: phase3Lines(
        "Dinamik hesap küçük sonuç verse bile bırakılacak derz boşluğunun ayrıca geometrik bir alt sınırı vardır.",
        "",
        "| Bina yüksekliği | Minimum derz boşluğu |",
        "|---:|---:|",
        "| 6 m'ye kadar | en az 30 mm |",
        "| 6 m'den sonraki her 3 m'lik yükseklik | 30 mm değerine en az 10 mm eklenir |",
        "",
        "**Örnek:** 12 m yüksekliğe kadar kuralın tam 3 m artışları dikkate alındığında geometrik minimum `30 + 2×10 = 50 mm` olur.",
        "",
        "> [!check] Karar",
        "> 4.9.3.1 ile bulunan dinamik gereksinim 50 mm'den büyükse dinamik değer; küçükse 4.9.3.2 minimumu belirleyici olur. Derz genişliği her iki denetimi aynı anda sağlamalıdır."
      ),
      subsections: [],
    },
    {
      id: "cozumlu-ornek",
      title: "Çözümlü örnek: aynı kotlu ve farklı kotlu komşu blok",
      content: phase3Lines(
        "**ASSUMPTION:** Aynı kattaki azaltılmış ortalama yerdeğiştirmeler `u1 = 18 mm` ve `u2 = 24 mm`, yeni blok için `R = 8`, `I = 1` ve bina yüksekliği 12 m olsun. `√(18² + 24²) = 30 mm` bulunur.",
        "",
        "1. Kat döşemeleri tüm katlarda aynı seviyede ise `α = 0.25×8 = 2.0`; dinamik alt sınır `2.0×30 = 60 mm`.",
        "2. 12 m için geometrik minimum `50 mm` olduğundan **60 mm** belirleyicidir.",
        "3. Kat döşemeleri bazı katlarda farklı seviyede olsaydı `α = 0.5×8 = 4.0`; dinamik alt sınır **120 mm** olurdu.",
        "",
        "> [!engineering] Örnek sınırı",
        "> 18 mm, 24 mm, R=8 ve 12 m değerleri ASSUMPTION'dır. α katsayıları ve geometrik minimumlar SOURCE_VALUE'dır. Gerçek projede R/I ve her kattaki azaltılmış yerdeğiştirmeler ilgili bina modelinden alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "detay-ve-sureklilik",
      title: "Derz yalnız hesap değeri değil, üç boyutlu bir süreklilik detayıdır",
      content: phase3Lines(
        "Madde 4.9.3.3 bina blokları arasındaki derzin, deprem sırasında blokların **bütün doğrultularda birbirinden bağımsız çalışmasına** olanak verecek şekilde düzenlenmesini ister. Cephe, parapet, kaplama, tesisat geçişi veya mimari köprüleme detayı hesapta bırakılan boşluğu fiilen kilitlememelidir.",
        "",
        "4.9.3.4 ayrıca ayrık blokların köprü benzeri bir elemanla bağlanması halinde hareketli mesnedin iki doğrultu ve yöndeki yerdeğiştirme kapasitesini özel olarak sınırlar: kapasite, bağlantı seviyesindeki iki blok yerdeğiştirmelerinin mutlak değerleri toplamının en az **1.5(R/I)** katı olmalıdır.",
        "",
        "| Detay kontrolü | Risk |",
        "|---|---|",
        "| Derz boyunca dolgu/harç ile kapatma | Blokların bağımsız hareketi engellenir |",
        "| Kat kotlarının çakışmaması | Döşeme kenarı komşu kolona çarpabilir; α büyür |",
        "| Cephe ve tesisat geçişleri | Derzde istenmeyen mekanik bağ oluşabilir |",
        "| Köprü/hareketli mesnet | Yetersiz hareket kapasitesi bağlantı elemanını zorlayabilir |",
        "",
        "> [!regulation] Kapsam ayrımı",
        "> 4.9.3 hükümleri farklı zemin oturmaları, temel öteleme/dönmeleri ve sıcaklık değişimlerinden doğan derz gereksinimlerinden **ayrı olarak**, yalnız deprem etkisi için bırakılacak boşlukları tanımlar."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Komşu blokların her kattaki azaltılmış ortalama yerdeğiştirmeleri çıkarıldı mı?",
        "- Kat döşemeleri bütün katlarda aynı seviyede mi, bazı katlarda farklı mı?",
        "- Aynı kotta α = 0.25(R/I), farklı kotta α = 0.5(R/I) doğru uygulandı mı?",
        "- Mevcut eski bina hesaplanamıyorsa yerdeğiştirmesi yeni binadan küçük alınmadı mı?",
        "- Dinamik alt sınır her kat için hesaplandı mı?",
        "- 6 m'ye kadar 30 mm ve sonraki her 3 m için +10 mm minimumu ayrıca kontrol edildi mi?",
        "- Nihai derz boşluğu iki alt sınırın elverişsiz olanını sağlıyor mu?",
        "- Derz bütün doğrultularda blokların bağımsız çalışmasına izin veriyor mu?",
        "- Cephe, parapet, kaplama ve tesisat detayları boşluğu kilitliyor mu?",
        "- Köprü/hareketli mesnet varsa 4.9.3.4 yerdeğiştirme kapasitesi ayrıca doğrulandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.9.3.1–4.9.3.4 — Deprem Derzleri"),
  keywords: ["TBDY 2018", "deprem derzi", "4.9.3", "çarpışma", "pounding", "R/I", "30 mm", "kat yerdeğiştirmesi", "blok derzi"],
  tags: ["TBDY 2018", "Deprem Derzi", "Yerdeğiştirme", "Detaylandırma"],
};
