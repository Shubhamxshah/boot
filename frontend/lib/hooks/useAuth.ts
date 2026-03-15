import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem("access_token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    store.setToken(res.token);
    store.setUser(res.user);
    router.replace("/");
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem("access_token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    store.setToken(res.token);
    store.setUser(res.user);
    router.replace("/");
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    store.logout();
    router.replace("/");
  };

  return { ...store, login, register, logout };
}
