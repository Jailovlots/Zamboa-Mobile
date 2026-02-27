import { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, FlatList, Pressable, Platform,
  TextInput, Modal, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { adminScheduleApi, type ScheduleRecord } from "@/lib/api";
import Colors from "@/constants/colors";
import { DAYS } from "@/constants/data";

const DAY_COLORS: Record<string, string> = {
  Monday: Colors.primary, Tuesday: "#7C3AED", Wednesday: "#059669",
  Thursday: "#D97706", Friday: "#DC2626", Saturday: "#0891B2",
};

interface ScheduleFormData {
  subjectCode: string; subjectName: string; days: string[];
  timeStart: string; timeEnd: string; room: string; instructor: string;
}

const emptyForm: ScheduleFormData = {
  subjectCode: "", subjectName: "", days: [],
  timeStart: "", timeEnd: "", room: "", instructor: "",
};

function ScheduleModal({ visible, onClose, editItem }: {
  visible: boolean; onClose: () => void; editItem?: ScheduleRecord | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState<ScheduleFormData>(
    editItem ? { ...editItem, days: editItem.day.split(',').map(d => d.trim()).filter(Boolean) } : emptyForm
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setForm(editItem ? { ...editItem, days: editItem.day.split(',').map(d => d.trim()).filter(Boolean) } : emptyForm);
      setError("");
    }
  }, [visible, editItem]);

  const createMut = useMutation({
    mutationFn: adminScheduleApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-schedule"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleRecord> }) => adminScheduleApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-schedule"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const field = (key: keyof Omit<ScheduleFormData, "days">) => ({
    value: form[key],
    onChangeText: (v: string) => { setForm((f) => ({ ...f, [key]: v })); setError(""); },
  });

  const handleSave = () => {
    if (!form.subjectCode.trim() || form.days.length === 0 || !form.timeStart.trim() || !form.timeEnd.trim()) {
      setError("Subject Code, at least one Day, Start Time, and End Time are required."); return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const payload = {
      ...form,
      day: form.days.join(', ')
    };
    delete (payload as any).days;

    if (isEdit && editItem) { updateMut.mutate({ id: editItem.id, data: payload as Partial<ScheduleRecord> }); }
    else { createMut.mutate(payload as any); }
  };

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Schedule" : "Add Schedule"}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!!error && (
              <View style={styles.modalError}>
                <Ionicons name="alert-circle" size={15} color={Colors.error} />
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}
            <SFormField label="Subject Code *" {...field("subjectCode")} placeholder="e.g. IT 301" />
            <SFormField label="Subject Name" {...field("subjectName")} placeholder="e.g. Web Development" />
            <SFormField label="Instructor" {...field("instructor")} placeholder="e.g. Prof. Garcia" />
            <SFormField label="Room" {...field("room")} placeholder="e.g. CL-201" />
            <SFormField label="Start Time *" {...field("timeStart")} placeholder="e.g. 7:30 AM" />
            <SFormField label="End Time *" {...field("timeEnd")} placeholder="e.g. 9:00 AM" />
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Days *</Text>
              <View style={styles.dayGrid}>
                {DAYS.map((day) => (
                  <Pressable
                    key={day}
                    style={[styles.dayChip, form.days.includes(day) && { backgroundColor: DAY_COLORS[day], borderColor: DAY_COLORS[day] }]}
                    onPress={() => setForm((f) => ({
                      ...f,
                      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
                    }))}
                  >
                    <Text style={[styles.dayChipText, form.days.includes(day) && { color: Colors.white }]}>{day}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable style={[styles.saveButton, isBusy && { opacity: 0.7 }]} onPress={handleSave} disabled={isBusy}>
              {isBusy ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Add Schedule"}</Text>}
            </Pressable>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SFormField({ label, value, onChangeText, placeholder }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

function ScheduleCard({ item, index, onEdit, onDelete }: {
  item: ScheduleRecord; index: number; onEdit: (s: ScheduleRecord) => void; onDelete: (s: ScheduleRecord) => void;
}) {
  const days = item.day ? item.day.split(',').map(d => d.trim()).filter(Boolean) : [];
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <View style={styles.card}>
        <View style={styles.dayStripeContainer}>
          {days.length === 0 ? (
            <View style={[styles.dayStripe, { backgroundColor: Colors.primary }]} />
          ) : days.map((dayLine, i) => {
            const color = DAY_COLORS[dayLine] || Colors.primary;
            return (
              <View key={dayLine} style={[styles.dayStripe, { backgroundColor: color, borderTopWidth: i > 0 ? 1 : 0, borderColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.dayStripeText}>{dayLine.slice(0, 3)}</Text>
              </View>
            )
          })}
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardCode, { color: days.length ? DAY_COLORS[days[0]] || Colors.primary : Colors.primary }]}>{item.subjectCode}</Text>
          <Text style={styles.cardName}>{item.subjectName}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.timeStart} – {item.timeEnd}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.room || "TBA"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.instructor || "TBA"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <Pressable style={[styles.actionBtn, { backgroundColor: "#EBF0F9" }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(item); }}>
            <Ionicons name="pencil" size={15} color={Colors.primary} />
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item); }}>
            <Ionicons name="trash" size={15} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ScheduleAdminScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleRecord | null>(null);
  const [filterDay, setFilterDay] = useState<string>("");

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["admin-schedule"],
    queryFn: adminScheduleApi.list,
  });

  const deleteMut = useMutation({
    mutationFn: adminScheduleApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-schedule"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });

  const displayed = filterDay ? schedule.filter((s) => s.day && s.day.split(',').some(d => d.trim() === filterDay)) : schedule;

  const handleDelete = (item: ScheduleRecord) => {
    const doDelete = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); deleteMut.mutate(item.id); };
    if (Platform.OS === "web") { doDelete(); return; }
    Alert.alert("Delete Schedule", `Delete schedule for ${item.subjectCode} on ${item.day}?`, [
      { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Schedule</Text>
            <Text style={styles.headerSubtitle}>{schedule.length} class schedules</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => { setEditItem(null); setModal(true); }}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            style={[styles.dayFilter, !filterDay && styles.dayFilterActive]}
            onPress={() => setFilterDay("")}
          >
            <Text style={[styles.dayFilterText, !filterDay && styles.dayFilterTextActive]}>All</Text>
          </Pressable>
          {DAYS.map((day) => (
            <Pressable
              key={day}
              style={[styles.dayFilter, filterDay === day && { backgroundColor: DAY_COLORS[day], borderColor: DAY_COLORS[day] }]}
              onPress={() => setFilterDay(filterDay === day ? "" : day)}
            >
              <Text style={[styles.dayFilterText, filterDay === day && styles.dayFilterTextActive]}>
                {day.slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ScheduleCard
              item={item} index={index}
              onEdit={(s) => { setEditItem(s); setModal(true); }}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + webBottomInset }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!displayed.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Schedules</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a schedule</Text>
            </View>
          }
        />
      )}

      <ScheduleModal
        visible={modal}
        onClose={() => { setModal(false); setEditItem(null); }}
        editItem={editItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  dayFilter: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  dayFilterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayFilterText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  dayFilterTextActive: { color: Colors.white },
  listContent: { padding: 12, gap: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, flexDirection: "row",
    overflow: "hidden", shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  dayStripeContainer: { width: 48, flexDirection: "column" },
  dayStripe: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48, paddingVertical: 12 },
  dayStripeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.white, letterSpacing: 0.5 },
  cardContent: { flex: 1, padding: 14 },
  cardCode: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  cardName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, marginBottom: 8 },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  cardActions: { justifyContent: "center", gap: 8, paddingRight: 12 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  modalBody: { padding: 20 },
  modalError: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", padding: 12, borderRadius: 10, marginBottom: 12,
  },
  modalErrorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.error, flex: 1 },
  formField: { marginBottom: 14 },
  formLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text, marginBottom: 6 },
  formInput: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text,
    backgroundColor: Colors.surfaceSecondary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border,
  },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border,
  },
  dayChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.white },
});
