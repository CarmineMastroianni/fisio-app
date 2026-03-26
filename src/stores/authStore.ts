import { create } from "zustand";
import type { Session } from "../types";
import { supabase } from "../lib/supabase";

type AuthState = {
  session: Session | null;
  providerToken: string | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const toSession = (user: { email?: string; user_metadata?: Record<string, unknown> } | null): Session | null => {
  if (!user) return null;
  return {
    id: (user as { id?: string }).id ?? "",
    email: user.email ?? "",
    nome: (user.user_metadata?.nome as string) ?? user.email?.split("@")[0] ?? "Fisioterapista",
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  providerToken: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: toSession(data.session?.user ?? null),
      providerToken: data.session?.provider_token ?? null,
      loading: false,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session: toSession(session?.user ?? null),
        providerToken: session?.provider_token ?? null,
      });
    });
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ session: toSession(data.user) });
    return { error: null };
  },

  loginWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        redirectTo: window.location.origin,
        queryParams: {
          access_type: "online",
          prompt: "consent",
        },
      },
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, providerToken: null });
  },
}));
