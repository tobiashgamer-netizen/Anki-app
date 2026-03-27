"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import {
  BookOpen, PlusCircle, Trophy, Zap, Layers, Loader2,
  Search, X, Eye, Database, Sparkles, Brain, Megaphone, BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { hentAlleKort, hentBroadcast, logActivity } from "@/app/dashboard/actions";

interface Flashcard {
  row: number;
  question: string;
  answer: string;
  imageURL?: string;
  category: string;
  user: string;
  public: boolean;
  likes: number;
  deckname: string;
}

const OFFICIAL_OWNERS = ["admin", "officiel"];

function DashboardContent() {
  const router = useRouter();
  const { bruger } = useAuth();

  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [previewKort, setPreviewKort] = useState<Flashcard | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [mestretCount, setMestretCount] = useState(0);
  const [officielleCount, setOfficielleCount] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [result, broadRes] = await Promise.all([
          hentAlleKort(bruger),
          hentBroadcast(),
        ]);
        // Log activity
        logActivity(bruger);
        if (broadRes.success && broadRes.message) setBroadcastMsg(broadRes.message);
        if (result.success && Array.isArray(result.kort)) {
          const cards = result.kort as Flashcard[];
          setAlleKort(cards);
          // Compute SRS mastered count
          const officielle = cards.filter((k) =>
            OFFICIAL_OWNERS.includes(k.user.toLowerCase()) && k.public
          );
          setOfficielleCount(officielle.length);
          try {
            const progress = JSON.parse(localStorage.getItem("anki_progress") || "{}");
            const mestret = officielle.filter((k) => progress[k.question]?.level === 2).length;
            setMestretCount(mestret);
          } catch { /* silent */ }
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bruger]);

  const totalKort = alleKort.length;
  const mineKort = alleKort.filter((k) => k.user === bruger).length;
  const streak = Math.floor(Math.random() * 7) + 1; // mock streak

  const dagensKort = useMemo(() => {
    const officielle = alleKort.filter((k) =>
      OFFICIAL_OWNERS.includes(k.user.toLowerCase()) && k.public
    );
    if (officielle.length === 0) return null;
    return officielle[Math.floor(Math.random() * officielle.length)];
  }, [alleKort]);

  const searchResults = useMemo(() => {
    if (!soegning.trim()) return [];
    const q = soegning.toLowerCase();
    return alleKort
      .filter(
        (k) =>
          k.question.toLowerCase().includes(q) ||
          k.answer.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [soegning, alleKort]);

  const openPreview = (kort: Flashcard) => {
    setPreviewKort(kort);
    setPreviewFlipped(false);
  };

  const stats = [
    { label: "Kort i databasen", value: totalKort, icon: Database, color: "from-blue-500 to-blue-700" },
    { label: "Mine kort", value: mineKort, icon: Layers, color: "from-purple-500 to-purple-700" },
    { label: "Streak", value: `${streak} dage`, icon: Zap, color: "from-amber-500 to-orange-600" },
    { label: "Rang", value: "—", icon: Trophy, color: "from-emerald-500 to-green-700" },
  ];

  const quickActions = [
    { label: "Opret nyt kort", description: "Tilføj et flashcard til din samling", href: "/opret-kort", icon: PlusCircle, color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Øv dig nu", description: "Start en øvesession med dine kort", href: "/oev-dig", icon: BookOpen, color: "bg-purple-600 hover:bg-purple-700" },
    { label: "Se leaderboard", description: "Hvem har lavet flest kort?", href: "/leaderboard", icon: Trophy, color: "bg-emerald-600 hover:bg-emerald-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-6xl mx-auto">
        <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2">
          <h1 className="text-2xl md:text-4xl font-bold">
            Velkommen tilbage, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{bruger}</span>!
          </h1>
          <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Klar til at lære noget nyt i dag?</p>
        </div>

        {/* Broadcast Banner */}
        {broadcastMsg && (
          <div className="px-4 md:px-10 pt-4">
            <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200 font-medium">{broadcastMsg}</p>
            </div>
          </div>
        )}

        {/* Global Search */}
        <div className="px-4 md:px-10 pt-4 pb-2">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              placeholder="Søg i alle kort (spørgsmål & svar)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
            />
            {soegning && (
              <button onClick={() => setSoegning("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 max-h-96 overflow-y-auto">
                {searchResults.map((kort) => (
                  <button
                    key={kort.row}
                    onClick={() => { openPreview(kort); setSoegning(""); }}
                    className="w-full text-left px-5 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-200 truncate">{kort.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{kort.answer}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{kort.deckname || kort.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 md:px-10 py-4 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse h-28" />
            ))
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm shadow-lg shadow-black/10 card-hover">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                <stat.icon className="w-6 h-6 text-gray-400 mb-3" />
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Dagens Tilfældige Spørgsmål */}
        {!loading && dagensKort && (
          <div className="px-4 md:px-10 py-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Dagens tilfældige spørgsmål
            </h2>
            <div
              onClick={() => openPreview(dagensKort)}
              className="group cursor-pointer rounded-2xl bg-gradient-to-br from-amber-500/5 to-purple-500/5 border border-amber-500/20 hover:border-amber-500/40 p-8 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 max-w-2xl backdrop-blur-sm animate-glow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">Officielt deck</span>
                <span className="text-xs text-gray-500">{dagensKort.deckname}</span>
              </div>
              <p className="text-xl font-semibold text-gray-100">{dagensKort.question}</p>
              <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 group-hover:text-amber-400 transition-colors">
                <Eye className="w-4 h-4" />
                Klik for at se svaret
              </div>
            </div>
          </div>
        )}

        {/* Viden-status Widget */}
        {!loading && officielleCount > 0 && (
          <div className="px-4 md:px-10 py-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Viden-status
            </h2>
            <div className="rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 p-6 max-w-2xl backdrop-blur-sm shadow-lg shadow-black/10">
              <p className="text-lg text-gray-200">
                Du har mestret <span className="font-bold text-emerald-400">{mestretCount}</span> ud af <span className="font-bold text-blue-400">{officielleCount}</span> officielle kort
              </p>
              <div className="mt-3 w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${officielleCount > 0 ? (mestretCount / officielleCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{officielleCount > 0 ? Math.round((mestretCount / officielleCount) * 100) : 0}% mestret</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 md:px-10 py-4 md:py-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Hurtige handlinger
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 backdrop-blur-sm hover:scale-[1.02]"
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

        {/* Card Preview Modal */}
        {previewKort && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewKort(null)}>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${previewFlipped ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                  {previewFlipped ? "Svar" : "Spørgsmål"}
                </span>
                <button onClick={() => setPreviewKort(null)} className="text-gray-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="cursor-pointer min-h-[200px] flex flex-col items-center justify-center py-6"
              >
                <p className="text-2xl font-semibold text-center leading-relaxed">
                  {previewFlipped ? previewKort.answer : previewKort.question}
                </p>
                {previewFlipped && previewKort.imageURL && (
                  <img src={previewKort.imageURL} alt="Kort billede" className="mt-4 max-h-48 rounded-lg border border-white/10 object-contain" />
                )}
                {!previewFlipped && (
                  <p className="mt-4 text-sm text-gray-500">Klik for at se svaret</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{previewKort.category}</span>
                  <span>•</span>
                  <span>{previewKort.deckname || "Intet deck"}</span>
                </div>
                <button
                  onClick={() => {
                    setPreviewKort(null);
                    router.push(`/oev-dig?deck=${encodeURIComponent(previewKort.deckname)}&owner=${encodeURIComponent(previewKort.user)}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Øv dette deck
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <DashboardContent />
    </Suspense>
  );
}