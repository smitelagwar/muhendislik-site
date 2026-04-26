import { GitBranchPlus, Home, Route, Wrench } from "lucide-react";
import { RouteFeedback } from "@/components/route-feedback";

export default function CategoryNotFound() {
  return (
    <RouteFeedback
      eyebrow="Kategori bulunamadı"
      title="Bu kategori yayında değil"
      description="Kategori adresi hatalı olabilir veya içerik farklı bir başlık altında toplanmış olabilir. Site haritası ve ana kategori girişleriyle güvenli şekilde devam edebilirsiniz."
      actions={[
        { href: "/", label: "Ana sayfa", icon: <Home className="h-4 w-4" /> },
        { href: "/kategori/bina-asamalari", label: "Bina aşamaları", icon: <GitBranchPlus className="h-4 w-4" />, variant: "outline" },
        { href: "/kategori/araclar", label: "Araçlar", icon: <Wrench className="h-4 w-4" />, variant: "outline" },
        { href: "/konu-haritasi", label: "Konu haritası", icon: <Route className="h-4 w-4" />, variant: "outline" },
      ]}
    />
  );
}
