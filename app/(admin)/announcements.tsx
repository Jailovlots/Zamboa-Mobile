import { useState } from "react";
import {
  StyleSheet, Text, View, FlatList, Pressable, Platform,
  TextInput, Modal, Alert, ActivityIndicator, ScrollView, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { adminAnnouncementsApi, type AnnouncementRecord } from "@/lib/api";
import Colors from "@/constants/colors";

const CATEGORIES = ["Academic", "Event", "Scholarship", "General"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Academic: { bg: "#EBF0F9", text: Colors.primary },
  Event: { bg: "#F3EEFE", text: "#7C3AED" },
  Scholarship: { bg: "#FEF3E2", text: "#D97706" },
  General: { bg: "#ECFDF5", text: "#059669" },
};

interface AnnFormData {
  title: string; description: string; date: string; isImportant: boolean; category: string;
}

const emptyForm = (): AnnFormData => ({
  title: "", description: "",
  date: new Date().toISOString().split("T")[0],
  isImportant: false, category: CATEGORIES[0],
});

function AnnModal({ visible, onClose, editAnn }: {
  visible: boolean; onClose: () => void; editAnn?: AnnouncementRecord | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!editAnn;
  const [form, setForm] = useState<AnnFormData>(editAnn ? { ...editAnn } : emptyForm());
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: adminAnnouncementsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["student-announcements"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementRecord> }) => adminAnnouncementsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["student-announcements"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required."); return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isEdit && editAnn) { updateMut.mutate({ id: editAnn.id, data: form }); }
    else { createMut.mutate(form); }
  };

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Announcement" : "Post Announcement"}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!!error && (
              <View style={styles.modalError}>
                <Ionicons name="alert-circle" size={15} color={Colors.error} />
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput} value={form.title}
                onChangeText={(v) => { setForm((f) => ({ ...f, title: v })); setError(""); }}
                placeholder="Announcement title" placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.formInput, { height: 120, textAlignVertical: "top" }]}
                value={form.description}
                onChangeText={(v) => { setForm((f) => ({ ...f, description: v })); setError(""); }}
                placeholder="Write the full announcement..." placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.formInput} value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                placeholder="2025-01-01" placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const colors = CATEGORY_COLORS[cat];
                  const isSelected = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.catChip, isSelected && { backgroundColor: colors.bg, borderColor: colors.text }]}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                    >
                      <Text style={[styles.catChipText, isSelected && { color: colors.text }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="alert-circle" size={18} color={Colors.gold} />
                <View>
                  <Text style={styles.switchTitle}>Mark as Important</Text>
                  <Text style={styles.switchSubtitle}>Highlighted with gold banner</Text>
                </View>
              </View>
              <Switch
                value={form.isImportant}
                onValueChange={(v) => setForm((f) => ({ ...f, isImportant: v }))}
                trackColor={{ false: Colors.border, true: Colors.gold }}
                thumbColor={Colors.white}
              />
            </View>

            <Pressable style={[styles.saveButton, isBusy && { opacity: 0.7 }]} onPress={handleSave} disabled={isBusy}>
              {isBusy ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Post Announcement"}</Text>}
            </Pressable>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AnnCard({ item, index, onEdit, onDelete }: {
  item: AnnouncementRecord; index: number; onEdit: (a: AnnouncementRecord) => void; onDelete: (a: AnnouncementRecord) => void;
}) {
  const catColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General;
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <View style={[styles.annCard, item.isImportant && styles.importantCard]}>
        {item.isImportant && (
          <View style={styles.importantBanner}>
            <Ionicons name="alert-circle" size={13} color={Colors.white} />
            <Text style={styles.importantText}>Important</Text>
          </View>
        )}
        <View style={styles.annBody}>
          <View style={styles.annTopRow}>
            <View style={[styles.catBadge, { backgroundColor: catColors.bg }]}>
              <Text style={[styles.catBadgeText, { color: catColors.text }]}>{item.category}</Text>
            </View>
            <Text style={styles.annDate}>{item.date}</Text>
          </View>
          <Text style={styles.annTitle}>{item.title}</Text>
          <Text style={styles.annDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.annFooter}>
            <Pressable style={styles.annActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(item); }}>
              <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
              <Text style={[styles.annActionText, { color: Colors.primary }]}>Edit</Text>
            </Pressable>
            <Pressable style={styles.annActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item); }}>
              <Ionicons name="trash-outline" size={15} color={Colors.error} />
              <Text style={[styles.annActionText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AnnouncementsAdminScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editAnn, setEditAnn] = useState<AnnouncementRecord | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: adminAnnouncementsApi.list,
  });

  const deleteMut = useMutation({
    mutationFn: adminAnnouncementsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["student-announcements"] });
    },
  });

  const handleDelete = (ann: AnnouncementRecord) => {
    const doDelete = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); deleteMut.mutate(ann.id); };
    if (Platform.OS === "web") { doDelete(); return; }
    Alert.alert("Delete Announcement", `Delete "${ann.title}"?`, [
      { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSubtitle}>{announcements.length} posts</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => { setEditAnn(null); setModal(true); }}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnnCard
              item={item} index={index}
              onEdit={(a) => { setEditAnn(a); setModal(true); }}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + webBottomInset }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!announcements.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptySubtitle}>Tap + to post an announcement</Text>
            </View>
          }
        />
      )}

      <AnnModal
        visible={modal}
        onClose={() => { setModal(false); setEditAnn(null); }}
        editAnn={editAnn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 16,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 12, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  annCard: {
    backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  importantCard: { borderWidth: 1.5, borderColor: Colors.gold },
  importantBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 6,
  },
  importantText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.white },
  annBody: { padding: 14 },
  annTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  annDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textTertiary },
  annTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text, marginBottom: 4, lineHeight: 21 },
  annDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  annFooter: { flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  annActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  annActionText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
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
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.surfaceSecondary, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },
  switchLabel: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  switchTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  switchSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.white },
});
