import { z } from "zod";

export function isValidTcKimlikNo(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = [...value].map(Number);
  const odds = d[0] + d[2] + d[4] + d[6] + d[8];
  const evens = d[1] + d[3] + d[5] + d[7];
  return (odds * 7 - evens) % 10 === d[9] &&
    d.slice(0, 10).reduce((sum, x) => sum + x, 0) % 10 === d[10];
}
const optionalText = (max: number) => z.string().trim().max(max).optional();
/** Empty profile fields are allowed and will fall back to sample document data. */
export const belgeProfileSchema = z.object({
  ad: optionalText(80),
  soyad: optionalText(80),
  tcKimlikNo: optionalText(11).refine((v) => !v || isValidTcKimlikNo(v), "T.C. kimlik numarasını kontrol edin."),
  telefon: optionalText(30),
  meslekUnvani: optionalText(100),
  odaSicilNo: optionalText(40),
  adres: optionalText(500),
  il: optionalText(80),
  ilce: optionalText(80),
}).strict();
export type BelgeProfile = z.infer<typeof belgeProfileSchema>;
