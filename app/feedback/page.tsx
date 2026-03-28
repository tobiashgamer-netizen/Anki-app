"use client";
import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import { Lightbulb, Loader2, CheckCircle } from "lucide-react";
import { sendFeedback } from "@/app/dashboard/actions";

const feedbackTypes = ["Ny funktion", "Design", "Indhold", "Andet"];

export default function FeedbackPage() {
  const { bruger } = useAuth();
  const [emne, setEmne] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [type, setType] = useState(feedbackTypes[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emne.trim() || !beskrivelse.trim()) return;
    setSending(true);
    await sendFeedback({ emne: emne.trim(), beskrivelse: beskrivelse.trim(), type, user: bruger });
    setSending(false);
    setSent(true);
    setEmne("");
    setBeskrivelse("");
    setType(feedbackTypes[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-2xl mx-auto px-4 md:px-10 pt-6 md:pt-10">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <Lightbulb className="w-7 h-7 md:w-9 md:h-9 text-amber-400" />
            Hvad kan vi gøre bedre?
          </h1>
          <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">
            Del dine idéer og forslag – vi læser dem alle!
          </p>

          {sent ? (
            <div className="mt-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-8 text-center">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-emerald-300 mb-2">Tak for dit forslag!</h2>
              <p className="text-gray-400">Admin kigger på det snart.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 px-6 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/20 transition"
              >
                Send endnu et forslag
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Emne</label>
                <input
                  value={emne}
                  onChange={(e) => setEmne(e.target.value)}
                  placeholder="Kort beskrivelse af dit forslag..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Beskrivelse</label>
                <textarea
                  value={beskrivelse}
                  onChange={(e) => setBeskrivelse(e.target.value)}
                  placeholder="Fortæl os mere om dit forslag..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:outline-none text-sm appearance-none"
                >
                  {feedbackTypes.map((t) => (
                    <option key={t} value={t} className="bg-gray-900">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={sending || !emne.trim() || !beskrivelse.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition disabled:opacity-50 w-full justify-center"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                {sending ? "Sender..." : "Send forslag"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
