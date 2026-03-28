import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { BibliotekStackParamList } from "./types";
import LibraryScreen from "../screens/LibraryScreen";
import PracticeSessionScreen from "../screens/PracticeSessionScreen";

const Stack = createNativeStackNavigator<BibliotekStackParamList>();

export default function BibliotekStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#030712" },
      }}
    >
      <Stack.Screen name="BibliotekMain" component={LibraryScreen} />
      <Stack.Screen name="PracticeSession" component={PracticeSessionScreen} />
    </Stack.Navigator>
  );
}
