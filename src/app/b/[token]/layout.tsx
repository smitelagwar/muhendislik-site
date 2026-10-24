import type { Metadata } from "next";

/** Token and document details must never be included in link preview metadata. */
export const metadata: Metadata = {
  title: { absolute: "Paylaşılan PDF Belgesi" },
  description: "Salt-okunur belge görüntüleyici",
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
