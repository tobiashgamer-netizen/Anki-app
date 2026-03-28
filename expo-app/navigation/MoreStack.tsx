import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "./types";
import MoreScreen from "../screens/MoreScreen";
import CreateCardScreen from "../screens/CreateCardScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import AdminScreen from "../screens/AdminScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#030712" },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreScreen} />
      <Stack.Screen name="OpretKort" component={CreateCardScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
    </Stack.Navigator>
  );
}
