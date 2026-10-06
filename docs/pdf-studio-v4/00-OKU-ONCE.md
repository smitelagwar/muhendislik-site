# PDF Studio V4 — Stabilite Planı (UYGULAYICI: Gemini 3.8 Flash)

> **Bu klasör tek bir iştir:** Dokümantasyon modülünde herhangi bir PDF'i her cihazda (eski/yeni tarayıcı, telefon, masaüstü) hızlı, kararlı ve tüm özellikleriyle açmak.
> Planı hazırlayan: Claude (denetçi). Uygulayan: Gemini. Sonra kullanıcı Claude'a "planı uygulattım, eksik var mı bak" diyecek; Claude **kanıt ister** (aşağıdaki rapor şablonu).

## 0. Altın kurallar (pazarlık yok)

1. **Karar verme, planı uygula.** Seçenek sunma, kullanıcıya soru sorma, "daha iyi" bulduğun başka mimariye geçme. Plan bir şeyi belirsiz bırakıyorsa **dur ve blokajı yaz**, tahminle devam etme.
2. **Bir seferde SADECE bir aşama.** Aşama bitince rapor yaz ve dur. Kullanıcı `devam` yazmadan sonraki aşama dosyasını **açma bile**.
3. **Yeniden yazma yok.** `pdfjs-studio.tsx` (≈1900 satır) ve `pdf-page-view.tsx` çalışan, testli kod. Yalnız aşama dosyasında verilen **cerrahi değişiklikler** yapılır. Dosyayı baştan yazma, bölme, "temizleme" yok.
4. **Dokunma listesi:** CAD/DXF dosyaları (`GEMINI.md` §3), hesap araçları, `/belgeler` içerikleri (A2'de yalnız `pdfjs-client.ts` ortak yükleyicisi istisnadır). Bağımlılık sürümü değiştirme (`pdfjs-dist` **6.3.289 sabit** kalır).
5. **Proje kuralları geçerli:** UI metni Türkçe, yorumlar Türkçe, yeni kodda `any` yok (var olan `any`'lere dokunma/çoğaltma), `console.log` yok (`console.warn` yalnız hata yollarında), `next/link`/`next/image` kuralları, light/dark tema bozulmaz.
6. **Test script kuralı:** `.agents/rules/test-ve-otomasyon-standardi.md` — `data-testid` seçici, en çok 8 sn eleman bekleme, asılı süreç yok, geçici `scratch-*` dosyaları silinir. Yeni testler Playwright test runner ile yazılır (bağımsız node scripti değil).
7. **Git:** Aşamalar arasında **commit/push yok**. Tüm değişiklikler çalışma ağacında birikir. Push kararı yalnız A7 sonunda kullanıcıya bırakılır (`AGENTS.md` — tek anlamlı checkpoint).
8. **Doğrulama dürüstlüğü:** Bir komut hata basıp exit code `0` dönerse PASS deme; çıktıyı oku. Çalıştıramadığın bir testi "geçti" diye raporlama; "çalıştırılamadı + neden" yaz.
9. **Geri alma:** Bir aşama kırmızı bitiyorsa ve 2 deneme sonunda düzelmediyse o aşamanın dosyalarını `git restore <dosya>` ile geri al, blokajı raporla. Çalışan sistemi bozuk bırakma.

## 1. Başlamadan önce (yalnızca ilk oturumda bir kez)

Sırayla oku: `PROJECT.md` → `AGENTS.md` → `.agents/rules/dokumantasyon-kurallari.md` → `.agents/rules/test-ve-otomasyon-standardi.md` → `DOK_CONTEXT_MAP.md` → bu klasörde `01-DENETIM.md`.
Çalışma branch'i: mevcut `internal-pdf-tick-scrubber` (üzerinde 5 push edilmemiş commit var; **dokunma, rebase/reset yok**). `git status` temiz olmayan dosyalar (`DWG_*.md`, `docs/DOK_IMAGE_VIEWER_*`, `docs/pdf-zoom-v2-screenshots/`) bu işle ilgisizdir; **stage'leme, silme**.

## 2. Aşama haritası

| # | Dosya | Amaç | Risk |
|---|-------|------|------|
| A1 | `A1-taban-olcum.md` | Kırmızı-önce testler + taban ölçümü | düşük |
| A2 | `A2-uyumluluk-legacy-build.md` | Eski tarayıcıda hiç açılmama sorununu kökten çöz (legacy pdf.js build + cache sürümleme) | orta |
| A3 | `A3-yukleme-lease-range.md` | Okurken belgenin yeniden yüklenmesini bitir, bağlantı süresi dolunca sessiz yenile, Range sunucusunu düzelt | **yüksek** |
| A4 | `A4-render-pencere-bellek.md` | Büyük belgede hız + telefonda bellek çökmesi + boş sayfa kurtarma | **yüksek** |
| A5 | `A5-zoom-gesture-dogrulama.md` | Zoom/pinch/pan invariant testleri, ölçüm tabanlı düzeltme | orta |
| A6 | `A6-yazdir-mobil-kabuk.md` | Yazdırma, mobil/yatay ekran, dokunma hedefleri | düşük |
| A7 | `A7-kapanis-dokuman-surum.md` | Tam kapı, yaşayan doküman güncellemesi, kullanıcı cihaz kontrol listesi | düşük |

Sıra bağlayıcıdır (A3, A2'nin test altyapısına; A4, A3'ün `onSourceError` kancasına dayanır).

## 3. Her aşamanın standart akışı

1. Aşama dosyasını **baştan sona** oku. "Önce oku" listesindeki kaynak satırlarını gerçekten aç (satır numaraları kayabilir; fonksiyon adıyla bul).
2. **Önce kırmızı:** Aşamanın yeni testlerini yaz, değişiklikten önce çalıştır, kırmızı olduklarını gör (kırmızı olmayan bir test hatayı kanıtlamıyordur; nedenini rapora yaz).
3. Cerrahi değişiklikleri uygula.
4. `npx tsc --noEmit --incremental false` → hatasız olmalı.
5. Aşamanın "Kapı" komutlarını çalıştır; hepsi yeşil olmalı.
6. Rapor yaz ve **dur**.

## 4. Rapor şablonu (her aşamada kullanıcıya aynen bu başlıklarla ver)

```
## A<N> Raporu
Değişen dosyalar: <liste + her biri için +/- satır>
Eklenen testler: <dosya: test adları>
Kırmızı kanıtı: <değişiklikten ÖNCE hangi test neden kırmızıydı>
Kapı sonuçları: <komut → geçti/kaldı sayıları>
Plandan sapma: <yok | madde + neden>
Çalıştırılamayanlar: <yok | madde + neden>
Açık blokaj: <yok | madde>
Sonraki aşama için "devam" bekliyorum.
```

## 5. Ortak komutlar

```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v3:unit
npm run check:pdf-v2:unit
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v3-invariants.spec.ts --project=chromium
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-v4-stabilite.spec.ts --project=chromium
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-v4-stabilite.spec.ts --project=mobile-chromium
```
Playwright config zaten dev/prod sunucusunu kendisi yönetiyor mu: `playwright.config.ts` içindeki `webServer`'a bak; sunucuyu elle başlatma gerekiyorsa arka planda başlat, iş bitince **kapat** (asılı süreç bırakma).

## 6. Başarı ölçütü (kullanıcının gözüyle)

- Eski Chrome/Safari'de PDF **boş ekran vermez**.
- PDF'i okurken (dakikalarca) ekran **yeniden yüklenmez**, konum/zoom kaybolmaz.
- 300+ sayfalık PDF'te ilk sayfa hızlı gelir, hızlı kaydırmada beyaz sayfa takılı kalmaz.
- Telefonda yüksek zoomda sekme çökmez; pinch parmağın altındaki noktaya kilitli kalır.
- Her hata durumunda kullanıcı bir **eylem butonu** görür (yeniden dene / indir), sonsuz spinner yok.
