import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  User, Shield, Star, BookOpen, Brain, Target, Flame, Award,
  BadgeCheck, Swords, Scale, Gavel, FileText, Landmark, Users,
  GraduationCap, Briefcase, AlarmClock, Eye, Fingerprint,
  Handshake, HeartPulse, Map, Radio, Siren, ShieldCheck, ShieldAlert,
  Dog, Cat, Bird, Fish, Bug, Rabbit, Turtle,
  Skull, Ghost, Smile, Frown, Meh, Laugh, Angry,
  Crown, Medal, Trophy, Gem, Zap, Rocket, Truck,
  Bike, Car, Plane, Anchor, Compass, Mountain,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { hentAvatar, setAvatar as apiSetAvatar, hentAlleKort } from "../lib/api";
import { getSrsProgress } from "../lib/srs";

const AVATAR_LIST = [
  { id: "shield", Icon: Shield, label: "Skjold" },
  { id: "shieldcheck", Icon: ShieldCheck, label: "Verificeret" },
  { id: "shieldalert", Icon: ShieldAlert, label: "Alert" },
  { id: "siren", Icon: Siren, label: "Sirene" },
  { id: "gavel", Icon: Gavel, label: "Hammer" },
  { id: "scale", Icon: Scale, label: "Vægt" },
  { id: "landmark", Icon: Landmark, label: "Domhus" },
  { id: "swords", Icon: Swords, label: "Sværd" },
  { id: "target", Icon: Target, label: "Mål" },
  { id: "fingerprint", Icon: Fingerprint, label: "Fingeraftryk" },
  { id: "eye", Icon: Eye, label: "Øje" },
  { id: "handshake", Icon: Handshake, label: "Håndtryk" },
  { id: "radio", Icon: Radio, label: "Radio" },
  { id: "badgecheck", Icon: BadgeCheck, label: "Badge" },
  { id: "graduation", Icon: GraduationCap, label: "Eksamenshat" },
  { id: "briefcase", Icon: Briefcase, label: "Mappe" },
  { id: "filetext", Icon: FileText, label: "Dokument" },
  { id: "alarm", Icon: AlarmClock, label: "Alarm" },
  { id: "users", Icon: Users, label: "Hold" },
  { id: "brain", Icon: Brain, label: "Hjerne" },
  { id: "bookopen", Icon: BookOpen, label: "Bog" },
  { id: "star", Icon: Star, label: "Stjerne" },
  { id: "flame", Icon: Flame, label: "Flamme" },
  { id: "crown", Icon: Crown, label: "Krone" },
  { id: "medal", Icon: Medal, label: "Medalje" },
  { id: "trophy", Icon: Trophy, label: "Pokal" },
  { id: "award", Icon: Award, label: "Pris" },
  { id: "gem", Icon: Gem, label: "Diamant" },
  { id: "zap", Icon: Zap, label: "Lyn" },
  { id: "rocket", Icon: Rocket, label: "Raket" },
  { id: "heartpulse", Icon: HeartPulse, label: "Puls" },
  { id: "map", Icon: Map, label: "Kort" },
  { id: "compass", Icon: Compass, label: "Kompas" },
  { id: "mountain", Icon: Mountain, label: "Bjerg" },
  { id: "dog", Icon: Dog, label: "Hund" },
  { id: "cat", Icon: Cat, label: "Kat" },
  { id: "bird", Icon: Bird, label: "Fugl" },
  { id: "fish", Icon: Fish, label: "Fisk" },
  { id: "bug", Icon: Bug, label: "Insekt" },
  { id: "rabbit", Icon: Rabbit, label: "Kanin" },
  { id: "turtle", Icon: Turtle, label: "Skildpadde" },
  { id: "skull", Icon: Skull, label: "Kranie" },
  { id: "ghost", Icon: Ghost, label: "Spøgelse" },
  { id: "smile", Icon: Smile, label: "Glad" },
  { id: "laugh", Icon: Laugh, label: "Grin" },
  { id: "meh", Icon: Meh, label: "Meh" },
  { id: "frown", Icon: Frown, label: "Trist" },
  { id: "angry", Icon: Angry, label: "Vred" },
  { id: "truck", Icon: Truck, label: "Lastbil" },
  { id: "bike", Icon: Bike, label: "Cykel" },
  { id: "car", Icon: Car, label: "Bil" },
  { id: "plane", Icon: Plane, label: "Fly" },
  { id: "anchor", Icon: Anchor, label: "Anker" },
];

export default function ProfileScreen() {
  const { bruger, rolle } = useAuth();
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalCards, setTotalCards] = useState(0);
  const [reviewedCards, setReviewedCards] = useState(0);
  const [masteredCards, setMasteredCards] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [avatarRes, cardsRes, progress] = await Promise.all([
          hentAvatar(bruger),
          hentAlleKort(bruger),
          getSrsProgress(),
        ]);
        setAvatar(avatarRes.avatar || "");
        const myCards = cardsRes.kort?.filter((c) => c.user === bruger) || [];
        setTotalCards(myCards.length);
        const progressKeys = Object.keys(progress);
        setReviewedCards(progressKeys.length);
        setMasteredCards(progressKeys.filter((k) => progress[k].level === 2).length);
      } catch { /* */ } finally {
        setLoading(false);
      }
    })();
  }, [bruger]);

  const handleSelectAvatar = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    setAvatar(id);
    setShowPicker(false);
    await apiSetAvatar(bruger, id);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [bruger]);

  const selectedAvatar = AVATAR_LIST.find((a) => a.id === avatar);
  const AvatarIcon = selectedAvatar?.Icon || User;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pt-4 pb-2 flex-row items-center">
          <User size={24} color="#60a5fa" />
          <Text className="text-white text-2xl font-bold ml-3">Profil</Text>
        </View>

        {/* Avatar + Name */}
        <View className="items-center mt-4 mb-6">
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPicker(true); }}
            className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/40 items-center justify-center mb-3"
            activeOpacity={0.7}
          >
            <AvatarIcon size={40} color="#60a5fa" />
            {saving && <ActivityIndicator size="small" color="#60a5fa" style={{ position: "absolute" }} />}
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{bruger}</Text>
          <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
            <View className={`px-2.5 py-0.5 rounded-full ${rolle === "admin" ? "bg-blue-500/20" : "bg-gray-500/20"}`}>
              <Text className={`text-xs font-semibold ${rolle === "admin" ? "text-blue-400" : "text-gray-400"}`}>
                {rolle === "admin" ? "Administrator" : "Elev"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPicker(true); }}
            className="mt-2"
          >
            <Text className="text-blue-400 text-sm">Skift avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 ml-1">Statistik</Text>
        <View className="flex-row mb-4" style={{ gap: 8 }}>
          <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 items-center">
            <BookOpen size={20} color="#60a5fa" />
            <Text className="text-white text-xl font-bold mt-2">{totalCards}</Text>
            <Text className="text-blue-400/70 text-xs mt-0.5">Mine kort</Text>
          </View>
          <View className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 items-center">
            <Target size={20} color="#fbbf24" />
            <Text className="text-white text-xl font-bold mt-2">{reviewedCards}</Text>
            <Text className="text-amber-400/70 text-xs mt-0.5">Øvet</Text>
          </View>
          <View className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 items-center">
            <Star size={20} color="#34d399" />
            <Text className="text-white text-xl font-bold mt-2">{masteredCards}</Text>
            <Text className="text-emerald-400/70 text-xs mt-0.5">Mestret</Text>
          </View>
        </View>

        {/* Avatar Picker */}
        {showPicker && (
          <View className="mb-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3 ml-1">Vælg avatar</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {AVATAR_LIST.map((item) => {
                const isSelected = avatar === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectAvatar(item.id)}
                    className={`w-[60px] h-[60px] rounded-xl items-center justify-center border ${
                      isSelected
                        ? "bg-blue-600/30 border-blue-500/50"
                        : "bg-white/5 border-white/10"
                    }`}
                    activeOpacity={0.7}
                  >
                    <item.Icon size={24} color={isSelected ? "#60a5fa" : "#9ca3af"} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
