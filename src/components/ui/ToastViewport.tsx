import { useEffect } from "react";
import { CheckCircle, Info, XCircle, X } from "lucide-react";
import { useToastStore } from "../../stores/toastStore";

const toneStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-slate-200 bg-white text-slate-700",
};

const toneIcon = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

export const ToastViewport = () => {
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 3200)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts, removeToast]);

  return (
    <div className="fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const Icon = toneIcon[tone];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${toneStyles[tone]}`}
          >
            <Icon className="mt-0.5 h-4 w-4" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="text-xs opacity-80">{toast.description}</p> : null}
            </div>
            <button type="button" onClick={() => removeToast(toast.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
