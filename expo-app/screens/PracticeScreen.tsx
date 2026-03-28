import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Scale, Briefcase, Shield, FolderOpen, Layers, BookOpen } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { hentAlleKort } from "../lib/api";
import type { Flashcard } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BibliotekStackParamList } from "../navigation/types";

const kategorier = [
  { id: "Jura", label: "Jura", icon: Scale, color: "#3b82f6" },
  { id: "Portfolio", label: "Portfolio", icon: Briefcase, color: "#8b5cf6" },
  { id: "Politifaglig", label: "Politifaglig", icon: Shield, color: "#10b981" },
  { id: "Andet", label: "Andet", icon: FolderOpen, color: "#f59e0b" },
];

type Props = {
  navigation: NativeStackNavigationProp<BibliotekStackParamList, "BibliotekMain">;
};

export default function PracticeScreen({ navigation }: Props) {
  const { bruger } = useAuth();
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deckMode, setDeckMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await hentAlleKort(bruger);
        setKort(res.success && Array.isArray(res.kort) ? res.kort : []);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, [bruger]);

  // Group by deck
  const decks = kort.reduce<Record<string, { owner: string; count: number }>>((acc, k) => {
    if (!k.deckname) return acc;
    const key = `${k.deckname}|${k.user}`;
    if (!acc[key]) acc[key] = { owner: k.user, count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  const catCounts = kategorier.map((k) => ({
    ...k,
    count: kort.filter((c) => c.category === k.id).length,
  }));

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pt-4 pb-2">
          <View className="flex-row items-center mb-1">
            <BookOpen size={24} color="#60a5fa" />
            <Text className="text-white text-2xl font-bold ml-3">Øv dig</Text>
          </View>
          <Text className="text-gray-400 text-sm">Vælg en kategori eller et deck</Text>
        </View>

        {/* Toggle */}
        <View className="flex-row bg-white/5 rounded-xl p-1 mb-4">
          <TouchableOpacity
            onPress={() => setDeckMode(false)}
            className={`flex-1 py-2.5 rounded-lg items-center ${!deckMode ? "bg-blue-600" : ""}`}
          >
            <Text className={`text-sm font-semibold ${!deckMode ? "text-white" : "text-gray-400"}`}>Kategorier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeckMode(true)}
            className={`flex-1 py-2.5 rounded-lg items-center ${deckMode ? "bg-blue-600" : ""}`}
          >
            <Text className={`text-sm font-semibold ${deckMode ? "text-white" : "text-gray-400"}`}>Decks</Text>
          </TouchableOpacity>
        </View>

        {!deckMode ? (
          <View style={{ gap: 12 }}>
            {catCounts.map((cat) => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => navigation.navigate("PracticeSession", { category: cat.id })}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-row items-center"
                  activeOpacity={0.7}
                  disabled={cat.count === 0}
                  style={cat.count === 0 ? { opacity: 0.4 } : undefined}
                >
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                    <Icon size={22} color={cat.color} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-white text-base font-semibold">{cat.label}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{cat.count} kort</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {Object.entries(decks).length === 0 ? (
              <View className="bg-white/5 border border-white/10 rounded-2xl p-8 items-center">
                <Layers size={32} color="#6b7280" />
                <Text className="text-gray-400 text-sm mt-3">Ingen decks fundet</Text>
              </View>
            ) : (
              Object.entries(decks).map(([key, deck]) => {
                const [deckname] = key.split("|");
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => navigation.navigate("PracticeSession", { deckname, owner: deck.owner })}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-row items-center"
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-lg bg-purple-500/20 items-center justify-center">
                      <Layers size={18} color="#a78bfa" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white text-sm font-semibold">{deckname}</Text>
                      <Text className="text-gray-500 text-xs">{deck.owner} · {deck.count} kort</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
