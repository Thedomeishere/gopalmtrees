import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import type { Category } from "@palmtree/shared";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/(tabs)/shop?category=${category.id}`)}
      activeOpacity={0.7}
    >
      {category.imageURL ? (
        <Image
          source={{ uri: category.imageURL }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>🌿</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.name}>{category.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginRight: spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.sm,
  },
  name: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
