"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmokeyBackground } from "@/components/ui/login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Der opstod en fejl");
        return;
      }

      router.push("/landing-page");
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-gray-900">
      <SmokeyBackground className="absolute inset-0" />
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-3xl">🪣</span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Velkommen tilbage" : "Opret konto"}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {mode === "login"
                ? "Log ind for at fortsætte"
                : "Opret en konto for at komme i gang"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="floating_username" className="block text-sm text-gray-300 mb-1.5">
                <span className="inline-block mr-1.5">👤</span>
                Brugernavn
              </label>
              <input
                type="text"
                id="floating_username"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                placeholder="Indtast brugernavn"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="floating_password" className="block text-sm text-gray-300 mb-1.5">
                <span className="inline-block mr-1.5">🔒</span>
                Adgangskode{mode === "register" ? " (min. 6 tegn)" : ""}
              </label>
              <input
                type="password"
                id="floating_password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                placeholder="Indtast adgangskode"
                required
                minLength={mode === "register" ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Log ind" : "Opret konto"}
                  <span className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            {mode === "login" ? (
              <>
                Har du ikke en konto?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Opret dig
                </button>
              </>
            ) : (
              <>
                Har du allerede en konto?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Log ind
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
