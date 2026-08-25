import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KOLON_EKSENEL_YUK: DepremPhase3Override = {
  slug: "tbdy-betonarme-kolon-kesit-eksenel-yuk-siniri",
  description: "TBDY 2018 Madde 7.3.1 ve 7.7.1'e göre kolon minimum kesit boyutlarını ve G+Q+E ortak etkisinden elde edilen Ndm için Ac ≥ Ndm/(0.40 fck) eksenel basınç sınırını açıklar.",
  seoTitle: "TBDY Kolon Kesit ve Eksenel Yük Sınırı | 7.3.1",
  seoDescription: "Dikdörtgen kolon 300 mm, dairesel kolon 350 mm ve Ac ≥ Ndm/(0.40 fck) koşulunun anlamı, doğru Ndm seçimi ve örnek kontrol.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "iki-ayri-kapi",
      title: "Kolon kesiti iki bağımsız kapıdan geçer: geometrik minimum ve eksenel basınç sınırı",
      content: phase3Lines(
        "TBDY 7.3.1, süneklik düzeyi yüksek kolon için yalnız bir minimum boyut vermez. Önce geometrik alt sınır sağlanır; ardından **G + Q + E ortak etkisi** altındaki en büyük eksenel basınç kuvveti `Ndm` ile brüt kesit alanı kontrol edilir.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Dikdörtgen kolon en küçük boyutu | ≥ 300 mm |",
        "| Dairesel kolon çapı | ≥ 350 mm |",
        "| Normalize eksenel basınç | Ndm/(Ac fck) ≤ 0.40 |",
        "",
        "> [!warning] Biri diğerinin yerine geçmez",
        "> 300×300 mm bir kolon geometrik minimumu sağlasa bile eksenel yük koşulunu sağlamayabilir. Büyük alanlı bir kolon da en küçük kenarı 300 mm'nin altındaysa geometrik koşulu sağlamaz."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-3-1-2",
      title: "7.3.1.2: Ac ≥ Ndm/(0.40 fck)",
      content: phase3Lines(
        "Kolonun brüt enkesit alanı `Ac`, 7.3.1.2'de verilen aşağıdaki koşulu sağlamalıdır. Denklem aynı zamanda `Ndm/(Ac fck) ≤ 0.40` biçiminde okunabilir.",
        "",
        "```formula",
        "@label: TBDY 7.3.1.2 — kolon eksenel basınç sınırı",
        "A_c ≥ N_dm / (0.40 f_ck)",
        "@symbol: A_c | Kolonun brüt enkesit alanı | mm²",
        "@symbol: N_dm | G, Q ve E ortak etkisi altında hesaplanan en büyük eksenel basınç kuvveti | N",
        "@symbol: f_ck | Betonun karakteristik silindir basınç dayanımı | N/mm²",
        "```",
        "",
        "> [!engineering] Birim tutarlılığı",
        "> `Ndm` kN olarak alınacaksa N'ye çevrilmeli veya tüm denklem tutarlı kN–m birim sisteminde yürütülmelidir. Birim hatası alan sonucunu 1000 kat saptırabilir."
      ),
      subsections: [],
    },
    {
      id: "ndm-nedir",
      title: "Ndm, yalnız sabit + hareketli düşey yük kolon kuvveti değildir",
      content: phase3Lines(
        "Yönetmelik `Ndm`'yi, TS 498'deki hareketli yük azaltma katsayıları da dikkate alınarak **G ve Q düşey yükler ile E deprem etkisinin ortak etkisi G+Q+E altında hesaplanan eksenel basınç kuvvetlerinin en büyüğü** olarak tanımlar.",
        "",
        "Bu nedenle programdaki yalnız `G+Q` servis kuvvetini veya tek bir deprem doğrultusunu seçerek 0.40 kontrolü yapmak doğru değildir. Tasarım modelinde ilgili deprem etkileri ve işaretleri arasından kolonu en fazla basınca götüren `Ndm` bulunmalıdır.",
        "",
        "> [!check] Rapor izi",
        "> Hesap raporunda kritik kolon için `Ac`, `fck`, belirleyici yük/deprem durumu ve kullanılan `Ndm` birlikte yazılırsa kontrolün yeniden üretilebilirliği artar."
      ),
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal örnek: alan koşulu ile minimum kenarı birlikte kontrol edin",
      content: phase3Lines(
        "C30 betonlu bir kolonda `Ndm = 2400 kN` olsun. `fck = 30 N/mm²` alınırsa gerekli brüt alan:",
        "",
        "`Ac,min = 2,400,000 / (0.40 × 30) = 200,000 mm² = 0.200 m²`",
        "",
        "| Aday kesit | Alan | 0.40 alan koşulu | 300 mm geometrik koşulu | Sonuç |",
        "|---|---:|---|---|---|",
        "| 400×500 mm | 200,000 mm² | sınırda sağlar | sağlar | kabul edilebilir başlangıç |",
        "| 300×650 mm | 195,000 mm² | sağlamaz | sağlar | yetersiz |",
        "| 250×800 mm | 200,000 mm² | sınırda sağlar | sağlamaz | yetersiz |",
        "",
        "> [!warning] Sınırda tasarım nihai karar değildir",
        "> Bu kontrol yalnız Bölüm 7'nin enkesit koşullarından biridir. Donatı, ikinci mertebe, güçlü kolon, kesme, birleşim, ötelenme ve diğer dayanım koşulları ayrıca sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "sinirli-suneklik",
      title: "Süneklik düzeyi sınırlı kolonlarda da 0.40 alan sınırı ve minimum boyutlar geçerlidir",
      content: phase3Lines(
        "7.7.1, süneklik düzeyi sınırlı kolon için eksenel basınç alan koşulunu Denklem 7.23 ile yine `Ac ≥ Ndm/(0.40 fck)` biçiminde verir. Ayrıca enkesit boyutları bakımından 7.3.1.1'deki 300 mm dikdörtgen minimum ve 350 mm dairesel çap koşullarını aynen geçerli kılar.",
        "",
        "> [!engineering] Yanlış genelleme",
        "> “0.40 yalnız yüksek sünek kolon içindir” ifadesi doğru değildir. Sınırlı sünek kolonların 7.7.1 hükmü aynı normalize eksenel basınç sınırını korur."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Dikdörtgen kolonun en küçük kenarı en az 300 mm mi?",
        "- Dairesel kolonda çap en az 350 mm mi?",
        "- Brüt kesit alanı Ac doğru geometriden hesaplanmış mı?",
        "- Ndm, G+Q+E ortak etkisi altında en büyük basınç kuvveti olarak seçilmiş mi?",
        "- TS 498 hareketli yük azaltma katsayılarının etkisi Ndm tanımında dikkate alınmış mı?",
        "- Ac ≥ Ndm/(0.40 fck) veya eşdeğer Ndm/(Ac fck) ≤0.40 koşulu sağlanıyor mu?",
        "- Kullanılan kuvvet ve dayanım birimleri tutarlı mı?",
        "- Sınırlı sünek kolonlarda da aynı 0.40 ve minimum boyut koşulları uygulanmış mı?",
        "- Kesit sınırda ise diğer kolon tasarım kontrolleri için yeterli rezerv bulunduğu ayrıca doğrulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.1 ve 7.7.1, Denklem (7.23)"),
  keywords: ["TBDY 2018", "kolon kesiti", "eksenel yük", "Ndm", "Ac", "fck", "0.40", "300 mm", "350 mm", "7.3.1"],
  tags: ["TBDY 2018", "Betonarme", "Kolon", "Eksenel Yük", "Ön Boyutlandırma"],
};
