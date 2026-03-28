"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import { Trophy, Medal, Crown, Star, TrendingUp, Loader2, RefreshCw, Target } from "lucide-react";
import { Suspense } from "react";
import { hentLeaderboard } from "@/app/dashboard/actions";

interface LeaderboardEntry {
  user: string;
  total: number;
  correct: number;
  score: number;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />;
    case 2: return <Medal className="w-6 h-6 text-gray-300 drop-shadow-lg" />;
    case 3: return <Medal className="w-6 h-6 text-amber-700 drop-shadow-lg" />;
    default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1: return "bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5";
    case 2: return "bg-gradient-to-r from-gray-400/10 to-gray-300/5 border-gray-400/20";
    case 3: return "bg-gradient-to-r from-amber-700/10 to-orange-700/5 border-amber-700/20";
    default: return "bg-white/5 border-white/10";
  }
}

function getAvatarGradient(index: number) {
  const gradients = [
    "from-amber-400 to-yellow-500",
    "from-gray-400 to-gray-500",
    "from-amber-700 to-orange-700",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-rose-500 to-red-500",
    "from-indigo-500 to-violet-500",
  ];
  return gradients[index % gradients.length];
}

function LeaderboardContent() {
  const { bruger } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await hentLeaderboard();
      if (res.success && Array.isArray(res.leaderboard)) {
        setEntries(res.leaderboard as LeaderboardEntry[]);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const myRank = entries.findIndex((e) => e.user.toLowerCase() === bruger.toLowerCase()) + 1;
  const myEntry = entries.find((e) => e.user.toLowerCase() === bruger.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-6xl mx-auto">
          <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2 flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                <Trophy className="w-7 h-7 md:w-9 md:h-9 text-amber-400" />
                Leaderboard
              </h1>
              <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Rangeret efter øvede kort og korrekte svar</p>
            </div>
            <button onClick={fetchData} className="mt-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 md:px-10 py-20">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center max-w-lg mx-auto">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-lg font-medium">Ingen data endnu</p>
                <p className="text-gray-500 text-sm mt-1">Øv dig med kort for at komme på listen!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {entries.length >= 3 && (
                <div className="px-4 md:px-10 py-4 md:py-6">
                  <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-3xl mx-auto">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center pt-8">
                      <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(1)} flex items-center justify-center text-xl md:text-2xl font-bold mb-2 md:mb-3 ring-4 ring-gray-400/30 shadow-xl`}>
                        {entries[1].user.charAt(0).toUpperCase()}
                      </div>
                      <Medal className="w-6 h-6 md:w-8 md:h-8 text-gray-300 mb-1" />
                      <p className="font-bold text-sm md:text-lg text-center truncate max-w-full">{entries[1].user}</p>
                      <p className="text-gray-400 text-xs md:text-sm">{entries[1].score} point</p>
                      <div className="mt-2 px-3 py-1 rounded-full bg-gray-400/10 text-xs text-gray-300 font-medium">{entries[1].total} øvet</div>
                    </div>
                    {/* 1st place */}
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${getAvatarGradient(0)} flex items-center justify-center text-2xl md:text-3xl font-bold mb-2 md:mb-3 ring-4 ring-amber-400/30 shadow-xl shadow-amber-500/20`}>
                        {entries[0].user.charAt(0).toUpperCase()}
                      </div>
                      <Crown className="w-7 h-7 md:w-10 md:h-10 text-amber-400 mb-1" />
                      <p className="font-bold text-base md:text-xl text-center truncate max-w-full">{entries[0].user}</p>
                      <p className="text-gray-400 text-xs md:text-sm">{entries[0].score} point</p>
                      <div className="mt-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs text-amber-300 font-medium">{entries[0].total} øvet</div>
                    </div>
                    {/* 3rd place */}
                    <div className="flex flex-col items-center pt-12">
                      <div className={`w-12 h-12 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br ${getAvatarGradient(2)} flex items-center justify-center text-lg md:text-2xl font-bold mb-2 md:mb-3 ring-4 ring-amber-700/30 shadow-xl`}>
                        {entries[2].user.charAt(0).toUpperCase()}
                      </div>
                      <Medal className="w-5 h-5 md:w-7 md:h-7 text-amber-700 mb-1" />
                      <p className="font-bold text-sm md:text-lg text-center truncate max-w-full">{entries[2].user}</p>
                      <p className="text-gray-400 text-xs md:text-sm">{entries[2].score} point</p>
                      <div className="mt-2 px-3 py-1 rounded-full bg-amber-700/10 text-xs text-amber-600 font-medium">{entries[2].total} øvet</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full table */}
              <div className="px-4 md:px-10 py-4 max-w-4xl">
                <div className="space-y-2">
                  {entries.map((entry, i) => {
                    const rank = i + 1;
                    const isMe = entry.user.toLowerCase() === bruger.toLowerCase();
                    return (
                      <div
                        key={entry.user}
                        className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${getRankBg(rank)} ${isMe ? "ring-2 ring-blue-500/40" : ""}`}
                      >
                        <div className="w-8 md:w-10 flex justify-center shrink-0">{getRankIcon(rank)}</div>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(i)} flex items-center justify-center font-semibold text-xs md:text-sm shrink-0`}>
                          {entry.user.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">{entry.user}</p>
                            {isMe && <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wide shrink-0">Dig</span>}
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-sm text-emerald-400 shrink-0">
                          <TrendingUp className="w-4 h-4" />
                          <span>{entry.correct} rigtige</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-blue-400 w-16 md:w-24 justify-end shrink-0">
                          <span>{entry.total} øvet</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold w-16 md:w-24 justify-end shrink-0">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span>{entry.score.toLocaleString("da-DK")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Your rank card */}
                <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 p-6 flex items-center gap-4 backdrop-blur-sm shadow-lg shadow-black/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                    {bruger.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{bruger}</p>
                    <p className="text-sm text-gray-400">Din rangering</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-400">{myRank > 0 ? `#${myRank}` : "—"}</p>
                    <p className="text-sm text-gray-400">{myEntry ? `${myEntry.score} point · ${myEntry.total} øvet` : "Øv dig for at komme på listen!"}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LeaderboardContent />
    </Suspense>
  );
}
