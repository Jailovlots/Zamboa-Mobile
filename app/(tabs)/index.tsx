import { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { studentStatsApi, studentAnnouncementsApi } from "@/lib/api";
import Colors from "@/constants/colors";

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    icon: "document-text",
    label: "Grades",
    description: "View academic records",
    route: "/(tabs)/grades",
    color: Colors.primary,
    bgColor: "#EBF0F9",
  },
  {
    icon: "calendar",
    label: "Schedule",
    description: "Weekly class schedule",
    route: "/(tabs)/schedule",
    color: "#7C3AED",
    bgColor: "#F3EEFE",
  },
  {
    icon: "megaphone",
    label: "Announcements",
    description: "School updates",
    route: "/announcements",
    color: "#D97706",
    bgColor: "#FEF3E2",
  },
  {
    icon: "person",
    label: "Profile",
    description: "Student information",
    route: "/(tabs)/profile",
    color: "#059669",
    bgColor: "#ECFDF5",
  },
];

function QuickActionCard({ action, index }: { action: QuickAction; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 100).duration(500)}>
      <Pressable
        style={({ pressed }) => [
          styles.actionCard,
          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(action.route as any);
        }}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: action.bgColor }]}>
          <Ionicons name={action.icon} size={26} color={action.color} />
        </View>
        <Text style={styles.actionLabel}>{action.label}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { student, isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats"],
    queryFn: studentStatsApi.get,
    enabled: isAuthenticated,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["student-announcements"],
    queryFn: studentAnnouncementsApi.list,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading]);

  if (!student) return null;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + webBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 + webTopInset }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingLabel}>Welcome back,</Text>
                <Text style={styles.greetingName}>
                  {student.firstName} {student.lastName}
                </Text>
              </View>
              <Pressable
                style={styles.notificationButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/announcements" as any);
                }}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.white} />
              </Pressable>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{student.studentId}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Year Level</Text>
                <Text style={styles.infoValue}>{student.yearLevel}</Text>
              </View>
            </View>
            <View style={styles.courseRow}>
              <Ionicons name="school-outline" size={16} color={Colors.primary} />
              <Text style={styles.courseText}>{student.course}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{student.status}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={action.label} action={action} index={index} />
            ))}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.semesterCard}>
          <View style={styles.semesterHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.semesterTitle}>Current Semester</Text>
          </View>
          <Text style={styles.semesterValue}>
            {stats?.currentSemester ?? "—"}
          </Text>
          <View style={styles.semesterStats}>
            <View style={styles.semesterStatItem}>
              {statsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNumber}>{stats?.totalSubjects ?? "—"}</Text>
              )}
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.semesterStatItem}>
              {statsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNumber}>{stats?.totalUnits ?? "—"}</Text>
              )}
              <Text style={styles.statLabel}>Units</Text>
            </View>
            <View style={styles.semesterStatItem}>
              {statsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNumber}>{stats?.gwa.toFixed(2) ?? "—"}</Text>
              )}
              <Text style={styles.statLabel}>GWA</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Announcements</Text>
          {announcementsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : !announcements || announcements.length === 0 ? (
            <View style={styles.emptyAnnouncements}>
              <Ionicons name="megaphone-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyAnnouncementsText}>No announcements yet.</Text>
            </View>
          ) : (
            <View style={styles.announcementsList}>
              {announcements.map((item, i) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(700 + i * 100).duration(400)}>
                  <View style={[styles.announcementCard, item.isImportant && styles.announcementCardImportant]}>
                    <View style={styles.announcementHeader}>
                      <View style={styles.announcementMeta}>
                        <View style={[styles.categoryBadge, item.isImportant && styles.categoryBadgeImportant]}>
                          <Text style={[styles.categoryText, item.isImportant && styles.categoryTextImportant]}>
                            {item.category}
                          </Text>
                        </View>
                        {item.isImportant && (
                          <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        )}
                      </View>
                      <Text style={styles.announcementDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.announcementTitle, item.isImportant && { color: Colors.error }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.announcementDesc}>{item.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  greetingName: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.white,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  infoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  courseText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.success,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 3,
  },
  actionDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  semesterCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  semesterTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  semesterValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  semesterStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  semesterStatItem: {
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyAnnouncements: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyAnnouncementsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  announcementsList: { gap: 12 },
  announcementCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  announcementCardImportant: {
    borderLeftColor: Colors.error,
    backgroundColor: "#FEF2F2",
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  announcementMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeImportant: { backgroundColor: "#FEE2E2" },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryTextImportant: { color: Colors.error },
  announcementDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  announcementTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 6,
  },
  announcementDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
