"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { Database, Search, ChevronDown, ChevronRight, Scale, Briefcase, Shield, FolderOpen, Loader2, User } from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort } from "@/app/dashboard/actions";

interface Flashcard {
  question: string;
  answer: string;
  category: string;
  user: string;
  public: boolean;
  deckname: string;
}

const kategoriMeta: Record<string, { icon: typeof Scale; color: string; border: string; badge: string }> = {
  jura: { icon: Scale, color: "from-blue-500 to-blue-700", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-300" },
  portfolio: { icon: Briefcase, color: "from-purple-500 to-purple-700", border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-300" },
  politifaglig: { icon: Shield, color: "from-emerald-500 to-emerald-700", border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300" },
  andet: { icon: FolderOpen, color: "from-amber-500 to-orange-600", border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-300" },
};

const defaultMeta = { icon: FolderOpen, color: "from-gray-500 to-gray-700", border: "border-gray-500/30", badge: "bg-gray-500/20 text-gray-300" };

function getMeta(category: string) {
  return kategoriMeta[category.toLowerCase()] || defaultMeta;
}

function OversigtContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";

  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fejl, setFejl] = useState("");
  const [soegning, setSoegning] = useState("");
  const [aabneKort, setAabneKort] = useState<Set<number>>(new Set());
  const [aabneKategorier, setAabneKategorier] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchKort = async () => {
      setLoading(true);
      setFejl("");
      try {
        const result = await hentAlleKort();
        if (result.success && Array.isArray(result.kort)) {
          // Only show cards explicitly marked as public
          const mapped: Flashcard[] = (result.kort as Flashcard[]).filter((k) => k.public === true);
          setAlleKort(mapped);
          setAabneKategorier(new Set(mapped.map((k) => k.category || "Andet")));
        } else {
          setFejl("Kunne ikke hente kort fra Google Sheets.");
        }
      } catch {
        setFejl("Kunne ikke hente kort fra Google Sheets.");
      } finally {
        setLoading(false);
      }
    };
    fetchKort();
  }, []);

  const filtreredeKort = useMemo(() => {
    if (!soegning.trim()) return alleKort;
    const q = soegning.toLowerCase();
    return alleKort.filter(
      (k) =>
        k.question.toLowerCase().includes(q) ||
        k.answer.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q) ||
        k.user.toLowerCase().includes(q) ||
        (k.deckname || "").toLowerCase().includes(q)
    );
  }, [alleKort, soegning]);

  const grupperet = useMemo(() => {
    const map: Record<string, Flashcard[]> = {};
    for (const kort of filtreredeKort) {
      const cat = kort.category || "Andet";
      if (!map[cat]) map[cat] = [];
      map[cat].push(kort);
    }
    return map;
  }, [filtreredeKort]);

  const toggleKort = (index: number) => {
    setAabneKort((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleKategori = (cat: string) => {
    setAabneKategorier((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Database className="w-9 h-9 text-blue-400" />
            Oversigt
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Søg og gennemse alle offentlige flashcards</p>
        </div>

        <div className="px-10 py-6">
          {/* Search bar */}
          <div className="relative max-w-2xl mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              placeholder="Søg i spørgsmål, svar, kategorier eller brugere..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
            />
            {soegning && (
              <button
                onClick={() => setSoegning("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
              >
                Ryd
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
            <span>{filtreredeKort.length} kort{soegning ? ` fundet for "${soegning}"` : " i alt"}</span>
            <span>•</span>
            <span>{Object.keys(grupperet).length} kategorier</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter kort...</p>
            </div>
          ) : fejl ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
              <p className="text-red-300 mb-4">{fejl}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition"
              >
                Prøv igen
              </button>
            </div>
          ) : filtreredeKort.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {soegning ? `Ingen kort matcher "${soegning}"` : "Ingen offentlige kort fundet endnu."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {Object.entries(grupperet).map(([kategori, kortListe]) => {
                const meta = getMeta(kategori);
                const KatIcon = meta.icon;
                const erAaben = aabneKategorier.has(kategori);
                const startIndex = globalIndex;
                globalIndex += kortListe.length;

                return (
                  <div key={kategori} className={`rounded-2xl bg-white/5 border ${meta.border} overflow-hidden`}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleKategori(kategori)}
                      className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <KatIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-bold flex-1 text-left">{kategori}</h2>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>
                        {kortListe.length} kort
                      </span>
                      {erAaben ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>

                    {/* Cards accordion */}
                    {erAaben && (
                      <div className="border-t border-white/5">
                        {kortListe.map((kort, i) => {
                          const idx = startIndex + i;
                          const erKortAabent = aabneKort.has(idx);
                          return (
                            <div key={idx} className="border-b border-white/5 last:border-b-0">
                              <button
                                onClick={() => toggleKort(idx)}
                                className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/5 transition-colors text-left"
                              >
                                {erKortAabent ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                )}
                                <span className="flex-1 text-sm font-medium text-gray-200">{kort.question}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {kort.deckname && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500">
                                      {kort.deckname}
                                    </span>
                                  )}
                                  {kort.user && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                                      <User className="w-3 h-3" />
                                      {kort.user}
                                    </span>
                                  )}
                                </div>
                              </button>
                              {erKortAabent && (
                                <div className="px-6 pb-4">
                                  <div className="ml-7 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed">
                                    {kort.answer}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OversigtPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <OversigtContent />
    </Suspense>
  );
}
