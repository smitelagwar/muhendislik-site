// ============================================================================
// DOKUMANTASYON — PRODUCTION AUTH CONFIGURATION
// ============================================================================

import bcrypt from "bcryptjs";

export type DokAuthConfigErrorCode =
  | "DOK_AUTH_CONFIG_USERNAME_MISSING"
  | "DOK_AUTH_CONFIG_PASSWORD_HASH_MISSING"
  | "DOK_AUTH_CONFIG_PASSWORD_HASH_INVALID"
  | "DOK_AUTH_CONFIG_SESSION_SECRET_MISSING"
  | "DOK_AUTH_CONFIG_SESSION_SECRET_WEAK"
  | "DOK_AUTH_CONFIG_RATE_LIMIT_SALT_MISSING"
  | "DOK_AUTH_CONFIG_RATE_LIMIT_SALT_WEAK"
  | "DOK_AUTH_CONFIG_SESSION_VERSION_INVALID";

export class DokAuthConfigError extends Error {
  constructor(public readonly code: DokAuthConfigErrorCode) {
    super(code);
    this.name = "DokAuthConfigError";
  }
}

export interface DokAuthRuntimeConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  sessionVersion: number;
  rateLimitSalt: string;
}

export type DokAuthEnvironment = Record<string, string | undefined>;

const DEV_CONFIG: DokAuthRuntimeConfig = {
  username: "admin",
  passwordHash: "$2b$10$TxzKJSpWjjhIwB8honXpuOGcE4VQdEEsN2WGFadTRG1GdvqiCrRfO",
  sessionSecret: "dev_dokumantasyon_session_key_min_32_chars_2026",
  sessionVersion: 1,
  rateLimitSalt: "dev_rate_limit_salt_change_in_prod",
};

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const PLACEHOLDER_PATTERN = /(?:your|change[_-]?me|placeholder|example|replace[_-]?me)/i;

export function isProductionAuthEnvironment(env: DokAuthEnvironment = process.env): boolean {
  return env.NODE_ENV === "production" || Boolean(env.VERCEL);
}

function hasPlaceholder(value: string | undefined): boolean {
  return Boolean(value && PLACEHOLDER_PATTERN.test(value));
}

function getRequiredValue(
  env: DokAuthEnvironment,
  name: "ADMIN_USERNAME" | "ADMIN_PASSWORD_HASH" | "SESSION_SECRET" | "RATE_LIMIT_SALT",
  errorCode: DokAuthConfigErrorCode,
  fallback: string
): string {
  const value = env[name]?.trim();
  if (!isProductionAuthEnvironment(env)) return value || fallback;
  if (!value) throw new DokAuthConfigError(errorCode);
  return value as string;
}

export function getDokAuthRuntimeConfig(env: DokAuthEnvironment = process.env): DokAuthRuntimeConfig {
  const username = getRequiredValue(env, "ADMIN_USERNAME", "DOK_AUTH_CONFIG_USERNAME_MISSING", DEV_CONFIG.username);
  const passwordHash = getRequiredValue(env, "ADMIN_PASSWORD_HASH", "DOK_AUTH_CONFIG_PASSWORD_HASH_MISSING", DEV_CONFIG.passwordHash);
  const sessionSecret = getRequiredValue(env, "SESSION_SECRET", "DOK_AUTH_CONFIG_SESSION_SECRET_MISSING", DEV_CONFIG.sessionSecret);
  const rateLimitSalt = getRequiredValue(env, "RATE_LIMIT_SALT", "DOK_AUTH_CONFIG_RATE_LIMIT_SALT_MISSING", DEV_CONFIG.rateLimitSalt);
  const rawVersion = env.ADMIN_SESSION_VERSION?.trim();
  if (isProductionAuthEnvironment(env) && !rawVersion) {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_SESSION_VERSION_INVALID");
  }
  const sessionVersion = rawVersion ? Number(rawVersion) : DEV_CONFIG.sessionVersion;

  if (!Number.isInteger(sessionVersion) || sessionVersion <= 0) {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_SESSION_VERSION_INVALID");
  }

  if (isProductionAuthEnvironment(env)) {
    if (hasPlaceholder(username)) throw new DokAuthConfigError("DOK_AUTH_CONFIG_USERNAME_MISSING");
    if (hasPlaceholder(passwordHash)) throw new DokAuthConfigError("DOK_AUTH_CONFIG_PASSWORD_HASH_INVALID");
    if (hasPlaceholder(sessionSecret)) throw new DokAuthConfigError("DOK_AUTH_CONFIG_SESSION_SECRET_WEAK");
    if (hasPlaceholder(rateLimitSalt)) throw new DokAuthConfigError("DOK_AUTH_CONFIG_RATE_LIMIT_SALT_WEAK");
  }

  return { username, passwordHash, sessionSecret, sessionVersion, rateLimitSalt };
}

/** Validates expensive production-only requirements without exposing values. */
export async function validateDokAuthConfig(
  env: DokAuthEnvironment = process.env
): Promise<DokAuthRuntimeConfig> {
  const config = getDokAuthRuntimeConfig(env);
  if (!isProductionAuthEnvironment(env)) return config;

  if (!BCRYPT_HASH_PATTERN.test(config.passwordHash) || hasPlaceholder(config.passwordHash)) {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_PASSWORD_HASH_INVALID");
  }

  try {
    await bcrypt.compare("config-validation-probe", config.passwordHash);
  } catch {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_PASSWORD_HASH_INVALID");
  }

  if (Buffer.byteLength(config.sessionSecret, "utf8") < 32) {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_SESSION_SECRET_WEAK");
  }
  if (Buffer.byteLength(config.rateLimitSalt, "utf8") < 32) {
    throw new DokAuthConfigError("DOK_AUTH_CONFIG_RATE_LIMIT_SALT_WEAK");
  }

  return config;
}
