import type { ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export const Tabs = ({ items, activeId, onChange }: TabsProps) => (
  <div>
    <div
      role="tablist"
      aria-label="Sezioni paziente"
      className="flex gap-2 overflow-x-auto pb-2 text-sm"
    >
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={activeId === item.id}
          onClick={() => onChange(item.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
            activeId === item.id
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
    <div className="mt-4">
      {items.map((item) =>
        item.id === activeId ? (
          <div key={item.id} role="tabpanel">
            {item.content}
          </div>
        ) : null
      )}
    </div>
  </div>
);
