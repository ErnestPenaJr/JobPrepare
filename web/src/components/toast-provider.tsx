"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; title?: string; description?: string; variant?: "default" | "destructive" };

const ToastContext = createContext<{ addToast: (t: Omit<Toast, "id">) => void } | null>(null);

function genId(){ return Math.random().toString(36).slice(2); }

export function ToastProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = genId();
    const toast: Toast = { id, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);

  const ctx = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 grid gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-md border p-3 shadow-sm min-w-64 max-w-sm bg-background ${t.variant === 'destructive' ? 'border-red-500/60 bg-red-500/10' : ''}`}>
            {t.title && <div className="text-sm font-medium">{t.title}</div>}
            {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(){
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

