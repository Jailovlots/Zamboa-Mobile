import { useState, useMemo } from "react";
import {
  StyleSheet, Text, View, FlatList, Pressable, Platform,
  TextInput, Modal, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { adminStudentsApi, type StudentRecord } from "@/lib/api";
import Colors from "@/constants/colors";

const COURSES = [
  "BS Information Technology",
  "BS Computer Science",
  "BS Education",
  "BS Business Administration",
  "BS Nursing",
  "BS Criminology",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const GENDERS = ["Male", "Female"];
const STATUSES = ["Regular", "Irregular", "Transferee", "Cross-Enrollee"];

interface StudentFormData {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  course: string;
  yearLevel: string;
  email: string;
  contactNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  password: string;
}

const emptyForm: StudentFormData = {
  studentId: "", firstName: "", lastName: "", middleName: "",
  course: COURSES[0], yearLevel: YEAR_LEVELS[0], email: "", contactNumber: "",
  address: "", dateOfBirth: "", gender: GENDERS[0], status: STATUSES[0], password: "student123",
};

function StudentModal({
  visible, onClose, editStudent,
}: {
  visible: boolean;
  onClose: () => void;
  editStudent?: StudentRecord | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<StudentFormData>(
    editStudent
      ? { ...emptyForm, ...editStudent, password: "student123" }
      : emptyForm
  );
  const [error, setError] = useState("");

  const isEdit = !!editStudent;

  const createMut = useMutation({
    mutationFn: adminStudentsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-students"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentRecord> }) => adminStudentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-students"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const field = (key: keyof StudentFormData) => ({
    value: form[key],
    onChangeText: (v: string) => { setForm((f) => ({ ...f, [key]: v })); setError(""); },
  });

  const handleSave = () => {
    if (!form.studentId.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError("Student ID, First Name, and Last Name are required.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isEdit && editStudent) {
      updateMut.mutate({ id: editStudent.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Student" : "Add Student"}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!!error && (
              <View style={styles.modalError}>
                <Ionicons name="alert-circle" size={15} color={Colors.error} />
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}
            <FormField label="Student ID *" {...field("studentId")} editable={!isEdit} />
            <FormField label="First Name *" {...field("firstName")} />
            <FormField label="Last Name *" {...field("lastName")} />
            <FormField label="Middle Name" {...field("middleName")} />
            <PickerField label="Course" options={COURSES} value={form.course} onChange={(v) => setForm((f) => ({ ...f, course: v }))} />
            <PickerField label="Year Level" options={YEAR_LEVELS} value={form.yearLevel} onChange={(v) => setForm((f) => ({ ...f, yearLevel: v }))} />
            <FormField label="Email" {...field("email")} keyboardType="email-address" />
            <FormField label="Contact Number" {...field("contactNumber")} keyboardType="phone-pad" />
            <FormField label="Address" {...field("address")} multiline />
            <FormField label="Date of Birth (YYYY-MM-DD)" {...field("dateOfBirth")} />
            <PickerField label="Gender" options={GENDERS} value={form.gender} onChange={(v) => setForm((f) => ({ ...f, gender: v }))} />
            <PickerField label="Status" options={STATUSES} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
            {!isEdit && <FormField label="Password" {...field("password")} secureTextEntry />}
            <Pressable
              style={[styles.saveButton, isBusy && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Add Student"}</Text>
              )}
            </Pressable>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label, value, onChangeText, multiline, keyboardType, secureTextEntry, editable = true,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  multiline?: boolean; keyboardType?: any; secureTextEntry?: boolean; editable?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && { height: 72, textAlignVertical: "top" }, !editable && { opacity: 0.5 }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

function PickerField({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.pickerChip, value === opt && styles.pickerChipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.pickerChipText, value === opt && styles.pickerChipTextActive]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function StudentCard({ item, index, onEdit, onDelete }: {
  item: StudentRecord; index: number;
  onEdit: (s: StudentRecord) => void; onDelete: (s: StudentRecord) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <View style={styles.studentCard}>
        <View style={styles.studentAvatarContainer}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>
              {item.firstName[0]}{item.lastName[0]}
            </Text>
          </View>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.studentId}>{item.studentId}</Text>
          <Text style={styles.studentCourse} numberOfLines={1}>{item.course}</Text>
          <View style={styles.studentMeta}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>{item.yearLevel}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === "Regular" ? styles.statusRegular : styles.statusIrregular]}>
              <Text style={[styles.statusBadgeText, item.status === "Regular" ? styles.statusRegularText : styles.statusIrregularText]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.studentActions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: "#EBF0F9" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(item); }}
          >
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item); }}
          >
            <Ionicons name="trash" size={16} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: adminStudentsApi.list,
  });

  const deleteMut = useMutation({
    mutationFn: adminStudentsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-students"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q)
    );
  }, [students, search]);

  const handleDelete = (student: StudentRecord) => {
    const doDelete = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); deleteMut.mutate(student.id); };
    if (Platform.OS === "web") { doDelete(); return; }
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete ${student.firstName} ${student.lastName}? This cannot be undone.`,
      [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doDelete }]
    );
  };

  const handleEdit = (student: StudentRecord) => { setEditStudent(student); setModalVisible(true); };
  const handleAdd = () => { setEditStudent(null); setModalVisible(true); };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Students</Text>
            <Text style={styles.headerSubtitle}>{students.length} enrolled students</Text>
          </View>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, name or course..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <StudentCard
              item={item}
              index={index}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 100 + webBottomInset },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>{search ? "No results found" : "No Students"}</Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try a different search term" : "Tap the + button to add a student"}
              </Text>
            </View>
          }
        />
      )}

      <StudentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editStudent={editStudent}
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surfaceSecondary, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text },
  listContent: { padding: 12, gap: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  studentCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  studentAvatarContainer: { marginRight: 12 },
  studentAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  studentAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.white },
  studentInfo: { flex: 1, marginRight: 8 },
  studentName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  studentId: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.primary, marginTop: 1 },
  studentCourse: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  studentMeta: { flexDirection: "row", gap: 6, marginTop: 6 },
  yearBadge: {
    backgroundColor: Colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  yearBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusRegular: { backgroundColor: "#ECFDF5" },
  statusIrregular: { backgroundColor: "#FEF3E2" },
  statusBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  statusRegularText: { color: Colors.success },
  statusIrregularText: { color: Colors.warning },
  studentActions: { gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
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
  pickerRow: { flexDirection: "row" },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  pickerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pickerChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  pickerChipTextActive: { color: Colors.white },
  saveButton: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 12,
  },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.white },
});
