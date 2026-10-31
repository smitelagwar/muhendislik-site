import type { BelgeProfile } from "./profile-schema";
const value = (s?: string) => s?.trim() || undefined;
export function nameForDocument(p: BelgeProfile): string | undefined {
  return [value(p.ad), value(p.soyad)?.toLocaleUpperCase("tr-TR")].filter(Boolean).join(" ") || undefined;
}
export const uppercaseName = (p: BelgeProfile) => nameForDocument(p)?.toLocaleUpperCase("tr-TR");
export const uppercaseProfession = (p: BelgeProfile) => value(p.meslekUnvani)?.toLocaleUpperCase("tr-TR");
export function formattedPhone(raw?: string): string | undefined {
  const input = value(raw); if (!input) return undefined;
  const digits = input.replace(/\D/g, "");
  const num = digits.startsWith("90") && digits.length === 12
    ? "0" + digits.slice(2)
    : digits.length === 10 ? "0" + digits : digits;
  return num.length === 11 && num[0] === "0"
    ? num.slice(0, 4) + " " + num.slice(4, 7) + " " + num.slice(7, 9) + " " + num.slice(9)
    : input;
}
export function cityDistrict(p: BelgeProfile): string | undefined {
  return [value(p.il)?.toLocaleUpperCase("tr-TR"), value(p.ilce)?.toLocaleUpperCase("tr-TR")].filter(Boolean).join(" / ") || undefined;
}
export const personAddress = (p: BelgeProfile) => value(p.adres);
export function signedProfessionName(p: BelgeProfile): string | undefined {
  const name = nameForDocument(p); if (!name) return undefined;
  const profession = value(p.meslekUnvani); if (!profession) return name;
  const prefix = profession.toLocaleUpperCase("tr-TR").includes("İNŞAAT MÜHENDİS") ? "İnş. Müh." : profession;
  return prefix + " " + name;
}
