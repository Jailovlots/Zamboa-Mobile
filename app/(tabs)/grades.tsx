import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { studentGradesApi, type GradeRecord } from "@/lib/api";

function GradeCard({ item, index }: { item: GradeRecord; index: number }) {
  const gradeNum = parseFloat(item.grade);
  const gradeColor =
    gradeNum <= 1.5
      ? Colors.success
      : gradeNum <= 2.0
        ? "#2563EB"
        : gradeNum <= 2.5
          ? Colors.warning
          : Colors.error;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={styles.gradeCard}>
        <View style={styles.gradeCardLeft}>
          <View style={[styles.gradeCodeBadge, { backgroundColor: `${gradeColor}14` }]}>
            <Text style={[styles.gradeCodeText, { color: gradeColor }]}>{item.subjectCode}</Text>
          </View>
          <Text style={styles.subjectName}>{item.subjectName}</Text>
          <View style={styles.instructorRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.instructorText}>{item.instructor}</Text>
          </View>
          <View style={styles.unitsRow}>
            <Ionicons name="book-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.unitsText}>{item.units} units</Text>
          </View>
        </View>
        <View style={styles.gradeCardRight}>
          <View style={[styles.gradeBubble, { backgroundColor: `${gradeColor}18` }]}>
            <Text style={[styles.gradeValue, { color: gradeColor }]}>{item.grade}</Text>
          </View>
          <Text style={[styles.remarksText, { color: gradeColor }]}>{item.remarks}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const {
    data: allGrades = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["student-grades"],
    queryFn: studentGradesApi.list,
  });

  // Derive semesters from fetched data
  const semesters = [...new Set(allGrades.map((g) => g.semester))];

  // Auto-select first semester when data loads
  const activeSemester = selectedSemester ?? semesters[0] ?? null;

  const grades = activeSemester
    ? allGrades.filter((g) => g.semester === activeSemester)
    : allGrades;

  const totalUnits = grades.reduce((acc, g) => acc + g.units, 0);
  const gwa =
    totalUnits > 0
      ? grades.reduce((acc, g) => acc + parseFloat(g.grade) * g.units, 0) / totalUnits
      : 0;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderHeader = () => (
    <>
      {semesters.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.semesterSelectorContent}
          style={styles.semesterSelector}
        >
          {semesters.map((sem) => {
            const isActive = sem === activeSemester;
            return (
              <Pressable
                key={sem}
                style={[styles.semesterChip, isActive && styles.semesterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSemester(sem);
                }}
              >
                <Text style={[styles.semesterChipText, isActive && styles.semesterChipTextActive]}>
                  {sem}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{isLoading ? "—" : gwa.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>GWA</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{isLoading ? "—" : totalUnits}</Text>
          <Text style={styles.summaryLabel}>Total Units</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{isLoading ? "—" : grades.length}</Text>
          <Text style={styles.summaryLabel}>Subjects</Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Text style={styles.headerTitle}>My Grades</Text>
        <Text style={styles.headerSubtitle}>
          {activeSemester || "Loading…"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your grades…</Text>
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Could Not Load Grades</Text>
          <Text style={styles.emptySubtitle}>Check your connection and try again</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={grades}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <GradeCard item={item} index={index} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Grades Available</Text>
              <Text style={styles.emptySubtitle}>Your grades will appear here once posted</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  semesterSelector: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  semesterSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  semesterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  semesterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  semesterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  semesterChipTextActive: {
    color: Colors.white,
  },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.primary },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  listContent: { padding: 16, gap: 10 },
  gradeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  gradeCardLeft: { flex: 1, marginRight: 12 },
  gradeCodeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  gradeCodeText: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.5 },
  subjectName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, marginBottom: 6 },
  instructorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  instructorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  unitsRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  unitsText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  gradeCardRight: { alignItems: "center", justifyContent: "center" },
  gradeBubble: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  gradeValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  remarksText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.white },
});
