import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_KAROT: DepremPhase4Override = {
  slug: "mevcut-bina-karot-beton-dayanimi",
  description: "TBDY Bölüm 15'e göre sınırlı ve kapsamlı bilgi düzeylerinde karot numune sayısını, 100 mm karot koşulunu, istatistiksel değerlendirmeyi ve mevcut beton dayanımının belirlenmesini açıklar.",
  seoTitle: "TBDY Bölüm 15 Karot Sayısı ve Mevcut Beton Dayanımı | Mevcut Bina",
  seoDescription: "TBDY 15.2.4.3 ve 15.2.5.3'e göre karot sayıları, 100 mm karot, ortalama-standart sapma, 0.85 ortalama ve %75 aykırı değer kontrolü.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "karot-amaci",
      title: "Karot sonucu doğrudan proje beton sınıfı değil, mevcut malzeme dayanımı girdisidir",
      content: phase4Lines(
        "TBDY 15.2.3, taşıyıcı eleman kapasitelerinde kullanılacak dayanımları **mevcut malzeme dayanımı** olarak tanımlar. Betonarme mevcut binalarda karot programı bu dayanımı sahadan üretmek için kullanılır; numune sayısı ve değerlendirme yöntemi seçilen bilgi düzeyine göre değişir.",
        "",
        "Bu nedenle tek bir karot sonucunu 'binanın beton sınıfı' diye genellemek doğru değildir. Yönetmelik numune dağılımı, minimum sayılar ve istatistiksel değerlendirme üzerinden kapasite hesabında kullanılacak mevcut beton dayanımını tarif eder."
      ),
      subsections: [],
    },
    {
      id: "numune-sayilari",
      title: "Sınırlı ve kapsamlı bilgi düzeyinde minimum karot düzeni farklıdır",
      content: phase4Lines(
        "| Bilgi düzeyi | TBDY beton örneği koşulu |",
        "|---|---|",
        "| Sınırlı — 15.2.4.3 | **Her katta** kolonlardan veya perdelerden en az **3** beton örneği |",
        "| Kapsamlı — 15.2.5.3 | Zemin katta en az **3**, diğer katlarda en az **2**; bina toplamında en az **9** ve ayrıca her **400 m²** için en az **1** beton örneği |",
        "",
        "Kapsamlı bilgi düzeyinde bu koşullar birlikte okunmalıdır. Örneğin yalnız 'toplam dokuz karot aldım' demek, kat başına minimumları veya her 400 m² koşulunu sağlamıyorsa yeterli değildir."
      ),
      subsections: [],
    },
    {
      id: "karot-boyutu",
      title: "100 mm × 100 mm karot için doğrudan kullanım koşulu",
      content: phase4Lines(
        "Hem 15.2.4.3 hem 15.2.5.3, TS EN 12504-1 koşullarına uygun karot alınmasını ister. Uzunluğu ile anma çapı birbirine eşit ve **100 mm** olan karotların deney dayanımları, herhangi bir katsayı uygulanmaksızın mevcut beton dayanımının tayininde kullanılabilir.",
        "",
        "Farklı uzunluk/çap oranlarına sahip karotların deney sonuçları ise uygun dönüştürme katsayılarıyla değerlendirilmelidir. Bu nedenle laboratuvar raporunda numune çapı, boyu ve uygulanmış dönüşümün izlenebilir olması gerekir."
      ),
      subsections: [],
    },
    {
      id: "sinirli-istatistik",
      title: "Sınırlı bilgi düzeyinde üç numune ile daha fazla numunenin hesabı farklıdır",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde toplam örnek sayısı **3** ise istatistiksel değerlendirme yapılmadan üç sonuç içindeki **en düşük basınç dayanımı** mevcut beton dayanımı alınır.",
        "",
        "Örnek sayısı 3'ten fazla ise mevcut beton dayanımı, `ortalama − standart sapma` ile `0.85 × ortalama` değerlerinden **büyük olanı** seçilerek belirlenir.",
        "",
        "> [!warning] Hesap hatası",
        "> Üç numunede 0.85×ortalama formülünü kullanmak veya üçten fazla numunede yalnız minimum sonucu almak, 15.2.4.3'teki karar ağacını değiştirir."
      ),
      subsections: [],
    },
    {
      id: "kapsamli-istatistik",
      title: "Kapsamlı bilgi düzeyinde mevcut dayanım istatistiksel değerle belirlenir",
      content: phase4Lines(
        "TBDY 15.2.5.3'e göre kapsamlı bilgi düzeyinde eleman kapasitelerinde kullanılacak mevcut beton dayanımı, karot sonuçlarının `ortalama − standart sapma` değeri ile `0.85 × ortalama` değerinden **büyük olanıdır**.",
        "",
        "Bu ifade bir tasarım beton sınıfına geri dönüştürme kuralı değildir; doğrudan Bölüm 15 kapasite hesabında kullanılacak mevcut beton dayanımını belirler. Hesap raporunda karotların ham sonuçları, varsa dönüşümleri, ortalama, standart sapma ve seçilen sonuç birlikte gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "aykiri-deger",
      title: "En düşük sonucun %75 aykırı değer kontrolü ayrıca yapılır",
      content: phase4Lines(
        "Her iki bilgi düzeyinde de bir beton örneği grubundaki en düşük tek sonucun istatistiksel olarak sapan bir değer olup olmadığı kontrol edilir. Yönetmelik, en düşük tek değer geriye kalan diğer sonuçların ortalamasının **%75'inden daha düşükse** bu numunenin değerlendirmeye alınmamasını öngörür.",
        "",
        "Bu kural 'düşük sonucu beğenmeyince çıkarma' yetkisi değildir. Karşılaştırma açıkça geriye kalan sonuçların ortalamasına göre yapılmalı ve hangi numunenin neden dışlandığı hesap föyünde gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "hasarsiz-yontemler",
      title: "Beton çekici karotun yerine değil, dağılım kontrolüne yardımcı olur",
      content: phase4Lines(
        "Kapsamlı bilgi düzeyinde 15.2.5.3, beton dayanımının bina içindeki dağılımının beton örneği deney sonuçlarıyla **uyarlanmış beton çekici okumaları veya benzeri hasarsız inceleme araçlarıyla** kontrol edilebileceğini belirtir.",
        "",
        "Bu hüküm minimum karot sayılarının hasarsız testle ikame edilebileceği anlamına gelmez. Önce yönetmelikteki karot programı sağlanır; hasarsız okumalar karot sonuçlarıyla ilişkilendirilerek dayanımın yapı içindeki dağılımını incelemeye yardımcı olur."
      ),
      subsections: [],
    },
    {
      id: "saha-planlama",
      title: "Numune planı kat ve rölöve ile birlikte hazırlanmalıdır",
      content: phase4Lines(
        "Karotlar yönetmelikte belirtildiği gibi kolon veya perdelerden alınır. Numune planı hazırlanırken kat başına minimumlar, toplam sayı ve kapsamlı düzeyde 400 m² koşulu birlikte işaretlenmelidir.",
        "",
        "Mühendislik uygulamasında numune noktalarının rölövede eleman koduyla gösterilmesi, donatı taramasıyla kesilecek bölgenin kontrol edilmesi ve numune sonrası onarımın planlanması izlenebilirliği artırır. Böylece laboratuvar raporundaki K-01 gibi bir numunenin hangi kat/aks/elemandan geldiği hesap modeline kadar takip edilebilir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Bilgi düzeyi karot programından önce doğru belirlendi mi?",
        "- Sınırlı düzeyde her katta en az 3 kolon/perde örneği var mı?",
        "- Kapsamlı düzeyde zemin kat ≥3, diğer katlar ≥2, toplam ≥9 ve her 400 m² ≥1 koşulları birlikte sağlanıyor mu?",
        "- Karotların TS EN 12504-1 koşullarına uygunluğu ve boyutları raporda kayıtlı mı?",
        "- 100 mm uzunluk = 100 mm çap dışındaki numunelerde uygun dönüşüm kullanıldı mı?",
        "- Sınırlı düzeyde n=3 ile n>3 hesap yolları karıştırılmadı mı?",
        "- `ortalama − standart sapma` ve `0.85 × ortalama` hesabı doğru uygulandı mı?",
        "- %75 aykırı değer kontrolü açıkça gösterildi mi?",
        "- Hasarsız test sonuçları minimum karotların yerine kullanılmadı mı?",
        "- Numune kodları kat–aks–eleman rölövesiyle eşleşiyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.2.3, 15.2.4.3 ve 15.2.5.3 — mevcut beton dayanımı ve karot numuneleri"),
  keywords: ["karot", "mevcut beton dayanımı", "TS EN 12504-1", "0.85 ortalama", "standart sapma", "TBDY 15.2.5.3", "400 m2"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Karot", "Beton Dayanımı", "Malzeme Deneyi"],
};
