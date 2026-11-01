# ideCAD Yazıcı (hsynCAD → .ide10 / .ide11) Düzeltme ve Gerçek Tamamlama Planı

> **Hedef:** Önceki oturumda (`dc49ea3b-8c7f-459e-8f23-07c8f3728fa3`) "tamamlandı" denilen ancak gerçekte patlayan, REA kullanılmadan bypass edilen, round-trip testi feyk yapılan ve Web çizim ekranına entegre edilmeyen tüm eksikleri sıfır toleransla düzeltmek.
> **Hedef Model Talimatı:** Bu plan Gemini / AI modelinin hiçbir adımı atlayamayacağı, varsayımda bulunamayacağı, sahte test yazamayacağı şekilde **"Aptala Anlatır Gibi" (Foolproof)** tasarlanmıştır.

---

## 0. KESİN KURALLAR (AI Modelinin Çiğnemesi Yasak Kurallar)

1. **SAHTE TEST YAZMA YASAĞI:** Yalnızca kendi yazdığın 4 kolonluk oyuncak modelle (`createDemoModel`) test yapıp "Testler %100 geçti" demek **KESİNLİKLE YASAKTIR**. Gerçek `MUSTAFA SELVİ` projesi ve 806 elemanlı 7 katlı modelle round-trip çalışmadan hiçbir adıma "Bitti" denemez.
2. **KOPYALAMA-YAPIŞTIRMA KANDIRMACASI YASAĞI:** Repodaki mevcut TypeScript parser'ının (`parseIde10`) okuduğu loose regex/heuristic kalıplarını kopyalayıp "Ghidra ile decompile ettim" demek **KESİNLİKLE YASAKTIR**.
3. **GERÇEK ÇALIŞMA ALANI ENTEGRASYONU:** `ide-file-menu.tsx` sadece modal önizleyicidir! hsynCAD çizim ekranı `workbench.tsx` ve `command-bar.tsx` içine indirme butonları eklenmeden Web entegrasyonu tamamlanmış SAYILMAZ.
4. **HATA GİZLEME YASAĞI:** Bir fonksiyon hata veriyorsa `try/catch` içine alıp sessizce yutmak yasaktır.

---

## FAZ 1: `ide-write` Çekirdek Tip ve Çökme Hatalarını Düzelt (Kritik Bugfix)

### Sorun Tanımı
Şu an `synthesizeIdeFile(orig, "ide11")` fonksiyonuna `parseIde10` çıktısı olan gerçek bir `IdeProject` verildiğinde kod anında şu hatayla çökmektedir:
```text
TypeError: Cannot read properties of undefined (reading 'x')
    at computeLineFootprint (record-builders.ts:44:18)
    at encodeWallRecord (record-builders.ts:355:21)
    at synthesizeIdeFile (synthesize.ts:170:21)
```
**Nedeni:** `record-builders.ts` içindeki `encodeWallRecord`, `encodeBeamRecord` ve `encodeAxisRecord` fonksiyonları elemanın içinde `start: Point` ve `end: Point` olduğunu varsayar. Oysa `IdeElement` içinde `points: Point[]` dizisi vardır!

### Yapılacak İşler

#### Adım 1.1: `src/lib/hsyncad/ide-write/record-builders.ts` Dosyasını Düzelt
1. `computePointsFromElement` adında evrensel bir yardımcı fonksiyon ekle:
   ```typescript
   export function resolveElementEndpoints(el: { start?: Point; end?: Point; points?: Point[]; position?: Point }): { start: Point; end: Point } {
     if (el.start && el.end) return { start: el.start, end: el.end };
     if (el.points && el.points.length >= 2) return { start: el.points[0], end: el.points[1] };
     if (el.position) return { start: el.position, end: { x: el.position.x + 1, y: el.position.y } };
     return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
   }
   ```
2. `encodeAxisRecord`: `start` ve `end`'i `resolveElementEndpoints` ile çöz; asla `axis.start.x`'e doğrudan erişme.
3. `encodeBeamRecord`: `beam.start` ve `beam.end`'i `resolveElementEndpoints` ile çöz.
4. `encodeWallRecord`: `wall.start` ve `wall.end`'i `resolveElementEndpoints` ile çöz.
5. `encodeColumnRecord`: Kolon noktalarını `points`, `position` veya `width`/`depth`'ten çözerken eksik alanlar için varsayılan (0,0) koruması ekle.
6. `encodeSlabRecord`: `slab.points` yoksa veya boşsa boş poligon hatasını engelle.

#### Adım 1.2: Eksik Eleman Tiplerini Destekle (`synthesize.ts`)
Şu anda `synthesize.ts` sadece 5 tipi (`axis`, `column`, `beam`, `wall`, `slab`) alıyor; `stair`, `band`, `section`, `line`, `slabEdge` tiplerini çöpe atıyor!
1. `line` ve `slabEdge` elemanlarını `PRIMITIVE_SLAB_EDGE` (45) veya `PRIMITIVE_LINE` (44) olarak kodla.
2. `band` elemanlarını `PRIMITIVE_BAND` (128) olarak kodla.
3. `stair` elemanlarını `PRIMITIVE_STAIR` (40) olarak kodla.
4. Tanınmayan veya yardımcı elemanlar için fallback geometri kaydedici ekle, hiçbir mimari/statik elemanı sessizce yutma.

#### Adım 1.3: Gerçek Mustafa Selvi Round-Trip Testini Yaz ve Çalıştır
`src/lib/hsyncad/ide-write/synthesize.test.ts` içine şu testi ekle ve `npm test` ile doğrula:
```typescript
test("real-world Mustafa Selvi round-trip synthesis", () => {
  const configPath = path.join(process.cwd(), ".data/hsyncad/ide-examples.json");
  if (!fs.existsSync(configPath)) return;
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const samplePath = config["mustafa-selvi-1"];
  if (!fs.existsSync(samplePath)) return;

  const buf = fs.readFileSync(samplePath);
  const orig = parseIde10(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "mustafa.ide10");

  // Hem ide10 hem ide11 olarak sentezle
  const bytes11 = synthesizeIdeFile(orig, "ide11");
  const bytes10 = synthesizeIdeFile(orig, "ide10");

  assert.ok(bytes11.byteLength > 100_000, "ide11 çıktısı > 100KB olmalı");
  assert.ok(bytes10.byteLength > 100_000, "ide10 çıktısı > 100KB olmalı");

  // Geri oku
  const reparsed11 = parseIde10(bytes11.buffer.slice(bytes11.byteOffset, bytes11.byteOffset + bytes11.byteLength), "synth.ide11");
  assert.equal(reparsed11.floors.length, orig.floors.length, "Kat sayıları birebir eşleşmeli");
  assert.ok(reparsed11.elements.length >= orig.elements.length * 0.95, "Elemanlar kayıpsız korunmalı");
});
```
**Bitti Kriteri:** Test hatasız geçmeli; `TypeError` veya eleman kaybı olmamalıdır.

---

## FAZ 2: ideCAD MFC CArchive İkili Blok Uyumluluğu

### Sorun Tanımı
ideCAD C++ MFC ile yazılmıştır ve dosya yüklerken `CDocument::Serialize(CArchive& ar)` sıralı bayt akışı kullanır.
- Gerçek ideCAD dosyasında dosya başlangıcı (offset 88) ile ilk katın başladığı yer (`T01`) arasında **53.623 bayt** (53.5 KB) veri vardır:
  - Zlib sıkıştırmalı bitmap önizleme görseli
  - TBDY 2018 deprem parametreleri tablosu
  - Beton (C25, C30...) ve donatı çeliği (B420C...) kütüphaneleri
  - 13 adet standart yükleme ve kombinasyon matrisi
  - Analiz ve pafta ayarları
- Şu anki `synthesize.ts` ise bu araya sadece **450 bayt**'lık sahte bir string listesi yazmaktadır. Bu dosya gerçek ideCAD 11 veya 10'da açıldığında MFC `AfxThrowArchiveException` hatası verir ve dosya açılamaz.

### Çözüm Yolu
ideCAD'in açabilmesi için iki modlu sentezleyici mimarisi kurulacaktır:
1. **Sanitlenmiş Temiz Çekirdek Şablonu (Clean Master Carrier Template):**
   - Sıfırdan çizilen modeller için, ideCAD'in standart olarak ürettiği boş/temiz 1 katlı bir dosyanın proje bilgi ve malzeme bloğu (53 KB'lık yapısal iskelet) temizlenmiş (Mustafa Selvi veya kullanıcı bilgisi içermeyen) bir nötr baz olarak saklanır.
   - Yeni katlar ve elemanlar bu nötr iskeletin ardına sıralı CArchive kayıtları olarak enjekte edilir.
2. **Kayıt Bayt Hizalaması:**
   - Eleman kayıtları arasındaki bayt hizalaması (`padding: 0x00`, bbox sonu `5 bayt tail`, v11 için `16 bayt opak u32[4]`) korunur.
   - CRC32 ve dosya boyutu mühürlemesi en son adımda yapılır.

---

## FAZ 3: hsynCAD Çizim Ekranına (`workbench.tsx`) İndirme Butonlarının Eklenmesi

### Sorun Tanımı
Kullanıcı web arayüzünde (`/kategori/araclar/hsyncad`) sıfırdan bina çizdiğinde veya 7 katlı 5000 m² plazayı açtığında, bunu `.ide11` veya `.ide10` olarak indirebileceği **HİÇBİR BUTON YOKTUR**. Sadece "JSON kaydet" butonu vardır.

### Yapılacak İşler

#### Adım 3.1: `src/components/hsyncad/workbench.tsx` Dosyasına Dışa Aktarma Ekle
1. `import { synthesizeIdeFile } from "@/lib/hsyncad/ide-write";` importunu ekle.
2. `exportIde11` ve `exportIde10` fonksiyonlarını tanımla:
   ```typescript
   function exportIde11() {
     try {
       const bytes = synthesizeIdeFile(model, "ide11");
       const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: "application/octet-stream" });
       const url = URL.createObjectURL(blob);
       const link = document.createElement("a");
       link.href = url;
       link.download = `${model.name || "hsyncad-model"}.ide11`;
       link.click();
       setTimeout(() => URL.revokeObjectURL(url), 10000);
       setMessage("ideCAD v11 dosyası (.ide11) indirildi.");
     } catch (err) {
       setMessage(`ide11 aktarma hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
     }
   }

   function exportIde10() {
     try {
       const bytes = synthesizeIdeFile(model, "ide10");
       const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: "application/octet-stream" });
       const url = URL.createObjectURL(blob);
       const link = document.createElement("a");
       link.href = url;
       link.download = `${model.name || "hsyncad-model"}.ide10`;
       link.click();
       setTimeout(() => URL.revokeObjectURL(url), 10000);
       setMessage("ideCAD v10 dosyası (.ide10) indirildi.");
     } catch (err) {
       setMessage(`ide10 aktarma hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
     }
   }
   ```
3. `workbench.tsx` içindeki `tab === "Proje"` sekmesine butonları yerleştir:
   ```tsx
   <button type="button" data-testid="export-ide11" onClick={exportIde11}><FileDown size={17} />ideCAD v11 İndir (.ide11)</button>
   <button type="button" data-testid="export-ide10" onClick={exportIde10}><FileDown size={17} />ideCAD v10 İndir (.ide10)</button>
   ```

#### Adım 3.2: `src/components/hsyncad/command-bar.tsx` Dosyasına Dışa Aktarma Ekle
1. `command-bar.tsx` içindeki "Dosya" açılır menüsüne (`fileMenu`):
   - `[11321, "ideCAD v11 İndir (.ide11)", "download"]`
   - `[11322, "ideCAD v10 İndir (.ide10)", "download"]`
   seçeneklerini ekle.
2. `workbench.tsx` içindeki `ribbonActions` nesnesine bu komut id'lerini bağla:
   - `11321: { run: exportIde11 }`
   - `11322: { run: exportIde10 }`

---

## FAZ 4: Gerçek ideCAD Doğrulama ve Teslim Protokolü

### Adımlar
1. `scripts/faz3-produce-genuine-files.ts` scriptini çalıştırarak `C:\Users\hsyn\Desktop\SON\` altındaki `7_KAT_5000M2_BINA.ide11` ve `7_KAT_5000M2_BINA.ide10` dosyalarını yeniden üret.
2. **Kullanıcı Doğrulaması:**
   - Kullanıcı `C:\Users\hsyn\Desktop\SON\7_KAT_5000M2_BINA.ide11` dosyasını `ideCAD Statik 11 Deneme` yazılımında açar.
   - Açıldığını, 7 katın ve elemanların ekranda göründüğünü teyit eder.
   - Kullanıcı "açıldı" demeden "ideCAD'de açılıyor" iddiası dokümana yazılamaz.
3. `npx tsc --noEmit` çalıştır -> 0 hata.
4. `npm run build` çalıştır -> tüm sayfalar başarıyla derlenmeli.
5. `AGENTS.md` kurallarına uygun olarak tek atomik commit ile `main` branch'ine gönder.

---

## Kontrol Listesi (Tamamlanmadan Görev Bitti Denemez)

- [ ] `record-builders.ts` içinde `resolveElementEndpoints` eklendi mi?
- [ ] `IdeElement` tipindeki objeler (Mustafa Selvi) ile `synthesizeIdeFile` çalıştırıldığında TypeError çözüldü mü?
- [ ] `stair`, `band`, `slabEdge`, `line` tipleri veri kaybı olmadan işleniyor mu?
- [ ] `MUSTAFA SELVİ` round-trip testi `synthesize.test.ts` içine eklendi ve geçti mi?
- [ ] `workbench.tsx` çizim ekranında "ideCAD v11 İndir" ve "ideCAD v10 İndir" butonları var mı ve çalışıyor mu?
- [ ] `command-bar.tsx` Dosya menüsüne `.ide11` ve `.ide10` indirme seçenekleri eklendi mi?
- [ ] `SON\7_KAT_5000M2_BINA.ide11` ve `.ide10` sıfır hatayla güncellendi mi?
- [ ] TypeScript ve Production build doğrulaması alındı mı?
