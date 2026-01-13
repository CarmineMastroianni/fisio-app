import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export const Breadcrumb = ({ items }: BreadcrumbProps) => (
  <nav className="flex items-center gap-1 text-xs text-slate-500" aria-label="breadcrumb">
    {items.map((item, index) => (
      <span key={`${item.label}-${index}`} className="flex items-center gap-1">
        {item.to ? (
          <Link to={item.to} className="hover:text-slate-700">
            {item.label}
          </Link>
        ) : (
          <span className="text-slate-700">{item.label}</span>
        )}
        {index < items.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
      </span>
    ))}
  </nav>
);
