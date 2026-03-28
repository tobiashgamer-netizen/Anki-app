export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Hjem: undefined;
  BibliotekStack: undefined;
  "Mine kort": undefined;
  Profil: undefined;
  Mere: undefined;
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
