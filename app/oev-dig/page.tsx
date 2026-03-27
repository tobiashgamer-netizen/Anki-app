"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { BookOpen, Eye, RotateCcw, ThumbsUp, ThumbsDown, Brain, ChevronRight } from "lucide-react";
import { Suspense } from "react";

interface Flashcard {
  id: number;
  q: string;
  a: string;
}

const demoKort: Flashcard[] = [
  { id: 1, q: "Hvad er fotosyntese?", a: "Den proces hvor planter omdanner sollys, vand og CO₂ til glukose og ilt." },
  { id: 2, q: "Hvad er Pythagoras' sætning?", a: "I en retvinklet trekant gælder: a² + b² = c², hvor c er hypotenusen." },
  { id: 3, q: "Hvad er mitokondriets funktion?", a: "Mitokondrier er cellens 'kraftværk' — de producerer ATP via cellulær respiration." },
  { id: 4, q: "Hvornår startede 2. Verdenskrig?", a: "1. september 1939, da Tyskland invaderede Polen." },
  { id: 5, q: "Hvad er Newtons 2. lov?", a: "F = m × a — Kraft er lig masse gange acceleration." },
  { id: 6, q: "Hvad er DNA?", a: "Deoxyribonukleinsyre — et molekyle der indeholder den genetiske kode for alle levende organismer." },
];

function OevDigContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";

  const [kort, setKort] = useState<Flashcard[]>(demoKort);
  const [nuværendeIndex, setNuværendeIndex] = useState(0);
  const [visFlip, setVisFlip] = useState(false);
  const [rigtige, setRigtige] = useState(0);
  const [forkerte, setForkerte] = useState(0);
  const [erFærdig, setErFærdig] = useState(false);

  const nuværendeKort = kort[nuværendeIndex];

  const handleFlip = () => setVisFlip(!visFlip);

  const handleSvar = (korrekt: boolean) => {
    if (korrekt) {
      setRigtige((r) => r + 1);
    } else {
      setForkerte((f) => f + 1);
    }
    setVisFlip(false);

    if (nuværendeIndex + 1 >= kort.length) {
      setErFærdig(true);
    } else {
      setNuværendeIndex((i) => i + 1);
    }
  };

  const handleGenstart = () => {
    setNuværendeIndex(0);
    setVisFlip(false);
    setRigtige(0);
    setForkerte(0);
    setErFærdig(false);
  };

  const total = kort.length;
  const progress = ((nuværendeIndex) / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-purple-400" />
            Øv dig
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Test din viden med flashcards</p>
        </div>

        <div className="px-10 py-8 max-w-2xl">
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
            /* Results screen */
            <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center backdrop-blur-sm">
              <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Session færdig!</h2>
              <p className="text-gray-400 mb-6">Du har gennemgået alle {total} kort</p>
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
              <button
                onClick={handleGenstart}
                className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5" />
                Prøv igen
              </button>
            </div>
          ) : (
            /* Flashcard */
            <>
              <div
                onClick={handleFlip}
                className="group cursor-pointer rounded-2xl bg-white/5 border border-white/10 p-10 min-h-[300px] flex flex-col items-center justify-center backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
              >
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${visFlip ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                  {visFlip ? "Svar" : "Spørgsmål"}
                </div>

                <p className="text-2xl font-semibold text-center leading-relaxed max-w-md">
                  {visFlip ? nuværendeKort.a : nuværendeKort.q}
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
                      if (nuværendeIndex + 1 >= kort.length) {
                        setErFærdig(true);
                      } else {
                        setNuværendeIndex((i) => i + 1);
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Spring over <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
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
