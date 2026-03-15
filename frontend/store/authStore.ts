import { create } from "zustand";
import type { User } from "@/types";
import { authApi } from "@/lib/api/auth";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token) => {
    localStorage.setItem("access_token", token);
    setCookie("access_token", token, 1);
    set({ token, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      deleteCookie("access_token");
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  initialize: async () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (!token) {
      set({ isLoading: false });
      return;
    }

    // Ensure cookie is in sync with localStorage
    setCookie("access_token", token, 1);
    set({ token, isAuthenticated: true });

    if (userStr) {
      try {
        set({ user: JSON.parse(userStr) });
      } catch {}
    }

    try {
      const user = await authApi.me();
      set({ user, isLoading: false });
      localStorage.setItem("user", JSON.stringify(user));
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      deleteCookie("access_token");
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
