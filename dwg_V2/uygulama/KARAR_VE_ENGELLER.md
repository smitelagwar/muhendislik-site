# Karar ve engel indeksi

[Kayıt dizini](README.md) · [Kararlar](../00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [CR şablonu](../sablonlar/KARAR_ENGELI.md)

| Sürüm | Tarih | Karar sahibi | Durum |
|---|---|---|---|
| EXEC-1 | 05.09.2026 | Astra; kullanıcının “Gemini yalnız uygulayıcı” talimatıyla | Tarihsel; [tam arşiv](../arastirma/exec1-tam-belge-arsivi.json) |
| EXEC-2 | 06.09.2026 | Astra; kaynak kod ve plan denetimi | Geçerli; [13 bulgu/karar](../26_PLAN_DENETIMI_VE_EXEC2.md), uygulama başlamadı |

Gemini bu sürümü veya D kararlarını onaylayamaz/değiştiremez. Teknik araştırma alternatifleri uygulamaya açık değildir. Aynı sözleşme içindeki normal bug fix için CR gerekmez.

| CR | G / D / R | Gerçek engel / kanıt | Bağımlı işler | Bağımsız işler | Astra/kullanıcı kararı |
|---|---|---|---|---|---|
| Henüz yok | — | Uygulama başlamadı | — | — | — |

## U1 — Kullanıcı hedef açıklaması / 06.09.2026

[32](../32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) klasik CAD görünüşü, bilgisayar/Poco gerçek kullanıcı kontrolü ve henüz belirlenmeyen sunucu bütçesini kaydeder. EXEC-2 teknik mimarisi korunur. Bu kayıt test veya satın alma onayı değildir.

## U2 — Kullanıcının lisans süreçlerini sadeleştirme talimatı / 06.09.2026

[00 D22/U2](../00_BAGLAYICI_UYGULAMA_KARARLARI.md) genel lisans evrakı kabul kapısını kaldırır. Gereksiz UI/rapor/onay yok; gereken gerçek bildirimler dağıtım paketinde. Teknik görevler devam eder; üçüncü taraf koşulları kaldırılmış sayılmaz. R39 ve G02/G07/G15/A6 buna göre güncellendi.

## U3 — Kullanıcının dört cevabı / 06.09.2026

[32 U3](../32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) görünüş önceliği, offline olmaması, 30/70 MB dosya profili ve tek dosya akışını bağlar. G07/G09 kaynak çözümü ve G15 test sınıfları güncellendi. Normal legacy açılış/V2 ayrı menü korunur. Bu kayıt gerçek dosya testi değildir.
