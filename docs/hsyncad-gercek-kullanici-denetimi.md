# hsynCAD — boş modelden gerçek kullanıcı akışı

28 Ekim 2026. Bu inceleme, kaynakta bir düğmenin handler'ı olması veya bir örnek modelin yüklenmesi yerine, boş modelden kullanıcı arayüzüyle çizim yapmayı sınar. `tests/hsyncad/real-project.spec.ts` bu akışı yeniden üretir. Model, demo yüklenerek veya JavaScript/localStorage ile enjekte edilerek oluşturulmadı. Test, doğrulama amacıyla modeli yalnız okur.

## Gerçekten yapılan işlemler

1. Boş ekranda Betonarme → Aks → Ölçülü aks sistemi açıldı. X açıklığı `4`, Y açıklıkları `2;2` girilip beş aks oluşturuldu.
2. Kolon aracı açıldı; merkez tutma noktası ve 40×40 cm kesit seçildi. İlk kolon aks kesişimine yakın fare tıklamasıyla yakalanıp ikinci adımda onaylandı. Konumun tam `(0,0)` ve iki aksla bağlı olduğu okundu. Diğer üç köşe kolon koordinat kutusundan yerleştirildi.
3. Sürekli kirişle dört çevre kirişi oluşturuldu. Orta açıklığa perde yerleştirildi. İki açıklık içine tıklayarak iki döşeme oluşturuldu; her ikisinin de gerçek sınır elemanlarına bağlı olduğu doğrulandı.
4. Eleman listesinden sağdaki düşey aks seçildi; iki ucun X konumu `4` metreden `5` metreye değiştirildi. Bağlı S2 kolonu ve P1 perdesinin ucu `5` metreye ilerledi. Döşeme çevreleri güncellendi; işlem geçersiz model üretmedi.
5. S1 kolonu seçilip eni `0,50 m` yapıldı. Kat yüksekliği `3,20 m` olarak değiştirildi. Katı üste kopyalama kullanıldı; ikinci katın taban kotu `3,20 m` oldu.
6. İkinci katta iki noktayla `5 m` uzaklık ölçüldü. Tüm katlar için kat→eleman tipi raporu açıldı; sekiz rapor satırı görüldü ve gerçek CSV dosyası indirildi.
7. Model JSON dosyası indirildi. Ardından Dosya → Yeni model ile boş modele geçildi; indirilen dosya Model Aç üzerinden yüklendi. Sayfa yenilendi; elemanlar, metraj ve iki katlı gerçek 3B model aynı kaldı.

## Sonuç ve kanıt

**Bu sınırlı betonarme geometrik modelleme ve metraj akışı baştan sona geçti.** Birinci koşu `1 passed (8.4s)`, testin kendi süresi 7,8 saniye; Playwright gerçek buton/form/fare işlemlerini otomatik yürütür. Son ekran görsel olarak açılıp incelendi: plan ve iki katlı perspektif birlikte görünür, alt/üst katlar doğru yüksekliktedir, metraj paneli doludur.

- İki kat; her biri `3,20 m`; gerçek 3B sınır yüksekliği `6,40 m`.
- Toplam 32 eleman: 10 aks, 8 kolon, 8 kiriş, 2 perde, 4 döşeme. Katı sayısı 22.
- Arayüzde net beton `19,840 m³`; brüt kalıp `197,30 m²`.
- `data-model-signature`, yenileme sonrası bütün 32 elemanı içerir; indirilen JSON ile açılan modelin elemanları aynıdır.
- JavaScript `pageerror` listesi boş. İlgili test ESLint kontrolü başarılı.

Kalıcı kanıt klasörü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\devam-2026-10-28\kullanici-denetimi`.

| Dosya | Kaynak |
| --- | --- |
| `iki-kat-kullanici-projesi.json` | Gerçek JSON kaydet düğmesinin indirdiği ve Model Aç ile tekrar yüklenen dosya |
| `iki-kat-metraj.csv` | Gerçek rapor penceresinin indirdiği CSV |
| `iki-kat-sonuc-1920.png` | Dosya açma ve yenileme sonrasındaki ekran |
| `akis-sonucu.json` | Son katlar, eleman/katı sayıları, metraj ve hata listesi |

Tam koşu logu üst klasörde `real-project-test.log` dosyasındadır. Komut:

```powershell
$env:HSYNCAD_TEST_URL='http://127.0.0.1:3144'
npx playwright test --config=playwright.hsyncad.config.ts real-project.spec.ts --output=test-results/hsyncad-real-project
```

## Bu sonucun göstermediği şeyler

Bu test bütün düğmelerin çalıştığını veya bir mühendislik/statik projesinin teslim edilebildiğini göstermez. Temel/merdiven/boşluk, uygulanmamış analiz-tasarım ve pafta komutları bu akışta kullanılmadı. FE, deprem, donatı tasarımı, taşıma gücü/mesnet kontrolü, pafta ve DWG üretimi yoktur. Çelik ve Birleşim kullanıcının kapsamı dışındadır.

Kalıp brüttür; birleşim temas yüzlerini düşmez. Net beton ile kalıp hesabının kabulleri ayrı değerlendirilmelidir. Sayısal sonuç burada gerçek uygulama çıktısıdır; bağımsız bir statik doğrulama veya tüm geometri durumları için ispat değildir. Native ideCAD'in bütün runtime davranışlarıyla eşlik iddiası da yoktur.

REA hiyerarşisi, statik kaynakların sırasını/ilişkisini açıklar; bu akışın çalışması ayrı tarayıcı kanıtıdır. Diğer komutların uygulama durumları ayrıca komut envanteriyle denetlenmelidir. Kullanıcının kendi tarayıcı modeli değiştirilmedi; test izole bağlamda çalışır.
