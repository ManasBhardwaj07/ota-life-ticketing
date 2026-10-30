import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ticket } from "../types";
import { colors, radius, spacing, typography, motion } from "../theme";

interface Props {
  ticket: Ticket;
}

export function TicketCard({ ticket }: Props) {
  const isCheckedIn = ticket.checkedInAt !== null;
  const eventDate = new Date(ticket.event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const checkedInFormatted = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  // Cross-fade animation on badge change
  const badgeFadeAnim = useRef(new Animated.Value(1)).current;
  const prevCheckedInRef = useRef(isCheckedIn);

  useEffect(() => {
    if (prevCheckedInRef.current !== isCheckedIn) {
      prevCheckedInRef.current = isCheckedIn;
      Animated.sequence([
        Animated.timing(badgeFadeAnim, {
          toValue: 0.2,
          duration: motion.duration.badgeFlip / 2,
          useNativeDriver: true,
        }),
        Animated.timing(badgeFadeAnim, {
          toValue: 1,
          duration: motion.duration.badgeFlip / 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCheckedIn, badgeFadeAnim]);

  return (
    <View style={[styles.card, isCheckedIn && styles.cardCheckedIn]}>
      {/* Header Row: Status Badge + Unguessable Code */}
      <View style={styles.headerRow}>
        <Animated.View style={{ opacity: badgeFadeAnim }}>
          {isCheckedIn ? (
            <View style={styles.badgeCheckedIn}>
              <Text style={styles.badgeCheckedInText}>CHECKED IN</Text>
            </View>
          ) : (
            <View style={styles.badgeValid}>
              <Text style={styles.badgeValidText}>ADMIT ONE</Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.codeText}>#{ticket.code}</Text>
      </View>

      {/* Body: Event Details & Labeled Meta Rows */}
      <View style={styles.body}>
        <Text style={styles.eventName}>{ticket.event.name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>VENUE</Text>
          <Text style={styles.metaValue}>{ticket.event.venue}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>DATE</Text>
          <Text style={styles.metaValue}>{formattedDate} • {formattedTime}</Text>
        </View>

        {isCheckedIn && checkedInFormatted ? (
          <View style={styles.timestampBox}>
            <Text style={styles.timestampLabel}>ADMISSION STAMP (GATE 1)</Text>
            <Text style={styles.timestampValue}>{checkedInFormatted}</Text>
          </View>
        ) : null}
      </View>

      {/* Perforated Divider (Physical ticket stock metaphor preserved) */}
      <View style={styles.dividerRow}>
        <View style={styles.leftCutout} />
        <View style={styles.dashedLine} />
        <View style={styles.rightCutout} />
      </View>

      {/* QR Code Section (Space-optimized & high contrast) */}
      <View style={styles.qrSection}>
        {/* Wrapper dims when checked in; QR pixels strictly #000000 on #FFFFFF (G1) */}
        <View style={[styles.qrWrapper, isCheckedIn && styles.qrWrapperDim]}>
          <QRCode
            value={ticket.code}
            size={148}
            color={colors.qrBlack}
            backgroundColor={colors.qrWhite}
          />
        </View>
        <Text style={[styles.qrCaption, isCheckedIn && styles.qrCaptionDim]}>
          {isCheckedIn ? "TICKET USED — ENTRY COMPLETED" : "PRESENT AT GATE FOR SCAN"}
        </Text>
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
  cardCheckedIn: {
    borderColor: colors.line,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  badgeValid: {
    backgroundColor: colors.matchaTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.matchaBorder,
  },
  badgeValidText: {
    color: colors.matcha,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
  badgeCheckedIn: {
    backgroundColor: colors.amberTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  badgeCheckedInText: {
    color: colors.amber,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
  codeText: {
    fontFamily: "monospace",
    color: colors.inkSoft,
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  eventName: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
    color: colors.ink,
    marginBottom: spacing.sm,
    letterSpacing: typography.tracking.tight,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.xs,
  },
  metaLabel: {
    width: 55,
    fontSize: typography.size.micro,
    fontWeight: typography.weight.heavy,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  metaValue: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.ink,
  },
  timestampBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.amberTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  timestampLabel: {
    fontSize: typography.size.micro,
    color: colors.amber,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
  timestampValue: {
    fontSize: typography.size.sub,
    fontFamily: "monospace",
    color: colors.ink,
    marginTop: 2,
    fontWeight: typography.weight.bold,
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
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: colors.qrWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  qrWrapperDim: {
    opacity: motion.opacity.dimmed,
  },
  qrCaption: {
    marginTop: spacing.sm,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  qrCaptionDim: {
    opacity: motion.opacity.dimmed,
  },
});
