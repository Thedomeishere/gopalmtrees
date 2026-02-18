import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Stack } from "expo-router";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { BUSINESS_NAME, BUSINESS_PHONE, BUSINESS_EMAIL, BUSINESS_WEBSITE } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "About" }} />

      {/* Logo / Header */}
      <View style={styles.header}>
        <Ionicons name="leaf" size={48} color={colors.primary[700]} />
        <Text style={styles.title}>{BUSINESS_NAME}</Text>
        <Text style={styles.subtitle}>Premium Palm Trees & Exotic Plants</Text>
        <Text style={styles.version}>App Version 1.0.0</Text>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Us</Text>
        <Text style={styles.bodyText}>
          Go Palm Trees operates a 20-acre farm in Homestead, Florida, growing and sourcing the finest
          palm trees and exotic plants. With 4 retail locations across New York and New Jersey, we
          bring tropical beauty to the Northeast.
        </Text>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`tel:${BUSINESS_PHONE.replace(/\D/g, "")}`)}
        >
          <Ionicons name="call" size={20} color={colors.primary[700]} />
          <Text style={styles.contactText}>{BUSINESS_PHONE}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`mailto:${BUSINESS_EMAIL}`)}
        >
          <Ionicons name="mail" size={20} color={colors.primary[700]} />
          <Text style={styles.contactText}>{BUSINESS_EMAIL}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(BUSINESS_WEBSITE)}
        >
          <Ionicons name="globe" size={20} color={colors.primary[700]} />
          <Text style={styles.contactText}>{BUSINESS_WEBSITE}</Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: "center", paddingVertical: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  version: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: spacing.sm },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  bodyText: { fontSize: fontSize.md, color: colors.textPrimary, lineHeight: 24 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  contactText: { fontSize: fontSize.md, color: colors.primary[700] },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  linkText: { fontSize: fontSize.md, color: colors.textPrimary },
});
