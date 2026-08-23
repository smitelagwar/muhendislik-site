# CAD Upstream Migration — Aşama 2 Bağımsız Sandbox

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

## Amaç

`mlightcad/cad-simple-viewer-example` upstream uygulamasını mevcut site CAD kodundan tamamen bağımsız şekilde, upstream'in kendi kaynak ağacı ve kendi kilit dosyasıyla derleyerek gerçek entegrasyon öncesi teknik uygulanabilirliği kanıtlamak.

Bu aşama production entegrasyonu değildir. `src/components/dokumantasyon/preview/cad-viewer.tsx`, mevcut DXF worker'ları, DWG→DXF worker'ı, APS fallback ve `src/lib/dokumantasyon/dwg/**` değiştirilmez.

## Aşama 1 kapısı hakkında kayıt

Aşama 1'de tanımlanan 13 gerçek DWG golden corpus + baseline kapısı henüz yerel gerçek proje dosyaları olmadan `PASS` veremez. Kullanıcının açık talimatıyla Aşama 2'nin yalnız **izole upstream sandbox** kısmına geçilmiştir. Bu durum production'a geçiş veya Aşama 1 kabul kriterlerinin atlandığı anlamına gelmez.

## Sabitlenen upstream

- Repo: `mlightcad/cad-simple-viewer-example`
- Commit: `92bf58f8fd77c8b43771cdbea242943e5cd7fa60`
- Commit tarihi: `2026-08-16T01:45:42Z`
- Kaynak tree: `6e1341db66ab5f5029eece4f6b68c3910f193daad5`

Sürüm bilgileri `tests/cad-upstream-sandbox.lock.json` dosyasında makine-okunur biçimde tutulur.

## Neden upstream kaynak ağacı doğrudan checkout ediliyor?

Aşama 2'nin amacı kendi yorumumuzu veya yeni bir CAD motorunu yazmak değil, upstream'in gerçekten çalışıp çalışmadığını görmek. Bu nedenle workflow:

1. bu repoyu checkout eder,
2. resmi upstream repoyu belirtilen commit SHA'da ayrı `cad-upstream-sandbox/` klasörüne checkout eder,
3. upstream'in kendi `pnpm-lock.yaml` dosyasıyla `pnpm install --frozen-lockfile` çalıştırır,
4. upstream'in kendi `pnpm build` komutunu çalıştırır,
5. oluşması zorunlu runtime dosyalarını doğrular,
6. build çıktısını GitHub Actions artifact olarak saklar.

Bu yaklaşım fork drift, kopyala-yapıştır sapması ve mevcut site koduyla istemsiz coupling riskini azaltır.

## DWG runtime zinciri

Upstream'in kendi kodu DWG için `AcDbLibreDwgConverter` kaydeder ve bunu worker modunda çalıştırır. Parser worker URL'si ayrı verilir; Vite build'i `libredwg-parser-worker.js`, `libredwg-web.wasm` ve MTEXT worker'ını `dist/assets/` altına kopyalar.

Aşama 2 sırasında bu zincir değiştirilmez veya monkey-patch edilmez.

## GitHub Actions doğrulama yolu

GitHub `pull_request` workflow tanımını güvenlik nedeniyle base branch üzerinden okur. Bu nedenle yalnız CI doğrulaması için `main` üzerinde `.github/workflows/cad-upstream-sandbox-pr.yml` bootstrap gate'i bulunur. Bu dosya uygulama runtime'ına girmez; yalnız bu migration'ın ilgili lock/workflow/doküman yolları değiştiğinde PR CI çalıştırır. Migration branch içindeki asıl sandbox workflow ve upstream lock sözleşmesi değişmeden kalır.

## Kabul kriterleri

Aşama 2 ancak aşağıdakiler birlikte sağlanırsa tamamlandı sayılır:

1. upstream repo ve commit SHA sabittir,
2. checkout gerçek upstream kaynağından yapılır; reimplementation yoktur,
3. `pnpm install --frozen-lockfile` başarılıdır,
4. `pnpm build` başarılıdır,
5. `dist/index.html` ve `dist/no-plugin.html` oluşur,
6. `libredwg-parser-worker.js` oluşur,
7. `libredwg-web.wasm` oluşur,
8. `mtext-renderer-worker.js` oluşur,
9. build çıktısı artifact olarak üretilebilir,
10. mevcut production CAD dosyalarında diff yoktur.

Gerçek DWG görsel fidelity karşılaştırması Aşama 1 golden corpus sağlandıktan sonra yapılır; bu aşamada sahte bir DWG ile kalite sonucu uydurulmaz.

## Rollback / izolasyon

Bu sandbox başarısız olsa dahi production davranışı değişmez. Aşama 2 sonunda herhangi bir hata görülürse upstream entegrasyonuna geçilmez; mevcut sistem branch üzerinde olduğu gibi kalır.
