import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIGI = "https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675";

export const DEPREM_PHASE4_RADYE_ZEMIN_YAYI: DepremPhase4Override = {
  slug: "radye-temel-zemin-yayi-yatak-katsayisi",
  description: "Radye temelin zemin yaylarıyla modellenmesinde yatak katsayısının anlamını, yay rijitliğinin ağ alanıyla ölçeklenmesini, çekme taşımayan temas kabulünü ve sonuçların TBDY Bölüm 16 taşıma gücü ile yerdeğiştirme kontrolleriyle doğrulanmasını açıklar.",
  seoTitle: "Radye Temelde Zemin Yayı ve Yatak Katsayısı | TBDY Bölüm 16",
  seoDescription: "Radye temel yay modeli: yatak katsayısı, düğüm yaylarının tributary alanla ölçeklenmesi, basınç teması, ağ hassasiyeti, oturma ve TBDY 16.8 kontrolleri.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "radye-yuzeysel-temel-kapsami",
      title: "Radye temel TBDY 16.8 kapsamında yüzeysel temeldir; yay modeli yönetmelik kontrolünün yerine geçmez",
      content: phase4Lines(
        "TBDY **16.8.1**, tekil, sürekli (şerit) ve **radye (plak) temelleri** yüzeysel temel tasarım ilkeleri içinde birlikte ele alır. 16.8.1.1'e göre taşıma gücü ve yatayda kaymaya karşı tasarım dayanımları, statik ve depremi içeren yükleme durumlarındaki tasarım etkilerini karşılamalıdır.",
        "",
        "Bir analiz programında radye altına zemin yayı tanımlamak bu kontrolleri otomatik olarak tamamlamaz. Yay modeli; radye iç kuvvetleri, temel-zemin temas basıncı ve oturma dağılımını üretmek için kullanılan bir **modelleme aracıdır**. Sonuçlar geoteknik rapordaki temel sistemi, zemin profili ve tasarım parametreleriyle ayrıca doğrulanmalıdır.",
        "",
        "TBDY'nin 16.8 hükümleri radye için tek bir evrensel **yatak katsayısı** sayısı vermez. Bu nedenle başka bir projeden alınan sabit bir değerin veya yalnız zemin sınıfına göre seçilen tek bir sayının doğrudan modele girilmesi yönetmelik hükmü olarak sunulamaz."
      ),
      subsections: [],
    },
    {
      id: "yatak-katsayisi-model-parametresi",
      title: "Yatak katsayısını zemin sabiti değil, temel ve yükleme ile birlikte kullanılan model parametresi olarak okuyun",
      content: phase4Lines(
        "Winkler tipi idealizasyonda düşey yatak katsayısı çoğunlukla birim alan başına düşey rijitlik olarak kullanılır. Model girdisinin birimi bu nedenle tipik olarak **kN/m³** mertebesindedir; düğüme tanımlanan tekil yay rijitliğinin birimi ise **kN/m** olur.",
        "",
        "| Büyüklük | Modeldeki anlamı | Birim kontrolü |",
        "|---|---|---|",
        "| `k_s` | Birim alan başına düşey zemin yayı | kN/m³ |",
        "| `A_i` | Düğümün/elemanın temsil ettiği tributary alan | m² |",
        "| `k_i` | Düğüme atanacak düşey tekil yay | kN/m |",
        "",
        "Alan yayını düğüm yayına çevirirken temel ilişki **k_i = k_s × A_i** şeklindedir. Aynı `k_s` değerini ağdaki her düğüme doğrudan `k_i` olarak girmek, ağ sıklaştıkça toplam zemin rijitliğini yapay biçimde büyütür. Bu, geoteknik bir değişim değil sayısal model hatasıdır.",
        "",
        "Yatak katsayısının nasıl türetildiği, hangi temel boyutu/yük seviyesi için geçerli olduğu ve servis oturmalarıyla nasıl ilişkilendirildiği geoteknik raporda izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "temas-ve-cekmeme",
      title: "Zemin temasını gerektiğinde çekme taşımayan ve iteratif çalışan bir sınır koşulu olarak modelleyin",
      content: phase4Lines(
        "Zemin ile radye arasındaki normal temas, özel bir fiziksel mekanizma tanımlanmadıkça çekme gerilmesi taşıyan bir bağ gibi davranmaz. Bu nedenle momentli veya depremli yüklemelerde temelin bir bölümünde temas kaybı oluşabiliyorsa **çekme taşımayan** (compression-only) yay veya temas yaklaşımı değerlendirilmelidir.",
        "",
        "Doğrusal iki yönlü yay kullanıldığında program negatif temas basınçlarını fiziksel olmayan çekme reaksiyonlarıyla dengeleyebilir. Böyle bir sonuç yalnız 'minimum basınç negatif çıktı' diye raporlanmamalı; temas alanı, reaksiyon bileşkesi ve radye iç kuvvetleri uygun temas kabulüyle tekrar değerlendirilmelidir.",
        "",
        "Temas kaybının oluşmadığı yükleme durumlarında doğrusal yay modeli pratik olabilir; ancak kullanılan kabul hesap raporunda açıkça yazılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ag-hassasiyeti",
      title: "Ağ sıklığı değiştiğinde toplam yay rijitliği değil, sonuçların yakınsaması değişmelidir",
      content: phase4Lines(
        "Radye sonlu eleman ağı sıklaştırıldığında her düğümün temsil ettiği alan küçülür. Alanla doğru ölçeklenmiş yaylarda toplam düşey yay rijitliği yalnız düğüm sayısı arttığı için değişmez.",
        "",
        "Pratik bir ağ hassasiyeti kontrolünde en az şu çıktıları iki farklı makul ağ boyutunda karşılaştırın:",
        "",
        "- maksimum/minimum temel-zemin temas basıncı,",
        "- toplam ve farklı oturma dağılımı,",
        "- kolon/perde çevresindeki radye momentleri ve kesme talepleri,",
        "- toplam zemin reaksiyonu ile üstyapıdan gelen düşey yüklerin dengesi.",
        "",
        "Ağ inceldikçe sonuçlar sürekli büyüyorsa ilk şüphelerden biri yayların tributary alanla yanlış ölçeklenmesi veya noktasal yük çevresindeki yerel ağ tekilliği olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "tasima-gucu-oturma-dogrulamasi",
      title: "Yay reaksiyonlarını TBDY 16.8.3 taşıma gücü ve yerdeğiştirme kontrollerinden ayrı düşünmeyin",
      content: phase4Lines(
        "TBDY **16.8.3.1**, statik ve deprem etkisini içeren her yükleme durumunda temel taban basıncının tasarım taşıma gücü ile karşılaştırılmasını ister. 16.8.3.4 ise temel altındaki **yerdeğiştirmelerin izin verilebilir sınırlar içinde** kalmasını şart koşar.",
        "",
        "Dolayısıyla yay modelinden çıkan bir basınç haritası iki ayrı soruya cevap vermelidir:",
        "",
        "1. Basınç dağılımı ve bileşkesi taşıma gücü sınır durumuyla uyumlu mu?",
        "2. Aynı zemin-temel sistemi servis ve ilgili deprem koşullarında kabul edilebilir **oturma** ve farklı oturma davranışı gösteriyor mu?",
        "",
        "Bir yay katsayısını yalnız maksimum taban basıncını düşürecek şekilde ayarlamak geoteknik doğrulama değildir. `k_s`, taşıma gücünün yerine geçen bir kapasite parametresi olarak kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "dinamik-zemin-etkilesimi-ayrimi",
      title: "Radye altındaki statik yay modeli ile EK 16C'deki dinamik yapı-zemin etkileşimini birbirine karıştırmayın",
      content: phase4Lines(
        "TBDY **EK 16C.1.1**, dinamik yapı-zemin etkileşimini zemin ortamı ile üstyapının deprem dalgaları altında karşılıklı etkileşimi olarak tanımlar. Bu, radye altına düşey Winkler yayları koymakla aynı problem değildir.",
        "",
        "EK **16C.1.2**, yüzeysel temelli bina türü yapılarda (bodrumlu binalar dahil) göreli yumuşak zemindeki dinamik yapı-zemin etkileşiminin genellikle binayı elverişli yönde etkilediğini ve güvenli tarafta kalma tercihiyle ihmal edilebileceğini belirtir. Buna karşılık radye yay modeli temel iç kuvveti, temas ve oturma dağılımını temsil etmek amacıyla kullanılabilir.",
        "",
        "Hesap raporunda 'zemin yaylı radye modeli kullandım, dolayısıyla yapı-zemin etkileşimi analizi yaptım' şeklinde otomatik bir eşdeğerlik kurulmamaldır."
      ),
      subsections: [],
    },
    {
      id: "geoteknik-statik-geri-besleme",
      title: "Geoteknik rapor ile statik model arasında tek yönlü veri aktarımı değil, geri besleme döngüsü kurun",
      content: phase4Lines(
        "Radye boyutları ve üstyapı reaksiyonları netleştikçe geoteknik değerlendirmede kullanılan yük ve geometri de doğrulanmalıdır. Özellikle büyük eksantrisite, yüksek perde reaksiyonu veya belirgin farklı oturma talebi varsa ilk rapordaki genel parametrelerin aynı biçimde kullanılabilir olduğu varsayılmamalıdır.",
        "",
        "Statik mühendisin geoteknik tarafa en az **N–M–V reaksiyonlarını**, radye geometrisini, temel kotunu ve kritik yük kombinasyonlarını; geoteknik tarafın ise taşıma gücü, yerdeğiştirme/oturma değerlendirmesi ve kullanılacak zemin rijitliği yaklaşımının kapsamını açık biçimde aktarması gerekir.",
        "",
        "Bu yaklaşım Zemin ve Temel Etüdü raporunu yalnız ruhsat eki bir belge olmaktan çıkarıp gerçek temel modelinin girdisi hâline getirir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Radye temelin TBDY 16.8 kapsamındaki yüzeysel temel kontrollerini ayrıca yaptım.",
        "- [ ] `k_s` değerinin kaynağını, birimini ve hangi temel/yükleme koşulu için verildiğini doğruladım.",
        "- [ ] Düğüm yaylarında **k_i = k_s × A_i** alan dönüşümünü kullandım.",
        "- [ ] Ağ sıklaştırıldığında toplam yay rijitliğinin yapay biçimde değişmediğini kontrol ettim.",
        "- [ ] Gerekli yüklemelerde çekme taşımayan temas kabulünü değerlendirdim.",
        "- [ ] Temas basınçlarını taşıma gücü kontrolüyle, oturmaları ise yerdeğiştirme kriterleriyle ayrı doğruladım.",
        "- [ ] Winkler yay modeli ile EK 16C dinamik yapı-zemin etkileşimini aynı analiz olarak adlandırmadım.",
        "- [ ] Geoteknik rapor ile nihai temel reaksiyonları arasında geri besleme kontrolü yaptım."
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase4References("Bölüm 16, 16.8 ve EK 16C"),
    {
      label: "ÇŞİDB — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatına Dair Tebliğ",
      href: ZEMIN_TEBLIGI,
      note: "Zemin ve temel etüdünün kapsamı ve geoteknik raporlama zinciri için resmî Bakanlık kaynağı.",
    },
  ],
  keywords: ["radye temel", "zemin yayı", "yatak katsayısı", "Winkler", "temas basıncı", "oturma", "TBDY Bölüm 16"],
  tags: ["radye temel", "zemin yayı", "yatak katsayısı", "temel modelleme"],
};
