# TBDY 2018 — 3B Bina Düzensizliği Simülatörü
## ChatGPT Web üzerinden uygulanacak 5 aşamalı kalite geliştirme planı

**Plan kimliği:** `TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026`  
**Revizyon:** 1 · **Plan tarihi:** 26 Ekim 2026 (Europe/Istanbul)  
**Durum:** `PLAN_HAZIR / BASLAMADI`  
**Uygulayıcı:** ChatGPT Web — GitHub, Vercel ve kullanılabilen tarayıcı/çalıştırma araçlarıyla; masaüstü ajanına devir yok.  
**Kaynak depo:** https://github.com/smitelagwar/muhendislik-site  
**Hedef uygulama:** https://muhendislik-site.vercel.app/kategori/araclar/duzensizlik-simulatoru  
**Planlanan yayın:** Son aşamada, yalnız doğrulanmış değişiklikler için bir kontrollü Production yayını.

> **Planlama ile uygulama ayrımı:** Bu dosya oluşturulurken projede değişiklik, branch, PR veya deployment yapılmadı. İlk uygulama aşaması kullanıcı **“başla”** dediğinde başlar. Sonraki **“devam”** mesajları en fazla bir aşama ilerletir.

---

## 1. Amaç, ürün ilkeleri ve sınırlar

Hedef, **A1, A2, A3, B1, B2 ve B3** deprem düzensizliklerini profesyonel görünen, yapısal olarak tutarlı ve öğrenmeyi kolaylaştıran bir 3B çalışma ortamına dönüştürmektir. Bu işlem tam yeniden yazım değildir. Mevcut tam ekran düzen, senaryo seçimi, öğretici rehber, kamera önayarları, oynatma, katman seçenekleri, 2B yedek görünüm ve başarılı mevcut tasarım dili korunur; gerekirse daha iyi bir çözümle sadeleştirilir.

**Vazgeçilmez kullanıcı sonuçları:**

1. Kolon–kiriş–döşeme–perde birleşimleri, duran ve hareket eden modellerde belirgin şekilde daha rafine ve süreklidir; kesişim veya görüntü çakışması kusurları giderilir.
2. Her düzensizlikte sorunlu eleman veya bölge sahne içinde kolayca ayırt edilir; görüntü, mühendislik mantığını doğru açıklar.
3. Seçime göre değişen kısa **“Neden Problemli?”** bağlamsal kartı vardır; özellikle mobilde binayı örtmez.
4. Kamera, etkileşim, görünüm ayarları ve masaüstü/mobil düzeni olgun, akıcı ve sade hissettirir.
5. Uygulama performansı, hata dayanıklılığı, erişilebilirliği ve diğer site bölümleri korunur.

**Kapsam dışı:** Yeni bir sonlu elemanlar çözüm motoru, gerçek bir binaya ilişkin yönetmelik uygunluk raporu, başka araçların yeniden tasarımı, kapsam dışı Next.js/Three.js toplu sürüm yükseltmesi, gereksiz yeni bağımlılıklar. Animasyon **şematik/eğitseldir**; hesaplanmamış ötelenme ve kuvvet değerleri mühendislik sonucu olarak gösterilmez.

**Teknik serbestlik:** Aşağıdaki yöntemler zorunlu mikro talimatlar değildir. Uygulama sırasında gerçek koda ve görsel kanıta göre daha temiz/sağlam yöntem seçilebilir. Buna karşılık kullanıcı sonuçları ve kabul ölçütleri değiştirilemez.

---

## 2. Plan hazırlığında doğrulanan durum

**Araştırma referansı:** 26 Ekim 2026; GitHub `main` baş commit'i **`93d734042a2e9f47737898312d839c179cd9a746`** (26 Ekim 2026, 17:24 UTC). Uygulamaya başlarken güncel HEAD **yeniden** kontrol edilir; bu SHA'ya zorla dönülmez.

### Doğrudan okunan kaynaklar

- `PROJECT.md`, `AGENTS.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md` ve `vercel.json`.
- `src/app/kategori/araclar/duzensizlik-simulatoru/page.tsx`.
- `src/components/duzensizlik-simulatoru/building-viewer.tsx`.
- `src/components/duzensizlik-simulatoru/irregularity-studio-shell.tsx`.
- `src/components/duzensizlik-simulatoru/irregularity-fallback-2d.tsx`.
- `src/lib/duzensizlik-simulatoru/motion.ts` ve `scenarios.ts`.
- `tests/duzensizlik-simulatoru/motion.test.ts`.
- `tests/site-audit/irregularity-studio.spec.ts`.
- `.github/workflows/duzensizlik-simulatoru-e2e.yml`.
- `docs/duzensizlik-simulatoru/QUALITY_IMPLEMENTATION_STATE.md`.
- Google Drive'daki `CHATGPT_ASAMALI_PLANLAMA_TALIMATI.md` çalışma protokolü.

### Kanıta dayanan tespitler

- Proje **Next.js 16 / React 19 / TypeScript / Three.js 0.172.0** kullanıyor. `package.json` içinde Playwright ve `tsx` var.
- 3B sahne, `building-viewer.tsx` içinde **Three.js + OrbitControls**, ortak BoxGeometry üzerinden çiziliyor. `motion.ts`, yapısal düğümleri ve uç noktaları ortak hesaplayarak segment sürekliliği sağlamaya çalışıyor. Bu iyi temel korunmalı.
- Mevcut kutu temelli segmentler ve basit kesit/ölçek mantığı, bazı birleşimlerin **görsel olarak mekanik veya üst üste yerleştirilmiş** görünmesine neden olabilir; bu, görsel testlerle netleştirilecek bir hipotezdir, gözle onaylanmış hata listesi değildir.
- Altı senaryo, kısa öğretici panel, kamera açıları, görünüm katmanları, 2B fallback, WebGL hata dönüşü ve tam ekran `100dvh` düzeni **halihazırda var**. Bunları sıfırdan üretmek yerine doğrulayıp geliştirmek gerekir.
- Mevcut `scenarios.ts` açıklamaları **B1 dayanım** ile **B2 rijitlik** ayrımını koruyor. `motion.ts` ve testler de bu ayrımı şematik davranışta gözetiyor.
- Sahne içinde üst solda kısa bir senaryo etiketi ve ayrıca rehber paneli bulunuyor; fakat bu iki öğe kullanıcı tarafından istenen, **sorunlu 3B bölgeye bağlamsal olarak ilişkilendirilmiş “Neden Problemli?” kartının** tam karşılığı değil.
- Test altyapısı zaten mevcut: saf geometri testi ve `irregularity-studio.spec.ts` Playwright senaryoları. `.github/workflows/duzensizlik-simulatoru-e2e.yml` üzerinde `pull_request` ve `workflow_dispatch` tanımlanmış.
- Mevcut `docs/duzensizlik-simulatoru/QUALITY_IMPLEMENTATION_STATE.md` içinde yürütme durumu **`DEVAM_EDIYOR / ASAMA_01`** görünüyor; buna rağmen `main` son commit mesajı simülatör için tamamlanmış bir release bildirmiş. Bu **durum belgesi ile kod/commit arasında doğrulanması gereken tutarsızlıktır**. Var olan çalışmayı silmeden ilk aşamada gerçek durum uzlaştırılacak.
- GitHub proje kuralları ChatGPT uzaktan geliştirmesini `internal-*` / `chatgpt-*` branch ile sınırlar. `vercel.json` bu dal kalıplarında otomatik deploy'u devre dışı bırakacak şekilde yapılandırılmıştır; gerçek davranış başta kontrol edilir.

### Henüz doğrulanmamış olanlar

- Gerçek kullanıcı tarayıcısında bütün birleşimlerin hangi açılarda kusur gösterdiği; mevcut canlı URL genel web okuyucusunda açılamadı, bu yüzden görsel kusurların tümü doğrulanmış kabul edilemez.
- Güncel `main` için testlerin bu planlama oturumunda başarıyla çalıştığı; son commit mesajındaki test iddiası **test sonucu yerine geçmez**.
- ChatGPT oturumunun GitHub dışındaki bağımsız test çalıştırma, Vercel yönetimi ve tarayıcı etkileşim olanaklarının o an gerçekten erişilebilir olup olmadığı; uygulamada ilk aşamada test edilecek.
- Fiziksel Android/iOS cihaz testleri; emülasyon gerçek cihaz testi olarak sunulmayacak.

### Teknik referans

Birincil referans: **TBDY 2018 Resmî Metin, Tablo 3.6 ve 3.6.2**.  
https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf  
Resmî Gazete: https://resmigazete.gov.tr/eskiler/2018/03/20180318M1-2.htm

Düzensizlik karşılaştırma tablosu test/öğretim verisi için bu resmî metinden üretilecek. Özellikle **A1 burulma, A2 döşeme süreksizliği, A3 planda çıkıntı, B1 dayanım, B2 rijitlik, B3 düşey eleman süreksizliği** birbirine karıştırılmayacak. Sayısal şartlar ve dipnotlar kaynakla karşılaştırılmadan yeni eşik yazılmayacak.

---

## 3. ChatGPT Web çalışma ve yayın yöntemi

**Roller:** Araştırma, GitHub kod incelemesi, kod değişikliği hazırlığı, PR yönetimi, uygun testleri çalıştırma/çalışma sonuçlarını inceleme, web görsel denetimi ve Vercel kontrolü bu sohbet üzerinden ChatGPT tarafından yürütülür. Kullanıcı masaüstünde kod yazmayacak. Kullanılabilen yerel çalışma alanı veya bulut bilgisayarı varsa yalnız doğrulanmış yetenekleri kullanılacak; erişimi olmayan terminal/testler çalıştırılmış gibi gösterilmeyecek.

**Güvenli branch ve kayıt:** Uygulama başlangıcında güncel `main`'den, çakışma kontrolünden sonra `internal-tbdy3d-quality-v2` gibi bir **yeni ve göreve özgü** çalışma dalı açılır. `main`'e deneme commit'i atılmaz. Kod değişiklikleri anlamlı checkpoint'lerde toplu Git tree/commit işlemleriyle yazılır; her dosya için ayrı commit yapılmaz. Gerçekten ara commit gerekiyorsa repo kuralına uygun `[skip ci]` veya `[skip vercel]` kullanılır. CI testini tetikleme planı seçilirken bu etiketlerin test işlerini de atlatabileceği hesaba katılır.

**Durum devamlılığı:** Var olan `QUALITY_IMPLEMENTATION_STATE.md` **üzerine yazılmaz**. Bu plan için yeni dosyalar:

- `docs/duzensizlik-simulatoru/CHATGPT_WEB_QUALITY_V2_PLAN.md` — bu planın, ilk anlamlı yazımda repoya alınacak kopyası.
- `docs/duzensizlik-simulatoru/CHATGPT_WEB_QUALITY_V2_STATE.md` — her aşamanın durumunu ve kanıtlarını tutan tek küçük durum kaydı.

Örnek durum:

```yaml
plan_id: TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
base_sha: 93d734042a2e9f47737898312d839c179cd9a746
updated_at: 2026-10-26T21:07:00+03:00
```

**Test çalışma yolu:** Önce mevcut kod ve testler kullanılır. Repo içerisinde özellikle `npx tsx --test tests/duzensizlik-simulatoru/*.test.ts`, hedef klasörlerde ESLint, `npx tsc -p tsconfig.next.json --noEmit --incremental false`, `npm run build` ve `tests/site-audit/irregularity-studio.spec.ts` ile Playwright hedeflenir. Bunlar repo içindeki mevcut komut ve dosyalardır; **buradan çalıştırılmış testler değildir**. Mevcut GitHub Actions workflow'u, PR/manuel dispatch koşulları uygunsa ana doğrulama aracıdır. Web'den görünmeyen/çalıştırılamayan testler geçerli sayılmaz. Test çalıştırma erişimi yoksa final release **ENGELLI** kalır.

**Deploy bütçesi:** Varsayılan **0 ara Preview**, teknik ihtiyaç varsa **en fazla 1 kontrollü Preview**, finalde **en fazla 1 Production**. Ara aşamalarda Production yoktur. Tek release ile canlı sayfa test edilir. Daha fazla deploy ancak açık bir hata düzeltmesi için gerekirse kullanıcıya nedeni belirtilerek ayrıca karara bağlanır. Vercel bekleme süresi boyunca farklı bağımsız kalite kontrolleri yapılır; sürekli durum sorgulanmaz.

**Kapsam koruması:** Belgeler, Dokümantasyon/CAD, hesaplama modülleri ve ortak navbar/site shell değişiklikleri gereksiz yere değiştirilmez. Hedefin tam ekran düzeni için ilgili üst seviye kabuğa dokunmak gerekirse regresyon riski ayrıca kanıtlanır.

---

## 4. Beş aşamanın haritası

| Kimlik | Ana çıktı | GitHub / Vercel ilkesi |
|---|---|---|
| `ASAMA_01` | Kanıta dayalı sorun haritası, baseline ve güvenli çalışma dalı | Sadece gerekli güvenli dal/durum; deploy yok |
| `ASAMA_02` | Rafine birleşimler ve güvenilir 3B geometri | Hedefli kod; ara deploy yok |
| `ASAMA_03` | Altı senaryoda doğru görsel odak ve “Neden Problemli?” kartı | Hedefli kod/test; ara deploy yok |
| `ASAMA_04` | Profesyonel kontroller, masaüstü/mobil UX ve render optimizasyonu | Toplu çalışma checkpoint'i; gerekirse tek Preview kararı |
| `ASAMA_05` | Kapsamlı regresyon, düzeltme, kontrollü production ve canlı kabul | CI/gerçek tarayıcı; tek production |

### ASAMA_01 — Mimari, uygulama ve kalite başlangıç denetimi

**Amaç:** Mevcut başarılı sistemi ve gerçekten kalan kusurları ayırt etmek; yanlış temelde refactor yapmayı önlemek.

**Giriş:** Kullanıcının `başla` mesajı, GitHub okuma yetkisi, bu plan. `main` SHA, mevcut PR/branch/iş akışları ve daha önceki simülatör release durumu yeniden okunur.

**Uygulama sırası:**

1. `PROJECT.md`, `AGENTS.md`, ilgili `.agents/rules`, sayfa kabuğu, bağımlılıklar, testleri ve mevcut durum kayıtlarını güncel HEAD üzerinden doğrula.
2. `QUALITY_IMPLEMENTATION_STATE.md` içindeki `DEVAM_EDIYOR` ile son release commit'inin farklı durumlarını gerçek commit/CI/deployment kanıtına göre uzlaştır; önceki çalışmayı otomatik tekrar etme.
3. Mümkün olan gerçek tarayıcı araçlarıyla **A1–B3** için perspektif/üst/yan görünüş, durgun/oynatılan durum, ayarlar, öğretici panel, 2B görünüm ve responsive düzenleri incele. Her kusuru **tekrar üretim adımı + beklenen/gerçek sonuç + kanıt** ile kaydet.
4. Mevcut geometri, malzeme, kamera ve RAF yaşam döngüsünü incele. Sorunları `geometri`, `mühendislik anlatımı`, `UX`, `performans`, `regresyon riski` olarak sınıflandır.
5. Mevcut CI ve gerçek tarayıcı test imkanlarını doğrula; ölçülebilir başlangıç kıstaslarını belirle: açı bazlı birleşim görüntüsü, görünür canvas sayısı, sayfa taşması, senaryo geçişi, WebGL fallback, donma/hata, kaynak sayısı, erişilebiliyorsa FPS/bellek.
6. Güvenli `internal-*` dalını aç; görev durum kaydını oluştururken gereksiz ara commit üretme. Geliştirme sırasını yalnızca doğrulanan bulguların gerektirdiği ölçüde daralt/güncelle.

**Doğrulama:** Altı senaryo kapsanmış mı? Her kritik iddianın kod, test veya ekran kanıtı var mı? Mevcut davranışlar ve eksik kart birbirinden ayrılmış mı? Branch/deploy koruması okunmuş mu?

**Kabul:** Gerçekçi risk önceliklendirmesi, başlangıç sürümü, doğrulama yöntemi ve korunacak davranış listesi hazır; çözüm için belirsiz teknik varsayımlar açıkça işaretlenmiş.

**Hata/geri dönüş:** Canlı uygulama tarayıcıyla incelenemezse bu sınır kaydedilir, kod denetimiyle ilerlenir fakat görsel kabul iddiasında bulunulmaz. Branch açma yetkisi yoksa yazma yapılmaz, `ENGELLI` durumuyla durulur.

**Durma:** `ASAMA_01` sonucunu 4–6 satır özetle; `ASAMA_02` için kullanıcıdan **“devam”** bekle.

### ASAMA_02 — 3B model ve birleşim geometri kalitesi

**Amaç:** Modelin basit kutuların çakışması hissinden kurtulması; mühendislik açısından anlamlı ve animasyonda kopmayan bir taşıyıcı sistem görünümü.

**Giriş:** `ASAMA_01` baseline ve sorun haritası; güncel `building-viewer.tsx` / `motion.ts`.

**Kapsam ve uygulama sırası:**

1. Öncelik sırasıyla kolon–kiriş, kiriş–döşeme, kolon–perde, B3 aktarım elemanı, A2 boşluk kenarı ve A3 iç köşe birleşimlerini incele.
2. Ortak düğüm koordinatlarına dayanan mevcut hareket modelini koru; gerektiğinde **eleman uç düzlemi, birleşim geometrisi, doğru kesit yönlenmesi, yüzey örtüşme kontrolü ve derinlik algısı** için hesap katmanı ekle. Belirli bir bevel/CSG tekniğini otomatik dayatma: önce basit, ölçülebilir, düşük maliyetli çözümü seç.
3. Görsel kusur ile gerçek kesişim kusurunu ayır. Sahneyi sırf daha parlak yapmak yerine doğru malzeme/ışık/kenar ağırlığı/hacim dengesi kur; çizim üzerindeki kritik vurguları okunabilir tut.
4. Hareket sırasında birleşim uçlarını aynı düğüm hareketinden türet; açılma, parçanın havada kalması, döşemenin kirişten ayrılması veya z-fighting ortaya çıkmasını engelle. Özellikle A1 dönmesi ve B2 kat ötelemesinde yakın kamera açılarından kontrol et.
5. Fazladan mesh, materyal ve geometri üretimini gereksiz büyütme. Paylaşılan kaynakları, cleanup ve sahne değişimi süreçlerini koru.
6. Geometri testlerini güncelle veya küçük, hedefli testler ekle: ortak uç örtüşmesi, geçerli segment uzunluğu, senaryoya özel gerçek boşluk/süreksizlik, sabit ve hareketli pozisyonlarda sonlu koordinatlar, model sınırları.

**Doğrulama:** Altı modelden en az kritik düğüm bölgelerinin farklı açı/zoom ve oynatma evrelerinde görsel karşılaştırması; model birim testleri; eski sürüme kıyasla yeni artefakt, delik, yüzey titremesi ve kırpılma kontrolü. Erişilemeyen görsel test açıkça belirtilir.

**Kabul:** Belirlenen kritik birleşimlerde gözle görünür hata kalmaz; mevcut bağlantı sürekliliği korunur veya iyileşir; senaryo değişimleri ve 2B fallback bozulmaz; performans açısından dramatik maliyet oluşmaz.

**Hata/geri dönüş:** Karmaşık geometri stratejisi performansı bozarsa daha sade modelleme varyantına dön; ilgisiz renderer refactor'ını geri al. `main` değiştirilmez.

**Durma:** Geometri öncesi/sonrası farklarını ve çalıştırılan testleri kısaca raporla; **“devam”** bekle.

### ASAMA_03 — Altı düzensizlik, problemli bölge vurgusu ve bağlamsal kart

**Amaç:** Kullanıcı hangi kusurun nerede ve neden oluştuğunu birkaç saniyede sahnenin kendisinden anlayabilsin.

**Giriş:** `ASAMA_02` temiz geometrisi ve TBDY 2018 resmî tanımları.

**Kapsam ve uygulama sırası:**

1. `scenarios.ts`, `motion.ts`, 2B şema ve rehber metinlerinde A1–B3 davranışlarını **Tablo 3.6 / 3.6.2** ile karşılaştır; tanım, etki, gösterim ve referans bilgisini tutarlı hale getir. B1 **dayanım/zayıf kat**, B2 **rijitlik/yumuşak kat** ayrımı zorunludur. Eşik veya boyut oranı ancak kaynak doğrulamasıyla yazılır.
2. Sahneyle ilişkili **problem odağı** oluştur. Örnekler: A1 karşıt uçların hareket farkı; A2 döşeme boşluğu ve aktarım yolu; A3 iç köşe; B1 zayıf kattaki taşıma kapasitesi örneği; B2 göreli ötelemenin yoğunlaştığı kat; B3 kesilen düşey yük yolu. Bunlar mühendislik hesabı olarak değil eğitsel gösterim olarak sunulur.
3. Her seçimde kısa **“Neden Problemli?”** kartı göster. İçerik en çok 1 kısa başlık + 1–2 sade cümle + gerekirse “Detayı gör” bağlantısı kadar olmalı. Masaüstünde ilgili bölgeye akıllıca ilişkilendirilebilir; mobilde ekrana taşan veya binayı örten sabit kart yerine küçük kenar paneli/katlanabilir öğe tercih edilebilir. Akıllı konumlandırma, occlusion ve z-index çakışmalarını doğrula.
4. Vurgular, katman gizleme ve kamera odağı birlikte anlamlı çalışsın; bilgi ile işaretlenen geometri farklı şeyleri göstermesin. Gerekiyorsa sorunlu bölgeye odaklanma ekle; kullanıcının serbest kamera kontrolü zorla elinden alınmasın.
5. Rehber panelindeki **Tanı → İzle → Anla** sırasını koru veya iyileştir. Aynı açıklamayı kart/panel/etiket üçlüsünde gereksiz tekrar etme. 2B fallback'de de aynı doğruluk sağlansın.
6. Yanlış mühendislik anlamı doğuran görsel animasyonu düzelt. Özellikle B1'i mutlaka büyük yatay deformasyonla, B2'yi yalnız kesit küçültmeyle açıklama gibi kavram hatalarından kaçın. “Ölçeksiz, eğitim amaçlı, analiz sonucu değildir” uyarısını erişilebilir biçimde koru.

**Doğrulama:** 6 senaryo × kart metni × işaretlenen doğru bölge × kamera × 2B karşılığı; rehber adımları; ayarlarla vurgunun açılıp kapanması; kartın klavye/dokunmatik davranışı. Test yalnız düğmenin seçili durumunu değil gerçekten sahnede değişen öğeyi de doğrulamalı.

**Kabul:** Her senaryo eşsiz, teknik açıdan doğru ve anlaşılır şekilde gösterilir; istenen kart çalışır; bina görünürlüğünü olumsuz etkilemez; 2B/3B anlatım birbiriyle çelişmez.

**Hata/geri dönüş:** Bir görsel efekt kavramı yanlış anlatıyorsa animasyonu basitleştir veya kaldır; resmî kaynakta karşılığı bulunmayan nicel iddiayı gösterme. `main` etkilenmez.

**Durma:** Altı senaryonun kısa durum matrisi, kartın masaüstü/mobil davranışı ve kanıtlarıyla **“devam”** bekle.

### ASAMA_04 — Profesyonel arayüz, kamera ve performans olgunlaştırması

**Amaç:** TradingView/CAD çalışma alanı kadar verimli fakat kendi kimliğini koruyan, büyük sahne odaklı ve doğal bir tam ekran deneyim.

**Giriş:** `ASAMA_03` işlevsel anlatımı ve sahne etkileşimleri.

**Kapsam ve uygulama sırası:**

1. Mevcut arayüzü sıfırdan tasarlama. Gerçek kullanımda değer sağlamayan tekrarları kaldır; görünüm seçeneklerini eylem amacına göre grupla. Kamera önayarları, sahneyi sığdır/sıfırla, oynat/durdur, hız ve katman kontrollerinde açık geri bildirim sağla.
2. Kamera orbit/pan/zoom hassasiyetini masaüstünde fare + trackpad, mobilde dokunma için ayrı değerlendir. Ani atlama, aşırı döndürme ve yön kaybını azalt; odak geçişleri doğal, kesintisiz ve gerektiğinde iptal edilebilir olsun.
3. **3B sahne ana alan kalsın:** site banner'ı ekleme, sayfa dikey scroll'unu açma. Mobil alt dock, rehber çekmecesi, ekran yönü değişimi, güvenli alan ve tarayıcı dinamik viewport'u birlikte değerlendir. 320/390/430/768/1366/1920 px genişliklerde kontrol örtüşmesi ve taşma olmamalı.
4. Kart–rehber–ayarlar–kamera menüsünün çakışmalarını ve focus düzenini düzelt; escape, tab, screen reader labels, kontrast, `prefers-reduced-motion`, klavye kullanımı ve açık/kapalı durumlar çalışır olsun.
5. Render kaynaklarını mevcut mimariye göre iyileştir: tek canvas, görünmez sekmede iş yükü düşürme, yalnız gerektiğinde frame çizme, resize ve context-loss, shared geometry/material, listener/observer/RAF cleanup, cihaz kapasitesine göre anti-alias/pixel ratio. Sırf optimizasyon için daha karmaşık framework ekleme.
6. Öncesi/sonrası sahne açılışı, senaryo geçişi, kamera etkileşimi, uzun oturum ve bellek davranışını ölç. Aynı koşullar karşılaştırılmadan “%X hızlandı” iddiası yazma.

**Doğrulama:** Gerçek kullanıcı senaryoları, responsive ekran görüntüsü, scroll/overflow, odak sırası, kart örtüşmesi, kamera hareketinin gerçek sonucunu doğrulayan test; profil karşılaştırması. Uygulama dışı sayfaların temel smoke denetimi. Gerekiyorsa mevcut workflow üzerinde testleri gör; eksikse uygun PR sürecine bırak.

**Kabul:** UI daha sade ama işlev kaybı yok; mobilde model erişilebilir, masaüstünde çalışma alanı verimli; kamera/animasyon akıcı; WebGL unavailable/reduced motion ve 2B geçiş sağlam; performansta kritik gerileme yok.

**Hata/geri dönüş:** Ölçümle zararlı çıkan efekt veya render optimizasyonu geri alınır; daha az kontrol/efekt ile net kullanıcı sonucu korunur. Sırf araç mevcut diye Vercel Preview harcanmaz.

**Durma:** Değişen kontrol davranışlarını, temel responsive/perf sonuçlarını ve kalan riskleri raporla; **“devam”** bekle.

### ASAMA_05 — Bağımsız kalite kontrolü, düzeltme ve tek Production yayını

**Amaç:** Etkileyici görünen değil, güvenle yayınlanabilir, test kanıtı bulunan ürün teslimi.

**Giriş:** `ASAMA_01–04` kabul edilmiş, hedef branch ve güncel `main` karşılaştırılmış, açık engel yok.

**Uygulama sırası:**

1. Kod gözden geçirme: yalnız hedeflenen dosyalar, doğru yönetmelik anlamı, bağımlılık ve paket etkisi, güvenlik, cleanup, erişilebilirlik, riskli ortak kod, `main` ile conflict/delta kontrolü.
2. Var olan **geometri Node testi**; hedef dosyalarda **ESLint**; **TypeScript**; **production build**; **Playwright** desktop/mobil/tablet/WebKit; uygun site smoke ve araç regresyon kontrollerini gerçek çalışan ortamda veya mevcut CI'da çalıştır. Akış: `.github/workflows/duzensizlik-simulatoru-e2e.yml`. Manuel workflow başlatma yetkisi yoksa CI tetiklemeyi PR üzerinden, repo ve skip-ci koşullarına göre planla. Test sonucu, SHA ve log bağlantısını kaydet.
3. Geometri testlerinin üstüne gerçek görsel davranış testleri ekle/yenile: vurgulanan objenin gerçekten değişmesi, doğru bölgeye odaklanma, kartın sahneyle güncellenmesi, animasyonun hareket etmesi, 3B/2B geçişte tek canvas, alternatif WebGL görünümü. Testleri sadece `aria-pressed`/checkbox üzerinden geçerli sayma.
4. A1–B3 için **sabit ve animasyonlu** durumların yakın/uzak/üst/yan ekran görüntülerini karşılaştır. 320/390/430 mobil, 768 tablet, 1366/1920 masaüstü ve desteklenen yatay ekranı kontrol et. Browser console, hydration, page error ve request failure kayıtlarına bak.
5. Uzun oturum/senaryo geçişi/yeniden girişte aşırı bellek artışı veya WebGL context kaybı olmadığını kontrol et. Erişilemeyen fiziksel cihaz testlerini açıkça sınırlama olarak belirt.
6. Eksikler varsa **aynı aşama içinde** kök nedeni düzelt ve ilgili testi yeniden çalıştır. Tam paket her küçük düzeltmede kör biçimde tekrarlanmaz; release öncesi tüm zorunlu kapılar yeniden geçilir.
7. Doğrulanmış kodu repo kurallarına uyan **tek anlamlı release/merge hareketiyle** `main` dalına taşı. Otomatik üretim yayınının tek kez tetiklendiğini doğrula; aynı değişikliği CLI ile ikinci kez deploy etme. Vercel build/deployment READY ve commit eşleşmesini incele; deploy sürerken bağımsız kontrolleri sürdür.
8. Canlı URL'de A1–B3 sahneleri, kart, kamera, mobil düzen, kaynak bağlantıları, 2B fallback ve geri dönüşü kontrol et. Ciddi hata varsa uygun hotfix ve kanıtla düzelt; hızlı/ güvenli düzeltilemeyen kritik hatada önceki çalışan sürüme rollback et; bozuk yayını bırakma.
9. `CHATGPT_WEB_QUALITY_V2_STATE.md` içinde `TAMAMLANDI`, kanıtlar, yayın SHA/URL, kalan sınırlamalar ve kapanış kaydını oluştur. Uygulamayı bitirdikten sonra gereksiz ek deploy, refactor veya temizlik yapma.

**Doğrulama:** CI + gerçek ekran davranışı + Vercel Production READY + canlı rota kontrolleri. Kullanılan test altyapısı, hangi ortamda çalıştığı ve doğrulanmayanlar ayrı yazılır.

**Kabul:** Altı senaryo teknik olarak doğru ve öğretici; birleşim hataları giderilmiş; kart işlevsel; mobil/masaüstü kusursuz temel akış; tüm zorunlu testler PASS; `main` SHA ile Vercel Production sürümü eşleşiyor; kritik console/runtime hatası yok.

**Hata/geri dönüş:** CI kırmızıysa/şüphe varsa `main` merge ve Production **yapılmaz**. Runtime test yetkisi yoksa başarısızlığı gizleme; `ENGELLI` durumunda dur. Rollback gerekiyorsa yayımdan önce doğrulanan çalışan sürüm geri getirilir ve sonuç kaydedilir.

**Durma:** Kullanıcıya yalnız kısa sonuç: önemli iyileştirmeler, geçen testler, gerçek production linki, varsa sınırlamalar. `execution_status: TAMAMLANDI` ve **başka aşama yok**.

---

## 5. Final kabul matrisi

| Kategori | Kabul kanıtı |
|---|---|
| Yapısal geometri | Kolon/kiriş/perde/döşeme kritik birleşimlerinde yakın görsel kontrol + uç/düğüm tutarlılığı testi |
| Mühendislik doğruluğu | A1–A3/B1–B3 kaynağa göre doğru; B1/B2 ayrımı; sahte sayısal analiz sunulmuyor |
| Öğreticilik | Her senaryoda doğru sorun bölgesi + kısa “Neden Problemli?” kartı + 2B/3B tutarlılığı |
| UX | Tam ekran, kaydırma yok, kamera ve katmanların **gerçek** davranışı, mobil örtüşme yok |
| Stabilite | WebGL fallback, reduced-motion, ekran yönü, context/visibility, uzun oturum, konsol hatası |
| Performans | Karşılaştırılabilir baseline; belirgin gerileme yok; kaynaklar temizleniyor |
| Regresyon | İlgili geometri, browser/CI, typecheck, build ve site smoke kapıları başarılı |
| Yayın | `main` / Production SHA eşleşmesi ve canlı URL doğrulaması; tek planlı Production |

Test başarı kanıtı ile **gözle yapılan görsel değerlendirme** ayrı tutulur. Cihaz emülasyonu fiziksel mobil cihaz testi sayılmaz.

---

## 6. “Devam” protokolü ve başlangıç komutu

Bu plan **ChatGPT Web sohbetindeki ChatGPT tarafından** uygulanacak; yerel ajana gönderilecek bir talimat değildir.

- Bu belge tek başına iş başlatmaz. Kullanıcı **“başla”** veya açık biçimde **“ilk aşamayı uygula”** dediğinde yalnız `ASAMA_01` gerçekleştirilir.
- Sonraki her **“devam”** yalnız ilk tamamlanmamış aşamayı sürdürür/tamamlar; **aynı mesajda bir sonraki aşama başlatılmaz**. Aşama kendi içindeki gerekli düzeltme ve testleri kapsar.
- Her aşamada güncel dosya/branch ve durum kaydı okunur; daha önce tamamlanmış iş körlemesine tekrarlanmaz. Hata veya erişim engeli varsa `ENGELLI` raporlanır, sahte PASS verilmez.
- Aşama sonunda kısa rapor: yapılanlar, doğrulama, engel, sıradaki aşama. Sonraki kullanıcı mesajına kadar görev yürütülmez ve arka planda iş yapıldığı iddia edilmez.
- `TAMAMLANDI` sonrasında yalnız **“devam”** denirse: **“Plan tamamlandı; uygulanacak başka aşama yok.”** denir; yeni commit, test, audit, deploy veya faz üretilmez.
- Aşamalardan herhangi birinin kapsamı değişirse `plan_revision` artırılır; eski kanıtlar kaybolmaz. Mevcut repo/CI kuralları bu planla çelişiyorsa önce kullanıcı talebi ve güncel repo gerçeği dikkate alınır.

**İlk uygulama mesajı:**

> Başla. `TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026` planını ChatGPT Web araçlarıyla uygula. Önce GitHub `main` HEAD, repo kuralları, mevcut simülatör release/durum kayıtları ve kullanılabilir test/Vercel araçlarını doğrula. Yalnız `ASAMA_01` kapsamında baseline, risk listesi ve güvenli çalışma dalını hazırla. Gerçek kanıtları durum kaydına işle, kısa rapor ver ve dur. Sonraki aşamaya ben “devam” demeden geçme.

---

## 7. Bağlantılar

- [GitHub depo](https://github.com/smitelagwar/muhendislik-site)
- [Canlı 3B düzensizlik simülatörü](https://muhendislik-site.vercel.app/kategori/araclar/duzensizlik-simulatoru)
- [Simülatör kaynak klasörü](https://github.com/smitelagwar/muhendislik-site/tree/main/src/components/duzensizlik-simulatoru)
- [Geometri ve senaryo çekirdeği](https://github.com/smitelagwar/muhendislik-site/tree/main/src/lib/duzensizlik-simulatoru)
- [Geometri testleri](https://github.com/smitelagwar/muhendislik-site/tree/main/tests/duzensizlik-simulatoru)
- [Tarayıcı testleri](https://github.com/smitelagwar/muhendislik-site/blob/main/tests/site-audit/irregularity-studio.spec.ts)
- [E2E GitHub workflow](https://github.com/smitelagwar/muhendislik-site/blob/main/.github/workflows/duzensizlik-simulatoru-e2e.yml)
- [GitHub/AI çalışma kuralları](https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md)
- [AFAD TBDY 2018 resmî PDF](https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf)
- [Resmî Gazete yönetmelik sayfası](https://resmigazete.gov.tr/eskiler/2018/03/20180318M1-2.htm)

**Son ilke:** *Daha fazla özellik değil, daha fazla kalite. Daha gösterişli animasyon değil, daha doğru mühendislik anlatımı. Daha kalabalık panel değil, daha olgun tam ekran deneyimi.*