import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_SUNEK_GEVREK: DepremPhase4Override = {
  slug: "mevcut-bina-sunek-gevrek-hasar-siniflamasi",
  description: "TBDY Bölüm 15'te betonarme elemanların sünek/gevrek davranış ayrımını, SH-KH-GÖ kesit hasar durumlarını, hasar bölgelerini ve eleman hasarının en kritik kesite göre belirlenmesini açıklar.",
  seoTitle: "Mevcut Binada Sünek ve Gevrek Hasar Sınıflaması | TBDY Bölüm 15",
  seoDescription: "TBDY 15.3 ve 15.5.2'ye göre sünek/gevrek eleman ayrımı, SH-KH-GÖ hasar sınırları, kesit hasar bölgeleri ve kesme kontrollü gevrek davranış.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "iki-ayri-siniflama",
      title: "Sünek/gevrek davranış ile SH–KH–GÖ aynı sınıflama değildir",
      content: phase4Lines(
        "TBDY Bölüm 15 iki farklı karar katmanı kurar. Önce betonarme elemanın kırılma türü **sünek mi gevrek mi** belirlenir. Ardından yalnız sünek davranış için kritik kesitlerin şekildeğiştirme/hasar düzeyi **Sınırlı Hasar (SH), Kontrollü Hasar (KH) ve Göçme Öncesi Hasar (GÖ)** sınırlarıyla sınıflandırılır.",
        "",
        "> [!warning] Kritik ayrım",
        "> Gevrek hasar gören bir elemanı SH–KH–GÖ ölçeğine yerleştirmek doğru değildir. TBDY 15.3.1 açıkça gevrek hasar gören elemanlarda bu sınıflamanın geçerli olmadığını belirtir."
      ),
      subsections: [],
    },
    {
      id: "sunek-gevrek",
      title: "15.5.2.2: eğilme sünek, kesme gevrek davranışın temel ayrımıdır",
      content: phase4Lines(
        "TBDY 15.5.2.2 doğrusal değerlendirme bağlamında betonarme elemanları kırılma türüne göre sınıflandırır: kırılma türü **eğilme** ise sünek, **kesme** ise gevrek kabul edilir.",
        "",
        "Ancak bir kolon, kiriş veya perdeyi sünek saymak için yalnız moment kapasitesine bakmak yetmez. Kritik kesitte eğilme kapasitesiyle uyumlu hesaplanan kesme kuvveti `Ve`, mevcut malzeme dayanımları kullanılarak Denk.(7.10)'daki kesme güvenliği sınırlarını sağlamalıdır. Bu koşulu sağlamayan eleman **gevrek olarak hasar gören eleman** kabul edilir."
      ),
      subsections: [],
    },
    {
      id: "ve-kontrolu",
      title: "Süneklik kararı kapasite kesmesi Ve ile kontrol edilir",
      content: phase4Lines(
        "15.5.2.2(a)'ya göre `Ve`; kolonlarda 7.3.7, kirişlerde 7.4.5 ve perdelerde 7.6.6 hükümleriyle hesaplanır. Bu mevcut bina kontrolünde pekleşmeli taşıma gücü momentleri yerine taşıma gücü momentleri kullanılır ve Denk.(7.16)'da `βv = 1` alınır.",
        "",
        "Düşey yüklerle birlikte `Ra = 1` alınarak depremden hesaplanan toplam kesme kuvveti `Ve`'den küçükse, kesme kontrolünde `Ve` yerine bu toplam kesme kuvveti kullanılır. Dolayısıyla sünek/gevrek etiketi yazılımın otomatik sınıfından körlemesine alınmamalı; kullanılan kesme talebi ve dayanım zinciri raporda izlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "birlesim-gevrek",
      title: "Kolon-kiriş birleşimi de gevrek hasar kararı üretebilir",
      content: phase4Lines(
        "TBDY 15.5.2.5, betonarme kolon-kiriş birleşimlerinde Denk.(7.11)'den gelen kesme kuvvetlerinin 7.5.2.2'de verilen birleşim kesme dayanımını aşmamasını ister. Dayanım hesabında Bölüm 15 bilgi düzeyine göre belirlenen **mevcut beton dayanımı** kullanılır.",
        "",
        "Birleşim kesme kuvveti talebi birleşim kesme dayanımını aşarsa kolon-kiriş birleşim bölgesi **gevrek olarak hasar gören eleman** şeklinde tanımlanır. Bu nedenle yalnız kolon ve kiriş uç mafsallarını kontrol edip birleşim bölgesini atlamak performans değerlendirmesini eksik bırakır."
      ),
      subsections: [],
    },
    {
      id: "hasar-durumlari",
      title: "15.3.1 sünek kesitler için üç hasar durumu tanımlar",
      content: phase4Lines(
        "| Hasar durumu | TBDY'nin davranış tanımı |",
        "|---|---|",
        "| **SH — Sınırlı Hasar** | Kesitte sınırlı miktarda elastik ötesi davranış |",
        "| **KH — Kontrollü Hasar** | Kesit dayanımının güvenli olarak sağlanabildiği elastik ötesi davranış |",
        "| **GÖ — Göçme Öncesi Hasar** | Kesitte ileri düzeyde elastik ötesi davranış |",
        "",
        "Bu üç durum ve bunların sınır değerleri **sünek elemanların kesit düzeyi** değerlendirmesi içindir. Gevrek elemanlarda aynı hasar sınıflaması kullanılmaz."
      ),
      subsections: [],
    },
    {
      id: "hasar-bolgeleri",
      title: "Kesit sınırından eleman hasar bölgesine geçiş",
      content: phase4Lines(
        "TBDY 15.3.2 kritik kesit sonucunu dört hasar bölgesine dönüştürür:",
        "",
        "| Kritik kesit durumu | Elemanın yer aldığı hasar bölgesi |",
        "|---|---|",
        "| SH'ya ulaşmıyor | **Sınırlı Hasar Bölgesi** |",
        "| SH ile KH arasında | **Belirgin Hasar Bölgesi** |",
        "| KH ile GÖ arasında | **İleri Hasar Bölgesi** |",
        "| GÖ'yü aşıyor | **Göçme Bölgesi** |",
        "",
        "15.3.3'e göre eleman hasarı, elemanın **en fazla hasar gören kesitine** göre belirlenir. Bir elemanın bir ucunun daha iyi durumda olması, diğer uçtaki daha ağır hasar sınıfını ortadan kaldırmaz."
      ),
      subsections: [],
    },
    {
      id: "dogrusal-dogrusal-olmayan",
      title: "Talep türü yöntemle birlikte okunmalıdır",
      content: phase4Lines(
        "TBDY 15.4.1 mevcut veya güçlendirilmiş binalarda performansın 15.5'teki doğrusal veya 15.6'daki doğrusal olmayan yöntemlerle belirlenebileceğini söyler. Bu iki yaklaşım teorik olarak farklıdır ve birebir aynı sonucu vermeleri beklenmez.",
        "",
        "15.6.1 doğrusal olmayan değerlendirmede sünek davranış için **plastik şekildeğiştirme ve plastik dönme taleplerinin**, gevrek davranış için ise **iç kuvvet taleplerinin** hesaplanacağını açıkça ayırır. Bu ayrım, sünek elemanda deformasyon kapasitesi ile gevrek elemanda kuvvet kapasitesinin neden farklı kontrol edildiğini gösterir."
      ),
      subsections: [],
    },
    {
      id: "karar-akisi",
      title: "Eleman bazında doğru karar akışı",
      content: phase4Lines(
        "1. Mevcut malzeme dayanımı ve eleman kapasitesi bilgi düzeyine göre belirlenir.",
        "2. Kolon/kiriş/perde için eğilme kapasitesine uyumlu kesme kuvveti ve kesme dayanımı kontrol edilir.",
        "3. Sünek koşulları sağlamayan eleman gevrek olarak işaretlenir; birleşim kesmesi ayrıca kontrol edilir.",
        "4. Sünek elemanlarda analizden gelen talep SH/KH/GÖ sınırlarıyla karşılaştırılır.",
        "5. Kritik kesit hasar bölgesi belirlenir.",
        "6. Elemanın hasarı, en ağır durumdaki kesite göre atanır.",
        "7. Eleman sonuçları ilgili bina performans kriterlerine aktarılır; gevrek elemanlar sünek hasar yüzdelerine karıştırılmaz."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Sünek/gevrek davranış kararı yalnız yazılım etiketinden değil kesme güvenliği kontrolünden doğrulandı mı?",
        "- `Ve` hesabında mevcut bina için 15.5.2.2'deki özel kabuller uygulandı mı?",
        "- Kolon-kiriş birleşim kesme güvenliği ayrıca kontrol edildi mi?",
        "- Gevrek elemanlara SH/KH/GÖ sınıflaması uygulanmadı mı?",
        "- Sünek kesitlerde SH, KH ve GÖ sınırları doğru talep büyüklüğüyle karşılaştırıldı mı?",
        "- Eleman hasarı en fazla hasar gören kesite göre belirlendi mi?",
        "- Doğrusal ve doğrusal olmayan yöntemde sünek/gevrek talep türleri karıştırılmadı mı?",
        "- Nihai performans tablosunda gevrek elemanlar ayrı ve izlenebilir mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.3, 15.4, 15.5.2 ve 15.6.1 — sünek/gevrek davranış, hasar sınırları ve talep türleri"),
  keywords: ["sünek eleman", "gevrek eleman", "SH", "KH", "GÖ", "hasar bölgesi", "Ve", "EKO", "TBDY 15.3"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Sünek Davranış", "Gevrek Hasar", "Performans"],
};
