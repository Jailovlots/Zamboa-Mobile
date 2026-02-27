import { useState, useMemo, useEffect } from "react";
import {
    StyleSheet, Text, View, FlatList, Pressable, Platform,
    TextInput, Modal, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    adminSectionsApi, adminStudentsApi,
    type SectionRecord, type StudentRecord,
} from "@/lib/api";
import Colors from "@/constants/colors";
import { COURSES, YEAR_LEVELS } from "@/constants/data";

// ── Form helpers ──────────────────────────────────────────────────────────────

function FormField({ label, value, onChangeText, placeholder }: {
    label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
}) {
    return (
        <View style={styles.formField}>
            <Text style={styles.formLabel}>{label}</Text>
            <TextInput
                style={styles.formInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
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
                <Pressable
                    style={[styles.pickerChip, value === "" && styles.pickerChipActive]}
                    onPress={() => onChange("")}
                >
                    <Text style={[styles.pickerChipText, value === "" && styles.pickerChipTextActive]}>Any</Text>
                </Pressable>
                {options.map((opt) => (
                    <Pressable
                        key={opt}
                        style={[styles.pickerChip, value === opt && styles.pickerChipActive]}
                        onPress={() => onChange(opt)}
                    >
                        <Text style={[styles.pickerChipText, value === opt && styles.pickerChipTextActive]}>{opt}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

// ── Section Modal ─────────────────────────────────────────────────────────────

interface SectionForm {
    name: string;
    course: string;
    yearLevel: string;
    schoolYear: string;
    description: string;
}
const emptySection: SectionForm = { name: "", course: "", yearLevel: "", schoolYear: "", description: "" };

function SectionModal({ visible, onClose, editSection }: {
    visible: boolean;
    onClose: () => void;
    editSection?: SectionRecord | null;
}) {
    const qc = useQueryClient();
    const isEdit = !!editSection;
    const [form, setForm] = useState<SectionForm>(
        editSection ? { ...editSection } : emptySection
    );
    const [error, setError] = useState("");

    useEffect(() => {
        if (visible) {
            setForm(editSection ? { ...editSection } : emptySection);
            setError("");
        }
    }, [visible, editSection]);

    const field = (key: keyof SectionForm) => ({
        value: form[key],
        onChangeText: (v: string) => { setForm((f) => ({ ...f, [key]: v })); setError(""); },
    });

    const createMut = useMutation({
        mutationFn: adminSectionsApi.create,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sections"] }); onClose(); },
        onError: (e: any) => setError(e.message),
    });
    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SectionRecord> }) =>
            adminSectionsApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sections"] }); onClose(); },
        onError: (e: any) => setError(e.message),
    });

    const handleSave = () => {
        if (!form.name.trim()) { setError("Section name is required."); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isEdit && editSection) {
            updateMut.mutate({ id: editSection.id, data: form });
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
                        <Text style={styles.modalTitle}>{isEdit ? "Edit Section" : "New Section"}</Text>
                        <Pressable onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
                    </View>
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {!!error && (
                            <View style={styles.modalError}>
                                <Ionicons name="alert-circle" size={15} color={Colors.error} />
                                <Text style={styles.modalErrorText}>{error}</Text>
                            </View>
                        )}
                        <FormField label="Section Name *" placeholder="e.g. BSIS-1A" {...field("name")} />
                        <PickerField label="Course" options={COURSES} value={form.course} onChange={(v) => setForm((f) => ({ ...f, course: v }))} />
                        <PickerField label="Year Level" options={YEAR_LEVELS} value={form.yearLevel} onChange={(v) => setForm((f) => ({ ...f, yearLevel: v }))} />
                        <FormField label="School Year" placeholder="e.g. 2024-2025" {...field("schoolYear")} />
                        <FormField label="Description" placeholder="Optional notes..." {...field("description")} />
                        <Pressable style={[styles.saveButton, isBusy && { opacity: 0.7 }]} onPress={handleSave} disabled={isBusy}>
                            {isBusy ? <ActivityIndicator color={Colors.white} size="small" /> : (
                                <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Create Section"}</Text>
                            )}
                        </Pressable>
                        <View style={{ height: 24 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ── Assign Students Modal ─────────────────────────────────────────────────────

function AssignModal({ visible, onClose, section }: {
    visible: boolean;
    onClose: () => void;
    section: SectionRecord;
}) {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const { data: allStudents = [] } = useQuery({
        queryKey: ["admin-students"],
        queryFn: adminStudentsApi.list,
    });
    const { data: sectionStudents = [] } = useQuery({
        queryKey: ["section-students", section.id],
        queryFn: () => adminSectionsApi.listStudents(section.id),
        enabled: visible,
    });

    const assignedIds = new Set(sectionStudents.map((s) => s.id));
    const unassigned = useMemo(() => {
        return allStudents.filter((s) => !assignedIds.has(s.id) && s.sectionId === null);
    }, [allStudents, sectionStudents]);

    const filtered = useMemo(() => {
        if (!search.trim()) return unassigned;
        const q = search.toLowerCase();
        return unassigned.filter((s) =>
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.studentId.toLowerCase().includes(q)
        );
    }, [unassigned, search]);

    const assignMut = useMutation({
        mutationFn: () => adminSectionsApi.assign(section.id, Array.from(selected)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["section-students", section.id] });
            qc.invalidateQueries({ queryKey: ["admin-students"] });
            setSelected(new Set());
            onClose();
        },
    });

    const removeMut = useMutation({
        mutationFn: (studentId: string) => adminSectionsApi.removeStudent(section.id, studentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["section-students", section.id] });
            qc.invalidateQueries({ queryKey: ["admin-students"] });
        },
    });

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalSheet, { maxHeight: "95%" }]}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Manage Students</Text>
                            <Text style={styles.modalSubtitle}>{section.name}</Text>
                        </View>
                        <Pressable onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
                    </View>

                    {/* Currently in section */}
                    {sectionStudents.length > 0 && (
                        <View style={styles.assignedSection}>
                            <Text style={styles.assignedLabel}>In This Section ({sectionStudents.length})</Text>
                            <ScrollView style={{ maxHeight: 140 }}>
                                {sectionStudents.map((s) => (
                                    <View key={s.id} style={styles.assignedRow}>
                                        <View style={styles.assignedAvatar}>
                                            <Text style={styles.assignedAvatarText}>{s.firstName[0]}{s.lastName[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.assignedName}>{s.firstName} {s.lastName}</Text>
                                            <Text style={styles.assignedId}>{s.studentId}</Text>
                                        </View>
                                        <Pressable
                                            style={styles.removeBtn}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                removeMut.mutate(s.id);
                                            }}
                                        >
                                            <Ionicons name="person-remove" size={15} color={Colors.error} />
                                        </Pressable>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Add from unassigned */}
                    <View style={styles.assignSearchBar}>
                        <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.assignSearchInput}
                            placeholder="Search unassigned students..."
                            placeholderTextColor={Colors.textTertiary}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                        {filtered.length === 0 ? (
                            <View style={styles.assignEmpty}>
                                <Text style={styles.assignEmptyText}>
                                    {unassigned.length === 0 ? "All students are already assigned to a section." : "No matching students."}
                                </Text>
                            </View>
                        ) : (
                            filtered.map((s) => {
                                const checked = selected.has(s.id);
                                return (
                                    <Pressable key={s.id} style={styles.assignStudentRow} onPress={() => toggle(s.id)}>
                                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                            {checked && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                                        </View>
                                        <View style={styles.assignAvatarSm}>
                                            <Text style={styles.assignAvatarSmText}>{s.firstName[0]}{s.lastName[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.assignedName}>{s.firstName} {s.lastName}</Text>
                                            <Text style={styles.assignedId}>{s.studentId} · {s.yearLevel}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>

                    {selected.size > 0 && (
                        <View style={styles.assignFooter}>
                            <Pressable
                                style={[styles.assignBtn, assignMut.isPending && { opacity: 0.7 }]}
                                onPress={() => assignMut.mutate()}
                                disabled={assignMut.isPending}
                            >
                                {assignMut.isPending ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <Text style={styles.assignBtnText}>Assign {selected.size} Student{selected.size > 1 ? "s" : ""}</Text>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ item, index, onEdit, onDelete, onManage }: {
    item: SectionRecord;
    index: number;
    onEdit: (s: SectionRecord) => void;
    onDelete: (s: SectionRecord) => void;
    onManage: (s: SectionRecord) => void;
}) {
    const { data: sectionStudents = [] } = useQuery({
        queryKey: ["section-students", item.id],
        queryFn: () => adminSectionsApi.listStudents(item.id),
    });

    return (
        <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
            <Pressable
                style={({ pressed }) => [styles.sectionCard, pressed && { opacity: 0.95 }]}
                onPress={() => onManage(item)}
            >
                <View style={styles.sectionIconBox}>
                    <Ionicons name="layers" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionName}>{item.name}</Text>
                    <Text style={styles.sectionMeta} numberOfLines={1}>
                        {[item.course, item.yearLevel, item.schoolYear].filter(Boolean).join(" · ")}
                    </Text>
                    {!!item.description && (
                        <Text style={styles.sectionDesc} numberOfLines={1}>{item.description}</Text>
                    )}
                    <View style={styles.sectionFooter}>
                        <View style={styles.studentCountBadge}>
                            <Ionicons name="people" size={12} color={Colors.primary} />
                            <Text style={styles.studentCountText}>{sectionStudents.length} student{sectionStudents.length !== 1 ? "s" : ""}</Text>
                        </View>
                        <Text style={styles.tapHint}>Tap to manage →</Text>
                    </View>
                </View>
                <View style={styles.sectionActions}>
                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: "#EBF0F9" }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(item); }}
                    >
                        <Ionicons name="pencil" size={15} color={Colors.primary} />
                    </Pressable>
                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item); }}
                    >
                        <Ionicons name="trash" size={15} color={Colors.error} />
                    </Pressable>
                </View>
            </Pressable>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SectionsScreen() {
    const insets = useSafeAreaInsets();
    const qc = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [assignVisible, setAssignVisible] = useState(false);
    const [editSection, setEditSection] = useState<SectionRecord | null>(null);
    const [manageSection, setManageSection] = useState<SectionRecord | null>(null);
    const [search, setSearch] = useState("");

    const webTopInset = Platform.OS === "web" ? 67 : 0;
    const webBottomInset = Platform.OS === "web" ? 34 : 0;

    const { data: sections = [], isLoading } = useQuery({
        queryKey: ["admin-sections"],
        queryFn: adminSectionsApi.list,
    });

    const deleteMut = useMutation({
        mutationFn: adminSectionsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-sections"] });
            qc.invalidateQueries({ queryKey: ["admin-students"] });
        },
    });

    const filtered = useMemo(() => {
        if (!search.trim()) return sections;
        const q = search.toLowerCase();
        return sections.filter((s) =>
            s.name.toLowerCase().includes(q) ||
            s.course.toLowerCase().includes(q) ||
            s.yearLevel.toLowerCase().includes(q)
        );
    }, [sections, search]);

    const handleDelete = (section: SectionRecord) => {
        const doDelete = () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMut.mutate(section.id);
        };
        if (Platform.OS === "web") { doDelete(); return; }
        Alert.alert(
            "Delete Section",
            `Delete "${section.name}"? Students in this section will be unassigned.`,
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doDelete }]
        );
    };

    const handleEdit = (section: SectionRecord) => { setEditSection(section); setModalVisible(true); };
    const handleAdd = () => { setEditSection(null); setModalVisible(true); };
    const handleManage = (section: SectionRecord) => { setManageSection(section); setAssignVisible(true); };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Sections</Text>
                        <Text style={styles.headerSubtitle}>{sections.length} section{sections.length !== 1 ? "s" : ""}</Text>
                    </View>
                    <Pressable style={styles.addButton} onPress={handleAdd}>
                        <Ionicons name="add" size={22} color={Colors.white} />
                    </Pressable>
                </View>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search sections..."
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
                    <Text style={styles.loadingText}>Loading sections...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <SectionCard
                            item={item}
                            index={index}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onManage={handleManage}
                        />
                    )}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 + webBottomInset }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="layers-outline" size={52} color={Colors.textTertiary} />
                            <Text style={styles.emptyTitle}>{search ? "No results found" : "No Sections Yet"}</Text>
                            <Text style={styles.emptySubtitle}>
                                {search ? "Try a different search term" : "Tap the + button to create a section"}
                            </Text>
                        </View>
                    }
                />
            )}

            <SectionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                editSection={editSection}
            />

            {manageSection && (
                <AssignModal
                    visible={assignVisible}
                    onClose={() => setAssignVisible(false)}
                    section={manageSection}
                />
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
    emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
    emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },

    // Section card
    sectionCard: {
        backgroundColor: Colors.white, borderRadius: 14, padding: 14,
        flexDirection: "row", alignItems: "flex-start", gap: 12,
        shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
    },
    sectionIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "#EBF0F9", justifyContent: "center", alignItems: "center",
    },
    sectionName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
    sectionMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    sectionDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
    sectionFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    studentCountBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#EBF0F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    studentCountText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.primary },
    tapHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary },
    sectionActions: { gap: 8 },
    actionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
    modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
    modalHeader: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
    modalSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
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

    // Assign modal
    assignedSection: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceSecondary },
    assignedLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
    assignedRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    assignedAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
    },
    assignedAvatarText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.white },
    assignedName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
    assignedId: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary },
    removeBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center",
    },
    assignSearchBar: {
        flexDirection: "row", alignItems: "center", gap: 8,
        margin: 12, backgroundColor: Colors.surfaceSecondary,
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    assignSearchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text },
    assignStudentRow: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 2, borderColor: Colors.border,
        justifyContent: "center", alignItems: "center",
    },
    checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    assignAvatarSm: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary + "33", justifyContent: "center", alignItems: "center",
    },
    assignAvatarSmText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.primary },
    assignEmpty: { padding: 24, alignItems: "center" },
    assignEmptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textTertiary, textAlign: "center" },
    assignFooter: { padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
    assignBtn: {
        backgroundColor: Colors.primary, borderRadius: 12,
        paddingVertical: 13, alignItems: "center",
    },
    assignBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.white },
});
