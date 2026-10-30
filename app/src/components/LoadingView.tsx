import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme";

interface Props {
  message?: string;
}

export function LoadingView({ message = "Loading..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.vermillion} />
      <Text style={styles.text}>{message}</Text>
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
  text: {
    marginTop: spacing.lg,
    fontSize: typography.size.bodyLarge,
    fontWeight: typography.weight.medium,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.normal,
  },
});
