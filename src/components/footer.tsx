import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-zinc-800 bg-zinc-950 py-16 text-sm text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 border-b border-zinc-800 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Link href="/" className="inline-flex">
                <Image
                  src="/logos/logo-transparent-white.svg"
                  alt="İnşa Blog"
                  width={216}
                  height={72}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <p className="mb-6 leading-relaxed text-zinc-400">
              Mühendisler ve mimarlar için güvenilir teknik bilgi, hesap araçları ve şantiye rehberleri sunan
              bağımsız dijital platform.
            </p>
            <a
              href="mailto:info@insablog.com?subject=%C4%B0n%C5%9Fa%20Blog%20%C4%B0leti%C5%9Fim"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 font-bold text-zinc-200 transition-colors hover:border-blue-500 hover:text-blue-400"
            >
              <Mail className="h-4 w-4" />
              İletişime geç
            </a>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-800 pb-2 pr-8 font-bold text-white">Hızlı Bağlantılar</h5>
            <ul className="flex flex-col gap-3">
              <li><Link href="/kategori/araclar" className="transition-colors hover:text-blue-400">Tüm Araçlar</Link></li>
              <li><Link href="/kategori/araclar/donati-hesabi" className="transition-colors hover:text-blue-400">Donatı Hesabı</Link></li>
              <li><Link href="/kategori/araclar/kolon-on-boyutlandirma" className="transition-colors hover:text-blue-400">Kolon Ön Boyutlandırma</Link></li>
              <li><Link href="/kategori/araclar/kiris-kesiti" className="transition-colors hover:text-blue-400">Kiriş Kesiti</Link></li>
              <li><Link href="/kategori/araclar/doseme-kalinligi" className="transition-colors hover:text-blue-400">Döşeme Kalınlığı</Link></li>
              <li><Link href="/kategori/araclar/pas-payi" className="transition-colors hover:text-blue-400">Pas Payı</Link></li>
              <li><Link href="/kategori/deprem-yonetmelik" className="transition-colors hover:text-blue-400">Deprem ve Yönetmelikler</Link></li>
              <li><Link href="/konu-haritasi" className="transition-colors hover:text-blue-400">Konu Haritası</Link></li>
              <li><Link href="/kategori/bina-asamalari" className="transition-colors hover:text-blue-400">Bina Aşamaları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-800 pb-2 pr-8 font-bold text-white">Kurumsal</h5>
            <ul className="flex flex-col gap-3">
              <li><Link href="/hakkimizda" className="transition-colors hover:text-blue-400">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="transition-colors hover:text-blue-400">İletişim</Link></li>
              <li><Link href="/gizlilik" className="transition-colors hover:text-blue-400">Gizlilik ve KVKK</Link></li>
              <li><Link href="/kullanim-kosullari" className="transition-colors hover:text-blue-400">Kullanım Koşulları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-800 pb-2 pr-8 font-bold text-white">İletişim</h5>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-blue-500" />
                <span>Teknopark İstanbul, No: 1, Pendik / İstanbul</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <a href="mailto:info@insablog.com" className="transition-colors hover:text-blue-400">info@insablog.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <a href="tel:+902125550000" className="transition-colors hover:text-blue-400">+90 (212) 555 00 00</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col gap-1">
            <p>&copy; {new Date().getFullYear()} İnşa Blog. Tüm hakları saklıdır.</p>
            <p className="text-[10px] text-zinc-600">Tasarım ve içerik mühendislik ekipleri için optimize edilmiştir.</p>
          </div>
          <p className="max-w-lg rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center text-xs text-zinc-500 md:text-right">
            <strong>Uyarı:</strong> Buradaki araçlar ve içerikler referans amaçlıdır. Nihai mühendislik kararı ve proje onayı,
            projeyi yürüten uzman ekibe aittir.
          </p>
        </div>
      </div>
    </footer>
  );
}
