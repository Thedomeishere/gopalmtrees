import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@palmtree/shared";
import type { CartItem } from "@palmtree/shared";

const TAX_RATE_ESTIMATE = 0.08;

export default function CartScreen() {
  const { items, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const estimatedTax = Math.round(subtotal * TAX_RATE_ESTIMATE * 100) / 100;
  const total = Math.round((subtotal + estimatedTax) * 100) / 100;

  const handleDecrement = (item: CartItem) => {
    if (item.quantity <= 1) {
      removeItem(item.productId, item.sizeId);
    } else {
      updateQuantity(item.productId, item.sizeId, item.quantity - 1);
    }
  };

  const handleIncrement = (item: CartItem) => {
    updateQuantity(item.productId, item.sizeId, item.quantity + 1);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder}>
        {item.productImage ? (
          <Image
            source={{ uri: item.productImage }}
            style={styles.productImage}
          />
        ) : (
          <Ionicons name="leaf" size={28} color={colors.neutral[400]} />
        )}
      </View>

      {/* Item Details */}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.productName}
        </Text>
        <Text style={styles.itemSize}>{item.sizeLabel}</Text>
        <Text style={styles.itemPrice}>
          {formatCurrency(item.price)}
        </Text>

        {/* Quantity Controls */}
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleDecrement(item)}
          >
            <Ionicons name="remove" size={18} color={colors.primary[700]} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleIncrement(item)}
          >
            <Ionicons name="add" size={18} color={colors.primary[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.productId, item.sizeId)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptyMessage}>
          Looks like you haven't added any palm trees or plants yet. Browse our
          collection to get started!
        </Text>
        <Link href="/(tabs)/shop" asChild>
          <TouchableOpacity style={styles.startShoppingButton}>
            <Ionicons name="leaf" size={20} color={colors.white} />
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.productId}-${item.sizeId}`}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Cart Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated Tax</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(estimatedTax)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemSize: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary[900],
    marginTop: spacing.xs,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[700],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },
  removeButton: {
    padding: spacing.xs,
    alignSelf: "flex-start",
  },
  separator: {
    height: spacing.md,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary[900],
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[700],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  checkoutButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  startShoppingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[700],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  startShoppingText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
});
