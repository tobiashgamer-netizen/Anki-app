"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmokeyBackground } from "@/components/ui/login-form";

export default function DashboardLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/landing-page?bruger=${encodeURIComponent(username)}`);
  };

  return (
    <main className="relative w-screen h-screen bg-gray-900">
      <SmokeyBackground className="absolute inset-0" />
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Velkommen tilbage</h2>
            <p className="mt-2 text-sm text-gray-300">Log ind for at fortsætte</p>
          </div>
          <form className="space-y-8" onSubmit={handleLogin}>
            {/* Brugernavn Input med Animated Label */}
            <div className="relative z-0">
              <input
                type="text"
                id="floating_username"
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer"
                placeholder=" "
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <label
                htmlFor="floating_username"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <span className="inline-block mr-2 -mt-1">👤</span>
                Brugernavn
              </label>
            </div>
            {/* Password Input med Animated Label */}
            <div className="relative z-0">
              <input
                type="password"
                id="floating_password"
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer"
                placeholder=" "
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <label
                htmlFor="floating_password"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <span className="inline-block mr-2 -mt-1">🔒</span>
                Adgangskode
              </label>
            </div>
            <div className="flex items-center justify-between">
              <a href="#" className="text-xs text-gray-300 hover:text-white transition">Glemt adgangskode?</a>
            </div>
            <button
              type="submit"
              className="group w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300"
            >
              Log ind
              <span className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </form>
          <p className="text-center text-xs text-gray-400">
            Har du ikke en konto? <a href="#" className="font-semibold text-blue-400 hover:text-blue-300 transition">Opret dig</a>
          </p>
        </div>
      </div>
    </main>
  );
}