import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, type ViewStyle } from "react-native";
import { colors, borderRadius } from "@/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = "100%",
  height = 16,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.neutral[200],
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <LoadingSkeleton height={150} borderRadius={0} />
      <View style={skeletonStyles.info}>
        <LoadingSkeleton width="80%" height={14} />
        <LoadingSkeleton width="40%" height={18} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={skeletonStyles.orderRow}>
        <LoadingSkeleton width={100} height={16} />
        <LoadingSkeleton width={80} height={24} borderRadius={12} />
      </View>
      <LoadingSkeleton width="70%" height={14} style={{ marginTop: 8 }} />
      <View style={skeletonStyles.orderRow}>
        <LoadingSkeleton width={80} height={12} />
        <LoadingSkeleton width={60} height={16} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    margin: 4,
  },
  info: {
    padding: 8,
    gap: 4,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
});
