# Astra'ya uygulama devri

[Kayıt dizini](README.md) · [Denetim yöntemi](../23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**TESLİM HAZIR DEĞİL — Gemini uygulaması başlamadı.** Bu dosyayı G17'de gerçek verilerle doldur. Şimdiki boş alanlar test yapılmadığını gösterir.

## İncelenecek sürüm

EXEC, başlangıç/son SNAP, HEAD/dirty-tree kimliği, build/worker/WASM/font/container hash'leri, package/lock farkı, uygulama kapsamı ve açık CR. Şu an yok.

## Ne uygulandı?

G00–G17 durumları, [78 alt kabul](ALT_KABUL_DURUMLARI.md) ve 48 R'nin kaynak/test/kanıt eşlemesi. Uygulayıcı ve bağımsız kabul ayrı. Şu an 0/18 uygulayıcı doğrulaması, 0/48 bağımsız kabul.

## Denetçinin çalıştıracağı ortam

Gerçek mevcut komutlar, cwd, Node/container/browser, izole config, fixture yerleri/hash'leri, başlangıç/kapanış ve bounded timeout. Sır/credential değerleri yazılmaz. Henüz kurulmadı.

## Kanıt indeksleri

Gerçek RUN/ART listesi; ham test sayıları; numeric/reference/holdout; cold/warm/raw prepare/second-device sonuçları; UI01–UI20 screenshot ve inceleme indeksi. Henüz üretilmedi.

## Açık kalanlar

FAIL, NOT_RUN, DEGRADED, UNSUPPORTED, CR/FIX; erişilmeyen cihaz/ref/host; lisans ve üretim operasyonu durumu. Kaynak [bilinen eksikler](BILINEN_EKSIKLER.md).

## Koruma ve dağıtım

Legacy core/davranış sonucu, user-data izolasyonu, source revision/permissions, V2'nin varsayılan olmadığı kanıt, commit/push/deploy durumu. Bu plan düzenlemesinde motor değişmedi; runtime koruma testi yapılmadı. Production V2 dağıtımı yok.

## İlk denetim adımı

Astra A0 ile gerçek güncel ağacı ve SNAP eşliğini doğrular; sonra R01–R48 ve N/V/C/F alt koşullarını tek tek inceler. Gemini raporundan toplu kabul üretilmez.
