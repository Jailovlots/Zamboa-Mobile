import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading: authLoading, role } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, authLoading, role]);

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.primary }]}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (isAuthenticated) return null;

  const handleLogin = async () => {
    setError("");
    if (!username.trim()) { setError("Please enter your Student ID or username"); return; }
    if (!password.trim()) { setError("Please enter your password"); return; }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await login(username.trim(), password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    }
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
        style={[styles.container, { paddingTop: insets.top + webTopInset }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topSection}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={48} color={Colors.gold} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(300).duration(600)} style={styles.schoolName}>
            ZDSPGC
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400).duration(600)} style={styles.schoolSubtitle}>
            Zamboanga Del Sur{"\n"}Provincial Government College
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(500).duration(600)} style={styles.portalLabel}>
            Student Portal
          </Animated.Text>
        </View>

        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={[styles.formCard, { paddingBottom: Math.max(insets.bottom, 20) + (Platform.OS === "web" ? 34 : 0) }]}
        >
          {!!error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Student ID / Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 2024-0001 or admin"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={(text) => { setUsername(text); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.hintsContainer}>
            <Text style={styles.helpLabel}>Demo credentials:</Text>
            <Text style={styles.helpText}>Student: 2024-0001 / student123</Text>
            <Text style={styles.helpText}>Admin: admin / admin123</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  topSection: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoContainer: { marginBottom: 16 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(212,168,67,0.4)",
  },
  schoolName: { fontFamily: "Inter_700Bold", fontSize: 36, color: Colors.gold, letterSpacing: 4 },
  schoolSubtitle: {
    fontFamily: "Inter_400Regular", fontSize: 14,
    color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 4, lineHeight: 20,
  },
  portalLabel: {
    fontFamily: "Inter_600SemiBold", fontSize: 16,
    color: "rgba(255,255,255,0.6)", marginTop: 12, letterSpacing: 2, textTransform: "uppercase",
  },
  formCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 32, gap: 16,
  },
  errorContainer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.error, flex: 1 },
  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text, marginLeft: 4 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceSecondary, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1, fontFamily: "Inter_400Regular", fontSize: 15,
    color: Colors.text, paddingVertical: 14, paddingHorizontal: 10,
  },
  eyeButton: { padding: 14 },
  loginButton: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  loginButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.white, letterSpacing: 0.5 },
  hintsContainer: { alignItems: "center", gap: 2, marginTop: 4, paddingBottom: 4 },
  helpLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textSecondary },
  helpText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textTertiary },
});
