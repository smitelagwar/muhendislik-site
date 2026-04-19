"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const AuthModal = dynamic(
  () => import("@/components/auth-modal").then((module) => module.AuthModal),
  { ssr: false },
);

export function AuthTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        data-testid="navbar-auth-trigger"
        variant="outline"
        className="hidden h-11 rounded-full border-zinc-300 px-6 text-sm font-bold shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md active:scale-[0.98] dark:border-zinc-700 dark:hover:bg-zinc-800 sm:inline-flex"
        onClick={() => setIsOpen(true)}
      >
        Giriş Yap
      </Button>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
