import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle, Sparkles, Globe, Lock, Layers, Check, Loader2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { opretKort } from "../lib/api";

const categories = ["Jura", "Portfolio", "Politifaglig", "Andet"];

export default function CreateCardScreen() {
  const { bruger } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Jura");
  const [deckname, setDeckname] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [count, setCount] = useState(0);

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) return;
    setStatus("loading");
    try {
      const result = await opretKort({
        question, answer, category, user: bruger,
        public: isPublic, deckname: deckname.trim(),
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus("success");
        setCount((p) => p + 1);
        setTimeout(() => {
          setQuestion("");
          setAnswer("");
          setCategory("Jura");
          setStatus("idle");
        }, 1500);
      } else {
        Alert.alert("Fejl", "Kunne ikke gemme kortet. Prøv igen.");
        setStatus("idle");
      }
    } catch {
      Alert.alert("Fejl", "Netværksfejl. Prøv igen.");
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center px-8">
        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 items-center w-full">
          <Check size={48} color="#34d399" />
          <Text className="text-emerald-300 text-xl font-bold mt-4">Kort gemt!</Text>
          <Text className="text-gray-400 mt-2 text-center">Kortet er klar til øvelse</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="pt-4 pb-2 flex-row items-center">
            <PlusCircle size={24} color="#60a5fa" />
            <Text className="text-white text-2xl font-bold ml-3">Opret kort</Text>
          </View>

          {count > 0 && (
            <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex-row items-center mb-4">
              <Sparkles size={14} color="#34d399" />
              <Text className="text-emerald-300 text-sm font-medium ml-2">
                {count} kort oprettet i denne session
              </Text>
            </View>
          )}

          {/* Category */}
          <View className="mb-5">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Kategori</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    category === cat
                      ? "bg-blue-600 border-blue-500"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${category === cat ? "text-white" : "text-gray-400"}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Deck name */}
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <Layers size={14} color="#9ca3af" />
              <Text className="text-gray-300 text-sm font-semibold ml-1.5">Deck navn</Text>
            </View>
            <TextInput
              value={deckname}
              onChangeText={setDeckname}
              placeholder="f.eks. Straffeloven, Første år..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* Question */}
          <View className="mb-5">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Spørgsmål</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Skriv dit spørgsmål..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Answer */}
          <View className="mb-5">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Svar</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Skriv svaret..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Public toggle */}
          <TouchableOpacity
            onPress={() => setIsPublic(!isPublic)}
            className={`flex-row items-center px-4 py-3 rounded-xl border mb-6 ${
              isPublic ? "bg-blue-600/10 border-blue-500/20" : "bg-white/5 border-white/10"
            }`}
          >
            {isPublic ? <Globe size={16} color="#60a5fa" /> : <Lock size={16} color="#9ca3af" />}
            <Text className={`text-sm font-semibold ml-2 ${isPublic ? "text-blue-400" : "text-gray-400"}`}>
              {isPublic ? "Offentligt – synligt i Bibliotek" : "Privat – kun synligt for dig"}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={status === "loading" || !question.trim() || !answer.trim()}
            className={`flex-row items-center justify-center py-4 rounded-2xl mb-6 ${
              !question.trim() || !answer.trim() ? "bg-gray-800" : "bg-blue-600"
            }`}
            activeOpacity={0.8}
          >
            {status === "loading" ? (
              <Loader2 size={18} color="#fff" />
            ) : (
              <PlusCircle size={18} color="#fff" />
            )}
            <Text className="text-white font-bold ml-2">
              {status === "loading" ? "Gemmer..." : "Opret kort"}
            </Text>
          </TouchableOpacity>

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
