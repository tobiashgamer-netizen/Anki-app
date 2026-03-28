import { getToken } from "./auth";
import type { Flashcard, FeedbackItem, ActivityRecord, BlindSpotItem, LeaderboardEntry } from "../types";

// Next.js API base URL
// In dev you can either use your local IP (if running Next.js locally) or Vercel directly
const API_BASE = "https://anki-app-mhve.vercel.app";

// Google Apps Script URL (same as web)
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw3toPy62PmxV9Dhj91Vb0sNjU8TE0DvfOdltiSObumJ8tHJyYif8Iia394edBiPtg6/exec";

// ===== Auth (via Next.js API) =====

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function loginUser(username: string, password: string) {
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function registerUser(username: string, password: string) {
  const res = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getMe() {
  const res = await authFetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}

// ===== Data (direct to Google Apps Script) =====

async function scriptGet(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${SCRIPT_URL}?${query}`, { redirect: "follow" });
  return res.json();
}

async function scriptPost(data: Record<string, unknown>) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data),
    redirect: "follow",
  });
  return res.json();
}

// Cards
export async function hentAlleKort(brugernavn?: string) {
  const params: Record<string, string> = { action: "getCards" };
  if (brugernavn) params.user = brugernavn;
  const data = await scriptGet(params);
  // GAS returns raw array
  return { success: true, kort: Array.isArray(data) ? data as Flashcard[] : [] };
}

export async function opretKort(data: {
  question: string;
  answer: string;
  category: string;
  user: string;
  public: boolean;
  deckname: string;
}) {
  return scriptPost(data);
}

export async function redigerKort(data: {
  row: number;
  question?: string;
  answer?: string;
  category?: string;
  public?: boolean;
  deckname?: string;
  user: string;
}) {
  return scriptPost({ action: "editCard", ...data });
}

export async function sletKort(row: number, user: string) {
  return scriptPost({ action: "deleteCard", row, user });
}

// Decks
export async function kopierDeck(data: {
  deckname: string;
  sourceOwner: string;
  user: string;
  newDeckname?: string;
}) {
  return scriptPost({ action: "copyDeck", ...data });
}

export async function likeDeck(data: { deckname: string; deckOwner: string }) {
  return scriptPost({ action: "likeDeck", ...data });
}

// Reports & Errors
export async function rapporterFejl(data: {
  question: string;
  reporter: string;
  message: string;
}) {
  return scriptPost({ action: "reportError", ...data });
}

export async function resolveError(data: {
  question: string;
  newQuestion?: string;
  newAnswer?: string;
}) {
  return scriptPost({ action: "resolveError", ...data });
}

// Verification
export async function verifyCard(data: { row: number; verified: boolean }) {
  return scriptPost({ action: "verifyCard", ...data });
}

// Broadcast
export async function saveBroadcast(message: string) {
  return scriptPost({ action: "saveBroadcast", message });
}

export async function hentBroadcast() {
  const data = await scriptGet({ action: "getBroadcast" });
  // GAS returns {message: "..."}
  return { success: true, message: data?.message || "" };
}

// Activity
export async function logActivity(user: string) {
  return scriptPost({ action: "logActivity", user });
}

export async function hentActivity() {
  const data = await scriptGet({ action: "getActivity" });
  // GAS returns raw array
  return { success: true, activity: Array.isArray(data) ? data as ActivityRecord[] : [] };
}

// Analytics
export async function logAnalytics(data: {
  user: string;
  question: string;
  quality: number;
}) {
  return scriptPost({ action: "logAnalytics", ...data });
}

export async function hentBlindSpot() {
  const data = await scriptGet({ action: "getBlindSpot" });
  // GAS returns raw array
  return { success: true, blindSpot: Array.isArray(data) ? data as BlindSpotItem[] : [] };
}

// Feedback
export async function sendFeedback(data: {
  emne: string;
  beskrivelse: string;
  type: string;
  user: string;
}) {
  return scriptPost({ action: "addFeedback", ...data });
}

export async function hentFeedback() {
  const data = await scriptGet({ action: "getFeedback" });
  // GAS returns raw array
  return { success: true, feedback: Array.isArray(data) ? data as FeedbackItem[] : [] };
}

export async function markFeedbackRead(row: number) {
  return scriptPost({ action: "markFeedbackRead", row });
}

export async function deleteFeedback(row: number) {
  return scriptPost({ action: "deleteFeedback", row });
}

// Leaderboard
export async function hentLeaderboard() {
  const data = await scriptGet({ action: "getLeaderboard" });
  return { success: true, leaderboard: Array.isArray(data) ? data as LeaderboardEntry[] : [] };
}

// Avatar
export async function hentAvatar(username: string) {
  const data = await scriptGet({ action: "getAvatar", username });
  return { avatar: data?.avatar || "" };
}

export async function setAvatar(username: string, avatar: string) {
  return scriptPost({ action: "setAvatar", username, avatar });
}
