"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import {
  Database, Search, Scale, Briefcase, Shield, FolderOpen, Loader2,
  User, Heart, Copy, Layers, ChevronDown, ChevronRight, X, BookOpen,
  BadgeCheck, AlertTriangle,
} from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort, kopierDeck, likeDeck } from "@/app/dashboard/actions";

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
  likedBy?: string[];
  error_report?: string | null;
}

interface Deck {
  deckname: string;
  owner: string;
  category: string;
  cards: Flashcard[];
  likes: number;
  hasErrors: boolean;
}

const OFFICIAL_OWNERS = ["admin", "officiel"];
function isOfficial(owner: string) {
  return OFFICIAL_OWNERS.includes(owner.toLowerCase());
}

const kategoriMeta: Record<string, { icon: typeof Scale; color: string; badge: string }> = {
  jura: { icon: Scale, color: "from-blue-500 to-blue-700", badge: "bg-blue-500/20 text-blue-300" },
  portfolio: { icon: Briefcase, color: "from-purple-500 to-purple-700", badge: "bg-purple-500/20 text-purple-300" },
  politifaglig: { icon: Shield, color: "from-emerald-500 to-emerald-700", badge: "bg-emerald-500/20 text-emerald-300" },
  andet: { icon: FolderOpen, color: "from-amber-500 to-orange-600", badge: "bg-amber-500/20 text-amber-300" },
};
const defaultMeta = { icon: FolderOpen, color: "from-gray-500 to-gray-700", badge: "bg-gray-500/20 text-gray-300" };
function getMeta(cat: string) { return kategoriMeta[cat.toLowerCase()] || defaultMeta; }

function BibliotekContent() {
  const router = useRouter();
  const { bruger } = useAuth();

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
          const initiallyLiked = new Set(
            pub
              .filter((k) => Array.isArray(k.likedBy) && k.likedBy.includes(bruger))
              .map((k) => `${k.deckname}|||${k.user}`)
          );
          setLikedDecks(initiallyLiked);
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
  }, [bruger]);

  const decks = useMemo(() => {
    const map: Record<string, Deck> = {};
    for (const k of alleKort) {
      const dn = k.deckname || "Unavngivet deck";
      const key = `${dn}|||${k.user}`;
      if (!map[key]) {
        map[key] = { deckname: dn, owner: k.user, category: k.category, cards: [], likes: 0, hasErrors: false };
      }
      map[key].cards.push(k);
      if (k.likes > map[key].likes) map[key].likes = k.likes;
      if (k.error_report) map[key].hasErrors = true;
    }
    return Object.values(map);
  }, [alleKort]);

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

  const officielleDecks = useMemo(() => filteredDecks.filter((d) => isOfficial(d.owner)), [filteredDecks]);
  const klassensDecks = useMemo(() => filteredDecks.filter((d) => !isOfficial(d.owner)), [filteredDecks]);

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
      const result = await likeDeck({ deckname: deck.deckname, deckOwner: deck.owner, user: bruger });
      if (result.success) {
        setLikedDecks((prev) => new Set(prev).add(key));
        setAlleKort((prev) =>
          prev.map((k) =>
            k.deckname === deck.deckname && k.user === deck.owner
              ? { ...k, likes: result.alreadyLiked ? k.likes : k.likes + 1, likedBy: [...(k.likedBy || []), ...(result.alreadyLiked ? [] : [bruger])] }
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

  const startPractice = (deck: Deck) => {
    router.push(`/oev-dig?deck=${encodeURIComponent(deck.deckname)}&owner=${encodeURIComponent(deck.owner)}`);
  };

  function DeckCard({ deck, official }: { deck: Deck; official?: boolean }) {
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
        className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl backdrop-blur-sm hover:scale-[1.01] ${
          official
            ? "bg-blue-950/40 border-2 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/10"
            : "bg-white/5 border border-white/10 hover:border-white/20 hover:shadow-blue-500/5"
        } ${isExpanded ? "col-span-1 md:col-span-2 xl:col-span-3" : ""}`}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
              <KatIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold truncate">{deck.deckname}</h3>
                {official && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold flex-shrink-0">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Officiel
                  </span>
                )}
              </div>
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

          {/* Stats */}
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

          {/* Start øvelse button - primary */}
          <button
            onClick={() => startPractice(deck)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mb-3 ${
              official
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Start øvelse
          </button>

          {/* Secondary actions */}
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
                {isCopying ? "Kopierer..." : "Kopier"}
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

        {isExpanded && (
          <div className="border-t border-white/5 max-h-80 overflow-y-auto">
            {deck.cards.map((kort, i) => (
              <div key={kort.row || i} className="px-5 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-200">{kort.question}</p>
                  {kort.error_report && (
                    <span
                      className="relative group/err flex-shrink-0"
                      title={bruger === "admin" ? kort.error_report : "Fejl rapporteret"}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      {bruger === "admin" && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/err:block px-2 py-1 rounded bg-gray-800 border border-red-500/30 text-xs text-red-300 whitespace-nowrap z-10 max-w-xs truncate">
                          {kort.error_report}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{kort.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-6xl mx-auto">
        <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <Database className="w-7 h-7 md:w-9 md:h-9 text-blue-400" />
            Bibliotek
          </h1>
          <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Udforsk decks, start en øvelse eller kopier til din samling</p>
        </div>

        <div className="px-4 md:px-10 py-4 md:py-6">
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
            <div className="space-y-10">
              {/* Officielle Decks */}
              {officielleDecks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BadgeCheck className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-bold">Officielle Decks</h2>
                    <span className="text-xs text-gray-500 ml-1">— Verificeret pensum</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {officielleDecks.map((deck) => (
                      <DeckCard key={deckKey(deck)} deck={deck} official />
                    ))}
                  </div>
                </section>
              )}

              {/* Klassens Decks */}
              {klassensDecks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-bold">Klassens Decks</h2>
                    <span className="text-xs text-gray-500 ml-1">— Delt af andre elever</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {klassensDecks.map((deck) => (
                      <DeckCard key={deckKey(deck)} deck={deck} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

export default function BibliotekPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <BibliotekContent />
    </Suspense>
  );
}
