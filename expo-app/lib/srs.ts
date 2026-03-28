import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Flashcard, CardProgress } from "../types";

const STORAGE_KEY = "anki_progress";

const REVIEW_INTERVALS: Record<number, number> = {
  0: 60 * 1000,           // Svært: 1 minut
  1: 10 * 60 * 1000,      // Okay: 10 minutter
  2: 24 * 60 * 60 * 1000, // Let: 1 dag
};

export async function getSrsProgress(): Promise<Record<string, CardProgress>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function updateCardProgress(
  cardId: string,
  quality: 0 | 1 | 2
): Promise<void> {
  const progress = await getSrsProgress();
  const now = Date.now();
  progress[cardId] = {
    level: quality,
    lastSeen: now,
    nextReview: now + REVIEW_INTERVALS[quality],
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function getCardLevel(cardId: string): Promise<number> {
  const progress = await getSrsProgress();
  return progress[cardId]?.level ?? -1;
}

function srsScore(p: CardProgress | undefined, now: number): number {
  if (!p) return 1;                  // Nyt kort – høj prioritet
  if (p.nextReview <= now) return 0; // Overskredet – højeste prioritet
  if (p.level === 0) return 2;      // Svært – medium prioritet
  return 3 + (p.nextReview - now);   // Fremtidigt review
}

export async function sortByReviewPriority(cards: Flashcard[]): Promise<Flashcard[]> {
  const progress = await getSrsProgress();
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const pa = progress[a.question];
    const pb = progress[b.question];
    return srsScore(pa, now) - srsScore(pb, now);
  });
}

export function getStrengthSync(
  level: number
): { dots: number; color: string } {
  if (level === 2) return { dots: 3, color: "text-emerald-400" };
  if (level === 1) return { dots: 2, color: "text-amber-400" };
  if (level === 0) return { dots: 1, color: "text-red-400" };
  return { dots: 0, color: "text-gray-600" };
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
