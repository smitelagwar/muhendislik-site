import type { Metadata } from "next";
import { FileText, Scale, ShieldAlert } from "lucide-react";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

const TERMS = [
  {
    title: "Bilgilendirme Niteliği",
    icon: FileText,
    text: "İnşa Blog üzerindeki yazılar, hesap araçları ve rehberler referans amaçlıdır. Nihai tasarım, proje ve uygulama kararları kullanıcıya ve ilgili uzman ekibe aittir.",
  },
  {
    title: "Mesleki Sorumluluk",
    icon: Scale,
    text: "Araç çıktıları, projeye özel statik analiz, uygulama detayı, saha ölçümü ve yürürlükteki mevzuat ile birlikte değerlendirilmelidir. Tek başına bağlayıcı proje çıktısı olarak kullanılmamalıdır.",
  },
  {
    title: "İçerik ve Güncelleme",
    icon: ShieldAlert,
    text: "Site içeriği sürekli güncellenir; ancak mevzuat değişiklikleri veya saha koşulları nedeniyle her içerik her proje için doğrudan uygun olmayabilir. Kullanıcı, güncel mevzuatı ayrıca doğrulamakla yükümlüdür.",
  },
];

export const metadata: Metadata = buildSeoMetadata({
  title: "Kullanım Koşulları",
  description: "Sitedeki teknik içeriklerin, hesap araçlarının ve rehberlerin kullanım sınırlarını açıklayan yasal metin.",
  pathname: "/kullanim-kosullari",
});

export default function KullanimKosullariPage() {
  return (
    <SitePageShell width="wide">
      <SitePageHeader
        eyebrow="Yasal metin"
        title="Kullanım Koşulları"
        description="İnşa Blog üzerindeki teknik içeriklerin ve araçların kullanım sınırları ile mesleki sorumluluk çerçevesi."
        icon={<Scale className="h-6 w-6" />}
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TERMS.map((item) => {
          const Icon = item.icon;
          return (
            <section
              key={item.title}
              className="site-panel rounded-xl p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-zinc-950 dark:text-white">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{item.text}</p>
            </section>
          );
        })}
      </div>

      <div className="site-panel mt-10 rounded-xl p-8">
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Sorularınız için{" "}
          <a className="font-bold text-blue-600 hover:underline dark:text-blue-400" href="mailto:info@insablog.com">
            info@insablog.com
          </a>{" "}
          adresi üzerinden bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </SitePageShell>
  );
}
