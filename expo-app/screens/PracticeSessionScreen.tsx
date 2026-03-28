import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Modal, Pressable, TextInput, Alert, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate,
} from "react-native-reanimated";
import { ArrowLeft, Flag, X, BadgeCheck, ChevronRight } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { hentAlleKort, rapporterFejl, logAnalytics } from "../lib/api";
import { sortByReviewPriority, updateCardProgress, getSrsProgress, getStrengthSync } from "../lib/srs";
import type { Flashcard } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { BibliotekStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<BibliotekStackParamList, "PracticeSession">;
  route: RouteProp<BibliotekStackParamList, "PracticeSession">;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PracticeSessionScreen({ navigation, route }: Props) {
  const { bruger } = useAuth();
  const { category, deckname, owner } = route.params;

  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sværtCount, setSværtCount] = useState(0);
  const [okayCount, setOkayCount] = useState(0);
  const [letCount, setLetCount] = useState(0);
  const [done, setDone] = useState(false);
  const [srsLevels, setSrsLevels] = useState<Record<string, number>>({});

  // Report modal
  const [showReport, setShowReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);

  // Image lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Flip animation
  const flipValue = useSharedValue(0);
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipValue.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: "hidden" as const,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipValue.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: "hidden" as const,
  }));

  useEffect(() => {
    (async () => {
      try {
        const res = await hentAlleKort(bruger);
        const allCards = res.success && Array.isArray(res.kort) ? res.kort : [];
        const cards = allCards.filter((c: Flashcard) => {
          if (deckname) return c.deckname === deckname && c.user === (owner || c.user);
          if (category) return c.category === category;
          return true;
        });
        const sorted = await sortByReviewPriority(cards);
        setKort(sorted);

        // Load SRS levels for display
        const progress = await getSrsProgress();
        const levels: Record<string, number> = {};
        sorted.forEach((c) => { levels[c.question] = progress[c.question]?.level ?? -1; });
        setSrsLevels(levels);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, [bruger, category, deckname, owner]);

  const currentCard = kort[index];

  const doFlip = useCallback(() => {
    setFlipped(!flipped);
    flipValue.value = withTiming(flipped ? 0 : 1, { duration: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [flipped, flipValue]);

  const handleAnswer = useCallback(async (quality: 0 | 1 | 2) => {
    if (!currentCard) return;

    // Haptic feedback based on quality
    if (quality === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (quality === 1) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await updateCardProgress(currentCard.question, quality);
    logAnalytics({ user: bruger, question: currentCard.question, quality });

    if (quality === 0) setSværtCount((c) => c + 1);
    else if (quality === 1) setOkayCount((c) => c + 1);
    else setLetCount((c) => c + 1);

    if (index + 1 >= kort.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
      flipValue.value = withTiming(0, { duration: 200 });
    }
  }, [currentCard, index, kort.length, bruger, flipValue]);

  const handleReport = async () => {
    if (!reportMsg.trim() || !currentCard) return;
    setReportSending(true);
    await rapporterFejl({ question: currentCard.question, reporter: bruger, message: reportMsg.trim() });
    setReportSending(false);
    setShowReport(false);
    setReportMsg("");
    Alert.alert("Tak!", "Fejlen er rapporteret til admin.");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  if (kort.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 px-4 items-center justify-center">
        <Text className="text-gray-400 text-base mb-4">Ingen kort fundet i denne kategori</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Gå tilbage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Session complete
  if (done) {
    const total = sværtCount + okayCount + letCount;
    return (
      <SafeAreaView className="flex-1 bg-gray-950 px-6 items-center justify-center">
        <Text className="text-4xl mb-4">🎉</Text>
        <Text className="text-white text-2xl font-bold mb-2">Session færdig!</Text>
        <Text className="text-gray-400 text-sm mb-6">{total} kort gennemgået</Text>

        <View className="flex-row justify-center" style={{ gap: 16 }}>
          <View className="bg-red-500/10 rounded-2xl p-4 items-center min-w-[80px]">
            <Text className="text-red-400 text-2xl font-bold">{sværtCount}</Text>
            <Text className="text-red-400/70 text-xs mt-1">Svært</Text>
          </View>
          <View className="bg-amber-500/10 rounded-2xl p-4 items-center min-w-[80px]">
            <Text className="text-amber-400 text-2xl font-bold">{okayCount}</Text>
            <Text className="text-amber-400/70 text-xs mt-1">Okay</Text>
          </View>
          <View className="bg-emerald-500/10 rounded-2xl p-4 items-center min-w-[80px]">
            <Text className="text-emerald-400 text-2xl font-bold">{letCount}</Text>
            <Text className="text-emerald-400/70 text-xs mt-1">Let</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-600 px-8 py-3.5 rounded-xl mt-8"
        >
          <Text className="text-white font-bold text-base">Færdig</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const strength = getStrengthSync(srsLevels[currentCard.question] ?? -1);

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={22} color="#9ca3af" />
        </TouchableOpacity>
        <Text className="text-gray-400 text-sm font-medium">{index + 1} / {kort.length}</Text>
        <TouchableOpacity onPress={() => setShowReport(true)} className="p-2">
          <Flag size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View className="px-4 mb-4">
        <View className="bg-white/10 h-1.5 rounded-full overflow-hidden">
          <View
            className="bg-blue-500 h-full rounded-full"
            style={{ width: `${((index + 1) / kort.length) * 100}%` }}
          />
        </View>
      </View>

      {/* Strength indicator */}
      <View className="flex-row items-center justify-center mb-3" style={{ gap: 4 }}>
        {[1, 2, 3].map((dot) => (
          <View
            key={dot}
            className={`w-2 h-2 rounded-full ${dot <= strength.dots ? (strength.dots === 3 ? "bg-emerald-400" : strength.dots === 2 ? "bg-amber-400" : "bg-red-400") : "bg-gray-700"}`}
          />
        ))}
      </View>

      {/* Card */}
      <View className="flex-1 px-4 justify-center">
        <TouchableOpacity
          onPress={doFlip}
          activeOpacity={0.95}
          className="min-h-[280px]"
        >
          {/* Front */}
          <Animated.View
            style={[frontStyle, { position: "absolute", width: "100%" }]}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[280px] justify-center"
          >
            {currentCard.verified && (
              <View className="flex-row items-center justify-center mb-3">
                <BadgeCheck size={14} color="#60a5fa" />
                <Text className="text-blue-400 text-xs ml-1">Verificeret</Text>
              </View>
            )}
            <Text className="text-white text-lg font-medium text-center leading-7">
              {currentCard.question}
            </Text>
            {currentCard.imageURL ? (
              <TouchableOpacity onPress={() => setLightboxSrc(currentCard.imageURL!)} className="mt-4">
                <Image
                  source={{ uri: currentCard.imageURL }}
                  style={{ width: "100%", height: 160, borderRadius: 12 }}
                  contentFit="contain"
                  transition={200}
                />
              </TouchableOpacity>
            ) : null}
            <Text className="text-blue-400/60 text-xs text-center mt-4">Tryk for at vende</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View
            style={[backStyle, { position: "absolute", width: "100%" }]}
            className="bg-white/5 border border-blue-500/20 rounded-3xl p-6 min-h-[280px] justify-center"
          >
            <Text className="text-gray-200 text-base text-center leading-7">
              {currentCard.answer}
            </Text>
            <Text className="text-blue-400/60 text-xs text-center mt-4">Tryk for at vende</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Answer buttons (only visible when flipped) */}
      {flipped && (
        <View className="px-4 pb-6 flex-row" style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => handleAnswer(0)}
            className="flex-1 bg-red-500/15 border border-red-500/30 rounded-2xl py-4 items-center"
          >
            <Text className="text-red-400 font-bold text-base">Svært</Text>
            <Text className="text-red-400/50 text-xs mt-0.5">1 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAnswer(1)}
            className="flex-1 bg-amber-500/15 border border-amber-500/30 rounded-2xl py-4 items-center"
          >
            <Text className="text-amber-400 font-bold text-base">Okay</Text>
            <Text className="text-amber-400/50 text-xs mt-0.5">10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAnswer(2)}
            className="flex-1 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl py-4 items-center"
          >
            <Text className="text-emerald-400 font-bold text-base">Let</Text>
            <Text className="text-emerald-400/50 text-xs mt-0.5">1 dag</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Combo counter */}
      <View className="flex-row justify-center pb-4" style={{ gap: 16 }}>
        <Text className="text-red-400/50 text-xs">{sværtCount}× Svært</Text>
        <Text className="text-amber-400/50 text-xs">{okayCount}× Okay</Text>
        <Text className="text-emerald-400/50 text-xs">{letCount}× Let</Text>
      </View>

      {/* Report modal */}
      <Modal visible={showReport} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/50" onPress={() => setShowReport(false)}>
          <View className="flex-1" />
          <Pressable onPress={() => {}} className="bg-gray-900 rounded-t-3xl p-6 pb-10 border-t border-white/10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">Rapportér fejl</Text>
              <TouchableOpacity onPress={() => setShowReport(false)}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={reportMsg}
              onChangeText={setReportMsg}
              placeholder="Beskriv fejlen..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4"
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
            <TouchableOpacity
              onPress={handleReport}
              disabled={reportSending || !reportMsg.trim()}
              className="bg-red-600 rounded-xl py-3.5 items-center"
              style={(!reportMsg.trim() || reportSending) ? { opacity: 0.5 } : undefined}
            >
              <Text className="text-white font-bold">
                {reportSending ? "Sender..." : "Send rapport"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image lightbox */}
      <Modal visible={!!lightboxSrc} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/90 items-center justify-center" onPress={() => setLightboxSrc(null)}>
          {lightboxSrc && (
            <Image
              source={{ uri: lightboxSrc }}
              style={{ width: SCREEN_WIDTH - 32, height: SCREEN_WIDTH - 32 }}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
