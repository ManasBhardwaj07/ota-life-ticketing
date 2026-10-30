import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, radius, spacing } from "../theme";

export function EventCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.75,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.card}>
      {/* Badge Row */}
      <View style={styles.badgeRow}>
        <Animated.View style={[styles.block, styles.badge, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.price, { opacity: shimmerAnim }]} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.block, styles.title, { opacity: shimmerAnim }]} />

      {/* Meta rows */}
      <Animated.View style={[styles.block, styles.metaLine1, { opacity: shimmerAnim }]} />
      <Animated.View style={[styles.block, styles.metaLine2, { opacity: shimmerAnim }]} />

      {/* Compact Quantity Row Placeholder */}
      <View style={styles.qtyRow}>
        <Animated.View style={[styles.block, styles.qtyLabel, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.qtyStepper, { opacity: shimmerAnim }]} />
      </View>

      {/* Action Button Placeholder */}
      <Animated.View style={[styles.block, styles.button, { opacity: shimmerAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  block: {
    backgroundColor: colors.line,
    borderRadius: radius.sm,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    width: 120,
    height: 24,
    borderRadius: radius.sm,
  },
  price: {
    width: 68,
    height: 22,
    borderRadius: radius.sm,
  },
  title: {
    width: "78%",
    height: 26,
    marginBottom: spacing.md,
    borderRadius: radius.sm,
  },
  metaLine1: {
    width: "60%",
    height: 16,
    marginBottom: spacing.xs,
    borderRadius: radius.xs,
  },
  metaLine2: {
    width: "48%",
    height: 16,
    marginBottom: spacing.sm,
    borderRadius: radius.xs,
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  qtyLabel: {
    width: 80,
    height: 20,
    borderRadius: radius.xs,
  },
  qtyStepper: {
    width: 110,
    height: 38,
    borderRadius: radius.md,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
