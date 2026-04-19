"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Geçersiz e-posta biçimi. Lütfen geçerli bir adres girin.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Giriş bağlantısı e-posta adresinize gönderildi.");
      onClose();
      setEmail("");
    }, 1200);
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} ile giriş yakında etkin olacak.`);
  };

  const handleForgotPassword = () => {
    toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

      <div className="pointer-events-none fixed inset-0 z-50 flex h-full w-full items-center justify-center p-4">
        <div className="pointer-events-auto relative w-full max-w-[420px] rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            data-testid="auth-modal-close"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Giriş yapın veya hesap oluşturun</h2>
            <p className="text-sm text-zinc-500">Devam etmek için e-posta adresinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 bg-zinc-50 dark:bg-zinc-900"
              autoFocus
            />
            <Button type="submit" disabled={isLoading} className="h-11 w-full bg-blue-600 text-base font-semibold text-white transition-all hover:bg-blue-700">
              {isLoading ? "İşleniyor..." : "Devam et"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:underline">
              Şifrenizi mi unuttunuz?
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">veya</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => handleSocialLogin("Google")} className="h-11 border-zinc-300 bg-white font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile devam et
            </Button>
            <Button type="button" variant="outline" onClick={() => handleSocialLogin("Apple")} className="h-11 border-zinc-300 bg-white font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.68.727-1.303 2.193-1.111 3.585 1.343.104 2.553-.559 3.4-1.573z" />
              </svg>
              Apple ile devam et
            </Button>
          </div>

          <div className="mt-8 text-center text-xs leading-relaxed text-zinc-500">
            Devam ederek{" "}
            <Link href="/kullanim-kosullari" className="underline hover:text-zinc-800 dark:hover:text-zinc-300" onClick={onClose}>
              Kullanım Koşulları
            </Link>{" "}
            ve{" "}
            <Link href="/gizlilik" className="underline hover:text-zinc-800 dark:hover:text-zinc-300" onClick={onClose}>
              KVKK Politikası
            </Link>{" "}
            metinlerini kabul etmiş olursunuz.
          </div>
        </div>
      </div>
    </>
  );
}
