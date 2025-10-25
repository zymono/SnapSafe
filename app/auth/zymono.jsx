import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  colors,
  typography,
  components,
  spacing,
  borderRadius,
} from "../../styles/theme";

WebBrowser.maybeCompleteAuthSession();

const ZYMONO_CLIENT_ID = "YOUR_ZYMONO_CLIENT_ID";
const ZYMONO_REDIRECT_URI = AuthSession.makeRedirectUri({
  path: "auth/zymono",
});
const ZYMONO_AUTH_URL = "https://zymono.com/oauth/authorize";
const ZYMONO_TOKEN_URL = "https://zymono.com/oauth/token";

export default function ZymonoLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ZYMONO_CLIENT_ID,
      redirectUri: ZYMONO_REDIRECT_URI,
      responseType: "code",
      scopes: ["openid", "profile", "email"],
    },
    { authorizationEndpoint: ZYMONO_AUTH_URL },
  );

  useEffect(() => {
    try {
      if (response) {
        console.log(response);
        const { code } = response.params;
        if (code) {
          // Store code in AsyncStorage
          AsyncStorage.setItem("zymonoAuth_uid", code)
            .then(() => console.log("Auth code saved!"))
            .catch((err) => console.error("Failed to save auth code", err));
          AsyncStorage.setItem("zymonoAuth_email", response.params.email)
            .then(() => console.log("Auth email saved!"))
            .catch((err) => console.error("Failed to save auth email", err));
          AsyncStorage.setItem(
            "zymonoAuth_displayName",
            response.params.displayName,
          )
            .then(() => console.log("Auth name saved!"))
            .catch((err) => console.error("Failed to save auth name", err));

          // Alert.alert('Success 🎉', 'You are logged in with Zymono!');
          router.replace("/(tabs)");

          // Wait a tick for storage to persist
          setTimeout(() => {
            router.replace("/(tabs)"); // Go through RootLayout again
          }, 300);

          // Wait a tick for storage to persist
          setTimeout(() => {
            router.replace("/(tabs)"); // Go through RootLayout again
          }, 600);

          setTimeout(() => {
            router.replace("/(tabs)"); // Go through RootLayout again
          }, 1000);

          setTimeout(() => {
            router.replace("/(tabs)"); // Go through RootLayout again
          }, 1500);

          setTimeout(() => {
            router.replace("/(tabs)"); // Go through RootLayout again
          }, 2000);
        } else {
          console.warn("No auth code found in response", response);
        }
      }
    } catch (err) {
      router.replace("/auth/zymono");
    }
  }, [response]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sign in with Zymono 🔐</Text>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={colors.textOnPrimary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.buttonText}>Continue with Zymono</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: spacing.lg }}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...components.container,
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xxl,
    textAlign: "center",
  },
  button: {
    ...components.buttonPrimary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  linkText: {
    textAlign: "center",
    color: colors.primary,
    fontWeight: "500",
  },
});
