import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

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
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚠️</Text>
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
    padding: 24,
    backgroundColor: "#0D0E15",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#161824",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#282A3A",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 75, 75, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#9EA2B6",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  codeBadge: {
    backgroundColor: "#202334",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#FF6B6B",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
