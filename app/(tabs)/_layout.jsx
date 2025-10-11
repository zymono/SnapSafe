import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // 🎨 Define colors and shadows directly here
  const colors = {
    primary: "#007AFF",
    primaryLight: "#4DA3FF",
    surface: "#FFFFFF",
    darkSurface: "#121212",
    gray500: "#9E9E9E",
    gray300: "#BDBDBD",
  };

  const shadows = {
    small: {
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    none: {},
  };

  // 💡 Theme colors depending on mode
  const themeColors = {
    background: isDark ? colors.darkSurface : colors.surface,
    activeTint: isDark ? colors.primaryLight : colors.primary,
    inactiveTint: isDark ? colors.gray300 : colors.gray500,
    shadow: isDark ? shadows.none : shadows.small,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: themeColors.activeTint,
        tabBarInactiveTintColor: themeColors.inactiveTint,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          ...themeColors.shadow,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="myreports"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="organizations"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
