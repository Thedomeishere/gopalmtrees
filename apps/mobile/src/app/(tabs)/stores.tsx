import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { STORE_LOCATIONS } from "@palmtree/shared";

function openPhone(phone: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  Linking.openURL(`tel:${cleaned}`);
}

function openDirections(
  address: string,
  city: string,
  state: string,
  zip: string,
  latitude: number,
  longitude: number
) {
  const fullAddress = encodeURIComponent(
    `${address}, ${city}, ${state} ${zip}`
  );
  const url = Platform.select({
    ios: `maps:0,0?q=${fullAddress}`,
    android: `geo:${latitude},${longitude}?q=${fullAddress}`,
  });
  if (url) {
    Linking.openURL(url);
  }
}

export default function StoresScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={48} color={colors.neutral[400]} />
        <Text style={styles.mapPlaceholderText}>Map loads here</Text>
      </View>

      {/* Store Cards */}
      <View style={styles.storeList}>
        <Text style={styles.sectionTitle}>Our Locations</Text>

        {STORE_LOCATIONS.map((store, index) => (
          <View key={index} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <View style={styles.storeIconContainer}>
                <Ionicons
                  name="storefront"
                  size={24}
                  color={colors.primary[700]}
                />
              </View>
              <Text style={styles.storeName}>{store.name}</Text>
            </View>

            <View style={styles.storeInfo}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  {store.address}, {store.city}, {store.state} {store.zip}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => openPhone(store.phone)}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.primary[700]}
                />
                <Text style={styles.phoneText}>{store.phone}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() =>
                openDirections(
                  store.address,
                  store.city,
                  store.state,
                  store.zip,
                  store.latitude,
                  store.longitude
                )
              }
            >
              <Ionicons name="navigate" size={18} color={colors.white} />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    height: 220,
    backgroundColor: colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  mapPlaceholderText: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    fontWeight: "500",
  },
  storeList: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  storeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  storeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  storeInfo: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  phoneText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: "600",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[700],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  directionsButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.white,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
