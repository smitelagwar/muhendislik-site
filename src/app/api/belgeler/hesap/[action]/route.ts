import { NextRequest, NextResponse } from "next/server";
import { belgeProfileSchema } from "@/lib/belge-hesap/profile-schema";
import { readOwnProfile, saveOwnProfile } from "@/lib/belge-hesap/server/profile";
import {
  AccountFailure, accountAvailable, adminDeleteUser, adminResetPassword,
  adminTargetSchema, changePassword, credentialsSchema, deletionSchema, getSessionUser,
  listUsers, login, passwordChangeSchema, readJson, register,
  removeOwnAccount, requireAdmin, requireSession, revokeToken, sessionCookieName,
  SESSION_SECONDS, validated,
} from "@/lib/belge-hesap/server/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}
function setAuthCookie(res: NextResponse, request: NextRequest, token: string) {
  res.cookies.set(sessionCookieName(request), token, {
    httpOnly: true, secure: request.nextUrl.protocol === "https:",
    sameSite: "lax", path: "/", maxAge: SESSION_SECONDS,
  });
  return res;
}
function clearAuthCookie(res: NextResponse, request: NextRequest) {
  res.cookies.set(sessionCookieName(request), "", {
    httpOnly: true, secure: request.nextUrl.protocol === "https:",
    sameSite: "lax", path: "/", maxAge: 0,
  });
  return res;
}
function failure(error: unknown) {
  if (error instanceof AccountFailure) return response({ error: error.message }, error.status);
  const e = error as { statusCode?: number };
  if (typeof e?.statusCode === "number" && e.statusCode >= 400 && e.statusCode < 500) {
    return response({ error: "İstek kaynağı doğrulanamadı." }, e.statusCode);
  }
  // No credentials, tokens, profile values or SQL errors in production logs.
  return response({ error: "Hesap işlemi tamamlanamadı." }, 503);
}
export async function GET(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action === "oturum") {
      if (!await accountAvailable()) return response({ available: false, authenticated: false });
      const user = await getSessionUser(request);
      return response({ available: true, authenticated: !!user, user });
    }
    if (action === "profil") {
      const user = await requireSession(request);
      return response(await readOwnProfile(user));
    }
    if (action === "kullanicilar") {
      await requireAdmin(request);
      return response({ users: await listUsers() });
    }
    return response({ error: "Bulunamadı." }, 404);
  } catch (error) { return failure(error); }
}
export async function PUT(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action !== "profil") return response({ error: "Bulunamadı." }, 404);
    const user = await requireSession(request);
    const revisionHeader = request.headers.get("if-match");
    if (revisionHeader === null) return response({ error: "Profil sürümü gerekli." }, 428);
    const matched = /^"([0-9]{1,10})"$/.exec(revisionHeader);
    if (!matched) return response({ error: "Profil sürümü geçersiz." }, 400);
    const version = Number(matched[1]);
    const payload = await readJson(request);
    const profile = validated(belgeProfileSchema, payload);
    return response(await saveOwnProfile(user, profile, version));
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    const input = await readJson(request);
    if (action === "kayit" || action === "giris") {
      const credentials = validated(credentialsSchema, input);
      const result = action === "kayit"
        ? await register(request, credentials) : await login(request, credentials);
      return setAuthCookie(response({ user: result.user, authenticated: true }, action === "kayit" ? 201 : 200), request, result.token);
    }
    if (action === "cikis") {
      await revokeToken(request);
      return clearAuthCookie(response({ ok: true }), request);
    }
    if (action === "sifre") {
      const user = await requireSession(request);
      const data = validated(passwordChangeSchema, input);
      const token = await changePassword(user, data.currentPassword, data.newPassword);
      return setAuthCookie(response({ ok: true, user }), request, token);
    }
    if (action === "yonetim-sifre") {
      await requireAdmin(request);
      const data = validated(adminTargetSchema, input);
      return response({ temporaryPassword: await adminResetPassword(data.userId) });
    }
    return response({ error: "Bulunamadı." }, 404);
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    const input = await readJson(request);
    if (action === "hesap") {
      const user = await requireSession(request);
      const data = validated(deletionSchema, input);
      await removeOwnAccount(user, data.password);
      return clearAuthCookie(response({ ok: true }), request);
    }
    if (action === "yonetim-hesap") {
      await requireAdmin(request);
      const data = validated(adminTargetSchema, input);
      await adminDeleteUser(data.userId);
      return response({ ok: true });
    }
    return response({ error: "Bulunamadı." }, 404);
  } catch (error) { return failure(error); }
}
