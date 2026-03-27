"use client";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { BookOpen, PlusCircle, Trophy, TrendingUp, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function LandingContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";
  const buildHref = (base: string) => `${base}?bruger=${encodeURIComponent(bruger)}`;

  const stats = [
    { label: "Kort oprettet", value: "0", icon: PlusCircle, color: "from-blue-500 to-blue-700" },
    { label: "Kort øvet", value: "0", icon: BookOpen, color: "from-purple-500 to-purple-700" },
    { label: "Streak", value: "0 dage", icon: Zap, color: "from-amber-500 to-orange-600" },
    { label: "Rang", value: "—", icon: Trophy, color: "from-emerald-500 to-green-700" },
  ];

  const quickActions = [
    { label: "Opret nyt kort", description: "Tilføj et flashcard til din samling", href: buildHref("/opret-kort"), icon: PlusCircle, color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Øv dig nu", description: "Start en øvesession med dine kort", href: buildHref("/oev-dig"), icon: BookOpen, color: "bg-purple-600 hover:bg-purple-700" },
    { label: "Se leaderboard", description: "Hvem har lavet flest kort?", href: buildHref("/leaderboard"), icon: Trophy, color: "bg-emerald-600 hover:bg-emerald-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold">
            Hej, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{bruger}</span> 👋
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Klar til at lære noget nyt i dag?</p>
        </div>

        <div className="px-10 py-6 grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
              <stat.icon className="w-6 h-6 text-gray-400 mb-3" />
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="px-10 py-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Hurtige handlinger
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">{action.label}</h3>
                <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            ))}
          </div>
        </div>

        <div className="px-10 py-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Seneste aktivitet
          </h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur-sm">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Ingen aktivitet endnu. Start med at oprette dit første flashcard!</p>
            <Link
              href={buildHref("/opret-kort")}
              className="inline-block mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all duration-200"
            >
              Opret dit første kort
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LandingContent />
    </Suspense>
  );
}