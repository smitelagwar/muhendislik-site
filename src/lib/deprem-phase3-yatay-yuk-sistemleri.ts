import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_YATAY_YUK_SISTEMLERI: DepremPhase3Override = {
  slug: "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek",
  description: "TBDY 2018 Tablo 4.1 ve Madde 4.3'e göre betonarme çerçeve, perde, bağ kirişli perde ve birlikte çalışan sistemlerin sınıflandırılmasını; mimari 'çekirdek' teriminin tek başına yönetmelik sistemi olmadığını açıklar.",
  seoTitle: "TBDY 2018 Yatay Yük Taşıma Sistemleri | Çerçeve, Perde ve Çekirdek",
  seoDescription: "Tablo 4.1 A11–A15 sistemleri, R-D-BYS değerleri, bağ kirişli/boşluksuz perde, çekirdek sınıflandırması ve Denklem 4.2–4.3 katkı koşulları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "sistem-adi-degil-davranis",
      title: "Taşıyıcı sistemi mimari adı değil, yük taşıma mekanizması tanımlar",
      content: phase3Lines(
        "Bir projeye 'çerçeveli', 'perdeli' veya 'çekirdekli' demek yönetmelik sınıfını tek başına belirlemez. TBDY 2018 Madde 4.3 ve Tablo 4.1; deprem etkilerinin hangi elemanlar tarafından karşılandığını, elemanların süneklik düzeyini, perde türünü ve çerçeve-perde paylaşımını esas alarak `R`, `D` ve izin verilen BYS sınırını belirler.",
        "",
        "Bu nedenle analiz modelinde gerçek yük taşıma mekanizmasını kurmadan yalnız program menüsünden bir R katsayısı seçmek ters bir iş akışıdır. Önce sistem sınıfı, sonra Tablo 4.1 satırı ve katsayılar doğrulanmalıdır.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Perde geometrisi, bağ kirişi davranışı, taban devrilme momenti paylaşımı, seçilen süneklik düzeyi ve BYS; taşıyıcı sistem sınıfının SOURCE_VALUE girdileridir."
      ),
      subsections: [],
    },
    {
      id: "tablo-4-1-ornekleri",
      title: "Tablo 4.1: betonarme sistemlerde A11–A15 örnekleri",
      content: phase3Lines(
        "Yüksek süneklik düzeyindeki başlıca betonarme sistem satırları, sistem farkını görmek için aşağıdaki gibi özetlenebilir:",
        "",
        "| Kod | Taşıyıcı sistem özeti | R | D | İzin verilen en yüksek BYS |",
        "|---|---|---:|---:|---:|",
        "| A11 | Deprem etkilerinin tamamının yüksek sünek moment aktaran betonarme çerçevelerle karşılandığı bina | `R = 8` | `D = 3` | `BYS ≥ 3` |",
        "| A12 | Tamamının yüksek sünek **bağ kirişli (boşluklu) perdelerle** karşılandığı bina | `R = 7` | `D = 2.5` | `BYS ≥ 2` |",
        "| A13 | Tamamının yüksek sünek **boşluksuz perdelerle** karşılandığı bina | `R = 6` | `D = 2.5` | `BYS ≥ 2` |",
        "| A14 | Yüksek sünek çerçeve + bağ kirişli perde birlikte sistemi | `R = 8` | `D = 2.5` | `BYS ≥ 2` |",
        "| A15 | Yüksek sünek çerçeve + boşluksuz perde birlikte sistemi | `R = 7` | `D = 2.5` | `BYS ≥ 2` |",
        "",
        "Bu değerler, mimari planda perde bulunmasının tek başına A14/A15 seçimi için yeterli olmadığını gösterir. Birlikte sistemin yönetmelikte istenen katkı koşulları ayrıca sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "cekirdek-terimi",
      title: "Çekirdek, Tablo 4.1'de bağımsız bir taşıyıcı sistem kategorisi değildir",
      content: phase3Lines(
        "Mimari ve statik uygulamada asansör-merdiven çevresindeki U, C veya kapalı kutu biçimli perde grubuna sıkça **çekirdek** denir. Ancak 'çekirdek' sözcüğü tek başına Tablo 4.1'de ayrı bir R-D sistemi tanımlamaz.",
        "",
        "Çekirdeği oluşturan perde parçalarının açıklıklarla birbirine bağlanma biçimi, bağ kirişlerinin davranışı ve modeldeki yük paylaşımı incelenir. Sistem, gerçek davranışına göre boşluksuz perdeler, bağ kirişli perdeler veya bunların çerçevelerle birlikte çalıştığı ilgili yönetmelik satırı içinde sınıflandırılır.",
        "",
        "> [!warning] Sık hata",
        "> 'Ortada çekirdek var; o halde perde sistemi seçerim' yaklaşımı yeterli değildir. Geometrik bir çekirdek tanımı ile yönetmelik taşıyıcı sistem sınıfını birbirine eşitlemeyin."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-2",
      title: "Denklem 4.2: yüksek sünek çerçeve-perde birlikte sisteminde katkı sınırı",
      content: phase3Lines(
        "Madde 4.3.4.5, yüksek sünek çerçevelerle yüksek sünek perdelerin/çaprazlı çerçevelerin birlikte kullanıldığı sistemlerde taban devrilme momenti paylaşımına bir aralık getirir:",
        "",
        "`0.40 M_o < ΣM_DEV < 0.75 M_o` — **Denklem (4.2)**",
        "",
        "Burada `M_o` tabandaki toplam devrilme momentini, `ΣM_DEV` ise sünek perdeler veya merkezi/dışmerkez çaprazlı çerçeveler tarafından karşılanan devrilme momentleri toplamını temsil eder. Başka bir ifadeyle birlikte sistem adı, yalnız elemanların modelde bulunmasına değil **yük paylaşımına** da bağlıdır.",
        "",
        "Üst sınırın sağlanmaması durumunda yönetmelik, deprem etkilerinin tamamının yüksek sünek perdeler/çaprazlı çerçevelerle karşılandığı sistemin R, D ve BYS değerlerine geçilmesini ister. Alt sınırın sağlanmamasının da Madde 4.3.4.5 içinde ayrı sonucu vardır."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-3",
      title: "Denklem 4.3: karma süneklik düzeyindeki sistem koşulu",
      content: phase3Lines(
        "Süneklik düzeyi sınırlı çerçeveler ile yüksek sünek perdelerin birlikte kullanıldığı karma sistemlerde Madde 4.3.4.6 daha yüksek perde/çapraz katkısı ister:",
        "",
        "`ΣM_DEV ≥ 0.75 M_o` — **Denklem (4.3)**",
        "",
        "Bu koşul, 'birkaç perde ekledim, sistem artık karma' biçiminde nominal sınıflandırmayı engeller. Perde sisteminin deprem devrilme momentindeki gerçek katkısı analiz sonucuyla doğrulanmalıdır.",
        "",
        "Ayrıca Madde 4.3.3 ve 4.3.4'teki DTS/BYS uygulama sınırları, sınırlı ve karma süneklik sistemlerinin nerede kullanılabileceğini ayrıca sınırlar."
      ),
      subsections: [],
    },
    {
      id: "modelden-sinifa",
      title: "Modelden yönetmelik sınıfına geri doğrulama",
      content: phase3Lines(
        "1. Her doğrultuda deprem etkisini karşılayan çerçeve ve perde gruplarını belirleyin.",
        "2. Perde grubunun boşluksuz mu, bağ kirişli mi davrandığını model/geometri üzerinden sınıflandırın.",
        "3. Çekirdek terimini yalnız geometrik açıklama olarak kullanın; Tablo 4.1 satırını gerçek perde davranışına göre seçin.",
        "4. Birlikte veya karma sistem seçiliyorsa taban devrilme momenti paylaşımını çıkarın.",
        "5. Gerektiğinde Denklem (4.2) veya Denklem (4.3) koşulunu kontrol edin.",
        "6. Seçilen Tablo 4.1 satırının R, D, BYS ve süneklik koşullarını model parametreleriyle karşılaştırın.",
        "7. X ve Y doğrultularında sistemlerin farklı olabileceğini göz ardı etmeyin; her doğrultuyu ayrı doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Tablo 4.1'de seçilen sistem kodu gerçek yük taşıma mekanizmasına uyuyor mu?",
        "- A11, A12, A13, A14 veya A15 seçiminin gerekçesi raporda açık mı?",
        "- `R` ve `D` seçimi aynı Tablo 4.1 satırından mı geliyor?",
        "- BYS sınırı ve DTS/süneklik koşulları sağlanıyor mu?",
        "- Çekirdek bağımsız yönetmelik kategorisi gibi kullanılmadı mı?",
        "- Bağ kirişli ve boşluksuz perde ayrımı doğru yapıldı mı?",
        "- Birlikte sistemde `%40` ve `%75` sınırlarını içeren Denklem (4.2) kontrol edildi mi?",
        "- Karma sistemde Denklem (4.3) koşulu gerektiğinde sağlandı mı?",
        "- Her iki yatay doğrultuda sistem sınıfı ayrıca doğrulandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.3; Tablo 4.1; Denklem (4.2) ve (4.3)"),
  keywords: ["yatay yük taşıma sistemi", "çerçeve", "perde", "çekirdek", "Tablo 4.1", "R katsayısı", "D katsayısı", "BYS"],
  tags: ["TBDY 2018", "Taşıyıcı Sistem", "Çerçeve", "Perde", "Çekirdek"],
};
