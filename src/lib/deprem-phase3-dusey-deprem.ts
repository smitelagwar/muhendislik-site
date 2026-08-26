import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DUSEY_DEPREM: DepremPhase3Override = {
  slug: "tbdy-dusey-deprem-etkisi",
  description: "TBDY 2018 Madde 4.4.3'e göre düşey deprem etkisinin hangi binalarda yerel düşey titreşim modlarıyla hesaplanacağını, hangi durumlarda Denklem 4.10 ile yaklaşık alınacağını ve yük birleşimlerine nasıl girdiğini açıklar.",
  seoTitle: "TBDY Düşey Deprem Etkisi | Madde 4.4.3 ve Denklem 4.10",
  seoDescription: "20 m kiriş, 5 m konsol, kirişe oturan veya eğik kolon koşulları; düşey spektrum, R/I=1, D=1, Denklem 4.10 ve yük birleşimleri için teknik rehber.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "karar-akisi",
      title: "Düşey deprem etkisinde önce bina ve eleman koşulunu sınıflandırın",
      content: phase3Lines(
        "TBDY 4.4.3 düşey deprem etkisini iki hesap yoluna ayırır. **DTS = 1, 1a, 2 veya 2a** olan ve 4.4.3.1'de sayılan özel elemanları içeren binalarda, yalnız ilgili elemanlar için düşey deprem hesabı yerel düşey titreşim modları esas alınarak yapılır. Bunun dışındaki taşıyıcı sistem kısımlarında ve bu tanımın dışındaki binalarda 4.4.3.2'deki yaklaşık ifade kullanılır.",
        "",
        "> [!engineering] Mühendis için hızlı özet",
        "> 1) DTS'yi doğrulayın. 2) 20 m ve üzeri kiriş, 5 m ve üzeri konsol, kirişe oturan kolon veya düşeye göre eğik kolon var mı kontrol edin. 3) 4.4.3.1 kapsamındaysa ilgili elemanın yerel düşey modlarını ve düşey elastik spektrumu kullanın. 4) Diğer kısımlarda Denklem 4.10'u uygulayın. 5) Ed(Z)'yi 4.4.4'teki depremli yük birleşimlerine doğru işaretle taşıyın."
      ),
      subsections: [],
    },
    {
      id: "ozel-dinamik-hesap",
      title: "4.4.3.1: düşey spektrumla özel dinamik hesap gerektiren dört durum",
      content: phase3Lines(
        "Özel düşey dinamik hesap şartı yalnız açıklık büyüklüğüne bağlanmaz; elemanın düşey titreşime duyarlı taşıyıcı düzeni de kapsam içindedir.",
        "",
        "| 4.4.3.1 koşulu | SOURCE_VALUE | Hesap yaklaşımı |",
        "|---|---:|---|",
        "| Kiriş açıklığının yataydaki izdüşümü | ≥ 20 m | İlgili elemanın yerel düşey modları |",
        "| Konsol açıklığının yataydaki izdüşümü | ≥ 5 m | İlgili elemanın yerel düşey modları |",
        "| Kolonun kirişe oturması | Koşul varsa | İlgili elemanın yerel düşey modları |",
        "| Kolonun düşeye göre eğimli olması | Koşul varsa | İlgili elemanın yerel düşey modları |",
        "",
        "Bu hesap 2.3.5'te tanımlanan **düşey elastik ivme spektrumu** ve 4.8.2'deki Mod Birleştirme Yöntemi ile yapılır. Düşey deprem etkisi Ed(Z) belirlenirken tüm taşıyıcı sistemler için **R/I = 1** ve **D = 1** alınır.",
        "",
        "> [!warning] Kapsamı gereksiz genişletmeyin",
        "> 4.4.3.1 metni, özel düşey modal hesabı tüm binaya otomatik olarak yaymaz; sayılan elemanlar için yerel düşey titreşim modlarını esas alır. Buna karşılık diğer taşıyıcı sistem kısımlarındaki Ed(Z) etkisi 4.4.3.2'ye göre ayrıca göz önüne alınır."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-10",
      title: "4.4.3.2 ve Denklem 4.10: diğer kısımlar için yaklaşık düşey deprem etkisi",
      content: phase3Lines(
        "4.4.3.1 kapsamındaki elemanların dışındaki taşıyıcı sistem kısımlarında ve 4.4.3.1 tanımının dışındaki binalarda özel bir düşey modal hesap yapılmadan Denklem 4.10 kullanılır.",
        "",
        "```formula",
        "@label: TBDY 4.4.3.2 — Denklem (4.10)",
        "E_d^(Z) ≈ (2/3) S_DS G",
        "@symbol: E_d^(Z) | Tasarıma esas düşey deprem etkisi | etki birimi",
        "@symbol: S_DS | Kısa periyot tasarım spektral ivme katsayısı | boyutsuz",
        "@symbol: G | Sabit yük etkisi | etki birimi",
        "```",
        "",
        "**Çözümlü kontrol örneği — ASSUMPTION:** Bir mesnet kesitinde sabit yük etkisi `G = 500 kN` ve proje için `SDS = 1.05` olsun. Yaklaşık düşey deprem etkisinin büyüklüğü `(2/3) × 1.05 × 500 = 350 kN` olur. Buradaki 500 kN ve 1.05 örnek girdidir; **2/3 katsayısı ve SDS kullanımı SOURCE_VALUE** olarak Denklem 4.10'dan gelir.",
        "",
        "> [!check] Etki kavramı",
        "> G burada yalnız toplam bina ağırlığı anlamında okunmamalıdır; incelenen tasarım büyüklüğüne karşı gelen sabit yük **etkisidir**. Yazılımda Ed(Z) üretilirken kuvvet, moment veya reaksiyon bileşenlerinin aynı etki mantığında izlenmesi gerekir."
      ),
      subsections: [],
    },
    {
      id: "yuk-birlesimleri",
      title: "Ed(Z) yük birleşimlerine nasıl girer?",
      content: phase3Lines(
        "Madde 4.4.4.1, taşıyıcı sistem elemanlarının tasarımında deprem etkisini içeren temel birleşimleri Denklem 4.11 ve 4.12 ile tanımlar. Bu birleşimlerde yatay deprem etkisi Ed(H) 4.4.2'ye, düşey deprem etkisi Ed(Z) ise 4.4.3'e göre belirlenir.",
        "",
        "| Birleşim | Düşey deprem bileşeni | Kontrol mantığı |",
        "|---|---:|---|",
        "| `G + Q + 0.2S + Ed(H) + 0.3Ed(Z)` | +0.3 Ed(Z) | Basınç/moment/kesme zarfında elverişsiz sonuç |",
        "| `0.9G + H + Ed(H) − 0.3Ed(Z)` | −0.3 Ed(Z) | Özellikle kaldırma/çekme eğilimi ve düşük düşey sabit yük hali |",
        "",
        "> [!warning] İki ayrı yüzdeyi karıştırmayın",
        "> Buradaki `0.3Ed(Z)`, 4.4.4 depremli yük birleşimindeki **düşey deprem etkisi katsayısıdır**. 4.4.2'deki X–Y yatay doğrultu birleşiminde kullanılan %30 ile aynı işlem değildir."
      ),
      subsections: [],
    },
    {
      id: "model-ve-sonuc-kontrolu",
      title: "Yerel düşey mod ve sonuç kontrolünde ne aranmalı?",
      content: phase3Lines(
        "Uzun açıklıklı kiriş, büyük konsol, transfer niteliğinde kirişe oturan kolon veya eğik kolon bulunan sistemlerde düşey dinamik davranış, global yatay modlardan farklı yerel şekiller üretebilir. Modelin ilgili elemanın düşey serbestliklerini, kütle dağılımını ve mesnet koşullarını gerçekçi temsil etmesi gerekir.",
        "",
        "| Kontrol | Olası modelleme hatası |",
        "|---|---|",
        "| Yerel düşey mod şekli | Eleman düşey serbestliği yanlış kısıtlanmış olabilir |",
        "| Kütle kaynağı | Düşey titreşime katılan sabit/hareketli kütle eksik veya çift olabilir |",
        "| R/I ve D | Yatay sistem değerleri yanlışlıkla düşey hesaba taşınmış olabilir |",
        "| Mesnet reaksiyonu | Ed(Z) işaret değişimi kaldırma veya basınç artışını değiştirebilir |",
        "| Kiriş/konsol momenti | Düşey deprem etkisi açıklık ve mesnet zarfını değiştirebilir |",
        "",
        "> [!engineering] Proje notu",
        "> Özel düşey modal hesap kullanılan elemanları hesap raporunda açıkça listeleyin. Böylece hangi elemanda 4.4.3.1, hangi bölümde 4.4.3.2 uygulandığı denetlenebilir olur."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- DTS = 1, 1a, 2 veya 2a koşulu doğru belirlendi mi?",
        "- Yatay izdüşümü 20 m veya daha fazla kiriş var mı?",
        "- Yatay izdüşümü 5 m veya daha fazla konsol var mı?",
        "- Kirişe oturan kolon veya düşeye göre eğimli kolon bulunuyor mu?",
        "- 4.4.3.1 kapsamındaki elemanlarda yerel düşey titreşim modları ve 2.3.5 düşey spektrumu kullanılıyor mu?",
        "- Özel düşey hesapta R/I = 1 ve D = 1 uygulanıyor mu?",
        "- Diğer taşıyıcı sistem kısımlarında Denklem 4.10 ile Ed(Z) göz önüne alındı mı?",
        "- SDS ile harita ham parametreleri karıştırılmadı mı?",
        "- Ed(Z), Denklem 4.11 ve 4.12 yük birleşimlerine ±0.3 katsayısıyla doğru taşındı mı?",
        "- Düşey %30 ile yatay X–Y %100/%30 doğrultu birleştirmesi birbirine karıştırılmadı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.4.3–4.4.4; Denklem (4.10), (4.11) ve (4.12)"),
  keywords: ["TBDY 2018", "düşey deprem etkisi", "Denklem 4.10", "düşey spektrum", "20 m kiriş", "5 m konsol", "Ed(Z)", "SDS", "yük birleşimi"],
  tags: ["TBDY 2018", "Düşey Deprem", "Dinamik Analiz", "Yük Birleşimi"],
};
