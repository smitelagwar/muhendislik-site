# GEMINI.md — muhendislik-site Agent Context

Tam proje bağlamı için PROJECT.md dosyasını oku. Aşağıdakiler Gemini CLI'ya özel notlardır.

---

## Gemini'ye Özel Notlar

- Bu proje Next.js 14 App Router + TypeScript + Tailwind CSS kullanır — Vercel'e deploy edilir
- Tüm UI metinleri ve kod yorumları Türkçe olmalı
- Dark industrial tema korunacak — açık arka plan ekleme
- Mevcut calculator formüllerine dokunma (TS 500, TBDY 2018, TS EN 1992-1-1 standartlarına bağlı)
- Türkçe karakter için font tanımında `latin-ext` subset zorunlu

## Multimodal Görevler

Gemini'nin görsel anlama kapasitesi şu görevlerde kullan:

- Ekran görüntüsünden UI hatası analizi
- Tasarım mockup'ından component koduna dönüşüm
- PDF mühendislik çizimleri veya hesap raporlarından veri çıkarma
- D3.js görselleştirme layout'u için referans görsel analizi

## Komut Formatı

```
Use @skill-name to ...        # Skill çağırma
(User Prompt) görev açıkla   # Doğrudan görev
```
