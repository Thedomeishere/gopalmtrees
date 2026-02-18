import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { SEASONAL_CONFIG } from "@palmtree/shared";

function isOffSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return SEASONAL_CONFIG.offSeasonMonths.includes(month);
}

export default function HomeScreen() {
  const offSeason = isOffSeason();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Ionicons name="leaf" size={48} color={colors.white} />
        <Text style={styles.businessName}>Go Palm Trees</Text>
        <Text style={styles.tagline}>Premium Palm Trees & Exotic Plants</Text>
      </View>

      {/* Seasonal Notice */}
      {offSeason && (
        <View style={styles.seasonalBanner}>
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.secondary[500]}
          />
          <Text style={styles.seasonalText}>
            {SEASONAL_CONFIG.offSeasonMessage}
          </Text>
        </View>
      )}

      {/* Featured Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <FlatList
          data={[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => String(index)}
          renderItem={() => null}
          ListEmptyComponent={
            <View style={styles.emptyPlaceholder}>
              <Ionicons name="leaf-outline" size={32} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>Featured products coming soon</Text>
            </View>
          }
        />
      </View>

      {/* Shop by Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <FlatList
          data={[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => String(index)}
          renderItem={() => null}
          ListEmptyComponent={
            <View style={styles.emptyPlaceholder}>
              <Ionicons name="grid-outline" size={32} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>Categories coming soon</Text>
            </View>
          }
        />
      </View>

      {/* Visit Our Stores CTA */}
      <Link href="/(tabs)/stores" asChild>
        <TouchableOpacity style={styles.ctaCard}>
          <View style={styles.ctaIconContainer}>
            <Ionicons name="location" size={28} color={colors.primary[700]} />
          </View>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Visit Our Stores</Text>
            <Text style={styles.ctaDescription}>
              4 locations across NY & NJ. Find the one nearest you.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.neutral[400]}
          />
        </TouchableOpacity>
      </Link>

      {/* Custom Quote CTA */}
      <Link href="/quote/new" asChild>
        <TouchableOpacity style={styles.quoteCard}>
          <Ionicons name="document-text" size={32} color={colors.white} />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteTitle}>Need a Custom Quote?</Text>
            <Text style={styles.quoteDescription}>
              Landscaping, bulk orders, installations — we do it all. Request a
              free quote today.
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-circle"
            size={28}
            color={colors.white}
          />
        </TouchableOpacity>
      </Link>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeBanner: {
    backgroundColor: colors.primary[900],
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  businessName: {
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.white,
    marginTop: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.primary[200],
    marginTop: spacing.xs,
  },
  seasonalBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF8E1",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
    gap: spacing.sm,
  },
  seasonalText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyPlaceholder: {
    width: 280,
    height: 160,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: spacing.md,
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  ctaDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quoteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[700],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  quoteContent: {
    flex: 1,
  },
  quoteTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  quoteDescription: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
