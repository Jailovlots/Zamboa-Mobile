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
import { adminStudentsApi, adminGradesApi, type StudentRecord, type GradeRecord } from "@/lib/api";
import Colors from "@/constants/colors";

const SEMESTERS = ["1st Semester 2024-2025", "2nd Semester 2024-2025", "Summer 2025"];

interface GradeFormData {
  studentId: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  grade: string;
  units: string;
  semester: string;
}

const emptyGradeForm = (studentId = ""): GradeFormData => ({
  studentId, subjectCode: "", subjectName: "", instructor: "",
  grade: "", units: "3", semester: SEMESTERS[0],
});

function GradeModal({
  visible, onClose, studentId, editGrade,
}: {
  visible: boolean; onClose: () => void; studentId: string; editGrade?: GradeRecord | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!editGrade;
  const [form, setForm] = useState<GradeFormData>(
    editGrade
      ? { ...editGrade, units: String(editGrade.units) }
      : emptyGradeForm(studentId)
  );
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: adminGradesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-grades"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeRecord> }) => adminGradesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-grades"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const field = (key: keyof GradeFormData) => ({
    value: form[key],
    onChangeText: (v: string) => { setForm((f) => ({ ...f, [key]: v })); setError(""); },
  });

  const handleSave = () => {
    if (!form.subjectCode.trim() || !form.grade.trim()) {
      setError("Subject Code and Grade are required.");
      return;
    }
    const gradeNum = parseFloat(form.grade);
    if (isNaN(gradeNum) || gradeNum < 1.0 || gradeNum > 5.0) {
      setError("Grade must be a number between 1.0 and 5.0.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const payload = { ...form, units: parseInt(form.units) || 3 };
    if (isEdit && editGrade) {
      updateMut.mutate({ id: editGrade.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isBusy = createMut.isPending || updateMut.isPending;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Grade" : "Add Grade"}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!!error && (
              <View style={styles.modalError}>
                <Ionicons name="alert-circle" size={15} color={Colors.error} />
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}
            <GFormField label="Subject Code *" {...field("subjectCode")} placeholder="e.g. IT 301" />
            <GFormField label="Subject Name" {...field("subjectName")} placeholder="e.g. Web Development" />
            <GFormField label="Instructor" {...field("instructor")} placeholder="e.g. Prof. Garcia" />
            <GFormField label="Grade * (1.0–5.0)" {...field("grade")} placeholder="e.g. 1.25" keyboardType="decimal-pad" />
            <GFormField label="Units" {...field("units")} keyboardType="number-pad" placeholder="3" />
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Semester</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SEMESTERS.map((sem) => (
                  <Pressable
                    key={sem}
                    style={[styles.chip, form.semester === sem && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, semester: sem }))}
                  >
                    <Text style={[styles.chipText, form.semester === sem && styles.chipTextActive]}>{sem}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Pressable style={[styles.saveButton, isBusy && { opacity: 0.7 }]} onPress={handleSave} disabled={isBusy}>
              {isBusy ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Add Grade"}</Text>}
            </Pressable>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function GFormField({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={Colors.textTertiary} keyboardType={keyboardType}
      />
    </View>
  );
}

function GradeCard({ item, index, onEdit, onDelete }: {
  item: GradeRecord; index: number; onEdit: (g: GradeRecord) => void; onDelete: (g: GradeRecord) => void;
}) {
  const gradeNum = parseFloat(item.grade);
  const color = gradeNum <= 1.5 ? Colors.success : gradeNum <= 2.0 ? Colors.primary : gradeNum <= 2.5 ? Colors.warning : Colors.error;
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <View style={styles.gradeCard}>
        <View style={[styles.gradeScore, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.gradeValue, { color }]}>{item.grade}</Text>
          <Text style={[styles.gradeRemarks, { color }]}>{item.remarks}</Text>
        </View>
        <View style={styles.gradeInfo}>
          <Text style={styles.gradeCode}>{item.subjectCode}</Text>
          <Text style={styles.gradeName}>{item.subjectName}</Text>
          <Text style={styles.gradeInstructor}>{item.instructor} · {item.units} units</Text>
          <Text style={styles.gradeSem}>{item.semester}</Text>
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

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [gradeModal, setGradeModal] = useState(false);
  const [editGrade, setEditGrade] = useState<GradeRecord | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: adminStudentsApi.list,
  });
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["admin-grades", selectedStudentId],
    queryFn: () => adminGradesApi.list(selectedStudentId || undefined),
    enabled: true,
  });

  const deleteMut = useMutation({
    mutationFn: adminGradesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-grades"] }),
  });

  const displayGrades = useMemo(() => {
    if (!selectedStudentId) return grades;
    return grades.filter((g) => g.studentId === selectedStudentId);
  }, [grades, selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleDelete = (grade: GradeRecord) => {
    const doDelete = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); deleteMut.mutate(grade.id); };
    if (Platform.OS === "web") { doDelete(); return; }
    Alert.alert("Delete Grade", `Delete grade for ${grade.subjectCode}?`, [
      { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Grades</Text>
            <Text style={styles.headerSubtitle}>
              {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "All students"}
            </Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => { setEditGrade(null); setGradeModal(true); }}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>

        <Text style={styles.filterLabel}>Filter by Student</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <Pressable
            style={[styles.studentChip, !selectedStudentId && styles.studentChipActive]}
            onPress={() => setSelectedStudentId("")}
          >
            <Text style={[styles.studentChipText, !selectedStudentId && styles.studentChipTextActive]}>All</Text>
          </Pressable>
          {students.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]}
              onPress={() => setSelectedStudentId(s.id)}
            >
              <Text style={[styles.studentChipText, selectedStudentId === s.id && styles.studentChipTextActive]}>
                {s.firstName} {s.lastName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {gradesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayGrades}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <GradeCard
              item={item} index={index}
              onEdit={(g) => { setEditGrade(g); setGradeModal(true); }}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + webBottomInset }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!displayGrades.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Grades Found</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a grade record</Text>
            </View>
          }
        />
      )}

      <GradeModal
        visible={gradeModal}
        onClose={() => { setGradeModal(false); setEditGrade(null); }}
        studentId={selectedStudentId || (students[0]?.id ?? "")}
        editGrade={editGrade}
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  filterLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  studentChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  studentChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  studentChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  studentChipTextActive: { color: Colors.white },
  listContent: { padding: 12, gap: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  gradeCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  gradeScore: {
    width: 56, alignItems: "center", justifyContent: "center",
    borderRadius: 12, paddingVertical: 10, marginRight: 12,
  },
  gradeValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  gradeRemarks: { fontFamily: "Inter_500Medium", fontSize: 9, marginTop: 2 },
  gradeInfo: { flex: 1 },
  gradeCode: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.primary, letterSpacing: 0.5 },
  gradeName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, marginTop: 2 },
  gradeInstructor: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  gradeSem: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  cardActions: { gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
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
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  chipTextActive: { color: Colors.white },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.white },
});
