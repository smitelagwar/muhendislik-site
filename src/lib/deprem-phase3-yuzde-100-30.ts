import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_YUZDE_100_30: DepremPhase3Override = {
  slug: "tbdy-yuzde-100-yuzde-30-birlesimi",
  description: "TBDY 2018 Madde 4.4.2 ve Denklem 4.9'a göre birbirine dik X ve Y yatay deprem etkilerinin %100 + %30 kuralıyla nasıl birleştirileceğini ve zaman tanım alanında eşzamanlı iki bileşen hesabından nasıl ayrıldığını açıklar.",
  seoTitle: "TBDY %100 + %30 Deprem Doğrultusu Birleşimi | Denklem 4.9",
  seoDescription: "X ve Y deprem etkilerinin ±%100 ±%30 birleşimi, sekiz işaret kombinasyonu ve zaman tanım alanı istisnası; TBDY 4.4.2 ve Denklem 4.9 rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "dogrultu-birlesimi",
      title: "%100 + %30 kuralı bir yük kombinasyonu değil, yatay deprem etkisi birleştirmesidir",
      content: phase3Lines(
        "TBDY 4.4.2.1, deprem hesabının 4.7'deki Eşdeğer Deprem Yükü Yöntemi veya 4.8.2'deki Mod Birleştirme Yöntemi ile yapılması halinde, birbirine dik X ve Y doğrultularında **ayrı ayrı hesaplanan deprem etkilerinin** Denklem 4.9 ile birleştirilmesini ister.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> Önce Ed(X) ve Ed(Y) etkilerini doğru analiz yönteminden ayrı ayrı üretin. Sonra bir doğrultuyu %100, diğerini %30 alarak iki denklem ailesini ve tüm işaret olasılıklarını değerlendirin. Zaman tanım alanında Mod Toplama Yöntemi kullanılıyorsa iki yatay bileşen eşzamanlı tanımlandığından bu yaklaşık %100 + %30 kuralını ayrıca uygulamayın."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-9",
      title: "Denklem 4.9: iki doğrultu da ana doğrultu olabilir",
      content: phase3Lines(
        "Denklem 4.9 yalnız `EX + 0.30 EY` değildir. X'in %100 olduğu ve Y'nin %100 olduğu iki ayrı denklem ailesi vardır; her ikisinde de işaretler olumlu/olumsuz alınır.",
        "",
        "```formula",
        "@label: TBDY 4.4.2.1 — Denklem (4.9)",
        "E_d^(H) = ± E_d^(X) ± 0.3 E_d^(Y)",
        "E_d^(H) = ± 0.3 E_d^(X) ± E_d^(Y)",
        "@symbol: E_d^(H) | Doğrultu birleştirmesi uygulanmış tasarıma esas yatay deprem etkisi | etki birimi",
        "@symbol: E_d^(X) | X doğrultusu depreminden ilgili kesitte hesaplanan deprem etkisi | etki birimi",
        "@symbol: E_d^(Y) | Y doğrultusu depreminden ilgili kesitte hesaplanan deprem etkisi | etki birimi",
        "```",
        "",
        "> [!regulation] İşaretler",
        "> İki denklem ailesinde `±` işaretleri birlikte değerlendirilir. Uygulamada bu, X ana doğrultulu dört ve Y ana doğrultulu dört olmak üzere **8 işaret kombinasyonunun** elverişsiz zarfını kontrol etmek anlamına gelir."
      ),
      subsections: [],
    },
    {
      id: "sekiz-kombinasyon",
      title: "Sekiz temel işaret kombinasyonunu açık kurun",
      content: phase3Lines(
        "Bir analiz/yük kombinasyonu yöneticisinde Denklem 4.9 aşağıdaki temel yatay deprem etkisi durumlarıyla temsil edilebilir. Programın otomatik kombinasyon üretmesi halinde de aynı mantığın gerçekten uygulandığını rapordan doğrulayın.",
        "",
        "| X ana (%100) | Y ana (%100) |",
        "|---|---|",
        "| +EX + 0.30EY | +0.30EX + EY |",
        "| +EX − 0.30EY | +0.30EX − EY |",
        "| −EX + 0.30EY | −0.30EX + EY |",
        "| −EX − 0.30EY | −0.30EX − EY |",
        "",
        "> [!warning] Mutlak maksimumları toplamayın",
        "> Ed(X) ve Ed(Y), herhangi bir kesitte ayrı ayrı hesaplanan deprem **etkileridir**. Farklı elemanlarda/farklı uçlarda oluşan bağımsız mutlak maksimumları bağlamından koparıp `max|EX| + 0.3 max|EY|` biçiminde tek sayı toplamak, kombinasyon işaret ve zarf mantığını bozabilir."
      ),
      subsections: [],
    },
    {
      id: "zaman-tanim-alani",
      title: "Zaman tanım alanında neden ayrıca %100 + %30 yapılmaz?",
      content: phase3Lines(
        "Madde 4.4.2.2'ye göre deprem hesabı 4.8.3'teki zaman tanım alanında Mod Toplama Yöntemi ile yapıldığında, birbirine dik X ve Y yer hareketi bileşenleri Bölüm 2.5'e göre **birlikte ve eşzamanlı** tanımlanır. Bu nedenle birleştirilmiş yatay deprem etkisi Ed(H) hesap sonucunda doğrudan elde edilir.",
        "",
        "4.8.3.2(b) de aynı ayrımı tekrarlar: eşzamanlı iki yatay bileşen göz önüne alındığı için 4.4.2'deki yaklaşık doğrultu birleştirmesi kurallarının uygulanmasına gerek yoktur.",
        "",
        "> [!check] Yöntem ayrımı",
        "> Eşdeğer Deprem Yükü ve Mod Birleştirme → Denklem 4.9 yaklaşık doğrultu birleşimi. Zaman tanım alanında Mod Toplama → eşzamanlı X/Y kayıtları; ayrıca %100 + %30 eklenmez."
      ),
      subsections: [],
    },
    {
      id: "tasarim-zarfi",
      title: "Eleman tasarım zarfında neyi kontrol etmelisiniz?",
      content: phase3Lines(
        "Doğrultu birleşimi kolon/perde eksenel kuvveti, kesme, moment, temel tepkileri ve diğer tasarım etkilerinde farklı işaret kombinasyonlarını kritik hale getirebilir. Bir eleman için en olumsuz N, M veya V aynı kombinasyondan çıkmak zorunda değildir; tasarım yazılımının her kontrol için doğru zarfı ürettiğini doğrulayın.",
        "",
        "| Kontrol | Aranacak durum |",
        "|---|---|",
        "| Kolon/perde N–M | Eksenel kuvvet ve moment işaretlerinin birlikte elverişsiz hali |",
        "| Kiriş/kolon kesmesi | ±EX/±EY yönlerinin kapasite tasarımına etkisi |",
        "| Temel tepkileri | Basınç, çekme eğilimi ve yatay reaksiyon zarfı |",
        "| Kat/eleman deplasmanları | İlgili deprem etkisi birleşiminden gelen elverişsiz değer |",
        "",
        "> [!engineering] Yazılım kontrolü",
        "> “100/30 combinations generated” mesajına güvenmek yerine kombinasyon listesini ve seçili bir kritik elemanın zarfını elle çapraz kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Analiz yöntemi 4.7 veya 4.8.2 ise Denklem 4.9 uygulanıyor mu?",
        "- Ed(X) ve Ed(Y) ayrı deprem etkileri olarak doğru üretilmiş mi?",
        "- Hem X %100 + Y %30 hem X %30 + Y %100 aileleri var mı?",
        "- Her iki denklem ailesinde pozitif/negatif işaretler kapsanıyor mu?",
        "- Toplam sekiz temel işaret kombinasyonunun elverişsiz zarfı değerlendiriliyor mu?",
        "- Mutlak maksimumlar bağlamından koparılarak yanlış toplanmamış mı?",
        "- Zaman tanım alanında eşzamanlı X/Y hesabına ayrıca %100 + %30 eklenmemiş mi?",
        "- Kolon, perde, kiriş ve temel tasarım zarfları birleşik etkilerden üretilmiş mi?",
        "- Hesap raporu kullanılan kombinasyon mantığını açıkça gösteriyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.4.2; Denklem (4.9), Madde 4.8.3.2 ve Bölüm 2.5"),
  keywords: ["TBDY 2018", "%100 %30", "100/30", "Denklem 4.9", "Ed(X)", "Ed(Y)", "doğrultu birleşimi", "deprem kombinasyonu", "zaman tanım alanı"],
  tags: ["TBDY 2018", "Deprem Etkisi", "Doğrultu Birleşimi", "Yük Kombinasyonu"],
};
