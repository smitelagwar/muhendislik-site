export interface SiteNavigationItem {
  id: string;
  label: string;
  href: string;
  matchPrefixes: string[];
}

export const PRIMARY_NAV_ITEMS: SiteNavigationItem[] = [
  { id: "home", label: "Ana Sayfa", href: "/", matchPrefixes: ["/"] },
  {
    id: "deprem-yonetmelik",
    label: "Mevzuat",
    href: "/kategori/deprem-yonetmelik",
    matchPrefixes: ["/kategori/deprem-yonetmelik"],
  },
  {
    id: "hesaplamalar",
    label: "Hesaplamalar",
    href: "/hesaplamalar",
    matchPrefixes: ["/hesaplamalar"],
  },
  {
    id: "araclar",
    label: "Araçlar",
    href: "/kategori/araclar",
    matchPrefixes: ["/kategori/araclar", "/araclar"],
  },
  {
    id: "bina-asamalari",
    label: "Bina Aşamaları",
    href: "/kategori/bina-asamalari",
    matchPrefixes: ["/kategori/bina-asamalari"],
  },
  {
    id: "yapi-tasarimi",
    label: "Yapı",
    href: "/kategori/yapi-tasarimi",
    matchPrefixes: ["/kategori/yapi-tasarimi"],
  },
  {
    id: "santiye",
    label: "Şantiye",
    href: "/kategori/santiye",
    matchPrefixes: ["/kategori/santiye"],
  },
  {
    id: "konu-haritasi",
    label: "Konu Haritası",
    href: "/konu-haritasi",
    matchPrefixes: ["/konu-haritasi"],
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
    id: "profil",
    label: "Profil",
    href: "/giris",
    matchPrefixes: ["/giris", "/kayit"],
  },
];

export function isNavigationItemActive(pathname: string, item: SiteNavigationItem) {
  return item.matchPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
  );
}
