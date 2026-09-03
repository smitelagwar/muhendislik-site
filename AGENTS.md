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

### 3.1 İki Farklı Çalışma Modeli ve Deployment Kuralları

Bu projede iki ayrı çalışma modu bulunur ve kuralları kesin olarak ayrılmıştır:

#### A) Antigravity / Yerel IDE Çalışma Modu (Kullanıcı Tarafı)
- IDE ortamında geliştirme yapılırken tüm TypeScript kontrolleri (`npx tsc --noEmit`), kalite kapıları (`npm run check:tools`), tarayıcı duman testleri ve production derlemesi (`npm run build`) **yerel bilgisayarda** çalıştırılır.
- Geliştirme tamamen bittiğinde ve testler geçtiğinde, **tek bir anlamlı atomik checkpoint commit ile `main` branch'ine push yapılır**.
- Bu durumda **Vercel'in otomatik olarak Production Deploy alması tamamen normaldir, hedeflenendir ve engellenmez**.

#### B) ChatGPT / Uzaktan Sohbet & API Modu (Uzak AI Tarafı)
- ChatGPT veya uzaktan AI ajanları GitHub üzerinden dosya dosya ara düzeltme yaparken her commit için Vercel'in derleme başlatması ve kotayı tüketmesi **KESİNLİKLE YASAKTIR**.
- ChatGPT veya uzaktan AI oturumları:
  1. **Doğrudan `main` branch'ine parça parça commit yazamaz.**
  2. Mutlaka `internal-*` veya `chatgpt-*` çalışma branch'i açmalıdır.
  3. Ara commit atılacaksa commit mesajlarının sonuna mutlaka **`[skip ci]`** veya **`[skip vercel]`** eklenmelidir.
- ChatGPT ile hazırlanan işler kullanıcı tarafından IDE'ye çekilip yerel testleri doğrulandıktan sonra tek seferde `main`'e taşınır.

### 3.2 Production ve Branch Ayrımı

`main` branch doğrudan canlı üretime (Production) bağlıdır. Bu nedenle:
- `main` branch asla AI deneme tahtası veya ara dosya kayıt alanı olarak kullanılamaz.
- `noop`, `probe`, `retry`, geçici log veya tek dosyalık ara düzeltmeler `main` branch'ine doğrudan pushlanamaz.
- `main` branch'ine yapılan her push, yerel testleri bitmiş doğrulanmış bir release'i temsil eder ve otomatik Production deployment üretir.

### 3.3 Uzaktan Çalışma İçin Koruma Kuralları

ChatGPT veya uzak AI ajanları ile çalışırken:
1. `internal-*` branch adı tercih edilir.
2. Commit mesajı formatı: `feat(scope): aciklama [skip ci]` veya `fix(scope): aciklama [skip vercel]` şeklinde olmalıdır.
3. Böylece uzaktan 20 dosya değiştirilse bile Vercel 0 adet gereksiz build kuyruğu oluşturur.

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

Test ve doğrulama scriptlerinin terminalde asılı (hanging) kalmaması için `.agents/rules/test-ve-otomasyon-standardi.md` kuralı zorunludur.

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
- [ ] Production build/typecheck bağımlılıkları `.vercelignore` ile dışlanan bir dosyayı import ediyor mu?
- [ ] Build sistemi değiştiyse Vercel Linux Preview aynı commit için `READY` oldu mu ve Production aynı doğrulanmış artifact promote edilerek mi yapılacak?
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

---

## Kısa kural

**IDE'de çalışırken: yerelde test et, az commit at, son aşamada main'e pushla (Production deploy normaldir).**  
**ChatGPT / Uzaktan çalışırken: main'e yazma, internal-* branch aç veya [skip ci] kullan, Vercel build kotasını koru.**
