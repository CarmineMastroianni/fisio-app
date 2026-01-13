import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "./Button";
import { ToastViewport } from "./ui/ToastViewport";
import { useAuthStore } from "../stores/authStore";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/visits", label: "Visite", icon: ClipboardList },
  { to: "/patients", label: "Pazienti", icon: Users },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const { logout, session } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sand-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Agenda domiciliare</p>
            <h1 className="text-lg font-semibold text-slate-900">Studio Fisioterapico {session?.nome}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/settings"
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Impostazioni"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Esci
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl gap-6 px-4 py-4 lg:py-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-24 rounded-3xl border border-slate-200 bg-white/90 p-4">
            <div className="space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-teal-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Suggerimento</p>
              <p className="mt-1">La prossima visita oggi è alle 15:30. Preparati al kit domiciliare.</p>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)] pt-2 shadow-lg md:hidden">
        <div className="relative mx-auto flex max-w-screen-2xl items-center justify-between">
          <NavLink
            to="/dashboard"
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              location.pathname.startsWith("/dashboard") ? "text-teal-700" : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="h-6 w-6" />
            Dashboard
          </NavLink>
          <NavLink
            to="/calendar"
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              location.pathname.startsWith("/calendar") ? "text-teal-700" : "text-slate-500"
            }`}
          >
            <CalendarDays className="h-6 w-6" />
            Calendario
          </NavLink>
          <button
            type="button"
            onClick={() => navigate("/calendar?new=1")}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-xl"
            aria-label="Nuova visita"
          >
            <Plus className="h-7 w-7" />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 -translate-y-5 rounded-full ring-4 ring-white/80" />
          <NavLink
            to="/visits"
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              location.pathname.startsWith("/visits") ? "text-teal-700" : "text-slate-500"
            }`}
          >
            <ClipboardList className="h-6 w-6" />
            Visite
          </NavLink>
          <NavLink
            to="/patients"
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              location.pathname.startsWith("/patients") ? "text-teal-700" : "text-slate-500"
            }`}
          >
            <Users className="h-6 w-6" />
            Pazienti
          </NavLink>
        </div>
      </nav>
      <button
        type="button"
        onClick={() => navigate("/calendar?new=1")}
        className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-xl md:flex"
        aria-label="Nuova visita"
      >
        <Plus className="h-7 w-7" />
      </button>
      <ToastViewport />
    </div>
  );
};
