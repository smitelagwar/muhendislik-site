import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_GORELI_KAT_OTELENMESI: DepremPhase3Override = {
  slug: "tbdy-goreli-kat-otelenmesi",
  description: "TBDY 2018 Madde 4.9.1'e göre azaltılmış ve etkin göreli kat ötelenmesinin nasıl elde edildiğini; 0.008κ ve 0.016κ sınırlarının hangi dolgu/cephe koşullarında kullanıldığını açıklar.",
  seoTitle: "TBDY 2018 Göreli Kat Ötelenmesi | Denklem 4.32–4.34",
  seoDescription: "TBDY 4.9.1, Δi, δi, λ, κ, 0.008 ve 0.016 göreli kat ötelenmesi sınırları ile proje kontrol akışı.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "otelenme-kontrolunun-anlami",
      title: "Göreli kat ötelenmesi tek bir deplasman çıktısı değildir",
      content: phase3Lines(
        "TBDY 4.9.1, kat ötelenmesi kontrolünü iki ardışık katın yatay yer değiştirme farkından başlatır ve bu farkı taşıyıcı sistem davranışı ile cephe/dolgu detayına bağlı bir sınırla karşılaştırır. Bu nedenle yazılımın yalnız 'maksimum deplasman' tablosuna bakmak yeterli değildir.",
        "",
        "Kontrol; **kat bazında**, **deprem doğrultusu bazında** ve o kattaki kolon/perdeler arasında en elverişsiz değer üzerinden yürütülmelidir. Tasarım kararı, azaltılmış göreli ötelenme `Δi`, etkin göreli ötelenme `δi`, kat yüksekliği `hi`, spektral oran `λ` ve yapı malzemesine bağlı `κ` büyüklüklerinin birlikte okunmasına dayanır.",
        "",
        "> [!warning] Drift ile toplam kat deplasmanını karıştırmayın",
        "> Büyük bir çatı deplasmanı tek başına 4.9.1 ihlali anlamına gelmez; buna karşılık toplam deplasman küçük görünse bile belirli bir katta ani yer değiştirme farkı sınırı aşabilir."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-32-4-33",
      title: "Denklem 4.32 ve 4.33: önce Δi, sonra etkin ötelenme δi",
      content: phase3Lines(
        "TBDY 4.9.1.1'e göre azaltılmış göreli kat ötelenmesi Denklem (4.32) ile `Δ_i^(X) = u_i^(X) - u_(i-1)^(X)` olarak hesaplanır. Buradaki `u_i`, i'inci katın azaltılmış deprem etkileri altındaki yatay yer değiştirmesidir.",
        "",
        "Ardından 4.9.1.2 ve Denklem (4.33) ile etkin göreli kat ötelenmesi `δ_i^(X) = (R/I) Δ_i^(X)` elde edilir. Dolayısıyla raporda yalnız `Δi` gösterip sınır kontrolünü bununla yapmak doğru değildir; yönetmeliğin sınırları etkin göreli ötelenme üzerinden okunur.",
        "",
        "4.9.1.1 ayrıca bu yer değiştirmelerin hesabında 4.7.3.2 koşulunun ve Denklem (4.19)'daki minimum eşdeğer deprem yükü koşulunun dikkate alınmayacağını açıkça belirtir.",
        "",
        "> [!check] Yazılım raporu",
        "> Programın verdiği 'story drift' çıktısının Δi mi, δi mi yoksa normalize edilmiş δi/hi mı olduğunu rapor tanımından doğrulamadan sınır karşılaştırması yapmayın."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-34-sinirlar",
      title: "Denklem 4.34: dolgu ve cephe detayına göre iki farklı sınır vardır",
      content: phase3Lines(
        "TBDY 4.9.1.3, kattaki tüm kolon ve perdeler için bulunan etkin göreli ötelenmelerin en büyüğü `δ_i,max` üzerinden iki ayrı koşul tanımlar:",
        "",
        "```formula",
        "@label: TBDY Denklem (4.34) — etkin göreli kat ötelenmesi sınırları",
        "λ δ_i,max / h_i <= 0.008 κ   (4.34a)",
        "λ δ_i,max / h_i <= 0.016 κ   (4.34b)",
        "@symbol: λ | DD-3 ve DD-2 elastik spektral ivmelerinin oranı | -",
        "@symbol: δ_i,max | i'inci kattaki maksimum etkin göreli kat ötelenmesi | m",
        "@symbol: h_i | i'inci kat yüksekliği | m",
        "@symbol: κ | Taşıyıcı sistem malzemesine bağlı katsayı | -",
        "```",
        "",
        "| Durum | Kullanılacak sınır | Tasarım anlamı |",
        "|---|---:|---|",
        "| Gevrek dolgu duvar/cephe elemanları çerçeveye tamamen bitişik, esnek derz yok | Denklem (4.34a): `0.008 κ` | Daha sıkı ötelenme sınırı |",
        "| Dolgu/cephe ile çerçeve arasında esnek derz var veya bağlantı göreli ötelenmeye izin veriyor | Denklem (4.34b): `0.016 κ` | Daha yüksek sınır, fakat detayın kapasitesi ayrıca kanıtlanmalı |",
        "",
        "4.34b'nin kullanılması yalnız modelde bir seçenek işaretlemek değildir. İlgili dolgu/cephe elemanının düzlem içi göreli kat ötelenmesi kapasitesinin deneysel olarak belgelenmesi gerekir."
      ),
      subsections: [],
    },
    {
      id: "lambda-kappa",
      title: "λ ve κ sınırın parçasıdır; sabit 0.008 veya 0.016 kullanmayın",
      content: phase3Lines(
        "4.9.1.4'e göre `λ`, binanın hâkim titreşim periyodu için DD-3 elastik tasarım spektral ivmesinin DD-2 elastik tasarım spektral ivmesine oranıdır. Bu nedenle proje konumu, zemin sınıfı ve periyot değiştiğinde λ da değişebilir.",
        "",
        "Aynı maddede betonarme binalar için `κ = 1`, çelik binalar için `κ = 0.5` verilir. Dolayısıyla internette görülen çıplak `%0.8` veya `%1.6` benzeri ifadeleri λ ve κ'yı dışarıda bırakarak doğrudan projeye taşımak hatalıdır.",
        "",
        "4.9.1.5 yalnız tek katlı binalarda, moment aktaran çelik çerçevelerde ve çevrimsel davranış koşullarının sağlandığı özel durumda sınırların en fazla `%50` artırılmasına izin verir; bu genel bir tolerans değildir.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> λ, κ, R, I, kat yüksekliği ve dolgu/cephe bağlantı tipi bu kontrolün SOURCE_VALUE girdileridir. Hesap raporunda her biri görünür olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "cephe-dolgu-karari",
      title: "Taşıyıcı model ile mimari cephe detayı aynı kontrolü paylaşır",
      content: phase3Lines(
        "Göreli kat ötelenmesi sınırı, taşıyıcı sistem hesabı ile dolgu/cephe detayını doğrudan birbirine bağlar. Çerçeveye bitişik gevrek duvar seçildiğinde 4.34a; yeterli esnek derz veya uygun bağlantı detayı tasarlandığında ve kapasite kanıtlandığında 4.34b gündeme gelir.",
        "",
        "Bu nedenle sınır aşımı halinde ilk refleks yalnız kolon/perde kesitlerini büyütmek olmamalıdır. Taşıyıcı sistem rijitliği, perde yerleşimi, kat rijitliği sürekliliği ve mimari dolgu/cephe bağlantı stratejisi birlikte değerlendirilmelidir.",
        "",
        "4.9.1.6'ya göre herhangi bir katta sınır sağlanmıyorsa taşıyıcı sistem rijitliği artırılarak deprem hesabı tekrarlanır. Sonradan tablo üzerinde drift değerini ölçeklemek yönetmeliğin istediği çözüm değildir."
      ),
      subsections: [],
    },
    {
      id: "ofis-kontrol-akisi",
      title: "Ofis kontrol akışı: yer değiştirmeden detay kararına",
      content: phase3Lines(
        "1. Her deprem doğrultusunda kat yer değiştirmelerini alın ve Denklem (4.32) mantığıyla `Δi` değerlerini doğrulayın.",
        "2. Denklem (4.33) ile `R/I` etkisinin `δi` hesabına doğru taşındığını kontrol edin.",
        "3. Her katta kolon/perdeler arasındaki `δ_i,max` değerini bulun.",
        "4. Hâkim periyotta DD-3/DD-2 spektral oranından `λ` değerini belirleyin; malzemeye göre `κ` seçin.",
        "5. Dolgu/cephe bağlantı detayına göre Denklem (4.34a) veya Denklem (4.34b) sınırını seçin.",
        "6. Sınır aşılırsa rijitliği ve gerekirse cephe/dolgu detayını revize edip analizi tekrarlayın.",
        "",
        "> [!check] Sonuç tablosu",
        "> Proje özetinde kat no, hi, Δi, δi,max, λ, κ, seçilen 4.34 durumu, sınır ve kullanım oranını aynı satırda göstermek denetimi belirgin biçimde kolaylaştırır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Denklem (4.32) ile azaltılmış göreli kat ötelenmesi doğru mu?",
        "- Denklem (4.33) ile etkin göreli kat ötelenmesi `δi = (R/I)Δi` olarak mı hesaplandı?",
        "- Her katta kolon/perdeler arasındaki maksimum `δ_i,max` kullanıldı mı?",
        "- λ değeri DD-3/DD-2 spektrumlarından hâkim periyotta mı belirlendi?",
        "- Betonarme için `κ = 1`, çelik için `κ = 0.5` doğru uygulandı mı?",
        "- Dolgu/cephe detayı Denklem (4.34a) `0.008κ` veya Denklem (4.34b) `0.016κ` seçimini gerçekten destekliyor mu?",
        "- 4.34b kullanılıyorsa düzlem içi ötelenme kapasitesi deneysel olarak belgeli mi?",
        "- Özel tek katlı çelik çerçeve dışında `%50` artış yapılmadığı doğrulandı mı?",
        "- Sınır aşımında rijitlik artırılıp deprem analizi yeniden çalıştırıldı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.9.1; Denklem (4.32), (4.33), (4.34a) ve (4.34b)"),
  keywords: ["göreli kat ötelenmesi", "story drift", "Denklem 4.34", "0.008", "0.016", "TBDY 2018"],
  tags: ["TBDY 2018", "Göreli Kat Ötelenmesi", "Deplasman", "Cephe Detayı"],
};
