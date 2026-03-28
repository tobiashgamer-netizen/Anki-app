import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, PlusCircle, Trophy, Layers, Search, Database, Megaphone, BadgeCheck, Brain } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { hentAlleKort, hentBroadcast, logActivity } from "../lib/api";
import { getSrsProgress } from "../lib/srs";
import type { Flashcard } from "../types";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const { bruger } = useAuth();
  const navigation = useNavigation<any>();
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [broadcast, setBroadcast] = useState("");
  const [search, setSearch] = useState("");
  const [mastered, setMastered] = useState(0);
  const [dagensKort, setDagensKort] = useState<Flashcard | null>(null);
  const [flipped, setFlipped] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [cardsRes, bc] = await Promise.all([
        hentAlleKort(bruger),
        hentBroadcast(),
      ]);
      const cards = cardsRes.success && Array.isArray(cardsRes.kort) ? cardsRes.kort : [];
      setKort(cards);
      setBroadcast(bc?.message || "");

      // Pick random official card
      const official = cards.filter(
        (c: Flashcard) => c.user === "admin" || c.user === "officiel"
      );
      if (official.length > 0) {
        setDagensKort(official[Math.floor(Math.random() * official.length)]);
      }

      // Count mastered cards
      const progress = await getSrsProgress();
      const masteredCount = Object.values(progress).filter((p) => p.level === 2).length;
      setMastered(masteredCount);

      logActivity(bruger);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bruger]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const mineKort = kort.filter((k) => k.user === bruger);
  const officielle = kort.filter((k) => k.verified);
  const searchResults = search.trim()
    ? kort.filter((k) =>
        k.question.toLowerCase().includes(search.toLowerCase()) ||
        k.answer.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#60a5fa" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-4 pb-2">
          <Text className="text-white text-2xl font-bold">Hej, {bruger} 👋</Text>
          <Text className="text-gray-400 text-sm mt-1">Klar til at lære?</Text>
        </View>

        {/* Broadcast */}
        {broadcast ? (
          <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-4 flex-row items-center">
            <Megaphone size={16} color="#fbbf24" />
            <Text className="text-amber-200 text-sm font-medium ml-2 flex-1">{broadcast}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-1">
          {[
            { label: "Alle kort", value: kort.length, icon: <Layers size={16} color="#60a5fa" /> },
            { label: "Mine kort", value: mineKort.length, icon: <BookOpen size={16} color="#a78bfa" /> },
            { label: "Mestret", value: mastered, icon: <Brain size={16} color="#34d399" /> },
            { label: "Officielle", value: officielle.length, icon: <BadgeCheck size={16} color="#60a5fa" /> },
          ].map((stat) => (
            <View key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 mr-3 min-w-[110px]">
              <View className="flex-row items-center mb-2">{stat.icon}</View>
              <Text className="text-white text-xl font-bold">{stat.value}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Search */}
        <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-3 mb-4">
          <Search size={16} color="#6b7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Søg i alle kort..."
            placeholderTextColor="#6b7280"
            className="flex-1 text-white text-sm ml-3"
          />
        </View>

        {search.trim() ? (
          <View className="mb-4">
            {searchResults.map((card, i) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
                <Text className="text-gray-200 text-sm" numberOfLines={1}>{card.question}</Text>
                <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{card.answer}</Text>
              </View>
            ))}
            {searchResults.length === 0 && (
              <Text className="text-gray-500 text-sm text-center py-4">Ingen resultater fundet</Text>
            )}
          </View>
        ) : null}

        {/* Dagens Kort */}
        {dagensKort && !search.trim() ? (
          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Dagens Kort</Text>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFlipped(!flipped); }}
              activeOpacity={0.9}
              className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 min-h-[140px] justify-center"
            >
              <Text className="text-white text-base font-medium text-center">
                {flipped ? dagensKort.answer : dagensKort.question}
              </Text>
              <Text className="text-blue-400 text-xs text-center mt-3">
                {flipped ? "Tryk for spørgsmål" : "Tryk for svar"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Actions */}
        {!search.trim() ? (
          <View className="mb-8">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Hurtige handlinger</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {[
                { label: "Opret kort", icon: <PlusCircle size={18} color="#60a5fa" />, onPress: () => navigation.navigate("Mere", { screen: "OpretKort" }) },
                { label: "Bibliotek", icon: <Database size={18} color="#a78bfa" />, onPress: () => navigation.navigate("BibliotekStack") },
                { label: "Mine kort", icon: <BookOpen size={18} color="#34d399" />, onPress: () => navigation.navigate("Mine kort") },
                { label: "Leaderboard", icon: <Trophy size={18} color="#fbbf24" />, onPress: () => navigation.navigate("Mere", { screen: "Leaderboard" }) },
              ].map((action) => (
                <TouchableOpacity
                  key={action.label}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); action.onPress(); }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[45%] items-center"
                  activeOpacity={0.7}
                >
                  {action.icon}
                  <Text className="text-gray-300 text-xs font-medium mt-2">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
