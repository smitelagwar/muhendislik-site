import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_BETONARME_ANALIZ: DepremPhase3Override = {
  slug: "tbdy-2018-betonarme-analiz",
  description: "TBDY 2018 Bölüm 4'e göre betonarme bina analiz modelinin perde, döşeme diyaframı, etkin kesit rijitliği, kütle ve ek dışmerkezlik kabullerinin birbiriyle tutarlı kurulmasını proje kontrol sırasıyla açıklar.",
  seoTitle: "TBDY 2018 Betonarme Analiz Modeli | Bölüm 4 Kontrol Rehberi",
  seoDescription: "Perde kabuk/eşdeğer çubuk modeli, diyafram seçimi, Tablo 4.2 etkin rijitlikleri, kütle modeli ve ek dışmerkezlik için TBDY 2018 analiz kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "model-davranis-hipotezi",
      title: "Analiz modeli çizimin dijital kopyası değil, yapının deprem davranışı için kurulan mekanik hipotezdir",
      content: phase3Lines(
        "TBDY Bölüm 4'teki modelleme hükümleri eleman tipini, serbestlik derecelerini, etkin rijitliği, kütleyi ve diyafram davranışını ayrı başlıklar halinde tanımlar. Bu kabuller birlikte tutarlı değilse analiz programının ürettiği ayrıntılı sonuçlar fiziksel sistemi doğru temsil etmeyebilir.",
        "",
        "| Model audit başlığı | SOURCE_VALUE | Kontrol sorusu |",
        "|---|---|---|",
        "| Perde idealizasyonu | 4.5.3.7 / 4.5.3.8 | Kabuk mu, eşdeğer çubuk mu ve geometrik sınır sağlanıyor mu? |",
        "| Döşeme diyaframı | 4.5.6 | Rijit diyafram varsayımı plan/düzensizlik koşullarıyla uyumlu mu? |",
        "| Etkin kesit rijitliği | 4.5.8, Tablo 4.2 | Doğru eleman ve davranış bileşenine uygulanmış mı? |",
        "| Kütle modeli | 4.5.9, Denklem (4.16) | Yayılı yüklerden düğüm/kat kütlesine geçiş tutarlı mı? |",
        "| Ek dışmerkezlik | 4.5.10 | Rijitlik ve kütle belirsizliği modelde hesaba katılmış mı? |",
        "",
        "> [!engineering] Audit sırası",
        "> İç kuvvetlere bakmadan önce geometri → eleman idealizasyonu → rijitlik → diyafram → kütle → deprem etkisi zincirini doğrulayın. Yanlış model kabulünü sonradan donatı artırarak düzeltmek mümkün değildir."
      ),
      subsections: [],
    },
    {
      id: "perde-modelleme-secimi",
      title: "4.5.3.7–4.5.3.8: Perde için kabuk model ana seçenek; eşdeğer çubuk yalnız tanımlı geometrik sınır içinde kullanılabilir",
      content: phase3Lines(
        "4.5.3.7, dikdörtgen, I, T, L, U veya C betonarme perdelerin düzlem içi ve düzlem dışı serbestlikleri içeren kabuk sonlu elemanlarla modellenmesini tanımlar. Kabuk düğüm kuvvetlerinin bileşkeleri betonarme tasarım için enkesit ağırlık merkezinde kesit tesirlerine dönüştürülür.",
        "",
        "4.5.3.8'e göre plandaki en büyük perde kolu uzunluğunun toplam perde yüksekliğine oranı **1/2**'yi aşmıyorsa perde, ekseni enkesit ağırlık merkezinden geçen eşdeğer çubuk sonlu elemanla da modellenebilir. Bu durumda kat seviyesindeki bağlantı düğümleri üç boyutlu rijit cisim hareketi koşuluyla ana düğüme bağlanır.",
        "",
        "> [!warning] Eşdeğer çubuk her perde için kısa yol değildir",
        "> `Pier` sonucu almak ile perdeyi eşdeğer çubuk olarak modellemek aynı şey değildir. 4.5.3.8'in 1/2 geometrik sınırı ve kinematik bağlantı koşulları sağlanmadan bu idealizasyon kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "doseme-diyafram-modeli",
      title: "4.5.6: Diyafram kararı, kat kuvvetlerinin düşey taşıyıcılara nasıl dağıtılacağını belirler",
      content: phase3Lines(
        "4.5.6.2; A2/A3 düzensizliği bulunan, rijit diyafram davranışı beklenmeyen veya betonarme kirişsiz döşemeli sistemlerde döşemelerin iki boyutlu sonlu elemanlarla modellenmesini ister. 4.5.6.3 ise A2/A3 bulunmayan ve düzlem içi önemli şekil değiştirme beklenmeyen düzenli planlarda rijit diyafram modeline izin verir.",
        "",
        "Diyafram seçimi yalnız kat ötelenmesini değil, kolon ve perdelere giden kesme dağılımını, ek dışmerkezlik uygulamasını ve döşeme içi aktarım kuvvetlerinin nasıl hesaplanacağını etkiler.",
        "",
        "> [!check] Model raporu",
        "> Her katta kullanılan diyafram tipini, büyük boşlukları ve rijit diyafram kabulünün gerekçesini raporda açıkça kaydedin."
      ),
      subsections: [],
    },
    {
      id: "etkin-kesit-rijitlikleri",
      title: "4.5.8 ve Tablo 4.2: Betonarme model brüt kesit rijitliğiyle bırakılmaz",
      content: phase3Lines(
        "Dayanıma Göre Tasarım kapsamında 4.5.8.1, **Tablo 4.2** etkin kesit rijitliği çarpanlarının kullanılmasını zorunlu tutar; 4.5.8.2 tablodaki ilgili iki çarpanın da modelde dikkate alınmasını ister. 4.5.8.3 bu çarpanların deprem etkili yük birleşimleri ve bu birleşimlere giren yükler altındaki hesaplara uygulanacağını belirtir.",
        "",
        "Örnek olarak Tablo 4.2'de çerçeve kirişi eğilme rijitliği için `0.35`, çerçeve kolonu için `0.70`, eşdeğer çubuk perde eğilme rijitliği için `0.50` çarpanı verilir; kesme bileşenleri aynı satırda ayrıca tanımlanır.",
        "",
        "> [!engineering] Tam Tablo 4.2 başka bir source-of-truth makalede tutuluyor",
        "> Bu genel analiz rehberinin amacı tüm katsayıları tekrar listelemek değil, rijitlik kabulünü model audit zincirine yerleştirmektir. Eleman bazlı tam uygulama için mevcut `tbdy-etkin-kesit-rijitlikleri` teknik makalesi ayrı source-of-truth olarak korunur."
      ),
      subsections: [],
    },
    {
      id: "kutle-modeli",
      title: "4.5.9: Kütleler yayılı yüklerden düğüm veya kat kütlesine tutarlı biçimde dönüştürülmelidir",
      content: phase3Lines(
        "4.5.9.1, çubuk/levha/kabuk elemanlarda düğüm kütlelerinin bağlı sonlu elemanların kapsama alanlarındaki yayılı kütlelerin bileşkeleri olarak atanmasını tarif eder. 4.5.9.2'de **Denklem (4.16)** sabit ve hareketli yüklerden düğüm ağırlığı/kütlesi kurulmasını tanımlar ve hareketli yük kütle katılım katsayısı `n` Tablo 4.3'ten alınır.",
        "",
        "4.5.9.3'e göre rijit diyafram modelinde kat kütlesi kat kütle merkezindeki ana düğümde, iki yatay öteleme ve düşey eksen etrafında dönme olmak üzere üç düzlem içi rijit hareket serbestlik derecesine karşı gelecek biçimde tanımlanır.",
        "",
        "> [!warning] Kütle ile yükü aynı şey sanmayın",
        "> Analizde tanımlanan yük kombinasyonları ile dinamik kütle kaynağı ayrı veri katmanlarıdır. Kütle kaynağını yalnız toplam bina ağırlığına bakarak değil, kat ve düğüm dağılımı üzerinden de denetleyin."
      ),
      subsections: [],
    },
    {
      id: "ek-dismerkezlik",
      title: "4.5.10: Ek dışmerkezlik, rijitlik ve kütle dağılımındaki belirsizliğin model içindeki karşılığıdır",
      content: phase3Lines(
        "4.5.10.1, deprem yer hareketinin etkisindeki ve taşıyıcı sistemin rijitlik/kütle dağılımındaki olası belirsizlikleri temsil etmek üzere **ek dışmerkezlik etkisini** tanımlar. Rijit diyafram kullanıldığında 4.5.10 hükümleri kat kütle merkezi ve diyafram kinematiğiyle birlikte uygulanır.",
        "",
        "Bu kontrol, plandaki gerçek kütle merkezi ile rijitlik merkezinin hesaplanan farkının yerine geçen bir kavram değildir; yönetmeliğin belirsizliği ayrıca hesaba katma mekanizmasıdır.",
        "",
        "> [!check] İki ayrı kavram",
        "> Gerçek geometrik/rijitlik eksantrisitesi modelden doğar; ek dışmerkezlik ise TBDY'nin ayrıca öngördüğü etkidir. Yazılım raporunda ikisinin nasıl uygulandığını doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "sonuc-audit-zinciri",
      title: "Sonuç kontrolü: iç kuvvetten önce model kabullerinin izlenebilirliğini tamamlayın",
      content: phase3Lines(
        "Model doğrulandıktan sonra taban kesmeleri, kat ötelenmeleri, burulma/düzensizlik göstergeleri, perde-kolon kuvvet payları ve eleman iç kuvvetleri yükleme durumu bazında karşılaştırılır. Beklenmeyen tekil sonuçta ilk refleks donatı büyütmek değil, kütle-rijitlik-diyafram-yük yolu zincirini yeniden okumaktır.",
        "",
        "Model revizyonu yapıldığında yalnız değişen elemanın sonuçlarına bakılmamalıdır. Perde eklemek veya diyafram idealizasyonunu değiştirmek modal özellikleri, kat kuvvet dağılımını ve komşu eleman taleplerini birlikte değiştirebilir.",
        "",
        "> [!engineering] İkinci kontrol",
        "> Yazılımın otomatik yönetmelik kontrolü, modelin doğru kurulduğunu kanıtlamaz. Kritik model kabullerini bağımsız kontrol tablosunda madde numarası ve kullanılan değerle birlikte kayıt altına alın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Kiriş/kolon/perde eleman tipleri ve serbestlik dereceleri gerçek taşıyıcı davranışla uyumlu mu?",
        "- Perdeler 4.5.3.7'ye göre kabuk veya koşulları sağlanıyorsa 4.5.3.8'e göre eşdeğer çubuk olarak doğru idealize edilmiş mi?",
        "- Eşdeğer çubuk perde kullanılıyorsa en büyük perde kolu / toplam perde yüksekliği oranı **1/2** sınırını aşıyor mu?",
        "- Döşeme modeli 4.5.6.2–4.5.6.3 koşullarına göre rijit diyafram veya iki boyutlu sonlu eleman olarak seçilmiş mi?",
        "- 4.5.8 ve Tablo 4.2 etkin kesit rijitlikleri doğru eleman/bileşen ve doğru yük durumlarında uygulanmış mı?",
        "- Kütle modeli 4.5.9 ve Denklem (4.16) ile uyumlu mu?",
        "- Rijit diyafram kat kütleleri kütle merkezindeki üç düzlem içi rijit hareket serbestliğiyle tanımlanmış mı?",
        "- 4.5.10 ek dışmerkezlik etkisi ile gerçek eksantrisite birbirine karıştırılmadan uygulanmış mı?",
        "- Model revizyonu sonrası modal özellikler, kat kuvvetleri ve eleman talepleri yeniden kontrol edilmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 4; Madde 4.5.3, 4.5.6, 4.5.8, 4.5.9 ve 4.5.10"),
  keywords: ["TBDY 2018", "betonarme analiz", "modelleme", "etkin kesit rijitliği", "diyafram", "kütle modeli", "ek dışmerkezlik"],
  tags: ["TBDY 2018", "Analiz", "Modelleme", "Betonarme", "Deprem"],
};