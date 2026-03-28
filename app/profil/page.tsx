"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/ui/auth-provider";
import {
  User, Save, Loader2, Check, Trophy, Target, BookOpen, Star,
  Heart, Flame, Zap, Crown, Shield, Gem, Ghost, Skull,
  Cat, Dog, Fish, Bird, Bug, Flower2, Trees, Mountain,
  Sun, Moon, CloudLightning, Snowflake, Sparkles, Rocket,
  Gamepad2, Music, Palette, Camera, Compass, Anchor,
  Plane, Car, Bike, Globe, Map, Coffee, Pizza, Cake,
  Gift, Bell, Headphones, Swords, Wand2, Dices,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Suspense } from "react";
import { hentAvatar, setAvatar, hentLeaderboard } from "@/app/dashboard/actions";

const AVATAR_ICONS: { name: string; icon: typeof User }[] = [
  { name: "user", icon: User },
  { name: "heart", icon: Heart },
  { name: "flame", icon: Flame },
  { name: "zap", icon: Zap },
  { name: "crown", icon: Crown },
  { name: "shield", icon: Shield },
  { name: "gem", icon: Gem },
  { name: "ghost", icon: Ghost },
  { name: "skull", icon: Skull },
  { name: "star", icon: Star },
  { name: "sparkles", icon: Sparkles },
  { name: "rocket", icon: Rocket },
  { name: "cat", icon: Cat },
  { name: "dog", icon: Dog },
  { name: "fish", icon: Fish },
  { name: "bird", icon: Bird },
  { name: "bug", icon: Bug },
  { name: "flower", icon: Flower2 },
  { name: "trees", icon: Trees },
  { name: "mountain", icon: Mountain },
  { name: "sun", icon: Sun },
  { name: "moon", icon: Moon },
  { name: "lightning", icon: CloudLightning },
  { name: "snowflake", icon: Snowflake },
  { name: "gamepad", icon: Gamepad2 },
  { name: "music", icon: Music },
  { name: "palette", icon: Palette },
  { name: "camera", icon: Camera },
  { name: "compass", icon: Compass },
  { name: "anchor", icon: Anchor },
  { name: "plane", icon: Plane },
  { name: "car", icon: Car },
  { name: "bike", icon: Bike },
  { name: "globe", icon: Globe },
  { name: "map", icon: Map },
  { name: "coffee", icon: Coffee },
  { name: "pizza", icon: Pizza },
  { name: "cake", icon: Cake },
  { name: "gift", icon: Gift },
  { name: "bell", icon: Bell },
  { name: "headphones", icon: Headphones },
  { name: "swords", icon: Swords },
  { name: "wand", icon: Wand2 },
  { name: "dices", icon: Dices },
  { name: "target", icon: Target },
  { name: "trophy", icon: Trophy },
  { name: "bookopen", icon: BookOpen },
];

interface LeaderboardEntry {
  user: string;
  total: number;
  correct: number;
  score: number;
}

function ProfileContent() {
  const { bruger, logout } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState("user");
  const [savedAvatar, setSavedAvatar] = useState("user");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Stats
  const [rank, setRank] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [avatarRes, lbRes] = await Promise.all([
          hentAvatar(bruger),
          hentLeaderboard(),
        ]);
        if (avatarRes.success && avatarRes.avatar) {
          setSelectedAvatar(avatarRes.avatar);
          setSavedAvatar(avatarRes.avatar);
        }
        if (lbRes.success && Array.isArray(lbRes.leaderboard)) {
          const entries = lbRes.leaderboard as LeaderboardEntry[];
          const idx = entries.findIndex((e) => e.user.toLowerCase() === bruger.toLowerCase());
          if (idx >= 0) {
            setRank(idx + 1);
            setScore(entries[idx].score);
            setTotal(entries[idx].total);
            setCorrect(entries[idx].correct);
          }
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bruger]);

  const handleSave = async () => {
    setSaving(true);
    await setAvatar(bruger, selectedAvatar);
    setSavedAvatar(selectedAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const currentIcon = AVATAR_ICONS.find((a) => a.name === selectedAvatar) || AVATAR_ICONS[0];
  const IconComp = currentIcon.icon;
  const hasChanged = selectedAvatar !== savedAvatar;

  const stats = [
    { label: "Rangering", value: rank > 0 ? `#${rank}` : "—", color: "from-amber-500 to-yellow-600" },
    { label: "Point", value: score.toLocaleString("da-DK"), color: "from-blue-500 to-cyan-600" },
    { label: "Kort øvet", value: total, color: "from-purple-500 to-pink-600" },
    { label: "Rigtige svar", value: correct, color: "from-emerald-500 to-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-4xl mx-auto">
          <div className="px-4 md:px-10 pt-6 md:pt-10 pb-2">
            <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
              <User className="w-7 h-7 md:w-9 md:h-9 text-blue-400" />
              Min profil
            </h1>
            <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-lg">Vælg avatar og se dine statistikker</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Henter profil...</p>
            </div>
          ) : (
            <>
              {/* Avatar preview + name */}
              <div className="px-4 md:px-10 py-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/20 mb-4">
                    <IconComp className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold">{bruger}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {rank > 0 ? `Rangeret #${rank}` : "Ikke rangeret endnu"}
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="px-4 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                    <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Avatar picker */}
              <div className="px-4 md:px-10 py-6">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="text-lg font-semibold mb-4 flex items-center gap-2 hover:opacity-80 transition"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Vælg avatar
                  {showPicker ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {showPicker && (
                <>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {AVATAR_ICONS.map((avatar) => {
                    const AIcon = avatar.icon;
                    const isSelected = avatar.name === selectedAvatar;
                    return (
                      <button
                        key={avatar.name}
                        onClick={() => setSelectedAvatar(avatar.name)}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-600/30 border-2 border-blue-500 scale-110 shadow-lg shadow-blue-500/20"
                            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105"
                        }`}
                      >
                        <AIcon className={`w-5 h-5 md:w-6 md:h-6 ${isSelected ? "text-blue-400" : "text-gray-400"}`} />
                      </button>
                    );
                  })}
                </div>

                {hasChanged && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saved ? "Gemt!" : "Gem avatar"}
                  </button>
                )}
                </>
                )}
              </div>

              {/* Logout */}
              <div className="px-4 md:px-10 pb-10">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-medium text-sm transition"
                >
                  Log ud
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <ProfileContent />
    </Suspense>
  );
}
