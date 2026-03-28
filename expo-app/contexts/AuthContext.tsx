import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { saveToken, getToken, clearToken } from "../lib/auth";
import { loginUser, registerUser, getMe } from "../lib/api";

interface AuthState {
  bruger: string;
  rolle: "admin" | "bruger";
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  bruger: "",
  rolle: "bruger",
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [bruger, setBruger] = useState("");
  const [rolle, setRolle] = useState<"admin" | "bruger">("bruger");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const data = await getMe();
        if (data?.authenticated) {
          setBruger(data.bruger);
          setRolle(data.rolle);
        } else {
          await clearToken();
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await loginUser(username, password);
      if (data.success && data.token) {
        await saveToken(data.token);
        setBruger(data.bruger);
        setRolle(data.rolle === "admin" ? "admin" : "bruger");
        return { success: true };
      }
      return { success: false, error: data.error || "Login fejlede" };
    } catch {
      return { success: false, error: "Kunne ikke forbinde til serveren" };
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const data = await registerUser(username, password);
      if (data.success && data.token) {
        await saveToken(data.token);
        setBruger(data.bruger);
        setRolle("bruger");
        return { success: true };
      }
      return { success: false, error: data.error || "Registrering fejlede" };
    } catch {
      return { success: false, error: "Kunne ikke forbinde til serveren" };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setBruger("");
    setRolle("bruger");
  }, []);

  return (
    <AuthContext.Provider value={{ bruger, rolle, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
