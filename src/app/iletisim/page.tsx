import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "İletişim",
  description: "İçerik önerileri, iş birliği talepleri ve teknik geri bildirimler için iletişim sayfası.",
  pathname: "/iletisim",
});

export default function Iletisim() {
  return (
    <SitePageShell width="wide">
      <SitePageHeader
        eyebrow="Kurumsal / İletişim"
        title="İletişime geçin"
        description="Sorularınız, iş birliği teklifleriniz veya teknik geri bildirimleriniz için bize ulaşabilirsiniz."
        icon={<Mail className="h-6 w-6" />}
      />
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="space-y-6">
            <div className="site-panel flex items-center gap-4 rounded-xl p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">E-posta</h4>
                <a href="mailto:hsyn188@gmail.com" className="text-muted-foreground hover:text-blue-700 dark:hover:text-blue-300">
                  hsyn188@gmail.com
                </a>
              </div>
            </div>

            <div className="site-panel flex items-center gap-4 rounded-xl p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Ofis</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Yozgat / Akdağmadeni</p>
              </div>
            </div>
          </div>
        </div>

        <div className="site-panel rounded-xl p-8">
          <h3 className="mb-6 text-2xl font-bold">Hızlı iletişim</h3>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Bu projede form backend&apos;i olmadığı için mesaj akışını e-posta üzerinden yönlendiriyoruz. Aşağıdaki butonla konu satırı hazır bir e-posta taslağı açabilirsiniz.
          </p>
          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full gap-2 text-base">
              <a href="mailto:hsyn188@gmail.com?subject=%C4%B0n%C5%9Fa%20Blog%20%C4%B0leti%C5%9Fim">
                <Send className="h-4 w-4" />
                E-posta taslağını aç
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full text-base">
              <Link href="/konu-haritasi">Önce içerikleri incele</Link>
            </Button>
          </div>
        </div>
      </div>
    </SitePageShell>
  );
}
