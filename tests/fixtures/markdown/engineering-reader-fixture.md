# Markdown Reader Engineering Fixture

Bu fixture Markdown Reader V2 doğrulaması için hazırlanmıştır.

Maliyet yaklaşık $120 olabilir.

Inline matematik: $V_i$, $V_{w,i}$ ve $\sigma$ aynı satırda doğal akmalıdır.

## Kesme kuvveti $V_i$

Deprem doğrultusunda toplam kat kesmesi:

$$
V_i = V_{w,i} + V_{f,i}
$$

Moment toplamı:

$$
M_o = \sum_{i=1}^{n} F_i h_i
$$

Gerilme:

$$
\sigma = \frac{N}{A}
$$

Matris:

$$
\mathbf{K} =
\begin{bmatrix}
k_{11} & k_{12} \\
k_{21} & k_{22}
\end{bmatrix}
$$

### Uzun denklem

$$
V_{Ed,design,long,engineering,expression} =
\frac{\left(\sum_{i=1}^{n} F_i h_i\right)\left(E_c I_{eff}\right)}
{\left(1 + \theta_{second\ order}\right)\left(\gamma_{Rd}\right)}
+ V_{wall,contribution} + V_{frame,contribution} + V_{coupling,beam,contribution}
$$

## Teknik tablo

| Kat | $V_i$ (kN) | $M_i$ (kNm) | Açıklama |
| --- | ---: | ---: | --- |
| Zemin | 425.50 | 1,286.20 | Referans kat |
| 1 | 378.25 | 1,041.80 | Perde + çerçeve |
| 2 | 301.10 | 812.40 | Üst kat |
| 3 | 214.70 | 566.90 | Çatı altı |

## Liste davranışı

- Perde kontrolü
- Kolon kontrolü
- Kiriş kontrolü

1. Geometriyi doğrula
2. Yükleri doğrula
3. Sonuçları karşılaştır

- [x] Matematik desteği
- [ ] Mobil taşma kontrolü

## Kod bloğu kontrolü

Aşağıdaki fenced code içindeki satır TOC/section başlığı değildir:

```md
# SAHTE KOD BAŞLIĞI
## Bu da başlık değildir
const engineeringValue = "$$ raw code $$";
```

~~~txt
### TILDE SAHTE BAŞLIK
Bu satır da kod bloğu içindedir.
~~~

## Uzun bölüm

Teknik uzun bölüm satırı 001: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 002: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 003: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 004: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 005: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 006: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 007: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 008: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 009: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 010: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 011: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 012: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 013: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 014: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 015: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 016: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 017: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 018: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 019: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 020: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 021: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 022: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 023: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 024: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 025: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 026: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 027: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 028: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 029: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 030: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 031: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 032: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 033: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 034: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 035: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 036: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 037: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 038: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 039: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 040: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 041: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 042: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 043: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 044: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 045: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 046: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 047: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 048: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 049: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 050: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 051: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 052: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 053: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 054: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 055: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 056: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 057: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 058: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 059: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 060: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 061: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 062: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 063: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 064: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 065: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 066: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 067: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 068: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 069: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 070: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 071: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 072: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 073: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 074: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 075: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 076: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 077: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 078: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 079: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 080: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 081: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 082: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 083: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 084: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 085: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 086: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 087: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 088: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 089: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 090: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 091: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 092: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 093: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 094: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 095: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 096: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 097: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 098: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 099: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 100: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 101: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 102: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 103: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 104: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 105: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 106: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 107: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 108: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 109: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 110: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 111: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 112: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 113: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 114: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 115: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 116: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 117: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 118: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 119: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 120: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 121: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 122: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 123: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 124: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 125: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 126: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 127: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 128: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 129: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 130: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 131: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 132: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 133: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 134: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 135: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 136: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 137: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 138: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 139: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 140: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 141: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 142: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 143: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 144: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 145: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 146: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 147: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 148: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 149: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 150: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 151: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 152: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 153: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 154: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 155: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 156: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 157: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 158: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 159: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

Teknik uzun bölüm satırı 160: perde, kolon, kiriş ve kat davranışı için okuma sürekliliği kontrolü.

LONG_SECTION_END
