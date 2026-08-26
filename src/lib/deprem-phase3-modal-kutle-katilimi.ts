import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_MODAL_KUTLE_KATILIMI: DepremPhase3Override = {
  slug: "tbdy-yeterli-mod-modal-kutle-katilimi",
  description: "TBDY 2018 Madde 4.8.1.2 ve Denklem 4.30'a göre modal analizde yeterli titreşim modu sayısının, X ve Y doğrultularındaki taban kesme kuvveti modal etkin kütleleri üzerinden %95 kuralı ve %3 katkı eşiğiyle nasıl belirlendiğini açıklar.",
  seoTitle: "TBDY Yeterli Mod Sayısı ve Modal Kütle Katılımı | Denklem 4.30",
  seoDescription: "Modal analizde %95 etkin kütle kuralı, katkısı %3'ten büyük modların zorunlu katılımı ve X/Y için ortak mod sayısı; TBDY 4.8.1.2 teknik rehberi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "yeterli-mod-karari",
      title: "Mod sayısı sabit bir sayı değil, sonuçtan türetilen bir kriterdir",
      content: phase3Lines(
        "TBDY 4.8.1.2, modal hesapta “10 mod”, “kat sayısının üç katı” gibi sabit bir adet vermez. Yeterli titreşim modu sayısı **YM**, her iki yatay deprem doğrultusunda taban kesme kuvveti modal etkin kütlelerinin birikimli toplamı üzerinden belirlenir.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> X ve Y doğrultularında modal etkin kütleleri biriktirin; her iki doğrultuda toplam bina kütlesinin en az %95'ine ulaşın; katkısı %3'ten büyük olan bütün modları mutlaka dahil edin; X ve Y için bulunan YM değerlerinden **büyüğünü** üç boyutlu modelde kullanın."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-30",
      title: "Denklem 4.30: her iki doğrultuda en az %95",
      content: phase3Lines(
        "Denklem 4.30, X ve Y doğrultularındaki taban kesme kuvveti modal etkin kütlelerinin toplamını bina toplam kütlesi `mt` ile karşılaştırır.",
        "",
        "```formula",
        "@label: TBDY 4.8.1.2 — Denklem (4.30)",
        "Σ_(n=1..YM) m_txn^(X) ≥ 0.95 m_t",
        "Σ_(n=1..YM) m_tyn^(Y) ≥ 0.95 m_t",
        "@symbol: YM | Hesaba katılması gereken yeterli titreşim modu sayısı | adet",
        "@symbol: m_txn^(X) | n'inci modun X doğrultusu taban kesme kuvveti modal etkin kütlesi | t",
        "@symbol: m_tyn^(Y) | n'inci modun Y doğrultusu taban kesme kuvveti modal etkin kütlesi | t",
        "@symbol: m_t | Binanın toplam kütlesi | t",
        "```",
        "",
        "> [!regulation] Kritik ek koşul",
        "> %95 koşulu tek başına yeterli değildir. Madde 4.8.1.2(a), **katkısı %3'ten büyük olan bütün modların** göz önüne alınmasını ayrıca zorunlu kılar."
      ),
      subsections: [],
    },
    {
      id: "yuzde-3-kurali",
      title: "%3 katkı kuralı neden ayrıca kontrol edilir?",
      content: phase3Lines(
        "Birikimli etkin kütle oranı %95'e erken ulaşsa bile, daha sonraki bir modun ilgili doğrultudaki katkısı %3'ten büyükse bu mod hesap dışında bırakılamaz. Böylece yalnız toplam oranı tutturup yapısal davranışa anlamlı katkı yapan bir modu atlama riski azaltılır.",
        "",
        "| Kontrol | Doğru okuma | Yanlış uygulama |",
        "|---|---|---|",
        "| Birikimli oran | X ve Y ayrı ayrı ≥ %95 | Sadece X'i kontrol etmek |",
        "| Tekil mod katkısı | > %3 olan bütün modları dahil etmek | %95'e ulaşınca kontrolü tamamen durdurmak |",
        "| 3B modelde YM | X/Y için gereken sayılardan büyüğünü kullanmak | Her doğrultuda farklı mod kesme sayısıyla sonuç zarfı üretmek |",
        "",
        "> [!warning] Yazılım raporu",
        "> Programın “modal participating mass ratio” tablosunda hangi büyüklüğü raporladığını doğrulayın. TBDY 4.8.1.2'nin ifadesi **taban kesme kuvveti modal etkin kütleleri** üzerindendir; benzer isimli fakat farklı tanımlı bir yazılım çıktısını otomatik olarak eşdeğer kabul etmeyin."
      ),
      subsections: [],
    },
    {
      id: "ornek-mod-secimi",
      title: "Çözümlü örnek: X ve Y için farklı YM çıkarsa",
      content: phase3Lines(
        "**ASSUMPTION:** Bir modelde ilk 12 mod sonunda X doğrultusunda birikimli oran %96.2, Y doğrultusunda %91.8 olsun. 16'ncı moda kadar genişletildiğinde Y oranı %95.4'e ulaşsın. Ayrıca 18'inci modun Y doğrultusu katkısı %3.4 olsun.",
        "",
        "1. X için %95 koşulu 12 modda sağlanmıştır.",
        "2. Y için %95 koşulu 16 modda sağlanmıştır.",
        "3. Ancak 18'inci modun katkısı %3'ten büyük olduğundan 18'inci mod da hesaba katılmalıdır.",
        "4. Üç boyutlu hesapta kullanılacak yeterli mod sayısı en az **YM = 18** olur.",
        "",
        "> [!engineering] Sonuç yorumu",
        "> Örnekteki oranlar ASSUMPTION'dır. Yönetmelik SOURCE_VALUE'ları %95 birikimli eşik, %3 tekil katkı eşiği ve X/Y için bulunan YM'lerin büyüğünün kullanılması kuralıdır."
      ),
      subsections: [],
    },
    {
      id: "model-sorunlarini-okuma",
      title: "Yeterli mod sayısına ulaşamamak model hakkında ne söyler?",
      content: phase3Lines(
        "Mod sayısını artırmak çoğu zaman birikimli katılımı yükseltir; ancak beklenmedik derecede çok moda ihtiyaç duyulması veya belirli doğrultuda katılımın takılması, modeldeki kütle/serbestlik tanımları, diyafram kabulü, lokal titreşimler veya çok esnek ikincil parçalar açısından ayrıca incelenmelidir.",
        "",
        "| Gözlem | Kontrol edilecek olası neden |",
        "|---|---|",
        "| X yüksek, Y düşük katılım | Y doğrultusu rijitlik/kütle dağılımı ve serbestlikler |",
        "| Çok sayıda lokal mod | Kabuk ağları, ikincil elemanlar, lokal serbestlikler |",
        "| Beklenmedik torsiyon modları | Kütle merkezi, diyafram, rijitlik dağılımı |",
        "| Toplam kütle ile modal rapor uyumsuz | Kütle kaynağı ve düğüm/kat kütlesi tanımları |",
        "",
        "> [!check] Yaklaşım",
        "> Yeterli mod sayısı kriterini yalnız “PASS” kutusu olarak değil, modelin dinamik davranışını doğrulayan bir teşhis aracı olarak kullanın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Toplam bina kütlesi mt kütle kaynağıyla tutarlı mı?",
        "- X doğrultusunda birikimli modal etkin kütle ≥ %95 mi?",
        "- Y doğrultusunda birikimli modal etkin kütle ≥ %95 mi?",
        "- Katkısı %3'ten büyük bütün modlar dahil edildi mi?",
        "- X ve Y için bulunan YM değerlerinden büyüğü 3B modelde kullanıldı mı?",
        "- Mod sırası artırıldığında sonuçlarda beklenmedik sıçrama var mı?",
        "- Lokal/torsiyon modları mühendislik açısından incelendi mi?",
        "- Kullanılan yazılım çıktısının TBDY'deki modal etkin kütle tanımıyla uyumu doğrulandı mı?",
        "- Hesap raporunda birikimli katılım tablosu ve seçilen YM açıkça gösterildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.8.1.2 ve Denklem (4.30); EK 4B"),
  keywords: ["TBDY 2018", "modal kütle", "yeterli mod sayısı", "Denklem 4.30", "%95", "%3", "etkin kütle", "titreşim modu", "YM"],
  tags: ["TBDY 2018", "Modal Analiz", "Etkin Kütle", "Titreşim Modu"],
};
