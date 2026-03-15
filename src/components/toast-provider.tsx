"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, Info, X, Bookmark, Share2, Heart } from "lucide-react";

type ToastType = "success" | "error" | "info" | "bookmark" | "share" | "like";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const icons: Record<ToastType, ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        bookmark: <Bookmark className="w-5 h-5 text-amber-500" />,
        share: <Share2 className="w-5 h-5 text-indigo-500" />,
        like: <Heart className="w-5 h-5 text-pink-500" />,
    };

    const bgColors: Record<ToastType, string> = {
        success: "border-green-500/30 bg-green-50 dark:bg-green-950/40",
        error: "border-red-500/30 bg-red-50 dark:bg-red-950/40",
        info: "border-blue-500/30 bg-blue-50 dark:bg-blue-950/40",
        bookmark: "border-amber-500/30 bg-amber-50 dark:bg-amber-950/40",
        share: "border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40",
        like: "border-pink-500/30 bg-pink-50 dark:bg-pink-950/40",
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
                        <button onClick={() => removeToast(toast.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-1">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
