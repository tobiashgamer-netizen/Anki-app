import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Database, Search, Copy, Heart, BadgeCheck, ChevronDown, ChevronUp, Play } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { hentAlleKort, kopierDeck, likeDeck } from "../lib/api";
import type { Flashcard } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BibliotekStackParamList } from "../navigation/types";

interface DeckGroup {
  deckname: string;
  owner: string;
  cards: Flashcard[];
  likes: number;
  hasVerified: boolean;
}

type Props = {
  navigation: NativeStackNavigationProp<BibliotekStackParamList, "BibliotekMain">;
};

export default function LibraryScreen({ navigation }: Props) {
  const { bruger } = useAuth();
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await hentAlleKort();
      if (result.success && Array.isArray(result.kort)) {
        setKort(result.kort);
      }
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group cards by deck
  const decks: DeckGroup[] = [];
  const deckMap = new Map<string, DeckGroup>();
  kort.filter((c) => c.public && c.deckname).forEach((c) => {
    const key = `${c.deckname}|${c.user}`;
    if (!deckMap.has(key)) {
      deckMap.set(key, { deckname: c.deckname, owner: c.user, cards: [], likes: c.likes, hasVerified: false });
    }
    const group = deckMap.get(key)!;
    group.cards.push(c);
    if (c.verified) group.hasVerified = true;
  });
  deckMap.forEach((v) => decks.push(v));

  const filtered = search.trim()
    ? decks.filter((d) =>
        d.deckname.toLowerCase().includes(search.toLowerCase()) ||
        d.owner.toLowerCase().includes(search.toLowerCase()) ||
        d.cards.some((c) => c.question.toLowerCase().includes(search.toLowerCase()))
      )
    : decks;

  const officielle = filtered.filter((d) => d.owner === "admin" || d.owner === "officiel");
  const brugerDecks = filtered.filter((d) => d.owner !== "admin" && d.owner !== "officiel");

  const handleCopy = async (deck: DeckGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await kopierDeck({ deckname: deck.deckname, sourceOwner: deck.owner, user: bruger });
    if (result.success) {
      Alert.alert("Kopieret!", `${result.copied} kort kopieret til dine kort.`);
    }
  };

  const handleLike = async (deck: DeckGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await likeDeck({ deckname: deck.deckname, deckOwner: deck.owner, user: bruger });
    if (!result.success || result.alreadyLiked) return;
    setKort((prev) => prev.map((c) =>
      c.deckname === deck.deckname && c.user === deck.owner ? { ...c, likes: c.likes + 1, likedBy: [...(c.likedBy || []), bruger] } : c
    ));
  };

  const handlePractice = (deck: DeckGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PracticeSession", { deckname: deck.deckname, owner: deck.owner });
  };

  const renderDeck = (deck: DeckGroup) => {
    const key = `${deck.deckname}|${deck.owner}`;
    const isExpanded = expandedDeck === key;
    const isLiked = deck.cards.some((card) => Array.isArray(card.likedBy) && card.likedBy.includes(bruger));
    return (
      <View key={key} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-3">
        <TouchableOpacity
          onPress={() => setExpandedDeck(isExpanded ? null : key)}
          className="p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-white text-base font-semibold">{deck.deckname}</Text>
              {deck.hasVerified && <BadgeCheck size={14} color="#60a5fa" />}
            </View>
            <Text className="text-gray-500 text-xs mt-0.5">{deck.owner} · {deck.cards.length} kort · {deck.likes} ❤️</Text>
          </View>
          {!isExpanded && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); handlePractice(deck); }}
              className="bg-emerald-600/20 rounded-xl p-2 mr-2"
              activeOpacity={0.7}
            >
              <Play size={16} color="#34d399" />
            </TouchableOpacity>
          )}
          {isExpanded ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
        </TouchableOpacity>

        {isExpanded && (
          <View className="border-t border-white/5 px-4 pb-4">
            {deck.cards.slice(0, 10).map((card, i) => (
              <View key={i} className="py-2.5 border-b border-white/5">
                <Text className="text-gray-200 text-sm" numberOfLines={2}>{card.question}</Text>
                <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{card.answer}</Text>
              </View>
            ))}
            {deck.cards.length > 10 && (
              <Text className="text-gray-600 text-xs mt-2">+{deck.cards.length - 10} flere kort...</Text>
            )}
            <View className="flex-row mt-3" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => handlePractice(deck)}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/30 rounded-xl py-2.5 flex-row items-center justify-center"
              >
                <Play size={14} color="#34d399" />
                <Text className="text-emerald-400 text-xs font-semibold ml-1.5">Start øvelse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCopy(deck)}
                className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-xl py-2.5 flex-row items-center justify-center"
              >
                <Copy size={14} color="#60a5fa" />
                <Text className="text-blue-400 text-xs font-semibold ml-1.5">Kopiér</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleLike(deck)}
                disabled={isLiked}
                className="bg-pink-600/20 border border-pink-500/30 rounded-xl py-2.5 px-3 flex-row items-center justify-center"
              >
                <Heart size={14} color={isLiked ? "#fb7185" : "#f472b6"} fill={isLiked ? "#fb7185" : "transparent"} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

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
        <View className="pt-4 pb-2 flex-row items-center">
          <Database size={24} color="#60a5fa" />
          <Text className="text-white text-2xl font-bold ml-3">Bibliotek</Text>
        </View>

        {/* Search */}
        <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-3 mb-4">
          <Search size={16} color="#6b7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Søg decks, kort eller brugere..."
            placeholderTextColor="#6b7280"
            className="flex-1 text-white text-sm ml-3"
          />
        </View>

        {/* Official decks */}
        {officielle.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Officielle decks</Text>
            {officielle.map(renderDeck)}
          </View>
        )}

        {/* User decks */}
        {brugerDecks.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Bruger-decks</Text>
            {brugerDecks.map(renderDeck)}
          </View>
        )}

        {filtered.length === 0 && (
          <View className="bg-white/5 border border-white/10 rounded-2xl p-8 items-center">
            <Database size={32} color="#6b7280" />
            <Text className="text-gray-400 text-sm mt-3">Ingen decks fundet</Text>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
