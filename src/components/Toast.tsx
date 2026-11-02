"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "pending" | "info" | "accrual";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    pending: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    accrual: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration: number = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, title?: string) => showToast(msg, "success", title),
    error: (msg: string, title?: string) => showToast(msg, "error", title),
    pending: (msg: string, title?: string) => showToast(msg, "pending", title),
    info: (msg: string, title?: string) => showToast(msg, "info", title),
    accrual: (msg: string, title?: string) => showToast(msg, "accrual", title),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Floating Toast Container (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 select-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = item.duration || 4200;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [item.duration]);

  const config: Record<
    ToastType,
    { symbol: string; badgeClass: string; borderClass: string; barClass: string }
  > = {
    success: {
      symbol: "✓",
      badgeClass: "bg-emerald-100 text-emerald-700",
      borderClass: "border-emerald-200 bg-white",
      barClass: "bg-emerald-500",
    },
    error: {
      symbol: "✕",
      badgeClass: "bg-rose-100 text-rose-700",
      borderClass: "border-rose-200 bg-white",
      barClass: "bg-rose-500",
    },
    pending: {
      symbol: "◷",
      badgeClass: "bg-amber-100 text-amber-700",
      borderClass: "border-amber-200 bg-white",
      barClass: "bg-amber-500",
    },
    info: {
      symbol: "●",
      badgeClass: "bg-blue-100 text-corporate-700",
      borderClass: "border-blue-200 bg-white",
      barClass: "bg-corporate-600",
    },
    accrual: {
      symbol: "⚡",
      badgeClass: "bg-purple-100 text-purple-700",
      borderClass: "border-purple-200 bg-white",
      barClass: "bg-purple-600",
    },
  };

  const style = config[item.type] || config.info;

  return (
    <div
      className={`pointer-events-auto rounded-xl border ${style.borderClass} shadow-dropdown p-3.5 flex items-start gap-3 transition-all duration-200 animate-slide-down relative overflow-hidden`}
    >
      <div
        className={`w-7 h-7 rounded-lg ${style.badgeClass} font-bold flex items-center justify-center text-xs shrink-0 mt-0.5`}
      >
        {style.symbol}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        {item.title && (
          <p className="text-xs font-bold text-slate-900 tracking-tight leading-snug">
            {item.title}
          </p>
        )}
        <p className="text-xs font-medium text-slate-600 leading-snug mt-0.5">
          {item.message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
        <div
          className={`h-full ${style.barClass} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
