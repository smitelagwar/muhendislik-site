# 13 — Deney kartları ve uygulama iş paketleri

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Yol haritası](12_YOL_HARITALARI.md) · [Rapor şablonu](sablonlar/DENEY_RAPORU.md)

Bu backlog başlangıç önerisidir. İş paketleri otomatik olarak ayrı commit veya ayrı task anlamına gelmez. Aynı anlamlı checkpoint'e ait değişiklikler yerelde toplanabilir. Paket tamamlanma ölçüsü dosya sayısı değil, aşağıdaki somut çıktıdır.

## İlk kararları çözecek deneyler

| ID | Soru / tek değişken | Girdi ve yöntem | Sonuç / eleme işareti |
|---|---|---|---|
| E01 | Gerçek legacy kritik yolu nerede? | R001–R004, cold/warm, host dışından timing | Route/fetch/decode/scene/GPU dağılımı; eski raporlar güncellenir |
| E02 | Hangi decoder yeterli veri veriyor? | Aynı hash, en az iki uygulanabilir aday, numeric/metadata diff | Missing entity/text/layout listesi; lisans ve failure sınıfları |
| E03 | Packed scene değerli mi? | Aynı decode sonucu object vs packed export | Serialize/transfer/import süreleri + toplam peak RAM |
| E04 | Özel renderer gerçek paftayı iyileştiriyor mu? | Aynı decoder, aynı ROI/font/style; legacy ve V2 | Fidelity eşliği + first-useful/frame p95 |
| E05 | Block instancing gerçekten tasarruf sağlıyor mu? | Tek definition çok instance; sonra farklı BYBLOCK/ATTRIB | Expanded ve instanced scene RAM/draw call; order eşliği |
| E06 | Exact font/SHX yolu doğru mu? | Türkçe + sembol + rotation + width + nested insert | Glyph/ankraj ve kritik crop; yanlış advance varsa tasarım değişir |
| E07 | Hatch yöntemi ölçekleniyor mu? | Solid, delik/ada, yoğun pattern, büyük koordinat | Topoloji + render/order + compile maliyeti |
| E08 | Hazır sahne telefonu rahatlatıyor mu? | R003/R004; aynı cihazda raw cold vs scene cold | Network, RAM, pil/ısınma, full-ready; quality farkı görünür |
| E09 | Cache kazancı nerede? | RAM, disk, server cache ayrı | Reopen ve invalidation; yanlış revision/font testi |
| E10 | Offscreen/WASM/WebGPU yatırımına değer mi? | E01/E04'teki gerçek baskın alt iş, tek backend değişimi | Aynı kaliteyle toplam fayda; küçük kazanç/karmaşıklıkta ertele |

E10'u her teknolojiyi denemek için değil, çözülememiş ölçülmüş soruna yanıt için öneriyorum. Bir adayın ilk dosyada açılmaması bütün kütüphanenin değersizliğini göstermez; beklenen/eksik özellik sınıfı yazılır. Aday trial'a erişilemiyorsa durum NOT RUN kalır.

## Uygulama paketleri

| ID | Çıktı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|
| W01 | Güncel source/asset/fixture manifesti | Repo okuma | Core fingerprint ve kullanıcı verisi izolasyonu |
| W02 | Legacy dış ölçüm harness'i | W01 | T-intent ölçümü; network alanları doğru; ham repeat verisi |
| W03 | Format sniff/byte/encoding sınırı | W01 | ASCII/binary DXF, AC1032, yanlış uzantı, UTF-8/codepage fixture |
| W04 | İlk decoder adapter + diagnostics | E02, W03 | Semantik kayıtlar ve unknown sayacı; bounded error |
| W05 | Canonical kimlik/units/transforms | W04 | OCS/block/instance/Float64 oracle |
| W06 | Scene schema + binary reader/writer | E03, W05 | Offset/checksum/version/decoded byte doğrulaması |
| W07 | İlk render planı ve WebGL2 backend | W06 | LINE/ARC/polyline + fit/pan/zoom ve dispose |
| W08 | Block instancing ve layer/style | W05, W07 | Nested BYBLOCK/layer0/attrib, görünürlük eşliği |
| W09 | Text font resolver ve layout | W04, W07, E06 | Exact/degraded font, Türkçe, rotation/width/MTEXT |
| W10 | Dimension/leader görünüşü | W08, W09 | Kaynak text override ve anonim block fixture |
| W11 | Hatch/stroke/order/clip | W07, W08, E07 | Delik/ada, wipeout, dash fazı, linewidth |
| W12 | Layout/viewport/dependencies | W08–W11 | Pafta/twist/frozen/XREF invalidation |
| W13 | Spatial chunk ve scheduler | W06, W11 | Bölge sınırı equivalence, backpressure, iptal |
| W14 | Persistent cache | W06, W13 | Quota/revision/font/dependency corruption recovery |
| W15 | Server compiler pilotu | W06, E08 | Tek source revision için atomik scene |
| W16 | Durable queue ve private scene API | W15 | İşçi ölümü/retry/revocation/stale job testleri |
| W17 | Mobil gestures ve capability | W07, W13 | Gerçek iOS/Android; pinch anchor, resize, context loss |
| W18 | Ayrı V2 host + error boundary | W07, W09–W13 | A→B yarışları, explicit active engine, kaynak cleanup |
| W19 | Dosya menüsü ve route | W18 | Liste/grid/klavye/mobil, aynı source yetkisi |
| W20 | Public share V2 alt etabı | W19, W16 gerekiyorsa | Public yetki/lease/cache; admin API bypass yok |
| W21 | Holdout ve release raporu | Seçilen ürün yolu | Numeric/visual/perf/security + legacy regression |
| W22 | Lisans/asset/işletim devri | W04 ile başlar, W21 ile kapanır | Pinned source/notice/font rights, rollback ve bütçe |

W09 ve W11 araştırmaları W07 bitmeden ayrı sentetik harness ile başlayabilir. W15/W16 yalnız B yolu seçilirse gerekir. W20 public kullanım gerekiyorsa ürün kapsamına girer. Ölçüm/annotation araçları W21'e gizlice eklenmez; desteklenecekse W05/W12 üstüne ayrıca iş paketi ve oracle tanımlanır.

## Paralel çalışma önerisi

Uygulamada bağımsız roller yararlı olabilir: decoder/corpus, geometri/renderer, text/fidelity, entegrasyon/erişim, bağımsız doğrulama. Küçük ekipte aynı kişi farklı zamanlarda üstlenebilir; multi-agent desteği varsa alt görevlerin kapsamı ayrı dosya/çıktı sınırlarıyla verilebilir.

Ortak scene schema, identity ve kalite durumları için tek karar sahibi önerilir. Bir ajan binary şemayı değiştirirken diğeri eski şemaya göre renderer yazarsa görünüş ve debug zorlaşır. Paralellik önce bağımsız araştırmada; ortak protokol ve mutasyonlarda koordinasyonla kullanılabilir. Her pakette yeni kullanıcı task'ı veya remote branch açmak gerekmez.

## Her paket için küçük teslim sözleşmesi

Önerilen kayıt: problem, girdiler/hash, değişen katman, korunacak davranış, yöntem, çalıştırılan gerçek komutlar, ham sonuç yolu, başarısız kontroller, karar ve bir sonraki bağımlılık. Kanıtı olmayan PASS yazılmaz. Test üretim dosyasını değiştiriyorsa paket hazır sayılmaz.

## İlk uygulama oturumu için dar hedef

W01/W02/W03 ve E01/E02'yi başlatmak güçlü adaydır. Ama ilk SDK erişimi gecikiyorsa W05 için analitik fixture'lar, menu dış seçim taslağı ve cache identity tasarımı bağımsız ilerleyebilir. “ODA yanıtı bekleniyor” bütün teknik çalışmanın durma nedeni olmak zorunda değil.

İlk oturumun ideal somut sonucu bir yeni viewer iddiası değil, **hangi decoder/sahne yolunun bu gerçek dosyalarda denenmeye değer olduğunu gösteren karar tablosu ve çalışan bir ölçüm ortamı**. Sonraki oturum bu kanıtı okuyup dikey prototipe geçer.
