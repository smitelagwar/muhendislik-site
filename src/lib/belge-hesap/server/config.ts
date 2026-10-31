import { getDatabaseUrl } from "@/lib/dokumantasyon/runtime-mode";

export type AccountConfig = {
  databaseUrl: string;
  environment: string;
  profileKey: Buffer;
  rateSalt: string;
};

export function getAccountConfig(env: NodeJS.ProcessEnv = process.env): AccountConfig | null {
  if (env.BELGE_ACCOUNT_ENABLED !== "true") return null;
  const databaseUrl = getDatabaseUrl();
  const encodedKey = env.BELGE_ACCOUNT_PROFILE_KEY?.trim() ?? "";
  const rateSalt = env.BELGE_ACCOUNT_RATE_SALT?.trim() ?? "";
  if (!databaseUrl || !encodedKey || rateSalt.length < 32) return null;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encodedKey)) return null;
  const profileKey = Buffer.from(encodedKey, "base64");
  if (profileKey.length !== 32) return null;
  return {
    databaseUrl,
    environment: env.VERCEL_ENV || "local",
    profileKey,
    rateSalt,
  };
}
