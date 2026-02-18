import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { formatCurrency, type Product } from "@palmtree/shared";

interface ProductCardProps {
  product: Product;
  width?: number;
}

export function ProductCard({ product, width }: ProductCardProps) {
  const router = useRouter();
  const minPrice = product.sizes.length > 0
    ? Math.min(...product.sizes.map((s) => s.price))
    : 0;
  const hasComparePrice = product.sizes.some((s) => s.compareAtPrice);

  return (
    <TouchableOpacity
      style={[styles.container, width ? { width } : undefined]}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.7}
    >
      {product.thumbnailURL || product.images?.[0] ? (
        <Image
          source={{ uri: product.thumbnailURL || product.images[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>🌴</Text>
        </View>
      )}
      {product.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      {product.seasonalOnly && (
        <View style={styles.seasonalBadge}>
          <Text style={styles.seasonalText}>Seasonal</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {product.sizes.length > 1 ? "From " : ""}
          {formatCurrency(minPrice)}
        </Text>
        {product.sizes.length > 1 && (
          <Text style={styles.sizes}>{product.sizes.length} sizes available</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    margin: spacing.xs,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  placeholder: {
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
  },
  featuredBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  featuredText: {
    color: colors.black,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  seasonalBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent.coral,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  seasonalText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary[700],
  },
  sizes: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
