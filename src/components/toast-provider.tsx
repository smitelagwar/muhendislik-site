"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { CheckCircle, XCircle, Info, X, Share2, Heart } from "lucide-react";

type ToastType = "success" | "error" | "info" | "share" | "like";

export interface ToastOptions {
    actionLabel?: string;
    onAction?: () => void;
    durationMs?: number;
    actionTestId?: string;
}

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    actionLabel?: string;
    onAction?: () => void;
    actionTestId?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextIdRef = useRef(1);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            for (const timer of timers.values()) {
                clearTimeout(timer);
            }
            timers.clear();
        };
    }, []);

    const removeToast = useCallback((id: number) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "info", options?: ToastOptions) => {
        const id = nextIdRef.current++;
        const duration = options?.durationMs ?? 3000;
        setToasts((prev) => [
            ...prev,
            {
                id,
                message,
                type,
                actionLabel: options?.actionLabel,
                onAction: options?.onAction,
                actionTestId: options?.actionTestId,
            },
        ]);
        const timer = setTimeout(() => {
            timersRef.current.delete(id);
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
        timersRef.current.set(id, timer);
    }, []);

    const icons: Record<ToastType, ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-teal-500" />,
        share: <Share2 className="w-5 h-5 text-sky-500" />,
        like: <Heart className="w-5 h-5 text-rose-500" />,
    };

    const bgColors: Record<ToastType, string> = {
        success: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40",
        error: "border-red-500/30 bg-red-50 dark:bg-red-950/40",
        info: "border-teal-500/30 bg-teal-50 dark:bg-teal-950/40",
        share: "border-sky-500/30 bg-sky-50 dark:bg-sky-950/40",
        like: "border-rose-500/30 bg-rose-50 dark:bg-rose-950/40",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-20 right-6 z-[200] flex flex-col gap-2 items-end">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[toast.type]} animate-toast-in`}
                    >
                        {icons[toast.type]}
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 whitespace-nowrap">{toast.message}</span>
                        {toast.actionLabel && toast.onAction && (
                            <button
                                type="button"
                                data-testid={toast.actionTestId || "dok-toast-undo"}
                                onClick={() => {
                                    const handler = toast.onAction;
                                    removeToast(toast.id);
                                    handler?.();
                                }}
                                className="ml-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/25 dark:text-amber-300 transition-colors whitespace-nowrap"
                            >
                                {toast.actionLabel}
                            </button>
                        )}
                        <button onClick={() => removeToast(toast.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-1">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
