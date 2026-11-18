# P06 — Bağımsız statik sayısal altyapı

6 Kasım 2026. Kabul profili: açık mekanik verilerle doğrusal prizmatik 3B çubuk, düz dikdörtgen kabuk ve seçili radye kabuklarına alanla ölçeklenen Winkler teması. Bu kapsamda sayısal altyapı tamamlandı. Native/MS1 eşdeğerliği, yönetmelik uygunluğu, modal analiz veya nihai rapor kabulü verilmedi; bütün sonuçlarda `analysisApproved:false` kalır. P07 başlamadı.

## Yeni yol

`frame-element.ts` → `linear-structure.ts` ← `shell-rect.ts`; `sparse-spd.ts` ortak ayrıştırma çekirdeğidir. `frame-linear.ts` ortak çözücüye ince bir giriş verir. `mesh-rect-panel.ts` ortogonal açıklıklı ağ, `section-properties.ts` poligon kesit integralleri üretir. `solver-worker.ts` bağımsız tarayıcı işi girişidir. P05 JSON paketini bu API'ye dönüştüren uygulama adaptörü ve UI/rapor bağlantısı henüz yok; P17 entegrasyon kabulünün yerini bu testler almaz.

- Her düğümde üç ötelenme/üç dönme, açık yük, mesnet hareketi ve yay vardır. Birimler kN–m–rad; E/G kN/m², I/J m⁴, ks kN/m³. Mesnet hareketleri sağ tarafa taşınır; yay ve mesnet reaksiyonları ayrı saklanır.
- Çubukta eksenel, iki eğilme ve burulma; Euler–Bernoulli veya açık kesme alanlarıyla Timoshenko; açık yerel eksen/roll; rijit uç kaçıklığının moment kolu ve statik kondansasyonla uç salımı vardır. E/G/A/Iy/Iz/J ve kesme alanları açık girdidir. Poligondan ağırlık merkezi ve asal alan ataletleri hesaplanır, J veya kesme alanı uydurulmaz. Dönük asal kesitin roll etkisi bağımsız tensör dönüşümüyle test edildi.
- Her gerinim türünün rijitlik çarpanı yalnız bir kez uygulanır. Normatif çatlama katsayısı seçimi bu katmanda yapılmaz. Açık kullanıcı katsayıları TBDY kabulü sayılmaz.
- Kabukta Q4 düzlem gerilme membranı, MITC4 kenar bağlama ile Mindlin plak kesmesi ve açık `drillPenalty` katsayısıyla 2×2 entegre dönme cezası vardır. Sabit gerinim, rijit cisim, eğrilik/burulma enerjisi, ince/kalın plak, serbest iç membran/dönme serbestlikleri test edildi. Bu eleman genel çarpık/warped dörtgen veya OpenSees ASDShellQ4 eşdeğeri değildir; bu geometriler reddedilir.
- Ağ üretici panel ve dikdörtgen iç açıklık kenarlarını ortak koordinat çizgilerine koyar; açıklıklar doldurulmaz, yetim düğüm oluşturulmaz. Döşeme, dik perde ve radye aynı 3B kabuk dönüşümünü kullanır. Genel poligon/üçgen/çarpık panel ağı desteklenmiyor; otomatik izdüşüm veya kaba perde çubuğuna dönüşüm yok.
- Zemin yayı yalnız `foundation.shellIds` ile seçilen yatay radye elemanlarına atanır: kᵢ=ks×Aᵢ; Aᵢ her bağlı radye hücresi alanının dörtte biridir. Üst yapı ve radye aynı düğüm serbestlikleriyle çözülür; üst katlara zemin yayı eklenmez. Bilateral ve çekme taşımayan aktif temas ayrıdır. Aktif küme değişimi, çevrim ve iterasyon bütçesi denetlenir; yakınsamama başarı değildir.

## Backend kararı ve kaynaklar

Yeni runtime bağımlılığı veya üçüncü taraf çözücü kodu eklenmedi. Projenin kendi TypeScript kaynaklarında simetrik seyrek assembly, köşegen ölçekleme ve doğal sıralı sağa ilerleyen LDLᵀ seçildi. Kod bu repo lisans koşullarına tabidir; bir dış çözücü lisansı varsayılmadı. Esbuild/Playwright mevcut geliştirme araçlarıdır. Bu teslimde WASM yok. Binlerce DOF için dense matris/invers oluşturulmaz.

CG tek başına sıfır sağ taraflı mekanizmayı sertifikalandırmadığı için kabul çekirdeği yapılmadı. Ölçekli pivot≤1e-12, pozitif olmayan köşegen, simetri/nonfinite bozukluğu, kaynak bütçesi, iptal ve artık hatası açık sonuçtur; köşegene rijitlik eklenmez, küçük pivot sıfır deplasmanla geçilmez, LU/ampirik çözüme fallback yok. Varsayılan faktör bütçesi2m, büyük benchmark/Worker için açık4m girdidir. Çalışma matrisi de bütçelenir. Faktör katsayılarının iç döngüde tekrar Map araması yerine önceden alınması fiziği/toleransı değiştirmeyen ölçülmüş optimizasyondur. Doğal sıralama daha büyük/uygunsuz ağda pahalılaşabilir; bütçe hatası uygunluk üretmez.

P07 özdeğer yolu için seçim: aynı simetrik sparse assembly ve yeniden kullanılabilir LDLᵀ faktörü üzerinde ters iterasyon/Lanczos alt uzayı. Faktörün tekrar kullanım API'sı, kütle matrisi, ortogonallik, özdeğer artığı ve katılım kabulü P07'de yapılacak; şu anda çalışan özdeğer motoru veya modal PASS yok. Eski kat bazlı dense Jacobi binaya büyütülmez.

Runtime modüllerinde Node/Windows/native uygulama bağımlılığı yok; esbuild `platform:browser` paketi gerçek Chromium Blob Worker'ında çalıştı. Senkron faktör işi `Worker.terminate()` ile host tarafından iptal edilir; ana iş parçacığı canlılık sayacı ve sonuçsuz iptal sınandı. Bu henüz UI iptal düğmesi değildir. Linux için native DLL/EXE/WASM dağıtım gereksinimi yok; case-sensitive importlar ve Next üretim paketlemesi ilgili CI/build kapısında korunmalıdır. Bu aşamada gerçek Linux/Next production build koşulmadı, Linux READY iddia edilmiyor. Uygulama TypeScript sonucu TASKS/TEST_MATRIX'dedir.

Birincil yöntem kaynakları: [Netlib CG/SPD koşulu](https://netlib.org/linalg/old_html_templates/subsection2.6.3.1.html), [OpenSees ASDShellQ4 yöntem açıklaması](https://opensees.github.io/OpenSeesDocumentation/user/manual/model/elements/ASDShellQ4.html), [OpenSees ShellMITC4](https://opensees.berkeley.edu/OpenSees/manuals/usermanual/640.htm). Yöntem ayrımını açıklamak için okundu; harici kaynak kodu kopyalanmadı veya başka çözücüyle sayısal eşitlik iddia edilmedi.

## Eski fem-solver.ts işlevlerinin kararı

Eski dosya bu aşamada değiştirilmedi. Aşağıdaki sınıflandırma yeni kabul yoluna ilişkindir; legacy UI çağrılarının tamamını kaldırmak ayrı entegrasyon işidir. Sürümlü P03 projeler eski motorla hesaplanmaya zaten kapalıdır.

| Eski dışa açık öğe | Karar | Somut gerekçe/yeni yol |
|---|---|---|
| TBDY_2018_CRACKED_MODIFIERS | İyileştirilecek, normatif kabul yok | Kaynak/eleman/etki bazında P08–13 seçimi; yeni motor yalnız açık çarpan alır |
| buildLocal12DOFStiffnessMatrix | Kabul yolundan kaldırıldı/yenilendi | J'ye f_crack=1 iken dahi gizli min azaltması; yeni frameLocalStiffness ayrı katsayı/kesme/salım testleriyle |
| build3x3RotationMatrix | İyileştirildi/yenilendi | Yeni localFrame açık up/roll ve dejenerasyon reddi; eski otomatik referans ekseni kanıtsız taşınmadı |
| buildTransformationMatrix12DOF | İyileştirildi/yenilendi | Yeni dönüşüm gerçek rijit uç kaçıklığını da taşır; moment kolu oracle'ı geçti |
| transformStiffnessToGlobal | İyileştirildi/yenilendi | Yeni TᵀKT; döndürülmüş/ötelenmiş çubuk ve dik kabuk testleri |
| generate32LoadCombinations | İyileştirilecek; kabul yok | Aktif modele bağlı işaret/kombinasyon gereksinimi P07, sabit liste kullanılmıyor |
| choleskyDecomposition | Bina kabul yolundan kaldırıldı | Dense saklama; yeni sparse LDLᵀ rank/artık/bütçe denetimi |
| choleskySolve | Bina kabul yolundan kaldırıldı | Ayrı artık/başarısızlık sözleşmesi eksik; yeni kernel |
| luDecomposition | Kabul yolundan kaldırıldı | Küçük pivotta eliminasyonu atlıyor; ayrıştırma başarısızlığını açık üretmiyor |
| luSolve | Kabul yolundan kaldırıldı | Küçük köşegende x=0 döndürüyor; yeni yolda yasak |
| jacobiEigenvalue | İyileştirilecek; P07 kabulü yok | Küçük oracle'da ayrıca incelenebilir; binanın dense özdeğer yolu olamaz |
| calculate11MemberStations | İyileştirilecek; kabul yok | Eski sabit uç kuvvet işareti/istasyon yolu yeniden kullanılmadı. Yeni gerçek uç kuvvetleri Kd−f ve salım geri kazanımıyla; kesit boyunca tasarım P09 |
| solve3DStructuralMesh | Yeni kabul yolundan kaldırıldı | Küçük köşegene1000 ekleme, LU fallback, eksik referansı atlama, varsayılan kat kütlesi, en çok3mod ve ampirik periyot kırpma var. Yeni bağımsız yol bunları kullanmaz |

## Gerçek doğrulama

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-06`.

- `closure-tests-refined`:32/32,skip0. Analitik çubuk/konsol, iki açıklıklı sürekli kirişin üç moment teoremi, 3B eksenel/iki eğilme/burulma, kesme, roll/ötelenme, kaçıklık, salım, mesnet hareketi/yay, sıfır yüklü mekanizma ve kopuk parça; poligon ataletleri, kabuk enerji patch'leri ve tür bazlı çarpanlar; bağımsız Navier seri toplamıyla ince/kalın plak4/8/16ağ (<%1); radye2/4/8ağ, açıklık alanı, eksantrik temas/denge ve iterasyon tükenmesi; açıklıklı dik perdenin8/16/32/64ağ yakınsaması (<%3 son değişim); çerçeve–radye/fiks taban farkı; ağ/bozuk veri/bütçe/iptal negatifleri.
- İlk iki patch testi test kodundaki düğüm sırası/fonksiyon çağrısı hatasıyla başarısızdı; düzeltildi, log saklı. Açıklıklı perdenin4/8/16/32 koşusu son fark%4,7057 ile önceden seçilen%3 sınırını geçmedi. Tolerans gevşetilmedi;64e inceltme geçti. Referans dosyadan sayı sabitleme yok.
- Son büyük karma ağ:1600düğüm,4224çubuk,1176kabuk,9600toplam/9216serbestDOF; yerel84,96s, RSS719.056.896byte,3.406.447faktör girdisi, bağıl artık7,56e-13, maksimum denge artığı1,68e-8. Önceden seçilen120s/1,5GB/4m/1e-4sınırları geçti. Bu sentetik ölçek kanıtıdır; native dosyanın malzeme/yük/eşdeğerlik kanıtı değildir.
- Aynı son karma ağ gerçek Chromium Worker'ında73,97s; aynı artık/denge; ana iş parçacığı canlı, geçersiz veri reddedildi, terminate sonrası sonuç gelmedi. `browser-worker-final/result.json` gerçek koşuyu saklar. Önceki test harness TSX `__name` hatası başarısız loguyla korunur; harness .mjs düzeltmesi sonrası geçti.
- Son lint, genel/uygulama tsc ve koruma/hash sonuçları TASKS/TEST_MATRIX/closure dosyasındadır. Genel repo borcu temiz sayılmaz. Native yeni REA/ideCAD koşusu, kurum PDF'si veya build/deploy bu aşamada yapılmadı; önceki somut REA parser/G-Q kanıtları korunur.

Gerçek sonuç; yöntem/sürüm, DOF/nnz/faktör, minimum ölçekli pivot, artık, toleranslar, temas iterasyonu ve kuvvet/moment dengesini taşır. P-Delta ve geometrik nonlineerlik false. Serbestlik/oran/kaynak bütçesi hatasında PASS yok. Genel çarpık kesit/kabuk, keyfi açıklık, nonlineer malzeme, uplift çevrimi veya desteklenmeyen temas başarısız/unsupported kalır. Sonraki P07 için kullanıcı devam komutu beklenir.
