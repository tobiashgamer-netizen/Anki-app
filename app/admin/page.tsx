"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  ShieldCheck, AlertTriangle, BadgeCheck, Image, Brain, Users,
  Megaphone, Loader2, Check, X, Save, Eye, Pencil,
} from "lucide-react";
import { Suspense } from "react";
import {
  hentAlleKort, resolveError, verifyCard as verifyCardAction,
  saveBroadcast, hentBroadcast, hentActivity, hentBlindSpot,
} from "@/app/dashboard/actions";

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
  verified?: boolean;
  error_report?: string | null;
}

interface ActivityRecord {
  user: string;
  lastSeen: string;
}

interface BlindSpotItem {
  question: string;
  count: number;
}

type Tab = "fejl" | "verificer" | "billeder" | "blindspot" | "aktivitet" | "broadcast";

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bruger = searchParams.get("bruger") || "";

  // Redirect non-admin users
  useEffect(() => {
    if (bruger !== "admin") {
      router.replace("/landing-page");
    }
  }, [bruger, router]);

  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("fejl");

  // Fejl-logg state
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);

  // Broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSaving, setBroadcastSaving] = useState(false);
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  // Activity state
  const [activity, setActivity] = useState<ActivityRecord[]>([]);

  // Blind spot state
  const [blindSpot, setBlindSpot] = useState<BlindSpotItem[]>([]);

  // Verify toggling
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    if (bruger !== "admin") return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cardsRes, broadRes, actRes, bsRes] = await Promise.all([
          hentAlleKort(),
          hentBroadcast(),
          hentActivity(),
          hentBlindSpot(),
        ]);
        if (cardsRes.success && Array.isArray(cardsRes.kort)) {
          setAlleKort(cardsRes.kort as Flashcard[]);
        }
        if (broadRes.success) setBroadcastMsg(broadRes.message);
        if (actRes.success) setActivity(actRes.activity as ActivityRecord[]);
        if (bsRes.success) setBlindSpot(bsRes.blindSpot as BlindSpotItem[]);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [bruger]);

  const errorCards = useMemo(
    () => alleKort.filter((k) => k.error_report),
    [alleKort]
  );

  const imageCards = useMemo(
    () => alleKort.filter((k) => k.imageURL),
    [alleKort]
  );

  const handleResolve = async (card: Flashcard) => {
    setResolving(card.question);
    const updatedQ = editingQuestion === card.question ? editQ : undefined;
    const updatedA = editingQuestion === card.question ? editA : undefined;
    await resolveError({
      question: card.question,
      newQuestion: updatedQ,
      newAnswer: updatedA,
    });
    setAlleKort((prev) =>
      prev.map((k) =>
        k.question === card.question
          ? { ...k, error_report: null, question: updatedQ || k.question, answer: updatedA || k.answer }
          : k
      )
    );
    setEditingQuestion(null);
    setResolving(null);
  };

  const handleVerify = async (card: Flashcard) => {
    setVerifying(card.row);
    const newState = !card.verified;
    await verifyCardAction({ row: card.row, verified: newState });
    setAlleKort((prev) =>
      prev.map((k) => (k.row === card.row ? { ...k, verified: newState } : k))
    );
    setVerifying(null);
  };

  const handleBroadcast = async () => {
    setBroadcastSaving(true);
    await saveBroadcast(broadcastMsg);
    setBroadcastSaved(true);
    setTimeout(() => setBroadcastSaved(false), 2000);
    setBroadcastSaving(false);
  };

  if (bruger !== "admin") return null;

  const tabs: { id: Tab; label: string; icon: typeof ShieldCheck; count?: number }[] = [
    { id: "fejl", label: "Fejl-logg", icon: AlertTriangle, count: errorCards.length },
    { id: "verificer", label: "Verificering", icon: BadgeCheck },
    { id: "billeder", label: "Billeder", icon: Image, count: imageCards.length },
    { id: "blindspot", label: "Det Blinde Punkt", icon: Brain, count: blindSpot.length },
    { id: "aktivitet", label: "Aktivitet", icon: Users, count: activity.length },
    { id: "broadcast", label: "Dagens Parole", icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-blue-400" />
            Admin Panel
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Administrer kort, fejl og brugere</p>
        </div>

        {/* Tabs */}
        <div className="px-10 pt-4 pb-2 flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="px-10 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter data...</p>
            </div>
          ) : (
            <>
              {/* ===== FEJL-LOGG ===== */}
              {tab === "fejl" && (
                <div className="space-y-3 max-w-4xl">
                  {errorCards.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                      <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-gray-400">Ingen aktive fejlrapporter!</p>
                    </div>
                  ) : (
                    errorCards.map((card) => (
                      <div key={card.row} className="rounded-xl bg-white/5 border border-red-500/20 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                              <span className="text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded">Fejl rapporteret</span>
                              <span className="text-xs text-gray-500">{card.deckname} · {card.user}</span>
                            </div>
                            <p className="text-sm text-amber-300 mb-3">📝 &quot;{card.error_report}&quot;</p>

                            {editingQuestion === card.question ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Spørgsmål</label>
                                  <input
                                    value={editQ}
                                    onChange={(e) => setEditQ(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Svar</label>
                                  <textarea
                                    value={editA}
                                    onChange={(e) => setEditA(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-gray-300"><span className="text-gray-500">Q:</span> {card.question}</p>
                                <p className="text-sm text-gray-300 mt-1"><span className="text-gray-500">A:</span> {card.answer}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {editingQuestion === card.question ? (
                              <>
                                <button
                                  onClick={() => handleResolve(card)}
                                  disabled={resolving === card.question}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition disabled:opacity-50"
                                >
                                  {resolving === card.question ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  Lagre & Løs
                                </button>
                                <button
                                  onClick={() => setEditingQuestion(null)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Annuller
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingQuestion(card.question);
                                    setEditQ(card.question);
                                    setEditA(card.answer);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Rediger
                                </button>
                                <button
                                  onClick={() => handleResolve(card)}
                                  disabled={resolving === card.question}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition disabled:opacity-50"
                                >
                                  {resolving === card.question ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Marker løst
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== VERIFICERING ===== */}
              {tab === "verificer" && (
                <div className="space-y-2 max-w-4xl">
                  <p className="text-sm text-gray-400 mb-4">Klik for at verificere et kort. Verificerede kort vises med blåt flueben for alle brugere.</p>
                  {alleKort.map((card) => (
                    <div key={card.row} className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-5 py-3 hover:border-white/20 transition">
                      <button
                        onClick={() => handleVerify(card)}
                        disabled={verifying === card.row}
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                          card.verified
                            ? "bg-blue-600 text-white"
                            : "bg-white/5 border border-white/10 text-gray-600 hover:text-blue-400 hover:border-blue-500/30"
                        }`}
                      >
                        {verifying === card.row ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{card.question}</p>
                        <p className="text-xs text-gray-500 truncate">{card.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                        <span>{card.deckname || card.category}</span>
                        <span>·</span>
                        <span>{card.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== BILLEDER ===== */}
              {tab === "billeder" && (
                <div>
                  {imageCards.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                      <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Ingen kort med billeder fundet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {imageCards.map((card) => (
                        <div key={card.row} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden group">
                          <div className="aspect-video bg-black/30 flex items-center justify-center overflow-hidden">
                            <img
                              src={card.imageURL}
                              alt={card.question}
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).alt = "Billede kunne ikke loades"; }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm text-gray-200 truncate">{card.question}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>{card.deckname}</span>
                              <span>·</span>
                              <span>{card.user}</span>
                            </div>
                            <a
                              href={card.imageURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                            >
                              <Eye className="w-3 h-3" />
                              Åbn billede
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== DET BLINDE PUNKT ===== */}
              {tab === "blindspot" && (
                <div className="max-w-3xl">
                  <p className="text-sm text-gray-400 mb-4">De 10 kort som flest brugere har markeret som &quot;Svært&quot;.</p>
                  {blindSpot.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                      <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Ingen analytics-data endnu. Data indsamles når brugere øver sig.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blindSpot.map((item, i) => (
                        <div key={item.question} className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-5 py-4">
                          <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            i < 3 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-500"
                          }`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{item.question}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-red-400">{item.count}× svært</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== AKTIVITET ===== */}
              {tab === "aktivitet" && (
                <div className="max-w-3xl">
                  <p className="text-sm text-gray-400 mb-4">Oversigt over brugernes seneste aktivitet.</p>
                  {activity.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Ingen aktivitetsdata endnu.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      <div className="grid grid-cols-2 gap-0 px-5 py-3 border-b border-white/10 bg-white/5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bruger</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Sidst set</span>
                      </div>
                      {activity.map((a) => (
                        <div key={a.user} className="grid grid-cols-2 gap-0 px-5 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition">
                          <span className="text-sm text-gray-200">{a.user}</span>
                          <span className="text-sm text-gray-500 text-right">
                            {a.lastSeen ? new Date(a.lastSeen).toLocaleString("da-DK") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== BROADCAST ===== */}
              {tab === "broadcast" && (
                <div className="max-w-2xl">
                  <p className="text-sm text-gray-400 mb-4">Skriv en besked der vises som banner på alle brugeres dashboard.</p>
                  <textarea
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Beskjed til holdet..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none text-sm"
                  />
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleBroadcast}
                      disabled={broadcastSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition disabled:opacity-50"
                    >
                      {broadcastSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                      {broadcastSaved ? "Gemt!" : "Gem besked"}
                    </button>
                    {broadcastMsg && (
                      <button
                        onClick={() => { setBroadcastMsg(""); handleBroadcast(); }}
                        className="text-sm text-red-400 hover:text-red-300 transition"
                      >
                        Fjern besked
                      </button>
                    )}
                  </div>
                  {broadcastMsg && (
                    <div className="mt-6">
                      <p className="text-xs text-gray-500 mb-2">Forhåndsvisning:</p>
                      <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-amber-500/10 border border-blue-500/20 p-4">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-amber-400" />
                          <p className="text-sm text-amber-200 font-medium">{broadcastMsg}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <AdminContent />
    </Suspense>
  );
}
