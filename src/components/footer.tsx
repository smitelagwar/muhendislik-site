import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-zinc-900 bg-zinc-950 pb-24 pt-16 text-sm text-zinc-400 md:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 border-b border-zinc-900 pb-12 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
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
              Mühendisler ve mimarlar için güvenilir teknik bilgi, hesap araçları ve şantiye rehberleri sunan bağımsız dijital platform.
            </p>
            <a
              href="mailto:info@insablog.com?subject=Insa%20Blog%20Iletisim"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 font-bold text-zinc-200 transition-colors hover:border-amber-400/35 hover:text-amber-200"
            >
              <Mail className="h-4 w-4" />
              İletişime geç
            </a>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-900 pb-2 pr-8 font-bold text-white">Hızlı Bağlantılar</h5>
            <ul className="flex flex-col gap-3">
              <li><Link href="/kategori/araclar" className="transition-colors hover:text-amber-200">Tüm Araçlar</Link></li>
              <li><Link href="/kategori/araclar/donati-hesabi" className="transition-colors hover:text-amber-200">Donatı Hesabı</Link></li>
              <li><Link href="/kategori/araclar/kolon-on-boyutlandirma" className="transition-colors hover:text-amber-200">Kolon Ön Boyutlandırma</Link></li>
              <li><Link href="/kategori/araclar/kiris-kesiti" className="transition-colors hover:text-amber-200">Kiriş Kesiti</Link></li>
              <li><Link href="/kategori/araclar/doseme-kalinligi" className="transition-colors hover:text-amber-200">Döşeme Kalınlığı</Link></li>
              <li><Link href="/kategori/araclar/pas-payi" className="transition-colors hover:text-amber-200">Pas Payı</Link></li>
              <li><Link href="/kategori/deprem-yonetmelik" className="transition-colors hover:text-amber-200">Deprem ve Mevzuat</Link></li>
              <li><Link href="/konu-haritasi" className="transition-colors hover:text-amber-200">Konu Haritası</Link></li>
              <li><Link href="/kategori/bina-asamalari" className="transition-colors hover:text-amber-200">Bina Aşamaları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-900 pb-2 pr-8 font-bold text-white">Kurumsal</h5>
            <ul className="flex flex-col gap-3">
              <li><Link href="/hakkimizda" className="transition-colors hover:text-amber-200">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="transition-colors hover:text-amber-200">İletişim</Link></li>
              <li><Link href="/gizlilik" className="transition-colors hover:text-amber-200">Gizlilik ve KVKK</Link></li>
              <li><Link href="/kullanim-kosullari" className="transition-colors hover:text-amber-200">Kullanım Koşulları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="mb-6 w-fit border-b border-zinc-900 pb-2 pr-8 font-bold text-white">İletişim</h5>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-amber-300" />
                <span>Teknopark İstanbul, No: 1, Pendik / İstanbul</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-300" />
                <a href="mailto:info@insablog.com" className="transition-colors hover:text-amber-200">info@insablog.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-300" />
                <a href="tel:+902125550000" className="transition-colors hover:text-amber-200">+90 (212) 555 00 00</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col gap-1">
            <p>&copy; {new Date().getFullYear()} İnşa Blog. Tüm hakları saklıdır.</p>
            <p className="text-[10px] text-zinc-600">Tasarım ve içerik, mühendislik ekiplerinin hızlı karar alması için optimize edilmiştir.</p>
          </div>
          <p className="max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-center text-xs text-zinc-500 md:text-right">
            <strong>Uyarı:</strong> Buradaki araçlar ve içerikler ön boyutlandırma ve referans amaçlıdır. Nihai mühendislik kararı, projeyi yürüten uzman ekip tarafından verilmelidir.
          </p>
        </div>
      </div>
    </footer>
  );
}
