import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react-native";
import { hentLeaderboard } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { LeaderboardEntry } from "../types";

export default function LeaderboardScreen() {
  const { bruger } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await hentLeaderboard();
      if (res.success && Array.isArray(res.leaderboard)) {
        setData(res.leaderboard);
      }
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  const top3 = data.slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#60a5fa" />}
      >
        <View className="pt-4 pb-2 flex-row items-center">
          <Trophy size={24} color="#fbbf24" />
          <Text className="text-white text-2xl font-bold ml-3">Leaderboard</Text>
        </View>
        <Text className="text-gray-500 text-sm mb-5">Baseret på rigtige data fra holdet</Text>

        {data.length === 0 ? (
          <View className="bg-white/5 border border-white/10 rounded-2xl p-10 items-center">
            <Trophy size={32} color="#6b7280" />
            <Text className="text-gray-400 text-sm mt-3">Ingen data endnu - start med at øve!</Text>
          </View>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <View className="flex-row items-end justify-center mb-6" style={{ gap: 8 }}>
                {/* 2nd */}
                <View className="items-center flex-1 pt-6">
                  <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: "#6b7280" }}>
                    <Text className="text-white text-xl font-bold">{top3[1].user.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Medal size={20} color="#d1d5db" style={{ marginTop: 4 }} />
                  <Text className="text-white font-bold text-sm mt-1" numberOfLines={1}>{top3[1].user}</Text>
                  <Text className="text-gray-400 text-xs">{top3[1].score} pt</Text>
                </View>

                {/* 1st */}
                <View className="items-center flex-1">
                  <Crown size={28} color="#fbbf24" style={{ marginBottom: 4 }} />
                  <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#f59e0b" }}>
                    <Text className="text-gray-900 text-2xl font-bold">{top3[0].user.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text className="text-white font-bold mt-2">{top3[0].user}</Text>
                  <Text className="text-amber-400 text-sm font-semibold">{top3[0].score} pt</Text>
                </View>

                {/* 3rd */}
                <View className="items-center flex-1 pt-8">
                  <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: "#92400e" }}>
                    <Text className="text-white text-lg font-bold">{top3[2].user.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Medal size={18} color="#b45309" style={{ marginTop: 4 }} />
                  <Text className="text-white font-bold text-sm mt-1" numberOfLines={1}>{top3[2].user}</Text>
                  <Text className="text-gray-500 text-xs">{top3[2].score} pt</Text>
                </View>
              </View>
            )}

            {/* Full list */}
            {data.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.user.toLowerCase() === bruger.toLowerCase();
              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <View
                  key={entry.user}
                  className={`flex-row items-center p-4 rounded-2xl border mb-2 ${
                    isMe
                      ? "bg-blue-600/10 border-blue-500/30"
                      : isGold
                        ? "bg-amber-500/10 border-amber-500/20"
                        : isSilver
                          ? "bg-gray-400/10 border-gray-400/20"
                          : isBronze
                            ? "bg-amber-700/10 border-amber-700/20"
                            : "bg-white/5 border-white/10"
                  }`}
                >
                  <View className="w-8 items-center">
                    {isGold ? (
                      <Crown size={18} color="#fbbf24" />
                    ) : isSilver ? (
                      <Medal size={18} color="#d1d5db" />
                    ) : isBronze ? (
                      <Medal size={18} color="#b45309" />
                    ) : (
                      <Text className="text-gray-500 font-bold">{rank}</Text>
                    )}
                  </View>

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text className={`font-semibold text-sm ${isMe ? "text-blue-400" : "text-white"}`}>
                        {entry.user}
                      </Text>
                      {isMe && (
                        <View className="bg-blue-500/20 px-1.5 py-0.5 rounded">
                          <Text className="text-blue-400 text-[10px] font-bold">DIG</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mt-0.5" style={{ gap: 8 }}>
                      <Text className="text-gray-500 text-xs">{entry.total} kort øvet</Text>
                      <Text className="text-gray-600 text-xs">·</Text>
                      <Text className="text-emerald-500 text-xs">{entry.correct} korrekte</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center">
                      <TrendingUp size={12} color="#60a5fa" />
                      <Text className={`font-bold ml-1 ${
                        isGold ? "text-amber-400" : isSilver ? "text-gray-300" : isBronze ? "text-amber-600" : "text-gray-300"
                      }`}>{entry.score}</Text>
                    </View>
                    <Text className="text-gray-600 text-xs">point</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
