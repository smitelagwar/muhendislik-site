"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FolderArchive,
  User,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DokumantasyonFileManager } from "./file-manager";
import styles from "./dok-workspace.module.css";
import layoutStyles from "./mobile-shell-layout.module.css";

interface AdminShellProps {
  username: string;
  children?: React.ReactNode;
}

export function DokumantasyonAdminShell({ username, children }: AdminShellProps) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navbar yüksekliği logo, metin boyutu ve kaydırma durumuyla değişebilir.
  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const updateHeight = () =>
      shellRef.current?.style.setProperty(
        "--dok-app-header-height",
        `${header.getBoundingClientRect().height}px`
      );
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const [readiness, setReadiness] = useState<{
    storageMode?: "durable" | "local_dev" | "blocked";
    ok?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dokumantasyon/readiness")
      .then((res) => res.json())
      .then((data) => setReadiness(data))
      .catch(() => setReadiness({ storageMode: "blocked", ok: false }));
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/dokumantasyon/cikis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const storageLabel =
    readiness?.storageMode === "durable"
      ? "Kalıcı Depolama (Neon + Blob)"
      : readiness?.storageMode === "local_dev"
        ? "Yerel Geliştirme (Local)"
        : readiness?.storageMode === "blocked"
          ? "Depolama Eksik (Korumalı)"
          : "Bağlantı denetleniyor";

  return (
    <div
      data-dok-shell
      ref={shellRef}
      className={`relative min-h-[calc(100vh-4.5rem)] w-full bg-gradient-to-b from-amber-500/[0.03] via-background to-amber-500/[0.05] max-lg:min-h-0 max-lg:overflow-hidden ${layoutStyles.shell}`}
    >
      {/* Ambiyans Warm Glass Işık Küreleri — Mobilde GPU tasarrufu için gizlenir, masaüstünde izole GPU katmanına alınır */}
      <div
        data-dok-ambient
        className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block [contain:paint] [transform:translateZ(0)]"
        aria-hidden="true"
      >
        <div
          className={`absolute -top-32 -left-32 h-[24rem] w-[24rem] rounded-full bg-amber-500/15 blur-[80px] dark:bg-amber-500/10 ${styles.ambientOrb1}`}
        />
        <div
          className={`absolute top-1/4 -right-32 h-[26rem] w-[26rem] rounded-full bg-orange-500/10 blur-[90px] dark:bg-orange-600/08 ${styles.ambientOrb2}`}
        />
        <div
          className={`absolute -bottom-32 left-1/3 h-[20rem] w-[20rem] rounded-full bg-amber-400/15 blur-[80px] dark:bg-amber-600/08 ${styles.ambientOrb3}`}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] px-2 py-3 lg:space-y-4 sm:px-4 sm:py-4 lg:px-6 xl:px-8 max-lg:flex max-lg:h-full max-lg:min-h-0 max-lg:flex-col max-lg:gap-3 sm:max-lg:gap-4">
        {/* Üst Bar / Header */}
        <div
          data-testid="dok-admin-header"
          className={`flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 max-lg:shrink-0 ${styles.workspaceHeader}`}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm transition-transform duration-200 hover:scale-105 hover:-rotate-3 hover:shadow-amber-500/20">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Dokümantasyon Modülü
                </h1>
                <span
                  data-admin-meta
                  className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                >
                  Admin
                </span>
                {readiness &&
                  (readiness.storageMode === "durable" ? (
                    <span
                      data-admin-meta
                      className="inline-flex max-w-full basis-full items-center gap-1.5 whitespace-normal rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 sm:basis-auto"
                    >
                      <span
                        className={`bg-emerald-500 text-emerald-500 ${styles.statusPulseDot}`}
                        aria-hidden="true"
                      />
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>Kalıcı Depolama (Neon + Blob)</span>
                    </span>
                  ) : readiness.storageMode === "local_dev" ? (
                    <span
                      data-admin-meta
                      className="inline-flex max-w-full basis-full items-center gap-1.5 whitespace-normal rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 sm:basis-auto"
                    >
                      <span
                        className={`bg-amber-500 text-amber-500 ${styles.statusPulseDot}`}
                        aria-hidden="true"
                      />
                      <Laptop className="h-3 w-3 shrink-0" />
                      <span>Yerel Geliştirme (Local)</span>
                    </span>
                  ) : (
                    <span
                      data-admin-meta
                      className="inline-flex max-w-full basis-full items-center gap-1.5 whitespace-normal rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500 sm:basis-auto"
                    >
                      <span
                        className={`bg-red-500 text-red-500 ${styles.statusPulseDot}`}
                        aria-hidden="true"
                      />
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      <span>Depolama Eksik (Korumalı)</span>
                    </span>
                  ))}
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Özel dosya depolama, klasörleme ve süreli link paylaşım paneli
              </p>
            </div>
          </div>

          {/* Kullanıcı Menüsü ve Çıkış Yap */}
          <div
            data-admin-user
            className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 sm:justify-end sm:border-t-0 sm:pt-0"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="dok-user-menu-btn"
                  aria-label={`Kullanıcı menüsü (${username})`}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-card/70 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-inner transition-colors hover:border-amber-500/40 hover:bg-white/90 dark:hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                >
                  <User className="h-3.5 w-3.5 text-amber-500" />
                  <span>{username}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground">{username}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {storageLabel}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="dok-logout-btn"
                  variant="destructive"
                  disabled={isLoggingOut}
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleLogout();
                  }}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  <span>{isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* İçerik veya Drive Benzeri Dosya Yöneticisi */}
        <div className={layoutStyles.managerSlot}>
          {children ? children : <DokumantasyonFileManager />}
        </div>
      </div>
    </div>
  );
}
