import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { formatCurrency, ORDER_STATUS_LABELS, type Order } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  confirmed: "checkmark-circle",
  preparing: "construct",
  in_transit: "car",
  delivered: "home",
  cancelled: "close-circle",
  refunded: "arrow-undo-circle",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: colors.info,
  preparing: colors.warning,
  in_transit: colors.primary[700],
  delivered: colors.success,
  cancelled: colors.error,
  refunded: colors.neutral[600],
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const snap = await getDoc(doc(db, "orders", id));
      if (snap.exists) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
    } catch (error) {
      console.error("Error loading order:", error);
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

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderId}>
          Order #{order.id.slice(-6).toUpperCase()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[order.currentStatus] + "20" },
          ]}
        >
          <Ionicons
            name={STATUS_ICONS[order.currentStatus] || "ellipse"}
            size={16}
            color={STATUS_COLORS[order.currentStatus]}
          />
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[order.currentStatus] },
            ]}
          >
            {ORDER_STATUS_LABELS[order.currentStatus]}
          </Text>
        </View>
      </View>

      {/* Status Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        {order.statusHistory.map((entry, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === 0
                        ? STATUS_COLORS[entry.status]
                        : colors.neutral[300],
                  },
                ]}
              />
              {index < order.statusHistory.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>
                {ORDER_STATUS_LABELS[entry.status]}
              </Text>
              {entry.note && (
                <Text style={styles.timelineNote}>{entry.note}</Text>
              )}
              <Text style={styles.timelineDate}>
                {entry.timestamp?.toDate?.()?.toLocaleString() || ""}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemSize}>
                {item.sizeLabel} × {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressCard}>
          <Text style={styles.addressText}>
            {order.shippingAddress.street}
            {order.shippingAddress.unit
              ? `, ${order.shippingAddress.unit}`
              : ""}
          </Text>
          <Text style={styles.addressText}>
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zip}
          </Text>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(order.subtotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>{formatCurrency(order.tax)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>
            {order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>
        {order.refundAmount != null && order.refundAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.error }]}>
              Refunded
            </Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              -{formatCurrency(order.refundAmount)}
            </Text>
          </View>
        )}
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
  orderId: { fontSize: fontSize.xl, fontWeight: "700", color: colors.textPrimary },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timelineItem: { flexDirection: "row", gap: spacing.md },
  timelineDot: { alignItems: "center", width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 4,
  },
  timelineContent: { flex: 1, paddingBottom: spacing.md },
  timelineStatus: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary },
  timelineNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  timelineDate: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary },
  itemSize: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary },
  addressCard: { gap: 2 },
  addressText: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: "500" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: "700", color: colors.textPrimary },
  totalValue: { fontSize: fontSize.lg, fontWeight: "700", color: colors.primary[700] },
});
