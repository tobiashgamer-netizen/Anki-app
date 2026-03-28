import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lightbulb, Check, Loader2, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { sendFeedback } from "../lib/api";

const feedbackTypes = ["Ny funktion", "Design", "Indhold", "Andet"];

export default function FeedbackScreen() {
  const { bruger } = useAuth();
  const [emne, setEmne] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [type, setType] = useState(feedbackTypes[0]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!emne.trim() || !beskrivelse.trim()) return;
    setSending(true);
    try {
      await sendFeedback({ emne: emne.trim(), beskrivelse: beskrivelse.trim(), type, user: bruger });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
      setEmne("");
      setBeskrivelse("");
      setType(feedbackTypes[0]);
    } catch { /* */ } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center px-8">
        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 items-center w-full">
          <Check size={48} color="#34d399" />
          <Text className="text-emerald-300 text-xl font-bold mt-4">Tak for dit forslag!</Text>
          <Text className="text-gray-400 mt-2 text-center">Admin kigger på det snart.</Text>
          <TouchableOpacity
            onPress={() => setSent(false)}
            className="mt-6 px-6 py-2.5 bg-white/10 border border-white/10 rounded-xl"
          >
            <Text className="text-gray-300 text-sm font-medium">Send endnu et forslag</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="pt-4 pb-2 flex-row items-center">
            <Lightbulb size={24} color="#fbbf24" />
            <Text className="text-white text-2xl font-bold ml-3">Feedback</Text>
          </View>
          <Text className="text-gray-500 text-sm mb-6">Del dine idéer og forslag – vi læser dem alle!</Text>

          {/* Emne */}
          <View className="mb-5">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Emne</Text>
            <TextInput
              value={emne}
              onChangeText={setEmne}
              placeholder="Kort beskrivelse af dit forslag..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* Beskrivelse */}
          <View className="mb-5">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Beskrivelse</Text>
            <TextInput
              value={beskrivelse}
              onChangeText={setBeskrivelse}
              placeholder="Fortæl os mere om dit forslag..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
            />
          </View>

          {/* Type picker */}
          <View className="mb-6">
            <Text className="text-gray-300 text-sm font-semibold mb-2">Type</Text>
            <TouchableOpacity
              onPress={() => setTypeOpen(!typeOpen)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-white text-sm">{type}</Text>
              <ChevronDown size={14} color="#6b7280" />
            </TouchableOpacity>
            {typeOpen && (
              <View className="bg-gray-900 border border-white/10 rounded-xl mt-1 overflow-hidden">
                {feedbackTypes.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { setType(t); setTypeOpen(false); }}
                    className={`px-4 py-3 border-b border-white/5 ${t === type ? "bg-blue-600/20" : ""}`}
                  >
                    <Text className={`text-sm ${t === type ? "text-blue-400 font-semibold" : "text-gray-300"}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={sending || !emne.trim() || !beskrivelse.trim()}
            className={`flex-row items-center justify-center py-4 rounded-2xl mb-6 ${
              !emne.trim() || !beskrivelse.trim() ? "bg-gray-800" : "bg-blue-600"
            }`}
            activeOpacity={0.8}
          >
            {sending ? <Loader2 size={18} color="#fff" /> : <Lightbulb size={18} color="#fff" />}
            <Text className="text-white font-bold ml-2">
              {sending ? "Sender..." : "Send forslag"}
            </Text>
          </TouchableOpacity>

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
