"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { PlusCircle, Sparkles, Check, RotateCcw, Globe, Lock, Layers } from "lucide-react";
import { Suspense } from "react";
import { opretKort } from "@/app/dashboard/actions";

function OpretKortContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";

  const [spoergsmaal, setSpoergsmaal] = useState("");
  const [svar, setSvar] = useState("");
  const [kategori, setKategori] = useState("Jura");
  const [deckname, setDeckname] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [besked, setBesked] = useState("");
  const [kortTaeller, setKortTaeller] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spoergsmaal.trim() || !svar.trim()) return;

    setStatus("loading");
    try {
      const result = await opretKort({
        question: spoergsmaal,
        answer: svar,
        category: kategori,
        user: bruger,
        public: isPublic,
        deckname: deckname.trim(),
      });

      if (result.success) {
        setStatus("success");
        setBesked("Kortet er gemt!");
        setKortTaeller((prev) => prev + 1);
        setTimeout(() => {
          setSpoergsmaal("");
          setSvar("");
          setKategori("Jura");
          setStatus("idle");
          setBesked("");
        }, 2000);
      } else {
        setStatus("error");
        setBesked("Kunne ikke gemme kortet. Prøv igen.");
      }
    } catch {
      setStatus("error");
      setBesked("Kunne ikke gemme kortet. Prøv igen.");
    }
  };

  const handleReset = () => {
    setSpoergsmaal("");
    setSvar("");
    setKategori("Jura");
    setDeckname("");
    setIsPublic(true);
    setStatus("idle");
    setBesked("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-6xl mx-auto">
        <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <PlusCircle className="w-7 h-7 md:w-9 md:h-9 text-blue-400" />
            Opret nyt flashcard
          </h1>
          <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Skriv et spørgsmål og svar for at oprette et nyt kort</p>
        </div>

        <div className="px-4 md:px-10 py-4 md:py-8 max-w-3xl">
          {/* Session counter */}
          {kortTaeller > 0 && (
            <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                {kortTaeller} kort oprettet i denne session
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kategori */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {["Jura", "Portfolio", "Politifaglig", "Andet"].map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setKategori(kat)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      kategori === kat
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </div>

            {/* Deck name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Deck navn
              </label>
              <input
                type="text"
                value={deckname}
                onChange={(e) => setDeckname(e.target.value)}
                placeholder={`f.eks. ${bruger}s Jura Deck`}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
              />
            </div>

            {/* Privacy toggle */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Synlighed</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    isPublic
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Offentlig
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    !isPublic
                      ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Privat
                </button>
              </div>
            </div>

            {/* Spørgsmål */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                Spørgsmål (forside)
              </label>
              <textarea
                value={spoergsmaal}
                onChange={(e) => setSpoergsmaal(e.target.value)}
                placeholder="Skriv dit spørgsmål her..."
                rows={4}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none transition-all duration-200 text-base"
                required
              />
            </div>

            {/* Svar */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                Svar (bagside)
              </label>
              <textarea
                value={svar}
                onChange={(e) => setSvar(e.target.value)}
                placeholder="Skriv svaret her..."
                rows={4}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none transition-all duration-200 text-base"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                  status === "success"
                    ? "bg-emerald-600 text-white"
                    : status === "loading"
                    ? "bg-blue-600/50 text-blue-200 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20"
                }`}
              >
                {status === "loading" && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {status === "success" && <Check className="w-5 h-5" />}
                {status === "idle" && <PlusCircle className="w-5 h-5" />}
                {status === "error" && <PlusCircle className="w-5 h-5" />}
                {status === "loading" ? "Gemmer..." : status === "success" ? "Gemt!" : "Opret kort"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 py-3.5 px-5 rounded-xl font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Ryd
              </button>
            </div>
          </form>

          {/* Status message */}
          {besked && (
            <div
              className={`mt-6 px-5 py-3 rounded-xl text-sm font-medium ${
                status === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-300"
              }`}
            >
              {besked}
            </div>
          )}

          {/* Preview card */}
          {(spoergsmaal || svar) && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Forhåndsvisning</h3>
              <div className="rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 p-6 space-y-4 backdrop-blur-sm shadow-lg shadow-black/10">
                <div>
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Forside</p>
                  <p className="text-white text-lg">{spoergsmaal || "..."}</p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">Bagside</p>
                  <p className="text-white text-lg">{svar || "..."}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

export default function OpretKortPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <OpretKortContent />
    </Suspense>
  );
}
