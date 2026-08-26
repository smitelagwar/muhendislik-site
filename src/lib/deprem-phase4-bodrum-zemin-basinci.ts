import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_BODRUM_ZEMIN_BASINCI: DepremPhase4Override = {
  slug: "bodrum-perdesi-statik-dinamik-zemin-basinci",
  description: "TBDY 2018 Bölüm 16.11'e göre rijit bina bodrum çevre perdelerinde statik zemin basıncı, sürşarj, yeraltı suyu, depremde ek zemin basıncı ve statik-eşdeğer dinamik su basıncının nasıl ayrıştırılıp modele aktarılacağını açıklar.",
  seoTitle: "Bodrum Perdelerinde Statik ve Dinamik Zemin Basıncı | TBDY 16.11",
  seoDescription: "TBDY 16.11 bodrum perdesi hesabı: Tablo 16.6 statik basınçlar, deprem ek basıncı, su basıncı, sürşarj ve 16.12 dayanma yapısı ayrımı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "16-11-kapsam",
      title: "Bina bodrum çevre perdesinde ana hüküm TBDY 16.11'dir",
      content: phase4Lines(
        "TBDY **16.11**, başlığını doğrudan 'Binaların Bodrum Perdelerine Etkiyen Statik ve Dinamik Zemin Basınçları' olarak kurar. Hüküm, çevre bodrum perdelerini oluşturan yapısal elemanlarla birlikte zeminin doğrusal olmayan davranışını ve aşırı boşluk suyu basıncını içeren ayrıntılı bir duvar-zemin etkileşim modeli yapılmadığı durumda kullanılacak basitleştirilmiş yaklaşımı verir.",
        "",
        "Bu nedenle bina bodrum perdesini otomatik olarak serbest bir istinat/dayanma duvarı kabul edip aktif toprak basıncı katsayısı seçmek doğru başlangıç değildir. Önce elemanın gerçekten **rijit bina bodrum çevre perdesi** olup olmadığı ve 16.11'in model varsayımlarının geçerli olup olmadığı belirlenmelidir.",
        "",
        "Hesap akışı dört bileşeni ayrı tutmalıdır: **statik zemin basıncı + sürşarj + statik su basıncı + depremde ek zemin/dinamik su basıncı**."
      ),
      subsections: [],
    },
    {
      id: "tablo-16-6-statik",
      title: "Tablo 16.6 statik zemin basıncını zemin cinsine göre düzgün yayılı tanımlar",
      content: phase4Lines(
        "TBDY **16.11.1 / Tablo 16.6**, rijit bodrum perdelerine uygulanacak statik zemin basınçlarını aşağıdaki biçimde verir. `Hb` toplam bodrum perdesi yüksekliği, `q` sürşarj, `γ*` ise su durumuna göre kullanılan zemin birim hacim ağırlığıdır.",
        "",
        "| Bodrum perdesi dışındaki zemin | Basıncın etkidiği yükseklik | Statik zemin basıncı `p` |",
        "|---|---|---|",
        "| Kohezyonsuz zemin | Tüm yükseklik | **0.2(γ*Hb + q)** |",
        "| Yumuşak–orta katı kohezyonlu | Üst %20 | **0.2(γ*Hb + q)** |",
        "| Yumuşak–orta katı kohezyonlu | Alt %80 | **0.3(γ*Hb + q)** |",
        "| Katı–sert kohezyonlu | Tüm yükseklik | **0.3(γ*Hb + q)** |",
        "",
        "Tablo notuna göre statik su basıncı dışındaki bu zemin basınçları **düzgün yayılı** olarak etki ettirilir. Dolayısıyla klasik üçgen aktif basınç diyagramını doğrudan bu tablo yerine koymak 16.11 yaklaşımı değildir."
      ),
      subsections: [],
    },
    {
      id: "yeraltisuyu",
      title: "Yeraltı suyunu zemin basıncının içine gizlemeyin; hidrostatik bileşeni ayrıca yükleyin",
      content: phase4Lines(
        "Tablo 16.6 notu su seviyesine göre `γ*` tanımını değiştirir. Perde arkasında su yoksa `γ* = γ`; perde kısmen su altında ise su seviyesinin üstünde doğal birim hacim ağırlığı, altında ise batık birim hacim ağırlığı yaklaşımı kullanılır.",
        "",
        "Bunun yanında su üst seviyesinden aşağıya doğru **statik su basıncı** ayrıca zemin basıncına eklenir. Böylece zemin iskeletinin efektif ağırlık etkisi ile hidrostatik basınç aynı terim içinde iki kez sayılmaz.",
        "",
        "Drenaj tasarımı varsa dahi 'drenaj her zaman çalışır' varsayımıyla su yükünü sıfırlamak yerine geoteknik rapordaki tasarım yeraltı su seviyesi ve gerekli tıkanma/arıza senaryosu proje kararında açıkça gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "deprem-ek-zemin-basinci",
      title: "16.11.2 depremde ek zemin basıncını ayrı ve düzgün yayılı bir bileşen olarak verir",
      content: phase4Lines(
        "TBDY **16.11.2**, deprem etkisi altında ek zemin basıncını **Δp = 0.4 SDS γ Hb** bağıntısıyla tanımlar. Yönetmelik bu ek basıncın duvar yüksekliği boyunca **düzgün yayılı** olarak etki ettirilmesini ister.",
        "",
        "Burada `SDS` kısa periyot tasarım spektral ivme katsayısıdır. `Hb` bodrum perdesinin toplam yüksekliğidir. Bu bileşen, Tablo 16.6'daki statik basıncın yerine değil, depremli yükleme durumunda ona ek olarak değerlendirilir.",
        "",
        "Analiz modelinde depremli zemin yükü ayrı yük durumu olarak tanımlanırsa hangi kombinasyonda statik toprak, su, sürşarj ve ek deprem basıncının birlikte bulunduğu izlenebilir kalır."
      ),
      subsections: [],
    },
    {
      id: "dinamik-su-basinci",
      title: "16.11.3 dinamik su basıncını zemin deprem basıncından ayrı ele alır",
      content: phase4Lines(
        "TBDY **16.11.3**, kohezyonsuz zeminde bodrumun kısmen kuruda olması durumunda su seviyesi ile bodrum tabanı arasındaki bölge için statik su basıncına ek bir **statik-eşdeğer dinamik su basıncı** tanımlar. Bu bileşen 16.11.2'deki `Δp` zemin basıncıyla aynı değildir.",
        "",
        "Yönetmelikte dinamik su basıncının derinlik boyunca değişimi Denk. (16.19), bileşke kuvveti ve etkime derinliği ise Denk. (16.20) ile verilir. Bu nedenle suyun bulunduğu projelerde yalnız kuru zemin `Δp` yükünü tanımlayıp hidrodinamik bileşeni atlamak eksik yükleme oluşturabilir.",
        "",
        "Model notunda tasarım su seviyesi, su derinliği ve kullanılan statik/dinamik su yükü açıkça kayıt altına alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "16-11-16-12-ayrimi",
      title: "16.11 bodrum perdesi ile 16.12 dayanma yapısını aynı hesap şablonuna zorlamayın",
      content: phase4Lines(
        "TBDY **16.12**, 'Deprem Etkisi Altında Dayanma Yapılarının Tasarımı' için ayrı kurallar verir; burada aktif/pasif toplam toprak basıncı katsayıları, dayanma yapısının yerdeğiştirme kapasitesi ve stabilite kontrolleri ele alınır.",
        "",
        "Buna karşılık 16.11, binaların **rijit bodrum çevre perdeleri** için özel basınç dağılımını doğrudan tanımlar. Bu iki bölümün yan yana bulunması, her bodrum perdesinde 16.12'deki `Ka/Kp` bağıntılarının 16.11 yerine kullanılacağı anlamına gelmez.",
        "",
        "Eleman bağımsız bir istinat yapısı, ankrajlı iksa/dayanma yapısı veya 16.11'in kapsamı dışındaki özel bir sistem ise uygun geoteknik model ve ilgili bölüm ayrıca seçilmelidir."
      ),
      subsections: [],
    },
    {
      id: "modelleme-ve-kombinasyon",
      title: "Perde modelinde basınç yönü, kat mesnetleri ve yük kombinasyonları birlikte doğrulanmalıdır",
      content: phase4Lines(
        "Toprak ve su basınçları perde düzlemine dik etkiler üretir. Çok katlı bodrumlarda döşemeler perdenin yatay mesnet koşulunu değiştirir; bu nedenle yalnız toplam duvar yüksekliğine bakıp tek açıklıklı konsol davranışı varsaymak doğru olmayabilir.",
        "",
        "Her bodrum katında perde-döşeme bağlantısı, temel ankastrelik/rijitlik kabulü ve yükün hangi yüzeye hangi yönde uygulandığı kontrol edilmelidir. Sürşarjın bina çevresindeki yol, dolgu, komşu temel veya geçici şantiye yüklerinden etkilenip etkilenmediği geoteknik raporla eşleştirilmelidir.",
        "",
        "Sonuç kontrolü yalnız perde donatısı değildir: temel/perde birleşimi, döşeme diyaframına aktarılan yatay reaksiyonlar, çatlak kontrolü ve su yalıtım detayları da basınç modelinin sonucu olarak değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Elemanın TBDY **16.11** kapsamındaki rijit bina bodrum çevre perdesi olduğunu doğruladım.",
        "- [ ] **Tablo 16.6** için zemin cinsini ve 0.2 / 0.3 basınç katsayısı bölgelerini doğru seçtim.",
        "- [ ] `Hb`, `γ/γ*` ve sürşarj `q` değerlerini geoteknik raporla eşleştirdim.",
        "- [ ] Statik su basıncını zemin basıncından ayrı yükledim.",
        "- [ ] Depremli durumda **Δp = 0.4 SDS γ Hb** ek basıncını düzgün yayılı uyguladım.",
        "- [ ] Uygulanıyorsa 16.11.3 dinamik su basıncını ayrıca kontrol ettim.",
        "- [ ] 16.11 bodrum perdesi yaklaşımını **16.12** dayanma yapısı aktif/pasif hesabıyla karıştırmadım.",
        "- [ ] Çok katlı bodrumda döşeme mesnetlerini ve perde yük kombinasyonlarını modelde doğruladım."
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 16.11 ve 16.12"),
  keywords: ["bodrum perdesi", "zemin basıncı", "Tablo 16.6", "yeraltı suyu", "dinamik zemin basıncı", "TBDY 16.11"],
  tags: ["bodrum perdesi", "zemin basıncı", "yeraltı suyu", "TBDY Bölüm 16"],
};
