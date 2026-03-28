export interface Flashcard {
  row: number;
  question: string;
  answer: string;
  imageURL?: string;
  category: string;
  user: string;
  public: boolean;
  likes: number;
  deckname: string;
  verified?: boolean;
  likedBy?: string[];
  error_report?: string | null;
}

export interface CardProgress {
  level: number;
  lastSeen: number;
  nextReview: number;
}

export interface ActivityRecord {
  user: string;
  lastSeen: string;
}

export interface BlindSpotItem {
  question: string;
  count: number;
}

export interface FeedbackItem {
  row: number;
  dato: string;
  user: string;
  emne: string;
  beskrivelse: string;
  type: string;
  status: string;
}

export interface AuthState {
  bruger: string;
  rolle: "admin" | "bruger";
  loading: boolean;
}

export interface LeaderboardEntry {
  user: string;
  total: number;
  correct: number;
  score: number;
}
