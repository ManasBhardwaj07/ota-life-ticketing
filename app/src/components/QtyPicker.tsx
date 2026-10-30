import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
  value: number;
  onChange: (qty: number) => void;
  max?: number;
  disabled?: boolean;
}

export function QtyPicker({ value, onChange, max = 4, disabled = false }: Props) {
  const effectiveMax = Math.min(4, Math.max(1, max));

  const handleDecrement = () => {
    if (disabled || value <= 1) return;
    onChange(value - 1);
  };

  const handleIncrement = () => {
    if (disabled || value >= effectiveMax) return;
    onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>QUANTITY (MAX {effectiveMax})</Text>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btn, (disabled || value <= 1) && styles.btnDisabled]}
          onPress={handleDecrement}
          disabled={disabled || value <= 1}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, (disabled || value <= 1) && styles.textDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, (disabled || value >= effectiveMax) && styles.btnDisabled]}
          onPress={handleIncrement}
          disabled={disabled || value >= effectiveMax}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, (disabled || value >= effectiveMax) && styles.textDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B728E",
    letterSpacing: 1,
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#26293A",
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#202334",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: "#161824",
    opacity: 0.4,
  },
  btnText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  textDisabled: {
    color: "#4B4E63",
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
  },
  valueText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
