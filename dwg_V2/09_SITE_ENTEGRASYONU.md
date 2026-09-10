# 09 — Mevcut motora dokunmadan site entegrasyonu

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Repo incelemesi](02_REPO_INCELEMESI.md) · [Cihaz UX](08_CIHAZLAR_VE_ETKILESIM.md)

**Bu belge gelecekteki uygulama önerisidir; menü veya route bu oturumda değiştirilmedi.** Kullanıcının istediği birlikte kullanım doğrudan desteklenir: mevcut açma davranışı mevcut motoru kullanır, üç noktadaki yeni komut V2'yi seçer.

## Önerilen kullanıcı akışı

```text
proje.dwg  ⋮
  Önizle / Studio       → mevcut motor
  DWG Motor V2 ile aç   → yeni bağımsız motor
  İndir
  ... mevcut diğer seçenekler
```

DXF için “DXF Motor V2 ile aç” veya ortak “2D Motor V2 ile aç” etiketi değerlendirilebilir. Başlangıç pilotunda yanında “Deneysel” etiketi olabilir; olgunlaşınca kaldırılır. Standart çift tık, dosya başlığı linki ve Enter mevcut davranışı korur. V2 son kullanılan motor diye bütün siteye varsayılan yapılmaz.

V2 üst barında anlaşılır motor kimliği ve “Mevcut görüntüleyiciyle aç” komutu bulunabilir. Hata olmasa da bu komut erişilebilir kalır. Aynı anda iki ağır engine'i bellekte tutmak yerine A/B karşılaştırması ardışık oturumlarla yapılır.

## Route önerisi

En küçük başlangıç seçeneği:

```text
/dokumantasyon/dosya/<fileId>                  mevcut
/dokumantasyon/dosya/<fileId>?cadEngine=v2     V2
```

Önerilen domain kimlikleri `legacy` ve `cad-v2`; query değeri yalnız dış URL sözleşmesidir. Bilinmeyen `cadEngine` allowlist dışında kalır ve güvenli varsayılan/uyarı davranışı seçilir. Parametre module path, worker URL veya decoder paketi adı olarak kullanılmaz. Server component `searchParams`'ı doğrulayarak client shell'e açık tipli engine seçimi verebilir.

Bağımsız `/dokumantasyon/dosya/<fileId>/v2` rotası daha iyi izolasyon veriyorsa tercih edilebilir. Ama yetki, kaynak lease, version history ve üst bar mantığının kopyalanıp zamanla ayrışması hesaba katılır. Query önerisi hazır/uygulanmış API diye sunulmuyor.

## Dosya bazında önerilen değişiklik alanı

| Dosya/alan | Gelecekteki minimal ek | Koruma yaklaşımı |
|---|---|---|
| [file-manager.tsx](../src/components/dokumantasyon/file-manager.tsx) | Liste ve grid dosya menüsüne V2 item | Mevcut `Önizle / Studio` callback'i değişmez |
| [command-registry.ts](../src/components/dokumantasyon/drive-v3/command-registry.ts) | `open-cad-v2` tanımı/handler | Tek dosya, uygun tür ve erişim predicate'i |
| [file page](../src/app/dokumantasyon/dosya/%5BfileId%5D/page.tsx) | Query allowlist ve engine prop | `getAdminFileAccess` ve dosya erişim davranışı korunur |
| [Studio shell](../src/components/dokumantasyon/studio/document-studio-shell.tsx) | CAD case üstünde V2/legacy seçimi | Mevcut orchestrator içindeki sıra değişmez |
| Yeni `CadV2Host` | Ayrı dynamic import, lifecycle ve error boundary | V2 bundle sadece seçilince yüklenir |
| Yeni V2 runtime | Ayrı worker/cache/telemetry namespace | Mevcut adapter singleton ve global patch kullanılmaz |

`file-preview-shell` ve public paylaşım yüzeyi ayrı etap olabilir. Birinci etap yalnız admin dosya menüsü olsa da tamamlanma raporu “public V2 de hazır” demez. Kullanıcının her yerden erişim hedefinin public-link kısmı gerekiyorsa ikinci entegrasyon kapsamına açıkça eklenir.

## Menü koşulları

Uzantı normalize edilip `.dwg`/`.dxf` olmalı; folder, `.dwf`, PDF ve başka türlerde seçenek gösterilmez. Tek seçili, yüklemesi bitmiş ve çöp kutusunda olmayan dosyada etkin olabilir. Çoklu seçimde yanlış dosyaya açılmamalı. Menü açılan satır ile eski seçili satırın farklı olduğu senaryo özellikle test edilir.

Drive command target tipi bugün extension alanı taşımıyor. Predicate için dosya metadata'sını kontrollü olarak taşımak veya seçili ID'yi mevcut file listesiyle çözmek gerekir; dosya adına regex uygulamak tek doğrulama sayılmaz. Byte magic ve format teşhisi açılış katmanında yapılır.

Liste/grid menü event'i satır double-click/select handler'ına yayılıp iki route açmamalı. Dokunmatik long-press, odak iadesi, klavye menü dolaşımı ve viewport dışına taşmama yeni item ile kontrol edilir. Teknik decoder adları menüde gösterilmez.

## Yetki, revision ve lease

Engine seçimi dosya yetkisini değiştirmez. Aynı admin erişim fonksiyonu, aynı dosya ID'si ve seçilen immutable revision kullanılabilir. Public token, admin API'lerini çağırmak için yetki değildir. V2 scene/chunk/API erişimi public paylaşımın izin verdiği dosya ve süreye bağlanır.

Studio `currentLease.url` yenilenirken URL'nin değişmesi source revision'ın değiştiği anlamına gelmez. Aynı byte revision için viewer gereksiz yeniden mount olmamalı. Tersine dosya yeni sürüme geçtiyse eski source cache/derivative yeni sürümmüş gibi kullanılmaz.

Bugünkü sayfa DWG cached-DXF hint'ini önceden sorguluyor. V2 dalının farklı manifest kaynağı varsa mevcut hint sorgusunu gereksiz yere beklememek bir entegrasyon optimizasyonu olabilir. Legacy davranışı aynı kalacak şekilde ayrım üst route/shell sınırında yapılır; protected orchestrator yeniden yazılmaz.

## Motor değiştirme

1. Kullanıcı mevcut motorla açmayı seçer veya V2 hata ekranındaki komuta basar.
2. V2 session iptal edilir, kaynaklar bırakılır.
3. Aynı fileId/revision için mevcut route oluşturulur; yetki yeniden doğrulanır.
4. Aktif engine kimliği UI ve telemetry'de değişir.

V2 hatasında sessizce legacy gösterip “V2 başarıyla açtı” metriği yazılmaz. Kullanıcı iptali otomatik başka decode işini başlatmaz. Retry aynı hatayı sınırsız tekrarlamaz. Kamera durumunu iki motor arasında aktarmak ilk etap şartı değil; aktarılırsa layout ve world coordinate sözleşmesiyle doğrulanır.

## Kontrollerin paylaşılması

Görsel UI primitive'leri paylaşılabilir; mevcut ribbon/review bileşenlerinin upstream adapter'a veya global store'a gizli bağımlılığı incelenmeden V2'ye bağlanmaz. V2 yalnız kendi desteklediği katman/pafta/fit/görünüm araçlarını etkinleştirebilir. Ölçüm ve review araçları parity sağlanmadan menüde hazır gösterilmez.

V2'de çizilen markup kaynak geometriyi değiştirmez. Mevcut review kayıtları farklı origin/layout dönüşümü yüzünden kayabilir; paylaşılacaksa coordinate/schema version ve kaynak revision eşlenir. İlk pilotta bağımsız V2 review namespace'i daha basit olabilir.

## Birlikte kullanım kabulü

- V2 açılmamış normal dosya akışında V2'nin ağır JS/WASM/font asset'ları indirilmez.
- Yeni menü komutu hem liste hem grid hem mobil menüde doğru dosyayı açar.
- Normal route, PDF/DWF ve mevcut fallback zinciri aynı davranır.
- Refresh/back/forward ve kopyalanmış V2 URL'si doğru engine'i seçer.
- A → B hızlı geçişte A'nın sonucu B'ye karışmaz.
- V2 kapatılınca worker, RAF, context, listener ve pending request birikmez.
- Yetkisiz, silinmiş veya paylaşımı bitmiş dosya scene cache üzerinden açılmaz.
- Core dört dosyanın hash'leri başlangıç ile aynı kalır; değişiklik gerekirse önce bu dış sınır tasarımı yeniden değerlendirilir.

Rollout seçeneği: `hidden → geliştirici → admin pilot → kullanıcı seçeneği`. Varsayılan engine'i değiştirme bu sıranın otomatik son adımı değildir. V2 kill switch menüyü ve doğrudan V2 route'ını birlikte yönetebilir; normal viewer çalışmaya devam eder.
