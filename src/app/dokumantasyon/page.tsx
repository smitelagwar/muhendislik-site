// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ADMIN SAYFASI
// ============================================================================

import type { Metadata } from "next";
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

export default function DokumantasyonPage() {
  return <DokumantasyonAdminShell username="admin" />;
}

