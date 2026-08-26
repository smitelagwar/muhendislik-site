import {
  PHASE7_UPDATED_AT,
  acousticPhase7References,
  phase7Lines,
  type DepremPhase7Override,
} from "./deprem-phase7-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const ACOUSTIC: DepremPhase7Override = {
  slug: "akustik-ts-en-iso-12354-ile-yalitim-hesabi",
  title: "Bina Akustiğinde TS EN 12354: Laboratuvar Elemanından Yerinde Yalıtım Performansına",
  description: "Hava doğuşlu ses, darbe sesi ve yanal iletim kavramlarını Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik Madde 16 ve TS EN 12354 hesap yaklaşımıyla proje iş akışına dönüştürür.",
  seoTitle: "TS EN 12354 Akustik Hesap | DnT, Rw ve Darbe Sesi",
  seoDescription: "Bina akustiğinde Rw, DnT,A/DnT,w, Ln,w, L'nT,w, yanal iletim, akustik proje ve Binaların Gürültüye Karşı Korunması Yönetmeliği Madde 16.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "17 dk okuma",
  relatedSlugs: ["bep-isi-yalitim-katmanlari-u-degeri-hesabi", "duman-tahliyesi-mekanik-ve-dogal-sistemler", "yangin-kapisi-dosleme-duvar-gecis-detaylari"],
  sections: [
    section("kapsam", "Akustik hesap, tek bir duvarın laboratuvar Rw değerini okumak değildir", phase7Lines(
      "Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik; dış çevre gürültüsü, komşuluk gürültüsü, darbe sesi, mekanik sistem/servis ekipmanı gürültüsü ve titreşimi birlikte ele alır. Bu nedenle akustik proje yalnız bölme duvar kataloğu seçimi değildir.",
      "Yönetmeliğin **Madde 16** hükmü, yapı elemanlarının laboratuvar verilerinden bina içindeki yayılımı modellemek için **TS EN 12354-1, TS EN 12354-2 ve ilgili seri bölümlerinin** kullanılmasına açıkça atıf yapar.",
      "Yanlış yaklaşım, `Rw=55 dB duvar seçtim, iki oda arasında da 55 dB yalıtım vardır` sonucuna doğrudan atlamaktır."
    )),
    section("gostergeler", "Önce hangi akustik büyüklüğü kontrol ettiğinizi netleştirin", phase7Lines(
      "`R` ve `Rw` yapı elemanının laboratuvar hava doğuşlu ses azaltım performansını; `Ln,w` laboratuvar darbe sesi düzeyini temsil eder. Bina içinde ise ayırıcı eleman, birleşimler, hacim ve yanal iletim etkileri nedeniyle yerinde göstergeler farklılaşır.",
      "Yönetmelik metni hesaplanan bina performansı için **DnT,A / DnT,50** ve **L'nT,w / L'nT,50** gibi göstergelere dönüşümü tarif eder. Hangi gösterge ve sınırın kullanılacağı bina/mekân sınıfına ve yönetmelik eklerine göre belirlenmelidir.",
      "| Problem | Laboratuvar girdisi | Bina performansı |\n|---|---|---|\n| Hava doğuşlu | R / Rw | DnT türü |\n| Darbe sesi | Ln,w | L'nT,w türü |\n| Tesisat | ses gücü/titreşim | iç mekân gürültü düzeyi |"
    )),
    section("yanal", "Yanal iletim, iyi duvarın performansını düşürebilir", phase7Lines(
      "Ses yalnız ayırıcı duvar veya döşemeden doğrudan geçmez; birleşen döşeme, yan duvar, cephe ve taşıyıcı elemanlar üzerinden de yayılabilir. TS EN 12354 yaklaşımının proje değerlerinden yerinde performansa geçişte önemli tarafı bu iletim yollarını modellemesidir.",
      "Kirişe, kolona veya sürekli döşemeye rijit bağlanan hafif bölmelerde; çift duvarların yanlış birleşiminde veya şaft çevresinde yanal iletim baskın hale gelebilir.",
      "Akustik detay çizimi, birleşim ve kenar koşullarını göstermiyorsa yalnız katman listesi yeterli değildir."
    )),
    section("hesap-akisi", "Hesap akışı: hedef performans → eleman verisi → birleşimler → oda sonucu", phase7Lines(
      "Önce yönetmelik ve kullanım senaryosundan hedef performans belirlenir. Ardından ayırıcı elemanın laboratuvar verileri, yan elemanlar, birleşim tipleri, alanlar ve hacim bilgileri modele girilir. Son aşamada hesaplanan bina performansı hedefle karşılaştırılır.",
      "Örnek yalnız kavramsal kontrol içindir: laboratuvar Rw değeri **55 dB** olan bir duvarın yerinde değeri, yanal iletim ve uygulama nedeniyle daha düşük çıkabilir; fark sabit `-5 dB` gibi evrensel bir ceza değildir ve projeye göre hesaplanmalıdır.",
      "Telifli standardın katsayı tabloları burada yeniden yayımlanmaz; proje hesabında güncel standart ve yetkili yazılım/veri kullanılır."
    )),
    section("detay", "Kapı, tesisat geçişi ve şaft, zayıf halka etkisi yaratır", phase7Lines(
      "Yüksek performanslı duvar içinde düşük performanslı kapı, menfez veya elektrik kutusu bulunması toplam ayırıcı performansı önemli ölçüde düşürebilir. Geçişlerin sızdırmazlığı ve karşılıklı priz kutularının yerleşimi detayda gösterilmelidir.",
      "Mekanik şaftta hem hava doğuşlu ses hem yapı kaynaklı titreşim olabilir. Boru/kanal askıları, esnek bağlantılar, cihaz kaideleri ve şaft duvarı birlikte çözülmelidir.",
      "Yangın durdurucu detaylar da akustik sızdırmazlığı bozmayacak şekilde koordine edilmelidir."
    )),
    section("saha", "Akustik performans saha işçiliğine hassastır", phase7Lines(
      "Duvarın tavana birleşimi, mastik sürekliliği, kapı fitilleri, şap altı darbe yalıtımı ve çevresel kenar bantları kapatılmadan önce kontrol edilmelidir. Birkaç santimetrelik açık derz laboratuvar ürün performansını anlamsızlaştırabilir.",
      "Gerekli projelerde ölçüm ve doğrulama yapılırken ölçüm standardı, oda koşulları ve raporlanan gösterge proje hesabıyla aynı olmalıdır.",
      "Akustik proje, mimari ve mekanik as-built değişikliklerle güncellenmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik güncel konsolide metinden kontrol edildi mi?",
      "- [ ] Madde 16 kapsamında TS EN 12354 hesap yaklaşımı doğru probleme uygulandı mı?",
      "- [ ] Rw ile yerinde DnT göstergeleri birbirine eşit kabul edilmedi mi?",
      "- [ ] Darbe sesi için Ln,w ve L'nT,w ayrımı doğru kuruldu mu?",
      "- [ ] Yanal iletim yolları ve birleşim detayları modele dahil edildi mi?",
      "- [ ] Kapı, şaft, menfez ve tesisat geçişleri zayıf halka olarak kontrol edildi mi?",
      "- [ ] Akustik detaylar yangın, mekanik ve mimari projeyle koordine edildi mi?",
      "- [ ] Saha uygulaması kapatma öncesi kontrol/ölçüm planına bağlandı mı?"
    )),
  ],
  references: acousticPhase7References("Madde 16, TS EN 12354 ve bina içi ses yalıtımı hesabı"),
  keywords: ["TS EN 12354", "Madde 16", "Rw", "DnT", "Ln,w", "L'nT,w", "yanal iletim"],
  tags: ["Akustik", "TS EN 12354", "Ses Yalıtımı", "Darbe Sesi", "Yanal İletim"],
};

export const DEPREM_PHASE7_BATCH_2_ARTICLES = [ACOUSTIC] as const;
