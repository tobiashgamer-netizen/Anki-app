"use client";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Home, PlusCircle, BookOpen, Trophy, Settings, LogOut, User, Layers, Database, RotateCcw, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/landing-page", label: "Hjem", icon: Home },
  { href: "/opret-kort", label: "Opret kort", icon: PlusCircle },
  { href: "/oev-dig", label: "Øv dig", icon: BookOpen },
  { href: "/mine-kort", label: "Mine kort", icon: Layers },
  { href: "/bibliotek", label: "Bibliotek", icon: Database },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const bruger = searchParams.get("bruger") || "Bruger";

  const buildHref = (base: string) => `${base}?bruger=${encodeURIComponent(bruger)}`;

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-950/80 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between z-50">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="bg-blue-600 p-2.5 rounded-xl">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
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
            if (confirm("Er du sikker? Dette nulstiller al din l\u00E6ringsfremdrift.")) {
              localStorage.removeItem("anki_progress");
              window.location.reload();
            }
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 w-full"
        >
          <RotateCcw className="w-5 h-5" />
          Nulstil fremgang
        </button>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{bruger}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Log ud
        </Link>
      </div>
    </aside>
  );
}
