import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface Props {
  message?: string;
}

export function LoadingView({ message = "Loading..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF3366" />
      <Text style={styles.text}>{message}</Text>
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
  text: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
    color: "#9EA2B6",
    letterSpacing: 0.3,
  },
});
