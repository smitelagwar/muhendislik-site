# Belgeler Mobil PDF Stüdyosu — Uygulama Durumu

> Plan: `BELGELER-MOBIL-SADELESTIRME-2026-10-21`, revizyon `1.0`
> Çalışma dalı: `chatgpt-belgeler-mobile-ui-20261021`
> Plan kaynak SHA: `d1e9fa5cc171fca4a3f2b4c1694a72ef9ef8ba6b`
> Son güncelleme (UTC): `2026-10-21T18:35:22.034Z`

```yaml
plan_id: BELGELER-MOBIL-SADELESTIRME-2026-10-21
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: null
next_stage: ASAMA_04
completed_stages:
  - ASAMA_00
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
evidence:
  - ASAMA_00: Salt-okunur GitHub/Vercel emniyet ve baseline denetimi; PASS.
  - ASAMA_01: TypeScript deployable runtime, hedefli ESLint, 7 mobil/desktop Playwright senaryosu; PASS.
  - ASAMA_02: TypeScript, hedefli ESLint, 4/4 geçici Playwright senaryosu, 320-1023 ölçüm; PASS. Vercel deployment yok.
  - ASAMA_03: TypeScript, ESLint, git diff ve Playwright 3/3 PASS; 320/390/768, dark/light, reduced-motion ve masaüstü doğrulandı.
blockers: []
updated_at: "2026-10-21T18:35:22.034Z"
```

## Aşama raporu

| Aşama | Durum | Gerçekleşen işler | Kanıt |
|---|---|---|---|
| ASAMA_00 | PASS | `main`/Vercel güvenlik kontrolü, kaynak ve test envanteri | 21.10.2026 sohbet raporu |
| ASAMA_01 | PASS | Beş stüdyoda mobil üst sekmeler kaldırıldı; ilk açılış PDF; alt geçiş tek görünür kontrol; eski `aria-labelledby` bağımlılıkları erişilebilir `role=region` etiketlerine dönüştürüldü | Aşağıdaki testler |
| ASAMA_02 | PASS | Mobil çok sayfalı toolbar 44px tek satır, menüde fit/external; desktop korundu | Aşağıdaki ASAMA_02 kanıtları |
| ASAMA_03 | PASS | Formu Düzenle düğmesinde mobil ve preview odaklı 3.6 sn amber halo, reduced-motion statik | Playwright 3/3, tsc ve ESLint |
| ASAMA_04–06 | BASLAMADI | Sıradaki aşama bekleniyor | — |

### ASAMA_01 değiştirdiği dosyalar

- `src/components/beton-dokum-studio.tsx`
- `src/components/insaat-ruhsati-studio.tsx`
- `src/components/istifa-studio.tsx`
- `src/components/sozlesme-studio.tsx`
- `src/components/taahhutname-studio.tsx`

PDF üretim motoru, örnek PDF şablonları, zoom motoru, indirme/yazdırma iş mantığı ve masaüstü düzeni değiştirilmedi.

### ASAMA_01 denetim kanıtları (Vercel Sandbox — Git deployment değil)

- Kaynak `main` SHA: `d1e9fa5cc171fca4a3f2b4c1694a72ef9ef8ba6b`; izolasyon: `belgeler-mobile-stage01-20261021` adlı geçici sandbox.
- `npm ci --no-audit --no-fund`: bağımlılıklar kuruldu.
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **exit 0**.
- `npx eslint` (beş güncellenen TSX dosyası): **exit 0**.
- `git diff --check`: **exit 0**.
- Geçici `tests/site-audit/stage01-sandbox-only.spec.ts` ile Chromium Mobile 390: **6/6 PASS**, 5 rota başlangıç önizleme, alt geçiş, form değerinin korunması ve 1023/1024 masaüstü sınırı.
- Aynı geçici dosyada iki sayfalı Sözleşme sayfa 2 ve %125 zoom korunma: **1/1 PASS**.
- Test başlangıcındaki Chromium sistem kütüphaneleri eksikliği sandbox içinde düzeltildi; geçici testteki iki erişilebilir ad/erken tıklama varsayımı düzeltilerek nihai 7 senaryo yeşil tamamlandı.
- Geçici test dosyası bu commit'e eklenmedi; kalıcı test sözleşmesinin uyarlanması `ASAMA_04` görevi.
- Bu aşama yeni PDF toolbar tek satır veya amber glow **uygulamadı**; bunlar sırasıyla `ASAMA_02` ve `ASAMA_03` kapsamıdır.
- Eski repository Playwright testlerinin `role=tab` beklentileri, `ASAMA_04` aşamasında korunarak güncellenecek. Henüz bütün repodaki testlerin başarılı olduğu iddia edilmez.

### Deployment koruması

- `vercel.json` → `git.deploymentEnabled["chatgpt-*"] = false`; çalışma dalı eşleşiyor.
- Branch açıldıktan hemen sonra Vercel'de bu dala ait deployment sayısı 0 bulundu.
- Plan süresince PR açmak, `main`e push/merge veya manuel Vercel deploy **yasaktır**.
- İlk atomik checkpoint sonrasında Vercel'de bu branch'e ait deployment sayısı ayrıca doğrulanacaktır.
- ChatGPT yeni `devam` komutuna kadar `ASAMA_04`e geçmez; plan yalnız açık kullanıcı talebiyle devam eder.

### Devam protokolü

Her kullanıcı `devam` mesajında **en fazla bir aşama** uygulanır; başarısız aşama PASS sayılamaz. `ASAMA_06` ve tüm gerekli kontroller tamamlandığında durum `TAMAMLANDI` olur. `TAMAMLANDI` sonrasında çıplak `devam` ile hiçbir işlem yapılmaz. Yayın, bu planın kapsamı dışındadır.

## ASAMA_02 — Mobil çok sayfalı PDF toolbar

- Durum: **PASS**, güncelleme 2026-10-21T17:49:30.125Z; başlangıç SHA `378e61a74b4c64746c159fccf267682eba54d2cf`.
- Değiştirilen kaynaklar: `src/components/belge-studio-preview-toolbar.tsx` ve `src/app/globals.css`.
- 320 / 360 / 390 / 414 px yükseklik: **91px → 44px**; 768 / 1023 px **44px → 44px**. Ölçülen ekranlarda yatay taşma sıfır; tüm görünür toolbar düğmeleri en az 44×44px.
- Çok sayfalı mobilde önceki/sonraki sayfa ve zoom +/- tek satır. Zoom yüzdesi dar konteynerde menüde, daha geniş mobil konteynerde görünür. `Sığdır` ve `PDF'yi yeni sekmede aç` erişilebilir Radix DropdownMenu'ye taşındı. Menü satırları 48px. Yeni sekme açma, Escape/focus dönüşü ve sayfa sınırları gerçek Chromium tarayıcısında doğrulandı.
- 1024 / 1366 / 1920px masaüstünde toolbar 44px, zoom tam merkezde, tema kontrolü ve direkt fit/external düğmeleri korunuyor. Tek sayfa belgelerin doğrudan kontrolleri korunuyor, overflow menüleri oluşturulmuyor.
- İzole Vercel Sandbox (deployment değildir): `git diff --check`, hedefli ESLint ve `npx tsc -p tsconfig.next.json --noEmit --incremental false` **PASS**, geçici Playwright testleri **4/4 PASS**. Testler sandbox'ta kaldı, repo dosyasına yazılmadı; kalıcı test uyarlaması `ASAMA_04` kapsamında.
- İlk denemede Next dev server ile eşzamanlı typecheck geçici `.next/dev/types` dosya yarışına uğradı; sırayla tekrar çalıştırıldı ve PASS. Menü 44px hareket animasyonu sırasında 43.98px ölçülünce menü öğesi yüksekliği güvenli 48px yapıldı ve test tekrar PASS.
- GitHub için üretilen iki kaynak blob SHA'sı, sandbox `git hash-object` sonuçlarıyla birebir eşleşti. Kodun PDF üretimi/şablonları değiştirilmedi.
- Plan süresince **0 Vercel deployment**, PR, main push veya merge; gönderimden sonra Vercel tekrar doğrulanmalı.
- Sonraki aşama yalnız yeni kullanıcı `devam` mesajıyla **ASAMA_03**: Formu Düzenle butonunda hafif amber ışıma.

## ASAMA_03 — Kısa doğrulama

- 2026-10-21: `src/components/belge-studio-actions.tsx` ve `src/app/globals.css` düzenlendi. Hafif, 3.6 sn amber pulse yalnız mobil PDF önizlemesinde; form modunda, masaüstünde ve komşu işlemlerde animasyon yok.
- 320/390/768 px, dark/light, `prefers-reduced-motion:reduce`, klavye odağı, tıklama, minimum 44px ve yatay taşma test edildi. Playwright **3/3 PASS**; TypeScript/ESLint/diff **PASS**. Dosya SHA'ları sandbox test edilenlerle birebir aynı.
- Kalıcı test uyarlaması `ASAMA_04` kapsamı. Vercel deployment yok; sonraki **devam** mesajında yalnız `ASAMA_04`.
