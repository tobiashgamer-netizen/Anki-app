"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { BookOpen, Eye, RotateCcw, ThumbsUp, ThumbsDown, Brain, ChevronRight, Scale, Briefcase, Shield, FolderOpen, Loader2, ArrowLeft, Layers } from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort } from "@/app/dashboard/actions";

interface Flashcard {
  question: string;
  answer: string;
  category?: string;
  user?: string;
  public?: boolean;
  deckname?: string;
}

const kategorier = [
  { id: "Jura", label: "Jura", icon: Scale, color: "from-blue-500 to-blue-700", bgHover: "hover:border-blue-500/40" },
  { id: "Portfolio", label: "Portfolio", icon: Briefcase, color: "from-purple-500 to-purple-700", bgHover: "hover:border-purple-500/40" },
  { id: "Politifaglig", label: "Politifaglig", icon: Shield, color: "from-emerald-500 to-emerald-700", bgHover: "hover:border-emerald-500/40" },
  { id: "Andet", label: "Andet", icon: FolderOpen, color: "from-amber-500 to-orange-600", bgHover: "hover:border-amber-500/40" },
];

function OevDigContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bruger = searchParams.get("bruger") || "Bruger";
  const deckParam = searchParams.get("deck");
  const ownerParam = searchParams.get("owner");

  const [valgtKategori, setValgtKategori] = useState<string | null>(null);
  const [deckMode, setDeckMode] = useState<string | null>(null);
  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [fejl, setFejl] = useState("");
  const [nuværendeIndex, setNuværendeIndex] = useState(0);
  const [visFlip, setVisFlip] = useState(false);
  const [rigtige, setRigtige] = useState(0);
  const [forkerte, setForkerte] = useState(0);
  const [erFærdig, setErFærdig] = useState(false);
  const deckStarted = useRef(false);

  // Fetch cards visible to this user (own cards + public cards)
  useEffect(() => {
    const fetchKort = async () => {
      setLoading(true);
      setFejl("");
      try {
        const result = await hentAlleKort(bruger);
        if (result.success && Array.isArray(result.kort)) {
          // Only show public cards + own cards
          const mapped: Flashcard[] = (result.kort as Record<string, unknown>[])
            .filter((k) => k.public === true || k.user === bruger)
            .map((k) => ({
              question: String(k.question || k.q || ""),
              answer: String(k.answer || k.a || ""),
              category: String(k.category || k.cat || ""),
              user: String(k.user || ""),
              public: k.public === true,
              deckname: String(k.deckname || ""),
            }));
          setAlleKort(mapped);
        } else {
          setFejl("Kunne ikke hente kort fra Google Sheets. Prøv igen.");
        }
      } catch {
        setFejl("Kunne ikke hente kort fra Google Sheets. Prøv igen.");
      } finally {
        setLoading(false);
      }
    };
    fetchKort();
  }, [bruger]);

  // Auto-start deck session when cards are loaded and deck param is present
  useEffect(() => {
    if (deckParam && ownerParam && alleKort.length > 0 && !deckStarted.current) {
      deckStarted.current = true;
      const deckCards = alleKort.filter(
        (k) => k.deckname === deckParam && k.user === ownerParam
      );
      setKort(deckCards);
      setDeckMode(deckParam);
      setValgtKategori(null);
      setNuværendeIndex(0);
      setVisFlip(false);
      setRigtige(0);
      setForkerte(0);
      setErFærdig(false);
    }
  }, [deckParam, ownerParam, alleKort]);

  const startSession = (kategoriId: string) => {
    const filtreret = alleKort.filter(
      (k) => (k.category || "").toLowerCase() === kategoriId.toLowerCase()
    );
    setKort(filtreret);
    setValgtKategori(kategoriId);
    setDeckMode(null);
    setNuværendeIndex(0);
    setVisFlip(false);
    setRigtige(0);
    setForkerte(0);
    setErFærdig(false);
  };

  const tilbageTilMenu = () => {
    setValgtKategori(null);
    setDeckMode(null);
    setKort([]);
    setNuværendeIndex(0);
    setVisFlip(false);
    setRigtige(0);
    setForkerte(0);
    setErFærdig(false);
  };

  const handleFlip = () => setVisFlip(!visFlip);

  const handleSvar = (korrekt: boolean) => {
    if (korrekt) setRigtige((r) => r + 1);
    else setForkerte((f) => f + 1);
    setVisFlip(false);
    if (nuværendeIndex + 1 >= kort.length) setErFærdig(true);
    else setNuværendeIndex((i) => i + 1);
  };

  const handleGenstart = () => {
    setNuværendeIndex(0);
    setVisFlip(false);
    setRigtige(0);
    setForkerte(0);
    setErFærdig(false);
  };

  const kortPerKategori = (id: string) =>
    alleKort.filter((k) => (k.category || "").toLowerCase() === id.toLowerCase()).length;

  const total = kort.length;
  const progress = total > 0 ? (nuværendeIndex / total) * 100 : 0;
  const nuværendeKort = kort[nuværendeIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-purple-400" />
            Øv dig
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Vælg en kategori og test din viden</p>
        </div>

        <div className="px-10 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter kort fra Google Sheets...</p>
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
          ) : !valgtKategori && !deckMode ? (
            /* ===== KATEGORI MENU ===== */
            <>
              <div className="flex items-center gap-2 mb-6">
                <Layers className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">{alleKort.length} kort i alt fra dit spreadsheet</span>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-3xl">
                {kategorier.map((kat) => {
                  const antal = kortPerKategori(kat.id);
                  return (
                    <button
                      key={kat.id}
                      onClick={() => startSession(kat.id)}
                      disabled={antal === 0}
                      className={`group relative text-left overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-300 ${kat.bgHover} ${
                        antal === 0 ? "opacity-40 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${kat.color} opacity-10 rounded-bl-full`} />
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kat.color} flex items-center justify-center mb-4`}>
                        <kat.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-1">{kat.label}</h3>
                      <p className="text-sm text-gray-400">
                        {antal > 0 ? `${antal} kort klar` : "Ingen kort endnu"}
                      </p>
                      {antal > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                          Start øvelse <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* ===== FLASHCARD SESSION ===== */
            <div className="max-w-2xl">
              {/* Back button + session label */}
              <div className="flex items-center gap-3 mb-6">
                {deckMode ? (
                  <button
                    onClick={() => router.push(`/mine-kort?bruger=${encodeURIComponent(bruger)}`)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tilbage til Mine Kort
                  </button>
                ) : (
                  <button
                    onClick={tilbageTilMenu}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tilbage til kategorier
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                {deckMode ? (
                  <>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {deckMode}
                    </span>
                    <span className="text-sm text-gray-500">{total} kort</span>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                      {valgtKategori}
                    </span>
                    <span className="text-sm text-gray-500">{total} kort</span>
                  </>
                )}
              </div>

              {total === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  {deckMode ? (
                    <>
                      <p className="text-gray-400 mb-2">Dette deck er tomt. Tilføj kort før du kan øve.</p>
                      <button
                        onClick={() => router.push(`/mine-kort?bruger=${encodeURIComponent(bruger)}`)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Tilbage til Mine Kort
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 mb-2">Ingen kort i denne kategori endnu.</p>
                      <p className="text-sm text-gray-500">Opret kort under &quot;Opret kort&quot; for at komme i gang.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>{nuværendeIndex} af {total} kort</span>
                      <span className="flex gap-4">
                        <span className="text-emerald-400">✓ {rigtige}</span>
                        <span className="text-red-400">✗ {forkerte}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {erFærdig ? (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center backdrop-blur-sm">
                      <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold mb-2">Session færdig!</h2>
                      <p className="text-gray-400 mb-6">Du har gennemgået alle {total} kort i {deckMode || valgtKategori}</p>
                      <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-emerald-400">{rigtige}</p>
                          <p className="text-sm text-gray-400 mt-1">Rigtige</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-red-400">{forkerte}</p>
                          <p className="text-sm text-gray-400 mt-1">Forkerte</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-blue-400">{total > 0 ? Math.round((rigtige / total) * 100) : 0}%</p>
                          <p className="text-sm text-gray-400 mt-1">Score</p>
                        </div>
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleGenstart}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all duration-200"
                        >
                          <RotateCcw className="w-5 h-5" />
                          Prøv igen
                        </button>
                        {deckMode ? (
                          <button
                            onClick={() => router.push(`/mine-kort?bruger=${encodeURIComponent(bruger)}`)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-semibold transition-all duration-200"
                          >
                            <ArrowLeft className="w-5 h-5" />
                            Tilbage til Mine Kort
                          </button>
                        ) : (
                          <button
                            onClick={tilbageTilMenu}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-semibold transition-all duration-200"
                          >
                            <ArrowLeft className="w-5 h-5" />
                            Kategorier
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Flashcard */}
                      <div
                        onClick={handleFlip}
                        className="group cursor-pointer rounded-2xl bg-white/5 border border-white/10 p-10 min-h-[300px] flex flex-col items-center justify-center backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
                      >
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${visFlip ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                          {visFlip ? "Svar" : "Spørgsmål"}
                        </div>
                        <p className="text-2xl font-semibold text-center leading-relaxed max-w-md">
                          {visFlip ? nuværendeKort.answer : nuværendeKort.question}
                        </p>
                        {!visFlip && (
                          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                            <Eye className="w-4 h-4" />
                            Klik for at se svaret
                          </div>
                        )}
                      </div>

                      {/* Answer buttons */}
                      {visFlip && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => handleSvar(false)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold transition-all duration-200"
                          >
                            <ThumbsDown className="w-5 h-5" />
                            Vidste det ikke
                          </button>
                          <button
                            onClick={() => handleSvar(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-semibold transition-all duration-200"
                          >
                            <ThumbsUp className="w-5 h-5" />
                            Vidste det!
                          </button>
                        </div>
                      )}

                      {/* Skip button */}
                      {!visFlip && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              setVisFlip(false);
                              if (nuværendeIndex + 1 >= kort.length) setErFærdig(true);
                              else setNuværendeIndex((i) => i + 1);
                            }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Spring over <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OevDigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <OevDigContent />
    </Suspense>
  );
}
