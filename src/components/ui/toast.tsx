"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "border-success/20 bg-success/5",
  error: "border-destructive/20 bg-destructive/5",
  info: "border-accent/20 bg-accent/5",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onRemove={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg bg-card animate-in slide-in-from-right",
        styles[toast.type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 hover:bg-muted rounded"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
