import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PracticeScreen from "../screens/PracticeScreen";
import PracticeSessionScreen from "../screens/PracticeSessionScreen";

const Stack = createNativeStackNavigator();

export default function PracticeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#030712" },
      }}
    >
      <Stack.Screen name="CategorySelect" component={PracticeScreen} />
      <Stack.Screen name="PracticeSession" component={PracticeSessionScreen as any} />
    </Stack.Navigator>
  );
}
