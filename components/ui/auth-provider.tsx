"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  bruger: string;
  rolle: "admin" | "bruger";
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  bruger: "",
  rolle: "bruger",
  loading: true,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [bruger, setBruger] = useState("");
  const [rolle, setRolle] = useState<"admin" | "bruger">("bruger");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setBruger(data.bruger);
        setRolle(data.rolle);
      })
      .catch(() => {
        // Not authenticated — middleware will redirect
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setBruger("");
    setRolle("bruger");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ bruger, rolle, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
