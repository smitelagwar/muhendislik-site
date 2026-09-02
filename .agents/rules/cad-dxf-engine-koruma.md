# CAD / DXF Motoru Koruma Kuralı

Bu kural `/dokumantasyon` içindeki CAD, DXF, DWG veya DWF görüntüleme zincirine dokunan **tüm AI ajanları** için bağlayıcıdır: Gemini, Codex, ChatGPT, Claude, IDE ajanları ve otomatik refactor araçları dahil.

## Zorunlu okuma sırası

CAD/DXF ile ilgili herhangi bir kaynak dosyayı değiştirmeden önce şu belgeleri sırayla oku:

1. `docs/cad-dxf-engine/README.md`
2. `docs/cad-dxf-engine/BASELINE_MANIFEST.md`
3. `docs/cad-dxf-engine/ARCHITECTURE.md`
4. `docs/cad-dxf-engine/VISUAL_INTERACTION_CONTRACT.md`
5. `docs/cad-dxf-engine/AI_CHANGE_PROTOCOL.md`
6. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`

## Korunan production baseline

Çalıştığı bilinen tarihsel referans:

- Vercel Production deployment: `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`
- Vercel etiketi / commit mesajı: `IGNORE2`
- Golden Git commit: `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`
- IGNORE2'yi yeniden kuran restore commit: `afbc121923f2de1313801f884f428535334a40cf`

Bu kimlikler silinmez, yeniden tanımlanmaz ve yeni bir baseline ile sessizce değiştirilmez.

## Varsayılan davranış: MOTORU DEĞİŞTİRME

Kullanıcı açıkça CAD/DXF render motorunun kendisini değiştirmeyi istemediyse aşağıdakiler **yasaktır**:

- `cad-runtime-orchestrator.tsx` engine sırasını değiştirmek,
- `cad-upstream-viewer.tsx` ana çalışma modelini yeniden yazmak,
- `cad-viewer.tsx` içindeki `dxf-viewer` fallback hattını başka renderer ile değiştirmek,
- `dxf-viewer-worker.ts` parser/scene/worker yapısını yeniden tasarlamak,
- MLightCAD, LibreDWG veya `dxf-viewer` paketlerini sırf "daha yeni" diye yükseltmek,
- özel Canvas2D/OffscreenCanvas/WebGL renderer ekleyip çalışan hattın yerine geçirmek,
- fallback katmanlarını kaldırmak veya sıralarını değiştirmek,
- pan/zoom/fit davranışını opportunistik olarak yeniden tasarlamak,
- global prototype/monkeypatch eklemek,
- CAD sorunu çözmek için storage/auth/upload gibi ilgisiz katmanları değiştirmek.

UI'de ikon, metin, spacing, toolbar düzeni veya bağımsız review özelliği isteniyorsa motor iç koduna dokunma; değişikliği mümkün olan en dış katmanda yap.

## Açık kullanıcı talebi olmadan mimari değişiklik yok

Bir AI "bu motoru daha iyi yapabilirim", "bunu worker'a taşıyalım", "renderer'ı sıfırdan yazalım", "Three.js yerine Canvas kullanalım" gibi bir fikir üretirse bunu uygulamaz. Önce kullanıcıdan **motor mimarisini değiştirmeye açık izin** gerekir.

Kullanıcı motor değişikliğine açık izin verdiyse bile `AI_CHANGE_PROTOCOL.md` uygulanmadan kod değiştirilemez.

## STOP koşulları

Aşağıdakilerden biri varsa kendi başına çözüm üretme; dur ve kullanıcıya bildir:

- Golden baseline ile hangi davranışın korunacağı net değilse,
- görev motor değişikliği mi yoksa yalnız UI değişikliği mi belirsizse,
- değişiklik protected core dosyalardan birini gereksiz yere etkiliyorsa,
- dependency upgrade motor davranışını değiştirecekse,
- fallback kaldırılması gerekiyorsa,
- restore edilebilir bir backup/checkpoint yoksa,
- mevcut çalışan production davranışını doğrulayacak referans kaybolmuşsa.

## Talimat önceliği

1. Kullanıcının o anki açık talebi
2. Root `AGENTS.md`
3. Bu `cad-dxf-engine-koruma.md`
4. `docs/cad-dxf-engine/*`
5. Diğer yaşayan CAD belgeleri
6. Tarihsel stage/plan belgeleri

Diğer yaşayan belgelerde "mimari serbestçe değiştirilebilir" gibi genel ifadeler bulunsa bile, CAD/DXF motoru için **bu özel koruma kuralı daha spesifiktir**.
