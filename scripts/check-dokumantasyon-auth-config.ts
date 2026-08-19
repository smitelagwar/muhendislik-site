import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  DokAuthEnvironment,
  DokAuthConfigError,
  validateDokAuthConfig,
} from "../src/lib/dokumantasyon/auth-config";

function readEnvFile(fileName: string): DokAuthEnvironment {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).reduce<DokAuthEnvironment>((env, line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) return env;
    env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    return env;
  }, {});
}

async function expectConfigError(
  env: DokAuthEnvironment,
  code: string
): Promise<void> {
  await assert.rejects(
    () => validateDokAuthConfig(env),
    (error: unknown) => error instanceof DokAuthConfigError && error.code === code
  );
}

async function main() {
  const validHash = await bcrypt.hash("auth-config-test", 4);
  const validProductionEnv: DokAuthEnvironment = {
    NODE_ENV: "production",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: validHash,
    SESSION_SECRET: "s".repeat(32),
    RATE_LIMIT_SALT: "r".repeat(32),
    ADMIN_SESSION_VERSION: "1",
  };

  await expectConfigError({ ...validProductionEnv, ADMIN_USERNAME: "" }, "DOK_AUTH_CONFIG_USERNAME_MISSING");
  await expectConfigError({ ...validProductionEnv, ADMIN_PASSWORD_HASH: "CHANGE_ME_VALID_BCRYPT_HASH" }, "DOK_AUTH_CONFIG_PASSWORD_HASH_INVALID");
  await expectConfigError({ ...validProductionEnv, SESSION_SECRET: "CHANGE_ME_SESSION_SECRET_AT_LEAST_32_BYTES" }, "DOK_AUTH_CONFIG_SESSION_SECRET_WEAK");
  await expectConfigError({ ...validProductionEnv, SESSION_SECRET: "short" }, "DOK_AUTH_CONFIG_SESSION_SECRET_WEAK");
  await expectConfigError({ ...validProductionEnv, RATE_LIMIT_SALT: "short" }, "DOK_AUTH_CONFIG_RATE_LIMIT_SALT_WEAK");
  await expectConfigError({ ...validProductionEnv, ADMIN_SESSION_VERSION: "0" }, "DOK_AUTH_CONFIG_SESSION_VERSION_INVALID");
  await validateDokAuthConfig(validProductionEnv);

  const configuredEnv: DokAuthEnvironment = {
    ...readEnvFile(".env.local"),
    ...process.env,
    NODE_ENV: process.env.DOK_AUTH_CONFIG_ENV || "production",
  };
  await validateDokAuthConfig(configuredEnv);

  console.log("ADMIN_USERNAME: configured");
  console.log("ADMIN_PASSWORD_HASH: valid-bcrypt");
  console.log("SESSION_SECRET: configured-and-sufficient-length");
  console.log("RATE_LIMIT_SALT: configured-and-sufficient-length");
  console.log("ADMIN_SESSION_VERSION: valid");
  console.log("Auth configuration matrix: passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
