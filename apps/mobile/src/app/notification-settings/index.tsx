import { useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationSettingsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const prefs = profile?.notificationPreferences;

  const [orderUpdates, setOrderUpdates] = useState(prefs?.orderUpdates ?? true);
  const [promotions, setPromotions] = useState(prefs?.promotions ?? true);
  const [quoteResponses, setQuoteResponses] = useState(prefs?.quoteResponses ?? true);

  const updatePref = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await api.put("/users/me/notification-preferences", { [key]: value });
      await refreshProfile();
    } catch (error) {
      console.error("Error updating preference:", error);
      Alert.alert("Error", "Failed to update preference.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Notification Settings" }} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="cart-outline" size={20} color={colors.primary[700]} />
            <View>
              <Text style={styles.settingLabel}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Status changes, delivery updates, and order confirmations
              </Text>
            </View>
          </View>
          <Switch
            value={orderUpdates}
            onValueChange={(val) => {
              setOrderUpdates(val);
              updatePref("orderUpdates", val);
            }}
            trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
            thumbColor={orderUpdates ? colors.primary[700] : colors.neutral[100]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="megaphone-outline" size={20} color={colors.secondary[600]} />
            <View>
              <Text style={styles.settingLabel}>Promotions</Text>
              <Text style={styles.settingDescription}>
                Sales, seasonal offers, and new arrivals
              </Text>
            </View>
          </View>
          <Switch
            value={promotions}
            onValueChange={(val) => {
              setPromotions(val);
              updatePref("promotions", val);
            }}
            trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
            thumbColor={promotions ? colors.primary[700] : colors.neutral[100]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.info} />
            <View>
              <Text style={styles.settingLabel}>Quote Responses</Text>
              <Text style={styles.settingDescription}>
                Updates on your consultation and quote requests
              </Text>
            </View>
          </View>
          <Switch
            value={quoteResponses}
            onValueChange={(val) => {
              setQuoteResponses(val);
              updatePref("quoteResponses", val);
            }}
            trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
            thumbColor={quoteResponses ? colors.primary[700] : colors.neutral[100]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
});
