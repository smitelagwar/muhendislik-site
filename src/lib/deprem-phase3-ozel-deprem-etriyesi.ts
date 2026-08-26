import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_OZEL_DEPREM_ETRIYESI: DepremPhase3Override = {
  slug: "tbdy-betonarme-ozel-deprem-etriyesi-ciroz",
  description: "TBDY 2018 Madde 7.2.8'e göre özel deprem etriyesi ve özel deprem çirozunun nerede zorunlu olduğunu; 135°/90° kanca, 5ϕ iç büküm, 6ϕ ve 80 mm uç boyu ile çiroz bağlama kurallarını açıklar.",
  seoTitle: "TBDY Özel Deprem Etriyesi ve Çiroz | 7.2.8 Detay Kuralları",
  seoDescription: "Özel deprem etriyesi ve çiroz için 135° kanca, 90° çiroz istisnası, 5ϕ büküm çapı, 6ϕ ve 80 mm uç boyu ile yerleşim kuralları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "nerede-zorunlu",
      title: "7.2.8 özel deprem etriyesini yalnız kolon ucu detayı olarak tanımlamaz",
      content: phase3Lines(
        "TBDY 7.2.8, süneklik düzeyi yüksek veya süneklik düzeyi sınırlı betonarme sistemlerde **kolonlar, kolon-kiriş birleşim bölgeleri, perde uç bölgeleri ve kiriş sarılma bölgelerinde** kullanılan etriye ve çirozları özel deprem donatısı olarak düzenler. Dolayısıyla yalnız kolon sarılma bölgesinde sık etriye koymak bu maddeyi tek başına karşılamaz.",
        "",
        "| Bölge | 7.2.8 kapsamı |",
        "|---|---|",
        "| Kolon | Özel deprem etriyesi / çirozu |",
        "| Kolon-kiriş birleşimi | Özel deprem etriyesi / çirozu |",
        "| Perde uç bölgesi | Özel deprem etriyesi / çirozu |",
        "| Kiriş sarılma bölgesi | Özel deprem etriyesi |",
        "",
        "> [!engineering] Ayrım",
        "> 7.2.8 **detayın geometrisini ve bağlanma biçimini** tanımlar. Etriye çapı ve aralığının eleman/bölgeye özgü sayısal sınırları ise kolon, kiriş ve perdeye ait ilgili maddelerden ayrıca kontrol edilir."
      ),
      subsections: [],
    },
    {
      id: "kanca-geometrisi",
      title: "Etriyenin iki ucu 135°; çirozda yalnız bir uç 90° olabilir",
      content: phase3Lines(
        "7.2.8.1'e göre özel deprem etriyesinin **her iki ucunda mutlaka 135° kıvrımlı kanca** bulunur. Özel deprem çirozunda ise bir uç 90° yapılabilir. Bu istisna, etriyenin bir ucunu 90° yapmak için kullanılamaz.",
        "",
        "| Donatı | Kanca koşulu |",
        "|---|---|",
        "| Özel deprem etriyesi | iki uç 135° |",
        "| Özel deprem çirozu | bir uç 135°, diğer uç 90° olabilir |",
        "",
        "> [!warning] 90° çiroz uçları aynı yüzde yığılmaz",
        "> Bir ucu 90° olan çiroz kullanılıyorsa kolon veya perde yüzündeki 135° ve 90° kanca kıvrımları hem yatay hem düşey doğrultuda **şaşırtmalı** düzenlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "bukme-ve-uc-boyu",
      title: "135° kancada iki bağımsız geometri sınırı vardır: 5ϕ ve max(6ϕ, 80 mm)",
      content: phase3Lines(
        "135° kıvrımlı kancada, `ϕ` enine donatı çapını göstermek üzere iç büküm çapı **en az 5ϕ** olmalıdır. Kancanın kıvrımdaki son teğet noktasından sonraki düz uç boyu ise nervürlü çubuklarda hem **6ϕ** hem de **80 mm** alt sınırını sağlamalıdır.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| İç büküm çapı | ≥ 5ϕ |",
        "| Düz uç boyu | ≥ 6ϕ |",
        "| Mutlak düz uç alt sınırı | ≥ 80 mm |",
        "",
        "> [!check] Örnek",
        "> ϕ10 enine donatıda `6ϕ = 60 mm` olduğu için 80 mm sınırı belirleyicidir. ϕ14 için `6ϕ = 84 mm` olduğundan bu kez 84 mm belirleyici olur."
      ),
      subsections: [],
    },
    {
      id: "etriye-ciroz-baglantisi",
      title: "Çiroz, hem boyuna donatıyı hem dış etriyeyi gerçek anlamda sarmalıdır",
      content: phase3Lines(
        "7.2.8.2, özel deprem etriyesinin boyuna donatıyı dıştan kavramasını ve kancalarının **aynı boyuna donatı etrafında kapanmasını** ister. Çirozların çapı ve aralığı, birlikte çalıştığı etriyenin çapı ve aralığı ile aynı olmalıdır.",
        "",
        "Çirozun iki ucu da boyuna donatıyı ve dış etriyeyi sarmalıdır. Yalnız betona dayanan, dış etriyeye takılmayan veya boyuna çubuğu gerçekten kavramayan bir ara bağlantı 7.2.8.2'nin tarif ettiği özel deprem çirozu değildir.",
        "",
        "> [!warning] Çizim sembolü yetmez",
        "> Donatı paftasında çiroz çizilmiş olması, şantiyedeki uçların dış etriye ve boyuna çubuğu sarma biçimi yanlışsa yönetmelik koşulunu sağlamaz."
      ),
      subsections: [],
    },
    {
      id: "uygulama-kontrolu",
      title: "Beton dökümü sırasında yer değiştirmeyecek bağlama detayı gerekir",
      content: phase3Lines(
        "TBDY, etriye ve çirozların beton dökülürken yerlerinden kaymayacak biçimde boyuna donatılara **sıkıca bağlanmasını** açıkça ister. Bu nedenle kalite kontrolü yalnız çap/aralık ölçümünden oluşmamalıdır.",
        "",
        "| Saha kontrolü | Bakılacak husus |",
        "|---|---|",
        "| Kanca yönü | 135°/90° düzeni ve şaşırtma |",
        "| Kanca boyu | 5ϕ iç büküm + max(6ϕ,80 mm) düz uç |",
        "| Çiroz | boyuna çubuk + dış etriye sarımı |",
        "| Bağ teli | betonlama/vibrasyonda donatıyı konumunda tutacak yeterlilik |",
        "| Aralık | ilgili kolon/kiriş/perde maddesindeki bölgesel sınırla uyum |",
        "",
        "> [!engineering] Fotoğraflı kabul",
        "> Döküm öncesi kontrolde tipik kolon, birleşim ve perde uç bölgesinde kanca yönlerini görünür kılan fotoğraflar, pafta ile saha arasındaki farkı yakalamayı kolaylaştırır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Özel deprem etriyesi gereken kolon, birleşim, perde uç ve kiriş sarılma bölgeleri paftada açık mı?",
        "- Etriyelerin iki ucu da 135° mi?",
        "- Çirozda 90° uç kullanılıyorsa karşı uç 135° ve kancalar iki doğrultuda şaşırtmalı mı?",
        "- 135° kancanın iç büküm çapı en az 5ϕ mi?",
        "- Nervürlü çubukta düz uç boyu hem 6ϕ hem 80 mm koşulunu sağlıyor mu?",
        "- Çiroz çapı ve aralığı bağlı olduğu etriye ile aynı mı?",
        "- Çirozun iki ucu boyuna donatıyı ve dış etriyeyi sarıyor mu?",
        "- Etriye kancaları aynı boyuna donatı etrafında kapanıyor mu?",
        "- Donatılar betonlama sırasında kaymayacak biçimde sıkıca bağlanmış mı?",
        "- Bölgesel etriye çap/aralık sınırları 7.3, 7.4, 7.6, 7.7 veya 7.8'den ayrıca kontrol edilmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.2.8 ve Şekil 7.1"),
  keywords: ["TBDY 2018", "7.2.8", "özel deprem etriyesi", "özel deprem çirozu", "135 derece", "90 derece", "5ϕ", "6ϕ", "80 mm"],
  tags: ["TBDY 2018", "Betonarme", "Etriye", "Çiroz", "Deprem Detayı"],
};
