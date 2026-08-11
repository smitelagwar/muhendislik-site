import type { Metadata } from "next";
import { Eye, Lock, ShieldCheck } from "lucide-react";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Gizlilik ve KVKK",
  description: "Kişisel verilerin işlenmesi, saklanması ve kullanıcı gizliliğine ilişkin temel bilgilendirme metni.",
  pathname: "/gizlilik",
});

export default function Gizlilik() {
  return (
    <SitePageShell width="content" contentClassName="leading-relaxed">
      <SitePageHeader
        eyebrow="Yasal / Veri güvenliği"
        title="Gizlilik Politikası ve KVKK"
        description="Kişisel verilerin işlenmesi, saklanması ve kullanıcı gizliliğine ilişkin temel yaklaşımımız."
        icon={<ShieldCheck className="h-6 w-6" />}
      />

      <div className="mt-10 space-y-8">
        <section className="site-panel rounded-xl p-8">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <h2 className="m-0 text-2xl font-bold">Veri güvenliği</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            İnşa Blog, kullanıcı gizliliğine ve kişisel verilerin korunmasına önem verir. 6698 sayılı KVKK kapsamında toplanan veriler yalnızca hizmet deneyimini iyileştirmek ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Lock className="h-5 w-5" />
              <h3 className="font-bold">Hangi verileri işliyoruz</h3>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Ad, soyad ve e-posta adresi gibi üyelik bilgileri</li>
              <li>IP adresi ve anonim kullanım istatistikleri</li>
              <li>Çerezler üzerinden saklanan tercih ve oturum bilgileri</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Eye className="h-5 w-5" />
              <h3 className="font-bold">Veriler nasıl kullanılır</h3>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Veriler yalnızca portal deneyimini iyileştirmek, bildirim ve bilgilendirme akışlarını yönetmek ve yasal yükümlülükleri yerine getirmek için kullanılır. Reklam amaçlı üçüncü taraf paylaşımı yapılmaz.
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-xs italic text-zinc-500">Bu politika en son 23 Nisan 2026 tarihinde güncellenmiştir.</p>
      </div>
    </SitePageShell>
  );
}
