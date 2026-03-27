"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Layers, ChevronDown, ChevronRight, Pencil, Trash2, X, Check,
  Loader2, Globe, Lock, Scale, Briefcase, Shield, FolderOpen, User, BookOpen, Database,
} from "lucide-react";
import { Suspense } from "react";
import { hentAlleKort, redigerKort, sletKort } from "@/app/dashboard/actions";

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

const katIcons: Record<string, typeof Scale> = {
  jura: Scale,
  portfolio: Briefcase,
  politifaglig: Shield,
};
const katColors: Record<string, string> = {
  jura: "from-blue-500 to-blue-700",
  portfolio: "from-purple-500 to-purple-700",
  politifaglig: "from-emerald-500 to-emerald-700",
};

function MineKortContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";
  const router = useRouter();

  const [alleKort, setAlleKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fejl, setFejl] = useState("");
  const [aabneDecks, setAabneDecks] = useState<Set<string>>(new Set());
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [editDeck, setEditDeck] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    setFejl("");
    try {
      const result = await hentAlleKort(bruger);
      if (result.success && Array.isArray(result.kort)) {
        const mine = (result.kort as Flashcard[]).filter(
          (k) => k.user === bruger
        );
        setAlleKort(mine);
        setAabneDecks(new Set(mine.map((k) => k.deckname || "Uden deck")));
      } else {
        setFejl("Kunne ikke hente kort.");
      }
    } catch {
      setFejl("Kunne ikke hente kort.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bruger]);

  const grupperet = useMemo(() => {
    const map: Record<string, Flashcard[]> = {};
    for (const k of alleKort) {
      const deck = k.deckname || "Uden deck";
      if (!map[deck]) map[deck] = [];
      map[deck].push(k);
    }
    return map;
  }, [alleKort]);

  const toggleDeck = (deck: string) => {
    setAabneDecks((prev) => {
      const next = new Set(prev);
      if (next.has(deck)) next.delete(deck);
      else next.add(deck);
      return next;
    });
  };

  const startEdit = (kort: Flashcard) => {
    setEditRow(kort.row);
    setEditQ(kort.question);
    setEditA(kort.answer);
    setEditCat(kort.category);
    setEditPublic(kort.public);
    setEditDeck(kort.deckname);
  };

  const cancelEdit = () => setEditRow(null);

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      const result = await redigerKort({
        row: editRow,
        question: editQ,
        answer: editA,
        category: editCat,
        public: editPublic,
        deckname: editDeck,
        user: bruger,
      });
      if (result.success) {
        setEditRow(null);
        await fetchCards();
      } else {
        alert("Kunne ikke gemme ændringer: " + (result.error || "Ukendt fejl"));
      }
    } catch {
      alert("Netværksfejl ved redigering.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kort: Flashcard) => {
    if (!confirm(`Slet "${kort.question}"?`)) return;
    setDeleting(kort.row);
    try {
      const result = await sletKort(kort.row, bruger);
      if (result.success) {
        await fetchCards();
      } else {
        alert("Kunne ikke slette: " + (result.error || "Ukendt fejl"));
      }
    } catch {
      alert("Netværksfejl ved sletning.");
    } finally {
      setDeleting(null);
    }
  };

  const KatIcon = (cat: string) => katIcons[cat.toLowerCase()] || FolderOpen;
  const katColor = (cat: string) => katColors[cat.toLowerCase()] || "from-gray-500 to-gray-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Layers className="w-9 h-9 text-blue-400" />
            Mine kort
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Administrer dine flashcards og decks</p>
        </div>

        <div className="px-10 py-6">
          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
            <span>{alleKort.length} kort i alt</span>
            <span>•</span>
            <span>{Object.keys(grupperet).length} decks</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter dine kort...</p>
            </div>
          ) : fejl ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
              <p className="text-red-300 mb-4">{fejl}</p>
              <button onClick={fetchCards} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition">
                Prøv igen
              </button>
            </div>
          ) : alleKort.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
              <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Du har ingen kort endnu</p>
              <p className="text-sm text-gray-500 mb-5">Find et deck i Biblioteket for at komme i gang!</p>
              <button
                onClick={() => router.push(`/bibliotek?bruger=${encodeURIComponent(bruger)}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition"
              >
                <Database className="w-4 h-4" />
                Gå til Biblioteket
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {Object.entries(grupperet).map(([deckName, kortListe]) => {
                const erAaben = aabneDecks.has(deckName);
                return (
                  <div key={deckName} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* Deck header */}
                    <div className="flex items-center gap-2 px-6 py-4">
                      <button
                        onClick={() => toggleDeck(deckName)}
                        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <Layers className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <h2 className="text-lg font-bold flex-1 text-left truncate">{deckName}</h2>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {kortListe.length} kort
                        </span>
                        {erAaben ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => router.push(`/oev-dig?bruger=${encodeURIComponent(bruger)}&deck=${encodeURIComponent(deckName)}&owner=${encodeURIComponent(bruger)}`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold transition-all flex-shrink-0"
                      >
                        <BookOpen className="w-4 h-4" />
                        Øv dette deck
                      </button>
                    </div>

                    {erAaben && (
                      <div className="border-t border-white/5">
                        {kortListe.map((kort) => {
                          const isEditing = editRow === kort.row;
                          const Icon = KatIcon(kort.category);
                          return (
                            <div key={kort.row} className="border-b border-white/5 last:border-b-0">
                              {isEditing ? (
                                /* Edit mode */
                                <div className="px-6 py-4 space-y-3 bg-white/[0.02]">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Spørgsmål</label>
                                      <textarea
                                        value={editQ}
                                        onChange={(e) => setEditQ(e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Svar</label>
                                      <textarea
                                        value={editA}
                                        onChange={(e) => setEditA(e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
                                      <select
                                        value={editCat}
                                        onChange={(e) => setEditCat(e.target.value)}
                                        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                      >
                                        {["Jura", "Portfolio", "Politifaglig", "Andet"].map((k) => (
                                          <option key={k} value={k} className="bg-gray-900">{k}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 mb-1 block">Deck</label>
                                      <input
                                        value={editDeck}
                                        onChange={(e) => setEditDeck(e.target.value)}
                                        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <button
                                      onClick={() => setEditPublic(!editPublic)}
                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                        editPublic
                                          ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                                          : "bg-amber-600/20 border-amber-500/40 text-amber-300"
                                      }`}
                                    >
                                      {editPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                      {editPublic ? "Offentlig" : "Privat"}
                                    </button>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={saveEdit}
                                      disabled={saving}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition disabled:opacity-50"
                                    >
                                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                      Gem
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition"
                                    >
                                      <X className="w-4 h-4" />
                                      Annuller
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* View mode */
                                <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                  <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${katColor(kort.category)} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">{kort.question}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{kort.answer}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {kort.public ? (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                                        <Globe className="w-3 h-3" /> Offentlig
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                                        <Lock className="w-3 h-3" /> Privat
                                      </span>
                                    )}
                                    <button
                                      onClick={() => startEdit(kort)}
                                      className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                                      title="Rediger"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(kort)}
                                      disabled={deleting === kort.row}
                                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                      title="Slet"
                                    >
                                      {deleting === kort.row ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
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

export default function MineKortPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <MineKortContent />
    </Suspense>
  );
}
