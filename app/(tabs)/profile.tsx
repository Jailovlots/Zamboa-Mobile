import { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/lib/auth-context";
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
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { student, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!student) return null;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + webBottomInset },
        ]}
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
            {student.firstName} {student.middleName[0]}. {student.lastName}
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

      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Current Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>New Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveButton,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPasswordModal(false);
                  if (Platform.OS !== "web") {
                    Alert.alert("Success", "Password change feature is not yet available in this version.");
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Update Password</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  profileHeader: {
    alignItems: "center",
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.white,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.white,
  },
  profileCourse: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  profileBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  profileBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.white,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 1,
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalInputGroup: {
    gap: 6,
  },
  modalInputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
    marginLeft: 4,
  },
  modalInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  modalSaveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.white,
  },
});
