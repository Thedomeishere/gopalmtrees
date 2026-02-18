import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { collection, getDocs, query, where, orderBy } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { SERVICE_TYPE_LABELS, type Quote } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "#F57C00", label: "Pending" },
  reviewed: { color: "#1976D2", label: "Reviewed" },
  estimated: { color: "#388E3C", label: "Estimate Ready" },
  accepted: { color: "#1B5E20", label: "Accepted" },
  declined: { color: "#757575", label: "Declined" },
};

export default function QuotesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadQuotes();
    else setLoading(false);
  }, [user]);

  const loadQuotes = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "quotes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Quote));
    } catch (error) {
      console.error("Error loading quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "My Quotes" }} />
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={quotes.length === 0 ? styles.emptyContainer : styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.newQuoteButton}
            onPress={() => router.push("/quote/new")}
          >
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.newQuoteText}>Request a New Quote</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No Quotes Yet</Text>
            <Text style={styles.emptyText}>
              Request a quote for landscaping, installation, or bulk orders.
            </Text>
          </View>
        }
        renderItem={({ item: quote }) => {
          const config = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;
          return (
            <TouchableOpacity
              style={styles.quoteCard}
              onPress={() => router.push(`/quote/${quote.id}`)}
            >
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteId}>
                  #{quote.id.slice(-6).toUpperCase()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: config.color + "18" }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.serviceType}>
                {SERVICE_TYPE_LABELS[quote.serviceType]}
              </Text>
              <Text style={styles.quoteDescription} numberOfLines={2}>
                {quote.description}
              </Text>
              <Text style={styles.quoteDate}>
                {quote.createdAt?.toDate?.()?.toLocaleDateString() || ""}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: spacing.md },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.md },
  emptyState: { alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  newQuoteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  newQuoteText: { color: colors.white, fontSize: fontSize.md, fontWeight: "700" },
  quoteCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quoteId: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textPrimary },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: "600" },
  serviceType: { fontSize: fontSize.sm, fontWeight: "600", color: colors.primary[700], marginTop: spacing.sm },
  quoteDescription: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  quoteDate: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: spacing.sm },
});
