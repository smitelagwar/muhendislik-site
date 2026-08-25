import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KOLON_SARILMA: DepremPhase3Override = {
  slug: "tbdy-betonarme-kolon-sarilma-bolgeleri",
  description: "TBDY 2018 Madde 7.3.4'e göre kolon alt-üst sarılma bölgelerinin uzunluğunu, etriye/çiroz aralıklarını, minimum enine donatı miktarını ve temel içindeki devam koşullarını açıklar.",
  seoTitle: "TBDY Kolon Sarılma Bölgeleri | 7.3.4 Etriye Sıklaştırması",
  seoDescription: "Kolon sarılma boyu için ℓn/6, 1.5bmax ve 500 mm; etriye aralığı için bmin/3, 150 mm, 6ϕ ve 50 mm sınırlarıyla uygulama rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "sarilma-boyu",
      title: "7.3.4.1: sarılma bölgesi boyu üç alt sınırın en büyüğüdür",
      content: phase3Lines(
        "Süneklik düzeyi yüksek kolonların **alt ve üst uçlarında** özel sarılma bölgeleri oluşturulur. Uzunluk, alt uçta döşeme üst kotundan yukarıya; üst uçta ise kolona bağlanan yüksekliği en büyük kirişin alt yüzünden aşağıya doğru ölçülür.",
        "",
        "| Sarılma boyu alt sınırı | SOURCE_VALUE |",
        "|---|---:|",
        "| Kolon serbest yüksekliği | `ℓn / 6` |",
        "| Kolonun en büyük kesit boyutu | `1.5 bmax` |",
        "| Mutlak minimum | `500 mm` |",
        "",
        "Dolayısıyla proje sarılma boyu `ℓs ≥ max(ℓn/6, 1.5bmax, 500 mm)` mantığıyla seçilir. Bu ifade yönetmeliğin üç ayrı minimumunu tek bir kontrol mantığı altında göstermektedir.",
        "",
        "> [!warning] Kat yüksekliğinin sabit bir yüzdesi değildir",
        "> Sarılma boyunu yalnız `ℓn/6` alıp bırakmak yanlıştır. Büyük kolonlarda `1.5bmax`, kısa katlarda ise 500 mm koşulu belirleyici olabilir."
      ),
      subsections: [],
    },
    {
      id: "enine-donati-araligi",
      title: "Sarılma bölgesinde çap ve aralık sınırları birlikte sağlanır",
      content: phase3Lines(
        "7.3.4.1(a), sarılma bölgesindeki özel deprem etriyesi ve çiroz düzeni için hem alt hem üst sınırlar verir. Enine donatı çapı **ϕ8'den küçük olamaz**.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Etriye/çiroz aralığı üst sınırı 1 | `s ≤ bmin/3` |",
        "| Etriye/çiroz aralığı üst sınırı 2 | `s ≤ 150 mm` |",
        "| Etriye/çiroz aralığı üst sınırı 3 | `s ≤ 6ϕl,min` |",
        "| Aralık alt sınırı | `s ≥ 50 mm` |",
        "| Etriye kolu/çiroz yatay mesafesi | `a ≤ 25ϕe` |",
        "| Sürekli dairesel spiral adımı | `≤ göbek çapı/5` ve `≤ 80 mm` |",
        "",
        "> [!engineering] En küçük olan üst sınır belirleyicidir",
        "> Örneğin `bmin/3 = 133 mm`, `6ϕ = 120 mm` ve 150 mm sınırları birlikte varsa tasarım aralığı 120 mm'yi aşamaz; ayrıca 50 mm'den küçük seçilemez."
      ),
      subsections: [],
    },
    {
      id: "minimum-enine-donati",
      title: "Enine donatı miktarı eksenel basınç düzeyine göre değişir",
      content: phase3Lines(
        "Sarılma bölgesinde yalnız etriye aralığı kontrol edilmez; **toplam enine donatı alanı/hacimsel oranı** da 7.3.4.1(b)–(d) hükümlerine göre sağlanır. Etriyeli veya dairesel donatılı kolonda `Nd/(Ac fck) > 0.20` ise Denklem (7.1) veya (7.2)'deki minimumlar doğrudan uygulanır.",
        "",
        "`Nd/(Ac fck) ≤ 0.20` olduğunda ise Denklem (7.1) ve (7.2) ile bulunan enine donatıların **en az 2/3'ü** minimum enine donatı olarak kullanılacaktır.",
        "",
        "> [!warning] Aralık küçültmek tek başına yeterli olmayabilir",
        "> Seçilen etriye/çiroz çapı ve kol sayısı, gerekli `Ash` veya hacimsel oranı sağlamıyorsa yalnız `s` aralığını yönetmelik sınırlarında tutmak kesiti yeterli yapmaz."
      ),
      subsections: [],
    },
    {
      id: "temel-konsol-ozel-durumlar",
      title: "Temel içinde devam ve konsol kolon özel koşulları çizimde gösterilmelidir",
      content: phase3Lines(
        "Sarılma bölgesi enine donatısı, temelin içinde **kolonun minimum kesit boyutundan küçük olmayan bir yükseklik** boyunca devam ettirilir. Çanak temele oturan kolonda bu donatı çanak yüksekliği boyunca sürdürülür.",
        "",
        "Konsol kolonlarda sarılma bölgesi yalnız kolon alt ucunda oluşturulur ve uzunluğu kolonun büyük kesit boyutunun **iki katından küçük olamaz**.",
        "",
        "> [!check] Uygulama paftası",
        "> Temel üstünde biten sıklaştırma çizimi yönetmelik mantığına aykırıdır. Kolon düşey açılımında temel içindeki etriye devamı ve sarılma boyu ölçülendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "orta-bolge-ve-sinirli-suneklik",
      title: "Kolon orta bölgesi ve sınırlı sünek kolon aynı kurallara sahip değildir",
      content: phase3Lines(
        "7.3.4.2'ye göre orta bölge, alt ve üst sarılma bölgeleri arasında kalan kısımdır. Burada da enine donatı çapı `ϕ8`'den küçük olamaz; ancak aralık üst sınırı sarılma bölgesinden farklıdır.",
        "",
        "| Bölge/sistem | Aralık özeti |",
        "|---|---|",
        "| Yüksek sünek kolon sarılma bölgesi | `s ≤ min(bmin/3, 150 mm, 6ϕl,min)` ve `s ≥ 50 mm` |",
        "| Yüksek sünek kolon orta bölgesi | `s ≤ min(bmin/2, 200 mm)` |",
        "| Sınırlı sünek kolon sarılma bölgesi (7.7.4.1) | `s ≤ min(bmin/3, 8ϕl,min, 150 mm)` |",
        "",
        "Sınırlı sünek kolonlarda sarılma **uzunluğu** için 7.3.4.1 tanımı korunur; fakat enine donatı aralığı ve miktarı 7.7.4.1'e göre değiştirilir.",
        "",
        "> [!warning] 6ϕ ve 8ϕ'yi karıştırmayın",
        "> `6ϕ` yüksek sünek kolon sarılma bölgesi; `8ϕ` ise sınırlı sünek kolon sarılma bölgesi için kullanılan üst sınırlardan biridir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Alt ve üst kolon sarılma bölgeleri doğru başlangıç kotlarından ölçülmüş mü?",
        "- Sarılma boyu `max(ℓn/6, 1.5bmax, 500 mm)` alt sınırını sağlıyor mu?",
        "- Enine donatı çapı en az ϕ8 mi?",
        "- Yüksek sünek sarılma bölgesinde `s ≤ bmin/3`, `s ≤150 mm`, `s ≤6ϕl,min` ve `s ≥50 mm` birlikte sağlanıyor mu?",
        "- Etriye kolu/çiroz yatay mesafesi `25ϕe` sınırını aşıyor mu?",
        "- `Nd/(Ac fck)` düzeyine göre Denklem (7.1)/(7.2) enine donatı miktarı kontrol edilmiş mi?",
        "- Sarılma donatısı temel içinde gerekli yükseklik boyunca devam ediyor mu?",
        "- Konsol kolonda alt uç sarılma boyu en az `2bmax` mı?",
        "- Orta bölge aralığı `min(bmin/2, 200 mm)` koşulunu sağlıyor mu?",
        "- Sistem sınırlı sünekse 7.7.4.1'deki `8ϕ` ve enine donatı miktarı farkı uygulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.4, Şekil 7.3 ve Madde 7.7.4"),
  keywords: ["TBDY 2018", "kolon sarılma", "etriye sıklaştırma", "çiroz", "7.3.4", "500 mm", "6ϕ", "8ϕ", "bmin/3"],
  tags: ["TBDY 2018", "Betonarme", "Kolon", "Sarılma Bölgesi", "Enine Donatı"],
};
