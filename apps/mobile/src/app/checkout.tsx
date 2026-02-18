import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { httpsCallable, getFunctions } from "@react-native-firebase/functions";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { formatCurrency, DELIVERY_DAYS, type Address } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    profile?.addresses?.find((a) => a.isDefault) || profile?.addresses?.[0] || null
  );
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState<string>(DELIVERY_DAYS[0]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to checkout.");
      return;
    }
    if (!selectedAddress) {
      Alert.alert("Address Required", "Please add a delivery address before checkout.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Add items to your cart before checkout.");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");

      const result = await createPaymentIntent({
        items: items.map((item) => ({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
        })),
        shippingAddress: selectedAddress,
        deliveryDate: selectedDeliveryDay,
      });

      const { clientSecret, amount, tax, deliveryFee } = result.data as {
        clientSecret: string;
        amount: number;
        tax: number;
        deliveryFee: number;
      };

      // In a real app, present the Stripe Payment Sheet here:
      // const { error } = await presentPaymentSheet();
      // For now, show success
      Alert.alert(
        "Payment",
        `Total: ${formatCurrency(amount)}\n(Tax: ${formatCurrency(tax)})\n\nStripe Payment Sheet would appear here with clientSecret.`,
        [
          {
            text: "Simulate Success",
            onPress: () => {
              clearCart();
              router.replace("/(tabs)");
              Alert.alert("Order Placed!", "Your order has been confirmed. Check Order History for updates.");
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } catch (error: any) {
      console.error("Checkout error:", error);
      Alert.alert("Checkout Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={20} color={colors.primary[700]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.street}
                  {selectedAddress.unit ? `, ${selectedAddress.unit}` : ""}
                </Text>
                <Text style={styles.addressText}>
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddressButton}>
              <Ionicons name="add-circle" size={20} color={colors.primary[700]} />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Day</Text>
          <View style={styles.dayPicker}>
            {DELIVERY_DAYS.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  selectedDeliveryDay === day && styles.dayChipActive,
                ]}
                onPress={() => setSelectedDeliveryDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDeliveryDay === day && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.deliveryNote}>
            Weekly deliveries from our Homestead, FL farm
          </Text>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          {items.map((item, index) => (
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

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax</Text>
            <Text style={styles.summaryValue}>Calculated at payment</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>Free</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.buttonDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={colors.white} />
              <Text style={styles.checkoutButtonText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  addressCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textPrimary },
  addressText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  addAddressText: { fontSize: fontSize.md, color: colors.primary[700], fontWeight: "600" },
  dayPicker: { flexDirection: "row", gap: spacing.sm },
  dayChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayChipActive: {
    borderColor: colors.primary[700],
    backgroundColor: colors.primary[50],
  },
  dayText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  dayTextActive: { color: colors.primary[700] },
  deliveryNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: "500" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: "700", color: colors.textPrimary },
  totalValue: { fontSize: fontSize.lg, fontWeight: "700", color: colors.primary[700] },
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  checkoutButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: "700" },
  buttonDisabled: { opacity: 0.7 },
});
