// app/tabs/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "index",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="myreports"
        options={{
          title: "myreports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="organizations"
        options={{
          title: "organizations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
             <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
