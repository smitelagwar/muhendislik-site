# Vercel CLI & Canlı / Preview Test Kuralları

> **Ön koşul:** GitHub'a yazma veya deployment işlemi öncesinde repo kökündeki `AGENTS.md` zorunlu olarak okunur. Bu dosya `AGENTS.md` ile birlikte uygulanır. Kullanıcının o anki açık talebi her zaman en yüksek önceliktedir.

Bu çalışma alanı Vercel projesi `muhendislik-site` ile GitHub üzerinden bağlıdır. Git entegrasyonunun branch push / PR / merge nedeniyle Preview veya Production deployment üretmesi **yasaktır**. Repo seviyesindeki kalıcı güvenlik anahtarı `vercel.json` içindeki `git.deploymentEnabled: false` değeridir ve kullanıcı açıkça değiştirmedikçe korunur.

## 1. Otomatik Git deployment kesinlikle kapalıdır

- GitHub push, pull request, merge veya branch oluşturma işlemi Vercel Preview/Production deployment tetiklememelidir.
- `git.deploymentEnabled` geliştirme sırasında `false` kalır.
- Deployment açmak için bu ayar geçici olarak `true` yapılmaz.
- GitHub Actions yalnız local/CI eşdeğeri build, typecheck, test ve browser gate çalıştırabilir; Vercel deployment başlatamaz.
- Noop/probe/retry commit ile deployment tetiklemek yasaktır.

## 2. Plan başına deployment bütçesi

Bu kural yalnız bu repo için değil, kullanıcıyla yürütülen bütün çok-aşamalı proje planlarında varsayılan çalışma standardıdır.

Bir planın tamamı için toplam bütçe:

- **Preview: en fazla 4 kez**
- **Production: en fazla 1 kez ve yalnız plan tamamen bittikten sonra**

Bütçe stage, branch, PR veya oturum başına yenilenmez. Bir planın tamamı tek sayaçtır. Kullanılmayan Preview hakkını kullanmak zorunlu değildir; varsayılan hedef mümkünse **0 Preview** ile ilerlemektir.

Başlatılan her Preview deployment, sonucu READY / ERROR / CANCELED olsa da bütçeden 1 hak tüketmiş sayılır. Bu nedenle Preview öncesinde local/CI doğrulamalarının tamamı yapılır. Production deployment başlatma hakkı da tek seferliktir; final release gate geçmeden kullanılmaz.

Kullanıcı yeni ve açık bir talimatla bu bütçeyi değiştirmedikçe hiçbir ajan bu sınırları aşamaz.

## 3. Preview ne zaman kullanılabilir?

Preview varsayılan geliştirme/test döngüsünün parçası değildir. Önce:

- ilgili kalite scriptleri
- `npx tsc --noEmit`
- `npm run build`
- unit/integration testleri
- Playwright/Puppeteer veya eşdeğer CI browser testleri
- statik route/link/content denetimleri

çalıştırılır.

Preview yalnız gerçek Vercel runtime/environment/edge davranışını doğrulamak teknik olarak gerekiyorsa ve plan bütçesinde hak kaldıysa **manuel** olarak oluşturulur. Aynı Preview deployment üzerinde mümkün olan tüm smoke testleri tamamlanır; küçük düzeltmeler için yeni Preview oluşturulmaz.

## 4. Production kuralı

Production deploy planın ara aşamalarında yapılmaz.

Production için zorunlu sıra:

1. bütün plan aşamaları tamamlanmış olmalı,
2. ilgili CI/typecheck/build/test kapıları yeşil olmalı,
3. gerekiyorsa son mevcut Preview doğrulanmış olmalı,
4. ancak bundan sonra **tek bir manuel Production deployment** yapılmalı,
5. deployment sonrası production smoke testi yeni deployment oluşturmadan aynı deployment üzerinde tamamlanmalıdır.

`main` merge/push işlemi bile otomatik Production deploy üretmemelidir; final deploy manuel ve kontrollü yapılır.

### 4.1 Vercel Linux ve deployment-payload parite kapısı

Yerel Windows build'i zorunludur ama Vercel Production için tek başına yeterli kanıt değildir. Aşağıdaki dosya veya alanlardan biri değiştiyse Vercel'in Linux build ortamı ve gerçek deployment payload'ı ayrıca doğrulanmalıdır:

- `package.json`, lockfile veya build/prebuild scriptleri
- `vercel.json`, `.vercelignore`, `next.config.*`, `postcss.config.*`
- `tsconfig.json`, `tsconfig.next.json` veya Next production typecheck kapsamı
- `src/app/globals.css` içindeki Tailwind `source(...)` / `@source` tanımları
- build sırasında üretilen worker, WASM, font veya başka statik asset zinciri
- platforma özgü native/minifier/parser paketi veya sürümü

Bu risklerden biri varsa zorunlu sıra şöyledir:

1. temiz bağımlılık kurulumu semantiğiyle `npm ci` sonucu doğrulanır,
2. `npm run prebuild` çalıştırılır,
3. genel kalite kapsamı için `npx tsc --noEmit --incremental false` çalıştırılır,
4. runtime build kapsamı için `npx tsc -p tsconfig.next.json --noEmit --incremental false` çalıştırılır,
5. `npm run build` ve ilgili release kapıları geçer,
6. aynı commit için **tek manuel Preview** oluşturulur,
7. Preview loglarında CSS compile, TypeScript, route generation ve output packaging adımlarının tamamı doğrulanır,
8. Preview üzerinde ana rota ve değişiklikle ilgili worker/WASM/API/static asset smoke testleri yapılır,
9. yalnız bu doğrulanmış artifact `vercel promote <preview-url>` ile Production'a alınır; yeniden build eden doğrudan `vercel deploy --prod` kullanılmaz.

Bu durumda Preview teknik olarak zorunludur ve plan bütçesinden sayılır. Amaç Production hakkını ilk kez gerçek Linux build'i denemek için tüketmemektir. Aynı artifact'i promote etmek, Preview'da doğrulanan çıktıyla Production'a geçen çıktının aynı kalmasını sağlar.

### 4.2 Bu projenin korunacak production build sözleşmesi

- `package.json` içindeki build komutu `next build --webpack` olarak kalır. Next CLI bayrağı ezbere eklenmez; değişiklik gerekiyorsa önce kurulu sürümde `npx next build --help` ile doğrulanır.
- `vercel.json` build komutu `npm run build` olarak kalır; böylece `prebuild` içindeki CAD worker/WASM/font senkronu atlanmaz.
- Tailwind otomatik olarak bütün repoyu taramaz. `src/app/globals.css` içinde `@import "tailwindcss" source(none);` ve `@source "../";` korunur. Kapsam genişletilecekse üretilmiş `public/`, test, plan, script ve doküman dosyalarının utility adayı üretmediği kanıtlanır ve Linux Preview zorunludur.
- Next production typecheck'i `next.config.ts -> typescript.tsconfigPath: "tsconfig.next.json"` üzerinden yalnız deploy edilen runtime kaynaklarını kapsar.
- Genel `tsconfig.json` script ve test kalite kapılarını kapsamaya devam eder; production typecheck'i daraltıldı diye genel typecheck kaldırılmaz.
- `.vercelignore` içindeki `tests` dışlaması korunur. Production build, prebuild, Next config veya `tsconfig.next.json` tarafından erişilen hiçbir dosya `tests/` ya da başka bir ignore alanından import edilemez.
- Release-only scriptler test fixture'larını kullanabilir; ancak bunlar `build`/`prebuild` dependency graph'ine sokulmaz ve Vercel build sırasında typecheck edilmez.
- Vercel token'ı Markdown'a, kaynak koda, komut geçmişine veya sohbete düz metin olarak yazılmaz. Paylaşıldıysa token derhal revoke edilip yenilenir.

### 4.3 Başarısız build tekrar protokolü

- Aynı commit/config ile kör retry veya `--force` yapılmaz.
- Her yeni deployment öncesinde önceki logdaki ilk gerçek hata çıkarılır, kök neden düzeltilir ve onu kapsayan yeni bir yerel kontrol çalıştırılır.
- Preview başarısızsa Production denenmez. Preview bütçesi dolduysa kullanıcı yeni hak vermeden deployment başlatılmaz.
- Production başarısız olursa çalışan önceki Production alias'ı korunur; yeni deneme ancak kullanıcı bütçeyi açıkça artırır ve yeni kök neden doğrulaması tamamlanırsa yapılır.

### 4.4 30 Ağustos 2026 olayından kalıcı dersler

CAD gerçek kullanıcı planı sonrasında üç ayrı build engeli ardışık olarak ortaya çıktı:

1. kurulu Next.js sürümünde bulunmayan `--no-turbopack` bayrağı,
2. Tailwind'in `public`, `tests`, `scripts`, `PLAN` ve dokümanları taraması sonucu Linux'ta geçersiz generated CSS,
3. `.vercelignore` ile dışlanan test fixture'ını import eden release scriptinin Next production typecheck kapsamına girmesi.

Kalıcı çözüm; doğrulanmış `--webpack` komutu, Tailwind taramasının `src/` ile sınırlandırılması ve runtime typecheck için ayrı `tsconfig.next.json` kullanılmasıdır. Bu üç koruma kullanıcı açıkça yeni bir mimari istemeden kaldırılmaz veya gevşetilmez.

## 5. Deployment sayacı

Her plan boyunca ajan deployment bütçesini açıkça takip eder. Preview başlatılmadan önce "kaç Preview kullanıldı / kaç hak kaldı" kontrol edilir. Sayaç belirsizse Vercel deployment geçmişi okunur; tahminle yeni deployment başlatılmaz.

Bütçe dolduysa hata Vercel ortamına özgü olsa dahi yeni Preview oluşturulmaz; kullanıcı açıkça yeni hak vermedikçe local/CI teşhisiyle devam edilir.

## 6. Ortam değişkenleri ve servisler

Neon PostgreSQL, Vercel Blob ve Admin/Auth environment variable'ları proje ihtiyacına göre Production/Preview ortamlarında bulunabilir. Environment variable veya proje ayarı kontrolü deployment gerektirmiyorsa yalnız kontrol amacıyla deploy yapılmaz.

## 7. Temel amaç

Vercel sürekli deneme ortamı değildir; kontrollü release doğrulama katmanıdır.

**Git auto-deploy kapalı → local/CI ile geliştir → plan genelinde en fazla 4 manuel Preview → plan tamamen bitince en fazla 1 manuel Production.**
