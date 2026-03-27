"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Database, Search, Scale, Briefcase, Shield, FolderOpen, Loader2,
  User, Heart, Copy, Layers, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort, kopierDeck, likeDeck } from "@/app/dashboard/actions";

interface Flashcard {
  row: number;
  question: string;
  answer: string;
  category: string;
  user: string;
  public: boolean;
  likes: number;
  deckname: string;
}

interface Deck {
  deckname: string;
  owner: string;
  category: string;
  cards: Flashcard[];
  likes: number;
}

const kategoriMeta: Record<string, { icon: typeof Scale; color: string; badge: string; bg: string }> = {
  jura: { icon: Scale, color: "from-blue-500 to-blue-700", badge: "bg-blue-500/20 text-blue-300", bg: "bg-blue-500/10" },
  portfolio: { icon: Briefcase, color: "from-purple-500 to-purple-700", badge: "bg-purple-500/20 text-purple-300", bg: "bg-purple-500/10" },
  politifaglig: { icon: Shield, color: "from-emerald-500 to-emerald-700", badge: "bg-emerald-500/20 text-emerald-300", bg: "bg-emerald-500/10" },
  andet: { icon: FolderOpen, color: "from-amber-500 to-orange-600", badge: "bg-amber-500/20 text-amber-300", bg: "bg-amber-500/10" },
};
const defaultMeta = { icon: FolderOpen, color: "from-gray-500 to-gray-700", badge: "bg-gray-500/20 text-gray-300", bg: "bg-gray-500/10" };
function getMeta(cat: string) { return kategoriMeta[cat.toLowerCase()] || defaultMeta; }

function OversigtContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";

  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fejl, setFejl] = useState("");
  const [soegning, setSoegning] = useState("");
  const [filterForfatter, setFilterForfatter] = useState<string | null>(null);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [liking, setLiking] = useState<string | null>(null);
  const [likedDecks, setLikedDecks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchKort = async () => {
      setLoading(true);
      setFejl("");
      try {
        const result = await hentAlleKort();
        if (result.success && Array.isArray(result.kort)) {
          const pub = (result.kort as Flashcard[]).filter((k) => k.public === true);
          setAlleKort(pub);
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

  // Group cards into decks by deckname+owner
  const decks = useMemo(() => {
    const map: Record<string, Deck> = {};
    for (const k of alleKort) {
      const dn = k.deckname || "Unavngivet deck";
      const key = `${dn}|||${k.user}`;
      if (!map[key]) {
        map[key] = { deckname: dn, owner: k.user, category: k.category, cards: [], likes: 0 };
      }
      map[key].cards.push(k);
      // Use max likes from any card in deck
      if (k.likes > map[key].likes) map[key].likes = k.likes;
    }
    return Object.values(map);
  }, [alleKort]);

  // Filter decks by search and author
  const filteredDecks = useMemo(() => {
    let result = decks;
    if (filterForfatter) {
      result = result.filter((d) => d.owner === filterForfatter);
    }
    if (soegning.trim()) {
      const q = soegning.toLowerCase();
      result = result.filter(
        (d) =>
          d.deckname.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.cards.some((c) => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q))
      );
    }
    return result;
  }, [decks, soegning, filterForfatter]);

  const deckKey = (d: Deck) => `${d.deckname}|||${d.owner}`;

  const handleCopy = async (deck: Deck) => {
    const key = deckKey(deck);
    setCopying(key);
    try {
      const result = await kopierDeck({
        deckname: deck.deckname,
        sourceOwner: deck.owner,
        user: bruger,
      });
      if (result.success) {
        alert(`"${deck.deckname}" kopieret til din samling! (${result.copied} kort)`);
      } else {
        alert("Kunne ikke kopiere deck: " + (result.error || "Ukendt fejl"));
      }
    } catch {
      alert("Netværksfejl.");
    } finally {
      setCopying(null);
    }
  };

  const handleLike = async (deck: Deck) => {
    const key = deckKey(deck);
    if (likedDecks.has(key)) return;
    setLiking(key);
    try {
      const result = await likeDeck({ deckname: deck.deckname, deckOwner: deck.owner });
      if (result.success) {
        setLikedDecks((prev) => new Set(prev).add(key));
        // Optimistic update
        setAlleKort((prev) =>
          prev.map((k) =>
            k.deckname === deck.deckname && k.user === deck.owner
              ? { ...k, likes: k.likes + 1 }
              : k
          )
        );
      }
    } catch { /* silent */ } finally {
      setLiking(null);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedDeck((prev) => (prev === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Database className="w-9 h-9 text-blue-400" />
            Community Deck Store
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Udforsk, like og kopier offentlige decks til din samling</p>
        </div>

        <div className="px-10 py-6">
          {/* Search bar */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              placeholder="Søg i decks, kategorier, forfattere..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
            />
            {soegning && (
              <button onClick={() => setSoegning("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
                Ryd
              </button>
            )}
          </div>

          {/* Author filter */}
          {filterForfatter && (
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-gray-400">Filtrerer efter forfatter:</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-semibold">
                <User className="w-3.5 h-3.5" />
                {filterForfatter}
                <button onClick={() => setFilterForfatter(null)} className="ml-1 hover:text-white transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
            <span>{filteredDecks.length} decks{soegning ? ` fundet` : ""}</span>
            <span>•</span>
            <span>{alleKort.length} offentlige kort i alt</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter decks...</p>
            </div>
          ) : fejl ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
              <p className="text-red-300 mb-4">{fejl}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition">
                Prøv igen
              </button>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {soegning || filterForfatter ? "Ingen decks matcher din søgning." : "Ingen offentlige decks fundet endnu."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => {
                const meta = getMeta(deck.category);
                const KatIcon = meta.icon;
                const key = deckKey(deck);
                const isExpanded = expandedDeck === key;
                const isCopying = copying === key;
                const isLiking = liking === key;
                const isLiked = likedDecks.has(key);
                const isOwnDeck = deck.owner === bruger;

                return (
                  <div
                    key={key}
                    className={`rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/5 ${isExpanded ? "col-span-1 md:col-span-2 xl:col-span-3" : ""}`}
                  >
                    {/* Deck header */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                          <KatIcon className="w-5.5 h-5.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold truncate">{deck.deckname}</h3>
                          <button
                            onClick={() => setFilterForfatter(deck.owner === filterForfatter ? null : deck.owner)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors mt-0.5"
                          >
                            <User className="w-3 h-3" />
                            {deck.owner || "Ukendt"}
                          </button>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge} flex-shrink-0`}>
                          {deck.category}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {deck.cards.length} kort
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? "text-red-400 fill-red-400" : ""}`} />
                          {deck.likes} likes
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLike(deck)}
                          disabled={isLiked || isLiking}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            isLiked
                              ? "bg-red-500/20 border-red-500/30 text-red-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                          }`}
                        >
                          {isLiking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-400" : ""}`} />
                          )}
                          {isLiked ? "Liked!" : "Like"}
                        </button>

                        {!isOwnDeck && (
                          <button
                            onClick={() => handleCopy(deck)}
                            disabled={isCopying}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-all disabled:opacity-50"
                          >
                            {isCopying ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {isCopying ? "Kopierer..." : "Tilføj til min samling"}
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpand(key)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all ml-auto"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          {isExpanded ? "Skjul" : "Vis kort"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded card list */}
                    {isExpanded && (
                      <div className="border-t border-white/5 max-h-80 overflow-y-auto">
                        {deck.cards.map((kort, i) => (
                          <div key={kort.row || i} className="px-5 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                            <p className="text-sm font-medium text-gray-200">{kort.question}</p>
                            <p className="text-xs text-gray-500 mt-1">{kort.answer}</p>
                          </div>
                        ))}
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
