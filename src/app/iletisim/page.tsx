import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Iletisim() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <div>
          <h1 className="mb-6 text-4xl font-extrabold text-blue-700 dark:text-blue-500">İletişime Geçin</h1>
          <p className="mb-10 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">Sorularınız, iş birliği teklifleriniz veya geri bildirimleriniz için bize ulaşabilirsiniz. En kısa sürede dönüş yapacağız.</p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">E-posta</h4>
                <a href="mailto:info@insablog.com" className="text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  info@insablog.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Telefon</h4>
                <a href="tel:+902125550000" className="text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  +90 (212) 555 00 00
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Ofis</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Teknopark İstanbul, Pendik / İstanbul</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-6 text-2xl font-bold">Hızlı iletişim</h3>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">Bu projede form backend’i olmadığı için mesaj akışını e-posta üzerinden yönlendiriyoruz. Aşağıdaki butonla konu satırı hazır bir e-posta taslağı açabilirsiniz.</p>
          <div className="mt-8 space-y-4">
            <Button asChild className="h-12 w-full gap-2 bg-blue-700 text-base font-bold text-white hover:bg-blue-800">
              <a href="mailto:info@insablog.com?subject=İnşa%20Blog%20İletişim">
                <Send className="h-4 w-4" />
                E-posta taslağını aç
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full text-base font-bold">
              <Link href="/konu-haritasi">Önce içerikleri incele</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
