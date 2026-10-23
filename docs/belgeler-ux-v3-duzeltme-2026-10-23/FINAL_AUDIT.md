# Belgeler UX V3 — Son bağımsız yerel kabul

23 Ekim 2026 · Antigravity konuşma referansı: `c8b14f93-4de8-4341-82e3-822ff31fb0a7`.

Kapsam: akıllı bölümler, izinli otomatik taslak ve PDF odak modu; önceki alan vurgusu, form ölçeklendirme ve mobil inline düzenleme regresyonları. Bu kayıt aynı klasördeki önceki D00–D06 özbildirimlerinin yerine geçen son bağımsız kabul kaydıdır. Eski görevlerin durum dosyaları bu denetimde değiştirilmedi.

## Kalan ve doğrudan düzeltilen sorunlar

- Taslak hook'unda bütün yazma yolları tek izin/karar/dirty/generation geçidine taşındı. Retry ve SPA cleanup, recovery veya conflict beklerken yazamaz. Okunamayan/bozuk kayıt korunur.
- Device read-check-write ve silme aynı belge anahtarı için Web Locks üzerinden sıralanır. Devralma kullanıcının onayladığı güncel ham kaydı tekrar doğrular. Kilit desteği olmayan ortamda synchronous yeniden okuma/conflict koruması kullanılır; bu fallback mutlak atomiklik sağlamaz.
- Bir başka sekmenin izni session modunu açamaz/değiştiremez. Kapatma tercihi session reload sonrasında da korunur; kapalıyken eski taslak geri yüklenebilir ama kayıt izni kendiliğinden açılmaz. Yazmadan hemen önce saklanan izin tekrar kontrol edilir.
- Mod değiştirme hedef depodaki eski taslağı otomatik değiştirmez. Geri yükleme, mevcut formla devam ve silme farklı eylemlerdir; açık overwrite onayı ve yeniden sürüm kontrolü gerekir. Şimdilik kapatılan recovery kararı menüden tekrar açılır.
- Silme sonrası pending edit dirilmez; doğrulanamayan silme hata gösterir. Saklanan kayıt otomatik kayıt kapalıyken de ayrı onayla silinebilir.
- Devralmada mevcut form daha önce kaydedilen yerel değerle aynı olsa bile güncel depodaki farklı değerle karşılaştırılır; yanlış no-op yüzünden devralmanın atlanması giderildi.
- Depolama zarfında safe integer revision, finite timestamp ve whitespace kayıtların bozuk veri olarak korunması; consent write/read-back doğrulaması tamamlandı.
- Menüde koşullu hook hatası giderildi; normal Tab ile gezilen bölge semantiği, Escape odağı geri verme, kapalı durum erişimi ve anlamlı durum duyurusu sağlandı. Taslak karar düğmeleri 44 px hedef taşır.
- Bölüm başlıkları benzersiz instance ID kullanır; kapanış odağı stüdyo köküne göre bulunur. İkon geçişi animasyonsuzdur. Form görünümü kontrol API'si DOM ref'lerinden ayrıldı; gizli panel son geçerli fit durumunu korur.
- PDF odak modunun yan etkileri state updater dışına alındı; bekleyen focus restore timer'ı iptal edilir, geri odaklama scroll'u değiştirmez ve başka stüdyodaki inputa gitmez.
- Yavaş mobil PDF çiziminde flash eski çizimin ready durumuyla erken başlamaz: doğru snapshot/page/zoom render token'ı ve ready durumuyla başlar. Stale tuvalde rehber gösterilmez.

## Test kanıtı

Son test edilen üretim build ID: `_GWn_aPAAOycsDs6ekvIk` (Next 16.4.2; 627 sayfa). HEAD `323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47` + yerel değişiklikler; yeni release commit'i yok.

| Kontrol | Sonuç |
|---|---|
| Fresh `npm run build` | PASS; production typecheck dahil |
| `npm run check:belgeler-pdf` | 195/195 PASS + altı sayfa Poppler görsel koruma PASS |
| Final production masaüstü/entegre akışlar | 89 farklı senaryo kapandı: 88/89 ilk final koşu + kalan Sığdır düzeltmesinden sonra 27/27 tam odak paketi PASS |
| Final production mobil inline düzenleme, Chromium 390/320 senaryoları | 9/9 PASS |
| Değiştirilen taslak/section/focus/form-view hook'ları, stüdyolar, taslak UI ve iki yeni E2E dosyası hedefli ESLint | PASS |
| Genel depo TypeScript | FAIL_BASELINE; Belgeler kaynak/test dosyalarında kalan hata yok |
| Tam eski PDF viewer ESLint | FAIL_BASELINE; mevcut ref render erişimleri, effect/state ve callback sırası uyarıları ayrı korunuyor |

Gerçek hook kabulü: `tests/site-audit/belgeler-draft-final-regressions.spec.ts`. Sekme kapatma/reload, eski hedef taslak, recovery yeniden açma, bozuk kayıt retry/SPA, conflict sırasında unmount, silme hatası, device/session izolasyonu ve eşzamanlı writer testleri gerçek UI ve depoda doğrulanır.

Beş belge / 56 alan: `tests/site-audit/belgeler-draft-pdf-roundtrip.spec.ts`. Tüm düzenlenebilir alanlara sahte Türkçe değer girilir; kaydedilen snapshot ve restore edilmiş inputlar karşılaştırılır. Hem üretilmiş önizleme PDF'sinin hem gerçek indirilen PDF'nin AcroForm metinleri bağımsız `pdf-lib` okumasıyla doğrulanır. Salt blob URL varlığı kabul sayılmaz.

Önceki D02/D03 simülasyon birim testleri, gerçek hook davranışının kanıtı olarak kullanılmadı. Bu testlerdeki TypeScript daraltma hataları düzeltildi; lifecycle kanıtı yeni gerçek tarayıcı testleridir. Eski concurrency testleri başka sekmeden otomatik izin alınmasını bekliyordu; önceden verilmiş açık cihaz izniyle başlatıldı. Temizle/devralma onayları testte açıkça kabul edilir. Önizleme hazır metni yeni ortak başlığa göre güncellendi. Yavaş render testinin sayacı ilk render'dan kalma değer yerine yeni render'ı izler. Hiçbir beklenti eşiği düşürülmedi.

## Kapsam sınırı ve kayıt doğruluğu

Genel `tsc --noEmit --incremental false` exit 2: CAD/ECC/eski doküman örnekleri ve kapsam dışı test borçları sürüyor. Tam PDF viewer lint'inin eski hataları, bu görevde yalnız type prop'u ve render readiness koşulu değişen büyük renderer'ın daha önceki yapısından geliyor. Bu rapor bütün deponun lint/typecheck temiz olduğunu iddia etmez; ilgisiz motorlar bu iş için değiştirilmedi. Fiziksel telefon/yazıcı ve Windows'ta Linux native zoom aracıyla kabul yapılmadı. UI PDF zoom, dokunma emülasyonu ve mobil sheet testleri fiziksel cihaz testi gibi sunulmaz.

Bu çalışma **yerel düzeltme** kapsamındadır; commit, push, Vercel Preview veya Production yayını yapılmadı. Canlı site bu yerel değişiklikleri henüz içermez. Önceki yayın yetkisi bu denetime taşınmadı.

Loglar yerel `.tmp/final-production-acceptance.log`, `.tmp/final-mobile-acceptance.log`, `.tmp/final-ux-build-3.log`, `.tmp/final-pdf-2.log`, `.tmp/final-general-tsc-3.log` ve `.tmp/final-scoped-lint.log` altında; kalıcı kopyaları `test-output/belgeler-ux-final/` klasörüne alınır. Önceki başarısız araştırma turları final PASS yerine kullanılmaz. Dev test sırasında kaynak değişikliğiyle oluşan HMR reload'unun recovery ekranı açtığı ara koşu, sabit production derlemesiyle yeniden doğrulanmıştır.

## Son kapanış

**Yerel özellik kapsamı TAMAMLANDI; yayın YAYINLANMADI.** 89 farklı masaüstü/entegre senaryo ve 9 mobil senaryo olmak üzere **98 farklı browser senaryosu PASS**. Son odak düzeltmesinden sonra bütün 27 odak testi yeni production build üzerinde tekrar geçti. 195/195 birim/PDF testi ve altı sayfa görsel koruma PASS. Build ve hedefli lint PASS. Bilinen açık ürün bulgusu test edilen kapsamda kalmadı; genel depo TypeScript/viewer lint borcu yukarıda ayrıca raporlandı. Bu sonucu fiziksel cihaz veya tüm depo kalite kapıları için mutlak garanti olarak yorumlama.

F01–F19: kaynak ve belirtilen test kapsamıyla kapatıldı. F20: Belgeler kaynak/test tipi kapatıldı; kapsam dışı baseline ayrı. F17'nin eski simülasyon raporları bu kayıttaki gerçek browser kanıtlarıyla değiştirildi. Bir sonraki salt devam mesajı yeni aşama, test veya yayın başlatmaz.
