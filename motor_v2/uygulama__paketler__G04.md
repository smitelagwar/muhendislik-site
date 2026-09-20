# G04 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D07, D16, D21 · R23, R24, R26, R32–R35 · UI01–UI20 |
| G / SES / başlangıç SNAP / son SNAP | G04 (G04-A + G04-B) · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G00, G02, G03 tamamlandı; 21/22 arayüz ve 28 etkileşim sözleşmesi uygulandı |

## Uygulanan davranış

- **G04-A Arayüz Kabuğu:**
  - `src/components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx`: Full-viewport V2 studio konteyneri, yükleniyor/hazırlanıyor fazları, hata ekranı ve "Mevcut Motorla Aç" güvenli geri dönüş (D20) eylemi.
  - `src/components/dokumantasyon/cad-v2/cad-v2-canvas.tsx`: WebGL2 render canvas (pointer-events: none) ve üzerinde şeffaf D3 gesture katmanı (touch-action: none, overscroll-behavior: contain).
  - `src/components/dokumantasyon/cad-v2/cad-v2-toolbar.tsx`: Yakınlaştır (+), Uzaklaştır (-), Sığdır (F), Kaydır (H), Katmanlar ve Görünüm Ayarları düğmeleri.
  - `src/components/dokumantasyon/cad-v2/cad-v2-statusbar.tsx`: Dinamik dünya koordinatları (X, Y), zoom yüzdesi, Motor V2 rozeti ve aktif pafta adı.
  - `src/components/dokumantasyon/cad-v2/cad-v2-layer-panel.tsx`: Katman görünürlük (açık/kapalı), renk göstergesi, donuk/kilitli simgeleri ve arama filtresi.
  - `src/components/dokumantasyon/cad-v2/cad-v2-view-settings-panel.tsx`: Tek renk modu (AutoCAD monochrome), çizgi kalınlıkları (lineweight) ve zemin tercihi (Siyah, Koyu Gri, Açık).

- **G04-B Erken Temel Etkileşim ve Kamera Kapısı:**
  - `src/lib/cad-v2/interaction/d3-camera-adapter.ts`: d3-zoom 3.0.0 ile tek giriş denetimi, Float64 dünya koordinatları, çift tıklama zoom iptali, klavye kontrolleri (+, -, F, Space, oklar), zoom sınırları (uMin, uMax).
  - `src/lib/cad-v2/render/cad-v2-renderer.ts`: Three.js 0.172.0 WebGLRenderer + OrthographicCamera, tek kirli frame (dirty-frame) RAF planlayıcısı (boşta 0 RAF), kamera-bağıl Float64->Float32 ofsetleme, tam bellek ve kaynak temizliği (dispose).
  - N01–N23 matematiksel testleri çalıştırıldı ve doğrulandı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/interaction/d3-camera-adapter.ts` | Ekleme | D16, 28 d3-zoom kamera adaptörü | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/render/cad-v2-renderer.ts` | Ekleme | D07, 29 Three.js WebGL2 CAD renderer | Yeni dosya | Bağımsız V2 |
| `src/components/dokumantasyon/cad-v2/*.tsx` | Ekleme | G04-A V2 arayüz bileşenleri | Yeni dosyalar | Bağımsız V2 |
| `tests/cad-v2/camera-interaction.test.ts` | Ekleme | G04-B N01–N23 matematiksel test paketi | Yeni dosya | İzolasyon korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R23, R24, R26, R32–R35 | `npx tsx tests/cad-v2/camera-interaction.test.ts` | RUN-0005 / SNAP-0001 | PASS (exit 0) | N24 fiziksel cihaz testi kullanıcı turuna kadar NOT_RUN |

## Başarısızlık ve düzeltmeler

Node.js ortamında `window` tanımlı olmadığı için `d3-camera-adapter.ts` içinde `typeof window !== "undefined"` kontrolleri eklendi; Lucide ikonlarında `title` wrapper `<span>` içine alındı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adımlar: G05 (İlk gerçek sahneden V2 frame'i ve derleyici CLI) ve G13 (Dosya menüsü ve Studio entegrasyonu).

## Uygulayıcı kapanışı

G04 arayüz kabuğu ve G04-B erken etkileşim kapısı başarıyla tamamlandı ve test edildi.
