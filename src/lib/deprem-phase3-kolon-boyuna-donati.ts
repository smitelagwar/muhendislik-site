import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KOLON_BOYUNA_DONATI: DepremPhase3Override = {
  slug: "tbdy-betonarme-kolon-boyuna-donati-duzeni",
  description: "TBDY 2018 Madde 7.3.2–7.3.3'e göre kolon boyuna donatı oranı, minimum çap, dairesel kolon çubuk sayısı, bindirme kesiti %6 sınırı, katlar arası kesit değişimi ve üst uç kenetlenmesini açıklar.",
  seoTitle: "TBDY Kolon Boyuna Donatı Düzeni | %1–%4, ϕ14 ve Süreklilik",
  seoDescription: "Kolonlarda %1–%4 boyuna donatı, minimum ϕ14, dairesel kolonda en az 6 çubuk, bindirmede %6, 1/6 eğim ve üst kat kenetlenme kuralları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "donati-orani",
      title: "7.3.2.1: kolon boyuna donatısı brüt kesitin %1–%4 aralığında kalır",
      content: phase3Lines(
        "Süneklik düzeyi yüksek kolonlarda toplam boyuna donatı alanı `Ast`, brüt kesit alanı `Ac` üzerinden **%1'den az ve %4'ten fazla olamaz**. Bu iki sınır yalnız hesap sonucunda gereken çelik alanını değil, seçilecek kesitin uygulanabilirliğini de etkiler.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Minimum toplam boyuna donatı oranı | Ast/Ac ≥ %1 |",
        "| Maksimum toplam boyuna donatı oranı | Ast/Ac ≤ %4 |",
        "| Minimum boyuna çubuk çapı | ϕ14 |",
        "| Dairesel kolonda minimum çubuk sayısı | 6 |",
        "",
        "> [!warning] “Gereken donatı %0.7 çıktı” diye %0.7 uygulanamaz",
        "> Analiz/tasarımın gerektirdiği çelik alanı minimum yönetmelik oranının altındaysa kolon yine en az %1 boyuna donatıyla detaylandırılır."
      ),
      subsections: [],
    },
    {
      id: "bindirme-kesiti-yogunlugu",
      title: "Bindirme ekinin bulunduğu kesitte toplam oran için ayrı %6 tavanı vardır",
      content: phase3Lines(
        "7.3.2.2, bindirmeli ek yapılan kesitlerde **toplam boyuna donatı oranını %6 ile sınırlar**. Bu sınır, normal kolon kesitindeki %4 maksimumundan farklıdır; bindirme bölgesinde aynı çubukların üst üste gelmesi nedeniyle oluşan yerel donatı yoğunluğunu kontrol eder.",
        "",
        "> [!engineering] İki oranı karıştırmayın",
        "> Kolonun esas boyuna donatı oranı %4'ü geçemez. Bindirme ek kesitinde, bindirilen çubukların birlikte oluşturduğu toplam oran ayrıca %6'yı geçemez. Ek konumu ve enine donatı koşulları 7.3.3.1'den ayrıca kontrol edilir."
      ),
      subsections: [],
    },
    {
      id: "katlar-arasi-kesit-degisimi",
      title: "Kolon kesiti katlar arasında değişiyorsa boyuna çubuğun eğimi 1/6'yı aşamaz",
      content: phase3Lines(
        "7.3.3.2, katlar arasında kolon kesiti değiştiğinde boyuna donatının kolon-kiriş birleşim bölgesi içindeki düşeye göre eğimini **1/6 ile sınırlar**. Daha büyük geometrik kaçıklığı bir düğüm içinde zorla eğerek çözmek yönetmelik detayı değildir.",
        "",
        "| Durum | Detay kararı |",
        "|---|---|",
        "| Donatı eğimi ≤ 1/6 | birleşim içinde kontrollü devam mümkündür |",
        "| Gerekli eğim > 1/6 | alttaki kolon donatısı uygun şekilde kenetlenir; üst kolon için ayrı filiz/donatı düzeni çözülür |",
        "| En üst kat kolonu | alttaki kolon donatısının üstteki düğüm/kiriş içinde kenetlenmesi gerekir |",
        "",
        "> [!warning] Aks kaçıklığını donatıda keskin kırıkla çözmeyin",
        "> Taşıyıcı geometri değişikliği, hem donatı sürekliliği hem birleşim kuvvet aktarımı açısından proje paftasında açık bir detayla gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "ust-uc-kenetlenme",
      title: "Kesit değişimi büyükse veya üst katta kolon bitiyorsa 1.5ℓb ve 40ϕ alt sınırlarını kontrol edin",
      content: phase3Lines(
        "7.3.3.2'nin devamında, kesit değişimi nedeniyle boyuna donatının doğrudan devam ettirilemediği veya en üst kat kolonunda sona erdiği durumda alttaki kolon donatısının karşı taraftaki kiriş içinde kenetlenme boyu **TS 500 çekme donatısı kenetlenme boyunun 1.5 katından ve 40ϕ'den kısa olamaz**.",
        "",
        "Karşı tarafta kiriş yoksa kenetlenme gerekirse kolonun karşı yüzünde aşağı doğru kıvrılarak sağlanabilir. 90° yatay kancanın veya aşağı kıvrılan düşey kancanın boyu **en az 12ϕ** olmalıdır.",
        "",
        "> [!check] Tasarım sırası",
        "> `max(1.5ℓb, 40ϕ)` şartını önce boyuna çubuk için kontrol edin; kanca gerekiyorsa 12ϕ kanca boyunu ayrıca sağlayın. Bu değerler birbirinin alternatifi değildir."
      ),
      subsections: [],
    },
    {
      id: "sinirli-suneklik-ve-uygulama",
      title: "Sınırlı sünek kolonlarda boyuna donatı koşulları değişmez",
      content: phase3Lines(
        "TBDY 7.7.2, süneklik düzeyi sınırlı kolonlarda boyuna donatı için 7.3.2 koşullarını; 7.7.3 ise boyuna donatının düzenlenmesi için 7.3.3 koşullarını aynen geçerli kılar.",
        "",
        "Bu nedenle `%1–%4`, minimum `ϕ14`, dairesel kolonda en az 6 çubuk, bindirme kesitinde `%6`, kesit değişiminde `1/6`, gerektiğinde `1.5ℓb`, `40ϕ` ve `12ϕ` gibi hükümler yalnız yüksek sünek kolonlara özgü bir detay listesi olarak okunmamalıdır.",
        "",
        "> [!engineering] Pafta kontrolü",
        "> Katlar arası kolon donatı aplikasyonunda çubuk adedi/çapı değişiyorsa hangi çubuğun devam ettiği, hangisinin sonlandığı ve yeni çubuğun nereden başladığı sadece metin notuyla değil detay çizimiyle izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Ast/Ac oranı her kolonda en az %1 ve en fazla %4 mü?",
        "- Boyuna çubuk çapları ϕ14'ten küçük değil mi?",
        "- Dairesel kolonda en az 6 boyuna çubuk var mı?",
        "- Bindirmeli ek yapılan kesitte toplam boyuna donatı oranı %6'yı aşmıyor mu?",
        "- Bindirme ekinin konumu ve etriye düzeni 7.3.3.1'e uygun mu?",
        "- Katlar arası kesit değişiminde boyuna donatı eğimi 1/6'yı aşmıyor mu?",
        "- Eğim >1/6 veya üst kat sonlanması varsa alttaki donatının kenetlenmesi ayrı çözülmüş mü?",
        "- Kiriş içindeki kenetlenme boyu en az max(1.5ℓb,40ϕ) mi?",
        "- Kanca gereken durumda yatay/düşey kanca boyu en az 12ϕ mi?",
        "- Sınırlı sünek kolonlarda da 7.3.2 ve 7.3.3 hükümleri aynen uygulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.2–7.3.3 ve 7.7.2–7.7.3, Şekil 7.2"),
  keywords: ["TBDY 2018", "kolon boyuna donatı", "%1", "%4", "%6", "ϕ14", "1/6", "1.5ℓb", "40ϕ", "12ϕ"],
  tags: ["TBDY 2018", "Betonarme", "Kolon", "Boyuna Donatı", "Detaylandırma"],
};
