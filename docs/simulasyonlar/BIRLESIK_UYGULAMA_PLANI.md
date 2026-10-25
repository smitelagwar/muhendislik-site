# Etkileşimli Betonarme ve Donatı Kütüphanesi — Birleşik Uygulama Planı

**Sürüm:** 1.0 · **Tarih:** 25 Ekim 2026 · **Durum:** Plan hazır, uygulama başlamadı.

**Hedef:** Araçlar altında; kolon, kiriş, kolon–kiriş birleşimi, perde, tekil temel ve radyeyi her yönden inceleten, donatıyı açıp kapatan, 2B çizim ile 3B modeli ilişkilendiren Türkçe eğitim kütüphanesi.

**Uygulama sözleşmesi:** 12 sabit aşama. Normal koşullarda bir “devam” bir aşamayı tamamlar. İlk aşamada çalışan 3B örnek çıkar; 12. aşama sonunda geliştirme kapanır. Teknik engel çıkarsa aşağıdaki sınırlı düzeltme protokolü işler; ne başarı uydurulur ne de aynı deneme sonsuza kadar tekrarlanır.

**Tek takip dosyası:** [UYGULAMA_DURUMU.md](./UYGULAMA_DURUMU.md). Bu plan kapsamı; takip dosyası gerçek ilerlemeyi belirler. Üç kaynak plan bundan sonra karşılaştırma girdisidir; uygulayıcıya ayrıca iş yükleyen talimatlar değildir.

## 1. Üç planın karşılaştırılması ve sentez kararı

| Kaynak | Güçlü tarafı | Süreyi uzatan / düzeltilmesi gereken tarafı | Bu planda karşılığı |
|---|---|---|---|
| BETONARME_3D_SIMULASYON_SISTEMI_ASAMALI_PLAN.md — 14 aşama | Siteyle uyum, eğitim amacı, 2B–3B eşleme, kontrollü genişleme | Çekirdek deneyim çok sayıda ayrı hazırlık aşamasına yayılıyor. Güvenlik ve kalite sonlara yığılıyor. “Kusursuz kolon” sonu belirsiz olabilir. | İlk aşamada gerçek kolon; her aşamada küçük kabul listesi; ilk dört aşamada tamamlanan kolon deneyimi |
| SIMULASYON_KUTUPHANESI_BAGIMSIZ_PLAN.md — 0–17, toplam 18 aşama | Saf veri modeli, talebe bağlı çizim, saha açıklamaları, kararlı kimlikler | Metraj, sınav, gömme, çıktı, üç birleşim türü ve çoklu cihaz kapıları ilk sürümü büyütüyor. 27 etriye sonucu yerleşim kuralı olmadan kesin kabul ediliyor. | Tek model, tek motor, kaynaklı açıklamalar korunur; sayısal varsayımlar açıkça tanımlanır; yan ürünler sonraki sürüme ayrılır |
| etkile_imli_donat_ve_betonarme_sim_lasyonu_master_plan.md — 7 aşama | Görsel hedef çok açık; parametrik geometri, katman, kesit ve patlatılmış görünüm güçlü | Bir aşamada dört eleman ve çakışma analizi var. Sabit 60 FPS, tek draw call ve “tam uyumlu” iddiaları aşırı kesin. Bazı yönetmelik hükümleri kaynaksız. | Görsel hedef korunur; elemanlar ayrı aşamalarda gelir; ölçülen performans ve sınırlı teknik iddialar kullanılır |

**Özgün yaklaşımım:** Planları peş peşe eklemek yerine, kullanıcıya görünür sonuç veren dikey aşamalar kurmak. Her aşama model + arayüz + gerekli doğrulamayı birlikte teslim eder. Bir kere kurulan etkileşimler yeni elemanlarda tekrar yazılmaz. Teknik olarak zor ama ana öğrenme hedefine şart olmayan özellikler ilk sürümün bitiş koşuluna dönüşmez.

### Kaynak planlardan aynen alınmayan kabuller

1. **Referans görselin Eurocode kökeni kanıtlanmış değil.** Adı “C1 eğitim örneği” olur; “EC2 onaylı” veya “TBDY tam uyumlu” olmaz.
2. **“Kolonda dört boyuna donatı olamaz”, “her filiz kranklı olmalıdır”, “90° her durumda hatalıdır” gibi cümleler genellenmez.** İlgili eleman, detay türü, koşul ve birincil kaynak doğrulanmadan eğitim kartına girmez. Bu plan yönetmelik uygunluk denetçisi üretmez.
3. **600/100 = 6, tek başına etriye konumlarını belirlemez.** Başlangıç ofseti, son konum ve ortak bölge sınırının kime ait olduğu ayrıca tanımlanır. 27 adet ancak tanımlanmış örnek yerleşimin sonucudur.
4. **3200 + 1080 = 4280 mm aritmetik toplamdır.** Gerçek bükümlü çubuk kesim boyunu, ankraj yeterliliğini veya bindirme uygunluğunu kanıtlamaz.
5. **“Aynı veri kaynağı” hatayı imkânsız yapmaz.** İki renderer aynı veriyi farklı yorumlayabilir; eşleme testleri yine gerekir.
6. **Kesitte etriye görünmesi yalnız bölge adına bağlı değildir.** Kesit düzlemi ile sonlu kalınlıktaki donatının konumu belirleyicidir. Temsilî enkesit ile gerçek kot kesiti ayrı adlandırılır.
7. **Sabit FPS, sıfır CPU/GPU veya tüm cihazlarda sıfır çökme vaat edilmez.** Sınırlı ölçüm senaryosu, kaynak bütçesi ve düşük kalite davranışı tanımlanır.
8. **Yalnız saydam beton, kesit ve seçim tümüyle çözüldü anlamına gelmez.** Örtüşme, seçilebilirlik ve kesik yüzey ayrı kabul maddeleridir.
9. **“Önizleme” sorgu parametresi erişim kontrolü değildir.** Taslak sahne üretimde route düzeyinde kapalıdır; listeden gizlemek tek başına yetmez.

## 2. Mevcut projeden doğrulanan gerçekler

25 Ekim 2026 tarihindeki yerel inceleme:

| Konu | Bulgu ve uygulama kararı |
|---|---|
| Git | Çalışma başlangıcında temiz `main`; yerel `main` ve yerelde kayıtlı `origin/main` aynı: `541c7b134def19809dd047340ec7c6a8cb6c3053`. Bu, sunucuya fetch yapılarak doğrulanmış güncellik iddiası değildir. |
| Sürümler | package.json: Next `16.4.2`, React `19.2.3`, Three.js ve @types/three `0.172.0`, Zod `^4.4.3`. Paket kilidi uygulama başlangıcında kontrol edilir. |
| Simülasyon | `src` içinde simülasyon route/modülü bulunmadı. Önceki görsel prompt mevcut bir alan varmış gibi yorumlanmayacak. |
| Araçlar girişi | `src/app/kategori/araclar/page.tsx`, `ToolsWorkbenchShowcase` ve `src/lib/tools-data.ts`. |
| Hesap araçları | Envanter ve registry testleri tam 30 hesap aracı bekliyor. Simülasyon kataloğu bu listeye sahte bir hesap motoru olarak eklenmez. |
| Rotalar | Canonical kök `/kategori/araclar`. `/araclar/:path*` zaten buraya yönleniyor. Yeni ikinci bir rota ailesi açılmaz. |
| 3B bağımlılığı | Three.js CAD tarafında zaten kullanılıyor. Simülasyon kendi motorunu kurar; mevcut paketi yükseltmez, CAD motorundan kod veya yaşam döngüsü ithal etmez. |
| Build | `next build --webpack`, mevcut prebuild ve `tsconfig.next.json` korunur. Runtime dosyaları `.vercelignore` ile dışlanan test/script ağacına bağlanmaz. |
| Vercel | `internal-*` ve `chatgpt-*` için deployment kapalı. Bu planı yazmak deployment gerektirmez. |

Okunan çalışma kuralları: PROJECT.md, AGENTS.md, test-ve-otomasyon-standardi.md, yasayan-dokumantasyon-bakimi.md, vercel-kurallari.md; teknik içerik ve korunacak CAD alanının ilgili kuralları da incelendi. PROJECT.md'nin işaret ettiği `.agent` ve `get-shit-done` dizinleri bu çalışma kopyasında bulunmadı; olmayan bir akış bağımlılığı yaratılmadı.

**Entegrasyon kararı:** Araçlar sayfasında mevcut hesap araçları bölümünün yanında ayrı bir “Simülasyon Kütüphanesi” giriş kartı. Yeni katalog kendi registry'sini kullanır. Mevcut 30 araç ve formüller değişmez. Böylece yeni ürün için hesap araçları altyapısını dönüştürme işi açılmaz.

## 3. İlk sürümün kesin kapsamı

### Teslim edilecek altı sahne

| Sahne / slug | Öğretilen ana ilişki | İlk sürüm varyasyonu |
|---|---|---|
| Kolon / `kolon-detayi` | Boyuna donatı, etriye, sarılma bölgeleri, filiz, pas payı | C1 referans + bir çirozlu öğretim önayarı; sınırlı parametre denemesi |
| Kiriş / `kiris-detayi` | Alt/üst donatı, açıklık–mesnet bölgeleri, etriyeler | Tek örnek açıklık; uçlarda mesnet temsili |
| Birleşim / `kolon-kiris-birlesimi` | Kolon ve kiriş donatısının birleşim çekirdeğindeki ilişkisi | Tek dış birleşim; iki kiriş doğrultusu, iç/köşe varyantları sonraki sürüm |
| Tekil temel / `tekil-temel` | Alt iki yönlü ızgara, filiz, pas payı ve grobeton ilişkisi | Bir kolonlu tekil temel |
| Perde / `perde-detayi` | İki yüzlü gövde donatısı, uç bölge, bağlayıcılar | Boşluksuz dikdörtgen tek perde |
| Radye / `radye-temel` | Alt/üst ızgaralar, sehpa ve kolon filizleri | Sınırlı boyutlu tek radye parçası ve bir kolon bağlantısı |

Tüm sahnelerde: döndür/zoom/pan, hazır bakışlar, beton görünürlüğü, katmanlar, tıklanabilir parça listesi, bilgi kartı, 2B boykesit/plan ve temsilî enkesit, kesit düzlemi, patlatma, 4–6 öğrenme adımı, sıfırlama, mobil arayüz, 2B yedek ve görünüm bağlantısı.

**İlk dört aşama sonunda:** Kullanıcının referansındaki kolonun etkileşimli karşılığı tamamlanır. Bu bir ara teslimdir; altı sahnelik ürünün tamamlandığı anlamına gelmez.

**İlk sürüme alınmayanlar:** FEA/fizik/deprem hasarı hesabı, yönetmelik uygunluk puanı, otomatik donatı tasarımı, serbest CAD/model içe aktarma, vibratör geçiş simülasyonu, genel çakışma motoru, donatı kesim/büküm cetveli ve kg metrajı, hesap sonucu PDF'i, CSV/PNG ihracı, makaleye canlı gömme, hesap/oturum/backend, öğrenme puanı/localStorage, mini sınav, AR/VR, gerçek nervür mesh'i, fotogerçekçi malzeme, çok eksenli eşzamanlı kesit ve bütün sahnelere serbest editör.

Bu özellikler kaybolmuş işler değildir; 12 aşamanın bitişine şart değildir ve kendiliğinden yeni aşamaya dönüşmez. Kullanıcı ayrıca isterse ayrı iş olur.

## 4. Kullanıcı deneyimi ve görsel hedef

### Masaüstü

Üstte “Araçlar / Simülasyonlar / Eleman”, başlık ve kısa açıklama. Geniş alanda 3B sahne, isteğe bağlı yanında 2B çizim. Solda sade katman listesi; seçili parçanın açıklaması dar sağ panelde. Dar laptopta aynı anda üç dar panel sıkıştırılmaz; bilgi ve katmanlar ortak panel sekmelerine geçer.

Beton başlangıçta hafif saydam, boyuna donatılar koyu çelik tonunda, bölge ayrımları referanstaki turkuaz/yeşil/sarı mantığında olur. Renge ek olarak Türkçe etiket vardır. Açık ve koyu temada kontrast korunur. Model büyük ve okunaklıdır; başlık ve açıklamalar sahneyi boğmaz. Tek bir etriyenin kancası yakın görünümde seçilebilmelidir.

### Mobil

3B/2B sekmesi; kullanılabilir yüksekliği site header ve alt gezinme çubuğu dikkate alınarak hesaplanan sahne; kontroller için mevcut UI kalıbıyla tek alt panel. V1'de özel üç kademeli sürükleme sistemi yapılmaz. 44×44 px dokunma hedefi, safe-area ve yatay ekran desteği sağlanır. Açıklama alanı kendi içinde kayabilir. Global `body` kaydırma kilidi veya global gesture engelleyici eklenmez.

| Eylem | Masaüstü | Mobil / erişilebilir alternatif |
|---|---|---|
| Döndür | Sol sürükleme | Tek parmak; ayrıca hazır bakış düğmeleri |
| Yakınlaş | Tekerlek | Pinch; ayrıca +/− |
| Kaydır | Sağ sürükleme | İki parmak; ayrıca modele sığdır |
| Seç | Tık | Dokun veya HTML parça listesinden seç |
| Bölgeye odak | Seçimden sonra “Odaklan” | Aynı düğme; hover kamera hareket ettirmez |
| Görünüm | Ön/arka/sağ/sol/üst/izometrik | Aynı yatay düğme listesi |
| Sıfırla | Açık düğme | Kamera, katman, kesit, patlatma ve öğrenme durumunu birlikte sıfırlar |

Canvas sürüklemesi ile tıklama hareket eşiğiyle ayrılır. Panel üstünden geçen işaretçi modeli seçmez. Klavye kısayolları yalnız viewer odağındayken etkin olur; input yazımıyla çakışmaz. Ekran okuyucuya aynı parça bilgisi HTML olarak sunulur.

### Öğretim dili

Her seçilebilir parça “Bu nedir?”, “Bu örnekte nerede?”, “Görevi nedir?” sorularını kısa cevaplar. Saha notu yalnız açıklamanın gerçekten gerektirdiği yerde eklenir. Öğrenme sırası, her şantiyede geçerli zorunlu imalat sırası gibi sunulmaz; “katman katman inceleme” olarak adlandırılır. Sayısal sınırlar kaynaksız normatif tavsiye olmaz.

## 5. Mimari kararlar — tekrar tartışılmayacak varsayılanlar

**Teknoloji:** Mevcut Three.js + ince React arayüzü. Yeni R3F/drei/zustand/test framework kurulmaz. Uygulamada mevcut sürümle somut uyumsuzluk görülürse karar bir kez kanıtla değerlendirilir; “daha modern” diye motor değiştirilmez.

```text
Doğrulanmış SceneSpec
        ↓ saf TypeScript builder
DetailModel (mm, parçalar, bölgeler, sınırlar, teknik metadata)
        ├── Three.js renderer (tek mm → metre dönüşümü)
        ├── SVG teknik çizim / kesit
        └── HTML parça listesi ve açıklamalar

ViewState → kamera, katman, seçim, kesit, patlatma, öğrenme adımı
```

### Dosya sorumlulukları

```text
src/app/kategori/araclar/simulasyonlar/
  page.tsx
  [slug]/page.tsx
  loading.tsx, error.tsx, not-found.tsx  (gereken kapsamda)
src/components/simulations/
  simulation-workspace.tsx, simulation-viewer.tsx
  simulation-catalog.tsx, layer-panel.tsx, part-info.tsx
  drawing-2d.tsx, learning-controls.tsx
src/lib/simulations/
  catalog.ts                 # Hafif metadata; builder/three import etmez
  scene-loaders.ts           # Sabit izinli slug → lazy import eşlemesi
  core/                     # Saf tipler, validasyon, yol/zon geometrisi
  scenes/                   # Altı sahnenin spec, builder, içerik verisi
  engine/                   # Renderer, kamera, seçim ve kaynak yaşam döngüsü
  state/                    # Reducer ve görünüm URL kodlaması
tests/simulations/           # Model/sözleşme testleri
tests/site-audit/            # Simülasyon için hedefli browser spec
docs/simulasyonlar/
  BIRLESIK_UYGULAMA_PLANI.md
  UYGULAMA_DURUMU.md
```

Dosya ağacı bir “hepsini boş oluştur” listesi değildir. Dosya gerektiğinde açılır. Her küçük yardımcı için ayrı soyutlama veya framework kurulmaz.

### Veri sözleşmesi

- `SceneSpec`: sürüm, sahne türü, boyutlar, örnek donatı yerleşimi, kaynak/varsayım notları.
- `DetailModel`: kararlı parça kimlikleri, beton hacimleri, çubuk eksen yolları, bölgeler, sınır kutusu.
- Parçalar ayrışmış türlerle modellenir: beton parçasına zorunlu donatı çapı/path alanı verilmez. Düz çizgi ve yay segmenti ayrı temsil edilir; büküm tek bir keskin köşe gibi gösterilmez.
- `ViewState`: scene/preset kimliği, katman maskesi, selectedPartId, hazır kamera görünümü, kesit ekseni/konumu, explode değeri, öğrenme adımı. UI durumu geometriye yazılmaz.
- Domain eksenleri: X/Y yatay, Z düşey; mm iç birim. Renderer aynı düşey convention'ı kullanır veya tek açık dönüşüm uygular. Birim ve eksen dönüşümü farklı dosyalara dağılmaz.
- Seçim `partId` ile tutulur; instance sırası seçim kimliği değildir. Gizlenen seçili parçanın seçimi temizlenir; reset davranışı tek reducer eylemidir.
- Geometri değişikliği yeni model üretir. Kamera/katman/hover değişikliği modeli yeniden üretmez. Yeni hesap eski hesap sonucundan sonra gelirse eski sonuç uygulanmaz.

### 3B ve kaynak yaşam döngüsü

Katalog ve ortak layout `three` veya scene builder import etmez. Client sınırında lazy viewer kullanılır; Server Component içinde `ssr:false` kurulmaz. Kurulu Next dokümantasyonundaki `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` uygulama öncesi referanstır.

Bir sahnede bir canvas/renderer. Değişiklik yokken uygulama yeni kare istemez. Kamera sönümü ve kısa animasyon bitince çizim durur; gizli sekmede oynatma duraklar. Aynı anda tek planlanmış RAF bulunur; render ve kamera olaylarının birbirini sınırsız çağırması önlenir. Bu yaklaşım [Three.js talebe bağlı çizim rehberine](https://threejs.org/manual/pages/rendering-on-demand.html) dayanır.

Kaynak sahibi açıkça bellidir. Paylaşılan geometri/malzeme her parça kapanınca dispose edilmez; son sahibi bırakınca temizlenir. Renderer, kontroller, listener, observer ve RAF unmount'ta kapatılır. Her state değişiminde context yok edilmez. İç önbelleklerin mutlak sıfır olması beklenmez; tekrar kullanımda sınırsız büyüme aranır. [Three.js kaynak temizliği rehberi](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).

Bağlam kaybında 2B ve HTML kontroller çalışır. Otomatik yeniden kurma en fazla bir kez denenir; başarısızsa kullanıcıya “3B'yi yeniden dene” ve kalıcı 2B seçeneği sunulur. Sonsuz restore döngüsü yoktur.

### Güvenlik ve performans sınırları

V1 uzaktan model/script almaz. URL yalnız görünüm verisi taşır; serbest geometri veya kod taşımaz. Zod ile sonlu sayılar, enumlar ve ID'ler kontrol edilir. Geometri tahmini bütçe kontrolünden geçmeden büyük dizi oluşturulmaz.

Başlangıç teknik bütçesi: sahne başına en fazla 2.000 mantıksal parça, hafif modda 150.000 üçgen, 150 çizim çağrısı; kolon için hedef 60 çağrı. Değerler mühendislik sınırı değildir. Bütçe aşımında yanlış geometriyi sessizce çizmek yerine üretim reddedilir veya önceden belirlenmiş hafif ayrıntı seviyesi kullanılır. Mantıksal donatı adedi performans uğruna sessizce azaltılmaz.

İlk sürümde iki kalite profili yeterli: Dengeli ve Hafif. Gölge/post-process/nervür geometrisi yok. DPR üst sınırı 1,5; düşük profilde 1. Otomatik profil düşürme en fazla bir kez; sürekli inip çıkan kalite döngüsü yok. Düz ve aynı biçimdeki tekrarlar instance gruplarında; her farklı şeklin tek draw call olacağı iddia edilmez.

## 6. C1 referansı ve teknik içerik sınırları

Görselde okunabilenler: 300×300 mm kesit; 4Ø20 boyuna donatı; Ø10 etriyeler; 600/1500/600/500 mm bölgeler; 1080 mm üst uzantı; 4,28 m boy ifadesi. Bunlar görsel kaynak verisidir. Paspayı, büküm yarıçapı, ilk etriye ofseti ve ayrıntılı kanca düzeni görselden kesinleşmiyorsa “öğretim varsayımı” olarak ayrı kaydedilir.

**Deterministik örnek yerleşim kararı:** Dört bölge için merkez konumları yarım aralık ofsetiyle üretilir: `[0,600)` içinde 50,150,…,550; `[600,2100)` içinde 675,825,…,2025; `[2100,2700)` içinde 2150,…,2650; `[2700,3200]` içinde 2750,…,3150 mm. Böylece 6+10+6+5=27 etriye oluşur, sınırda çift etriye yoktur. Bu, resmin kesin imalat koordinatlarının çıkarıldığı iddiası değil, açık bir öğretim seçimidir. Bölge geçişlerinde mesafe değişimleri ayrıca test edilir; bölge etiketi tüm geçiş aralıklarını aynıymış gibi göstermez.

Paspayı beton yüzü ile en dış donatı yüzü arasındadır; etriye ekseni olarak yanlış kullanılmaz. Köşede merkez konumları çap ve bükümle birlikte türetilir. Donatıların birbirine temas etmesi her durumda “hata/çakışma” değildir; yalnız kasıtsız hacimsel iç içe geçmeler geometri kusuru olarak ayrılır.

C1'de çiroz görünmüyor diye hayalî çiroz eklenmez. Çiroz açıklaması için ikinci, açıkça ayrı adlandırılmış örnek önayar kullanılır. Üst uzantı “filiz gösterimi” olarak anlatılır; bu uzunluğun yeterli olduğu söylenmez.

Her teknik iddia için: kaynak başlığı, URL veya erişilebilir doküman referansı, sürüm/madde, kapsam, kontrol tarihi ve inceleme durumu. Resmî kaynak başlangıcı [AFAD TBDY sayfası](https://afad.gov.tr/turkiye-bina-deprem-yonetmeligi) ve [Resmî Gazete yayımıdır](https://resmigazete.gov.tr/eskiler/2018/03/20180318M1-2.htm). Bu plan madde bazında uygunluk incelemesi tamamlandığı iddiasını taşımaz. Lisanslı TS metnine erişim yoksa madde uydurulmaz.

Kaynağı belirsiz normatif cümle yayımlanmaz; sahnenin geometrik ve kavramsal öğretimi devam eder. Uzman incelemesi yapılmadıysa “uzman onaylı” durumu verilmez. Tam mevzuat taraması bütün yazılımı bloke eden sonsuz araştırma görevine dönüşmez.

## 7. On iki uygulama aşaması

Her aşamada yalnız ilgili kabul maddeleri ve değişen ortak sözleşmeler kontrol edilir. Aşağıdaki testler bugün çalıştırılmış değildir; uygulama görevleridir. Takip dosyasındaki kanıt olmadan kutular tamamlanmış sayılmaz.

### Aşama 01 — İlk çalışan kolon ve siteye giriş

**Sonuç:** Araçlar → Simülasyonlar → Kolon yoluyla açılan, döndürülebilen gerçek 3B kafes.

**İşler:**
- Başlangıç git durumunu kısa kontrol et; bu belgedeki keşfi baştan yapma. Uygulama için `internal-simulasyon-kutuphanesi-v1` dalını kullan; varsa ve bu işe aitse sürdür. Kullanıcı değişikliklerini taşıma/silme.
- Katalog ve statik `simulasyonlar` rotasını, `[slug]` detayını kur. Hazır tek kart kolon; diğerleri yayımlanmaz. Bilinmeyen slug 404.
- Araçlar sayfasına ayrı giriş kartı ekle; 30 araçlık registry'yi koru.
- Saf C1 örnek verisi, basit donatı/beton mesh'leri, kamera döndür/zoom/pan/sığdır ve beton gizleme. Bu aşamada kancalar ve teknik çizimler son hâlinde olmayabilir; bunu durum dosyasına yaz.
- Türkçe yükleme/hata hali ve WebGL yoksa açıklama + basit 2B önizleme.

**Bitiş:** Gerçek geometri görünür; kullanıcı betonu gizleyip modeli döndürebilir, sayfadan çıkabilir. Katalogda canlı canvas yok. Aynı route'a yeniden giriş iki canvas oluşturmaz.

**Kontrol:** İlgili lint/typecheck, araç metadata/envanter/registry kontrolleri; 390 ve 1366 px tek browser akışı. 3B lazy import sınırını kaynakta doğrula; üretim build kanıtı Aşama 04'te.

**Sınır:** Ayrı keşif/altyapı raporu, boş “motor demosu” aşaması, yeni paket yükseltmesi yok.

### Aşama 02 — Kolon geometrisi, katmanlar ve parça seçimi

**Sonuç:** Referans görsele uygun, bölge renkleriyle anlaşılır donatı kafesi.

**İşler:** Donatı yollarını düz/yay segmentleriyle kur; kanca, paspayı, 27 etriyenin belgelenmiş yerleşimi ve filizleri tamamla. Katmanlar: beton, boyuna donatı, etriyeler/bölgeler, filizler, ölçü işaretleri. İkinci çirozlu öğretim önayarı ekle. “Sadece etriye / sadece boyuna / tümü”, seçim, HTML parça listesi ve bilgi kartını bağla. Instanced seçim kimliklerini doğrula.

**Bitiş:** Yakından görülen etriye yalnız dikdörtgen çizgi değildir; büküm/kanca okunur. Seçilen donatı ile bilgi kartı eşleşir. Gizleme model koordinatlarını değiştirmez. C1 ve çirozlu önayar birbirine karışmaz.

**Kontrol:** Bağımsız beklenen konumlarla sayım ve koordinat testleri; paspayı/sınır kontrolleri; 20 katman/önayar değişimi; iki temada yakın plan görsel kontrol. Tam ekran piksel snapshot tek doğruluk ölçüsü olmaz.

**Sınır:** Tam yönetmelik kontrolü, nervür modelleme ve genel çakışma çözümü yok.

### Aşama 03 — 2B çizim, eşleme ve kontrollü kesit

**Sonuç:** Soldaki teknik çizim ile sağdaki kafes aynı parçayı anlatır.

**İşler:** Modelden SVG boykesit ve temsilî enkesit; ölçüler ve birimleri; 2B ↔ 3B kalıcı seçim. Tek etkin kesit düzlemi; kolonda düşey konumu ayarlanabilir yatay kesit. Kesik beton yüzü basit prizma geometrisiyle kapatılır; açık boş kabuk bırakılmaz. “Temsilî enkesit” sürekli donatı yerleşimini anlatır; “bu kottaki kesit” ise donatı çapını hesaba katar. Genel CSG/analitik CAD motoru kurulmaz.

**Bitiş:** Seçim iki görünümde eşleşir; kot değiştirme gerçek model konumundan türetilir. Etriye üstündeki ve arasındaki kotlar aynı sonuç gibi sunulmaz. Mobilde 2B/3B sekmesi okunabilir.

**Kontrol:** Bölge sınırları, etriye merkezi ve çapın hemen dışındaki kotlar; ölçü–model eşleşmesi; seçimi gizleme/reset; 320 ve 1366 px taşma kontrolü.

**Sınır:** X/Y/Z düzlemlerinin aynı anda kesmesi, sınırsız çapraz kesit geometrisi, CAD pafta ihracı yok. Karmaşık kesitte temsilî görünüm kullanılıyorsa adı açıkça belirtilir.

### Aşama 04 — Kolon öğrenme deneyimi ve ilk tamamlanmış teslim

**Sonuç:** Kolon, ilk beş dakikalık öğretim senaryosunu baştan sona karşılar.

**İşler:** 4–6 öğrenme adımı, parça odaklama, geri/ileri/serbest moda dön, patlatma 0–100, tek zaman parametresiyle katman katman gösterim. Reset ve reduced-motion. Patlatılmış konumlar gerçek ölçü hesabına karışmaz; “parçalar açıklama amacıyla ayrılmıştır” ibaresi. Kesit açılırken patlatma sıfırlanır; öğrenme oynatılırken çelişen serbest animasyon durur. Bu davranışlar reducer'da açık tanımlanır.

**Bitiş:** Döndür → betonu gizle → etriyeyi seç → 2B karşılığını gör → kesit kaydır → patlat → öğrenme adımını ilerlet/geri al → sıfırla akışı çalışır. Mobil çekmece ve tema tamamdır.

**Kontrol:** Bu senaryonun tek e2e testi; `t=0/1` ve ileri–geri tutarlılığı; ilk production build; simülasyon kodunun katalog/ana sayfa açılışında yüklenmediğine build + ağ kanıtı. Zaten CAD'nin yüklediği Three.js yanlışlıkla yeni regresyon sayılmaz.

**Sınır:** “Biraz daha cilalayalım” gerekçesiyle ikinci kolon tasarım turu yok. Kabul maddeleri geçtiyse Aşama 05'e geçilir.

### Aşama 05 — Kiriş

**Sonuç:** Aynı kontrollerle incelenen kiriş donatı sahnesi.

**İşler:** Tek kiriş örneği, alt/üst donatı, mesnet/açıklık etriye bölgeleri, uç mesnet temsili; 2B boykesit/enkesit, katmanlar ve 4–6 kısa adım. Donatının görevi örneğin yükleme kabulüyle açıklanır; “çekme her zaman alttadır” genellemesi yapılmaz.

**Bitiş:** Kiriş katalogdan açılır, mesnet ve açıklık bölgesi seçilir; katman, 2B eşleme, kesit ve patlatma ortak kontrollerle çalışır. Kolon akışı sürer.

**Kontrol:** Kiriş sayım/koordinat testi; bir kullanıcı akışı; kolon için kısa aç/gizle/reset regresyonu.

**Sınır:** Sürekli sistem çözücüsü, otomatik moment diyagramı, pilye varyant kataloğu yok.

### Aşama 06 — Kolon–kiriş dış birleşimi

**Sonuç:** Yoğun donatı ilişkisini anlaşılır gösteren tek dış birleşim.

**İşler:** Kolon ve kiriş builder'larını birleştir; birleşim çekirdeği ve ankraj gösterimi; parça gruplarını izole et; kesit/patlatma/2B görünüm/öğrenme adımlarını ekle. Parça kimlikleri sahne içinde benzersizdir. Her ankraj ölçüsü öğretim varsayımı veya doğrulanmış koşullu bilgi olarak kayıtlıdır.

**Bitiş:** Kullanıcı kolon etriyelerini ve kiriş donatılarını ayrı görebilir; ankrajı yakın inceleyebilir. Kasıtsız donatı iç içe geçmesi ve betonun önemli detayı tamamen örtmesi yoktur.

**Kontrol:** Dönüşüm ve ID testleri; birleşimin üç bakışta görsel incelemesi; seçim/kesit/reset akışı.

**Sınır:** İç/köşe birleşim, otomatik donatı çakışma analizi, sanal vibratör yok.

### Aşama 07 — Tekil temel

**Sonuç:** Temel ızgarası ve kolon filizlerinin ilişkisi görünür.

**İşler:** Bir temel ve kolon; alt X/Y donatı katmanlarının gerçek yükseklik farkı; filiz ayakları; paspayı takozları; temsilî grobeton. Plan + düşey kesit, katman ve öğrenme adımları. Zemin ve grobeton yalnız bağlam gösterimidir.

**Bitiş:** Alt ızgara, filiz ve beton ayrı incelenir; plan ve kesit aynı koordinatları gösterir. Filiz bükümü düz çizgiyle sahte temsil edilmez.

**Kontrol:** Izgara adet/konum ve iki doğrultunun kot farkı; filiz/beton sınırları; tek mobil kullanıcı akışı.

**Sınır:** Zemin taşıma gücü, zımbalama hesabı, su yalıtımı/topraklama/tesisat sistemi yok.

### Aşama 08 — Perde

**Sonuç:** Gövde ve uç bölgeleri ayırt edilen iki yüzlü perde kafesi.

**İşler:** Boşluksuz tek perde; iki yüzde yatay/düşey donatı, uç bölge donatıları ve bağlayıcılar; 2B ve katman odakları; 4–6 öğrenme adımı. “Bütün perdelerin bu ölçüyle yapılacağı” izlenimi verilmez.

**Bitiş:** Ön/arka gövde donatısı ve uç bölgeler ayrı seçilir. Kullanıcı yalnız bir yüzü görerek tek sıra donatı olduğu sonucuna yönlendirilmez.

**Kontrol:** İki yüz konumları, bağlayıcı kimlikleri, bütçe sınırı; kesit ve patlatma akışı; kolon/kiriş kısa regresyonu yalnız ortak çekirdek değiştiyse.

**Sınır:** Kapı/pencere boşlukları, bağ kirişi, tüm kritik yükseklik hesapları yok.

### Aşama 09 — Radye ve altı sahnenin katalog tamamlanması

**Sonuç:** Altı sahnelik ilk kütüphane tamamdır.

**İşler:** Tek radye parçası; alt/üst iki yönlü ızgara, sehpa, bir kolon filizi grubu; katmanlar ve kesit. Tekil temeldeki ızgara üreticisini yeniden kullan. Altı karta hafif SVG poster ve kısa öğrenme özeti ekle. Yeni sahneler route düzeyinde yalnız hazır olduklarında açılır.

**Bitiş:** Altı route doğrudan ve katalogdan açılır; radye üst/alt donatısı ayrı görülür; mantıksal donatı sayısı performans için eksiltilmez.

**Kontrol:** Izgara/adet/katman kotları; altı route smoke; radye Hafif profil geometrisi ve draw-call bütçesi.

**Sınır:** Bütün binanın radyeyi yüklemesi, çoklu aks sistemi veya radye tasarımı yok.

### Aşama 10 — Sınırlı parametre denemesi ve bağlantı paylaşımı

**Sonuç:** Kolonda kontrollü deney; tüm sahnelerde aynı görünümü tekrar açan link.

**İşler:** Yalnız kolon için kesit boyutu, boyuna donatı çapı ve bölgesel etriye aralığını doğrulanmış teknik aralıklarda değiştir. UI aralıkları ürün/geometri limitidir, yönetmelik limiti değildir. İlk teknik aralıklar: kesit 250–600 mm, boyuna çap 12–32 mm, etriye aralığı 75–200 mm; tüm kombinasyonlar ayrıca hacim/örtü/çubuk yerleşimi kontrolünden geçer. Donatı adedi ve boy/zonal uzunluklar önayara bağlı kalır. Girdiler taslakta değişir; “Uygula” ile bir model üretilir. Geçersiz girişte son geçerli sahne korunur ve neden yazılır.

URL'nin sürümlü izin listesi: sahne/önayar, hazır kamera yönü, katman maskesi, parça ID, görünüm modu, kesit ekseni ve normalize konumu, patlatma, öğrenme adımı; kolon için yalnız izinli üç parametre grubu. URL en fazla 2 KB, sayılar sonlu ve sınırlı. Serbest kamera matrisleri taşınmaz. “Bağlantıyı kopyala” ile üretilir; her frame history yazılmaz. Aynı sıra ile parse → validate → model → view uygulanır.

**Bitiş:** Geçerli kolon denemesi 2B/3B birlikte günceller. Link yeni sekmede aynı tanımlı görünümü kurar; serbest orbit konumu paylaşılmadığı UI'da açıktır. Bozuk link güvenli varsayılana döner; kırılma/donma yok.

**Kontrol:** Round-trip; bilinmeyen sürüm/slug/ID; negatif, NaN, Infinity, uzun URL; görünmez parça seçimi; küçük aralıkla geometri bütçesi. Sıfırlama URL parametresini gizlice tekrar uygulamaz.

**Sınır:** Proje kaydetme, üyelik, backend, otomatik taslak ve tüm elemanlara serbest editör yok.

### Aşama 11 — Bir defalık bütünleştirme ve dayanıklılık

**Sonuç:** Altı sahne ortak davranış ve cihaz sınırları açısından doğrulanır.

**İşler:** WebGL yok/context loss/yeniden dene; art arda sahne değişimi; klavye ve ekran okuyucu alternatifi; iki tema; reduced-motion; mobil panel ve yön değişimi. Sadece ölçümde görülen darboğazları düzelt. Teknik içerikte kaynaksız normatif iddiaları çıkar veya kaynakla sınırla.

**Bitiş:** Kritik akışlarda açık hata yok; 2B yedek çalışır; uygulamaya ait kaynak/listener/RAF sayıları art arda kullanımda birikmez. Performans raporu hangi cihazda ölçüldüğünü belirtir.

**Kontrol matrisi:** Tam kolon senaryosu Chromium 390 ve 1366 px; altı sahne için kısa aç/seç/kesit/reset turu; 320/768/1024/1920 px yalnız yerleşim; WebKit'te açılış/panel/geri dönüş; 10 sahne değişimi ve 10 route giriş/çıkışı. Tüm genişlik × tema × sahne × tarayıcı kombinasyonlarıyla patlayan matris kurulmaz.

**Sınır:** İlgisiz CAD/PDF/Belge motorlarını düzeltme projesi yok; gerçek telefon erişimi yoksa emülasyon fiziksel test gibi raporlanmaz.

### Aşama 12 — Son kabul, yaşayan kayıt ve teslim

**Sonuç:** Geliştirme bitmiş, yerel olarak doğrulanmış, yayın durumu açık teslim.

**İşler:** Son değişen kaynakta lint; runtime ve test tip kontrolü; simülasyon model/browser kontrolleri; araç metadata/envanter/registry ve navigasyon kontrolleri; production build. Son production bundle üzerinde kritik simülasyon akışını çalıştır. Ana Sayfa, Araçlar, Mevzuat, Belgeler ve Dokümantasyon için kısa açılış/geri dönüş smoke yap. Ortak bağımlılık değişmediyse tüm CAD/PDF testlerini koşma. PROJECT.md'ye gerçek rota/motor/test durumunu kısa ekle; takip dosyasını kapat.

**Bitiş:** §10 final listesi tamam; zorunlu başarısız test yok; bilinen sınırlılıklar ve yayın durumu kayıtlı. Artık bir sonraki geliştirme aşaması yok.

**Sınır:** Yeni özellik, yeni audit fazı, gereksiz yeniden mimari veya kendiliğinden deploy yok. Sadece doküman değiştiyse son başarılı kaynak build'i aynı kaynak hash'i için geçerli kalır.

## 8. “Devam” protokolü — tekrar döngülerini kesen kurallar

1. Uygulayıcı önce takip dosyasını, git durumunu ve yalnız sıradaki aşamanın ilgili dosyalarını okur. Her tur üç eski planı ve bütün repoyu yeniden analiz etmez.
2. Bir “devam”, `sıradaki_aşama` görevini **uygulama yetkisidir**; tekrar plan hazırlama isteği değildir. “Başlayayım mı?”, “test edeyim mi?”, “sıradaki aşamaya geçebilir miyim?” diye aynı turda onay istenmez.
3. Aşamayı uygula, ilgili kontrolleri çalıştır, takip dosyasına sonucu yaz ve kısa teslim ver. Sonraki aşama yeni “devam” ile başlar. Kullanıcı hepsini sürdür derse bu tempo isteği uygulanır.
4. Tamamlanmış aşama yalnız yeni, tekrar üretilebilir regresyon kanıtıyla açılır. Daha güzel yapılabilir düşüncesi kanıt değildir. Regresyon bug olarak mevcut aşamaya iliştirilir; bütün plan başa sarmaz.
5. Bir aşama tek turda teknik olarak bitmezse tamamlanan iş korunur; `DEVAM_EDIYOR` ve en fazla üç somut kalan iş yazılır. Sonraki “devam” o işi sürdürür. Bitmiş adımlar yeniden yazılmaz.
6. Normal, geri alınabilir teknik kararları ajan verir. Gerçek kullanıcı bilgisi/erişimi gerekirse tek somut soru sorar; bağımsız yapılabilir işi tamamlar.
7. Her aşamada yeni rapor/test çerçevesi/plan versiyonu oluşturulmaz. Kalıcı iki Markdown yeterlidir; test ekran görüntüsü/logu mevcut test çıktı dizinindedir.

### Hata çözme sınırı

- İlk başarısız kontrolden sonra kanıtlı en fazla **iki düzeltme denemesi**. Bir deneme: açık hipotez → kod/ayar değişikliği → yalnız etkilenen kontrol.
- Aynı komutu hiçbir değişiklik veya yeni kanıt olmadan yeniden çalıştırma. Ortam kaynaklı tek yeniden deneme de bu sayaca dahildir.
- Sayaç hata kimliğiyle takip dosyasına yazılır; yeni sohbet veya “devam” sayacı sıfırlamaz. Hata adını değiştirerek sınır aşılmaz.
- İki denemeden sonra zorunlu iş hâlâ başarısızsa `ENGELLI`: gözlenen hata, denenmiş iki yol, gereken belirli değişiklik ve mümkün bağımsız iş kaydedilir. Yeni kanıt/erişim/tercih gelmeden aynı hata yeniden denenmez.
- Engelli özellik zorunluysa aşama tamamlanmış sayılmaz. Kullanıcıya bitişi varmış gibi göstermek için test kapatılmaz, eşik gevşetilmez veya sahne gizlenerek altı sahne tamam denmez.
- Teknik belirsizlikte önceden seçilmiş sade uygulama kullanılır: karmaşık alt çekmece yerine basit panel, genel CSG yerine tanımlı prizma kesiti, serbest kamera paylaşımı yerine hazır yönler. Bunlar kabul ölçütünü koruyan kapsam kararlarıdır.
- Yeni özellik talebi dışında aşama sayısı büyütülmez. Kullanıcı kapsam eklerse etki ve yeni bitiş noktası açık yazılır; gizli 13. aşama yaratılmaz.

### Tur sonu raporu

```text
Aşama 03/12 tamamlandı: 2B çizim ve kesit.
Görülebilir sonuç: ...
Doğrulama: ... (gerçek komut ve sonuç; yapılmayan kontrol varsa belirt)
Açık zorunlu hata: yok / somut engel
Sıradaki: Aşama 04 — öğrenme ve patlatma.
```

En fazla bu kadar operasyonel özet; yapılan tüm tool çağrılarını anlatma. Uzun iş sırasında yaklaşık bir dakikada bir anlamlı ilerleme bilgisi ver.

## 9. Test ve süre bütçesi

**Mevcut araçlar kullanılır:** Saf TS testleri mevcut `tsx`/Node test yaklaşımıyla; tarayıcı testleri mevcut Playwright ile. Yeni test framework eklenmez. Uygulamada en fazla üç simülasyon komut ailesi yeterli: `check:simulations:model`, `check:simulations:ui`, `check:simulations`. Bu adlar şu anda öneridir; package.json'a eklendiği aşamadan önce varmış gibi çalıştırılmaz.

| Kontrol | Ne zaman | Tek çalıştırma üst sınırı |
|---|---|---|
| İlgili model testleri / lint | İlgili değişiklik yapılan aşama | Her biri 2 dakika |
| Typecheck | Kaynak/şema/arayüz değişen aşama | 3 dakika |
| Hedefli browser akışı | UI davranışı değişen aşama | 5 dakika |
| Production build | Aşama 04 ve 12; ara aşamada ancak somut ihtiyaç | 15 dakika |
| Son birleşik kabul | Aşama 12 | 30 dakika, alt komutların ayrı deadline'larıyla |
| Eleman / sayfa / server hazır bekleme | Her browser testi | 8 sn / 45 sn / 60 sn |

Bu süreler başarı garantisi değil **sonlandırma sınırıdır**. Timeout başarısız kontrol sayılır. Gerçek repo baseline'ı meşru olarak daha uzunsa yalnız kanıtla bir kez süre ayarlanabilir; her başarısız çalıştırmada artırılmaz.

Test runner'ın kendi timeout'u dışında child process ve başlatılan sunucunun duvar saati watchdog'u olur. Repo test standardındaki `schedule/manage_task` araçları mevcut değilse eşdeğer deadline ve yalnız bu işe ait PID/process-tree temizliği uygulanır; olmayan araç beklenmez. Tarayıcı ve sunucu `finally` ile kapanır; kullanıcının mevcut dev server'ı veya bütün Node süreçleri öldürülmez. Bağımsız scriptler repo standardına uygun çıkış kodu verir; Playwright runner'ı test içinden zorla kapatılmaz. Çıplak PowerShell `curl` kullanılmaz.

`exit code 0` ile hata basan script PASS sayılmaz. İlgisiz önceden var olan hata ayrı baseline kaydıdır; yeni değişiklikten kaynaklanan hata düzeltilir. Kırmızı bir genel kapı varken “production hazır” etiketi verilmez.

### Performansın ölçülebilir kabulü

- Sıcak sahnede aynı 10 saniyelik kamera turu; cihaz/tarayıcı/viewport/kalite profili kayıtlı. Masaüstü hedefi medyan yaklaşık 60 FPS, desteklenen test cihazında Hafif profil kabulü medyan en az 30 FPS ve p95 kare süresi en fazla 50 ms. Bunlar test cihazı için eşiktir; tüm telefonlara garanti değildir.
- Yazılım WebGL ile fonksiyon testi yapılabilir; performans sonucu fiziksel GPU sonucu diye kullanılamaz. GPU ölçümü yapılamadıysa `OLCULMEDI` yazılır; performans onaylandı denmez.
- Durağan sahnede 5 saniye boyunca uygulamanın yeni RAF üretmediği doğrulanır; tüm bilgisayarın CPU/GPU yükünün sıfırı ölçülmez.
- Tekrar kullanımda uygulamanın sahip olduğu kaynaklar kapatılır; ısınma sonrası sayaçların sürekli büyümediği aranır. JS heap için anlık mutlak eşitlik veya Three.js cache'i için sıfır şartı konmaz.
- Önce iki temada 390/1366 px görsel doğrulama; diğer genişlikler hedefli. Her sahnenin her parametresinin ekran görüntüsü alınmaz.
- Gerçek telefon erişimi yoksa yerel yazılım teslimi kapanabilir; fiziksel cihaz kabulü ve buna bağlı yayın kararı açıkça beklemede kalır. Fiziksel cihaz performansı doğrulanmış diye işaretlenmez.

## 10. Kesin bitiş listesi

1. Altı sahne doğru route'larda açılıyor, hazır olmayan içerik çalışıyormuş gibi listelenmiyor.
2. Döndürme, zoom, pan, sığdırma ve sıfırlama çalışıyor; model kaybolduğunda geri getirilebiliyor.
3. Beton ve donatı katmanları ayrı kontrol ediliyor; gizli parçalar yanlış seçilmiyor.
4. 2B/3B aynı modelden türetiliyor; parça kimlikleri ve ölçüler eşleşiyor.
5. Kesit ve temsilî çizim ayrımı açık; patlatılmış geometri gerçek ölçüyü değiştirmiyor.
6. Öğrenme adımları ileri/geri çalışıyor; montaj açıklaması zorunlu saha prosedürü gibi sunulmuyor.
7. Kolon parametreleri doğrulanıyor; geçersiz giriş sahneyi bozmuyor.
8. Paylaşım URL'si izin verilen görünümü yeniden kuruyor; bozuk veri güvenli davranıyor.
9. 2B yedek ve bağlam kaybı akışı çalışıyor; sonsuz yeniden kurma/RAF yok.
10. Mobil, klavye ve iki tema için tanımlı kabul matrisi tamam; fiziksel testin gerçek durumu yazılı.
11. Gerekli model/lint/typecheck/build ve hedefli browser kontrolleri başarılı; sonuçlar kaynak revizyonuna bağlı.
12. Mevcut hesap formülleri ve korunan motorlar değişmemiş; kısa site smoke tamam.
13. Teknik içerikte kanıtlanmamış uygunluk iddiası yok; açık varsayımlar örnek olarak işaretli.
14. Takip dosyasında zorunlu açık uygulama işi yok; PROJECT.md gerçek mimariyi anlatıyor.

**Bu liste tamamlanınca durum `YEREL_TESLIM_TAMAM`.** Sonraki “devam” yeni audit veya özellik başlatmaz; “12/12 tamamlandı; geliştirme işi kalmadı” sonucunu bildirir. Fiziksel cihaz/yayın şartı bekliyorsa tam olarak hangisi olduğu belirtilir. Yayınlanmamış ürüne “canlıya alındı” denmez.

## 11. Commit, yayın ve geri alma

Bu oturumun talebi plan hazırlamaktır; kod uygulaması veya yayın değildir. Sonraki “devam” uygulamayı başlatır. Plan ve takip dosyası yerelde tutulur; her aşama sonunda commit/push gerekmez.

Uygulama `internal-*` dalında ilerler. Remote checkpoint gerektiğinde repo AGENTS.md okuma ve doğrulama sırası uygulanır; aynı amaca ait dosyalar tek anlamlı committe toplanır, korumalı branch ve `[skip ci]`/`[skip vercel]` kullanılır. İlk korumalı push sonrasında yeni deployment oluşmadığı kontrol edilir. `main` ara çalışma alanı değildir.

Bu planın geliştirme bitişi yerel teslimdir. Mevcut oturumda yayın yetkisi verilmediği için otomatik deploy yapılmaz. Kullanıcı daha sonra açık yayın yetkisi verirse mevcut repo çalışma modu ve önceki yetki uygulanır; tekrar tekrar izin istenmez. Hedef 0 Preview; somut ihtiyaç varsa tek Preview. Build sistemi değişirse AGENTS.md'nin aynı commit için Linux Preview ve doğrulanmış artifact şartı geçerlidir; bu projede build sistemi değişikliği planlanmıyor.

Yayın öncesi açık zorunlu test/cihaz koşulları ve kaynak revizyonu kontrol edilir. Normal yerel IDE akışında tek doğrulanmış main checkpoint Production'ı tetikleyebilir. ChatGPT remote akışında hazırlanan branch kullanıcı/IDE devrine uygun bırakılır. Bu iki süreç birbirine karıştırılmaz.

Geri alma: yayından önce son iyi commit/deployment kimliği kaydedilir; sorun yalnız simülasyondaysa giriş ve ilgili route'u birlikte kapatan kontrollü düzeltme veya önceki deployment'a dönüş uygulanır. Veritabanı/migration olmadığı için veri geri dönüş işi yoktur. Yayın hatasında arka arkaya noop push yapılmaz.

## 12. Yeni sohbet veya başka ajan için tek başlangıç metni

```text
Bu repo için docs/simulasyonlar/BIRLESIK_UYGULAMA_PLANI.md ve
docs/simulasyonlar/UYGULAMA_DURUMU.md dosyalarını esas al.
PROJECT.md, AGENTS.md ve işe ilişkin repo kurallarını oku.
Takip dosyasındaki sıradaki aşamayı uygula; bu bir yeniden planlama talebi değildir.
Tamamlanan aşamaları somut regresyon kanıtı yoksa yeniden açma.
İlgili testleri süre sınırıyla çalıştır; aynı hata için kayıtlı iki düzeltme sınırına uy.
Çalışmayan işi tamamlandı gösterme. Kaynak planlardaki kapsam dışı fikirleri geri ekleme.
Güncel kod ile takip kaydı çelişirse yalnız çelişen bölümü doğrula ve kaydı düzelt.
Aşama sonunda takip dosyasını güncelle, kısa sonuç ve sıradaki aşamayı bildir.
12. aşama ve final kabul tamamlanınca geliştirmeyi kapat.
```

**Başlama komutu:** “Devam.”
