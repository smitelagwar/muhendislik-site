import "server-only";

import { neon } from "@neondatabase/serverless";
import { belgeProfileSchema, type BelgeProfile } from "../profile-schema";
import { decryptProfile, encryptProfile } from "./crypto";
import { getAccountConfig, type AccountConfig } from "./config";
import { AccountFailure, type AccountUser } from "./service";

type ProfileRow = { profile_enc: string | null; profile_version: number };
export type ProfileSnapshot = { profile: BelgeProfile; version: number };

function configured(): AccountConfig {
  const config = getAccountConfig();
  if (!config) throw new AccountFailure(503, "Hesap sistemi henüz kullanılamıyor.");
  return config;
}

function query(config: AccountConfig) {
  return neon(config.databaseUrl);
}

/** Never use a user id supplied by the browser. Identity comes from the verified session. */
export async function readOwnProfile(user: AccountUser): Promise<ProfileSnapshot> {
  const config = configured();
  const rows = await query(config).query(
    "SELECT profile_enc, profile_version FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2 LIMIT 1",
    [user.id, config.environment],
  ) as unknown as ProfileRow[];
  const row = rows[0];
  if (!row) throw new AccountFailure(401, "Oturum geçerli değil.");
  if (!row.profile_enc) return { profile: {}, version: Number(row.profile_version) };

  try {
    const decoded: unknown = JSON.parse(decryptProfile(config, user.id, row.profile_enc));
    const parsed = belgeProfileSchema.safeParse(decoded);
    if (!parsed.success) throw new Error("PROFILE_SCHEMA_INVALID");
    return { profile: parsed.data, version: Number(row.profile_version) };
  } catch {
    // Fail closed: do not return a blank profile that may later overwrite corrupt data.
    throw new AccountFailure(503, "Kayıtlı bilgiler şu anda okunamıyor.");
  }
}

export async function saveOwnProfile(
  user: AccountUser,
  profile: BelgeProfile,
  expectedVersion: number,
): Promise<ProfileSnapshot> {
  const config = configured();
  // Revalidate at this trust boundary, even when the route has already parsed input.
  const parsed = belgeProfileSchema.safeParse(profile);
  if (!parsed.success) throw new AccountFailure(400, "Profil bilgilerini kontrol edin.");
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || expectedVersion > 2_147_483_646) {
    throw new AccountFailure(400, "Profil sürümü geçersiz.");
  }
  const ciphertext = encryptProfile(config, user.id, JSON.stringify(parsed.data));
  const updated = await query(config).query(
    "UPDATE belge_account_users SET profile_enc=$1, profile_version=profile_version+1, updated_at=NOW() WHERE id=$2::uuid AND environment_key=$3 AND profile_version=$4 RETURNING profile_version",
    [ciphertext, user.id, config.environment, expectedVersion],
  ) as unknown as { profile_version: number }[];

  if (!updated[0]) {
    // Distinguish a stale edit from a deleted session without exposing another account.
    const present = await query(config).query(
      "SELECT 1 FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2 LIMIT 1",
      [user.id, config.environment],
    );
    if (!present[0]) throw new AccountFailure(401, "Oturum geçerli değil.");
    throw new AccountFailure(409, "Profil başka cihazda güncellendi. Yeniden yükleyin.");
  }
  return { profile: parsed.data, version: Number(updated[0].profile_version) };
}
