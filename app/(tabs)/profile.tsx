import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { studentAccountApi } from "@/lib/api";
import Colors from "@/constants/colors";

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  index: number;
}

function InfoRow({ icon, label, value, index }: InfoRowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).duration(400)}>
      <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value || "—"}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Password requirement helpers ──────────────────────────────────────────────

interface Requirement {
  label: string;
  met: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", met: (pw) => pw.length >= 8 },
  { label: "At least one uppercase letter (A–Z)", met: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one lowercase letter (a–z)", met: (pw) => /[a-z]/.test(pw) },
  { label: "At least one number (0–9)", met: (pw) => /[0-9]/.test(pw) },
];

function RequirementRow({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={met ? Colors.success : Colors.textTertiary}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { student, logout, setStudent } = useAuth();

  // Change Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const newPwRef = useRef<TextInput>(null);
  const confirmPwRef = useRef<TextInput>(null);

  // Edit Account modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [acctCurrentPw, setAcctCurrentPw] = useState("");
  const [acctNewPw, setAcctNewPw] = useState("");
  const [acctConfirmPw, setAcctConfirmPw] = useState("");
  const [showAcctPw, setShowAcctPw] = useState(false);
  const [showAcctNewPw, setShowAcctNewPw] = useState(false);
  const [showAcctConfirmPw, setShowAcctConfirmPw] = useState(false);
  const [acctError, setAcctError] = useState("");
  const [acctSuccess, setAcctSuccess] = useState("");
  const [acctBusy, setAcctBusy] = useState(false);

  const acctNewPwRef = useRef<TextInput>(null);
  const acctConfirmRef = useRef<TextInput>(null);

  if (!student) return null;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const requirementsMet = REQUIREMENTS.every((r) => r.met(newPw));
  const allRequirementsMet = requirementsMet && newPw === confirmPw && currentPw.length > 0;

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setFormError("");
    setFormSuccess("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleChangePassword = async () => {
    setFormError("");
    setFormSuccess("");

    if (!currentPw.trim()) {
      setFormError("Please enter your current password.");
      return;
    }
    if (!requirementsMet) {
      setFormError("New password does not meet all requirements.");
      return;
    }
    if (newPw !== confirmPw) {
      setFormError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await api.post("/api/student/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFormSuccess("Password updated successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      // Close after brief delay so user sees the success message
      setTimeout(handleCloseModal, 1500);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle account edit (username + password)
  const handleCloseAccount = () => {
    setShowAccountModal(false);
    setNewUsername("");
    setAcctCurrentPw("");
    setAcctNewPw("");
    setAcctConfirmPw("");
    setAcctError("");
    setAcctSuccess("");
  };

  const handleSaveAccount = async () => {
    setAcctError("");
    setAcctSuccess("");
    if (!acctCurrentPw.trim()) { setAcctError("Current password is required."); return; }
    if (!newUsername.trim() && !acctNewPw.trim()) { setAcctError("Provide a new username or password to update."); return; }
    if (acctNewPw && acctNewPw !== acctConfirmPw) { setAcctError("New passwords do not match."); return; }
    if (acctNewPw && acctNewPw.length < 8) { setAcctError("New password must be at least 8 characters."); return; }

    setAcctBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload: { currentPassword: string; newStudentId?: string; newPassword?: string } = {
        currentPassword: acctCurrentPw,
      };
      if (newUsername.trim() && newUsername !== student.studentId) payload.newStudentId = newUsername.trim();
      if (acctNewPw.trim()) payload.newPassword = acctNewPw;

      const result = await studentAccountApi.update(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAcctSuccess("Account updated!");
      if (result.user && setStudent) setStudent(result.user);
      setTimeout(handleCloseAccount, 1500);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAcctError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setAcctBusy(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      logout().then(() => router.replace("/"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout().then(() => router.replace("/"));
        },
      },
    ]);
  };

  const infoItems: InfoRowProps[] = [
    { icon: "card-outline", label: "Student ID", value: student.studentId, index: 0 },
    { icon: "school-outline", label: "Course", value: student.course, index: 1 },
    { icon: "ribbon-outline", label: "Year Level", value: student.yearLevel, index: 2 },
    { icon: "mail-outline", label: "Email", value: student.email, index: 3 },
    { icon: "call-outline", label: "Contact", value: student.contactNumber, index: 4 },
    { icon: "location-outline", label: "Address", value: student.address, index: 5 },
    { icon: "calendar-outline", label: "Date of Birth", value: student.dateOfBirth, index: 6 },
    { icon: "person-outline", label: "Gender", value: student.gender, index: 7 },
    { icon: "checkmark-circle-outline", label: "Status", value: student.status, index: 8 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + webBottomInset }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={[styles.profileHeader, { paddingTop: insets.top + 24 + webTopInset }]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {student.firstName[0]}
                {student.lastName[0]}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>
            {student.firstName} {student.middleName ? `${student.middleName[0]}. ` : ""}{student.lastName}
          </Text>
          <Text style={styles.profileCourse}>{student.course}</Text>
          <View style={styles.profileBadge}>
            <View style={styles.profileBadgeDot} />
            <Text style={styles.profileBadgeText}>{student.status} Student</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            {infoItems.map((item) => (
              <InfoRow key={item.label} {...item} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actionsCard}>
            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && { backgroundColor: Colors.surfaceSecondary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNewUsername(student.studentId);
                setShowAccountModal(true);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="person-circle-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Edit Account</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && { backgroundColor: Colors.surfaceSecondary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPasswordModal(true);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#EBF0F9" }]}>
                <Ionicons name="key-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && { backgroundColor: "#FEF2F2" },
              ]}
              onPress={handleLogout}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              </View>
              <Text style={[styles.actionText, { color: Colors.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.error} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ── Edit Account Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseAccount}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account</Text>
              <Pressable onPress={handleCloseAccount}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!!acctError && (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.alertText}>{acctError}</Text>
                </View>
              )}
              {!!acctSuccess && (
                <View style={[styles.alertBox, styles.alertSuccess]}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={[styles.alertText, { color: Colors.success }]}>{acctSuccess}</Text>
                </View>
              )}

              {/* Username / Student ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID (Username)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    value={newUsername}
                    onChangeText={(t) => { setNewUsername(t); setAcctError(""); }}
                    placeholder="New Student ID"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Current Password (required) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Required to save changes"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showAcctPw}
                    value={acctCurrentPw}
                    onChangeText={(t) => { setAcctCurrentPw(t); setAcctError(""); }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => acctNewPwRef.current?.focus()}
                  />
                  <Pressable onPress={() => setShowAcctPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showAcctPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* New Password (optional) */}
              <Text style={styles.sectionDivider}>Change Password (optional)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={acctNewPwRef}
                    style={styles.inputField}
                    placeholder="Leave blank to keep current"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showAcctNewPw}
                    value={acctNewPw}
                    onChangeText={(t) => { setAcctNewPw(t); setAcctError(""); }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => acctConfirmRef.current?.focus()}
                  />
                  <Pressable onPress={() => setShowAcctNewPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showAcctNewPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={acctConfirmRef}
                    style={styles.inputField}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showAcctConfirmPw}
                    value={acctConfirmPw}
                    onChangeText={(t) => { setAcctConfirmPw(t); setAcctError(""); }}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveAccount}
                  />
                  <Pressable onPress={() => setShowAcctConfirmPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showAcctConfirmPw ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
                {acctNewPw.length > 0 && acctConfirmPw.length > 0 && (
                  <View style={styles.reqRow}>
                    <Ionicons
                      name={acctNewPw === acctConfirmPw ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={acctNewPw === acctConfirmPw ? Colors.success : Colors.error}
                    />
                    <Text style={[styles.reqText, acctNewPw === acctConfirmPw ? styles.reqTextMet : { color: Colors.error }]}>
                      {acctNewPw === acctConfirmPw ? "Passwords match" : "Passwords do not match"}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={[styles.saveButton, acctBusy && { opacity: 0.7 }]}
                onPress={handleSaveAccount}
                disabled={acctBusy}
              >
                {acctBusy ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Status messages */}
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

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter current password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showCurrentPw}
                    value={currentPw}
                    onChangeText={(t) => { setCurrentPw(t); setFormError(""); }}
                    returnKeyType="next"
                    onSubmitEditing={() => newPwRef.current?.focus()}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowCurrentPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={newPwRef}
                    style={styles.inputField}
                    placeholder="Enter new password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showNewPw}
                    value={newPw}
                    onChangeText={(t) => { setNewPw(t); setFormError(""); }}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPwRef.current?.focus()}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowNewPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showNewPw ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* Password requirements */}
                {newPw.length > 0 && (
                  <View style={styles.requirementsBox}>
                    {REQUIREMENTS.map((req) => (
                      <RequirementRow key={req.label} label={req.label} met={req.met(newPw)} />
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={confirmPwRef}
                    style={styles.inputField}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showConfirmPw}
                    value={confirmPw}
                    onChangeText={(t) => { setConfirmPw(t); setFormError(""); }}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowConfirmPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* Match indicator */}
                {confirmPw.length > 0 && (
                  <View style={styles.reqRow}>
                    <Ionicons
                      name={newPw === confirmPw ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={newPw === confirmPw ? Colors.success : Colors.error}
                    />
                    <Text
                      style={[
                        styles.reqText,
                        newPw === confirmPw ? styles.reqTextMet : { color: Colors.error },
                      ]}
                    >
                      {newPw === confirmPw ? "Passwords match" : "Passwords do not match"}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  !allRequirementsMet && styles.saveButtonDisabled,
                  pressed && allRequirementsMet && { opacity: 0.9 },
                ]}
                onPress={handleChangePassword}
                disabled={isSubmitting || !allRequirementsMet}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Password</Text>
                )}
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
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Header
  profileHeader: { alignItems: "center", paddingBottom: 28, paddingHorizontal: 20 },
  avatarContainer: { marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: Colors.gold,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 32, color: Colors.white },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.white },
  profileCourse: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  profileBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20, marginTop: 10,
  },
  profileBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  profileBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.white },

  // Info section
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text, marginBottom: 10, marginLeft: 4 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center", marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textTertiary, marginBottom: 1 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },

  // Actions card
  actionsCard: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden",
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  actionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  actionText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.text, flex: 1 },
  actionDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },

  // Modal
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

  // Alert boxes
  alertBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#FECACA",
  },
  alertSuccess: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  alertText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.error, flex: 1 },
  sectionDivider: {
    fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textTertiary,
    textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, marginBottom: 4,
  },

  // Input
  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text, marginLeft: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
  },
  inputField: {
    flex: 1, fontFamily: "Inter_400Regular", fontSize: 15,
    color: Colors.text, paddingVertical: 13, paddingHorizontal: 14,
  },
  eyeBtn: { paddingHorizontal: 14 },

  // Requirements
  requirementsBox: {
    marginTop: 8, padding: 12, backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10, gap: 6,
  },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textTertiary },
  reqTextMet: { color: Colors.success },

  // Save button
  saveButton: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.white },
});
