# A9 — Son production performans karşılaştırması

- Tarih: 2026-10-15 (Europe/Istanbul).
- Production build: Next 16.3.6 / Webpack, BUILD_ID `7FEWlZ_L99f2D76ZBuvhp`; `npm run build` exit 0; 627/627 statik sayfa.
- A9 tam PDF V4 gate: 95/95 geçti (desktop 51, mobile 34, compat 3, WebKit 7); mobile-slow CPU×4: 34/34 geçti.
- A2 ile eşlenen tekrar kümesi: 7 test grubu × 5 tekrar = 35/35; production, CPU×1, yerel sentetik fixture, ağ yavaşlatması yok.
- A2 referansı: `20261014-173918-2c0b682-baseline-06`, kaynak SHA `2c0b68209ae2e4e691b832e5957fbb4cd2e0e6d9`, BUILD_ID `jbTgjGuh4aPtcKXnsM1QU`. D kopyasında .git metadata olmadığından güncel HEAD/diff SHA eşitliği doğrulanamadı.
- Sayısal bütçe raporu: 0 ihlal. WebKit smoke değerleri PDF V4 kapı yardımcısındaki kuralla uyumlu biçimde bilgilendirici; rapor scriptine proje sütunu ve WebKit budget filtresi eklendi. Hedefli ESLint exit 0.
- A9 tekrar ölçüm JSON kanıtı: `kanit/a9-repeat-performance-20261015.json`. Test runner ham ölçümleri/logları `D:/codex-pdf-a6-tmp-20261014` altında tutuldu; otomatik teardown kapalı olduğu için sentetik run klasörleri korunuyor.

## A2 ile aynı ölçüm grupları

| Grup | Metrik | A2 raw (5) | A2 medyan | A9 raw (5) | A9 medyan [min–max] |
|---|---|---|---:|---|---:|
| S1|desktop|a0-vektor|desktop | canvasBytesMB | 40.5, 40.5, 40.5, 40.5, 40.5 | 40.5 | 40.5, 40.5, 40.5, 40.5, 40.5 | 40.5 [40.5–40.5] |
| S1|desktop|a0-vektor|desktop | canvasMaxMP | 10, 10, 10, 10, 10 | 10 | 10, 10, 10, 10, 10 | 10 [10–10] |
| S1|desktop|a0-vektor|desktop | domNodes | 1033, 1033, 1033, 1033, 1033 | 1033 | 1029, 1029, 1029, 1029, 1029 | 1029 [1029–1029] |
| S1|desktop|a0-vektor|desktop | longTaskMs | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S1|desktop|a0-vektor|desktop | mountedPages | 1, 1, 1, 1, 1 | 1 | 1, 1, 1, 1, 1 | 1 [1–1] |
| S1|desktop|a0-vektor|desktop | scrollTopPx | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S1|desktop|a0-vektor|desktop | sharpMs | 3, 5, 13, 8, 12 | 8 | 1, 12, 15, 4, 8 | 8 [1–15] |
| S1|desktop|a0-vektor|desktop | ttfrMs | 1430, 1401, 1420, 1430, 1424 | 1424 | 1425, 1435, 1415, 1434, 1427 | 1427 [1415–1435] |
| S1|mobile|a0-vektor|mobile | canvasBytesMB | 21.1, 22.1, 22.7, 22.7, 22.1 | 22.1 | 22.1, 22.1, 21.1, 20.4, 22.1 | 22.1 [20.4–22.1] |
| S1|mobile|a0-vektor|mobile | canvasMaxMP | 0.3, 0.3, 0.3, 0.3, 0.3 | 0.3 | 0.3, 0.3, 0.3, 0.3, 0.3 | 0.3 [0.3–0.3] |
| S1|mobile|a0-vektor|mobile | domNodes | 1073, 1073, 1077, 1077, 1073 | 1073 | 1071, 1071, 1069, 1067, 1071 | 1071 [1067–1071] |
| S1|mobile|a0-vektor|mobile | longTaskMs | 55, 52, 0, 0, 56 | 52 | 0, 55, 0, 156, 0 | 0 [0–156] |
| S1|mobile|a0-vektor|mobile | mountedPages | 1, 1, 1, 1, 1 | 1 | 1, 1, 1, 1, 1 | 1 [1–1] |
| S1|mobile|a0-vektor|mobile | scrollTopPx | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S1|mobile|a0-vektor|mobile | sharpMs | 17, 24, 27, 32, 19 | 24 | 8, 5, 32, 32, 6 | 8 [5–32] |
| S1|mobile|a0-vektor|mobile | ttfrMs | 2662, 2648, 2628, 2608, 2678 | 2648 | 2671, 2706, 2651, 2783, 2664 | 2671 [2651–2783] |
| S4|desktop|metin-1000|desktop | blankFramesDuringScroll | 0, 0, 0, 0, 0 | 0 | 0, 4, 0, 0, 0 | 0 [0–4] |
| S4|desktop|metin-1000|desktop | blankSettleMs | 2, 8, 16, 7, 12 | 8 | 14, 5, 15, 9, 14 | 14 [5–15] |
| S4|desktop|metin-1000|desktop | domNodes | 251, 251, 251, 251, 251 | 251 | 247, 247, 247, 247, 247 | 247 [247–247] |
| S4|desktop|metin-1000|desktop | gapMaxMs | 16.8, 16.8, 16.8, 33.4, 16.8 | 16.8 | 16.8, 33.4, 16.8, 33.4, 16.8 | 16.8 [16.8–33.4] |
| S4|desktop|metin-1000|desktop | gapP95Ms | 16.7, 16.7, 16.8, 16.7, 16.8 | 16.7 | 16.7, 16.8, 16.7, 16.7, 16.7 | 16.7 [16.7–16.8] |
| S4|desktop|metin-1000|desktop | jank50 | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S4|desktop|metin-1000|desktop | longTaskMs | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S4|desktop|metin-1000|desktop | mountedPages | 3, 3, 3, 3, 3 | 3 | 3, 3, 3, 3, 3 | 3 [3–3] |
| S4|mobile|metin-1000|mobile | blankFramesDuringScroll | 3, 0, 0, 0, 0 | 0 | 0, 2, 0, 0, 0 | 0 [0–2] |
| S4|mobile|metin-1000|mobile | blankSettleMs | 5, 11, 4, 8, 15 | 8 | 3, 6, 12, 12, 12 | 12 [3–12] |
| S4|mobile|metin-1000|mobile | domNodes | 266, 266, 266, 266, 266 | 266 | 262, 262, 262, 262, 262 | 262 [262–262] |
| S4|mobile|metin-1000|mobile | gapMaxMs | 33.4, 16.8, 16.8, 16.8, 16.8 | 16.8 | 16.8, 33.4, 16.8, 16.8, 16.8 | 16.8 [16.8–33.4] |
| S4|mobile|metin-1000|mobile | gapP95Ms | 16.8, 16.7, 16.8, 16.8, 16.7 | 16.8 | 16.8, 16.7, 16.8, 16.8, 16.8 | 16.8 [16.7–16.8] |
| S4|mobile|metin-1000|mobile | jank50 | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S4|mobile|metin-1000|mobile | longTaskMs | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S4|mobile|metin-1000|mobile | mountedPages | 8, 8, 8, 8, 8 | 8 | 8, 8, 8, 8, 8 | 8 [8–8] |
| S5|mobile|karisik-60:out|mobile | anchorDriftPx | 0.57, 0.57, 0.57, 0.57, 0.57 | 0.57 | 0.57, 0.57, 0.57, 0.57, 0.57 | 0.57 [0.57–0.57] |
| S5|mobile|karisik-60:out|mobile | blankFrames | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S5|mobile|karisik-60:out|mobile | browserZoomDelta | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S5|mobile|karisik-60:out|mobile | gapMaxMs | 33.4, 33.4, 33.4, 33.4, 33.4 | 33.4 | 33.4, 33.4, 33.4, 33.5, 33.4 | 33.4 [33.4–33.5] |
| S5|mobile|karisik-60:out|mobile | longTaskMs | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S5|mobile|karisik-60:out|mobile | scaleRatioError | 0, 0, 0, 0, 0 | 0 | 0, 0, 0, 0, 0 | 0 [0–0] |
| S5|mobile|karisik-60:out|mobile | sharpMs | 11, 20, 2, 1, 20 | 11 | 25, 1, 1, 1, 1 | 1 [1–25] |
| S8|desktop|karisik-60|desktop | canvasBytesMB | 97.6, 97.6, 97.6, 97.6, 97.6 | 97.6 | 97.6, 97.6, 97.6, 97.6, 97.6 | 97.6 [97.6–97.6] |
| S8|desktop|karisik-60|desktop | heapGrowthMB | 1.3, 1.3, 1.3, 1.3, 1.3 | 1.3 | 1.2, 1.2, 1.2, 1.3, 1.2 | 1.2 [1.2–1.3] |
| S8|desktop|karisik-60|desktop | mountedPages | 3, 3, 3, 3, 3 | 3 | 3, 3, 3, 3, 3 | 3 [3–3] |
| S8|mobile|karisik-60|mobile | canvasBytesMB | 50.7, 50.7, 54.2, 51, 45.4 | 50.7 | 51, 47.6, 54.2, 43.9, 45 | 47.6 [43.9–54.2] |
| S8|mobile|karisik-60|mobile | heapGrowthMB | 4.8, 3.1, 3.1, 3.2, 3 | 3.1 | 3.5, 3.7, 3.1, 3.1, 3.3 | 3.3 [3.1–3.7] |
| S8|mobile|karisik-60|mobile | mountedPages | 8, 8, 8, 8, 8 | 8 | 8, 8, 8, 8, 8 | 8 [8–8] |

## Sınırlamalar

- A2 run ID: `20261014-173918-2c0b682-baseline-06`. A2 fixture manifestindeki A0, karışık-60, metin-1000 ve tarama-A3 hash’leri güncel test kopyasında eşleşmedi. A2 commit’indeki fixture üreticisi aynı `pdf-lib` sürümüyle yeniden çalıştırıldığında da tarihsel hash eşleşmesi oluşmadı. D kopyasının `.git` metadata’sı yoktur; güncel kaynak SHA ve A2’ye göre diff doğrulanamadı.

- Karşılaştırma A2’nin aynı hostta alınmış 5 tekrar medyanlarını kullanır. A9 tekrar grubunda WebKit veya CPU yavaşlatması yoktur; A2 ile aynı profil ve fixture seti korunmuştur.
- `test-results/pdf-v4/results.jsonl` kapsamlı gate ve ek tekrarları içerir; bu dosyanın önceki SHA yedeği ve tekrarlı altküme JSONL dosyaları geçici kanıt klasöründedir.
- Production database/Blob, canlı site, kullanıcı belgesi, gerçek iOS/Android cihazı veya OS print preview kullanılmadı. Bu kabul imzaları açık kalır.

