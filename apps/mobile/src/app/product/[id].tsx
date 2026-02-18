import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { formatCurrency, type Product, type ProductSize } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    loadProduct();
    if (user) checkWishlist();
  }, [id, user]);

  const loadProduct = async () => {
    try {
      const snap = await getDoc(doc(db, "products", id));
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() } as Product;
        setProduct(p);
        if (p.sizes.length > 0) setSelectedSize(p.sizes[0]);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, `users/${user.uid}/wishlist`, id));
      setIsWishlisted(snap.exists());
    } catch {}
  };

  const toggleWishlist = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save items to your wishlist.");
      return;
    }
    try {
      const ref = doc(db, `users/${user.uid}/wishlist`, id);
      if (isWishlisted) {
        await deleteDoc(ref);
        setIsWishlisted(false);
      } else {
        await setDoc(ref, {
          productId: id,
          productName: product?.name || "",
          productImage: product?.thumbnailURL || product?.images?.[0] || "",
          addedAt: Timestamp.now(),
        });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to add items to your cart.");
      return;
    }
    if (!product || !selectedSize) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.thumbnailURL || product.images?.[0] || "",
      sizeId: selectedSize.id,
      sizeLabel: selectedSize.label,
      price: selectedSize.price,
      quantity,
    });
    Alert.alert("Added to Cart", `${product.name} (${selectedSize.label}) added to your cart.`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveImage(page);
          }}
          scrollEventThrottle={16}
        >
          {product.images.length > 0 ? (
            product.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            ))
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="leaf" size={64} color={colors.neutral[300]} />
            </View>
          )}
        </ScrollView>

        {product.images.length > 1 && (
          <View style={styles.pagination}>
            {product.images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeImage && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Wishlist button */}
        <TouchableOpacity style={styles.wishlistButton} onPress={toggleWishlist}>
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={24}
            color={isWishlisted ? colors.error : colors.neutral[600]}
          />
        </TouchableOpacity>

        <View style={styles.details}>
          <Text style={styles.name}>{product.name}</Text>
          {selectedSize && (
            <Text style={styles.price}>
              {formatCurrency(selectedSize.price)}
              {selectedSize.compareAtPrice && (
                <Text style={styles.comparePrice}>
                  {" "}
                  {formatCurrency(selectedSize.compareAtPrice)}
                </Text>
              )}
            </Text>
          )}
          <Text style={styles.description}>{product.description}</Text>

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.sizeGrid}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size.id}
                    style={[
                      styles.sizeChip,
                      selectedSize?.id === size.id && styles.sizeChipActive,
                      size.stock === 0 && styles.sizeChipDisabled,
                    ]}
                    onPress={() => size.stock > 0 && setSelectedSize(size)}
                    disabled={size.stock === 0}
                  >
                    <Text
                      style={[
                        styles.sizeLabel,
                        selectedSize?.id === size.id && styles.sizeLabelActive,
                      ]}
                    >
                      {size.label}
                    </Text>
                    <Text
                      style={[
                        styles.sizeHeight,
                        selectedSize?.id === size.id && styles.sizeLabelActive,
                      ]}
                    >
                      {size.height}
                    </Text>
                    <Text
                      style={[
                        styles.sizePrice,
                        selectedSize?.id === size.id && styles.sizeLabelActive,
                      ]}
                    >
                      {formatCurrency(size.price)}
                    </Text>
                    {size.stock === 0 && (
                      <Text style={styles.outOfStock}>Out of Stock</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Care Info */}
          {product.careInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Care Information</Text>
              <View style={styles.careGrid}>
                <CareItem icon="sunny" label="Sunlight" value={product.careInfo.sunlight} />
                <CareItem icon="water" label="Water" value={product.careInfo.water} />
                <CareItem
                  icon="thermometer"
                  label="Temperature"
                  value={product.careInfo.temperature}
                />
                <CareItem icon="earth" label="Soil" value={product.careInfo.soil} />
              </View>
              {product.careInfo.tips.length > 0 && (
                <View style={styles.tips}>
                  <Text style={styles.tipsTitle}>Tips</Text>
                  {product.careInfo.tips.map((tip, i) => (
                    <Text key={i} style={styles.tip}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {selectedSize ? formatCurrency(selectedSize.price * quantity) : "--"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, !selectedSize && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={!selectedSize || selectedSize.stock === 0}
        >
          <Ionicons name="cart" size={20} color={colors.white} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CareItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.careItem}>
      <Ionicons name={icon} size={20} color={colors.primary[700]} />
      <Text style={styles.careLabel}>{label}</Text>
      <Text style={styles.careValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: fontSize.lg, color: colors.textSecondary },
  image: { width, height: width * 0.85 },
  placeholderImage: {
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },
  dotActive: { backgroundColor: colors.primary[700], width: 24 },
  wishlistButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  details: { padding: spacing.lg },
  name: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.textPrimary },
  price: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primary[700],
    marginTop: spacing.xs,
  },
  comparePrice: {
    fontSize: fontSize.md,
    color: colors.neutral[400],
    textDecorationLine: "line-through",
    fontWeight: "400",
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  section: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sizeChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 100,
    alignItems: "center",
  },
  sizeChipActive: {
    borderColor: colors.primary[700],
    backgroundColor: colors.primary[50],
  },
  sizeChipDisabled: { opacity: 0.5 },
  sizeLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textPrimary },
  sizeLabelActive: { color: colors.primary[900] },
  sizeHeight: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sizePrice: { fontSize: fontSize.sm, fontWeight: "600", color: colors.primary[700], marginTop: 4 },
  outOfStock: { fontSize: fontSize.xs, color: colors.error, marginTop: 2 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  quantityText: { fontSize: fontSize.lg, fontWeight: "700", minWidth: 40, textAlign: "center" },
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  careItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: "48%",
    gap: 4,
  },
  careLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  careValue: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary },
  tips: { marginTop: spacing.md },
  tipsTitle: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 },
  tip: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22, marginLeft: spacing.sm },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  totalContainer: { flex: 1 },
  totalLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  totalPrice: { fontSize: fontSize.xl, fontWeight: "700", color: colors.textPrimary },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  addToCartText: { color: colors.white, fontSize: fontSize.md, fontWeight: "700" },
  buttonDisabled: { opacity: 0.5 },
});
