/**
 * Production-only, idempotent account-schema preparation.
 * Called by prebuild before deployment; does nothing for local/preview builds.
 * No credentials, SQL values, or DB connection strings are ever logged.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (process.env.VERCEL_ENV === "production" && process.env.BELGE_ACCOUNT_ENABLED === "true") {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  const key = process.env.BELGE_ACCOUNT_PROFILE_KEY || "";
  const salt = process.env.BELGE_ACCOUNT_RATE_SALT || "";
  if (!connectionString || !/^[A-Za-z0-9+/]{43}=$/.test(key) ||
    Buffer.from(key, "base64").length !== 32 || salt.length < 32) {
    throw new Error("BELGE_ACCOUNT_CONFIG_INCOMPLETE");
  }

  const statements = readFileSync(
    new URL("../db/migrations/010_belge_hesap.sql", import.meta.url),
    "utf8",
  ).split(";").map((statement) => statement.trim()).filter(Boolean);
  if (statements.length !== 6 || !statements.every((statement) =>
    /CREATE (TABLE|INDEX) IF NOT EXISTS/i.test(statement))) {
    throw new Error("BELGE_ACCOUNT_MIGRATION_UNEXPECTED");
  }

  const database = neon(connectionString);
  for (const statement of statements) {
    await database.query(statement);
  }

  // Seed a separate, genuine admin account with the previously configured
  // documentation admin username and hashed password. The bypassed documentation
  // session is NOT trusted for this account system.
  const admin = process.env.ADMIN_USERNAME?.trim() || "";
  const adminHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  if (!/^[A-Za-z0-9_.-]{2,32}$/.test(admin) ||
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(adminHash)) {
    throw new Error("BELGE_ACCOUNT_ADMIN_CONFIG_INVALID");
  }
  await database.query(
    "INSERT INTO belge_account_users (environment_key, username_ci, username_display, password_hash, role) VALUES($1,$2,$3,$4,'admin') ON CONFLICT (environment_key, username_ci) DO NOTHING",
    ["production", admin.toLowerCase(), admin, "raw:" + adminHash],
  );
  process.stdout.write("Belge account migration and admin provisioning completed.\n");
} else {
  process.stdout.write("Belge account migration skipped outside enabled production.\n");
}
