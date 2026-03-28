import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ShieldCheck, AlertTriangle, BadgeCheck, ImageIcon, Brain, Users,
  Megaphone, Check, X, Save, Pencil, Lightbulb, Trash2, Eye,
  BarChart3, Layers, Clock,
} from "lucide-react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import {
  hentAlleKort, resolveError, verifyCard, saveBroadcast,
  hentBroadcast, hentActivity, hentBlindSpot, hentFeedback,
  markFeedbackRead, deleteFeedback,
} from "../lib/api";
import type { Flashcard, ActivityRecord, BlindSpotItem, FeedbackItem } from "../types";

type Tab = "dashboard" | "fejl" | "verificer" | "billeder" | "blindspot" | "aktivitet" | "broadcast" | "forslag";

const tabDefs: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { id: "dashboard", label: "Overblik", icon: BarChart3 },
  { id: "fejl", label: "Fejl", icon: AlertTriangle },
  { id: "verificer", label: "Verificér", icon: BadgeCheck },
  { id: "billeder", label: "Billeder", icon: ImageIcon },
  { id: "blindspot", label: "Blind Spot", icon: Brain },
  { id: "aktivitet", label: "Aktivitet", icon: Users },
  { id: "broadcast", label: "Parole", icon: Megaphone },
  { id: "forslag", label: "Forslag", icon: Lightbulb },
];

export default function AdminScreen() {
  const { rolle } = useAuth();
  const [kort, setKort] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSaving, setBroadcastSaving] = useState(false);
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  // Activity
  const [activity, setActivity] = useState<ActivityRecord[]>([]);

  // Blind spot
  const [blindSpot, setBlindSpot] = useState<BlindSpotItem[]>([]);

  // Feedback
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  // Actions
  const [resolving, setResolving] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);

  // Image lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [cardsRes, broadRes, actRes, bsRes, fbRes] = await Promise.all([
        hentAlleKort(), hentBroadcast(), hentActivity(), hentBlindSpot(), hentFeedback(),
      ]);
      if (cardsRes.success && Array.isArray(cardsRes.kort)) setKort(cardsRes.kort as Flashcard[]);
      if (broadRes.success) setBroadcastMsg(broadRes.message);
      if (actRes.success) setActivity(actRes.activity as ActivityRecord[]);
      if (bsRes.success) setBlindSpot(bsRes.blindSpot as BlindSpotItem[]);
      if (fbRes.success) setFeedback(fbRes.feedback as FeedbackItem[]);
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (rolle === "admin") fetchAll(); }, [rolle, fetchAll]);

  const errorCards = useMemo(() => kort.filter((k) => k.error_report), [kort]);
  const imageCards = useMemo(() => kort.filter((k) => k.imageURL), [kort]);

  const handleResolve = async (card: Flashcard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResolving(card.question);
    await resolveError({ question: card.question });
    setKort((prev) => prev.map((k) => k.question === card.question ? { ...k, error_report: null } : k));
    setResolving(null);
  };

  const handleVerify = async (card: Flashcard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVerifying(card.row);
    const newState = !card.verified;
    await verifyCard({ row: card.row, verified: newState });
    setKort((prev) => prev.map((k) => k.row === card.row ? { ...k, verified: newState } : k));
    setVerifying(null);
  };

  const handleBroadcast = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBroadcastSaving(true);
    await saveBroadcast(broadcastMsg);
    setBroadcastSaved(true);
    setTimeout(() => setBroadcastSaved(false), 2000);
    setBroadcastSaving(false);
  };

  const handleMarkRead = async (item: FeedbackItem) => {
    await markFeedbackRead(item.row);
    setFeedback((prev) => prev.map((f) => f.row === item.row ? { ...f, status: "læst" } : f));
  };

  const handleDeleteFeedback = (item: FeedbackItem) => {
    Alert.alert("Slet forslag", `Slet "${item.emne}"?`, [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet", style: "destructive", onPress: async () => {
          await deleteFeedback(item.row);
          setFeedback((prev) => prev.filter((f) => f.row !== item.row));
        },
      },
    ]);
  };

  if (rolle !== "admin") {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ShieldCheck size={40} color="#ef4444" />
        <Text className="text-red-400 font-bold mt-3">Kun for admin</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  const tabCounts: Partial<Record<Tab, number>> = {
    fejl: errorCards.length,
    billeder: imageCards.length,
    blindspot: blindSpot.length,
    aktivitet: activity.length,
    forslag: feedback.filter((f) => f.status !== "læst").length,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="pt-4 px-4 pb-2 flex-row items-center">
        <ShieldCheck size={24} color="#60a5fa" />
        <Text className="text-white text-2xl font-bold ml-3">Admin</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" contentContainerStyle={{ gap: 6 }}>
        {tabDefs.map((t) => {
          const count = tabCounts[t.id];
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
                active ? "bg-blue-600/20 border-blue-500/30" : "bg-white/5 border-white/10"
              }`}
            >
              <t.icon size={14} color={active ? "#60a5fa" : "#9ca3af"} />
              <Text className={`text-xs font-medium ml-1.5 ${active ? "text-blue-400" : "text-gray-400"}`}>{t.label}</Text>
              {count !== undefined && count > 0 && (
                <View className="ml-1.5 bg-white/10 px-1.5 py-0.5 rounded-full">
                  <Text className="text-gray-300 text-[10px]">{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#60a5fa" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <View>
            {/* Stat cards grid */}
            <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 16 }}>
              <StatCard icon={Layers} color="#60a5fa" label="Kort i alt" value={kort.length} />
              <StatCard icon={BadgeCheck} color="#34d399" label="Verificerede" value={kort.filter((k) => k.verified).length} />
              <StatCard icon={AlertTriangle} color="#f87171" label="Fejlrapporter" value={errorCards.length} />
              <StatCard icon={Users} color="#a78bfa" label="Aktive brugere" value={activity.length} />
              <StatCard icon={Brain} color="#fbbf24" label="Blinde punkter" value={blindSpot.length} />
              <StatCard icon={Lightbulb} color="#34d399" label="Uæste forslag" value={feedback.filter((f) => f.status !== "læst").length} />
              <StatCard icon={ImageIcon} color="#f472b6" label="Med billeder" value={imageCards.length} />
              <StatCard icon={Clock} color="#6b7280" label="Offentlige" value={kort.filter((k) => k.public).length} />
            </View>

            {/* Quick actions */}
            {errorCards.length > 0 && (
              <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-3">
                <Text className="text-red-300 text-sm font-semibold mb-1">⚠️ {errorCards.length} fejlrapport{errorCards.length !== 1 ? "er" : ""} venter</Text>
                <Text className="text-gray-400 text-xs">Gå til Fejl-fanen for at løse dem</Text>
              </View>
            )}
            {feedback.filter((f) => f.status !== "læst").length > 0 && (
              <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-3">
                <Text className="text-blue-300 text-sm font-semibold mb-1">💡 {feedback.filter((f) => f.status !== "læst").length} nye forslag</Text>
                <Text className="text-gray-400 text-xs">Gå til Forslag-fanen for at læse dem</Text>
              </View>
            )}
          </View>
        )}

        {/* ===== FEJL ===== */}
        {tab === "fejl" && (
          errorCards.length === 0 ? (
            <EmptyState icon={Check} color="#34d399" text="Ingen fejlrapporter!" />
          ) : (
            errorCards.map((card) => (
              <View key={card.row} className="bg-white/5 border border-red-500/20 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <Text className="text-red-300 text-xs bg-red-500/10 px-2 py-0.5 rounded">Fejl</Text>
                  <Text className="text-gray-600 text-xs">{card.deckname} · {card.user}</Text>
                </View>
                <Text className="text-amber-300 text-sm mb-2">"{card.error_report}"</Text>
                <Text className="text-gray-400 text-xs">Q: {card.question}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">A: {card.answer}</Text>
                <TouchableOpacity
                  onPress={() => handleResolve(card)}
                  disabled={resolving === card.question}
                  className="mt-3 bg-emerald-600 rounded-xl py-2.5 flex-row items-center justify-center"
                >
                  {resolving === card.question
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Check size={14} color="#fff" />}
                  <Text className="text-white text-xs font-semibold ml-1.5">Løs fejl</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        )}

        {/* ===== VERIFICER ===== */}
        {tab === "verificer" && (
          kort.filter((k) => k.public).map((card) => (
            <View key={card.row} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex-row items-center">
              <View className="flex-1 mr-3">
                <Text className="text-gray-200 text-sm" numberOfLines={1}>{card.question}</Text>
                <Text className="text-gray-600 text-xs mt-0.5">{card.deckname} · {card.user}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleVerify(card)}
                disabled={verifying === card.row}
                className={`px-3 py-2 rounded-lg ${card.verified ? "bg-emerald-600/20 border border-emerald-500/30" : "bg-white/5 border border-white/10"}`}
              >
                {verifying === card.row ? (
                  <ActivityIndicator size="small" color="#60a5fa" />
                ) : (
                  <BadgeCheck size={16} color={card.verified ? "#34d399" : "#6b7280"} />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ===== BILLEDER ===== */}
        {tab === "billeder" && (
          imageCards.length === 0 ? (
            <EmptyState icon={ImageIcon} color="#6b7280" text="Ingen kort med billeder" />
          ) : (
            imageCards.map((card) => (
              <TouchableOpacity
                key={card.row}
                onPress={() => setLightboxUrl(card.imageURL!)}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-3"
                activeOpacity={0.8}
              >
                <Image source={{ uri: card.imageURL }} style={{ width: "100%", height: 180 }} contentFit="cover" />
                <View className="p-3">
                  <Text className="text-gray-200 text-sm" numberOfLines={1}>{card.question}</Text>
                  <Text className="text-gray-600 text-xs mt-0.5">{card.user} · {card.deckname}</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        )}

        {/* ===== BLIND SPOT ===== */}
        {tab === "blindspot" && (
          blindSpot.length === 0 ? (
            <EmptyState icon={Brain} color="#6b7280" text="Ingen blinde punkter endnu" />
          ) : (
            blindSpot.map((item, i) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-3">
                  <Text className="text-red-400 text-sm font-bold">{item.count}</Text>
                </View>
                <Text className="text-gray-200 text-sm flex-1" numberOfLines={2}>{item.question}</Text>
              </View>
            ))
          )
        )}

        {/* ===== AKTIVITET ===== */}
        {tab === "aktivitet" && (
          activity.length === 0 ? (
            <EmptyState icon={Users} color="#6b7280" text="Ingen aktivitet registreret" />
          ) : (
            activity.map((a, i) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row items-center justify-between">
                <Text className="text-white font-semibold text-sm">{a.user}</Text>
                <Text className="text-gray-500 text-xs">{a.lastSeen}</Text>
              </View>
            ))
          )
        )}

        {/* ===== BROADCAST ===== */}
        {tab === "broadcast" && (
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Megaphone size={18} color="#60a5fa" />
              <Text className="text-white font-semibold ml-2">Dagens Parole</Text>
            </View>
            <TextInput
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
              placeholder="Skriv en besked til holdet..."
              placeholderTextColor="#6b7280"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
            <TouchableOpacity
              onPress={handleBroadcast}
              disabled={broadcastSaving}
              className="bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
            >
              {broadcastSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : broadcastSaved ? (
                <Check size={16} color="#fff" />
              ) : (
                <Save size={16} color="#fff" />
              )}
              <Text className="text-white font-semibold ml-2">
                {broadcastSaved ? "Gemt!" : "Gem broadcast"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== FORSLAG ===== */}
        {tab === "forslag" && (
          feedback.length === 0 ? (
            <EmptyState icon={Lightbulb} color="#6b7280" text="Ingen forslag endnu" />
          ) : (
            feedback.map((item) => (
              <View key={item.row} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                  <Text className={`text-xs px-2 py-0.5 rounded ${item.status === "læst" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/10 text-blue-400"}`}>
                    {item.status === "læst" ? "Læst" : "Ny"}
                  </Text>
                  <Text className="text-gray-500 text-xs">{item.type}</Text>
                  <Text className="text-gray-600 text-xs ml-auto">{item.user} · {item.dato}</Text>
                </View>
                <Text className="text-white font-semibold text-sm">{item.emne}</Text>
                <Text className="text-gray-400 text-sm mt-1">{item.beskrivelse}</Text>
                <View className="flex-row mt-3" style={{ gap: 8 }}>
                  {item.status !== "læst" && (
                    <TouchableOpacity
                      onPress={() => handleMarkRead(item)}
                      className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-xl py-2.5 flex-row items-center justify-center"
                    >
                      <Eye size={14} color="#60a5fa" />
                      <Text className="text-blue-400 text-xs font-semibold ml-1.5">Markér læst</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteFeedback(item)}
                    className="flex-1 bg-red-600/20 border border-red-500/30 rounded-xl py-2.5 flex-row items-center justify-center"
                  >
                    <Trash2 size={14} color="#f87171" />
                    <Text className="text-red-400 text-xs font-semibold ml-1.5">Slet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Image lightbox */}
      <Modal visible={!!lightboxUrl} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/90 items-center justify-center" onPress={() => setLightboxUrl(null)}>
          {lightboxUrl && <Image source={{ uri: lightboxUrl }} style={{ width: "90%", height: "70%" }} contentFit="contain" />}
          <TouchableOpacity onPress={() => setLightboxUrl(null)} className="absolute top-12 right-4 p-2">
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({ icon: Icon, color, text }: { icon: typeof Check; color: string; text: string }) {
  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-10 items-center">
      <Icon size={32} color={color} />
      <Text className="text-gray-400 text-sm mt-3">{text}</Text>
    </View>
  );
}

function StatCard({ icon: Icon, color, label, value }: { icon: typeof Check; color: string; label: string; value: number }) {
  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4" style={{ width: "48%" }}>
      <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon size={16} color={color} />
        </View>
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}
