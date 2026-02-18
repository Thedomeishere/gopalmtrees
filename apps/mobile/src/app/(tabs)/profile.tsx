import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: "receipt-outline", label: "Order History", route: "/orders" },
  { icon: "heart-outline", label: "My Wishlist", route: "/wishlist" },
  { icon: "document-text-outline", label: "My Quotes", route: "/quotes" },
  { icon: "location-outline", label: "Address Book", route: "/addresses" },
  {
    icon: "notifications-outline",
    label: "Notification Settings",
    route: "/notification-settings",
  },
  {
    icon: "help-circle-outline",
    label: "About / Help",
    route: "/about",
  },
];

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  // Not logged in state
  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestAvatarContainer}>
          <Ionicons
            name="person-circle-outline"
            size={100}
            color={colors.neutral[300]}
          />
        </View>
        <Text style={styles.guestTitle}>Welcome to Go Palm Trees</Text>
        <Text style={styles.guestMessage}>
          Sign in to track orders, manage your wishlist, and get personalized
          recommendations.
        </Text>

        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity style={styles.signInButton}>
            <Ionicons name="log-in-outline" size={20} color={colors.white} />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity style={styles.createAccountButton}>
            <Ionicons
              name="person-add-outline"
              size={20}
              color={colors.primary[700]}
            />
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  // Logged in state
  const displayName = profile?.displayName ?? user.displayName ?? "User";
  const email = profile?.email ?? user.email ?? "";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Info Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {profile?.photoURL ? (
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.white} />
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={item.icon}
                size={22}
                color={colors.primary[700]}
              />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={async () => {
          await signOut();
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[700],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.white,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menuContainer: {
    backgroundColor: colors.white,
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.error,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
  // Guest state styles
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  guestAvatarContainer: {
    marginBottom: spacing.md,
  },
  guestTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  guestMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[700],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    width: "100%",
    gap: spacing.sm,
  },
  signInButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[700],
    width: "100%",
    gap: spacing.sm,
  },
  createAccountButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.primary[700],
  },
});
