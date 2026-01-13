import { NavLink } from "react-router-dom";
import { Card } from "../components/Card";
import { ClipboardList, LayoutDashboard, Settings } from "lucide-react";

const links = [
  { to: "/visits", label: "Visite", icon: ClipboardList, description: "Storico, filtri e azioni rapide." },
  { to: "/", label: "Dashboard", icon: LayoutDashboard, description: "KPI e performance settimanali." },
  { to: "/settings", label: "Impostazioni", icon: Settings, description: "Tariffe, metodi, trattamenti." },
];

export const MorePage = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Altro</h2>
        <p className="text-sm text-slate-500">Accesso rapido alle sezioni operative.</p>
      </div>
      <div className="grid gap-3">
        {links.map(({ to, label, icon: Icon, description }) => (
          <Card key={to} className="p-0">
            <NavLink to={to} className="flex items-center gap-3 px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </NavLink>
          </Card>
        ))}
      </div>
    </div>
  );
};
