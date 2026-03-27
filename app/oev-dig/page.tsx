"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import { BookOpen, Eye, RotateCcw, Brain, ChevronRight, Scale, Briefcase, Shield, FolderOpen, Loader2, ArrowLeft, Layers, Flag, X, Star, BadgeCheck } from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort, rapporterFejl, logAnalytics } from "@/app/dashboard/actions";

interface Flashcard {
  question: string;
  answer: string;
  imageURL?: string;
  category?: string;
  user?: string;
  public?: boolean;
  deckname?: string;
  verified?: boolean;
}

const kategorier = [
  { id: "Jura", label: "Jura", icon: Scale, color: "from-blue-500 to-blue-700", bgHover: "hover:border-blue-500/40" },
  { id: "Portfolio", label: "Portfolio", icon: Briefcase, color: "from-purple-500 to-purple-700", bgHover: "hover:border-purple-500/40" },
  { id: "Politifaglig", label: "Politifaglig", icon: Shield, color: "from-emerald-500 to-emerald-700", bgHover: "hover:border-emerald-500/40" },
  { id: "Andet", label: "Andet", icon: FolderOpen, color: "from-amber-500 to-orange-600", bgHover: "hover:border-amber-500/40" },
];

// ===== SRS (Spaced Repetition System) =====
interface CardProgress {
  level: number;
  lastSeen: number;
  nextReview: number;
}

const REVIEW_INTERVALS: Record<number, number> = {
  0: 60 * 1000,           // Svært: 1 minut
  1: 10 * 60 * 1000,      // Okay: 10 minutter
  2: 24 * 60 * 60 * 1000, // Let: 1 dag
};

function getSrsProgress(): Record<string, CardProgress> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("anki_progress") || "{}");
  } catch {
    return {};
  }
}

function updateCardProgress(cardId: string, quality: 0 | 1 | 2) {
  const progress = getSrsProgress();
  const now = Date.now();
  progress[cardId] = {
    level: quality,
    lastSeen: now,
    nextReview: now + REVIEW_INTERVALS[quality],
  };
  localStorage.setItem("anki_progress", JSON.stringify(progress));
}

function getCardLevel(cardId: string): number {
  const progress = getSrsProgress();
  return progress[cardId]?.level ?? -1;
}

function sortByReviewPriority(cards: Flashcard[]): Flashcard[] {
  const progress = getSrsProgress();
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const pa = progress[a.question];
    const pb = progress[b.question];
    return srsScore(pa, now) - srsScore(pb, now);
  });
}

function srsScore(p: CardProgress | undefined, now: number): number {
  if (!p) return 1;                  // Nyt kort – høj prioritet
  if (p.nextReview <= now) return 0; // Overskredet – højeste prioritet
  if (p.level === 0) return 2;       // Svært – medium prioritet
  return 3 + (p.nextReview - now);   // Fremtidigt review
}

function getStrengthIndicator(cardId: string): { dots: number; color: string } {
  const level = getCardLevel(cardId);
  if (level === 2) return { dots: 3, color: "text-emerald-400" };
  if (level === 1) return { dots: 2, color: "text-amber-400" };
  if (level === 0) return { dots: 1, color: "text-red-400" };
  return { dots: 0, color: "text-gray-600" };
}

function OevDigContent() {
  const router = useRouter();
  const { bruger } = useAuth();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
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
  const [sværtCount, setSværtCount] = useState(0);
  const [okayCount, setOkayCount] = useState(0);
  const [letCount, setLetCount] = useState(0);
  const [erFærdig, setErFærdig] = useState(false);
  const deckStarted = useRef(false);

  // Report error modal state
  const [showReport, setShowReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Lightbox state for image zoom
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Keyboard shortcuts: Space=flip, 1=Svært, 2=Okay, 3=Let
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in input/textarea or modals are open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showReport || lightboxSrc) return;
      if (erFærdig || !nuværendeKort) return;

      if (e.code === "Space") {
        e.preventDefault();
        setVisFlip((v) => !v);
      } else if (visFlip && e.key === "1") {
        handleSRS(0);
      } else if (visFlip && e.key === "2") {
        handleSRS(1);
      } else if (visFlip && e.key === "3") {
        handleSRS(2);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

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
              imageURL: String(k.imageURL || ""),
              category: String(k.category || k.cat || ""),
              user: String(k.user || ""),
              public: k.public === true,
              deckname: String(k.deckname || ""),
              verified: k.verified === true,
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
      setKort(sortByReviewPriority(deckCards));
      setDeckMode(deckParam);
      setValgtKategori(null);
      setNuværendeIndex(0);
      setVisFlip(false);
      setSværtCount(0);
      setOkayCount(0);
      setLetCount(0);
      setErFærdig(false);
    }
  }, [deckParam, ownerParam, alleKort]);

  const startSession = (kategoriId: string) => {
    const filtreret = alleKort.filter(
      (k) => (k.category || "").toLowerCase() === kategoriId.toLowerCase()
    );
    setKort(sortByReviewPriority(filtreret));
    setValgtKategori(kategoriId);
    setDeckMode(null);
    setNuværendeIndex(0);
    setVisFlip(false);
    setSværtCount(0);
    setOkayCount(0);
    setLetCount(0);
    setErFærdig(false);
  };

  const tilbageTilMenu = () => {
    setValgtKategori(null);
    setDeckMode(null);
    setKort([]);
    setNuværendeIndex(0);
    setVisFlip(false);
    setSværtCount(0);
    setOkayCount(0);
    setLetCount(0);
    setErFærdig(false);
  };

  const handleFlip = () => setVisFlip(!visFlip);

  const handleSRS = (quality: 0 | 1 | 2) => {
    const currentCard = kort[nuværendeIndex];
    updateCardProgress(currentCard.question, quality);
    logAnalytics({ user: bruger, question: currentCard.question, quality });

    if (quality === 0) setSværtCount((c) => c + 1);
    else if (quality === 1) setOkayCount((c) => c + 1);
    else setLetCount((c) => c + 1);

    setVisFlip(false);

    const willRetry = quality === 0;
    if (willRetry) {
      setKort((prev) => [...prev, currentCard]);
    }

    const effectiveLength = kort.length + (willRetry ? 1 : 0);
    if (nuværendeIndex + 1 >= effectiveLength) {
      setErFærdig(true);
    } else {
      setNuværendeIndex((i) => i + 1);
    }
  };

  const handleGenstart = () => {
    let baseCards: Flashcard[];
    if (deckMode) {
      baseCards = alleKort.filter((k) => k.deckname === deckMode && k.user === (ownerParam || ""));
    } else if (valgtKategori) {
      baseCards = alleKort.filter((k) => (k.category || "").toLowerCase() === valgtKategori.toLowerCase());
    } else {
      baseCards = [];
    }
    setKort(sortByReviewPriority(baseCards));
    setNuværendeIndex(0);
    setVisFlip(false);
    setSværtCount(0);
    setOkayCount(0);
    setLetCount(0);
    setErFærdig(false);
  };

  const kortPerKategori = (id: string) =>
    alleKort.filter((k) => (k.category || "").toLowerCase() === id.toLowerCase()).length;

  const handleReport = async () => {
    if (!nuværendeKort || !reportMsg.trim()) return;
    setReportSending(true);
    try {
      await rapporterFejl({
        question: nuværendeKort.question,
        reporter: bruger,
        message: reportMsg.trim(),
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReport(false);
        setReportMsg("");
        setReportSent(false);
      }, 1500);
    } catch {
      alert("Kunne ikke sende rapport.");
    } finally {
      setReportSending(false);
    }
  };

  const total = kort.length;
  const progress = total > 0 ? (nuværendeIndex / total) * 100 : 0;
  const nuværendeKort = kort[nuværendeIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-6xl mx-auto">
        <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <BookOpen className="w-7 h-7 md:w-9 md:h-9 text-purple-400" />
            Øv dig
          </h1>
          <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Vælg en kategori og test din viden</p>
        </div>

        <div className="px-4 md:px-10 py-4 md:py-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                {kategorier.map((kat) => {
                  const antal = kortPerKategori(kat.id);
                  return (
                    <button
                      key={kat.id}
                      onClick={() => startSession(kat.id)}
                      disabled={antal === 0}
                      className={`group relative text-left overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-300 backdrop-blur-sm ${kat.bgHover} ${
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
                    onClick={() => router.push(`/mine-kort`)}
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
                        onClick={() => router.push(`/mine-kort`)}
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
                        <span className="text-red-400">● {sværtCount}</span>
                        <span className="text-amber-400">● {okayCount}</span>
                        <span className="text-emerald-400">● {letCount}</span>
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
                      <p className="text-gray-400 mb-6">Du har gennemgået alle kort i {deckMode || valgtKategori}</p>
                      <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-red-400">{sværtCount}</p>
                          <p className="text-sm text-gray-400 mt-1">Svært</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-amber-400">{okayCount}</p>
                          <p className="text-sm text-gray-400 mt-1">Okay</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-emerald-400">{letCount}</p>
                          <p className="text-sm text-gray-400 mt-1">Let</p>
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
                            onClick={() => router.push(`/mine-kort`)}
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
                        className="group cursor-pointer rounded-2xl bg-white/5 border border-white/10 p-6 md:p-10 min-h-[200px] md:min-h-[300px] flex flex-col items-center justify-center backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
                      >
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${visFlip ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                          {visFlip ? "Svar" : "Spørgsmål"}
                        </div>
                        {/* Strength indicator */}
                        {(() => {
                          const { dots, color } = getStrengthIndicator(nuværendeKort.question);
                          return dots > 0 ? (
                            <div className={`absolute top-4 left-4 flex gap-1 ${color}`}>
                              {Array.from({ length: dots }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          ) : null;
                        })()}
                        {/* Report Error button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                          className="absolute bottom-4 right-4 p-2 rounded-lg text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Rapportér fejl"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <p className="text-lg md:text-2xl font-semibold text-center leading-relaxed max-w-md">
                          {visFlip ? nuværendeKort.answer : nuværendeKort.question}
                        </p>
                        {/* Verified badge */}
                        {nuværendeKort.verified && (
                          <div className="flex items-center gap-1 mt-2 text-blue-400">
                            <BadgeCheck className="w-4 h-4" />
                            <span className="text-xs font-medium">Verificeret</span>
                          </div>
                        )}
                        {/* Show image below answer when flipped */}
                        {visFlip && nuværendeKort.imageURL && (
                          <img
                            src={nuværendeKort.imageURL}
                            alt="Kort billede"
                            onClick={(e) => { e.stopPropagation(); setLightboxSrc(nuværendeKort.imageURL!); }}
                            className="mt-4 max-h-48 rounded-lg border border-white/10 cursor-zoom-in hover:border-white/30 transition-all object-contain"
                          />
                        )}
                        {!visFlip && (
                          <div className="mt-6 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                              <Eye className="w-4 h-4" />
                              Klik for at se svaret
                            </div>
                            <span className="hidden md:block text-[10px] text-gray-600 font-mono">SPACE</span>
                          </div>
                        )}
                      </div>

                      {/* Report Error Modal */}
                      {showReport && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReport(false)}>
                          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2 mb-4">
                              <Flag className="w-5 h-5 text-amber-400" />
                              <h3 className="text-lg font-bold">Rapportér fejl</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">Kort: <span className="text-gray-300">{nuværendeKort.question}</span></p>
                            <textarea
                              value={reportMsg}
                              onChange={(e) => setReportMsg(e.target.value)}
                              placeholder="Hvad er fejlen?"
                              rows={3}
                              className="w-full mt-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"
                            />
                            <div className="flex gap-2 mt-4 justify-end">
                              <button
                                onClick={() => { setShowReport(false); setReportMsg(""); }}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition"
                              >
                                Annuller
                              </button>
                              <button
                                onClick={handleReport}
                                disabled={!reportMsg.trim() || reportSending || reportSent}
                                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {reportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : reportSent ? "✓ Sendt!" : "Send rapport"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lightbox for image zoom */}
                      {lightboxSrc && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxSrc(null)}>
                          <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                            <X className="w-6 h-6" />
                          </button>
                          <img src={lightboxSrc} alt="Forstørret billede" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />
                        </div>
                      )}

                      {/* SRS Answer buttons */}
                      {visFlip && (
                        <div className="mt-4 flex gap-2 md:gap-3">
                          <button
                            onClick={() => handleSRS(0)}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-[1.03] font-semibold transition-all duration-200"
                          >
                            <span className="text-lg">Svært</span>
                            <span className="text-xs opacity-60">Vis igen snart</span>
                            <span className="hidden md:block text-[10px] opacity-40 font-mono mt-1">1</span>
                          </button>
                          <button
                            onClick={() => handleSRS(1)}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:scale-[1.03] font-semibold transition-all duration-200"
                          >
                            <span className="text-lg">Okay</span>
                            <span className="text-xs opacity-60">Vis igen senere</span>
                            <span className="hidden md:block text-[10px] opacity-40 font-mono mt-1">2</span>
                          </button>
                          <button
                            onClick={() => handleSRS(2)}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-[1.03] font-semibold transition-all duration-200"
                          >
                            <span className="text-lg">Let</span>
                            <span className="text-xs opacity-60">Mestret!</span>
                            <span className="hidden md:block text-[10px] opacity-40 font-mono mt-1">3</span>
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
