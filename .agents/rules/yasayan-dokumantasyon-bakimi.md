# Yaşayan Dokümantasyon Bakım Kuralı

Bu kural proje genelindeki **önemli mimari ve sistem değişiklikleri** için geçerlidir.

Amaç mevcut sistemi dondurmak değildir. Sistem hızlandırılabilir, sadeleştirilebilir, paket/motor değiştirilebilir, farklı bir mimariye geçirilebilir veya bazı eski katmanlar kaldırılabilir.

Ancak böyle bir değişiklik yapıldığında, yeni bir AI oturumunun eski sistemi gerçek sanmaması için **ilgili yaşayan Markdown belgesinin ilgili bölümü de aynı çalışma kapsamında güncellenmelidir**.

## Ne zaman güncellenir?

Aşağıdakilerden biri değişiyorsa ilgili yaşayan bağlam belgesi güncellenir:

- ana route veya modül giriş noktası
- primary engine/service/provider
- fallback sırası
- önemli dependency/package ailesi
- cache/storage/database/auth lifecycle
- worker/WASM/background processing yapısı
- API contract veya veri modeli
- timeout/performance stratejisi
- release/acceptance/test mimarisi
- production'a geçen önemli davranış değişikliği

Küçük metin, renk, spacing, lokal stil veya mimariyi etkilemeyen basit UI değişikliklerinde mimari hafıza dosyası güncellemek gerekmez.

## Hangi dosya?

Göreve göre en yakın yaşayan belge seçilir. Örnekler:

- proje geneli → `PROJECT.md`
- Dokümantasyon → `DOK_CONTEXT_MAP.md`
- Dokümantasyon CAD/DWG/DXF/DWF → `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
- Dokümantasyon storage lifecycle → `DOK_STORAGE_CONTRACT.md`
- Belgeler → `docs/BELGELER_SISTEMI.md`
- ürün/modül özelinde varsa o modülün `IMPLEMENTATION_STATE`, `ARCHITECTURE`, `CONTEXT` veya eşdeğer yaşayan dosyası

Tarihsel plan/stage/release dosyaları geçmiş kanıttır; yaşayan bağlam dosyasının yerine kullanılmamalıdır.

## Çelişki varsa

Markdown ile güncel kaynak kod/testler çelişiyorsa eski Markdown'a uymak için çalışan sistemi geri götürme. Önce güncel doğru davranışı kaynak kod ve testlerle belirle; sonra yaşayan Markdown'ı yeni gerçeği anlatacak şekilde güncelle.

Bu bir **dokümantasyon güncelliği kuralıdır**, mimari değişiklik yasağı değildir.
