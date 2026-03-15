# Vercel'e Ücretsiz Yayınlama Rehberi

Bu rehber teknik bilgisi az olan biri için sıfırdan yazıldı. Amaç: projeyi GitHub'a koymak, Vercel'e bağlamak ve ücretsiz `.vercel.app` adresiyle yayına almak.

## 1. GitHub Hesabı Aç
1. Tarayıcıdan `https://github.com` adresine gir.
2. Sağ üstte `Sign up` butonuna tıkla.
3. E-posta adresini yaz, şifre oluştur, kullanıcı adı seç.
4. E-posta doğrulama adımını tamamla.

## 2. Vercel Hesabı Aç
1. Tarayıcıdan `https://vercel.com` adresine gir.
2. `Sign Up` seçeneğine tıkla.
3. En kolay seçenek olarak `Continue with GitHub` ile giriş yap.
4. Gerekirse GitHub hesabına bağlanma izni ver.

## 3. Bu Klasörü Git Deposuna Çevir
Bu proje klasöründe terminal aç ve aşağıdaki komutları sırayla çalıştır:

```bash
git init
git branch -M main
git add .
git commit -m "chore: prepare project for vercel deployment"
```

Bu işlem ne yapar:
- `git init`: klasörü Git projesi yapar
- `git branch -M main`: ana branch adını `main` yapar
- `git add .`: gerekli dosyaları hazırlık listesine alır
- `git commit ...`: ilk kayıt noktasını oluşturur

## 4. GitHub'da Yeni Repo Aç
1. GitHub ana sayfasında sağ üstteki `+` simgesine tıkla.
2. `New repository` seç.
3. Repository name alanına örnek olarak `insa-blog` yaz.
4. `Public` seçebilirsin.
5. `Create repository` butonuna bas.

## 5. Yereldeki Projeyi GitHub'a Yükle
GitHub yeni repo ekranında sana birkaç komut gösterecek. Bu projede aşağıdakileri kullan:

```bash
git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
git push -u origin main
```

`KULLANICI_ADIN` ve `REPO_ADIN` kısmını GitHub'daki kendi bilgilerinizle değiştir.

## 6. Vercel'de Import Project Yap
1. Vercel paneline gir.
2. `Add New` veya `New Project` butonuna tıkla.
3. GitHub repo listesinde bu projeyi bul.
4. `Import` butonuna bas.
5. Framework otomatik olarak `Next.js` olarak algılanmalıdır.

Kontrol etmen gereken ayarlar:
- Install Command: `npm ci`
- Build Command: `npm run build`

Bu ayarlar yanlış görünüyorsa düzelt, sonra `Deploy` butonuna bas.

## 7. İlk Deploy Sonrası Domaini Kopyala
Deploy tamamlanınca Vercel sana buna benzer ücretsiz bir adres verir:

```text
https://proje-adi.vercel.app
```

Bu adresi kopyala. Bir sonraki adımda lazım olacak.

## 8. Vercel'e Environment Variable Gir
1. Vercel'de proje içine gir.
2. `Settings` sekmesine geç.
3. `Environment Variables` bölümünü aç.
4. Yeni değişken ekle:

```text
Name: NEXT_PUBLIC_SITE_URL
Value: https://proje-adi.vercel.app
Environment: Production
```

5. Kaydet.

Bu neden gerekli:
- canonical URL doğru olsun
- `robots.txt` doğru domaini göstersin
- `sitemap.xml` doğru domainle oluşsun
- Open Graph / paylaşım linkleri doğru adrese baksın

## 9. İkinci Kez Deploy Et
Environment variable eklendikten sonra projeyi tekrar deploy et.

En kolay yöntem:
1. Vercel projesinde `Deployments` sekmesine git.
2. Son deploy kaydında `Redeploy` seç.

Alternatif yöntem:
```bash
git add .
git commit -m "chore: set production site url"
git push
```

## 10. Yayın Sonrası Kontrol Listesi
Tarayıcıda şunları aç ve kontrol et:
- Ana sayfa açılıyor mu
- `/kategori/araclar` açılıyor mu
- Bir makale sayfası açılıyor mu
- `/iletisim` açılıyor mu
- `/robots.txt` açılıyor mu
- `/sitemap.xml` açılıyor mu
- Tarayıcı sekmesinde favicon görünüyor mu

Ek kontrol:
- `/admin` adresine girince ana sayfaya dönmeli
- canlı sitede admin paneli açık olmamalı

## 11. Sonraki Güncellemelerde Ne Yapacağım?
Siteyi güncellemek için genel akış hep aynı:
1. Dosyalarda değişiklik yap
2. Terminalde şu komutları çalıştır

```bash
git add .
git commit -m "içerik veya tasarım güncellemesi"
git push
```

3. Vercel yeni deploy'u otomatik başlatır
4. Deploy bitince site yeni haliyle yayına çıkar

## 12. İçerik Güncelleme Notu
Bu projede canlı sitedeki admin paneli kapalıdır. Bunun nedeni Vercel üzerinde dosyaya yazılan değişikliklerin kalıcı olmamasıdır.

İçerik eklemek veya düzenlemek için doğru yöntem:
1. `src/lib/data.json` dosyasını güncelle
2. değişikliği commit et
3. GitHub'a push et
4. Vercel'in yeniden deploy etmesini bekle

## 13. Deploy Hatası Olursa Nereye Bakacağım?
1. Vercel projesinde `Deployments` sekmesine gir
2. Kırmızı veya failed görünen deploy kaydına tıkla
3. `Build Logs` bölümünü aç
4. Genelde hata satırlarında şu başlıklar olur:
- `npm run build`
- TypeScript error
- ESLint error
- Missing environment variable

Eğer hata yeni bir değişiklikten sonra başladıysa:
1. son çalışan commit'e dön
2. düzeltme yap
3. tekrar `git commit` + `git push`

## 14. Preview ve Production Farkı
- Preview deploy: test amaçlı geçici sürüm
- Production deploy: gerçek yayın

SEO açısından önemli olan production domainidir. `NEXT_PUBLIC_SITE_URL` değeri preview adresi değil, gerçek production `.vercel.app` adresi olmalıdır.
