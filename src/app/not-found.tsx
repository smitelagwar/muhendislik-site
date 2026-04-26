import { Home, Route, Wrench } from "lucide-react";
import { RouteFeedback } from "@/components/route-feedback";

export default function NotFound() {
  return (
    <RouteFeedback
      eyebrow="404"
      title="Aradığınız sayfa bulunamadı"
      description="Bağlantı değişmiş, içerik kaldırılmış veya adres hatalı yazılmış olabilir. Ana sayfaya dönebilir, konu haritasından ilerleyebilir ya da hesap araçlarını açabilirsiniz."
      actions={[
        { href: "/", label: "Ana sayfa", icon: <Home className="h-4 w-4" /> },
        { href: "/konu-haritasi", label: "Konu haritası", icon: <Route className="h-4 w-4" />, variant: "outline" },
        { href: "/kategori/araclar", label: "Araçlar", icon: <Wrench className="h-4 w-4" />, variant: "outline" },
      ]}
    />
  );
}
