plan_id: INSA-BELGELER-FULLSCREEN-UX-20261016
plan_revision: 3
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
  - ASAMA_04
  - ASAMA_05
evidence:
  - stage: ASAMA_01
    check: "git status --short --branch; git rev-parse HEAD; git branch --show-current; git rev-parse main"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Başlangıç çalışma ağacı temizdi; branch main ve main/origin/main HEAD ile aynıydı."
  - stage: ASAMA_01
    check: "Yerel PROJECT.md, AGENTS.md, ilgili .agents/rules dosyaları, route/component/CSS/test kaynakları ve Next.js 16.3.6 yerel dokümantasyonu incelendi."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "node_modules ve @playwright/test mevcut; package.json scriptleri doğrulandı. Next.js layouts/pages ve linking/navigation belgeleri okundu."
  - stage: ASAMA_01
    check: "npm run dev -- --hostname 127.0.0.1 --port 3005 ile yerel DOM ölçümü"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Beş stüdyo rotası ve /belgeler tarayıcıda açıldı. 390×844, 320×720, 844×390, 1366×768 ve 1024×768 ölçüldü. DOM scroll boyutu her stüdyo görünümünde viewport ile aynıydı; ölçümler aşağıdaki baseline bölümünde. Sunucu ölçümlerden sonra kapatıldı."
  - stage: ASAMA_01
    check: "Belgeler kataloğunda modal entrypoint'i için source + runtime DOM kontrolü"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "BelgelerHub yalnız bağımsız route linkleri gösteriyor; runtime'da role=dialog ve data-studio-locked sayısı 0, önizleme eylemi yok. Beş standalone route isModal={false}; repoda isModal={true} çağrı noktası yok. Planın modal kabulleri yerel kopyada düzeltildi; indirilen kaynak plan korunuyor."
  - stage: ASAMA_01
    check: "Mevcut tests/site-audit/belgeler-mobile-studio.spec.ts incelendi; test runner çalıştırılmadı."
    status: NOT_RUN
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "DOM baseline doğrudan ölçüldü. Test dosyası stage 2/4 için etki notu verdi: satır 207 civarındaki route/menü testi standalone stüdyoda hamburger bekliyor; desktop split-view testi header varlığını henüz doğrulamıyor."
  - stage: ASAMA_02
    check: "Beş tam belge rotasının tek helper'da kesin eşlemesi; NavbarRouteTracker DOM başlığından bağımsız tutuldu."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Yeni src/lib/belge-studio-routes.ts yalnız belirtilen beş rotayı tanır; /belgeler ve ilgisiz yollar eşleşmez. Mevcut /dokumantasyon/dosya/ gizleme prefix'i korunurken tracker her zaman render edilir."
  - stage: ASAMA_02
    check: "Beş route page'i ortak başlık kabuğuna alındı; `npx tsc -p tsconfig.next.json --noEmit --incremental false`."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "TypeScript kontrolü exit code 0. Ortak satır 44 px, geri hedefi minimum 44 px, title tek satır/truncate, erişilebilir ad ve focus ring içeriyor; beş sayfanın isModal={false} çağrıları korundu. Beton stüdyosunun mevcut iç h1'i başlık hiyerarşisini tekleştirmek için h2 yapıldı."
  - stage: ASAMA_02
    check: "Değişen TS/TSX dosyaları için `npx eslint ...` hedefli lint."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Exit code 0, hata yok. beton-dokum-studio.tsx içinde değiştirilmemiş icon importları ve any kullanımları için mevcut 15 lint uyarısı raporlandı."
  - stage: ASAMA_02
    check: "Yerel tarayıcı DOM/viewport doğrulaması: beş route 390×844 ve 1366×768; Beton rotası 320×720, 768×1024, 1024×768, 1920×1080 ve light/dark."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Beş route'ta [data-site-header] sayısı 0; başlık y=0/h=44, stüdyo y=48. Altı genişlikte document scroll viewport dışına taşmadı; 1024 px'te form ve PDF panelleri yatay split kaldı. Light ve dark token renkleri farklı, her iki tema da render edildi."
  - stage: ASAMA_02
    check: "Stüdyo geri bağlantısı, katalog navigasyonu ve mevcut Dokümantasyon dosya rotası."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Geri bağlantısı /belgeler'e götürdü; katalogda [data-site-header] sayısı 1 ve 10 belge bağlantısı render edildi. /dokumantasyon/dosya/route-stage2-check rotasında mevcut davranışla uyumlu olarak site header sayısı 0 kaldı."
  - stage: ASAMA_02
    check: "Belgeler kataloğu responsive/theme kontrolü: 320/390/768/1024/1366/1920 px genişlik."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Tüm genişliklerde global header ve 10 katalog linki korundu; documentElement scrollWidth/clientWidth taşma göstermedi. 320/390 px'te mobil alt navigasyon görünür; tablet/desktop'ta CSS ile gizli. Katalog header arka plan token'ı light/dark geçişinde değişti."
  - stage: ASAMA_03
    check: "Ortak mobil tab ve PDF toolbar düzeni, beş stüdyo, `npx tsc --noEmit --incremental false -p tsconfig.next.json`, hedefli ESLint ve `git -c core.whitespace=cr-at-eol diff --check`."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "TypeScript ve diff-check PASS; ESLint exit code 0, değiştirilmemiş eski koddan 52 warning. Ortak stateless toolbar, erişilebilir düğme adları ve 44×44 hedefleri, tek satırlı mobil form/PDF sekmeleri ve ortak preview ölçüleri beş route'a uygulandı."
  - stage: ASAMA_03
    check: "Responsive browser DOM matrisi: 320×720, 360×800, 390×844, 414×896, 768×1024, 844×390, 1024×768, 1366×768, 1920×1080."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Tüm ölçümlerde yatay/dış sayfa taşması yok; 320/360/390'da toolbar 92 px iki satır, 414 ve üstünde tek satır. Canvas sırasıyla 296×418, 336×475, 365×517, 390×551, 552×782, yatay 104×148, 446×632, 446×632, 667×944; A4 sayfa fit durumunda tam görünür. Görünür toolbar kontrolleri en az 44×44."
  - stage: ASAMA_03
    check: "Beş route'ta PDF/form sekmesi beş kez değiştirme; sözleşme sayfa, zoom/fit, PDF indirme ve template request sayısı; 320×720 final screenshot incelemesi."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Beş belgede canvas ve hazır durumu korunuyor; form sayaçları Beton 10/10, Ruhsat 8/8, İstifa 10/10, Sözleşme 11/14, Taahhütname 14/14. Sözleşme 1/2→2/2 çalıştı; %125 zoom panel içi kaydırma verdi, Sığdır %100 fit'e döndü, PDF'yi yeni sekmede aç ve indirme kontrolleri görünür kaldı; geçiş/zoom sırasında template isteği artmadı. 320 screenshot görsel olarak incelendi."
  - stage: ASAMA_03
    check: "390×460 klavye benzeri viewport daralması; 320 px'te 200% kök font boyutu simülasyonu; temiz 3010 dev sunucusu browser console."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Odaklı alan y=274–318, alt aksiyonlar y=399–460 aralığında kaldı; alan aksiyonların üstünde ve eylem alanı viewport içinde. 200% kök font simülasyonunda document scrollWidth=clientWidth=320. Son temiz browser navigasyonunda 0 console error/warning. Fiziksel klavye/cihaz ve tarayıcının native 200% font/zoom ayarı test edilmedi."
  - stage: ASAMA_03
    check: "Theme token ve keyboard focus görünümü DOM kontrolü."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Dark class değişiminde yüzey token renkleri güncellendi; klavyeyle PDF toolbar'a geçişte 2 px amber focus-visible ring göründü. Geçici tema sınıfı kontrol sonunda geri alındı."
  - stage: ASAMA_03
    check: "Sözleşme PDF preview kullanılabilir alanı önce/sonra karşılaştırması (390×844)."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "ASAMA_02 sonrası toolbar 120.5 px ve canvas 352×503 (177,056 px²); ASAMA_03 sonrası toolbar 92 px ve canvas 365×517 (188,705 px²), canvas alanı yaklaşık %6.6 arttı. Beş route'ta aktif `isModal=true` çağrı noktası bulunmadı; PDF motoru/veri API'si değiştirilmedi."
  - stage: ASAMA_04
    check: "npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-mobile-studio.spec.ts --project=chromium-mobile-390 --max-failures=1 --reporter=list"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Tek worker, 45s test sınırıyla 30 test keşfedildi: 25 geçti, mobil projede yalnız 5 masaüstü split-view testi skip edildi. WebKit /belgeler + beş stüdyo akışı test içinden gerçek WebKit başlatılarak geçti. Form erişimi, browser back/forward, menü/komut paleti scroll-lock, beş route header sözleşmesi, beş SPA rotasında PDF blob URL revoke, 320px/200%/landscape, 12 hızlı düzenleme, iki sayfa PDF/canvas, viewport matrisi, düzenle/sıfırla, mock yazdırma, arama ve beş belgede tab/indirme kontrolleri doğrulandı."
  - stage: ASAMA_04
    check: "responsive-overflow.spec.ts + touch-targets.spec.ts + theme-consistency.spec.ts — chromium-mobile-390"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "26/26 geçti; Belgeler kataloğu ve Beton stüdyosu da taşma taramasına dahil edildi."
  - stage: ASAMA_04
    check: "belgeler-mobile-studio.spec.ts header sözleşmesi — chromium-desktop-1366; desktop split-view matrisi — chromium-desktop-1920"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "1366px'te beş route header/kompakt başlık kontrolü 5/5 geçti. Split-view 1920/1366/1024 viewport'larını her belge için kapsadı ve 5/5 geçti."
  - stage: ASAMA_04
    check: "Hedefli ESLint, test dosyası TypeScript kontrolü, `npx tsc --noEmit --incremental false -p tsconfig.next.json`, `git -c core.whitespace=cr-at-eol diff --check`."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Dört kontrolün exit code'u 0; lint uyarısı yok. Tam kapsam `tsconfig.json` kontrolü daha önce proje dışındaki eski script/CAD/test import ve tip sorunları nedeniyle başarısız olmuştu; bu ASAMA_04 kapısı değildir ve PASS sayılmadı."
  - stage: ASAMA_04
    check: "Playwright görsel/hata ve yerel network gözlemi."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "İlk koşudaki hata ekranları görsel incelendi: React etkileşimi hazır olmadan yapılan arama/sekme tıklaması UI regresyonu gibi görünüyordu. Hazır durumu ve network-idle beklemesi eklendikten sonra testler geçti. Hızlı düzenleme senaryosunda pageerror listesi boş kaldı; dev sunucu loglarında /belgeler, beş route ve belge-template API cevapları 200. Next dev çıktısında mevcut `scroll-behavior: smooth` ve custom Cache-Control ayarları için uyarılar vardı. Fiziksel telefon/klavye kullanılmadı; otomatik test ekran görüntüsü hata kanıtı içindi ve kalıcı artefakt bırakılmadı."
  - stage: ASAMA_04
    check: "Çalışma ağacı ve remote-write durumu."
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "ASAMA_04 yalnız mevcut Playwright spec'ini değiştirdi; ASAMA_01–03 ürün değişiklikleri ve yerel plan/state korunuyor. Build, commit, push ve deploy yapılmadı. Dev sunucusu kapatıldı, test-results/site-audit altındaki bu koşuların ürettiği son-run dosyası temizlendi."
  - stage: ASAMA_05
    check: "npx tsc --noEmit --incremental false -p tsconfig.next.json"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Internal belge stüdyosu değişikliklerini içeren çalışma ağacında Next.js tsconfig typecheck exit code 0."
  - stage: ASAMA_05
    check: "Tam repo ESLint — ilk ölçüm (önceki durum kaydı)"
    status: FAIL
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Güncel ESLint sonucu exit code 1: 73 dosyada 331 error ve 489 warning; hata bulunan dosyalar değişen dosyalar arasında değil. Değişen TS/TSX dosyalarına hedefli lint 0 error ve 20 no-explicit-any warning verdi. Kullanılmayan import ve iki kullanılmayan callback temizlendi; tam kalite kapısı yine geçmedi."
  - stage: ASAMA_05
    check: "npm run build"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Son kaynak temizliğinden sonra prebuild tamamlandı; Next.js 16.3.6 production build ve 627 statik sayfa üretimi exit code 0 ile bitti. CSS çıktısında z-index desteklenmiyor uyarıları ve build'de custom Cache-Control uyarısı görüldü."
  - stage: ASAMA_05
    check: "npm run check:navigation"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Son production build üzerinde script exit code 0 ve status=ok ile 17 kontrol döndürdü. Emekli rota 404 kontrollerinde Next loguna NoFallbackError yazıldı; script bu console/server mesajlarını assertion olarak denetlemiyor, teknik borç olarak raporlandı."
  - stage: ASAMA_05
    check: "Production Playwright smoke: chromium-desktop-1366 + chromium-mobile-390; navbar/header, /belgeler kataloğu, form/PDF/indirme"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Son production build üzerinde 22 test keşfedildi: 16 geçti, 6 masaüstünde mobil senaryoları olarak skip edildi. Beş rotanın kompakt başlık/global navbar sözleşmesi masaüstü ve mobilde; beş belgede mobil form/PDF/indirme; /belgeler arama/katalog sözleşmesi geçti."
  - stage: ASAMA_05
    check: "git -c core.whitespace=cr-at-eol diff --check; değişen dosyalarda secret-pattern ve bağımlılık farkı kontrolü"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Diff-check temiz; 21 değişen dosyada taranan secret pattern eşleşmesi yok; package.json ve lockfile farkı yok."
  - stage: ASAMA_05
    check: "vercel project inspect --non-interactive; vercel.json deploymentEnabled pattern doğrulaması"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Bağlı muhendislik-site projesi doğrulandı. vercel.json geçerli JSON; internal-* ve chatgpt-* için deploymentEnabled=false. Vercel Git belgelerindeki minimatch branch pattern davranışıyla eşleşiyor."
  - stage: ASAMA_05
    check: "Historical pre-remediation: tek atomik commit, GitHub push ve production deployment kontrolü"
    status: NOT_RUN
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "İlk lint ölçümündeki hatalar nedeniyle checkpoint ve Production release o noktada çalıştırılmadı; remote Codex main'e push yapamaz. Güncel lint/build/Playwright sonuçları aşağıdaki yeni kanıtlarda kayıtlıdır."
  - stage: ASAMA_05
    check: "Tam repo lint: npm run lint"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Dirty working tree üzerinde ESLint exit code 0: 0 hata, 442 uyarı. Önceki 331 hata giderildi; no-explicit-any, react-hooks/rules-of-hooks veya prefer-const hatası kalmadı. Hiçbir lint kuralı devre dışı bırakılmadı veya gevşetilmedi."
  - stage: ASAMA_05
    check: "Next TypeScript kontrolü ve DWG/DXF adaptör hedefli ESLint"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "`npx tsc --noEmit -p tsconfig.next.json` ve iki decode adaptörüne hedefli ESLint exit code 0."
  - stage: ASAMA_05
    check: "DWG/DXF decoder regression: compiler-decode, decoder-field-contract, dwg-ownership"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Üç `node --import tsx tests/cad-v2/...` kontrolü geçti; gerçek DWG, DXF fixture, hatch, entity alanları ve ownership partition doğrulandı."
  - stage: ASAMA_05
    check: "Geniş lint remediation sonrası üretim derlemesi: npm run build"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Son kaynak ve test düzeltmeleriyle production build exit code 0; Next.js 16.3.6, 627 statik sayfa. Mevcut z-index ve custom Cache-Control uyarıları görüldü."
  - stage: ASAMA_05
    check: "npm run check:navigation"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Production çıktısı üzerinde 17 navigation assertion'ı status=ok. Emekli rota 404'lerinde Next NoFallbackError logları ve fs.existsSync deprecation uyarısı çıktı; script bu logları assertion olarak denetlemiyor."
  - stage: ASAMA_05
    check: "Production Playwright: belgeler-mobile-studio, chromium-desktop-1366 + chromium-mobile-390, PLAYWRIGHT_PRODUCTION_SERVER=1"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "İlk production koşusu mobil komut paleti Escape kapanış yarışını gösterdi; input seviyesinde Escape kapanışını ekledikten sonra production build yenilendi. Son koşu gerçek `npm start` üzerinde 30 geçti, mobile ait olmayan 30 desktop varyantı skip; beş stüdyo başlığı/nav, katalog, komut paleti scroll lock, form/PDF/indirme, responsive ve WebKit akışı geçti."
  - stage: ASAMA_05
    check: "git -c core.whitespace=cr-at-eol diff --check; changed-file secret pattern scan; package/lock diff"
    status: PASS
    head: 6d1c6d02ec66035f782a3788fcec8b1777be562a
    result: "Whitespace/diff kontrolü temiz; secret pattern eşleşmesi yok; package.json ve lockfile değişmedi."
  - stage: ASAMA_05
    check: "main release 592a4a27156ac54e695f63e2af3152d10c7181a1; Vercel Production deployment dpl_HQaSawabZ1uTodAqKCyfSw6sQEU5; production Playwright route smoke"
    status: PASS
    head: 592a4a27156ac54e695f63e2af3152d10c7181a1
    result: "Tek atomic main commit pushlandı; Vercel Production READY oldu: https://muhendislik-site.vercel.app. Beş stüdyo rotasında header=0, studio=1, /belgeler geri bağlantısı=1, yatay taşma yok; /belgeler kataloğunda header=1. Beş şablon PDF doğrudan 200 application/pdf döndü; canlı sözleşme önizlemesi PDF önizlemesi hazır durumuna geldi. Bilinen nonblocking: /api/document-template/* Vercel fonksiyonlarında File not found on disk 404 veriyor, uygulamanın doğrudan public PDF fallback'i çalışıyor."
  - stage: ASAMA_05
    check: "Follow-up PDF output tracing fix; main commit bc5b7662450820361958acdb68fd67e85541e1b5; Vercel deployment dpl_8h67dPKRpxGfd9cSAeBfutNYRLTN"
    status: PASS
    head: bc5b7662450820361958acdb68fd67e85541e1b5
    result: "next.config.ts outputFileTracingIncludes dynamic şablon API fonksiyonuna beş PDF'yi ekledi. Build trace ve yerel production endpoint kontrolü geçti; Vercel Production READY oldu. Canlı Playwright smoke: beş API endpoint 200 application/octet-stream; sözleşme önizlemesi PDF önizlemesi hazır; stüdyo navbar=0. Console error yok."
blockers: []
pending_decisions: []
updated_at: "2026-10-16T02:33:45+03:00"

## Yerel Durum ve Kapsam Düzeltmesi

- Kaynak plan: `C:\Users\hsyn\Downloads\INSA_BLOG_BELGELER_STUDYO_TAM_EKRAN_ASAMALI_PLAN.md` (dokunulmadı).
- Yerel, doğrulamaya göre düzeltilmiş plan: [BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_PLAN.md](BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_PLAN.md), revision 3 (lint kapsam genişletmesi kullanıcı talebiyle).
- Repo: `C:\Users\hsyn\Desktop\muhendis-mimar-portali`; başlangıç branch `main`, başlangıç HEAD `6d1c6d02ec66035f782a3788fcec8b1777be562a` (`origin/main` ile aynı); ASAMA_05 çalışma branch'i `internal-belge-studyo-asama05`.
- ASAMA_01 ürün kaynak kodu değiştirmedi. Durum ve yerel plan dosyaları bu aşamanın çalışma kayıtlarıdır.
- Plan düzeltmesi: `/belgeler` hızlı önizleme modalı gerçekte mevcut değil. `docs/BELGELER_SISTEMI.md` satır 161 civarında `StudioPreview` modalını anlatıyor; mevcut `src/components/belgeler-hub.tsx` bunu içermediğinden yaşayan doküman da güncel kaynakla uyuşmuyor. Dokümantasyon ürün değişikliği olmadığı için bu aşamada düzenlenmedi; release kapsamındaki düzeltme yerel plana eklendi.

## Ölçülen Baseline

Ölçüm rotası: `/belgeler/beton-dokum-tutanagi`; tema `dark`. Navbar selector'ı `[data-site-header]`, stüdyo selector'ı `[data-studio-locked="true"]`, mobil PDF toolbar selector'ı `[data-testid="belge-studio-preview-toolbar"]`, alt aksiyon selector'ı `[data-testid="belge-studio-mobile-actions"]`.

| Viewport | Site header | Geri satırı | Stüdyo kutusu | PDF toolbar | Form ve alt aksiyon | Belge scroll |
|---|---|---|---|---|---|---|
| 390×844, Form | 76 px, görünür | y=80, h=44 | x=4, y=128, 382×712 | Form sekmesinde gizli | Form y=186, h=592, scroll 1174/591; aksiyon y=778, h=61 | 390×844 |
| 390×844, PDF | 76 px, görünür | y=80, h=44 | x=4, y=128, 382×712 | y=194, h=69, 2 satır | Aksiyon y=778, h=61 | 390×844 |
| 320×720, Form | 76 px, görünür | y=80, h=44 | x=4, y=128, 312×588 | Form sekmesinde gizli | Form y=188, h=462, scroll 1174/461; aksiyon y=650, h=65 | 320×720 |
| 320×720, PDF | 76 px, görünür | y=80, h=44 | x=4, y=128, 312×588 | y=196, h=69, 2 satır | Aksiyon y=654, h=61 | 320×720 |
| 844×390, Form | `display:none` (kısa yatay CSS kuralı) | y=8, h=44 | x=8, y=56, 828×326 | Form sekmesinde gizli | Form y=114, h=206, scroll 955/205; aksiyon y=320, h=61 | 844×390 |
| 844×390, PDF | `display:none` | y=8, h=44 | x=8, y=56, 828×326 | y=124, h=69, 2 satır | Aksiyon y=320, h=61 | 844×390 |
| 1366×768 | 84 px, görünür | y=92, h=44 | x=8, y=140, 1350×620 | x=469, y=151, h=22, tek yatay kontrol satırı | Form x=9, y=141, 450×618, scroll 810/618; PDF x=469, y=177, 878×572; mobil aksiyon yok | 1366×768 |
| 1024×768 | 84 px, görünür | y=92, h=44 | x=8, y=140, 1008×620 | x=429, y=151, h=36, tek yatay kontrol satırı | Form x=9, y=141, 410×618, scroll 810/618; PDF x=429, y=191, 576×558; mobil aksiyon yok | 1024×768 |

Diğer dört stüdyo rotasında 390×844 ve 1366×768 için header, geri satırı, stüdyo kutusu ve yatay scroll ölçüleri Beton Döküm rotasıyla aynı çıktı. Sözleşme/taahhütname form alanı sayısı içerik nedeniyle farklıdır. Bu aşamada light tema, fiziksel cihaz ve otomatik Playwright test suite'i çalıştırılmadı.

`/belgeler` katalog kontrolü: header 390 px viewport'ta 76 px, 1366 px viewport'ta 80 px görünür; mobil bottom-nav görünür, desktop bottom-nav gizli. İki viewport'ta da modal/dialog veya preview action yok; katalog 10 standalone link render ediyor.

## Kaynak ve Test Etki Notları

- `src/components/navbar.tsx` yalnız `/dokumantasyon/dosya/` prefix'inde DOM navbar'ını kaldırıyor; `NavbarRouteTracker` aynı render içinde navbar görünürlüğüne bağlı. `[data-site-header]` bu durumda DOM'da bulunuyor.
- `src/app/globals.css`: `html/body:has([data-studio-locked="true"])` viewport kilidini yönetiyor. Header gizleme kuralı yalnız `max-width:1023px`, `landscape`, `max-height:430px` içinde `body:has([data-testid="belge-studio-mobile-actions"]) [data-site-header]` seçicisiyle çalışıyor. Bu yüzden telefon portrait ve masaüstünde navbar 76/84 px alan tüketiyor.
- `tests/site-audit/belgeler-mobile-studio.spec.ts`: route/menü/komut paleti testi mobil stüdyo üzerinde `Menüyü aç` butonunun görünmesini bekliyor. Yeni route davranışı gelince beklenti `/belgeler` için menü görünür, standalone stüdyo için header yok şeklinde uyarlanmalı. Desktop split-view testi üç boyutta panel/scroll/zoom kontrol ediyor; header ve kompakt başlık assertion'ı eklenmeli.
- `npm run dev` sırasında `predev` DWG/CAD worker ve upstream asset sync scriptleri çalıştı. Çıktılar `.gitignore` kapsamındaydı; kaynak çalışma ağacında değişiklik yok. Yerel dev server kapatıldı; Vercel/GitHub işlemi yapılmadı.

## ASAMA_02 Uygulama ve Doğrulama

- `src/lib/belge-studio-routes.ts` beş route ve başlıklarını tek yerde tanımlar; navbar yalnız bu tam rotalarda gizlenir.
- `src/components/navbar.tsx` tracker'ı navbar görünürlüğünden bağımsız render eder. Genel navbar `/belgeler` dahil diğer rotalarda kalır. `src/app/globals.css` içindeki artık gereksiz kısa-yatay header kuralı kaldırıldı.
- Yeni `src/components/belge-studio-page-shell.tsx` 44 px başlık satırı, `/belgeler` geri linki, erişilebilir etiket, odak görünümü ve tek satır kırpılan başlık sağlar. Beş `page.tsx` bunu kullanıyor; eski geri satırları kaldırıldı.
- Beton stüdyosundaki dahili başlık h2 oldu; sayfa kabuğundaki belge adı tek h1 olarak kalır. PDF işleme ve `isModal={false}` davranışları değişmedi.
- Mobil ve desktop tarayıcı doğrulaması emülasyondur; fiziksel cihaz kullanılmadı. Otomatik Playwright test paketi ve production build bu aşamada çalıştırılmadı.
- Aşama sonunda yerel değişiklikler korunuyor; remote write/commit/push yapılmadı. Sıradaki aşama `ASAMA_03`.

## ASAMA_03 Uygulama ve Doğrulama

- Beş stüdyo ortak tab, preview panel/canvas ve stateless PDF toolbar sınıflarını kullanıyor. Mobil sekmeler sayaç ve PDF hazır durumunu koruyor; PDF toolbar 320 px'te iki 44 px satır, 400 px ve üstünde tek satır. Toolbar başlığı masaüstünde görünür, erişilebilir `aria-label` ile mobilde de adlandırılmış.
- Canvas ölçüsü mevcut ResizeObserver/fit/zoom akışıyla kullanılır alanı baz alıyor. 100% fit tüm sayfayı oranı koruyarak gösteriyor; 125% ve üstü yakınlaştırmada panel içi scroll devam ediyor. PDF üretim motoru ve indirme/form eylemleri değiştirilmedi.
- 390×844 Sözleşme canvas alanı 177,056 px²'den 188,705 px²'ye yükseldi (+%6.6); toolbar yüksekliği 120.5 px'den 92 px'ye indi. Dokuz viewport ölçümü ve beş route sekme/PDF smoke sonucu üstte kaydedildi.
- `200%` testi root font-size simülasyonudur; browser zoom veya fiziksel erişilebilirlik ayarı değildir. Klavye görünürlüğü viewport daraltma ile emüle edildi; fiziksel cihaz/klavye denenmedi.
- Hedefli TypeScript kontrolü ve diff-check PASS; ESLint exit code 0, 52 mevcut warning. Temiz son browser navigation: console error/warning 0. Tam Playwright suite/build bu aşamanın dışında bırakıldı. Screenshot artefaktı incelemeden sonra silindi.
- Uzak write/commit/push/deploy yapılmadı. Sıradaki aşama `ASAMA_04`.
