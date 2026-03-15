"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, ChevronLeft, Github } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 transition-colors duration-300 dark:bg-black dark:text-zinc-50">
      <div className="absolute right-0 top-0 h-[500px] w-[500px] -mr-40 -mt-20 rounded-full bg-blue-600/20 opacity-50 blur-3xl dark:bg-blue-600/10" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -mb-20 -ml-20 rounded-full bg-indigo-600/20 opacity-50 blur-3xl dark:bg-indigo-600/10" />

      <header className="relative z-10 flex w-full items-center justify-between p-4 sm:p-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <ChevronLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>
        <ModeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[440px] rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-2xl shadow-blue-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/50 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-light.svg?v=3" alt="İnşa Blog" className="h-12 w-auto dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-dark.svg?v=3" alt="İnşa Blog" className="hidden h-12 w-auto dark:block" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Tekrar hoş geldiniz</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Portala geri dönmek için giriş yapın.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">E-posta adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input type="email" placeholder="muhendis@firma.com" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Şifre</label>
                <button type="button" onClick={() => toast.info("Şifre sıfırlama akışı örnek arayüz olarak gösteriliyor.")} className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  Şifremi unuttum
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input type="password" placeholder="••••••••" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
              </div>
            </div>

            <Button
              type="button"
              className="mt-2 h-11 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
              onClick={() => toast.success("Demo giriş arayüzü açıldı. Gerçek kimlik doğrulama bu projede bağlı değil.")}
            >
              Giriş Yap
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">veya</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-transparent dark:hover:bg-zinc-900" onClick={() => toast.info("Google ile giriş demo modunda devre dışı.")}>
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-transparent dark:text-white dark:hover:bg-zinc-900" onClick={() => toast.info("GitHub ile giriş demo modunda devre dışı.")}>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-bold text-blue-600 hover:underline dark:text-blue-400">
              Hesap oluşturun
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
