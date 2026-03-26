import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const MENU_WIDTH = 184;

export type DropdownItem =
  | { type: "action"; label: string; onClick: () => void; variant?: "danger" }
  | { type: "link"; label: string; to: string }
  | { type: "separator" };

type DropdownMenuProps = {
  items: DropdownItem[];
  align?: "left" | "right";
};

export const DropdownMenu = ({ items, align = "right" }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      if (triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const toggle = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = align === "right" ? rect.right - MENU_WIDTH : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
    const actionCount = items.filter((i) => i.type !== "separator").length;
    const separators = items.filter((i) => i.type === "separator").length;
    const menuHeight = actionCount * 40 + separators * 17 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight && rect.top > menuHeight
      ? rect.top - menuHeight - 4
      : rect.bottom + 4;
    setPos({ top, left });
    setOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Azioni"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="dropdown-menu z-[9999] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {items.map((item, i) => {
              if (item.type === "separator") {
                return <hr key={i} className="my-1 border-slate-100" />;
              }
              if (item.type === "link") {
                return (
                  <Link
                    key={i}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    item.variant === "danger"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

