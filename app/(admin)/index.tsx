import { useEffect, useState, useRef } from "react";
import {
  StyleSheet, Text, View, ScrollView,
  Pressable, Platform, ActivityIndicator,
  Modal, TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import { adminStatsApi, adminAccountApi, type AdminStats } from "@/lib/api";
import Colors from "@/constants/colors";

interface StatCard {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  key: keyof AdminStats;
  color: string;
  bgColor: string;
}

const statCards: StatCard[] = [
  { icon: "people", label: "Total Students", key: "totalStudents", color: Colors.primary, bgColor: "#EBF0F9" },
  { icon: "megaphone", label: "Announcements", key: "totalAnnouncements", color: "#7C3AED", bgColor: "#F3EEFE" },
  { icon: "school", label: "Courses", key: "courses", color: "#059669", bgColor: "#ECFDF5" },
  { icon: "calendar", label: "Schedules", key: "totalSchedules", color: "#D97706", bgColor: "#FEF3E2" },
];

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { icon: "people-outline", label: "Manage Students", route: "/(admin)/students", color: Colors.primary },
  { icon: "document-text-outline", label: "Manage Grades", route: "/(admin)/grades", color: "#7C3AED" },
  { icon: "calendar-outline", label: "Manage Schedule", route: "/(admin)/schedule", color: "#059669" },
  { icon: "megaphone-outline", label: "Post Announcement", route: "/(admin)/announcements", color: "#D97706" },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { admin, isAuthenticated, isLoading: authLoading, role, logout, setAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== "admin")) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, role]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminStatsApi.get,
    enabled: isAuthenticated && role === "admin",
  });

  if (!admin) return null;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/");
  };

  // ── Account Edit Modal Logic ────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleOpenSettings = () => {
    setNewUsername(admin.username || "");
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setNewUsername("");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setFormError("");
    setFormSuccess("");
  };

  const handleSaveSettings = async () => {
    setFormError("");
    setFormSuccess("");
    if (!currentPw.trim()) { setFormError("Current password is required."); return; }
    if (newPw && newPw !== confirmPw) { setFormError("New passwords do not match."); return; }
    if (newPw && newPw.length < 8) { setFormError("New password must be at least 8 characters."); return; }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload: { currentPassword: string; newUsername?: string; newPassword?: string } = {
        currentPassword: currentPw,
      };
      if (newUsername.trim() && newUsername !== admin.username) payload.newUsername = newUsername.trim();
      if (newPw.trim()) payload.newPassword = newPw;

      const result = await adminAccountApi.update(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFormSuccess("Admin account updated!");
      if (result.user && setAdmin) setAdmin(result.user as any);
      setTimeout(() => {
        handleCloseSettings();
      }, 1500);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + webBottomInset }]}
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={[styles.header, { paddingTop: insets.top + 20 + webTopInset }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerGreeting}>Admin Panel</Text>
              <Text style={styles.headerName}>
                {admin.firstName} {admin.lastName}
              </Text>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
                <Text style={styles.adminBadgeText}>System Administrator</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={styles.iconButton} onPress={handleOpenSettings}>
                <Ionicons name="settings-outline" size={20} color={Colors.white} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.white} />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {statCards.map((card, i) => (
              <Animated.View
                key={card.key}
                entering={FadeInDown.delay(i * 80).duration(400)}
                style={[styles.statCard]}
              >
                <View style={[styles.statIconContainer, { backgroundColor: card.bgColor }]}>
                  <Ionicons name={card.icon} size={24} color={card.color} />
                </View>
                {statsLoading ? (
                  <ActivityIndicator size="small" color={card.color} style={{ marginTop: 12 }} />
                ) : (
                  <Text style={[styles.statValue, { color: card.color }]}>
                    {stats ? stats[card.key] : "—"}
                  </Text>
                )}
                <Text style={styles.statLabel}>{card.label}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsList}>
            {quickActions.map((action, i) => (
              <Animated.View key={action.label} entering={FadeInDown.delay(300 + i * 70).duration(400)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(action.route as any);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}14` }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            ZDSPGC Admin Portal — Manage all student records, grades, schedules and announcements.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Admin Settings Modal ─────────────────────────────────────────── */}
      <Modal visible={showSettings} animationType="slide" transparent onRequestClose={handleCloseSettings}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admin Settings</Text>
              <Pressable onPress={handleCloseSettings}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!!formError && (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.alertText}>{formError}</Text>
                </View>
              )}
              {!!formSuccess && (
                <View style={[styles.alertBox, styles.alertSuccess]}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={[styles.alertText, { color: Colors.success }]}>{formSuccess}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Admin Username</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    value={newUsername}
                    onChangeText={(t) => { setNewUsername(t); setFormError(""); }}
                    placeholder="New admin username"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Required to save changes"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showCurrentPw}
                    value={currentPw}
                    onChangeText={(t) => { setCurrentPw(t); setFormError(""); }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => newPwRef.current?.focus()}
                  />
                  <Pressable onPress={() => setShowCurrentPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.sectionDivider}>Change Password (optional)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={newPwRef}
                    style={styles.inputField}
                    placeholder="Leave blank to keep current"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showNewPw}
                    value={newPw}
                    onChangeText={(t) => { setNewPw(t); setFormError(""); }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <Pressable onPress={() => setShowNewPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={confirmRef}
                    style={styles.inputField}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showConfirmPw}
                    value={confirmPw}
                    onChangeText={(t) => { setConfirmPw(t); setFormError(""); }}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveSettings}
                  />
                  <Pressable onPress={() => setShowConfirmPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
                {newPw.length > 0 && confirmPw.length > 0 && (
                  <View style={styles.reqRow}>
                    <Ionicons name={newPw === confirmPw ? "checkmark-circle" : "close-circle"} size={16} color={newPw === confirmPw ? Colors.success : Colors.error} />
                    <Text style={[styles.reqText, newPw === confirmPw ? styles.reqTextMet : { color: Colors.error }]}>
                      {newPw === confirmPw ? "Passwords match" : "Passwords do not match"}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]} onPress={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerGreeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  headerName: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.white, marginTop: 2 },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: `${Colors.gold}50`,
  },
  adminBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.gold },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
  },
  statsSection: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%", flexGrow: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  statIconContainer: {
    width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 2 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  actionsSection: { paddingHorizontal: 16, marginTop: 20 },
  actionsList: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  actionItem: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.text, flex: 1 },
  infoCard: {
    marginHorizontal: 16, marginTop: 16, flexDirection: "row", alignItems: "flex-start",
    gap: 10, backgroundColor: "#EBF0F9", borderRadius: 14, padding: 14,
  },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.primary, flex: 1, lineHeight: 20 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modalContainer: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  modalScroll: { flexGrow: 0 },
  modalBody: { padding: 20, gap: 16, paddingBottom: 36 },
  alertBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#FECACA",
  },
  alertSuccess: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  alertText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.error, flex: 1 },
  sectionDivider: {
    fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textTertiary,
    textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, marginBottom: 4,
  },
  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text, marginLeft: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
  },
  inputField: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.text, paddingVertical: 13, paddingHorizontal: 14 },
  eyeBtn: { paddingHorizontal: 14 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textTertiary },
  reqTextMet: { color: Colors.success },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.white },
});
