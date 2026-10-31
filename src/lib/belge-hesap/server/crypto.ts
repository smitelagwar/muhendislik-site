import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { AccountConfig } from "./config";

export function digest(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
function prehashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("base64");
}
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(prehashPassword(password), 11);
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // One-time admin seed reuses the existing authenticated documentation bcrypt
  // hash without copying or exposing the plaintext admin password.
  if (hash.startsWith("raw:")) return bcrypt.compare(password, hash.slice(4));
  return bcrypt.compare(prehashPassword(password), hash);
}
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
export function rateKey(config: AccountConfig, scope: string, value: string): string {
  return createHmac("sha256", config.rateSalt).update(scope + ":" + value).digest("hex");
}
/** Stage 3 will use this authenticated profile encryption helper. */
export function encryptProfile(config: AccountConfig, userId: string, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", config.profileKey, iv);
  cipher.setAAD(Buffer.from(config.environment + ":" + userId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}
export function decryptProfile(config: AccountConfig, userId: string, input: string): string {
  const parts = input.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("PROFILE_INVALID");
  const decipher = createDecipheriv("aes-256-gcm", config.profileKey, Buffer.from(parts[1], "base64url"));
  decipher.setAAD(Buffer.from(config.environment + ":" + userId, "utf8"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
}
