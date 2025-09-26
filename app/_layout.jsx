import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../utils/firebase"; // your Firebase config

const AUTH_KEY = "isUserAuthenticated";

export default function RootLayout() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(null);

  useEffect(() => {
    const loadStoredAuthState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(AUTH_KEY);
        if (storedValue !== null) {
          setIsUserAuthenticated(storedValue === "true");
        }
      } catch (error) {
        console.error("Failed to load auth state from AsyncStorage", error);
      }
    };

    loadStoredAuthState();

    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isAuth = !!user;
      setIsUserAuthenticated(isAuth);

      // Persist the new state
      try {
        await AsyncStorage.setItem(AUTH_KEY, isAuth.toString());
      } catch (error) {
        console.error("Failed to save auth state to AsyncStorage", error);
      }
    });

    return unsubscribe;
  }, []);

  if (isUserAuthenticated === null) {
    return null; // Show splash screen or loading indicator
  }

  return (
    <Stack>
      <Stack.Protected guard={isUserAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isUserAuthenticated} >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}
