# 16 — Kaynakça ve araştırmanın sınırları

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Aday değerlendirmeleri](03_ARASTIRMA_VE_ADAYLAR.md) · [Teslim durumu](17_TESLIM_VE_DURUM.md)

**Erişim tarihi: 5 Eylül 2026.** Aşağıdaki kaynaklar bu araştırmada açıldı veya birincil belgenin arama sonucuyla incelendi; teknik iddialarda üretici belgeleri ve proje sahiplerinin depoları esas alındı. Arama sonuçlarında görünen Reddit/Wikipedia içerikleri teknik kanıt olarak kullanılmadı. Kaynakların tamamı baştan sona denetlenmiş veya ürünleri test edilmiş değildir.

## Dosya biçimi ve CAD anlamı

| Kaynak | Bu araştırmadaki kullanım |
|---|---|
| [Autodesk — DWG format compatibility](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/AutoCAD-drawing-file-format.html) | Ürün yılı / dosya formatı ayrımı; 2026 tarihli tablo |
| [ODA — Open Design Specification for .dwg](https://www.opendesign.com/files/guestdownloads/OpenDesign_Specification_for_.dwg_files.pdf) | Sürüm 5.4.1; ham decoder Ar-Ge alanlarının kapsamı |
| [Autodesk — OCS](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-D99F1509-E4E4-47A3-8691-92EA07DC88F5.htm) | Entity türüne göre koordinat sistemi |
| [Autodesk — Arbitrary Axis Algorithm](https://help.autodesk.com/cloudhelp/2015/ENU/AutoCAD-DXF/files/GUID-E19E5B42-0CC7-4EBA-B29F-5E1D595149EE.htm) | Normal vektörden OCS eksenleri |
| [Autodesk — INSERT](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-28FA4CFB-9D5E-4880-9F11-36C97578252F.htm) | Ölçek, array, attrib ve extrusion alanları |
| [Autodesk — MTEXT](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-5E5DB93B-F8D3-4433-ADF7-E92E250D2BAB.htm) | Metin parçaları ve yerleşim alanları |
| [Autodesk — HATCH](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-C6C71CED-CE0F-4184-82A5-07AD6241F15B.htm) | Loop/ada ve dolgu stili |
| [Autodesk — VIEWPORT](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-DXF/files/GUID-2602B0FB-02E4-4B9A-B03C-B1D904753D34.htm) | Pafta, twist, clip ve frozen layer alanları |
| [Autodesk — LAYER](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-D94802B0-8BE8-4AC9-8054-17197688AFDB.htm) | Katman görünürlük ve plot ayrımı |
| [Autodesk — PROXYGRAPHICS](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Core/files/GUID-4205F367-F234-4BE3-86D5-81234684385F.htm) | Kaydedilmiş proxy görünüşü sınırı |
| [ezdxf — Document management](https://ezdxf.readthedocs.io/en/stable/drawing/management.html) | AC1021 sonrası UTF-8 ve eski codepage ayrımı |
| [ezdxf — Drawing add-on](https://ezdxf.readthedocs.io/en/stable/addons/drawing.html) | Bağımsız çizim referansının kendi sınırlamaları |

Eski yıl içeren Autodesk DXF sayfaları belirli format kavramları için kullanıldı; bunlardan 2027 SDK API uyumluluğu çıkarılmadı. ODA PDF'nin girişindeki sürüm kapsamı ifadesiyle içindekilerindeki R2018 bölümü arasında tarihsel tutarsızlık bulunuyor; doküman tek başına güncel decoder tamamlığı sayılmadı.

## Ticari seçenekler ve lisans

| Kaynak | Kullanım |
|---|---|
| [ODA Drawings](https://www.opendesign.com/products/drawings) | SDK ürün kapsamı |
| [ODA inWEB](https://www.opendesign.com/products/inweb) | Browser ürün ailesi |
| [DrawingWeb teknik başlangıç](https://cloud.opendesign.com/docs/drawingapi/index.html) | DWG/DXF browser API ve JS/WASM dosyaları |
| [ODA üyelik rehberi](https://www.opendesign.com/faq/question/how-can-i-join-open-design-alliance-and-use-your-sdks) | Web/SaaS üyelik modeli |
| [ODA fiyatlar](https://www.opendesign.com/pricing?language=en) | Tarihli bütçe girdisi; kesin teklif değil |
| [Autodesk RealDWG](https://forge.autodesk.com/developer/overview/realdwg-api) | Native SDK ve geliştirme platformu |
| [APS Model Derivative](https://aps.autodesk.com/developer/overview/model-derivative-api) | Hazır türev/Viewer hizmeti alternatifi |
| [APS external references](https://aps.autodesk.com/blog/setting-up-references-between-files) | Çok dosyalı proje bağımlılıkları |
| [MLightCAD ticari parser](https://github.com/mlightcad/cad-viewer/blob/main/PROPRIETARY-PARSER.md) | Sağlayıcı beyanları, fiyat, trial ve destek |
| [GNU LibreDWG overview](https://www.gnu.org/software/libredwg/manual/html_node/Overview.html) | Format kapsamı beyanı ve sınırlamalar |
| [GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html.en#UnreleasedMods) | Sunucuda kullanım ile kullanıcıya dağıtım ayrımı |

Hukuki uygunluk, satıcı performansı ve toplam ürün lisans uyumu bu kaynakları okumakla tamamlanmış sayılmaz. Ücret ve koşullar değişebilir; satın alınacak tam paket/sürüm ayrıca doğrulanır.

## GitHub araştırması

| Depo | Erişim |
|---|---|
| MLightCAD viewer | [Repo](https://github.com/mlightcad/cad-viewer) |
| MLightCAD LibreDWG bridge | [Repo](https://github.com/mlightcad/libredwg-web) |
| MLightCAD SHX | [Repo](https://github.com/mlightcad/shx-parser) |
| GNU LibreDWG mirror | [Repo](https://github.com/LibreDWG/libredwg) |
| ACadSharp | [Repo](https://github.com/DomCR/ACadSharp) |
| ezdxf | [Repo](https://github.com/mozman/ezdxf) |
| dxf-viewer | [Repo](https://github.com/vagran/dxf-viewer) |
| dxf-parser | [Repo](https://github.com/gdsestimating/dxf-parser) |
| libdxfrw | [Repo](https://github.com/LibreCAD/libdxfrw) |
| Flatbush | [Repo](https://github.com/mourner/flatbush) |
| Earcut | [Repo](https://github.com/mapbox/earcut) |
| HarfBuzz | [Repo](https://github.com/harfbuzz/harfbuzz), [COPYING](https://github.com/harfbuzz/harfbuzz/blob/main/COPYING) |
| msdfgen | [Repo](https://github.com/Chlumsky/msdfgen) |
| lyon | [Repo](https://github.com/nical/lyon), [MIT](https://github.com/nical/lyon/blob/main/LICENSE-MIT), [Apache](https://github.com/nical/lyon/blob/main/LICENSE-APACHE) |
| Clipper2 | [Repo](https://github.com/AngusJohnson/Clipper2) |

Her deponun araştırma anındaki tam commit'i ve commit URL'si [github-snapshot.json](arastirma/github-snapshot.json) içinde. README/lisans bilgisi ve metadata gözlemi ile kapsamlı kod audit'i farklıdır. Snapshot'lardaki default branch HEAD'i bir production dependency seçimi değildir. GitHub'dan kaynak kod alınarak uygulamaya eklenmedi.

[Issue örneklemi](arastirma/github-issue-ornekleri.json) yalnız sınırlı sayfaların başlık/metadata kaydıdır; kusurlar tekrar üretilmedi. Arama/indeksleme sonuçları ve canlı GitHub API metadata tarihleri farklı olabilir; bütün upstream API açıklamalarının tam olarak snapshot SHA'ya ait olduğu iddia edilmez. Uygulamada seçilen sürümün dosyaları yeniden okunabilir.

## Browser ve dağıtım

| Kaynak | Kullanım |
|---|---|
| [MDN WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) | Capability ve adapter/device başarısızlıkları |
| [MDN OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) | Worker rendering seçeneği |
| [MDN Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) | Buffer sahipliği ve aktarım |
| [MDN crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) | Shared memory önkoşulları |
| [MDN Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Browser cache kalıcılığı ve eviction |
| [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | GPU hot-path ve kaynak yönetimi |
| [Vercel Functions limits](https://vercel.com/docs/functions/limitations) | Büyük dosya ve native iş mimarisi sınırları |
| [OpenAI GPT-6 Astra rehberi](https://developers.openai.com/api/docs/guides/latest-model#gpt-6-astra-introduction) | Geliştirme ajanının rolü; CAD garantisi değil |

OpenAI belgesi resmi dokümantasyon arama/okuma aracıyla getirildi. Web SDK belgelerinde tarif edilen destek bu sitedeki fiziksel cihaz testinin yerine geçmez.

## Yerel kanıtlar ve araştırma boşlukları

Yerel kaynak/kurulu paket incelemesi: [02](02_REPO_INCELEMESI.md). Dosya hash/başlık/lexical DXF sayımı: [corpus](arastirma/yerel-corpus.json). Başlangıç dosya koruması: [fingerprint](arastirma/yerel-baslangic.json). Kullanıcı tarafından sağlanan öneri: [orijinal](girdi/SOL_TEKNIK_ONERILER_ORIJINAL.md).

Henüz elde olmayan kanıtlar: yeni motorun kodu, decoder yarışma sonuçları, gerçek AutoCAD referans görüntüleri, exact font/XREF tamlığı, gerçek iOS/Android ölçümleri, SDK trial erişimi ve hukuki dağıtım incelemesi, canlı üretim altyapı/plan bilgisi. Bunlar [iş paketlerine](13_IS_PAKETLERI.md) ve [risk kaydına](14_KAYNAK_VE_RISK_PLANI.md) bağlandı; varmış gibi raporlanmadı.
