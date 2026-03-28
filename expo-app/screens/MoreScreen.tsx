import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  User, PlusCircle, Trophy, Lightbulb, ShieldCheck,
  LogOut, ChevronRight, Trash2,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { clearProgress } from "../lib/srs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const menuItems = [
  { label: "Opret kort", icon: PlusCircle, color: "#60a5fa", screen: "OpretKort" },
  { label: "Leaderboard", icon: Trophy, color: "#fbbf24", screen: "Leaderboard" },
  { label: "Giv forslag", icon: Lightbulb, color: "#34d399", screen: "Feedback" },
];

export default function MoreScreen({ navigation }: Props) {
  const { bruger, rolle, logout } = useAuth();

  const handleReset = () => {
    Alert.alert("Nulstil fremgang", "Er du sikker? Al SRS-fremgang slettes.", [
      { text: "Annuller", style: "cancel" },
      {
        text: "Nulstil", style: "destructive", onPress: async () => {
          await clearProgress();
          Alert.alert("Nulstillet", "Din fremgang er slettet.");
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Log ud", "Er du sikker?", [
      { text: "Annuller", style: "cancel" },
      { text: "Log ud", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top"]}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4 mb-6 flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">{bruger?.charAt(0)?.toUpperCase() || "?"}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">{bruger}</Text>
            <View className="flex-row items-center mt-0.5" style={{ gap: 6 }}>
              <User size={12} color="#6b7280" />
              <Text className="text-gray-500 text-sm">{rolle === "admin" ? "Administrator" : "Elev"}</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 ml-1">Navigation</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row items-center"
            activeOpacity={0.7}
          >
            <item.icon size={20} color={item.color} />
            <Text className="text-white font-semibold ml-3 flex-1">{item.label}</Text>
            <ChevronRight size={16} color="#6b7280" />
          </TouchableOpacity>
        ))}

        {/* Admin */}
        {rolle === "admin" && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate("Admin"); }}
            className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mb-2 flex-row items-center"
            activeOpacity={0.7}
          >
            <ShieldCheck size={20} color="#60a5fa" />
            <Text className="text-blue-400 font-semibold ml-3 flex-1">Admin Panel</Text>
            <ChevronRight size={16} color="#60a5fa" />
          </TouchableOpacity>
        )}

        {/* Danger zone */}
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 ml-1 mt-6">Konto</Text>

        <TouchableOpacity
          onPress={handleReset}
          className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row items-center"
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#f87171" />
          <Text className="text-red-400 font-semibold ml-3 flex-1">Nulstil fremgang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-600/10 border border-red-500/20 rounded-xl p-4 mb-2 flex-row items-center"
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-400 font-semibold ml-3 flex-1">Log ud</Text>
        </TouchableOpacity>

        <View className="items-center mt-8 mb-6">
          <Text className="text-gray-700 text-xs">Anki Pro v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
