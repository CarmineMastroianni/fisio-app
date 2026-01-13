import { create } from "zustand";
import type { Session } from "../types";

const SESSION_KEY = "fisio-session";

type AuthState = {
  session: Session | null;
  restore: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  restore: () => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const session = JSON.parse(raw) as Session;
      set({ session });
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  },
  login: (email: string, password: string) => {
    if (!email || !password) return false;
    const session: Session = { email, nome: email.split("@")[0] || "Fisioterapista" };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
    return true;
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ session: null });
  },
}));
