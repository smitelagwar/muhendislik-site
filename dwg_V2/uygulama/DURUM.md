# DWG Motor V2 — Güncel uygulama durumu

[Kayıt dizini](README.md) · [Sabit kararlar](../00_BAGLAYICI_UYGULAMA_KARARLARI.md)

| Alan | Güncel kayıt |
|---|---|
| Plan revizyonu | EXEC-2 + U1/U2/U3 |
| Karar / denetim sahibi | Astra / kullanıcı |
| Uygulayıcı | Gemini; henüz çalışmaya başlamadı |
| Motor uygulaması | NOT_STARTED |
| İlk yapılacak paket | G00 |
| Uygulama başlangıç HEAD/SNAP | Henüz alınmadı; araştırma HEAD'i uygulama başlangıcı sayılmaz |
| Son uygulama SNAP / SES | Yok |
| Uygulayıcı tarafından doğrulanmış G | 0 / 18 |
| Astra tarafından kabul edilmiş R | 0 / 48 |
| Runtime testleri | NOT_RUN |
| N/V/C/F alt kabul | 0 / 78; NOT_RUN / NOT_REVIEWED |
| Gerçek motor görsel kabulü | NOT_RUN |
| Production V2 | Uygulanmadı / dağıtılmadı |
| Açık uygulama CR/FIX | Henüz açılmadı; sorun yok anlamına gelmez |

## Sonraki somut adım

Gemini [18 numaralı talimat](../18_GEMINI_UYGULAMA_REHBERI.md) ile başlar, repo talimatlarını ve güncel ağacı okur; G00 uygulama snapshot'ını ve test izolasyonunu oluşturur. Eski araştırmayı yeniden üretmez. Yalnız test edilmiş kayıtları sonraki duruma taşır.

## Korunan sınırlar

Legacy motor, normal açılış ve fallback; gerçek kaynak dosyalar, kullanıcı storage'ı ve diğer bekleyen çalışma. Bu turda yerel uygulama/kanıt/devir; production push/deploy yok. Yeni bir mimari seçim gerektiren durumda CR; Gemini alternatif seçmez.

## EXEC-2 plan devri

[26](../26_PLAN_DENETIMI_VE_EXEC2.md) plan denetiminde Three/D3, erken giriş kapısı ve sözleşme eksikleri düzeltildi. Bu düzenleme yeni motorun uygulanması değildir. [Alt kabul tablosu](ALT_KABUL_DURUMLARI.md) boştur.

## Kullanıcı netleştirmesi U1

[32](../32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md): AutoCAD benzeri kaynak görünüşü; bilgisayar ve Poco X6 Pro kullanıcı testine açık. Testler yapılmadı. Kurulu referans CAD programı/sürümü ve sunucu bütçesi henüz doğrulanmadı. İlk paket G00, bütün runtime durumları değişmeden NOT_RUN.

## U3 kesin kullanım profili

Öncelik AutoCAD düzeyinde görünüş. Online-only; tek DWG/DXF; genelde≤30 MB, en fazla70 MB. Companion klasör/font/XREF istenmez; 32 U3 uygulanır. Ölçüm araçları sonraya kalır. Bütün uygulama/runtime durumları henüz NOT_STARTED/NOT_RUN.

## 08.09.2026 devir kontrolü

Son devam oturumunda tek dosya/online/30–70 MB kapsamı, G07 font substitute ve G09 gömülü kaynak koşulları çapraz kontrol edildi. [U3 belge kontrolü](../arastirma/exec2-u3-plan-kontrol.json) devir kanıtıdır; runtime kabulü değildir. İlk uygulama işi G00 olarak kalır.
