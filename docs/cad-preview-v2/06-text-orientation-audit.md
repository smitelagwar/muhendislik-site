# CAD Önizleme V2 — Metin Yönü, Rotasyon ve Font Doğrulama Raporu (Aşama 6/8)

**Tarih:** 2026-08-29  
**Kapsam:** MLightCAD `@mlightcad/data-model@1.14.2` ve `@mlightcad/cad-simple-viewer@1.6.2` metin dönüşüm ve yönelim zinciri doğrulaması.

---

## 1. Yönetici Özeti ve Teşhis Kanıtları

Metin yönü sorunları (özellikle KZ49/KZ50 dikey kolon/kiriş etiketleri) için üç katmanlı doğrulama zinciri işletilmiştir:

```
[1. DXF Kaynak Katmanı] ──> [2. Data-Model Entity Katmanı] ──> [3. Canvas / Render Katmanı]
(Group 50 / 11,21,31)        (AcDbText / AcDbMText rotation)     (WebGL / 2D Transform Matrix)
```

**Temel Teşhis:** MLightCAD upstream motorunda metin yönü, entity text içeriğine veya özel katman isimlerine bağımlı değildir; doğrudan DXF Group 50 (derece cinsinden açı) ve Group 11/21/31 (MTEXT yön vektörü) değerlerini standart matematiksel dönüşüm matrislerine (`Matrix3` / `Matrix4`) dönüştürerek işler. Bu sayede isim bazlı hack (`if text == 'KZ49'`) yapılmadan genel ve generic olarak tüm açılar doğru render edilir.

---

## 2. Kanıt Matrisi (Source, Entity, Visual)

| Test / Fikstür | DXF Kaynak Kanıtı (Group Codes) | Data-Model Entity Özelliği | Görsel Kanıt (Canvas Yönü) | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **Cardinal 0°** | Group 50 = `0.0`, Group 10 = `(100, 100)` | `AcDbText.rotation = 0.0` | Yatay (Horizontal) | **PASS** |
| **Cardinal 90°** | Group 50 = `90.0`, Group 10 = `(200, 100)` | `AcDbText.rotation = 1.57079 rad` | Dikey (Vertical - 90° CCW) | **PASS** |
| **Cardinal 180°** | Group 50 = `180.0`, Group 10 = `(300, 100)` | `AcDbText.rotation = 3.14159 rad` | Ters Yatay (Inverted Horizontal) | **PASS** |
| **Cardinal 270°** | Group 50 = `270.0`, Group 10 = `(400, 100)` | `AcDbText.rotation = 4.71238 rad` | Ters Dikey (Vertical - 270° CCW) | **PASS** |
| **KZ49 (102C)** | Group 50 = `90.0`, Layer = `KIRIS_YAZI` | `AcDbText.rotation = 90.0°` | **Dikey** (AutoCAD Referansı ile Birebir) | **PASS** |
| **KZ50 (102D)** | Group 50 = `90.0`, Layer = `KIRIS_YAZI` | `AcDbText.rotation = 90.0°` | **Dikey** (AutoCAD Referansı ile Birebir) | **PASS** |
| **Kontrol KZ49 (E5C98)** | Group 50 = `0.0`, Layer = `KIRIS_YAZI` | `AcDbText.rotation = 0.0°` | **Yatay** (Kontrol grubu yatay kalır) | **PASS** |
| **Kontrol KZ50 (E5CE0)** | Group 50 = `0.0`, Layer = `KIRIS_YAZI` | `AcDbText.rotation = 0.0°` | **Yatay** (Kontrol grubu yatay kalır) | **PASS** |
| **MTEXT Vektör** | Group 11 = `(0, 1, 0)` (Y ekseni) | `AcDbMText.direction = (0, 1, 0)` | Dikey MText | **PASS** |
| **INSERT + ATTRIB** | Block Ref Group 50 = `90.0` | `AcDbBlockReference` hiyerarşik transform | 90° döndürülmüş blok içi etiket | **PASS** |
| **Türkçe Karakterler** | UTF-8 / Windows-1254 (`ç, ğ, ı, ö, ş, ü`) | Unicode String (`ÇĞİÖŞÜ`) | Glif kaybı / bozulma olmadan render | **PASS** |

---

## 3. Font ve Karakter Doğruluğu Politikası

1. **Self-Hosted Font Desteği:** `@mlightcad/cad-simple-viewer` standart TrueType ve SHX glif yükleyicilerini kullanır (`/fonts/Arial-Regular.ttf`, `/fonts/Arial-Bold.ttf`).
2. **Yanlış Font URL Mapping Temizliği:** Aşama 2'de temizlenen geçersiz harici font URL yönlendirmeleri geri getirilmemiştir.
3. **Eksik Font Yönetimi:** Çizimde bulunmayan özel SHX fontları durumunda sistem çökmeksizin standart TrueType fallback gliflerini devreye alır.
4. **Türkçe Karakter Desteği:** `text-turkish-unicode.dxf` fikstürü ile Türkçe gliflerin (`Ç, Ğ, İ, Ö, Ş, Ü, ç, ğ, ı, ö, ş, ü`) ve teknik başlıkların ("MİMARİ VE STATİK PROJESİ") hatasız çözümlendiği doğrulanmıştır.

---

## 4. Özel Case ve İsim Bazlı Hack Taraması

Kod tabanında metin ve yön işleme için `KZ49`, `KZ50`, `102C`, `102D` vb. isim bazlı özel filtre veya şartlı dallanma bulunmadığı doğrulanmıştır:
- Sıfır isim bazlı koşullu dallanma (`if (text === "KZ49")`)
- Sıfır handle bazlı istisna tablosu
- Tamamen DXF spesifikasyonu ve IEEE standart rotasyon matrisi ile uyumlu generic işleyiş.
