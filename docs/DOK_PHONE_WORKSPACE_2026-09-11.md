# Telefon dosya yöneticisi — uygulama ve kabul kaydı

Bu belge, mobil UX denetiminden çıkan uygulamanın yaşayan özetidir. Telefon ekranının fiziksel piksel çözünürlüğü CSS viewport ölçüsü kabul edilmez. POCO X6 Pro üzerindeki gerçek tarayıcı, metin ölçeği ve klavye kontrolü ayrıca yapılmalıdır.

## Uygulanan davranış

- Telefon eşiği: genişlik <640 CSS px; ayrıca coarse pointer, genişlik <1024 ve yükseklik ≤500 olduğunda yatay telefon sunumu. Genel etkileşim eşiği 1024 olarak korunur.
- `/dokumantasyon` telefon ekranında tek uygulama başlığı; dosya gezintisi, arama, oluşturma ve diğer seçenekler. Ana site bağlantısı ve tema seçimi gezinti panelindedir.
- Başlangıç görünümü liste. Diğer → Görünüm ve düzen içinde iki sütunlu kart, sıralama, gruplama ve filtreler birlikte düzenlenir; Uygula tek adımda aktarır.
- Diğer → Öğeleri seç; seçilen sayısı ve Tümü başlığa geçer. Taşı/paylaş/sil çubuğu normal yerleşim akışında kalır.
- Telefon liste ve kartları, grup başlıkları dahil TanStack Virtual ile ölçülür. Metin büyüdüğünde satır yüksekliği sabitlenmez; sanal konum taşıyan dış eleman animasyonlardan ayrıdır.
- Radix Dialog portal, odak kapanı, scroll kilidi ve Escape davranışını yönetir. Panel/drawer, seçim ve arama katmanları tarayıcı geri/ileri geçmişine bağlanır. Arama sonucunun menüsünde geri yalnız menüyü kapatır.
- Arama isteği 250 ms debounce ve AbortController kullanır. Dosya sonucu dosyayı açar; bulunduğu klasöre git ayrı eylemdir. Yükleme, hata ve boş sonuç metinleri vardır.
- `DokWorkspaceSessionProvider` dokümantasyon layout'unda yaşar. Gerçek yükleme yürütücüsü ortak `UploadQueueManager(3)` üzerindedir; farklı yükleme grupları aynı limiti paylaşır. Private Blob için mevcut `uploadPresigned` protokolü korunur. Başarı metadata teyidinden sonra gösterilir.
- Telefon yükleme özeti listeyi örtmez. Detay panelinden hata ve yeniden deneme görülebilir. Sayfa yenileme/sekme kapanması sonrası devam garantisi verilmez.
- Dosya görüntüleyicisine gidip dönüldüğünde yükleme ve kaydırma konumu korunur. Bulunamayan dosyalar modül içindeki `not-found.tsx` ile karşılanır; dokümantasyon oturumu düşmez.
- İndirme mevcut `/files/:id/access` erişim bağlantısını kullanır; yeni bir yetkilendirme yolu eklenmez.

## Otomasyon kapıları

`npm run check:dok-drive-v3:static` statik/domain kontrollerini, `npm run check:dok-drive-v3` bunlara ek Playwright paketini çalıştırır. CI'da statik kontroller ve dört tarayıcı projesi bağımsız çalışır; `validate-mobile-documents` her sonuç geldiğinde hepsinin başarılı olmasını ister. Statik hata mobil tarayıcı testlerini atlatmaz.

`mobile-real-explorer.spec.ts` mevcut seçim, touch/pen, uzun basma, tek navigasyon, dock, son öğe, tema ve breakpoint regresyonlarını yeni menü girişine uyarlar. `mobile-workspace-v2.spec.ts` şu yeni davranışları sınar:

1. Tek başlık, normal 320×568 görünümünde en az sekiz tam öğe ve 5000 öğede 250'den az monte edilmiş öğe yüzeyi.
2. Ayar uygulamasından sonra geçmişin eski görünümü geri getirmemesi.
3. Geriyle seçim ve arama alt menüsünden katmanlı çıkış.
4. 5000 öğeyi gruplama, %200 kök yazı boyutunda son öğeye erişim, yatay taşma ve satır örtüşmesi olmaması.
5. Kontrollü yükleme devam ederken görüntüleyici rotasına gidip dönüşte kuyruğun ve kaydırma konumunun korunması.

Bu testlerde veri ve yükleme HTTP cevapları izole fixture'lardır. Gerçek Neon/Blob uçtan uca kabulü veya fiziksel telefon testi olarak yorumlanmazlar. Chromium touch girdisi CDP ile sınanır; WebKit'te bu özel test bilinçli atlanır.

## POCO X6 Pro'da son kabul

Gerçek cihazda normal ve büyütülmüş sistem metniyle; Chrome adres çubuğu açık/kapalı, dikey/yatay geçiş, klavye açık arama ve yeniden adlandırma, sistem geri tuşu, TalkBack, uzun dosya adını detaydan okuma/kopyalama kontrol edilmeli. Ağ kesintisi ve büyük dosya yüklemesi gerçek test dosyalarıyla ayrıca doğrulanmalı. Cihazın etkin CSS viewport ve devicePixelRatio değerleri sonuçla birlikte kaydedilmeli.

## Yerel doğrulama sonucu — 11 Eylül 2026

| Kontrol | Sonuç |
| --- | --- |
| Drive statik/domain paketi | Geçti |
| `tsconfig.dok-mobile.json` typecheck | Geçti |
| Tam Playwright Drive paketi | 208 geçti, 1 bilinçli atlandı; 2,8 dakika |
| WebKit'te atlanan test | Chromium CDP'ye özgü swipe/flick girdisi; WebKit tap/menü/geri testleri geçti |
| `npm run build` | Geçti; 715 sayfa üretildi |
| `next start` üzerinde 320 px yeni kabul paketi | 6/6 geçti |
| Üretim bundle'ı ile gerçek CAD fixture regresyonu | Salt-okunur, PAN ve komut satırı gizliliği: 1/1 geçti |
| Yeni mobil kaynak lint'i | 0 hata; TanStack Virtual için 1 React Compiler uyumluluk uyarısı |
| Fiziksel POCO / gerçek Neon-Blob yüklemesi | Bu oturumda yapılmadı |

Yerel kanıt logları: `test-results/dok-mobile-final.log`, `test-results/dok-mobile-production.log`, `test-results/dok-cad-regression.log`. Bunlar Git'e eklenmeyen test çıktılarıdır. Tarayıcı testleri ve CAD fixture testi ayrı, açıkça izin verilen yerel test depolamasıyla yürütüldü. Bu kayıt bir Production deployment doğrulaması değildir; bu çalışma sırasında commit/push/deploy yapılmadı.

## Sonraki geliştirmeler için uygulama sırası

Astra medium ile bu kapsamın devamında önce bu belge ve `DOK_CONTEXT_MAP.md`, sonra ilgili kaynak/test okunmalı. Tek bir doğrulanabilir davranış seçilmeli; mevcut başarısızlık yeniden üretilmeli, en küçük değişiklik uygulanmalı ve ilgili regresyon çalıştırılmalı. CAD motoru, depolama protokolü veya hesaplama modüllerine sırf mobil görünüm nedeniyle müdahale edilmemeli. Son checkpoint ancak yerel kalite kapıları ve gerçek cihaz notları açıkça ayrıldıktan sonra hazırlanmalı; ara deneme push'ları yapılmamalı.

## 12 Eylül 2026 — yayın öncesi plan denetimi

Kaynak denetiminde paylaşım sonucu penceresinin geçmiş kaydına katılmadığı ve arama sonuçlarının kaydırma konumunun dosya görüntüleyicisinden dönüşte kaybolduğu saptandı. İkisi de düzeltildi; paylaşım sonucunda geri/seçim koruması ile aramadan dosyaya gidip sorgu ve konuma dönüş için gerçek bileşen regresyonları eklendi. Yeni sorgu yazılırken eski sorgunun sonuçları gösterilmez. Safari'de arama sonucu menüsünün odak dönüşü de açıkça korunur.

| Kapsam | Durum |
| --- | --- |
| Onaylanan telefon UI, iki sütunlu kart, seçim, sanallaştırma, yükleme oturumu, geri akışı | Uygulandı |
| Yerel otomasyon ve CI işlerinin ayrılması | Uygulandı; yayın öncesi güncel koşu logları `test-results/dok-release-*` altında |
| Fiziksel POCO, TalkBack ve gerçek klavye/adres çubuğu davranışı | Manuel kabul bekliyor; emülasyonla tamamlandı sayılmaz |
| GitHub `main` branch protection önerisi | 12 Eylül API denetiminde `protected: false`; bu yayında depo yönetim politikası değiştirilmedi |
| Araştırma belgesindeki genel Node/güvenlik borcu ve diğer gelecek önerileri | Bu telefon uygulaması kapsamının dışında; tüm araştırma önerileri tamamlandı iddiası yok |

Kullanıcı 12 Eylül'de GitHub push ve Production deployment istedi. Bu nedenle testleri geçen uygulama tek anlamlı `main` checkpoint'iyle yayınlanır; deployment sonucu commit SHA ile ayrıca doğrulanır. Fiziksel cihaz kabulü yayın sonucundan ayrı raporlanır. Geçici derleme dizini ve görev dışı `logolar/` dosyaları bu checkpoint'e alınmaz.

Son yayın öncesi koşu: **214 geçti, 1 platforma özgü test atlandı** (2,9 dakika). Güncel `npm run build`, hedefli typecheck ve statik/domain paketi geçti. Derlenmiş `next start` uygulamasında sekiz mobil kabul testinin tamamı geçti. Lint: sıfır hata, TanStack Virtual için bir bilinen React Compiler uyumluluk uyarısı.

### Bulut yayın denetimi

`07d375a` checkpoint'i Vercel Production üzerinde `READY` oldu ve `muhendislik-site.vercel.app` adresine bağlandı. İlk GitHub mobil koşusunda statik kapı geçti; üç tarayıcı işinin ilk `/dokumantasyon` navigasyonu, soğuk derleme sırasında 30 saniyelik test süresini aştı. Sonraki testler geçti. Playwright sunucu hazırlığı gerçek workspace adresini bekleyecek ve izole yerel test deposunu açıkça kullanacak şekilde düzeltildi; test süreleri veya doğrulamalar gevşetilmedi.

CAD production ve DXF fidelity CI işleri tam repo typecheck aşamasında eski test/script API başvuruları nedeniyle başarısızdır. Bu mobil yayının hedefli typecheck/build sonucu ile bu genel CI borcu aynı şey değildir; bütün CI işlerinin yeşil olduğu iddia edilmez. Fiziksel POCO kabulü de açık kalır.

Düzeltilmiş Playwright ayarı, yeni ve boş bir derleme dizininde `CI=true` ile başlatılan sunucuda **214 geçti, 1 atlandı** sonucunu verdi (3,2 dakika); hedefli typecheck ve config lint'i geçti. Canlı 390/320 px incelemesinde liste ve ayarlar açıldı, 320 px doküman genişliği 320 px kaldı, tarayıcı hata kaydı boştu. Bu bulutta saptanan CI hazırlık hatası için test edilmiş tek takip checkpoint'i hazırlanır; uygulama kaynakları veya üretim build sistemi değişmez.
