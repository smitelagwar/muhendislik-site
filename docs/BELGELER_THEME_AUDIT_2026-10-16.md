# Belgeler tema ve araç çubuğu denetimi — 16 Ekim 2026

## Kaynak ve kabul ölçütleri

Antigravity sohbeti: `dee863c2-981f-44ca-85e1-8a3738ac4c4f`.
İstekler yerel sohbetin `transcript_full.jsonl` kaydından doğrulandı:

1. Belgeler stüdyolarına açık/koyu tema düğmesi eklenmesi.
2. Yakınlaştırma, uzaklaştırma ve sığdırma kontrollerinin ortalanması.
3. Bu kontroller için özel SVG ikonlarının kullanılması.

Antigravity'nin henüz commit edilmemiş uygulaması beş stüdyoda incelendi ve korundu. Denetim başlangıcındaki main/origin/main: `56ae392`.

## Bulunan ve düzeltilen eksikler

- İlk sıkı tarayıcı kontrolünde, tek sayfalı İnşaat Ruhsatı stüdyosunun 320 px görünümünde zoom merkezi 34,5 px kayıyordu. Önceki tema testi yalnız Sözleşme rotasında çalışıyor ve 30 px merkez toleransı kullanıyordu. Eşit yan sütunlar ve dar panelde tüm satıra yayılan zoom grubu ile merkezleme düzeltildi.
- Tema ikonlarının kapsayıcısında hem `inline-flex` hem `hidden` bulunması mobilde iki ikonun da görünmesine yol açıyordu. Görünürlük sınıfları tekilleştirildi; küçük ekranda yalnız etkin ikon gösteriliyor.
- Switch'in `aria-label` değeri `Koyu tema` olarak belirginleştirildi; `aria-checked=true` anlamı erişilebilir adla eşleşiyor.
- Mimari belgede eski Lucide ikon adları ve tek sayfalı belgenin her zaman tek satırda kalacağı bilgisi güncellendi.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| `npm run build` | PASS; production kaynakları derlendi, 627 statik sayfa üretildi |
| `npx tsc -p tsconfig.next.json --noEmit --incremental false` | PASS |
| Runtime kaynakları + ilgili Playwright dosyası için dar kapsamlı TypeScript kontrolü | PASS |
| Değiştirilen bileşenler ve test dosyasında ESLint | PASS |
| `npm run check:tools` | PASS; statik/domain kapıları ve 30/30 gerçek tarayıcı smoke |
| Mevcut mobil/WebKit belge regresyonları | 26/26 PASS |
| Mevcut masaüstü split-view/zoom regresyonları | 5/5 PASS |
| Genişletilmiş tema/hizalama matrisi | 5/5 PASS; her stüdyoda 9 viewport |
| `git diff --check` | PASS |

Tema matrisi 320×720, 360×800, 390×844, 414×896, 844×390, 768×1024, 1920×1080, 1366×768 ve 1024×768 boyutlarını kapsar. Merkez toleransı en çok 2 px; kontroller en az 44×44 px; yatay taşma ve kontroller arası çakışma kabul edilmez. Klavyeyle Space, switch/menü eşliği, yenileme sonrası tema, %125 zoom → sığdır, değişmeyen PDF blob URL'si, canvas içeriği ve console/pageerror kontrol edilir. 320 ve 1366 px açık/koyu ekran görüntüleri görsel olarak incelendi.

Tam paket ilk çalışmada 35 PASS / 1 FAIL verdi: yeni test, Radix menünün kapanıştaki odak iadesini beklemeden sonraki klavye girdisine geçiyordu. Test gerçek odak iadesini bekleyecek şekilde düzeltildi. Değiştirilen beş tema senaryosu yeniden çalıştırıldı ve 5/5 geçti; uygulama kodunda bu test zamanlaması için değişiklik yapılmadı.

Genel `npx tsc --noEmit --incremental false` **PASS değildir**: bu işte değiştirilmeyen 47 CAD script/test, servis ve doküman örneği dosyasında 335 tanı üretir. Çıktı yerel `test-output/belgeler-audit-typecheck.log` içindedir. Bu borç gizlenmedi veya tsconfig kapsamı değiştirilerek bastırılmadı; belge stüdyosu release doğrulaması mevcut production tsconfig'i ve ilgili testin ayrı typecheck'iyle yapıldı.

Build'deki mevcut custom Cache-Control ve `z-index is currently not supported` uyarıları bu çalışmayla değişmedi. Yeni bağımlılık, hesap formülü veya build sistemi değişikliği yoktur.

## Yayın yaklaşımı

Kullanıcı production deploy'u açıkça istedi. Değişiklikler yerelde hazırlanıp test edildiği için AGENTS.md yerel IDE akışına göre tek anlamlı main checkpoint push'u kullanılır; bu push tek otomatik Vercel Production build'i üretir. Ara commit/push veya Preview oluşturulmaz. Yayın sonrasında deployment commit/READY durumu ve aynı beş tema senaryosu canlı production üzerinde doğrulanır.
