import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useOrders } from "@/hooks/useOrders";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { formatCurrency, ORDER_STATUS_LABELS } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#1976D2",
  preparing: "#F57C00",
  in_transit: "#388E3C",
  delivered: "#1B5E20",
  cancelled: "#D32F2F",
  refunded: "#757575",
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, refresh } = useOrders();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Order History" }} />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.list}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>
              Your order history will appear here once you make a purchase.
            </Text>
          </View>
        }
        renderItem={({ item: order }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push(`/order/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>
                #{order.id.slice(-6).toUpperCase()}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: (STATUS_COLORS[order.currentStatus] || "#757575") + "18" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[order.currentStatus] || "#757575" },
                  ]}
                >
                  {ORDER_STATUS_LABELS[order.currentStatus] || order.currentStatus}
                </Text>
              </View>
            </View>
            <Text style={styles.orderItems}>
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} •{" "}
              {order.items.map((i) => i.productName).join(", ")}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderDate}>
                {order.createdAt?.toDate?.()?.toLocaleDateString() || ""}
              </Text>
              <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: spacing.md },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  orderCard: {
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
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: fontSize.md, fontWeight: "700", color: colors.textPrimary },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: "600" },
  orderItems: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  orderDate: { fontSize: fontSize.xs, color: colors.neutral[500] },
  orderTotal: { fontSize: fontSize.md, fontWeight: "700", color: colors.primary[700] },
});
