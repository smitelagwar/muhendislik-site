# CAD V1 R2 — Bağımsız Adli Denetim, Düzeltme ve Nihai Kabul Planı

**Plan kimliği:** `CADV1-R2-FORENSIC-RECOVERY-20261102`  
**Sürüm:** 1.0 — 2 Kasım 2026  
**Hedef:** GPT-6 High tarafından planlanmış; Windows'ta tam yetkili masaüstü Codex tarafından **aşama aşama uygulanacak** güvenli inceleme ve onarım  
**Repo:** <https://github.com/smitelagwar/muhendislik-site>  
**Plan durumu:** HAZIR — **henüz uygulanmadı; kod, veri, branch ve deployment bu planın hazırlanması sırasında değiştirilmedi.**  
**Karar:** `RELEASE_READY=NO` — aksi yalnızca aşağıdaki bağımsız kabul kapılarından sonra yazılabilir.

> **Önemli:** Bu belge yeni özellik planı değil; R2'de tamamlandığı bildirilen işlerin güvenilirliğini sınayan, eksikleri sınıflandıran ve kanıtlı kusurları dar kapsamlı düzelten bir **kurtarma/kalite planıdır**. Sıfır hata garanti edildiği iddia edilmeyecek. Gerçek testin geçmediği noktada başarı etiketi kullanılmayacak.

---

## 0. Kaynakların ve mevcut durumun dürüst fotoğrafı

### 0.1 Dayanılan iki dosya

1. `CAD_V1_NIHAI_UYGULAMA_PLANI_REV2(3).md`: 11 aşamalı **amaçlanan** gereksinimler, kapsam ve koruma kuralları.
2. `CAD_V1_R2_11_ASAMA_ELESTIREL_DEVIR_RAPORU(1).md`: 11 aşamanın **bildirilmiş uygulama/test durumu**, eksikler ve çelişkiler. Bu rapor da nihai hakikat değil; denetlenecek iddiaların envanteridir.

**Bağımsız çevrimiçi kontroller (2 Kasım 2026):** GitHub karşılaştırması ve Vercel proje/deployment kayıtları doğrudan okundu; bunlar sadece repo/deploy metaverisinin doğrulamasıdır, uygulamanın canlı CAD işlev testinin yerine geçmez.

| Konu | Doğrudan kontrol edilmiş durum / sınırı |
|---|---|
| Ana dal | `main`, karşılaştırma anında `3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4` |
| R2 dalı | `internal-cad-v1-pro-review-r2-20261102`, son kayıt `555b89ae6b5d14659905af49dcd88c303da881c0` |
| Gerçek Git farkı | `main` üzerinde **20 commit ileri, 0 geri ve 70 değişmiş dosya** |
| Vercel R2 | `dpl_3GFWfwdsvuXn6478pVg4HgpmtfzC`, `READY`, R2 commit `555b89a…`, **`target=null`** (non-production deployment) |
| Vercel son görülen Production | `dpl_H1nMyKpGxNnNJ1kbkagomR6x2CXH`, `target=production`, `main` commit `3df5e…` |
| Vercel GitHub commit status | R2'nin `555b89a…` commit'i için `Vercel=success`; **bu sadece ilgili deployment/bildirim sonucudur** |
| GitHub gerçek diff kapsamı | Host `cad-upstream-viewer.tsx`, adapter, snap, measurement, store, schema ve export kodları değişmiş; bu yüzden “CAD motoruna hiç dokunulmadı” **aşırı geniş** bir iddia |
| Önceki final kabul | GitHub'daki `docs/cad-v1-review/FINAL_ACCEPTANCE.md`: `RELEASE_READY=NO` |
| Şu an yapılmamış işler | Bu plan hazırlanırken yerel Windows testleri, gerçek CAD fixture açma, Playwright cihaz testi, üretim DB inceleme ve fiziksel mobil test **çalıştırılmadı** |

**Yayın sonucu:** Kullanıcının yaptığı Vercel deploy gerçektir; ancak son R2 deployment'ı **Production değil**. `READY` ile işlevsel `PASS` ve Production'da R2'nin aktif olması birbirine karıştırılmayacak. R2 URL'si SSO koruması altında olabilir. Yeni ajan, erişim yoksa “tarayıcı testi yapıldı” demeyecek. Bu tablo **zamana bağlıdır**; ilk aşamada yeniden sorgulanacak.

Asıl repo içi kanıtlar:

- [`PLAN.md`](https://github.com/smitelagwar/muhendislik-site/blob/555b89ae6b5d14659905af49dcd88c303da881c0/docs/cad-v1-review/PLAN.md)
- [`IMPLEMENTATION_STATE.md`](https://github.com/smitelagwar/muhendislik-site/blob/555b89ae6b5d14659905af49dcd88c303da881c0/docs/cad-v1-review/IMPLEMENTATION_STATE.md)
- [`FINAL_ACCEPTANCE.md`](https://github.com/smitelagwar/muhendislik-site/blob/555b89ae6b5d14659905af49dcd88c303da881c0/docs/cad-v1-review/FINAL_ACCEPTANCE.md)
- [`ROLLBACK.md`](https://github.com/smitelagwar/muhendislik-site/blob/555b89ae6b5d14659905af49dcd88c303da881c0/docs/cad-v1-review/ROLLBACK.md)
- [`CAD V1 kuralları`](https://github.com/smitelagwar/muhendislik-site/blob/555b89ae6b5d14659905af49dcd88c303da881c0/.agents/rules/cad-v1-review-kurallari.md)
- [Vercel R2 deploy kaydı](https://vercel.com/huseying5713-2819s-projects/muhendislik-site/3GFWfwdsvuXn6478pVg4HgpmtfzC)

### 0.2 Eski 11 aşamanın eleştirisi — doğrulanmış rapor içeriği / henüz sınanmamış çıkarım

**Raporda somut kanıt bulunan önemli çalışmalar:** Şema/birim/oracle temeli, zincir mesafe ve OSNAP, düz mesafe, alan/çevre, markup, pin/metin/çizim, export, katman/arama/mobil toolbar, performans ve sonuç dosyaları için gerçek kod değişikliği var. Eski final checkout'ta **65/65 saf Node/TSX testi, TypeScript, ESLint ve build PASS** bildiriliyor. Bunlar kayda değer ama sadece ilgili kapsamın kanıtı.

**Plan ve uygulamadaki temel kalite açıkları:**

1. ASAMA_02–05'te kod yazılmışken ilgili aşamanın tam browser/regresyon sınaması yapılmamış; geç testler başlangıçta aşamalı hataları biriktirmiş.
2. ASAMA_06'da **birden fazla Preview** ve hem provisioning hem gerçek `TS2393` derleme hatası var. “Tek deploy” veya “READY = araçlar çalışıyor” çıkarımı yanlış.
3. ASAMA_07'nin önceki `2/2 E2E PASS` sonucu, ASAMA_11'deki sürüm anahtarı uyuşmazlığı ve **Pin/Text/F5 100 s timeout** karşısında güncel kabul sayılamıyor.
4. ASAMA_08'in ilk aktarımı `f3e81a5…` bazı dosyaları **kısaltmış/truncated**; `f3bc898…` ile restore edilmiş. Son blob bütünlüğü *ve* davranışsal etki yeniden kanıtlanmalı.
5. ASAMA_09/10'da **mobil pinch zoom FAIL**: iki parmak aralığı büyürken kamera zoom'u sabit, dünya koordinatında yatay pan oluşmuş. Kök neden henüz kanıtlanmadı.
6. `check:cad-preview-v2` içinde DWG cache/fallback beklentileri ve eskimiş toolbar selector hataları var. **Ürün hatası mı, test/fixture hatası mı?** Açık.
7. Dört büyük gerçek DWG/DXF için SHA kaydedilmiş ama browser `ERR_ABORTED / Channel closed`; **render kabulü yok**.
8. Sunucu GET/PUT/409 sözleşme testleri gerçek cihazlar arası sync'i kanıtlamıyor; bazı legacy kaynaklarda `sha256_hash=null`.
9. `check:cad-review:release` eski `.data/dok_db.json` ve minimum 50 dosya ön şartında durmuş. Bu, gerçek kullanıcı verisinin yokluğunu kanıtlamaz; **test ortamı bağımlılığıdır**.
10. 10× teardown 90 s timeout ile kalmış, timeout büyütünce **3,2 dakikada** geçmiş. Timeout artırmak performans onarımı değildir.
11. Saf testlerdeki 65/65, bütün 38 UI kontrolünün, çıktıların mühendislik doğruluğunun, fiziksel mobilin veya Production'ın geçtiğini kanıtlamaz.
12. Eski `active-store` import'u gibi test mimarisi beklentileri bozulmuş; testleri sahte bir singleton yaratarak veya assertion'ı silerek yeşile boyamak yasak.

**Yapay zekâ halüsinasyonu denetimi:** Her “yapıldı”, “test edildi”, “korundu”, “upstream'den alındı”, “Production'a çıktı” ve “bug kesin şu sebepten” iddiasını şu etiketlerle incele: `DOGRULANDI`, `KISMEN`, `YANLIS`, `KANIT_YOK`, `BILINMIYOR`. Gerçek test sonucu ayrıca `PASS / FAIL / BLOCKED / NOT_RUN`. “Hatalı çıkarım” ile “uydurulmuş veri” aynı şey değildir; yalnız kanıt varsa sahtecilik/halüsinasyon hükmü yaz.

### 0.3 Öncelik — kök neden **henüz** kesin değildir

| ID | Sorun | Kaynak statüsü | Öncelik | Sorumlu aşama |
|---|---|---|---|---|
| P0-01 | İki parmak pinch, kamera zoom değişmiyor | Emülatörde `FAIL` bildirilmiş | Kritik | 03 |
| P0-02 | Pin/Metin/F5 100 saniye timeout | Son E2E `FAIL`; neden belirsiz | Kritik | 04 |
| P0-03 | DWG cache HIT/MISS / fallback | Bazı E2E `FAIL`, eski selector olası | Kritik | 06 |
| P0-04 | 4 büyük DWG/DXF gerçek render | `BLOCKED`; browser kanalı kapanıyor | Kritik | 07 |
| P0-05 | Legacy SHA null / cross-device sync | Gerçek 2-cihaz kabulü `BLOCKED` | Kritik | 05 |
| P0-06 | Release gate gerçek DB'ye aşırı bağlı | Preflight `BLOCKED` | Kritik | 02, 10 |
| P0-07 | Tam uygulama kabulü yok | `RELEASE_READY=NO` | Kritik | 08–10 |
| P1-01 | Eski/uyumsuz Playwright testleri | Bazıları toplama/selector sorunu | Yüksek | 02 |
| P1-02 | Truncated commit sonrası teslim bütünlüğü | Geçmiş aktarım kusuru kesin; güncel etki bilinmiyor | Yüksek | 01 |
| P1-03 | Adapter/host/measurement regresyon olasılığı | Git diff ile değişiklik kesin; bug belirsiz | Yüksek | 01, 03, 06–08 |
| P1-04 | Pointer/event owner ve async yarışlar | Hipotez | Yüksek | 03–04, 08 |
| P1-05 | Eski kayıt şema varyantları | Eksik kapsam | Yüksek | 04–05 |
| P1-06 | JSON/DXF/PNG/PDF semantik/doğruluk | Format testi var; tam kalite yok | Yüksek | 09 |
| P1-07 | Fiziksel Android/iOS/tablet/stylus | `NOT_RUN` | Yüksek | 03, 08, 10 |
| P1-08 | Görünüm/temizle/yorum/orijinal indirme | Eksik uçtan uca kanıt | Yüksek | 08–09 |
| P1-09 | Gerçek performans profili | Mevcut ölçüm genellenemez | Orta/yüksek | 07 |
| P1-10 | Kaynak birimi, geometry ve snap hassasiyeti | Dar oracle geçmiş; geniş corpus yok | Yüksek | 08 |
| P1-11 | Feature flag / rollback prova edilmedi | `NOT_RUN` | Yüksek | 10 |
| P1-12 | 409, offline, kaydedildi göstergesi | Eksik gerçek akış | Yüksek | 05 |
| P1-13 | MLightCAD/CADCraft “referans” ≠ “entegre” | Kaynak/uygulama çapraz inceleme gerekli | Orta | 01, 08 |

**Kapsam dışı backlog:** Gerçek DWG entity editörü, TRIM/OFFSET/EXTEND, yeni renderer, CAD V2'ye geçiş, kapalı CAD entity'ye tek tıklamayla tam eğrisel alan, açı/yay ölçümü, CSV, Ortho/Polar. Bunları eksik R2 kusuru diye göstermeyin; kullanıcı ayrıca istemedikçe eklemeyin. **Kullanıcı talimatı gereği lisans değerlendirmesi bu teknik planda kapsam dışıdır**; mevcut lisans dosyalarını değiştirmeyin. Bu tercih herhangi bir uygunluk onayı anlamına gelmez.

---

## 1. Codex için değişmez çalışma sözleşmesi

**Rol:** Bu planı Windows'taki Codex uygular; soru sormadan **rutin ve geri alınabilir** teknik kararları verebilir. Erişemediği sisteme eriştiğini, koşturmadığı testi koşturduğunu veya fiziksel cihaz emülasyonunu gerçek cihaz diye gösteremez.

**Kesin sınırlar:**

- **`main`, Production, Neon Production (`neon-bronze-engine`), Production Blob, gerçek kullanıcı dosyaları ve mevcut V1 parser/renderer/worker/WASM/routing korunacak.** Koruma kapsamına cache/fallback ve `cad-upstream-viewer.tsx` içinde çalışan render yolları da dahildir. V2, `dwg_V2/`, `motor_v2/`, `src/lib/cad-v2/**` değiştirilmez.
- Kaynak DWG/DXF byte'ları ile orijinal entity'ler **salt okunur**; bütün ölçüm/markup review overlay verisidir. Review DXF, düzenlenmiş orijinal DWG değildir.
- **Kanıt olmadan büyük refactor, kütüphane güncellemesi, yeni global arbiter, ikinci renderer, package-lock churn, test silme, `test.skip`, timeout'la kusur gizleme, sahte/mock başarı yok.** Mevcut API en önce, en küçük diff ile düzeltilir.
- Mevcut Preview/Development Neon bağlantısı (`belgeler-stage13-neon-test`) bir test veritabanı adı taşısa bile **otomatik olarak güvenli/tek kullanıcılı test ortamı sayılmaz**. Başka kullanıcı/çalışmayla paylaşılabileceği için write testleri öncesinde yeni izolasyon veya izinli namespace kanıtı gerekir.
- Yerel kullanıcı değişiklikleri/stash korunur. `git reset --hard`, `git clean -fdx`, force-push/rebase, toplu cherry-pick, DB migrate/backfill veya destructive script **otomatik yapılmaz**.
- Yeni branch ve git worktree üzerinde **yerel commit serbest**, ancak **otomatik `git push`, PR merge, Preview/Production deploy veya alias/promotion yok**. `[skip ci]` / `[skip vercel]` deploy engellemesi için tek güvence kabul edilmez. Kullanıcı daha sonra açıkça onaylarsa ilgili aşamada **en fazla bir Preview veya Production deploy**; daha fazlası için yeni açık izin gerekir. **Varsayılan deploy = 0.**
- Kod aşaması tamamlanınca kendi testleri + yakın regresyonlar çalıştırılır, bir anlamlı checkpoint commit yapılır; kritik `FAIL` saklanmaz. Ortam/cihaz erişiminden dolayı `NOT_RUN` kalan işler final yayın kapısında zorunlu dış doğrulama olabilir, fakat ilgili aşamanın kodunu bittiği gibi yanlış etiketlemeye yol açmaz.
- Uygulama yalnız `ilk aşamadan başla` ile başlar. **Her `devam` en fazla bir aşamayı** başlatır/sürdürür. Bitmemiş aşamada kal. Tüm aşamalar bittiğinde `devam` hiçbir kod/test/deploy eylemi yapmaz.
- Kullanıcıdan açık onay gerekenler: Production, canlı DB/Blob'a yazma veya şema değiştirme, geri döndürülemeyen işlem, korunmuş V1 core'a mecburi kapsam dışı müdahale, birden fazla deploy, `main`e merge.

**Repo kuralları önce okunacak:** `PROJECT.md`, `AGENTS.md`, `.agents/rules/cad-dxf-engine-koruma.md`, `.agents/rules/cad-v1-review-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `docs/cad-dxf-engine/{README,BASELINE_MANIFEST,ARCHITECTURE,VISUAL_INTERACTION_CONTRACT,AI_CHANGE_PROTOCOL}.md`, `DOK_CONTEXT_MAP.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`, `docs/cad-v1-review/{PLAN,IMPLEMENTATION_STATE,FINAL_ACCEPTANCE,ROLLBACK}.md`. Çelişki varsa güncel kod/gerçek test verisi önceliklidir; kapsamı değiştirmek için yeni izin değil, doğru sınıflandırma gerekir.

**Aşama raporu her defasında aynı formatta:** `aşama | mevcut HEAD | önceki checkpoint | değişen yollar | gerçekte koşan komut / süre / konfigürasyon | PASS/FAIL/BLOCKED/NOT_RUN | fixture hash | bulgu-kök neden/hipotez ayrımı | rollback | veri/Production etkisi=0 | sonraki aşama için devam bekleniyor`.

### 1.1 Tek kaynaklı kanıt dosyaları

İlk aşamada, eski dosyaları **üzerine yazmadan**, `docs/cad-v1-r2-recovery/` altında şu dosyaları üret:

- `PLAN.md` — bu planın yerel kopyası, orijinal dosya değişmeden.
- `STATE.md` — `active_stage`, `status`, `next_stage`, commit SHA, blocker ve test durumu; sonraki `devam` burayı okusun.
- `FINDINGS.md` — tekil ID, tekrar adımı, beklenen/gözlenen, kaynak satır, fixture, kök neden kanıtı, şiddet ve kararı.
- `CLAIM_AUDIT.md` — iki MD, 11 aşama kaydı ve kod/commit/test kanıtı çapraz iddia denetimi.
- `ACCEPTANCE_38.md` — 38 araç/davranışın yeni, commit ve cihaz kapsamlı gerçek kabul matrisi.
- `evidence/` — JSON/Markdown/terminal özetleri ve **hassas veri temizlenmiş** trace/video bağlantıları; dev çıktı dosyaları gerektiğinde `.gitignore` ile yerelde kalsın.

**Kanıt standardı:** `PASS` ancak gerçekten koşan test + assertion + tekil fixture + aynı SHA. `FAIL` yalnız gerçek testin başarısız sonucu. `BLOCKED` giriş şartı/altyapı yok. `NOT_RUN` hiç çalıştırılmadı. `HYPOTHESIS` kanıtlanmamış teşhis. `NO_CHANGE` korunan dosya/DB/deploy için negatif kanıt; belirsizse öyle işaretlenir. Testin başarısızlığını yorumlamadan önce testin oracle'sının geçerli olduğunu doğrula.

### 1.2 Windows'ta güvenli başlatma; komutlar sırayla

PowerShell'de **doğru repo içinde** aşağıdaki ilk keşif işlemlerini uygula (gerçek path'i otomatik belirle; kullanıcıya sorma):

```powershell
git rev-parse --show-toplevel
git remote -v
git status --short
git branch --show-current
git worktree list
git stash list
git rev-parse HEAD
git show -s --format="%H %ci %s" HEAD
```

Sonra doğru `origin` doğrulanınca `git fetch origin` yap. **Kirli workspace'e checkout veya reset yapma.** R2 dalı remote'da mevcutsa, mümkünse ayrı güvenli `git worktree` oluştur: `origin/internal-cad-v1-pro-review-r2-20261102` baz alınır; dal örneği `internal-cad-v1-r2-recovery-20261102`. Aynı adlı yerel worktree/branch varsa çakışma olmadan mevcut durumu incele ve farklı isim seç. `main` ile R2'nin güncel HEAD SHA, merge-base ve diff'ini yeniden hesapla. GitHub'da dosyanın mevcut olması yerel worktree'nin aynı dosyayı içerdiğini kanıtlamaz.

`node --version`, `npm --version`, `git --version`, `npx playwright --version` ve Windows kaynaklarını kaydet. `npm ci` çalıştırmadan önce proje kuralı/lockfile, script side-effect ve kullanılacak test `.env` kapsamını incele; gizli değerleri loglama. Farklı testler için ayrı port ve izolasyon kullan; **Next build ile TS'nin `.next/types` üzerinde eşzamanlı yazması yasak**. Aşırı uzun kompozit suiteleri ilk adımda başlatma.

### 1.3 Test komut çekirdeği — yalnız gerçek dosya/fixture ve script kontrolünden sonra

```powershell
# Uygun temiz test worktree'sinde, art arda çalıştırılacak:
npm ci
npx tsx --test tests/document-studio/cad-review-stage02-contract.test.ts tests/document-studio/cad-chain-stage03-contract.test.ts tests/document-studio/cad-distance-stage04-contract.test.ts tests/document-studio/cad-area-stage05-contract.test.ts tests/document-studio/cad-markup-stage06-contract.test.ts tests/document-studio/cad-stage07-contract.test.ts tests/document-studio/cad-stage08-contract.test.ts tests/document-studio/cad-stage09-contract.test.ts tests/document-studio/cad-stage10-perf-contract.test.ts
npx tsc -p tsconfig.next.json --noEmit --incremental false
npm run lint
npm run build

# Hedefli E2E örnekleri. Playwright config'teki gerçek project adını ÖNCE doğrula.
npx playwright test --config=playwright.config.ts tests/document-studio/cad-stage07-browser.spec.ts --project=chromium --workers=1
npx playwright test --config=playwright.config.ts tests/document-studio/cad-cache-and-routing.spec.ts --project=chromium --workers=1

# Tam release kapıları SON aşamada, önkoşulları sağlandığında:
npm run check:cad-review:release
npm run check:cad-real-user-release
npm run check:cad-preview-v2
```

Bu komutlar **yerine getirildi iddiası değil**, Codex için başlangıç adaylarıdır. Testlerde `webServer`/port/auth/fixture, test projesi adları ve script'lerin gerçek içeriği incelenmeden çalıştırılmaz. `build` veya test runner'ın Neon/Blob/Production'a yanlış yazı yazmadığını env/ağ ayrımıyla ispatla. Çıktıları kontrolsüz eşzamanlı koşma.

---

## 2. Yeni uygulama planı — 10 aşama

### ASAMA_01 — Gerçek durumun dondurulması ve sahte başarıların ayıklanması

**Amaç:** R2 dalının, Production temelinin, 70 dosyalık farkın ve eski 11 aşamanın gerçekte ne yaptığını sıfır varsayımla ortaya koymak.

**İzinli:** `docs/cad-v1-r2-recovery/**`, yalnız yeni salt-okunur denetim betikleri. **Dokunulmaz:** mevcut kaynak, fixtüreler, `main`, deployment, DB.

1. Yerel mevcut çalışma ağacını, kullanıcı değişikliklerini, `main`, R2 ve Vercel commit/deploy ilişkisini kaydet; ayrı worktree aç. R2 `555b89a…` ve `main 3df5e…` SHA'larını **tarihsel başlangıç** olarak kullan, uzaktan bugün hâlâ aynı olduklarını varsayma.
2. `git diff --name-status main...<R2-ref>`, `git diff --stat`, `git diff --check`, gerçek Git blob SHA ve `git show` ile 70 dosyanın tamamını sınıflandır. Özellikle Stage08 bozuk `f3e81a5…` / kurtarma `f3bc898…`; kurtarılan 11 dosyanın güncel içerik/satır/tip/build bütünlüğünü denetle.
3. `PLAN.md` ve `IMPLEMENTATION_STATE.md` aşama kayıtlarını `FINAL_ACCEPTANCE.md` ve gerçek test/commit dosyalarıyla karşılaştır. **Her önemli iddia için** `DOGRULANDI / KISMEN / YANLIS / KANIT_YOK / BILINMIYOR` yaz. “Bu kod satırı var” = “UI çalıştı” değildir.
4. Ürün vs test vs ortam vs performans vs mimari borç vs yeni özellik ayrımıyla `FINDINGS.md` aç. 38 kontrolün her birini başlangıçta `UNKNOWN`/eski rapordan aday statüyle işaretle; eski PASS'ları yeni PASS olarak taşımayı yasakla.
5. Gerçek Vercel R2 URL / SSO, Production domain ve branch target ilişkisini yalnız salt okunur incele. Girişsiz gerçek proje açılamıyorsa `BLOCKED (auth/data)` olarak kaydet; **otomatik deploy yapma**.

**Kabul:** Tam diff + checkpoint tablosu, kanıt-iddia matrisi, Production/R2 ayrımı, korunacak V1 yolları, risk envanteri tamam. **Rollback:** Yeni dokümanlar dışında diff yok; bir yerel belge commit'i. **Dur:** `devam` bekle.

### ASAMA_02 — Test altyapısını dürüst ve tekrarlanabilir hâle getirme

**Amaç:** Eski test yanılsamalarını ve ortam kaynaklı sahte FAIL/PASS durumlarını düzeltmek; güvenilir kırmızı/yeşil kabul zemini kurmak.

**İzinli:** `tests/document-studio/**`, yalnız ilgili test fixture kopyaları, `scripts/check-cad-*.ts`, hedefli Playwright config; gerekliyse yeni `docs/cad-v1-r2-recovery/**`. **Dokunulmaz:** ürün motoru; gerçek DB, kaynak fixture orijinalleri.

1. Temiz worktree'de bağımsız saf test + TS + lint + build **sırayla** çalıştır, test listesini/sonuçlarını SHA ile kaydet. Testler gerçekten 65/65 mi? Fail varsa bug mu, test mi?
2. `cad-stage3-review-tools.spec.ts` içindeki olmayan `active-store`, Stage07'nin revision-key, eski toolbar selector, adapter access, 6. snap beklentisi, test server readiness ve `.next`/port yarışlarını tek tek analiz et. **Sözleşme geçerliyse uygulama kodunu düzelt; test eskidiyse test beklentisini gerekçeli düzelt.** Assert silmek ve timeout şişirmek çözüm sayılmaz.
3. Her kritik hatanın ilk önce **kırmızı reproducer**'ı olsun: Pin/Text/F5 step log, pinch camera zoom, cached-DXF/original-DWG fallback ve 409 kaydı. Bütün network/fixture verisini test içine deterministik ve gerçek API şekliyle yerleştir; testin ölçmediği şey PASS sayılamaz.
4. `check:cad-review:release` ve `check:cad-real-user-release` içindeki `.data/dok_db.json` + minimum 50 dosya şartını analiz et. **50 sahte kullanıcı kaydı uydurup eski kullanıcı kabulünü yeşile çevirme.** Ayrı *synthetic contract* kapısı ve gerçek izinli *user-data release* kapısı tasarla; preflight hangi şeyi engelliyor ayrıntılı raporla. Gerçek kullanıcı veri kapısı bu aşamada `BLOCKED` kalabilir.
5. Testi izole portlarda, tek browser worker ile başlat; fail anındaki trace/video/console/network/hata satırı otomatik kaydedilsin. Repo içinde büyük test çıktıları/kişisel bilgiler commite girmez.

**Kabul:** Testler toplanır, eski test yanlışları kaynakla gerekçelendirilir, P0'lar için ölçülebilir kırmızı test vardır, ürün bug'ları gizlenmez. Kaynak bağımsız saf oracle (3–4–5, alan 12/14, 37°, UTM, unitless, 2×/4×) korunur. **Rollback:** yalnız test/harness diff. **Dur:** `devam`.

### ASAMA_03 — Mobil pinch-zoom ve pointer/kamera sahipliğinin gerçek onarımı

**Amaç:** P0-01'i nedenini kanıtlayarak düzeltmek; pan/zoom/ölçüm/OSNAP etkileşimlerini bozmamak.

**İzinli:** `src/lib/dokumantasyon/cad-review/pointer-router.ts`, ilgili `cad-upstream` input/adapter dar kodu, `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx` içindeki **yalnız gerekli touch bridge**, ilgili testler. **Dokunulmaz:** MLightCAD parser/renderer/worker, V2, global pointer polyfill.

1. CDP gerçek çift-touch izinde `touchstart/touchmove/touchend`, `pointercancel`, `preventDefault`, `touch-action`, passive listener, canvas/overlay `pointer-events`, gesture guard ve adapter kamera handler zincirini sırayla izle.
2. Raporlanmış **80→120 CSS px** iki parmak aralığı senaryosunda kamera zoom'unun önce/sonra **sayısal** değerini, center/world pan'ini ve bir review çizgisinin **world→screen projeksiyonunu** kaydet. Yalnız DOM/SVG ölçümünü değiştirmek değil, kamera hareketini düzeltmek gerekli.
3. Sorun gerçek CSS/bridge guard ise en küçük düzeltme; upstream touch mapping ise kullandığın sürümün gerçek public API'sini kontrol ederek uyumlu yol. Synthetic CDP gesture yanlış olay dizisi üretiyorsa onu gerçek etkileşimle karşılaştır; ürünü hatalı test için bozmadan önce alternatif hipotezi kapat.
4. İkinci parmak gelince aktif measurement/markup draft yanlış commit olmasın; tek parmak pan, pinch, mouse wheel, trackpad, stylus, drag, double click, tool switch, ESC ve `lostpointercapture` birlikte regresyon.
5. En az iki mobil viewport/emülasyon profili ile otomatik test; fiziksel iOS/Android yoksa `NOT_RUN (physical)` olarak final kapısına taşı, “gerçek cihaz PASS” yazma.

**Kabul:** Gerçek iki parmak aralığı büyürken **kamera zoom parametresi beklenen yönde değişiyor**, ölçümün ekran boyutu aynı kamera dönüşümüyle değişiyor, pan bağımsız çalışıyor, yanlış vertex/çift commit yok; önceki mouse/OSNAP akışı PASS. Sayısal eşikleri fixture/zoom politikasına **test öncesinde** sabitle. **Rollback:** dar pointer/bridge commit revert. **Dur:** `devam`.

### ASAMA_04 — Pin, metin, F5, yerel cache ve tekil history

**Amaç:** P0-02'yi çözmek; Pin/Text/F5'nin timeout olmayıp gerçek kayıt/yeniden açılma davranışını kanıtlamak.

**İzinli:** `cad-review/{store,schema,markup-controller,repository}.ts`, ilgili `cad-review-input-dialog.tsx`, host'un gerekli küçük UI köprüsü ve testler. **Dokunulmaz:** kaynak CAD, canlı DB, V2.

1. ASAMA_11'deki 100 s timeout'un **hangi Playwright adımında** oluştuğunu trace, DOM, dialog focus, pending network, async index, hydration, localStorage key ve console ile saptamadan kod düzeltme kararı verme.
2. `pin add → edit/save → cancel → text add → Unicode/uzun metin → tool switch → undo/redo → F5 → görünür aynı item / aynı fileId + sourceVersionKey` akışlarını önce tek tek, sonra birleşik dene.
3. Eski `dok_cad_review_v1_<fileId>` ile yeni `dok_cad_review_v1_<fileId>__<sourceVersionKey>` biçimleri, `schema v1`, eksik alanlar, `chain-*`, legacy item ID'leri ve kaynak hash bilinmiyor durumunu **read-only örnek kopyalarda** round-trip doğrula. Veri kaybına yol açan migration değil, açık uyumluluk davranışı kur.
4. Asenkron prompt/dialog cevabı kapanmış veya dosyası değişmiş ekrana yazılmamalı. Blur/pagehide/ESC/double click/readonly/security etkileşimlerinde çift kayıt, kayıp kayıt, hayalet item yok. Reload sonrası undo politikasını açık belirle: desteklenmiyorsa yanlış vaat etme.
5. Testi en az iki bağımsız browser context'te aynı yerel cache yanılsamasından arındırarak yürüt; server sync burada henüz kabul edilmiş sayılmaz.

**Kabul:** Birleşik güncel `cad-stage07-browser.spec.ts` ve hedefli F5/legacy testleri gerçekten PASS, zaman aşımı nedeni kanıtlı, source review eşleşmesi doğru, tek kayıt/history ve kullanıcı verisi korunmuş. **Rollback:** yeni writer ayrı, legacy reader korunmuş olmalı. **Dur:** `devam`.

### ASAMA_05 — Gerçek SHA, 409 ve güvenilir iki oturumlu senkronizasyon

**Amaç:** P0-05'i kapatmak; local-only ve cloud-saved ayrımını doğru göstermek; eski sürüme yanlış not taşınmasını engellemek.

**İzinli:** `cad-review/{repository,schema,store,feature-flags}.ts`, dosya review API'sinin **dar, gerçekten gerekli** kodu, isolated test DB/Blob fixture'ları ve testler. **Dokunulmaz:** Neon Production, gerçek kullanıcı kayıtları, izinsiz backfill, genel auth/storage rewrite.

1. `GET/PUT /api/dokumantasyon/files/:id/review`, `expectedRevision`, 409, auth/readonly, kaynak versiyon anahtarı ve `sha256_hash=null` nedenini code path üzerinde haritala.
2. SHA kimliği **yalnız izinli, gerçekten elde edilen kaynak byte'larından** üretilebilir. Dosya ID'si, signed URL, ETag, keyfi timestamp veya response metadata'sını gerçek SHA sanma. Eksik SHA için erişimsiz durumda açık `local-only` ve senkronize edilemiyor semantiğini koru.
3. Ayrılmış test DB / test Blob / test kimlikleri / farklı storage namespace kullan. Yetkisiz gerçek kullanıcı verisini kopyalama, üretim API'sine yazma. V1→V2 source değişiminde eski review **yanlış çizime taşınmamalı**; yedek/kurtarma rotası açık.
4. İki oturum A/B: A create, B load; eşzamanlı edit; 409 conflict; offline edit→online retry; refresh, request abort, token expiry, çoklu tab, farklı file version; asenkron gecikmiş GET kaydı ezmemeli. Readonly kullanıcılar yazamamalı. 409'u sessiz last-write-wins ile geçme; güvenilir bir UX çözümü seç.
5. `Kaydedildi` türü mesaj yerel mi sunucu mu açık; yerel başarıyı Neon'a kaydedilmiş gibi sunma. `NEXT_PUBLIC_*` bayraklarının **build-time** olduğunu rapora ekle.
6. Eğer gerçek eski kaynak SHA backfill'i gerekiyorsa yalnız uygulanabilir, geri dönüşlü ve yetki isteyen **ayrı operasyonel öneri** hazırla; canlıda **uygulama**.

**Kabul:** İzinli izole ortamda 2-context GET/PUT/409/F5/offline testi PASS; veri tekrarı/kayıp/yabancı revizyon eşlemesi yok. Canlı gerçek kullanıcı geçmişi ancak ayrıca izinle test edilebilir; o kanıt yoksa finalde `BLOCKED` kalır. **Rollback:** canlı DB değişikliği sıfır, API diff geri döndürülebilir. **Dur:** `devam`.

### ASAMA_06 — DWG cache HIT/MISS, DXF ve APS fallback adli regresyonu

**Amaç:** P0-03'ün ürün hatası mı yanlış test mi olduğunu ispatlamak; çalışan V1 route'u hiç bozmadan onarmak.

**İzinli:** `tests/document-studio/{cad-cache-and-routing,cad-dxf,cad-stage3-view-navigation}.spec.ts`, gerekirse dar `cad-upstream` adapter/orchestration kodu ve izole fixtures. **Dokunulmaz:** worker/WASM/parser/renderer/V2, global route değişimi ve Production config.

1. `check:cad-preview-v2` içindeki **en az iki** cache/fallback fail'ini ayrı scenario IDs ile tekrar üret. Beklenen `cached-dxf`, gerçekleşen `original-dwg`/APS dalını request/response/feature capability/cache key ile doğrula; eski fixture varsayımını gerçek adapter contract'ıyla karşılaştır.
2. Cache HIT, MISS, bozuk cache, stale/mismatched revision, yetkisiz cache, dönüştürücü başarısızlığı, APS success/failure, DXF fallback ve retry için **geçiş karar tablosu** çıkar; sadece kaynak değişken adlarına bakmak yeterli değil.
3. Kaynak çizim `fileId/version/SHA` değiştiğinde cache yanlış revizyondan çizim göstermemeli; hata açık olmalı. Eski toolbar `[data-cad-display-controls="true"]` test selector'ını UI gerçekliğine göre araştır; sırf test için sahte gizli DOM ekleme.
4. En küçük düzeltmenin ardından mevcut V1'in açılış, görüntüleme, renk, lineweight, katman, metin, font, hatch ve fallback davranışını hedefli gerçek fixture ile tekrar karşılaştır.
5. Bu aşamayı yeni DWG worker, bağımlılık upgrade, farklı renderer veya CAD V2 cutover'a çevirmek yasak.

**Kabul:** HIT/MISS/fallback matrix testleri çalışmış ve PASS; doğru gerçek açılış yolu, hata ve fallback kararları kanıtlı. Eski V1 ile ilgili golden/önce-sonra gözlem değişmemiş. **Rollback:** sadece dar routing/harness diff. **Dur:** `devam`.

### ASAMA_07 — Büyük DWG/DXF corpus, render fidelitesi ve gerçek performans

**Amaç:** P0-04 ve P1-09: kanal kapanmasının test ortamı mı gerçek çizim sorunu mu olduğunu ayırmak; büyük dosyalarda güvenilir açılış ve kaynak değişmezliği.

**İzinli:** `tests/document-studio/cad-real-repository.spec.ts`, izole perf harness, yalnız profilin belirttiği review/snap/cache küçük optimizasyonları ve rapor. **Dokunulmaz:** orijinal fixture byte'ları, core renderer/parser/worker/V2.

1. Dört fixture'ı **tek tek ve sırayla** çalıştır; önce dosyanın gerçek path ve SHA'sını kontrol et. R2 raporunun referans SHA'ları:
   - DWG 2.139.550 byte: `9a59ff9e5496e2a3c62b378f062e5f0f3cfa707b9bd4b5a0bf6749cd8bf52459`
   - DWG 3.440.087 byte: `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`
   - DWG 16.084.252 byte: `8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6`
   - DXF 55.259.742 byte: `36f87f826fe4dd9a8f03f8c83bafeeddfc84f1e0efada5c0fded8014a2ef7cf1`
2. Her dosya için `cold/warm`, browser PID/RAM, CPU, network/response, `page.goto`, WebGL readiness, entity count (mevcut API sağlayabiliyorsa), model/paper space, bounds, layer, font/Türkçe metin, hatch, zoom/fit, pixel/render snapshot ve console exceptions ayrı kaydedilsin.
3. `ERR_ABORTED` / `Channel closed` için browser crash, OOM, test-server exit, Windows kaynak baskısı, file URL/fixture auth ve test timeout'unu **alternatif hipotezler** olarak ayrı ölç. 90→300 s timeout büyümesi sahici düzeltme değildir.
4. Orijinal dosya SHA'sı önce/sonra aynı olsun. Bağımsız CAD uygulaması/izleyicide mümkünse görüntü ve kritik geometri kıyası yapılır; erişilemiyorsa açık `NOT_RUN` (görsel karşılaştırma).
5. 10× mount/unmount ve dosya geçişinde WebGL context/worker/heap/DOM listener sızıntısı, return-to-baseline, ölçüm ekleme ve kaydırma gecikmesi ölçülür. Tek makinenin sayıları evrensel FPS hedefi diye sunma. Optimizasyon sadece profiler net neden bulduğunda; aynı ortamda önce/sonra, doğruluk regresyonu ile.

**Kabul:** 4 dosyanın **her biri** nihai durum + render/camera doğrulaması + SHA + hata/performans profili ile sonuçlandırılmış; browser crash yok veya dürüst ve doğrulanmış ortam engeli var. Ortam engeli kalırsa release `BLOCKED` — sahte PASS yok. **Rollback:** test/profil + gerektiğinde dar optimize edilmiş diff. **Dur:** `devam`.

### ASAMA_08 — Bütün 38 gerçek CAD kontrolünün derin işlev ve UX sınaması

**Amaç:** R2 planının asıl hedefi olan *mevcut tuşları profesyonelce kullanılabilir hale getirme* işini eksiksiz doğrulamak. Kapsamı yeni özelliğe büyütme.

**İzinli:** `cad-review/*`, `cad-upstream/{distance-measurement,chain-distance,area-measurement,snap-engine,snap-catalog,polygon-geometry}.ts`, ilgili preview/overlay UI, hedefli testler. Adapter/host yalnız mecburi küçük köprü. **Dokunulmaz:** V1 parser/renderer/worker, V2, veri/fixtures.

1. `ACCEPTANCE_38.md` içinde aşağıdaki 38 kontrolün **hepsini** yeni test sonucuyla güncelle. “Butona bastım, enabled oldu” değil; gerçek görsel/koordinat/side-effect/saklama sonucuna bak.
2. Sayısal orakıllar: 3–4–5 uzunluk=5; 3×4 alan=12, çevre=14; 5×4 alan=20, çevre=18; 37° rotasyon; 4.000.000 UTM offset; mirror/nested INSERT; `INSUNITS` mm/cm/m/ft/in/unitless; kalibrasyon 2× uzunluk/4× alan; self-intersect ve sıfır alan reddi. Kaynak birimi belirsizse **metre uydurma**.
3. OSNAP 6 mod, hidden/frozen layer, arc/bulge, gerçek hover hedefi = commit noktası, zoom/DPR CSS toleransı; yakın/nested entity adayları. Hata kanıtlanmadan yeni snap engine yazma.
4. Seçim, rect/circle/cloud/callout/pin/text/stroke/eraser, review-only edit, tek undo transaction, tekrar redo ve `clear measurements`. Orijinal CAD entity asla silinmesin.
5. Mobil ve desktop: mouse/trackpad/touch/pen, single/double click, drag, long press, ikinci parmak, ESC/Enter/Backspace, tool switch, blur, alt-tab, keyboard/IME, readonly, 320/390/768/1366/1920 px, DPR 1/2/3, portrait/landscape, dark/light, safe-area ve ekran klavyesi. Fiziksel iOS/Android/stylus erişimi yoksa emülasyon PASS'ından ayrı not.
6. Layer/text search/visibility/locked/frozen/monochrome/lineweight/fit/fullscreen/pan/zoom, yorum durumları, indirme erişim hakları, görsel odak ve kısa anlaşılır hata durumları. Görsel kalite için önce/sonra gerçek screenshot farkı; sırf CSS selector bekleneni değil.
7. Güncel bug için red→green test, sonra ilgili V1 golden/smoke regresyon. Gelişmiş ancak kapsam dışı özellikler yanlış “eksik” olarak puanlanmamalı.

**Kabul:** 38 kontrolün her birinde beklenen davranış, test komutu, fixture, ortam, assertion ve son durum yazılı; hedefli testleri PASS. Erişilemeyen fiziksel testler açık kalır ve final release'e taşınır. **Rollback:** yalnız bozuk spesifik controller/overlay diff. **Dur:** `devam`.

### ASAMA_09 — Export, yeniden açılabilirlik, izin ve veri semantiği

**Amaç:** “İndiriliyor” ifadesi yerine *gerçekten doğru, kullanılabilir çıktı* kanıtı oluşturmak.

**İzinli:** `cad-review/{export-json,export-dxf,export-image,repository,security}.ts`, ilgili dialog ve testler. **Dokunulmaz:** orijinal DWG/DXF byte'ları, server-user data, engine core.

1. JSON: UTF-8/Unicode/Türkçe, legacy schema, 300 not, ID ve world geometry round-trip; import sonrası başka dosyanın item'ı yanlış dosyaya taşınmasın. Source revision kilidi.
2. DXF: **review-only** ve doğru `$INSUNITS`, layer/konum/metin/lineweight ve entity sayısı; en az bir **bağımsız CAD programında yeniden açma** (erişim yoksa `NOT_RUN`), source DWG düzenlendi iddiası yok.
3. PNG: gerçek source+review kompozisyonu, alfa/renk, viewport/zoom, DPR ve çizgi/metin konumları; geçici hover/draft çıktıdan dışlanmalı. Sadece magic byte kontrolü yeterli değil.
4. PDF: `%PDF-`, açılabilirlik, sayfa boyutu/kenar boşluğu, metin/Türkçe font, kaynak+overlay eşitliği, okunabilir raster çözünürlüğü, layout ve gerekirse mühendislik ölçek iddiasının açıkça **yapılmaması**. Tek sayfalı export'u çok paftalı CAD PDF diye sunma.
5. Orijinal DWG/DXF indirme: yetki, auth/readonly/share, byte SHA eşitliği, bozuk download/interrupt/retry, dosya adı/uzantı/MIME, cache ve F5 sonrası doğru source.
6. JSON/SVG/metin/markdown girdilerinde HTML/script injection, veri ifşası/IDOR, aşırı büyük payload ve boş/NaN koordinatlarını özel güvenlik regresyonlarıyla kontrol et. Prod secret/kişisel kayıtları test raporuna kopyalama.

**Kabul:** Her format hem dosya türü **hem içeriği** ile doğrulanmış; bağımsız CAD açılışı ve gerçek cihaz indirme yoksa ayrı `NOT_RUN`; source SHA ve güvenlik sıfır regresyon. **Rollback:** dar export/UI değişikliği. **Dur:** `devam`.

### ASAMA_10 — Bağımsız son kapı, yanlış-pozitif temizliği ve yayın kararı

**Amaç:** Yeni planın da eski planın hatasına düşmesini engellemek; yayın ve rollback kararını yalnız yeni kanıtlarla vermek.

**İzinli:** `docs/cad-v1-r2-recovery/**`, son küçük test doğrulaması. **Dokunulmaz:** yeni özellik, büyük refactor, Production/`main`, canlı DB.

1. Temiz yeni worktree/checkout'ta her checkpoint'i ve çalışma ağacı bütünlüğünü tekrar doğrula (`git status`, `git diff --check`, blob SHA, protected path diff). Yalnız test edilen SHA release adayı olabilir. Gerekirse başka makinede veya yeni tarayıcı profiliyle bağımsız tekrar.
2. Test kademeleri sırayla: saf TS/oracle → TypeScript/ESLint → dar Playwright → tüm güncel CAD V1 Playwright ve mobile emulation → 4 gerçek CAD dosyası → 2 oturum API/F5/409 → export → performans/teardown → `npm run build` → release scripts. Bir alt test fail ise kompozit script sonucunu bağımsız düzelt.
3. `check:cad-review:release` / `check:cad-real-user-release` için yalnız **izinli ve izole gerçek veri snapshot'u** şartları sağlanırsa orijinal kullanıcı kabulü çalıştırılır. Veri/50 dosya koşulu yoksa eski kapı `BLOCKED`; fixture-only kapı `PASS` olsa bile asıl release gate **geçmiş sayılmaz**.
4. Her 38 kontrolün son `PASS / FAIL / BLOCKED / NOT_RUN` statüsü ve cihaz kapsamı tekrar doğrulanır; P0 listesi boş olmalı. “Kod hazır” ile “yayın kabul edildi” ayrı kararlardır.
5. Feature flags on/off ve export on/off **ayrı yerel test build** ile ispatlanır; `NEXT_PUBLIC_*` değerlerinin canlıda deploy'suz anlık değişmediği korunur. R2 candidate vs `main` görsel golden/renderer/fallback kıyası; rollback adımları dry-run (canlı değişiklik yok).
6. Geri dönüş dosyasına son güvenli commit/Deployment, veri yedeği prensibi, audit izleri, geçiş sonrası smoke ve kabul edilmeyen riskler ekle. **Bu aşamada deploy, PR merge ve DB migration yapılmaz.** Ayrı açık yayın komutu gelirse ancak o zaman tek onaylı deploy hakkı ve yayın sonrası kontrol devreye girer.
7. Son denetimde bu planı da eleştir: yeni testler gerçekten hatalı implementasyonda kırılıyor mu; kalibrasyon ve oracle bağımsız mı; kritik kontrolü yalnız mock mu ölçüyor; emülasyon fiziksel cihaz yerine yazılmış mı; cache/fallback V1 goldeni değişmiş mi; raporda eski PASS kopyalanmış mı? Tespit edilen açığı düzeltmeden `RELEASE_READY=YES` yazma.

**Kabul kararı:**

- **`RELEASE_READY=YES`**: P0 `FAIL/BLOCKED` yok, 38 zorunlu kontrol desteklenen ortamda kanıtlı, gerçek büyük DWG/DXF/cross-device/çıktı/rollback kontrolleri geçmiş, release scripts ve yetkili veri şartları sağlanmış, fiziksel cihaz gerekli kapsamının sonucu mevcut ve Production değişmez.
- **`KOD_HAZIR_DOGRULAMA_BEKLIYOR`**: Kod ve erişilebilir testler geçmiş ama fiziksel iOS/Android, bağımsız CAD veya izinli gerçek veri gibi dış doğrulama eksik. **Production yayın onayı değildir.**
- **`RELEASE_BLOCKED`**: Herhangi kritik FAIL, güvenilirliği olmayan senkronizasyon, gerçek corpus açılış sorunu, veri veya auth riski sürüyor. Aşama raporu bu durumu saklamaz.

**Teslim:** `FINAL_AUDIT.md`, güncel `ACCEPTANCE_38.md`, `FINDINGS.md`, `STATE.md`, test/cihaz matrisi, her tamamlanan aşamanın yerel commit SHA'sı, gerçek P0 açık listesi, minimal rollback ve gerekiyorsa *ayrı onayla uygulanacak* yayın önerisi. **Dur:** Tüm aşamalar kapanınca salt `devam` → yalnız “Plan tamamlandı; yeni işlem başlatılmadı.”

---

## 3. Zorunlu 38 kontrol matrisi — aşama sahipliği

Bu tablo *önceki rapordaki denetim kapsamının kaybolmaması* içindir. Her satırdaki güncel PASS'ı Codex üretmelidir; aşağıdaki isimler başarı beyanı değildir.

| # | Kontrol | Birincil aşama | Testin gerçekten doğrulaması gereken sonuç |
|---:|---|---:|---|
| 1 | Seçim/kaynak seçim ayrımı | 08 | Review seçimi source entity'yi değiştirmez |
| 2 | Kamera/zoom-to-fit | 03, 08 | Gerçek bounds + fit + pan/zoom tutarlılığı |
| 3 | Renk/monokrom/lineweight/arka plan | 06, 08 | Renderer görünümü değişir, regression yok |
| 4 | Düz mesafe | 08 | World 3–4–5, unit/overlay/store eşit |
| 5 | Zincir mesafe | 08 | Segment/toplam, geri/bitir, tek commit |
| 6 | Alan/çevre | 08 | Self-intersect ret, doğru m² ve perimeter |
| 7 | Ölçümleri temizle | 08 | Kapsam doğru, 1 undo, reload consistent |
| 8 | Birim/hassasiyet/kalibrasyon | 08 | Unitless dürüst, 2×/4×, tarihî snapshot |
| 9 | OSNAP 6 mod | 03, 08 | Hover=commit, layer, transforms, CSS toleransı |
| 10 | Katman visibility/locked/frozen | 06, 08 | Kaynak render/snap ve UI tutarlı |
| 11 | Metin arama/zoom to result | 08 | Gerçek TEXT/MTEXT/ATTRIB bulma sınırı açık |
| 12 | Yorum paneli/durum | 08 | UI→store→reload doğru |
| 13 | Pin | 04, 08 | Dialog, save/F5, source version |
| 14 | Metin notu | 04, 08 | Unicode, cancel, edit/F5 |
| 15 | Callout/ok | 08 | Anchor/ok/geometri, undo |
| 16 | Dikdörtgen | 08 | Drag, ters yön, reload |
| 17 | Daire | 08 | Preview/hit-test/render eşit |
| 18 | Revizyon bulutu | 08 | Dünya koordinatı/fidelity |
| 19 | Serbest çizim | 08 | Stylus/touch, bounded stroke, konum |
| 20 | Silgi | 08 | Yalnız review, source untouched |
| 21 | Undo/Redo | 04, 08 | Araçlar arası tekil history |
| 22 | ESC/Enter/Delete/odak | 03, 08 | Dialog ve klavye kısayolları izolasyonu |
| 23 | Mobil ≥44 px kontroller | 08 | Gerçek tap target/keyboard/safe area |
| 24 | Long press/ikinci parmak | 03, 08 | Ölçüm draft iptali, yanlış commit yok |
| 25 | Pinch zoom | 03 | Kamera zoom gerçekten değişir |
| 26 | F5/local review | 04, 05 | Doğru file+revision key, veri kalır |
| 27 | GET/PUT/409 | 05 | Sunucu revizyon yarışı ve retry |
| 28 | Cross-device sync | 05 | İki ayrı context, gerçek kaynak SHA |
| 29 | JSON import/export | 09 | Unicode + geometry gerçek round-trip |
| 30 | Review-only DXF | 09 | Dış CAD'de geometrik reimport |
| 31 | PNG | 09 | Gerçek source+review piksel bileşimi |
| 32 | PDF | 09 | %PDF + page/layout/font doğruluğu |
| 33 | Orijinal DWG/DXF indirme | 09 | Yetki ve SHA eşitliği |
| 34 | DWG cache/fallback | 06 | HIT/MISS/APS/bozuk cache deterministik |
| 35 | Büyük gerçek DWG/DXF | 07 | 4/4 açılış, fidelity, hash |
| 36 | 10× teardown/WebGL | 07 | Memory/context/lifecycle profiler |
| 37 | Kaynak SHA değişmezliği | 01, 07, 09 | Bağımsız hash öncesi=sonrası |
| 38 | Production/fiziksel mobil/tablet | 03, 08, 10 | Ayrı erişim, gerçek cihaz, yayın ayrımı |

---

## 4. Her aşamada uygulanacak karşı senaryo ve hata sınıflandırma sistemi

İlgili araca uygun olanları test et; aynı dev suite'i sürekli baştan çalıştırıp zamanı tüketme:

- **Etkileşim:** Çift tık fazladan vertex, second finger pinch, pan sırasında aktif tool, ESC/Backspace, pointercancel/lostcapture, unmount, F5, network gecikmesi, tarayıcı sekmesi görünmez, dosya değiştirme.
- **Geometri:** NaN/Infinity, sıfır mesafe, büyük/negatif koordinat, 37°/mirror/nonuniform transform, nested INSERT, ARC/bulge, hidden layer, iki yakın snap adayı, DPR, zoom uçları.
- **Kalıcılık:** Eski JSON, sürüme özel cache key, fileId/version mismatch, offline, 409, paralel tab, readonly, GET gelirken değişiklik, migration restore, gerçek SHA belirsiz.
- **Render:** Cache hit/miss, DXF fallback, APS, hatch/font/MTEXT/DIMENSION, model/paper, fit/zoom/lineweight/monochrome, cold/warm, WebGL context loss.
- **Output/security:** Türkçe font, export MIME/magic vs içerik farkı, DXF yeniden açma, PDF sayfa düzeni, XSS/IDOR, kaynak SHA, yetkisiz download, büyük review payload.
- **Perf:** İlk açılış, pointer latency, long task, teardown/heap, 10 dosya değişimi; **önce/sonra aynı cihaz/ortam**.

**Kök neden karar ağacı:**

1. Ürün UI'si mi yanlış? Gerçek aynı SHA/browser/device'da reproducer.
2. Test mi yanlış? Fixture, selector, adapter, readiness ve beklenti güncel contract'a uygun mu?
3. Ortam mı yanlış? Vercel SSO, Node/Playwright version, browser crash, DB yok, config/port çakışması, Next build concurrent writing.
4. Dış servis mi yanlış? Neon branch limit/provisioning, auth, Blob ve APS durumu; **log olmadan kök neden uydurma**.
5. Geometri doğru ama görsel mi yanlış? raw world, projection, camera, CSS px ve render eşitliğini ayrı ölç.
6. Düzeltme küçük ve geri alınabilir mi? Önce red test, en küçük değişiklik, green + önceki çalışan V1 regresyonu. Yeni framework, yardımcı singleton veya renderer yalnız mevcut seçeneklerin yetersizliği **kanıtlanırsa** ayrıca tasarım kararı gerekir.

---

## 5. Aşama geçişi, checkpoint ve son kontrol protokolü

```yaml
plan_id: CADV1-R2-FORENSIC-RECOVERY-20261102
planning_status: HAZIR
execution_status: BASLAMADI # BASLAMADI | DEVAM_EDIYOR | CHECKPOINT_COMPLETE | ENGELLI | KOD_HAZIR_DOGRULAMA_BEKLIYOR | TAMAMLANDI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
verified_base_sha: null
verified_r2_sha: null
checkpoints: [] # stage, local commit sha, changed_paths, tests
open_p0: []
external_verification_pending: []
release_ready: false
production_changed: false
deploy_count: 0
```

- İlk `ilk aşamadan başla`: yalnız `ASAMA_01` ve gerçek kanıt raporu.
- Her `devam`: yalnız aktif **bitmemiş** aşama sürdürülür; bitmişse **bir sonraki** aşama başlar, **aynı mesajda iki aşama birden ilerletilmez**.
- Her aşamanın sonuç raporunda tek yerel checkpoint, commit SHA, hangi dosyalar/testler ve hangi sonuçların yeni olduğu yazılır; başarısızlıklar bir sonraki aşamaya gizlice taşınmaz.
- Salt test ortamı veya kullanıcının sahip olduğu fiziksel cihaz nedeniyle erişilemeyen bir doğrulama **`EXTERNAL_PENDING`** olarak açık kayıt altındayken kod checkpoint'i kapanabilir; ancak son release `YES` olamaz. Ürünün kritik mantıksal `FAIL`'i varsa aşama `ENGELLI`/`DEVAM_EDIYOR` kalır.
- Plan boyunca **0 otomatik push / deploy**. Kullanıcı ayrıca yayın yetkisi verirse stage başına en çok 1 normal deploy; aynı izin daha sonraki stage'e devredilemez, hatada tekrarlayıcı deploy döngüsü yasak.
- Son aşama bittiğinde rapor, kanıt ve yayın önerisi teslim edilir; `main`/Production'a yazılmaz. Bundan sonraki `devam` için işlem yapılmaz.

### Masaüstü Codex'e verilecek tek başlangıç prompt'u

> `CAD_V1_R2_BAGIMSIZ_DENETIM_VE_DUZELTME_PLANI.md` dosyasını eksiksiz oku. Bu dosya uygulama planındır; eski R2 `PLAN.md`, `IMPLEMENTATION_STATE.md`, `FINAL_ACCEPTANCE.md`, `ROLLBACK.md` ve repo ajan kurallarını kaynak olarak doğrula. Windows'taki `smitelagwar/muhendislik-site` repomu güvenli şekilde bul; kullanıcı çalışma ağacını bozmadan R2 son dalından ayrı worktree aç. **Yalnız ASAMA_01'i uygula.** Eski raporların PASS beyanını gerçek kanıt olarak alma; GitHub/Vercel branch ve Production farkını denetle, her iddiayı sınıflandır, tam bulgu ve kanıt dosyalarını üret. Kod, `main`, Production, canlı DB/Blob ve kaynak DWG/DXF'lere dokunma; push ve deploy yapma. Rutin konularda soru sorma. Aşamanın gerçek sonuçlarını, test/NOT_RUN durumunu ve yerel checkpoint SHA'sını raporla; sonraki aşama için **`devam` komutumu bekle**.

**Son ilke:** Gerçek CAD güvenilirliği “test sayısını artırarak” değil, **bağımsız sayısal oracle + gerçek dosya + gerçek etkileşim + veri ömrü + dürüst yayın kapısı** ile sağlanır.
