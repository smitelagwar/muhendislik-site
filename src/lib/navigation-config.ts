export interface SiteNavigationItem {
  id: string;
  label: string;
  href: string;
  matchPrefixes: string[];
  /** Lucide icon key for visual identification */
  iconKey?: string;
}

export const PRIMARY_NAV_ITEMS: SiteNavigationItem[] = [
  { id: "home", label: "Ana Sayfa", href: "/", matchPrefixes: ["/"], iconKey: "home" },
  {
    id: "deprem-yonetmelik",
    label: "Mevzuat",
    href: "/kategori/deprem-yonetmelik",
    matchPrefixes: ["/kategori/deprem-yonetmelik"],
    iconKey: "scale",
  },
  {
    id: "hesaplamalar",
    label: "Hesaplamalar",
    href: "/hesaplamalar",
    matchPrefixes: ["/hesaplamalar"],
    iconKey: "calculator",
  },
  {
    id: "araclar",
    label: "Araçlar",
    href: "/kategori/araclar",
    matchPrefixes: ["/kategori/araclar", "/araclar"],
    iconKey: "wrench",
  },
  {
    id: "belgeler",
    label: "Belgeler",
    href: "/belgeler",
    matchPrefixes: ["/belgeler"],
    iconKey: "file-down",
  },
  {
    id: "dokumantasyon",
    label: "Dokümantasyon",
    href: "/dokumantasyon",
    matchPrefixes: ["/dokumantasyon"],
    iconKey: "folder-archive",
  },
];

export const MOBILE_NAV_ITEMS: SiteNavigationItem[] = [
  ...PRIMARY_NAV_ITEMS,
  {
    id: "iletisim",
    label: "İletişim",
    href: "/iletisim",
    matchPrefixes: ["/iletisim"],
  },
];

const BOTTOM_NAV_IDS = new Set(["home", "araclar", "belgeler", "dokumantasyon"]);

export const BOTTOM_NAV_ITEMS: SiteNavigationItem[] = PRIMARY_NAV_ITEMS.filter((item) =>
  BOTTOM_NAV_IDS.has(item.id),
);

export function isNavigationItemActive(pathname: string, item: SiteNavigationItem) {
  return item.matchPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );
}
