# Dökümantasyon Mobil UX — Uygulama Sözleşmesi

Bu belge, `internal-dok-mobile-plan-no-deploy` çalışmasında uygulanan mobil Dökümantasyon davranışlarının kalıcı sözleşmesidir.

## Mobil etkileşim kuralları

- Satıra tek dokunuş: dosyayı açar veya klasöre girer.
- Dikey kaydırma: yalnız kaydırır; seçim veya açma üretmez.
- Uzun basma: seçim başlatmaz ve dosya açmaz.
- Checkbox / `Dosya Seç` / `Klasör Seç`: çoklu seçimin açık giriş noktasıdır.
- `⋮` ve diğer interaktif alt kontroller parent satır gesture'ını tetiklemez.
- Touch/pen marquee başlatamaz; marquee yalnız primary left mouse içindir.
- Bir touch gesture sonrası browser compatibility click aynı öğede ikinci aksiyon üretemez.

## Mobil geometri kuralları

- Mobil seçim hedefleri minimum 44×44 px olmalıdır.
- Liste sanallaştırması `DRIVE_LIST_ROW_HEIGHT = 56` ile çalışır; gerçek mobil dosya/klasör satırı da tam 56 px olmalıdır.
- Selection dock mobilde fixed overlay değildir; explorer ile aynı flex akışında yer alır.
- Dock mobilde wrap yapmamalıdır.
- Explorer tek küçülen/kaydırılan flex child olmalı; `min-height: 0` zinciri korunmalıdır.
- 320×568 dahil son sanal satır tamamen görünür kalmalıdır.
- Büyük rastgele bottom padding ile overlay telafi edilmemelidir.

## Test kapısı

Aşağıdakiler release öncesi geçmelidir:

1. Drive V3 Stage 1→9 kontrolleri.
2. Desktop Chromium Drive V3 regresyonu.
3. 390×844 touch Chromium gerçek DOM kabul testi.
4. 320×568 compact touch Chromium gerçek DOM kabul testi.
5. iPhone 13 / WebKit gerçek DOM kabul testi.

## Deploy disiplini

Çalışma dalı Vercel deploy dışıdır. Geliştirme sırasında her commit için preview/production beklenmez. Değişiklikler önce GitHub Actions üzerinde topluca doğrulanır; main entegrasyonu ancak kabul kapıları yeşil olduğunda yapılır. Production kontrolü entegrasyon sonunda tek toplu deploy üzerinden gerçekleştirilir.

## Kapsam dışı

Bu mobil UX çalışması Dökümantasyon backend/API/storage veya CAD/DWG/DXF görüntüleme motorunun davranışını değiştirmemelidir.
