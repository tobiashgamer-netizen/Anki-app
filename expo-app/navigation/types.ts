import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  OpretKort: undefined;
  Leaderboard: undefined;
  Feedback: undefined;
  Admin: undefined;
};

export type BibliotekStackParamList = {
  BibliotekMain: undefined;
  PracticeSession: {
    category?: string;
    deckname?: string;
    owner?: string;
  };
};

export type TabParamList = {
  Hjem: undefined;
  BibliotekStack: NavigatorScreenParams<BibliotekStackParamList> | undefined;
  "Mine kort": undefined;
  Profil: undefined;
  Mere: NavigatorScreenParams<MoreStackParamList> | undefined;
};
