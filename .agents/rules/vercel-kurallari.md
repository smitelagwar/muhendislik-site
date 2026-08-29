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

## 5. Deployment sayacı

Her plan boyunca ajan deployment bütçesini açıkça takip eder. Preview başlatılmadan önce "kaç Preview kullanıldı / kaç hak kaldı" kontrol edilir. Sayaç belirsizse Vercel deployment geçmişi okunur; tahminle yeni deployment başlatılmaz.

Bütçe dolduysa hata Vercel ortamına özgü olsa dahi yeni Preview oluşturulmaz; kullanıcı açıkça yeni hak vermedikçe local/CI teşhisiyle devam edilir.

## 6. Ortam değişkenleri ve servisler

Neon PostgreSQL, Vercel Blob ve Admin/Auth environment variable'ları proje ihtiyacına göre Production/Preview ortamlarında bulunabilir. Environment variable veya proje ayarı kontrolü deployment gerektirmiyorsa yalnız kontrol amacıyla deploy yapılmaz.

## 7. Temel amaç

Vercel sürekli deneme ortamı değildir; kontrollü release doğrulama katmanıdır.

**Git auto-deploy kapalı → local/CI ile geliştir → plan genelinde en fazla 4 manuel Preview → plan tamamen bitince en fazla 1 manuel Production.**
