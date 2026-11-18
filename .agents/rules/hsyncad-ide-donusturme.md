# Hsyncad ideCAD Dosya Dönüştürme Kuralı (.ide11trial → .ide11 & .ide10)

> **ZORUNLU KURAL:** Kullanıcı "ide10'a dönüştür", "ide11'e dönüştür", "trial dosyasını dönüştür", "hsyncad ile kaydet/dönüştür" veya benzeri bir talepte bulunduğunda, bu işlem **kesinlikle mühendislik sitemdeki (`muhendis-mimar-portali`) Hsyncad motoru aracılığıyla** gerçekleştirilir.

## 1. Çalışma Yöntemi ve Komut

Dönüştürme işlemi için hazır ve doğrulanmış TypeScript dönüştürücü betiği kullanılır:

```bash
node --import tsx scripts/hsyncad/convert_trial_to_native.ts "C:\Users\hsyn\Desktop\proje.ide11trial"
```

Bu komut:
1. `src/lib/hsyncad/ide-import/ide11-transcoder.ts` modülündeki `transcodeIde11TrialToIde11` fonksiyonu ile ticari `.ide11` (`version 211220`) dosyasını üretir (demo/öğrenci kilitleri kaldırılır, sansürlü `"XX"` kiriş ve perde etiketleri geri çözülür, CRC32 mühürlenir) ve girdi `.ide11trial` dosyasının **tam yanına** (`path.dirname`) yazar. Trial kaynak için varsayılan hedef `--to ide11`'dir.
2. `--to ide10` ve `--to all` hedefleri **F3'te (T-F3.3) gerçek v11→v10 gövde dönüşümüyle açıldı**: alt-akış çerçeveleri 201094'e yazılır, Blowfish f64 skalerler düzleştirilir, R1/R3/R4/R5 bölgeleri dört builder ile kaynaktan üretilir ve v11 yerleşimi kanıtsız bölgeler eş proje `.ide10` donöründen (`--donor <yol>`, önerilir) geçirilir. Çıktı daima yeni dosyadır; kaynak asla ezilmez.

## 2. Yasaklar ve Sınırlar

- ideCAD Deneme sürümünden kaydedilen bir projeyi ticari `.ide11` veya `.ide10` yapmak için asla ilgisiz bir projeyi donör olarak kopyalayıp ezme.
- `hsyn.ide11trial` şablonunu veya kullanıcının orijinal dosyalarını asla dönüştürme hedefi olarak ezme.
- Dosya uzantısını sadece yeniden adlandırmak (renaming) bir dönüşüm değildir; ikili mühürleme ve Blowfish kod çözümü Hsyncad motoru üzerinden yapılmalıdır.
- "ideCAD Deneme sürümü ticari dosyayı açamaz veya dönüştüremez, bu yapılamaz" şeklinde mazeret bildirme; Hsyncad'in doğrulanmış ikili dönüştürücüsünü (`scripts/hsyncad/convert_trial_to_native.ts`) çalıştır.

## 3. İlgili Belgeler ve Beceriler

- Beceri (Skill): `hsyncad-ide-donusturucu` (`C:\Users\hsyn\.gemini\config\skills\hsyncad-ide-donusturucu\SKILL.md`)
- ideCAD Desktop K8 Standardı: `C:\Users\hsyn\.gemini\config\skills\idecad-desktop\references\k8-native-dosya-donusturucu-hsyncad.md`
- Kaynak Kod: `src/lib/hsyncad/ide-import/ide11-transcoder.ts` ve `src/lib/hsyncad/ide-export.ts`
