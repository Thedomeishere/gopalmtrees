import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { doc, getDoc } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { SERVICE_TYPE_LABELS, formatCurrency, type Quote } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: colors.warning, label: "Pending Review" },
  reviewed: { color: colors.info, label: "Under Review" },
  estimated: { color: colors.primary[700], label: "Estimate Provided" },
  accepted: { color: colors.success, label: "Accepted" },
  declined: { color: colors.neutral[500], label: "Declined" },
};

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      const snap = await getDoc(doc(db, "quotes", id));
      if (snap.exists()) {
        setQuote({ id: snap.id, ...snap.data() } as Quote);
      }
    } catch (error) {
      console.error("Error loading quote:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Quote not found</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.quoteId}>
          Quote #{quote.id.slice(-6).toUpperCase()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Service Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>
        <Text style={styles.serviceType}>
          {SERVICE_TYPE_LABELS[quote.serviceType]}
        </Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{quote.description}</Text>
      </View>

      {/* Photos */}
      {quote.photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoRow}>
              {quote.photos.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Admin Response */}
      {quote.adminResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Response</Text>
          <View style={styles.responseCard}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary[700]} />
            <Text style={styles.responseText}>{quote.adminResponse}</Text>
          </View>
          {quote.estimatedPrice != null && (
            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>Estimated Price</Text>
              <Text style={styles.estimatePrice}>
                {formatCurrency(quote.estimatedPrice)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Preference</Text>
        <Text style={styles.contactPref}>
          {quote.contactPreference === "email"
            ? "Email"
            : quote.contactPreference === "phone"
              ? "Phone"
              : "Email or Phone"}
        </Text>
        {quote.phone && (
          <Text style={styles.phone}>{quote.phone}</Text>
        )}
      </View>

      {/* Date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submitted</Text>
        <Text style={styles.date}>
          {quote.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }) || ""}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: fontSize.lg, color: colors.textSecondary },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  quoteId: { fontSize: fontSize.xl, fontWeight: "700", color: colors.textPrimary },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: fontSize.sm, fontWeight: "600" },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceType: { fontSize: fontSize.md, fontWeight: "600", color: colors.textPrimary },
  description: { fontSize: fontSize.md, color: colors.textPrimary, lineHeight: 24 },
  photoRow: { flexDirection: "row", gap: spacing.sm },
  photo: { width: 120, height: 120, borderRadius: borderRadius.md },
  responseCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  responseText: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, lineHeight: 22 },
  estimateCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  estimateLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  estimatePrice: { fontSize: fontSize.xl, fontWeight: "700", color: colors.primary[700] },
  contactPref: { fontSize: fontSize.md, color: colors.textPrimary },
  phone: { fontSize: fontSize.md, color: colors.primary[700], marginTop: 4 },
  date: { fontSize: fontSize.md, color: colors.textPrimary },
});
