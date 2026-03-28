import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, RefreshControl, Alert, SectionList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Layers, ChevronDown, ChevronRight, Pencil, Trash2, X, Check,
  Globe, Lock, FolderOpen, PlusCircle,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { hentAlleKort, redigerKort, sletKort } from "../lib/api";
import type { Flashcard } from "../types";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/types";

export default function MyCardsScreen() {
  const { bruger } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, "Mine kort">>();
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openDecks, setOpenDecks] = useState<Set<string>>(new Set());
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [editDeck, setEditDeck] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const result = await hentAlleKort();
      if (result.success && Array.isArray(result.kort)) {
        const mine = (result.kort as Flashcard[]).filter((k) => k.user === bruger);
        setKort(mine);
        setOpenDecks(new Set());
      }
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bruger]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const grupperet = useMemo(() => {
    const map: Record<string, Flashcard[]> = {};
    for (const k of kort) {
      const deck = k.deckname || "Uden deck";
      if (!map[deck]) map[deck] = [];
      map[deck].push(k);
    }
    return map;
  }, [kort]);

  const toggleDeck = (deck: string) => {
    setOpenDecks((prev) => {
      const next = new Set(prev);
      if (next.has(deck)) next.delete(deck);
      else next.add(deck);
      return next;
    });
  };

  const startEdit = (card: Flashcard) => {
    setEditRow(card.row);
    setEditQ(card.question);
    setEditA(card.answer);
    setEditCat(card.category);
    setEditPublic(card.public);
    setEditDeck(card.deckname);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      const result = await redigerKort({
        row: editRow, question: editQ, answer: editA,
        category: editCat, public: editPublic, deckname: editDeck, user: bruger,
      });
      if (result.success) {
        setEditRow(null);
        await fetchCards();
      } else {
        Alert.alert("Fejl", "Kunne ikke gemme ændringer");
      }
    } catch {
      Alert.alert("Fejl", "Netværksfejl ved redigering");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (card: Flashcard) => {
    Alert.alert("Slet kort", `Slet "${card.question}"?`, [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet", style: "destructive", onPress: async () => {
          try {
            const result = await sletKort(card.row, bruger);
            if (result.success) fetchCards();
            else Alert.alert("Fejl", "Kunne ikke slette kortet");
          } catch { Alert.alert("Fejl", "Netværksfejl ved sletning"); }
        },
      },
    ]);
  };

  const sections = Object.entries(grupperet).map(([title, data]) => ({ title, data }));

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <View className="pt-4 px-4 pb-2 flex-row items-center">
        <Layers size={24} color="#60a5fa" />
        <Text className="text-white text-2xl font-bold ml-3">Mine kort</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Mere", { screen: "OpretKort" })}
          className="ml-auto bg-blue-600 rounded-xl px-3 py-1.5 flex-row items-center"
          activeOpacity={0.7}
        >
          <PlusCircle size={14} color="#fff" />
          <Text className="text-white text-xs font-semibold ml-1">Opret kort</Text>
        </TouchableOpacity>
      </View>
      <View className="px-4 pb-2">
        <Text className="text-gray-500 text-sm">{kort.length} kort · {sections.length} decks</Text>
      </View>

      {kort.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Layers size={44} color="#4b5563" />
          <Text className="text-gray-400 mt-4 text-center">Du har ingen kort endnu</Text>
          <Text className="text-gray-600 mt-1 text-sm text-center">Find et deck i Biblioteket for at komme i gang!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.row)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCards(); }} tintColor="#60a5fa" />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              onPress={() => toggleDeck(section.title)}
              className="flex-row items-center py-3 mt-2"
              activeOpacity={0.7}
            >
              {openDecks.has(section.title)
                ? <ChevronDown size={16} color="#9ca3af" />
                : <ChevronRight size={16} color="#9ca3af" />}
              <FolderOpen size={16} color="#60a5fa" style={{ marginLeft: 6 }} />
              <Text className="text-white font-semibold ml-2 flex-1">{section.title}</Text>
              <Text className="text-gray-600 text-xs">{section.data.length} kort</Text>
            </TouchableOpacity>
          )}
          renderItem={({ item, section }) => {
            if (!openDecks.has(section.title)) return null;

            // Editing mode
            if (editRow === item.row) {
              return (
                <View className="bg-white/5 border border-blue-500/30 rounded-2xl p-4 mb-2">
                  <TextInput
                    value={editQ}
                    onChangeText={setEditQ}
                    placeholder="Spørgsmål"
                    placeholderTextColor="#6b7280"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm mb-2"
                    multiline
                  />
                  <TextInput
                    value={editA}
                    onChangeText={setEditA}
                    placeholder="Svar"
                    placeholderTextColor="#6b7280"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm mb-2"
                    multiline
                  />
                  <View className="flex-row mb-2" style={{ gap: 6 }}>
                    {["Jura", "Portfolio", "Politifaglig", "Andet"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setEditCat(cat)}
                        className={`px-3 py-1.5 rounded-lg ${editCat === cat ? "bg-blue-600" : "bg-white/5 border border-white/10"}`}
                      >
                        <Text className={`text-xs font-semibold ${editCat === cat ? "text-white" : "text-gray-400"}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditPublic(!editPublic)}
                    className="flex-row items-center mb-3"
                  >
                    {editPublic ? <Globe size={14} color="#60a5fa" /> : <Lock size={14} color="#9ca3af" />}
                    <Text className="text-gray-400 text-xs ml-1.5">{editPublic ? "Offentligt" : "Privat"}</Text>
                  </TouchableOpacity>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={saveEdit}
                      disabled={saving}
                      className="flex-1 bg-blue-600 rounded-xl py-2.5 flex-row items-center justify-center"
                    >
                      {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={14} color="#fff" />}
                      <Text className="text-white text-xs font-semibold ml-1.5">Gem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditRow(null)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 flex-row items-center justify-center"
                    >
                      <X size={14} color="#9ca3af" />
                      <Text className="text-gray-400 text-xs font-semibold ml-1.5">Annuller</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-gray-200 text-sm" numberOfLines={2}>{item.question}</Text>
                  <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                    <Text className="text-gray-600 text-xs">{item.category}</Text>
                    {item.public ? <Globe size={10} color="#6b7280" /> : <Lock size={10} color="#6b7280" />}
                  </View>
                </View>
                <TouchableOpacity onPress={() => startEdit(item)} className="p-2 mr-1">
                  <Pencil size={14} color="#60a5fa" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
