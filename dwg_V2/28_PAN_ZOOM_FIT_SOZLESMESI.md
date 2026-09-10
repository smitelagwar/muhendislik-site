# 28 — Pan, zoom, sığdır ve giriş yaşam döngüsü

[Dizin](README.md) · [Kaynak seçimi](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md) · [Renderer](29_RENDER_VE_YASAM_DONGUSU.md) · [Alt kabul kaydı](uygulama/ALT_KABUL_DURUMLARI.md)

**EXEC-2 / R23,R24,R26,R35.** Gemini bu davranışları ve algoritmaları uygular. Yeni kontrol kütüphanesi, eşzamanlı ikinci gesture motoru veya 3D kamera eklemez. İlk doğrulama G04-B'de analitik fixture üzerinde, ikinci doğrulama G12'de gerçek çizimde yapılır.

## Tek giriş sahibi ve kamera köprüsü

Renderer canvas'ının üzerinde aynı boyutta, bordersız, CSS transform uygulanmayan tek şeffaf input div'i bulunur. D3 yalnız bu yüzeye bağlanır. Toolbar/panel/sheet bu div'in çocuğu değildir; üstündeki ayrı UI katmanıdır. Canvas pointer-events:none; input div touch-action:none, overscroll-behavior:contain. Sayfanın veya sheet'in touch-action'ı kapatılmaz. Keyboard odağı ve canvas açıklaması input yüzeyindedir. Çizim üzerindeki DOM metin katmanı input olayı yakalamaz.

Bir Document Studio içinde tek aktif V2 gesture sahibi vardır. Eski motor veya başka D3 grafiğiyle aynı anda window drag sahibi olunmaz. V2 kapanırken diğer sayfa/ajanın listener'larına dokunulmaz. D3 yeni input elementine yeniden bağlanabilir; renderer canvas'ını sırf gesture iptal edildi diye yeniden kurmak yok.

Kamera kaydı Float64: worldOrigin=[Ox,Oy], center=[Cx,Cy], unitsPerCssPixel=u>0, width=W, height=H. Merkez ve orijin world koordinatıdır. D3 lokal düzlemi q=[worldX-Ox, -(worldY-Oy)] kullanır; ekran y aşağı, CAD y yukarıdır. D3 dönüşümü p=k*q+[tx,ty].

```text
k = 1/u
tx = W/2 - (Cx-Ox)/u
ty = H/2 + (Cy-Oy)/u
Cx = Ox + (W/2-tx)/k
Cy = Oy - (H/2-ty)/k
worldAt(px,py) = [Cx+(px-W/2)*u, Cy-(py-H/2)*u]
```

World origin dosya/pafta başında compiler bbox merkezinden alınır. Three kamera GPU'daki camera-relative düzlemde [0,0,1] konumunda; hedef [0,0,0]; quaternion değişmez. Dünya center yalnız domain kamera kaydındadır; GPU'ya verilen relatif vertex'ten ikinci kez çıkarılmaz. left/right=±W*u/2, top/bottom=±H*u/2, zoom=1, near=0.1, far=10. Kamera projection ve world matrix güncellenir. Geometri z=0'dadır; painter order z koordinatıyla kodlanmaz. GPU hassasiyet köprüsü ayrıca 29'dadır.

Pointer hesabında clientX/clientY ve input.getBoundingClientRect() aynı CSS uzayında kullanılır. DPR bu denklemlere girmez. window scroll, Studio offset'i ve tarayıcı zoom'u ayrı test edilir. Event başına React state/render tetiklenmez; kamera ref/store değişir, tek invalidation RAF'ı talep edilir.

## Kesin D3 yapılandırması

- d3-zoom 3.0.0 + d3-selection 3.0.0; input yüzeyine tek bağlama. extent açıkça [[0,0],[W,H]]. touchable(true): mouse bulunan dokunmatik laptopta touch yolu da kurulur.
- duration(0); clickDistance(4); dblclick.zoom handler kaldırılır. Çift tık/double tap kamerayı değiştirmez. D3 transition ile kamera animasyonu yok.
- filter: aktif ve kullanılabilir çizim yüzeyinde wheel kabul; mousedown için button=1 her zaman pan, button=0 yalnız Kaydır aktifken veya Space basılıyken pan; button=2 ret. Touch başlangıcı 2D pan/pinch için kabul. Menü/modal açıkken alt çizim giriş almaz. Varsayılan araç Kaydır'dır.
- Ctrl+wheel çizim üzerinde pinch/wheel zoom olarak kabul; Ctrl/Meta + ve - keyboard kombinasyonları tarayıcıya bırakılır. Çizim dışındaki wheel değiştirilmez.
- Wheel dönüşümü: deltaPx = deltaY * (deltaMode=0 için 1, =1 için 16, =2 için H). WheelDelta = clamp(-deltaPx*0.002*(ctrlKey?10:1), -1, 1). D3 ölçek çarpanı 2^WheelDelta. Wheel hız ayarı sunulmaz.
- Input yüzeyinde capture aşamasındaki passive:false wheel guard, yalnız kabul edilen çizim wheel olayında preventDefault uygular. Zoom sınırında D3 hareket üretmese de sayfa scroll/ctrl-browser zoom başlamaz. Bu guard transform üretmez; ikinci gesture motoru değildir. Kabul edilen mousedown pan için de preventDefault ve focus({preventScroll:true}) uygulanır; orta tuş tarayıcı auto-scroll açmaz.
- translateExtent sınırsız kalır: serbest CAD pan. Finite kontrolü zorunlu; sonlu olmayan transform reddedilir; son geçerli kamera korunur ve alttaki inputGeneration teardown/rebind işlemiyle D3 state sıfırlanır. Çakışık iki touch noktası gibi 0/0 üretebilen girdide NaN sonraki gesture'a taşınmaz. Çizim ekran dışına götürülebilir, Sığdır ile geri gelir.
- Ölçek sınırı ilk dosya/pafta fit u0 değerinden türetilir: coordinateMagnitude=max(1,abs(source bbox koordinatları)); uMin=max(u0/2^20,32*Number.EPSILON*coordinateMagnitude); u∈[uMin,u0*2^6]. Böylece büyük dünya orijininde Float64 hassasiyetinin altına anlamsız zoom yapılmaz. scaleExtent bunun tersidir. Kaynak revision değişmedikçe veya yeni pafta ilk kez açılmadıkça sınır yeniden türetilmez. “Sığdır” ve layer toggle sınırı sürüklemez.
- Programmatic transform ölçek sınırını kendiliğinden uyguluyor varsayılmaz. Wrapper u'yu clamp edip anchor'ı yeniden hesaplar, sonra zoom.transform çağırır. Düğme, klavye, resize ve restore aynı köprüden geçer. Reentrancy guard yalnız eşdeğer transform tekrarını keser; gerçek kullanıcı hareketini düşürmez.

## Matematiksel kabul ve sabit komutlar

Zoom'da eski imleç dünya noktası A tutulur. Yeni u' ile Cx'=Ax-(px-W/2)*u', Cy'=Ay+(py-H/2)*u'. Clamp sınırına ulaşınca anchor korunur; merkez sıçramaz. D3 gesture çıktısı bu bağımsız denklemle sınanır.

Pan'da ekran delta=[dx,dy] için C'=[Cx-dx*u,Cy+dy*u]. Mouse dışarı taşınca aktif window drag aynı hareketi sürdürür. Mouseup/blur/iptal sonrasında pan sürmez.

Sığdır: etkin paftanın görünür ve geçerli geometry bbox birleşimi B. W/H drawable alanın gerçek CSS ölçüleridir. Her kenar boşluğu m=min(32,0.1*min(W,H)); uFit=max(B.width/(W-2m),B.height/(H-2m)). B'nin iki boyutu da sıfırsa 1 kaynak çizim birimi genişlik/yükseklik kullanılır; birim bilinmiyorsa bunu metre diye adlandırma. Boş/invalid bbox'da “Görünür öğe yok”; önceki geçerli kamera korunur, origin'e uçma yok. Büyük uzak gerçek nesneler sessiz outlier filtresiyle atılmaz. Frame elde edilmeden bütün chunk'ların GPU'ya yüklenmesi beklenmez; compiler görünürlük bbox metadata'sı kullanılır.

| Komut | Sonuç |
|---|---|
| Yakınlaştır / + | Merkez anchor'da k×1.25 |
| Uzaklaştır / - | Merkez anchor'da k/1.25 |
| Sığdır / F | Etkin pafta ve o anki görünür katman bbox'sı |
| Kaydır / H | Kalıcı pan aracı aktif |
| Space basılı | Input odaktayken geçici pan; keyup/blur'da önceki araca dön |
| Oklar | Input odaktayken çizimi ilgili ekran yönünde 40 CSS px taşı; Shift ile 160 px |
| Escape | Önce üst UI kapatılır; açık UI yoksa aktif gesture iptal; fit/reset yapılmaz |

Input/textarea/contenteditable ve combobox içinde kısayol çalışmaz. + için '=' klavye karşılığı kabul edilir; Ctrl/Meta/Alt kısayolları ele geçirilmez. Zoom yüzdesi fiziksel baskı ölçeği değildir; varsa başlangıç fit'e göre göreli yakınlık olarak açık etiketlenir.

Resize/panel/fullscreen/orientation: world center ve u korunur, W/H ve D3 transform yeniden kurulur. Otomatik fit yapılmaz. W/H sıfır veya gizli elementte frame/fit atlanır; görünür olduğunda ölçülür. Her pafta için kamera RAM'de ayrı saklanır; ilk açılış fit, geri dönüş restore. Kaynak revision değişince eski kamera sessiz taşınmaz.

## İptal, unmount ve giriş temizliği

D3 mouse/touch tabanlı olduğu için ikinci Pointer Events pan sistemi kurulmaz. Native touchcancel normal gesture sonudur. Browser pointercancel olayı kamera hareketi üretmez; gerekirse aşağıdaki oturum iptali tetiklenir. Kalem birincil mouse uyumluluk yolunda pan için sınanır; basınç/çizim aracı yok.

Adapter her bağlamada inputGeneration tutar. start sırasında mouse gesture'a ait window mousemove.zoom / mouseup.zoom ve dragstart.drag / selectstart.drag handler kimlikleri public selection.on getter ile kaydedilir. Araya başka owner girdiyse onun handler'ını temizleme. Overlay modal açma, Escape, window blur, hidden, A→B dosya değişimi ve unmount şu sırayı uygular:

1. Adapter disposed/generation işaretlenir; eski zoom/end callback'leri artık kamera, React veya fetch değiştiremez.
2. Yalnız kayıtlı fonksiyonla hâlâ aynı olan window mousemove/up handler'ları kaldırılır. Kendi aktif D3 mouse drag'i ve drag guard sahipliği doğrulanırsa dragEnable(window,false) ile selection guard geri alınır. Window'daki tüm .zoom veya .drag namespace'ini kör temizlemek yok.
3. Input yüzeyinin .zoom listener'ları ve uygulamanın kendi AbortController listener'ları kaldırılır. Aktif input div'i atılır; gerekliyse yeni div + yeni zoom behavior, son geçerli kamera ile bağlanır. D3 private alanları değiştirilmez, node_modules patch'lenmez.
4. Kendi RAF, debounce/refinement timer ve fetch istekleri ilgili viewer iptal sözleşmesiyle kapanır. D3'ün kendi kısa wheel/touch timer'ı çalışsa bile eski callback generation guard'ında etkisizdir; yeni timer döngüsü doğmaz. 1 s sakinleşme sonrası listener/DOM/bellek plato kanıtı alınır.

G04-B'de bu lifecycle kanıtlanmadan gerçek dosya entegrasyonu kapatılamaz. Kaynak koddan çıkarılan bu adapter sözleşmesi henüz çalışan entegrasyon kanıtı değildir. Public API ile sahiplik korunamıyorsa CR; library private state'e müdahale veya alternatif kontrol seçimi yok.

## N01–N24 zorunlu alt kabul

Her satır bağımsız test/kanıt kimliğidir. Sentetik analitik kontrol ile gerçek cihaz testi ayrı RUN'dır. Anchor ve pan hatası normal fixture'da ≤0.25 CSS px; büyük koordinat fixture'ında aynı görsel tolerans + Float64 numeric rapor. Keyfî tolerans artırılmaz.

| ID | Senaryo / beklenen |
|---|---|
| N01 | Merkez ve dört köşede wheel anchor sabit |
| N02 | deltaMode pixel/line/page ve ctrl-wheel aynı tanımlı dönüşüm |
| N03 | 100 artı/eksi ters hareket döngüsü; merkez sürüklenmesi tolerans içinde |
| N04 | Min/max zoom clamp; NaN/Infinity veya anchor sıçraması yok |
| N05 | Sol pan/Kaydır ve orta pan; sağ tuş rotasyon yapmıyor |
| N06 | Mouse input dışına çıkıp bırakma; takılı sürükleme yok |
| N07 | Tek parmak pan; çizim altındaki sayfa scroll olmuyor |
| N08 | İki parmak pinch ve hareketli orta nokta; dünya anchor hesabı doğru |
| N09 | 1→2→1→0 parmak geçişi; sıçrama/takılma yok |
| N10 | touchcancel/pointercancel/blur/Escape; yeni gesture doğru başlıyor |
| N11 | Double click/double tap kamera değiştirmiyor; kısayollar input'a sızmıyor |
| N12 | Fit: yatay/dikey/nokta/boş/all hidden/extreme outlier |
| N13 | Layer hide/show sonrası fit gerçek görünür bbox; toggle kendiliğinden fit değil |
| N14 | Resize ve 0×0→visible; dünya merkez/u korunuyor |
| N15 | Yan panel/sheet/fullscreen/odak görünümü; offset/scroll ile doğru anchor |
| N16 | DPR 1/1.25/2/3 ve browser %200 zoom; CSS/pixel karışmıyor |
| N17 | 1e9 dünya orijini yanında 0.01 birim detay; drift/jitter ölçümü |
| N18 | Mobil portre/yatay ve klavye; input boyutu doğru, sheet kendi içinde scroll |
| N19 | ±/F/H/Space/oklar; doğru odak ve modifier sınırı |
| N20 | Model→pafta→model; kamera restore, ilk pafta fit |
| N21 | 100 pan/zoom; source decode/job sayısında artış sıfır; türev chunk fetch ayrı |
| N22 | Gesture ortasında A→B→C/unmount; eski callback yeni kamera değiştirmiyor |
| N23 | 20 aç/kapat ve cancel döngüsü; sahip olunan listener/RAF/DOM plato |
| N24 | İlk tur kullanıcı bilgisayarı + Poco X6 Pro; iPhone/tablet dahil geniş hedefin erişilmeyen cihazları NOT_RUN. Gerçek browser/OS kayıtlı, emülasyon ayrı |
