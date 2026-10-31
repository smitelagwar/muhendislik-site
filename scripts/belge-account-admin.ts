/**
 * One-time administrator promotion, NOT a public endpoint.
 * Usage: BELGE_ACCOUNT_ADMIN_TARGET=<username> BELGE_ACCOUNT_ADMIN_SCOPE=production
 *        npx tsx scripts/belge-account-admin.ts
 * Requires DATABASE_URL and an explicit scope; never prints user credentials.
 */
import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/dokumantasyon/runtime-mode";

async function main() {
  const username = process.env.BELGE_ACCOUNT_ADMIN_TARGET?.trim().toLowerCase();
  const scope = process.env.BELGE_ACCOUNT_ADMIN_SCOPE?.trim();
  const url = getDatabaseUrl();
  if (!username || !/^[a-z0-9_.-]{2,32}$/.test(username) ||
      !scope || !["local","development","preview","production"].includes(scope) || !url) {
    throw new Error("BELGE_ACCOUNT_ADMIN_TARGET, BELGE_ACCOUNT_ADMIN_SCOPE ve DATABASE_URL zorunludur.");
  }
  const result = await neon(url).query(
    "UPDATE belge_account_users SET role='admin', updated_at=NOW() WHERE environment_key=$1 AND username_ci=$2 RETURNING id",
    [scope, username],
  );
  if (!result.length) throw new Error("Hedef kullanici bulunamadi.");
  process.stdout.write("Administrator role assigned to selected existing account.\n");
}
main().catch(() => {
  process.stderr.write("Administrator promotion failed. Check scope, account and database.\n");
  process.exitCode = 1;
});
