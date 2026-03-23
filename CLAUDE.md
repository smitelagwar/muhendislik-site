# CLAUDE.md — muhendislik-site Agent Context

Tam proje bağlamı için PROJECT.md dosyasını oku. Aşağıdakiler Claude Code'a özel notlardır.

---

## Claude Code'a Özel Notlar

- Bu proje Next.js 14 App Router + TypeScript + Tailwind CSS kullanır — Vercel'e deploy edilir
- Tüm UI metinleri ve kod yorumları Türkçe olmalı
- Dark industrial tema korunacak — açık arka plan ekleme
- Mevcut calculator formüllerine dokunma (TS 500, TBDY 2018, TS EN 1992-1-1 standartlarına bağlı)
- Türkçe karakter için font tanımında `latin-ext` subset zorunlu

## GSD Entegrasyonu

Bu projede [GSD](https://github.com/gsd-build/get-shit-done) sistemi kurulu. Faz bazlı çalışma:

```
/gsd:discuss-phase <n>   # Görev öncesi bağlam topla
/gsd:plan-phase <n>      # Araştır ve planla
/gsd:execute-phase <n>   # Uygula
/gsd:verify-work <n>     # Doğrula
/gsd:quick               # Ad-hoc küçük görevler için
```

Planlama dosyaları `.planning/` klasöründe tutulur — bunları silme veya manuel düzenleme.

## Uzun Bağlam Kullanımı

Claude'un uzun bağlam kapasitesini şu görevlerde kullan:

- Birden fazla dosyayı aynı anda analiz ederek tutarlılık kontrolü
- Calculator formüllerinin standart belgesiyle karşılaştırılması
- Büyük refactor öncesi tüm bağımlılıkların taranması

## Komut Formatı

```
>> /skill-name görev açıkla   # Skill çağırma
/gsd:quick görev açıkla       # GSD hızlı görev
```
