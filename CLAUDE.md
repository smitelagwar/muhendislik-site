# CLAUDE.md — Claude / AI çalışma başlangıcı

**Codex/ChatGPT CLI işi varsa ZORUNLU:** Komuttan önce [.agents/rules/codex-cli-kullanimi.md](.agents/rules/codex-cli-kullanimi.md) ve bağlantı verdiği `codex-cli/SKILL.md` okunur.

**Antigravity CLI (`agy`) işi varsa ZORUNLU:** Komuttan önce [.agents/rules/antigravity-cli-kullanimi.md](.agents/rules/antigravity-cli-kullanimi.md) ve orada bağlantısı verilen `antigravity-cli/SKILL.md` okunur.

**ZORUNLU:** Önce `PROJECT.md`, sonra `AGENTS.md`, ardından ilgili `.agents/rules/*.md` okunur. Bu dosya farklı bir yazma veya deploy izni oluşturmaz.

ideCAD masaüstü işinde [kontrol kuralı](.agents/rules/idecad-masaustu-kontrolu.md) ve [güncel kılavuz](docs/hsyncad/IDECAD_DESKTOP_WORKFLOW.md) okunur. Ekran görüntüsü ve normal GUI adımları yetkili araçla ajan tarafından yapılır; eski teşhis istemleri kullanıcıya devredilecek iş listesi değildir.

CAD V1 DWG/DXF görüntüleme, OSNAP, ölçüm, inceleme araçları, markup, toolbar, pointer, katman veya export işinde **`.agents/rules/cad-dxf-engine-koruma.md`** ve **`.agents/rules/cad-v1-review-kurallari.md`** zorunludur. Bu kuralların işaret ettiği baseline, ADR ve yaşayan CAD belgelerini izle.

V1 görüntüleme motoru korunur; önce mevcut review tuşları geliştirilir, ham DWG/DXF kaynak verisi değiştirilmez. V2 server engine ve gerçek DWG entity editing ayrı kapsamdır. MLightCAD/CADCraft kaynakları alınmadan sürüm, API, lisans/alt bağımlılık ve attribution değerlendirilir. Geçmiş PASS iddiasını yeni test gibi sunma; gerçek repo ve browser kanıtını kullan.

`AGENTS.md` gereği uzaktan AI `main`e ara commit atmaz; kullanıcı istemedikçe Preview/Production deploy yapmaz.
