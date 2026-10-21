# Belgeler Mobil PDF Stüdyosu — Uygulama Durumu

> Plan: `BELGELER-MOBIL-SADELESTIRME-2026-10-21`, revizyon `1.0`
> Çalışma dalı: `chatgpt-belgeler-mobile-ui-20261021`
> Plan kaynak SHA: `d1e9fa5cc171fca4a3f2b4c1694a72ef9ef8ba6b`
> Son güncelleme (UTC): `2026-10-21T17:28:34.355Z`

```yaml
plan_id: BELGELER-MOBIL-SADELESTIRME-2026-10-21
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: null
next_stage: ASAMA_02
completed_stages:
  - ASAMA_00
  - ASAMA_01
evidence:
  - ASAMA_00: Salt-okunur GitHub/Vercel emniyet ve baseline denetimi; PASS.
  - ASAMA_01: TypeScript deployable runtime, hedefli ESLint, 7 mobil/desktop Playwright senaryosu; PASS.
blockers: []
updated_at: "2026-10-21T17:28:34.355Z"
```

## Aşama raporu

| Aşama | Durum | Gerçekleşen işler | Kanıt |
|---|---|---|---|
| ASAMA_00 | PASS | `main`/Vercel güvenlik kontrolü, kaynak ve test envanteri | 21.10.2026 sohbet raporu |
| ASAMA_01 | PASS | Beş stüdyoda mobil üst sekmeler kaldırıldı; ilk açılış PDF; alt geçiş tek görünür kontrol; eski `aria-labelledby` bağımlılıkları erişilebilir `role=region` etiketlerine dönüştürüldü | Aşağıdaki testler |
| ASAMA_02–06 | BASLAMADI | Sıradaki aşama bekleniyor | — |

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
- ChatGPT yeni `devam` komutuna kadar `ASAMA_02`ye geçmez; plan yalnız açık kullanıcı talebiyle devam eder.

### Devam protokolü

Her kullanıcı `devam` mesajında **en fazla bir aşama** uygulanır; başarısız aşama PASS sayılamaz. `ASAMA_06` ve tüm gerekli kontroller tamamlandığında durum `TAMAMLANDI` olur. `TAMAMLANDI` sonrasında çıplak `devam` ile hiçbir işlem yapılmaz. Yayın, bu planın kapsamı dışındadır.
