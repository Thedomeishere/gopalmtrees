import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { collection, getDocs, deleteDoc, doc } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import type { WishlistItem } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

export default function WishlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadWishlist();
    else setLoading(false);
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/wishlist`));
      setItems(
        snap.docs.map((d) => ({ ...d.data() }) as WishlistItem)
      );
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/wishlist`, productId));
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
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
      <Stack.Screen options={{ title: "My Wishlist" }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>Wishlist Empty</Text>
            <Text style={styles.emptyText}>
              Save your favorite plants by tapping the heart icon on any product.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push(`/product/${item.productId}`)}
          >
            {item.productImage ? (
              <Image source={{ uri: item.productImage }} style={styles.itemImage} contentFit="cover" />
            ) : (
              <View style={[styles.itemImage, styles.placeholder]}>
                <Text>🌴</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.addedDate}>
                Added {item.addedAt?.toDate?.()?.toLocaleDateString() || ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                Alert.alert("Remove", "Remove from wishlist?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => removeItem(item.productId) },
                ])
              }
            >
              <Ionicons name="heart-dislike" size={20} color={colors.error} />
            </TouchableOpacity>
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
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: { width: 70, height: 70, borderRadius: borderRadius.md },
  placeholder: { backgroundColor: colors.neutral[100], justifyContent: "center", alignItems: "center" },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: fontSize.md, fontWeight: "600", color: colors.textPrimary },
  addedDate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  removeButton: { padding: spacing.sm },
});
