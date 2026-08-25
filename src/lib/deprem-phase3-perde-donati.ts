import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_PERDE_DONATI: DepremPhase3Override = {
  slug: "tbdy-betonarme-perde-govde-uc-donati",
  description: "TBDY 2018 Madde 7.6.3–7.6.5'e göre perde gövdesindeki yatay-düşey donatı oranlarını, iki yüz donatı ağlarının bağlanmasını, yatay donatı eklerini ve uç bölgesi sargı koşullarını açıklar.",
  seoTitle: "TBDY Perde Gövde ve Uç Bölgesi Donatısı | 7.6.3–7.6.5",
  seoDescription: "0.0025 gövde donatısı, 250 mm aralık, kritik bölgede 10 çiroz/m², uç bölgede 0.002/0.001 düşey donatı ve sargı koşullarının kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "govde-minimum-donati",
      title: "7.6.3.1: Yatay ve düşey gövde donatısı ayrı ayrı en az 0.0025'tir",
      content: phase3Lines(
        "Perdenin iki yüzündeki gövde donatılarının toplam enkesit alanı, boyuna ve enine donatıların **her biri için ayrı ayrı**, perde uç bölgeleri arasında kalan brüt gövde alanının `0.0025`'inden az olamaz. `Hw/ℓw ≤ 2.0` ise gövde bölgesi perdenin tüm kesiti olarak dikkate alınır.",
        "",
        "| Gövde kontrolü | SOURCE_VALUE |",
        "|---|---:|",
        "| Toplam düşey gövde donatısı oranı | ≥ 0.0025 |",
        "| Toplam yatay gövde donatısı oranı | ≥ 0.0025 |",
        "| Yatay ve düşey donatı aralığı | ≤ 250 mm |",
        "| 7.6.1.3 / Denklem (7.14) özel koşullarında oran | ≥ 0.002 |",
        "| Aynı özel durumda donatı aralığı | ≤ 300 mm |",
        "",
        "7.6.3.2'deki `0.002` ve `300 mm` değerleri yalnız 7.6.1.3'te Denklem (7.14)'ün iki koşulunun da sağlandığı binalar için geçerlidir.",
        "",
        "> [!warning] Toplam perde donatı oranı yeterli bir kontrol değildir",
        "> Düşey ve yatay gövde donatısını birbirine ekleyip tek bir oranla değerlendirmeyin. Yönetmelik iki doğrultuyu bağımsız sınırlar."
      ),
      subsections: [],
    },
    {
      id: "iki-yuz-aglarin-baglanmasi",
      title: "İki yüz donatı ağı özel deprem çirozlarıyla karşılıklı bağlanır",
      content: phase3Lines(
        "7.6.3.3'e göre uç bölgeleri dışında, perdenin iki yüzündeki donatı ağları her bir metrekare perde yüzünde **en az 4 adet özel deprem çirozu** ile karşılıklı bağlanır. 7.6.2.2'de tanımlanan kritik perde yüksekliği boyunca, uç bölgeleri dışındaki her bir metrekare perde yüzünde bu sayı **en az 10 adet** olur.",
        "",
        "Çiroz çapı en az yatay gövde donatısı çapı kadar olmalıdır. Yönetmelik, çiroz sayısının `ϕgövde/ϕçiroz` oranında artırılması halinde daha küçük çap kullanımına izin verir.",
        "",
        "> [!check] Metrekare başına adet kontrolü",
        "> Çirozları yalnız tipik bir kesitte çizmek yerine Hcr içi ve Hcr dışı bölgelerde gerçek yerleşim yoğunluğunun 4 adet/m² ve 10 adet/m² koşullarını sağladığını pafta üzerinden doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "yatay-donati-kenetlenme-ek",
      title: "7.6.4: Yatay gövde donatısının uç bölgesinde kenetlenmesi ve bindirmesi ayrıca detaylandırılır",
      content: phase3Lines(
        "Yatay gövde donatısı perde uç bölgesinde kenetlenmelidir. Uç bölgesi sargısı kapalı etriye ve çirozlardan oluşur; uçları boyuna donatıya `135°` kancalı bağlanan yatay gövde donatıları da sargı donatısı olarak kullanılabilir.",
        "",
        "Yatay gövde donatısının uç bölgesinde kenetlenmesi için yatay veya düşey `90°` gönye yapılabilir. Yatay donatı ucu veya gönye ile perde dış kenarı arasındaki mesafe `150 mm`'den büyük olamaz.",
        "",
        "Perde gövdesinde yatay donatı bindirmesi gerekiyorsa ekler perde boyunca şaşırtılır ve bindirme boyu `1.5ℓb`'den küçük olmaz. Bindirmedeki yatay donatıların uçlarında `90°` kancalar oluşturulur.",
        "",
        "Kanca kullanılmıyorsa yatay gövde donatıları boyuna donatıların iç tarafında kalacak şekilde kapalı düzenlenir; bindirme boyunca en az **6 adet düşey gövde donatısı** bulunur ve bu bölgedeki düşey gövde donatılarının yatay aralığı `200 mm`'yi aşmaz.",
        "",
        "> [!warning] Ek boyu tek başına yeterli değildir",
        "> `1.5ℓb` sağlansa bile eklerin şaşırtılması, uç kancaları veya kancasız çözümün kapalı düzen + 6 düşey çubuk + 200 mm koşulları ayrıca kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "uc-bolgesi-boyuna-donati",
      title: "7.6.5.1: Uç bölgesi düşey donatısı Hcr içinde ve dışında farklı minimumlara sahiptir",
      content: phase3Lines(
        "Kritik perde yüksekliği boyunca her bir uç bölgesindeki toplam düşey donatının perde brüt enkesit alanına oranı en az `0.002`; Hcr dışında ise en az `0.001` olmalıdır. Uç bölgesi geometri ve donatısındaki geçiş **üç kat boyunca kademeli** yapılır.",
        "",
        "| Uç bölgesi boyuna donatısı | Sınır |",
        "|---|---:|",
        "| Hcr boyunca minimum oran | ≥ 0.002 |",
        "| Hcr dışında minimum oran | ≥ 0.001 |",
        "| Her bir uç bölgesindeki minimum boyuna donatı | ≥ 4ϕ14 |",
        "| Uç bölgesi boyuna donatı oranı | ≤ 0.03 |",
        "| Bindirme bölgesindeki üst sınır | ≤ 0.06 |",
        "",
        "> [!engineering] Geçişi tek katta kesmeyin",
        "> Hcr sonunda uç bölgesi ölçüsü veya donatı miktarı azalacaksa 7.6.5.1'in üç kat boyunca kademeli geçiş koşulu paftada izlenebilmelidir."
      ),
      subsections: [],
    },
    {
      id: "uc-bolgesi-enine-donati",
      title: "7.6.5.2: Uç bölgesi sargısında çap, kol mesafesi ve düşey aralık birlikte sınırlandırılır",
      content: phase3Lines(
        "Uç bölgelerinde kullanılacak enine donatı çapı `8 mm`'den küçük olamaz. Etriye kolları ve/veya çirozlar arasındaki yatay mesafe `a`, etriye ve çiroz çapının `25` katından fazla olamaz.",
        "",
        "Kritik perde yüksekliği boyunca uç bölgelerindeki enine donatı miktarı, kolon sarılma bölgeleri için 7.3.4.1'de Denklem (7.1)'in ikinci koşuluyla belirlenen miktarın en az `2/3`'ü olmalıdır. Düşey doğrultuda etriye/çiroz aralığı `50 mm`'den küçük, `150 mm`'den büyük alınamaz; ayrıca boyuna donatı çapının `6` katını ve perde kalınlığının `1/3`'ünü aşamaz.",
        "",
        "Bu enine donatılar temel içinde, `300 mm`'den ve perde kalınlığından küçük olmayan bir yükseklik boyunca devam ettirilir. Hcr dışındaki uç bölgelerinde düşey etriye/çiroz aralığı perde kalınlığından ve `200 mm`'den büyük alınamaz.",
        "",
        "> [!check] Birden fazla üst sınır",
        "> Hcr içindeki sargı aralığında yalnız 150 mm'ye bakmayın; `6ϕl` ve `bw/3` sınırları daha küçük değer verebilir."
      ),
      subsections: [],
    },
    {
      id: "pafta-uygulama-kontrolu",
      title: "Pafta ve saha kontrolü: gövde ağı ile uç bölgesi sargısı tek detayda okunmalıdır",
      content: phase3Lines(
        "Perde donatısı, 'iki yüzde düşey + yatay hasır' ve 'uçta yoğun donatı' gibi genel notlarla bırakılmamalıdır. Hcr sınırı, uç bölgesi uzunluğu, gövde donatısı aralıkları, çiroz yoğunluğu ve uç bölgesi sargı aralıkları aynı geometri üzerinde ilişkilendirilebilmelidir.",
        "",
        "Yatay gövde çubuklarının uç bölgesine girişi ve kenetlenmesi, bindirme eklerinin şaşırtılması ve temel içindeki uç bölgesi sargı devamı özellikle kesit/görünüş detayında gösterilmelidir.",
        "",
        "> [!warning] Donatı çakışması",
        "> Uç bölgesindeki boyuna çubuk, kapalı etriye, çiroz ve yatay gövde donatısının kenetlenmesi yoğun bir donatı paketi oluşturabilir. Proje yeterliliği kadar beton yerleşebilirliği ve uygulanabilirlik de detay aşamasında kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Düşey ve yatay gövde donatısı oranları ayrı ayrı en az 0.0025 mi?",
        "- Gövde donatı aralıkları 250 mm'yi aşmıyor mu?",
        "- 0.002 / 300 mm özel hükmü kullanılıyorsa 7.6.1.3 Denklem (7.14) koşulları belgeli mi?",
        "- Hcr dışında iki yüz ağları en az 4 adet özel deprem çirozu/m² ile bağlanmış mı?",
        "- Hcr boyunca gövdede en az 10 adet özel deprem çirozu/m² sağlanıyor mu?",
        "- Yatay gövde donatısı uç bölgelerinde doğru kanca/gönye ile ve 150 mm kenar mesafesi sınırıyla kenetleniyor mu?",
        "- Yatay donatı bindirmeleri şaşırtılmış ve en az 1.5ℓb mi?",
        "- Kancasız bindirmede en az 6 düşey gövde çubuğu ve en çok 200 mm yatay aralık sağlanıyor mu?",
        "- Uç bölgesi düşey donatısı Hcr içinde ≥0.002, dışında ≥0.001 ve her uçta en az 4ϕ14 mü?",
        "- Uç bölgesi boyuna oranı 0.03'ü, bindirme bölgesinde 0.06'yı aşmıyor mu?",
        "- Hcr içinde enine donatı çapı ≥8 mm ve düşey aralık 50–150 mm aralığında; ayrıca ≤6ϕl ve ≤bw/3 mü?",
        "- Uç bölgesi sargısı temel içinde en az max(300 mm, bw) kadar devam ediyor mu?",
        "- Hcr dışında sargı aralığı ≤min(bw, 200 mm) koşulunu sağlıyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.6.3.1–7.6.5.2 ve Şekil 7.11"),
  keywords: ["TBDY 2018", "perde gövde donatısı", "perde uç bölgesi", "çiroz", "0.0025", "4ϕ14", "7.6.3", "7.6.5"],
  tags: ["TBDY 2018", "Betonarme", "Perde", "Donatı", "Uç Bölgesi", "Detaylandırma"],
};
