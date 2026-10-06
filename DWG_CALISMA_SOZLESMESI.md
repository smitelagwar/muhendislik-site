# DWG Motor V2 — 3–4 işi tek turda tamamlama sözleşmesi

Sözleşme revizyonu: 27 Eylül 2026 — v2. Bu tarih, ürün kodunun veya testlerin son doğrulama tarihi değildir.

## 1. Amaç ve talimatın kapsamı

Kullanıcı bu dosyayı açıkça uygulamanı istediğinde, DWG Motor V2 / Fidelity v3 çalışmasının yürütme düzeni budur. Önceki “en küçük alt aşamayı seç”, “tek alt paket doğrulanınca dur” ve “ana paketin bütün işleri bitmeden durma” talimatlarının yerine geçer. Ana planın teknik kabul şartlarını değiştirmez. Sistem/geliştirici talimatları ve kullanıcının daha sonraki açık yönlendirmeleri geçerlidir.

Kullanıcı her adımda yeni talimat yazmak istemiyor. Bir kez bu sözleşmeyi etkinleştirdikten sonra yalnız “devam”, “devam et” veya “kaldığın yerden devam et” demesi yeterlidir.

Hedef uzun süre çalışmış görünmek değil, aynı kabul amacına hizmet eden işleri topluca bitirmektir. Asgari dakika, komut, dosya veya test sayısı yoktur. İş gerçekten tamamlandıysa süreyi doldurmak için çalışma üretme.

## 2. Bir “devam”ın kesin anlamı

Bir “devam”, sabit kapanış listesinden **önceden ayrı turlarda yapılan yaklaşık 3–4 anlamlı alt işi, ilişkili doğrulamalarıyla birlikte tek çalışma grubunda toplama** yetkisidir. Bütün ana paketi veya fazı tek turda bitirmek zorunlu değildir. Kod yazma, test ve belgeyi üç ayrı iş sayarak bu hedefi yapay biçimde doldurma; bunlar her işin tamamlanma parçalarıdır.

- Devam eden ana paket varsa onu sürdür; her mesajda yeni kolay bir alt iş seçme.
- Başlangıçta bu tur yapılacak yaklaşık 3–4 ilişkili işi kısa listele; onay beklemeden uygula. Mevcut kanıtların incelenmesi ve test süreleri dahil hedef toplam süre yaklaşık 30–60 dakikadır. Bu bir süre garantisi veya doldurulacak asgari süre değildir.
- “Anlamlı iş”, gözlenebilir bir davranışı veya sabit kabul maddesini kapatan değişikliktir. Dosya okuma, tek assertion, belge eki veya aynı davranışın unit/browser adımı ayrı iş değildir. Üç küçük işi yapay biçimde dörde bölme. Bir iş gerçekten büyükse onu ve gerekçesini başta belirt; daha az işi bu turda seçebilirsin.
- Grubun ilk küçük işi bitince durma; zaman bütçesi içinde diğerlerine ilerle. Her iş için gerekli kod, oracle ve doğrulamayı birlikte ele al.
- Yaklaşık 45. dakikada yeni iş eklemeyi bırakıp doğrulama ve kayda öncelik ver. Test/araç timeout'larını kalan bütçeye göre seç; 60 dakika dolunca yeni geliştirme veya test başlatma. Kendi başlattığın devam eden işlemi güvenli biçimde bitir ya da sonlandır, kanıtı kaydet ve cevap ver. Bu kapanış için en fazla yaklaşık 5–10 dakika ayır; bu süre yeni düzeltme döngüsü yetkisi değildir. Böylece “test hâlâ sürüyor” gerekçesiyle saatlerce uzatma. Araç/platform engeli nedeniyle zaman kontrolü mümkün değilse bunu açıkça raporla.
- Grup erken tamamlanırsa dur; süre doldurmak için ek iş üretme. Beklenmeyen karmaşıklık nedeniyle yalnız 1–2 iş bittiyse zaman bütçesinde durup somut nedeni ve kalanı bildir. Gereksiz inceleme veya test tekrarıyla süreyi tüketme.
- Ana paket veya faz grup bitmeden kapanırsa doğrulayıp dur; yalnız 3–4 sayısını doldurmak için yeni faza geçme. Sonraki “devam”, bağımlılıklara göre sıradaki açık paketten yeni bir çalışma grubuna geçme yetkisidir.

Bir paketin bütün yerel işleri bitip yalnız doğrulanmış dış bağımlılığı kaldığında, o paketi açık/BLOCKED olarak koruyarak turu kapat. Sonraki “devam”da ana planın izin verdiği bağımsız yerel paketi seç; aynı dış engeli her tur tekrar araştırma. Bağımlı bir kabul kapısını atlama ve bütün faza PASS verme. Çalışılabilir bağımsız iş de yoksa kullanıcıdan gereken somut girdiyi iste.

## 3. Paket boyutunu sonradan küçültme

İlk uygulamada mevcut sabit listeyi güncel kod ve ana planla eşleştir. Var olan F07 iç R01–R11 kimliklerini koru; bunları ana plandaki R01 production paketiyle karıştırma.

Her ana paket için mevcut izlenebilirlik belgesinde şu alanları tut:

| Alan | İçerik |
|---|---|
| Kimlik ve amaç | Mevcut sabit listedeki paket ve kapatacağı gerçek eksik |
| Zorunlu işler | Sonlu, kimlikli kabul maddeleri; gereken profil ve bağlamlar |
| Bitiş kanıtı | Her maddeyi doğrulayacak ölçüm/test/artefakt |
| Bağımlılıklar | Başka paketten veya dış erişimden gereken somut girdiler |
| Durum | PASS / OPEN / FAIL / BLOCKED / NOT_RUN; kanıt bağlantıları |

Bu tabloyu kısa hazırladıktan sonra onay beklemeden uygulamaya geç. Sadece tablo hazırlamak için turu bitirme.

Ana paket büyükse kabul tanımını koruyarak birkaç tura yay; her tur için yaklaşık 3–4 işlik grup seç. Mevcut işler küçük test hücreleriyse ilişkili olanları topluca ele al. Yeni kimlikler üretip tamamlanma sayısını şişirme. Turun kapsamını sınırlamak, ana paketin kabul kapsamını daraltmak değildir; kalan maddeler açık listede kalır.

Yeni zorunlu madde yalnız ana plandaki açık bir gereksinim veya ölçülmüş somut kusurla eklenebilir. İsteğe bağlı iyileştirmeleri ayrı not et; bunlarla bitiş çizgisini sürekli uzatma. Matris sonsuz kombinasyon listesi değildir: desteklenen kapsamı ve sınır durumlarını ana plandan türet, kabul tanımını başlamadan sabitle.

## 4. Durmaya izin veren koşullar

Normal final cevap ve “sonraki devamı bekleme” yalnız şu durumlarda uygundur:

1. **TUR GRUBU TAMAMLANDI:** Başta seçilen işler ve gerekli doğrulamaları bitti. Ana paketin kalan maddeleri varsa açık tut; ana paket tamamlandı deme.
2. **ZAMAN BÜTÇESİ:** Yaklaşık 60 dakikalık tur sınırına ulaşıldı. Yeni iş başlatma; tamamlananları, doğrulanmamış değişiklikleri ve tam devam noktasını kaydet. Test bitmediyse PASS deme.
3. **DIŞ ENGEL:** Grup içinde yapılabilir bağımsız iş kalmadı; kalan koşullar gerçekten kullanıcı dosyası, fiziksel cihaz, erişim veya dış hizmet gerektiriyor. Eksik girdiyi ve etkilediği maddeyi açıkça yaz. Paketi PASS gösterme.
4. **ZORUNLU KESİNTİ:** Kullanıcı durdurdu veya gerçek platform/kullanım/araç sınırı devamı engelledi. Tamamlandı deme; kalan tam maddeyi ve yeniden başlama noktasını kaydet.

Turun zaman bütçesi dolmadıkça, bir testin geçmesi, bir belge ekinin bitmesi veya bağlamın daraltılması tek başına durma nedeni değildir. Derleme/test hatalarını yetkili kapsam ve kalan süre içinde çöz; çözülemeyenleri açık kaydet. Bağlam daraltılması tur saatini sıfırlamaz. Başlangıç ve kontrol zamanlarını mevcut saat aracıyla ölç; süre uydurma.

Bağımlılığın bir kolu engelliyse seçilen grupta yapılabilen diğer işlere kalan süre içinde ilerle. Gerçek dış engeli yeni işler icat ederek gizleme.

## 5. Güncel hedefi seçme; eski işe dönmeme

26 Eylül son incelenen kayıtta etkin görev “F07 paketine devam et”, çalışma ağacı `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali` idi. Çok terimli desen, bulge/kapalı/nokta, kalın çizgi ve aynalı LINE/pafta için dört dar kapsamlı kabul kaydı vardı. R07 geniş kapsamı açıktı. Bu bir tarihsel başlangıç bilgisidir; her tur R07'ye dönme talimatı değildir.

İlk ve sonraki grupları `DWG_PLAN_DURUMU.md` içindeki en güncel konumdan seç; son sohbet/kod/kanıt panelden yeniyse önce paneli düzelt. Aynalı LINE/pafta veya başka tamamlanmış işi sırf bu dosyada adı geçtiği için yeniden yapma. R07 hâlâ aktifse açık E/F/G kapsamından bütçeye uygun somut işleri seç; ilerlediyse yeni konumdan devam et. Ana paket kapsamını bir turda zorla bitirmeye çalışma.

Shape/text, dot, kalınlık ve diğer desenlerin destek/fallback/tanı sözleşmesini ana plandan doğrula. CPU fallback bulunması kendi başına doğru görünüş kanıtı değildir. Planın zorunlu tuttuğu davranışı “desteklenmiyor” diyerek kabul kapsamından çıkarma.

Aynı-kaynak native AutoCAD ve fiziksel cihaz kanıtları R10/R09 ile ilişkiliyse, ortak kanıtın sahibini ve bağımlılığını bir kez açıkça yaz. Kanıtı ne iki kez üret ne de başka paketin adı altında kaybettir. R07 için zorunlu dış kanıt eksikse “yerel işler tamamlandı, nihai kabul BLOCKED/NOT_RUN” de; tam PASS deme. F08 bellek/yaşam döngüsü şartlarını F07'ye ekleyerek kapsamı büyütme.

## 6. Kaynak ve kanıtın korunması

Oturum başlangıcında `PROJECT.md`, `AGENTS.md` ve göreve ilişkin `.agents/rules` dosyalarını oku. Aynı oturumdaki her “devam”da değişmeyen bütün belgeleri baştan tarama; değişen dosyaları, aktif kapsamı ve paneli kontrol et. Ana plan:

`C:\Users\hsyn\Downloads\DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md`

Başlangıçta etkin worktree yolunu, branch/HEAD, dirty/untracked dosyaları ve compiler/pipeline/ABI kimliklerini doğrula. Eski v42/p19 ağacındaki işleri 91a0'da otomatik mevcut sayma. Kaynaklar farklıysa tarihsel belgeyi çalışan kodun yerine koyma. Dosya kaybı kanıtı olmadan yeniden worktree/handoff/kurtarma döngüsü başlatma.

Bu sözleşme asıl depo kökünde durur; uygulama kodu doğrulanmış etkin worktree'de geliştirilir. Sözleşmenin konumu checkout değiştirme veya dirty dosyaları taşıma yetkisi değildir.

Kullanıcı değişikliklerini ve mevcut test/fixture kanıtlarını koru. Silme, resetleme, stash, taşıma, körlemesine üzerine yazma yapma. Commit, push, PR, merge, deploy veya worktree arşivleme yapma. Ara kayıt için bunların hiçbirine ihtiyaç yoktur.

## 7. Verimli doğrulama

- Önce belirli değişiklikle ilgili testleri çalıştır; ilişkili düzeltmeleri toparladıktan sonra gerekli ortak regresyonları tur grubunun sonunda çalıştır. Doğrulama ve kayıt için tur bütçesinde zaman ayır. Aynı başarılı geniş zinciri her küçük editte tekrarlama.
- Başarısız testte önce ürün kusuru, test/oracle kusuru ve ortam hatasını ayır. Aynı bozuk komutu açıklama olmadan yeniden çalıştırma.
- Geçsin diye toleransı büyütme, başarısız profili listeden çıkarma veya kabul koşulunu değiştirme. Test varsayımı hatalıysa bağımsız kanıtla düzelt; önce/sonra gerekçesini kaydet. Karşılanmayan ilk hedef açık kalır.
- Eski test sonucunu yeni çalıştırılmış gibi sunma. Genel typecheck başarısızsa runtime typecheck başarısıyla bütün kontrolü PASS gösterme; mevcut ve yeni tanıları ayır.
- Test otomasyon standardına uy; timeout kullan ve kendi başlattığın süreçleri kapat. Kullanıcının süreçlerine müdahale etme. Benzersiz çıktı yolları ve doğrulanmış mevcut test yapılandırmasını kullan.
- Beş yaşayan belgenin zorunlu eklerini tur sonunda topluca yap; önceki byte içeriklerini koru. Her küçük test için beş belgeye tekrar tekrar aynı özeti ekleme.

## 8. Kalıcı hafıza ve rapor

Kullanıcının genel ve alt aşama durumunu izleyeceği tek güncel panel `C:\Users\hsyn\Desktop\muhendis-mimar-portali\DWG_PLAN_DURUMU.md` dosyasıdır. Her tur başlangıcında oku, sonunda üst özeti ve ilgili tabloları yerinde güncelle; kısa değişim günlüğünü koru. Paneldeki tarihsel bilgi/güncel kanıt ayrımına, üç düzeyli ilerlemeye ve kalan tur tahmini yöntemine uy. Bu panel ana teknik planın yerine geçmez; mevcut kanıtların kullanıcıya okunabilir özetidir.

Ayrıntılı paket/evidence izi mevcut `motor_v2/uygulama__IZLENEBILIRLIK.md` ve diğer yaşayan belgelerde kalır. Bu belgelerin eski içeriklerini koru; panel ile çelişen eski kayıt varsa yeni kaydın hangisini güncellediğini açıkça göster. Kullanıcı tarafından istenen bu panel dışında yeni paralel plan dosyaları açma. Bağlam daraltılması veya yeni sohbette paneli ve sözleşmeyi yeniden oku; işi baştan başlatma. Her iki dosya asıl depoda bulunsa da uygulama etkin worktree'de sürer; dosyaları otomatik kopyalama/taşıma yapma.

Çalışırken 60 saniyeden fazla sessiz kalma. Kısa ilerleme mesajı, final cevap veya yeni kullanıcı onayı gerektirmez.

Tur sonunda kısa Türkçe rapor:

1. Ana paket kimliği, bu tur seçilen/biten işler ve durma nedeni: GRUP TAMAMLANDI / ZAMAN BÜTÇESİ / DIŞ ENGEL / ZORUNLU KESİNTİ.
2. Gerçek davranış değişikliği ve çalıştırılmış doğrulama.
3. Paket içindeki kapanan/toplam zorunlu madde; eksiklerin açık kimlikleri.
4. F07 terminal kapılarının ayrı durumu. %67 gibi keyfî ağırlıklı oranlar kullanma.
5. Sonraki “devam”da ele alınacak yaklaşık 3–4 işlik grup veya zorunlu kalan düzeltme.
6. Genel plandaki konum, tarihsel/güncel kabul ayrımı; aktif iç iş, aktif faz ve tüm plan için kalan tahmini tur aralıkları, güven ve dış bağımlılıklar. Yöntem ve eksik tahminlerin gerekçesi `DWG_PLAN_DURUMU.md` içinde tutulur. Sonuçta panelin mutlak dosya bağlantısını ver.

Bu sözleşme çalışma kurallarının kaynağıdır; durum paneli güncel iş ve kanıtın kaynağıdır. Panelden yürütme kuralları, sözleşmedeki eski örneklerden güncel ürün durumu türetme. Bu iki dosyanın okunması, kullanıcı istemedikçe otomasyon kurma veya başka göreve mesaj gönderme yetkisi değildir.

Final öncesi kontrol: “Seçtiğim tur grubu bitti mi, zaman bütçesi doldu mu veya gerçek engel/kesinti var mı?” Hepsinin yanıtı hayırsa ilk küçük işin ardından durma; grubu sürdür. Ana pakette iş kalması, zaman bütçesini aşarak saatlerce devam etme gerekçesi değildir.
