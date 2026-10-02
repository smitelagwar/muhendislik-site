"use client";

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF PAROLA İLETİŞİM KUTUSU (FAZ B)
// ============================================================================

import React, { useState } from "react";
import { Lock, AlertCircle, KeyRound, X } from "lucide-react";
import { pdfViewerStrings } from "./strings";

interface PdfPasswordModalProps {
  isOpen: boolean;
  reason: number | null; // 1: NEED_PASSWORD, 2: INCORRECT_PASSWORD
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PdfPasswordModal({
  isOpen,
  reason,
  onSubmit,
  onCancel,
}: PdfPasswordModalProps) {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password);
  };

  const isIncorrect = reason === 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
      data-testid="pdf-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onCancel}
          aria-label={pdfViewerStrings.close}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 id="password-modal-title" className="text-sm font-semibold text-zinc-100">
              {pdfViewerStrings.passwordProtectedTitle}
            </h2>
            <p className="text-xs text-zinc-400">
              {pdfViewerStrings.passwordProtectedDescription}
            </p>
          </div>
        </div>

        {isIncorrect && (
          <div
            role="alert"
            data-testid="pdf-password-error"
            className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{pdfViewerStrings.loadingPasswordError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="pdf-password-input"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              {pdfViewerStrings.documentPassword}
            </label>
            <div className="relative">
              <input
                id="pdf-password-input"
                data-testid="pdf-password-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={pdfViewerStrings.enterPassword}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              {pdfViewerStrings.cancel}
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              data-testid="pdf-password-submit"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{pdfViewerStrings.openDocument}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
