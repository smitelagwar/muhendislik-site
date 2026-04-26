"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const BookmarkButton = dynamic(
  () => import("@/components/bookmark-button").then((module) => module.BookmarkButton),
  { ssr: false },
);
const LiveSearch = dynamic(
  () => import("@/components/live-search").then((module) => module.LiveSearch),
  { ssr: false },
);
const MobileMenu = dynamic(
  () => import("@/components/mobile-menu").then((module) => module.MobileMenu),
  {
    ssr: false,
    loading: () => <div className="h-10 w-10 rounded-md border border-border" aria-hidden />,
  },
);
const ModeToggle = dynamic(
  () => import("@/components/mode-toggle").then((module) => module.ModeToggle),
  {
    ssr: false,
    loading: () => <div className="h-8 w-16 rounded-full border border-border bg-card" aria-hidden />,
  },
);
const SharePopup = dynamic(
  () => import("@/components/share-popup").then((module) => module.SharePopup),
  { ssr: false },
);

export function NavbarActions() {
  const pathname = usePathname();
  const [shareOpen, setShareOpen] = useState(false);
  const isTool =
    pathname.startsWith("/kategori/araclar") ||
    pathname.startsWith("/araclar") ||
    pathname.startsWith("/hesaplamalar");
  const isCategory = pathname.startsWith("/kategori") && !isTool;
  const isArticle = pathname !== "/" && !isTool && !isCategory && pathname.length > 1;
  const pageSlug = pathname.replace(/^\//, "");

  return (
    <div className="flex items-center gap-3">
      {!isArticle ? <LiveSearch /> : null}

      {isArticle ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="İçeriği paylaş"
            onClick={() => setShareOpen(true)}
            className="hidden gap-2 text-sm font-semibold text-muted-foreground hover:text-primary sm:flex"
          >
            <Share2 className="h-4 w-4" />
            Paylaş
          </Button>
          <BookmarkButton slug={pageSlug} className="rounded-full border border-border bg-card px-4 py-2" />
        </div>
      ) : null}

      <div className="hidden h-6 w-px bg-border sm:block" />

      <div className="flex items-center gap-2.5">
        <ModeToggle />
        <div className="lg:hidden">
          <MobileMenu />
        </div>
      </div>

      {shareOpen ? <SharePopup open={shareOpen} onOpenChange={setShareOpen} /> : null}
    </div>
  );
}
