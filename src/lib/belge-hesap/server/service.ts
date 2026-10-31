import "server-only";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { credentialsSchema, passwordChangeSchema, deletionSchema, adminTargetSchema } from "../credentials-schema";
import { validateSameOrigin } from "@/lib/belge-paylasim/request-validation";
import { digest, hashPassword, newSessionToken, rateKey, verifyPassword } from "./crypto";
import { getAccountConfig, type AccountConfig } from "./config";

export { credentialsSchema, passwordChangeSchema, deletionSchema, adminTargetSchema };

export class AccountFailure extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export type AccountUser = { id: string; username: string; role: "user" | "admin" };
type UserRecord = AccountUser & { password_hash: string };
type DataRow = Record<string, unknown>;

function requireConfig(): AccountConfig {
  const config = getAccountConfig();
  if (!config) throw new AccountFailure(503, "Hesap sistemi henüz kullanılamıyor.");
  return config;
}
function sql(config: AccountConfig) {
  return neon(config.databaseUrl);
}
async function rows(config: AccountConfig, query: string, values: (string | number | null)[] = []): Promise<DataRow[]> {
  return await sql(config).query(query, values) as unknown as DataRow[];
}
function parseUser(row: DataRow): AccountUser {
  return { id: String(row.id), username: String(row.username), role: row.role === "admin" ? "admin" : "user" };
}
export async function accountAvailable(): Promise<boolean> {
  const config = getAccountConfig();
  if (!config) return false;
  try {
    await rows(config, "SELECT id FROM belge_account_users LIMIT 1");
    await rows(config, "SELECT id FROM belge_account_sessions LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
export function sessionCookieName(request: Request): string {
  return new URL(request.url).protocol === "https:" ? "__Host-belge-account" : "belge-account-local";
}
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export function getToken(request: NextRequest): string | null {
  return request.cookies.get(sessionCookieName(request))?.value ?? null;
}
export async function getSessionUser(request: NextRequest): Promise<AccountUser | null> {
  const token = getToken(request);
  if (!token || token.length > 256) return null;
  const config = requireConfig();
  const found = await rows(config,
    "SELECT u.id, u.username_display AS username, u.role FROM belge_account_sessions s JOIN belge_account_users u ON u.id = s.user_id AND u.environment_key = s.environment_key WHERE s.environment_key = $1 AND s.token_hash = $2 AND s.revoked_at IS NULL AND s.expires_at > NOW() LIMIT 1",
    [config.environment, digest(token)]);
  return found[0] ? parseUser(found[0]) : null;
}
export async function requireSession(request: NextRequest): Promise<AccountUser> {
  const user = await getSessionUser(request);
  if (!user) throw new AccountFailure(401, "Oturum süresi dolmuş. Tekrar giriş yapın.");
  return user;
}
export async function requireAdmin(request: NextRequest): Promise<AccountUser> {
  const user = await requireSession(request);
  if (user.role !== "admin") throw new AccountFailure(403, "Bu işlem için yetkiniz yok.");
  return user;
}
export async function issueSession(userId: string): Promise<string> {
  const config = requireConfig();
  const token = newSessionToken();
  await rows(config,
    "INSERT INTO belge_account_sessions (environment_key, user_id, token_hash, expires_at) VALUES($1, $2::uuid, $3, NOW() + INTERVAL '30 days')",
    [config.environment, userId, digest(token)]);
  return token;
}
export async function revokeToken(request: NextRequest): Promise<void> {
  const token = getToken(request);
  if (!token) return;
  const config = requireConfig();
  await rows(config, "DELETE FROM belge_account_sessions WHERE environment_key = $1 AND token_hash = $2",
    [config.environment, digest(token)]);
}

export async function readJson(request: NextRequest): Promise<unknown> {
  validateSameOrigin(request);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new AccountFailure(415, "JSON içerik bekleniyor.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AccountFailure(400, "İstek boş.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > 8192) {
        await reader.cancel().catch(() => {});
        throw new AccountFailure(413, "İstek çok büyük.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new AccountFailure(400, "Geçersiz JSON."); }
}
export function validated<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AccountFailure(400, "Girilen bilgileri kontrol edin.");
  return result.data;
}
function clientIp(request: NextRequest): string {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 128);
}
async function rateLimit(config: AccountConfig, request: NextRequest, scope: string, subject: string, max: number) {
  const key = rateKey(config, scope, subject);
  const result = await rows(config,
    "INSERT INTO belge_account_rate_limits(environment_key,key_hash,window_start,hits) VALUES($1,$2,NOW(),1) ON CONFLICT(environment_key,key_hash) DO UPDATE SET hits = CASE WHEN belge_account_rate_limits.window_start < NOW() - INTERVAL '10 minutes' THEN 1 ELSE belge_account_rate_limits.hits + 1 END, window_start = CASE WHEN belge_account_rate_limits.window_start < NOW() - INTERVAL '10 minutes' THEN NOW() ELSE belge_account_rate_limits.window_start END RETURNING hits",
    [config.environment, key]);
  if (Number(result[0]?.hits ?? 0) > max) throw new AccountFailure(429, "Çok fazla deneme. Biraz sonra tekrar deneyin.");
}
export async function register(request: NextRequest, input: z.infer<typeof credentialsSchema>) {
  const config = requireConfig();
  await rateLimit(config, request, "register-ip", clientIp(request), 8);
  const usernameCi = input.username.toLowerCase();
  const hash = await hashPassword(input.password);
  let created: DataRow[];
  try {
    created = await rows(config,
      "INSERT INTO belge_account_users(environment_key,username_ci,username_display,password_hash) VALUES($1,$2,$3,$4) RETURNING id, username_display AS username, role",
      [config.environment, usernameCi, input.username, hash]);
  } catch (error) {
    if ((error as {code?: string}).code === "23505" || String(error).includes("duplicate key")) {
      throw new AccountFailure(409, "Bu kullanıcı adı kullanılıyor.");
    }
    throw error;
  }
  const user = parseUser(created[0]);
  await revokeToken(request);
  const token = await issueSession(user.id);
  return { user, token };
}
export async function login(request: NextRequest, input: z.infer<typeof credentialsSchema>) {
  const config = requireConfig();
  const usernameCi = input.username.toLowerCase();
  await rateLimit(config, request, "login-ip", clientIp(request), 30);
  await rateLimit(config, request, "login-user", usernameCi, 12);
  const found = await rows(config,
    "SELECT id,username_display AS username,role,password_hash FROM belge_account_users WHERE environment_key=$1 AND username_ci=$2 LIMIT 1",
    [config.environment, usernameCi]);
  const candidate = found[0];
  if (!candidate) {
    await hashPassword(input.password); // Do not expose username existence by a trivial fast path.
    throw new AccountFailure(401, "Kullanıcı adı veya şifre hatalı.");
  }
  const ok = await verifyPassword(input.password, String(candidate.password_hash));
  if (!ok) throw new AccountFailure(401, "Kullanıcı adı veya şifre hatalı.");
  const user = parseUser(candidate);
  await revokeToken(request);
  return { user, token: await issueSession(user.id) };
}
export async function changePassword(user: AccountUser, currentPassword: string, newPassword: string) {
  const config = requireConfig();
  const found = await rows(config, "SELECT password_hash FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2",
    [user.id, config.environment]);
  if (!found[0] || !await verifyPassword(currentPassword, String(found[0].password_hash))) {
    throw new AccountFailure(401, "Mevcut şifre hatalı.");
  }
  const newHash = await hashPassword(newPassword);
  await rows(config, "WITH updated AS (UPDATE belge_account_users SET password_hash=$1, updated_at=NOW() WHERE id=$2::uuid AND environment_key=$3 RETURNING id) DELETE FROM belge_account_sessions WHERE user_id IN (SELECT id FROM updated) AND environment_key=$3",
    [newHash, user.id, config.environment]);
  return issueSession(user.id);
}
export async function removeOwnAccount(user: AccountUser, password: string) {
  const config = requireConfig();
  const found = await rows(config, "SELECT password_hash FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2",
    [user.id, config.environment]);
  if (!found[0] || !await verifyPassword(password, String(found[0].password_hash))) {
    throw new AccountFailure(401, "Şifre hatalı.");
  }
  const deleted = await rows(config,
    "DELETE FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2 AND (role <> 'admin' OR (SELECT COUNT(*) FROM belge_account_users WHERE environment_key=$2 AND role='admin') > 1) RETURNING id",
    [user.id, config.environment]);
  if (!deleted[0]) throw new AccountFailure(409, "Son yönetici hesabı silinemez.");
}
export async function listUsers() {
  const config = requireConfig();
  const items = await rows(config,
    "SELECT id,username_display AS username,role,created_at::text AS created_at FROM belge_account_users WHERE environment_key=$1 ORDER BY created_at DESC LIMIT 200",
    [config.environment]);
  return items.map(row => ({
    id: String(row.id), username: String(row.username), role: String(row.role),
    createdAt: String(row.created_at),
  }));
}
export async function adminResetPassword(target: string) {
  const config = requireConfig();
  const temp = randomBytes(15).toString("base64url");
  const hash = await hashPassword(temp);
  const updated = await rows(config,
    "WITH changed AS (UPDATE belge_account_users SET password_hash=$1, updated_at=NOW() WHERE id=$2::uuid AND environment_key=$3 AND role='user' RETURNING id), revoked AS (DELETE FROM belge_account_sessions WHERE user_id IN (SELECT id FROM changed) AND environment_key=$3 RETURNING user_id) SELECT id FROM changed",
    [hash, target, config.environment]);
  if (!updated[0]) throw new AccountFailure(404, "Kullanıcı bulunamadı veya yönetici hesabı.");
  return temp;
}
export async function adminDeleteUser(target: string) {
  const config = requireConfig();
  const deleted = await rows(config,
    "DELETE FROM belge_account_users WHERE id=$1::uuid AND environment_key=$2 AND role='user' RETURNING id",
    [target, config.environment]);
  if (!deleted[0]) throw new AccountFailure(404, "Kullanıcı bulunamadı veya yönetici hesabı.");
}
