import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const HASAR_TESPIT_GENELGESI = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/Genelge/Hasar_Tespit_Genelgesi_ve_Ekleri.pdf";

export const DEPREM_PHASE4_MEVCUT_BINA_DEPREM_GUVENLIGI: DepremPhase4Override = {
  slug: "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir",
  description: "Mevcut bir binanın deprem güvenliğinin TBDY 2018 Bölüm 15 kapsamında hangi veri, bilgi düzeyi, modelleme, analiz yöntemi ve performans kararı zinciriyle değerlendirildiğini; deprem sonrası hasar tespiti ve 6306 riskli yapı tespitinden farklarıyla açıklar.",
  seoTitle: "Mevcut Binaların Deprem Güvenliği Nasıl Değerlendirilir? | TBDY Bölüm 15",
  seoDescription: "TBDY 2018 Bölüm 15'e göre mevcut bina deprem performansı: bilgi toplama, bilgi düzeyi, mevcut malzeme dayanımı, modelleme, doğrusal/doğrusal olmayan analiz ve performans kararı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "uc-farkli-soru",
      title: "Önce hangi soruya cevap verildiğini ayırın: hasar, risk ve performans aynı şey değildir",
      content: phase4Lines(
        "Mevcut bir bina için 'deprem güvenliği' denildiğinde üç farklı teknik/idari süreç birbirine karıştırılabilir. Doğru yöntem, önce değerlendirmenin amacını tanımlamaktır.",
        "",
        "| Süreç | Cevap verdiği temel soru | Ana dayanak |",
        "|---|---|---|",
        "| **Afet sonrası hasar tespiti** | Gerçekleşen afet binada ne kadar hasar oluşturdu? | AFAD 7663 Hasar Tespit Genelgesi ve afet hasar tespit süreci |",
        "| **6306 riskli yapı tespiti** | 6306 kapsamındaki teknik-idari ölçütlere göre yapı riskli mi? | 6306 mevzuatı ve Riskli Yapıların Tespit Edilmesine İlişkin Esaslar |",
        "| **TBDY Bölüm 15 performans değerlendirmesi** | Tanımlanan deprem yer hareketi altında mevcut bina hangi performans düzeyini sağlar? | TBDY 2018 Bölüm 15 ve Tablo 3.4 |",
        "",
        "Bu üç süreç aynı veri setini kısmen kullanabilse de birbirinin sonucu yerine geçirilemez. Özellikle afet sonrası gözlemsel hasar sınıfını doğrudan 'gelecekteki deprem performansı' olarak okumak teknik olarak yanlıştır."
      ),
      subsections: [],
    },
    {
      id: "hasarli-bina-kapsam-siniri",
      title: "TBDY 15.1.6 hasarlı bina için kritik kapsam sınırıdır",
      content: phase4Lines(
        "TBDY **15.1.6**, binada hasara neden olan bir deprem sonrasında hasarlı binanın deprem güvenliğinin Bölüm 15 yöntemleriyle belirlenemeyeceğini açıkça belirtir. Bu hüküm, 'deprem oldu, bina hasar gördü; şimdi normal mevcut bina performans analizi çalıştırıp güvenlidir diyelim' yaklaşımını engeller.",
        "",
        "TBDY **15.1.7** ise deprem sonrası hasarlı binanın güçlendirilmesi ve güçlendirme sonrası performansının belirlenmesi için Bölüm 15 esaslarının uygulanacağını; ancak hasarlı mevcut elemanların dayanım ve rijitliklerinin hangi ölçüde hesaba katılacağına projeden sorumlu inşaat mühendisinin karar vereceğini söyler.",
        "",
        "Sonuç: **hasar tespiti → hasarlı elemanların mühendislik değerlendirmesi → gerekiyorsa onarım/güçlendirme modeli → performans doğrulaması** birbirini izleyen fakat aynı olmayan adımlardır."
      ),
      subsections: [],
    },
    {
      id: "bilgi-toplama",
      title: "Adım 1 — TBDY 15.2.1'e göre saha verisi toplanmadan güvenilir model kurulmaz",
      content: phase4Lines(
        "TBDY **15.2.1.1–15.2.1.3**, mevcut binanın kapasite ve deprem dayanımı değerlendirmesinde kullanılacak bilgilerin projelerden/raporlardan, sahadaki gözlem ve ölçümlerden ve malzeme örneklerine uygulanacak deneylerden elde edilmesini ister.",
        "",
        "15.2.1.2 kapsamındaki veri toplama yalnız kolon-kiriş ölçmek değildir. En az şu veri grupları birlikte ele alınır:",
        "",
        "- Taşıyıcı sistemin tanımı ve bina geometrisi",
        "- Temel sistemi ve zemin özellikleri",
        "- Varsa mevcut hasar, geçmiş değişiklikler ve onarımlar",
        "- Eleman boyutları ve taşıyıcı sistem detayları",
        "- Beton, donatı/çelik veya ilgili taşıyıcı malzeme özellikleri",
        "- Sahada bulunan durumun varsa mevcut projeye uygunluğu",
        "",
        "TBDY **15.2.1.3**, bu inceleme, veri toplama, malzeme örneği alma ve deney işlemlerini inşaat mühendislerinin sorumluluğuna verir. Bu nedenle yalnız arşiv projesini analiz programına aktarmak mevcut bina değerlendirmesi değildir."
      ),
      subsections: [],
    },
    {
      id: "bilgi-duzeyi-malzeme",
      title: "Adım 2 — Bilgi düzeyi, mevcut malzeme dayanımı ve kapasite hesabı aynı zincirin parçalarıdır",
      content: phase4Lines(
        "TBDY **15.2.2**, bina hakkında elde edilen bilgi kapsamına göre **Sınırlı** ve **Kapsamlı** bilgi düzeylerini tanımlar. Sınırlı bilgi düzeyi yalnız BKS=3 kapsamındaki 'Diğer Binalar' için kullanılabilir; kapsamlı bilgi düzeyinde daha fazla saha doğrulaması yapılır.",
        "",
        "TBDY **15.2.12 / Tablo 15.1** bilgi düzeyi katsayılarını şöyle verir:",
        "",
        "| Bilgi düzeyi | Bilgi düzeyi katsayısı |",
        "|---|---:|",
        "| Sınırlı | **0.75** |",
        "| Kapsamlı | **1.00** |",
        "",
        "Aynı maddede eleman kapasitesi hesabında **mevcut malzeme dayanımlarının** kullanılacağı ve aksi özellikle belirtilmedikçe yeni bina tasarımındaki malzeme güvenlik katsayılarıyla tekrar bölünmeyeceği belirtilir. Dolayısıyla karot, donatı tespiti, proje doğrulaması ve bilgi düzeyi seçimi modelden bağımsız evrak işlemleri değil, doğrudan kapasite sonucunu değiştiren girdilerdir."
      ),
      subsections: [],
    },
    {
      id: "model-ve-deprem-talebi",
      title: "Adım 3 — 15.4'e göre model, düşey yük ve deprem talebini birlikte temsil etmelidir",
      content: phase4Lines(
        "TBDY **15.4.1**, mevcut veya güçlendirilmiş binanın performansının **15.5 doğrusal** veya **15.6 doğrusal olmayan** yöntemlerle belirlenebileceğini; teorik temelleri farklı bu yöntemlerin birebir aynı sonucu vermesinin beklenmemesi gerektiğini belirtir.",
        "",
        "Modelleme sırasında kritik genel kurallardan bazıları şunlardır:",
        "",
        "| Kontrol | TBDY yaklaşımı |",
        "|---|---|",
        "| Deprem yer hareketi | İlgili deprem yer hareketi düzeyine ait elastik spektrum kullanılır |",
        "| Bina önem katsayısı | 15.4.2'ye göre **I = 1.0** alınır |",
        "| Yükleme | Düşey yükler ve deprem etkileri birlikte değerlendirilir |",
        "| Deprem yönleri | Her iki yatay doğrultu ve iki yön ayrı ayrı dikkate alınır |",
        "| Model doğruluğu | İç kuvvet, yerdeğiştirme ve şekildeğiştirmeleri yeterli doğrulukta üretmelidir |",
        "| Kısa kolon | Gerçek serbest boyu ile modellenir |",
        "| Betonarme rijitlik | Eğilme etkisindeki elemanlarda çatlamış kesite ait etkin rijitlik kullanılır |",
        "",
        "Bu nedenle yeni bina modelini kopyalayıp yalnız beton sınıfını değiştirmek, Bölüm 15 modelinin veri ve belirsizlik mantığını karşılamaz."
      ),
      subsections: [],
    },
    {
      id: "analiz-yontemi",
      title: "Adım 4 — Doğrusal veya doğrusal olmayan yöntem, uygulanabilirlik sınırına göre seçilir",
      content: phase4Lines(
        "Bölüm 15'te doğrusal yöntem bulunması, her mevcut binanın doğrusal yöntemle değerlendirilebileceği anlamına gelmez. **15.5** kendi uygulanma sınırlarını ve EKO tabanlı kontrollerini içerir; bu sınırlar sağlanmıyorsa değerlendirme **15.6** kapsamındaki doğrusal olmayan yöntemlerden biriyle sürdürülür.",
        "",
        "Doğrusal olmayan yöntemlerde amaç yalnız 'pushover çalıştırmak' değildir. Elemanların plastik şekildeğiştirme ve dönme talepleri ile gevrek davranışa ilişkin iç kuvvet talepleri hesaplanır; talepler kapasite ve performans sınırlarıyla karşılaştırılır.",
        "",
        "Yöntem seçimi yazılımın hangi modülünün daha kolay olduğuna göre değil, yapının BYS/düzensizlikleri, eleman davranışları ve 15.5 uygulanabilirlik koşullarına göre yapılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "performans-karari",
      title: "Adım 5 — Sonuç tek bir oran değil, hedef deprem performansına göre bina düzeyi karardır",
      content: phase4Lines(
        "TBDY **15.8.1**, mevcut veya güçlendirilecek binalarda hedeflenen deprem performansının **Tablo 3.4** ile belirlenen deprem yer hareketi düzeyi ve minimum performans hedeflerine göre seçileceğini belirtir.",
        "",
        "Örneğin yüksek bina olmayan mevcut yerinde dökme betonarme, önüretimli betonarme ve çelik binalar için Tablo 3.4(c), normal performans hedefinde **DD-2 altında Kontrollü Hasar (KH)** ve ŞGDT yaklaşımını gösterir. Bina türü, yüksekliği ve özel performans hedefleri değiştiğinde aynı satır otomatik olarak kullanılamaz.",
        "",
        "Performans kararı; eleman kesitlerinin hasar bölgeleri, gevrek yetersizlikler, kat ve doğrultu bazındaki dağılım ve ilgili performans düzeyi kuralları birlikte okunarak verilir. Yazılım ekranındaki tek bir 'OK/FAIL' işareti veya yalnız göreli kat ötelenmesi sonucu bina performans raporunun yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "rapor-ciktisi",
      title: "Değerlendirme raporunda yalnız sonuç değil, kararın izlenebilirliği bulunmalıdır",
      content: phase4Lines(
        "Profesyonel mevcut bina raporu, başka bir mühendisin aynı veri setini okuyup hangi kabulle hangi sonuca ulaşıldığını takip edebilmesini sağlamalıdır. En azından aşağıdaki zincir açık olmalıdır:",
        "",
        "1. Değerlendirmenin amacı ve kullanılan mevzuat/kapsam.",
        "2. Mevcut proje ve saha rölövesi arasındaki farklar.",
        "3. Malzeme deneyleri, donatı tespitleri ve bilgi düzeyi seçimi.",
        "4. Model kabulleri, rijitlikler, kütleler, zemin/temel yaklaşımı ve deprem girdileri.",
        "5. Kullanılan analiz yönteminin uygulanabilirlik gerekçesi.",
        "6. Eleman bazlı sünek/gevrek değerlendirmeler ve performans sonuçları.",
        "7. Hedef performansın sağlanıp sağlanmadığı ve gerekiyorsa güçlendirme kararının kapsamı.",
        "",
        "Bu yapı, raporu yalnız analiz programı çıktısı olmaktan çıkarıp mühendislik karar dosyasına dönüştürür."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Yapılan işin afet sonrası hasar tespiti, 6306 riskli yapı tespiti veya TBDY Bölüm 15 performans değerlendirmesi olduğu açıkça yazıldı mı?",
        "- Depremde hasar görmüş bina için 15.1.6 kapsam sınırı kontrol edildi mi?",
        "- Geometri, temel/zemin, değişiklik-onarım, eleman detayları ve malzeme verileri 15.2.1 kapsamında sahada doğrulandı mı?",
        "- Bilgi düzeyi ve **0.75 / 1.00** katsayısı doğru veri kapsamıyla eşleştirildi mi?",
        "- Kapasitelerde yeni bina karakteristik dayanımı yerine Bölüm 15'in tarif ettiği mevcut malzeme dayanımları kullanıldı mı?",
        "- Modelde **I = 1.0**, çatlamış kesit rijitliği, gerçek kısa kolon boyları ve doğru kütle/yük kabulleri uygulandı mı?",
        "- **15.5** doğrusal yöntemin uygulanabilirlik sınırları sağlanmıyorsa **15.6** doğrusal olmayan yönteme geçildi mi?",
        "- Performans hedefi **Tablo 3.4** ve 15.8 ile eşleştirildi mi?",
        "- Sonuç, eleman/kat/doğrultu bazında izlenebilir biçimde raporlandı mı?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase4References("Bölüm 15.1–15.8 — mevcut bina değerlendirme, modelleme ve performans"),
    {
      label: "AFAD — 7663 sayılı Hasar Tespit Genelgesi ve Ekleri",
      href: HASAR_TESPIT_GENELGESI,
      note: "Afet sonrası gözlemsel hasar tespitinin gelecekteki deprem performansı/risk değerlendirmesinden farklı bir işlem olduğunu tanımlayan resmî kaynak.",
    },
  ],
  keywords: ["mevcut bina deprem güvenliği", "TBDY Bölüm 15", "performans analizi", "15.1.6", "bilgi düzeyi", "Tablo 3.4", "doğrusal analiz", "doğrusal olmayan analiz"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Deprem Performansı", "Bilgi Düzeyi", "ŞGDT"],
};
