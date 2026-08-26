# AGENTS.md — GitHub / AI Çalışma Standardı

> **ZORUNLU OKUMA:** Bu repo üzerinde ChatGPT sohbeti, Codex, Claude, Gemini, IDE ajanı, GitHub connector/API veya benzeri bir AI aracıyla **herhangi bir GitHub yazma işlemi yapılmadan önce bu dosya okunmalıdır**.
>
> Bu dosya özellikle uzaktan GitHub düzenlemesi sırasında gereksiz commit/push, Vercel Preview yığılması, gereksiz build süresi ve deployment kotası tüketimini önlemek için vardır.

## 1. Başlangıç sırası

Her AI oturumu, ilk remote write işleminden önce şu sırayı uygular:

1. `PROJECT.md` dosyasını oku; proje gerçekliğinin ana bağlamıdır.
2. Bu `AGENTS.md` dosyasını oku ve çalışma biçimini buna göre belirle.
3. Görevle ilgili `.agents/rules/*.md` dosyalarını oku.
4. Güncel branch, `main`, ilgili kaynak kod, testler ve `vercel.json` durumunu doğrula.
5. Ancak bundan sonra GitHub'a yazma işlemi yap.

Markdown ile güncel kaynak kod/testler çelişirse çalışan repo gerçekliği doğrulanır; eski doküman körü körüne uygulanmaz. Gerekirse yaşayan doküman aynı çalışma kapsamında güncellenir.

## 2. Ana ilke: çok çalışma, az remote write

GitHub uzak deposu bir scratchpad değildir.

**Varsayılan çalışma modeli:**

`incele → planla → değişiklikleri toplu hazırla → test et → tek anlamlı checkpoint commit/push → doğrula`

Aşağıdaki model **yasaktır**:

`küçük değişiklik → push → bekle → küçük düzeltme → push → bekle → test commit'i → push → noop commit → push`

Bir görev 5 dosya değiştiriyorsa mümkün olduğunda bu 5 dosya **tek tree/tek atomic commit** içinde yazılır. Dosya başına commit yapılmaz.

## 3. Vercel deployment politikası

### 3.1 Varsayılan: geliştirme sırasında deployment YOK

Vercel normal geliştirme/test runner'ı olarak kullanılmaz.

Aşağıdaki kontroller önce local veya GitHub Actions/CI ortamında yapılır:

- TypeScript: `npx tsc --noEmit`
- ilgili kalite scriptleri
- unit/integration testleri
- `npm run build`
- Playwright/Puppeteer/browser smoke testleri
- statik route/link/content denetimleri

Vercel Preview yalnız şu durumlardan en az biri varsa oluşturulur:

1. Kullanıcı açıkça Preview/deploy ister.
2. Çalışma release-candidate seviyesine gelmiştir ve gerçek Vercel ortamında doğrulama teknik olarak gereklidir.
3. Sorun yalnız Vercel runtime/environment/edge/deployment davranışında yeniden üretilebiliyordur.

Sadece "bir bakalım çalışıyor mu" amacıyla Vercel deployment oluşturulmaz.

### 3.2 Production daha katıdır

`main` branch production'a bağlıdır. Bu nedenle:

- `main` scratch/test branch olarak kullanılmaz.
- `noop`, `probe`, `retry`, geçici debug veya yalnız deployment tetiklemek için commit atılmaz.
- Production deploy, kullanıcı açıkça isterse veya önceden tanımlanmış release adımının doğal sonucuysa yapılır.
- Uzun bir geliştirme sırasında her ara düzeltme `main`e gönderilmez.

### 3.3 Deployment kapalı çalışma branch'leri

Uzun süreli AI/GitHub işleri için tercihen `internal-*` branch adı kullanılır.

`vercel.json` içindeki `git.deploymentEnabled` koruması ile `internal-*` branch'leri deployment üretmemelidir. Mevcut özel audit/work branch'i için de deployment kapatma kuralı varsa korunur.

Bu koruma kullanıcı açıkça istemeden kaldırılmaz veya gevşetilmez.

Yeni bir uzun çalışma branch'i açılacaksa, ilk sorulardan biri şudur:

> "Bu branch'e yapılan push Vercel deployment tetikler mi?"

Cevap belirsizse art arda push yapılmaz.

## 4. GitHub yazma standardı

### 4.1 Atomic commit

Bir commit tek anlamlı amacı temsil etmelidir. Ancak bu, her küçük dosya için ayrı commit demek değildir.

Tercih sırası:

1. Aynı amaca hizmet eden değişiklikleri topla.
2. Testleri çalıştır.
3. Gerekli dosyaları tek tree/commit ile yaz.
4. Branch ref'ini bir kez ilerlet.

GitHub Contents API ile dosya dosya commit üretmek yerine mümkün olduğunda tree/commit yaklaşımı tercih edilir.

### 4.2 Remote write sayısını azalt

Aşağıdakiler için ayrı push yapılmaz:

- ara notlar
- geçici loglar
- küçük syntax düzeltmeleri
- yalnız test amacıyla eklenip hemen silinecek dosyalar
- "CI çalışsın" diye noop değişiklikler
- "Vercel yeniden denesin" diye anlamsız commitler
- aynı fazın doğal parçası olan küçük takip düzeltmeleri

Bunlar mümkün olduğunca aynı checkpoint'e kadar biriktirilir.

### 4.3 Self-commit workflow yasağı

GitHub Actions'ın yalnız geçici audit/snapshot sonucu üretmek için sürekli kendi branch'ine commit/push yapması varsayılan olarak kullanılmaz.

Makine tarafından üretilen çıktı gerekiyorsa tercih sırası:

1. CI artifact
2. log/rapor
3. gerçekten sürdürülebilir ve repo sözleşmesinin parçasıysa tek kontrollü snapshot commit

Self-committing workflow ancak açık ve kalıcı bir ürün gereksinimi varsa kullanılabilir.

## 5. Test ve doğrulama standardı

Her değişiklik için bütün test paketini körü körüne çalıştırmak zorunlu değildir; ilgili kontroller seçilir. Ancak "tamamlandı" demeden önce görev kapsamına uygun doğrulama yapılmalıdır.

Uzun işler için önerilen sıra:

1. Hızlı statik kontroller
2. İlgili domain/script testleri
3. Typecheck
4. Gerekliyse build
5. Gerekliyse local/CI browser testi
6. Yalnız gerekiyorsa tek Vercel Preview

Bir kalite scripti hata verdiği halde exit code `0` döndürüyorsa veya false-positive/false-negative davranıyorsa bu ayrıca teknik borç olarak raporlanır; yalnız process code'a bakılarak PASS denmez.

## 6. Push öncesi zorunlu kontrol listesi

Her remote write öncesi şu sorular cevaplanmalıdır:

- [ ] `PROJECT.md` ve `AGENTS.md` okundu mu?
- [ ] Görevle ilgili `.agents/rules` okundu mu?
- [ ] Güncel branch/head doğrulandı mı?
- [ ] Bu push Vercel Preview veya Production deployment tetikleyecek mi?
- [ ] Tetikleyecekse gerçekten gerekli mi?
- [ ] Aynı değişiklik başka bekleyen değişikliklerle tek committe birleştirilebilir mi?
- [ ] Bu commit yalnız anlamlı bir checkpoint mi, yoksa geçici deneme mi?
- [ ] İlgili testler push öncesinde mümkün olduğunca çalıştırıldı mı?
- [ ] Geçici workflow/script/debug dosyaları final checkpoint'e sızıyor mu?

Bu sorulardan biri olumsuzsa remote write ertelenir ve çalışma önce toparlanır.

## 7. Push sonrası kontrol

Deployment beklenmiyorsa ilk korumalı push sonrasında Vercel'de yeni deployment oluşmadığı doğrulanır. Bundan sonra her committe Vercel beklemek gerekmez; branch koruması değişmedikçe aynı sonucu varsaymak yeterlidir.

Deployment bilerek oluşturulduysa:

- build sonucu kontrol edilir,
- gerekli smoke testler tek deployment üzerinde yapılır,
- aynı doğrulama için peş peşe yeni deployment üretilmez.

## 8. İstisnalar

Aşağıdaki durumlarda daha sık remote write gerekebilir:

- kritik production hotfix
- güvenlik düzeltmesi
- branch protection/CI davranışının kendisini test etme
- kullanıcının açıkça adım adım deploy istemesi

İstisna kullanıldığında neden standart akıştan sapıldığı açıkça belirtilir.

## 9. Talimat önceliği

Repo içindeki çalışma kuralları açısından:

1. Kullanıcının o anki açık talebi
2. `AGENTS.md` genel GitHub/AI çalışma standardı
3. Göreve özel `.agents/rules/*.md`
4. `PROJECT.md` ve diğer yaşayan bağlam belgeleri
5. Tarihsel plan/stage/release belgeleri

Göreve özel eski bir kural "her seferinde Preview oluştur" gibi bu dosyayla çelişiyorsa, kullanıcı açıkça aksini istemedikçe **bu dosyadaki deployment-minimizasyon kuralı geçerlidir**.

## 10. 25 Ağustos 2026 olay kaydı

`audit/faz0-deprem-inventory-20260825` branch'inde FAZ 0 denetimi yapılırken çok sayıda küçük GitHub commit'i ayrı ayrı push edildi. GitHub-Vercel entegrasyonu her push için Preview deployment başlattı. Sonuç:

- kısa sürede çok sayıda gereksiz Preview deployment oluştu,
- Vercel build/deployment kotası ve rate-limit riski arttı,
- aynı testler için tekrar tekrar bekleme süresi oluştu,
- çalışma süresi gereksiz uzadı.

Uygulanan çözüm:

- audit branch için Vercel deployment kapatıldı,
- `internal-*` çalışma branch'leri için Vercel deployment koruması eklendi,
- geçici self-committing audit workflow kaldırıldı,
- dosya başına commit yerine toplu tree/atomic commit yaklaşımı benimsendi,
- local/CI testleri Vercel Preview'dan önce konumlandırıldı.

Bu olay bu dosyanın oluşturulma nedenidir. Aynı çalışma paterni tekrar edilmemelidir.

---

## Kısa kural

**AI ile GitHub'da çalışırken: önce oku, sonra toplu çalış, local/CI'da test et, az commit/push yap, Vercel'i yalnız gerçekten gerektiğinde kullan.**
