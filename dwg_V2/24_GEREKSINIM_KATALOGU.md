# 24 — Tek tek denetlenecek gereksinim kataloğu

[Dizin](README.md) · [Kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Uygulama eşleme tablosu](uygulama/IZLENEBILIRLIK.md) · [Denetim](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**EXEC-2 / 48 gereksinim.** Her R ayrı denetlenir. Bu katalogdaki maddeler Gemini tarafından silinmez, birleştirilip izleri kaybedilmez, N/A veya ertelendi yapılarak tamamlanma paydasından çıkarılmaz. R'nin alt koşulları ilgili 00/19/21/22 ve teknik atlaslarda kalır; bir alt koşulun geçmesi bütün R'nin geçtiği anlamına gelmez.

Renk/görsel kalite işlevsel doğruluktan ayrı kabul edilir. Birden fazla G bir R'ye katkı verebilir; tek kaynak dosyası da birden fazla R'yi etkileyebilir. Gemini kaynak/test/kanıt alanlarını doldurur; Astra bağımsız inceleme alanını doldurur.

| ID | Gereksinim ve kapanış kanıtı | G paketleri |
|---|---|---|
| R01 | Legacy core fingerprint eşliği, normal açılış ve fallback regresyonu; yalnız hash yeterli değil | G00,G13,G15 |
| R02 | İki motor ayrı erişilebilir; normal çift tık/Enter legacy, V2 ayrı seçenek; varsayılan değişmemiş | G13 |
| R03 | Gerçek DWG/DXF yalnız seçilmiş server adapter'larından hazırlanıyor; browser raw decode yok | G02,G11 |
| R04 | Magic/format/encoding/ASCII ve binary DXF gerçek fixture; AC1032 doğrulaması; yanlış uzantı hata sınırı | G02 |
| R05 | Float64/units/OCS, büyük orijin ve küçük detay analytic oracle; geometriyi Z atarak bozma yok | G03,G06 |
| R06 | Nested block/ATTRIB/BYBLOCK/layer0/non-uniform transform ve instance kimliği doğru | G06 |
| R07 | ARC/CIRCLE/ELLIPSE/SPLINE/polyline/bulge/width; yakın ve uzak görünüşte doğru geometri | G05,G08 |
| R08 | Türkçe TEXT/MTEXT/SHX, exact font/anchor/rotation/width ve görünür eksik font durumu | G07 |
| R09 | Kaynak DIMENSION/LEADER, text override ve pafta bağlamı; yeni hesap uydurulmamış | G07,G09 |
| R10 | Hatch solid/pattern, delik/ada, topoloji ve büyük yoğun örnek; kalıcı kayıp yok | G08 |
| R11 | Draw order, wipeout/clip/transparency, lineweight/linetype phase; batching görünüşü değiştirmiyor | G08,G10 |
| R12 | Layer on/off/frozen/locked ve source style mirası; UI toggle sadece görünürlük değiştiriyor | G06,G09 |
| R13 | Model/layout, viewport twist/scale/clip/frozen ve annotation bağlamı doğru | G09 |
| R14 | Tek dosyada gömülü/bound kaynaklar + platform font hash invalidation; bulunmayan dış XREF/image/underlay açık degraded, ek dosya isteme yok; aktif OLE çalışmıyor | G09,G11 |
| R15 | Unknown entity/object/proxy ve degraded kayıtları; source→görünen içerik kaybı gizlenmiyor | G02,G09,G15 |
| R16 | Kaynak revision/handle/instance/provenance ve canonical immutable; GPU Float32 kaynak anlamı yerine geçmiyor | G03,G06 |
| R17 | Scene schema/version/checksum/length/offset/decoded limit validation; malformed allocation öncesi ret | G03,G10 |
| R18 | Idempotent job, lease/fencing, bounded retry, atomic ready; worker ölümü/stale publish testleri | G11 |
| R19 | Tenant/file/public yetkisi original, job, manifest, chunk ve dependency boyunca korunuyor | G11,G14 |
| R20 | Source/decoder/compiler/font/XREF/quality cache kimliği ve invalidation; yanlış revision açılmıyor | G10,G11 |
| R21 | Hazır sahne aynı decoder çıktısından, streaming önceliği/transfer/backpressure; client raw source yükü yok | G05,G10,G11 |
| R22 | Three.js 0.172.0 altyapılı V2 CAD renderer ve test edilebilir ortografik camera; legacy/thumbnail wrap değil | G05 |
| R23 | D3 2D wheel/pan/pinch world anchor, touchcancel/window drag cleanup ve gerçek touch; source parse tekrar yok | G12 |
| R24 | Session/generation A→B→C, unmount worker/RAF/GPU/listener cleanup; tekrar açış kaynak plato kanıtı | G05,G12 |
| R25 | Gerçek phase/loading/partial/full-ready/degraded/error/cancelled; sahte yüzde/ETA yok | G04,G12,G16 |
| R26 | Ağ/lease/context loss/background/resume/resize doğru sonuca ulaşıyor; sonsuz loading yok | G12,G14 |
| R27 | İzleyici iptali hızlı ve güvenilir; ortak işin diğer izleyicisini öldürmüyor; gizli fallback yok | G11,G12 |
| R28 | Input/process/chunk/CPU/GPU/queue sınırları; kaynak yetersizliği görünür; limitler test için oynanmamış | G03,G10,G12 |
| R29 | Legacy baseline ile cold/warm/prepared karşılaştırma; gerçek transfer ve gerçek engine path | G01,G15 |
| R30 | Fiziksel iPhone/Android ve tablet/desktop kapsamı açık; emülasyon gerçek cihaz sayılmamış | G12,G15 |
| R31 | Bağımsız numeric ve reference-app görsel oracle, holdout ve kritik ROI; kendi çıktısını hakem yapma yok | G01,G15 |
| R32 | Mevcut tokenlarla açık/koyu tema; UI fontu Türkçe; CAD kaynak renk/fontlarından ayrım | G04,G16 |
| R33 | 21'deki tipografi/spacing/radius/ikon/tek-kabuk tasarımı; modern ve kaliteli çalışma yüzeyi | G04,G16 |
| R34 | Keyboard/focus/contrast/target/reduced motion/accessible name; canvas erişilebilirliği abartılmamış | G04,G16 |
| R35 | Telefon/tablet/desktop, 320 px, yatay, safe-area, sheet/klavye/%200 zoom; taşma/örtüşme yok | G04,G12,G16 |
| R36 | Liste/grid/mobile menu doğru satır; metadata/allowlist/deep link/back/refresh/currentLease | G13 |
| R37 | Public V2 gerçek izinli akış, expiry/revoke ve UI yetki ayrımı; admin bypass yok | G14 |
| R38 | V2 lazy bundle/runtime/cache namespace; legacy açılışa V2 asset/network/CPU maliyeti eklenmemiş | G13,G15 |
| R39 | Sabit dependency ve runtime asset hash'leri; gerçek SHX/TTF/WASM eşliği; kör upgrade yok. Lisans evrakı teknik kapı değil, D22/U2 paketleme işi | G02,G07,G15 |
| R40 | İzole DB/storage/fixture, bounded test/cleanup/nonzero exit; özel çizim ve sır sızıntısı yok | G00,G15 |
| R41 | Oturum/package/CR/RUN/ART/SNAP geçmişi eksiksiz; eski başarısızlıklar ve kullanıcı dışı değişiklikler saklı | G00,G17 |
| R42 | UI01–UI20 gerçek bağlanmış ekranları; fake timer/demo SVG/no-op handler/olmayan araç yok | G04,G16 |
| R43 | Kill switch, rollback, orphan türev temizliği, job health ve hizmet kesintisi runbook'u | G11,G15 |
| R44 | PASS/FAIL/DEGRADED/UNSUPPORTED/NOT_RUN paydaları doğru; her iddia yeniden üretilebilir kanıta bağlı | G15,G17 |
| R45 | Geometri/refinement/culling/instancing kalite eşliği; etkileşim sonrası tam görünüş geri geliyor | G05,G08,G10 |
| R46 | ≥%20 warm prepared mühendislik hedefi eşlenmiş koşullarda ölçüldü; ölçüm tamamlığı/hedef sonucu ayrı, başarısız hedef açık GAP; cold ve bellek raporlu | G15 |
| R47 | Yerel Linux compiler kanıtı ile production host/canlı doğrulama ayrı; işletim/dağıtım engelleri görünür | G11,G15 |
| R48 | Astra AUD/FIX akışı, son snapshot ve yeniden kontrol; Gemini kendine bağımsız ACCEPTED vermemiş | G17 ve denetim turları |

## Kapsam dışı olanlar

Ham DWG parser Ar-Ge, 3D/orbit/BIM, kaynak dosya düzenleme, mesafe/alan kullanıcı aracı, annotation yazma, browser raw decode, persistent client offline dosya, WebGPU/Offscreen/SAB ve yeni ticari SDK bu sürümde yapılmaz. Bunlar eksik zorunlu işi gizlemek için sonradan çıkarılmış maddeler değil, D kararlarıyla belirlenen EXEC-2 kapsamıdır. Kaynaktaki dimension metnini göstermek kapsam içidir.

## R maddesinin kapanması

Gemini önce IMPLEMENTER_VERIFIED kaydı ve kanıtları verir. Astra doğru kod snapshot'ını inceleyip test/ekranları bağımsız doğrular. Bir R için bazı koşullar geçip bazıları çalışmadıysa R kapanmaz; alt sonuçlar ayrı yazılır. Production erişimi veya fiziksel cihaz yoksa yerel kod tamam olabilir ama ilgili ürün koşulu NOT_RUN kalır. “48/48 kod yazıldı” ile “48/48 kabul edildi” aynı ifade değildir.

## EXEC-2 alt koşul eşlemesi

[78 alt kabul kaydı](uygulama/ALT_KABUL_DURUMLARI.md) ana R paydasını değiştirmez. N01–N24 → R23/R24/R26/R30/R34/R35; V01–V18 → R05–R14/R21/R22/R24/R28/R45; C01–C12 → R12–R14/R17–R21/R24/R26/R27; F01–F24 → [30'daki satır eşlemesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md). İlgili alt koşul NOT_RUN/FAIL iken ana R kapatılamaz.
