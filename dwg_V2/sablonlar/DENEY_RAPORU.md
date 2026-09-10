# Deney raporu şablonu

[Dizin](../README.md) · [Doğrulama programı](../11_DOGRULAMA_PROGRAMI.md)

**Durum:** NOT RUN — Bu dosya ölçüm sonucu içermez.

Gemini yalnız [19](../19_GEMINI_ADIM_ADIM_UYGULAMA.md)'da atanmış doğrulamaları yürütür; yeni teknoloji/decoder yarışı başlatmaz. E/W araştırma kimliklerine ek olarak G/R/RUN/SNAP yazılır. Bu şablondaki sonuç değerlendirmesi teknik seçim yetkisi değildir.

## Deney kimliği

- E/W ID, tarih, çalışan kişi/ajan:
- Git HEAD, yerel diff, build modu:
- Decoder/compiler/renderer/asset sürümleri:
- Hipotez ve değiştirilen tek ana değişken:

## Girdiler ve ortam

Source revision/hash, font/XREF/underlay hash'leri; fixture gerçek/sentetik/malformed türü; device/browser/OS/GPU; network ve dört cache durumundan hangisi; termal/güç koşulu; referans uygulama/layout/display ayarları.

## Yöntem

Gerçek komutlar, timeout/cleanup, sıra randomizasyonu, tekrar sayısı, warmup ve dışlanan örneklerin gerekçesi. Client/worker/server saatleri nasıl eşlendi? Byte/memory alanları nasıl ölçüldü?

## Sonuç tablosu

| Ölçüt | Mevcut | Aday | Yöntem / örneklem / belirsizlik |
|---|---|---|---|
| First useful | NOT RUN | NOT RUN | |
| Full ready | NOT RUN | NOT RUN | |
| Frame p95/p99 | NOT RUN | NOT RUN | |
| Input p95 | NOT RUN | NOT RUN | |
| Peak memory | NOT RUN | NOT RUN | |
| Transfer bytes | NOT RUN | NOT RUN | |
| Kritik fidelity | NOT RUN | NOT RUN | |
| Degraded/failure | NOT RUN | NOT RUN | |

## Kanıt dosyaları

Ham ölçümler, screenshot/crop, numeric diff, log ve diagnostik yolu. Hassas çizim metni veya token'ı rapora kopyalama. Measurement/tahmin/unavailable alanlarını ayır.

## Karar

PASS / DEGRADED / FAIL / UNSUPPORTED / NOT RUN; neden. Kazanç, regresyon, yeniden üretme adımları ve sonraki deney. Mevcut motorda değişiklik olduysa açık dosya listesi; plan dışı değişiklik yoksa fingerprint kanıtı.
