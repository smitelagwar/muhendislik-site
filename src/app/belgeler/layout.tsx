import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BelgelerOfflineRuntime } from "@/components/belgeler-offline-runtime";

/** Nested metadata: installation is offered only in /belgeler. No layout DOM wrapper. */
export const metadata: Metadata = {
  manifest: "/belgeler-pwa.webmanifest",
  applicationName: "İnşa Blog Belgeler",
  icons: { apple: [{ url: "/belgeler-pwa-icon/180", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "Belgeler", statusBarStyle: "default" },
};
export default function BelgelerLayout({ children }: { children: ReactNode }) {
  return <>{children}<BelgelerOfflineRuntime /></>;
}
