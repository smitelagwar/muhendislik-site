import {
  PHASE7_UPDATED_AT,
  eurocodePhase7References,
  phase7Lines,
  type DepremPhase7Override,
} from "./deprem-phase7-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const EN1990: DepremPhase7Override = {
  slug: "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari",
  title: "EN 1990 Yük Birleşimleri: Tasarım Durumu, ULS/SLS ve Ulusal Ek Mantığı",
  description: "EN 1990'ın limit durum, tasarım değeri, kısmi katsayı ve ψ birleşim katsayısı mantığını sembolik formüllerle açıklar; sayısal katsayıların Ulusal Ek'ten alınması gerektiğini vurgular.",
  seoTitle: "EN 1990 Yük Birleşimleri | ULS SLS ve Kısmi Katsayılar",
  seoDescription: "EN 1990'da ULS/SLS, kalıcı ve değişken etkiler, γ ve ψ katsayıları, tasarım durumları ve National Annex/Ulusal Ek kullanım mantığı.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "16 dk okuma",
  relatedSlugs: ["eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler", "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile", "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri"],
  sections: [
    section("rol", "EN 1990 bir yük tablosu değil, yapısal güvenilirlik ve birleşim çerçevesidir", phase7Lines(
      "European Commission JRC, **EN 1990**'ı yapıların güvenlik, kullanılabilirlik ve dayanıklılık gereklerinin temelini oluşturan Eurocode olarak tanımlar. EN 1991 etkileri, EN 1992 beton tasarımını verir; EN 1990 ise bu etkilerin hangi tasarım durumunda nasıl değerlendirileceğinin çerçevesini kurar.",
      "Temel ayrım **nihai sınır durumları (ULS)** ile **kullanılabilirlik sınır durumları (SLS)** arasındadır. Aynı karakteristik yükler her iki kontrol için aynı katsayı ve birleşim mantığıyla kullanılmaz.",
      "Yanlış yaklaşım, bir yazılımdaki `1.4G+1.6Q` benzeri tek formülü 'Eurocode birleşimi' diye bütün projelere ve ülkelere genellemektir."
    )),
    section("tasarim-degeri", "Karakteristik değerden tasarım değerine kısmi katsayılarla geçilir", phase7Lines(
      "Etki tarafında kalıcı etkiler `G_k`, değişken etkiler `Q_k`; tasarım değerleri ise ilgili **γ** kısmi katsayıları ve birleşim katsayılarıyla oluşturulur. Malzeme dayanımlarında da kendi tasarım katsayı zinciri vardır.",
      "Sembolik ULS yapısı, örneğin `Σ γ_G G_k + γ_Q,1 Q_k,1 + Σ γ_Q,i ψ_0,i Q_k,i` biçiminde okunabilir. Buradaki sayısal γ ve ψ değerleri proje ülkesi, tasarım durumu ve **Ulusal Ek (National Annex)** hükümlerine göre doğrulanmalıdır.",
      "| Sembol | Anlam |\n|---|---|\n| Gk | karakteristik kalıcı etki |\n| Qk,1 | önde gelen değişken etki |\n| γ | kısmi katsayı |\n| ψ | değişken etkilerin birlikte bulunma katsayısı |"
    )),
    section("tasarim-durumlari", "Kalıcı, geçici, kaza ve sismik tasarım durumlarını ayırın", phase7Lines(
      "Yapı normal kullanım, yapım aşaması, kaza etkisi veya deprem gibi farklı tasarım durumlarında aynı yük zarfına sahip değildir. Birleşim seçimi önce tasarım durumunun tanımlanmasıyla başlar.",
      "Yangın, çarpma veya diğer kaza etkileri için accidental kombinasyon; deprem için ilgili sismik standardın ve ulusal kuralların birleşim yaklaşımı kullanılır. EN 1990 tek başına deprem hesabının tamamı değildir.",
      "Türkiye'deki projede Eurocode kullanımı sözleşme, teknik şartname ve yürürlükteki ulusal mevzuatla birlikte değerlendirilmelidir; EN 1990'ın varlığı TBDY'yi otomatik olarak yürürlükten kaldırmaz."
    )),
    section("sls", "SLS tek kontrol değildir: karakteristik, sık ve yarı-sürekli kombinasyonları ayırın", phase7Lines(
      "Kullanılabilirlik kontrollerinde deplasman, çatlak, titreşim veya konfor gibi farklı hedefler için değişken etkilerin bulunma olasılığı farklı temsil edilir. Bu nedenle **ψ0, ψ1, ψ2** türü katsayılar farklı kombinasyonlarda rol alır.",
      "Örneğin uzun süreli sehim hesabı ile kısa süreli kullanım kontrolünün değişken yük temsili aynı olmayabilir. Hangi SLS kombinasyonunun kullanılacağı kontrol edilen performansa göre seçilmelidir.",
      "Yazılım kombinasyonlarını otomatik üretse bile mühendis, her kombinasyonun hangi limit duruma hizmet ettiğini okuyabilmelidir."
    )),
    section("ulusal-ek", "Ulusal Ek, boş bırakılan sayısal tercihleri ülke uygulamasına bağlar", phase7Lines(
      "Eurocode sistemi, belirli parametrelerin ulusal düzeyde seçilebilmesine izin verir. JRC rehberliği bu **Nationally Determined Parameters** yaklaşımını Eurocode uygulamasının parçası olarak tanımlar.",
      "Bu nedenle internette başka ülkenin National Annex tablosundan alınmış γ, ψ, kar veya rüzgâr parametresini Türkiye projesine taşımak teknik hata olabilir. Güncel TS EN standardı ve ilgili Türk Ulusal Eki/lisanslı doküman proje kaynak dosyasında tutulmalıdır.",
      "Bu sitede telifli National Annex tabloları kopyalanmaz; yöntem ve doğrulama zinciri verilir."
    )),
    section("yazilim", "Yazılımda birleşim üretimini source-of-truth tablosuna bağlayın", phase7Lines(
      "Hesap yazılımında her load case için etki türü, kategori, favorable/unfavorable durumu, önde gelen değişken etki ve tasarım durumu meta verisi tutulmalıdır. Birleşim motoru bu sınıflandırmadan üretim yapmalıdır.",
      "Kullanıcıya yalnız yüzlerce kombinasyon listesi vermek yerine `ULS persistent / SLS characteristic / SLS frequent / accidental / seismic` gibi gruplar görünür olmalıdır.",
      "Ulusal Ek değişirse katsayı veri katmanı sürümlenebilmeli; formül mantığıyla sabit sayılar birbirinden ayrılmalıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Tasarım durumu ULS/SLS/kaza/sismik olarak doğru sınıflandırıldı mı?",
      "- [ ] Gk ve Qk yük durumları doğru etki türüne atanmış mı?",
      "- [ ] Önde gelen ve eşlik eden değişken etkiler ayrıldı mı?",
      "- [ ] γ ve ψ sayısal değerleri güncel Ulusal Ek'ten doğrulandı mı?",
      "- [ ] Başka ülkenin National Annex değerleri kopyalanmadı mı?",
      "- [ ] SLS karakteristik/sık/yarı-sürekli kombinasyon seçimi kontrol amacına uygun mu?",
      "- [ ] Eurocode kullanımı Türkiye'deki proje şartnamesi ve TBDY/ulusal mevzuatla koordine edildi mi?",
      "- [ ] Yazılımda katsayıların kaynak ve sürümü izlenebilir mi?"
    )),
  ],
  references: eurocodePhase7References("yük birleşimleri, limit durumlar ve Ulusal Ek", "EN1990"),
  keywords: ["EN 1990", "ULS", "SLS", "γ", "ψ0", "ψ1", "ψ2", "National Annex"],
  tags: ["Eurocode", "EN 1990", "Yük Birleşimi", "ULS", "SLS"],
};

const EN1991_11: DepremPhase7Override = {
  slug: "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler",
  title: "EN 1991-1-1 Hareketli Yükler: Kullanım Kategorisinden Yapısal Modele",
  description: "Konut, ofis, toplanma ve diğer kullanım alanlarında hareketli yük seçimini; kullanım kategorisi, qk/Qk modeli, yük aktarımı ve Ulusal Ek doğrulaması üzerinden açıklar.",
  seoTitle: "EN 1991-1-1 Hareketli Yükler | qk Qk ve Kullanım Kategorileri",
  seoDescription: "EN 1991-1-1'de kullanım kategorisi, yayılı hareketli yük qk, tekil yük Qk, yük yolu, kombinasyon ve National Annex kontrolü.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari", "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile", "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz"],
  sections: [
    section("kapsam", "EN 1991-1-1, öz ağırlık ve bina kullanımına bağlı hareketli etkileri tanımlar", phase7Lines(
      "European Commission JRC, EN 1991 ailesinin yapı üzerindeki etkileri kapsadığını; **EN 1991-1-1** bölümünün yoğunluklar, öz ağırlık ve binalardaki imposed loads konularını içerdiğini belirtir.",
      "Hareketli yük seçimi 'konut = tek sayı' ezberi değildir. Önce mekânın gerçek kullanım kategorisi, sonra yayılı yük `q_k` ve gerekiyorsa tekil yük `Q_k` modeli belirlenir.",
      "Yanlış yaklaşım, mimari planda oda adı değiştiği halde eski load case'i aynen bırakmak veya depo/arsiv gibi alanı ofis yüküyle çözmektir."
    )),
    section("kategori", "Kullanım kategorisini mimari fonksiyondan türetin", phase7Lines(
      "Konut, ofis, insanların toplandığı alan, alışveriş, depolama veya araç alanı gibi kullanımlar farklı yük davranışları gösterebilir. Kategori seçimi yalnız kat genelinde değil, yerel mekân bazında yapılmalıdır.",
      "Proje paftasında `mahal kodu — kullanım — EN 1991 kategorisi — qk — Qk — kaynak` tablosu oluşturmak, statik model ile mimari program arasında izlenebilirlik sağlar.",
      "Telifli standarttaki sayısal kategori yük tabloları burada çoğaltılmaz; değerler güncel TS EN 1991-1-1 ve Ulusal Ek'ten alınmalıdır."
    )),
    section("qk-qk", "Yayılı qk ile tekil Qk aynı kontrol değildir", phase7Lines(
      "`q_k [kN/m²]` döşemeye yayılı kullanım etkisini; `Q_k [kN]` ise yerel tekil yük etkisini temsil edebilir. Döşeme genel momenti için yayılı yük kritik iken yerel zımbalama, kaplama veya küçük açıklıklı elemanlarda tekil etki ayrıca kritik olabilir.",
      "Örnek yalnız model mantığı içindir: 20 m² bir alan için `q_k=2,0 kN/m²` varsayılsa toplam karakteristik yayılı etki 40 kN olur; fakat bu, 40 kN'ı tek bir noktaya koymak anlamına gelmez.",
      "| Model | Birim | Tipik kullanım |\n|---|---:|---|\n| qk | kN/m² | yayılı döşeme etkisi |\n| Qk | kN | yerel tekil kontrol |"
    )),
    section("yuk-yolu", "Yükü döşemeden temele kadar doğru taşıyın", phase7Lines(
      "Döşeme üzerindeki qk, döşeme sistemine göre kiriş/kolon/perdeye ve oradan temele aktarılır. Tributary area yaklaşımı veya sonlu eleman modeli kullanıldığında yükün iki kez eklenmemesi gerekir.",
      "Hareketli yük azaltımı veya kat sayısına bağlı indirgeme kullanılacaksa yalnız standardın izin verdiği koşullarda ve güncel Ulusal Ek ile uygulanmalıdır. Model yazılımındaki varsayılan reduction seçeneği otomatik doğru kabul edilmemelidir.",
      "Aynı alan depoya dönüşüyorsa yük yolu kadar eleman kapasitesi ve temel reaksiyonları da yeniden değerlendirilir."
    )),
    section("kombinasyon", "Hareketli yükün karakteristik değeri ile birleşimdeki temsil değeri farklıdır", phase7Lines(
      "EN 1990 kombinasyonlarında Qk, önde gelen veya eşlik eden değişken etki olmasına göre ψ katsayılarıyla farklı temsil edilebilir. Bu nedenle `qk` değerini model girdisi olarak tanımlamak birleşim hesabını bitirmez.",
      "Kullanım kategorisinin doğru atanması, aynı zamanda ilgili ψ katsayı ailesinin seçilmesini etkileyebilir. Load case kategorisi ve kombinasyon meta verisi birlikte yönetilmelidir.",
      "ULS ve SLS kombinasyonları ayrı doğrulanmalıdır."
    )),
    section("turkiye", "Türkiye projesinde TS EN metni, Ulusal Ek ve ulusal mevzuatı birlikte yönetin", phase7Lines(
      "Eurocode yönteminin kullanılması, Türkiye'de yürürlükteki deprem ve diğer zorunlu ulusal kuralların otomatik dışlandığı anlamına gelmez. Proje sözleşmesi/şartnamesi hangi standardın hangi kapsamda uygulanacağını açıkça belirlemelidir.",
      "Sayısal qk/Qk tabloları ve ulusal tercih parametreleri güncel TSE dokümanlarından doğrulanmalı; web içeriğinden veya başka ülke ekinden kopyalanmamalıdır.",
      "Standart sürümü hesap raporunun ön sayfasında belirtilmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Her mahalin gerçek kullanım kategorisi belirlendi mi?",
      "- [ ] qk ve Qk değerleri güncel TS EN 1991-1-1/Ulusal Ek'ten alındı mı?",
      "- [ ] Yayılı ve tekil yük kontrolleri birbirinden ayrıldı mı?",
      "- [ ] Depo, arşiv ve yoğun kullanım alanları ofis/konut varsayımıyla geçilmedi mi?",
      "- [ ] Yükler döşemeden temele çift sayılmadan aktarılıyor mu?",
      "- [ ] Hareketli yük azaltımı varsa standardın koşulları doğrulandı mı?",
      "- [ ] EN 1990 ψ katsayı kategorisi ile kullanım kategorisi tutarlı mı?",
      "- [ ] Mimari değişiklik statik yük tablosuna geri besleniyor mu?"
    )),
  ],
  references: eurocodePhase7References("binalarda öz ağırlık ve hareketli yükler", "EN1991"),
  keywords: ["EN 1991-1-1", "qk", "Qk", "hareketli yük", "kullanım kategorisi", "National Annex"],
  tags: ["Eurocode", "EN 1991-1-1", "Hareketli Yük", "Yük Modeli", "Döşeme"],
};

const SNOW: DepremPhase7Override = {
  slug: "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile",
  title: "EN 1991-1-3 Kar Yükü: Zemin Kar Yükünden Çatı Tasarım Yüküne",
  description: "Kar yükü hesabını s=μi·Ce·Ct·sk zinciriyle açıklar; sk ve ulusal parametrelerin güncel National Annex/Ulusal Ek'ten alınması gerektiğini, eski Türkiye bölge haritalarının otomatik kullanılamayacağını vurgular.",
  seoTitle: "EN 1991-1-3 Kar Yükü Hesabı | μi Ce Ct sk ve Ulusal Ek",
  seoDescription: "EN 1991-1-3 kar yükü hesabı, zemin kar yükü sk, çatı şekil katsayısı μi, maruziyet Ce, ısıl Ct ve National Annex doğrulaması.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "15 dk okuma",
  relatedSlugs: ["eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari", "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri", "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler"],
  sections: [
    section("denklem", "Çatı kar yükü, haritadaki tek bir sayının doğrudan döşemeye verilmesi değildir", phase7Lines(
      "EN 1991-1-3 yaklaşımında kalıcı/geçici tasarım durumları için çatı kar yükü temel olarak `s = μ_i · C_e · C_t · s_k` zinciriyle kurulur. `s_k` karakteristik zemin kar yükü; `μ_i` çatı şekil katsayısı; `C_e` maruziyet; `C_t` ısıl katsayıdır.",
      "Sayısal `s_k` ve bazı ulusal seçimler **National Annex / Ulusal Ek** üzerinden belirlenir. İnternette bulunan başka ülke haritası veya eski Türkiye bölge tablosu güncel proje verisi yerine kullanılamaz.",
      "Yanlış yaklaşım, slug adında 'Türkiye bölgeleri' yazıyor diye kaynağı doğrulanmamış sabit bir bölge haritasını teknik gerçeklik olarak yayımlamaktır."
    )),
    section("sk", "Önce proje yerinin karakteristik zemin kar yükü sk değerini doğrulayın", phase7Lines(
      "Kar yükü konuma, rakıma ve ulusal veri modeline bağlıdır. Proje koordinatı/rakımı ile güncel TS EN 1991-1-3 Ulusal Eki veya idarenin kabul ettiği resmî veri kaynağı eşleştirilmelidir.",
      "Web aracında `il seç → bölge sayısı` gibi eski şema yerine koordinat/rakım ve kaynak sürümü tutulması daha güvenlidir.",
      "| Girdi | Kaynak | Çıktı |\n|---|---|---|\n| Konum/rakım | Ulusal Ek | sk |\n| Çatı geometrisi | EN 1991-1-3 | μi |\n| Maruziyet/ısıl durum | proje verisi | Ce, Ct |"
    )),
    section("geometri", "μi çatı geometrisini ve kar birikmesini temsil eder", phase7Lines(
      "Tek eğimli, çift eğimli, çok açıklıklı veya daha yüksek yapıya bitişik çatılarda kar dağılımı aynı değildir. Rüzgârla sürüklenme ve geometrik engeller yerel kar yığılmaları oluşturabilir.",
      "Modelde yalnız uniform kar yükü değil, standardın gerektirdiği asimetrik/yığılma yükleme düzenleri de araştırılmalıdır. Hangi yükleme durumunun kritik olduğu taşıyıcı sisteme göre değişir.",
      "Çatı mimarisindeki parapet, üst yapı veya kot farkı statik modelden gizlenmemelidir."
    )),
    section("ornek", "Sembolik örnek: katsayı zincirini görünür tutun", phase7Lines(
      "Yalnız yöntem örneği olarak `s_k=1,20 kN/m²`, `μ_i=0,80`, `C_e=1,00`, `C_t=1,00` varsayılırsa `s=0,96 kN/m²` elde edilir. Bu sayılar herhangi bir Türkiye konumu için öneri değildir.",
      "Gerçek projede dört girdinin her biri kaynaklandırılmalı; özellikle sk değeri ve National Annex parametreleri lisanslı güncel dokümandan alınmalıdır.",
      "Kar yükünün plan alanına mı eğimli yüzeye mi uygulanacağı ve yük yönü kullanılan analiz modelinde standarda uygun tanımlanmalıdır."
    )),
    section("kombinasyon", "Kar, değişken etkidir; EN 1990 birleşimlerinde rolü ayrıca belirlenir", phase7Lines(
      "Kar yükü karakteristik olarak hesaplandıktan sonra ULS/SLS tasarım kombinasyonlarında önde gelen veya eşlik eden değişken etki olarak temsil edilir. ψ değerleri ve kısmi katsayılar EN 1990/Ulusal Ek çerçevesinden gelir.",
      "Kar ile rüzgârın aynı anda hangi temsil değerleriyle bulunacağı birleşim mantığının konusudur; iki maksimum karakteristik değeri körlemesine toplamak doğru olmayabilir.",
      "Deprem kütlesine katılım gibi ulusal deprem mevzuatı konuları ayrıca kontrol edilmelidir."
    )),
    section("saha", "Kar tutucu, güneş paneli ve çatı ekipmanları yerel birikmeyi değiştirebilir", phase7Lines(
      "PV dizileri, parapetler, mekanik cihazlar ve çatı üstü platformlar kar sürüklenmesi/engellenmesi bakımından yeni geometrik koşullar oluşturabilir. Taşıyıcı tasarım, yalnız boş çatı geometrisine göre bırakılmamalıdır.",
      "Drenaj ve buzlanma, su birikmesi ve bakım erişimi de çatı projesiyle koordine edilmelidir.",
      "Mimari ekipman yerleşimi değişirse kar yükü senaryoları yeniden gözden geçirilmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] sk değeri güncel TS EN 1991-1-3 Ulusal Eki/resmî proje kaynağından doğrulandı mı?",
      "- [ ] Proje konumu ve rakımı doğru mu?",
      "- [ ] μi çatı geometrisi ve yerel birikme senaryolarına göre seçildi mi?",
      "- [ ] Ce ve Ct kabulleri kaynaklandırıldı mı?",
      "- [ ] Uniform ve gerekli asimetrik/yığılma yüklemeleri kontrol edildi mi?",
      "- [ ] Kar yükü EN 1990 ULS/SLS birleşimlerine doğru bağlandı mı?",
      "- [ ] PV, parapet ve çatı ekipmanlarının birikme etkisi değerlendirildi mi?",
      "- [ ] Eski/kaynaksız Türkiye kar bölgesi haritası kullanılmadı mı?"
    )),
  ],
  references: eurocodePhase7References("kar yükleri, EN 1991-1-3 ve Ulusal Ek", "EN1991"),
  keywords: ["EN 1991-1-3", "kar yükü", "sk", "μi", "Ce", "Ct", "National Annex"],
  tags: ["Eurocode", "EN 1991-1-3", "Kar Yükü", "Çatı", "Ulusal Ek"],
};

const WIND: DepremPhase7Override = {
  slug: "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri",
  title: "EN 1991-1-4 Rüzgâr Yükü: Temel Rüzgâr Hızından Cephe ve Çatı Basıncına",
  description: "Rüzgâr hesabını temel hız, arazi/irtifa, türbülans, tepe hız basıncı ve dış-iç basınç katsayıları üzerinden açıklar; Türkiye için kaynaksız bölge haritası üretmek yerine Ulusal Ek doğrulamasını zorunlu kılar.",
  seoTitle: "EN 1991-1-4 Rüzgâr Yükü | vb qp cpe cpi ve Ulusal Ek",
  seoDescription: "EN 1991-1-4 temel rüzgâr hızı vb, tepe hız basıncı qp(z), dış/iç basınç cpe/cpi, cephe-çatı zonları ve National Annex.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "16 dk okuma",
  relatedSlugs: ["eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari", "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile", "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz"],
  sections: [
    section("zincir", "Rüzgâr hesabını hız → profil → basınç → yüzey kuvveti zincirinde kurun", phase7Lines(
      "EN 1991-1-4, yapılar üzerindeki rüzgâr etkisini konuma bağlı temel rüzgâr hızı, arazi ve yükseklik profili, türbülans ve yapı yüzey basınç katsayıları üzerinden kurar. Sonuç tek bir `kg/m²` sabiti değildir.",
      "Temel hız sembolik olarak `v_b = c_dir · c_season · v_b,0`; tepe hız basıncı `q_p(z)` ise yükseklik ve arazi etkileriyle belirlenir. Yüzey basıncı daha sonra dış `c_pe` ve iç `c_pi` katsayılarıyla hesaplanır.",
      "Yanlış yaklaşım, internetteki 'Türkiye rüzgâr bölgesi' görselinden tek hız seçip bina yüksekliği, arazi ve zon katsayılarını atlamaktır."
    )),
    section("ulusal", "v_b,0 ve ulusal parametreleri güncel National Annex'ten alın", phase7Lines(
      "Eurocode sistemindeki bazı rüzgâr parametreleri ülkelere özgüdür. Proje konumu için temel rüzgâr hızı ve varsa yön/mevsim tercihleri güncel TS EN 1991-1-4 Ulusal Eki veya sözleşmede belirtilen resmî kaynaktan doğrulanmalıdır.",
      "Slug URL sürekliliği için 'Türkiye bölgeleri' ifadesini taşısa da bu makale kaynaksız bir Türkiye rüzgâr haritası yayımlamaz. Sayısal veri lisanslı güncel Ulusal Ek'ten alınır.",
      "| Aşama | Temel veri |\n|---|---|\n| Ulusal | vb,0 ve NDP |\n| Saha | arazi, yükseklik, orografi |\n| Yapı | cpe, cpi ve zonlar |"
    )),
    section("profil", "Arazi pürüzlülüğü ve yükseklik rüzgâr basıncını değiştirir", phase7Lines(
      "Aynı temel rüzgâr hızı, açık kıyı alanı ile yoğun kentsel dokuda aynı düşey profile dönüşmez. Arazi kategorisi, pürüzlülük uzunluğu ve gerekiyorsa orografi etkisi ortalama hız ve türbülansı belirler.",
      "Yüksek binalarda cephe boyunca tek q değeri kullanmak yetersiz olabilir. Basınç dağılımı yükseklik dilimleri veya standardın önerdiği referans yüksekliklerle modellenmelidir.",
      "Çevre yapılaşması gelecekte değişebilecekse kalıcı tasarım varsayımı dikkatle seçilmelidir."
    )),
    section("cephe-cati", "cpe ve cpi ile dış/iç basıncı ayrı değerlendirin", phase7Lines(
      "Köşe ve kenar zonlarında emme basınçları orta yüzeylerden daha kritik olabilir. Cephe kaplaması ve bağlantı tasarımında küçük alan için verilen yerel katsayılar, ana taşıyıcı sistemin global katsayısından farklı amaç taşır.",
      "Net yüzey basıncı kavramsal olarak `w = q_p(z) · (c_pe - c_pi)` biçiminde okunabilir. İç basınç; açıklık dağılımı, baskın açıklık ve bina sızdırmazlığına bağlıdır.",
      "Pencere kırılması veya büyük kapının açık kalması gibi tasarım senaryoları gerekiyorsa iç basınç modeli buna göre seçilmelidir."
    )),
    section("ornek", "Sembolik örnek: birimleri ve işaretleri görünür tutun", phase7Lines(
      "Yalnız yöntem örneği olarak `q_p=0,80 kN/m²`, `c_pe=-1,20`, `c_pi=+0,20` varsayılırsa net basınç `0,80×(-1,20-0,20) = -1,12 kN/m²` olur. Eksi işaret yüzeyden dışa emme yönünü temsil eder.",
      "Bu değerler herhangi bir Türkiye lokasyonu veya cephe zonu için tavsiye değildir. Gerçek `q_p`, `c_pe` ve `c_pi` güncel standardın geometri ve Ulusal Ek kurallarıyla belirlenir.",
      "Kaplama ankrajı, parapet ve PV taşıyıcıları için yerel basınç kontrolleri ayrıca yapılmalıdır."
    )),
    section("kombinasyon", "Rüzgâr etkisini EN 1990 ve diğer ulusal yüklerle birleştirin", phase7Lines(
      "Rüzgâr değişken etkidir; ULS/SLS birleşimindeki temsil değeri EN 1990 ve Ulusal Ek kurallarına bağlıdır. Kar ve rüzgârın eş zamanlı temsili de bu çerçevede kurulur.",
      "Deprem ve rüzgâr tasarım zarfları yapının sistemine ve yürürlükteki ulusal mevzuata göre ayrı analiz edilip tasarım etkileri zarfında değerlendirilir. Eurocode kullanımı TBDY'nin zorunlu hükümlerini kendiliğinden kaldırmaz.",
      "Yazılım load case yönleri (+X/-X/+Y/-Y) ve basınç zonları açık isimlendirilmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] vb,0 ve ulusal parametreler güncel TS EN 1991-1-4 Ulusal Eki/resmî kaynaktan alındı mı?",
      "- [ ] Arazi pürüzlülüğü ve orografi koşulu proje yerine uygun mu?",
      "- [ ] Yapı yüksekliği boyunca q_p(z) değişimi gerektiği şekilde modellendi mi?",
      "- [ ] Cephe/çatı zonları ve cpe katsayıları doğru alan ölçeğinde kullanıldı mı?",
      "- [ ] İç basınç cpi ve baskın açıklık senaryosu kontrol edildi mi?",
      "- [ ] Kaplama/ankraj için yerel emme basınçları ayrıca değerlendirildi mi?",
      "- [ ] EN 1990 birleşimleri ve ulusal deprem mevzuatıyla koordinasyon yapıldı mı?",
      "- [ ] Kaynaksız Türkiye rüzgâr bölge haritası kullanılmadı mı?"
    )),
  ],
  references: eurocodePhase7References("rüzgâr etkileri, EN 1991-1-4 ve Ulusal Ek", "EN1991"),
  keywords: ["EN 1991-1-4", "rüzgâr", "vb", "qp(z)", "cpe", "cpi", "National Annex"],
  tags: ["Eurocode", "EN 1991-1-4", "Rüzgâr", "Cephe", "Ulusal Ek"],
};

const EC2_TS500: DepremPhase7Override = {
  slug: "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz",
  title: "EN 1992-1-1 ve TS 500: Betonarme Tasarım Yaklaşımını Doğru Karşılaştırma",
  description: "EC2/EN 1992-1-1 ile TS 500'ü kapsam, limit durum, malzeme tasarım değerleri, kesme-zımbalama, çatlak/sehim ve detaylandırma iş akışı açısından karşılaştırır; TBDY'nin sismik rolünü ayrıca korur.",
  seoTitle: "EN 1992-1-1 vs TS 500 | Betonarme Tasarım Karşılaştırması",
  seoDescription: "EC2 EN 1992-1-1 ve TS 500 karşılaştırması: ULS/SLS, beton-çelik tasarım değerleri, kesme, zımbalama, çatlak, sehim, detaylandırma ve TBDY.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "18 dk okuma",
  relatedSlugs: ["eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari", "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler", "tbdy-2018-betonarme-analiz"],
  sections: [
    section("kapsam", "Önce kapsamı ayırın: EC2 ve TS 500'ü tek formül üzerinden kıyaslamayın", phase7Lines(
      "European Commission JRC, **EN 1992 (Eurocode 2)**'yi beton yapıların dayanım, kullanılabilirlik, dayanıklılık ve yangın tasarımını kapsayan Eurocode olarak tanımlar. **TS 500** ise Türkiye'de betonarme yapıların hesap ve yapım kurallarının temel ulusal standardıdır.",
      "İki doküman da limit durum mantığı, malzeme davranışı ve detaylandırma üzerinden güvenli betonarme tasarım hedefler; ancak katsayılar, formüller, sınıflandırma ve detay kuralları birebir aynı değildir.",
      "Yanlış yaklaşım, bir EC2 formülündeki katsayıyı TS 500 hesabına veya tersini bağlamından koparıp taşımaktır."
    )),
    section("tasarim-felsefesi", "Yük, malzeme ve dayanım katsayı zincirini kendi standardı içinde tutun", phase7Lines(
      "Eurocode iş akışında EN 1990 yük birleşimleri, EN 1991 etkileri ve EN 1992 kesit tasarımı birlikte çalışır. Beton tasarım dayanımı tipik sembolik biçimde `f_cd = α_cc f_ck / γ_c`, çelik için `f_yd = f_yk / γ_s` çerçevesinde ifade edilir; sayısal ulusal parametreler ilgili National Annex'e bağlıdır.",
      "TS 500'ün kendi yük/malzeme güvenlik yaklaşımı ve tasarım bağıntıları vardır. Bir projede hangi standardın esas alındığı rapor başında açıkça belirtilmeli ve katsayı setleri karıştırılmamalıdır.",
      "| Başlık | EN 1992 yaklaşımı | TS 500 yaklaşımı |\n|---|---|---|\n| Yük çerçevesi | EN 1990/1991 | ulusal yük kuralları |\n| Beton tasarım değeri | γc + NDP | TS 500 katsayı sistemi |\n| Deprem detayı | EN 1998/ulusal kurallar | TBDY + TS 500 |"
    )),
    section("egilme-eksenel", "Eğilme ve eksenel kuvvette ortak fizik, farklı normalizasyon ve detay kuralları", phase7Lines(
      "Her iki yaklaşımda denge, şekil değiştirme uyumu ve beton/çelik tasarım dayanımları temel fiziksel çerçevedir. Fakat basınç bloğu kabulleri, minimum/maksimum donatı, etkin derinlik ve detay sınırları standarda özgüdür.",
      "Kolon etkileşim diyagramı veya kiriş eğilme hesabı yazılımında standard seçimi yalnız sonuç ekranı etiketi değil hesap çekirdeği parametresi olmalıdır.",
      "Aynı kesitin iki standarda göre farklı donatı vermesi tek başına bir standardın 'daha güvenli' olduğunu kanıtlamaz; hedef güvenilirlik, katsayı ve detay sistemi birlikte değerlendirilir."
    )),
    section("kesme-zimbal", "Kesme ve zımbalamada formül benzerliği varsaymayın", phase7Lines(
      "EN 1992-1-1 kesme ve punching shear için beton katkısı, kesme donatısı, kontrol çevreleri ve maksimum dayanım sınırlarını kendi bağıntılarıyla tanımlar. TS 500'ün kesme/zımbalama yaklaşımı farklı tanım ve katsayılara sahip olabilir.",
      "Özellikle radye, mantar döşeme veya kenar kolonu gibi zımbalama problemlerinde kontrol çevresi geometrisi ve kenar/açıklık etkisi standardın kendi kurallarıyla kurulmalıdır.",
      "Bir standardın kontrol çevresini, diğerinin dayanım formülüyle birleştirmek hibrit ve doğrulanmamış sonuç üretir."
    )),
    section("sls", "Çatlak ve sehim kontrolü, yalnız ULS donatısı çıktıktan sonra bakılan ek kutu değildir", phase7Lines(
      "EN 1992 kullanılabilirlikte çatlak genişliği, gerilme sınırları ve sehim için ayrıntılı kontrol yöntemleri sunar. TS 500'de de kullanılabilirlik ve sehim/çatlak koşulları kendi kurallarıyla değerlendirilir.",
      "Uzun açıklık, yüksek donatı oranı veya hassas kaplama bulunan elemanlarda servis davranışı kesit boyutunu ULS'den önce belirleyebilir.",
      "Yazılım raporunda ULS ve SLS sonuçları ayrı başlıkta, kullanılan kombinasyon ve sınır ile görünmelidir."
    )),
    section("tbdy", "Türkiye'de deprem tasarımında TBDY koordinasyonunu kaybetmeyin", phase7Lines(
      "TS 500 ile betonarme kesit tasarımı yapılması, deprem davranışının tamamını çözmez; TBDY taşıyıcı sistem seçimi, süneklik, kapasite tasarımı, birleşim ve özel deprem detayları gibi zorunlu kuralları getirir.",
      "Bir Eurocode tabanlı proje Türkiye'de yapılacaksa uygulanacak deprem standardı, sözleşme ve idari kabul açıkça belirlenmelidir. EN 1992'yi tek başına 'TBDY alternatifi' gibi göstermek yanlıştır.",
      "Proje standard matrisi `yükler — betonarme — deprem — geoteknik — yangın` başlıklarıyla baştan yazılmalıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Projenin esas betonarme tasarım standardı açıkça tanımlandı mı?",
      "- [ ] EN 1992 kullanılıyorsa EN 1990/1991 ve National Annex zinciri tutarlı mı?",
      "- [ ] TS 500 ve EC2 katsayı/formülleri hibrit biçimde karıştırılmadı mı?",
      "- [ ] Eğilme/eksenel, kesme ve zımbalama kontrolleri aynı standard ailesinde yürütüldü mü?",
      "- [ ] ULS yanında çatlak ve sehim SLS kontrolleri yapıldı mı?",
      "- [ ] Dayanıklılık, pas payı ve detay kuralları kullanılan standarda göre doğrulandı mı?",
      "- [ ] Türkiye'deki proje için TBDY'nin sismik hükümleri ayrıca kontrol edildi mi?",
      "- [ ] Hesap raporunda standard sürümleri ve Ulusal Ek kaynakları yazıldı mı?"
    )),
  ],
  references: eurocodePhase7References("beton yapı tasarımı ve EN 1992 kapsamı", "EN1992"),
  keywords: ["EN 1992-1-1", "EC2", "TS 500", "ULS", "SLS", "zımbalama", "TBDY"],
  tags: ["Eurocode", "EN 1992", "TS 500", "Betonarme", "TBDY"],
};

export const DEPREM_PHASE7_BATCH_3_ARTICLES = [EN1990, EN1991_11, SNOW, WIND, EC2_TS500] as const;
