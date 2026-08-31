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
    id: "bina-asamalari",
    label: "Bina Aşamaları",
    href: "/kategori/bina-asamalari",
    matchPrefixes: ["/kategori/bina-asamalari"],
    iconKey: "building2",
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
    label: "Dökümantasyon",
    href: "/dokumantasyon",
    matchPrefixes: ["/dokumantasyon"],
    iconKey: "folder-archive",
  },
  {
    id: "yapi-tasarimi",
    label: "Yapı",
    href: "/kategori/yapi-tasarimi",
    matchPrefixes: ["/kategori/yapi-tasarimi"],
    iconKey: "hard-hat",
  },
  {
    id: "santiye",
    label: "Şantiye",
    href: "/kategori/santiye",
    matchPrefixes: ["/kategori/santiye"],
    iconKey: "hard-hat",
  },
  {
    id: "konu-haritasi",
    label: "Konu Haritası",
    href: "/konu-haritasi",
    matchPrefixes: ["/konu-haritasi"],
    iconKey: "map",
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

export const BOTTOM_NAV_ITEMS: SiteNavigationItem[] = [
  PRIMARY_NAV_ITEMS[0],
  PRIMARY_NAV_ITEMS[3],
  {
    id: "kaydedilenler",
    label: "Kaydedilenler",
    href: "/kaydedilenler",
    matchPrefixes: ["/kaydedilenler"],
  },
  {
    id: "iletisim",
    label: "İletişim",
    href: "/iletisim",
    matchPrefixes: ["/iletisim"],
  },
];

export function isNavigationItemActive(pathname: string, item: SiteNavigationItem) {
  return item.matchPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );
}


