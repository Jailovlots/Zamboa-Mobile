import { useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView,
  Pressable, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import { adminStatsApi, type AdminStats } from "@/lib/api";
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
  const { admin, isAuthenticated, isLoading: authLoading, role, logout } = useAuth();

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
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.white} />
            </Pressable>
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
  logoutButton: {
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
});
