# Vercel CLI & Canlı / Preview Test Kuralları

Bu çalışma alanında Vercel CLI doğrulanmış ve proje `muhendislik-site` (`huseying5713-2819s-projects`) ile bağlanmıştır (`vercel link`).

## Kurallar ve Talimatlar

1. **Vercel Preview ve Smoke Testleri Kesinlikle Uygulanmalıdır:**
   - Planlarda veya görevlerde yer alan Vercel Preview ve Production smoke testlerini atlama.
   - Gerekli görüldüğünde preview deployment oluştur (`vercel`), dönen Preview URL üzerinden uçtan uca smoke testleri ve kritik rota kontrollerini yap.

2. **Ortam Değişkenleri ve Veritabanı:**
   - Neon PostgreSQL, Vercel Blob ve Admin/Auth environment variable'ları Vercel üzerinde (`Production` & `Preview`) tanımlıdır.
   - Değişken durumları `vercel env ls` ile kontrol edilebilir; yerel dosya güncellemeleri için `vercel env pull .env.local` kullanılabilir.

3. **Doğrulama Adımları:**
   - Dağıtım tamamlandığında ilgili sayfa ve API rotalarının (Ana sayfa, `/dokumantasyon`, `/belgeler`, `/p/[token]` vb.) HTTP durumlarını ve işlevselliklerini test et.
