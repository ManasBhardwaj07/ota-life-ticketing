import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

interface Props {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
}

export function ErrorView({
  title = "Something went wrong",
  message,
  code,
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Semantic notice pill (No emoji per G3) */}
        <View style={styles.noticePill}>
          <Text style={styles.noticePillText}>ATTENTION</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {code ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>CODE: {code}</Text>
          </View>
        ) : null}

        {onRetry ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
    backgroundColor: colors.paper,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  noticePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.vermillionTint,
    borderWidth: 1,
    borderColor: colors.vermillionBorder,
    marginBottom: spacing.lg,
  },
  noticePillText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    color: colors.vermillion,
    letterSpacing: typography.tracking.caps,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: typography.size.body,
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  codeBadge: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xl,
  },
  codeText: {
    fontSize: typography.size.sub,
    fontFamily: "monospace",
    color: colors.ink,
    fontWeight: typography.weight.semibold,
  },
  retryButton: {
    backgroundColor: colors.vermillion,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
  },
  retryButtonText: {
    color: colors.card,
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
  },
});
