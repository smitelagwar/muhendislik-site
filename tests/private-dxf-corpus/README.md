# Private DXF Fidelity Corpus

Bu klasör gerçek mühendislik DXF dosyalarının **lokal** kabul testleri içindir. Proje çizimleri, müşteri/arsa bilgileri veya kuruma özel paftalar public repoya commit edilmemelidir.

## Kullanım

1. Gerçek DXF dosyalarını bu klasöre lokal olarak kopyalayın.
2. Aynı klasörde `manifest.local.json` oluşturun.
3. Her dosya için beklenen release durumunu yazın: `clean`, `warning` veya `blocked`.
4. `npx tsx scripts/check-dxf-private-corpus.ts` komutunu çalıştırın.

Örnek manifest:

```json
{
  "betonarme-kalip-plan-anonim.dxf": "warning",
  "kolon-perde-aplikasyon-anonim.dxf": "clean",
  "survey-buyuk-koordinat-anonim.dxf": "clean"
}
```

`.gitignore` bu klasörde README dışındaki dosyaları dışarıda tutar. Gerçek bir üretim hatası public regresyon testine dönüştürülecekse önce çizim anonimleştirilmeli/minimize edilmeli ve yalnız problemi yeniden üreten küçük fixture `tests/fixtures/dxf/` altına alınmalıdır.

Önerilen gerçek corpus sınıfları:

- betonarme kalıp planı,
- kolon/perde aplikasyonu,
- kiriş açılımı,
- mimari kat planı,
- büyük koordinatlı vaziyet/survey,
- yoğun TEXT/MTEXT/DIMENSION,
- nested BLOCK/INSERT ağırlıklı pafta,
- HATCH ağırlıklı mimari detay,
- yüksek layer sayılı disiplinler arası çizim.
