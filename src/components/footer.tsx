"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-white/10 bg-[#04060a] pb-24 pt-16 text-sm text-slate-400 md:pb-16">
      {isHome ? <div className="home-grid-backdrop absolute inset-0 opacity-50" /> : null}

      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-16">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <div>
            <Link href="/" className="inline-flex">
              <Image
                src="/logos/logo-transparent-white.svg"
                alt="İnşa Blog"
                width={216}
                height={72}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-md leading-8 text-slate-400">
              Mühendisler ve mimarlar için güvenilir teknik bilgi, hesap araçları ve şantiye rehberleri sunan bağımsız
              dijital çalışma yüzeyi.
            </p>
            <a
              href="mailto:info@insablog.com?subject=Insa%20Blog%20Iletisim"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-slate-100 transition-colors hover:border-amber-400/35 hover:text-white"
            >
              <Mail className="h-4 w-4 text-amber-300" />
              İletişime geç
            </a>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Hızlı bağlantılar</h5>
            <ul className="mt-5 space-y-3">
              <li><Link href="/kategori/araclar" className="transition-colors hover:text-white">Tüm araçlar</Link></li>
              <li><Link href="/hesaplamalar" className="transition-colors hover:text-white">Hesaplamalar</Link></li>
              <li><Link href="/kategori/deprem-yonetmelik" className="transition-colors hover:text-white">Deprem ve mevzuat</Link></li>
              <li><Link href="/konu-haritasi" className="transition-colors hover:text-white">Konu haritası</Link></li>
              <li><Link href="/kategori/bina-asamalari" className="transition-colors hover:text-white">Bina aşamaları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Kurumsal</h5>
            <ul className="mt-5 space-y-3">
              <li><Link href="/hakkimizda" className="transition-colors hover:text-white">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link></li>
              <li><Link href="/gizlilik" className="transition-colors hover:text-white">Gizlilik ve KVKK</Link></li>
              <li><Link href="/kullanim-kosullari" className="transition-colors hover:text-white">Kullanım koşulları</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">İletişim</h5>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                <span>Teknopark İstanbul, No: 1, Pendik / İstanbul</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-cyan-300" />
                <a href="mailto:info@insablog.com" className="transition-colors hover:text-white">info@insablog.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-cyan-300" />
                <a href="tel:+902125550000" className="transition-colors hover:text-white">+90 (212) 555 00 00</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p>&copy; {new Date().getFullYear()} İnşa Blog. Tüm hakları saklıdır.</p>
            <p className="text-xs text-slate-600">
              Tasarım ve içerik, mühendislik ekiplerinin hızlı ve kontrollü karar alması için optimize edilmiştir.
            </p>
          </div>

          <p className="max-w-2xl rounded-lg border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
            <strong>Uyarı:</strong> Buradaki araçlar ve içerikler ön boyutlandırma ve referans amaçlıdır. Nihai
            mühendislik kararı, projeyi yürüten uzman ekip tarafından verilmelidir.
          </p>
        </div>
      </div>
    </footer>
  );
}
