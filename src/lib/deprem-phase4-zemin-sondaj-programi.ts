import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIGI = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";
const ZEMIN_TEBLIGI_2021 = "https://www.resmigazete.gov.tr/eskiler/2021/02/20210217-4.htm";

export const DEPREM_PHASE4_ZEMIN_SONDAJ_PROGRAMI: DepremPhase4Override = {
  slug: "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi",
  description: "Zemin ve Temel Etüdü Tebliği'nin 2021 değişikliği ile TBDY Bölüm 16A'yı birlikte okuyarak temel taban alanına göre minimum sondaj sayısını, sondaj derinliği kararını, bitişik yapı etki alanını, erken kaya karşılaşmasını ve yeraltı suyu gözlemini açıklar.",
  seoTitle: "Zemin Etüdünde Minimum Sondaj Sayısı ve Derinliği | 2021 Tebliğ",
  seoDescription: "300 m² sondaj kuralı, 3 sondaj alt sınırı, 1.5B derinlik, Δσ=0.10σ'vo kriteri, bitişik yapı ve kaya devam sondajı için uygulama rehberi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "sondaj-programi-kapsami",
      title: "Minimum sondaj programını bina taban alanı, blok düzeni ve geoteknik risk birlikte belirler",
      content: phase4Lines(
        "Zemin etüdünde 'kaç sondaj gerekir?' sorusu yalnız parsel alanıyla cevaplanmaz. **17 Şubat 2021** tarihli Tebliğ değişikliği, sondaj sayısını temel taban alanı ve blok düzeni üzerinden tarif eder; sondaj derinliği için ise temel genişliği ve zemindeki gerilme artışını birlikte değerlendiren ayrı bir karar verir.",
        "",
        "Bu sayılar **minimum etüt programıdır**. Tabakalanma, yeraltı suyu, sıvılaşma, şev/kazı problemi, dolgu, komşu yapı veya beklenmeyen zemin değişimi daha geniş bir araştırma programı gerektirebilir. Minimumu karşılamak, sahayı yeterince temsil ettiği otomatik olarak anlamına gelmez.",
        "",
        "Proje kontrolünde üç soruyu ayrı tutun: **kaç sondaj**, **nerede sondaj** ve **ne kadar derin sondaj**."
      ),
      subsections: [],
    },
    {
      id: "300m2-sondaj-sayisi",
      title: "300 m² kuralını parsel değil, yapının temel taban alanı üzerinden okuyun",
      content: phase4Lines(
        "2021 değişikliği ile Tebliğ 7.2.2.2(a)'daki sondaj sayıları yeniden düzenlenmiştir. Tek bloklu yapılarda temel taban alanı **300 m²'den az ise en az 3 sondaj** yapılır; taban alanındaki her 300 m² artışta bir sondaj ilave edilir.",
        "",
        "| Yapı / saha durumu | Minimum yaklaşım | Kritik not |",
        "|---|---|---|",
        "| Tek blok, temel taban alanı < 300 m² | **En az 3 sondaj** | Parsel alanı değil temel taban alanı esas alınır. |",
        "| Taban alanı büyüdükçe | Her **300 m² artışta +1 sondaj** | Saha heterojenliği daha fazla sondaj gerektirebilir. |",
        "| Taban alanı > 1000 m² | Geometriye göre köşeler + orta nokta ile **en az 5** planlanabilir | 300 m² kuralı da dikkate alınarak sayı artırılır. |",
        "| Site tipi çoklu blok | Her bloğun temel alanında **300 m²'de en az 1** olacak biçimde saha taranır | Minimum sondaj aralıkları ve zemin birimlerinin temsil edilmesi birlikte gözetilir. |",
        "",
        "Özellikle çok bloklu projede bütün sondajları boş peyzaj alanına yığıp blok tabanlarını temsil etmemek, sayısal minimum sağlansa bile etüt amacını bozar."
      ),
      subsections: [],
    },
    {
      id: "kucuk-alan-istisnasi",
      title: "Makine çalışma güçlüğü istisnası otomatik sondaj azaltma hakkı değildir",
      content: phase4Lines(
        "Temel taban alanının çok küçük olduğu ve sondaj makinesinin çalışma güçlüğü nedeniyle sondaj aralıklarının yaklaşık **1–7 m** arasında kalacağı özel durumlarda, ilgili idarenin uygun görmesi koşuluyla sondaj sayısı azaltılabilir.",
        "",
        "Ancak Tebliğ bu istisnayı üç güvenceye bağlar: gerekçe **Veri Raporunda** açıklanmalı, çalışma **jeofizik yöntemlerle desteklenmeli** ve sondaj sayısı **2'den az olmamalıdır**.",
        "",
        "Dolayısıyla 'arsa küçük, iki sondaj yeter' genellemesi yanlıştır. İki sondaj bir genel kural değil, açık gerekçe ve idare uygunluğu gerektiren istisna alt sınırıdır."
      ),
      subsections: [],
    },
    {
      id: "sondaj-derinligi-1-5b",
      title: "Sondaj derinliğinde 1.5B ile gerilme artışı kriterini birlikte değerlendirin",
      content: phase4Lines(
        "Tebliğ 7.2.2.2(c)(5), bina temellerinde sondaj derinliğini temel tabanından başlayarak iki ölçütle tarif eder: yapı genişliğinin en az **1.5 katı** veya net temel taban basıncının oluşturduğu gerilme artışının zeminin kendi ağırlığından kaynaklanan efektif düşey gerilmenin %10'una eşit olduğu derinlik.",
        "",
        "Karar ifadesi **Δσ = 0.10 σ'vo** olarak raporda gösterilebilir. Tebliğ, araştırmaya uygun olan derinliğin seçilmesini ister; bu nedenle 1.5B değerini bütün zemin profillerinde mekanik bir sabit derinlik gibi kullanmak doğru değildir.",
        "",
        "Temel kotu, temel geometrisi, yük seviyesi ve sıkışabilir tabakaların devamı netleşmeden yalnız kat sayısından sondaj derinliği üretmeyin."
      ),
      subsections: [],
    },
    {
      id: "bitisik-yapi-ve-kaya",
      title: "Bitişik yapı etki alanı ve erken kaya karşılaşması sondajı farklı biçimde uzatır",
      content: phase4Lines(
        "Yük etki alanları kesişen bitişik nizam veya birden fazla bina bulunan sahalarda Tebliğ 7.2.2.2(c)(6), kesişim bölgesinde temel alt kotundan itibaren en büyük temelin kısa kenarının **1.5 katından en az 3 m daha fazla** araştırma derinliği ister.",
        "",
        "Hedef derinliğe ulaşmadan kaya ile karşılaşılması da sondajı otomatik bitirme gerekçesi değildir. Yapı etki bölgesinde W4–W5 çok/ tamamen ayrışmış kaya sınıfları dışındaki kaya birimlerine girildiğinde jeofizik ve jeolojik verilerle desteklenmek koşuluyla **en az 3.00 m daha karotlu sondaj** sürdürülür; ayrışmış ve rezidüel birimlerde devam uzunluğu **en az 5.00 m** olarak verilir.",
        "",
        "Bu devam boyları, kaya yüzeyinin tek bir sondajda görülmesini bütün temel alanında sağlam kaya kabulüne dönüştürmemek için kritik kalite kapısıdır."
      ),
      subsections: [],
    },
    {
      id: "16a-arastirma-kalitesi",
      title: "Sondaj adedi kadar örnekleme, SPT ve yeraltı suyu gözlemi de etüt kalitesinin parçasıdır",
      content: phase4Lines(
        "TBDY **EK 16A**, araştırma sondajlarını yalnız kuyu açma işlemi olarak görmez. Sondajlarda proje gereksinimlerini karşılayacak aralıklarla örselenmiş/örselenmemiş örnek alınması, uygun arazi deneylerinin yapılması ve yeraltı su düzeyinin ölçülmesi araştırma programının parçasıdır.",
        "",
        "EK **16A.2.6**, yeraltı suyu ölçümlerinin kuyu içindeki su düzeyi dengeye ulaşacak kadar uzun süre sürdürülmesini ister. Birden fazla akifer veya geçirgenlik farkı varsa standart piezometrelerle basınç/seviye ayrımı gerekebilir.",
        "",
        "Bu nedenle üç adet sondaj açılmış olması, kuyular örnekleme ve su gözlemi bakımından yetersizse tek başına yeterli etüt anlamına gelmez."
      ),
      subsections: [],
    },
    {
      id: "raporlama-ve-plan",
      title: "Sondaj planını vaziyet planı, kot, temel geometrisi ve rapor gerekçesiyle izlenebilir kılın",
      content: phase4Lines(
        "Sondaj noktaları vaziyet planı/plankote üzerinde koordinat ve kotla gösterilmeli; nihai temel konturu ile sondajların ilişkisi okunabilmelidir. Tasarım geliştikçe temel alanı veya blok yerleşimi değişirse ilk etüt programının hâlâ yeterli olduğu yeniden kontrol edilmelidir.",
        "",
        "Veri Raporunda kuyu logları, SPT/CPT ve örnekleme kayıtları; Geoteknik Raporda ise bu verilerin temel sistemi, taşıma gücü, oturma, sıvılaşma ve gerekli diğer geoteknik tasarım kararlarına dönüşümü izlenebilir olmalıdır.",
        "",
        "Sondaj sayısı ve derinliği için kullanılan Tebliğ maddesini raporda açıkça yazmak, ruhsat/proje kontrolünde 'bu sayı nereden geldi?' sorusunu ortadan kaldırır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Tek blokta temel taban alanı **300 m²'den azsa en az 3 sondaj** kuralını kontrol ettim.",
        "- [ ] Her 300 m² alan artışı ve 1000 m² üzeri bina geometrisi için sondaj sayısını yeniden değerlendirdim.",
        "- [ ] Çoklu bloklarda her blok temel alanının araştırma noktalarıyla gerçekten temsil edildiğini kontrol ettim.",
        "- [ ] Küçük alan istisnasında idare uygunluğu, Veri Raporu gerekçesi, jeofizik destek ve **en az 2 sondaj** şartlarını birlikte aradım.",
        "- [ ] Sondaj derinliğini **1.5B** ve **Δσ = 0.10 σ'vo** kriterleriyle değerlendirdim.",
        "- [ ] Bitişik yapıların kesişen etki alanında ilave **3 m** derinlik koşulunu kontrol ettim.",
        "- [ ] Erken kaya karşılaşmasında gerekli **3 m / 5 m** devam sondajını doğruladım.",
        "- [ ] SPT/örnekleme ve yeraltı suyu gözleminin EK 16A kapsamında yeterli olduğunu kontrol ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase4References("Bölüm 16 ve EK 16A"),
    {
      label: "ÇŞİDB — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı (2019)",
      href: ZEMIN_TEBLIGI,
      note: "Zemin ve temel etütlerinin planlanması, arazi/laboratuvar çalışmaları ve raporlama çerçevesi için resmî Bakanlık kaynağı.",
    },
    {
      label: "Resmî Gazete — 17.02.2021 Zemin ve Temel Etüdü Tebliği değişikliği",
      href: ZEMIN_TEBLIGI_2021,
      note: "7.2.2.2 sondaj sayısı ve sondaj derinliği hükümlerinin güncel değişiklik metni.",
    },
  ],
  keywords: ["zemin etüdü", "sondaj sayısı", "sondaj derinliği", "300 m²", "1.5B", "SPT", "yeraltı suyu"],
  tags: ["zemin etüdü", "sondaj", "geoteknik rapor", "TBDY Bölüm 16"],
};
