import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  interpolateColor, Easing,
} from "react-native-reanimated";
import { useAuth } from "../contexts/AuthContext";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated gradient
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.2,
  }));

  const handleSubmit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Udfyld begge felter");
      return;
    }
    if (mode === "register") {
      if (username.length < 2 || username.length > 30) {
        setError("Brugernavn skal være mellem 2 og 30 tegn");
        return;
      }
      if (password.length < 6) {
        setError("Adgangskode skal være mindst 6 tegn");
        return;
      }
    }

    setLoading(true);
    const result = mode === "login"
      ? await login(username, password)
      : await register(username, password);

    if (!result.success) {
      setError(result.error || "Noget gik galt");
    }
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1">
        {/* Animated gradient background */}
        <AnimatedGradient
          colors={["#1e3a5f", "#0f172a", "#1e1b4b", "#030712"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, animatedStyle]}
        />
        <View className="absolute inset-0 bg-black/40" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center px-8"
        >
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="bg-blue-600 w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg">
              <Text className="text-white font-bold text-2xl">A</Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-tight">Anki Pro</Text>
            <Text className="text-gray-400 text-sm mt-1">Til Politiholdet</Text>
          </View>

          {/* Form */}
          <View className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <Text className="text-white text-xl font-bold text-center mb-6">
              {mode === "login" ? "Log ind" : "Opret konto"}
            </Text>

            <View className="mb-4">
              <Text className="text-gray-400 text-xs mb-1.5 ml-1">Brugernavn</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Indtast brugernavn"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-xs mb-1.5 ml-1">Adgangskode</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Indtast adgangskode"
                placeholderTextColor="#6b7280"
                secureTextEntry
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm"
              />
            </View>

            {error ? (
              <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleSubmit(); }}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mt-2"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {mode === "login" ? "Log ind" : "Opret konto"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="mt-4 py-2"
            >
              <Text className="text-gray-400 text-sm text-center">
                {mode === "login"
                  ? "Har du ikke en konto? Opret en her"
                  : "Har du allerede en konto? Log ind"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
