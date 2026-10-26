import HsynCadWorkbench from "@/components/hsyncad/workbench";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";

const title = "hsynCAD — 2B / 3B Yapı Modelleme ve Metraj";
const description = "Aks, kolon, kiriş, perde ve döşeme çizin; eşzamanlı 3B modeli, beton hacmini ve kalıp alanını tarayıcınızda görün.";
const pathname = "/kategori/araclar/hsyncad";

export const metadata = buildSeoMetadata({ title, description, pathname, keywords: ["hsynCAD", "yapı modelleme", "beton metrajı", "kalıp metrajı", "2B 3B çizim"] });

export default function HsynCadPage() {
  return <><SoftwareApplicationJsonLd name={title} description={description} pathname={pathname} section={{ title: "Araçlar", href: "/kategori/araclar" }} /><HsynCadWorkbench /></>;
}
