import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { studentScheduleApi, type ScheduleRecord } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const dayAbbreviations: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

const dayColors: Record<string, string> = {
  Monday: Colors.primary,
  Tuesday: "#7C3AED",
  Wednesday: "#059669",
  Thursday: "#D97706",
  Friday: "#DC2626",
};

function ScheduleCard({ item, index }: { item: ScheduleRecord; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={styles.scheduleCard}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeStart}>{item.timeStart}</Text>
          <View style={styles.timeDivider}>
            <View style={styles.timeDot} />
            <View style={styles.timeLine} />
            <View style={styles.timeDot} />
          </View>
          <Text style={styles.timeEnd}>{item.timeEnd}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardSubjectCode}>{item.subjectCode}</Text>
          <Text style={styles.cardSubjectName}>{item.subjectName}</Text>
          <View style={styles.cardDetailsRow}>
            <View style={styles.cardDetail}>
              <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.cardDetailText}>{item.room}</Text>
            </View>
            <View style={styles.cardDetail}>
              <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.cardDetailText}>{item.instructor}</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: allItems = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["student-schedule"],
    queryFn: studentScheduleApi.list,
  });

  const schedule = allItems.filter((item) => item.day === selectedDay);

  const getCountForDay = useCallback(
    (day: string) => allItems.filter((item) => item.day === day).length,
    [allItems]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Text style={styles.headerTitle}>Class Schedule</Text>
        <Text style={styles.headerSubtitle}>1st Semester, AY 2024-2025</Text>
      </View>

      <View style={styles.daySelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day) => {
            const isSelected = day === selectedDay;
            const dayColor = dayColors[day];
            return (
              <Pressable
                key={day}
                style={[
                  styles.dayButton,
                  isSelected && { backgroundColor: dayColor },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDay(day);
                }}
              >
                <Text style={[styles.dayAbbrev, isSelected && styles.dayAbbrevSelected]}>
                  {dayAbbreviations[day]}
                </Text>
                <Text style={[styles.dayCount, isSelected && styles.dayCountSelected]}>
                  {isLoading ? "…" : getCountForDay(day)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading schedule…</Text>
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Could Not Load Schedule</Text>
          <Text style={styles.emptySubtitle}>Check your connection and try again</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ScheduleCard item={item} index={index} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.dayHeader}>
              <View style={[styles.dayHeaderDot, { backgroundColor: dayColors[selectedDay] }]} />
              <Text style={styles.dayHeaderText}>{selectedDay}</Text>
              <Text style={styles.dayHeaderCount}>
                {schedule.length} {schedule.length === 1 ? "class" : "classes"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Classes</Text>
              <Text style={styles.emptySubtitle}>
                You have no scheduled classes on {selectedDay}
              </Text>
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
  daySelector: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  daySelectorContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dayButton: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    minWidth: 64,
    gap: 2,
  },
  dayAbbrev: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  dayAbbrevSelected: { color: Colors.white },
  dayCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary },
  dayCountSelected: { color: "rgba(255, 255, 255, 0.8)" },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  listContent: { padding: 16, gap: 10 },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dayHeaderDot: { width: 8, height: 8, borderRadius: 4 },
  dayHeaderText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text, flex: 1 },
  dayHeaderCount: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  scheduleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  timeColumn: { alignItems: "center", marginRight: 14, paddingVertical: 2 },
  timeStart: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary },
  timeDivider: { alignItems: "center", flex: 1, paddingVertical: 4 },
  timeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  timeLine: { width: 1.5, flex: 1, backgroundColor: `${Colors.primary}30` },
  timeEnd: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary },
  cardContent: { flex: 1 },
  cardSubjectCode: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.primary, letterSpacing: 0.5, marginBottom: 2 },
  cardSubjectName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, marginBottom: 10 },
  cardDetailsRow: { gap: 6 },
  cardDetail: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDetailText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  retryButton: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 20 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.white },
});
