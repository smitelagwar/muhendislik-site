# CAD / DXF Engine Protection — Başlangıç Belgesi

Bu klasörün amacı çalışan CAD/DXF görüntüleme motorunun nasıl kurulduğunu, nasıl göründüğünü ve hangi sınırlar içinde değiştirilebileceğini sonraki AI oturumlarına açık biçimde anlatmaktır.

Bu belgeler bir "eski plan" değildir. **Çalışan motor için koruma ve referans setidir.**

## Neden oluşturuldu?

DXF görüntüleyici geçmişte AI ile yapılan kapsamlı yeniden tasarımlar sırasında bozuldu. Çalıştığı bilinen Vercel `IGNORE2` Production sürümü GitHub'daki golden committen birebir restore edilerek tekrar devreye alındı. Bu klasör, aynı hatanın tekrarlanmasını engellemek için oluşturuldu.

## Tarihsel çalışan referans

- Vercel project: `muhendislik-site`
- Production deployment: `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`
- Deployment etiketi / commit mesajı: `IGNORE2`
- Golden commit: `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`
- Golden deployment source branch: `main`
- Restore commit: `afbc121923f2de1313801f884f428535334a40cf`
- Restore commit mesajı: `restore(cad): restore IGNORE2 production DXF viewer exactly`

`909c59cb...` **tarihsel golden backup** olarak kalıcıdır. Yeni geliştirmeler yapılsa dahi bu referans silinmez; gerektiğinde birebir geri dönüş noktasıdır.

## Bu klasördeki belgeler

### `BASELINE_MANIFEST.md`
Golden sürümün sabit kimlikleri, core dosya hash'leri, dependency snapshot'ı ve protected path listesi.

### `ARCHITECTURE.md`
DXF isteğinin shell'den orchestrator'a, MLightCAD upstream'e, gerektiğinde `dxf-viewer` fallback'ine ve worker'a nasıl aktığını açıklar.

### `VISUAL_INTERACTION_CONTRACT.md`
Ribbon, renkler, background seçenekleri, pan/zoom/fit, layer ve loading/error görünümünün korunması gereken davranışlarını açıklar.

### `AI_CHANGE_PROTOCOL.md`
Gelecekte AI ile değişiklik yapılacaksa uygulanacak backup, scope, branch, baseline ve acceptance protokolünü tanımlar.

## Yeni AI oturumu için kısa kural

CAD/DXF görevi aldıysan:

1. Önce bu klasörü oku.
2. Çalışan motorun hangi dosyada olduğunu tahmin etme; manifesti kullan.
3. Kullanıcı açıkça motor değişikliği istemiyorsa engine/parser/renderer/worker zincirini değiştirme.
4. UI işi için engine'i yeniden yazma.
5. "Daha iyi mimari" gerekçesi tek başına çalışan kodu değiştirme izni değildir.
6. Bir değişiklik yanlış giderse golden committen dosya bazlı restore mümkün olmalıdır.

## Motor ile UI aynı şey değildir

Aşağıdaki talepler tek başına motoru değiştirme izni sayılmaz:

- toolbar daha güzel olsun,
- ikon değişsin,
- panel yer değiştirsin,
- arka plan düğmesi farklı görünsün,
- review tool eklensin,
- ölçüm menüsü düzenlensin,
- responsive davranış iyileştirilsin.

Bu tür işler engine iç koduna mümkün olduğunca **sıfır dokunuşla** yapılmalıdır.

Aşağıdakiler ise gerçek motor değişikliğidir ve özel protokol gerektirir:

- parser değiştirmek,
- renderer değiştirmek,
- worker veri formatını değiştirmek,
- MLightCAD/dxf-viewer motor sırasını değiştirmek,
- fallback kaldırmak,
- dependency major/minor yükseltmesiyle render davranışını değiştirmek,
- pan/zoom render modelini yeniden yazmak,
- farklı bir canvas/WebGL motoruna geçmek.

## En önemli cümle

> **Çalışan şeyi korumak varsayılandır; motoru değiştirmek istisnadır.**
