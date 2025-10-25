import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../utils/firebase";

export default function RootLayout() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(null);
  const [zymonoUid, setZymonoUid] = useState(null);
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();

  // Load Zymono account
  const loadZymono = async () => {
    try {
      const uid = await AsyncStorage.getItem("zymonoAuth_uid");
      setZymonoUid(uid);
    } catch (err) {
      console.error("Failed to load Zymono UID", err);
      setZymonoUid(null);
    }
  };

  // Listen for Firebase auth changes
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) setIsUserAuthenticated(true);
  //     else loadZymono();
  //   });
  //   return unsubscribe;
  // }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsUserAuthenticated(true);
      } else {
        // User signed out of Firebase
        await loadZymono();
        const zymonoUid = await AsyncStorage.getItem("zymonoAuth_uid");

        if (zymonoUid) {
          setZymonoUid(zymonoUid);
          setIsUserAuthenticated(true);
        } else {
          setZymonoUid(null);
          setIsUserAuthenticated(false);
          router.replace("/auth/login"); // 👈 immediate redirect
        }
      }
    });

    return unsubscribe;
  }, []);


  // Watch for Zymono UID
  useEffect(() => {
    if (zymonoUid) setIsUserAuthenticated(true);
    else if (!auth.currentUser) setIsUserAuthenticated(false);
  }, [zymonoUid]);

  // Poll AsyncStorage
  useEffect(() => {
    const interval = setInterval(loadZymono, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🚫 Block normal access to /auth/login unless ?allow=true
  useEffect(() => {
    const inLoginPage = segments[0] === "auth" && segments[1] === "login";
    const allowed = params.allow === "true";

    if (inLoginPage && !allowed && isUserAuthenticated === false) {
      // redirect to home or tabs if direct access
      router.replace("/"); // or wherever you want
    }
  }, [segments, params, isUserAuthenticated]);

  if (isUserAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={isUserAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isUserAuthenticated}>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="auth/zymono" options={{ headerShown: false }} />
    </Stack>
  );
}
