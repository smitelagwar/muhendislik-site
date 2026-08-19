// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ADMIN SAYFASI
// ============================================================================

import type { Metadata } from "next";
import { getDokumantasyonSession } from "@/lib/dokumantasyon/auth";
import { DokumantasyonLoginForm } from "@/components/dokumantasyon/login-form";
import { DokumantasyonAdminShell } from "@/components/dokumantasyon/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dökümantasyon — Yönetim Paneli",
  description: "Mühendislik ve mimarlık projeleri için özel dosya depolama ve paylaşım modülü.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function DokumantasyonPage() {
  const session = await getDokumantasyonSession();

  if (!session) {
    return <DokumantasyonLoginForm />;
  }

  return <DokumantasyonAdminShell username={session.username} />;
}
