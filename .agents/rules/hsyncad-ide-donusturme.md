# Hsyncad ideCAD Dosya Dönüştürme Kuralı (.ide11trial → .ide11 & .ide10)

> **ZORUNLU KURAL:** Kullanıcı "ide10'a dönüştür", "ide11'e dönüştür", "trial dosyasını dönüştür", "hsyncad ile kaydet/dönüştür" veya benzeri bir talepte bulunduğunda, bu işlem **kesinlikle mühendislik sitemdeki (`muhendis-mimar-portali`) Hsyncad motoru aracılığıyla** gerçekleştirilir.

## 1. Çalışma Yöntemi ve Komut

Dönüştürme işlemi için hazır ve doğrulanmış TypeScript dönüştürücü betiği kullanılır:

```bash
node --import tsx scripts/hsyncad/convert_trial_to_native.ts "C:\Users\hsyn\Desktop\proje.ide11trial"
```

Bu komut:
1. `src/lib/hsyncad/ide-import/ide11-transcoder.ts` modülündeki `transcodeIde11TrialToIde11` fonksiyonu ile ticari `.ide11` (`version 211220`) dosyasını üretir (demo/öğrenci kilitleri kaldırılır, sansürlü `"XX"` kiriş ve perde etiketleri geri çözülür, CRC32 mühürlenir).
2. `transcodeIde11TrialToIde10` fonksiyonu ile geriye dönük `.ide10` (`version 201094`) dosyasını üretir (Blowfish float64 blokları standart IEEE-754 sayılarına çözümlenir, v10 ikili şeması uygulanır, CRC32 mühürlenir).
3. Her iki dosyayı da girdi `.ide11trial` dosyasının **tam yanına** (`path.dirname`) yazar.

## 2. Yasaklar ve Sınırlar

- ideCAD Deneme sürümünden kaydedilen bir projeyi ticari `.ide11` veya `.ide10` yapmak için asla ilgisiz bir projeyi donör olarak kopyalayıp ezme.
- `hsyn.ide11trial` şablonunu veya kullanıcının orijinal dosyalarını asla dönüştürme hedefi olarak ezme.
- Dosya uzantısını sadece yeniden adlandırmak (renaming) bir dönüşüm değildir; ikili mühürleme ve Blowfish kod çözümü Hsyncad motoru üzerinden yapılmalıdır.
- "ideCAD Deneme sürümü ticari dosyayı açamaz veya dönüştüremez, bu yapılamaz" şeklinde mazeret bildirme; Hsyncad'in doğrulanmış ikili dönüştürücüsünü (`scripts/hsyncad/convert_trial_to_native.ts`) çalıştır.

## 3. İlgili Belgeler ve Beceriler

- Beceri (Skill): `hsyncad-ide-donusturucu` (`C:\Users\hsyn\.gemini\config\skills\hsyncad-ide-donusturucu\SKILL.md`)
- ideCAD Desktop K8 Standardı: `C:\Users\hsyn\.gemini\config\skills\idecad-desktop\references\k8-native-dosya-donusturucu-hsyncad.md`
- Kaynak Kod: `src/lib/hsyncad/ide-import/ide11-transcoder.ts` ve `src/lib/hsyncad/ide-export.ts`
