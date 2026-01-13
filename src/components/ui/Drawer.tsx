import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const getFocusable = (element: HTMLElement | null) => {
  if (!element) return [] as HTMLElement[];
  return Array.from(
    element.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), textarea, input, select, [tabindex='0']"
    )
  );
};

type DrawerProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export const Drawer = ({ open, title, children, onClose }: DrawerProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const focusable = getFocusable(panelRef.current);
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = getFocusable(panelRef.current);
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 px-4 py-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        ref={panelRef}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};
