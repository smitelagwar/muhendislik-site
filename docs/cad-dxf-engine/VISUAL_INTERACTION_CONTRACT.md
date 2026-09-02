# CAD / DXF Engine — Görsel ve Etkileşim Sözleşmesi

Bu belge, çalışan CAD/DXF aracının yalnız render motorunu değil **kullanıcının gördüğü ve kullandığı davranışı** da korumak içindir.

Amaç her pikseli sonsuza kadar dondurmak değildir. Ancak bir AI UI düzenlerken engine interaction'ını yanlışlıkla değiştirmemelidir.

## 1. Genel görsel karakter

CAD workspace genel proje kimliğiyle uyumludur:

- koyu endüstriyel yüzeyler,
- `bg-card`, `bg-background`, `bg-muted` tema tokenları,
- amber vurgu,
- zinc/border tonları,
- rounded panel/button dili,
- yoğun ama profesyonel CAD araç çubuğu,
- light/dark tema eşliğini bozmayan token kullanımı.

### Ribbon snapshot

`cad-studio-ribbon.tsx` ana ribbon için şu yapıyı kullanır:

```text
height: h-14
background: bg-card/95
border: border-border/80
backdrop: backdrop-blur-xl
shadow: shadow-md
horizontal overflow: enabled
```

Araç grupları:

```text
rounded-xl
border border-border/70
bg-muted/50
p-1
```

Aktif butonlar `bg-background`, belirgin border ve daha güçlü font ile pasiflerden ayrılır. Navigasyon/görünüm ikonlarında amber vurgu yaygındır.

Bu dil değiştirilmek istenirse UI görevi olarak yapılabilir; bunun için renderer/worker değiştirilmez.

## 2. Ana gezinme grubu

Ribbon'da mevcut temel gezinme araçları:

- Seç,
- Kaydır (Pan),
- Ekrana Sığdır (Fit).

Fit, yalnız CSS scale değildir; viewer'ın gerçek kamera/bounds mekanizmasına bağlanır.

Bir AI `Fit` butonunu görsel olarak değiştirirken engine callback'ini dummy/no-op fonksiyona çevirmemelidir.

## 3. Görünüm modu

Mevcut display seçenekleri:

```text
source       → Gerçek Renk
monochrome   → Siyah-Beyaz
```

Lineweight bağımsız toggle'dır.

Renk modu, lineweight ve background birbirinin yerine geçen tek state yapılmamalıdır.

## 4. Arka plan seçenekleri

Korunan seçenek kimlikleri:

```text
autocad
black
white
```

Görsel karşılıklar:

```text
autocad → #212830
black   → #000000
white   → #ffffff
```

`CadViewSettingsPanel` ve ribbon aynı semantic seçenekleri kullanır.

Bir UI refactor'ında label değişebilir; fakat `CadBackgroundColorOption` değerleri ve adapter bağlantısı istemeden koparılmamalıdır.

## 5. View Settings panel

Panel mevcut durumda:

- çizim renk modu,
- lineweight,
- arka plan

ayarlarını tek yerde sunar.

Panel; absolute, üst-sol çalışma alanına yakın, yarı saydam tema yüzeyli, border + shadow + backdrop blur kullanır.

Popover/sheet görünümü değiştirilebilir, fakat aşağıdaki callback'ler gerçek engine'e bağlı kalmalıdır:

```text
onSelectDisplayMode
onToggleLineWeight
onSelectBackgroundColor
```

## 6. Pan / zoom davranışı

### Temel koruma ilkesi

**Pan/zoom sırasında parser yeniden çalıştırılmaz ve dosya yeniden fetch edilmez.**

Navigation yalnız viewport/camera davranışıdır. Bir AI pan/zoom bug'ı gördüğünde ilk refleks olarak source parse pipeline'ını veya worker protokolünü yeniden yazmamalıdır.

### Fallback engine

Restore edilmiş `cad-viewer.tsx` fallback yolunda load sonrasında `MIDDLE → PAN` binding'i uygulanır.

Bu binding değiştirilecekse bunun bir kullanıcı etkileşim değişikliği olduğu açıkça kabul edilmelidir.

### Upstream engine

Upstream tarafında navigation `CadUpstreamAdapter` ve viewer control mekanizması üzerinden yürür. Custom Canvas2D repaint loop ekleyerek upstream motorun üstüne ikinci bir navigation/render sistemi bindirmek yasaktır, kullanıcı açıkça böyle bir engine değişikliği istemedikçe.

## 7. Progressive rendering / yeniden çizim

MLightCAD veya `dxf-viewer` kendi iç render stratejisini yönetir. AI şu hatayı yapmamalıdır:

> "Daha responsive olsun" diyerek tüm geometriyi custom canvas'a kopyalayıp pan/zoom'da her input eventinde yeniden çizmek.

Bu tür bir değişiklik görsel olarak çizgilerin tekrar tekrar oluşması, frame çakışması veya büyük dosyalarda takılma üretebilir.

Performans sorunu varsa önce mevcut motorun kendi camera/render API'si ölçülür. Replacement renderer ancak ayrı, açık onaylı engine projesi olarak ele alınır.

## 8. Layer davranışı

Layer panel yalnız dekoratif liste değildir. Viewer layer state'i ile bağlıdır.

Korunması gerekenler:

- tek layer visibility,
- tümünü göster,
- tümünü gizle,
- source state reset,
- görünür layer'a göre fit/bounds davranışı.

UI state ile gerçek renderer state birbirinden kopmamalıdır.

## 9. Loading görünümü

Orchestrator ve viewer loading sırasında kullanıcıya boş siyah alan bırakmak yerine hangi motorun hazırlandığını belirten UI gösterebilir.

Mevcut orchestrator loading dili örneği:

```text
Hızlı DWG cache kontrol ediliyor
CAD fallback hazırlanıyor
Mevcut DXF viewer hazırlanıyor
```

Spinner için amber vurgu kullanılır.

Loading bileşenini kaldırıp "canvas oluştuysa hazır" yaklaşımına dönmek engine readiness davranışını zayıflatabilir.

## 10. Error / retry / download

Terminal failure kullanıcıya görünür olmalıdır. Retry ve orijinal dosya indirme yolları engine hatasını saklamadan sunulur.

Aşağıdaki anti-pattern yasaktır:

- failure'ı catch edip hiçbir şey yapmamak,
- boş canvas'ı ready saymak,
- error overlay'i yalnız test geçsin diye gizlemek,
- sonsuz loading.

## 11. CAD review araçları

Ribbon'daki markup/review araçları engine ile aynı dosyada render edilse bile renderer'ın kendisi değildir.

Review/markup geliştirmesi yapılırken şu sınır korunur:

```text
CAD source geometry = viewer/engine sahibi
Review geometry      = review store / overlay sahibi
```

Review özelliği eklemek için source DXF entity'lerini yeniden yazmak varsayılan yöntem değildir.

## 12. Responsive davranış

Toolbar yatay taşmada kaydırılabilir. Paneller viewport dışına taşmamalı, touch target ve focus davranışı korunmalıdır.

Responsive düzenleme yapılırken engine DOM host'unun boyutunu sıfıra düşürmek veya viewer'ı her breakpoint değişiminde yeniden mount etmekten kaçınılmalıdır.

## 13. Stil değişikliği için güvenli alan

Genellikle güvenli:

- icon boyutu,
- gap/padding,
- border radius,
- label metni,
- tooltip,
- panel layout,
- theme token seçimi,
- responsive görünürlük.

Engine değişikliği sayılır:

- viewer mount/unmount lifecycle,
- render container ownership,
- camera binding,
- worker startup/terminate,
- parser/normalization,
- engine/fallback routing,
- dependency upgrade,
- WebGL/Canvas implementation değişimi.
