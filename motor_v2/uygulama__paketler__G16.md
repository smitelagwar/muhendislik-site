# G16 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D02, D15 · R32–R35, R42 · UI01–UI20 |
| G / SES / başlangıç SNAP / son SNAP | G16 · SES-20260919-17 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G15 (Doğruluk, performans ve işletim kabulü) doğrulandı |

## Uygulanan davranış

1. **Durum Makinesi ve UI Senaryolarının Bütünlüğü (UI01–UI20, R32, R33, R35):**
   - `src/components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx`:
     - 8 kritik yaşam döngüsü durumu eksiksiz uygulandı: `authorizing`, `preparing`, `loading`, `ready`, `degraded`, `cancelled`, `context-lost`, `error`.
     - UI01 masaüstü ana ekran: Çizim odaklı, nötr V2 rozeti, araç satırı, dosya adı ve bayt boyutu.
     - UI02 koyu/açık tema: Siyah, koyu gri ve açık zemin seçenekleri; kaynak CAD katman renkleri korunur.
     - UI03/UI04/UI05 mobil ve tablet: Safe-area uyumlu, min-width 320 px taşma koruması, dokunma hedefleri minimum 44 px.
     - UI06/UI07 hazırlanıyor ve kısmi görüntüleme: Doğrulanmış spinner, ilerleme metni, kullanıcı iptal butonu.
     - UI08 eksik font/uyarı: Sarı degraded rozeti ("Uyarılar Mevcut"), stack trace sızmaz.
     - UI09/UI10 hata ve iptal: Açıklayıcı Türkçe mikro metin, "Mevcut Görüntüleyiciyle Aç" ve "Tekrar Dene / Yeniden Başlat" eylemleri.
     - UI11/UI12 katman ve pafta panelleri: Arama, görünürlük toggle, düzenli liste.
     - UI13 görünüm ayarları: Tek renk (monokrom), çizgi kalınlığı, arka plan rengi.
     - UI17 WebGL context loss: "Görüntü yeniden hazırlanıyor...", otomatik GPU kaynak kurtarma.

2. **Türkçe Mikro Metinler ve İletişim Sözleşmesi (22 numaralı belge):**
   - Belirlenen standart Türkçe metinler harfiyen uygulandı:
     - "DWG Motor V2 Hazırlanıyor"
     - "İptal Et"
     - "Görüntü yeniden hazırlanıyor..."
     - "Grafik bağlamı geçici olarak kaybedildi. GPU kaynakları otomatik olarak kurtarılıyor."
     - "İşlem İptal Edildi" / "Çizim hazırlama işlemi kullanıcı tarafından sonlandırıldı."
     - "Geri Dön"
     - "Görüntüleme Başarısız"
     - "Mevcut Görüntüleyiciyle Aç"
     - "Tekrar Dene"

3. **Mobil Dokunma Güvenliği ve Viewport Koruması (N18, UI03, UI20):**
   - Çizim giriş yüzeyinde (`CadV2Canvas`) `touch-action: none` zorunlu tutularak parmakla pan/pinch sırasında sayfa kayması engellendi.
   - Açılır katman ve görünüm ayar panellerinde `touch-action: pan-y` tanımlanarak panel içi bağımsız dikey kaydırma sağlandı.

4. **Sahte Veri (Fake Fixture / Mock) İzolasyonu (R42):**
   - Production host shell ve alt bileşenlerinde hiçbir yapay timer (`setTimeout(..., 9999)`), sahte test fixture'ı veya önceden yazılmış sabit veri bırakılmadı; gerçek API ve Web Worker hatları bağlandı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `tests/cad-v2/ui-quality-acceptance.test.ts` | Ekleme | G16 arayüz kalite, durum makinesi ve mikro metin testi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:ui` içine G16 testinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| UI01–UI20, R32–R35 | `npx tsx tests/cad-v2/ui-quality-acceptance.test.ts` | RUN-0045 / SNAP-0001 | PASS (exit 0) | 8 host durumu, Türkçe mikro metinler, mobil dokunma izolasyonu, tema ayarları ve mock temizliği geçti |
| UI Test Paketi | `npm run check:cad-v2:ui` | RUN-0046 / SNAP-0001 | PASS (exit 0) | Kamera + Render + Host yaşam döngüsü + UI kalitesi geçti |
| Tam Sürüm Paketi | `npm run check:cad-v2:release` | RUN-0047 / SNAP-0001 | PASS (exit 0) | Unit + Integration + UI testlerinin tümü eksiksiz geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0048 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Herhangi bir görsel veya işlevsel hata yaşanmadı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G17 (Astra'ya denetlenebilir teslim).

## Uygulayıcı kapanışı

G16 paketi (UI01–UI20 durum makinesi, Türkçe mikro metinler, mobil dokunma izolasyonu, tema/görünüm ayarları ve sahte veri temizliği) başarıyla tamamlandı ve doğrulandı.
