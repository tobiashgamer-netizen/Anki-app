"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Home, PlusCircle, BookOpen, Trophy, LogOut, User, Layers, Database, RotateCcw, ShieldCheck, X, Settings } from "lucide-react";

const navItems = [
  { href: "/landing-page", label: "Hjem", icon: Home },
  { href: "/opret-kort", label: "Opret kort", icon: PlusCircle },
  { href: "/oev-dig", label: "Øv dig", icon: BookOpen },
  { href: "/mine-kort", label: "Mine kort", icon: Layers },
  { href: "/bibliotek", label: "Bibliotek", icon: Database },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const mobileNavItems = [
  { href: "/landing-page", label: "Hjem", icon: Home },
  { href: "/oev-dig", label: "Øv dig", icon: BookOpen },
  { href: "/bibliotek", label: "Bibliotek", icon: Database },
  { href: "/mine-kort", label: "Mine kort", icon: Layers },
];

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const bruger = searchParams.get("bruger") || "Bruger";
  const [profileOpen, setProfileOpen] = useState(false);

  const buildHref = (base: string) => `${base}?bruger=${encodeURIComponent(bruger)}`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-gray-950/80 backdrop-blur-xl border-r border-white/10 flex-col justify-between z-50">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <span className="font-bold text-white text-lg">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Anki Pro</span>
          </div>

          {/* Nav */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {bruger === "admin" && (
              <Link
                href={buildHref("/admin")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                  pathname === "/admin"
                    ? "bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10"
                    : "text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* User section */}
        <div className="px-3 pb-6 space-y-2">
          <button
            onClick={() => {
              if (confirm("Er du sikker? Dette nulstiller al din læringsfremdrift.")) {
                localStorage.removeItem("anki_progress");
                window.location.reload();
              }
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 w-full hover:scale-[1.02]"
          >
            <RotateCcw className="w-5 h-5" />
            Nulstil fremgang
          </button>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{bruger}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" />
            Log ud
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around px-1 py-1">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={buildHref(item.href)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[3.5rem] transition-all duration-200 ${
                  isActive
                    ? "text-blue-400"
                    : "text-gray-500 active:text-gray-300"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Profile button */}
          <button
            onClick={() => setProfileOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[3.5rem] transition-all duration-200 ${
              profileOpen ? "text-blue-400" : "text-gray-500 active:text-gray-300"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </nav>

      {/* Mobile Profile Sheet */}
      {profileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end" onClick={() => setProfileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full bg-gray-950 border-t border-white/10 rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

            {/* User info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{bruger}</p>
                <p className="text-sm text-gray-500">Online</p>
              </div>
              <button onClick={() => setProfileOpen(false)} className="ml-auto p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile actions */}
            <div className="space-y-1">
              <Link
                href={buildHref("/opret-kort")}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <PlusCircle className="w-5 h-5 text-blue-400" />
                Opret kort
              </Link>
              <Link
                href={buildHref("/leaderboard")}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Trophy className="w-5 h-5 text-amber-400" />
                Leaderboard
              </Link>
              {bruger === "admin" && (
                <Link
                  href={buildHref("/admin")}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  if (confirm("Er du sikker? Dette nulstiller al din læringsfremdrift.")) {
                    localStorage.removeItem("anki_progress");
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all w-full"
              >
                <RotateCcw className="w-5 h-5" />
                Nulstil fremgang
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Log ud
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
