import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Database, Layers, UserCircle, Menu } from "lucide-react-native";
import type { TabParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import BibliotekStack from "./BibliotekStack";
import MyCardsScreen from "../screens/MyCardsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MoreStack from "./MoreStack";

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#030712",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Hjem"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BibliotekStack"
        component={BibliotekStack}
        options={{
          tabBarLabel: "Bibliotek",
          tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mine kort"
        component={MyCardsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mere"
        component={MoreStack}
        options={{
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
