# BELGELER V5 — ÜÇ PLANIN BİRLEŞTİRİLMİŞ, SIFIR REGRESYON ODAKLI NİHAİ PERFORMANS PLANI

> **Plan ID:** `BELGELER-PERF-TRIPLE-MIX-V5-20261024`  
> **Revizyon:** `5.0 / nihai birleşim`  
> **Tarih:** 24 Ekim 2026 · Europe/Istanbul  
> **Planlama:** `PLAN_HAZIR` · **Uygulama:** `BASLAMADI`  
> **Uygulayıcı:** **Gemini 3.8 Flash (medium)**; Windows üzerindeki yerel mühendislik projesinde yetkili masaüstü ajanı  
> **Rol ayrımı:** ChatGPT araştırma/eleştiri/planlama yapar. Uygulayıcı, yerel çalışma ağacında adım adım gerçekleştirir.  
> **İncelenen kaynak sürümü:** `smitelagwar/muhendislik-site` / `main` — **`fa17d8c570d70f6d8a0de058a5208258992af39c`**, 24.10.2026, 17:01 UTC. Bu commit, önceki araştırma sürümü `0829eaecef3ffb30095000cf5cd1669cca718e1f` üzerine gelmiştir. **Yerel klasörün bu commit ile aynı olduğu varsayılmaz.**  
> **Yayın:** Yerel aşamalarda **Preview/Production deploy yapılmaz**. Son kalite kapısından sonra, repo talimatlarına uygun **tek atomik `main` push → tek otomatik Vercel Production deployment** öngörülür. Kullanıcı ayrı bir yayın yasağı getirirse o talimat uygulanır.  
> **Tek cümlelik misyon:** `/belgeler` kataloğundaki mobil/masaüstü kasmayı **kanıtlanan kök neden üzerinden** azalt; beş stüdyonun açılışını ve ilk gerçek PDF görüntüsünü **asla feda etme**; mevcut arayüz, hareket estetiği, otomatik taslak ve tüm PDF işlevlerini koru.

---

## 00. OKU ÖNCE — KIRMIZI ÇİZGİLER

1. **Önce ölç, sonra değiştir.** Bir hipotezi “kesin sorun” diye yazma. Ölçümlerde kazanım görülmezse veya kazancın bedeli başka bir aşamada ortaya çıkarsa ilgili yamayı **hedefli geri al**. Performansı Lighthouse puanından ibaret sanma.
2. **Beş belgeye geçiş korunur.** Açılış hızındaki kabul edilebilir yön **aynı veya daha iyi** olandır. Katalog biraz hızlandı diye herhangi bir belgenin tıklama → kullanılabilir form veya tıklama → **ilk tamamlanmış, görünür PDF çizimi** süresinin tekrarlanabilir biçimde kötüleşmesine izin yoktur.
3. **Görsel/işlevsel eşlik:** Renkler, cam yüzey, gölge, kart büyüklüğü ve sıralaması, rozetler, tema anahtarı, ikonlar, turuncu CTA, arama, üst bar, alt navigasyon, klavye ve dokunmatik davranışı korunur. Eşdeğer alternatif ancak **çok kareli açık/koyu karşılaştırma** ve performans kanıtıyla kabul edilir. Animasyonu sırf hız için statik görüntüye çevirme.
4. **PDF kalitesi ve doğruluğu değişmez:** şablonlar, gerçek fontlar, Türkçe karakterler, metin ölçümleri, belge alan konumları, çoklu sayfalar, editable AcroForm çıktısı, salt-okunur paylaşım PDF'si, yakınlaştırma, Sığdır, indir/yazdır, PDF üzerindeki düzenleme ve vurgu aynen korunur. **DPR/canvas keskinliği sırf hız amacıyla düşürülmez.**
5. **Mevcut optimizasyonlar silinmez:** `next/link` otomatik ön yüklemesi; `use-belge-studio-document.ts` ilk üretim zamanlaması; `prewarmBelgeDocument`; `prewarmBrowserPdfJs`; `pdfjs-client.ts` promise/worker paylaşımı; `pdf-engine.ts` içindeki şablon/font cache; PDF renderTask iptalleri korunur. Ölçmeden ikinci bir sistem ekleme.
6. **24 Ekim yeni V3 sistemi korunur:** **2000 ms trailing, sessiz otomatik taslak**; kaydın geri getirilmesi; Sıfırla/Temizle sonrasındaki senkron veri bütünlüğü; Geri Al; header/zoom/footer yerleşimi; tema anahtarının en sağda olması; `✓ Kaydedildi` minimalist durumu; yeni testler ve eski taslak göçü. Bu işlerin hiçbirini “performans refactor” adı altında geri döndürme.
7. **Kod alanı dar:** `/belgeler` liste, arka plan, gerekirse kanıtlı belge geçişi ve ilk PDF çizim yolu. CAD/DXF/DWG, Dokümantasyon PDF motoru, hesaplayıcı formülleri, başka sayfalar, API kota/kimlik/doğrulama/Blob altyapısı **kapsam dışıdır**. Paylaşılan dosyaya ancak kök neden kanıtı ve ilgili tüketicilerin testleriyle dokun.
8. **Yeni dependency, framework güncellemesi, servis değişimi, manuel cache invalidation, herkese zorunlu yeni global provider, büyük refactor yok.** Herhangi biri gerçekten zorunlu hale gelirse aşamayı **ENGELLI** kaydet, kapsam genişletip sessizce uygulama.
9. **Kullanıcı verisi silinemez.** `localStorage`, IndexedDB, PDF taslakları, tokenlar ve oluşturulmuş dosyalar gerçek kullanıcı verisidir; `localStorage.clear()`, depo resetleme, key değiştirme yasaktır. Testler izole profil ve sentetik örnek kullanır.
10. **Yerel çalışma korunur:** otomatik `git reset --hard`, kör `checkout`, `git clean`, kullanıcının değişikliklerini ezen `pull`, her aşamada `commit/push/deploy` yok. Doğrulama süreçleri yalnız kendileri açtıkları browser/server'ı `finally` ile kapatır.
11. **Soru döngüsü yok:** Uygulayıcı mevcut aşama içindeki mikro kararları kaynak/ölçüme göre verir. Yeni kullanıcı tercihi gerektiren tasarım değişikliği yerine mevcut görünümü korur; kanıtlanamayan riskte durup blocker bildirir.
12. **Her “devam” en çok bir aşama.** Bir aşama bitmeden sonraki aşamaya geçme. Son aşama `TAMAMLANDI` ise yalın “devam” kesinlikle yeni iş, test veya deploy başlatmaz.

---

## 01. ÜÇ PLANIN ELEŞTİREL SENTEZİ — NE ALINDI, NE REDDEDİLDİ?

**Kaynaklar:**
- **Plan A:** Kullanıcının yüklediği `belgeler_hizlandirma_plani.md` (232 satır; FAZ 0–6, H1–H11 hipotez tablosu).
- **Plan B:** Kullanıcının yüklediği `hızlandırma.md` (822 satır; 6 aşama, spekülatif yükleme ve PDF render örnekleri).
- **Plan C:** Önceki GPT araştırma planı `BELGELER_SIFIR_REGRESYON_PERFORMANS_NIHAI_PLAN_2026-10-24.md` (7 aşama, GitHub koduna dayalı teşhis ve koruma).

**Plan A'dan alınanlar:** Hipotezleri etiketleme; Chrome Paint Flashing/Layers/Performance; mobil GPU filtre maliyeti A/B; semantik arama/tema/erişilebilirlik; 5 belge için cold/warm geçiş testi; ayrı geri dönüş raporu. **Düzeltilenler:** `prefetch={false}` geçişi önerisi **uygulanmayacak**; beş kartı sanallaştırma/content-visibility/debounce/memo otomatik görev değil, yalnız ölçümlü istisna. Her faz commit/tag zorunluluğu yok. Plan A'nın “Vercel'e hiç deploy yok” hükmü güncel repo yerel release kuralıyla çeliştiğinden, **son aşamada tek kontrollü production** seçildi.

**Plan B'den alınanlar:** Stüdyo girişinin tek gerçek hedef olarak görülmesi; ağ şelalesi ve ilk PDF çizimi gözlemi; PDF raster işlemi/ResizeObserver yarışlarını araştırma; oturumluk resource cache hata yollarını denetleme; detaylı Playwright/cihaz matrisi. **Düzeltilenler:** Mobilde sürekli akvaryum Canvas çalışıyor iddiası kodla çelişiyor; `/belgeler/*` altında tüm Canvas işini kapatmak **gerçek PDF önizlemesini bile bozabilecek yanlış kuraldır**. `0 canvas / 0 RAF` global şartı konmayacak. Varsayılan “2×–3× hızlanacak”, `%90 GPU azalacak`, `tek render zorunlu`, `60/120 FPS garantisi` iddiaları **kanıt değil**. Zorunlu opak kart/blur sıfırlama görsel estetiği değiştirir. Beş şablonu ve worker'ı peşinen ısıtmak katalog girişini geciktirebilir. `pdf-engine.ts` ve `pdfjs-client.ts` zaten cache kullanır. Statik önerilen DPR tavanı keskinliği düşürebilir. Plan B'nin örnek E2E testindeki `/belgeler/santiye-sefi-hizmet-sozlesmesi`, `/belgeler/insaat-ruhsati-basvuru-dilekcesi`, `/belgeler/santiye-sefligi-istifa-dilekcesi` yolları **gerçek route değildir**; o örneği kopyalama. Bir `canvas` DOM'da görünür diye “PDF gerçekten çizildi” sonucu çıkarma.

**Plan C'den alınanlar:** Kodun gerçek 4 blur blob + masaüstü-only Canvas ayrımı, Next `<Link>` avantajı, mevcut PDF/font/worker ön ısıtması, test edilebilir nüanslı geri alma, 7 tekrar ve medyan/p75, değişmeyen PDF kalitesi. **Güçlendirilenler:** Güncel `fa17d8c` V3 taslak/toolbar commit'i eklendi; erken/sonraki planlar arasındaki release çelişkisi çözüldü; beş stüdyo için **ilk PDF, editable/download/share, draft V3** ayrı regresyon kapısı kondu; render/observer maliyetinin sahte hız izlenimi yaratmasını önleyen net ölçüm protokolü eklendi.

### Nihai karar tablosu

| Öneri | Karar | Gerekçe / uygulanma koşulu |
|---|---|---|
| Mobilde akvaryumu kapat | **RED** | Standart dokunmatik telefonda `AmbientOceanCanvas` zaten `null` döndürür. Yanlış teşhis. |
| 4 büyük blur blob'un maliyetini A/B test et | **KABUL** | Gerçek mobil aday; maliyet kanıtlanırsa eş-görünümlü optimize alternatif denenir. |
| Masaüstü akvaryumunda scroll/layout ölçümünü birleştir | **KOŞULLU KABUL** | Canvas zaten adaptive FPS/hidden cleanup içeriyor; yalnız gerçek trace CPU gösterirse. |
| Kartlardaki 2XL `backdrop-blur` azalt | **KOŞULLU KABUL** | Çoklu karede görünüm kaybı ve tema kontrastı olmadan kanıtlı paint kazancı aranır. |
| `transition-all`, kalıcı `will-change` denetimi | **KOŞULLU KABUL** | Layer belleği/paint kanıtıyla hedef eleman; global sınıfları topluca değiştirme. |
| `content-visibility`, sanallaştırma, debounce | **VARSAYILAN RED** | Yalnız beş kart var; CLS, arama gecikmesi, klavye erişimi riski. |
| Beş kartı `React.memo` sar, filtreyi worker'a taşı | **VARSAYILAN RED** | 5 belge + mevcut `useMemo`; önce React Profiler kanıtı. |
| `prefetch={false}` veya Link'i custom pointer prefetch ile değiştir | **RED** | Özellikle belge tıklamasını yavaşlatma riski; Next varsayılanı korunacak. |
| Tüm şablon/font/PDF.js worker'ını katalogda hemen indir | **RED** | Ağ/CPU/heap yarışması yaratır; yalnız kanıtlanmış hedefli ve iptal edilebilir **niyet odaklı** istisna. |
| Yeni singleton PDF font cache/worker ekle | **RED** | Var olan cache/worker mekanizması okunup doğrulanacak; yinelenmeyecek. |
| İlk PDF render'ını bir defaya zorla | **RED / KOŞULLU** | Gerçek ikinci render kanıtlanır ve sebebi sabit ölçü ise optimize et; zorunlu resize/zoom sayfasını bastırma. |
| DPR/pixel limit düşür, preview'ı düşük çözünürlükte göster | **RED** | Kullanıcı PDF kalitesi ve mühendislik belgesi okunabilirliği öncelikli. |
| Her aşama için commit/Preview deploy | **RED** | Yerelde aşama ilerlemesi durum dosyasıyla; doğrulanmış tek release. |
| Mevcut V3 taslak/üst bar regressions | **ZORUNLU** | `fa17d8c` sonrası üretim sisteminin parçası. |

**Kritik etiketler:** Bu dosyada **DOĞRULANDI** kaynak kodda görülen yapıyı; **HİPOTEZ** muhtemel CPU/GPU/network darboğazını; **YERELDE ÖLÇÜLECEK** gerçek tarayıcı davranışını ifade eder. Bu ayrımı raporlarda değiştirme.

---

## 02. PROJE GERÇEĞİ — GÜNCEL KODDAN BİLİNENLER

### 02.1 Gerçek liste ve animasyon yapısı

- **DOĞRULANDI:** `src/app/belgeler/page.tsx` → `src/components/belgeler-hub.tsx` sunar; `BelgelerHub` bir client component. `src/lib/documents-data.ts` içinde beş kartın metadata'sı bulunur. Filtrelemeye `useMemo` zaten uygulanır; `normalizeBelgelerSearchText` korunur.
- **DOĞRULANDI:** `src/components/ambient-ocean-canvas.tsx` yalnız **`(min-width: 768px) and (hover: hover) and (pointer: fine)`** eşleşince `next/dynamic` aracılığıyla `ambient-ocean-scene.tsx` yükler (`ssr:false`). Bu nedenle standart telefonda akvaryum Canvas animasyonu **yüklenmemelidir**. Yine de gerçek tarayıcı/network ile kontrol edilir.
- **DOĞRULANDI:** `ambient-ocean-scene.tsx` Canvas2D'dir, WebGL olduğu varsayılmaz. `requestAnimationFrame`, maliyete göre 30/60 FPS, `devicePixelRatio` en çok 1.75, `document.hidden` koruması, reduced-motion sabit poz, unmount cleanup zaten var. `scroll`, ResizeObserver, DOM MutationObserver ve panel `getBoundingClientRect()` okuması içerir. **Potansiyel masaüstü darboğazı** scroll/yeniden-ölçüm/mask kompozisyonudur; henüz kanıtlanmadı.
- **DOĞRULANDI:** `src/components/belgeler-glass-bg.tsx` mobilde de dört `540–700px` renkli radial gradient bölgesi çizer; `filter: blur(100–110px)` ve 22–30 saniyelik sonsuz transform animasyonları içerir. **Mobil öncelikli HİPOTEZ** bu büyük filtre yüzeylerinin GPU kompozisyon maliyetidir.
- **DOĞRULANDI:** `belgeler-hub.tsx` kartları `backdrop-blur-2xl`, gölge, gradient hotspot ve fare hareketiyle CSS değişkeni güncellemesi kullanır. Gömülü başlık ve CTA `<Link href={document.studioUrl}>` üzerinden çalışır; default Next route prefetch korunmalı.
- **DOĞRULANDI:** `src/components/site-shell.tsx`, `src/components/bottom-nav.tsx` ve navbar/tema anahtarı çevresel performansa katkı verebilir; buradaki global değişikliklerin risk alanı daha geniştir.

### 02.2 PDF kritik yolunda zaten bulunan altyapı

- **DOĞRULANDI:** `src/hooks/use-belge-studio-document.ts` ilk PDF üretiminde **0 ms ek debounce**, kullanıcı girişinden sonraki üretimde `250ms` debounce kullanıyor; PDF.js browser/worker ön ısıtmasını çağırıyor. İlk üretim akışı yeniden geciktirilemez.
- **DOĞRULANDI:** `src/lib/pdfjs-client.ts` `pdfJsPromise`, `sharedPdfWorkerPromise`, `loadBrowserPdfJs`, `getSharedBrowserPdfWorker`, `prewarmBrowserPdfJs` yapısını içerir. Var olan başarısızlık/yeniden deneme ve temizlik sözleşmesi korunmalı.
- **DOĞRULANDI:** `src/lib/pdf-engine.ts` şablon PDF ve font baytları, embedder ve `prewarmBelgeDocument` içeren cache/ön ısıtma yapısına sahip. Yeni generik `force-cache`/Cache API sistemi kurma; önce şablon sürümlemeyi ve mutability'yi denetle.
- **DOĞRULANDI:** `src/components/belge-studio-pdf-preview.tsx` PDF.js `getDocument`, görünür canvas render ve render iptal akışları içerir. `ResizeObserver` var diye zorunlu **çift render** sonucu çıkmaz. İlki gerçekten gereksiz ikinci render mı, yoksa ilk doğru sığdırma/yeniden boyama mı, **trace'te** ayrılmalıdır.
- **DOĞRULANDI:** Kayıt/önizleme/paylaşım V3 farklı lifecycle'lar içerir; `fa17d8c` commit'i `use-belge-auto-draft.ts` ve stüdyo UI dosyalarını değiştirmiştir. Bu commit'i esas almayan eski test/beklentiler güncellenmeden performans kabulü yapılamaz.

### 02.3 Gerçek beş rota — isimleri değiştirme

| Belge | Gerçek rota | Önemli regression |
|---|---|---|
| Beton Döküm Tutanağı | `/belgeler/beton-dokum-tutanagi` | Uzun metin, YİBF, editable PDF |
| Şantiye Şefi Taahhütnamesi | `/belgeler/santiye-sefi-taahhutnamesi` | Çok alan, adres/TC, PDF alan vurgusu |
| Şantiye Şefi İstifa Dilekçesi | `/belgeler/santiye-sefi-istifa-dilekcesi` | Uzun çok satırlı adres ve paragraf |
| İnşaat Ruhsatı Dilekçesi | `/belgeler/insaat-ruhsati-dilekcesi` | Talep metni, varsayılan değerler |
| Şantiye Şefi Hizmet Sözleşmesi | `/belgeler/santiye-sefi-sozlesmesi` | İki sayfalı PDF, sayfa geçişi |

### 02.4 Uygulayıcı ilk aşamada güncel dosyaları yeniden kontrol etsin

`PROJECT.md` → `AGENTS.md` → `GEMINI.md` → `.agents/rules/belgeler-kurallari.md` → `.agents/rules/test-ve-otomasyon-standardi.md` → `.agents/rules/vercel-kurallari.md` → gerekirse `.agents/rules/yasayan-dokumantasyon-bakimi.md` → `docs/BELGELER_SISTEMI.md` → görevle ilgili kod/testler.

**Git farkı kuralı:** `main=fa17d8c` yalnız araştırma anı referansıdır. Yerelde yeni commit / kirli çalışma alanı varsa `git status --short`, `git rev-parse HEAD`, `git diff --name-only` ile **çakışan hedef parçaları belirle**; kullanıcının ileri düzeltmelerini eski koda geri taşıma. Bu planın ASAMA_01'i gerekirse yalnız değişmiş modüllerin bulgu satırlarını günceller.

---

## 03. PERFORMANS ÖLÇÜM SÖZLEŞMESİ — NEDENİ KANITLAMADAN YAMA YOK

### 03.1 Test ortamı

1. **Karşılaştırma `production` build üzerinden yapılır:** `npm run build` (`prebuild` zinciri otomatik çalışır) ardından uygun boş portta `npm run start -- --hostname 127.0.0.1 --port 3005` veya repo test standardının belirlediği tek production sunucu. `npm run dev` süreleri performans kıyasında kullanılamaz. Kullanıcının çalışan sunucusunu kapatma.
2. **Aynı commit/çalışma ağacı ve araç kimliği:** baseline hangi local diff/build'den alınmışsa hash/changed-files ile kaydet. `fa17d8c` production'da servis ediliyor diye varsayma; Vercel sürümü kesin doğrulanabiliyorsa ayrı not düş.
3. **Mobil gerçek cihaz tercihi:** Android Chrome Remote Debugging mümkünse fiziksel cihazda kaydırma/ısınma/tepkisellik ölç. Yoksa Chrome emülasyonu 390×844, 360×800 ve 320×720; `CPU 4×` throttle, `Slow 4G` ağ profili **ayrı senaryolar** olarak. Emülatör GPU'nun fiziksel telefonun tam eşiti olmadığı rapora yazılır. Masaüstü 1366×768, 1920×1080; 768/1024 tablet kırılımları.
4. **Soğuk/sıcak ayrı:** yeni izole context + boş tarayıcı HTTP cache / önceden route ziyaret edilmemiş durum = cold; aynı context'te en az bir önceki render = warm. Gerçek `localStorage` taslakları asla kullanılmaz; test verisi sentetiktir. `navigator.connection`, saveData, offline/hata fallback'i ayrıca doğrulanır.
5. **Gürültü kontrolü:** ilk ölçüm ısınma olarak ayrı tutulur, ardından **en az 7 geçerli tekrar**; medyan, p75 ve mümkünse aralık/kuyruk kaydı. Sıra sabit tuzak yaratmasın diye A-B-B-A varyasyonu ve aynı ortam/çözünürlük kullan. Tarayıcı yükü ve sıcaklık etkisini not et.
6. **Görsel eşlik:** Aynı viewport, DPR, font yüklenmiş, light/dark, aynı animasyon anı. Statik ekranlar piksel karşılaştırmasıyla; hareket eden katmanlar **başlangıç/orta/son** kareler ve gerçek hareket ritmiyle karşılaştırılır. Geçerli animasyon farkını rastgele screenshot zamanından kaynaklanan false positive sayma.

### 03.2 Ölçülmesi zorunlu zamanlar

| Sembol | Neyi ölçüyor? | Gerçek kanıt/yanıltıcı şey |
|---|---|---|
| `CAT-FCP`, `CAT-LCP` | `/belgeler` içeriğinin boyanması | Performance paint entry; Lighthouse tek başına değil |
| `CAT-INPUT` | Arama giriş → sonuç DOM tepkisi | Türkçe eşleşme aynı; debounce ile sahte gecikme yok |
| `CAT-JANK` | 10 sn kullanıcı kaydırma, frame interval, dropped frames, long task, paint/composite | Fazladan ölçüm kodunun kendi yükünü asgari tut |
| `CAT-NET` | İlk JS transfer/evaluate, HTTP istekleri, PDF/font/worker istekleri, prefetch kaynakları | Dev modundan değil production trace |
| `STU-SHELL` | Kart **gerçek tıklama olayı** → stüdyo arayüzü kullanılabilir | `loading.tsx` veya spinner görünmesi hazır sayılmaz |
| `STU-PDF` | Aynı tıklama → doğru belge sayfasının **tamamlanmış ve görünür PDF canvas render'ı** | Sadece canvas elementinin görünmesi, `getDocument` resolve veya ilk boya değil |
| `STU-EDIT` | Tıklama → form alanı odaklanabilir/yazılabilir, güncel PDF alanları eşleşmiş | Taslağın zamanında yüklenmesini kontrol et |
| `STU-RETURN` | Belgeden listeye geri gelme / yeniden giriş | Yeniden açılış warm, sızıntı/artık worker etkisi |
| `STU-HEAP` | 20 tekrar sonrası heap/canvas/RAF/URL/worker yaşam döngüsü | GC sonrası taban eğilimi; tek snapshot yeterli değil |

**Önerilen ölçüm noktaları:** Playwright tıklama olayı, Chrome Performance/Network trace, gerçek PDF.js `renderTask.promise` sonrası bileşenin mevcut `ready` durumuna geçişi, ardından tarayıcıda bir sonraki görünür frame. Mevcut `onStatusChange(revision,status)` güvenilir olduğu **koddan doğrulanırsa** test-only, payload'sız ve üretim davranışını değiştirmeyen gözlemci kullanılabilir. Üretim koduna sürekli `console.log` veya sentetik iş yükü eklenmez. **Global Canvas API monkeypatch yasaktır.** İlk `canvas` DOM düğümünü yakalamak PDF hazır kanıtı değildir.

### 03.3 Nedensellik / A-B deney düzeni

Liste ve render maliyetini birbirinden ayırmak için **yalnız test oturumunda** geçici/stil override ile şu kontrollü karşılaştırmaları yap:

- **M-A/B:** `BelgelerGlassBg` blur+animation aktif / geçici etkisiz → scrolling ve paint farkı. Etkinlikte kart görünümünün değişmesi A/B teşhis içindir; kalıcı düzeltme kabulü değildir.
- **M-C/D:** Belge kartı `backdrop-filter` aktif / testte geçici etkisiz → scroll ve kart overdraw. Uzun süreli kullanıcı görünümü korunur.
- **D-A/B:** Masaüstü `AmbientOceanCanvas` açık / kapalı → scroll long task ve hareketli kareler; profil tercihi test context'ine özel. Başka route veya asıl taslak verisi etkilenmez.
- **N-A/B:** Next Link prefetch mevcut / yalnız testte sıfır network koşulu gibi karşı senaryo → stüdyo girişinin hangi ağ varlığına bağımlı olduğu. Varsayılan kapatma önerisi olarak yorumlanmaz.
- **P-A/B:** Mevcut PDF ön ısıtması/yeniden çizim profili; ikinci render varsa hangi olayın tetiklediği. Her yeniden çizim “gereksiz” değildir.

A/B testinde fark belirsiz ise **kod değişikliği yapma**. Farklı cihazda ters sonuç varsa en yüksek riskli cihazı ve kullanıcı önceliğini esas al: hız uğruna bozulma kabul edilmez.

### 03.4 Performans kabul kapısı — “sıfır regresyon” uygulanabilir tanım

- **Fonksiyonel veya görsel tek regresyon bile kesin RED:** PDF çıktısında yazı, alan, çözünürlük, adres satırı, tema veya mevcut buton davranışı değiştiyse performans kazanımına bakmadan reddet.
- **Beş belgenin her biri, cold ve warm ayrı:** `STU-SHELL`, `STU-PDF`, `STU-EDIT` medyan/p75 kıyaslanır. Herhangi birinde **tekrarlanabilir, ölçüm gürültüsünün üzerinde artış varsa yama reddedilir.** Pratik tetik olarak birlikte `>100ms` **ve** `>%5` sapma kırmızı inceleme alarmıdır; bu eşik daha küçük ama kanıtlanmış bir gecikmeyi **meşrulaştırmaz**. Belirsizde daha çok tekrarla, kesin verisizde onay verme.
- **Katalog:** İyileştirme yapılan metrikte makul, tekrarlı pozitif etki şarttır; diğer katalog KPI'ları ve etkileşimler kötüleşemez. Sabit “%30 CPU azalmalı” veya “55/60 FPS garanti” yerine cihazın temel perf düzeyiyle anlamlı ilerleme ara. Ölçülen kazanç yoksa yama geri alınır.
- **Network:** `next/link` prefetch zamanlaması, ilk PDF için şablon/font/worker fetch ve retry yolları gecikmemeli; listeye ek ağır/çoklu fetch bindirilmemeli. Resource cache invalidation ve stale PDF riski sıfır olmalı.
- **Bellek:** 20 liste ↔ stüdyo turunda ve değişik PDF tiplerinde uzun dönem heap/canvas/RAF/worker yaşam döngüsü stabil olmalı. GC ölçümü başarısızsa bunu “sızıntı yok” diye yazma.

**Yayın kararı:** Zorunlu fonksiyon testi + görsel eşlik + cold/warm perf matrisi + build/typecheck + yeni V3 taslak kontrolleri + route parity yeşil değilse **NO-GO**. Yamalardan biri kazandırmıyorsa ilgili kod geri alınarak geride kalan doğrulanmış iyileştirmelerle ilerlenebilir. Tüm hipotezler çürütülürse sonuç dürüstçe “kanıtlanmış kod darboğazı bulunamadı”; sırf yayın yapmak için değişiklik yapılmaz.

---

## 04. UYGULAMA HARİTASI — 10 AŞAMA

| Aşama | Tek doğrulanabilir hedef | Değişiklik yaklaşımı |
|---|---|---|
| `ASAMA_01` | Güncel yerel durum + beş belgenin production baseline'ı + kök neden A/B kanıtı | **Kod değiştirme yok** |
| `ASAMA_02` | Mobil renk/blur blob maliyetini görünüm kayıpsız azaltma | **Yalnız profilde kanıt varsa** |
| `ASAMA_03` | Kartlar, fare/touch, cam efektleri, arama, tema/navigasyon etkileşimindeki kanıtlı maliyeti azaltma | Dar kapsamlı; beş kart için sanallaştırma yok |
| `ASAMA_04` | Masaüstü akvaryumunun gözlemci/scroll işini ölçüp kaliteli biçimde optimize etme | Mevcut FPS/DPR/visibility korunur |
| `ASAMA_05` | Katalog JS / route prefetch / veri yükü ölçümü ve risksiz küçültme | Link default ve stüdyo route korunur |
| `ASAMA_06` | Beş stüdyonun **tıklama → ilk PDF** kritik yolunun hızını düşürmeden iyileştirme | Kanıtlı network/waterfall ve hedefli, opsiyonel prewarm |
| `ASAMA_07` | PDF ilk render/cache/resize maliyetini bozmadan giderme | Mevcut worker/font cache'i **yeniden yazma yok** |
| `ASAMA_08` | Entegre işlev, V3 taslak, PDF eşliği ve dayanıklılık testleri | Tüm beş rota + mobil/masaüstü |
| `ASAMA_09` | Kör nokta denetimi, nihai performans A/B ve release kalite kapısı | Gerekirse hedefli geri al / NO-GO |
| `ASAMA_10` | **Tek kontrollü** Production yayın + gerçek ortam kontrolü | 1 atomic `main` push; sürüm doğrula ve bitir |

> **Koşullu aşama ilkesi:** Bir aşamanın hedeflediği maliyet kanıtlanmadıysa yeni kod ekleme. “Kanıtlandı: kapsamda değişiklik gerekmiyor” net raporuyla kapatılabilir. Bir optimizasyonun başarısız olması bir sonraki aşamada rastgele başka bir sistem yazma izni değildir.

---

## ASAMA_01 — YEREL SÜRÜM, BAZ ÖLÇÜM, KÖK NEDEN HARİTASI (KOD DEĞİŞTİRME YOK)

**Amaç:** Hangi işi hızlandırdığımızı ve neyi koruyacağımızı sayı, ekran ve kod kanıtıyla sabitlemek.  
**Giriş koşulu:** Bu plan ve repo erişilebilir. Bağımlılık/test araçlarının varlığı doğrulanabilir.

**Kapsam/okuma sırası:** Bölüm 02.4 kuralları ve `src/app/belgeler/*`, `src/components/{belgeler-hub,belgeler-glass-bg,ambient-ocean-canvas,ambient-ocean-scene,site-shell,bottom-nav}*`, gerçek stüdyo dosyaları, `use-belge-studio-document`, `use-belge-auto-draft`, `pdf-engine`, `pdfjs-client`, `belge-studio-pdf-preview`, `playwright.site.config.ts`, `package.json`, ilgili testler. V3 commit diff'ini özellikle incele.

**Uygulama sırası:**
1. `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, değişen dosyalar ve varsa görev durumu. Kirli çalışma ağacını koru. Baseline kaynağı olarak kullanılan yerel SHA/diff kaydedilsin; eski ve yeni branch karışmasın.
2. `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ECC aktifse onun görevle ilgili zorunlu yönergeleri, `.agents/rules` ve `docs/BELGELER_SISTEMI.md` dosyalarını oku. Özellikle 2000ms trailing taslak ve CSS header/zoom kontratını not et.
3. Kullanıcının sunucusunu bozmadan tek yerel production build başlat. `npm run build` proje `prebuild` komutunu kendi yürütür; `next build`i doğrudan çağırıp senkron/worker adımlarını atlama. Build aynı çalışma ağacı için bir kez; generated-diff oluşursa kaydet.
4. Ayrı ve izole browser context'lerinde `/belgeler` cold/warm giriş; 10s scroll; arama (`ı/İ/ş/ğ`); tema değişimi; üst bar ve alt nav. Bütün buton/rozet/sunum baseline screenshot'ları: 320, 360, 390, 768, 1024, 1366, 1920; light/dark + reduced motion. Gerekirse yüksek kıymetli örnekleri sakla, binlerce gereksiz screenshot üretme.
5. Beş gerçek rota için **başlık linki** ve **`Stüdyoda doldur` CTA** yollarını cold/warm ayrı ölç. `STU-SHELL`, `STU-PDF`, `STU-EDIT`, network/assets ve PDF ilk/tekrar render sayısı kaydedilsin. En az 7 geçerli tekrarda medyan/p75; ilk yükleme ve hızlı yeniden giriş birbirine karıştırılmasın.
6. A/B incelemesi: dört blob blur, kart backdrop-filter, masaüstü Canvas açık/kapalı, global navbar tema animasyonu, Route/JS parse. Bazı ekranlarda `await page.waitForLoadState('networkidle')` sonsuza uzayabilir; gerçek kullanıcı milestone'u olarak kullanma.
7. DOM/Network doğrulaması: 390px tipik telefon koşulunda `ambient-ocean-scene` JS chunk'ı / DOM canvas gerçekten yükleniyor mu? 768+ hover/fine kırılımında davranış nasıl? `prefetch` sayesinde hangi istek tıklama **öncesi** geliyor? Mevcut resource-cache `getPdfTemplateBytes`, font embedders ve PDF.js worker kaç kez yükleniyor?
8. `docs/belgeler-performans-v5/PLAN.md` (bu belgenin tam kopyası), `IMPLEMENTATION_STATE.md`, kompakt `evidence/baseline.*` dosyaları oluştur. Geri kalan görev klasörlerine, eski golden screenshot'lara dokunma. Kişisel form verisi/log/secret kaydetme.
9. **Neden matrisi** yaz: hipotez / kanıt / kategori (DOĞRULANDI, ÇÜRÜTÜLDÜ, BELİRSİZ) / yaklaşık darboğaz zamanlaması / önerilen en düşük riskli müdahale / hangi sonraki aşamaya bağlı. Net etki yoksa kod değişikliğini özellikle **önermeme** hakkını kullan.

**Doğrulama:** Production modunda çalışan tarayıcı; gerçek beş route testi; geçerli sayılar ve A/B kanıtı. `0 canvas` sayısı **yalnız katalogdaki dekoratif Canvas** için anlamlı, stüdyoda PDF render canvas varlığı normaldir. 

**Kabul:** Beş belge cold/warm `STU-PDF` medyan+p75 ve liste jank/paint karşılaştırma tablosu vardır; gözlemlenen sorunlar kayda geçmiştir. Fiziksel Android yoksa `NOT_RUN`, erişilemeyen GPU counter varsa `NOT_AVAILABLE`; ikisi de `PASS` olarak işaretlenmez.  
**Hata/geri dönüş:** Test ortamı yüklenemiyorsa çalışır kodu değiştirmeden `ENGELLI`; yalnız kendi süreçlerini kapat.  
**Dur:** Düzgün durum dosyası + 4–6 cümlelik özet → `devam` bekle.

---

## ASAMA_02 — MOBİLDE DÖRT RENKLİ IŞIK KATMANINI GÖRÜNÜM KAYBISIZ HIZLANDIR

**Amaç:** Ölçümde pahalı olduğu doğrulanan mobil arka plan kompozit/blur giderimini **aynı renk atmosferi ve hareket diliyle** sağlamak.  
**Giriş:** `ASAMA_01` tamam; `M-A/B` sonucu bu aşamaya hak tanıyor.

**Hedef:** `src/components/belgeler-glass-bg.tsx`, ancak gerekiyorsa yalnız bu bileşen için geçerli seçicilerle CSS; **global body/site gradient değiştirme yok**.

**Uygulama sırası:**
1. Önce dört katmanın gerçek davranışını kaydet: yaklaşık 540–700px boyutlar, `filter: blur(100–110px)`, opacity, radial gradient stop'ları, duration ve `orb-drift-1..4` hareketi. Light/dark renk tonlarını ayrı birer golden ref olarak sakla.
2. Main/Compositor Paint Flashing, layer memory ve GPU raster maliyetinde A/B farkı varsa **en düşük riskli mikro alternatifleri tek tek** dene: tek DOM node üzerinde eş-görünümlü blend gradient, blur etkisinin gradient stop'larının yumuşaklığıyla üretilmesi, görünmeyen büyük taşma bölgelerinin clip'i; ama **başlangıç ve sonraki hareket karelerinde renk dağılımı/güç/tutarlılık bozulursa reddet**. Statik gradient hareketli katmanın işlevsel eşdeğeri değildir.
3. Çok büyük bir blurred yüzey kendi compositing layer'ında kalıp aşırı VRAM tüketiyorsa tek `will-change` kaldırma denemesi yap. `translateZ(0)` veya çok sayıda `will-change` ekleyip daha fazla VRAM tüketme.
4. Masaüstündeki mevcut dört blob ışığının görünümünü ve akvaryumun ön/arka stacking sırasını kontrol et; `fixed`, `z-index`, pointer event, viewport height ve scroll davranışı değişmemeli.
5. `prefers-reduced-motion` mevcutta animasyonu durdurmuyorsa, ilgili kullanıcı sistem tercihini gözeten **aynı kompozisyonda durgun poz** koşullu CSS eklemek erişilebilirlik açısından kabul; varsayılan kullanıcının hareket kalitesi değişmez. Düşük güçlü cihazları otomatik tespit edip rastgele statik moda geçirme.
6. 320/360/390/768/1366/1920, light/dark, hızlı scroll ve animasyon karelerini karşılaştır. PDF route'ların tıklama→ilk PDF süresi **aynı test oturumunda** yeniden ölçülsün. Alternatif kazandırmıyorsa yalnız bu yamayı geri al.

**Kabul:** Mobil jank/paint/kompozit zamanında tekrar edilebilir iyileşme + görünüm/animasyon/parlaklıkta fark yok + beş belge cold/warm geçişlerinde regresyon yok. **“Sıfır blur” olmak zorunlu değil**, yavaşlatıcı ise eş-değer optimizasyon önemli.  
**Hata/geri dönüş:** Görsel diff, CPU artışı, GPU memory artışı veya renk tonu kaybı varsa ilgili stil değişiklikleri hedefli geri alınır.  
**Dur:** Ölçüm ve before/after kare kanıtı → bekle.

---

## ASAMA_03 — BELGE KARTLARI, DOKUNMA, ARAMA VE TEMA KONTROLLERİ

**Amaç:** Listeyle etkileşim sırasında JavaScript forced-layout veya kart backdrop maliyeti varsa kaldırmak; görünüm ve anlık yanıtı aynen korumak.  
**Giriş:** `ASAMA_01–02` kabul; `M-C/D` ya da pointer/input traces bir maliyet göstermiş.

**Hedef:** `src/components/belgeler-hub.tsx` ve sadece zorunluysa kart stile özgü CSS. `navbar`, `bottom-nav`, tema switch global kodları **yalnız kanıtlı ve çapraz regresyon denetimi varsa**.

**Uygulama sırası:**
1. Fare hareketiyle çalışan `handleCardPointerMove` kodu her `MouseEvent`te `getBoundingClientRect()` okuyor, `--pointer-x/y` ve `--rotate-x/y` yazıyor. Desktop Performance kayıtlarında `Forced Reflow`/sık layout ölçümü kanıtlanırsa **tek kart başına en fazla bir rAF içinde son pointer konumunu uygula**, `pointerleave`/unmount'ta RAF iptal et, hover pozisyonunu görsel eşlik içinde tut. Kullanıcı hareketi yoksa iş yapılmasın. Dokunmatik ekran üzerinde hover timer eklenmesin.
2. `backdrop-blur-2xl` kartlarda kaydırma esnasında pahalıysa önce scoped stil varyantlarıyla A/B yap; `bg-white/75` gibi şeffaf katmanların arka planla verdiği cam hissi korunmadan opak karta dönme. `backdrop-filter` tamamen kaldırmayı **varsayılan hedef** yapma.
3. `transition-all` ile gerçekten layout/paint tetikleyen bir durum ölçülmüşse, kart/CTA transition property listesi **yalnız ihtiyacı olan property'leri** içersin; hover gölgeleri, scale ve focus kontur aynen kalsın. Global Tailwind veya bütün siteye etkili CSS değişikliği yok.
4. Arama yalnız **5 belge** içeriyor; `useMemo` zaten var. Profil gerçek cost göstermiyorsa `debounce`, `useDeferredValue`, worker, search index refactor, `React.memo`, sanallaştırma, `content-visibility` **EKLEME**. Cost varsa önce küçük `normalizedSearchText` precompute gibi **sıfır UI gecikmeli**, Türkçe `ı/İ` davranışını koruyan çözüm; her tuşta hızlı sonuç değişmeye devam etsin.
5. Mobil tema anahtarı ve alttaki 5'li nav kaynaklı cost belgeyle sınırlı değilse geniş çaplı refactor yerine önce kendi etkilerini diğer rotalarda doğrula. Dokunma hit area 44px, seçili nav label, klavye focus ve safe-area bozulamaz.
6. Arama sorguları: boş/tek harf, `şantiye`, `TAHHÜTNAME`, `dilekçe`, `İSTİFA`, `ı`, `i`, sonuç yok ve temizle. Kart sırası ve her iki linkin doğru belgeye gitmesi parity testidir. Türkçe olmayan normalization’a sessiz geçiş yasaktır.
7. Önce/sonra scroll, pointer hareketi, arama TTI, tema switch + beş rota STU-PDF cold/warm ölç; etkisiz bir mikro optimizasyon bile bırakılmasın.

**Kabul:** Yalnız doğrulanan maliyette anlamlı kazanç; arama aniliği, mouse hover, touch scroll, focus, tema/nav, görsel cam kalitesi ve beş PDF açılışı aynı veya daha iyi.  
**Hata/geri dönüş:** Frame drop azalmıyor ya da değişiklik pointer/hover davranışını zayıflatıyorsa geri al.  
**Dur:** Kısa kalem tablosu → bekle.

---

## ASAMA_04 — MASAÜSTÜ CANVAS OKYANUSUNU KORUYARAK GÖZLEMCİ/SCROLL MALİYETİNİ AZALT

**Amaç:** Gerçek darboğaz kanıtlandıysa masaüstü sahnenin layout ölçümleri ve render lifecycle maliyetini azaltmak; canlı balık/bitki estetiğini korumak.  
**Giriş:** `ASAMA_01` Desktop A/B kanıtı, önceki aşamalar kabul.

**Hedef:** Önce yalnız `src/components/ambient-ocean-scene.tsx`; `ambient-ocean-canvas.tsx` media query'si, renderer biyoloji geometrisi ve paletleri **varsayılan korunur**.

**Uygulama sırası:**
1. Mevcut korumaları incele: 30/60 adaptif FPS, DPR 1.75, reduced motion static pose, `document.hidden`, enabled fade/stop ve unmount cleanup. Bunların hiçbiri “yok” diye yeniden yazılmasın.
2. `scroll` olayındaki `measure()`, ResizeObserver callback'leri, MutationObserver ve `panels` geometri maliyetini trace ile ayır. `getBoundingClientRect()` scroll boyunca gerçek güncel koordinat istiyor; **eski panel maskesi balıkları kart üstüne getirebilir**. Bu nedenle cache'leme yalnız geometri key geçerliyken; birden çok ölçüm **en fazla bir rAF'te koales** edilebilir, maskenin yeni scroll koordinatı doğru olmalıdır.
3. DOM mutation gerçekten karta ekleme/çıkarma, reflow veya filtre sonuçlarıyla ilişkili mi? Aksi halde her generic subtree mutation'ında komple panel sorgulama yerine ilgili durum invalidation; ama `MutationObserver` kaldırılıp kart ekleme sonrası boşluk maskesi bozulamaz.
4. `renderOceanEcosystemFrame` içinde her frame mesh nesneleri oluşturulması gerçekten ana thread CPU sorununu kanıtlıyorsa **geometri matematiğini yeniden yazmak son çare**; önce ölçülen tekrar hesaplarını cache'leyen, aynı simülasyon zamanı ve RNG varsa deterministikliği koruyan minimal düzenleme. Balık sayısı/tür/çizim ayarlarını azaltma.
5. `enabled=false` iken fade tamamlanınca RAF durmuş, hidden tab'de durmuş ve route unmount'ta listener/observer kaldırılmış olmalı. Re-enable kısa gecikmesiz; frame delta birikimi atlayıp animasyon teleporte olmamalı.
6. Açık ve kapalı akvaryum; 768px fine pointer eşleşmesi; pencere resize, scroll, tema değişimi, arama ile filtre 5→0→5, sekmeyi sakla/göster, ardışık 20 navigasyon. Feather mask dört katmanlı kart koruması yanlış boyamamalı.
7. İlk liste ağ/hydration/ilk tıklama ölçümü ile canvas sahne maliyetini tekrar karşılaştır; desktop kazanç uğruna beş stüdyo prefetch gecikemez.

**Kabul:** Desktop açık okyanusta ölçülebilir CPU/long task kazanımı veya kanıtlı hafıza stabilizasyonu; sahne, renk, hareket ritmi, mask, cursor/scroll eşliği korunur. Mobilde akvaryumun dynamic chunk'ı yeni eklenmez.  
**Hata/geri dönüş:** Mask kayması, sekme dönüşünde donma, FPS düşürerek gizlenen kazanç veya responsive hata varsa yalnız ilgili yama geri alınır.  
**Dur:** Kanıt ve değişmeyen görsel sahne → bekle.

---

## ASAMA_05 — KATALOG JS / NEXT PREFETCH / VERİ SINIRI: TIKLAMAYI KORUYAN KÜÇÜLTME

**Amaç:** İlk liste açılışında gereksiz JS veya route verisi gerçekten yükleniyorsa azaltmak; **stüdyo açılışını hızlandıran mevcut prefetch'i aynen tutmak**.  
**Giriş:** `ASAMA_01–04`; katalog profiler/Network listesi.

**Kapsam:** `src/app/belgeler/page.tsx`, `src/components/belgeler-hub.tsx`, `src/lib/documents-data.ts` import sınırları; Next 16 build analyzer mevcut yöntemleri. Shared root layout'a müdahale ancak kesin delille.

**Uygulama sırası:**
1. `/belgeler` production JS chunk analizinde **gerçekten** `pdf-lib`, `pdfjs-dist`, `fontkit`, stüdyo komponentlerinin indirilip evaluate edildiğini kanıtla. Sadece `documents-data.ts` veya 5 linkin varlığından PDF motoru listeye geldiği sonucu çıkarma; Next otomatik **RSC prefetch** bağımsız olarak bazı route asset'lerini alabilir.
2. Liste kartı metadata'sının ağırlığı ve parse cost'u kayda değer ise, veri sınırını hafifletmenin en dar yolunu dene; `DOCUMENTS` ile edit profilleri arasındaki sözleşmeyi, kart içeriklerini ve arama searchTerms'ü bozmadan. Beş belge için yeni API fetch veya ağır async join kurma. İleride belge sayısı artabilecek mimariyi bozma.
3. Server Component + client child ayrımı, `next/dynamic`, bundle split gibi müdahaleler yalnız measurable first-load JS / compile kazancı ve cold/warm stüdyo geçişi **eş veya daha iyi** olduğunda. Server/client boundary çok dosyada karmaşıklaşıyorsa tercih edilen yol **mevcut kodu korumaktır**.
4. **Kesin yasak:** `prefetch={false}`; Link'i `<a>` veya `router.push` ile değiştirme; otomatik prefetch yerine sadece touchstart ile geç gelen bir yükleme koyma. Gerekirse `useRouter().prefetch()` yalnız **kanıtlı** spesifik bağlamda Next'nin doğal davranışını tamamlayıcı olarak test edilir; iki kere kaynak indirme, ağ yarışması veya handler overhead yaratırsa reddedilir.
5. `Link` viewport giriş, hover, kısmen ön yüklenmiş sayfa, network cache invalidation, doğrudan URL ve browser back/forward testleri. Prefetch-only ağ istekleri ile PDF şablonlarını ayrıştır; API güvenlik/cookie/ses paylaşım endpoint'leri ön yüklenmez.
6. First-load JS, transfer, parse, hydrate, FCP/LCP, STU-SHELL/STU-PDF 5×cold/warm aynı koşulda A/B. Kazanç olmadığı halde Server Component'e geçirmek gibi sırf mimari “temizlik” yapılmaz.

**Kabul:** Ölçülen catalog JS/network maliyetinde azalma, aynı kart/arama semantiği ve hiçbir stüdyo gecikmesi. Ölçülmediyse bu aşama “uygun ek müdahale yok” diye biter.  
**Hata/geri dönüş:** Prefetch/yükleme waterfall bozulursa ilk öncelik stüdyo hızı → yama geri.  
**Dur:** Bundle ve route timing farkları → bekle.

---

## ASAMA_06 — BEŞ BELGEYE GİRİŞ: GERÇEK KRİTİK YOLU KORUYAN HEDEFLİ ÖN-ISITMA

**Amaç:** Dilekçe/tutanak seçildiğinde tıklama → gerçek form/PDF hazır olma süresini **hiçbir diğer rota pahasına olmadan** iyileştirmek.  
**Giriş:** `ASAMA_01` beş rota baseline; `ASAMA_05` Link/route waterfall analizi.

**Hedef:** Önce var olan `src/hooks/use-belge-studio-document.ts`, `src/lib/pdf-engine.ts`, `src/lib/pdfjs-client.ts`, `prewarmBelgeDocument` çağrıları, gerçek 5 studio dosyası, `src/components/belge-studio-pdf-preview.tsx` **OKUMA**; değiştirme yalnız ölçülmüş bottleneck'e.

**Uygulama sırası:**
1. Her rota için tıklamadan önce/yükleme süresince kaynak haritası çıkar: Next JS/RSC prefetch, route chunk parse, studio mount, template PDF fetch/cache, bold/regular font fetch/embedder, PDF-lib generation, PDF.js core/worker, getDocument, ilk `page.render`, UI status ready. Kaynağın **ne zaman geldiğini** ve diğer dört rotaya etkisini not et.
2. Var olan `prewarmBelgeDocument` yalnız stüdyo mount'u sonrası mı çalışıyor, ilk PDF generation ile aynı promise/cache'i paylaşıyor mu? Maliyeti negatif değilse olduğu gibi bırak; cache key/ref counting/inflight promise race hatası kanıtlanırsa yalnız onu düzelt.
3. `pdfjs-client` ortak worker zaten var: her route için worker yeniden oluşturuluyor iddiasını network/objelerle kanıtla. Reset/destroy kararı paylaşım sayfasını bozabileceğinden default lifecycle değişmez.
4. **Koşullu niyet-odaklı prewarm:** yalnız belirli bir rotanın *soğuk* açılışında net `fetch/cache miss` darboğazı varsa, önce mevcut `<Link>` doğal prefetch'in yetmediği kullanıcı niyet anını kullan: desktop `pointerenter`/`focus`, mobil `pointerdown`/çok kısa `touchstart`. Bu iş **navigasyon event'ini asla bekletmez**, `preventDefault` yapmaz, `router.push` yerine geçmez. Sadece seçilen belge/tek ek kaynak için, en fazla bir inflight promise ve bellek sınırı. Click anında başlayan CPU-intensive parsing **kullanıcının input yanıtıyla yarışıyorsa**, prewarm'a taşımak yerine iptal et.
5. **Koşullu idle prewarm:** yalnız benchmark kazanç gösterirse, sayfa ilk anlamlı boyama ve hydration sonrası, kullanıcı kaydırmıyorken, saveData/slow network/gizli sekmede devre dışı; plan B'deki gibi **tüm fontlar/tüm PDF'ler/tüm worker'lar katalog açılır açılmaz** değil. En fazla 1 istatistiksel olarak seçilmiş hedef kaynağı; aksi halde sıfır ek yük.
6. `force-cache`, Cache API veya yeni localStorage binary cache ekleme. `pdf-engine.ts` mevcut `cachedPdfBytes`, `cachedBoldFontBytes`, `cachedRegularFontBytes`, cached embedders ve `getPdfTemplateBytes` içindeki direct/API fallback korunur. Şablon URL'leri sürümsüzse `immutable` uzun cache ekleme. Hata/cache corruption halinde eski güvenilir ağ yolu çalışmalı.
7. `navigator.connection` desteklenmeyebilir; yoksa mevcut çalışmayı bozmaz. Offline, tek başarısız fetch, 404/timeout, user back, mid-prewarm route change, iki hızlı farklı belge seçimi, sekme gizle → dön senaryolarında ekstra prewarm **kaynak sızıntısı** bırakmamalı.
8. Tıklamadan sonra **gerçek PDF** ve kontrol kullanılabilirliği regresyon kapısı: 5 rota ayrı cold/warm, başlık ve CTA linklerinden giderek; başka belgeyi iyileştirirken sözleşme ikinci sayfası yavaşlamaz. Network throttling ve cihaz termal etkisini eşitle.

**Kabul:** Kanıtlı `STU-SHELL` veya `STU-PDF` iyileşmesi; hiçbir rotada tekrarlanan negatif fark; catalog input/scroll jank ve memory de kötüleşmez. Eğer prewarm risk/kazanç dengesi olumsuzsa hiç eklenmez ve aşama mevcut Next prefetch'i koruyarak kapanır.  
**Hata/geri dönüş:** Warm/cold bir belge yavaşlıyor, mobil input kötüleşiyor veya cache stale çıkıyorsa yeni prewarm tamamen geri alınır; mevcut sistemi muhafaza et.  
**Dur:** Beş belge tablo + hangi ön ısıtma neden kabul/ret edildi → bekle.

---

## ASAMA_07 — PDF İLK RENDER / RESIZE / CACHE: SADECE KANITLANAN TEKRARLI İŞ

**Amaç:** İlk tamamlanmış PDF resmini daha erken vermek, ancak keskinlik ve gerçek düzenleme motorunu değiştirmemek.  
**Giriş:** `ASAMA_06` kabul, ilk/tekrar render event trace hazır.

**Hedef:** Önce `src/components/belge-studio-pdf-preview.tsx`, `src/hooks/use-belge-studio-document.ts`, `src/lib/pdf-engine.ts`, `src/lib/pdfjs-client.ts` okumaları; mümkünse **yalnız bir yerel callback/dependency düzeltmesi**.

**Uygulama sırası:**
1. “İlk açılışta çift render kesin var” varsayımı yerine Chrome trace + runtime durumundan `page.render` neden tetiklendiğini bul: `snapshot.revision` değişimi, `ResizeObserver`, zoom/fit, mobile `activeTabMobile`, orientation, DPR değişimi, annotation/inline edit. İlk resimden sonra gerekli **doğru fit** yeni render'ı gerekiyorsa koru; yalnız aynı boyut, aynı revizyon ve aynı kaliteyle tekrar boyama yapan iş iptal edilebilir.
2. Mevcut `renderTask.cancel()` ve iptal promise'inin settle olması, loadingTask/worker cleanup ve blob URL revocation protokollerini **bozma**. Önceki task'ı iptal edip hâlâ aynı canvas'a paralel çizim başlatma; `RenderingCancelledException` doğal/zararsız akış olarak ele alınır.
3. Eğer aynı `ResizeObserver` boyutu anlamsız tekrar tekrar veriyorsa epsilon karşılaştırma yapılabilir; **ekran zoom/rotate, dynamic container, mobil alt/üst bar, cihaz piksel oranı ve ilk yükleme** resize'ları asla yutulmaz. Sabit `2px` toleransı her belge/zoom için doğru değildir; ölçülen gerçek width/pixel farkıyla karar ver.
4. İlk sayfayı `useLayoutEffect`te ölçme önerisini ancak gerçekten ilk yanlış ölçüme bağlı tekrarlı raster varsa ve SSR/hydration/paint üzerinde senkron layout cezası yaratmıyorsa dene. Kesin A4 en-boy varsayımı kullanma; iki sayfalı sözleşme ve gerçek şablon geometry vardır.
5. **DPR ve raster bütçesi:** düşük kaliteli zorunlu DPR 2.25 sınırı getirme, 16MP gibi keyfî sabit uygulama. Mevcut `getBelgePreviewRasterScale` ve PDF sayfa özgül geometri mantığını koru. Gerçek out-of-memory sorunu ölçülürse **ayrı riskli özellik talebi** olarak raporla; bu plan kapsamında görünür PDF kalitesini düşürme.
6. Font/cache: `cachedPdfBytes`, `getCachedFontEmbedder`, ortak PDF worker zaten var. Başlangıçtaki font/template fetch'in gerçekten iki kez yapılmasına yol açan bir *inflight dedupe* eksikliği varsa mevcut fonksiyon içinde en az değişiklikle düzelt; aynı URL sürümlülüğü ve API fallback korunur. `pdf-lib` veya `pdfjs-dist` sürümü değiştirme.
7. PDF alan odak geometrisinin tekrar çıkarılması veya `getAnnotations` işi ilk valid PDF'yi engelliyorsa, daha önce doğrulanmış cache ve revizyon token'ını gözden geçir; alan highlight/hotspot sırası değişmemeli, yanlış belge alanı asla gösterilmemeli.
8. Beş belge ve 56 alan sözleşmesi: kısa/uzun Türkçe metin, adres çok satır, iki sayfa, zoom %50–%400 (mevcut izinli aralık), Sığdır, yeni sekme, focus/inline edit, PDF indir; raster golden ve editable field parity. Paylaşılan `/b/[token]` readonly görüntüleyici üzerinde yan etki bırakma.

**Kabul:** İlk gerçek PDF ready süresinde kanıtlı iyileşme veya gereksiz render/resource işi ölçüyle giderildi; aynı fonksiyon/kalite; tüm belge yolları yine regresyonsuz. İkinci çizimi zorla `0` yapmak başarı kriteri **değildir**.  
**Hata/geri dönüş:** Herhangi bir artan ready süresi, bulanık sayfa, stale render, React race, cancel warning, yanlış field highlight veya broken download varsa hedefli geri al.  
**Dur:** PDF render reason table ve yeni medyan/p75 → bekle.

---

## ASAMA_08 — FONKSİYONEL/UX/PDF V3 REGRESYON KALKANI

**Amaç:** Hiçbir şeyi bozmadığımızı ispatlamak; salt Lighthouse/scroll kazancı yeterli değildir.  
**Giriş:** `ASAMA_01–07` belgeye özgü yama ve ölçümleri tamam. Gereksiz optimizasyonlar geri alınmış olmalı.

**Hedef test tabanı:** Var olan `tests/belgeler/*.test.ts`, `tests/site-audit/belgeler-mobile-studio.spec.ts`, `tests/site-audit/belgeler-inline-edit-mobile.spec.ts`, `tests/site-audit/belgeler-draft-final-regressions.spec.ts`, `tests/site-audit/belgeler-draft-pdf-roundtrip.spec.ts`, `tests/site-audit/belgeler-auto-draft-*`, `tests/site-audit/belgeler-unified-header-*`, `tests/belgeler/belge-auto-draft-v3.test.ts`, `tests/belgeler/belge-header-v3.test.ts`, `tests/belgeler/belge-reset-clear-v3.test.ts`, `tests/belgeler/belge-toolbar-footer-v3.test.ts`, `tests/belgeler/belge-v3-integration-adversarial.test.ts` **yerelde varlığı doğrulanarak** kullanılır. Yeni test yazılacaksa **mevcut test stiline** uy; yeni paket kurma.

**Uygulama sırası:**
1. Beş belgeyi hem doğrudan URL, hem liste başlığı, hem CTA, hem geri/ileri, hem reload, hem cold/warm aç. Doğru belgede doğru title/form ve ilk gerçek PDF sayfası ready test edilir; yalnız spinner yok diye PASS yok.
2. Her belgede en az 1 alan doldur → 2000ms trailing sessiz taslak `✓ Kaydedildi` → reload → geri yükle → içerik/PDF aynı; hızlı ardışık edit, başka karta geçiş ve browser tab kapanma sınırları. **Eski taslağın migration**, storage fail fallback, çatışma, offline kullanıcıları için mevcut UI aynı.
3. `Sıfırla`, `Temizle`, `Geri Al` V3 kontratına göre test; beklenmeyen modal/prompt geri gelmez. Ancak V3'te açıkça korunmuş özel örnek/randomize onayı varsa ona müdahale etme. Bir önceki legacy davranışa göre test beklentisi yazma.
4. PDF alanları: 56 editable eşleme (ilgili allowlist), uzun adres/TC/telefon, focus/highlight, PDF üzerinde mobil alttan açılan edit sheet, modal/görünüm geçişleri ve PDF odak modu. PDF içi edit yanında form state ve indirme parity sağlanır.
5. Üst bar/alt bar: `Belgelere dön`, ortalanmış zoom `− / % / +`, Sığdır, sağda tema anahtarı, `Form Görünümü` footer'da `Boş form indir` solunda; mobil 320px/390px/landscape ve safe-area/klavye üstünde alt araçlar kapanmamalı.
6. İşlemler: PDF indir, yazdır, boş form indir, adlandırma şablonu, readonly PDF paylaşım bağlantısı ve `/b/[token]` viewer'ı (varsa izinli test bağlantısı). Paylaşım backend kapasite/kota/temizlik sistemini performans değişikliği diye değiştirme; test verisi cleanup'ı güvenli ve izole.
7. Görsel golden: beş belgenin üretimi, font baselines, AcroForm editability, paylaşım PDF flatten, çok sayfalı sözleşme, sayfa 1/2; `tests/fixtures/belgeler-approved` referanslarını performans artışı için **yeniden onaylayıp değiştirme**.
8. A11y: `prefers-reduced-motion`, ekran okuyucu uygun label/aria; 320/360/390/414/768/1024/1366/1920 responsive ve light/dark; hover/focus ayrımı. Geçerli keyboard tab sırası, arama, alt nav, aria-live geri bildirim kaybolmamalı.
9. Resilience: 20× liste↔stüdyo tekrar, 10 dakikalık açık sayfa, sekme gizle/aç, 3 hızlı belge seçimleri, PDF yeniden üretim sırasında route çıkışı, offline/timeout, `ResizeObserver` döngüsü hatası, console/pageerror/network 4xx/5xx değerlendirmesi. Beklenen cancellation ve test bilerek oluşturduğu HTTP hatalarını ayrı etiketle.
10. Mevcut senaryolar `npm run check:belgeler-pdf`, `npm run check:belgeler-inline-mobile`; hedefli typecheck/lint; 5 route real browser. Gereksiz tüm site matrix'ini her aşamada çalıştırma; **bu aşama birleşik fonksiyon kapısı** olsun.

**Kabul:** 5/5 stüdyo, 56/56 allowlist doğruluğu (mevcut test kapsamına göre), taslak V3, PDF parity, mobil/desktop UX, readonly paylaşım, bellek/lifecycle testleri PASS. Fiziksel cihaz yoksa açık `NOT_RUN`, kritik başarısız otomasyon varken devam yok.  
**Hata/geri dönüş:** Hangi yama işlevi bozduysa **yalnız onu geri al**, ilgili test + bütün kritik akış yeniden koşsun.  
**Dur:** Kompakt PASS/FAIL/NOT_RUN matrisi → bekle.

---

## ASAMA_09 — SON KÖR NOKTA DENETİMİ, KARŞILAŞTIRMALI ÖLÇÜM VE RELEASE KARARI

**Amaç:** Her değişiklikten sonra birbirini etkileyen maliyetlerin nihai tabloda daha kötü olmadığını ispatlamak.  
**Giriş:** `ASAMA_08` entegre regresyon kapısı geçti.

**Uygulama sırası:**
1. `git diff --check` ve hedef dosya listesi. Gizli dosya/secret, büyük trace, PDF şablon/fixtures, cad worker, paylaşımlı API ve eksik staged kullanıcı değişikliği taşınmamalı. Local değişiklikler karışık ise yalnız bu görevin kodunu ayır; hiçbir şeyi silme.
2. Güncel repo scripts esas alınarak `npm run lint` (varsa hedefli lint), uygun TS komutu (`npx tsc --noEmit --incremental false` veya repository `tsconfig.next.json` ve `tsconfig.belgeler.json` kapıları), `npm run check:belgeler-pdf`, V3 testleri, mobil inline ve ilgili E2E suite. TypeScript, ESLint, browser gerçek kabul aynı şey değildir.
3. Tek son `npm run build` — `prebuild` worker/WASM/font/PDF vendor check'i atlamadan. Build başladığı andaki commit+diff kaydedilir; sonraki değişiklik olursa diff'e göre hedefli testleri ve gerekiyorsa final build'i tekrar çalıştır.
4. ASAMA_01 ile **aynı viewport/DPR/CPU/network/route giriş şekli** 7×medyan/p75; 5 belge cold/warm STU-SHELL/STU-PDF/STU-EDIT; 10s scroll ve theme; JS bundle/requests, layered paint; 20 nav soak. A-B-B-A ölçüm; testin önce/sonra koşulları tabloda gösterilsin.
5. `slow 4G`, CPU-throttled mobile, 390px normal, masaüstü fine pointer, 768px hover/none, reduced-motion, touch/keyboard, throttled/offline; yeni ısıtma network rekabetini veya kullanıcı tap latency'yi artırmış mı? Yavaş bağlantıda ilk belge bekleme artıyorsa **NO-GO**.
6. Ayrı regresyon matrisi: V3 auto draft **2000ms**, undo/reset/clear, header/footer/zoom ortalama, PDF font/geometri, link-only share, 56 alan, `/b/[token]`, `next/link` prefetch. Hiçbir kalite kaybı tolere edilmez.
7. **Kritik kalite incelemesi:** Optimize edilen bir alanda anlamlı kazanç var mı? Beş belgeye giriş eş veya iyi mi? Hafıza trendi artmıyor mu? Evetse GO. Hayırsa **sorunlu küçük diff'i geri al**, ilgili hızlı test + nihai KPI tekrar. Tüm değişiklikler gerekçesiz/etkisizse **üretime boş perf refactor yayınlama**.
8. Final kanıtı `docs/belgeler-performans-v5/FINAL_PERF_AUDIT.md` ve `evidence` içindeki kompakt summary'ye yaz. İlgili yaşayan `docs/BELGELER_SISTEMI.md` içine sadece **gerçekten uygulanmış** sistemin kısa kalıcı notunu ekle; uygulanmayan teknik mimariyi “yapıldı” diye belgeleme.

**Kabul:** Kalite kapıları PASS; anlamlı katalog kazanımı; 5/5 stüdyo cold/warm sistematik gerileme yok; PDF/UX eşliği; gizli veriler/yan etkiler yok. Test edilemeyen kritik senaryo varsa `ENGELLI` ve yayın ertelenir.  
**Hata/geri dönüş:** GO kararı verilemiyorsa Production yasak, kanıtla hangi yamanın neden geri alındığını bildir.  
**Dur:** Kısa GO/NO-GO raporu + sonraki yayın aşaması → bekle.

---

## ASAMA_10 — TEK ATOMİK RELEASE, VERCEL VE GERÇEK ORTAM SMOKE

**Amaç:** Final kabulden geçen küçük performans düzeltmelerini yayınlamak ve gerçek kullanıcı akışında doğrulamak.  
**Giriş:** ASAMA_09 `GO`; yerel değişiklik ve repo release standardı uyumlu; kullanıcının yeni açık “deploy yapma” talimatı yok.

**Uygulama sırası:**
1. `AGENTS.md` ve `.agents/rules/vercel-kurallari.md` ile çalışma biçimini doğrula. Windows yerel geliştirmede normal akış **bir anlamlı atomik commit + `main` push**, bunun otomatik tek Vercel Production deployment tetiklemesidir. Uzak GitHub API yazımı yapılıyorsa **başka branch/skip ci protokolü** vardır; bu planda zorunlu olarak uzaktan API yazımı yapılmaz.
2. Son diff ve durum kontrolü: bu planın kabul edilmiş kodları ve kısa yaşayan doküman; ilgisiz kullanıcı dosyaları yok. Ara aşama commit'lerini production'a ayrı ayrı göndermeme; Preview zorunlu değil, varsayılan **0**. `main` ilerlemişse yeni upstream değişikliklerini örtme; merge conflict varsa `ENGELLI` bildir.
3. Tek `main` push sonrası deployment'ın gerçekten bu commit'i yayınladığını Vercel kimliği/hash ile doğrula. Sadece `git push` başarılı olmasını “canlıya çıktı” diye raporlama. Otomatik deploy başarısızsa arka arkaya yeni build/deploy tetikleme.
4. Canlı URL: `https://muhendislik-site.vercel.app/belgeler`. Mobil bir test cihazı veya gerçekçi emülasyonla liste açılışı, kaydırma, arama, tema; masaüstünde canvas açık/kapalı; gerçek beş rota başlık/CTA → ilk tamamlanmış PDF → bir alan edit → indir; taslak V3 göstergesi; paylaşılan readonly viewer smoke. Mevcut test olmayan anonim gerçek paylaşımlar oluşturup kota doldurma.
5. Sürüm, görsel ve işlev eşliği, response/cache header ve ilk PDF yükleme göstergesi kontrol edilsin. Production test koşulları yerel benchmark'tan farklıysa kesin ms performans üstünlüğü uydurma; perf esası yerel eş-koşullu karşılaştırmadır.
6. Yayın sonrası **gerçek regresyon** bulunursa tanımlı güvenli rollback/prod restore prosedürünü izleyip kullanıcı verisini koru; otomatik sonsuz yeniden deploy denemesi yok. Başarılıysa durum kaydını `TAMAMLANDI`, `active_stage:null`, `next_stage:null` yap.

**Kabul:** Doğru commit Production hazır; 5/5 belge açılıyor/gerçek PDF çiziliyor, katalog scroll/arama normal, draft V3, tema, desktop sahne sağlam; log ve rapor tamam.  
**Hata/geri dönüş:** Production hazır değil veya regresyon var → `ENGELLI`; yalnız güvenli geri dönüş; gelişigüzel ikinci deploy yok.  
**Dur:** En fazla 6 cümlelik son rapor ve kalıcı durum. Yalın `devam` sonrasında hiçbir işlem yapılmaz.

---

## 05. TEST OTOMASYONU — YAZILACAK / KULLANILACAK SÖZLEŞMELER

### 05.1 Test iskeleti ve dosya stratejisi

- **Tercih:** Mevcut `playwright.site.config.ts` ve `tests/site-audit/` testlerinden tekrar kullan. Özellikle beş stüdyo route tablosu var olan `belgeler-mobile-studio.spec.ts` ile uyumlu olsun; **yanlış statik örnek route** kullanma.
- Gerekiyorsa **yeni** `tests/site-audit/belgeler-performance-v5.spec.ts` ve küçük, gizli veri içermeyen `scripts` helper; var olan dosyalarla çakışma varsa yeni benzersiz ad seç. `npm install` / yeni runner yok.
- Test seçicisi DOM koduna dayansın: `[data-testid="ambient-ocean"]` ancak yalnız dekoratif Canvas için; PDF için var olan studio region/ready status doğrulansın. İşi kolaylaştırmak için DOM'a sahte `data-testid` ekleme. Eklenecek test işaretinin gerçek render davranışını değiştirmediğini doğrula.
- E2E **tıklama → ilk gerçek PDF render** testinde Playwright `locator('canvas').isVisible()` kullanımı **PASS koşulu değildir**. Doğru `snapshot.revision` ve hazır durumun gerçek `renderTask.promise`/DOM yüzeyine bağlandığını doğrula. `requestAnimationFrame` ile görünür bir sonraki kare ölçümü kullanılırsa bunun test gecikmesini tüm A/B sürümlerinde aynı uygula.
- `page.waitForTimeout(120)` ile uydurma prefetch avantajı yaratma. Niyet prewarm deneniyorsa hover/touch tetiklemenin **doğal kullanıcı davranışındaki** gecikmeleri ayrıca ölç; özel “ideal hover” ayrı olarak etiketlenir.
- Her test ayrı browser context ile sentetik veri; browser/worker/server kapatma `finally`; element wait ≤8s, navigation ve render daha geniş ama sonsuz değil. Windows'ta `curl.exe` kullanılır.
- Private paylaşım tokenı, TC/telefon/posta veya key asla perf metric JSON'a yazılmaz. Hash/kalıcılık gerekirse test fixture'ın sentetik ID'si kullanılır.

### 05.2 Nitelik/senaryo matrisi

| Test ID | Durum | PASS şartı |
|---|---|---|
| C01 | Katalog 320/360/390/768/1366/1920 | Yatay taşma yok; kartlar/butonlar/nav sırası doğru |
| C02 | Light/dark, tema switch, reduced motion | Görsel korundu; sistem tercihine saygı, normal animasyon kalitesi aynı |
| C03 | 5 kart, title ve CTA | Doğru route; doğal Link prefetch çalışıyor |
| C04 | Türkçe arama/temizle, sıfır sonuç | Eşleşme doğru, geciktirilmiş input yok |
| C05 | 10 saniye scroll, mouse hover, touch | Long-task/jank A/B azalıyor, pan/tap/hover aksaklığı yok |
| C06 | Mobil 390 dekoratif Canvas import | `AmbientOceanCanvas` media-query davranışı aynı; PDF Canvas ile karıştırma |
| C07 | Desktop aquarium açık/kapalı, hide/show | Animasyon görünür, off'ta RAF durur, cleanup eksiksiz |
| S01–S05 | 5 ayrı belge cold CTA/title/direct | `STU-SHELL` ve `STU-PDF` baseline dışı negatif fark yok |
| S06–S10 | 5 ayrı belge warm/back/forward | Önbellek doğru, eski belge/alan sızmıyor |
| S11 | Form edit + PDF güncelleme | Sadece güncel revision PDF, hayalet yazı yok |
| S12 | V3 2000ms autosave + reload | Kullanıcı onayı istemez, doğru veriye döner; minimalist durum |
| S13 | Reset/Clear/Undo ve local/legacy draft | V3 sözleşmesi, yanlış modal/çakışma yok |
| S14 | Mobil inline PDF edit + highlight 56 alan | Doğru alan/coordinate, dokunmatik sheet ve validasyon |
| S15 | PDF zoom/fit/sayfa/rotate (mevcut destek) | Keskinlik, semantik buton, state ve geometri doğru |
| S16 | Editable PDF / blank / print / filename | Font, AcroForm ve adlandırma korunur |
| S17 | `/b/[token]` readonly paylaşım | Düzenleme yok; print/download/zoom mevcut sözleşmede |
| S18 | 20 tur route değişimi, hidden tab | RAF/observer/URL/worker sızıntısı ve heap trendi yok |
| S19 | slow 4G/offline/fetch fail/preview retry | Normal fallbacks, kaynak kilitlenmesi yok |
| S20 | V3 header/zoom/footer 320–1920 | Zoom gerçekten geometrik merkezde, tema sağda, form görünümü altta |

### 05.3 Çalıştırılacak mevcut komutlar (yerelde doğrulayıp seç)

```powershell
# KAYNAK OKUMA / KAYIT (bu komutlar test değildir)
git status --short
git branch --show-current
git rev-parse HEAD

# ZORUNLU SON KAPI — gerçek package.json'a göre uyarlanır
npm run check:belgeler-pdf
npm run check:belgeler-inline-mobile
npx tsc --noEmit --incremental false
npm run lint
npm run build

# Yeni test ancak ASAMA_01'de gerçekten oluşturulduysa çalıştır:
npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-performance-v5.spec.ts --project=chromium-mobile-390
```

> **Önemli:** `npm run check:belgeler-pdf`, birim+görsel testlerini zaten çalıştırır; her aşamada durmadan tam gate çalıştırma. `npx tsc` ile `tsconfig.next`/`tsconfig.belgeler` kapsamı aynı değildir; gerekli en geniş kapsama sahip olanları finalde denetle. `npm run build` yalnız final kanıt almak için değil, ASAMA_01 üretim baseline'ı için de gerekir. Önceki güncel build kanıtını mümkünse yeniden kullan; her scriptin gerçekten mevcut olduğuna `package.json` üzerinden bak.

### 05.4 Görsel karşılaştırmada kabul yöntemi

1. Animasyon sırasında zamana rastgele denk gelen iki ekranı “piksel farkı” diye fail ettirme. Tetiklemeden sonra aynı animasyon zamanı veya `prefers-reduced-motion` sabit pozla statik referans; 0/25/50/75/100% fazlarda **hareketli estetik** ayrıca.
2. Kartlar, butonlar, Türkçe yazılar, kenarlık, blur yoğunluğu, menü, alt nav, tema rengi ve PDF metinleri bilerek sadeleştirilemez. Antialias/DPR/font raster farklarını kök nedenine göre yorumla, otomatik golden update yapma.
3. `/belgeler` katalog için görsel karşılaştırma stüdyo PDF ekranıyla karıştırılmaz. Bir kod değişikliği `globals.css`e dokunduysa özellikle diğer site sayfalarında etkisi kontrol edilir.
4. PDF golden/AcroForm bütünlüğü: şablon PDF raster eşliği ve alan sayısı/konumu; 2 sayfa sözleşme; longa Türkçe metin kırılması; paylaşılan PDF flatten/doğru readonly davranışı.

---

## 06. İLERLEME KAYDI / DURMA PROTOKOLÜ / GÜVENLİ GERİ ALMA

### 06.1 Tek yerel görev klasörü

Yeni görev klasörü: `docs/belgeler-performans-v5/`

- `PLAN.md`: **bu belgenin tamamı**, değiştirilmeden kopyalanır. Eski planların üstüne yazma.
- `IMPLEMENTATION_STATE.md`: tek kaynaktan aşama ilerlemesi.
- `evidence/`: **sadece gerekli** baseline/final JSON, A/B özet, birkaç ref screenshot ve trace bağlantı listesi; büyük trace'ler yerel çalışma dosyası olarak `.data` veya dışarıda kalır.
- `FINAL_PERF_AUDIT.md`: yalnız `ASAMA_09` sonrası, gerçekleşen fayda ve ret kararları.

İlerleme kaydının asgari formatı:

```yaml
plan_id: BELGELER-PERF-TRIPLE-MIX-V5-20261024
plan_revision: 5
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
reference_remote_commit: fa17d8c570d70f6d8a0de058a5208258992af39c
local_base_commit: null
local_worktree_diff_fingerprint: null
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
release_go: false
release_commit: null
production_deployment: null
updated_at: null
```

**Durumlar:** `BASLAMADI`, `DEVAM_EDIYOR`, `ENGELLI`, `TAMAMLANDI`. Her stage için test/ölçüm evidence: `stage`, `tested_commit_or_diff`, `command`, `PASS/FAIL/NOT_RUN/NOT_AVAILABLE`, `before_after`, `evidence_path`, `regression` ekle. Test yoksa başarı olarak kaydedilmez.

### 06.2 “Başla” / “devam” sözleşmesi

- **Bu planın sohbette üretilmesi uygulama başlatmaz.** Dosyayı masaüstü ajana vermek de başlamaz; kullanıcı ayrıca `başla`/`devam` dediğinde başlar.
- İlk `Başla` veya `devam` yalnız `ASAMA_01`i yapar. Sonraki her `devam` en çok **bir** tamamlanmamış aşamayı yürütür. Aşama yarım kaldıysa sürdürür; aynı komutta sıradakini başlatmaz.
- Uygulayıcı kabul ölçütleri geçmeden `completed_stages` listesine eklemez. Engel olursa `ENGELLI` ve kısa blocker; kendiliğinden sonraki aşamaya geçmez. Başka çalışmanın yerel değişikliğini silmez.
- Yeni oturumda **PLAN + STATE** okur; tamamlanmış aşamaları yeniden yapmaz. Durum dosyası yoksa eski başarılı test uydurmaz, çalışma ağacı ve kanıttan yeniden belirler.
- Önceki aşamanın kanıtı son kod değişikliğiyle geçersizse yalnız etkilenen hedefli test/ölçümleri yineler. Her `devam`da yeni model araştırması, tüm repo taraması, full build/deploy döngüsü yok.
- `TAMAMLANDI` iken yalın `devam` mesajına yalnız **“Plan tamamlandı; uygulanacak başka aşama yok.”** cevabı ver; kod, test, npm, commit/push/deploy ve yeni aşama ekleme yapılmaz.
- Kullanıcının açık yeni kapsam talebi gelirse plan revizyonu kaydedilir, eski başarı kanıtları sessizce silinmez. **“Kontrol et”** yalnız kontrol isteği olarak yorumlanır.

### 06.3 Geri alma ve commit disiplini

- Önce hedefli diff/backups; ilgili yamanın hangi CSS/component değişikliklerinden oluştuğu kaydedilsin. Değişiklik etkisizse `git diff` içinden **yalnız o yama** geri alınsın. Kullanıcının daha önce değiştirdiği satır üzerine eskisini yazıp data kaybı oluşturma.
- Her aşamanın sonunda tek commit zorunlu değil. Yerel state kanıtı checkpoint'tir; gerekirse yerel feature branch, *kirli worktree ve eşzamanlı işler için güvenliyse* kullanılabilir. Zorunlu tag/revert komutu yok. `git reset --hard` ve toplu cleanup kesin yasak.
- Ara deployment yapılmaz. Final `GO` olmadan `main` push yok. Yayın gerçekleşen bir sonuç, planlama aşamasında olmuş gibi anlatılmaz.
- İlgisiz deploy/release, CAD engine, shared viewer değişikliği istemeyin; kapsam dar.

### 06.4 Aşama raporu — kullanıcı çok kısa özet ister

```text
ASAMA_XX: TAMAMLANDI / ENGELLI
Somut değişiklik: [değiştirilen dosya veya 'değişiklik yapılmadı']
Kanıt: [önce → sonra ölçüm; beş belge gecikme = yok / FAIL]
Test: [PASS / FAIL / NOT_RUN]
Sonraki aşama: ASAMA_YY / yok. BURADA DURDUM.
```

---

## 07. KAYNAK LİNKLERİ VE DENETİM REFERANSLARI

### Proje / kurallar

- Repo: https://github.com/smitelagwar/muhendislik-site
- Araştırılan en güncel `main`: https://github.com/smitelagwar/muhendislik-site/tree/fa17d8c570d70f6d8a0de058a5208258992af39c
- Yeni V3 commit: https://github.com/smitelagwar/muhendislik-site/commit/fa17d8c570d70f6d8a0de058a5208258992af39c
- Ürün sayfası: https://muhendislik-site.vercel.app/belgeler
- Repo rehberleri: `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `docs/BELGELER_SISTEMI.md`
- 24 Ekim V3 kanıtları: `docs/belgeler-minimal-taslak-ui-v3/{PLAN.md,IMPLEMENTATION_STATE.md}`; yeni unit ve site-audit testleri.
- Eski kullanıcı planı: `belgeler_hizlandirma_plani.md` ve `hızlandırma.md` (kullanıcı upload'ları); önceki GPT birleşim planı. Bu dosyalar ayrı taslaklardır; bu **V5** yürütme kaynağıdır.

### Resmi teknik dokümantasyon

- Next.js App Router prefetch: https://nextjs.org/docs/app/guides/prefetching
- Next.js `<Link>`: https://nextjs.org/docs/app/api-reference/components/link
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/reference
- Web.dev CSS animasyon, transform/opacity ve `will-change` ihtiyatı: https://web.dev/articles/animations-guide
- MDN `content-visibility` (neden beş kart için zorunlu değil): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility
- Gemini 3.8 Flash resmi model kartı: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- Gemini 3.8 Flash medium resmi açıklama: https://ai.google.dev/gemini-api/docs/latest-model

> Model notu: Google'ın yayımladığı model kodu `gemini-3.8-flash`; desteklenen düşünme seviyeleri `low`, `medium`, `high`. `medium` adı birebir korunur; modelin bu projede hatasız çalışacağı çıkarımı yapılmaz. Bu nedenle küçük ölçülebilir aşamalar ve test kapıları uygulanır.

---

## 08. GEMINI 3.8 FLASH (MEDIUM) İÇİN TEK İLK UYGULAMA PROMPT'U

> Aşağıdaki metni masaüstü Gemini oturumuna gönder. `PLAN.md` dosyasını veya indirilen bu `.md` dosyasını aynı oturuma ekle. Aşamaları peş peşe kendi kendine çalıştırma.

```text
Windows yerel mühendislik sitemde BELGELER-PERF-TRIPLE-MIX-V5-20261024 planını uygula. Dosyanın TAMAMINI oku; önce PROJECT.md, AGENTS.md, GEMINI.md, görevle ilgili .agents/rules dosyaları, docs/BELGELER_SISTEMI.md ve varsa docs/belgeler-performans-v5/IMPLEMENTATION_STATE.md dosyasını kontrol et. Yerel çalışma ağacını, en son GitHub referansı fa17d8c ile karşılaştır; benim eşzamanlı değiştirdiğim kodları asla silme. 24 Ekim V3 otomatik taslak (2000 ms), birleşik header/zoom/footer, mevcut PDF motoru ve belge açılış hızı mutlak korumadır.

Şimdi yalnız ASAMA_01'i uygula. Kaynak kodda perf refactor/değişiklik yapma; production build üzerinden mobil katalog scroll/gpu/blur/tema, masaüstü aquarium ve 5 BELGENİN TAMAMINDA tıklama -> kullanılabilir stüdyo -> ilk GERÇEK görünür PDF render süresini cold/warm ve tekrarlı olarak ölç. Next Link prefetch, mevcut PDF font/worker/cache ve bütün V3 taslak sistemini önce koddan doğrula. A/B deneylerini test oturumunda yap; varsayımları kesin kök neden ilan etme. Başarılıysa planı ve IMPLEMENTATION_STATE.md'yi kendi görev klasörüne yaz, gerçek performans kanıtlarını kaydet, bana en fazla 5 cümle rapor ver ve DUR.

Her sonraki 'devam' en fazla bir sonraki tamamlanmamış aşama içindir; her aşamanın gerekli doğrulamasını bitir, sonra dur. Kazanç kanıtlanmayan veya belgelerden herhangi birini yavaşlatan yama geri alınır. Ara commit/push/deploy yok; finalde yalnız bütün kalite kapıları geçerse tek kontrollü Production release. Benim iznim olmadan yeni dependency/özellik/refactor ekleme, kullanıcı sorularıyla akışı bölme. TAMAMLANDI ise yalın 'devam' geldiğinde sadece 'Plan tamamlandı; uygulanacak başka aşama yok.' de; hiçbir işlem çalıştırma.
```

---

## 09. SON KONTROL — BU PLANIN BAŞARILI SAYILMASI İÇİN

- [ ] Üç taslağın iyi fikirleri kullanılabilir; yanlış kesinlik iddiaları ve hatalı yollar çıkarıldı.
- [ ] Güncel `fa17d8c` V3 taslak/header değişiklikleri tüm regresyon testlerinde korunuyor.
- [ ] Mobil decorative canvas ile gerçek stüdyo PDF canvas'ı kesin olarak ayrılıyor.
- [ ] 4 blob animasyonuna yapılacak müdahale önce A/B, sonra görsel eşlik ve performans kanıtına bağlı.
- [ ] Default Next `Link` prefetch kapatılmıyor; 5 stüdyo cold/warm açılışı ana karar ölçütü.
- [ ] PDF.js worker, font/template cache, ilk PDF debounce ve render cancellation yeniden yazılmıyor.
- [ ] DPR, font, PDF geometri, editable AcroForm, paylaşım readonly çıktısı değiştirilmedi.
- [ ] Beş belge, 56 alan, 2 sayfa sözleşme, V3 2000ms draft, footer/zoom/tema birlikte test ediliyor.
- [ ] Fiziksel Android testi mümkün değilse başarı iddiası yapılmıyor; emülasyon ayrı etiketleniyor.
- [ ] Her aşama kendine yeterli giriş/işlem/test/kabul/geri alma/durma bilgisine sahip.
- [ ] Aşama tamamlandıktan sonra otomatik yeni aşama, ara deploy, kullanıcı verisi resetleme yok.
- [ ] Finalde gerçek kazanım + sıfır regresyon kanıtı varsa tek Production; yoksa dürüst NO-GO.

**BİTİŞ.** Bu V5 dosyası tamdır; ek dosyaya bölmek gerekmemiştir. Uygulama bu sohbet içerisinde yapılmamış; yalnız yürütme planı hazırlanmıştır.
