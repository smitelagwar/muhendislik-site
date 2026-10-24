import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { Footer } from "@/components/footer";
import { GlobalOverlays } from "@/components/global-overlays";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
  resolveSiteUrl,
} from "@/lib/site-config";
import "./globals.css";
import "./home.css";

const plexSans = localFont({
  src: [
    { path: "./fonts/IBM-Plex-Sans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/IBM-Plex-Mono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBM-Plex-Mono-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBM-Plex-Mono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: resolveSiteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [resolveSiteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isIsolatedViewer = pathname.startsWith("/b/");

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ToastProvider>
            {isIsolatedViewer ? (
              <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">
                {children}
              </main>
            ) : (
              <>
                <div className="flex min-h-screen flex-col">
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-amber-500 focus:px-4 focus:py-2 focus:font-bold focus:text-black focus:shadow-lg"
                  >
                    Ana içeriğe atla
                  </a>
                  <Navbar />
                  <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
                    {children}
                  </main>
                  <Footer />
                </div>
                <GlobalOverlays />
              </>
            )}
          </ToastProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
