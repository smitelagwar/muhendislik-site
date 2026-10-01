# PDF Görüntüleyici v3 — Kullanıcı Hata Listesi

Bu liste kullanıcı tarafından bildirilen ve test edilen kusurların kaydedildiği canlı takip tablosudur.

| # | Hata | Nerede (dosya / mod / cihaz) | Ekran görüntüsü | v1'de de var mıydı? | Durum |
|---|---|---|---|---|---|
| H1 | Sağ kenar metin kırpılması (90.7px taşma ve kesilme) | Copilot - korelasyon.pdf / Sayfa modu ve Zoom In | `r2-after-h1-fixed-138.png` | Hayır (v2 regresyonu) | ✅ ÇÖZÜLDÜ (Faz R2) |
| H2 | Metin ve canvas bulanıklığı (bitmap/CSS oranı düşüklüğü) | Tüm PDF'ler / Genişliğe Sığdır ve Zoom | `r2-after-h1-fixed-sayfa.png` | Kısmen (v2'de kötüleşmişti) | ✅ ÇÖZÜLDÜ (Faz R2) |
| H3 | Harf/tuval bozulması (double scaling / CSS transform çakışması) | Tüm PDF'ler / Zoom ve Mod Geçişi | `r0-live-geometry.json` | Hayır (v2 regresyonu) | ✅ ÇÖZÜLDÜ (Faz R2) |
| H4 | Kopyalamada 'i' -> 'Ĝ' bozulması | Copilot - korelasyon.pdf / Kopyalama (Ctrl+C) | TEST-I8 çıktısı | Evet (PDF ToUnicode kaynaklı) | ✅ ÇÖZÜLDÜ (Faz R3) |
| H5 | 'i' içeren kelimelerin ("ilişki") aranamaması ve vurgulanamaması | Copilot - korelasyon.pdf / Arama (Ctrl+F) | `r3-search-iliski-highlight.png` | Evet (v1 ve v2'de aranamıyordu) | ✅ ÇÖZÜLDÜ (Faz R3) |

*(Kullanıcı yeni hata bildirdikçe buraya eklenecektir)*
