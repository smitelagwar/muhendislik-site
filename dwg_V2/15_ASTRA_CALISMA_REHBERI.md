# 15 — Astra'nın karar ve bağımsız denetim rehberi

[Dizin](README.md) · [Bağlayıcı kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Denetim protokolü](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**Güncel rol dağılımı: Gemini uygular; Astra karar verir ve bağımsız kontrol eder.** Önceki Astra uygulama başlangıç metni bu rol değişikliğiyle yürürlükten kaldırıldı. Gemini'ye verilecek tek başlangıç [18](18_GEMINI_UYGULAMA_REHBERI.md)'dir. İlk araştırmadaki teknoloji serbestliği Gemini için geçerli değildir.

## Astra işi devraldığında

1. Kullanıcının son talimatı, geçerli EXEC sürümü ve uygulama/DENETIM_DEVRI okunur.
2. Güncel kaynak/asset/diff kimliği, raporun SNAP kimliğiyle doğrulanır. Kayıtlar kanıtın adresidir; bağımsız doğrulamanın yerine geçmez.
3. [24](24_GEREKSINIM_KATALOGU.md)'teki 48 R tek tek kod, test, gerçek çizim ve UI ile eşlenir.
4. [23](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)'teki AUD/FIX döngüsü uygulanır. Her düzeltme tek seçilmiş yol ve kabul ölçüsü taşır; Gemini yeniden seçim yapmaz.
5. Yerel kod, gerçek cihaz, çizim profili ve production durumu ayrı raporlanır. Mevcut motor korunur; eksik test PASS yapılmaz.

## Kullanılabilecek denetim talimatı

> Gemini'nin DWG Motor V2 uygulamasını EXEC-2'e göre baştan sona denetle. R01–R48 ve 78 N/V/C/F alt kabul koşulunu tek tek incele; kaynak kod, gerçek test ve görsel kanıtları aç. Aynı motorun kendi ürettiği veriyi tek oracle sayma. Özellikle Türkçe yazı/ölçü/hatch/pafta, mobil davranış, eski motorun korunması ve modern/kaliteli arayüzü kontrol et. Sonucu AUD kaydı ve Gemini'nin seçim yapmadan uygulayacağı FIX planı olarak hazırla. Hataları sırf raporu tamamlamak için kabul etme.

## Karar revizyonu

Astra mevcut kanıt seçilmiş yolun yetersizliğini gösterirse yeni kararı gerekçesiyle verir, EXEC sürümünü ilerletir ve etkilenen G/R/testleri yeniden kontrol listesine alır. İlk araştırma karşılaştırmaları bu karar için kaynak olabilir. Gemini CR açarak engeli gösterir; yeni SDK veya mimariyi kendisi seçmez.

## Sol belgesinden alınan ve genişletilen fikirler

[Orijinal Sol belgesi](girdi/SOL_TEKNIK_ONERILER_ORIJINAL.md) değiştirilmeden saklandı. Hash'i [başlangıç kaydında](arastirma/yerel-baslangic.json).

| Sol'daki fikir | Bu paketteki değerlendirme |
|---|---|
| Decoder/render ayrımı | Korundu; revision/dependency/provenance ve vectorized çıktı seçenekleri eklendi |
| Float64 + local origin | Korundu; tile/block origin, camera-relative fark ve ölçüm kaynağı ayrıldı |
| Worker/WASM | Korundu; mevcut DWG input transferinin zaten bulunduğu, main-thread DXF yolu ve output kopyası ayrıldı |
| Retained renderer, culling, instancing | Korundu; draw order/clip/transparency ve BYBLOCK engelleri eklendi |
| Progressive görüntü | First-visible/useful/full-ready ayrımı; kritik metin ve partial durum tanımı eklendi |
| Cache | Kaynak RAM, prepared browser disk ve cross-device server scene olarak ayrıldı |
| SHX/metin/hatch/dimension | Gerçek Türkçe DXF bulgusu, pafta ve kritik içerik oracle'larıyla genişletildi |
| Golden test | Reference application ayarları, holdout, bağımsız numeric ve statistical limits eklendi |
| Fallback | Kullanıcının iki motor isteğine göre açık V2 seçimi ve görünür legacy geçişi tasarlandı |
| Teknolojiler öneridir | İlk araştırmada korundu; EXEC-2'de Gemini için seçim serbestliği kaldırıldı. Karar sahibi Astra/kullanıcı. |

Bu paket Sol'un belgesini reddeden veya onu bağlayıcı plana çeviren bir çalışma değildir. Soyut iyi fikirleri repo ve gerçek dosyalarla ilişkilendirir; eksik olan işletim, erişim, pafta, lisans ve kabul ayrıntılarını tamamlar.


Bu karşılaştırma ilk araştırmanın tarihsel izidir. Tabloda korunduğu belirtilen fikirlerden EXEC-2'in sonradan kapsam dışına aldığı seçenekler uygulanmaz; örneğin browser persistent cache, WebGPU ve decoder yarışı şu anda kapalıdır.
