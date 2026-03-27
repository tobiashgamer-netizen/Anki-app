"use client";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { Trophy, Medal, Crown, Star, TrendingUp, Flame } from "lucide-react";
import { Suspense } from "react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  kort: number;
  streak: number;
  score: number;
}

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: "Mathilde S.", kort: 247, streak: 14, score: 4820 },
  { rank: 2, name: "Emil K.", kort: 198, streak: 21, score: 4350 },
  { rank: 3, name: "Sofia H.", kort: 183, streak: 9, score: 3920 },
  { rank: 4, name: "Oliver B.", kort: 156, streak: 7, score: 3410 },
  { rank: 5, name: "Freja L.", kort: 134, streak: 11, score: 3100 },
  { rank: 6, name: "Noah P.", kort: 121, streak: 5, score: 2780 },
  { rank: 7, name: "Isabella M.", kort: 98, streak: 3, score: 2340 },
  { rank: 8, name: "Lucas A.", kort: 87, streak: 8, score: 2100 },
  { rank: 9, name: "Emma W.", kort: 76, streak: 2, score: 1890 },
  { rank: 10, name: "William R.", kort: 64, streak: 1, score: 1650 },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-amber-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-300" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-700" />;
    default:
      return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20";
    case 2:
      return "bg-gradient-to-r from-gray-400/10 to-gray-300/5 border-gray-400/20";
    case 3:
      return "bg-gradient-to-r from-amber-700/10 to-orange-700/5 border-amber-700/20";
    default:
      return "bg-white/5 border-white/10";
  }
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const bruger = searchParams.get("bruger") || "Bruger";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pl-64">
        <div className="px-10 pt-10 pb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="w-9 h-9 text-amber-400" />
            Leaderboard
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Se hvem der har lavet flest kort og har den højeste score</p>
        </div>

        {/* Top 3 podium */}
        <div className="px-10 py-6">
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* 2nd place */}
            <div className="flex flex-col items-center pt-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-2xl font-bold mb-3 ring-4 ring-gray-400/30">
                {leaderboardData[1].name.charAt(0)}
              </div>
              <Medal className="w-8 h-8 text-gray-300 mb-1" />
              <p className="font-bold text-lg">{leaderboardData[1].name}</p>
              <p className="text-gray-400 text-sm">{leaderboardData[1].score} point</p>
              <div className="mt-2 px-3 py-1 rounded-full bg-gray-400/10 text-xs text-gray-300 font-medium">
                {leaderboardData[1].kort} kort
              </div>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-3xl font-bold mb-3 ring-4 ring-amber-400/30 shadow-xl shadow-amber-500/20">
                {leaderboardData[0].name.charAt(0)}
              </div>
              <Crown className="w-10 h-10 text-amber-400 mb-1" />
              <p className="font-bold text-xl">{leaderboardData[0].name}</p>
              <p className="text-gray-400 text-sm">{leaderboardData[0].score} point</p>
              <div className="mt-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs text-amber-300 font-medium">
                {leaderboardData[0].kort} kort
              </div>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center pt-12">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-amber-700 to-orange-700 flex items-center justify-center text-2xl font-bold mb-3 ring-4 ring-amber-700/30">
                {leaderboardData[2].name.charAt(0)}
              </div>
              <Medal className="w-7 h-7 text-amber-700 mb-1" />
              <p className="font-bold text-lg">{leaderboardData[2].name}</p>
              <p className="text-gray-400 text-sm">{leaderboardData[2].score} point</p>
              <div className="mt-2 px-3 py-1 rounded-full bg-amber-700/10 text-xs text-amber-600 font-medium">
                {leaderboardData[2].kort} kort
              </div>
            </div>
          </div>
        </div>

        {/* Full leaderboard table */}
        <div className="px-10 py-4 max-w-4xl">
          <div className="space-y-2">
            {leaderboardData.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${getRankBg(entry.rank)} ${
                  entry.name.toLowerCase().includes(bruger.toLowerCase().substring(0, 3))
                    ? "ring-2 ring-blue-500/40"
                    : ""
                }`}
              >
                <div className="w-10 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-semibold text-sm">
                  {entry.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{entry.name}</p>
                </div>

                <div className="flex items-center gap-1 text-sm text-amber-400">
                  <Flame className="w-4 h-4" />
                  <span>{entry.streak} dage</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-blue-400 w-24 justify-end">
                  <TrendingUp className="w-4 h-4" />
                  <span>{entry.kort} kort</span>
                </div>

                <div className="flex items-center gap-1 text-sm font-bold w-24 justify-end">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>{entry.score.toLocaleString("da-DK")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Your rank card */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
              {bruger.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{bruger}</p>
              <p className="text-sm text-gray-400">Din rangering</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-400">—</p>
              <p className="text-sm text-gray-400">Opret kort for at komme på listen!</p>
            </div>
          </div>
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
