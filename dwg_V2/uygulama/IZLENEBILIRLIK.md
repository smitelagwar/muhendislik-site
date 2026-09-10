# Gereksinim → kod → test → kanıt → bağımsız kabul

[Kayıt dizini](README.md) · [Gereksinim anlamları](../24_GEREKSINIM_KATALOGU.md) · [Kanıt sistemi](../20_KAYIT_VE_KANIT_SISTEMI.md)

**Başlangıç: uygulama yok.** Bütün 48 R kaydı açık. Gemini kaynak/test/kanıt alanlarına gerçek dosya-sembol ve RUN/ART/SNAP yazar. Bir R'nin alt koşulları paket kaydında ayrıca gösterilir. Bağımsız kabul alanı yalnız Astra'nındır. Testten sonra etkilenen kod değişirse sonuç yeni snapshot için yeniden kontrol gerektirir.

| R | G | Kaynak dosya / sembol | Gerçek test / oracle | RUN / ART / SNAP | Uygulama | Test sonucu | Astra denetimi |
|---|---|---|---|---|---|---|---|
| R01 | G00,G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R02 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R03 | G02,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R04 | G02 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R05 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R06 | G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R07 | G05,G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R08 | G07 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R09 | G07,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R10 | G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R11 | G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R12 | G06,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R13 | G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R14 | G09,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R15 | G02,G09,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R16 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R17 | G03,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R18 | G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R19 | G11,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R20 | G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R21 | G05,G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R22 | G05 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R23 | G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R24 | G05,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R25 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R26 | G12,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R27 | G11,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R28 | G03,G10,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R29 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R30 | G12,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R31 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R32 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R33 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R34 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R35 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R36 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R37 | G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R38 | G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R39 | G02,G07,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R40 | G00,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R41 | G00,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R42 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R43 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R44 | G15,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R45 | G05,G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R46 | G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R47 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R48 | G17 ve denetim turları | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |

NOT_RUN başarısızlık veya başarı uydurmaz; kontrolün yapılmadığını belirtir. R47 production koşulları yerel container testinden ayrı, R48 bağımsız kabul Gemini'nin uygulamasından ayrı kalır. Satırlar silinmez veya topluca PASS yapılmaz.
