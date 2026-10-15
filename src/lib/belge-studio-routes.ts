export const BELGE_STUDIO_ROUTE_TITLES = {
  "/belgeler/beton-dokum-tutanagi": "Beton Döküm Tutanağı",
  "/belgeler/insaat-ruhsati-dilekcesi": "İnşaat Ruhsatı Dilekçesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi": "Şantiye Şefi İstifa Dilekçesi",
  "/belgeler/santiye-sefi-sozlesmesi": "Şantiye Şefi Hizmet Sözleşmesi",
  "/belgeler/santiye-sefi-taahhutnamesi": "Şantiye Şefi Taahhütnamesi",
} as const;

export type BelgeStudioRoute = keyof typeof BELGE_STUDIO_ROUTE_TITLES;

export function getBelgeStudioTitle(pathname: string | null | undefined): string | null {
  if (!pathname || !Object.hasOwn(BELGE_STUDIO_ROUTE_TITLES, pathname)) {
    return null;
  }

  return BELGE_STUDIO_ROUTE_TITLES[pathname as BelgeStudioRoute];
}

export function isBelgeStudioRoute(pathname: string | null | undefined): boolean {
  return getBelgeStudioTitle(pathname) !== null;
}
