import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, radius, spacing } from "../theme";

export function TicketCardSkeleton() {
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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Animated.View style={[styles.block, styles.statusBadge, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.codeBadge, { opacity: shimmerAnim }]} />
      </View>

      {/* Body Details */}
      <View style={styles.body}>
        <Animated.View style={[styles.block, styles.title, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.venue, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.dateRow, { opacity: shimmerAnim }]} />
      </View>

      {/* Perforated Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.leftCutout} />
        <View style={styles.dashedLine} />
        <View style={styles.rightCutout} />
      </View>

      {/* QR Section */}
      <View style={styles.qrSection}>
        <Animated.View style={[styles.block, styles.qrBox, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.block, styles.caption, { opacity: shimmerAnim }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  block: {
    backgroundColor: colors.line,
    borderRadius: radius.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  statusBadge: {
    width: 95,
    height: 24,
    borderRadius: radius.sm,
  },
  codeBadge: {
    width: 85,
    height: 18,
    borderRadius: radius.xs,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    width: "75%",
    height: 22,
    marginBottom: spacing.xs,
    borderRadius: radius.sm,
  },
  venue: {
    width: "55%",
    height: 15,
    marginBottom: spacing.xs,
    borderRadius: radius.xs,
  },
  dateRow: {
    width: "42%",
    height: 14,
    borderRadius: radius.xs,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    position: "relative",
  },
  leftCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.paper,
    marginLeft: -10,
  },
  rightCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.paper,
    marginRight: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.line,
  },
  qrSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
  },
  qrBox: {
    width: 172,
    height: 172,
    borderRadius: radius.lg,
  },
  caption: {
    width: 170,
    height: 14,
    marginTop: spacing.sm,
    borderRadius: radius.xs,
  },
});
