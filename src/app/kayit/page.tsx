"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { ChevronLeft, Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 transition-colors duration-300 dark:bg-black dark:text-zinc-50">
      <div className="absolute left-0 top-0 h-[500px] w-[500px] -ml-40 -mt-20 rounded-full bg-indigo-600/20 opacity-50 blur-3xl dark:bg-indigo-600/10" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] -mb-20 -mr-20 rounded-full bg-blue-600/20 opacity-50 blur-3xl dark:bg-blue-600/10" />

      <header className="relative z-10 flex w-full items-center justify-between p-4 sm:p-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <ChevronLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>
        <ModeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-2xl shadow-blue-900/5 backdrop-blur-xl transition-all dark:border-zinc-800/80 dark:bg-zinc-950/50 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Portal hesabı oluşturun</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ücretsiz hesap açarak teknik içeriklere ve araçlara daha hızlı erişin.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ad</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input type="text" placeholder="Ahmet" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input type="text" placeholder="Yılmaz" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">E-posta adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input type="email" placeholder="muhendis@firma.com" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input type="password" placeholder="En az 8 karakter" className="h-11 border-zinc-200 bg-zinc-50 pl-10 dark:border-zinc-800 dark:bg-zinc-900/50" />
              </div>
            </div>

            <Button
              type="button"
              className="mt-4 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700"
              onClick={() => toast.success("Demo kayıt arayüzü açıldı. Gerçek üyelik akışı bu projede bağlı değil.")}
            >
              Kayıt Ol
            </Button>
          </form>

          <p className="mt-6 px-4 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500">
            Kayıt olarak{" "}
            <Link href="/kullanim-kosullari" className="underline">
              Kullanım Koşulları
            </Link>{" "}
            ve{" "}
            <Link href="/gizlilik" className="underline">
              KVKK Politikası
            </Link>{" "}
            metinlerini kabul etmiş olursunuz.
          </p>

          <p className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
              Giriş yapın
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
