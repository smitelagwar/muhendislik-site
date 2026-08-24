# Dökümantasyon Modülü Ajan Kuralı

Bu kural yalnız `/dokumantasyon`, `/p/[token]` ve ilgili Dökümantasyon backend, storage, DB, auth, share/download, preview ve CAD işleri için geçerlidir.

## Göreve başlarken

Önce görevin kapsamına göre yaşayan bağlamı oku:

1. `DOK_CONTEXT_MAP.md`
2. CAD / DWG / DXF / DWF işi varsa `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
3. storage/lifecycle işi varsa `DOK_STORAGE_CONTRACT.md`
4. ihtiyaç varsa `docs/DOKUMANTASYON_RUNBOOK.md` ve tarihsel migration/stage belgeleri
5. ayrıntılı eski modül geçmişi gerekiyorsa proje kökündeki `dokumantasyon.md`

Kaynak kod ve güncel testler son doğrulama noktasıdır. Markdown eskiyse kodu eski Markdown'a uydurma; doğru davranışı belirledikten sonra Markdown'ı güncelle.

## Yaşayan dokümantasyon bakım kuralı

Bir görev mevcut sistemi anlamlı biçimde değiştiriyorsa, **aynı çalışma kapsamında ilgili yaşayan MD dosyasının ilgili bölümü de güncellenmelidir**. Yeni bir AI oturumu eski mimariyi gerçek sanmamalıdır.

Özellikle aşağıdakiler değiştiğinde bağlam belgesi güncellenir:

- primary viewer/engine veya fallback sırası
- route / preview / Document Studio giriş noktası
- CAD package ailesi veya önemli sürüm değişikliği
- worker/WASM dağıtımı
- cache veya dönüşüm stratejisi
- timeout/performance yaklaşımı
- storage/auth/share/upload lifecycle mimarisi
- önemli API/DB contract değişikliği
- gerçek dosya acceptance veya release test stratejisi
- production'a geçen önemli mimari değişiklik

Güncellenecek dosya konuya göre seçilir:

- genel Dokümantasyon haritası → `DOK_CONTEXT_MAP.md`
- CAD çalışma mimarisi → `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
- storage lifecycle → `DOK_STORAGE_CONTRACT.md`
- genel proje bağlamını etkileyen değişiklik → `PROJECT.md`

Küçük metin, renk, spacing veya mimariyi etkilemeyen lokal UI düzenlemesi için mimari hafıza dosyası güncellemek gerekmez.

Bu bakım kuralı mevcut mimariyi dondurmaz. Sistem hızlandırılabilir, sadeleştirilebilir, motor/fallback değiştirilebilir veya baştan tasarlanabilir; amaç yalnızca değişiklikten sonra belgelerin yeni gerçeği doğru anlatmasıdır.

`/belgeler` ve bağımsız PDF stüdyosu Dökümantasyon modülü değildir.
