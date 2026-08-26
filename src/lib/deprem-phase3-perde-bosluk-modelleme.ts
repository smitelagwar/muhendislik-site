import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_PERDE_BOSLUK_MODELLEME: DepremPhase3Override = {
  slug: "tbdy-betonarme-perde-bosluklari-modelleme",
  description: "TBDY 2018 Madde 4.5.3 ve 4.5.4'e göre perdelerdeki gerçek boşlukların kabuk modeline aktarılmasını, bağ kirişli perde ayrımını ve bağ derecesi katsayısı Ω kontrolünü açıklar.",
  seoTitle: "TBDY Perde Boşluklarının Modellenmesi | 4.5.3 ve 4.5.4",
  seoDescription: "Perde boşluklarında kabuk sonlu eleman modeli, bağ kirişli perde ayrımı, Denklem 4.13–4.15 ve Ω≥1/3 sınıflandırmasının proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "bosluk-geometrisi-yuk-yolu",
      title: "Boşluk, yalnız çizimde eksilen beton değil; perde rijitliğini ve kuvvet yolunu değiştiren geometridir",
      content: phase3Lines(
        "Kapı, pencere, şaft veya tesisat boşluğu perde kesitinde süreksizlik oluşturduğunda analiz modeli gerçek taşıyıcı geometriyi temsil etmelidir. TBDY 4.5.3.7, betonarme perdelerin düzlem içi ve düzlem dışı serbestlikleri içeren **kabuk sonlu elemanlar** ile modellenmesine izin verir ve sonlu eleman boyutlarının iç kuvvet dağılımını yeterli doğrulukta verecek şekilde seçilmesini ister.",
        "",
        "| Model kararı | SOURCE_VALUE | Mühendislik sonucu |",
        "|---|---|---|",
        "| Perde kabuk modeli | 4.5.3.7 | Boşluk sınırları gerçek geometri içinde temsil edilir |",
        "| Ağ boyutu | İç kuvvet dağılımını yeterli doğrulukta verecek | Boşluk köşesi ve dar perde parçaları kaba ağla geçilmez |",
        "| Kesit tesirleri | Enkesit ağırlık merkezinde bileşke | Tek düğüm gerilmesi doğrudan kesit tasarım kuvveti yapılmaz |",
        "",
        "> [!engineering] Yerel boşluk ile sistem sınıfını ayırın",
        "> Her mimari boşluk otomatik olarak bağ kirişli perde oluşturmaz. Önce gerçek kabuk geometrisini kurun; boşluk dizisinin iki perde parçasını bağ kirişleriyle birlikte tek sistem gibi çalıştırıp çalıştırmadığını 4.5.4 hükümleriyle ayrıca sınıflandırın."
      ),
      subsections: [],
    },
    {
      id: "kabuk-model-ve-ag",
      title: "4.5.3.7: Kabuk ağında boşluk kenarları ve perde parçaları çözüm geometrisinin parçasıdır",
      content: phase3Lines(
        "4.5.3.7(b), sonlu eleman boyutunun iç kuvvet dağılımını yeterli doğrulukta hesaplayacak şekilde seçilmesini zorunlu kılar. Bu hüküm boşluklu perdelerde özellikle önemlidir; boşluk köşeleri, dar boyun bölgeleri ve bağ kirişine dönüşen parçalar kuvvet akışının hızla değiştiği yerlerdir.",
        "",
        "4.5.3.7(d)'ye göre kabuk düğüm kuvvetlerinin bileşkeleri betonarme kesit hesabı için **enkesit ağırlık merkezinde** eşdeğer çubuk kesit tesirlerine dönüştürülür. Tasarım momenti, kesme ve eksenel kuvvet bu kesit tesirleri üzerinden izlenmelidir.",
        "",
        "> [!warning] Tekil pik sonucu tasarım kuvveti sanmayın",
        "> Boşluk köşesindeki tek bir sonlu eleman veya düğümde görülen yüksek gerilme, tek başına tüm perde kesitinin tasarım kuvveti değildir. Ağ yakınsaması ve kesit bileşkeleri birlikte okunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "bag-kirisli-perde-ayrimi",
      title: "4.5.4.1: Sürekli boşluk dizisi iki perde parçasını bağ kirişleriyle birleştiriyorsa bağ kirişli sistem gündeme gelir",
      content: phase3Lines(
        "TBDY 4.5.4.1, bağ kirişli (boşluklu) perdeyi iki boşluksuz perde parçasının kısa ve yüksek kesme dayanımlı bağ kirişleri ile bağlanarak **birlikte tek perde olarak çalıştığı** sistem olarak tanımlar. Perde parçaları dikdörtgen olabileceği gibi U veya C biçimli de olabilir.",
        "",
        "Bu nedenle tek katlı küçük bir tesisat deliği ile katlar boyunca düzenli açıklıkların oluşturduğu iki perde ayağı aynı modelleme kararı değildir. İkinci durumda bağ kirişlerinin kesme etkisi, perde parçalarında karşılıklı çekme-basınç eksenel kuvvetleri üretir ve sistem taban devrilme momentine birlikte katkı verir.",
        "",
        "> [!check] Ön sınıflandırma",
        "> Boşlukların katlar boyunca sürekliliğini, boşluklar arasındaki elemanın gerçek bağ kirişi davranışını ve iki perde parçasının ortak taban devrilme mekanizmasını kontrol etmeden `coupled wall` etiketi vermeyin."
      ),
      subsections: [],
    },
    {
      id: "bag-derecesi-katsayisi",
      title: "Denklem 4.13–4.15: Bağ kirişli perde sınıfı Ω bağ derecesi katsayısıyla doğrulanır",
      content: phase3Lines(
        "4.5.4.3'e göre bağ kirişli perdenin taban devrilme momenti `MDEV = M1 + M2 + cNV` olarak yazılır. 4.5.4.4 ve 4.5.4.5 ise bağ kirişlerinin perde parçaları arasında oluşturduğu eksenel kuvvet çiftinin toplam devrilme momentindeki payını Ω ile tanımlar.",
        "",
        "```formula",
        "@label: TBDY Denklem (4.14) — bağ derecesi katsayısı",
        "Ω = c N_V / M_DEV = c N_V / (M_1 + M_2 + c N_V)",
        "@symbol: Ω | Bağ derecesi katsayısı | -",
        "@symbol: c | Perde parçalarının enkesit ağırlık merkezleri arasındaki uzaklık | m",
        "@symbol: N_V | Bağ kirişi kesmelerinden perde tabanında oluşan eşit çekme-basınç eksenel kuvveti | kN",
        "@symbol: M_DEV | Bağ kirişli perdenin tabanındaki toplam devrilme momenti | kN·m",
        "@symbol: M_1 | Birinci perde parçasının taban eğilme momenti | kN·m",
        "@symbol: M_2 | İkinci perde parçasının taban eğilme momenti | kN·m",
        "```",
        "",
        "Bağ kirişli perde tanımı için **Ω ≥ 1/3** koşulu sağlanmalıdır. Sağlanmıyorsa perde parçalarının her biri boşluksuz perde sayılır. Ayrıca perde parçalarında aşırı eksenel kuvvet oluşmasını sınırlamak amacıyla **Ω ≤ 2/3** koşulunun da sağlanmasına çalışılması istenir.",
        "",
        "> [!regulation] Sınıflandırma sonucu model kararını değiştirir",
        "> Ω kontrolü yalnız raporlanacak bir oran değildir; 1/3 sınırı sağlanmıyorsa sistemin iki ayrı boşluksuz perde olarak ele alınması gerekir."
      ),
      subsections: [],
    },
    {
      id: "perde-parcasi-bag-kirisi-modeli",
      title: "Perde parçaları ve bağ kirişleri aynı modelde farklı sonlu eleman idealizasyonları kullanabilir",
      content: phase3Lines(
        "4.5.4.6, bağ kirişli perdeyi oluşturan perde parçalarının 4.5.3.7 veya 4.5.3.8'e göre modellenmesini ister. 4.5.4.7'ye göre bağ kirişleri ise çubuk eleman olarak modellenebilir ve etkin kesit rijitlikleri 4.5.8'e göre belirlenir.",
        "",
        "Perdeyi kabuk, bağ kirişini çubuk elemanla modellemek mümkündür; ancak düğüm bağlantıları, eksen kaçıklıkları ve rijit bölgeler kuvvet aktarımını bozmamalıdır. Bağ kirişi uç kuvvetleri perde parçalarına fiziksel birleşim bölgesinden aktarılmalıdır.",
        "",
        "> [!engineering] Model sürekliliği",
        "> Kabuk ağındaki boşluk kenarı ile bağ kirişi çubuk ekseninin yalnız ekranda çakışması yeterli değildir. Serbestlik dereceleri ve bağlantı kinematiği ortak kuvvet yolunu gerçekten kurmalıdır."
      ),
      subsections: [],
    },
    {
      id: "proje-sonuc-okuma",
      title: "Boşluklu perde sonuçlarını kat ve kesit bazında bileşke kuvvetlerle okuyun",
      content: phase3Lines(
        "Boşluk çevresindeki yerel gerilme dağılımı ağ hassasiyetine duyarlı olabilir. Nihai betonarme tasarımda perde parçasının eksenel kuvveti, eğilme momenti ve kesmesi ile bağ kirişi kesme/momentleri kat bazında izlenmeli; tabandaki ortak `MDEV` ve Ω hesabı aynı yükleme durumuna ait tutarlı sonuçlardan kurulmalıdır.",
        "",
        "Mimari revizyonla boşluk boyutu veya yeri değiştiğinde yalnız mesh yenilenmiş sayılmaz; perde parçası boyutları, bağ kirişi açıklığı/yüksekliği, etkin rijitlik ve Ω sınıflandırması yeniden kontrol edilmelidir.",
        "",
        "> [!warning] Sonradan açılan boşluk",
        "> Taşıyıcı perdede projede bulunmayan bir kapı veya tesisat boşluğu, statik model ve betonarme detay yeniden doğrulanmadan saha kararıyla açılamaz."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Perde üzerindeki tüm taşıyıcı boşluklar gerçek analiz geometrisine aktarılmış mı?",
        "- Kabuk sonlu eleman ağı 4.5.3.7(b)'deki yeterli doğruluk koşulunu boşluk köşelerinde de sağlıyor mu?",
        "- Kesit tasarım kuvvetleri 4.5.3.7(d)'ye uygun biçimde enkesit ağırlık merkezinde bileşke olarak okunuyor mu?",
        "- Her boşluk otomatik bağ kirişli perde sayılmadan 4.5.4.1 çalışma mekanizması kontrol edilmiş mi?",
        "- `MDEV = M1 + M2 + cNV` Denklem (4.13) ile aynı yükleme durumu için kurulmuş mu?",
        "- Denklem (4.14) ile Ω hesaplanmış ve **Ω ≥ 1/3** koşulu doğrulanmış mı?",
        "- Aşırı eksenel kuvvetleri sınırlamak için **Ω ≤ 2/3** hedefi ayrıca kontrol edilmiş mi?",
        "- Perde parçaları 4.5.3.7/4.5.3.8'e, bağ kirişleri 4.5.4.7 ve 4.5.8'e uygun modellenmiş mi?",
        "- Mimari veya tesisat revizyonu sonrası boşluk geometrisi ve sistem sınıfı yeniden doğrulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 4; Madde 4.5.3.7–4.5.3.8 ve 4.5.4.1–4.5.4.7, Denklem (4.13)–(4.15)"),
  keywords: ["TBDY 2018", "perde boşluğu", "kabuk sonlu eleman", "bağ kirişli perde", "Ω", "Denklem 4.14", "4.5.4"],
  tags: ["TBDY 2018", "Betonarme", "Perde", "Modelleme", "Bağ Kirişi"],
};