import { GitBranchPlus, Home, Route } from "lucide-react";
import { RouteFeedback } from "@/components/route-feedback";

export default function BinaAsamalariNotFound() {
  return (
    <RouteFeedback
      eyebrow="İçerik bulunamadı"
      title="Bu bina aşaması rehberi yayında değil"
      description="Aradığınız inşaat aşaması taşınmış ya da henüz yayınlanmamış olabilir. Ana rehber akışına dönerek mevcut aşamalardan devam edebilirsiniz."
      actions={[
        { href: "/kategori/bina-asamalari", label: "Bina aşamaları", icon: <GitBranchPlus className="h-4 w-4" /> },
        { href: "/konu-haritasi", label: "Konu haritası", icon: <Route className="h-4 w-4" />, variant: "outline" },
        { href: "/", label: "Ana sayfa", icon: <Home className="h-4 w-4" />, variant: "outline" },
      ]}
    />
  );
}
